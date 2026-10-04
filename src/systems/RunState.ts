// 一局游戏的状态：角色、武器、道具、属性、经验、番茄籽
import { MODIFIER_MAP, makeChallenge, challengeScore, STREAK_REWARDS, type ChallengeDef, type ModifierId } from '../data/challenges';
import { hashSeed, mulberry32, pickOf, shuffleWith, dayNumber, type Rand } from './Rng';
import { EVOLUTION_OF } from '../data/evolutions';
import { treeTotals } from './TalentTree';
import { bump, bumpMax, counter } from './Counters';
import { BASE_STATS, addMods, type Stats, type StatMods } from '../data/stats';
import { CHARACTER_MAP, type CharacterDef } from '../data/characters';
import { WEAPON_MAP, WEAPON_SETS, type WeaponDef } from '../data/weapons';
import { ITEM_MAP, type ItemSpecial } from '../data/items';
import type { StatusApply } from '../data/statuses';
import { CHAPTERS, type ChapterDef } from '../data/chapters';
import { elitePool, bossPool } from '../data/bosses';
import { BALANCE, xpToNext, isBossWaveNo, isEliteWaveNo } from '../data/balance';
import { markSeen, save, persistDisabled, type RunRecord, type SaveData } from './Save';
import { levelGrowthMods } from './Talents';
import { ensureAffixes, type WeaponAffix } from './WeaponMods';
import { dangerLevels, MAX_DANGER, type RuleDelta } from '../data/danger';
import { storage } from '../platform';
import { relicTotals, type RelicTotals } from '../data/relics';
import { AWAKENINGS } from '../data/awakenings';
import { ITEM_COMBOS, type ItemCombo } from '../data/gearExtra';
import { encodeBuild, snapshotRun } from './BuildCode';
import { WEATHER_MAP, type WeatherId } from './Weather';

/** 汇总后的规则：倍率（1 = 不变）与计数 */
export interface RunExt {
  danger: number;
  relics: string[];
  endlessRevived: boolean;
  events: Record<number, string>;
  hardRoute: boolean;
  awakened: boolean;
  pendingRelics?: number;
  merchant?: MerchantOffer | null;
  perfectWaves?: number;
  masteryDmg?: number;
  waveDmg?: Record<number, number>;
  waveSec?: Record<number, number>;
}
/** H2：神秘商人（某次商店随机出现，卖一件交易 / 诅咒遗物） */
export interface MerchantOffer {
  wave: number;
  relic: string;
  price: number;
  done: boolean;
}
/** 其他系统挂到 RunState 的回调（避免循环依赖）：读档后重算遗物规则等 */
export const runHooks: { onLoad: (() => void) | null; onStart: (() => void) | null } = { onLoad: null, onStart: null };

export interface Rules {
  enemyHp: number;
  enemyDmg: number;
  enemySpeed: number;
  spawn: number;
  champ: number;
  eliteHp: number;
  eliteAffix: number;
  bossSkill: number;
  shopPrice: number;
  rerollPrice: number;
  heal: number;
  xp: number;
  income: number;
}

export interface OwnedWeapon {
  uid: number;
  id: string;
  tier: number;
  /** 随机词条（T3 1 条、T4 2 条） */
  affixes?: WeaponAffix[];
  /** 打造等级（仅 T4，0~10） */
  forge?: number;
}

export interface ShopOffer {
  kind: 'weapon' | 'item';
  id: string;
  tier: number; // 武器品质 / 道具稀有度
  price: number;
  locked: boolean;
  sold: boolean;
}

export interface Specials {
  explodeOnKill: { chance: number; dmg: number }[];
  thorns: number;
  revive: number;
  weaponSlot: number;
  burnChance: number;
  shield: number;
  doubleSeed: number;
  interest: number;
  lightningOnHit: number;
  killHeal: number;
  shopDiscount: number;
  rerolls: number;
  onHit: StatusApply[];
  onHitSelf: StatusApply[];
  onKillSelf: StatusApply[];
  onHurtSelf: StatusApply[];
  onHurtEnemy: StatusApply[];
  onDodgeSelf: StatusApply[];
  waveStartSelf: StatusApply[];
  periodicSelf: { every: number; status: StatusApply[] }[];
  aura: { radius: number; every: number; status: StatusApply[] }[];
  sameWeaponBonus: number;
  fruitHeal: number;
  crateMult: number;
  critDmg: number;
  statusDmg: number;
  cleanseEvery: number;
}

let uidSeq = 1;

export class RunState {
  charId = 'tomato';
  chapterId = 1;
  wave = 1;
  level = 0;
  xp = 0;
  seeds = 0;
  hp = 30;
  kills = 0;
  weapons: OwnedWeapon[] = [];
  items: Record<string, number> = {};
  levelMods: StatMods = {};
  pendingLevelUps = 0;
  pendingCrates = 0;
  rerolls = 0;
  shop: ShopOffer[] = [];
  revivesUsed = 0;
  /** 天赋「不屈」本局是否已用 */
  cheatDeathUsed = false;
  /** 本局获得的成就点（结算界面展示） */
  achPoints = 0;
  /** 本局通过达成成就新解锁的角色 id（结算界面展示） */
  newChars: string[] = [];
  /** 加成池：上一波留在地上的番茄籽与经验，本波拾取时双倍返还 */
  bonusSeeds = 0;
  bonusXp = 0;
  harvestBonus = 0; // 收获随波次成长的累计值
  bossId = ''; // 本局 Boss
  /** 无尽模式：不限波数，每 15 波一轮 */
  endless = false;
  /** 本波第几次上架商品（挑战模式的随机序列编号） */
  shopRollNo = 0;
  shopRollWave = -1;
  /** 当前货架是为哪一波生成的；与 wave 不一致说明货架过期（例如读档恢复了上一波已售罄的货架） */
  shopWave = -1;
  /** 每日 / 每周挑战（种子、修饰） */
  challenge: ChallengeDef | null = null;
  /** 番茄危机等级 0–20（挑战模式固定为 0） */
  danger = 0;
  /** 本局持有的遗物 id（C 模块） */
  relics: string[] = [];
  /** 无尽模式本局是否已花钱复活过（B6） */
  endlessRevived = false;
  /** 本局已发生的随机事件波（H1）：波次 → 事件 id */
  events: Record<number, string> = {};
  /** 波间路线（H3）：下一波是否选了「危险路线」 */
  hardRoute = false;
  /** 本局觉醒是否生效（F2，开局时按存档设置决定） */
  awakened = false;
  /** 待选择的遗物三选一次数（C2：精英奖励、无尽里程碑） */
  pendingRelics = 0;
  /** H2：本次商店的神秘商人 */
  merchant: MerchantOffer | null = null;
  /** 本局无伤完成的波次（角色任务用） */
  perfectWaves = 0;
  /** F3：熟练度专属天赋的全伤害 %（开局时由 Progress 写入） */
  masteryDmg = 0;
  /** J1：每波造成的伤害与该波持续秒数（局后 DPS 曲线） */
  waveDmg: Record<number, number> = {};
  waveSec: Record<number, number> = {};
  /** H6：本波天气（不存档，每波开始时由 GameScene 按种子重算） */
  weather: WeatherId = 'clear';
  private relicCache: RelicTotals | null = null;
  /** 当前持有遗物（含已集齐套装）的汇总效果 */
  get relicFx(): RelicTotals {
    return (this.relicCache ??= relicTotals(this.relics));
  }
  saveExt(): RunExt {
    return {
      danger: this.danger,
      relics: this.relics,
      endlessRevived: this.endlessRevived,
      events: this.events,
      hardRoute: this.hardRoute,
      awakened: this.awakened,
      pendingRelics: this.pendingRelics,
      merchant: this.merchant,
      perfectWaves: this.perfectWaves,
      masteryDmg: this.masteryDmg,
      waveDmg: this.waveDmg,
      waveSec: this.waveSec,
    };
  }
  loadExt(e: RunExt | null): void {
    this.danger = e?.danger ?? 0;
    this.relics = [...(e?.relics ?? [])];
    this.endlessRevived = !!e?.endlessRevived;
    this.events = { ...(e?.events ?? {}) };
    this.hardRoute = !!e?.hardRoute;
    this.awakened = !!e?.awakened;
    this.pendingRelics = e?.pendingRelics ?? 0;
    this.merchant = e?.merchant ?? null;
    this.perfectWaves = e?.perfectWaves ?? 0;
    this.masteryDmg = e?.masteryDmg ?? 0;
    this.waveDmg = { ...(e?.waveDmg ?? {}) };
    this.waveSec = { ...(e?.waveSec ?? {}) };
    this.extraRules = {};
    runHooks.onLoad?.();
  }
  /** 其他规则来源（遗物、事件波、无尽变异），key 为来源名，由各系统写入后调用 dirty() */
  extraRules: Record<string, RuleDelta> = {};
  private rulesCache: Rules | null = null;
  /** 汇总后的规则倍率（危机等级 + 遗物 + 事件 + 变异） */
  get rules(): Rules {
    if (this.rulesCache) return this.rulesCache;
    const sum: Required<RuleDelta> = {
      enemyHp: 0,
      enemyDmg: 0,
      enemySpeed: 0,
      spawn: 0,
      champ: 0,
      eliteHp: 0,
      eliteAffix: 0,
      bossSkill: 0,
      shopPrice: 0,
      rerollPrice: 0,
      heal: 0,
      xp: 0,
      income: 0,
    };
    const add = (d: RuleDelta) => {
      for (const [k, v] of Object.entries(d) as [keyof RuleDelta, number][]) sum[k] += v;
    };
    for (const l of dangerLevels(this.danger)) add(l.rule);
    add(this.relicFx.rule);
    for (const d of Object.values(this.extraRules)) add(d);
    const m = (v: number) => Math.max(0, 1 + v / 100);
    this.rulesCache = {
      enemyHp: m(sum.enemyHp),
      enemyDmg: m(sum.enemyDmg),
      enemySpeed: m(sum.enemySpeed),
      spawn: m(sum.spawn),
      champ: m(sum.champ),
      eliteHp: m(sum.eliteHp),
      eliteAffix: sum.eliteAffix,
      bossSkill: sum.bossSkill,
      shopPrice: m(sum.shopPrice),
      rerollPrice: m(sum.rerollPrice),
      heal: m(sum.heal),
      xp: m(sum.xp),
      income: m(sum.income),
    };
    return this.rulesCache;
  }
  /** 是否启用了某个挑战修饰 */
  mod(id: ModifierId): boolean {
    return !!this.challenge?.modifiers.includes(id);
  }
  /** 随机源：挑战模式按「种子 + 用途」生成固定序列，否则用 Math.random */
  rand(stream: string): Rand {
    return this.challenge ? mulberry32(hashSeed(`${this.challenge.seed}:${stream}`)) : Math.random;
  }
  /** 开始一局挑战 */
  startChallenge(c: ChallengeDef): void {
    this.start(c.charId, c.chapterId, c.endless, 0);
    // 挑战模式人人公平：撤销熟练度开局奖励与觉醒
    this.items = {};
    this.seeds = treeTotals().startSeeds;
    this.masteryDmg = 0;
    this.awakened = false;
    this.challenge = c;
    // J4：自定义挑战不计成就——记下成就相关统计，局后（或放弃时）还原
    freeSnapshot =
      c.kind === 'free'
        ? JSON.stringify({ counters: save.counters, stats: save.stats, kills: save.totalKills, bosses: save.killedBosses })
        : null;
    const r = this.rand('setup');
    const ep = shuffleWith([...elitePool(c.chapterId)], r);
    this.eliteIds = [ep[0].id, ep[1].id];
    this.bossId = pickOf(bossPool(c.chapterId), r).id;
    if (this.mod('rich_start')) this.seeds += 150;
    this.dirty();
    this.hp = this.stats.maxHp;
  }
  /** 调试：每波各来源番茄籽收入 */
  income: Record<number, Record<string, number>> = {};
  /** 局后统计：各来源造成的伤害（武器 id / skill / dot / explosion / knives / other） */
  dmgBy: Record<string, number> = {};
  /** 本局开始时间（用于战绩里的用时） */
  startedAt = 0;
  earn(v: number, src: string): void {
    // 危机等级「歉收」等规则：只影响拾取与收获（随机取整，小额掉落也按比例生效）
    if (v > 0 && (src === 'pickup' || src === 'harvest') && this.rules.income !== 1) {
      const x = v * this.rules.income;
      v = Math.floor(x) + (Math.random() < x - Math.floor(x) ? 1 : 0);
    }
    this.seeds += v;
    if (v > 0) save.stats.seedsEarned += v;
    const w = (this.income[this.wave] ??= {});
    w[src] = (w[src] ?? 0) + v;
  }
  eliteIds: string[] = []; // 本局第 5 / 10 波精英
  private cache: Stats | null = null;
  private specialCache: Specials | null = null;

  get char(): CharacterDef {
    return CHARACTER_MAP[this.charId];
  }
  get chapter(): ChapterDef {
    return CHAPTERS[this.chapterId - 1];
  }

  start(charId: string, chapterId: number, endless = false, danger = this.danger): void {
    this.endless = endless;
    this.challenge = null;
    this.danger = Math.max(0, Math.min(MAX_DANGER, danger));
    this.extraRules = {};
    this.relics = [];
    this.pendingRelics = 0;
    this.merchant = null;
    this.perfectWaves = 0;
    this.masteryDmg = 0;
    this.awakened = false;
    this.endlessRevived = false;
    this.events = {};
    this.hardRoute = false;
    this.shopRollWave = -1;
    this.achPoints = 0;
    this.newChars = [];
    this.bonusSeeds = 0;
    this.bonusXp = 0;
    this.charId = charId;
    this.chapterId = chapterId;
    this.wave = 1;
    this.level = 0;
    this.xp = 0;
    this.seeds = 0;
    this.kills = 0;
    this.income = {};
    this.dmgBy = {};
    this.waveDmg = {};
    this.waveSec = {};
    this.startedAt = Date.now();
    this.items = {};
    this.levelMods = {};
    this.pendingLevelUps = 0;
    this.pendingCrates = 0;
    this.rerolls = 0;
    this.shop = [];
    this.shopWave = -1;
    this.revivesUsed = 0;
    this.cheatDeathUsed = false;
    this.harvestBonus = 0;
    // 每局随机抽取精英与 Boss
    const ep = [...elitePool(chapterId)].sort(() => Math.random() - 0.5);
    this.eliteIds = [ep[0].id, ep[1].id];
    const bp = bossPool(chapterId);
    this.bossId = bp[Math.floor(Math.random() * bp.length)].id;
    this.weapons = this.char.startWeapons.map((id) => ({ uid: uidSeq++, id, tier: 0 }));
    for (const id of this.char.startWeapons) markSeen('weapons', id);
    this.seeds = treeTotals().startSeeds;
    runHooks.onStart?.();
    this.dirty();
    this.hp = this.stats.maxHp;
  }

  dirty(): void {
    this.cache = null;
    this.specialCache = null;
    this.rulesCache = null;
    this.relicCache = null;
  }

  get stats(): Stats {
    if (this.cache) return this.cache;
    const s: Stats = { ...BASE_STATS };
    addMods(s, this.char.mods);
    addMods(s, treeTotals().mods);
    addMods(s, this.levelMods);
    s.harvest += this.harvestBonus;
    for (const [id, n] of Object.entries(this.items)) addMods(s, ITEM_MAP[id].mods, n);
    for (const [tag, cnt] of Object.entries(this.setCounts())) {
      const set = WEAPON_SETS[tag];
      if (!set) continue;
      let best: number | null = null;
      for (const k of Object.keys(set.bonus).map(Number)) if (cnt >= k && (best === null || k > best)) best = k;
      if (best !== null) addMods(s, set.bonus[best] as StatMods);
    }
    // 挑战修饰
    if (this.challenge) {
      for (const m of this.challenge.modifiers) if (MODIFIER_MAP[m].mods) addMods(s, MODIFIER_MAP[m].mods as StatMods);
      if (this.mod('glass_cannon')) s.maxHp *= 0.6;
      if (this.mod('vampire')) s.regen = Math.min(0, s.regen);
    }
    // G7 道具组合：同时持有两件道具时额外加成（不随叠加数倍增）
    for (const c of this.activeCombos()) addMods(s, c.bonus);
    // H6 天气
    addMods(s, WEATHER_MAP[this.weather].mods);
    // F2 觉醒 / F3 熟练度专属天赋
    if (this.awakened && AWAKENINGS[this.charId]?.mods) addMods(s, AWAKENINGS[this.charId].mods!);
    s.damage += this.masteryDmg;
    // 遗物：属性与规则型效果（归零只清掉正值，负面效果保留）
    const rf = this.relicFx;
    for (const m of rf.mods) addMods(s, m);
    if (rf.flags.noRegen) s.regen = Math.min(0, s.regen);
    if (rf.flags.noLifeSteal) s.lifeSteal = Math.min(0, s.lifeSteal);
    if (rf.flags.noDodge) s.dodge = Math.min(0, s.dodge);
    if (rf.flags.noArmor) s.armor = Math.min(0, s.armor);
    s.maxHp *= rf.flags.maxHpMult;
    s.maxHp = Math.max(1, Math.round(s.maxHp));
    this.cache = s;
    return s;
  }

  get specials(): Specials {
    if (this.specialCache) return this.specialCache;
    const sp: Specials = {
      explodeOnKill: [],
      thorns: 0,
      revive: 0,
      weaponSlot: 0,
      burnChance: 0,
      shield: 0,
      doubleSeed: 0,
      interest: 0,
      lightningOnHit: 0,
      killHeal: 0,
      shopDiscount: this.char.shopDiscount ?? 0,
      rerolls: 0,
      onHit: [],
      onHitSelf: [],
      onKillSelf: [],
      onHurtSelf: [],
      onHurtEnemy: [],
      onDodgeSelf: [],
      waveStartSelf: [],
      periodicSelf: [],
      aura: [],
      sameWeaponBonus: 0,
      fruitHeal: 0,
      crateMult: 1,
      critDmg: 0,
      statusDmg: 0,
      cleanseEvery: 0,
    };
    const apply = (x: ItemSpecial | undefined, n: number) => {
      if (!x) return;
      if (x.explodeOnKill) for (let i = 0; i < n; i++) sp.explodeOnKill.push(x.explodeOnKill);
      sp.thorns += (x.thorns ?? 0) * n;
      sp.revive += (x.revive ?? 0) * n;
      sp.weaponSlot += (x.weaponSlot ?? 0) * n;
      sp.burnChance += (x.burnChance ?? 0) * n;
      if (x.shield) sp.shield = sp.shield ? Math.min(sp.shield, x.shield) : x.shield;
      sp.doubleSeed += (x.doubleSeed ?? 0) * n;
      sp.interest += (x.interest ?? 0) * n;
      sp.lightningOnHit += (x.lightningOnHit ?? 0) * n;
      if (x.killHeal) sp.killHeal = sp.killHeal ? Math.min(sp.killHeal, x.killHeal) : x.killHeal;
      sp.shopDiscount += (x.shopDiscount ?? 0) * n;
      sp.rerolls += (x.rerolls ?? 0) * n;
      for (let i = 0; i < n; i++) {
        if (x.onHit) sp.onHit.push(...x.onHit);
        if (x.onHitSelf) sp.onHitSelf.push(...x.onHitSelf);
        if (x.onKillSelf) sp.onKillSelf.push(...x.onKillSelf);
        if (x.onHurtSelf) sp.onHurtSelf.push(...x.onHurtSelf);
        if (x.onHurtEnemy) sp.onHurtEnemy.push(...x.onHurtEnemy);
        if (x.onDodgeSelf) sp.onDodgeSelf.push(...x.onDodgeSelf);
        if (x.waveStartSelf) sp.waveStartSelf.push(...x.waveStartSelf);
        if (x.periodicSelf) sp.periodicSelf.push(x.periodicSelf);
        if (x.aura) sp.aura.push(x.aura);
      }
      sp.sameWeaponBonus += (x.sameWeaponBonus ?? 0) * n;
      sp.fruitHeal += (x.fruitHeal ?? 0) * n;
      if (x.crateMult) sp.crateMult *= Math.pow(x.crateMult, n);
      sp.critDmg += (x.critDmg ?? 0) * n;
      sp.statusDmg += (x.statusDmg ?? 0) * n;
      if (x.cleanseEvery) sp.cleanseEvery = sp.cleanseEvery ? Math.min(sp.cleanseEvery, x.cleanseEvery) : x.cleanseEvery;
    };
    apply(this.char.special, 1);
    for (const [x, r] of treeTotals().specials) apply(x, r);
    for (const [id, n] of Object.entries(this.items)) apply(ITEM_MAP[id].special, n);
    for (const x of this.relicFx.specials) apply(x, 1);
    for (const c of this.activeCombos()) apply(c.special, 1);
    if (this.awakened) apply(AWAKENINGS[this.charId]?.special, 1);
    sp.shopDiscount = Math.min(50, sp.shopDiscount);
    sp.doubleSeed = Math.min(40, sp.doubleSeed);
    sp.critDmg = Math.min(BALANCE.critDmgCap, sp.critDmg);
    sp.lightningOnHit = Math.min(BALANCE.lightningCap, sp.lightningOnHit);
    this.specialCache = sp;
    return sp;
  }

  /** 当前生效的道具组合（G7） */
  activeCombos(): ItemCombo[] {
    return ITEM_COMBOS.filter((c) => (this.items[c.item] ?? 0) > 0 && (this.items[c.needs] ?? 0) > 0);
  }

  get maxWeapons(): number {
    return (this.char.maxWeapons ?? BALANCE.player.maxWeapons) + this.specials.weaponSlot;
  }

  get dodgeCap(): number {
    return this.char.dodgeCap ?? BALANCE.player.dodgeCap;
  }

  setCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    const seen = new Set<string>();
    for (const w of this.weapons) {
      if (seen.has(w.id)) continue; // 同名武器只计一次
      seen.add(w.id);
      for (const t of WEAPON_MAP[w.id].tags) counts[t] = (counts[t] ?? 0) + 1;
    }
    return counts;
  }

  weaponDef(w: OwnedWeapon): WeaponDef {
    return WEAPON_MAP[w.id];
  }

  addXp(amount: number): void {
    this.xp += amount * (1 + this.stats.xpGain / 100) * this.rules.xp;
    while (this.xp >= xpToNext(this.level)) {
      this.xp -= xpToNext(this.level);
      this.level++;
      this.pendingLevelUps++;
      this.levelMods.maxHp = (this.levelMods.maxHp ?? 0) + 1;
      const growth = levelGrowthMods(this.charId);
      if (growth)
        for (const [k, v] of Object.entries(growth) as [keyof StatMods, number][]) this.levelMods[k] = (this.levelMods[k] ?? 0) + v;
      this.dirty();
      this.hp += 1;
    }
  }

  addItem(id: string): void {
    markSeen('items', id);
    const before = this.stats.maxHp;
    this.items[id] = (this.items[id] ?? 0) + 1;
    this.dirty();
    const diff = this.stats.maxHp - before;
    if (diff > 0) this.hp += diff;
    this.hp = Math.min(this.hp, this.stats.maxHp);
  }

  addLevelMod(mods: StatMods): void {
    const before = this.stats.maxHp;
    for (const [k, v] of Object.entries(mods) as [keyof Stats, number][]) this.levelMods[k] = (this.levelMods[k] ?? 0) + v;
    this.dirty();
    const diff = this.stats.maxHp - before;
    if (diff > 0) this.hp += diff;
  }

  /** 尝试加入武器：栏位满时若能合成则自动合成 */
  canAddWeapon(id: string, tier: number): boolean {
    if (this.weapons.length < this.maxWeapons) return true;
    return tier < 3 && this.weapons.some((w) => w.id === id && w.tier === tier);
  }

  addWeapon(id: string, tier: number): void {
    markSeen('weapons', id);
    if (this.weapons.length >= this.maxWeapons) {
      const same = this.weapons.find((w) => w.id === id && w.tier === tier && tier < 3);
      if (same) {
        same.tier++;
        if (same.tier === 3) bump(`t4:${id}`);
        ensureAffixes(same, this.stats.luck);
        this.dirty();
        return;
      }
      return;
    }
    const w: OwnedWeapon = { uid: uidSeq++, id, tier };
    ensureAffixes(w, this.stats.luck);
    this.weapons.push(w);
    bump(`weaponGot:${id}`);
    if (tier === 3) bump(`t4:${id}`);
    this.dirty();
  }

  /** 合成：两把同名同品质 -> 品质 +1 */
  combine(uid: number): boolean {
    const w = this.weapons.find((x) => x.uid === uid);
    if (!w || w.tier >= 3) return false;
    const other = this.weapons.find((x) => x.uid !== uid && x.id === w.id && x.tier === w.tier);
    if (!other) return false;
    this.weapons = this.weapons.filter((x) => x.uid !== other.uid);
    w.tier++;
    ensureAffixes(w, this.stats.luck);
    if (w.tier === 3) {
      save.stats.t4Crafted++;
      bump(`t4:${w.id}`);
    }
    this.dirty();
    return true;
  }

  /** 可进化：T4 + 持有对应道具 */
  canEvolve(w: OwnedWeapon): boolean {
    const e = EVOLUTION_OF[w.id];
    const minTier = this.relicFx.flags.evolveEarly.includes(w.id) ? 2 : 3;
    return !!e && w.tier >= minTier && (this.items[e.item] ?? 0) > 0;
  }

  /** 进化：原地替换武器 id，保留词条与打造等级 */
  evolve(uid: number): boolean {
    const w = this.weapons.find((x) => x.uid === uid);
    if (!w || !this.canEvolve(w)) return false;
    const to = EVOLUTION_OF[w.id].to.id;
    w.id = to;
    markSeen('weapons', to);
    bump('evolutions');
    bump(`evolve:${to}`);
    this.dirty();
    return true;
  }

  removeWeapon(uid: number): void {
    this.weapons = this.weapons.filter((x) => x.uid !== uid);
    this.dirty();
  }

  /** 每波商店刷新次数上限：默认 3，道具可增加，最多 10 */
  get maxRerolls(): number {
    if (this.mod('one_reroll')) return 1;
    return Math.min(10, 3 + this.specials.rerolls);
  }

  isBossWave(): boolean {
    return this.endless ? isBossWaveNo(this.wave) : this.wave === BALANCE.waves.bossWave;
  }
  isEliteWave(): boolean {
    return this.endless ? isEliteWaveNo(this.wave) : BALANCE.waves.eliteWaves.includes(this.wave);
  }
  /** 本波精英：第一轮用开局抽好的两名，无尽模式之后每次重新抽 */
  eliteForWave(): string {
    if (this.wave <= BALANCE.waves.count) return this.eliteIds[this.wave === BALANCE.waves.eliteWaves[0] ? 0 : 1];
    const pool = elitePool(this.chapterId);
    return pool[Math.floor(Math.random() * pool.length)].id;
  }
  /** 本波 Boss：第一轮用开局抽好的，无尽模式第 30 波起从全部章节的 Boss 里抽 */
  bossForWave(): string {
    if (this.wave <= BALANCE.waves.count) return this.bossId;
    const pool = this.wave >= 30 ? CHAPTERS.flatMap((c) => bossPool(c.id)) : bossPool(this.chapterId);
    return pool[Math.floor(Math.random() * pool.length)].id;
  }
}

const RUN_KEY = 'tomato_sister_run_v1';

/** 局内存档：每波结束时保存，刷新页面后可继续 */
/** 保存对局；phase = 'wave' 表示保存于某一波开始时（继续游戏将直接从该波开始） */
export function saveRun(phase: 'shop' | 'wave' = 'shop'): void {
  if (persistDisabled()) return;
  try {
    const d = {
      v: 1,
      phase,
      charId: run.charId,
      chapterId: run.chapterId,
      wave: run.wave,
      level: run.level,
      xp: run.xp,
      seeds: run.seeds,
      kills: run.kills,
      weapons: run.weapons,
      items: run.items,
      levelMods: run.levelMods,
      pendingLevelUps: run.pendingLevelUps,
      pendingCrates: run.pendingCrates,
      shop: run.shop,
      shopWave: run.shopWave,
      revivesUsed: run.revivesUsed,
      cheatDeathUsed: run.cheatDeathUsed,
      harvestBonus: run.harvestBonus,
      bonusSeeds: run.bonusSeeds,
      bonusXp: run.bonusXp,
      bossId: run.bossId,
      eliteIds: run.eliteIds,
      endless: run.endless,
      challenge: run.challenge ? { kind: run.challenge.kind, key: run.challenge.key } : null,
      dmgBy: run.dmgBy,
      income: run.income,
      startedAt: run.startedAt,
      // 1.4.0：危机等级、遗物、无尽复活等
      ext: run.saveExt(),
      savedAt: Date.now(),
    };
    storage.setItem(RUN_KEY, JSON.stringify(d));
  } catch {
    /* 忽略 */
  }
}

export function hasSavedRun(): { charId: string; chapterId: number; wave: number; phase?: 'shop' | 'wave'; endless?: boolean } | null {
  try {
    const raw = storage.getItem(RUN_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d.v === 1 && CHARACTER_MAP[d.charId] ? d : null;
  } catch {
    return null;
  }
}

/** 读取存档；成功返回 true */
export function loadRun(): boolean {
  const d = hasSavedRun() as (ReturnType<typeof hasSavedRun> & Record<string, unknown>) | null;
  if (!d) return false;
  Object.assign(run, {
    charId: d.charId,
    chapterId: d.chapterId,
    wave: d.wave,
    level: d.level,
    xp: d.xp,
    seeds: d.seeds,
    kills: d.kills,
    weapons: d.weapons,
    items: d.items,
    levelMods: d.levelMods,
    pendingLevelUps: d.pendingLevelUps,
    pendingCrates: d.pendingCrates,
    shop: d.shop,
    shopWave: typeof d.shopWave === 'number' ? d.shopWave : -1, // 旧存档没有该字段，视为过期
    revivesUsed: d.revivesUsed,
    cheatDeathUsed: !!d.cheatDeathUsed,
    harvestBonus: d.harvestBonus,
    bonusSeeds: d.bonusSeeds ?? 0,
    bonusXp: d.bonusXp ?? 0,
    bossId: d.bossId,
    eliteIds: d.eliteIds,
    endless: !!d.endless,
    challenge: d.challenge ? makeChallenge((d.challenge as ChallengeDef).kind, (d.challenge as ChallengeDef).key) : null,
    rerolls: 0,
    income: d.income ?? {},
    dmgBy: d.dmgBy ?? {},
    startedAt: d.startedAt ?? Date.now(),
  });
  run.loadExt((d.ext as RunExt | undefined) ?? null);
  run.dirty();
  run.hp = run.stats.maxHp;
  return true;
}

/** D3：最近一次结算拿到的连续挑战奖励（结算界面展示后清空） */
export let streakReward: { days: number; gold: number; tp: number } | null = null;
export const takeStreakReward = () => {
  const r = streakReward;
  streakReward = null;
  return r;
};

/** 把本局写入战绩（结算时调用一次） */
export function recordHistory(win: boolean): RunRecord {
  const income: number[] = [];
  for (let w = 1; w <= run.wave; w++) income.push(Math.round(Object.values(run.income[w] ?? {}).reduce((a, b) => a + Math.max(0, b), 0)));
  const rec: RunRecord = {
    t: Date.now(),
    charId: run.charId,
    chapterId: run.chapterId,
    endless: run.endless,
    win,
    wave: run.wave,
    level: run.level,
    kills: run.kills,
    sec: Math.round((Date.now() - run.startedAt) / 1000),
    danger: run.danger || undefined,
    relics: run.relics.length ? [...run.relics] : undefined,
    revived: run.endlessRevived || undefined,
    weapons: run.weapons.map((w) => ({ id: w.id, tier: w.tier, forge: w.forge })),
    items: Object.values(run.items).reduce((a, b) => a + b, 0),
    dmg: Object.entries(run.dmgBy)
      .map(([k, v]) => [k, Math.round(v)] as [string, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10),
    income,
    dps: Array.from({ length: run.wave }, (_, i) => Math.round((run.waveDmg[i + 1] ?? 0) / Math.max(1, run.waveSec[i + 1] ?? 1))),
  };
  if (run.challenge) {
    const c = run.challenge;
    const score = challengeScore(c.kind, { win, wave: run.wave, kills: run.kills, level: run.level, sec: rec.sec });
    rec.challenge = { kind: c.kind, key: c.key, score };
    const k = `${c.kind}:${c.key}`;
    const prev = save.challenges[k] ?? { best: 0, bestWave: 0, attempts: 0, won: false };
    save.challenges[k] = {
      best: Math.max(prev.best, score),
      bestWave: Math.max(prev.bestWave, run.wave),
      attempts: prev.attempts + 1,
      won: prev.won || win,
    };
    // 挑战成就计数：次数、通关、每周最佳波次、每日连续天数
    bump(`${c.kind}Runs`);
    if (win) bump(`${c.kind}Wins`);
    if (c.kind === 'weekly') bumpMax('weeklyBest', run.wave);
    if (c.kind === 'daily') {
      const dn = dayNumber();
      const last = counter('dailyLastDay');
      const streak = last === dn ? counter('dailyStreak') : last === dn - 1 ? counter('dailyStreak') + 1 : 1;
      save.counters.dailyStreak = streak;
      save.counters.dailyLastDay = dn;
      bumpMax('dailyStreakBest', streak);
      // D3：本轮连续天数达到 3 / 7 / 30 天各领一次奖励（断签后重新计）
      const st = save.meta.streak;
      if (streak === 1) st.claimed = [];
      st.days = streak;
      st.best = Math.max(st.best, streak);
      st.last = c.key;
      for (const r of STREAK_REWARDS)
        if (streak >= r.days && !st.claimed.includes(r.days)) {
          st.claimed.push(r.days);
          save.meta.gold += r.gold;
          save.meta.goldEarned += r.gold;
          save.meta.bonusTp += r.tp;
          bump('goldEarned', r.gold);
          streakReward = r;
        }
    }
  }
  rec.build = encodeBuild(snapshotRun(run));
  restoreFreeSnapshot();
  save.history.unshift(rec);
  save.history.length = Math.min(save.history.length, 30);
  return rec;
}

let freeSnapshot: string | null = null;
/** J4：自定义挑战进行中（成就检查暂停） */
export const freeChallengeActive = (): boolean => freeSnapshot !== null;
/** J4：还原自定义挑战开始前的成就统计 */
export function restoreFreeSnapshot(): void {
  if (!freeSnapshot) return;
  const d = JSON.parse(freeSnapshot) as {
    counters: SaveData['counters'];
    stats: SaveData['stats'];
    kills: number;
    bosses: SaveData['killedBosses'];
  };
  save.counters = d.counters;
  save.stats = d.stats;
  save.totalKills = d.kills;
  save.killedBosses = d.bosses;
  freeSnapshot = null;
}

export function clearRun(): void {
  try {
    storage.removeItem(RUN_KEY);
  } catch {
    /* 忽略 */
  }
}

export const run = new RunState();

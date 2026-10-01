// 一局游戏的状态：角色、武器、道具、属性、经验、番茄籽
import { bump } from './Counters';
import { BASE_STATS, addMods, type Stats, type StatMods } from '../data/stats';
import { CHARACTER_MAP, type CharacterDef } from '../data/characters';
import { WEAPON_MAP, WEAPON_SETS, type WeaponDef } from '../data/weapons';
import { ITEM_MAP, type ItemSpecial } from '../data/items';
import type { StatusApply } from '../data/statuses';
import { CHAPTERS, type ChapterDef } from '../data/chapters';
import { elitePool, bossPool } from '../data/bosses';
import { BALANCE, xpToNext } from '../data/balance';
import { markSeen, save } from './Save';
import { levelGrowthMods } from './Talents';
import { ensureAffixes, type WeaponAffix } from './WeaponMods';

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
  /** 本局获得的成就点（结算界面展示） */
  achPoints = 0;
  /** 加成池：上一波留在地上的番茄籽与经验，本波拾取时双倍返还 */
  bonusSeeds = 0;
  bonusXp = 0;
  harvestBonus = 0; // 收获随波次成长的累计值
  bossId = ''; // 本局 Boss
  /** 调试：每波各来源番茄籽收入 */
  income: Record<number, Record<string, number>> = {};
  earn(v: number, src: string): void {
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

  start(charId: string, chapterId: number): void {
    this.achPoints = 0;
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
    this.items = {};
    this.levelMods = {};
    this.pendingLevelUps = 0;
    this.pendingCrates = 0;
    this.rerolls = 0;
    this.shop = [];
    this.revivesUsed = 0;
    this.harvestBonus = 0;
    // 每局随机抽取精英与 Boss
    const ep = [...elitePool(chapterId)].sort(() => Math.random() - 0.5);
    this.eliteIds = [ep[0].id, ep[1].id];
    const bp = bossPool(chapterId);
    this.bossId = bp[Math.floor(Math.random() * bp.length)].id;
    this.weapons = this.char.startWeapons.map((id) => ({ uid: uidSeq++, id, tier: 0 }));
    for (const id of this.char.startWeapons) markSeen('weapons', id);
    this.dirty();
    this.hp = this.stats.maxHp;
  }

  dirty(): void {
    this.cache = null;
    this.specialCache = null;
  }

  get stats(): Stats {
    if (this.cache) return this.cache;
    const s: Stats = { ...BASE_STATS };
    addMods(s, this.char.mods);
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
    for (const [id, n] of Object.entries(this.items)) apply(ITEM_MAP[id].special, n);
    sp.shopDiscount = Math.min(50, sp.shopDiscount);
    sp.doubleSeed = Math.min(40, sp.doubleSeed);
    sp.critDmg = Math.min(150, sp.critDmg);
    this.specialCache = sp;
    return sp;
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
    this.xp += amount * (1 + this.stats.xpGain / 100);
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

  removeWeapon(uid: number): void {
    this.weapons = this.weapons.filter((x) => x.uid !== uid);
    this.dirty();
  }

  /** 每波商店刷新次数上限：默认 3，道具可增加，最多 10 */
  get maxRerolls(): number {
    return Math.min(10, 3 + this.specials.rerolls);
  }

  isBossWave(): boolean {
    return this.wave === BALANCE.waves.bossWave;
  }
  isEliteWave(): boolean {
    return BALANCE.waves.eliteWaves.includes(this.wave);
  }
}

const RUN_KEY = 'tomato_sister_run_v1';

/** 局内存档：每波结束时保存，刷新页面后可继续 */
/** 保存对局；phase = 'wave' 表示保存于某一波开始时（继续游戏将直接从该波开始） */
export function saveRun(phase: 'shop' | 'wave' = 'shop'): void {
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
      revivesUsed: run.revivesUsed,
      harvestBonus: run.harvestBonus,
      bonusSeeds: run.bonusSeeds,
      bonusXp: run.bonusXp,
      bossId: run.bossId,
      eliteIds: run.eliteIds,
      savedAt: Date.now(),
    };
    localStorage.setItem(RUN_KEY, JSON.stringify(d));
  } catch {
    /* 忽略 */
  }
}

export function hasSavedRun(): { charId: string; chapterId: number; wave: number; phase?: 'shop' | 'wave' } | null {
  try {
    const raw = localStorage.getItem(RUN_KEY);
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
    revivesUsed: d.revivesUsed,
    harvestBonus: d.harvestBonus,
    bonusSeeds: d.bonusSeeds ?? 0,
    bonusXp: d.bonusXp ?? 0,
    bossId: d.bossId,
    eliteIds: d.eliteIds,
    rerolls: 0,
    income: {},
  });
  run.dirty();
  run.hp = run.stats.maxHp;
  return true;
}

export function clearRun(): void {
  try {
    localStorage.removeItem(RUN_KEY);
  } catch {
    /* 忽略 */
  }
}

export const run = new RunState();

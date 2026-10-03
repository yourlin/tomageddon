// 开发者构筑：把「角色 + 关卡波次 + 等级 + 资金 + 购买记录」描述成可保存 / 可复现的状态，并写入全局 run。
// 商店操作直接复用 RunState 的 addWeapon / addItem / combine / evolve，价格复用 ShopScene 的 offerPrice，
// 保证模拟出来的状态与真实一局在同样的花费下能达到的状态一致。
import { run, type OwnedWeapon } from '../systems/RunState';
import { CHARACTER_MAP } from '../data/characters';
import { WEAPON_MAP, WEAPONS, TIER_PRICE_MULT } from '../data/weapons';
import { ALL_ITEMS, ITEM_MAP, LEVELUP_OPTIONS, type ItemDef } from '../data/items';
import { EVOLUTIONS } from '../data/evolutions';
import { TALENT_NODES } from '../data/talentTree';
import type { StatKey, StatMods } from '../data/stats';
import { BALANCE, incomeTarget, pickRarity, pickWeaponTier, rerollPrice, sellPrice } from '../data/balance';
import { save } from '../systems/Save';
import { setTalents, treeTotals } from '../systems/TalentTree';
import { levelGrowthMods, waveGrowthMods, freeFirstReroll } from '../systems/Talents';
import { forgeCost, forgeChance, canForge, type WeaponAffix } from '../systems/WeaponMods';
import { offerPrice, itemBasePrice } from '../scenes/ShopScene';
import { pickOf, shuffleWith } from '../systems/Rng';

export interface DevWeapon {
  id: string;
  tier: number;
  affixes?: WeaponAffix[];
  forge?: number;
}
export interface LevelPick {
  key: StatKey;
  rarity: number;
}
export interface LedgerEntry {
  label: string;
  /** 正数为支出，负数为收入（出售） */
  cost: number;
  /** 操作前的武器与道具（撤销用） */
  snap: string;
}
export type TalentMode = 'save' | 'none' | 'max' | 'custom';

export interface DevBuild {
  charId: string;
  chapterId: number;
  /** 正在打的波次（商店价格按「打完第 wave-1 波后的商店」计算） */
  wave: number;
  level: number;
  /** 初始资金（番茄籽） */
  budget: number;
  talents: TalentMode;
  /** talents = 'custom' 时的天赋树节点等级 */
  talentMap?: Record<string, number>;
  weapons: DevWeapon[];
  items: Record<string, number>;
  levelPicks: LevelPick[];
  /** 开发者直接追加的属性（不计入花费） */
  extraMods: StatMods;
  ledger: LedgerEntry[];
  /** 允许超出预算购买 */
  ignoreBudget: boolean;
}

export function newBuild(charId = 'tomato'): DevBuild {
  return {
    charId,
    chapterId: 1,
    wave: 1,
    level: 0,
    budget: 0,
    talents: 'save',
    weapons: CHARACTER_MAP[charId].startWeapons.map((id) => ({ id, tier: 0 })),
    items: {},
    levelPicks: [],
    extraMods: {},
    ledger: [],
    ignoreBudget: false,
  };
}

/** 修复旧版 / 外部导入的构筑数据（缺字段、无效 id） */
export function sanitize(b: Partial<DevBuild>): DevBuild {
  const d = newBuild(b.charId && CHARACTER_MAP[b.charId] ? b.charId : 'tomato');
  const out: DevBuild = { ...d, ...b, charId: d.charId } as DevBuild;
  out.weapons = (out.weapons ?? []).filter((w) => WEAPON_MAP[w.id]);
  out.items = Object.fromEntries(Object.entries(out.items ?? {}).filter(([id, n]) => ITEM_MAP[id] && n > 0));
  out.levelPicks = (out.levelPicks ?? []).filter((p) => LEVELUP_OPTIONS.some((o) => o.key === p.key));
  out.ledger = out.ledger ?? [];
  out.extraMods = out.extraMods ?? {};
  return out;
}

export const spent = (b: DevBuild): number => b.ledger.reduce((a, e) => a + e.cost, 0);
export const money = (b: DevBuild): number => b.budget - spent(b);

// ---------------- 天赋 ----------------
/** 进入开发者界面时的存档天赋（切换到「无 / 满」后还能切回来） */
const SAVED_TALENTS: Record<string, number> = { ...save.talents };
let talentMode: string | null = null;
function applyTalents(mode: TalentMode, map?: Record<string, number>): void {
  const key = mode === 'custom' ? 'custom:' + JSON.stringify(map ?? {}) : mode;
  if (talentMode === key) return;
  talentMode = key;
  // persist 已被禁用，这里只改内存
  if (mode === 'save') setTalents(SAVED_TALENTS);
  else if (mode === 'none') setTalents({});
  else if (mode === 'custom') setTalents({ ...(map ?? {}) });
  else setTalents(Object.fromEntries(TALENT_NODES.map((n) => [n.id, n.max])));
}
/** 存档天赋（C7 自定义天赋的起点） */
export const savedTalents = (): Record<string, number> => ({ ...SAVED_TALENTS });

// ---------------- 写入 run ----------------
let uid = 900000;
const toOwned = (w: DevWeapon): OwnedWeapon => ({
  uid: uid++,
  id: w.id,
  tier: w.tier,
  affixes: w.affixes?.map((a) => ({ ...a })),
  forge: w.forge,
});
const fromOwned = (w: OwnedWeapon): DevWeapon => ({ id: w.id, tier: w.tier, affixes: w.affixes?.map((a) => ({ ...a })), forge: w.forge });

/** 把构筑写进全局 run（随后重启沙盒即可生效）。trial 不为空时用它替换武器（单独试用某把武器） */
export function applyBuild(b: DevBuild, trial: DevWeapon[] | null = null): void {
  applyTalents(b.talents, b.talentMap);
  run.start(b.charId, b.chapterId);
  run.wave = b.wave;
  run.weapons = (trial ?? b.weapons).map(toOwned);
  run.items = { ...b.items };
  run.level = b.level;
  const lm: StatMods = {};
  // 每级 +1 最大生命（RunState.addXp）与角色升级成长
  const growth = levelGrowthMods(b.charId);
  for (let i = 0; i < b.level; i++) {
    lm.maxHp = (lm.maxHp ?? 0) + 1;
    if (growth) addModsTo(lm, growth);
  }
  // 升级加点：只取前 level 次
  for (const p of b.levelPicks.slice(0, b.level)) {
    const o = LEVELUP_OPTIONS.find((x) => x.key === p.key);
    if (o) lm[p.key] = (lm[p.key] ?? 0) + o.values[p.rarity];
  }
  // 每完成一波的角色成长（番茄妹）
  const wg = waveGrowthMods(b.charId);
  if (wg) for (let i = 1; i < b.wave; i++) addModsTo(lm, wg);
  addModsTo(lm, b.extraMods);
  run.levelMods = lm;
  run.seeds = Math.max(0, money(b));
  run.dirty();
  run.hp = run.stats.maxHp;
}

function addModsTo(target: StatMods, mods: StatMods): void {
  for (const [k, v] of Object.entries(mods) as [StatKey, number][]) target[k] = (target[k] ?? 0) + v;
}

// ---------------- 商店操作（计入花费，可撤销） ----------------
const snapOf = (b: DevBuild): string => JSON.stringify({ weapons: b.weapons, items: b.items });

/** 在 run 上执行一次商店操作，然后把结果抄回构筑并记账；fn 返回 false 表示操作无效 */
function transact(b: DevBuild, label: string, cost: number, fn: () => boolean | void): boolean {
  applyBuild(b);
  const snap = snapOf(b);
  if (fn() === false) return false;
  b.weapons = run.weapons.map(fromOwned);
  b.items = { ...run.items };
  b.ledger.push({ label, cost, snap });
  return true;
}

export function undo(b: DevBuild): void {
  const e = b.ledger.pop();
  if (!e) return;
  const s = JSON.parse(e.snap) as { weapons: DevWeapon[]; items: Record<string, number> };
  b.weapons = s.weapons;
  b.items = s.items;
}

/** 商店价格均需先 applyBuild（折扣取决于已买道具） */
export const completedWave = (b: DevBuild): number => Math.max(0, b.wave - 1);
export const weaponPrice = (b: DevBuild, id: string, tier: number): number =>
  offerPrice(WEAPON_MAP[id].price * TIER_PRICE_MULT[tier], completedWave(b));
export const itemPrice = (b: DevBuild, it: ItemDef): number => offerPrice(itemBasePrice(it.price, completedWave(b)), completedWave(b));

export const canAfford = (b: DevBuild, price: number): boolean => b.ignoreBudget || money(b) >= price;

export function buyWeapon(b: DevBuild, id: string, tier: number): string | null {
  applyBuild(b);
  const p = weaponPrice(b, id, tier);
  if (!canAfford(b, p)) return '资金不足';
  if (!run.canAddWeapon(id, tier)) return '武器栏已满（且没有同名同品质可自动合成）';
  transact(b, `买 ${WEAPON_MAP[id].name} T${tier + 1}`, p, () => run.addWeapon(id, tier));
  return null;
}

export function buyItem(b: DevBuild, id: string): string | null {
  applyBuild(b);
  const it = ITEM_MAP[id];
  const p = itemPrice(b, it);
  if (!canAfford(b, p)) return '资金不足';
  if (it.max && (b.items[id] ?? 0) >= it.max) return `已达持有上限 ${it.max}`;
  transact(b, `买 ${it.name}`, p, () => run.addItem(id));
  return null;
}

export function sellWeapon(b: DevBuild, idx: number): void {
  applyBuild(b);
  const w = b.weapons[idx];
  if (!w) return;
  const sp = sellPrice(weaponPrice(b, w.id, w.tier));
  // transact 会重新写入 run，武器引用必须在回调里取
  transact(b, `卖 ${WEAPON_MAP[w.id].name} T${w.tier + 1}`, -sp, () => run.removeWeapon(run.weapons[idx].uid));
}

export function combineWeapon(b: DevBuild, idx: number): boolean {
  const w = b.weapons[idx];
  if (!w) return false;
  return transact(b, `合成 ${WEAPON_MAP[w.id].name} → T${w.tier + 2}`, 0, () => run.combine(run.weapons[idx].uid));
}

export function evolveWeapon(b: DevBuild, idx: number): boolean {
  const w = b.weapons[idx];
  if (!w) return false;
  return transact(b, `进化 ${WEAPON_MAP[w.id].name}`, 0, () => run.evolve(run.weapons[idx].uid));
}

/** 打造：沙盒里必定成功，按「费用 ÷ 成功率」的期望花费记账 */
export function forgeWeapon(b: DevBuild, idx: number): string | null {
  applyBuild(b);
  const w = run.weapons[idx];
  if (!w || !canForge(w)) return '只有 T4 且未满 +10 的武器可以打造';
  const cost = Math.round(forgeCost(w) / forgeChance(w));
  if (!canAfford(b, cost)) return '资金不足';
  transact(b, `打造 ${WEAPON_MAP[w.id].name} +${(w.forge ?? 0) + 1}（期望花费）`, cost, () => {
    const cur = run.weapons[idx];
    cur.forge = (cur.forge ?? 0) + 1;
    run.dirty();
  });
  return null;
}

export const canCombine = (b: DevBuild, idx: number): boolean => {
  const w = b.weapons[idx];
  return !!w && w.tier < 3 && b.weapons.some((o, j) => j !== idx && o.id === w.id && o.tier === w.tier);
};

// ---------------- 随机货架（仿真 ShopScene.rollShop，不含挑战修饰） ----------------
export interface ShelfOffer {
  kind: 'weapon' | 'item';
  id: string;
  tier: number;
  price: number;
  sold: boolean;
}
export interface Shelf {
  offers: ShelfOffer[];
  rerolls: number;
}

export function rollShelf(b: DevBuild, prev?: Shelf): Shelf {
  applyBuild(b);
  const R = Math.random;
  const offers: ShelfOffer[] = [];
  const luck = run.stats.luck;
  const wave = b.wave; // ShopScene 里是 run.wave + 1（run.wave 为刚打完的波）
  const need = EVOLUTIONS.filter((e) => !run.items[e.item] && run.weapons.some((w) => w.id === e.from && w.tier >= 2));
  if (need.length && R() < 0.2) {
    const it = ITEM_MAP[pickOf(need, R).item];
    offers.push({ kind: 'item', id: it.id, tier: it.rarity, price: itemPrice(b, it), sold: false });
  }
  while (offers.length < BALANCE.shopSlots) {
    if (R() < (run.weapons.length < run.maxWeapons ? 0.4 : 0.25)) {
      let def = R() < 0.18 ? WEAPON_MAP[pickOf(run.char.favored, R)] : pickOf(WEAPONS, R);
      if (run.weapons.length && R() < 0.25) def = WEAPON_MAP[pickOf(run.weapons, R).id];
      if (def.evolvedFrom) def = WEAPON_MAP[def.evolvedFrom];
      const tier = Math.max(def.minTier ?? 0, pickWeaponTier(wave, luck, run.chapter.t4Mult, R));
      offers.push({ kind: 'weapon', id: def.id, tier, price: weaponPrice(b, def.id, tier), sold: false });
    } else {
      const rar = pickRarity(wave, luck, R);
      const pool = ALL_ITEMS.filter((i) => i.rarity === rar && (!i.max || (run.items[i.id] ?? 0) < i.max));
      if (!pool.length) continue;
      const it = pickOf(pool, R);
      offers.push({ kind: 'item', id: it.id, tier: it.rarity, price: itemPrice(b, it), sold: false });
    }
  }
  return { offers, rerolls: prev?.rerolls ?? 0 };
}

/** 刷新价格（同 ShopScene.rerollCost）：免费次数 → 基础价 × 0.75^已买件数 */
export function shelfRerollCost(b: DevBuild, shelf: Shelf): number {
  applyBuild(b);
  const free = (freeFirstReroll(b.charId) ? 1 : 0) + treeTotals().freeRerolls;
  if (shelf.rerolls < free) return 0;
  const bought = shelf.offers.filter((o) => o.sold).length;
  return Math.max(1, Math.round(rerollPrice(completedWave(b), shelf.rerolls, b.chapterId) * Math.pow(0.75, bought)));
}

export function rerollShelf(b: DevBuild, shelf: Shelf): { shelf: Shelf; err?: string } {
  const cost = shelfRerollCost(b, shelf);
  if (!canAfford(b, cost)) return { shelf, err: '资金不足' };
  if (shelf.rerolls >= run.maxRerolls) return { shelf, err: `本波刷新次数已用完（上限 ${run.maxRerolls}）` };
  b.ledger.push({ label: `刷新货架 #${shelf.rerolls + 1}`, cost, snap: snapOf(b) });
  const next = rollShelf(b, shelf);
  next.rerolls = shelf.rerolls + 1;
  return { shelf: next };
}

// ---------------- 升级加点 ----------------
/** 与 LevelUpScene 相同的选项池：只提供当前武器涉及的流派伤害与爆炸范围 */
export function levelPool(): typeof LEVELUP_OPTIONS {
  const cls = new Set(run.weapons.map((w) => WEAPON_MAP[w.id]).map((d) => (d.kind === 'aura' ? 'aura' : d.cls)));
  const CLASS_KEY = { melee: 'meleePct', ranged: 'rangedPct', elemental: 'elementalPct', aura: 'auraPct' };
  const own = new Set<string>([...cls].map((c) => CLASS_KEY[c as keyof typeof CLASS_KEY]));
  if (run.weapons.some((w) => WEAPON_MAP[w.id]?.effect?.explode)) own.add('explodeSize');
  const gated = [...Object.values(CLASS_KEY), 'explodeSize'];
  return LEVELUP_OPTIONS.filter((o) => !gated.includes(o.key) || own.has(o.key));
}

/** 随机补齐剩余升级（模拟每次从 N 个选项里随手挑一个；稀有度按升级曲线随机） */
export function autoLevelPicks(b: DevBuild): void {
  applyBuild(b);
  const n = (run.char.levelUpChoices ?? BALANCE.levelUpChoices) + treeTotals().levelChoices;
  while (b.levelPicks.length < b.level) {
    const opts = shuffleWith([...levelPool()], Math.random).slice(0, n);
    const o = opts[Math.floor(Math.random() * opts.length)];
    b.levelPicks.push({ key: o.key as StatKey, rarity: pickRarity(b.wave, run.stats.luck, Math.random, BALANCE.legendUpgrade) });
  }
}

/** 期望资金：前 wave-1 波按收入目标曲线（× 章节掉落倍率）累加，再加天赋开局资金 */
export function expectedBudget(b: DevBuild): number {
  applyBuild(b);
  let sum = treeTotals().startSeeds;
  for (let w = 1; w < b.wave; w++) sum += incomeTarget(w) * run.chapter.lootMult;
  return Math.round(sum);
}

// ---------------- 预设 ----------------
const PRESET_KEY = 'tomageddon_dev_presets_v1';
const CURRENT_KEY = 'tomageddon_dev_current_v1';

export function loadPresets(): Record<string, DevBuild> {
  try {
    const d = JSON.parse(localStorage.getItem(PRESET_KEY) ?? '{}') as Record<string, Partial<DevBuild>>;
    return Object.fromEntries(Object.entries(d).map(([k, v]) => [k, sanitize(v)]));
  } catch {
    return {};
  }
}
export function savePresets(p: Record<string, DevBuild>): void {
  try {
    localStorage.setItem(PRESET_KEY, JSON.stringify(p));
  } catch {
    /* 忽略 */
  }
}
export function loadCurrent(): DevBuild {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    if (raw) return sanitize(JSON.parse(raw));
  } catch {
    /* 忽略 */
  }
  return newBuild();
}
export function saveCurrent(b: DevBuild): void {
  try {
    localStorage.setItem(CURRENT_KEY, JSON.stringify(b));
  } catch {
    /* 忽略 */
  }
}

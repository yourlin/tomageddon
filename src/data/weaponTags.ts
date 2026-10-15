// 武器标签：一把武器可以有多个标签，分四类（共 26 个）
//  · 主题类：按造型与题材手动指定（武器数据里的 tags，以及 THEME_EXTRA 补充）
//  · 元素类、机制类、类型：按武器的实际效果自动判定——效果改了标签跟着变，不会漏打或打错
// 角色契合的是标签（characters.ts 的 favored），套装加成按主题类与元素类标签计算（weapons.ts 的 WEAPON_SETS）。
import type { WeaponDef } from './weapons';

export type TagKind = 'theme' | 'element' | 'mechanic' | 'type';

export interface TagDef {
  id: string;
  kind: TagKind;
  en: string;
  icon: string;
  color: string;
}

export const TAGS: TagDef[] = [
  // 主题类（手动）
  { id: '厨具', kind: 'theme', en: 'Kitchenware', icon: '🍳', color: '#b2bec3' },
  { id: '锋利', kind: 'theme', en: 'Sharp', icon: '🔪', color: '#dfe6e9' },
  { id: '钝器', kind: 'theme', en: 'Blunt', icon: '🔨', color: '#a47148' },
  { id: '蔬果', kind: 'theme', en: 'Produce', icon: '🥕', color: '#52b788' },
  { id: '枪械', kind: 'theme', en: 'Firearm', icon: '🔫', color: '#9be564' },
  { id: '酱料', kind: 'theme', en: 'Sauce', icon: '🥫', color: '#e63946' },
  { id: '甜点', kind: 'theme', en: 'Dessert', icon: '🍰', color: '#ffafcc' },
  { id: '长柄', kind: 'theme', en: 'Polearm', icon: '🔱', color: '#e9c46a' },
  { id: '格斗', kind: 'theme', en: 'Martial', icon: '🥊', color: '#e76f51' },
  { id: '种子', kind: 'theme', en: 'Seed', icon: '🌱', color: '#80b918' },
  { id: '机械', kind: 'theme', en: 'Mech', icon: '🤖', color: '#8d99ae' },
  { id: '魔法', kind: 'theme', en: 'Arcane', icon: '🪄', color: '#b388eb' },
  { id: '弓弩', kind: 'theme', en: 'Bow', icon: '🏹', color: '#a3b18a' },
  // 元素类（自动）
  { id: '火焰', kind: 'element', en: 'Fire', icon: '🔥', color: '#ff7b00' },
  { id: '雷电', kind: 'element', en: 'Lightning', icon: '⚡', color: '#ffd60a' },
  { id: '冰霜', kind: 'element', en: 'Frost', icon: '❄️', color: '#90e0ef' },
  { id: '毒气', kind: 'element', en: 'Toxic', icon: '☠️', color: '#9d4edd' },
  { id: '元素', kind: 'element', en: 'Elemental', icon: '✨', color: '#6ec6ff' },
  // 机制类（自动）
  { id: '持续伤害', kind: 'mechanic', en: 'DoT', icon: '⏳', color: '#ff9f9f' },
  { id: '爆破', kind: 'mechanic', en: 'Demolition', icon: '💥', color: '#ff9f1c' },
  { id: '穿透', kind: 'mechanic', en: 'Pierce', icon: '➶', color: '#74b9ff' },
  { id: '连锁', kind: 'mechanic', en: 'Chain', icon: '⛓️', color: '#a29bfe' },
  { id: '多重射击', kind: 'mechanic', en: 'Multishot', icon: '⁂', color: '#55efc4' },
  { id: '暴击', kind: 'mechanic', en: 'Crit', icon: '🎯', color: '#ff7675' },
  // 类型（自动）
  { id: '光环', kind: 'type', en: 'Aura', icon: '🌀', color: '#c77dff' },
  { id: '投掷', kind: 'type', en: 'Thrown', icon: '🪃', color: '#f4a261' },
];
export const TAG_MAP: Record<string, TagDef> = Object.fromEntries(TAGS.map((t) => [t.id, t]));
const THEME = new Set(TAGS.filter((t) => t.kind === 'theme').map((t) => t.id));

/** 现有武器补充的主题标签（钝器、甜点、长柄、格斗、种子、机械、魔法、弓弩是后加的标签，原数据里没有） */
export const THEME_EXTRA: Record<string, string[]> = {
  rolling_pin: ['钝器'],
  pan: ['钝器'],
  meat_tenderizer: ['钝器'],
  watermelon_hammer: ['钝器'],
  pineapple_mace: ['钝器'],
  coconut_gloves: ['钝器', '格斗'],
  baguette_sword: ['钝器'],
  dynamite_drumstick: ['钝器'],
  honey_blaster: ['甜点'],
  jam_mortar: ['甜点'],
  soda: ['甜点'],
  cola_zapper: ['甜点'],
  // 角色专属标签（docs/design/CHAR_WEAPONS.md）
  fork: ['长柄'],
  bamboo_spear: ['长柄'],
  skewer: ['长柄'],
  bbq_skewer: ['长柄'],
  volt_fork: ['长柄'],
  pea_shooter: ['种子'],
  seed_spitter: ['种子'],
  bean_bazooka: ['种子'],
  pea_sniper: ['种子'],
  microwave_cannon: ['机械'],
  popcorn_machine: ['机械'],
  broccoli_staff: ['魔法'],
  dragonfruit_orb: ['魔法'],
  pumpkin_lantern: ['魔法'],
  carrot_crossbow: ['弓弩'],
  asparagus_bow: ['弓弩'],
};

const maxOf = (l?: number[]): number => (l?.length ? Math.max(...l) : 0);

/** 按武器效果自动判定的元素类 / 机制类 / 类型标签 */
export function autoTags(def: WeaponDef): string[] {
  const e = def.effect ?? {};
  const out: string[] = [];
  if (e.burn || def.kind === 'flame') out.push('火焰');
  if (def.kind === 'chain' || e.chain) out.push('雷电');
  if (e.slow) out.push('冰霜');
  if (e.poison) out.push('毒气');
  // 元素：只给元素类武器（带灼烧的枪、刀已经有「火焰」等具体元素标签）
  if (def.cls === 'elemental') out.push('元素');
  if (e.burn || e.poison) out.push('持续伤害');
  if (e.explode || def.kind === 'rocket' || def.kind === 'mine') out.push('爆破');
  if (maxOf(def.pierce) >= 2) out.push('穿透');
  if (def.kind === 'chain' || maxOf(def.bounce) > 0) out.push('连锁');
  if (maxOf(def.count) >= 2 || (def.splitShots ?? 0) > 0) out.push('多重射击');
  if (def.critMult >= 2 || (def.critBonus ?? 0) >= 10) out.push('暴击');
  if (def.kind === 'aura') out.push('光环');
  if (def.kind === 'boomerang') out.push('投掷');
  return out;
}

const cache = new Map<string, string[]>();
/** 合成武器的材料（data/recipes.ts 注册）：合成出的武器标签 = 两把材料标签的并集 */
const SOURCES = new Map<string, string[]>();
const DEFS = new Map<string, WeaponDef>();
export function registerTagSources(id: string, from: WeaponDef[]): void {
  SOURCES.set(
    id,
    from.map((w) => w.id),
  );
  for (const w of from) DEFS.set(w.id, w);
  cache.clear();
}

/** 武器的全部标签：主题类（手动）在前，元素类、机制类、类型（自动）在后。
 *  合成武器（T4 融合、超武）不按自身效果判定，而是继承材料：同名两把合成标签不变，两把不同取并集。 */
export function weaponTags(def: WeaponDef): string[] {
  const hit = cache.get(def.id);
  if (hit) return hit;
  const src = SOURCES.get(def.id);
  if (src) {
    const all = src.map((id) => (id === def.id ? baseTags(def) : weaponTags(DEFS.get(id)!)));
    const order = TAGS.map((t) => t.id);
    const tags = [...new Set(all.flat())].sort((x, y) => order.indexOf(x) - order.indexOf(y));
    cache.set(def.id, tags);
    return tags;
  }
  const tags = baseTags(def);
  cache.set(def.id, tags);
  return tags;
}

function baseTags(def: WeaponDef): string[] {
  // 超武继承原武器的主题标签（平底锅进化后仍是钝器），角色契合按原武器判定
  const theme = [...def.tags, ...(THEME_EXTRA[def.id] ?? []), ...(def.evolvedFrom ? (THEME_EXTRA[def.evolvedFrom] ?? []) : [])].filter(
    (t) => THEME.has(t),
  );
  return [...new Set([...theme, ...autoTags(def)])];
}

/** 标签显示名（英文模式用英文） */
export const tagLabel = (id: string, en: boolean): string => (en ? (TAG_MAP[id]?.en ?? id) : id);

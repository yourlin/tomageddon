// 遗物（C 模块）：每局通过精英奖励、无尽里程碑、神秘商人获得，改变一局的规则而不只是加属性。
// 描述全部由数据自动生成（describeRelic），避免文字与代码数值不一致（C6）。
import type { StatMods } from './stats';
import type { ItemSpecial } from './items';
import type { RuleDelta } from './danger';
import { describeMods } from './stats';
import { describeSpecial } from './describe';
import { tx, lang } from '../i18n';

export type RelicKind = 'boon' | 'trade' | 'curse';

/** 规则型效果：由 RunState / GameScene / ShopScene 读取 */
export interface RelicFlags {
  /** 最大生命倍率 */
  maxHpMult?: number;
  /** 生命再生 / 吸血 / 闪避 / 护甲 归零（负值保留） */
  noRegen?: boolean;
  noLifeSteal?: boolean;
  noDodge?: boolean;
  noArmor?: boolean;
  /** 每次商店的免费刷新次数 */
  freeRerolls?: number;
  /** 每波结束额外获得番茄籽 */
  waveSeeds?: number;
  /** 每波结束额外获得宝箱 */
  waveCrates?: number;
  /** 升级时多一个选项 */
  levelChoices?: number;
  /** C8：这些武器在 T3（而不是 T4）就能进化 */
  evolveEarly?: string[];
}

export interface RelicDef {
  id: string;
  icon: string;
  name: [string, string];
  kind: RelicKind;
  /** C7：套装（集齐同套装 3 件触发 RELIC_SETS 的额外效果） */
  set?: string;
  mods?: StatMods;
  special?: ItemSpecial;
  rule?: RuleDelta;
  flags?: RelicFlags;
}

const R = (
  id: string,
  icon: string,
  zh: string,
  en: string,
  kind: RelicKind,
  x: Omit<RelicDef, 'id' | 'icon' | 'name' | 'kind'>,
): RelicDef => ({
  id,
  icon,
  name: [zh, en],
  kind,
  ...x,
});

export const RELICS: RelicDef[] = [
  // ---------- 增益 ----------
  R('sun_lamp', '☀️', '温室日灯', 'Grow Lamp', 'boon', { set: 'greenhouse', mods: { harvest: 8, regen: 2 } }),
  R('drip_hose', '💧', '滴灌水管', 'Drip Hose', 'boon', { set: 'greenhouse', mods: { regen: 3 }, flags: { waveSeeds: 10 } }),
  R('glass_roof', '🏠', '温室玻璃顶', 'Glass Roof', 'boon', { set: 'greenhouse', mods: { armor: 3, maxHp: 8 } }),
  R('lucky_coin', '🪙', '幸运铜板', 'Lucky Coin', 'boon', { set: 'fortune', mods: { luck: 10 } }),
  R('piggy_bank', '🐷', '存钱罐', 'Piggy Bank', 'boon', { set: 'fortune', special: { interest: 5 } }),
  R('golden_ticket', '🎫', '金色彩票', 'Golden Ticket', 'boon', { set: 'fortune', flags: { freeRerolls: 1 } }),
  R('chef_hat', '👨‍🍳', '主厨高帽', "Chef's Hat", 'boon', { set: 'kitchen', mods: { meleePct: 12, attackSpeed: 5 } }),
  R('spice_rack', '🧂', '调料架', 'Spice Rack', 'boon', { set: 'kitchen', special: { burnChance: 8 }, mods: { elementalPct: 8 } }),
  R('cutting_board', '🪵', '老砧板', 'Old Cutting Board', 'boon', { set: 'kitchen', mods: { armor: 4, melee: 3 } }),
  R('scarecrow', '🧑‍🌾', '稻草人', 'Scarecrow', 'boon', { set: 'field', special: { thorns: 6 }, mods: { maxHp: 10 } }),
  R('pitchfork', '🔱', '干草叉', 'Pitchfork', 'boon', { set: 'field', mods: { ranged: 3, range: 40 } }),
  R('tractor_key', '🔑', '拖拉机钥匙', 'Tractor Key', 'boon', { set: 'field', mods: { speed: 5, pickup: 60 } }),
  R('study_notes', '📒', '错题本', 'Study Notes', 'boon', { mods: { xpGain: 25 }, flags: { levelChoices: 1 } }),
  R('gift_box', '🎁', '神秘礼盒', 'Mystery Box', 'boon', { flags: { waveCrates: 1 } }),
  R('phoenix_seed', '🔥', '凤凰种子', 'Phoenix Seed', 'boon', { special: { revive: 1 } }),
  R('extra_pocket', '👖', '多一个口袋', 'Extra Pocket', 'boon', { special: { weaponSlot: 1 } }),

  // ---------- 交易型（有代价） ----------
  R('blood_pact', '🩸', '血之契约', 'Blood Pact', 'trade', { set: 'night', mods: { lifeSteal: 15 }, flags: { noRegen: true } }),
  R('bat_wing', '🦇', '蝙蝠翅膀', 'Bat Wing', 'trade', { set: 'night', mods: { dodge: 12, speed: 4 }, flags: { noArmor: true } }),
  R('moon_shard', '🌙', '月之碎片', 'Moon Shard', 'trade', { set: 'night', mods: { crit: 12 }, rule: { heal: -20 } }),
  R('glass_heart', '💔', '玻璃心', 'Glass Heart', 'trade', { set: 'glass', mods: { damage: 25 }, flags: { maxHpMult: 0.75 } }),
  R('crystal_lens', '🔍', '水晶透镜', 'Crystal Lens', 'trade', { set: 'glass', mods: { crit: 10, range: 60 }, flags: { noDodge: true } }),
  R('thin_ice', '🧊', '薄冰护符', 'Thin Ice Charm', 'trade', { set: 'glass', mods: { attackSpeed: 18 }, rule: { enemyDmg: 10 } }),
  R('iron_skin', '🛡️', '铁皮', 'Iron Skin', 'trade', { set: 'stone', mods: { armor: 10, speed: -6 } }),
  R('stone_boots', '🥾', '石头靴', 'Stone Boots', 'trade', { set: 'stone', mods: { maxHp: 25, dodge: -10 } }),
  R('anchor', '⚓', '铁锚', 'Anchor', 'trade', { set: 'stone', mods: { meleePct: 20, attackSpeed: -8 } }),
  R('greedy_sack', '💰', '贪婪麻袋', 'Greedy Sack', 'trade', { rule: { income: 25, shopPrice: 15 } }),
  R('fast_food', '🍔', '速食套餐', 'Fast Food', 'trade', { mods: { maxHp: 15 }, flags: { noLifeSteal: true } }),
  R('overclock', '⚙️', '超频芯片', 'Overclock Chip', 'trade', { mods: { attackSpeed: 25, maxHp: -8 } }),
  R('hermit_lamp', '🏮', '隐士提灯', "Hermit's Lantern", 'trade', { mods: { skillCd: 25, skillDmg: 20 }, rule: { xp: -15 } }),
  R('heavy_purse', '👛', '沉甸甸的钱包', 'Heavy Purse', 'trade', { flags: { waveSeeds: 25 }, mods: { speed: -4 } }),

  // ---------- 诅咒型（高风险高收益） ----------
  R('swarm_bell', '🔔', '虫群铃铛', 'Swarm Bell', 'curse', { set: 'plague', rule: { spawn: 30, income: 30, xp: 20 } }),
  R('rot_crown', '👑', '腐烂王冠', 'Rotten Crown', 'curse', { set: 'plague', rule: { enemyHp: 20 }, mods: { damage: 20 } }),
  R('plague_mask', '🎭', '瘟疫面具', 'Plague Mask', 'curse', { set: 'plague', rule: { champ: 100 }, special: { statusDmg: 30 } }),
  R('blood_moon', '🌕', '血月', 'Blood Moon', 'curse', { rule: { enemyDmg: 25, enemySpeed: 10 }, mods: { lifeSteal: 10, damage: 15 } }),
  R('cursed_dice', '🎲', '诅咒骰子', 'Cursed Dice', 'curse', { mods: { luck: 24 }, rule: { rerollPrice: 50 } }),
  R('doom_clock', '⏰', '末日时钟', 'Doom Clock', 'curse', { rule: { enemySpeed: 15 }, mods: { attackSpeed: 20, speed: 5 } }),
  R('tax_collector', '📜', '收税官的账本', "Tax Collector's Ledger", 'curse', { rule: { shopPrice: 25 }, mods: { harvest: 20, luck: 20 } }),
  R('giant_seed', '🌰', '巨人种子', 'Giant Seed', 'curse', { rule: { eliteHp: 40, enemyHp: 10 }, mods: { maxHp: 30, damage: 10 } }),
  R('witch_brew', '🧪', '女巫汤', "Witch's Brew", 'curse', { rule: { heal: -30 }, mods: { elementalPct: 25 }, special: { statusDmg: 25 } }),
  R('broken_mirror', '🪞', '破镜子', 'Broken Mirror', 'curse', {
    mods: { crit: 15 },
    special: { critDmg: 40 },
    flags: { maxHpMult: 0.85 },
  }),

  // ---------- C8：与武器进化联动（持有时对应武器在 T3 即可进化） ----------
  R('sauce_ladle', '🥄', '秘制汤勺', 'Secret Ladle', 'boon', { flags: { evolveEarly: ['fork'] } }),
  R('flour_sack', '🌾', '面粉袋', 'Flour Sack', 'boon', { flags: { evolveEarly: ['rolling_pin'] } }),
  R('whetstone', '🪨', '磨刀石', 'Whetstone', 'boon', { flags: { evolveEarly: ['knife'] } }),
  R('butcher_apron', '🥩', '屠夫围裙', "Butcher's Apron", 'boon', { flags: { evolveEarly: ['cleaver'] } }),
  R('pea_pod', '🫛', '豌豆荚', 'Pea Pod', 'boon', { flags: { evolveEarly: ['pea_shooter'] } }),
];

export const RELIC_MAP: Record<string, RelicDef> = Object.fromEntries(RELICS.map((r) => [r.id, r]));

/** C7：遗物套装，集齐 3 件触发 */
export interface RelicSetDef {
  id: string;
  name: [string, string];
  mods?: StatMods;
  special?: ItemSpecial;
  rule?: RuleDelta;
  flags?: RelicFlags;
}
export const RELIC_SETS: RelicSetDef[] = [
  { id: 'greenhouse', name: ['温室', 'Greenhouse'], mods: { harvest: 15, regen: 4 } },
  { id: 'fortune', name: ['财运', 'Fortune'], flags: { freeRerolls: 1, waveSeeds: 20 } },
  { id: 'kitchen', name: ['厨房', 'Kitchen'], mods: { damage: 12 }, special: { critDmg: 20 } },
  { id: 'field', name: ['田野', 'Field'], mods: { speed: 4, maxHp: 15 }, special: { thorns: 8 } },
  { id: 'night', name: ['夜行', 'Night'], mods: { lifeSteal: 8, dodge: 6 } },
  { id: 'glass', name: ['玻璃', 'Glass'], mods: { damage: 15, crit: 8 } },
  { id: 'stone', name: ['磐石', 'Stone'], mods: { armor: 6, maxHp: 20 } },
  { id: 'plague', name: ['瘟疫', 'Plague'], rule: { income: 20 }, special: { statusDmg: 25 } },
];
export const RELIC_SET_MAP: Record<string, RelicSetDef> = Object.fromEntries(RELIC_SETS.map((s) => [s.id, s]));

/** 套装进度：套装 id → 持有件数 */
export function relicSetCounts(ids: string[]): Record<string, number> {
  const c: Record<string, number> = {};
  for (const id of ids) {
    const s = RELIC_MAP[id]?.set;
    if (s) c[s] = (c[s] ?? 0) + 1;
  }
  return c;
}

export const RELIC_SET_SIZE = 3;

export interface RelicTotals {
  mods: StatMods[];
  specials: ItemSpecial[];
  rule: RuleDelta;
  flags: Required<Pick<RelicFlags, 'freeRerolls' | 'waveSeeds' | 'waveCrates' | 'levelChoices'>> & {
    maxHpMult: number;
    noRegen: boolean;
    noLifeSteal: boolean;
    noDodge: boolean;
    noArmor: boolean;
    evolveEarly: string[];
  };
  /** 已激活的套装 */
  sets: string[];
}

/** 汇总一组遗物（含已集齐套装）的全部效果 */
export function relicTotals(ids: string[]): RelicTotals {
  const t: RelicTotals = {
    mods: [],
    specials: [],
    rule: {},
    flags: {
      freeRerolls: 0,
      waveSeeds: 0,
      waveCrates: 0,
      levelChoices: 0,
      maxHpMult: 1,
      noRegen: false,
      noLifeSteal: false,
      noDodge: false,
      noArmor: false,
      evolveEarly: [],
    },
    sets: [],
  };
  const sets = Object.entries(relicSetCounts(ids))
    .filter(([, n]) => n >= RELIC_SET_SIZE)
    .map(([s]) => s);
  t.sets = sets;
  const srcs: { mods?: StatMods; special?: ItemSpecial; rule?: RuleDelta; flags?: RelicFlags }[] = [
    ...ids.map((id) => RELIC_MAP[id]).filter(Boolean),
    ...sets.map((s) => RELIC_SET_MAP[s]).filter(Boolean),
  ];
  for (const r of srcs) {
    if (r.mods) t.mods.push(r.mods);
    if (r.special) t.specials.push(r.special);
    for (const [k, v] of Object.entries(r.rule ?? {}) as [keyof RuleDelta, number][]) t.rule[k] = (t.rule[k] ?? 0) + v;
    const f = r.flags;
    if (!f) continue;
    if (f.maxHpMult) t.flags.maxHpMult *= f.maxHpMult;
    t.flags.noRegen ||= !!f.noRegen;
    t.flags.noLifeSteal ||= !!f.noLifeSteal;
    t.flags.noDodge ||= !!f.noDodge;
    t.flags.noArmor ||= !!f.noArmor;
    t.flags.freeRerolls += f.freeRerolls ?? 0;
    t.flags.waveSeeds += f.waveSeeds ?? 0;
    t.flags.waveCrates += f.waveCrates ?? 0;
    t.flags.levelChoices += f.levelChoices ?? 0;
    if (f.evolveEarly) t.flags.evolveEarly.push(...f.evolveEarly);
  }
  return t;
}

const pct = (v: number) => `${v > 0 ? '+' : ''}${v}%`;

/** 规则修正的文字描述 */
export function describeRule(r: RuleDelta | undefined): string[] {
  if (!r) return [];
  const out: string[] = [];
  const L: [keyof RuleDelta, string, string][] = [
    ['enemyHp', '敌人生命', 'enemy HP'],
    ['enemyDmg', '敌人伤害', 'enemy damage'],
    ['enemySpeed', '敌人移速', 'enemy speed'],
    ['spawn', '刷怪数量', 'spawns'],
    ['champ', '词缀精英出现率', 'champion rate'],
    ['eliteHp', '精英与 Boss 生命', 'elite & boss HP'],
    ['shopPrice', '商店价格', 'shop prices'],
    ['rerollPrice', '刷新价格', 'reroll price'],
    ['heal', '所有治疗', 'all healing'],
    ['xp', '经验获取', 'XP gain'],
    ['income', '番茄籽收入', 'Seed income'],
  ];
  for (const [k, zh, en] of L) if (r[k]) out.push(tx(`${zh} ${pct(r[k]!)}`, `${pct(r[k]!)} ${en}`));
  if (r.eliteAffix) out.push(tx(`精英额外 +${r.eliteAffix} 个词缀`, `Elites gain +${r.eliteAffix} affix`));
  if (r.bossSkill) out.push(tx(`Boss 额外 ${r.bossSkill} 个招式`, `Bosses gain ${r.bossSkill} attack(s)`));
  return out;
}

export function describeFlags(f: RelicFlags | undefined, weaponName: (id: string) => string = (id) => id): string[] {
  if (!f) return [];
  const out: string[] = [];
  if (f.maxHpMult) out.push(tx(`最大生命 ×${f.maxHpMult}`, `Max HP ×${f.maxHpMult}`));
  if (f.noRegen) out.push(tx('生命再生无效', 'HP Regen does nothing'));
  if (f.noLifeSteal) out.push(tx('吸血无效', 'Life Steal does nothing'));
  if (f.noDodge) out.push(tx('无法闪避', 'You cannot dodge'));
  if (f.noArmor) out.push(tx('护甲无效', 'Armor does nothing'));
  if (f.freeRerolls) out.push(tx(`每次商店免费刷新 ${f.freeRerolls} 次`, `${f.freeRerolls} free reroll(s) per shop`));
  if (f.waveSeeds) out.push(tx(`每波结束获得 ${f.waveSeeds} 番茄籽`, `Gain ${f.waveSeeds} Seeds after each wave`));
  if (f.waveCrates) out.push(tx(`每波结束获得 ${f.waveCrates} 个宝箱`, `Gain ${f.waveCrates} crate(s) after each wave`));
  if (f.levelChoices) out.push(tx(`升级时多 ${f.levelChoices} 个选项`, `+${f.levelChoices} level-up choice(s)`));
  if (f.evolveEarly?.length)
    out.push(
      tx(`${f.evolveEarly.map(weaponName).join('、')} 在 T3 即可进化`, `${f.evolveEarly.map(weaponName).join(', ')} can evolve at T3`),
    );
  return out;
}

/** C6：遗物描述完全由数据生成 */
export function describeRelic(
  r: { mods?: StatMods; special?: ItemSpecial; rule?: RuleDelta; flags?: RelicFlags },
  weaponName?: (id: string) => string,
): string[] {
  return [...describeMods(r.mods ?? {}), ...describeSpecial(r.special), ...describeRule(r.rule), ...describeFlags(r.flags, weaponName)];
}

/** 单件遗物上显示的套装说明；n 为本局该套装件数（不传则只显示套装效果，如图鉴） */
export function describeRelicSet(r: RelicDef, n?: number): string | null {
  if (!r.set) return null;
  const sd = RELIC_SET_MAP[r.set];
  const name = sd.name[lang === 'en' ? 1 : 0];
  const prog = n === undefined ? '' : `${Math.min(n, RELIC_SET_SIZE)}/${RELIC_SET_SIZE}${n >= RELIC_SET_SIZE ? ' ✓' : ''}`;
  const bonus = describeRelic(sd).join(tx('，', ', '));
  return tx(
    `✦ 套装「${name}」${prog}：集齐 ${RELIC_SET_SIZE} 件 ${bonus}`,
    `✦ ${name} set${prog && ' ' + prog}: ${RELIC_SET_SIZE}-piece ${bonus}`,
  );
}

export const RELIC_KIND_INFO: Record<RelicKind, { name: [string, string]; color: number; css: string }> = {
  boon: { name: ['增益', 'Boon'], color: 0x52b788, css: '#52ff8a' },
  trade: { name: ['交易', 'Trade'], color: 0xffd166, css: '#ffd166' },
  curse: { name: ['诅咒', 'Curse'], color: 0x9d4edd, css: '#c77dff' },
};

// 武器进化：T4 武器 + 指定的经典道具 → 在商店武器弹窗里进化为专属超武。
// 进化保留原武器的词条与打造等级；超武不进商店池，只能通过进化获得。
import { WEAPONS, WEAPON_MAP, type WeaponDef } from './weapons';
import { EXTRA_EVOLUTIONS_SPEC } from './gearExtra';

export interface EvolutionDef {
  /** 进化前的武器 */
  from: string;
  /** 需要持有的道具（不会被消耗） */
  item: string;
  to: WeaponDef;
}

type Boost = {
  id: string;
  name: string;
  desc: string;
  /** 伤害倍率、冷却倍率、射程倍率 */
  dmg?: number;
  cd?: number;
  range?: number;
  extra?: Partial<WeaponDef>;
};

const BASE: Record<string, WeaponDef> = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));
const up4 = (a: number[] | undefined, n: number): number[] => (a ?? [0, 0, 0, 0]).map((v) => v + n);

function evolve(from: string, item: string, b: Boost): EvolutionDef {
  const w = BASE[from];
  const to: WeaponDef = {
    ...w,
    id: b.id,
    name: b.name,
    desc: b.desc,
    damage: w.damage.map((d) => Math.round(d * (b.dmg ?? 1.7))),
    cooldown: w.cooldown.map((c) => Math.round(c * (b.cd ?? 0.85) * 100) / 100),
    range: Math.round(w.range * (b.range ?? 1.15)),
    minTier: 3,
    evolvedFrom: from,
    ...b.extra,
  };
  return { from, item, to };
}

export const EVOLUTIONS: EvolutionDef[] = [
  evolve('fork', 'hot_sauce', {
    id: 'hell_trident',
    name: '地狱三叉戟',
    desc: '浸过辣酱的三叉戟，刺中即燃。',
    extra: { effect: { burn: { dps: 6, dur: 3 } }, pierce: [2, 2, 3, 4] },
  }),
  evolve('rolling_pin', 'iron_wok', {
    id: 'titan_pin',
    name: '擎天擀面柱',
    desc: '铁锅做的配重，绕身横扫一整圈，震晕四周一片。',
    range: 1.35,
    extra: { effect: { stun: 0.5 }, knockback: 30 },
  }),
  evolve('knife', 'sharpener', {
    id: 'paoding_blade',
    name: '庖丁神刀',
    desc: '游刃有余，刀刀致命。',
    dmg: 1.6,
    cd: 0.75,
    extra: { critMult: 3, critBonus: 20 },
  }),
  evolve('cleaver', 'chef_knife_set', {
    id: 'dragon_cleaver',
    name: '屠龙菜刀',
    desc: '整套刀具熔铸而成，交叉双斩后劈出贯穿一线的屠龙刀气。',
    dmg: 1.9,
    range: 1.3,
    extra: { effect: { lifeSteal: 4 } },
  }),
  evolve('pea_shooter', 'seed_bag', {
    id: 'pea_gatling',
    name: '豌豆加特林',
    desc: '一整袋豌豆，扫射不停。',
    dmg: 1.4,
    cd: 0.55,
    extra: { count: [3, 3, 4, 5], spread: 18 },
  }),
  evolve('ketchup', 'tomato_juice', {
    id: 'ketchup_flood',
    name: '番茄酱洪流',
    desc: '源源不断的番茄酱，淹没一切。',
    dmg: 1.5,
    cd: 0.6,
    extra: { pierce: up4(BASE.ketchup.pierce, 2), effect: { slow: { pct: 30, dur: 1.5 } } },
  }),
  evolve('chili_rocket', 'fire_pepper', {
    id: 'devil_missile',
    name: '魔鬼椒导弹',
    desc: '辣度破表，爆炸范围翻倍。',
    dmg: 1.8,
    extra: { effect: { explode: 130, burn: { dps: 8, dur: 3 } } },
  }),
  evolve('lightning_whisk', 'tesla_coil', {
    id: 'thor_whisk',
    name: '雷神打蛋器',
    desc: '特斯拉线圈加持，雷电在怪群里跳个不停，最后从天上砸下必定暴击的雷神之锤。',
    extra: { effect: { chain: [5, 6, 8, 10] } },
  }),
  evolve('garlic_aura', 'vampire_cape', {
    id: 'vampire_garlic',
    name: '吸血鬼大蒜',
    desc: '吸血鬼也爱上了大蒜：光环吸取生命。',
    dmg: 1.8,
    range: 1.3,
    extra: { effect: { lifeSteal: 6 } },
  }),
  evolve('blueberry_sniper', 'railgun_core', {
    id: 'blueberry_railgun',
    name: '蓝莓电磁炮',
    desc: '电磁加速的蓝莓，贯穿整列敌人。',
    dmg: 2,
    cd: 0.8,
    range: 1.4,
    extra: { pierce: [8, 8, 9, 10], projSpeed: 1600 },
  }),
  evolve('corn_cannon', 'golden_tomato', {
    id: 'golden_corn',
    name: '黄金爆米花炮',
    desc: '金色爆米花四散炸开。',
    dmg: 1.7,
    extra: { effect: { explode: 90 }, count: up4(BASE.corn_cannon.count ?? [1, 1, 1, 1], 1) },
  }),
  evolve('star_anise_shuriken', 'feather', {
    id: 'anise_storm',
    name: '八角风暴',
    desc: '轻如羽毛的八角，飞到远处连转三圈椭圆才回来，每圈都能再打一次。',
    dmg: 1.5,
    cd: 0.7,
    extra: { bounce: up4(BASE.star_anise_shuriken.bounce, 3), count: up4(BASE.star_anise_shuriken.count ?? [1, 1, 1, 1], 1) },
  }),
];

// 1.4.0 G6：新进化 8 组
EVOLUTIONS.push(...EXTRA_EVOLUTIONS_SPEC.map((x) => evolve(x.from, x.item, x.boost)));
/** 超武自带的叠层增益（只有 8 把有，每种 2 把；其余 12 把是各自独有的招式，见 SkillStyles / WeaponSystem） */
const SUPER_BUFFS: Record<string, NonNullable<WeaponDef['superBuff']>> = {
  dragon_cleaver: 'rage',
  hell_trident: 'rage',
  pea_gatling: 'haste',
  ketchup_flood: 'haste',
  paoding_blade: 'focus',
  tsunami_katana: 'focus',
  vampire_garlic: 'vampiric',
  umami_bomb: 'vampiric',
};
export const EVOLVED_WEAPONS: WeaponDef[] = EVOLUTIONS.map((e) => e.to);
for (const w of EVOLVED_WEAPONS) if (SUPER_BUFFS[w.id]) w.superBuff = SUPER_BUFFS[w.id];
export const EVOLUTION_OF: Record<string, EvolutionDef> = Object.fromEntries(EVOLUTIONS.map((e) => [e.from, e]));
// 超武也要能通过 WEAPON_MAP 查到（战斗、存档、图鉴共用）
for (const w of EVOLVED_WEAPONS) WEAPON_MAP[w.id] = w;

/** 光环类武器（含超武）id：小任务「光环收割」等判断用 */
export const AURA_WEAPON_IDS = new Set([...WEAPONS, ...EVOLVED_WEAPONS].filter((w) => w.kind === 'aura').map((w) => w.id));

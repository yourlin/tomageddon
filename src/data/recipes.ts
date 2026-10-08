// 合成配方：T4 与超武只能按配方合成（T1→T3 仍是同名同级两把合一把）。
//  · T4：两把 T3 + 指定 T3（史诗）道具 → T4。同名两把 → 该武器的 T4；两把不同 → 继承两把属性与特效的新 T4 武器。
//    （原来叫「精炼」和「融合」，现在统一叫 T4 配方，不再区分）
//  · 超武：两把指定 T4 + 原进化催化道具 + 指定 T4（传说）道具 → 超武（更强，并可能自带超武增益）
// 道具在合成时被消耗。合成表界面见 scenes/CraftScene.ts。
import { WEAPONS, WEAPON_MAP, registerWeapons, type WeaponDef } from './weapons';
import { EVOLUTIONS } from './evolutions';
import { ALL_ITEMS, ITEM_MAP } from './items';
import { weaponTags, TAG_MAP } from './weaponTags';
import { tx } from '../i18n';

/** 配方类型：T4（两把 T3 合成，原「精炼」「融合」）与超武（两把 T4 合成） */
export type RecipeKind = 't4' | 'super';

export interface Recipe {
  /** 产出武器 id */
  to: string;
  kind: RecipeKind;
  /** 材料武器：[id, 品质]，品质 2 = T3、3 = T4 */
  from: [string, number][];
  /** 消耗的道具：每一项是一个「任选其一」的集合（同一主题的若干道具，持有任意一件即可） */
  items: string[][];
}

/** 主题标签 → 优先使用的道具系列（配方里的道具按武器主题挑） */
const TAG_SERIES: Record<string, string[]> = {
  厨具: ['锅具', '餐具', '农具'],
  锋利: ['刀具', '忍具'],
  钝器: ['盾牌', '机械零件'],
  蔬果: ['种子', '农具', '番茄制品'],
  枪械: ['玩具枪', '弹药'],
  酱料: ['酱料', '香料'],
  甜点: ['糖果', '甜点', '面包'],
  火焰: ['火焰', '香料'],
  雷电: ['雷电', '能源'],
  冰霜: ['冰品', '茶饮'],
  毒气: ['毒物', '腐败'],
  元素: ['宝石', '卷轴'],
  爆破: ['机械零件', '能源'],
  持续伤害: ['药水', '毒物'],
  穿透: ['弹药', '骨头'],
  连锁: ['雷电', '戒指'],
  多重射击: ['弹药', '玩具枪'],
  暴击: ['刀具', '星辰'],
  光环: ['护身符', '宝石'],
};

const bySeries = (() => {
  const m: Record<string, string[]> = {};
  for (const it of ALL_ITEMS) if (it.series) (m[it.series] ??= []).push(it.id);
  return m;
})();

/** 稳定的伪随机（按 key 取同一个结果，保证每次启动配方一致） */
function hash(s: string): number {
  let h = 2166136261;
  for (const c of s) h = (h ^ c.charCodeAt(0)) * 16777619;
  return Math.abs(h);
}

/** 配方道具的品质：T4 武器（精炼 / 融合）要 T3（史诗）道具，超武要 T4（传说）道具 */
export const RECIPE_ITEM_RARITY = 2;
export const SUPER_ITEM_RARITY = 3;

/**
 * 给武器挑 n 个配方道具：每个槽是一件**指定品质的道具**（默认 T3），按武器的主题标签从对应系列里挑，
 * 同一条配方里不重复；主题系列不够时用该品质的全部道具补。结果按 key 稳定，每次启动都一样。
 */
function pickItems(def: WeaponDef, n: number, salt = '', exclude: string[] = [], rarity = RECIPE_ITEM_RARITY): string[][] {
  const pool: string[] = [];
  for (const t of weaponTags(def))
    for (const sr of TAG_SERIES[t] ?? [])
      for (const id of bySeries[sr] ?? []) if (ITEM_MAP[id]?.rarity === rarity && !pool.includes(id)) pool.push(id);
  const all = ALL_ITEMS.filter((it) => it.rarity === rarity).map((it) => it.id);
  const out: string[][] = [];
  const used = new Set(exclude);
  for (let i = 0; i < n; i++) {
    const src = pool.filter((id) => !used.has(id));
    const from = src.length ? src : all.filter((id) => !used.has(id));
    const pick = from[hash(`${def.id}:${salt}:${i}`) % from.length];
    used.add(pick);
    out.push([pick]);
  }
  return out;
}

// ---------------- 融合 T4：16 把新武器 ----------------
interface FuseSpec {
  id: string;
  name: string;
  en: string;
  desc: string;
  enDesc: string;
  /** 主武器（决定攻击方式与类型）、副武器 */
  main: string;
  sub: string;
  /** 额外主题标签 */
  tags?: string[];
  items: number;
  tint: number;
  over?: Partial<WeaponDef>;
}

export const FUSE_SPECS: FuseSpec[] = [
  {
    id: 'sushi_twin_blade',
    name: '双刃寿司刀',
    en: 'Twin Sushi Blade',
    desc: '两把名刀熔成一把，暴击又快又狠，刀光所过之处余烬未消。',
    enDesc: 'Two famed blades forged into one: fast, brutal crits that leave embers behind.',
    main: 'wasabi_katana',
    sub: 'sushi_blade',
    items: 2,
    tint: 0x7bd389,
  },
  {
    id: 'blast_pea_cannon',
    name: '爆裂豌豆炮',
    en: 'Blast Pea Cannon',
    desc: '豌豆枪接上火箭筒，豆子落地就炸。',
    enDesc: 'A pea shooter mated to a launcher: every pea detonates.',
    main: 'pea_shooter',
    sub: 'chili_rocket',
    items: 2,
    tint: 0xff7b00,
    over: { effect: { explode: 70, burn: { dps: 2, dur: 2 } } },
  },
  {
    id: 'curry_garlic_field',
    name: '咖喱蒜香结界',
    en: 'Curry Garlic Field',
    desc: '两种光环交织，灼烧并吸取周围敌人的生命。',
    enDesc: 'Two auras intertwined: burning foes while draining their life.',
    main: 'curry_aura',
    sub: 'garlic_aura',
    items: 2,
    tint: 0xffb703,
    over: { effect: { burn: { dps: 3, dur: 2 }, lifeSteal: 4 } },
  },
  {
    id: 'thunder_orchard',
    name: '雷霆果园',
    en: 'Thunder Orchard',
    desc: '西兰花与柠檬电池串联，闪电跳得更远还会眩晕。',
    enDesc: 'Broccoli wired to a lemon battery: lightning leaps further and stuns.',
    main: 'broccoli_staff',
    sub: 'lemon_battery',
    items: 3,
    tint: 0xffd60a,
    over: { effect: { chain: [3, 4, 5, 7], stun: 0.3 } },
  },
  {
    id: 'frost_cleaver',
    name: '霜刃剁骨刀',
    en: 'Frost Cleaver',
    desc: '冻进刀身的寒气，每一斩都让敌人迟滞。',
    enDesc: 'Cold forged into the blade; every swing slows.',
    main: 'cleaver',
    sub: 'icecream_hammer',
    items: 2,
    tint: 0x90e0ef,
    over: { effect: { slow: { pct: 45, dur: 1.5 } } },
  },
  {
    id: 'toxic_gatling',
    name: '毒雾加特林',
    en: 'Toxic Gatling',
    desc: '酱料加特林灌满毒雾，弹雨所过之处无人站立。',
    enDesc: 'A sauce gatling loaded with toxin: nothing stands in the spray.',
    main: 'sauce_gatling',
    sub: 'miasma_sprayer',
    items: 3,
    tint: 0x9d4edd,
    over: { effect: { poison: { stacks: 1, dur: 3 } } },
  },
  {
    id: 'inferno_mortar',
    name: '炎狱迫击炮',
    en: 'Inferno Mortar',
    desc: '果酱迫击炮混入烧烤酱，落点变成一片火海。',
    enDesc: 'Jam mortar laced with BBQ sauce: impact becomes an inferno.',
    main: 'jam_mortar',
    sub: 'bbq_sauce_cannon',
    items: 3,
    tint: 0xd00000,
    over: { effect: { explode: 120, burn: { dps: 5, dur: 3 } } },
  },
  {
    id: 'storm_whisk_pan',
    name: '雷霆铁壁锅',
    en: 'Storm Bastion Pan',
    desc: '平底锅焊上电打蛋器，拍下去连人带甲一起电晕。',
    enDesc: 'A pan welded to an electric whisk: stuns armor and all.',
    main: 'pan',
    sub: 'shock_wok',
    items: 2,
    tint: 0xffea00,
    over: { effect: { stun: 0.7 } },
  },
  {
    id: 'railgun_sniper',
    name: '电磁蓝莓狙',
    en: 'Railgun Sniper',
    desc: '蓝莓狙击枪接上电磁核心，一枪贯穿整列。',
    enDesc: 'A blueberry sniper with a rail core: one shot, one line.',
    main: 'blueberry_sniper',
    sub: 'pea_sniper',
    items: 3,
    tint: 0x3a0ca3,
    over: { pierce: [5, 6, 7, 8] },
  },
  {
    id: 'honey_frost_aura',
    name: '蜜霜结界',
    en: 'Honeyfrost Field',
    desc: '蜂蜜与寒霜混成的黏腻结界，敌人又慢又虚。',
    enDesc: 'Honey and frost in one sticky field: slow and weakened.',
    main: 'honey_aura',
    sub: 'frost_aura',
    items: 2,
    tint: 0xcaf0f8,
    over: { effect: { slow: { pct: 45, dur: 1.2 } } },
  },
  {
    id: 'spore_minefield',
    name: '孢子雷区',
    en: 'Spore Minefield',
    desc: '毒蘑菇雷与胡椒雷混埋，炸开一地毒雾。',
    enDesc: 'Toadstool and pepper mines laid together: a field of toxic blasts.',
    main: 'toadstool_mine',
    sub: 'pepper_mine',
    items: 3,
    tint: 0x7b2cbf,
    over: { effect: { explode: 165, poison: { stacks: 2, dur: 4 } } },
  },
  {
    id: 'candy_shotgun',
    name: '糖果霰弹枪',
    en: 'Candy Scattergun',
    desc: '一次喷出满膛硬糖，近距离摧枯拉朽。',
    enDesc: 'A chamber full of hard candy, devastating up close.',
    main: 'grape_shotgun',
    sub: 'macaron_gun',
    items: 2,
    tint: 0xffafcc,
    over: { count: [6, 6, 7, 8] },
  },
  {
    id: 'dragon_breath_flame',
    name: '龙息喷流',
    en: 'Dragon Breath',
    desc: '火锅吐息混进芥末，喷出又远又烫的烈焰。',
    enDesc: 'Hotpot breath spiked with mustard: a longer, hotter flame.',
    main: 'hotpot_breath',
    sub: 'mustard_flamer',
    items: 2,
    tint: 0xff4800,
    over: { effect: { burn: { dps: 6, dur: 3 } } },
  },
  {
    id: 'coconut_quake_mace',
    name: '椰雷流星锤',
    en: 'Coconut Quake Mace',
    desc: '椰子炮的弹药绑在流星锤上，砸地就是一声巨响。',
    enDesc: 'Coconut shells strapped to a mace: each slam booms.',
    main: 'pineapple_mace',
    sub: 'coconut_cannon',
    items: 3,
    tint: 0x7f5539,
    over: { effect: { explode: 120 } },
  },
  {
    id: 'anise_frost_storm',
    name: '霜星八角',
    en: 'Frost Anise Storm',
    desc: '八角飞镖裹上冰霜，绕场一圈冻住所有人。',
    enDesc: 'Anise stars sheathed in frost, chilling everything on the way back.',
    main: 'star_anise_shuriken',
    sub: 'icicle_volley',
    items: 2,
    tint: 0x48cae4,
    over: { effect: { slow: { pct: 40, dur: 1.5 } }, count: [2, 2, 3, 3] },
  },
  {
    id: 'holy_salt_barrier',
    name: '圣盐结界',
    en: 'Holy Salt Barrier',
    desc: '海盐与薄荷交织的锋利结界，切割并减速周身敌人。',
    enDesc: 'Sea salt and mint in a razor field that cuts and slows.',
    main: 'salt_aura',
    sub: 'mint_aura',
    items: 2,
    tint: 0xf8f9fa,
    over: { effect: { slow: { pct: 30, dur: 1 } }, critBonus: 12 },
  },
];

// ---------------- 自动生成的融合 T4 ----------------
// 规则：每把 T3 武器至少有 2 条通往 T4 的配方（自己的精炼 1 条 + 至少 1 条融合），每把 T4 的配方唯一。
// 手工设计的 16 条不够覆盖，按「每把基础武器至少参与 1 条融合」自动配对补齐；
// 名字 = 副武器带来的主题前缀 + 主武器名（如「烈焰菜刀」），主武器决定攻击方式，副武器带来特效。

/** 副武器主题 → 名字前缀 [中, 英]；按这个顺序挑主武器还没有的主题 */
const FUSE_ADJ: [string, string, string][] = [
  ['火焰', '烈焰', 'Blazing'],
  ['雷电', '雷霆', 'Thunder'],
  ['冰霜', '霜寒', 'Frost'],
  ['毒气', '剧毒', 'Toxic'],
  ['爆破', '爆裂', 'Explosive'],
  ['连锁', '连环', 'Chain'],
  ['穿透', '贯穿', 'Piercing'],
  ['多重射击', '散射', 'Scatter'],
  ['暴击', '致命', 'Lethal'],
  ['持续伤害', '蚀骨', 'Searing'],
  ['元素', '元素', 'Elemental'],
  ['甜点', '糖霜', 'Candied'],
  ['酱料', '酱爆', 'Saucy'],
  ['蔬果', '鲜果', 'Fresh'],
  ['锋利', '锐锋', 'Keen'],
  ['钝器', '重击', 'Heavy'],
  ['枪械', '连发', 'Rapid'],
  ['厨具', '主厨', "Chef's"],
  ['光环', '领域', 'Field'],
];
const cssToNum = (c: string) => parseInt(c.replace('#', ''), 16);
/** 每把基础武器至少参与几条融合（加上自己的精炼，T3 → T4 的路就有 FUSE_MIN + 1 条） */
export const FUSE_MIN = 1;

interface AutoFuse {
  id: string;
  main: string;
  sub: string;
  /** 前缀所在的 FUSE_ADJ 下标；-1 表示同前缀已被占用，名字后面带副武器名区分 */
  adj: number;
  dup: boolean;
}

/** 自动配对：让每把基础武器至少出现在 1 条融合配方里（手工配方也算） */
function autoFusePairs(): AutoFuse[] {
  const base = WEAPONS.filter((w) => !w.evolvedFrom && !w.minTier);
  const uses = new Map<string, number>(base.map((w) => [w.id, 0]));
  const pairs = new Set<string>();
  const key = (a: string, b: string) => [a, b].sort().join('|');
  for (const f of FUSE_SPECS) {
    uses.set(f.main, (uses.get(f.main) ?? 0) + 1);
    uses.set(f.sub, (uses.get(f.sub) ?? 0) + 1);
    pairs.add(key(f.main, f.sub));
  }
  // 需要补的材料位（按 id 的哈希打散，配出来的组合不会全是同一类）
  const slots: string[] = [];
  for (const w of [...base].sort((a, b) => hash(a.id) - hash(b.id))) for (let i = uses.get(w.id) ?? 0; i < FUSE_MIN; i++) slots.push(w.id);
  const tmpl = (id: string) => WEAPON_MAP[id].template ?? id;
  const out: [string, string][] = [];
  while (slots.length) {
    const a = slots.shift()!;
    // 优先找模板不同（攻击方式不一样）、还没配过的；实在没有就和任意一把基础武器配
    let j = slots.findIndex((b) => b !== a && !pairs.has(key(a, b)) && tmpl(b) !== tmpl(a));
    if (j < 0) j = slots.findIndex((b) => b !== a && !pairs.has(key(a, b)));
    let b: string;
    if (j >= 0) b = slots.splice(j, 1)[0];
    else b = base.map((w) => w.id).find((id) => id !== a && !pairs.has(key(a, id)) && tmpl(id) !== tmpl(a))!;
    pairs.add(key(a, b));
    // 主武器：两把里伤害类型更「主动」的一把（光环当副武器更自然），其余按哈希
    const [main, sub] = WEAPON_MAP[a].kind === 'aura' && WEAPON_MAP[b].kind !== 'aura' ? [b, a] : [a, b];
    out.push([main, sub]);
  }
  // 起名：副武器有、主武器没有的主题，按 FUSE_ADJ 顺序取第一个没和同一把主武器撞名的
  const usedName = new Set(FUSE_SPECS.map((f) => f.name));
  return out.map(([main, sub]) => {
    const mt = new Set(weaponTags(WEAPON_MAP[main]));
    const st = weaponTags(WEAPON_MAP[sub]);
    const cand = FUSE_ADJ.map((x, i) => i).filter((i) => st.includes(FUSE_ADJ[i][0]) && !mt.has(FUSE_ADJ[i][0]));
    const all = cand.length ? cand : FUSE_ADJ.map((x, i) => i).filter((i) => st.includes(FUSE_ADJ[i][0]));
    let adj = all.find((i) => !usedName.has(FUSE_ADJ[i][1] + WEAPON_MAP[main].name)) ?? -1;
    const dup = adj < 0;
    if (dup) adj = all[0] ?? 0;
    usedName.add(FUSE_ADJ[adj][1] + WEAPON_MAP[main].name + (dup ? `·${WEAPON_MAP[sub].name}` : ''));
    return { id: `fz_${main}_${sub}`, main, sub, adj, dup };
  });
}

const AUTO_FUSE = autoFusePairs();
const autoName = (f: AutoFuse) => FUSE_ADJ[f.adj][1] + WEAPON_MAP[f.main].name + (f.dup ? `·${WEAPON_MAP[f.sub].name}` : '');
const AUTO_SPECS: FuseSpec[] = AUTO_FUSE.map((f) => ({
  id: f.id,
  name: autoName(f),
  en: '',
  desc: `把${WEAPON_MAP[f.sub].name}熔进${WEAPON_MAP[f.main].name}：保留${WEAPON_MAP[f.main].name}的攻击方式，同时带上两把武器的特效。`,
  enDesc: '',
  main: f.main,
  sub: f.sub,
  items: 2,
  tint: cssToNum(TAG_MAP[FUSE_ADJ[f.adj][0]]?.color ?? '#ffd166'),
}));

/** 自动融合武器的英文名（需要基础武器的英文名，由 i18n 传进来） */
export function autoFuseEn(enName: (id: string) => string): Record<string, { name: string; desc: string }> {
  return Object.fromEntries(
    AUTO_FUSE.map((f) => [
      f.id,
      {
        name: `${FUSE_ADJ[f.adj][2]} ${enName(f.main)}${f.dup ? ` · ${enName(f.sub)}` : ''}`,
        desc: `${enName(f.sub)} forged into ${enName(f.main)}: keeps its attack style and carries both weapons' effects.`,
      },
    ]),
  );
}

/** 全部融合配方：手工 16 条 + 自动生成 */
const ALL_FUSE_SPECS: FuseSpec[] = [...FUSE_SPECS, ...AUTO_SPECS];

/** 融合武器数据：主武器的攻击方式 + 两把的数值融合（伤害取高者 ×1.1，成长系数相加 ×0.6） */
export const FUSED_WEAPONS: WeaponDef[] = ALL_FUSE_SPECS.map((f) => {
  const a = WEAPON_MAP[f.main];
  const b = WEAPON_MAP[f.sub];
  if (!a || !b) throw new Error(`recipes: 融合材料不存在 ${f.main} / ${f.sub}`);
  const scaling: WeaponDef['scaling'] = {};
  for (const k of [...Object.keys(a.scaling), ...Object.keys(b.scaling)] as (keyof WeaponDef['scaling'])[])
    scaling[k] = Math.round(((a.scaling[k] ?? 0) + (b.scaling[k] ?? 0)) * 0.6 * 100) / 100;
  return {
    ...a,
    id: f.id,
    name: f.name,
    desc: f.desc,
    tags: [...new Set([...a.tags, ...b.tags, ...(f.tags ?? [])])].slice(0, 3),
    damage: a.damage.map((d, i) => Math.round(Math.max(d, b.damage[i]) * 1.1)),
    cooldown: a.cooldown.map((c, i) => Math.round(Math.min(c, b.cooldown[i]) * 100) / 100),
    range: Math.round(Math.max(a.range, b.range) * 1.05),
    scaling,
    critMult: Math.max(a.critMult, b.critMult),
    critBonus: Math.max(a.critBonus ?? 0, b.critBonus ?? 0) || undefined,
    effect: { ...a.effect, ...b.effect, ...f.over?.effect },
    price: Math.round(Math.max(a.price, b.price) * 1.3),
    minTier: 3,
    template: a.template ?? a.id,
    projTint: f.tint,
    evolvedFrom: undefined,
    ...f.over,
  };
});

export const FUSED_WEAPONS_EN = Object.fromEntries(FUSE_SPECS.map((f) => [f.id, { name: f.en, desc: f.enDesc }]));
export const FUSED_WEAPON_ART: Record<string, [base: string, tint: number]> = Object.fromEntries(
  ALL_FUSE_SPECS.map((f) => [f.id, [WEAPON_MAP[f.main]?.template ?? f.main, f.tint]]),
);

// ---------------- 超武配方：两把 T4 + 原催化道具 + 其他道具 ----------------
/** 超武的第二把 T4 材料（没指定时用同一把，即两把同名 T4） */
const SUPER_SECOND: Record<string, string> = {
  paoding_blade: 'sushi_blade',
  dragon_cleaver: 'cleaver',
  hell_trident: 'volt_fork',
  titan_pin: 'candy_cane',
  iron_bastion_pan: 'shock_wok',
  melon_quake: 'coconut_cannon',
  pea_gatling: 'blast_pea_cannon',
  ketchup_flood: 'hot_sauce_gun',
  devil_missile: 'inferno_mortar',
  thor_whisk: 'mixer_storm',
  vampire_garlic: 'curry_garlic_field',
  blueberry_railgun: 'railgun_sniper',
  golden_corn: 'corn_scatter',
  anise_storm: 'anise_frost_storm',
  storm_broccoli: 'thunder_orchard',
  mustard_dragon: 'dragon_breath_flame',
  pepper_minefield: 'spore_minefield',
  tsunami_katana: 'sushi_twin_blade',
  tornado_blender: 'blade_aura',
  umami_bomb: 'ember_mine',
};

function buildRecipes(): Recipe[] {
  const out: Recipe[] = [];
  // 精炼 T4：每把基础武器一条
  for (const w of WEAPONS) {
    if (w.evolvedFrom || w.minTier) continue;
    out.push({
      to: w.id,
      kind: 't4',
      from: [
        [w.id, 2],
        [w.id, 2],
      ],
      items: pickItems(w, 1),
    });
  }
  // 融合 T4（手工 + 自动生成）
  for (const f of ALL_FUSE_SPECS) {
    const def = FUSED_WEAPONS.find((w) => w.id === f.id)!;
    out.push({
      to: f.id,
      kind: 't4',
      from: [
        [f.main, 2],
        [f.sub, 2],
      ],
      items: pickItems(def, f.items, 'fuse'),
    });
  }
  // 超武：两把 T4（进化前那把 + 指定的第二把）+ 催化道具 + 1 件传说道具
  for (const e of EVOLUTIONS) {
    const def = e.to;
    const second = SUPER_SECOND[def.id] ?? e.from;
    // 超武：两把 T4 已经够难，传说道具只要 1 件（2~3 件时全量测试里超武一次都拿不到）
    const extra = 1;
    // 超武：原催化道具 + 指定的 T4（传说）道具
    const items = [[e.item], ...pickItems(def, extra, 'super', [e.item], SUPER_ITEM_RARITY)];
    out.push({
      to: def.id,
      kind: 'super',
      from: [
        // 超武：两把都要 T4
        [e.from, 3],
        [second, 3],
      ],
      items,
    });
  }
  return out;
}

// 融合武器并入武器表（供商店弹窗、图鉴、手持图等按 id 查找）
registerWeapons(FUSED_WEAPONS);

export const RECIPES: Recipe[] = buildRecipes();
export const RECIPE_BY_TO: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.to, r]));
/** 这把武器（在该品质下）参与的配方 */
export function recipesUsing(id: string, tier: number): Recipe[] {
  return RECIPES.filter((r) => r.from.some(([w, t]) => w === id && t === tier));
}
/** 逐槽分配持有的道具；返回每个槽实际用掉的道具 id（null = 这个槽没凑齐） */
export function itemPicks(r: Recipe, owned: Record<string, number>): (string | null)[] {
  const left = { ...owned };
  // 先分配可选项少的槽（催化道具只有一个选项），避免被通用槽抢走
  const order = r.items.map((slot, i) => ({ slot, i })).sort((a, b) => a.slot.length - b.slot.length);
  const out: (string | null)[] = r.items.map(() => null);
  for (const { slot, i } of order) {
    const pick = slot.find((id) => (left[id] ?? 0) > 0);
    if (pick) {
      left[pick]--;
      out[i] = pick;
    }
  }
  return out;
}
/**
 * 商店补货用：「快要能合成」的配方里还缺的道具——每一把材料武器都已到手（同名、品质 ≥ 要求 − 1），
 * 且至少一把已经达到要求品质。超武配方排在最前，其次是契合当前角色的配方。
 * （条件放宽到「有其中一把」时，商店会不停上架史诗 / 传说道具，这些道具本身就很强，实测让第 6 章通关率翻倍）
 */
export function wantedRecipeItems(
  weapons: { id: string; tier: number }[],
  items: Record<string, number>,
  favored: (to: string) => boolean = () => false,
): string[] {
  const out: string[] = [];
  const near = (r: Recipe): boolean => {
    const pool = [...weapons];
    let exact = false;
    for (const [id, t] of r.from) {
      // 先找达到要求品质的，再找差一级的；同一把武器不能顶两个材料位
      let i = pool.findIndex((w) => w.id === id && w.tier >= t);
      if (i >= 0) exact = true;
      else i = pool.findIndex((w) => w.id === id && w.tier === t - 1);
      if (i < 0) return false;
      pool.splice(i, 1);
    }
    return exact;
  };
  // 超武配方排最前（凑齐两把 T4 已经很难，补货优先给它，但补货概率不变），其次是契合武器的配方
  const rank = (r: Recipe): number => (r.kind === 'super' ? 2 : 0) + (favored(r.to) ? 1 : 0);
  const rs = RECIPES.filter(near).sort((a, b) => rank(b) - rank(a));
  for (const r of rs) for (const i of missingItems(r, items)) for (const id of r.items[i]) if (!out.includes(id)) out.push(id);
  return out;
}

/** 配方还缺几个道具槽 */
export function missingItems(r: Recipe, owned: Record<string, number>): number[] {
  return itemPicks(r, owned)
    .map((p, i) => (p === null ? i : -1))
    .filter((i) => i >= 0);
}
/** 某个道具槽的说明（界面用）：少量选项列全名，多的写「系列 · N 选 1」 */
export function slotLabel(slot: string[]): string {
  if (slot.length <= 2) return slot.map((i) => ITEM_MAP[i]?.name ?? i).join(tx(' 或 ', ' or '));
  const series = ITEM_MAP[slot[0]]?.series;
  return series ? tx(`${series}系列任意 1 件`, `any 1 from ${series}`) : tx(`${slot.length} 选 1`, `any 1 of ${slot.length}`);
}

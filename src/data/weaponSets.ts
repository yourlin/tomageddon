// 武器套装：每个套装由一组「指定武器」组成（设计见 docs/design/WEAPON_SETS.md）。
// 计数：武器栏里持有的不同成员武器数（同名重复只算 1 件；仓库里的不算；超武是另一把武器，不属于任何套装）。
// bonus 的键是件数档位（2 件 / 3 件 / 全套），达到的最高一档生效。
import type { StatMods } from './stats';

export interface WeaponSet {
  id: string;
  name: [string, string];
  members: string[];
  bonus: Record<number, StatMods>;
}

const set = (id: string, zh: string, en: string, members: string[], bonus: Record<number, StatMods>): WeaponSet => ({
  id,
  name: [zh, en],
  members,
  bonus,
});

export const WEAPON_SETS: WeaponSet[] = [
  set('home_kitchen', '家常厨具', 'Home Kitchen', ['knife', 'pan', 'ladle', 'spatula'], {
    2: { melee: 2 },
    3: { melee: 3, armor: 1 },
    4: { melee: 5, armor: 3 },
  }),
  set('baker', '烘焙师', 'Baker', ['rolling_pin', 'whisk_spin', 'baguette_sword'], {
    2: { attackSpeed: 5 },
    3: { attackSpeed: 10, maxHp: 5 },
  }),
  set('butcher', '屠夫铺', 'Butcher Shop', ['cleaver', 'meat_tenderizer', 'twin_cleavers'], { 2: { crit: 5 }, 3: { crit: 12, armor: 2 } }),
  set('knife_master', '刀工大师', 'Knife Master', ['sushi_blade', 'mandoline', 'grater_sweep', 'kitchen_scissors'], {
    2: { crit: 5 },
    3: { crit: 10 },
    4: { crit: 15, attackSpeed: 5 },
  }),
  set('bbq_stall', '烧烤摊', 'BBQ Stall', ['skewer', 'bbq_skewer', 'bbq_torch', 'bbq_sauce_cannon'], {
    2: { lifeSteal: 2 },
    3: { lifeSteal: 4 },
    4: { lifeSteal: 6, melee: 3 },
  }),
  set('charcoal', '炭火炉', 'Charcoal Grill', ['charcoal_aura', 'ember_mine', 'coal_tongs'], {
    2: { elemental: 1 },
    3: { elemental: 3, explodeSize: 15 },
  }),
  set('garden_guard', '菜园卫士', 'Garden Guard', ['slingshot', 'pea_shooter', 'carrot_crossbow', 'asparagus_bow'], {
    2: { ranged: 2 },
    3: { ranged: 3, range: 20 },
    4: { ranged: 5, range: 40 },
  }),
  set('seed_battery', '种子炮兵', 'Seed Battery', ['bean_bazooka', 'pea_sniper', 'seed_spitter'], {
    2: { range: 30 },
    3: { range: 60, attackSpeed: 5 },
  }),
  set('corn_harvest', '玉米大丰收', 'Corn Harvest', ['corn_scatter', 'corn_cannon', 'popcorn_machine'], {
    2: { ranged: 2 },
    3: { ranged: 4, dodge: 5 },
  }),
  set('demolition', '爆破专家', 'Demolition Crew', ['cherry_bomb', 'melon_grenade', 'potato_mine', 'coconut_cannon'], {
    2: { explodeSize: 8 },
    3: { explodeSize: 15 },
    4: { explodeSize: 25, ranged: 2 },
  }),
  set('mortar', '迫击炮阵地', 'Mortar Line', ['jam_mortar', 'pumpkin_mortar', 'glacier_mortar'], {
    2: { explodeSize: 10 },
    3: { explodeSize: 20, range: 40 },
  }),
  set('ice_shop', '冰品店', 'Ice Parlor', ['popsicle_blade', 'icecream_hammer', 'shaved_ice_gun', 'slush_spray'], {
    2: { dodge: 3 },
    3: { dodge: 6 },
    4: { dodge: 10, speed: 5 },
  }),
  set('patissier', '甜点师', 'Pâtissier', ['macaron_gun', 'donut_ring', 'candy_cane', 'choco_mine'], {
    2: { luck: 5 },
    3: { luck: 10 },
    4: { luck: 15, harvest: 10 },
  }),
  set('zap_snacks', '电击零食铺', 'Zap Snack Shop', ['popping_candy', 'cola_zapper', 'toaster_zap'], {
    2: { elemental: 1 },
    3: { elemental: 3, attackSpeed: 5 },
  }),
  set('volt_kitchen', '雷电厨房', 'Volt Kitchen', ['lightning_whisk', 'shock_wok', 'grill_arc', 'rice_cooker_aura'], {
    2: { elemental: 1 },
    3: { elemental: 2 },
    4: { elemental: 4, attackSpeed: 5 },
  }),
  set('mushroom_grove', '菌菇林', 'Mushroom Grove', ['spore_sprayer', 'toxic_spike', 'spore_cannon', 'toadstool_mine'], {
    2: { elemental: 1 },
    3: { elemental: 2, regen: 1 },
    4: { elemental: 4, regen: 2 },
  }),
  set('sauce_king', '酱料王', 'Sauce King', ['ketchup', 'soy_pistol', 'hot_sauce_gun', 'mustard_flamer'], {
    2: { lifeSteal: 2 },
    3: { lifeSteal: 4 },
    4: { lifeSteal: 8, ranged: 2 },
  }),
  set('aura_master', '光环大师', 'Aura Master', ['garlic_aura', 'curry_aura', 'frost_aura', 'salt_aura'], {
    2: { auraPct: 10 },
    3: { auraPct: 20 },
    4: { auraPct: 30, auraSize: 15 },
  }),
  set('shuriken', '飞镖忍者', 'Shuriken Ninja', ['star_anise_shuriken', 'cumin_star', 'chili_shuriken', 'knife_case'], {
    2: { crit: 5 },
    3: { crit: 10 },
    4: { crit: 15, speed: 5 },
  }),
  set('boomerang', '回旋高手', 'Boomerang Ace', ['onion_boomerang', 'pizza_cutter', 'mycelium_boomerang'], {
    2: { range: 20 },
    3: { range: 50, attackSpeed: 5 },
  }),
  set('fruit_hammer', '水果重锤', 'Fruit Hammers', ['watermelon_hammer', 'pineapple_mace', 'coconut_gloves'], {
    2: { maxHp: 3 },
    3: { maxHp: 8, armor: 2 },
  }),
  set('frost_mage', '冰霜法师', 'Frost Mage', ['ice_cube_tray', 'icicle_volley', 'mint_frost_mine'], {
    2: { elemental: 1 },
    3: { elemental: 3, dodge: 5 },
  }),
  set('tableware', '餐具三件套', 'Tableware Trio', ['fork', 'chopsticks', 'plate_frisbee'], {
    2: { attackSpeed: 3 },
    3: { attackSpeed: 8, melee: 2 },
  }),
];

export const SET_MAP: Record<string, WeaponSet> = Object.fromEntries(WEAPON_SETS.map((s) => [s.id, s]));

/** 这把武器所属的套装（大多数 1 个，最多 2 个；超武与没被收录的武器为空） */
export function setsOf(weaponId: string): WeaponSet[] {
  return WEAPON_SETS.filter((s) => s.members.includes(weaponId));
}

/** 套装档位（升序） */
export const setTiers = (s: WeaponSet): number[] =>
  Object.keys(s.bonus)
    .map(Number)
    .sort((a, b) => a - b);

/** 当前件数达到的最高档（没达到返回 null） */
export function activeTier(s: WeaponSet, n: number): number | null {
  return (
    setTiers(s)
      .filter((k) => n >= k)
      .pop() ?? null
  );
}

/** 各套装当前件数：武器栏里不同的成员武器数 */
export function countSets(weaponIds: string[]): Record<string, number> {
  const held = new Set(weaponIds);
  const out: Record<string, number> = {};
  for (const s of WEAPON_SETS) {
    const n = s.members.filter((m) => held.has(m)).length;
    if (n) out[s.id] = n;
  }
  return out;
}

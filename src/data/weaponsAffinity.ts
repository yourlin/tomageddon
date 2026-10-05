// 1.4.0 契合武器改版：为「主题沾边但没有合适武器」的角色新做的 4 把武器。
// 只放纯数据；合并进 WEAPONS（weapons.ts）、英文覆盖（i18n/en/misc.ts）、手持图（art/WeaponArt.ts）。
import type { WeaponDef } from './weapons';
import type { WeaponsEn } from '../i18n/types';

export const AFFINITY_WEAPONS: WeaponDef[] = [
  {
    id: 'pumpkin_lantern',
    name: '南瓜鬼火灯',
    desc: '提着南瓜灯放出慢悠悠的鬼火，会自己追着敌人飘，还能穿过敌人。',
    cls: 'elemental',
    kind: 'bullet',
    tags: ['蔬果', '元素'],
    damage: [9, 15, 24, 37],
    cooldown: [0.8, 0.75, 0.7, 0.62],
    range: 420,
    scaling: { elemental: 0.85 },
    critMult: 1.8,
    projSpeed: 300,
    pierce: [1, 1, 2, 3],
    homing: 4,
    projKey: 'proj_dragonfruit_orb',
    projTint: 0xff9f1c,
    price: 24,
  },
  {
    id: 'spore_sprayer',
    name: '孢子喷壶',
    desc: '喷出毒孢子团，命中使敌人中毒，并裂成两颗小孢子继续飞。',
    cls: 'elemental',
    kind: 'bullet',
    tags: ['蔬果', '元素'],
    damage: [5, 8, 13, 20],
    cooldown: [0.7, 0.65, 0.6, 0.54],
    range: 330,
    scaling: { elemental: 0.7 },
    critMult: 1.5,
    projSpeed: 520,
    splitShots: 1,
    effect: { poison: { stacks: 1, dur: 4 } },
    projKey: 'proj_grape_shotgun',
    projTint: 0x9d4edd,
    price: 22,
  },
  {
    id: 'coconut_gloves',
    name: '椰壳拳套',
    desc: '椰壳做的拳套，短距离快速出拳，击退敌人。',
    cls: 'melee',
    kind: 'thrust',
    tags: ['蔬果'],
    damage: [5, 9, 14, 22],
    cooldown: [0.42, 0.4, 0.37, 0.34],
    range: 95,
    scaling: { melee: 0.85 },
    critMult: 1.8,
    knockback: 14,
    price: 20,
  },
  {
    id: 'asparagus_bow',
    name: '芦笋长弓',
    desc: '修长的芦笋弓，射程很远，箭矢能连穿多个敌人。',
    cls: 'ranged',
    kind: 'bullet',
    tags: ['蔬果'],
    damage: [14, 24, 37, 56],
    cooldown: [1.1, 1.04, 0.97, 0.88],
    range: 520,
    scaling: { ranged: 1.1 },
    critMult: 2.2,
    critBonus: 5,
    projSpeed: 950,
    pierce: [2, 3, 3, 4],
    projKey: 'proj_carrot_crossbow',
    projTint: 0x80b918,
    price: 26,
  },
];

export const AFFINITY_WEAPONS_EN: WeaponsEn = {
  pumpkin_lantern: {
    name: 'Pumpkin Lantern',
    desc: 'Releases slow will-o-wisps from a jack-o-lantern. They home in on enemies and pass through them.',
  },
  spore_sprayer: {
    name: 'Spore Sprayer',
    desc: 'Sprays toxic spore clumps that Poison on hit and burst into two smaller spores.',
  },
  coconut_gloves: { name: 'Coconut Gloves', desc: 'Coconut-shell gloves: rapid short-range punches that knock enemies back.' },
  asparagus_bow: { name: 'Asparagus Longbow', desc: 'A long, slender asparagus bow with great range; arrows pierce several enemies.' },
};

/** 手持图：[基于哪把现有武器的绘制, 染色]（同 gearExtra 的 EXTRA_WEAPON_ART） */
export const AFFINITY_WEAPON_ART: Record<string, [base: string, tint: number]> = {
  pumpkin_lantern: ['honey_blaster', 0xf77f00],
  spore_sprayer: ['pepper_spray', 0x9d4edd],
  coconut_gloves: ['meat_tenderizer', 0x7f5539],
  asparagus_bow: ['carrot_crossbow', 0x80b918],
};

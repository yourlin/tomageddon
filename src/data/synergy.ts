// 双契合（docs/design/DOUBLE_SYNERGY.md）：角色的两个契合标签武器都带时，强化的是武器本身——
//  · 武器契合技：按攻击方式的默认契合技（KIND_SKILL），专属武器 / 主题超武有自己的契合技（BESPOKE）；
//  · 标签特性强化：角色的两个契合标签各给武器加一档对应特性（TAG_TRAIT）。
// 这里只放说明文字与「武器 → 契合技」的对照表；效果实现见 systems/Synergy.ts 与 systems/Talents.ts。
import type { WeaponDef, WeaponKind } from './weapons';
import { lang } from '../i18n';

type Txt = [zh: string, en: string];
const pick = (t: Txt): string => t[lang === 'en' ? 1 : 0];

/** 按攻击方式的默认契合技 */
export const KIND_SKILL: Record<WeaponKind, { name: Txt; desc: Txt }> = {
  thrust: {
    name: ['气刃', 'Air Blade'],
    desc: ['每第 3 次刺击，向前多射出一道穿透气刃（60% 伤害）', 'Every 3rd thrust also fires a piercing air blade (60% dmg)'],
  },
  sweep: { name: ['回旋斩', 'Whirlwind'], desc: ['每第 4 次横扫变成 360° 回旋斩', 'Every 4th sweep becomes a 360° whirlwind'] },
  bullet: {
    name: ['强化弹', 'Power Shot'],
    desc: ['每第 5 发变成大号强化弹（伤害 ×2，穿透 +2）', 'Every 5th shot is a power shot (×2 dmg, +2 pierce)'],
  },
  rocket: {
    name: ['子母弹', 'Cluster Bomb'],
    desc: ['爆炸后再散出 3 颗小炸弹（各 30% 伤害）', 'Explosions scatter 3 bomblets (30% dmg each)'],
  },
  flame: {
    name: ['余烬', 'Embers'],
    desc: ['每第 3 次喷射，在目标处留下 2 秒燃烧地带', 'Every 3rd spray leaves a 2s burning patch at the target'],
  },
  aura: {
    name: ['脉冲', 'Pulse'],
    desc: ['每 4 秒向外脉冲一次：范围 ×1.5，造成一次伤害并击退', 'Pulses every 4s: ×1.5 radius, one hit with knockback'],
  },
  mine: { name: ['余震', 'Aftershock'], desc: ['爆炸后 0.5 秒原地再炸一次（50% 伤害）', 'Explodes again 0.5s later (50% dmg)'] },
  boomerang: {
    name: ['回程分裂', 'Return Split'],
    desc: ['飞到半程时分裂出 2 枚小镖（各 35% 伤害）', 'Splits off 2 small blades midway (35% dmg each)'],
  },
  chain: { name: ['回流', 'Backflow'], desc: ['连锁结束时，最后一个敌人再被电一次', 'The last enemy in the chain is zapped once more'] },
};

/** 专属契合技（替代默认契合技） */
export type BespokeKey =
  | 'sauceZone'
  | 'lanceCharge'
  | 'chiliCluster'
  | 'popcornRing'
  | 'melonQuake'
  | 'acidSplash'
  | 'broccoliTree'
  | 'garlicDrain'
  | 'wispBounce'
  | 'macaronBurst'
  | 'aniseShatter'
  | 'onionPeel'
  | 'sporeCloud'
  | 'fistWave'
  | 'grapeTrick'
  | 'cherryRamp'
  | 'peaSprout'
  | 'honeyStick'
  | 'dragonBreath'
  | 'bloodRage'
  | 'tripleArrow'
  | 'yamDrop'
  | 'truthMark'
  | 'redEnvelope'
  | 'stinkBurst'
  | 'extraDrone'
  | 'zenSweep'
  | 'iceShatter'
  | 'beanPop'
  | 'knifeStick'
  | 'seedBurst'
  | 'taroWard'
  | 'panGuard'
  | 'curseSpread';

export const BESPOKE_SKILL: Record<BespokeKey, { name: Txt; desc: Txt }> = {
  sauceZone: {
    name: ['番茄酱地', 'Ketchup Puddle'],
    desc: ['每第 3 次射击，在目标处留下 3 秒酱汁：减速并持续灼伤', 'Every 3rd shot leaves a 3s ketchup puddle that slows and burns'],
  },
  lanceCharge: {
    name: ['骑士突击', 'Knight Charge'],
    desc: ['每第 3 次突刺多射出一道气刃，并把沿途敌人远远顶开', 'Every 3rd thrust fires an air blade that shoves enemies far back'],
  },
  chiliCluster: {
    name: ['辣椒雨', 'Chili Rain'],
    desc: ['爆炸后溅出 4 颗小辣椒，落地再炸', 'Explosions spill 4 little chilies that blow up again'],
  },
  popcornRing: {
    name: ['爆米花', 'Popcorn'],
    desc: ['每第 3 发在目标处爆出一圈 8 颗爆米花弹', 'Every 3rd shot bursts into a ring of 8 popcorn kernels'],
  },
  melonQuake: {
    name: ['瓜汁震波', 'Melon Quake'],
    desc: ['每第 4 锤震出一圈西瓜汁震波（35% 伤害），减速周围敌人', 'Every 4th smash sends out a juice shockwave (35% dmg) that slows'],
  },
  acidSplash: {
    name: ['酸液', 'Acid Splash'],
    desc: ['每第 3 次刺击溅出酸液，削弱目标周围敌人的护甲', 'Every 3rd stab splashes acid that breaks armor around the target'],
  },
  broccoliTree: {
    name: ['西兰花树', 'Broccoli Tree'],
    desc: [
      '每第 3 次放电，在最后一个敌人处长出西兰花，3 秒内持续放电',
      'Every 3rd zap grows a broccoli at the last enemy that zaps for 3s',
    ],
  },
  garlicDrain: {
    name: ['蒜香吸血', 'Garlic Drain'],
    desc: ['光环杀死敌人时回复 1 生命（每秒最多 3 次）', 'Aura kills heal 1 HP (max 3 per second)'],
  },
  wispBounce: { name: ['鬼火绕行', 'Wisp Weave'], desc: ['鬼火命中后不消失，弹射 +2', 'Wisps linger after a hit: +2 bounces'] },
  macaronBurst: {
    name: ['彩色马卡龙', 'Rainbow Macaron'],
    desc: ['每第 6 次射击在目标处炸开 5 颗小马卡龙', 'Every 6th volley bursts into 5 mini macarons at the target'],
  },
  aniseShatter: {
    name: ['八角碎片', 'Anise Shards'],
    desc: ['飞到半程时裂出 6 片八角碎片（各 25% 伤害）', 'Shatters into 6 star-anise shards midway (25% dmg each)'],
  },
  onionPeel: {
    name: ['剥洋葱', 'Peeling Layers'],
    desc: ['飞到半程时剥落 3 层，变成小镖继续飞', 'Sheds 3 layers midway that fly on as small blades'],
  },
  sporeCloud: {
    name: ['孢子云', 'Spore Cloud'],
    desc: ['每第 4 次射击在目标处留下 3 秒孢子云，持续中毒', 'Every 4th shot leaves a 3s spore cloud that poisons'],
  },
  fistWave: {
    name: ['拳风', 'Fist Wave'],
    desc: ['每第 4 拳打出拳风冲击波（80% 伤害，击退）', 'Every 4th punch releases a shockwave (80% dmg, knockback)'],
  },
  grapeTrick: {
    name: ['变葡萄', 'Grape Trick'],
    desc: ['每第 3 次射击在目标处变出 3 颗葡萄弹', 'Every 3rd shot conjures 3 grape bullets at the target'],
  },
  cherryRamp: {
    name: ['连珠', 'Rapid Fire'],
    desc: ['持续开火时攻速越来越快（最多 +30%），停火 1 秒清零', 'Attack speed ramps while firing (up to +30%); resets after 1s'],
  },
  peaSprout: {
    name: ['豌豆苗', 'Pea Sprout'],
    desc: ['每第 5 发在命中处长出豌豆苗，向附近敌人吐 3 颗豌豆', 'Every 5th shot sprouts a pea plant that spits 3 peas'],
  },
  honeyStick: {
    name: ['黏住', 'Sticky Honey'],
    desc: ['命中使敌人黏住（大幅减速）并易伤', 'Hits glue enemies (heavy slow) and make them Vulnerable'],
  },
  dragonBreath: {
    name: ['龙息', 'Dragon Breath'],
    desc: ['每第 3 次突刺，枪尖喷出扇形龙息（120% 伤害并灼烧）', 'Every 3rd thrust breathes a fan of fire (120% dmg, Burn)'],
  },
  bloodRage: {
    name: ['血怒', 'Blood Rage'],
    desc: ['生命越低攻速越快（空血时 +40%）', 'The lower your HP, the faster it swings (up to +40%)'],
  },
  tripleArrow: { name: ['三连箭', 'Triple Arrow'], desc: ['每第 4 箭变成扇形三连箭', 'Every 4th draw fires a fan of 3 arrows'] },
  yamDrop: {
    name: ['烤红薯', 'Roast Yam'],
    desc: ['命中 2% 概率掉落烤红薯果实（每波最多 3 个）', '2% chance on hit to drop a roast yam (max 3 per wave)'],
  },
  truthMark: {
    name: ['真相标记', 'Truth Mark'],
    desc: ['命中给敌人加标记（下次受击必定暴击）', 'Hits Mark enemies (their next hit taken is a crit)'],
  },
  redEnvelope: {
    name: ['红包', 'Red Envelope'],
    desc: ['暴击弹命中时掉 1 番茄籽（每波最多 15 次）', 'Critical shots drop 1 seed on hit (max 15 per wave)'],
  },
  stinkBurst: {
    name: ['臭气爆发', 'Stink Burst'],
    desc: ['光环里的敌人叠臭气，叠满 3 层炸出 8 根毒刺', 'Enemies in the aura build stench; at 3 stacks they burst into 8 spikes'],
  },
  extraDrone: { name: ['浮游炮', 'Extra Drone'], desc: ['每次多发射 1 枚追踪火箭', 'Fires 1 extra homing rocket each time'] },
  zenSweep: { name: ['禅定', 'Zen'], desc: ['站着不动时横扫范围 +40%', '+40% sweep area while standing still'] },
  iceShatter: {
    name: ['碎冰', 'Ice Shatter'],
    desc: [
      '命中冰冻的敌人时碎裂，溅射周围（60% 伤害）；命中 10% 概率冰冻',
      'Hitting a frozen enemy shatters it, splashing 60% dmg; 10% Freeze on hit',
    ],
  },
  beanPop: {
    name: ['蹦豆子', 'Bean Pop'],
    desc: ['豆雷、豆子火箭爆炸后再蹦出 5 颗豆子弹', 'Bean mines and bean rockets pop 5 bean bullets after exploding'],
  },
  knifeStick: {
    name: ['插刀', 'Stuck Blades'],
    desc: ['飞刀插在敌人身上，1 秒后引爆（40% 伤害）', 'Blades stick in enemies and detonate 1s later (40% dmg)'],
  },
  seedBurst: { name: ['籽弹', 'Seed Burst'], desc: ['爆炸后散出 6 颗籽弹', 'Explosions scatter 6 seed bullets'] },
  taroWard: { name: ['芋泥护盾', 'Taro Ward'], desc: ['每 2 秒抵消 1 发飞进光环的敌弹', 'Blocks 1 enemy bullet inside the aura every 2s'] },
  panGuard: { name: ['锅盾', 'Pan Guard'], desc: ['每 3 秒挡掉 1 发靠近自己的敌弹', 'Blocks 1 enemy bullet near you every 3s'] },
  curseSpread: {
    name: ['诅咒蔓延', 'Spreading Curse'],
    desc: ['命中施加诅咒，并把诅咒传给附近 1 个敌人', 'Hits Curse the target and spread the Curse to 1 nearby enemy'],
  },
};

/** 武器（含超武）→ 专属契合技 */
export const BESPOKE_OF: Record<string, BespokeKey> = {
  ketchup: 'sauceZone',
  ketchup_flood: 'sauceZone',
  carrot_lance: 'lanceCharge',
  carrot_holy_lance: 'lanceCharge',
  devil_missile: 'chiliCluster',
  corn_cannon: 'popcornRing',
  golden_corn: 'popcornRing',
  bean_bazooka: 'beanPop',
  watermelon_hammer: 'melonQuake',
  melon_quake: 'melonQuake',
  lemon_dagger: 'acidSplash',
  acid_daggers: 'acidSplash',
  broccoli_staff: 'broccoliTree',
  storm_broccoli: 'broccoliTree',
  garlic_aura: 'garlicDrain',
  vampire_garlic: 'garlicDrain',
  pumpkin_lantern: 'wispBounce',
  ghost_lanterns: 'wispBounce',
  macaron_gun: 'macaronBurst',
  macaron_tempest: 'macaronBurst',
  star_anise_shuriken: 'aniseShatter',
  anise_storm: 'aniseShatter',
  onion_tear: 'onionPeel',
  onion_layers: 'onionPeel',
  spore_sprayer: 'sporeCloud',
  plague_sprayer: 'sporeCloud',
  coconut_gloves: 'fistWave',
  coco_fist: 'fistWave',
  grape_shotgun: 'grapeTrick',
  grape_magic: 'grapeTrick',
  cherry_pistols: 'cherryRamp',
  cherry_barrage: 'cherryRamp',
  pea_shooter: 'peaSprout',
  pea_gatling: 'peaSprout',
  honey_blaster: 'honeyStick',
  honey_flood: 'honeyStick',
  dragon_lance: 'dragonBreath',
  inferno_lance: 'dragonBreath',
  beet_axe: 'bloodRage',
  blood_axe: 'bloodRage',
  asparagus_bow: 'tripleArrow',
  asparagus_volley: 'tripleArrow',
  coal_tongs: 'yamDrop',
  yam_oven: 'yamDrop',
  salt_aura: 'truthMark',
  truth_field: 'truthMark',
  lychee_gun: 'redEnvelope',
  lucky_cannon: 'redEnvelope',
  stink_aura: 'stinkBurst',
  stink_king: 'stinkBurst',
  pepper_drone: 'extraDrone',
  mecha_cannon: 'extraDrone',
  melon_staff: 'zenSweep',
  vajra_staff: 'zenSweep',
  icicle_volley: 'iceShatter',
  glacier_shards: 'iceShatter',
  bean_mine: 'beanPop',
  bean_airdrop: 'beanPop',
  knife_case: 'knifeStick',
  thorn_rain: 'knifeStick',
  pomegranate_cluster: 'seedBurst',
  pome_salute: 'seedBurst',
  taro_aura: 'taroWard',
  taro_field: 'taroWard',
  rolling_pin: 'panGuard',
  pan: 'panGuard',
  titan_pin: 'panGuard',
  iron_bastion_pan: 'panGuard',
  blackberry_wand: 'curseSpread',
  wither_wand: 'curseSpread',
};

/** 标签特性强化（数值在 systems/Talents.ts 的 tagTraitMods 里） */
export const TAG_TRAIT: Record<string, Txt> = {
  厨具: ['攻速 +12%', '+12% attack speed'],
  锋利: ['暴击伤害 +30%，命中 20% 概率流血', '+30% crit damage; 20% chance to Bleed'],
  钝器: ['击退 +20，命中 10% 概率眩晕 0.4 秒', '+20 knockback; 10% chance to Stun 0.4s'],
  蔬果: ['命中 3% 概率掉落果实（每波最多 3 个）', '3% chance on hit to drop a fruit (max 3 per wave)'],
  枪械: ['射程 +20%，弹速 +20%', '+20% range, +20% projectile speed'],
  酱料: ['命中 50% 概率叠 1 层减速', '50% chance on hit to apply Slow'],
  甜点: ['命中 2% 概率回复 1 生命', '2% chance on hit to heal 1 HP'],
  长柄: ['攻击距离 +25%', '+25% reach'],
  格斗: ['连击 20%', '20% combo chance'],
  种子: ['子弹打完最后一下后分裂 1 次', 'Bullets split once after their last hit'],
  投掷: ['飞行距离 +25%', '+25% throw distance'],
  机械: ['攻速 +11%', '+11% attack speed'],
  魔法: ['弹道追踪，攻速 +8%', 'Homing projectiles, +8% attack speed'],
  弓弩: ['射程 +15%，穿透 +1', '+15% range, +1 pierce'],
  火焰: ['命中多叠 1 层灼烧', 'Hits apply an extra stack of Burn'],
  雷电: ['连锁 +1 跳，命中 10% 概率眩晕 0.3 秒', '+1 chain jump; 10% chance to Stun 0.3s'],
  冰霜: ['命中叠减速，8% 概率冰冻 1 秒', 'Hits Slow; 8% chance to Freeze 1s'],
  毒气: ['命中多叠 1 层中毒', 'Hits apply an extra stack of Poison'],
  元素: ['范围 +15%，射程 +10%', '+15% area, +10% range'],
  持续伤害: ['武器自带的灼烧 / 中毒多叠 1 层', "The weapon's own Burn / Poison applies 1 extra stack"],
  爆破: ['爆炸范围 +20%', '+20% explosion area'],
  穿透: ['穿透 +1', '+1 pierce'],
  连锁: ['弹射 +1，连锁 +1', '+1 bounce, +1 chain'],
  多重射击: ['弹丸 +1', '+1 projectile'],
  暴击: ['暴击率 +10%', '+10% crit chance'],
  光环: ['光环范围 +15%，攻速 +5%', '+15% aura size, +5% attack speed'],
};

/** 这把武器的契合技（专属优先，否则按攻击方式） */
export function synergySkill(def: WeaponDef): { key: BespokeKey | WeaponKind; name: string; desc: string } {
  const b = BESPOKE_OF[def.id];
  const s = b ? BESPOKE_SKILL[b] : KIND_SKILL[def.kind];
  return { key: b ?? def.kind, name: pick(s.name), desc: pick(s.desc) };
}

/** 双契合武器的说明行：契合技 + 两条标签强化 */
export function synergyLines(def: WeaponDef, favored: readonly string[], tagName: (t: string) => string): string[] {
  const s = synergySkill(def);
  const sep = lang === 'en' ? ': ' : '：';
  return [`✦ ${s.name}${sep}${s.desc}`, ...favored.map((t) => `✦ ${tagName(t)}${sep}${TAG_TRAIT[t] ? pick(TAG_TRAIT[t]) : ''}`)];
}

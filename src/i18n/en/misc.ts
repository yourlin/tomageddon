// 英文覆盖：武器 / 武器标签 / 状态 / 章节 / 属性 / 技能类型 / 稀有度
import type { ChaptersEn, StatsEn, StatusesEn, WeaponsEn, WeaponTagsEn } from '../types';
import { EXTRA_WEAPONS_EN } from '../../data/gearExtra';
import { AFFINITY_WEAPONS_EN } from '../../data/weaponsAffinity';
import { GEN_WEAPONS_EN } from '../../data/weaponsGen';
import { TAGS } from '../../data/weaponTags';
import { FUSED_WEAPONS_EN, autoFuseEn } from '../../data/recipes';
import { EXTRA_CHAPTER_EN } from '../../data/chaptersExtra';

export const EN_WEAPONS: WeaponsEn = {
  // ---- 进化超武 ----
  hell_trident: { name: 'Hell Trident', desc: 'A trident soaked in hot sauce — it sets whatever it pierces ablaze.' },
  titan_pin: { name: 'Titan Pin', desc: 'Weighted with an iron wok; it spins a full circle around you and stuns everything nearby.' },
  paoding_blade: { name: 'Master Chef Blade', desc: 'Cuts through effortlessly — every slice is lethal.' },
  dragon_cleaver: {
    name: 'Dragon Cleaver',
    desc: 'Forged from a whole knife set: an X-shaped double slash, then a dragon-slaying blade wave that pierces a whole line.',
  },
  pea_gatling: { name: 'Pea Gatling', desc: 'A whole sack of peas, fired nonstop.' },
  ketchup_flood: { name: 'Ketchup Flood', desc: 'An endless torrent of ketchup that drowns everything.' },
  devil_missile: { name: 'Devil Pepper Missile', desc: 'Off the heat scale — double the blast radius.' },
  thor_whisk: {
    name: 'Thunder Whisk',
    desc: "Tesla-charged lightning that keeps jumping through the horde, finished by a guaranteed-crit Thor's hammer bolt from the sky.",
  },
  vampire_garlic: { name: 'Vampire Garlic', desc: 'Even vampires love garlic now: the aura drains life.' },
  blueberry_railgun: { name: 'Blueberry Railgun', desc: 'Magnetically accelerated blueberries pierce whole lines of enemies.' },
  golden_corn: { name: 'Golden Popcorn Cannon', desc: 'Golden popcorn that bursts in every direction.' },
  anise_storm: {
    name: 'Anise Storm',
    desc: 'Feather-light star anise that flies out, loops three ellipses and comes back, hitting again on every loop.',
  },
  fork: { name: 'Tomato Fork', desc: 'A humble three-pronged fork. Thrusts forward.' },
  rolling_pin: { name: 'Rolling Pin', desc: 'Sweeps a wide area and knocks enemies back.' },
  knife: { name: "Chef's Knife", desc: 'Fast thrusts with high crit.' },
  pan: { name: 'Frying Pan', desc: 'Heavy sweep that stuns enemies for 0.4s. Damage scales with Armor.' },
  watermelon_hammer: { name: 'Melon Hammer', desc: 'Smashes the ground for a huge explosion.' },
  slingshot: { name: 'Tomato Slingshot', desc: 'Launches tomatoes that bounce to the next enemy on hit.' },
  pea_shooter: { name: 'Pea Shooter', desc: 'Rapid-fire pea barrage.' },
  chili_rocket: { name: 'Chili Rocket', desc: 'Explodes on hit and burns enemies.' },
  corn_cannon: { name: 'Corn Cannon', desc: 'Fires corn kernel shells that pierce multiple enemies.' },
  ketchup: { name: 'Ketchup Bottle', desc: 'Sprays ketchup in a cone. Hits grant extra Life Steal Chance.' },
  mustard_flamer: { name: 'Mustard Flamer', desc: 'Short-range flames with infinite pierce that burn enemies.' },
  soda: { name: 'Iced Soda', desc: 'Icy bubbles pierce enemies and slow them by 40%.' },
  garlic_aura: { name: 'Garlic Aura', desc: 'Continuously damages nearby enemies (every 0.5s).' },
  pepper_mine: { name: 'Pepper Mine', desc: 'Lays mines around you that explode when enemies step on them.' },
  onion_boomerang: { name: 'Onion Boomerang', desc: 'Curves out in an arc and loops back, piercing everything in its path.' },
  broccoli_staff: { name: 'Broccoli Staff', desc: 'Unleashes chain lightning that jumps between enemies.' },
  sauce_gatling: { name: 'Sauce Gatling', desc: 'A sauce machine gun that sprays like crazy.' },
  cleaver: { name: 'Meat Cleaver', desc: 'Mighty sweep. Kills have a 20% chance to drop extra Seeds.' },
  spatula: { name: 'Spatula', desc: 'Quick, light sweep that flips enemies far away.' },
  whisk_spin: { name: 'Whirl Whisk', desc: 'Whisks around you, damaging and slowing nearby enemies.' },
  meat_tenderizer: { name: 'Meat Tenderizer', desc: 'Heavy smash that stuns for 0.6s. Scales with Armor.' },
  skewer: { name: 'BBQ Skewer', desc: 'Long-reach thrust that leaves enemies sizzling.' },
  ladle: { name: 'Soup Ladle', desc: 'A sweep of hot soup. Hits grant extra Life Steal Chance.' },
  baguette_sword: { name: 'Baguette Blade', desc: 'Huge-reach bread sweep. Scales with Max HP.' },
  cucumber_katana: { name: 'Cucumber Katana', desc: 'A crisp slash with very high crit.' },
  pizza_cutter: { name: 'Pizza Cutter', desc: 'Rolls out in a zigzag and back, slicing everything en route.' },
  chopsticks: { name: 'Chopsticks', desc: 'Lightning-fast pokes. Quick and precise.' },
  bamboo_spear: { name: 'Bamboo Spear', desc: 'Slow but mighty thrust with extra-long reach.' },
  pineapple_mace: { name: 'Pineapple Mace', desc: 'A spiky pineapple slam that sets off a small blast.' },
  olive_launcher: { name: 'Olive Launcher', desc: 'Slippery olives bounce between enemies again and again.' },
  popcorn_machine: { name: 'Popcorn Popper', desc: 'Scatters kernels that POP when enemies get close.' },
  grape_shotgun: { name: 'Grape Shotgun', desc: 'Blasts a close-range bunch of grapes with knockback.' },
  bean_bazooka: { name: 'Bean Bazooka', desc: 'Fires a giant bean pod for a massive explosion.' },
  cherry_bomb: { name: 'Cherry Bombs', desc: 'Lobs cherries in pairs, each one exploding.' },
  blueberry_sniper: { name: 'Blueberry Sniper', desc: 'Ultra-long-range precision shots with high crit.' },
  plate_frisbee: {
    name: 'Plate Frisbee',
    desc: 'A thrown plate that swings wide at the far end and smacks enemies again on the way back.',
  },
  seed_spitter: { name: 'Seed Spitter', desc: 'Pew-pew-pew! Rapid-fire melon seeds.' },
  carrot_crossbow: { name: 'Carrot Crossbow', desc: 'Pointy carrot bolts pierce a whole line of enemies.' },
  honey_blaster: { name: 'Honey Blaster', desc: 'Sticky honey shots slow enemies by 35%.' },
  soy_pistol: { name: 'Soy Pistol', desc: 'Steady sidearm. Hits grant extra Life Steal Chance.' },
  ice_cube_tray: { name: 'Ice Cube Tray', desc: 'Flings a row of ice cubes that heavily slow enemies.' },
  lightning_whisk: { name: 'Zap Whisk', desc: 'Whips up current that jumps between even more enemies.' },
  steam_kettle: { name: 'Steam Kettle', desc: 'A wide blast of steam that pierces and slows.' },
  curry_aura: { name: 'Curry Aura', desc: 'Rich curry fumes burn all nearby enemies.' },
  pepper_spray: { name: 'Pepper Spray', desc: 'Point-blank spicy powder that burns hard.' },
  mint_frost_mine: { name: 'Mint Frost Mine', desc: 'Cool minty mines whose blast leaves enemies crawling.' },
  thunder_durian: { name: 'Thunder Durian', desc: 'Hurls a charged durian that explodes and stuns.' },
  dragonfruit_orb: { name: 'Dragonfruit Orb', desc: 'A blazing dragonfruit that bounces and ignites enemies.' },
  star_anise_shuriken: {
    name: 'Star Anise Star',
    desc: 'A spice shuriken that spirals across the front and boomerangs back, burning foes.',
  },
  lemon_battery: { name: 'Lemon Battery', desc: 'Powerful shock with fewer jumps, but it stuns.' },
};

/** 武器标签的英文名：由标签表（data/weaponTags.ts）统一提供 */
export const EN_WEAPON_TAGS: WeaponTagsEn = Object.fromEntries(TAGS.map((t) => [t.id, t.en]));

export const EN_STATUSES: StatusesEn = {
  burn: { name: 'Burn', desc: 'Takes fire damage per stack every second', glyph: 'BU' },
  poison: { name: 'Poison', desc: 'Takes toxin damage per stack every second. Stacks up to 8', glyph: 'PO' },
  bleed: { name: 'Bleed', desc: 'Loses HP per stack every second', glyph: 'BL' },
  slow: { name: 'Slow', desc: 'Move Speed reduced', glyph: 'SL' },
  freeze: { name: 'Freeze', desc: 'Cannot act. Damage taken +20%', glyph: 'FR' },
  stun: { name: 'Stun', desc: 'Cannot act', glyph: 'ST' },
  weaken: { name: 'Weaken', desc: 'Damage dealt reduced', glyph: 'WK' },
  vulnerable: { name: 'Vulnerable', desc: 'Damage taken increased', glyph: 'VU' },
  armorBreak: { name: 'Armor Break', desc: 'Armor reduced', glyph: 'AB' },
  curse: { name: 'Curse', desc: 'Cannot heal. Damage taken +10%', glyph: 'CU' },
  blind: { name: 'Blind', desc: 'Range -30% (enemies cannot shoot)', glyph: 'BD' },
  confuse: { name: 'Confuse', desc: 'Movement direction scrambled', glyph: 'CF' },
  sticky: { name: 'Sticky', desc: 'Move Speed greatly reduced', glyph: 'SK' },
  mark: { name: 'Mark', desc: 'The next hit taken is a guaranteed crit', glyph: 'MK' },
  silence: { name: 'Silence', desc: 'Cannot use skills', glyph: 'SI' },
  rot: { name: 'Rot', desc: 'Max HP effects reduced. Attack Speed -10%', glyph: 'RO' },
  soaked: { name: 'Soaked', desc: 'Move Speed -10% and Attack Speed -8% per stack. Stacks up to 3', glyph: 'SO' },
  corrode: { name: 'Corrode', desc: 'Takes acid damage per stack every second. Damage taken +6% per stack. Stacks up to 4', glyph: 'CO' },

  haste: { name: 'Haste', desc: 'Move Speed and Attack Speed increased', glyph: 'HA' },
  rage: { name: 'Rage', desc: 'Damage dealt increased', glyph: 'RA' },
  shield: { name: 'Shield', desc: 'Absorbs an equal amount of damage', glyph: 'SH' },
  regen: { name: 'Regen', desc: 'Restores 1 HP per second per stack', glyph: 'RG' },
  fortify: { name: 'Fortify', desc: 'Armor increased', glyph: 'FO' },
  invuln: { name: 'Invulnerable', desc: 'Immune to all damage', glyph: 'IN' },
  thorns: { name: 'Thorns', desc: 'Reflects melee damage', glyph: 'TH' },
  focus: { name: 'Focus', desc: 'Crit Chance increased', glyph: 'FC' },
  barrier: { name: 'Barrier', desc: 'Damage taken reduced by 40%', glyph: 'BA' },
  enrage: { name: 'Enrage', desc: 'Move Speed +30%, Damage +30%', glyph: 'EN' },
  lucky: { name: 'Lucky', desc: 'Luck increased', glyph: 'LU' },
  vampiric: { name: 'Bloodlust', desc: 'Life Steal Chance +4% per stack', glyph: 'VA' },
  tailwind: { name: 'Tailwind', desc: 'Move Speed +12% and Dodge +4% per stack. Stacks up to 3', glyph: 'TW' },
  hardened: { name: 'Hardened', desc: 'Armor +3 and Damage taken -10% per stack. Stacks up to 2', glyph: 'HD' },
};

export const EN_CHAPTERS: ChaptersEn = {
  1: {
    name: 'Chapter 1 · Midnight Kitchen',
    desc: "The kitchen is overgrown with mold. Tomato Sister's adventure begins here.",
    terrain: [
      'Hot Oil Splash: The floor spatters burning oil pools',
      'Drain Grate: Small monsters crawl out periodically',
      'Fresh tomatoes occasionally fall from the sky',
    ],
  },
  2: {
    name: 'Chapter 2 · Wild Garden',
    desc: 'Bugs have overrun the garden. Watch out for the healing toadstools.',
    terrain: [
      'Rabbit Holes: Rabbits scurry around; defeat them for Seeds and fruit',
      'Gophers: Pop out of burrows to throw rocks',
      'Sprinklers: Periodically spray water, Soaking players and monsters in range (Move and Attack Speed reduced)',
    ],
  },
  3: {
    name: 'Chapter 3 · Frozen Fridge',
    desc: 'Inside the chilly fridge, ice crystals will slow you down.',
    terrain: ['Ice Floor: Slippery on ice, but you move faster', 'Cold Wind: Periodic gusts push all units and slow them'],
  },
  4: {
    name: 'Chapter 4 · City Junkyard',
    desc: 'Among mountains of garbage, the most disgusting monsters are born.',
    terrain: [
      'Quicksand Pit: Pulls players and monsters toward the center and deals damage',
      'Falling Trash: Watch for warning circles on the ground',
      'Acid Leak: Acid pools bubble up near you, dealing damage and inflicting Corrode',
    ],
  },
  5: {
    name: 'Chapter 5 · Ketchup Factory',
    desc: 'The source of all rot. Defeat the Rotten Chef and save Ketchup Town!',
    terrain: [
      'Conveyor Belts: Push all units standing on them',
      'Steam Valves: Periodically blast scalding steam',
      'Air Vents: Stand on a vent to gain Tailwind (more Move Speed and Dodge); monsters get blown away',
    ],
  },
};

export const EN_STATS: StatsEn = {
  maxHp: 'Max HP',
  regen: 'HP Regen',
  lifeSteal: 'Life Steal Chance',
  damage: 'All Damage',
  meleePct: 'Melee Weapon Dmg',
  rangedPct: 'Ranged Weapon Dmg',
  elementalPct: 'Elemental Weapon Dmg',
  auraPct: 'Aura Damage',
  auraSize: 'Aura Size',
  explodeSize: 'Explosion Size',
  melee: 'Melee Damage',
  ranged: 'Ranged Damage',
  elemental: 'Elemental Damage',
  attackSpeed: 'Attack Speed',
  crit: 'Crit Chance',
  range: 'Range',
  armor: 'Armor',
  dodge: 'Dodge',
  speed: 'Move Speed',
  luck: 'Luck',
  harvest: 'Harvest',
  pickup: 'Pickup Range',
  xpGain: 'XP Gain',
  skillCd: 'Skill Cooldown',
  skillDmg: 'Skill Damage',
  skillRange: 'Skill Area',
  skillDur: 'Skill Duration',
};

export const EN_SKILL_TYPES: Record<string, string> = {
  nova: 'Nova Burst',
  dash: 'Dash',
  buff: 'Self Buff',
  ghost: 'Stealth',
  ring: 'Ring Barrage',
  heal: 'Drain Heal',
  strikes: 'Multi-Strike',
  clone: 'Summon Clone',
  barrage: 'Focused Barrage',
  missile: 'AOE Missile',
  screen: 'Screen Clear',
  field: 'Binding Field',
  curse: 'Mass Debuff',
};

export const EN_RARITY: string[] = ['Common', 'Rare', 'Epic', 'Legendary'];

// 1.4.0：第 6 / 7 章
Object.assign(EN_CHAPTERS, EXTRA_CHAPTER_EN);

// 1.4.0 G5 / G7：新武器、超武与道具
Object.assign(EN_WEAPONS, EXTRA_WEAPONS_EN);
Object.assign(EN_WEAPONS, AFFINITY_WEAPONS_EN);
Object.assign(EN_WEAPONS, GEN_WEAPONS_EN);
Object.assign(EN_WEAPONS, FUSED_WEAPONS_EN);
// 自动生成的融合武器：英文名由基础武器的英文名拼出
Object.assign(
  EN_WEAPONS,
  autoFuseEn((id) => EN_WEAPONS[id]?.name ?? id),
);

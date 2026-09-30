// 英文覆盖：武器 / 武器标签 / 状态 / 章节 / 属性 / 技能类型 / 稀有度
import type { ChaptersEn, StatsEn, StatusesEn, WeaponsEn, WeaponTagsEn } from '../types';

export const EN_WEAPONS: WeaponsEn = {
  fork: { name: 'Tomato Fork', desc: 'A humble three-pronged fork. Thrusts forward.' },
  rolling_pin: { name: 'Rolling Pin', desc: 'Sweeps a wide area and knocks enemies back.' },
  knife: { name: "Chef's Knife", desc: 'Fast thrusts with high crit.' },
  pan: { name: 'Frying Pan', desc: 'Heavy sweep that stuns enemies for 0.4s. Damage scales with Armor.' },
  watermelon_hammer: { name: 'Melon Hammer', desc: 'Smashes the ground for a huge explosion.' },
  slingshot: { name: 'Tomato Slingshot', desc: 'Launches tomatoes that bounce to the next enemy on hit.' },
  pea_shooter: { name: 'Pea Shooter', desc: 'Rapid-fire pea barrage.' },
  chili_rocket: { name: 'Chili Rocket', desc: 'Explodes on hit and burns enemies.' },
  corn_cannon: { name: 'Corn Cannon', desc: 'Fires corn kernel shells that pierce multiple enemies.' },
  ketchup: { name: 'Ketchup Bottle', desc: 'Sprays ketchup in a cone. Hits grant extra Life Steal.' },
  mustard_flamer: { name: 'Mustard Flamer', desc: 'Short-range flames with infinite pierce that burn enemies.' },
  soda: { name: 'Iced Soda', desc: 'Icy bubbles pierce enemies and slow them by 40%.' },
  garlic_aura: { name: 'Garlic Aura', desc: 'Continuously damages nearby enemies (every 0.5s).' },
  pepper_mine: { name: 'Pepper Mine', desc: 'Lays mines around you that explode when enemies step on them.' },
  onion_boomerang: { name: 'Onion Boomerang', desc: 'Flies out and returns, piercing everything in its path.' },
  broccoli_staff: { name: 'Broccoli Staff', desc: 'Unleashes chain lightning that jumps between enemies.' },
  sauce_gatling: { name: 'Sauce Gatling', desc: 'A sauce machine gun that sprays like crazy.' },
  cleaver: { name: 'Meat Cleaver', desc: 'Mighty sweep. Kills have a 20% chance to drop extra Seeds.' },
};

export const EN_WEAPON_TAGS: WeaponTagsEn = {
  厨具: 'Kitchenware',
  锋利: 'Sharp',
  蔬果: 'Produce',
  枪械: 'Firearm',
  酱料: 'Sauce',
  元素: 'Elemental',
};

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

  haste: { name: 'Haste', desc: 'Move Speed and Attack Speed increased', glyph: 'HA' },
  rage: { name: 'Rage', desc: 'Damage dealt increased', glyph: 'RA' },
  shield: { name: 'Shield', desc: 'Absorbs an equal amount of damage', glyph: 'SH' },
  regen: { name: 'Regen', desc: 'Restores HP every second', glyph: 'RG' },
  fortify: { name: 'Fortify', desc: 'Armor increased', glyph: 'FO' },
  invuln: { name: 'Invulnerable', desc: 'Immune to all damage', glyph: 'IN' },
  thorns: { name: 'Thorns', desc: 'Reflects melee damage', glyph: 'TH' },
  focus: { name: 'Focus', desc: 'Crit Chance increased', glyph: 'FC' },
  barrier: { name: 'Barrier', desc: 'Damage taken reduced by 40%', glyph: 'BA' },
  enrage: { name: 'Enrage', desc: 'Move Speed +30%, Damage +30%', glyph: 'EN' },
  lucky: { name: 'Lucky', desc: 'Luck increased', glyph: 'LU' },
  vampiric: { name: 'Bloodlust', desc: 'Life Steal increased', glyph: 'VA' },
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
    terrain: ['Rabbit Holes: Rabbits scurry around; defeat them for Seeds and fruit', 'Gophers: Pop out of burrows to throw rocks'],
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
    ],
  },
  5: {
    name: 'Chapter 5 · Ketchup Factory',
    desc: 'The source of all rot. Defeat the Rotten Chef and save Ketchup Town!',
    terrain: ['Conveyor Belts: Push all units standing on them', 'Steam Valves: Periodically blast scalding steam'],
  },
};

export const EN_STATS: StatsEn = {
  maxHp: 'Max HP',
  regen: 'HP Regen',
  lifeSteal: 'Life Steal',
  damage: 'Damage',
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

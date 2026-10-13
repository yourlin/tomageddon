import type { CharactersEn } from '../types';
import { EXTRA_CHARACTERS_EN } from '../../data/charactersExtra';

export const EN_CHARACTERS: CharactersEn = {
  tomato: {
    name: 'Tomato Sister',
    title: 'All-Rounder',
    desc: 'Guardian of Ketchup Town. Well-balanced in every way — perfect for beginners.',
    talent: {
      name: 'Heart of Tomato',
      desc: 'Favored weapons start with 30% combo chance; after each wave, permanently gain +1 Max HP and +2% favored-weapon combo chance (max +20%)',
    },
    traits: [],
    skill: { name: 'Ketchup Burst', desc: 'Burst into ketchup for 220% damage and Slow; puddles linger 4s, Slowing enemies who step in.' },
  },
  carrot: {
    name: 'Carrot Knight',
    title: 'Melee Tank',
    desc: 'A knight in silver armor who loves getting up close and personal.',
    talent: {
      name: "Knight's Shield",
      desc: 'Each point of Armor gives favored weapons +2% sweep & blast area (max +40%); hits on enemies with 3+ Armor Break stun for 0.3s',
    },
    traits: ['Ranged Damage -50%'],
    skill: {
      name: 'Knight Charge',
      desc: 'Wind up, then charge while Invulnerable, knocking back and Stunning enemies in the path; a shockwave at the end hits again.',
    },
  },
  chili: {
    name: 'Chili Sis',
    title: 'Fire Expert',
    desc: 'Hot-tempered and fiery — flames follow wherever she goes.',
    talent: { name: 'Fuel the Fire', desc: 'Favored weapon hits on Burning enemies throw sparks that deal 30% damage around them' },
    traits: ['All hits have a 25% chance to Burn', 'Burns apply 1 extra stack'],
    skill: {
      name: 'Flame Nova',
      desc: 'A ring of fire expands outward; enemies swept by the flame line take damage and gain 3 stacks of Burn.',
    },
  },
  corn: {
    name: 'Corn Gunner',
    title: 'Sharpshooter',
    desc: 'A Wild West gunslinger who blasts through anything with kernels.',
    talent: { name: 'Suppressing Fire', desc: 'Favored bullets gain +1 pierce for every 100 distance travelled (max +3)' },
    traits: ['Melee Damage -50%', 'Ranged weapons +1 Pierce'],
    skill: {
      name: 'Popcorn Barrage',
      desc: 'Toss 18 corn kernels all around; each pops into popcorn on landing, dealing 70% damage to nearby enemies.',
    },
  },
  watermelon: {
    name: 'Chubby Melon',
    title: 'Heavy Tank',
    desc: 'A big, round bruiser with a seriously thick rind.',
    talent: { name: 'Thick Rind', desc: 'Take 10% less damage; every 20 Max HP gives favored weapons +5% area (max +50%)' },
    traits: [],
    skill: {
      name: 'Melon Roll',
      desc: 'Roll as a giant melon for 0.9s, bouncing off walls and repeatedly crushing enemies. Restores 4.5% Max HP.',
    },
  },
  lemon: {
    name: 'Lemon Assassin',
    title: 'Crit Assassin',
    desc: 'A sour little assassin who kills in a single strike.',
    talent: { name: 'Sour Strike', desc: "A favored weapon crit instantly resets that weapon's cooldown (once per second per weapon)" },
    traits: ['+40% Crit Damage'],
    skill: {
      name: 'Sour Mist',
      desc: 'Vanish for 2.5s (Invulnerable) with +50% Crit Chance, leaving a sour mist that lures enemies; reappear with a strike on the nearest enemy.',
    },
  },
  eggplant: {
    name: 'Eggplant Mage',
    title: 'Thunder Mage',
    desc: 'A purple-robed mage who calls down lightning to punish pests.',
    talent: { name: 'Thunder Power', desc: 'Each jump of a favored chain has a 15% chance to call down a lightning strike' },
    traits: ['Melee Damage -70%', '10% chance on hit to call lightning'],
    skill: { name: 'Purple Thunder', desc: 'Lightning strikes every enemy on screen for 90% damage and Stuns them for 0.4s.' },
  },
  garlic: {
    name: 'Count Garlic',
    title: 'Vampire Noble',
    desc: 'An ancient vampire... made entirely of garlic.',
    talent: {
      name: 'Blood Feast',
      desc: 'A blood mist makes enemies within 160 Bleed every second. Favored weapons deal more damage the more HP you are missing (+60% at empty), with half the Life Steal cooldown and up to 3 Life Steal procs per group hit',
    },
    traits: ['Enemies within 160 Bleed every second', 'Bleeding enemies take +15% damage from all sources'],
    skill: {
      name: 'Blood Domain',
      desc: 'Drain nearby enemies for 100% damage and inflict 3 stacks of Bleed, healing 1.5% Max HP per enemy hit (up to 10%).',
    },
  },
  blueberry: {
    name: 'Blueberry Twins',
    title: 'Weapon Master',
    desc: 'Inseparable twins who can carry more weapons.',
    talent: { name: 'Twin Bond', desc: 'Each pair of identical favored weapons gives favored weapons +1 more projectile (max +2)' },
    traits: ['8 weapon slots'],
    skill: {
      name: 'Twin Clone',
      desc: 'Summon 2 orbiting clones for 8s that attack with all your weapons (50% damage) and block bullets; they explode when destroyed or expired.',
    },
  },
  pineapple: {
    name: 'Captain Pineapple',
    title: 'Merchant Pirate',
    desc: 'A shrewd pirate captain and a master haggler.',
    talent: {
      name: "Pirate's Share",
      desc: 'Earn 8% interest on your seeds after each wave (cap rises with waves); every 100 seeds held gives favored weapons +1 bounce (max +3)',
    },
    traits: ['Shop prices -15%'],
    skill: {
      name: 'Golden Cannon',
      desc: 'Fire 3 golden cannonballs in a volley at 3 random nearby enemies, each exploding on impact. Kills always drop Seeds.',
    },
  },
  pumpkin: {
    name: 'Pumpkin Ghost',
    title: 'Dodge Master',
    desc: 'A little Halloween ghost, always floating about.',
    talent: { name: 'Ghost Ambush', desc: 'After a successful dodge, favored weapons gain +40% attack speed for 1.5s' },
    traits: ['Dodge cap 75%'],
    skill: {
      name: 'Spirit Form',
      desc: 'Become a spirit for 2.5s (Invulnerable) with +30% Move Speed; nearby enemies briefly lose track of you, and enemies you pass through take damage.',
    },
  },
  strawberry: {
    name: 'Strawberry Idol',
    title: 'Rising Star',
    desc: 'A superstar idol who levels up at an amazing pace.',
    talent: {
      name: 'Rising Star',
      desc: 'Each level-up grants +1 Max HP; every 4 levels favored weapons gain a permanent upgrade in turn: +15% range, +1 projectile, +1 pierce, +5% crit',
    },
    traits: ['4 choices on level up'],
    skill: { name: 'Fan Cheer', desc: 'Gain 3 stacks of Haste (+30% Move & Attack Speed) and 5 stacks of Rage (+20% damage) for 6s.' },
  },
  ginger: {
    name: 'Ginger Ninja',
    title: 'Wind Ninja',
    desc: 'A ginger ninja who comes and goes without a trace.',
    talent: { name: 'Gale Step', desc: 'Every +10% Move Speed gives favored weapons +4% attack speed' },
    traits: [],
    skill: {
      name: 'Shadow Slash',
      desc: 'Blink forward leaving an ink slash; 0.35s later it erupts, hitting enemies along the path and applying 2 stacks of Bleed.',
    },
  },
  avocado: {
    name: 'Dr. Avocado',
    title: 'Bomb Expert',
    desc: 'A mad scientist obsessed with explosive experiments.',
    talent: {
      name: 'Blast Science',
      desc: 'Favored weapon blasts have a 30% chance to set off a second blast at the edge (50% damage); +3% per wave (max 60%)',
    },
    traits: ['Kills have a 15% chance to explode'],
    skill: {
      name: 'Core Overload',
      desc: 'Detonate 5 explosions in quick succession on random nearby enemies, each dealing 160% area damage.',
    },
  },
  onion: {
    name: 'Uncle Onion',
    title: 'Tearjerker',
    desc: 'A tough guy with many layers who brings enemies to tears.',
    talent: {
      name: 'Tear Gas',
      desc: 'When hit, Blind nearby enemies for 2s (at most once every 3s); favored weapons get +30% crit chance against Blinded enemies',
    },
    traits: ['Reflect 15 damage when hit'],
    skill: {
      name: 'Tear Gas Zone',
      desc: "Release tear gas on the spot for 5s, dealing 40% damage every 0.5s to enemies inside and heavily Slowing and Blinding them (can't shoot).",
    },
  },
  mushroom: {
    name: 'Mushroom Shaman',
    title: 'Poison Expert',
    desc: 'A witch doctor from deep in the forest who fells foes with toxic spores.',
    talent: {
      name: 'Spore Burst',
      desc: 'Poisoned enemies burst into 2 homing spores on death and apply 3 stacks of Poison to nearby enemies',
    },
    traits: ['All hits have a 20% chance to Poison', 'Poison stack cap +4'],
    skill: {
      name: 'Spore Cloud',
      desc: 'Release a wide spore cloud for 6s that deals light damage; enemies inside stack Poison and Weaken every second.',
    },
  },
  coconut: {
    name: 'Coconut Boxer',
    title: 'Heavy Hitter',
    desc: 'Beneath the hard shell beats a fiery fighter’s heart.',
    talent: {
      name: 'Knockout Punch',
      desc: 'Every 4th favored punch deals ×2.5 damage and always Stuns for 0.4s; consecutive hits on the same enemy deal +6% each (up to +30%), and hits on Stunned enemies deal +35%',
    },
    traits: ['12% chance on hit to Stun for 0.6s'],
    skill: {
      name: 'Ground Pound',
      desc: 'Leap up and slam the ground (Invulnerable), dealing 220% damage, knocking enemies back, Stunning them and applying 3 stacks of Armor Break.',
    },
  },
  grape: {
    name: 'Grape Magician',
    title: 'Illusionist',
    desc: 'A magician made of a bunch of grapes — which one is real?',
    talent: {
      name: 'Sleight of Hand',
      desc: 'Gain 1s of invulnerability every 8s; favored hits have a 15% chance to conjure a phantom shot at another enemy (60% damage), guaranteed while invulnerable',
    },
    traits: ['20% chance to Confuse enemies when attacked'],
    skill: {
      name: 'Grape Clone',
      desc: 'Leave a top-hatted illusion on the spot for 6s that lures enemies to it, then bursts and damages enemies around it.',
    },
  },
  cherry: {
    name: 'Cherry Gunslinger',
    title: 'Rapid Shooter',
    desc: 'Two cherries on one stem, with lightning-fast trigger fingers.',
    talent: {
      name: 'Rapid Volley',
      desc: 'Each favored shot adds 1 Hot Barrel stack (+1% attack speed); at 20 stacks you Overheat for 2s (-30% attack speed) and the stacks reset; stacks also reset after 1s without firing',
    },
    traits: ['Ranged weapons have a 25% chance to fire an extra shot'],
    skill: {
      name: 'Dual Barrage',
      desc: 'Alternate hands to fire 12 shots, locking onto the two nearest enemies, each dealing 90% damage.',
    },
  },
  pea: {
    name: 'Pea Soldier',
    title: 'Legionnaire',
    desc: 'Little soldiers fresh out of the pod — strength in numbers.',
    talent: { name: 'Pea Legion', desc: 'Each weapon you hold gives favored bullets +8% chance to split in two' },
    traits: ['Start with 2 Pea Shooters', '+6% Damage per duplicate weapon'],
    skill: { name: 'Pea Turret', desc: 'Plant a pea turret at your feet that auto-fires 20 peas at the nearest enemy over 5s.' },
  },
  peach: {
    name: 'Peach Angel',
    title: 'Healer',
    desc: 'A gentle angel who watches over every friend.',
    talent: {
      name: "Angel's Grace",
      desc: 'Every 0.8s, auto-fire a homing holy bolt at the nearest enemy (damage = 6 + Ranged Damage + 50% HP Regen; 2 bolts while shielded). The first lethal hit each wave leaves you at 1 HP with 2s of invulnerability; while shielded, favored weapons gain +1 pierce and heal on every hit (max 3 per second)',
    },
    traits: ['Gain 25 Shield at the start of each wave', '+20% damage while Shielded'],
    skill: {
      name: 'Angel’s Blessing',
      desc: 'Call down holy light to deal 100% damage to nearby enemies, become Invulnerable for 1.5s, and restore 9% Max HP over 3 pulses.',
    },
  },
  dragonfruit: {
    name: 'Dragonfruit Rider',
    title: 'Flame Knight',
    desc: 'A knight with dragon blood — flames follow every charge.',
    talent: {
      name: 'Dragon Dive',
      desc: 'Every 15 favored weapon hits summon a fire dragon that dives at the nearest enemy: 6 piercing flames dealing 40% damage each (an enemy in the line can take all 6, about 240% in total) plus 2 Burn stacks (at most once every 3s)',
    },
    traits: ['Melee hits have a 20% chance to Burn', '+40% damage over time', 'Burn lasts twice as long'],
    skill: {
      name: 'Dragonflame Charge',
      desc: 'Charge forward, applying 4 stacks of Burn along the path and leaving a ~3s fire trail that keeps burning enemies.',
    },
  },
  beet: {
    name: 'Beet Berserker',
    title: 'Berserker',
    desc: 'A blood-red beet who gets stronger the longer the fight goes.',
    talent: { name: 'Berserker Blood', desc: 'Every 10% HP lost gives favored weapons +6% attack speed and +3% area' },
    traits: ['Gain Rage when damaged'],
    skill: { name: 'Frenzy', desc: 'Gain Enrage (+30% Move Speed and damage) and 3 stacks of Bloodlust (+12% Life Steal Chance) for 6s.' },
  },
  asparagus: {
    name: 'Asparagus Archer',
    title: 'Marksman',
    desc: 'A tall, slender asparagus who never misses.',
    talent: { name: 'Heartpiercer', desc: 'Favored weapons always crit enemies at full HP, and that hit does not use up pierce' },
    traits: ['Hits have a 25% chance to Mark enemies (next hit always crits)'],
    skill: {
      name: 'Heartpiercer',
      desc: 'Charge for 0.4s, then fire a giant arrow at the highest-HP enemy that pierces the whole line, dealing heavy damage and Marking every enemy hit.',
    },
  },
  sweetpotato: {
    name: 'Chef Yam',
    title: 'Gourmet',
    desc: 'The smell of roasted sweet potato perks everyone right up.',
    talent: {
      name: 'Gourmet',
      desc: 'Picking up fruit grants bonus seeds (scales with wave) and gives favored weapons +25% attack speed and +20% area for 5s',
    },
    traits: ['Fruit healing doubled'],
    skill: {
      name: 'Roast Yam Feast',
      desc: 'Blast nearby enemies and toss out 3 roast yams; pick them up within 8s to restore 10.8% Max HP in total. Gain 5 stacks of Regen.',
    },
  },
  kiwi: {
    name: 'Kiwi Detective',
    title: 'Weakness Seeker',
    desc: 'A fuzzy detective who spots an enemy’s weakness at a glance.',
    talent: { name: 'Weak Spot', desc: 'Favored weapons get +5% crit chance per distinct debuff on the target' },
    traits: ['Hits have a 20% chance to apply Vulnerable', 'Crit Damage +30%'],
    skill: {
      name: 'One Truth',
      desc: 'A magnifying glass sweeps the screen, lightly damaging every enemy on screen and applying Mark and 2 stacks of Vulnerable for 6s.',
    },
  },
  lychee: {
    name: 'Lychee Princess',
    title: 'Lucky Princess',
    desc: 'Peel back the red shell to find a crystal-clear princess.',
    talent: {
      name: 'Lucky Streak',
      desc: 'First shop reroll each wave is free; every 10 Luck gives favored projectiles a 1% chance to become Lucky Envelopes (guaranteed crit, +2 bounce, max 30%)',
    },
    traits: ['Crate drop rate doubled'],
    skill: { name: 'Princess’s Luck', desc: 'Four-leaf clovers orbit you for 6s, granting 5 stacks of Lucky and 3 stacks of Focus.' },
  },
  durian: {
    name: 'Durian Overlord',
    title: 'Spiked Tyrant',
    desc: 'Covered in spikes and infamous for the stench. Who dares come close?',
    talent: {
      name: 'Stench Aura',
      desc: 'Every 1.5s, throw a stink spike at the nearest enemy (damage = 4 + Elemental Damage + 50% Armor; inflicts 2 Poison stacks and Weaken). Favored hits add 1 Stench stack to the enemy; at 3 stacks it bursts into 8 spikes (50% damage)',
    },
    traits: [
      'Reflect 10 damage',
      'Enemies within 160 are constantly Weakened and gain 2 Poison stacks every second',
      'Poisoned enemies are also Slowed',
    ],
    skill: {
      name: 'Stink Bomb',
      desc: 'A stench follows you for 5s; nearby enemies are hit with Poison, Weaken and Confuse every second. Deals light damage on cast.',
    },
  },
  bellpepper: {
    name: 'Pepper Mech',
    title: 'Mech Pilot',
    desc: 'A kid piloting a custom-built bell pepper mech.',
    talent: {
      name: 'Mech Plating',
      desc: 'Take 15% less damage; while shielded, favored weapons gain +30% attack speed and +1 projectile',
    },
    traits: ['Gain 20 Shield every 12s'],
    skill: {
      name: 'Drone Support',
      desc: 'Deploy a drone that follows you for 8s, zapping the nearest enemy with a laser every 0.35s for 45% damage.',
    },
  },
  wintermelon: {
    name: 'Monk Gourd',
    title: 'Zen Monk',
    desc: 'A monk with a mind like still water, mastering stillness over motion.',
    talent: {
      name: 'Zen Stillness',
      desc: 'While standing still: take 25% less damage, regenerate 2% Max HP per second, and favored weapons have a 50% combo chance (60% damage)',
    },
    traits: ['Gain Focus on successful dodge'],
    skill: {
      name: 'Golden Bell',
      desc: 'Summon a golden bell: Invulnerable for 2s, repelling nearby non-boss enemies, and gain 5 stacks of Fortify.',
    },
  },
  bittermelon: {
    name: 'Bitter Melon Mage',
    title: 'Frost Mage',
    desc: 'A bitter-looking ice mage who freezes everything in sight.',
    talent: { name: 'Frostbite', desc: 'Favored weapons always crit Frozen enemies and shatter the ice, dealing 50% damage around them' },
    traits: ['Hits have an 8% chance to Freeze enemies for 1s'],
    skill: {
      name: 'Frozen Domain',
      desc: 'Freeze the ground around you for 5s, dealing 50% damage every 0.5s to enemies inside and Slowing them, with a 25% chance to Freeze.',
    },
  },
  sprout: {
    name: 'Sprout Apprentice',
    title: 'Rising Talent',
    desc: 'A tiny bean sprout with limitless potential.',
    talent: {
      name: 'Late Bloomer',
      desc: 'Each level gives favored weapons +1% attack speed (max +40%); every 5 levels +1 pierce (max +3)',
    },
    traits: ['4 choices on level up'],
    skill: { name: 'Growth Spurt', desc: 'Shoot up in a growth spurt, gaining +30% XP from kills for 5s and 2 stacks of Haste for 5s.' },
  },
  wasabi: {
    name: 'Wasabi Bomber',
    title: 'Demolition Maniac',
    desc: 'A hair-trigger wasabi — it goes right up your nose, and it’s deadly.',
    talent: {
      name: 'Wasabi Blast',
      desc: 'Favored weapon explosions blast enemies outward (knockback + 45% Slow for 2s); the more enemies caught, the stronger the aftershock (+6% each, up to 60%)',
    },
    traits: ['Kills have a 25% chance to explode', 'Explosions inflict Burn', 'Burning enemies ignite nearby foes on death'],
    skill: {
      name: 'Wasabi Nuke',
      desc: 'Drop a wasabi nuke on the densest enemy cluster. After a quick countdown it detonates massively, leaving toxic ground for 3s that keeps damaging and Burning.',
    },
  },
};

// 1.4.0 F5：新角色
Object.assign(EN_CHARACTERS, EXTRA_CHARACTERS_EN);

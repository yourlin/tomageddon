import { ENEMIES } from '../src/data/enemies';
import { BOSSES } from '../src/data/bosses';
import { WEAPONS } from '../src/data/weapons';
import { EVOLVED_WEAPONS } from '../src/data/evolutions';
import { FUSED_WEAPONS } from '../src/data/recipes';
interface ProjectileJob {
  id: string;
  key: string;
  size: number[];
  color: number;
  spin: number;
  subject: string;
}

export function planProjectileArt(): ProjectileJob[] {
  const jobs: ProjectileJob[] = [];
  for (const w of [...new Map([...WEAPONS, ...EVOLVED_WEAPONS, ...FUSED_WEAPONS].map((w) => [w.id, w])).values()]) {
    if (!['bullet', 'rocket', 'flame', 'boomerang'].includes(w.kind)) continue;
    const shape =
      w.kind === 'flame'
        ? 'one compact stylized magical vapor/flame wisp particle, wispy tail LEFT and bright leading core RIGHT'
        : w.kind === 'boomerang'
          ? 'one isolated spinning thrown object, clear readable broad silhouette, no motion trail'
          : w.kind === 'rocket'
            ? 'one compact fruit/food explosive payload with a tiny integrated metal tail on LEFT and round pointed leading tip on RIGHT'
            : 'one compact single food/seed/crystal/magic bolt ammunition, leading tip on RIGHT';
    jobs.push({
      id: `player_${w.id}`,
      key: `proj_${w.id}`,
      size: w.kind === 'flame' ? [40, 40] : w.kind === 'boomerang' ? [40, 40] : w.kind === 'rocket' ? [48, 28] : [28, 24],
      color: w.projTint ?? 0xffd166,
      spin: 0,
      subject: `PLAYER WEAPON PROJECTILE for ${w.id} (${w.name}). ${w.desc}. Depict ${shape}. This is the projectile fired by the named weapon, NOT the gun, bow, launcher or bottle itself. For a thrown boomerang show the actual flying object; for a spray show a single airborne droplet/cloud. ${w.evolvedFrom ? 'Evolved premium version: more elaborate structure and distinct luminous core, different silhouette from normal ammunition.' : ''} Exactly ONE isolated projectile.`,
    });
  }
  for (const e of ENEMIES.filter((e) => e.behavior === 'shooter'))
    jobs.push({
      id: `enemy_${e.id}`,
      key: `proj_enemy_${e.id}`,
      size: [64, 64],
      color: e.color,
      spin: e.projKey === 'proj_web' ? 1.5 : 0,
      subject: `ENEMY AMMUNITION: ${e.id} (${e.name}). Attack: ${e.desc}. Show exactly ONE compact flying projectile appropriate to this attack and its material. NOT the creature, NOT a weapon. Read the attack description literally: web = delicate compact silk net; ice = sharp glossy cyan crystal; pollen = gold pink puff; thorn = pointed plant spike; seed = seed; robot = metal bolt; curse = purple magical bead. Dark silhouette outline, pale luminous inner highlights; no external splash or motion trail.`,
    });
  const types = new Set(['ring', 'spiral', 'aimed', 'scatter']);
  for (const b of BOSSES.filter(
    (b) =>
      b.chapter !== 1 &&
      [...b.patterns, ...(b.phases ?? []).flatMap((p) => [...p.patterns, ...(p.transition ?? [])])].some((p) => types.has(p.type)),
  ))
    jobs.push({
      id: `enemy_${b.id}`,
      key: `proj_enemy_${b.id}`,
      size: [64, 64],
      color: b.color,
      spin: 1,
      subject: `ELITE / BOSS AMMUNITION: ${b.id} (${b.name}), ${b.desc}. Theme of shooter: ${JSON.stringify(b.look)}. Create one premium compact magical or physical bolt, composed of the shooter's signature MATERIAL or food ingredient; visually readable as dangerous enemy projectile with red/orange/purple rim accents. If ice themed, icy crystal; bee/locust a thorn stinger; rat a sharpened seed/pebble; tomato chef ketchup; mechanical armor metal shard; spore boss a fuzzy spore; onion a pale purple juice bead. NOT a monster, NOT a weapon, NO character face. Single bolt only.`,
    });
  const legacy = [
    ['ice', 'one large cyan faceted ice crystal with white gleaming core'],
    ['web', 'one compact circular ivory silk spiderweb net with eight radial spokes and purple center'],
    ['player', 'one radiant cream-gold teardrop magical seed bolt, bright white core and golden rim'],
    ['enemy', 'one menacing glossy dark crimson ruby-red magic droplet, orange rim and white highlight'],
    ['pea', 'one round emerald-green glossy pea'],
    ['soda', 'one icy pale-blue fizzy soda bubble containing two tiny sparkles'],
    ['coin', 'one chunky shiny golden coin edge in slight three-quarter view, no text or numbers'],
    ['tomato', 'one tiny glossy red tomato with green calyx'],
    ['corn', 'one plump golden corn kernel'],
    ['rocket', 'one red chili pepper rocket with tiny brass tail fins'],
    ['flame', 'one compact gold and red curled flame wisp, facing right'],
    ['onion', 'one pale-purple onion cross-section ring'],
    ['rock', 'one faceted gray-brown pebble with a warm edge highlight'],
  ];
  for (const w of [...new Map([...WEAPONS, ...EVOLVED_WEAPONS, ...FUSED_WEAPONS].map((w) => [w.id, w])).values()]) {
    if (w.kind !== 'mine') continue;
    jobs.push({
      id: `mine_${w.id}`,
      key: `mine_${w.id}`,
      size: [48, 48],
      color: w.projTint ?? 0xffc46b,
      spin: 0,
      subject: `DEPLOYED GROUND MINE for ${w.id} (${w.name}). ${w.desc}. Create the actual compact food-themed bomb or trap placed on the arena floor, NOT its launcher, gun, staff or hand-held weapon. One low rounded self-contained device with a clear top surface, seen from an elevated three-quarter top view. Interpret the named ingredients literally: pepper = peppercorn grenade; popcorn = one golden corn-kernel trap; mint = frosted mint-crystal mine; soy = tiny sealed sauce-jar bomb; urchin = dark spiked spherical mine without a face; bean = green bean seed bomb; chocolate = cocoa chocolate tile trap; mushroom = compact capped mushroom trap; ember = glowing coal trap; potato = potato-shaped bomb. ${w.evolvedFrom || w.id.startsWith('fz_') ? 'Premium evolution/fusion: visibly combine the named ingredient motifs with a more elaborate mechanism, retain the original mine identity.' : ''} No floor, no external blast or shockwave, no hands, no face or eyes. Exactly ONE isolated planted device.`,
    });
  }
  for (const [id, subject] of legacy)
    jobs.push({
      id: `legacy_${id}`,
      key: `proj_${id}`,
      size: id === 'flame' ? [40, 40] : id === 'rocket' ? [48, 24] : id === 'onion' ? [40, 40] : [30, 30],
      color: 0xffd166,
      spin: 0,
      subject: `CORE PROJECTILE: ${subject}. Single airborne projectile, no face, no weapon, no motion trail.`,
    });
  const uniqueJobs = [...new Map([...jobs].reverse().map((j) => [j.key, j])).values()];
  return uniqueJobs;
}

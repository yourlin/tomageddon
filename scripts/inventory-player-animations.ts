// Authoritative player/skin scope; disk drafts are evidence of generation, never acceptance.
import { CHARACTERS } from '../src/data/characters';
import { SKINS_OF } from '../src/data/skins';
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
const source = resolve(process.env.TOMATO_ART_SOURCE ?? '../tomato-sister-art-source');
const actions = ['idle', 'move', 'attack', 'hurt', 'windup', 'charge', 'stun', 'die', 'spawn', 'cast', 'victory'];
const actors = CHARACTERS.flatMap((c) =>
  [undefined, ...SKINS_OF[c.id]].map((skin) => {
    const dir = resolve(source, 'drafts/char', c.id, ...(skin ? [skin.id] : []));
    const files = existsSync(dir) ? readdirSync(dir) : [];
    return {
      id: c.id,
      name: c.name,
      skinId: skin?.id ?? null,
      skinName: skin?.name ?? null,
      look: skin ? { ...c.look, ...skin.look, acc: [...(c.look.acc ?? []), ...(skin.look.acc ?? [])] } : c.look,
      actions: actions.map((action) => ({
        action,
        drafts: files.filter((f) => f.startsWith(`${action}-sheet-`) && f.endsWith('.png')),
        accepted: false,
      })),
      acceptance: 'unverified; requires identity, full actions, real playback, cross-scene and quality-tier checks',
    };
  }),
);
mkdirSync('reports/art-pilot', { recursive: true });
writeFileSync(
  'reports/art-pilot/player-animation-inventory.json',
  JSON.stringify(
    {
      source,
      priority: 'players/skins then bosses; enemies/elites await explicit user instruction',
      characters: CHARACTERS.length,
      appearances: actors.length,
      requiredActions: actions,
      actors,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  `${CHARACTERS.length} characters, ${actors.length} appearances, ${actors.length * actions.length} action entries; acceptance is not inferred from draft files.`,
);

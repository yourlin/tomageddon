// Derive Boss animation scope from actual gameplay patterns, never draft-file counts.
import { BOSSES } from '../src/data/bosses';
import { CH1_BOSS_FORMS } from '../src/data/combatArt';
import forms from '../src/data/bossFormArt.generated.json';
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
const source = resolve(process.env.TOMATO_ART_SOURCE ?? '../tomato-sister-art-source');
const actors = BOSSES.filter((b) => !b.elite).map((b) => ({
  id: b.id,
  name: b.name,
  chapter: b.chapter,
  forms: (b.phases?.length ? b.phases : [undefined]).map((phase, index) => {
    const patterns = [...(phase?.patterns ?? b.patterns), ...(phase?.transition ?? [])];
    const types = [...new Set(patterns.map((p) => p.type))];
    const actions = ['idle', 'move', 'hurt', 'die', 'spawn', 'stun'];
    if (types.some((t) => t !== 'charge' && t !== 'summon' && t !== 'buff')) actions.push('attack');
    if (types.includes('summon') || types.includes('buff')) actions.push('cast');
    if (types.includes('charge')) actions.push('windup', 'charge');
    const form = forms.find((f) => f.id === b.id && f.phase === index);
    const file = form
      ? `combat/global/${form.file}`
      : CH1_BOSS_FORMS[b.id]?.[index]
        ? `combat/ch1/${CH1_BOSS_FORMS[b.id][index].file}`
        : `entities/boss/${b.id}/body.png`;
    const stem = `${b.id}${index ? `-phase-${index}` : ''}`;
    const reportPath = resolve('reports/art-pilot', `${stem}-motion-native.json`);
    const native = existsSync(reportPath)
      ? (JSON.parse(readFileSync(reportPath, 'utf8')) as { checks?: { state: string; authoredFrames: number }[] })
      : undefined;
    const verified = actions.every((action) => native?.checks?.some((c) => c.state === action && c.authoredFrames >= 4));
    const draftDir = resolve(source, 'drafts/boss', b.id, ...(index ? ['phases', String(index)] : ['base']));
    const drafts = existsSync(draftDir) ? readdirSync(draftDir) : [];
    return {
      phase: index,
      name: phase?.name ?? b.name,
      patterns: types,
      requiredActions: actions,
      frozenPolicy: 'Freeze holds the current drawn pose; status tint remains gameplay feedback.',
      staticOriginal: resolve(source, file),
      staticOriginalExists: existsSync(resolve(source, file)),
      runtimeDirectory: `entities/boss/${b.id}/${index ? `phases/${index}` : 'base'}`,
      draftActions: actions.filter((action) => drafts.some((f) => f.startsWith(`${action}-sheet-pilot-`) && f.endsWith('.png'))),
      nativeAuthoredFrames: verified ? native!.checks!.reduce((n, c) => n + c.authoredFrames, 0) : 0,
      animationStatus: verified
        ? 'native playback verified; final visual/performance acceptance pending'
        : 'production animation not yet verified',
      nativeReport: verified ? reportPath : null,
    };
  }),
}));
const result = {
  source,
  order:
    'Default players and18nonelite Bosses integrated. Scene-first, then34approved elites, then89approved enemies; skins deferred. Codex includes all52Boss/elite entries.',
  bossBodies: actors.length,
  extraPhaseForms: actors.reduce((n, b) => n + b.forms.length - 1, 0),
  actors,
  integrationRequired: [
    'Animated phase texture/action switching',
    'Scene leases for only selected Boss and needed forms',
    'Phone/QHD asset tiers',
    'Actual damage-triggered phase transitions, death and pooled reset',
    'Final visual and performance acceptance',
  ],
};
mkdirSync('reports/art-pilot', { recursive: true });
writeFileSync('reports/art-pilot/boss-animation-inventory.json', JSON.stringify(result, null, 2) + '\n');
console.log(`${result.bossBodies} Boss bodies, ${result.extraPhaseForms} extra forms; action requirements derived from gameplay.`);

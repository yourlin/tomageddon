// Audit shared combat definitions; Codex separates formal Bosses from elites.
import { BOSSES, elitePool, bossPool, TRUE_FINAL_BOSS_ID } from '../src/data/bosses';
import { ENTITY_ART } from '../src/data/artManifest';
import { writeFileSync } from 'node:fs';
const rows = BOSSES.map((b) => {
  const route =
    b.id === TRUE_FINAL_BOSS_ID
      ? 'chapter7 normal Boss defeat → true final boss'
      : b.elite && elitePool(b.chapter).some((e) => e.id === b.id)
        ? 'chapter elite pool → selected elite waves'
        : !b.elite && bossPool(b.chapter).some((e) => e.id === b.id)
          ? 'chapter Boss pool → final wave'
          : null;
  const art = ENTITY_ART.find((e) => e.kind === 'boss' && e.id === b.id && !e.skinId && !e.variant);
  const animated = art?.source?.type === 'spritesheet' || art?.source?.type === 'atlas';
  return {
    id: b.id,
    name: b.name,
    chapter: b.chapter,
    category: b.elite ? 'elite' : b.id === TRUE_FINAL_BOSS_ID ? 'true-final' : 'chapter-boss',
    route,
    bodySource: art?.source?.type ?? 'procedural',
    animated,
    requiresAnimation: true,
    phaseForms: b.phases?.length ?? 1,
  };
});
const result = {
  scope:
    'Shared combat-definition route audit, not 52 full playthroughs. Codex Boss tab has 18 formal Bosses; Elite tab has 34 elites. Static portraits and combat animation coverage are separate.',
  codexBossEntries: rows.filter((r) => r.category !== 'elite').length,
  codexEliteEntries: rows.filter((r) => r.category === 'elite').length,
  count: rows.length,
  reachableByGameplayRoute: rows.filter((r) => r.route).length,
  elites: rows.filter((r) => r.category === 'elite').length,
  regularBosses: rows.filter((r) => r.category === 'chapter-boss').length,
  trueFinalBosses: rows.filter((r) => r.category === 'true-final').length,
  animatedBaseEntries: rows.filter((r) => r.animated).length,
  missingAnimation: rows.filter((r) => !r.animated).map((r) => r.id),
  rows,
  errors: rows.filter((r) => !r.route).map((r) => `No gameplay entry: ${r.id}`),
};
writeFileSync('reports/art-pilot/codex-boss-animation-coverage.json', JSON.stringify(result, null, 2) + '\n');
console.log(
  JSON.stringify({
    count: result.count,
    reachable: result.reachableByGameplayRoute,
    elites: result.elites,
    regular: result.regularBosses,
    trueFinal: result.trueFinalBosses,
    animated: result.animatedBaseEntries,
    missing: result.missingAnimation.length,
    errors: result.errors,
  }),
);
if (result.errors.length) process.exitCode = 1;

// 从玩法定义计算全量美术范围；文件存在且登记后才计为已接入。
import { writeFileSync, existsSync } from 'node:fs';
import { ENEMIES } from '../src/data/enemies';
import { BOSSES } from '../src/data/bosses';
import { WEAPONS } from '../src/data/weapons';
import { EVOLVED_WEAPONS } from '../src/data/evolutions';
import { FUSED_WEAPONS } from '../src/data/recipes';
import { CHAPTERS } from '../src/data/chapters';
import { ENTITY_ART } from '../src/data/artManifest';
import weaponArt from '../src/data/weaponArt.generated.json';
import bossForms from '../src/data/bossFormArt.generated.json';
import { CH1_BOSS_FORMS } from '../src/data/combatArt';
const enemies = ENEMIES.map((e) => ({
  kind: 'enemy',
  id: e.id,
  name: e.name,
  desc: e.desc,
  behavior: e.behavior,
  projKey: e.projKey,
  look: e.look,
  chapters: CHAPTERS.filter((c) => c.pool.some((p) => p.enemy === e.id)).map((c) => c.id),
  ready: ENTITY_ART.some(
    (a) => a.kind === 'enemy' && a.id === e.id && a.source && existsSync(`src/assets/entities/enemy/${e.id}/${a.source.file}`),
  ),
}));
const bosses = BOSSES.map((e) => ({
  kind: 'boss',
  id: e.id,
  name: e.name,
  desc: e.desc,
  chapter: e.chapter,
  elite: !!e.elite,
  look: e.look,
  phases: e.phases?.map((p, i) => ({
    phase: i,
    name: p.name,
    ready:
      i === 0
        ? ENTITY_ART.some((a) => a.kind === 'boss' && a.id === e.id)
        : !!CH1_BOSS_FORMS[e.id]?.[i] || (bossForms as { id: string; phase: number }[]).some((f) => f.id === e.id && f.phase === i),
  })),
  ready: ENTITY_ART.some(
    (a) => a.kind === 'boss' && a.id === e.id && a.source && existsSync(`src/assets/entities/boss/${e.id}/${a.source.file}`),
  ),
}));
const allWeapons = [...new Map([...WEAPONS, ...EVOLVED_WEAPONS, ...FUSED_WEAPONS].map((w) => [w.id, w])).values()];
const weapons = allWeapons.map((w) => ({
  id: w.id,
  name: w.name,
  desc: w.desc,
  kind: w.kind,
  cls: w.cls,
  template: w.template,
  evolvedFrom: w.evolvedFrom,
  projKey: w.projKey,
  ready: weaponArt.some((a) => a.id === w.id && existsSync(`src/assets/weapons/${a.file}`)),
}));
const report = {
  objective: '全局所有怪物、精英、Boss及阶段、敌我子弹、武器精致制作并接入验证',
  counts: {
    enemies: enemies.length,
    enemiesReady: enemies.filter((e) => e.ready).length,
    elites: bosses.filter((e) => e.elite).length,
    bosses: bosses.filter((e) => !e.elite).length,
    bossBodiesReady: bosses.filter((e) => e.ready).length,
    bossPhaseFrames: bosses.flatMap((b) => b.phases?.slice(1) ?? []).length,
    weapons: weapons.length,
    fusionWeapons: FUSED_WEAPONS.length,
    weaponsReady: weapons.filter((w) => w.ready).length,
  },
  enemies,
  bosses,
  weapons,
};
writeFileSync('reports/art-pilot/global-inventory.json', JSON.stringify(report, null, 2) + '\n');
console.log(report.counts);
console.log(
  'Next chapter2:',
  enemies
    .filter((e) => !e.ready && e.chapters.includes(2))
    .map((e) => `${e.id}: ${e.name}`)
    .join(', '),
);

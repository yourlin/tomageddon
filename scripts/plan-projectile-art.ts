import { mkdirSync, writeFileSync } from 'node:fs';
import { planProjectileArt } from './global-projectile-plan';
const jobs = planProjectileArt();
mkdirSync('reports/art-pilot', { recursive: true });
writeFileSync('reports/art-pilot/global-projectile-generation-jobs.json', JSON.stringify(jobs, null, 2) + '\n');
console.log({ projectileJobs: jobs.length, player: jobs.filter((j) => j.id.startsWith('player')).length });

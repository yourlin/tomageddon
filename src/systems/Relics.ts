// 遗物系统（C 模块）：抽取三选一、获得遗物、图鉴记录
import { RELICS, RELIC_MAP, type RelicDef, type RelicKind } from '../data/relics';
import { run } from './RunState';
import { save } from './Save';
import { bump, bumpMax } from './Counters';
import type { Rand } from './Rng';

/** 各类遗物出现权重：诅咒型少一些 */
const KIND_WEIGHT: Record<RelicKind, number> = { boon: 5, trade: 4, curse: 2 };

/** 抽 n 个本局未持有的遗物（同一次不重复）；kinds 可限定类别（神秘商人只卖交易 / 诅咒型） */
export function rollRelics(n: number, rand: Rand = Math.random, kinds?: RelicKind[]): RelicDef[] {
  const pool = RELICS.filter((r) => !run.relics.includes(r.id) && (!kinds || kinds.includes(r.kind)));
  const out: RelicDef[] = [];
  while (out.length < n && pool.length) {
    const total = pool.reduce((a, r) => a + KIND_WEIGHT[r.kind], 0);
    let x = rand() * total;
    let i = 0;
    for (; i < pool.length - 1; i++) {
      x -= KIND_WEIGHT[pool[i].kind];
      if (x <= 0) break;
    }
    out.push(pool[i]);
    pool.splice(i, 1);
  }
  return out;
}

/** 获得一个遗物：写入本局、图鉴与计数器，立即重算属性与规则 */
export function grantRelic(id: string): void {
  if (!RELIC_MAP[id] || run.relics.includes(id)) return;
  const before = run.stats.maxHp;
  run.relics.push(id);
  if (!save.meta.relics.includes(id)) save.meta.relics.push(id);
  bumpMax('relicsSeen', save.meta.relics.length);
  bump('relics');
  bump(`relicKind:${RELIC_MAP[id].kind}`);
  run.dirty();
  const after = run.stats.maxHp;
  if (after > before) run.hp += after - before;
  run.hp = Math.min(run.hp, after);
  for (const s of run.relicFx.sets) bumpMax(`relicSet:${s}`, 1);
}

/** 本局持有的遗物定义 */
export const ownedRelics = (): RelicDef[] => run.relics.map((id) => RELIC_MAP[id]).filter(Boolean);

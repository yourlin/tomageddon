// 局内随机性（H1 事件波、H3 危险路线）与无尽变异（B5）：数据 + 判定，GameScene 只负责表现
import type { RuleDelta } from '../data/danger';
import { AFFIX_IDS, type AffixId } from '../data/bosses';
import { BALANCE, chapterWaves, isBossWaveFor, isEliteWaveFor } from '../data/balance';
import { hashSeed, mulberry32 } from './Rng';
import { run } from './RunState';
import { tx } from '../i18n';
import { describeRule } from '../data/relics';
import { mechanicOpen } from './Mechanics';

export type EventId = 'gold_rain' | 'chest_horde' | 'merchant_raid' | 'darkness';

export interface RunEventDef {
  id: EventId;
  icon: string;
  name: [string, string];
  /** 额外说明（规则数值部分由 describeRule 自动生成） */
  note: [string, string];
  rule: RuleDelta;
}

export const RUN_EVENTS: RunEventDef[] = [
  {
    id: 'gold_rain',
    icon: '🌧️',
    name: ['金币雨', 'Gold Rain'],
    note: ['天上不停掉番茄籽', 'Seeds keep falling from the sky'],
    rule: { income: 40 },
  },
  {
    id: 'chest_horde',
    icon: '📦',
    name: ['宝箱怪潮', 'Chest Horde'],
    note: ['本波宝箱掉率 ×4，上限 +3', 'Crate drops ×4 this wave, cap +3'],
    rule: { spawn: 25 },
  },
  {
    id: 'merchant_raid',
    icon: '🛒',
    name: ['商人突袭', 'Merchant Raid'],
    note: ['敌人更急躁，但本波之后的商店打折', 'Enemies are restless, but the next shop is on sale'],
    rule: { enemySpeed: 15, shopPrice: -30 },
  },
  {
    id: 'darkness',
    icon: '🌑',
    name: ['黑暗波', 'Darkness'],
    note: ['视野只剩身边一圈', 'You can only see around yourself'],
    rule: { xp: 50, income: 30 },
  },
];
export const RUN_EVENT_MAP = Object.fromEntries(RUN_EVENTS.map((e) => [e.id, e])) as Record<EventId, RunEventDef>;

export const describeEvent = (e: RunEventDef): string => [tx(e.note[0], e.note[1]), ...describeRule(e.rule)].join(tx('；', '; '));

/** 局内确定性随机：同一局（开局时间）同一用途结果固定，读档后不会变 */
const rnd = (key: string) => mulberry32(hashSeed(`${run.challenge?.seed ?? run.startedAt}:${key}`));

/** H1：每 15 波一轮里随机 1–2 个事件波（避开第 1–2 波、精英波与 Boss 波） */
export function eventForWave(wave: number): EventId | null {
  if (run.events[wave]) return run.events[wave] as EventId;
  if (!mechanicOpen('events')) return null;
  // 每 15 波一段，每段随机 1–2 个事件波（避开每段前 2 波、精英波与 Boss 波）
  const L = BALANCE.waves.bossWave;
  const cycle = Math.floor((wave - 1) / L);
  const r = rnd(`events:${cycle}`);
  const base = cycle * L;
  const cand = Array.from({ length: L }, (_, i) => base + i + 1).filter(
    (w) => (w - 1) % L >= 2 && !isBossWaveFor(run.chapterId, w, run.endless) && !isEliteWaveFor(run.chapterId, w, run.endless),
  );
  const n = r() < 0.5 ? 1 : 2;
  const picks: number[] = [];
  while (picks.length < n && cand.length) picks.push(cand.splice(Math.floor(r() * cand.length), 1)[0]);
  if (!picks.includes(wave)) return null;
  const id = RUN_EVENTS[Math.floor(r() * RUN_EVENTS.length)].id;
  run.events[wave] = id;
  return id;
}

/** H3：危险路线——下一波敌人更强，结束时额外宝箱，收入更高 */
export const HARD_ROUTE_RULE: RuleDelta = { enemyHp: 25, enemyDmg: 20, income: 50 };
/** H3：每 3 波提供一次路线选择（下一波不是精英 / Boss 波） */
export function routeChoiceAvailable(nextWave: number): boolean {
  return (
    nextWave >= 3 &&
    nextWave % 3 === 0 &&
    !isBossWaveFor(run.chapterId, nextWave, run.endless) &&
    !isEliteWaveFor(run.chapterId, nextWave, run.endless)
  );
}

/** B5：无尽模式进入后（本章最后一波之后）每 5 波获得一个变异词缀（精英 / Boss 必带，词缀小怪更常见） */
export function mutations(wave: number): AffixId[] {
  const n0 = chapterWaves(run.chapterId);
  if (!run.endless || wave <= n0) return [];
  const n = Math.floor((wave - n0) / 5);
  const pool = [...AFFIX_IDS];
  const out: AffixId[] = [];
  const r = rnd('mutations');
  for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(r() * pool.length), 1)[0]);
  return out;
}
export const mutationRule = (n: number): RuleDelta => ({ champ: n * 25 });

/** B2：无尽模式中「本章波数 + 15」起的每个 Boss 波出现两只 Boss（15 波的章节即第 30 / 45 / 60…波） */
export const isSuperBossWave = (wave: number): boolean =>
  run.endless && wave >= chapterWaves(run.chapterId) + BALANCE.waves.bossWave && isBossWaveFor(run.chapterId, wave, true);

/** B6：无尽复活价格 */
export const reviveCost = (wave: number): number => 30 + wave * 10;

/** 在一波开始时写入事件 / 路线 / 变异的规则；返回本波事件 */
export function applyWaveRules(): RunEventDef | null {
  const ev = eventForWave(run.wave);
  const def = ev ? RUN_EVENT_MAP[ev] : null;
  if (def) run.extraRules.event = def.rule;
  else delete run.extraRules.event;
  if (run.hardRoute) run.extraRules.route = HARD_ROUTE_RULE;
  else delete run.extraRules.route;
  const m = mutations(run.wave).length;
  if (m) run.extraRules.mutation = mutationRule(m);
  else delete run.extraRules.mutation;
  run.dirty();
  return def;
}

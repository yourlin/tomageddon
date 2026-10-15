// Boss 阶段数据自检：每个章节 Boss 都有阶段、门槛递减、每阶段至少 2 个招式、招式类型合法
import { describe, it, expect } from 'vitest';
import { BOSSES } from '../src/data/bosses';
import { BOSS_PHASES, SHADOWS } from '../src/data/bossPhases';
import { BALANCE } from '../src/data/balance';

const TYPES = new Set(['ring', 'spiral', 'aimed', 'charge', 'summon', 'slam', 'hazard', 'laser', 'teleport', 'buff', 'scatter']);
const CHAPTER_BOSSES = BOSSES.filter((b) => !b.elite);

describe('Boss 阶段', () => {
  it('每个章节 Boss（含真结局）都有阶段设计', () => {
    for (const b of CHAPTER_BOSSES) expect(b.phases?.length, b.id).toBeGreaterThanOrEqual(2);
    expect(Object.keys(BOSS_PHASES).every((id) => CHAPTER_BOSSES.some((b) => b.id === id))).toBe(true);
  });
  it('第 1 阶段 at = 1，门槛严格递减，每阶段至少 2 个招式且类型合法，有中英文阶段名', () => {
    for (const b of CHAPTER_BOSSES) {
      const ps = b.phases!;
      expect(ps[0].at, b.id).toBe(1);
      for (let i = 1; i < ps.length; i++) expect(ps[i].at, `${b.id} 第 ${i + 1} 阶段`).toBeLessThan(ps[i - 1].at);
      for (const p of ps) {
        expect(p.patterns.length, `${b.id} ${p.name[0]}`).toBeGreaterThanOrEqual(2);
        for (const pat of [...p.patterns, ...(p.transition ?? [])]) expect(TYPES.has(pat.type), `${b.id}: ${pat.type}`).toBe(true);
        expect(p.name[0].length && p.name[1].length).toBeTruthy();
      }
    }
  });
  it('最短战斗时间：各阶段最短时长 + 转阶段 ≥ 18 秒（最后一阶段另计）', () => {
    for (const b of CHAPTER_BOSSES) {
      const ps = b.phases!;
      const t = ps.slice(0, -1).reduce((a, p) => a + (p.minTime ?? BALANCE.bossPhase.minTime) + BALANCE.bossPhase.transTime, 0);
      expect(t, b.id).toBeGreaterThanOrEqual(18);
    }
  });
  it('残影配置引用的 Boss 都存在', () => {
    expect(CHAPTER_BOSSES.some((b) => b.id === SHADOWS.boss)).toBe(true);
    for (const id of SHADOWS.ids)
      expect(
        CHAPTER_BOSSES.some((b) => b.id === id),
        id,
      ).toBe(true);
    expect(SHADOWS.phase).toBeLessThan(CHAPTER_BOSSES.find((b) => b.id === SHADOWS.boss)!.phases!.length);
  });
});

import { PHASE_ANIMS } from '../src/systems/BossPhaseAnims';
describe('Boss 转阶段动画', () => {
  it('每个 Boss 的每次转阶段都有专属动画，且只引用存在的阶段', () => {
    for (const b of CHAPTER_BOSSES)
      for (let i = 1; i < b.phases!.length; i++) expect(PHASE_ANIMS[`${b.id}:${i}`], `${b.id}:${i}`).toBeDefined();
    for (const k of Object.keys(PHASE_ANIMS)) {
      const [id, n] = k.split(':');
      const b = CHAPTER_BOSSES.find((x) => x.id === id);
      expect(b && Number(n) >= 1 && Number(n) < b.phases!.length, k).toBeTruthy();
    }
  });
});

// H5：局内小任务——抽取确定性、各任务完成 / 失败判定、奖励随波次增长
import { describe, it, expect } from 'vitest';
import {
  WaveQuestTracker,
  WAVE_QUESTS,
  QUEST_TUNING,
  questPool,
  questReward,
  rollQuest,
  type WaveQuestId,
} from '../src/systems/WaveQuests';
import { mulberry32 } from '../src/systems/Rng';

const ALL = { hasElite: true, hasSkill: true, hasAura: true };
const start = (id: WaveQuestId, wave = 5) => {
  const t = new WaveQuestTracker();
  const q = t.start(wave, () => 0, { force: id });
  return { t, q: q! };
};

describe('任务数据', () => {
  it('8 种任务，id 唯一，中英文非空', () => {
    expect(WAVE_QUESTS.length).toBe(8);
    expect(new Set(WAVE_QUESTS.map((q) => q.id)).size).toBe(WAVE_QUESTS.length);
    for (const d of WAVE_QUESTS) {
      expect(d.name[0] && d.name[1], d.id).toBeTruthy();
      const { q, t } = start(d.id);
      expect(q.desc[0].length && q.desc[1].length, d.id).toBeTruthy();
      expect(q.desc.join('')).not.toMatch(/undefined|NaN/);
      const s = t.status()!;
      expect(s.text[0] && s.text[1], d.id).toBeTruthy();
    }
  });
  it('奖励随波次增长', () => {
    for (const d of WAVE_QUESTS) {
      const a = questReward(d.id, 3);
      const b = questReward(d.id, 12);
      expect(b.seeds).toBeGreaterThan(a.seeds);
      expect(b.xp).toBeGreaterThan(a.xp);
      expect(a.seeds).toBeGreaterThan(0);
    }
  });
});

describe('抽取', () => {
  it('确定性 rng 结果一致', () => {
    const seq = (s: number) => Array.from({ length: 30 }, (_, i) => rollQuest(i + 1, mulberry32(s + i), ALL));
    expect(seq(42)).toEqual(seq(42));
    expect(seq(42).some((x) => x !== null)).toBe(true);
    expect(seq(42).some((x) => x === null)).toBe(true);
  });
  it('第 1 波、概率 0 不出任务；rng 大于概率不出', () => {
    expect(rollQuest(1, () => 0, ALL)).toBeNull();
    expect(rollQuest(5, () => 0, { ...ALL, chance: 0 })).toBeNull();
    expect(rollQuest(5, () => 0.99, ALL)).toBeNull();
    expect(rollQuest(5, () => 0, ALL)).toBe(questPool(ALL)[0].id);
  });
  it('条件过滤：无精英 / 技能 / 光环不出对应任务；Boss 波只出保持型', () => {
    const ids = questPool({}).map((q) => q.id);
    expect(ids).not.toContain('elite_kill');
    expect(ids).not.toContain('no_skill');
    expect(ids).not.toContain('aura_kill');
    const boss = questPool({ ...ALL, isBoss: true }).map((q) => q.id);
    expect(boss.sort()).toEqual(['few_hits', 'no_hurt', 'no_skill']);
  });
  it('大量抽取都落在池内', () => {
    const r = mulberry32(7);
    const pool = new Set(questPool({ hasElite: true }).map((q) => q.id));
    for (let i = 0; i < 500; i++) {
      const id = rollQuest(5, r, { hasElite: true });
      if (id) expect(pool.has(id)).toBe(true);
    }
  });
});

describe('判定', () => {
  it('无任务时事件无副作用，finish 返回 null', () => {
    const t = new WaveQuestTracker();
    expect(t.start(1, () => 0)).toBeNull();
    t.onKill(true);
    t.onHurt();
    t.tick(1);
    expect(t.status()).toBeNull();
    expect(t.finish()).toBeNull();
  });
  it('本波不受伤：受伤失败，否则波末完成', () => {
    let { t } = start('no_hurt');
    t.onKill();
    expect(t.finish()).toEqual(questReward('no_hurt', 5));
    ({ t } = start('no_hurt'));
    t.onHurt();
    expect(t.status()!.state).toBe('failed');
    expect(t.finish()).toBeNull();
  });
  it('速战速决：时限内达标完成，超时失败', () => {
    let { t, q } = start('speed_kill', 4);
    expect(q.target).toBe(QUEST_TUNING.speedKills(4));
    for (let i = 0; i < q.target; i++) {
      t.tick(0.1);
      t.onKill();
    }
    expect(t.status()!.state).toBe('done');
    t.tick(100);
    expect(t.finish()).not.toBeNull();
    ({ t, q } = start('speed_kill', 4));
    t.onKill();
    t.tick(q.timeLimit + 0.1);
    expect(t.status()!.state).toBe('failed');
    for (let i = 0; i < q.target; i++) t.onKill();
    expect(t.finish()).toBeNull();
  });
  it('猎杀精英：击杀精英完成，否则波末失败', () => {
    let { t } = start('elite_kill');
    t.onKill(false);
    t.onKill(true);
    expect(t.status()!.state).toBe('done');
    expect(t.finish()).not.toBeNull();
    ({ t } = start('elite_kill'));
    t.onKill(false);
    expect(t.finish()).toBeNull();
  });
  it('不用技能：用技能失败', () => {
    let { t } = start('no_skill');
    expect(t.finish()).not.toBeNull();
    ({ t } = start('no_skill'));
    t.onSkill();
    expect(t.finish()).toBeNull();
  });
  it('光环收割：只计光环击杀', () => {
    const { t, q } = start('aura_kill');
    for (let i = 0; i < q.target * 2; i++) t.onKill(false, false);
    expect(t.status()!.state).toBe('active');
    for (let i = 0; i < q.target; i++) t.onKill(false, true);
    expect(t.status()!.state).toBe('done');
    expect(t.finish()).not.toBeNull();
  });
  it('大扫除：达到击杀数完成，不足失败', () => {
    let { t, q } = start('kill_count');
    for (let i = 0; i < q.target - 1; i++) t.onKill();
    expect(t.finish()).toBeNull();
    ({ t, q } = start('kill_count'));
    for (let i = 0; i < q.target; i++) t.onKill();
    expect(t.finish()).not.toBeNull();
  });
  it('小心翼翼：受伤次数 ≤ 上限完成，超过失败', () => {
    let { t, q } = start('few_hits');
    for (let i = 0; i < q.target; i++) t.onHurt();
    expect(t.finish()).not.toBeNull();
    ({ t, q } = start('few_hits'));
    for (let i = 0; i <= q.target; i++) t.onHurt();
    expect(t.status()!.state).toBe('failed');
    expect(t.finish()).toBeNull();
  });
  it('连斩：窗口内击杀达标完成；击杀分散不算', () => {
    let { t, q } = start('combo');
    for (let i = 0; i < q.target * 3; i++) {
      t.onKill();
      t.tick(q.timeLimit / 2);
    }
    expect(t.status()!.state).toBe('active');
    expect(t.finish()).toBeNull();
    ({ t, q } = start('combo'));
    for (let i = 0; i < q.target; i++) {
      t.onKill();
      t.tick(q.timeLimit / (q.target * 2));
    }
    expect(t.status()!.state).toBe('done');
    expect(t.finish()).not.toBeNull();
  });
  it('status().changed 只在状态切换后第一次为 true；进度 0–1', () => {
    const { t, q } = start('kill_count');
    expect(t.status()!.changed).toBe(false);
    for (let i = 0; i < q.target; i++) {
      t.onKill();
      const p = t.status()!.progress;
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
    const s = new WaveQuestTracker();
    s.start(5, () => 0, { force: 'no_hurt' });
    s.onHurt();
    expect(s.status()!.changed).toBe(true);
    expect(s.status()!.changed).toBe(false);
  });
  it('finish 后状态清空，可开始下一波', () => {
    const { t } = start('no_hurt');
    t.finish();
    expect(t.quest).toBeNull();
    expect(t.start(6, () => 0, { force: 'kill_count' })!.wave).toBe(6);
    expect(t.kills).toBe(0);
  });
});

// K4 / K5：存档版本迁移与导入导出
import { describe, it, expect } from 'vitest';
import { migrate, normalize, SAVE_VERSION, save, exportSave, importSave } from '../src/systems/Save';

/** 1.3.x 的存档样本（没有 saveVersion 与 meta） */
const V1 = {
  clearedChapters: 3,
  totalKills: 12345,
  wins: 4,
  bestWave: { tomato_1: 15, tomato_2: 27, carrot_3: 9 },
  charWins: { tomato: 3 },
  settings: { sfx: 0.3, music: 0.2, shake: false, showDmg: true, showFps: false, fpsLimit: 60, autoSkill: true },
  seen: { items: ['a'], weapons: [], enemies: [], bosses: [] },
  achievements: { first_win: { tier: 1, t: 1 }, legacy: 12345 },
  talents: { m_core: 2 },
  history: [],
};

describe('存档迁移', () => {
  it('1.3.x 存档升级到当前版本', () => {
    const d = migrate(structuredClone(V1) as Record<string, unknown>) as Record<string, unknown>;
    expect(d.saveVersion).toBe(SAVE_VERSION);
    const meta = d.meta as { endlessBest: Record<string, number>; gold: number; streak: { days: number } };
    expect(meta.endlessBest).toEqual({ tomato_2: 27 });
    expect(meta.gold).toBe(0);
    expect(meta.streak.days).toBe(0);
  });
  it('normalize 保留旧数据并补全新字段', () => {
    const s = normalize(structuredClone(V1));
    expect(s.totalKills).toBe(12345);
    expect(s.settings.sfx).toBe(0.3);
    expect(s.achievements.legacy).toBeUndefined();
    expect(s.meta.dangerUnlocked).toEqual({});
    expect(s.challenges).toEqual({});
  });
  it('已是最新版本的存档不重复迁移，缺失的 meta 键用默认值补齐', () => {
    const d = migrate({ saveVersion: SAVE_VERSION, meta: { gold: 50 } });
    expect((d.meta as { gold: number; master: number }).gold).toBe(50);
    expect((d.meta as { master: number }).master).toBe(0);
  });
});

describe('存档导入导出', () => {
  it('导出后再导入得到相同存档', () => {
    save.totalKills = 777;
    save.meta.gold = 42;
    const text = exportSave();
    save.totalKills = 0;
    save.meta.gold = 0;
    expect(importSave(text)).toBeNull();
    expect(save.totalKills).toBe(777);
    expect(save.meta.gold).toBe(42);
  });
  it('也接受原始 JSON（旧版本会被迁移）', () => {
    expect(importSave(JSON.stringify(V1))).toBeNull();
    expect(save.wins).toBe(4);
    expect(save.saveVersion).toBe(SAVE_VERSION);
  });
  it('拒绝无效文本', () => {
    expect(importSave('hello')).toBe('invalid');
    expect(importSave('{"a":1}')).toBe('invalid');
  });
});

// K4 / K5：存档版本迁移与导入导出
import { describe, it, expect } from 'vitest';
import { migrate, normalize, SAVE_VERSION, LEGACY_FAVOR_XP, save, exportSave, importSave } from '../src/systems/Save';
import { masteryNeed, masteryLevel, favorStageForLevel, FAVOR_UNLOCK } from '../src/systems/Mastery';

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
  it('2 → 3：玩过的角色熟练度补到 7 级（保留双契合），没玩过的不补，已经更高的不变', () => {
    const d = migrate({
      saveVersion: 2,
      charRuns: { tomato: 5, carrot: 0 },
      charWins: { chili: 1 },
      meta: { mastery: { tomato: 300, lemon: 9999, corn: 40 } },
    }) as { meta: { mastery: Record<string, number> } };
    const m = d.meta.mastery;
    expect(m.tomato).toBe(LEGACY_FAVOR_XP); // 玩过 5 局，300 经验补到 7 级
    expect(m.chili).toBe(LEGACY_FAVOR_XP); // 只有胜场记录也算玩过
    expect(m.corn).toBe(LEGACY_FAVOR_XP); // 有熟练度经验就算玩过
    expect(m.lemon).toBe(9999); // 已经高于 7 级，不降
    expect(m.carrot).toBeUndefined(); // 局数为 0 不算玩过
    expect(masteryLevel('x')).toBe(1);
    expect(favorStageForLevel(7)).toBe(2);
  });
  it('补到的经验正好是双契合解锁等级', () => {
    expect(LEGACY_FAVOR_XP).toBe(masteryNeed(FAVOR_UNLOCK.double));
  });
  it('1.3.x 存档：有胜场的角色同样补到 7 级', () => {
    const d = migrate(structuredClone(V1) as Record<string, unknown>) as { meta: { mastery: Record<string, number> } };
    expect(d.meta.mastery).toEqual({ tomato: LEGACY_FAVOR_XP });
  });
  it('新版本存档（已是 3）不再补', () => {
    const d = migrate({ saveVersion: SAVE_VERSION, charRuns: { tomato: 3 }, meta: { mastery: { tomato: 100 } } }) as {
      meta: { mastery: Record<string, number> };
    };
    expect(d.meta.mastery.tomato).toBe(100);
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

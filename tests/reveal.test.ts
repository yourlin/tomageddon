// 玩法露出：解锁前不显示
import { describe, it, expect, beforeEach } from 'vitest';
import { save } from '../src/systems/Save';
import { reveal, MILESTONES, nextMilestone, nextUnlockLine, resultHook, takeNewMilestones } from '../src/systems/Reveal';

describe('玩法露出', () => {
  beforeEach(() => {
    save.clearedChapters = 0;
    save.challenges = {};
    save.meta.gold = 0;
    save.meta.goldEarned = 0;
    save.meta.skins = [];
    save.meta.mastery = {};
    save.meta.master = 0;
    save.achievements = {};
    save.talents = {};
    save.charTalents = {};
    save.revealSeen = [];
  });

  it('新存档：无尽、危机、挑战、金番茄、皮肤、天赋、大师层都不显示', () => {
    for (const [k, f] of Object.entries(reveal)) expect(f(), k).toBe(false);
  });

  it('首次通关后出现无尽、危机与每日挑战', () => {
    save.clearedChapters = 1;
    expect(reveal.endless()).toBe(true);
    expect(reveal.danger()).toBe(true);
    expect(reveal.challenges()).toBe(true);
    expect(reveal.gold()).toBe(false);
  });

  it('获得金番茄后出现金番茄与皮肤；买过大师层的老存档照常显示', () => {
    save.meta.goldEarned = 5;
    expect(reveal.gold()).toBe(true);
    expect(reveal.skins()).toBe(true);
    save.meta.master = 1;
    expect(reveal.master()).toBe(true);
  });

  it('下一个解锁：新存档先提示天赋树，通关后提示金番茄', () => {
    expect(nextMilestone()?.id).toBe('talents');
    expect(nextUnlockLine()).toContain('天赋树');
    expect(resultHook()).toContain('天赋树');
    save.clearedChapters = 1;
    save.achievements = { clear_1: { tier: 1, t: 0 } };
    expect(nextMilestone()?.id).toBe('gold');
    expect(resultHook()).toContain('危机');
  });

  it('解锁卡片：刚开放的只弹一次；老存档（没有记录）不补弹', () => {
    save.clearedChapters = 1;
    expect(takeNewMilestones().map((m) => m.id)).toContain('firstClear');
    expect(takeNewMilestones()).toHaveLength(0);
    save.revealSeen = undefined;
    save.meta.goldEarned = 5;
    expect(takeNewMilestones()).toHaveLength(0);
    expect(save.revealSeen).toEqual(expect.arrayContaining(MILESTONES.filter((m) => m.open()).map((m) => m.id)));
  });
});

// 角色解锁：达成指定成就自动解锁（不再用成就点购买）
import { describe, it, expect, beforeEach } from 'vitest';
import { CHARACTERS } from '../src/data/characters';
import { ACH_MAP } from '../src/data/achievements';
import { save, isUnlocked } from '../src/systems/Save';
import { unlockHint, unlockProgress } from '../src/systems/Achievements';

const locked = CHARACTERS.filter((c) => c.unlock);

describe('角色解锁条件', () => {
  beforeEach(() => {
    save.achievements = {};
    save.ownedChars = [];
  });

  it('默认角色 4 名，其余每名都绑定一项存在的成就和合法等级', () => {
    expect(CHARACTERS.length - locked.length).toBe(4);
    for (const c of locked) {
      const a = ACH_MAP[c.unlock!.ach];
      expect(a, `${c.id}:${c.unlock!.ach}`).toBeDefined();
      expect(c.unlock!.tier, c.id).toBeGreaterThanOrEqual(1);
      expect(c.unlock!.tier, c.id).toBeLessThanOrEqual(a.tiers.length);
    }
  });

  it('解锁成就不依赖该角色本人（不能是该角色专属成就或觉醒）', () => {
    for (const c of locked) {
      const a = ACH_MAP[c.unlock!.ach];
      expect(a.charId, c.id).not.toBe(c.id);
      expect(a.key ?? '', c.id).not.toContain(c.id);
    }
  });

  it('达成对应等级前锁定，达成后自动解锁', () => {
    const c = locked[0];
    const { ach, tier } = c.unlock!;
    expect(isUnlocked(c)).toBe(false);
    if (tier > 1) {
      save.achievements[ach] = { tier: tier - 1, t: 0 };
      expect(isUnlocked(c)).toBe(false);
    }
    save.achievements[ach] = { tier, t: 0 };
    expect(isUnlocked(c)).toBe(true);
    expect(unlockHint(c)).toBe('');
  });

  it('旧版本已用成就点买下的角色保留使用权', () => {
    const c = locked[locked.length - 1];
    expect(isUnlocked(c)).toBe(false);
    save.ownedChars = [c.id];
    expect(isUnlocked(c)).toBe(true);
  });

  it('未解锁时提示里带成就名称和进度', () => {
    for (const c of locked) {
      const p = unlockProgress(c);
      expect(p.goal, c.id).toBeGreaterThan(0);
      expect(p.value, c.id).toBeLessThanOrEqual(p.goal);
      expect(unlockHint(c), c.id).toContain(`${p.value}/${p.goal}`);
    }
  });
});

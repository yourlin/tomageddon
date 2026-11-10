// 契合按熟练度解锁（systems/Mastery.ts）：1–2 级只认第一个标签、没有加成，3 级单契合，7 级双契合；
// 挑战模式与平衡测试（setFavorOverride）不看熟练度
import { describe, it, expect, afterEach } from 'vitest';
import { save } from '../src/systems/Save';
import { run } from '../src/systems/RunState';
import { CHARACTERS } from '../src/data/characters';
import { WEAPONS } from '../src/data/weapons';
import { isFavoredWeapon, isDoubleFavored } from '../src/data/affinity';
import {
  masteryNeed,
  favorStage,
  favorStageForLevel,
  favoredTagsAt,
  setFavorOverride,
  favorUnlockNote,
  FAVOR_UNLOCK,
} from '../src/systems/Mastery';

const setLevel = (id: string, lv: number) => (save.meta.mastery[id] = masteryNeed(lv));

afterEach(() => {
  setFavorOverride(null);
  delete save.meta.mastery.tomato;
  run.challenge = null;
});

describe('契合解锁阶段', () => {
  it('1–2 级只认标签、3 级单契合、7 级双契合', () => {
    expect([1, 2, 3, 6, 7, 10].map(favorStageForLevel)).toEqual([0, 0, 1, 1, 2, 2]);
    expect(FAVOR_UNLOCK).toEqual({ single: 3, double: 7 });
  });

  it('阶段 0、1 只认第一个标签，阶段 2 认全部', () => {
    const fav = ['锋利', '元素'];
    expect(favoredTagsAt(fav, 0)).toEqual(['锋利']);
    expect(favoredTagsAt(fav, 1)).toEqual(['锋利']);
    expect(favoredTagsAt(fav, 2)).toEqual(fav);
  });

  it('按存档里的熟练度算阶段', () => {
    setLevel('tomato', 1);
    expect(favorStage('tomato')).toBe(0);
    setLevel('tomato', 3);
    expect(favorStage('tomato')).toBe(1);
    setLevel('tomato', 7);
    expect(favorStage('tomato')).toBe(2);
  });

  it('平衡测试的覆盖值优先于熟练度', () => {
    setLevel('tomato', 1);
    setFavorOverride(2);
    expect(favorStage('tomato')).toBe(2);
  });
});

describe('对局里的契合', () => {
  it('熟练度 1 级：认得第一个标签，但没有契合加成，也没有双契合', () => {
    setLevel('tomato', 1);
    run.charId = 'tomato';
    expect(run.favorBonus).toBe(false);
    expect(run.favored).toEqual(run.char.favored.slice(0, 1));
    expect(WEAPONS.some((w) => isDoubleFavored(run.favored, w))).toBe(false);
  });

  it('熟练度 7 级：两个标签都认，双契合武器成立', () => {
    setLevel('tomato', 7);
    run.charId = 'tomato';
    expect(run.favorBonus).toBe(true);
    expect(run.favored).toEqual(run.char.favored);
    expect(WEAPONS.some((w) => isDoubleFavored(run.favored, w))).toBe(true);
  });

  it('挑战模式一律双契合', () => {
    setLevel('tomato', 1);
    run.charId = 'tomato';
    run.challenge = { charId: 'tomato' } as typeof run.challenge;
    expect(run.favorStage).toBe(2);
    expect(run.favored).toEqual(run.char.favored);
  });

  it('每个角色的开局武器都带第一个契合标签（新角色开局就能用）', () => {
    for (const c of CHARACTERS) {
      const first = c.favored.slice(0, 1);
      const sw = c.startWeapons.find((w) => WEAPONS.some((d) => d.id === w && isFavoredWeapon(c.favored, d)));
      expect(
        WEAPONS.some((d) => d.id === sw && isFavoredWeapon(first, d)),
        `${c.id} 的开局武器 ${sw} 不带第一个契合标签 ${first[0]}`,
      ).toBe(true);
    }
  });
});

describe('结算提示', () => {
  it('跨过 3 级、7 级时提示解锁', () => {
    expect(favorUnlockNote(2, 3)).toContain('契合');
    expect(favorUnlockNote(6, 7)).toContain('双契合');
    expect(favorUnlockNote(3, 4)).toBe('');
  });
});

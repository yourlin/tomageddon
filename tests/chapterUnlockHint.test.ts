// 章节解锁条件文案：未解锁时给出条件和当前进度，解锁后返回 null
import { describe, it, expect, beforeEach } from 'vitest';
import { save } from '../src/systems/Save';
import { setLang } from '../src/i18n';
import { chapterUnlockHint } from '../src/systems/Danger';

describe('chapterUnlockHint', () => {
  beforeEach(() => {
    setLang('zh');
    save.clearedChapters = 0;
    save.meta.dangerBest = {};
  });

  it('第 2–5 章：提示通关上一章，通关后返回 null', () => {
    expect(chapterUnlockHint(1)).toBeNull();
    expect(chapterUnlockHint(3)).toContain('通关第 2 章');
    save.clearedChapters = 2;
    expect(chapterUnlockHint(3)).toBeNull();
  });

  it('第 6 章：普通难度通关第 5 章仍未解锁，提示危机 5 并显示目前最高危机', () => {
    save.clearedChapters = 5;
    save.meta.dangerBest = { carrot_5: 3 };
    const h = chapterUnlockHint(6)!;
    expect(h).toContain('危机 5');
    expect(h).toContain('目前最高：危机 3');
    save.meta.dangerBest = { carrot_2: 5 };
    expect(chapterUnlockHint(6)).toBeNull();
  });

  it('第 7 章：显示第 1–5 章危机 10 的完成数', () => {
    save.meta.dangerBest = { carrot_1: 10, tomato_2: 12, carrot_3: 9 };
    expect(chapterUnlockHint(7)).toContain('已完成 2/5');
  });
});

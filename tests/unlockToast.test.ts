import { describe, expect, it } from 'vitest';
import { charToastHtml } from '../src/systems/Achievements';
import { CHARACTER_MAP } from '../src/data/characters';

describe('解锁角色提示条', () => {
  const c = CHARACTER_MAP.eggplant;

  it('有形象图时展示形象，而不是只有名字', () => {
    const html = charToastHtml(c, 'data:image/png;base64,AAA');
    expect(html).toContain('<img src="data:image/png;base64,AAA"');
    expect(html).not.toContain('🎉');
    expect(html).toContain(c.name);
  });

  it('形象取不到时退回 🎉，名字与解锁成就仍然显示', () => {
    const html = charToastHtml(c, null);
    expect(html).not.toContain('<img');
    expect(html).toContain('🎉');
    expect(html).toContain(c.name);
    expect(html).toContain('达成成就');
  });
});

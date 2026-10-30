import { describe, it, expect } from 'vitest';
import { filterCodexEntries } from '../src/systems/CodexBrowser';
const entries = [
  { name: '番茄叉', tags: ['厨具', '长柄', '暴击'] },
  { name: '平底锅', tags: ['厨具', '钝器'] },
  { name: 'Pea Shooter', tags: ['蔬果', '枪械'] },
  { name: '？？？', tags: ['火焰'] },
];
describe('codex weapon filters', () => {
  it('intersects all selected tags without limiting the catalog', () => {
    expect(filterCodexEntries(entries, '', ['厨具', '长柄']).map((e) => e.name)).toEqual(['番茄叉']);
    expect(filterCodexEntries(entries, '', ['厨具', '火焰'])).toEqual([]);
  });
  it('combines case-insensitive normalized name search with tags', () => {
    expect(filterCodexEntries(entries, '  ｐＥＡ  ', ['枪械']).map((e) => e.name)).toEqual(['Pea Shooter']);
    expect(filterCodexEntries(entries, '番茄', ['厨具']).map((e) => e.name)).toEqual(['番茄叉']);
  });
  it('clearing filters restores every entry and preserves input order', () => {
    const many = Array.from({ length: 700 }, (_, i) => ({ name: `武器 ${i}`, tags: ['厨具'] }));
    expect(filterCodexEntries(many, '', [])).toEqual(many);
    expect(filterCodexEntries(entries, '', [])).toEqual(entries);
  });
  it('does not mutate source entries or reveal hidden names through search', () => {
    filterCodexEntries(entries, '叉', ['厨具']);
    expect(entries[0].tags).toEqual(['厨具', '长柄', '暴击']);
    expect(filterCodexEntries(entries, '火焰', [])).toEqual([]);
  });
});

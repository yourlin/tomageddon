// F5–F7：新角色、皮肤、台词数据约束
import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../src/data/characters';
import { EXTRA_CHARACTERS, EXTRA_CHARACTERS_EN } from '../src/data/charactersExtra';
import { WEAPON_MAP } from '../src/data/weapons';
import { STAT_INFO } from '../src/data/stats';
import { SKINS, SKIN_OF, applySkin } from '../src/data/skins';
import { BARKS, EASTER_EGGS } from '../src/data/barks';

describe('新角色（F5）', () => {
  it('6 名，已并入角色表，id 无重复', () => {
    expect(EXTRA_CHARACTERS).toHaveLength(6);
    for (const c of EXTRA_CHARACTERS) expect(CHARACTERS.includes(c), c.id).toBe(true);
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(CHARACTERS.length);
  });
  it('初始武器 / 契合武器都存在，属性键合法，有英文', () => {
    for (const c of EXTRA_CHARACTERS) {
      for (const w of [...c.startWeapons, ...c.favored]) expect(WEAPON_MAP[w], `${c.id}:${w}`).toBeDefined();
      for (const k of Object.keys(c.mods ?? {})) expect(STAT_INFO, `${c.id}.${k}`).toHaveProperty(k);
      expect(EXTRA_CHARACTERS_EN[c.id], c.id).toBeDefined();
    }
  });
});

describe('皮肤（F6）', () => {
  it('每名角色恰好 1 套，id 唯一', () => {
    expect(SKINS).toHaveLength(CHARACTERS.length);
    for (const c of CHARACTERS)
      expect(
        SKINS.filter((s) => s.charId === c.id),
        c.id,
      ).toHaveLength(1);
    expect(new Set(SKINS.map((s) => s.id)).size).toBe(SKINS.length);
  });
  it('applySkin 返回新对象、不改原外观，配饰追加在后面', () => {
    const c = CHARACTERS[0];
    const before = JSON.stringify(c.look);
    const out = applySkin(c.look, SKIN_OF[c.id]);
    expect(JSON.stringify(c.look)).toBe(before);
    expect(out).not.toBe(c.look);
    expect(out.color).toBe(SKIN_OF[c.id].look.color);
    expect(out.acc?.length).toBe((c.look.acc?.length ?? 0) + 1);
  });
});

describe('台词（F7）', () => {
  it('每种场合都有台词，且中英文都不为空、不超过 12 个汉字', () => {
    for (const [kind, lines] of Object.entries(BARKS)) {
      expect(lines.length, kind).toBeGreaterThan(0);
      for (const [zh, en] of lines) {
        expect(zh.length, zh).toBeLessThanOrEqual(12);
        expect(en.length).toBeGreaterThan(0);
      }
    }
  });
  it('至少 10 条彩蛋，角色都存在', () => {
    expect(EASTER_EGGS.length).toBeGreaterThanOrEqual(10);
    const ids = new Set(CHARACTERS.map((c) => c.id));
    for (const e of EASTER_EGGS) expect(ids.has(e.charId), e.charId).toBe(true);
  });
});

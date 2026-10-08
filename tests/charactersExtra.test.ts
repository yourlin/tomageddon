// F5–F7：新角色、皮肤、台词数据约束
import { TAG_MAP } from '../src/data/weaponTags';
import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../src/data/characters';
import { EXTRA_CHARACTERS, EXTRA_CHARACTERS_EN } from '../src/data/charactersExtra';
import { WEAPON_MAP } from '../src/data/weapons';
import { STAT_INFO } from '../src/data/stats';
import { SKINS, SKIN_OF, SKINS_PER_CHAR, applySkin } from '../src/data/skins';
import { save } from '../src/systems/Save';
import { skinOwned, activeSkin, buySkin, equipSkin } from '../src/systems/Progress';
import { BARKS, EASTER_EGGS } from '../src/data/barks';

describe('新角色（F5）', () => {
  it('6 名，已并入角色表，id 无重复', () => {
    expect(EXTRA_CHARACTERS).toHaveLength(6);
    for (const c of EXTRA_CHARACTERS) expect(CHARACTERS.includes(c), c.id).toBe(true);
    expect(new Set(CHARACTERS.map((c) => c.id)).size).toBe(CHARACTERS.length);
  });
  it('初始武器 / 契合武器都存在，属性键合法，有英文', () => {
    for (const c of EXTRA_CHARACTERS) {
      for (const w of c.startWeapons) expect(WEAPON_MAP[w], `${c.id}:${w}`).toBeDefined();
      for (const t of c.favored) expect(TAG_MAP[t], `${c.id}:${t}`).toBeDefined();
      for (const k of Object.keys(c.mods ?? {})) expect(STAT_INFO, `${c.id}.${k}`).toHaveProperty(k);
      expect(EXTRA_CHARACTERS_EN[c.id], c.id).toBeDefined();
    }
  });
});

describe('皮肤（F6）', () => {
  it('每名角色 4 套、主题互不相同，id 唯一；第 1 套沿用旧 id', () => {
    expect(SKINS).toHaveLength(CHARACTERS.length * SKINS_PER_CHAR);
    for (const c of CHARACTERS) {
      const mine = SKINS.filter((s) => s.charId === c.id);
      expect(mine, c.id).toHaveLength(SKINS_PER_CHAR);
      expect(new Set(mine.map((s) => s.name[0])).size, c.id).toBe(SKINS_PER_CHAR);
      expect(SKIN_OF[c.id].id).toBe(`skin_${c.id}`);
    }
    expect(new Set(SKINS.map((s) => s.id)).size).toBe(SKINS.length);
  });
  it('购买、换上、换回原皮；第 1 套熟练度满级免费，其余不送', () => {
    const c = CHARACTERS[0];
    const [s1, s2] = SKINS.filter((s) => s.charId === c.id);
    save.meta.skins = [];
    save.meta.skinOf = {};
    save.meta.mastery = {};
    save.meta.gold = s2.price;
    expect(skinOwned(s2.id)).toBe(false);
    expect(buySkin(s2.id)).toBe(true);
    expect(save.meta.gold).toBe(0);
    expect(activeSkin(c.id)?.id).toBe(s2.id);
    equipSkin(c.id, '');
    expect(activeSkin(c.id)).toBeUndefined();
    equipSkin(c.id, s1.id); // 没拥有：不换
    expect(activeSkin(c.id)).toBeUndefined();
    save.meta.mastery[c.id] = 1e9;
    expect(skinOwned(s1.id)).toBe(true);
    expect(skinOwned(SKINS.filter((s) => s.charId === c.id)[2].id)).toBe(false);
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

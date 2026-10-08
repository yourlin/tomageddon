// 契合改为标签：每名角色契合 1–2 个标签、有足够的契合武器与契合特效说明
import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../src/data/characters';
import { WEAPON_MAP } from '../src/data/weapons';
import { EVOLVED_WEAPONS } from '../src/data/evolutions';
import { AFFINITY_TEXT, isFavoredWeapon, favoredWeapons } from '../src/data/affinity';
import { TAG_MAP } from '../src/data/weaponTags';
import { AFFINITY_WEAPONS, AFFINITY_WEAPONS_EN, AFFINITY_WEAPON_ART } from '../src/data/weaponsAffinity';

describe('契合武器与契合特效', () => {
  it('每名角色契合 1–2 个存在的标签、至少 5 把契合武器，并有中英文契合特效', () => {
    for (const c of CHARACTERS) {
      expect(c.favored.length, c.id).toBeGreaterThanOrEqual(1);
      expect(c.favored.length, c.id).toBeLessThanOrEqual(2);
      for (const t of c.favored) expect(TAG_MAP[t], `${c.id}:${t}`).toBeDefined();
      expect(favoredWeapons(c).length, c.id).toBeGreaterThanOrEqual(5);
      const t = AFFINITY_TEXT[c.id];
      expect(t, c.id).toBeDefined();
      expect(t[0].length).toBeGreaterThan(0);
      expect(/[\u4e00-\u9fff]/.test(t[1]), `${c.id} 英文说明含中文`).toBe(false);
    }
    expect(Object.keys(AFFINITY_TEXT).sort()).toEqual(CHARACTERS.map((c) => c.id).sort());
  });

  it('按标签判定：带任意一个契合标签即为契合武器，超武按自己的标签判定', () => {
    expect(isFavoredWeapon(['锋利'], WEAPON_MAP.knife)).toBe(true);
    expect(isFavoredWeapon(['枪械'], WEAPON_MAP.knife)).toBe(false);
    expect(isFavoredWeapon(['枪械', '锋利'], WEAPON_MAP.knife)).toBe(true);
    const evo = EVOLVED_WEAPONS.find((w) => w.evolvedFrom === 'knife')!;
    expect(isFavoredWeapon(['锋利'], evo)).toBe(true);
    expect(isFavoredWeapon(['锋利'], undefined)).toBe(false);
  });

  it('新增的 4 把武器都已并入武器表，并带英文与手持图', () => {
    expect(AFFINITY_WEAPONS).toHaveLength(4);
    for (const w of AFFINITY_WEAPONS) {
      expect(WEAPON_MAP[w.id]).toBe(w);
      expect(AFFINITY_WEAPONS_EN[w.id]?.name).toBeTruthy();
      expect(AFFINITY_WEAPON_ART[w.id]).toBeDefined();
      for (const k of ['damage', 'cooldown'] as const) expect(w[k]).toHaveLength(4);
      // 每把新武器至少是一名角色的契合武器
      expect(
        CHARACTERS.some((c) => isFavoredWeapon(c.favored, w)),
        w.id,
      ).toBe(true);
    }
  });
});

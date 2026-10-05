// 契合武器改版：每名角色都有契合特效说明，契合武器都存在，超武按原武器判定契合
import { describe, expect, it } from 'vitest';
import { CHARACTERS } from '../src/data/characters';
import { WEAPON_MAP } from '../src/data/weapons';
import { EVOLVED_WEAPONS } from '../src/data/evolutions';
import { AFFINITY_TEXT, isFavoredWeapon } from '../src/data/affinity';
import { AFFINITY_WEAPONS, AFFINITY_WEAPONS_EN, AFFINITY_WEAPON_ART } from '../src/data/weaponsAffinity';

describe('契合武器与契合特效', () => {
  it('每名角色都有 3 把存在的契合武器和中英文契合特效', () => {
    for (const c of CHARACTERS) {
      expect(c.favored, c.id).toHaveLength(3);
      for (const w of c.favored) expect(WEAPON_MAP[w], `${c.id}:${w}`).toBeDefined();
      const t = AFFINITY_TEXT[c.id];
      expect(t, c.id).toBeDefined();
      expect(t[0].length).toBeGreaterThan(0);
      expect(/[\u4e00-\u9fff]/.test(t[1]), `${c.id} 英文说明含中文`).toBe(false);
    }
    expect(Object.keys(AFFINITY_TEXT).sort()).toEqual(CHARACTERS.map((c) => c.id).sort());
  });

  it('超武按进化前的武器判定契合', () => {
    const evo = EVOLVED_WEAPONS[0];
    expect(isFavoredWeapon([evo.evolvedFrom!], evo)).toBe(true);
    expect(isFavoredWeapon([evo.id], WEAPON_MAP[evo.evolvedFrom!])).toBe(false);
    expect(isFavoredWeapon(['fork'], undefined)).toBe(false);
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
        CHARACTERS.some((c) => c.favored.includes(w.id)),
        w.id,
      ).toBe(true);
    }
  });
});

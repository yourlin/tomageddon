// 双契合：契合技对照表、标签强化说明、专属武器与超武
import { describe, expect, it } from 'vitest';
import { WEAPON_MAP, WEAPONS } from '../src/data/weapons';
import '../src/data/recipes';
import { EVOLVED_WEAPONS } from '../src/data/evolutions';
import { TAGS, weaponTags } from '../src/data/weaponTags';
import { BESPOKE_OF, BESPOKE_SKILL, KIND_SKILL, TAG_TRAIT, synergySkill } from '../src/data/synergy';
import { CHAR_WEAPONS, CHAR_WEAPONS_EN, CHAR_EVOLUTIONS } from '../src/data/weaponsChar';
import { CHARACTERS } from '../src/data/characters';
import { isDoubleFavored } from '../src/data/affinity';

describe('双契合', () => {
  it('专属契合技对照表里的武器都存在，契合技都有中英文说明', () => {
    for (const id of Object.keys(BESPOKE_OF)) expect(WEAPON_MAP[id], id).toBeDefined();
    for (const s of [...Object.values(BESPOKE_SKILL), ...Object.values(KIND_SKILL)]) {
      expect(s.name[0].length).toBeGreaterThan(0);
      expect(/[一-鿿]/.test(s.desc[1]), s.desc[1]).toBe(false);
    }
  });

  it('每个标签都有标签强化说明', () => {
    for (const t of TAGS) expect(TAG_TRAIT[t.id], t.id).toBeDefined();
  });

  it('每把武器都能取到契合技（专属优先，否则按攻击方式）', () => {
    for (const w of [...WEAPONS, ...EVOLVED_WEAPONS]) expect(synergySkill(w).name, w.id).toBeTruthy();
  });

  it('角色专属武器、超武都已并入武器表，带英文；超武的材料标签覆盖目标角色的两个标签', () => {
    for (const w of CHAR_WEAPONS) {
      expect(WEAPON_MAP[w.id]).toBe(w);
      expect(CHAR_WEAPONS_EN[w.id], w.id).toBeDefined();
    }
    for (const x of CHAR_EVOLUTIONS) {
      const sup = WEAPON_MAP[x.boost.id];
      expect(sup?.evolvedFrom, x.boost.id).toBe(x.from);
      // 至少有一名角色把这把超武当双契合超武
      expect(
        CHARACTERS.some((c) => isDoubleFavored(c.favored, sup)),
        `${x.boost.id}: ${weaponTags(sup).join('/')}`,
      ).toBe(true);
    }
  });
});

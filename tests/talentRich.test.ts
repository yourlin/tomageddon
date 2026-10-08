import { afterEach, describe, expect, it } from 'vitest';
import { TALENT_NODES, TALENT_MAP, BRANCHES } from '../src/data/talentTree';
import { raiseBlock, setTalents, treeTotals, setRunTalents, effectiveRank, masterUnlocked } from '../src/systems/TalentTree';
import { save } from '../src/systems/Save';

afterEach(() => {
  setTalents({});
  setRunTalents({});
});

describe('天赋树：二选一的关键天赋', () => {
  it('每个方向两个关键天赋，同一互斥组，需求点数相同', () => {
    for (const b of BRANCHES) {
      const keys = TALENT_NODES.filter((n) => n.branch === b.id && n.kind === 'keystone');
      expect(keys).toHaveLength(2);
      expect(keys[0].exclusive).toBe(keys[1].exclusive);
      expect(keys[0].needPoints).toBe(keys[1].needPoints);
      expect(keys[0].parent).toBe(keys[1].parent);
    }
  });
  it('关键天赋都能解锁：本方向其他天赋的点数够 needPoints', () => {
    for (const b of BRANCHES) {
      const l = TALENT_NODES.filter((n) => n.branch === b.id);
      const others = l.filter((n) => n.kind !== 'keystone').reduce((s, n) => s + n.max, 0);
      for (const k of l.filter((n) => n.kind === 'keystone')) expect(others).toBeGreaterThanOrEqual(k.needPoints ?? 0);
    }
  });
  it('点了其中一个后，另一个被互斥挡住', () => {
    const might = TALENT_NODES.filter((n) => n.branch === 'might');
    const t = Object.fromEntries(might.filter((n) => n.kind !== 'keystone').map((n) => [n.id, n.max]));
    setTalents({ ...t, might_key: 1 });
    save.meta.bonusTp = 999;
    expect(raiseBlock(TALENT_MAP.might_key2)).toBe('exclusive');
    save.meta.bonusTp = 0;
  });
  it('大师层：互斥组点满其中一个即可', () => {
    setTalents(Object.fromEntries(TALENT_NODES.filter((n) => !n.id.endsWith('_key2')).map((n) => [n.id, n.max])));
    expect(masterUnlocked()).toBe(true);
  });
});

describe('天赋树：伤害类型专精与局内天赋', () => {
  it('专精天赋汇总到对应字段', () => {
    setTalents({ might_quake: 1, might_pierce: 1, might_far: 2, might_resonance: 1, might_aurapulse: 1 });
    const t = treeTotals();
    expect(t.meleeQuake).toBe(40);
    expect(t.rangedPierce).toBe(1);
    expect(t.rangedFar).toBe(10);
    expect(t.elemDebuffDmg).toBe(15);
    expect(t.auraPulse).toBe(1);
  });
  it('局内天赋叠加在天赋树等级上，不超过上限', () => {
    setTalents({ might_far: 2 });
    setRunTalents({ might_far: 5, might_pierce: 1 });
    expect(effectiveRank('might_far')).toBe(3);
    expect(treeTotals().rangedFar).toBe(15);
    expect(treeTotals().rangedPierce).toBe(1);
    setRunTalents({});
    expect(treeTotals().rangedPierce).toBe(0);
  });
});

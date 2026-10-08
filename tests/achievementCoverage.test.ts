// 成就覆盖：超武合成计数、融合武器、合成表、挑战规则修饰、天赋树
import { describe, it, expect, beforeEach } from 'vitest';
import { ACH_MAP, ACHIEVEMENTS } from '../src/data/achievements';
import { RECIPES, FUSED_WEAPONS } from '../src/data/recipes';
import { MODIFIERS } from '../src/data/challenges';
import { BRANCHES, TALENT_NODES } from '../src/data/talentTree';
import { achValue } from '../src/systems/Achievements';
import { run } from '../src/systems/RunState';
import { save } from '../src/systems/Save';

const fill = (r: (typeof RECIPES)[number]) => {
  run.start('lemon', 1);
  for (const [id, tier] of r.from) run.addWeapon(id, tier);
  for (const slot of r.items) run.items[slot[0]] = (run.items[slot[0]] ?? 0) + 1;
  run.dirty();
};

describe('成就覆盖', () => {
  beforeEach(() => {
    save.counters = {};
    save.stats.t4Crafted = 0;
  });

  it('合成表合成超武：计入超武成就，不计入「合成 T4」', () => {
    const r = RECIPES.find((x) => x.kind === 'super')!;
    fill(r);
    expect(run.craft(r)).toBe(true);
    expect(achValue(ACH_MAP.evolutions)).toBe(1);
    expect(achValue(ACH_MAP[`evolve_${r.to}`])).toBe(1);
    expect(save.stats.t4Crafted).toBe(0);
    expect(achValue(ACH_MAP.crafts)).toBe(1);
  });

  it('合成 T4：计入「合成 T4」与合成表次数，不计入超武', () => {
    const r = RECIPES.find((x) => x.kind === 't4')!;
    fill(r);
    expect(run.craft(r)).toBe(true);
    expect(save.stats.t4Crafted).toBe(1);
    expect(achValue(ACH_MAP.evolutions)).toBe(0);
    expect(achValue(ACH_MAP.crafts)).toBe(1);
  });

  it('每把融合武器都有首次合成成就，合成后计入种类', () => {
    for (const w of FUSED_WEAPONS) expect(ACH_MAP[`fuse_${w.id}`], w.id).toBeDefined();
    // 基础武器的「获得 / T4 / 打造」三件套不包含融合武器
    expect(ACHIEVEMENTS.some((a) => FUSED_WEAPONS.some((w) => a.id === `wpn_got_${w.id}`))).toBe(false);
    const r = RECIPES.find((x) => x.kind === 't4' && FUSED_WEAPONS.some((w) => w.id === x.to))!;
    fill(r);
    run.craft(r);
    expect(achValue(ACH_MAP[`fuse_${r.to}`])).toBe(1);
    expect(achValue(ACH_MAP.fused_kinds)).toBe(1);
  });

  it('每种挑战规则修饰都有成就', () => {
    for (const m of MODIFIERS) expect(ACH_MAP[`mod_${m.id}`]?.key, m.id).toBe(`modClear:${m.id}`);
  });

  it('天赋树：投入点数、单方向、多方向取最好的一套方案', () => {
    save.talents = {};
    save.charTalents = {};
    const [b1, b2] = BRANCHES;
    const nodes = (b: string) => TALENT_NODES.filter((n) => n.branch === b);
    const give = (t: Record<string, number>, b: string, pts: number) => {
      for (const n of nodes(b)) {
        const k = Math.min(n.max, pts);
        if (k > 0) t[n.id] = k;
        pts -= k;
      }
    };
    give(save.talents, b1.id, 12);
    save.charTalents.lemon = {};
    give(save.charTalents.lemon, b2.id, 6);
    expect(achValue(ACH_MAP.talent_spent)).toBe(12);
    expect(achValue(ACH_MAP.talent_branch)).toBe(12);
    expect(achValue(ACH_MAP.talent_wide)).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import { RECIPES, RECIPE_BY_TO, FUSED_WEAPONS, FUSE_MIN, missingItems, wantedRecipeItems } from '../src/data/recipes';
import { WEAPON_MAP, WEAPONS } from '../src/data/weapons';
import { ITEM_MAP } from '../src/data/items';
import { EVOLUTIONS } from '../src/data/evolutions';
import { run } from '../src/systems/RunState';

describe('合成配方', () => {
  it('配方只有 T4 与超武两类：每把基础武器一条升到自己 T4 的配方，每把合成专属 T4 一条，超武 20 条', () => {
    const base = WEAPONS.filter((w) => !w.evolvedFrom && !w.minTier);
    const t4 = RECIPES.filter((r) => r.kind === 't4');
    expect(t4).toHaveLength(base.length + FUSED_WEAPONS.length);
    expect(t4.filter((r) => r.from.every(([id]) => id === r.to))).toHaveLength(base.length);
    expect(RECIPES.filter((r) => r.kind === 'super')).toHaveLength(EVOLUTIONS.length);
  });

  it('配方的材料与道具都存在；超武需要两把 T4，T4 需要两把 T3', () => {
    for (const r of RECIPES) {
      expect(WEAPON_MAP[r.to], r.to).toBeDefined();
      expect(r.from).toHaveLength(2);
      r.from.forEach(([id, tier]) => {
        expect(WEAPON_MAP[id], `${r.to}:${id}`).toBeDefined();
        // 超武：两把 T4；T4：两把 T3
        const want = r.kind === 'super' ? 3 : 2;
        expect(tier, `${r.to}:${id}`).toBe(want);
      });
      expect(r.items.length).toBeGreaterThanOrEqual(1);
      for (const slot of r.items) {
        expect(slot.length, `${r.to} 空槽`).toBeGreaterThan(0);
        for (const i of slot) expect(ITEM_MAP[i], `${r.to}:${i}`).toBeDefined();
      }
    }
  });

  it('T4 与超武的道具数：超武 = 原催化道具 + 1 件传说道具', () => {
    // 升到自己的 T4：1 件道具；合成别的 T4（两把不同的 T3）：至少 2 件
    for (const r of RECIPES.filter((r) => r.kind === 't4')) {
      const self = r.from.every(([id]) => id === r.to);
      expect(r.items.length, r.to).toBeGreaterThanOrEqual(self ? 1 : 2);
    }
    for (const r of RECIPES.filter((r) => r.kind === 'super')) {
      expect(r.items, r.to).toHaveLength(2);
      expect(r.items[0].length, `${r.to} 催化道具应唯一`).toBe(1);
    }
  });

  it('配方道具都是指定道具：T4 要 T3（史诗）、超武要 T4（传说），每槽一件、同一配方不重复', () => {
    for (const r of RECIPES) {
      const ids = r.items.map((slot) => {
        expect(slot, `${r.to} 每槽只能是一件指定道具`).toHaveLength(1);
        return slot[0];
      });
      expect(new Set(ids).size, `${r.to} 道具重复`).toBe(ids.length);
      // T4 要 T3 道具；超武的第一件是原进化催化道具（品质不限），其余都是 T4（传说）道具
      const rest = r.kind === 'super' ? ids.slice(1) : ids;
      for (const id of rest) expect(ITEM_MAP[id].rarity, `${r.to}:${id}`).toBe(r.kind === 'super' ? 3 : 2);
    }
  });

  it('商店补货：超武配方缺的道具排在最前', () => {
    const sup = RECIPES.find((r) => r.kind === 'super')!;
    const t4 = RECIPES.find((r) => r.kind === 't4' && r.from.every(([id]) => !sup.from.some(([s]) => s === id)))!;
    const owned = [...sup.from, ...t4.from].map(([id, tier]) => ({ id, tier }));
    const want = wantedRecipeItems(owned, {}, (to) => to === t4.to); // 即使 T4 配方是契合武器
    expect(sup.items.flat()).toContain(want[0]);
  });

  it('商店补货：只给材料武器快凑齐的配方补道具', () => {
    const r = RECIPE_BY_TO.sushi_twin_blade;
    const [a, b] = r.from;
    // 只有其中一把：还不补
    expect(wantedRecipeItems([{ id: a[0], tier: a[1] }], {})).not.toContain(r.items[0][0]);
    // 两把都有（一把达标、一把差一级）：补
    const want = wantedRecipeItems(
      [
        { id: a[0], tier: a[1] },
        { id: b[0], tier: b[1] - 1 },
      ],
      {},
    );
    for (const slot of r.items) expect(want).toContain(slot[0]);
    // 两把都差一级：还不补
    expect(
      wantedRecipeItems(
        [
          { id: a[0], tier: a[1] - 1 },
          { id: b[0], tier: b[1] - 1 },
        ],
        {},
      ),
    ).not.toContain(r.items[0][0]);
    // 道具已经有了就不再需要
    const have = Object.fromEntries(r.items.map((sl) => [sl[0], 1]));
    const want2 = wantedRecipeItems(
      [
        { id: a[0], tier: a[1] },
        { id: b[0], tier: b[1] },
      ],
      have,
    );
    for (const slot of r.items) expect(want2).not.toContain(slot[0]);
  });

  it('每把 T3 武器至少有 FUSE_MIN + 1 条通往 T4 的配方；每把 T4 的配方唯一', () => {
    const base = WEAPONS.filter((w) => !w.evolvedFrom && !w.minTier);
    for (const w of base) {
      const n = RECIPES.filter((r) => r.kind !== 'super' && r.from.some(([id, t]) => id === w.id && t === 2)).length;
      expect(n, w.id).toBeGreaterThanOrEqual(FUSE_MIN + 1);
    }
    const outs = RECIPES.map((r) => r.to);
    expect(new Set(outs).size, '有 T4 / 超武出现在多条配方里').toBe(outs.length);
  });

  it('所有配方都凑得齐：不会要求只有 T4 的合成专属武器的 T3 版本', () => {
    for (const r of RECIPES)
      for (const [id, t] of r.from) expect(t, `${r.to} 要求 ${id} 品质 ${t}`).toBeGreaterThanOrEqual(WEAPON_MAP[id].minTier ?? 0);
  });

  it('合成专属 T4 继承两把材料的标签与特效，并进入武器表', () => {
    for (const w of FUSED_WEAPONS) {
      expect(WEAPON_MAP[w.id]).toBe(w);
      expect(w.minTier).toBe(3);
      expect(w.tags.length).toBeGreaterThan(0);
      expect(w.damage).toHaveLength(4);
    }
  });

  it('合成消耗两把材料武器与道具，产出 T4', () => {
    const r = RECIPE_BY_TO.sushi_twin_blade;
    run.start('lemon', 1);
    expect(run.canCraft(r)).toBe(false);
    for (const [id, tier] of r.from) run.addWeapon(id, tier);
    expect(missingItems(r, run.items).length).toBeGreaterThan(0);
    for (const slot of r.items) run.items[slot[0]] = (run.items[slot[0]] ?? 0) + 1;
    run.dirty();
    expect(run.canCraft(r)).toBe(true);
    const n = run.allWeapons.length;
    expect(run.craft(r)).toBe(true);
    expect(run.allWeapons).toHaveLength(n - 1); // 两把换一把
    const made = run.allWeapons.find((w) => w.id === r.to)!;
    expect(made.tier).toBe(3);
    for (const slot of r.items) expect(run.items[slot[0]] ?? 0).toBe(0);
    expect(run.canCraft(r)).toBe(false);
  });

  it('同名合成最高到 T3；超武走配方（原进化入口）', () => {
    run.start('lemon', 1);
    run.addWeapon('knife', 2);
    run.addWeapon('knife', 2);
    const w = run.allWeapons.find((x) => x.id === 'knife' && x.tier === 2)!;
    expect(run.combine(w.uid)).toBe(0); // T3 不能再同名合成
    const sup = RECIPE_BY_TO.paoding_blade;
    run.start('lemon', 1);
    for (const [id, tier] of sup.from) run.addWeapon(id, tier);
    for (const slot of sup.items) run.items[slot[0]] = (run.items[slot[0]] ?? 0) + 1;
    run.dirty();
    const t4 = run.allWeapons.find((x) => x.id === sup.from[0][0] && x.tier === 3)!;
    expect(run.canEvolve(t4)).toBe(true);
    expect(run.evolve(t4.uid)).toBe(true);
    expect(run.allWeapons.some((x) => x.id === 'paoding_blade')).toBe(true);
  });
});

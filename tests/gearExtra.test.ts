// G5/G6/G7：1.4.0 新武器 / 新进化 / 新道具数据校验（数据尚未接线，这里只校验 gearExtra.ts 自身与现有数据的一致性）
import { describe, it, expect } from 'vitest';
import { WEAPONS, WEAPON_SETS } from '../src/data/weapons';
import { EVOLUTIONS, EVOLVED_WEAPONS } from '../src/data/evolutions';
import { ITEMS, ALL_ITEMS } from '../src/data/items';
import { STAT_INFO, BASE_STATS, type StatKey } from '../src/data/stats';
import { STATUSES } from '../src/data/statuses';
import { describeItem } from '../src/data/describe';
import { EN_STATS } from '../src/i18n/en/misc';
import {
  EXTRA_WEAPONS,
  EXTRA_EVOLUTIONS_SPEC,
  EXTRA_ITEMS,
  ITEM_COMBOS,
  COMBO_SPECIAL_KEYS,
  COMBO_STAT_ZH,
  COMBO_STAT_EN,
  COMBO_PCT_KEYS,
  describeCombo,
  EXTRA_WEAPONS_EN,
  EXTRA_ITEMS_EN,
  EXTRA_WEAPON_ART,
  EXTRA_EVOLVED_ART,
  EXTRA_AURA_LOOK,
} from '../src/data/gearExtra';

const STAT_KEYS = new Set(Object.keys(BASE_STATS));
const newWeaponIds = new Set(EXTRA_WEAPONS.map((w) => w.id));
const newItemIds = new Set(EXTRA_ITEMS.map((i) => i.id));
const evoIds = EXTRA_EVOLUTIONS_SPEC.map((e) => e.boost.id);
// 1.4.0 接线后新内容已并入总表：「现有」= 总表去掉新增部分
const oldWeaponIds = new Set(
  [...WEAPONS, ...EVOLVED_WEAPONS].map((w) => w.id).filter((id) => !newWeaponIds.has(id) && !evoIds.includes(id)),
);
const oldItemIds = new Set(ALL_ITEMS.map((i) => i.id).filter((id) => !newItemIds.has(id)));
const OLD_EVOLUTIONS = EVOLUTIONS.filter((e) => !evoIds.includes(e.to.id));
/** 经典道具（手工 + 新增），进化只认这些 */
const classicIds = new Set([...ITEMS.map((i) => i.id), ...newItemIds]);
const allItemIds = new Set([...oldItemIds, ...newItemIds]);
const allWeaponIds = new Set([...WEAPONS.map((w) => w.id), ...newWeaponIds]);

describe('数量', () => {
  it('新武器 12 / 进化 8 / 道具 30', () => {
    expect(EXTRA_WEAPONS).toHaveLength(12);
    expect(EXTRA_EVOLUTIONS_SPEC).toHaveLength(8);
    expect(EXTRA_ITEMS).toHaveLength(30);
  });
  it('至少 15 条组合涉及新道具', () => {
    expect(ITEM_COMBOS.filter((c) => newItemIds.has(c.item) || newItemIds.has(c.needs)).length).toBeGreaterThanOrEqual(15);
  });
});

describe('id 冲突', () => {
  it('新武器、超武、道具 id 互不重复，也不与现有冲突', () => {
    const all = [...newWeaponIds, ...evoIds, ...newItemIds];
    expect(new Set(all).size).toBe(all.length);
    expect(newWeaponIds.size).toBe(EXTRA_WEAPONS.length);
    expect(newItemIds.size).toBe(EXTRA_ITEMS.length);
    for (const id of all) {
      expect(oldWeaponIds.has(id), id).toBe(false);
      expect(oldItemIds.has(id), id).toBe(false);
    }
  });
  it('新内容都已并入武器、超武、道具总表，且总表 id 无重复', () => {
    for (const id of newWeaponIds)
      expect(
        WEAPONS.some((w) => w.id === id),
        id,
      ).toBe(true);
    for (const id of evoIds)
      expect(
        EVOLVED_WEAPONS.some((w) => w.id === id),
        id,
      ).toBe(true);
    for (const id of newItemIds)
      expect(
        ITEMS.some((i) => i.id === id),
        id,
      ).toBe(true);
    const w = [...WEAPONS, ...EVOLVED_WEAPONS].map((x) => x.id);
    expect(new Set(w).size).toBe(w.length);
    expect(new Set(ALL_ITEMS.map((i) => i.id)).size).toBe(ALL_ITEMS.length);
  });
  it('道具 id 不以 _数字 结尾（否则会被当成系列道具解析）', () => {
    for (const id of newItemIds) expect(id).not.toMatch(/_\d+$/);
  });
});

describe('新武器', () => {
  const kinds = new Set(WEAPONS.map((w) => w.kind));
  const effectKeys = new Set(WEAPONS.flatMap((w) => Object.keys(w.effect ?? {})));
  it.each(EXTRA_WEAPONS.map((w) => [w.id, w] as const))('%s 字段合法', (_id, w) => {
    expect(kinds.has(w.kind)).toBe(true);
    for (const k of Object.keys(w.effect ?? {})) expect(effectKeys.has(k), k).toBe(true);
    for (const t of w.tags) expect(WEAPON_SETS[t], t).toBeDefined();
    expect(w.damage).toHaveLength(4);
    expect(w.cooldown).toHaveLength(4);
    for (const a of [w.pierce, w.bounce, w.count, w.effect?.chain]) if (a) expect(a).toHaveLength(4);
    // 四档单调：伤害递增、冷却不增
    for (let i = 1; i < 4; i++) {
      expect(w.damage[i]).toBeGreaterThan(w.damage[i - 1]);
      expect(w.cooldown[i]).toBeLessThanOrEqual(w.cooldown[i - 1]);
    }
    expect(w.price).toBeGreaterThanOrEqual(15);
    expect(w.price).toBeLessThanOrEqual(40);
    expect(w.evolvedFrom).toBeUndefined();
  });
  it('覆盖近战 / 远程 / 元素 / 光环', () => {
    const cls = new Set(EXTRA_WEAPONS.map((w) => w.cls));
    expect(cls).toEqual(new Set(['melee', 'ranged', 'elemental']));
    expect(EXTRA_WEAPONS.some((w) => w.kind === 'aura')).toBe(true);
  });
});

describe('新进化', () => {
  const oldFrom = new Set(OLD_EVOLUTIONS.map((e) => e.from));
  const oldEvoItems = new Set(OLD_EVOLUTIONS.map((e) => e.item));
  it('from 不重复、不与现有 12 组重复，且武器存在（不能是超武）', () => {
    const froms = EXTRA_EVOLUTIONS_SPEC.map((e) => e.from);
    expect(new Set(froms).size).toBe(froms.length);
    for (const f of froms) {
      expect(oldFrom.has(f), f).toBe(false);
      expect(allWeaponIds.has(f), f).toBe(true);
    }
  });
  it('item 是存在的经典道具，且不与现有进化道具重复', () => {
    const items = EXTRA_EVOLUTIONS_SPEC.map((e) => e.item);
    expect(new Set(items).size).toBe(items.length);
    for (const i of items) {
      expect(classicIds.has(i), i).toBe(true);
      expect(oldEvoItems.has(i), i).toBe(false);
    }
  });
  it('boost 倍率在合理范围，extra 里的 effect 键合法', () => {
    const effectKeys = new Set(WEAPONS.flatMap((w) => Object.keys(w.effect ?? {})));
    for (const { boost: b } of EXTRA_EVOLUTIONS_SPEC) {
      if (b.dmg !== undefined) expect(b.dmg).toBeGreaterThan(1);
      if (b.cd !== undefined) expect(b.cd).toBeLessThanOrEqual(1);
      if (b.range !== undefined) expect(b.range).toBeGreaterThanOrEqual(1);
      for (const k of Object.keys(b.extra?.effect ?? {})) expect(effectKeys.has(k), `${b.id}.${k}`).toBe(true);
      expect(b.extra?.id).toBeUndefined();
    }
  });
});

describe('新道具', () => {
  it('mods 键合法、稀有度 0~3、价格与现有同稀有度相当', () => {
    const range = [0, 1, 2, 3].map((r) => {
      const ps = ITEMS.filter((i) => i.rarity === r).map((i) => i.price);
      return [Math.min(...ps), Math.max(...ps)];
    });
    for (const it of EXTRA_ITEMS) {
      for (const k of Object.keys(it.mods)) expect(STAT_KEYS.has(k), `${it.id}.${k}`).toBe(true);
      expect([0, 1, 2, 3]).toContain(it.rarity);
      expect(it.price, it.id).toBeGreaterThanOrEqual(range[it.rarity][0]);
      expect(it.price, it.id).toBeLessThanOrEqual(range[it.rarity][1]);
      expect(it.desc, it.id).toBeUndefined();
      expect(it.icon, it.id).toBeDefined();
    }
  });
  it('稀有度分布与现有相近（每档 ±3 以内）', () => {
    const cnt = (l: { rarity: number }[], r: number) => l.filter((i) => i.rarity === r).length;
    for (const r of [0, 1, 2, 3]) {
      const expected = (cnt(ITEMS, r) / ITEMS.length) * EXTRA_ITEMS.length;
      expect(Math.abs(cnt(EXTRA_ITEMS, r) - expected), `rarity ${r}`).toBeLessThanOrEqual(3);
    }
  });
  it('special 引用的状态都存在，描述能自动生成', () => {
    for (const it of EXTRA_ITEMS) {
      const s = it.special;
      const lists = [s?.onHit, s?.onHitSelf, s?.onKillSelf, s?.onHurtSelf, s?.onHurtEnemy, s?.waveStartSelf, s?.aura?.status];
      for (const l of lists) for (const a of l ?? []) expect(STATUSES[a.id], `${it.id}.${a.id}`).toBeDefined();
      const lines = describeItem(it);
      expect(lines.length).toBeGreaterThan(0);
      for (const l of lines) expect(l).not.toMatch(/undefined|NaN/);
    }
  });
});

describe('道具组合', () => {
  it('引用的道具都存在，item ≠ needs，组合不重复', () => {
    const seen = new Set<string>();
    for (const c of ITEM_COMBOS) {
      expect(allItemIds.has(c.item), c.item).toBe(true);
      expect(allItemIds.has(c.needs), c.needs).toBe(true);
      expect(c.item).not.toBe(c.needs);
      const key = [c.item, c.needs].sort().join('+');
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });
  it('bonus 键合法，special 只用支持的数值字段', () => {
    for (const c of ITEM_COMBOS) {
      expect(Object.keys(c.bonus).length + Object.keys(c.special ?? {}).length).toBeGreaterThan(0);
      for (const k of Object.keys(c.bonus)) expect(STAT_KEYS.has(k), k).toBe(true);
      for (const k of Object.keys(c.special ?? {})) expect((COMBO_SPECIAL_KEYS as readonly string[]).includes(k), k).toBe(true);
    }
  });
  it('describeCombo 生成中英文说明', () => {
    const name = (id: string) => id;
    for (const c of ITEM_COMBOS) {
      const [zh, en] = describeCombo(c, name);
      expect(zh).toContain(c.item);
      expect(en).toContain(c.needs);
      for (const t of [zh, en]) expect(t).not.toMatch(/undefined|NaN/);
      for (const k of Object.keys(c.bonus) as StatKey[]) {
        expect(zh).toContain(COMBO_STAT_ZH[k]);
        expect(en).toContain(COMBO_STAT_EN[k]);
      }
    }
  });
  it('组合用的属性名 / 百分比标记与 STAT_INFO、EN_STATS 一致', () => {
    for (const k of Object.keys(BASE_STATS) as StatKey[]) {
      expect(COMBO_STAT_ZH[k]).toBe(STAT_INFO[k].name);
      expect(COMBO_STAT_EN[k]).toBe(EN_STATS[k]);
      expect(COMBO_PCT_KEYS.includes(k), k).toBe(!!STAT_INFO[k].pct);
    }
  });
});

describe('英文覆盖与美术参数', () => {
  it('新武器与超武都有英文名与描述', () => {
    for (const id of [...newWeaponIds, ...evoIds]) {
      expect(EXTRA_WEAPONS_EN[id]?.name, id).toBeTruthy();
      expect(EXTRA_WEAPONS_EN[id]?.desc, id).toBeTruthy();
    }
    expect(Object.keys(EXTRA_WEAPONS_EN)).toHaveLength(newWeaponIds.size + evoIds.length);
  });
  it('新道具都有英文名', () => {
    for (const id of newItemIds) expect(EXTRA_ITEMS_EN[id]?.name, id).toBeTruthy();
    expect(Object.keys(EXTRA_ITEMS_EN)).toHaveLength(newItemIds.size);
  });
  it('美术参数覆盖所有新武器 / 超武，基底武器存在', () => {
    for (const id of newWeaponIds) expect(oldWeaponIds.has(EXTRA_WEAPON_ART[id]?.[0]), id).toBe(true);
    for (const e of EXTRA_EVOLUTIONS_SPEC) expect(EXTRA_EVOLVED_ART[e.boost.id]?.[0]).toBe(e.from);
    for (const w of EXTRA_WEAPONS.filter((x) => x.kind === 'aura')) expect(EXTRA_AURA_LOOK[w.id], w.id).toBeDefined();
  });
});

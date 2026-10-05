// 1.4.0 G8 / G9 自检：新地形机关分配与说明齐全、新状态效果真正进入 StatusSet / Enemy 的现有计算路径
import { describe, it, expect } from 'vitest';
import { TERRAIN_MECHS, TERRAIN_TUNING } from '../src/systems/Terrain';
import { TERRAIN_INFO } from '../src/data/chapters';
import { STATUSES, type StatusId } from '../src/data/statuses';
import { StatusSet } from '../src/systems/Status';
import { Enemy } from '../src/objects/Enemy';
import { EN_CHAPTERS, EN_STATUSES } from '../src/i18n/en/misc';

const NEW_MECHS: [number, string][] = [
  [2, 'sprinkler'],
  [4, 'acid'],
  [5, 'fan'],
  [6, 'lamp'],
  [7, 'bramble'],
];
const NEW_STATUSES: StatusId[] = ['soaked', 'corrode', 'tailwind', 'hardened'];

/** 施加后推进 0 秒触发 recalc */
function withStatus(...list: Parameters<StatusSet['apply']>[0][]): StatusSet {
  const s = new StatusSet();
  for (const a of list) s.apply(a);
  s.update(0);
  return s;
}

describe('G8 新地形机关', () => {
  it('5 种新机关分配到第 2/4/5/6/7 章，键名唯一且有中文名', () => {
    expect(NEW_MECHS).toHaveLength(5);
    for (const [ch, key] of NEW_MECHS) {
      const list = TERRAIN_MECHS[ch];
      expect(list, `第 ${ch} 章`).toBeDefined();
      const hit = list.filter(([k]) => k === key);
      expect(hit, `${ch}:${key}`).toHaveLength(1);
      expect(hit[0][1].length).toBeGreaterThan(1);
    }
    // 第 6、7 章都拿到了新机关
    expect(NEW_MECHS.some(([c]) => c === 6)).toBe(true);
    expect(NEW_MECHS.some(([c]) => c === 7)).toBe(true);
    // 每章内部键名不重复（开发者面板按键开关）
    for (const [ch, list] of Object.entries(TERRAIN_MECHS)) {
      const keys = list.map(([k]) => k);
      expect(new Set(keys).size, `第 ${ch} 章`).toBe(keys.length);
    }
  });

  it('每章地形说明中英文条数一致，新机关都有说明', () => {
    for (const [ch] of NEW_MECHS) {
      const zh = TERRAIN_INFO[ch];
      const en = EN_CHAPTERS[ch]?.terrain;
      expect(en, `第 ${ch} 章英文`).toBeDefined();
      expect(en).toHaveLength(zh.length);
      expect(zh.length).toBeGreaterThanOrEqual(3);
      for (const s of [...zh, ...en]) expect(s.trim().length).toBeGreaterThan(5);
    }
    expect(TERRAIN_INFO[2].at(-1)).toContain('洒水器');
    expect(TERRAIN_INFO[4].at(-1)).toContain('酸液');
    expect(TERRAIN_INFO[5].at(-1)).toContain('鼓风口');
    expect(TERRAIN_INFO[6].at(-1)).toContain('补光灯');
    expect(TERRAIN_INFO[7].at(-1)).toContain('荆棘');
  });

  it('机关数值引用的状态都存在，且使用了新状态', () => {
    const used = new Set<StatusId>();
    for (const [key, t] of Object.entries(TERRAIN_TUNING)) {
      const list = Array.isArray(t.status) ? t.status : [t.status];
      for (const a of list) {
        expect(STATUSES[a.id as StatusId], `${key}.${a.id}`).toBeDefined();
        expect(a.dur).toBeGreaterThan(0);
        used.add(a.id as StatusId);
      }
    }
    for (const id of NEW_STATUSES) expect(used.has(id), id).toBe(true);
  });
});

describe('G9 新状态效果', () => {
  it('定义齐全：增益 / 减益各两种，英文名描述齐全', () => {
    const kinds = NEW_STATUSES.map((id) => STATUSES[id].kind);
    expect(kinds.filter((k) => k === 'debuff')).toHaveLength(2);
    expect(kinds.filter((k) => k === 'buff')).toHaveLength(2);
    for (const id of NEW_STATUSES) {
      const d = STATUSES[id];
      expect(d.id).toBe(id);
      expect(d.desc.length).toBeGreaterThan(3);
      expect(d.glyph).toHaveLength(1);
      expect(EN_STATUSES[id].name.length).toBeGreaterThan(2);
      expect(EN_STATUSES[id].desc.length).toBeGreaterThan(5);
    }
  });

  it('浸湿：每层移速 -10%、攻速 -8%，最多 3 层', () => {
    const s = withStatus({ id: 'soaked', dur: 4, stacks: 2 });
    expect(s.totals.speed).toBe(-20);
    expect(s.totals.attackSpeed).toBe(-16);
    s.apply({ id: 'soaked', dur: 4, stacks: 5 });
    s.update(0);
    expect(s.stacks('soaked')).toBe(3);
    expect(s.totals.speed).toBe(-30);
  });

  it('腐蚀：持续伤害 + 受到伤害 +6%/层', () => {
    const s = withStatus({ id: 'corrode', dur: 3, stacks: 2 });
    expect(s.totals.dmgTaken).toBe(12);
    expect(s.totals.dps).toBeCloseTo(0.6);
    // 0.5 秒结算一次持续伤害
    expect(s.update(0.5)).toBeCloseTo(0.3);
  });

  it('顺风：移速 +12%、闪避 +4%/层', () => {
    const s = withStatus({ id: 'tailwind', dur: 2, stacks: 3 });
    expect(s.totals.speed).toBe(36);
    expect(s.totals.dodge).toBe(12);
  });

  it('硬化：护甲 +3、受到伤害 -10%/层，最多 2 层', () => {
    const s = withStatus({ id: 'hardened', dur: 2, stacks: 5 });
    expect(s.stacks('hardened')).toBe(2);
    expect(s.totals.armor).toBe(6);
    expect(s.totals.dmgTaken).toBe(-20);
  });

  it('到期移除后效果消失；增益在清除减益时保留', () => {
    const s = withStatus({ id: 'soaked', dur: 1 }, { id: 'hardened', dur: 5 });
    s.cleanse();
    s.update(0);
    expect(s.has('soaked')).toBe(false);
    expect(s.totals.armor).toBe(3);
    s.update(6);
    expect(s.totals.armor).toBe(0);
    expect(s.totals.dmgTaken).toBe(0);
  });

  it('敌人：硬化 / 腐蚀改变受到伤害倍率，浸湿 / 顺风改变攻击节奏与移速汇总', () => {
    const e = new Enemy();
    e.status.apply({ id: 'hardened', dur: 3, stacks: 2 });
    e.status.update(0);
    expect(e.takenMult).toBeCloseTo(0.8);
    e.status.clear();
    e.status.apply({ id: 'corrode', dur: 3, stacks: 4 });
    e.status.update(0);
    expect(e.takenMult).toBeCloseTo(1.24);
    e.status.clear();
    expect(e.actRate).toBe(1);
    e.status.apply({ id: 'soaked', dur: 3, stacks: 3 });
    e.status.update(0);
    expect(e.actRate).toBeCloseTo(0.76);
    expect(e.status.totals.speed).toBe(-30);
  });
});

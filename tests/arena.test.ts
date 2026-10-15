// 场地几何：各形状的「在内 / 推回 / 随机点」与障碍物
import { describe, it, expect } from 'vitest';
import { Arena, type ArenaShape } from '../src/systems/Arena';
import { ARENAS, arenaDefFor, DEFAULT_ARENA } from '../src/data/arenas';

const shapes: [string, ArenaShape][] = [
  ['rect', { kind: 'rect', w: 1000, h: 600 }],
  ['roundRect', { kind: 'roundRect', w: 1000, h: 600, r: 150 }],
  ['circle', { kind: 'ellipse', rx: 500, ry: 500 }],
  ['ellipse', { kind: 'ellipse', rx: 700, ry: 400 }],
  [
    'octagon',
    {
      kind: 'polygon',
      pts: [
        [300, 0],
        [700, 0],
        [1000, 300],
        [1000, 700],
        [700, 1000],
        [300, 1000],
        [0, 700],
        [0, 300],
      ],
    },
  ],
  [
    'cross',
    {
      kind: 'union',
      parts: [
        { kind: 'rect', w: 1200, h: 400 },
        {
          kind: 'polygon',
          pts: [
            [400, -400],
            [800, -400],
            [800, 800],
            [400, 800],
          ],
        },
      ],
    },
  ],
];

describe('场地几何', () => {
  it.each(shapes)('%s：推回后一定在场地内、随机点在场地内', (_, shape) => {
    const a = new Arena({ shape });
    for (let i = 0; i < 400; i++) {
      const x = a.left - 300 + Math.random() * (a.width + 600),
        y = a.top - 300 + Math.random() * (a.height + 600);
      const c = a.clamp(x, y, 20);
      expect(a.contains(c.x, c.y, 19.5), `${x},${y} → ${c.x},${c.y}`).toBe(true);
      // 已经在内部的点不动
      if (a.contains(x, y, 20)) expect([c.x, c.y]).toEqual([x, y]);
    }
    for (let i = 0; i < 50; i++) {
      const p = a.randomPoint(30);
      expect(a.contains(p.x, p.y, 30)).toBe(true);
    }
  });

  it('矩形的推回与旧的外接矩形夹取一致', () => {
    const a = new Arena({ shape: { kind: 'rect', w: 1920, h: 1200 } });
    expect(a.clamp(-50, 600, 20)).toEqual({ x: 20, y: 600 });
    expect(a.clamp(2500, 1500, 30)).toEqual({ x: 1890, y: 1170 });
    expect([a.width, a.height, a.centerX, a.centerY, a.right, a.bottom]).toEqual([1920, 1200, 960, 600, 1920, 1200]);
  });

  it('障碍物：点被推出障碍物，随机点不落在障碍物里', () => {
    const a = new Arena({
      shape: { kind: 'rect', w: 1000, h: 1000 },
      obstacles: [
        { kind: 'circle', x: 500, y: 500, r: 100 },
        { kind: 'rect', x: 100, y: 100, w: 200, h: 80 },
      ],
    });
    const c = a.clamp(510, 505, 20);
    expect(Math.hypot(c.x - 500, c.y - 505 + 5) >= 119).toBe(true);
    expect(a.blocked(c.x, c.y, 19)).toBe(false);
    const r = a.clamp(150, 120, 10);
    expect(a.blocked(r.x, r.y, 9)).toBe(false);
    for (let i = 0; i < 100; i++) {
      const p = a.randomPoint(10);
      expect(a.blocked(p.x, p.y, 10)).toBe(false);
    }
  });

  it('各章场地：多边形都是凸的，推回后一定在场地内，出生点可站立', () => {
    const convex = (pts: [number, number][]) => {
      let sign = 0;
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i],
          [bx, by] = pts[(i + 1) % pts.length],
          [cx, cy] = pts[(i + 2) % pts.length];
        const z = (bx - ax) * (cy - by) - (by - ay) * (cx - bx);
        if (Math.abs(z) < 1e-6) continue;
        if (sign === 0) sign = Math.sign(z);
        else if (Math.sign(z) !== sign) return false;
      }
      return true;
    };
    const polys = (s: ArenaShape): [number, number][][] =>
      s.kind === 'polygon' ? [s.pts] : s.kind === 'union' ? s.parts.flatMap(polys) : [];
    for (const ch of [1, 2, 3, 4, 5, 6, 7]) {
      const def = arenaDefFor(ch);
      for (const p of polys(def.shape)) expect(convex(p), `第 ${ch} 章多边形`).toBe(true);
      const a = new Arena(def);
      expect(a.contains(a.spawn.x, a.spawn.y, 30), `第 ${ch} 章出生点`).toBe(true);
      for (let i = 0; i < 300; i++) {
        const x = a.left - 300 + Math.random() * (a.width + 600),
          y = a.top - 300 + Math.random() * (a.height + 600);
        const c = a.clamp(x, y, 25);
        expect(a.contains(c.x, c.y, 24), `第 ${ch} 章 ${x},${y}`).toBe(true);
      }
    }
  });

  it('各章场地配置合法：中心可站立', () => {
    for (const ch of [1, 2, 3, 4, 5, 6, 7]) {
      const a = new Arena(arenaDefFor(ch));
      expect(a.width).toBeGreaterThan(600);
      expect(a.height).toBeGreaterThan(600);
      expect(a.contains(a.centerX, a.centerY, 30) || a.blocked(a.centerX, a.centerY), `第 ${ch} 章`).toBe(true);
    }
    expect(Object.keys(ARENAS).every((k) => Number(k) >= 1 && Number(k) <= 7)).toBe(true);
    expect(DEFAULT_ARENA.shape.kind).toBe('rect');
  });

  it('运行中变化：缩场、淹没、临时障碍物', () => {
    const a = new Arena({ shape: { kind: 'rect', w: 1000, h: 1000 } });
    a.apply({ kind: 'shrink', to: 0.5, dur: 1 });
    a.update(0.5);
    expect(a.scale).toBeCloseTo(0.75, 5);
    a.update(1);
    expect(a.scale).toBe(0.5);
    // 缩到一半：中心 500 ± 250 以内才算场地
    expect(a.contains(500, 500, 10)).toBe(true);
    expect(a.contains(100, 500, 0)).toBe(false);
    const c = a.clamp(0, 0, 20);
    expect(c.x).toBeCloseTo(270, 5);
    expect(c.y).toBeCloseTo(270, 5);
    a.apply({ kind: 'flood', area: { half: 'left' }, dur: 2, dps: 5 });
    expect(a.floodAt(400, 500)).not.toBeNull();
    expect(a.floodAt(600, 500)).toBeNull();
    a.update(2.1);
    expect(a.floodAt(400, 500)).toBeNull();
    a.apply({ kind: 'obstacle', obstacles: [{ kind: 'circle', x: 500, y: 500, r: 50 }], dur: 1 });
    expect(a.blocked(500, 500)).toBe(true);
    a.update(1.1);
    expect(a.blocked(500, 500)).toBe(false);
    a.reset();
    expect(a.scale).toBe(1);
    expect(a.contains(100, 500, 0)).toBe(true);
  });
});

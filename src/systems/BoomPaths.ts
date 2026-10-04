// 回旋镖飞行轨迹：不再直线飞出、直线收回，每种回旋镖有自己的曲线。
// 轨迹在「以出手方向为前方」的局部坐标里定义：u = 向前距离，v = 侧向偏移（side = ±1 决定往哪边拐）。
// 局部原点从出手点逐渐过渡到玩家当前位置，所以无论玩家怎么走，最后都会飞回手里。
import type { WeaponDef } from '../data/weapons';

export type BoomPath = 'arc' | 'wide' | 'wave' | 'spiral' | 'loops';

/** 各回旋镖的轨迹；未列出的普通回旋镖走 arc，超武默认走 loops */
export const BOOM_PATH: Record<string, BoomPath> = {
  onion_boomerang: 'arc', // 经典回旋镖：泪滴形，一侧飞出、另一侧绕回
  plate_frisbee: 'wide', // 飞碟：前段较直，远端大幅甩弯
  pizza_cutter: 'wave', // 滚刀：贴地蛇形滚出再滚回
  star_anise_shuriken: 'spiral', // 飞镖：螺旋扫过目标两侧
  anise_storm: 'loops', // 超武：飞到远处连转三圈椭圆再回
};

export function boomPathOf(def: WeaponDef): BoomPath {
  return BOOM_PATH[def.id] ?? (def.evolvedFrom ? 'loops' : 'arc');
}

/** 整趟飞行耗时 = 射程 / 弹速 × 系数（曲线越长系数越大） */
export const BOOM_TIME: Record<BoomPath, number> = { arc: 2.3, wide: 2.5, wave: 2.1, spiral: 2.5, loops: 4.2 };

/** 一趟分成几段，每进入新的一段清空命中记录，同一个敌人可以再被打一次（去程 / 回程 / 每一圈） */
export const BOOM_PASSES: Record<BoomPath, number> = { arc: 2, wide: 2, wave: 2, spiral: 2, loops: 5 };

/** t ∈ [0,1] 时的局部偏移；L = 最远距离 */
export function boomOffset(path: BoomPath, t: number, L: number, side: number): { u: number; v: number } {
  const TAU = Math.PI * 2;
  switch (path) {
    case 'arc':
      return { u: (L / 2) * (1 - Math.cos(TAU * t)), v: side * L * 0.32 * Math.sin(TAU * t) };
    case 'wide':
      return { u: (L / 2) * (1 - Math.cos(TAU * t)), v: side * L * 0.6 * Math.sin(TAU * t) * Math.sin(Math.PI * t) };
    case 'wave':
      return { u: L * Math.sin(Math.PI * t), v: side * L * 0.1 * Math.sin(8 * Math.PI * t) };
    case 'spiral': {
      const r = L * Math.sin(Math.PI * t);
      const th = side * Math.PI * 1.2 * (t - 0.5);
      return { u: r * Math.cos(th), v: r * Math.sin(th) };
    }
    case 'loops': {
      const k = Math.sin(Math.PI * t);
      const c = L * 0.62 * Math.min(1, k * 1.6); // 绕圈中心离玩家的距离
      const e = L * 0.3 * Math.min(1, k * 2.2); // 椭圆半径
      const ph = TAU * 3 * t;
      return { u: c + e * Math.cos(ph), v: side * e * 0.6 * Math.sin(ph) };
    }
  }
}

// 关卡场地：形状（矩形 / 圆角矩形 / 椭圆 / 凸多边形 / 拼接）+ 障碍物（只挡移动，不挡任何子弹）。
// 所有「把坐标限制在场地内」「在场地里随机找一点」的逻辑都走这里，不要再直接用外接矩形夹取。
// 外接矩形（x / y / width / height / right / bottom / centerX / centerY）保留给镜头边界、子弹出界判定与开发工具。
// 设计见 docs/design/ARENAS.md
// 不依赖 Phaser，方便单元测试
const clampN = (v: number, lo: number, hi: number): number => (lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v)));
const rand = (lo: number, hi: number): number => lo + Math.random() * (hi - lo);

export type ArenaShape =
  | { kind: 'rect'; w: number; h: number }
  | { kind: 'roundRect'; w: number; h: number; r: number }
  | { kind: 'ellipse'; rx: number; ry: number }
  /** 凸多边形，顶点按顺时针或逆时针给出（相对场地左上角） */
  | { kind: 'polygon'; pts: [number, number][] }
  /** 多块拼接（十字形、L 形）：点在任意一块里就算在场地内 */
  | { kind: 'union'; parts: ArenaShape[] };

/** 障碍物；look / color 只影响运行中临时障碍物的画法（常驻障碍物画在地图贴图里） */
export type Obstacle = (
  { kind: 'circle'; x: number; y: number; r: number } | { kind: 'rect'; x: number; y: number; w: number; h: number }
) & {
  look?: 'rock' | 'scoop' | 'vine';
  color?: number;
};

/** 运行中的场地变化（Boss 转阶段等）：缩场、淹没一块区域、临时障碍物 */
export type ArenaChange =
  /** 场地以中心为基准缩放到 to（0.5–1），dur 秒内完成；收缩出去的部分不可站立 */
  | { kind: 'shrink'; to: number; dur?: number }
  /** 一块区域暂时被淹没：站在里面每秒受 dps 伤害并减速，dur 秒后退去（不挡移动） */
  | { kind: 'flood'; area: FloodArea; dur: number; dps: number; slow?: number; color?: number }
  /** 临时障碍物，dur 秒后消失（不填则一直存在到本波结束） */
  | { kind: 'obstacle'; obstacles: Obstacle[]; dur?: number };

/** 淹没区域：场地的一半（left / right / top / bottom）、或一个圆 */
export type FloodArea = { half: 'left' | 'right' | 'top' | 'bottom' } | { circle: [number, number, number] };

export interface Flood {
  area: FloodArea;
  t: number;
  dps: number;
  slow: number;
  color: number;
}

export interface ArenaDef {
  /** 地图名与描述 [中, 英]（文档与选关界面用） */
  name?: [string, string];
  desc?: [string, string];
  shape: ArenaShape;
  obstacles?: Obstacle[];
  /** 玩家出生点（默认外接矩形中心；中心被障碍物占住时必须指定） */
  spawn?: [number, number];
  /** 拼接形状（union）的整体外轮廓，只用于绘制边缘（否则各块的边框会在拼接处露出接缝） */
  outline?: [number, number][];
}

interface Pt {
  x: number;
  y: number;
}

/** 形状的外接矩形（相对场地左上角，矩形 / 椭圆以 (0,0) 为左上） */
function boundsOf(s: ArenaShape): { x: number; y: number; w: number; h: number } {
  switch (s.kind) {
    case 'rect':
    case 'roundRect':
      return { x: 0, y: 0, w: s.w, h: s.h };
    case 'ellipse':
      return { x: 0, y: 0, w: s.rx * 2, h: s.ry * 2 };
    case 'polygon': {
      const xs = s.pts.map((p) => p[0]),
        ys = s.pts.map((p) => p[1]);
      const x = Math.min(...xs),
        y = Math.min(...ys);
      return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    }
    case 'union': {
      const bs = s.parts.map(boundsOf);
      const x = Math.min(...bs.map((b) => b.x)),
        y = Math.min(...bs.map((b) => b.y));
      return { x, y, w: Math.max(...bs.map((b) => b.x + b.w)) - x, h: Math.max(...bs.map((b) => b.y + b.h)) - y };
    }
  }
}

/** 椭圆在 (dx, dy) 方向上的半径 */
function ellipseR(rx: number, ry: number, dx: number, dy: number): number {
  const d = Math.hypot(dx, dy);
  if (d === 0) return Math.min(rx, ry);
  const c = dx / d,
    sn = dy / d;
  return 1 / Math.sqrt((c / rx) ** 2 + (sn / ry) ** 2);
}

/** 点到形状边界的「向内距离」：> 0 在内部（越大越靠里），< 0 在外部 */
function inset(s: ArenaShape, x: number, y: number): number {
  switch (s.kind) {
    case 'rect':
      return Math.min(x, s.w - x, y, s.h - y);
    case 'roundRect': {
      const r = Math.min(s.r, s.w / 2, s.h / 2);
      const cx = clampN(x, r, s.w - r),
        cy = clampN(y, r, s.h - r);
      if (cx === x || cy === y) return Math.min(x, s.w - x, y, s.h - y);
      return r - Math.hypot(x - cx, y - cy);
    }
    case 'ellipse': {
      // 沿中心方向的径向距离（圆形时精确；椭圆在长短轴比不太大时足够近似，且与 clampInto 一致）
      const dx = x - s.rx,
        dy = y - s.ry;
      return ellipseR(s.rx, s.ry, dx, dy) - Math.hypot(dx, dy);
    }
    case 'polygon': {
      let m = Infinity;
      const n = s.pts.length;
      const sign = polySign(s.pts);
      for (let i = 0; i < n; i++) {
        const [ax, ay] = s.pts[i],
          [bx, by] = s.pts[(i + 1) % n];
        const len = Math.hypot(bx - ax, by - ay) || 1;
        // 叉积 / 边长 = 点到边所在直线的有向距离；按多边形绕向统一成「内侧为正」
        m = Math.min(m, (sign * ((bx - ax) * (y - ay) - (by - ay) * (x - ax))) / len);
      }
      return m;
    }
    case 'union':
      return Math.max(...s.parts.map((p) => inset(p, x, y)));
  }
}

/** 多边形绕向：1 = 按屏幕坐标顺时针（内侧在边的右手边） */
function polySign(pts: [number, number][]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i],
      [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return a >= 0 ? 1 : -1;
}

/** 把点推回形状内部（离边界至少 pad） */
function clampInto(s: ArenaShape, x: number, y: number, pad: number): Pt {
  switch (s.kind) {
    case 'rect':
      return { x: clampN(x, pad, s.w - pad), y: clampN(y, pad, s.h - pad) };
    case 'roundRect': {
      const r = Math.min(s.r, s.w / 2, s.h / 2);
      let px = clampN(x, pad, s.w - pad),
        py = clampN(y, pad, s.h - pad);
      const cx = clampN(px, r, s.w - r),
        cy = clampN(py, r, s.h - r);
      const d = Math.hypot(px - cx, py - cy),
        lim = Math.max(0, r - pad);
      if (d > lim && d > 0) {
        px = cx + ((px - cx) / d) * lim;
        py = cy + ((py - cy) / d) * lim;
      }
      return { x: px, y: py };
    }
    case 'ellipse': {
      const dx = x - s.rx,
        dy = y - s.ry;
      const d = Math.hypot(dx, dy);
      const lim = Math.max(0, ellipseR(s.rx, s.ry, dx, dy) - pad);
      return d <= lim || d === 0 ? { x, y } : { x: s.rx + (dx / d) * lim, y: s.ry + (dy / d) * lim };
    }
    case 'polygon': {
      // 凸多边形：对每条「越界」的边沿法线推回，迭代几次即可收敛到角落
      const sign = polySign(s.pts);
      let px = x,
        py = y;
      for (let it = 0; it < 4; it++) {
        let moved = false;
        for (let i = 0; i < s.pts.length; i++) {
          const [ax, ay] = s.pts[i],
            [bx, by] = s.pts[(i + 1) % s.pts.length];
          const len = Math.hypot(bx - ax, by - ay) || 1;
          const d = (sign * ((bx - ax) * (py - ay) - (by - ay) * (px - ax))) / len;
          if (d < pad) {
            // 内法线
            const nx = (-(by - ay) * sign) / len,
              ny = ((bx - ax) * sign) / len;
            px += nx * (pad - d);
            py += ny * (pad - d);
            moved = true;
          }
        }
        if (!moved) break;
      }
      return { x: px, y: py };
    }
    case 'union': {
      let best: Pt = { x, y },
        bd = Infinity;
      for (const p of s.parts) {
        if (inset(p, x, y) >= pad) return { x, y };
        const c = clampInto(p, x, y, pad);
        const d = (c.x - x) ** 2 + (c.y - y) ** 2;
        if (d < bd) {
          bd = d;
          best = c;
        }
      }
      return best;
    }
  }
}

export class Arena {
  readonly def: ArenaDef;
  private shape: ArenaShape;
  private b: { x: number; y: number; w: number; h: number };
  obstacles: Obstacle[];
  /** 临时障碍物剩余秒数（与 obstacles 里的对象一一对应；常驻障碍物不在这里） */
  private tempObs = new Map<Obstacle, number>();
  /** 缩场：当前比例、目标比例与变化速度（每秒） */
  scale = 1;
  private scaleTo = 1;
  private scaleSpeed = 0;
  /** 正在淹没的区域 */
  floods: Flood[] = [];
  /** 有变化时 +1（画面据此重绘缩场遮罩、障碍物） */
  version = 0;

  constructor(def: ArenaDef) {
    this.def = def;
    this.shape = def.shape;
    this.b = boundsOf(def.shape);
    this.obstacles = [...(def.obstacles ?? [])];
  }

  /** 施加一次场地变化（预警由调用方负责） */
  apply(c: ArenaChange): void {
    if (c.kind === 'shrink') {
      this.scaleTo = Math.max(0.3, Math.min(1, c.to));
      const d = c.dur ?? 2;
      this.scaleSpeed = d > 0 ? Math.abs(this.scaleTo - this.scale) / d : Infinity;
    } else if (c.kind === 'flood') {
      this.floods.push({ area: c.area, t: c.dur, dps: c.dps, slow: c.slow ?? 0, color: c.color ?? 0xc0392b });
    } else {
      for (const o of c.obstacles) {
        this.obstacles.push(o);
        if (c.dur !== undefined) this.tempObs.set(o, c.dur);
      }
    }
    this.version++;
  }

  /** 撤销所有运行中的变化（新一波开始、Boss 死亡时） */
  reset(): void {
    this.scale = this.scaleTo = 1;
    this.scaleSpeed = 0;
    this.floods = [];
    this.obstacles = [...(this.def.obstacles ?? [])];
    this.tempObs.clear();
    this.version++;
  }

  /** 每帧推进：缩场动画、淹没与临时障碍物计时 */
  update(dt: number): void {
    if (this.scale !== this.scaleTo) {
      const step = this.scaleSpeed * dt;
      this.scale = Math.abs(this.scaleTo - this.scale) <= step ? this.scaleTo : this.scale + Math.sign(this.scaleTo - this.scale) * step;
      this.version++;
    }
    if (this.floods.length) {
      for (const f of this.floods) f.t -= dt;
      const n = this.floods.length;
      this.floods = this.floods.filter((f) => f.t > 0);
      if (this.floods.length !== n) this.version++;
    }
    for (const [o, t] of this.tempObs) {
      if (t - dt > 0) this.tempObs.set(o, t - dt);
      else {
        this.tempObs.delete(o);
        this.obstacles = this.obstacles.filter((x) => x !== o);
        this.version++;
      }
    }
  }

  /** (x, y) 所在的淹没区域（没有返回 null） */
  floodAt(x: number, y: number): Flood | null {
    for (const f of this.floods) if (inFlood(this, f.area, x, y)) return f;
    return null;
  }

  /** 世界坐标 → 缩场前的形状坐标（缩场以外接矩形中心为基准） */
  private toShape(x: number, y: number): Pt {
    if (this.scale === 1) return { x, y };
    return { x: this.centerX + (x - this.centerX) / this.scale, y: this.centerY + (y - this.centerY) / this.scale };
  }
  private fromShape(p: Pt): Pt {
    if (this.scale === 1) return p;
    return { x: this.centerX + (p.x - this.centerX) * this.scale, y: this.centerY + (p.y - this.centerY) * this.scale };
  }

  // ---------- 外接矩形（兼容 Phaser.Geom.Rectangle 的常用字段） ----------
  get x(): number {
    return this.b.x;
  }
  get y(): number {
    return this.b.y;
  }
  get left(): number {
    return this.b.x;
  }
  get top(): number {
    return this.b.y;
  }
  get width(): number {
    return this.b.w;
  }
  get height(): number {
    return this.b.h;
  }
  get right(): number {
    return this.b.x + this.b.w;
  }
  get bottom(): number {
    return this.b.y + this.b.h;
  }
  get centerX(): number {
    return this.b.x + this.b.w / 2;
  }
  get centerY(): number {
    return this.b.y + this.b.h / 2;
  }
  /** 玩家出生点 */
  get spawn(): Pt {
    const s = this.def.spawn;
    return s ? { x: s[0], y: s[1] } : this.clamp(this.centerX, this.centerY, 30);
  }

  /** 点是否在场地内（离边界至少 pad，且不在障碍物里） */
  contains(x: number, y: number, pad = 0): boolean {
    const q = this.toShape(x, y);
    return inset(this.shape, q.x, q.y) * this.scale >= pad && !this.blocked(x, y, pad);
  }

  /** 半径 r 的圆是否压到障碍物 */
  blocked(x: number, y: number, r = 0): boolean {
    for (const o of this.obstacles) {
      if (o.kind === 'circle') {
        if (Math.hypot(x - o.x, y - o.y) < o.r + r) return true;
      } else if (x > o.x - r && x < o.x + o.w + r && y > o.y - r && y < o.y + o.h + r) return true;
    }
    return false;
  }

  /** 把坐标推回场地内（离边界至少 pad），并推出障碍物 */
  clamp(x: number, y: number, pad = 0): Pt {
    const q = this.toShape(x, y);
    let p = this.fromShape(clampInto(this.shape, q.x, q.y, pad / this.scale));
    for (const o of this.obstacles) p = pushOut(o, p.x, p.y, pad);
    return p;
  }

  /** 场地内随机一点（离边界至少 pad，不在障碍物里）；filter 可附加条件，比如离玩家够远 */
  randomPoint(pad = 0, filter?: (x: number, y: number) => boolean, tries = 30): Pt {
    let last: Pt | null = null;
    for (let i = 0; i < tries; i++) {
      const x = rand(this.left + pad, this.right - pad),
        y = rand(this.top + pad, this.bottom - pad);
      if (!this.contains(x, y, pad)) continue;
      last = { x, y };
      if (!filter || filter(x, y)) return last;
    }
    return last ?? this.clamp(this.centerX, this.centerY, pad);
  }
}

function inFlood(a: Arena, area: FloodArea, x: number, y: number): boolean {
  if ('circle' in area) {
    const [cx, cy, r] = area.circle;
    return Math.hypot(x - cx, y - cy) < r;
  }
  switch (area.half) {
    case 'left':
      return x < a.centerX;
    case 'right':
      return x >= a.centerX;
    case 'top':
      return y < a.centerY;
    case 'bottom':
      return y >= a.centerY;
  }
}

function pushOut(o: Obstacle, x: number, y: number, pad: number): Pt {
  if (o.kind === 'circle') {
    const dx = x - o.x,
      dy = y - o.y,
      d = Math.hypot(dx, dy),
      lim = o.r + pad;
    if (d >= lim) return { x, y };
    if (d < 1e-6) return { x: o.x + lim, y };
    return { x: o.x + (dx / d) * lim, y: o.y + (dy / d) * lim };
  }
  const x0 = o.x - pad,
    x1 = o.x + o.w + pad,
    y0 = o.y - pad,
    y1 = o.y + o.h + pad;
  if (x <= x0 || x >= x1 || y <= y0 || y >= y1) return { x, y };
  // 从离得最近的一边推出去
  const dl = x - x0,
    dr = x1 - x,
    dt = y - y0,
    db = y1 - y;
  const m = Math.min(dl, dr, dt, db);
  if (m === dl) return { x: x0, y };
  if (m === dr) return { x: x1, y };
  if (m === dt) return { x, y: y0 };
  return { x, y: y1 };
}

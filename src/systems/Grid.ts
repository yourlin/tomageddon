// 均匀网格空间哈希：用于快速查询附近敌人（索敌、碰撞、范围伤害、分离）
export interface GridItem {
  x: number;
  y: number;
  radius: number;
  alive: boolean;
}

export class SpatialGrid<T extends GridItem> {
  private cells = new Map<number, T[]>();
  private pool: T[][] = [];
  constructor(private cellSize: number) {}

  private key(cx: number, cy: number): number {
    return (cx + 512) * 4096 + (cy + 512);
  }

  clear(): void {
    for (const arr of this.cells.values()) {
      arr.length = 0;
      this.pool.push(arr);
    }
    this.cells.clear();
  }

  insert(item: T): void {
    const k = this.key(Math.floor(item.x / this.cellSize), Math.floor(item.y / this.cellSize));
    let arr = this.cells.get(k);
    if (!arr) {
      arr = this.pool.pop() ?? [];
      this.cells.set(k, arr);
    }
    arr.push(item);
  }

  /** 查询与圆 (x,y,r) 相交的元素（按元素半径计算），结果写入 out */
  query(x: number, y: number, r: number, out: T[]): T[] {
    out.length = 0;
    const cs = this.cellSize;
    const pad = 80; // 最大敌人半径补偿
    const x0 = Math.floor((x - r - pad) / cs),
      x1 = Math.floor((x + r + pad) / cs);
    const y0 = Math.floor((y - r - pad) / cs),
      y1 = Math.floor((y + r + pad) / cs);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const arr = this.cells.get(this.key(cx, cy));
        if (!arr) continue;
        for (const it of arr) {
          if (!it.alive) continue;
          const dx = it.x - x,
            dy = it.y - y,
            rr = r + it.radius;
          if (dx * dx + dy * dy <= rr * rr) out.push(it);
        }
      }
    }
    return out;
  }

  nearest(x: number, y: number, maxR: number, exclude?: Set<T>): T | null {
    let best: T | null = null;
    let bestD = maxR * maxR;
    const cs = this.cellSize;
    const x0 = Math.floor((x - maxR) / cs),
      x1 = Math.floor((x + maxR) / cs);
    const y0 = Math.floor((y - maxR) / cs),
      y1 = Math.floor((y + maxR) / cs);
    for (let cx = x0; cx <= x1; cx++) {
      for (let cy = y0; cy <= y1; cy++) {
        const arr = this.cells.get(this.key(cx, cy));
        if (!arr) continue;
        for (const it of arr) {
          if (!it.alive || (exclude && exclude.has(it))) continue;
          const dx = it.x - x,
            dy = it.y - y;
          const d = dx * dx + dy * dy;
          if (d < bestD) {
            bestD = d;
            best = it;
          }
        }
      }
    }
    return best;
  }
}

// 启动贴图分帧生成队列：把一次性生成几百张程序化贴图拆成小任务，每帧只做一小段，
// 画面（加载动画 / 主菜单）不会被整段卡住。
//   - 首屏只需要的贴图先做完，主菜单就出现；
//   - 其余贴图在主菜单停留期间后台继续生成；
//   - 在全部生成完之前离开主菜单（开始游戏、图鉴……），先显示加载页，生成完再进入。

export interface TexTask {
  run: () => void;
  /** 相对耗时，用于进度条（像素越多越慢） */
  w: number;
  /** 贴图名，用于报错和耗时统计 */
  k?: string;
}

/** 按像素估算任务耗时：每个贴图有固定开销（创建 / 上传显卡），再加像素量 */
export const texWeight = (w: number, h: number) => 1 + (w * h) / 20000;

const queue: TexTask[] = [];
let total = 0;
let done = 0;
let urgent = false;
const waiters: (() => void)[] = [];

/** 追加一批任务，进度按「当前批次」重新从 0 计 */
export function enqueueTex(tasks: TexTask[]): void {
  if (!queue.length) {
    total = 0;
    done = 0;
  }
  queue.push(...tasks);
  for (const t of tasks) total += t.w;
}

export const texReady = () => queue.length === 0;
export const texProgress = () => (total <= 0 ? 1 : Math.min(1, done / total));
/** 有场景在等贴图（加载页已显示）：这时每帧可以多做一些 */
export const texUrgent = () => urgent && queue.length > 0;

/** 最慢的几个任务（开发 / 性能测试用：启动时挂到 window.__texSlow） */
export const TEX_SLOW: { k: string; ms: number }[] = [];
const slow = TEX_SLOW;

function runOne(): void {
  const t = queue.shift()!;
  const t0 = performance.now();
  try {
    t.run();
  } catch (e) {
    // 单张贴图失败不能卡死整个启动；缺图会显示占位
    console.error('[TexQueue]', t.k, e);
  }
  const ms = performance.now() - t0;
  if (slow.length < 8 || ms > slow[slow.length - 1].ms) {
    slow.push({ k: t.k ?? '?', ms: Math.round(ms * 10) / 10 });
    slow.sort((a, b) => b.ms - a.ms);
    slow.length = Math.min(slow.length, 8);
  }
  done += t.w;
}

function settle(): void {
  if (queue.length) return;
  urgent = false;
  for (const cb of waiters.splice(0)) cb();
}

/**
 * 在 budgetMs 毫秒内尽量多做任务（至少做一个）；返回是否已全部完成。
 * maxWeight 限制本帧生成的贴图量：贴图上传显卡在 GPU 进程里异步进行，CPU 时间很短也可能让下一帧卡住。
 */
export function pumpTex(budgetMs: number, maxWeight = Infinity): boolean {
  if (!queue.length) return true;
  const t0 = performance.now();
  let wsum = 0;
  do {
    wsum += queue[0].w;
    runOne();
  } while (queue.length && performance.now() - t0 < budgetMs && wsum + queue[0].w <= maxWeight);
  settle();
  return !queue.length;
}

/** 同步做完全部任务（无渲染测试模式用） */
export function flushTex(): void {
  while (queue.length) runOne();
  settle();
}

/** 全部贴图就绪后回调；已就绪则立即回调 */
export function onTexReady(cb: () => void, markUrgent = true): void {
  if (!queue.length) {
    cb();
    return;
  }
  if (markUrgent) urgent = true;
  waiters.push(cb);
}

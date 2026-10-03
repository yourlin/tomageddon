// 界面内批量模拟的执行器：用隐藏的同源 iframe（?headless=1）代替 scripts/batch.mjs 的 puppeteer 页面。
// 协议与 batch.mjs 一致：等 window.__ready → 以 module 脚本注入 scripts/bot2.js → botTalents() + startBot2(id, 章, 'max')
// → 轮询 window.__botState.done → 读取 __botState 与 __dmg（伤害来源）。额外从 iframe 的 run 读最终武器 / 道具 / levelMods。
//
// 注意：iframe 与开发者页面同源，共享 localStorage。?headless 模式不会禁用存档写入（只有 ?dev 才禁用），
// 所以这里在 iframe 文档创建后立即把它的 Storage 写入方法替换为空操作，并在运行结束后按开始时的快照恢复（兜底）。
import botSrc from '../../../scripts/bot2.js?raw';
import type { StatMods } from '../../data/stats';
import { TALENT_BUDGET, type BatchConfig, type BatchRecord, type FinalWeapon, type Job, type JobResult } from './types';

type DmgEntry = [unknown, unknown, string, number];
interface BotState {
  done: boolean;
  win?: boolean;
  wave?: number;
  kills?: number;
  level?: number;
  items?: number;
  weapons?: string;
  sec?: number;
  timeout?: boolean;
  stuckAt?: string;
}
interface SceneLike {
  scene: { key: string };
}
interface FrameRun {
  wave: number;
  level: number;
  kills: number;
  weapons: FinalWeapon[];
  items: Record<string, number>;
  levelMods: StatMods;
}
interface BotExtras {
  __ready?: boolean;
  __botState?: BotState;
  __bot?: number;
  __dmg?: DmgEntry[];
  startBot2?: (id: string, ch: number, speed: number | 'max') => void;
  botTalents?: (id: string, budget: number, exclude: string[]) => void;
  run?: FrameRun;
  game?: {
    scene: {
      getScenes(active: boolean): SceneLike[];
      getScene(key: string): unknown;
      stop(key: string): void;
      resume(key: string): void;
    };
  };
  GameScene?: { onStep: unknown };
}
type BotWin = Window & typeof globalThis & BotExtras;

interface Frame {
  el: HTMLIFrameElement;
  win: BotWin;
}

const DEV_PREFIX = 'tomageddon_dev_';
const MAX_RETRY = 2;
const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

// ---------------- 模块级运行状态 ----------------
export interface ActiveJob {
  job: Job;
  since: number;
}
export const batch = {
  running: false,
  stopping: false,
  cfg: null as BatchConfig | null,
  record: null as BatchRecord | null,
  queue: [] as Job[],
  active: new Map<number, ActiveJob>(),
  retries: {} as Record<string, number>,
  /** 出错 / 跳过等信息（最新在后） */
  log: [] as string[],
  startedAt: 0,
  /** 恢复的存档键数量（兜底恢复时） */
  restored: 0,
};

let listener: (() => void) | null = null;
let finishListener: ((rec: BatchRecord) => void) | null = null;
/** 进度变化回调（页签负责节流重绘） */
export function onBatchUpdate(fn: (() => void) | null): void {
  listener = fn;
}
export function onBatchFinish(fn: ((rec: BatchRecord) => void) | null): void {
  finishListener = fn;
}
const emit = (): void => listener?.();
const log = (s: string): void => {
  batch.log.push(`${new Date().toLocaleTimeString('zh-CN', { hour12: false })} ${s}`);
  if (batch.log.length > 60) batch.log.shift();
};

// ---------------- 存档保护 ----------------
/** 把 iframe 的 localStorage 写入变为空操作，并让它认为页面始终可见（否则切到后台时游戏会自动暂停，机器人卡住） */
function guard(w: BotWin): void {
  try {
    const S = w.Storage.prototype as Storage & { __devGuard?: boolean };
    if (!S.__devGuard) {
      S.setItem = () => undefined;
      S.removeItem = () => undefined;
      S.clear = () => undefined;
      S.__devGuard = true;
    }
    const D = w.Document.prototype as Document & { __devGuard?: boolean };
    if (!D.__devGuard) {
      Object.defineProperty(D, 'hidden', { configurable: true, get: () => false });
      Object.defineProperty(D, 'visibilityState', { configurable: true, get: () => 'visible' });
      D.__devGuard = true;
    }
  } catch {
    /* iframe 尚未可访问 */
  }
}

function snapStorage(): Map<string, string> {
  const m = new Map<string, string>();
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && !k.startsWith(DEV_PREFIX)) m.set(k, localStorage.getItem(k) ?? '');
  }
  return m;
}
/** 按快照恢复非开发者键：返回改动的键数 */
function restoreStorage(snap: Map<string, string>): number {
  let n = 0;
  try {
    const now = snapStorage();
    for (const [k, v] of snap)
      if (now.get(k) !== v) {
        localStorage.setItem(k, v);
        n++;
      }
    for (const k of now.keys())
      if (!snap.has(k)) {
        localStorage.removeItem(k);
        n++;
      }
  } catch {
    /* 忽略 */
  }
  return n;
}

// ---------------- iframe ----------------
let host: HTMLDivElement | null = null;
function getHost(): HTMLDivElement {
  if (host?.isConnected) return host;
  host = document.createElement('div');
  host.id = 'dev-batch-frames';
  // 不能 display:none（画布尺寸为 0 时 Phaser 缩放会出问题），放到屏幕外并透明
  host.style.cssText = 'position:fixed;left:-20000px;top:0;width:480px;height:270px;opacity:0;pointer-events:none;overflow:hidden';
  host.setAttribute('aria-hidden', 'true');
  document.body.append(host);
  return host;
}

const frames = new Set<Frame>();
function destroyFrame(f: Frame | null): void {
  if (!f) return;
  try {
    f.win.clearInterval(f.win.__bot);
    if (f.win.GameScene) f.win.GameScene.onStep = null;
  } catch {
    /* 忽略 */
  }
  f.el.src = 'about:blank';
  f.el.remove();
  frames.delete(f);
}

async function waitFor(cond: () => boolean, ms: number, what: string, step = 50): Promise<void> {
  const t = performance.now();
  while (!cond()) {
    if (batch.stopping) throw new Error('已停止');
    if (performance.now() - t > ms) throw new Error(`${what}超时`);
    await sleep(step);
  }
}

async function createFrame(): Promise<Frame> {
  const el = document.createElement('iframe');
  el.title = '批量模拟';
  el.tabIndex = -1;
  el.style.cssText = 'position:absolute;left:0;top:0;width:480px;height:270px;border:0';
  el.src = location.pathname + '?headless=1';
  getHost().append(el);
  // 文档一创建就加保护（游戏模块脚本要等资源加载，这里每 4ms 检查一次，几乎总能抢在前面）
  const winOf = (): BotWin | null => el.contentWindow as BotWin | null;
  const isGame = (w: BotWin | null): w is BotWin => {
    try {
      return !!w && w.location.search.includes('headless');
    } catch {
      return false;
    }
  };
  try {
    await waitFor(
      () => {
        const w = winOf();
        if (!isGame(w)) return false;
        guard(w);
        return w.__ready === true;
      },
      30000,
      '等待游戏就绪（window.__ready）',
      4,
    );
    const w = winOf() as BotWin;
    guard(w);
    const doc = w.document;
    const s = doc.createElement('script');
    s.type = 'module';
    s.textContent = botSrc;
    doc.head.append(s);
    await waitFor(() => typeof w.startBot2 === 'function' && typeof w.botTalents === 'function', 10000, '注入机器人');
    const f = { el, win: w };
    frames.add(f);
    return f;
  } catch (e) {
    el.remove();
    throw e;
  }
}

const sceneKeys = (w: BotWin): string => (w.game?.scene.getScenes(true) ?? []).map((s) => s.scene.key).join('+');

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v ?? null)) as T;

/** 打一局；停止时返回 null */
async function play(f: Frame, job: Job, cfg: BatchConfig): Promise<JobResult | null> {
  const w = f.win;
  w.__dmg = [];
  w.botTalents!(job.charId, TALENT_BUDGET[cfg.talents], []);
  w.startBot2!(job.charId, job.ch, 'max');
  const limit = cfg.timeoutSec * 1000;
  const t = performance.now();
  while (!w.__botState?.done) {
    await sleep(200);
    if (batch.stopping) {
      w.clearInterval(w.__bot);
      if (w.GameScene) w.GameScene.onStep = null;
      return null;
    }
    // 兜底：万一仍进入了暂停界面，自动继续
    if (sceneKeys(w).includes('Pause')) {
      const ps = w.game?.scene.getScene('Pause') as { resume?: () => void } | undefined;
      ps?.resume?.();
    }
    if (performance.now() - t > limit) {
      w.clearInterval(w.__bot);
      if (w.GameScene) w.GameScene.onStep = null;
      w.__botState = { ...w.__botState, done: true, win: false, timeout: true, wave: w.run?.wave, stuckAt: sceneKeys(w) };
    }
  }
  const st = w.__botState;
  const agg: Record<string, number> = {};
  for (const [, , src, d] of w.__dmg ?? []) agg[src] = (agg[src] ?? 0) + d;
  const r = w.run;
  const wl = clone((r?.weapons ?? []).map((x) => ({ id: x.id, tier: x.tier, forge: x.forge, affixes: x.affixes })));
  const il = clone(r?.items ?? {});
  return {
    key: job.key,
    charId: job.charId,
    ch: job.ch,
    run: job.run,
    win: !!st.win,
    wave: st.wave ?? r?.wave ?? 0,
    kills: st.kills ?? r?.kills ?? 0,
    level: st.level ?? r?.level ?? 0,
    items: st.items ?? Object.values(il).reduce((a, b) => a + b, 0),
    weapons: st.weapons ?? wl.map((x) => x.id + x.tier).join(','),
    sec: st.sec ?? Math.round((performance.now() - t) / 1000),
    timeout: st.timeout || undefined,
    stuckAt: st.stuckAt,
    topDmg: Object.entries(agg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${k}:${Math.round(v)}`)
      .join(' '),
    wl,
    il,
    lm: clone(r?.levelMods ?? {}),
  };
}

/** 一个并发槽位：按需建 iframe，出错时重建并把该局放回队列 */
async function slot(i: number, cfg: BatchConfig, rec: BatchRecord): Promise<void> {
  let f: Frame | null = null;
  let fails = 0;
  while (batch.queue.length && !batch.stopping) {
    if (!f) {
      try {
        f = await createFrame();
        fails = 0;
      } catch (e) {
        if (batch.stopping) break;
        log(`槽位 ${i + 1} 建页面失败：${(e as Error).message}`);
        if (++fails >= 3) {
          log(`槽位 ${i + 1} 连续失败，退出（剩余任务由其他槽位完成）`);
          break;
        }
        await sleep(1500);
        continue;
      }
    }
    const job = batch.queue.shift();
    if (!job) break;
    batch.active.set(i, { job, since: performance.now() });
    emit();
    try {
      const r = await play(f, job, cfg);
      batch.active.delete(i);
      if (!r) break;
      rec.results.push(r);
      if (r.timeout) {
        // 超时的页面状态不可信，重建
        log(`${job.key} 超时（卡在 ${r.stuckAt || '?'}）`);
        destroyFrame(f);
        f = null;
      }
    } catch (e) {
      batch.active.delete(i);
      if (batch.stopping) break;
      batch.retries[job.key] = (batch.retries[job.key] ?? 0) + 1;
      log(`${job.key} 出错（第 ${batch.retries[job.key]} 次）：${(e as Error).message}`);
      if (batch.retries[job.key] <= MAX_RETRY) batch.queue.push(job);
      else log(`${job.key} 重试次数用尽，跳过`);
      destroyFrame(f);
      f = null;
    }
    rec.elapsedMs = Date.now() - batch.startedAt;
    emit();
  }
  batch.active.delete(i);
  destroyFrame(f);
}

export function buildJobs(cfg: BatchConfig): Job[] {
  const jobs: Job[] = [];
  for (const ch of cfg.chapters)
    for (const id of cfg.chars) for (let r = 0; r < cfg.runs; r++) jobs.push({ charId: id, ch, run: r, key: `${ch}:${id}:${r}` });
  return jobs;
}

/** 开始一次批量运行；返回错误文本或 null */
export function startBatch(cfg: BatchConfig): string | null {
  if (batch.running) return '已有批量运行进行中';
  const jobs = buildJobs(cfg);
  if (!jobs.length) return '请至少选择一个角色和一个章节';
  const workers = Math.max(1, Math.min(6, Math.round(cfg.workers)));
  const rec: BatchRecord = {
    id: `b${Date.now().toString(36)}`,
    at: Date.now(),
    cfg: { ...cfg, workers },
    total: jobs.length,
    complete: false,
    elapsedMs: 0,
    results: [],
  };
  Object.assign(batch, {
    running: true,
    stopping: false,
    cfg: rec.cfg,
    record: rec,
    queue: jobs,
    retries: {},
    log: [],
    startedAt: Date.now(),
    restored: 0,
  });
  batch.active.clear();
  const snap = snapStorage();
  log(`开始：${jobs.length} 局，并发 ${workers}`);
  emit();
  void Promise.all(Array.from({ length: Math.min(workers, jobs.length) }, (_, i) => slot(i, rec.cfg, rec))).finally(() => {
    for (const f of [...frames]) destroyFrame(f);
    host?.remove();
    host = null;
    batch.restored = restoreStorage(snap);
    if (batch.restored) log(`已按开始时的快照恢复 ${batch.restored} 个存档键（iframe 写入了存档）`);
    rec.elapsedMs = Date.now() - batch.startedAt;
    rec.complete = rec.results.length >= rec.total;
    log(batch.stopping ? `已停止：完成 ${rec.results.length}/${rec.total}` : `完成：${rec.results.length}/${rec.total}`);
    batch.running = false;
    batch.stopping = false;
    batch.queue = [];
    batch.active.clear();
    finishListener?.(rec);
    emit();
  });
  return null;
}

/** 停止：进行中的局立即中断（不计入结果），已完成的局保留 */
export function stopBatch(): void {
  if (!batch.running) return;
  batch.stopping = true;
  batch.queue = [];
  emit();
}

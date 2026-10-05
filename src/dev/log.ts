// 开发者界面的三条记录流（只在内存里，刷新即清空）：
// - 操作日志（A10）：toast 过的消息，最近 50 条
// - 报错（J3）：window.onerror / unhandledrejection，附当时的构筑与快照
// - 事件流（J2）：伤害 / 治疗 / 状态 / 技能 / 拾取，最近 500 条，可暂停

export interface OpLog {
  t: number;
  msg: string;
  bad: boolean;
}
export interface ErrLog {
  t: number;
  msg: string;
  stack: string;
  /** 报错时的构筑 JSON（可载回） */
  build: string;
  /** 报错时的沙盒快照 JSON（沙盒未运行时为空） */
  snap: string;
}
export type EvKind = 'dmg' | 'heal' | 'status' | 'skill' | 'pickup' | 'kill' | 'hurt';
export interface EvLog {
  t: number;
  kind: EvKind;
  text: string;
}

export const EV_NAME: Record<EvKind, string> = {
  dmg: '伤害',
  heal: '治疗',
  status: '状态',
  skill: '技能',
  pickup: '拾取',
  kill: '击杀',
  hurt: '受伤',
};

export const logs = {
  ops: [] as OpLog[],
  errors: [] as ErrLog[],
  events: [] as EvLog[],
  /** 事件流暂停时不再记录 */
  evPaused: false,
  /** 事件流类别过滤（不在集合内的不记录） */
  evOn: new Set<EvKind>(['heal', 'status', 'skill', 'pickup', 'kill', 'hurt']),
  /** 伤害事件很多，单独采样：每 N 次记录 1 次 */
  dmgSample: 10,
  onError: null as ((e: ErrLog) => void) | null,
};

export function logOp(msg: string, bad = false): void {
  logs.ops.unshift({ t: Date.now(), msg, bad });
  if (logs.ops.length > 50) logs.ops.length = 50;
}

let dmgN = 0;
export function logEv(kind: EvKind, text: string): void {
  if (logs.evPaused || !logs.evOn.has(kind)) return;
  if (kind === 'dmg' && dmgN++ % Math.max(1, logs.dmgSample) !== 0) return;
  logs.events.unshift({ t: performance.now(), kind, text });
  if (logs.events.length > 500) logs.events.length = 500;
}

/** 安装全局报错捕获；ctxInfo 返回当时的构筑 / 快照 JSON */
export function installErrorCapture(ctxInfo: () => { build: string; snap: string }): void {
  const push = (msg: string, stack: string) => {
    let info = { build: '', snap: '' };
    try {
      info = ctxInfo();
    } catch {
      /* 抓取失败也要记录报错本身 */
    }
    const e: ErrLog = { t: Date.now(), msg, stack, ...info };
    logs.errors.unshift(e);
    if (logs.errors.length > 30) logs.errors.length = 30;
    logs.onError?.(e);
  };
  window.addEventListener('error', (ev) => push(ev.message || String(ev.error), (ev.error as Error | undefined)?.stack ?? ''));
  window.addEventListener('unhandledrejection', (ev) => {
    const r = ev.reason as unknown;
    push(r instanceof Error ? r.message : String(r), r instanceof Error ? (r.stack ?? '') : '');
  });
}

export const clock = (t: number): string => new Date(t).toLocaleTimeString();

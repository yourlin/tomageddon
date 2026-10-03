// K10：本地错误日志。捕获页面报错存进 localStorage（最多 20 条），设置页可一键复制给开发者。
// 不上传任何数据（在线上报需要服务器，见路线图「以后再做」）。
const KEY = 'tomageddon_errors_v1';

export interface ErrorEntry {
  t: number;
  msg: string;
  stack: string;
  ver: string;
  scene: string;
}

export function errorLog(): ErrorEntry[] {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) ?? '[]') as ErrorEntry[];
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

export function clearErrorLog(): void {
  localStorage.removeItem(KEY);
}

export function installErrorLog(currentScene: () => string): void {
  const push = (msg: string, stack: string) => {
    try {
      const list = errorLog();
      // 同一条报错连续出现只记一次（每帧报错时不会刷满）
      if (list[0]?.msg === msg) return;
      list.unshift({ t: Date.now(), msg: msg.slice(0, 500), stack: stack.slice(0, 2000), ver: __APP_VERSION__, scene: currentScene() });
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)));
    } catch {
      /* 存储满或隐私模式 */
    }
  };
  window.addEventListener('error', (e) => push(e.message || String(e.error), (e.error as Error | undefined)?.stack ?? ''));
  window.addEventListener('unhandledrejection', (e) => {
    const r = e.reason as unknown;
    push(r instanceof Error ? r.message : String(r), r instanceof Error ? (r.stack ?? '') : '');
  });
}

/** 复制用文本：版本、浏览器、每条报错 */
export function errorReport(): string {
  const list = errorLog();
  return [
    `Tomageddon v${__APP_VERSION__} · ${navigator.userAgent}`,
    ...list.map((e) => `\n[${new Date(e.t).toISOString()}] v${e.ver} @${e.scene}\n${e.msg}\n${e.stack}`),
  ].join('\n');
}

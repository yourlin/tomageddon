// 报告页：在开发者界面里查看 scripts/batch.mjs 生成的平衡报告（reports/*.html），图表照常用 ECharts 交互。
// 报告由 vite dev / preview 服务器的 balance-reports 插件提供（见 vite.config.ts），静态构建（GitHub Pages）里没有这个接口。
import { h, btn, select } from '../dom';
import type { DevCtx } from '../ctx';

interface ReportFile {
  name: string;
  mtime: number;
  size: number;
}

const ROUTE = '/__balance-reports/';
/** 最新报告的固定文件名（batch.mjs 每次都会覆盖它） */
const LATEST = 'BALANCE_REPORT.html';

// ---------------- 模块级状态 ----------------
let files: ReportFile[] | null = null;
let error = '';
let loading = false;
let current = LATEST;
let height = 900;

/** 报告接口挂在服务器根路径（base 是 './'，但中间件不受 base 影响） */
const url = (name: string) => `${location.origin}${ROUTE}${encodeURIComponent(name)}`;

/** balance-20261016-040057.html → 2026-10-16 04:00:57；-partial 标出未完成 */
function label(f: ReportFile): string {
  if (f.name === LATEST) return `最新报告（${new Date(f.mtime).toLocaleString('zh-CN', { hour12: false })}）`;
  const m = f.name.match(/^balance-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})(-partial)?\.html$/);
  if (!m) return f.name;
  return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}${m[7] ? '（未完成）' : ''}`;
}

async function refresh(ctx: DevCtx): Promise<void> {
  loading = true;
  error = '';
  ctx.rerender();
  try {
    const r = await fetch(`${location.origin}${ROUTE}`, { cache: 'no-store' });
    if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) throw new Error(`HTTP ${r.status}`);
    // 只列报告本体（echarts.min.js 等不是 .html，已被服务器过滤）
    files = ((await r.json()) as ReportFile[]).filter((f) => f.name.endsWith('.html'));
    if (!files.some((f) => f.name === current)) current = files[0]?.name ?? LATEST;
  } catch (e) {
    files = null;
    error = (e as Error).message;
  }
  loading = false;
  ctx.rerender();
}

/** 当前渲染出的报告 iframe（全屏按钮在它之前创建，所以用模块变量引用） */
let frameEl: HTMLIFrameElement | null = null;

/** 全屏查看：iframe 本身进入全屏（浏览器的 :fullscreen 样式会铺满屏幕，报告里的 ECharts 随窗口 resize 自适应）；
 *  不支持元素全屏的环境（如 iPhone Safari）退回新窗口打开 */
function fullscreen(): void {
  const el = frameEl;
  if (el?.isConnected && typeof el.requestFullscreen === 'function' && document.fullscreenEnabled) {
    el.requestFullscreen().catch(() => window.open(el.src, '_blank', 'noopener'));
  } else {
    window.open(url(current), '_blank', 'noopener');
  }
}

export function renderReports(ctx: DevCtx): HTMLElement {
  if (files === null && !loading && !error) void refresh(ctx);

  const bar = h(
    'div',
    { class: 'row', style: 'display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px' },
    files?.length
      ? select(
          files.map((f) => [f.name, label(f)]),
          current,
          (v) => {
            current = v;
            ctx.rerender();
          },
        )
      : null,
    btn(loading ? '刷新中…' : '刷新列表', () => void refresh(ctx), '', '重新读取 reports/ 目录'),
    files?.length ? btn('全屏查看', () => fullscreen(), '', '全屏显示当前报告，按 Esc 退出') : null,
    files?.length ? h('a', { href: url(current), target: '_blank', rel: 'noopener' }, '新窗口打开') : null,
    files?.length
      ? select(
          [
            [600, '高 600'],
            [900, '高 900'],
            [1400, '高 1400'],
            [2400, '高 2400'],
          ],
          height,
          (v) => {
            height = Number(v);
            ctx.rerender();
          },
        )
      : null,
  );

  if (error)
    return h(
      'div',
      null,
      bar,
      h(
        'div',
        { class: 'muted' },
        `读不到报告列表（${error}）。报告只在 npm run dev / npm run preview 启动的服务器上提供，静态部署的站点没有；`,
        '先用 npm run balance（或 node scripts/batch.mjs）生成报告。',
      ),
    );
  if (!files) return h('div', null, bar, h('div', { class: 'muted' }, '加载中…'));
  if (!files.length) return h('div', null, bar, h('div', { class: 'muted' }, 'reports/ 里还没有报告：先运行 npm run balance 生成。'));

  // 报告自带脚本（ECharts、章节筛选），放进只允许脚本的沙箱 iframe：不与开发者页面同源，碰不到存档与面板
  const frame = h('iframe', {
    src: url(current),
    sandbox: 'allow-scripts allow-popups',
    title: label(files.find((f) => f.name === current) ?? files[0]),
    style: `width:100%;height:${height}px;border:1px solid var(--ln);border-radius:6px;background:#fff`,
  }) as HTMLIFrameElement;
  frameEl = frame;
  return h('div', null, bar, frame);
}

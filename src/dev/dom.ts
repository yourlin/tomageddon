// 开发者界面的极简 DOM 工具：h() 建元素 + 一份注入样式。界面只给开发者用，不做多语言。

type Child = Node | string | number | null | undefined | false;
type Props = Record<string, unknown>;

/** h('div', { class: 'x', onclick: fn, style: 'color:red' }, '文字', child) */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props | null = null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = String(v);
      else if (k === 'style') el.style.cssText = String(v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
      else if (k in el) (el as unknown as Record<string, unknown>)[k] = v;
      else el.setAttribute(k, String(v));
    }
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

export const hex = (c: number): string => '#' + c.toString(16).padStart(6, '0');
export const fmt = (v: number, d = 1): string => (Number.isInteger(v) ? String(v) : v.toFixed(d));
export const esc = (s: string): string => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

/** 下拉框：options 为 [值, 文字]；onChange 收到字符串值 */
export function select(
  options: [string | number, string][],
  value: string | number,
  onChange: (v: string) => void,
  cls = '',
): HTMLSelectElement {
  const s = h('select', { class: cls, onchange: () => onChange(s.value) });
  for (const [v, t] of options) s.append(h('option', { value: String(v), selected: String(v) === String(value) }, t));
  return s;
}

/** 数字输入：失焦或回车时提交（避免每个按键都重绘面板） */
export function num(
  value: number,
  onChange: (v: number) => void,
  opts: { min?: number; max?: number; step?: number; width?: number } = {},
): HTMLInputElement {
  const i = h('input', {
    type: 'number',
    value: String(value),
    min: opts.min,
    max: opts.max,
    step: opts.step ?? 1,
    style: `width:${opts.width ?? 64}px`,
    onchange: () => {
      let v = Number(i.value);
      if (!Number.isFinite(v)) v = value;
      if (opts.min !== undefined) v = Math.max(opts.min, v);
      if (opts.max !== undefined) v = Math.min(opts.max, v);
      onChange(v);
    },
  });
  return i;
}

export function check(label: string, value: boolean, onChange: (v: boolean) => void, title = ''): HTMLLabelElement {
  const i = h('input', { type: 'checkbox', checked: value, onchange: () => onChange(i.checked) });
  return h('label', { class: 'chk', title }, i, label);
}

export function btn(label: string, onClick: () => void, cls = '', title = ''): HTMLButtonElement {
  return h('button', { class: cls, title, onclick: onClick }, label);
}

/** 表格：列可点击排序（sortKey 为列下标，负数为降序） */
export function table(
  head: string[],
  rows: Child[][],
  opts: { sort?: number; onSort?: (col: number) => void; numeric?: number[] } = {},
): HTMLTableElement {
  const t = h('table', { class: 'tbl' });
  const tr = h('tr');
  head.forEach((name, i) => {
    const mark = opts.sort === undefined ? '' : Math.abs(opts.sort) - 1 === i ? (opts.sort > 0 ? ' ▲' : ' ▼') : '';
    tr.append(h('th', { onclick: opts.onSort ? () => opts.onSort!(i) : undefined, class: opts.onSort ? 'sortable' : '' }, name + mark));
  });
  t.append(h('thead', null, tr));
  const body = h('tbody');
  for (const r of rows) {
    const row = h('tr');
    r.forEach((c, i) => row.append(h('td', { class: opts.numeric?.includes(i) ? 'n' : '' }, c)));
    body.append(row);
  }
  t.append(body);
  return t;
}

/** 开关胶囊：比「复选框 + 文字」省地方，开着时整颗亮起。点击就地切换外观，再回调 */
export function chip(label: string, value: boolean, onChange: (v: boolean) => void, title = ''): HTMLButtonElement {
  const b = h('button', { class: value ? 'chip on' : 'chip', title, 'aria-pressed': String(value) }, label);
  b.addEventListener('click', () => {
    const v = !b.classList.contains('on');
    b.classList.toggle('on', v);
    b.setAttribute('aria-pressed', String(v));
    onChange(v);
  });
  return b;
}

/*
 * 视觉方向「后厨出餐台」：酱缸褐打底，三种食材色各管一件事——
 * 番茄红 = 主操作 / 当前位置，罗勒绿 = 开着的开关 / 好结果，芥末黄 = 标题与关键数字。
 * 数字统一用 Bahnschrift（Windows 自带的 DIN 系窄体）+ 等宽数字，像出餐屏上的单号。
 */
export const CSS = `
#dev-panel,.dev-modal-mask,#dev-toggle{
  --bg:#15100e;--sf:#1e1815;--sf2:#29211d;--sf3:#352b26;--ln:#3a302a;--ln2:#52443c;
  --tx:#ede3d5;--mut:#9d8f85;--dim:#6f635b;
  --tomato:#e5462d;--tomato-t:rgba(229,70,45,.16);--basil:#8bbf6a;--basil-t:rgba(139,191,106,.15);
  --mustard:#e8b53f;--warn:#f0a03c;--bad:#ff6f5c;
  --num:Bahnschrift,"DIN Alternate","Segoe UI",sans-serif;
  --ui:"Microsoft YaHei UI","Microsoft YaHei","PingFang SC",system-ui,sans-serif;
}
#dev-panel{position:fixed;top:0;right:0;bottom:0;width:var(--dev-w);background:var(--bg);color:var(--tx);font:12.5px/1.5 var(--ui);
  display:flex;flex-direction:column;border-left:1px solid var(--ln2);z-index:50;user-select:text;-webkit-user-select:text;touch-action:auto}
#dev-panel *{box-sizing:border-box}
#dev-panel.left{left:0;right:auto;border-left:none;border-right:1px solid var(--ln2)}

/* —— 顶栏 —— */
#dev-panel .hdr{display:flex;align-items:center;gap:2px;height:38px;padding:0 6px 0 12px;border-bottom:1px solid var(--ln);flex:none}
#dev-panel .hdr .brand{margin-right:auto;font-weight:700;font-size:13.5px;letter-spacing:.02em;white-space:nowrap}
#dev-panel .hdr .brand i{font-style:normal;color:var(--tomato)}
#dev-panel .hdr button{background:transparent;border-color:transparent;color:var(--mut);min-width:28px}
#dev-panel .hdr button:hover{background:var(--sf2);color:var(--tx)}
#dev-panel .hdr .exit{color:var(--tx);border-color:var(--ln2);margin-left:4px}
#dev-panel .toast{transition:opacity .3s;opacity:0;margin:0 8px;cursor:pointer;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  padding:1px 8px;border-radius:10px;background:var(--sf2);font-size:11.5px}

/* —— 主体：左侧页签栏 + 右侧内容 —— */
#dev-panel .main{flex:1;display:flex;min-height:0}
#dev-panel nav.rail{width:62px;flex:none;overflow-y:auto;padding:4px 0 10px;border-right:1px solid var(--ln);scrollbar-width:none}
#dev-panel nav.rail .grp{font-size:10.5px;color:var(--dim);text-align:center;padding:10px 0 3px}
#dev-panel nav.rail .grp:first-child{padding-top:4px}
#dev-panel nav.rail button{display:block;width:54px;margin:1px 4px;padding:6px 0;border:none;border-radius:6px;background:transparent;color:var(--mut);text-align:center}
#dev-panel nav.rail button:hover{background:var(--sf2);color:var(--tx)}
#dev-panel nav.rail button.on{background:var(--tomato-t);color:var(--tx);box-shadow:inset 3px 0 0 var(--tomato);font-weight:700}
#dev-panel .col{flex:1;min-width:0;display:flex;flex-direction:column;container-type:inline-size}
@container (min-width:660px){#dev-panel .meters{grid-template-columns:repeat(6,minmax(0,1fr))}}

/* —— 控制台：播放控制 + 开关 —— */
#dev-panel .ctl{flex:none;padding:7px 10px 6px;border-bottom:1px solid var(--ln);background:var(--sf)}
#dev-panel .ctl .line{display:flex;flex-wrap:wrap;align-items:center;gap:4px}
#dev-panel .ctl .line+.line{margin-top:5px}
#dev-panel .ctl .gap{width:8px}
#dev-panel .ctl .sp{flex:1}
#dev-panel .ctl .lbl{color:var(--dim);font-size:11px;margin:0 2px 0 6px}
#dev-panel .ctl .lbl:first-child{margin-left:0}
#dev-panel .ctl .play{min-width:62px;font-weight:700}
#dev-panel .ctl .speed{font-family:var(--num);padding:0 2px}

/* —— 折叠区（实时数据 / 角色与怪物） —— */
#dev-panel .sec{flex:none;border-bottom:1px solid var(--ln)}
#dev-panel .sech{display:flex;align-items:center;gap:6px;width:100%;padding:4px 10px;background:transparent;border:none;border-radius:0;color:var(--mut);font-size:11px;text-align:left}
#dev-panel .sech:hover{background:var(--sf);color:var(--tx)}
#dev-panel .sech .tw{display:inline-block;transition:transform .15s;color:var(--dim)}
#dev-panel .sec.folded .sech .tw{transform:rotate(-90deg)}
#dev-panel .sech .peek{margin-left:auto;color:var(--dim);font-family:var(--num);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#dev-panel .sec.folded .secb{display:none}
#dev-panel .secb{padding:2px 10px 8px}

/* 实时数据：这块是整个面板唯一「大声」的地方 */
#dev-panel .live .state{color:var(--mut);font-size:11.5px;margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#dev-panel .live .state b{color:var(--tx);font-weight:600}
#dev-panel .live .state .trial{color:var(--warn)}
#dev-panel .meters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--ln);border:1px solid var(--ln);border-radius:6px;overflow:hidden}
#dev-panel .meter{background:var(--bg);padding:5px 9px 6px;min-width:0}
#dev-panel .meter .k{font-size:10.5px;color:var(--mut);white-space:nowrap}
#dev-panel .meter .v{font:600 21px/1.1 var(--num);font-variant-numeric:tabular-nums;color:var(--tx);white-space:nowrap}
#dev-panel .meter .v small{font-size:11px;font-weight:400;color:var(--mut);margin-left:3px}
#dev-panel .meter.hero .v{color:var(--mustard);font-size:26px}
#dev-panel .meter.hurt .v{color:var(--bad)}
#dev-panel .live .more{margin-top:6px;font-size:11.5px;color:var(--mut);display:grid;grid-template-columns:auto 1fr;gap:1px 8px}
#dev-panel .live .more dt{color:var(--dim)}
#dev-panel .live .more dd{margin:0;color:var(--tx);font-variant-numeric:tabular-nums;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#dev-panel .live .idle{color:var(--mut);padding:6px 0}
#dev-panel .live .stale{margin-bottom:6px;padding:4px 8px;border-left:3px solid var(--mustard);background:rgba(232,181,63,.12);border-radius:0 5px 5px 0;font-size:11.5px}

/* 角色 / 怪物快捷栏 */
#dev-panel .quick .row{margin:3px 0}
#dev-panel .quick .row>b.nw{color:var(--mut);font-weight:400;font-size:11px;width:26px}
#dev-panel .quick .cur{min-width:120px;color:var(--mustard);font-size:13px}

/* —— 页签内容 —— */
#dev-panel .body{flex:1;overflow:auto;padding:12px 14px 24px;scrollbar-color:var(--ln2) transparent}
#dev-panel h3{margin:18px 0 6px;font-size:13px;font-weight:700;color:var(--mustard)}
#dev-panel h3:first-child{margin-top:0}
#dev-panel .row{display:flex;flex-wrap:wrap;gap:5px 10px;align-items:center;margin:4px 0}
#dev-panel .box{border:1px solid var(--ln);border-radius:6px;padding:8px 10px;margin:8px 0;background:var(--sf)}
#dev-panel .muted{color:var(--mut)}
#dev-panel .warn{color:var(--warn)}
#dev-panel .bad{color:var(--bad)}
#dev-panel .good{color:var(--basil)}
#dev-panel .nw{white-space:nowrap}
#dev-panel .small{font-size:11px}
#dev-panel .n{font-variant-numeric:tabular-nums}
#dev-panel a{color:var(--mustard);cursor:pointer}
#dev-panel details summary{cursor:pointer;color:var(--mustard)}

/* —— 控件 —— */
#dev-panel button{height:24px;background:var(--sf2);color:var(--tx);border:1px solid var(--ln2);border-radius:5px;padding:0 9px;cursor:pointer;font:inherit;white-space:nowrap}
#dev-panel button:hover{background:var(--sf3)}
#dev-panel button:disabled{opacity:.4;cursor:default}
#dev-panel button.pri{background:var(--tomato);border-color:var(--tomato);color:#fff;font-weight:700}
#dev-panel button.pri:hover{background:#f2553b}
#dev-panel button.hot{background:var(--mustard);border-color:var(--mustard);color:#211608;font-weight:700;animation:devpulse 1s infinite alternate}
@keyframes devpulse{to{background:#b78a26}}
#dev-panel button.chip{height:22px;padding:0 8px;border-radius:11px;background:transparent;color:var(--mut);border-color:var(--ln2);font-size:11.5px}
#dev-panel button.chip:hover{color:var(--tx);border-color:var(--mut)}
#dev-panel button.chip.on{background:var(--basil-t);border-color:var(--basil);color:var(--tx)}
#dev-panel button.chip.on::before{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--basil);margin-right:5px;vertical-align:1px}
#dev-panel .seg{display:inline-flex}
#dev-panel .seg button{border-radius:0;margin-left:-1px}
#dev-panel .seg button:first-child{border-radius:5px 0 0 5px;margin-left:0}
#dev-panel .seg button:last-child{border-radius:0 5px 5px 0}
#dev-panel .seg button.on{background:var(--tomato-t);color:var(--tx);border-color:var(--tomato);position:relative;z-index:1}
#dev-panel input,#dev-panel select,#dev-panel textarea{background:#0f0b09;color:var(--tx);border:1px solid var(--ln2);border-radius:5px;padding:0 6px;font:inherit;height:24px}
#dev-panel input[type=checkbox]{height:auto;accent-color:var(--basil)}
#dev-panel input[type=range]{accent-color:var(--tomato);padding:0}
#dev-panel textarea{width:100%;height:auto;min-height:90px;padding:4px 6px;font-family:Consolas,monospace;font-size:11px}
#dev-panel :is(button,input,select,textarea,a,summary):focus-visible,.dev-modal :is(button,input):focus-visible{outline:2px solid var(--mustard);outline-offset:1px}
#dev-panel .chk{display:inline-flex;align-items:center;gap:4px;cursor:pointer;white-space:nowrap}

/* —— 表格与数据 —— */
#dev-panel .tbl{border-collapse:collapse;width:100%;font-size:12px}
#dev-panel .tbl th,#dev-panel .tbl td{border-bottom:1px solid var(--ln);padding:4px 6px;text-align:left;vertical-align:top}
#dev-panel .tbl th{position:sticky;top:-12px;background:var(--sf);color:var(--mut);font-weight:600;font-size:11.5px;white-space:nowrap}
#dev-panel .tbl th.sortable{cursor:pointer}
#dev-panel .tbl th.sortable:hover{color:var(--tx)}
#dev-panel .tbl td.n{text-align:right;font-family:var(--num);font-variant-numeric:tabular-nums;white-space:nowrap}
#dev-panel .tbl tbody tr:hover td{background:var(--sf)}
#dev-panel .sel td{background:var(--tomato-t) !important}
#dev-panel .tag{display:inline-block;padding:0 6px;border-radius:9px;background:var(--sf2);margin:1px 2px 1px 0;font-size:11px;white-space:nowrap}
#dev-panel .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:3px 12px}
#dev-panel .grid label{display:flex;justify-content:space-between;align-items:center;gap:4px}
#dev-panel .thumb{vertical-align:middle;image-rendering:auto;border-radius:4px;background:#0f0b09}
#dev-panel .strip{display:flex;gap:3px;overflow-x:auto;padding:3px 0;scrollbar-width:thin}
#dev-panel .strip a{border:1px solid transparent;border-radius:5px;line-height:0}
#dev-panel .strip a:hover{border-color:var(--ln2)}
#dev-panel .strip a.on{border-color:var(--mustard)}
#dev-panel .oplog{font-family:Consolas,monospace;font-size:11px;max-height:340px;overflow:auto;background:#0f0b09;border:1px solid var(--ln);border-radius:5px;padding:6px}
#dev-panel .chart{display:block;background:#0f0b09;border:1px solid var(--ln);border-radius:5px;margin:4px 0}
#dev-panel .bar{display:flex;align-items:center;gap:6px;font-size:11.5px;margin:2px 0}
#dev-panel .bar .bl{width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#dev-panel .bar .bb{height:9px;border-radius:2px;min-width:1px}
#dev-panel .bar .bv{color:var(--mut);font-family:var(--num);font-variant-numeric:tabular-nums}
#dev-panel .heat td.n{color:#000;font-weight:600}
#dev-panel .cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:6px;margin-top:8px}
#dev-panel .cgrid a{text-align:center;border:1px solid var(--ln);border-radius:6px;padding:6px 4px;color:var(--tx)}
#dev-panel .cgrid a:hover{background:var(--sf2)}
#dev-panel .cgrid a.on{border-color:var(--mustard);background:var(--sf2)}

/* —— 拖宽、展开按钮 —— */
#dev-panel .grip{position:absolute;top:0;bottom:0;left:-4px;width:8px;cursor:ew-resize;z-index:2}
#dev-panel .grip:hover{background:linear-gradient(90deg,transparent 3px,var(--tomato) 3px,var(--tomato) 5px,transparent 5px)}
#dev-panel.left .grip{left:auto;right:-4px}
#dev-toggle{position:fixed;top:8px;right:calc(var(--dev-w) + 8px);z-index:51;height:26px;background:var(--bg);color:var(--tx);border:1px solid var(--ln2);border-radius:6px;padding:0 10px;cursor:pointer;font:12px var(--ui)}
#dev-toggle:hover{border-color:var(--tomato)}
#dev-toggle.left{right:auto;left:calc(var(--dev-w) + 8px)}

/* —— 紧凑模式 —— */
#dev-panel.compact{font-size:11.5px;line-height:1.3}
#dev-panel.compact button,#dev-panel.compact input,#dev-panel.compact select{height:21px}
#dev-panel.compact button{padding:0 6px}
#dev-panel.compact .row{margin:2px 0;gap:3px 6px}
#dev-panel.compact .body{padding:6px 8px 16px}
#dev-panel.compact nav.rail{width:50px}
#dev-panel.compact nav.rail button{width:44px;padding:4px 0}
#dev-panel.compact .meter .v{font-size:17px}
#dev-panel.compact .meter.hero .v{font-size:20px}
#dev-panel.compact h3{margin:10px 0 4px}

/* —— 浮层（命令面板、日志、快捷键） —— */
.dev-modal-mask{position:fixed;inset:0;background:rgba(10,7,6,.62);z-index:80;display:flex;align-items:flex-start;justify-content:center;padding-top:9vh}
.dev-modal{width:min(640px,92%);max-height:80vh;overflow:auto;background:var(--bg);color:var(--tx);border:1px solid var(--ln2);border-radius:8px;padding:14px;font:12.5px/1.5 var(--ui)}
.dev-modal input{width:100%;height:32px;font-size:14px}
.dev-cmds{margin-top:8px;max-height:60vh;overflow:auto}
.dev-cmds div{padding:5px 8px;border-radius:5px;cursor:pointer}
.dev-cmds div .muted{display:inline-block;min-width:76px;font-size:11px}
.dev-cmds div.on{background:var(--tomato-t);box-shadow:inset 3px 0 0 var(--tomato)}

@media (prefers-reduced-motion:reduce){#dev-panel *,#dev-panel *::before{animation:none !important;transition:none !important}}
`;

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

export const CSS = `
#dev-panel{position:fixed;top:0;right:0;bottom:0;width:var(--dev-w);background:#17090b;color:#f3e6e0;font:12px/1.45 system-ui,"Microsoft YaHei",sans-serif;
  display:flex;flex-direction:column;border-left:2px solid #4a2028;z-index:50;user-select:text;-webkit-user-select:text;touch-action:auto}
#dev-panel *{box-sizing:border-box}
#dev-panel .hdr{display:flex;align-items:center;gap:6px;padding:6px 8px;background:#2b0f12;border-bottom:1px solid #4a2028}
#dev-panel .hdr b{color:#ff6b5e;font-size:14px;margin-right:auto}
#dev-panel .ctl{padding:6px 8px;border-bottom:1px solid #4a2028;background:#1d0b0e;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:center}
#dev-panel .quick{padding:4px 8px;border-bottom:1px solid #4a2028;background:#22100f}
#dev-panel .quick .row{margin:2px 0}
#dev-panel .quick .cur{min-width:120px;color:#ffd166;font-size:13px}
#dev-panel .seg{display:inline-flex}
#dev-panel .seg button{border-radius:0;margin-left:-1px}
#dev-panel .seg button:first-child{border-radius:4px 0 0 4px}
#dev-panel .seg button:last-child{border-radius:0 4px 4px 0}
#dev-panel .seg button.on{background:#ff4b3e;color:#fff;border-color:#ff4b3e}
#dev-panel .live{padding:6px 8px;border-bottom:1px solid #4a2028;background:#140709;font-family:Consolas,monospace;font-size:11.5px;white-space:pre-wrap;max-height:210px;overflow:auto}
#dev-panel .tabs{display:flex;gap:2px;padding:4px 6px 0;background:#1d0b0e;border-bottom:1px solid #4a2028}
#dev-panel .tabs button{border-radius:6px 6px 0 0;border-bottom:none;padding:5px 10px}
#dev-panel .tabs button.on{background:#ff4b3e;color:#fff;border-color:#ff4b3e}
#dev-panel .body{flex:1;overflow:auto;padding:8px}
#dev-panel h3{margin:10px 0 4px;font-size:13px;color:#ffd166}
#dev-panel h3:first-child{margin-top:0}
#dev-panel .row{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;margin:3px 0}
#dev-panel .box{border:1px solid #4a2028;border-radius:6px;padding:6px;margin:6px 0;background:#1f0d10}
#dev-panel .muted{color:#a88f88}
#dev-panel .warn{color:#ffb347}
#dev-panel .bad{color:#ff6b6b}
#dev-panel .good{color:#52ff8a}
#dev-panel button{background:#3a1a1f;color:#f3e6e0;border:1px solid #6a2e36;border-radius:4px;padding:2px 7px;cursor:pointer;font:inherit}
#dev-panel button:hover{background:#55242c}
#dev-panel button:disabled{opacity:.4;cursor:default}
#dev-panel button.pri{background:#c0392b;border-color:#ff6b5e}
#dev-panel button.hot{background:#b07d2b;border-color:#ffd166;animation:devpulse 1s infinite alternate}
@keyframes devpulse{to{background:#7a5520}}
#dev-panel input,#dev-panel select,#dev-panel textarea{background:#0f0507;color:#f3e6e0;border:1px solid #6a2e36;border-radius:4px;padding:2px 4px;font:inherit}
#dev-panel textarea{width:100%;min-height:90px;font-family:Consolas,monospace;font-size:11px}
#dev-panel .chk{display:inline-flex;align-items:center;gap:3px;cursor:pointer;white-space:nowrap}
#dev-panel .tbl{border-collapse:collapse;width:100%;font-size:11.5px}
#dev-panel .tbl th,#dev-panel .tbl td{border-bottom:1px solid #3a1a1f;padding:2px 4px;text-align:left;vertical-align:top}
#dev-panel .tbl th{position:sticky;top:-8px;background:#2b0f12;color:#ffd166;white-space:nowrap}
#dev-panel .tbl th.sortable{cursor:pointer}
#dev-panel .tbl td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
#dev-panel .tbl tr:hover td{background:#2a1216}
#dev-panel .nw{white-space:nowrap}
#dev-panel .small{font-size:10.5px}
#dev-panel .tag{display:inline-block;padding:0 5px;border-radius:8px;background:#3a1a1f;margin:1px 2px 1px 0;font-size:11px;white-space:nowrap}
#dev-panel .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px 10px}
#dev-panel .grid label{display:flex;justify-content:space-between;align-items:center;gap:4px}
#dev-panel .sel td{background:#3d1a20 !important}
#dev-panel a{color:#ffd166;cursor:pointer}
#dev-toggle{position:fixed;top:6px;right:calc(var(--dev-w) + 6px);z-index:51;background:#2b0f12;color:#ffd166;border:1px solid #6a2e36;border-radius:4px;padding:2px 8px;cursor:pointer;font:12px system-ui}
#dev-toggle.left{right:auto;left:calc(var(--dev-w) + 6px)}
#dev-panel.left{left:0;right:auto;border-left:none;border-right:2px solid #4a2028}
#dev-panel .grip{position:absolute;top:0;bottom:0;left:-4px;width:8px;cursor:ew-resize;z-index:2}
#dev-panel.left .grip{left:auto;right:-4px}
#dev-panel.compact{font-size:11px;line-height:1.25}
#dev-panel.compact .row{margin:1px 0;gap:2px 6px}
#dev-panel.compact button{padding:1px 5px}
#dev-panel.compact .body{padding:4px}
#dev-panel.compact .live{max-height:120px}
#dev-panel .tabs{flex-wrap:wrap}
#dev-panel .toast{transition:opacity .3s;opacity:0;margin-left:6px;cursor:pointer;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#dev-panel .thumb{vertical-align:middle;image-rendering:auto;border-radius:4px;background:#0f0507}
#dev-panel .strip{display:flex;gap:2px;overflow-x:auto;padding:2px 0}
#dev-panel .strip a{border:1px solid transparent;border-radius:4px;line-height:0}
#dev-panel .strip a.on{border-color:#ffd166}
#dev-panel .oplog{font-family:Consolas,monospace;font-size:11px;max-height:340px;overflow:auto;background:#0f0507;border:1px solid #3a1a1f;padding:4px}
#dev-panel .chart{display:block;background:#0f0507;border:1px solid #3a1a1f;border-radius:4px;margin:3px 0}
#dev-panel .n{font-variant-numeric:tabular-nums}
#dev-panel details summary{cursor:pointer;color:#ffd166}
.dev-modal-mask{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:80;display:flex;align-items:flex-start;justify-content:center;padding-top:8vh}
.dev-modal{width:min(640px,92%);max-height:80vh;overflow:auto;background:#17090b;border:1px solid #6a2e36;border-radius:8px;padding:10px}
.dev-modal input{width:100%}
.dev-cmds{margin-top:6px;max-height:60vh;overflow:auto}
.dev-cmds div{padding:3px 6px;border-radius:4px;cursor:pointer}
.dev-cmds div.on{background:#55242c}
#dev-panel .cgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(86px,1fr));gap:6px;margin-top:6px}
#dev-panel .cgrid a{text-align:center;border:1px solid #3a1a1f;border-radius:6px;padding:4px;color:#f3e6e0}
#dev-panel .cgrid a.on{border-color:#ffd166}
`;

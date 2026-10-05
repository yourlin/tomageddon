// 命令面板（Ctrl+K）与快捷键列表：搜索页签 / 角色 / 怪物 / 武器 / 道具 / 操作，回车执行
import { h } from './dom';
import { prefs, savePrefs, KEY_LABEL, DEFAULT_KEYS, keyOf, keyText, type KeyAction } from './prefs';

export interface Cmd {
  group: string;
  name: string;
  /** 额外的搜索词（id 等） */
  keys?: string;
  run: () => void;
}

/** 在面板所在的文档里打开一个居中的浮层，返回关闭函数 */
function modal(doc: Document, content: HTMLElement, onClose?: () => void): () => void {
  const mask = h('div', { class: 'dev-modal-mask' }, h('div', { class: 'dev-modal' }, content));
  const close = () => {
    mask.remove();
    onClose?.();
  };
  mask.addEventListener('mousedown', (e) => e.target === mask && close());
  mask.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    }
  });
  (doc.getElementById('dev-panel') ?? doc.body).append(mask);
  return close;
}

export function openPalette(doc: Document, cmds: Cmd[]): void {
  let sel = 0;
  let shown: Cmd[] = [];
  const input = h('input', { placeholder: '搜索：页签 / 角色 / 怪物 / 武器 / 道具 / 操作（↑↓ 选择，回车执行，Esc 关闭）' });
  const list = h('div', { class: 'dev-cmds' });
  const draw = () => {
    const q = input.value.trim().toLowerCase();
    const words = q.split(/\s+/).filter(Boolean);
    shown = cmds.filter((c) => {
      const hay = `${c.group} ${c.name} ${c.keys ?? ''}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    });
    shown = shown.slice(0, 60);
    sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.replaceChildren(
      ...shown.map((c, i) =>
        h(
          'div',
          { class: i === sel ? 'on' : '', onmousedown: (e: Event) => (e.preventDefault(), exec(c)) },
          h('span', { class: 'muted' }, c.group),
          ' ',
          c.name,
        ),
      ),
    );
    (list.children[sel] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' });
  };
  const exec = (c: Cmd) => {
    close();
    c.run();
  };
  input.addEventListener('input', () => ((sel = 0), draw()));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') {
      sel = Math.min(shown.length - 1, sel + 1);
      draw();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      sel = Math.max(0, sel - 1);
      draw();
      e.preventDefault();
    } else if (e.key === 'Enter' && shown[sel]) exec(shown[sel]);
  });
  const close = modal(doc, h('div', null, input, list));
  draw();
  input.focus();
}

/** 快捷键列表，可点击某一项后按下新按键来改绑 */
export function openKeyHelp(doc: Document): void {
  const box = h('div');
  let waiting: KeyAction | null = null;
  const draw = () => {
    box.replaceChildren(
      h('h3', null, '快捷键（点击右侧按键可改绑，Esc 取消）'),
      h(
        'table',
        { class: 'tbl' },
        ...(Object.keys(KEY_LABEL) as KeyAction[]).map((a) =>
          h(
            'tr',
            null,
            h('td', null, KEY_LABEL[a]),
            h(
              'td',
              null,
              h(
                'button',
                { class: waiting === a ? 'hot' : '', onclick: () => ((waiting = a), draw()) },
                waiting === a ? '请按新按键…' : keyText(prefs.keys[a]),
              ),
            ),
          ),
        ),
      ),
      h(
        'div',
        { class: 'row' },
        h('button', { onclick: () => ((prefs.keys = { ...DEFAULT_KEYS }), savePrefs(), draw()) }, '恢复默认'),
        h('span', { class: 'muted' }, '焦点在文字 / 数字输入框里时快捷键不生效；WASD、方向键、空格、Esc、P 留给游戏'),
      ),
    );
  };
  const onKey = (e: KeyboardEvent) => {
    if (!waiting || ['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.key !== 'Escape') {
      prefs.keys[waiting] = keyOf(e);
      savePrefs();
    }
    waiting = null;
    draw();
  };
  doc.addEventListener('keydown', onKey, true);
  draw();
  modal(doc, box, () => doc.removeEventListener('keydown', onKey, true));
}

/** 普通浮层（操作日志等复用） */
export function openModal(doc: Document, content: HTMLElement): () => void {
  return modal(doc, content);
}

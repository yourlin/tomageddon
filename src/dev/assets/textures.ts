// K2 贴图浏览器：列出纹理管理器里的全部贴图（程序化生成 + 外部美术），前缀筛选 / 搜索，显示尺寸与预览
import type Phaser from 'phaser';
import { h, btn, select } from '../dom';
import type { DevCtx } from '../ctx';

let prefix = '';
let search = '';
let selKey = '';
const LIMIT = 400;

/** 前缀：第一个下划线之前的部分（无下划线则整个键） */
const prefixOf = (k: string): string => {
  const i = k.indexOf('_', k.startsWith('__') ? 2 : 0);
  return i > 0 ? k.slice(0, i) : k;
};

interface TexInfo {
  key: string;
  w: number;
  h: number;
  frames: number;
  kind: string;
}

function info(tm: Phaser.Textures.TextureManager, key: string): TexInfo {
  const t = tm.get(key);
  const src = t.source[0];
  const kind = !src ? '?' : src.isRenderTexture ? 'RenderTexture' : src.isCanvas ? 'Canvas' : src.isGLTexture ? 'GL' : 'Image';
  return { key, w: src?.width ?? 0, h: src?.height ?? 0, frames: Math.max(0, t.frameTotal - 1), kind };
}

export function renderTextures(ctx: DevCtx): HTMLElement {
  const tm = ctx.sb.game.textures;
  const all = tm
    .getTextureKeys()
    .slice()
    .sort((a, b) => a.localeCompare(b));
  const counts = new Map<string, number>();
  for (const k of all) counts.set(prefixOf(k), (counts.get(prefixOf(k)) ?? 0) + 1);
  const prefixes = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (prefix && !counts.has(prefix)) prefix = '';

  const root = h('div');
  const list = h('div', { style: 'max-height:360px;overflow:auto' });
  const preview = h('div', { class: 'box' });
  const summary = h('span', { class: 'muted' });

  const showPreview = () => {
    if (!selKey || !tm.exists(selKey)) {
      preview.replaceChildren(h('span', { class: 'muted' }, '点击列表中的贴图查看预览'));
      return;
    }
    const i = info(tm, selKey);
    let url: string;
    try {
      url = tm.getBase64(selKey);
    } catch {
      url = '';
    }
    const head = h('div', null, h('b', null, selKey), ` · ${i.w}×${i.h} · ${i.kind}${i.frames > 1 ? ` · ${i.frames} 帧` : ''}`);
    const body =
      url && url.startsWith('data:image') && url.length > 30
        ? h(
            'div',
            {
              style:
                'margin-top:4px;padding:6px;display:inline-block;background:repeating-conic-gradient(#2a1216 0 25%,#3a1a1f 0 50%) 0 0/16px 16px;border-radius:4px',
            },
            h('img', {
              src: url,
              alt: selKey,
              style: `display:block;max-width:500px;max-height:320px;image-rendering:${i.w <= 64 ? 'pixelated' : 'auto'};${i.w < 96 ? `width:${Math.min(500, i.w * 3)}px` : ''}`,
            }),
          )
        : h('div', { class: 'warn' }, '无法预览（WebGL / RenderTexture 贴图无法导出像素）');
    preview.replaceChildren(head, body);
  };

  const showList = () => {
    const q = search.trim().toLowerCase();
    const keys = all.filter((k) => (!prefix || prefixOf(k) === prefix) && (!q || k.toLowerCase().includes(q)));
    summary.textContent = `共 ${all.length} 张，筛选后 ${keys.length} 张${keys.length > LIMIT ? `（只显示前 ${LIMIT} 张）` : ''}`;
    const t = h('table', { class: 'tbl' });
    t.append(h('thead', null, h('tr', null, h('th', null, '键'), h('th', null, '尺寸'), h('th', null, '帧'), h('th', null, '类型'))));
    const tb = h('tbody');
    for (const k of keys.slice(0, LIMIT)) {
      const i = info(tm, k);
      const tr = h(
        'tr',
        {
          class: k === selKey ? 'sel' : '',
          style: 'cursor:pointer',
          onclick: () => {
            selKey = k;
            showList();
            showPreview();
          },
        },
        h('td', null, k),
        h('td', { class: 'n' }, `${i.w}×${i.h}`),
        h('td', { class: 'n' }, i.frames > 1 ? String(i.frames) : ''),
        h('td', { class: 'muted' }, i.kind),
      );
      tb.append(tr);
    }
    t.append(tb);
    list.replaceChildren(t);
  };

  const input = h('input', {
    type: 'text',
    placeholder: '搜索贴图键',
    value: search,
    style: 'width:160px',
    oninput: () => {
      search = input.value;
      showList();
    },
  });
  root.append(
    h(
      'div',
      { class: 'row' },
      select([['', `全部前缀（${all.length}）`], ...prefixes.map(([p, n]): [string, string] => [p, `${p}（${n}）`])], prefix, (v) => {
        prefix = v;
        showList();
      }),
      input,
      btn('刷新', () => root.replaceWith(renderTextures(ctx))),
      summary,
    ),
    preview,
    list,
    h(
      'div',
      { class: 'muted small' },
      '贴图大多在首次使用时生成（如道具图标、Rig 部件），进入对应界面或生成对应怪物后点「刷新」可看到更多。',
    ),
  );
  showList();
  showPreview();
  return root;
}

// 内容与美术页（K 模块）：Rig 动画预览 · 贴图浏览器 · 特效预览 · 音效 / 音乐试听 · 多语言检查 · UI 场景直达
import { h } from '../dom';
import type { DevCtx } from '../ctx';
import { renderRig } from '../assets/rig';
import { renderTextures } from '../assets/textures';
import { renderFx } from '../assets/fx';
import { renderAudio } from '../assets/audio';
import { renderI18n } from '../assets/i18n';
import { renderScenes } from '../assets/scenes';

type Sub = 'rig' | 'tex' | 'fx' | 'audio' | 'i18n' | 'scene';
const SUBS: [Sub, string, string, (ctx: DevCtx) => HTMLElement][] = [
  ['rig', 'K1 Rig 预览', 'K1 Rig 动画预览', renderRig],
  ['tex', 'K2 贴图', 'K2 贴图浏览器', renderTextures],
  ['fx', 'K3 特效', 'K3 特效预览', renderFx],
  ['audio', 'K4 音频', 'K4 音效 / 音乐试听', renderAudio],
  ['i18n', 'K5 多语言', 'K5 多语言检查', renderI18n],
  ['scene', 'K6 场景直达', 'K6 UI 场景直达', renderScenes],
];

let sub: Sub = 'rig';

export function renderAssets(ctx: DevCtx): HTMLElement {
  const root = h('div');
  const nav = h('div', { class: 'seg', style: 'margin-bottom:6px;flex-wrap:wrap' });
  const body = h('div');
  const draw = () => {
    nav.replaceChildren(
      ...SUBS.map(([id, label]) =>
        h(
          'button',
          {
            class: sub === id ? 'on' : '',
            onclick: () => {
              sub = id;
              draw();
            },
          },
          label,
        ),
      ),
    );
    const s = SUBS.find((x) => x[0] === sub) ?? SUBS[0];
    let el: HTMLElement;
    try {
      el = s[3](ctx);
    } catch (e) {
      el = h('div', { class: 'bad' }, `渲染失败：${e instanceof Error ? e.message : String(e)}`);
    }
    body.replaceChildren(h('h3', null, s[2]), h('div', { class: 'box' }, el));
  };
  draw();
  root.append(nav, body);
  return root;
}

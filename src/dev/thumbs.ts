// 面板用缩略图：把角色 / 怪物 / Boss 的头像贴图渲染成 DOM <img>。
// 头像贴图在 GPU 上（RenderTexture），只能用 snapshot 异步读回；结果按 kind:id 缓存。
import type Phaser from 'phaser';
import { h } from './dom';
import { portraitKey, type PortraitKind } from '../ui/Portrait';

const cache = new Map<string, string>();
const waiting = new Map<string, HTMLImageElement[]>();
const queue: [PortraitKind, string][] = [];
let busy = false;
let gameRef: Phaser.Game | null = null;

export function initThumbs(game: Phaser.Game): void {
  gameRef = game;
}

export function thumb(kind: PortraitKind, id: string, size = 28): HTMLImageElement {
  const img = h('img', { class: 'thumb', width: size, height: size, alt: '' });
  const k = `${kind}:${id}`;
  const url = cache.get(k);
  if (url) {
    img.src = url;
    return img;
  }
  const list = waiting.get(k);
  if (list) list.push(img);
  else {
    waiting.set(k, [img]);
    queue.push([kind, id]);
    pump();
  }
  return img;
}

function scene(): Phaser.Scene | null {
  const g = gameRef;
  if (!g) return null;
  return g.scene.getScenes(true)[0] ?? g.scene.getScene('Boot') ?? null;
}

function pump(): void {
  if (busy || !queue.length) return;
  const s = scene();
  if (!s) return void setTimeout(pump, 300);
  busy = true;
  const [kind, id] = queue.shift()!;
  const k = `${kind}:${id}`;
  const done = (url: string) => {
    cache.set(k, url);
    for (const img of waiting.get(k) ?? []) img.src = url;
    waiting.delete(k);
    busy = false;
    requestAnimationFrame(pump);
  };
  try {
    const key = portraitKey(s, kind, id);
    const tex = s.textures.getFrame(key);
    const sc = Math.min(128 / tex.width, 128 / tex.height);
    const rt = s.make.renderTexture({ width: 128, height: 128 }, false);
    rt.stamp(key, undefined, 64, 64, { scale: sc, originX: 0.5, originY: 0.5 });
    rt.snapshot((snap) => {
      rt.destroy();
      done(snap instanceof HTMLImageElement ? snap.src : '');
    });
  } catch {
    done('');
  }
}

// ---------------- 静态贴图（武器 / 道具图标） ----------------
// 这些贴图是普通纹理，getBase64 同步读回即可；结果按 key 缓存。
const texCache = new Map<string, string>();

/** 把 Phaser 贴图转成 DOM <img>（失败时返回同尺寸空占位） */
export function texImg(game: Phaser.Game, key: string, size = 40): HTMLElement {
  let url = texCache.get(key);
  if (url === undefined) {
    try {
      url = game.textures.exists(key) ? game.textures.getBase64(key) : '';
    } catch {
      url = '';
    }
    texCache.set(key, url);
  }
  return url
    ? h('img', { src: url, width: size, height: size, alt: '', style: 'object-fit:contain;flex:none' })
    : h('span', { style: `display:inline-block;width:${size}px;height:${size}px;flex:none` });
}

/** 武器图标贴图：外部美术 icon_weapon_xxx 优先，否则用程序生成的 weapon_xxx（与游戏内各场景一致） */
export const weaponIconKey = (game: Phaser.Game, id: string): string =>
  game.textures.exists(`icon_weapon_${id}`) ? `icon_weapon_${id}` : `weapon_${id}`;

export const weaponIcon = (game: Phaser.Game, id: string, size = 40): HTMLElement => texImg(game, weaponIconKey(game, id), size);

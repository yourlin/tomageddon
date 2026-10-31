// 首屏下载量：启动阶段只排主菜单真正用到的插画，选关缩略图留给用到它的场景
import { describe, expect, it } from 'vitest';
import type Phaser from 'phaser';
import { queueBootArt, queueThumbArt } from '../src/systems/ArtRegistry';
import { RUNTIME_ART_URLS } from '../src/systems/RuntimeArt';
import { MAP_ART } from '../src/data/artManifest';

/** 记录排进加载队列的纹理 key；纹理都还不存在 */
function recordingScene(): { scene: Phaser.Scene; keys: string[] } {
  const keys: string[] = [];
  const add = (key: string) => void keys.push(key);
  const scene = {
    textures: { exists: () => false },
    load: { image: add, spritesheet: add, atlas: add, on: () => {}, once: () => {}, list: { size: 0 } },
    events: { once: () => {}, on: () => {} },
    game: { events: { once: () => {} } },
  } as unknown as Phaser.Scene;
  return { scene, keys };
}

describe('启动阶段的插画', () => {
  it('不下载选关缩略图；有封面时也不下载主菜单番茄妹的动画图集', () => {
    const { scene, keys } = recordingScene();
    queueBootArt(scene);
    expect(keys.some((k) => k.endsWith(':thumb'))).toBe(false);
    if (RUNTIME_ART_URLS['cover/cover_kitchen.png']) expect(keys.some((k) => k.includes('char/tomato') && k.endsWith(':body'))).toBe(false);
  });

  it('选关缩略图由用到它的场景按章节排队', () => {
    const withThumb = MAP_ART.filter((m) => m.thumb);
    if (!withThumb.length) return;
    const { scene, keys } = recordingScene();
    queueThumbArt(scene, [withThumb[0].ch]);
    expect(keys.filter((k) => k.endsWith(':thumb'))).toHaveLength(1);
    queueThumbArt(scene);
    expect(keys.filter((k) => k.endsWith(':thumb'))).toHaveLength(withThumb.length);
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import type Phaser from 'phaser';
import { setForceProcedural, currentArtStyle } from '../src/systems/ArtStyle';
import { queueArt, readyArt, readyMap, readyMapObject, readyPortrait, queueBootArt } from '../src/systems/ArtRegistry';
import { MAP_ART } from '../src/data/artManifest';

// 所有纹理都“已存在”的假场景：复古风下仍然不能返回任何插画
const scene = {
  textures: {
    exists: () => true,
    get: () => ({ getFrameNames: () => [], has: () => true, get: () => ({ realWidth: 100, realHeight: 100 }) }),
  },
  load: { image: () => {}, spritesheet: () => {}, atlas: () => {}, on: () => {}, once: () => {}, list: { size: 0 } },
  events: { once: () => {}, on: () => {} },
  game: { events: { once: () => {} } },
} as unknown as Phaser.Scene;
const tomato = { kind: 'char', id: 'tomato' } as const;

afterEach(() => setForceProcedural(false));

describe('画风：复古风不使用插画贴图', () => {
  it('复古风：角色 / 头像 / 地图 / 地图物体都回退到程序绘制，也不会排队加载插画', () => {
    setForceProcedural(true);
    expect(currentArtStyle()).toBe('retro');
    expect(readyArt(scene, tomato)).toBeNull();
    expect(readyPortrait(scene, tomato)).toBeNull();
    for (const m of MAP_ART) {
      expect(readyMap(scene, m.ch, 'ground')).toBeNull();
      expect(readyMap(scene, m.ch, 'thumb')).toBeNull();
      for (const name of Object.keys(m.objects ?? {})) expect(readyMapObject(scene, m.ch, name)).toBeNull();
    }
    expect(
      queueArt(scene, { bodies: [tomato], portraits: [tomato], maps: MAP_ART.map((m) => ({ ch: m.ch, parts: ['ground', 'thumb'] })) }),
    ).toBe(false);
    expect(() => queueBootArt(scene)).not.toThrow();
  });

  it('画风选择界面的缩略图可以绕过复古风（raw）', () => {
    setForceProcedural(true);
    expect(readyArt(scene, tomato)).toBeNull();
    expect(readyArt(scene, tomato, true)).not.toBeNull();
  });

  it('可爱风：已加载的地图插画可用', () => {
    setForceProcedural(false);
    expect(currentArtStyle()).toBe('cute');
    const m = MAP_ART.find((x) => x.ground);
    if (m) expect(readyMap(scene, m.ch, 'ground')).not.toBeNull();
  });
});

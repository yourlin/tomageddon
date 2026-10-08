import { afterEach, describe, expect, it } from 'vitest';
import { initRes } from '../src/systems/HiDpi';

const g = globalThis as unknown as { window?: unknown };
const setScreen = (w: number, h: number, dpr: number) => (g.window = { innerWidth: w, innerHeight: h, devicePixelRatio: dpr });

describe('高清渲染倍率', () => {
  afterEach(() => {
    delete g.window;
    initRes(false);
  });

  it('关闭时为 1（与原来的渲染一致）', () => {
    setScreen(1512, 731, 2);
    expect(initRes(false)).toBe(1);
  });

  it('按屏幕短边的物理像素 ÷ 720，向下取 0.25 的倍数，不超采样', () => {
    setScreen(1512, 731, 2); // MacBook 浏览器：1462 / 720 = 2.03
    expect(initRes(true)).toBe(2);
    setScreen(1512, 842, 2); // MacBook 全屏（刘海屏）：1684 / 720 = 2.34
    expect(initRes(true)).toBe(2.25);
    setScreen(1920, 1080, 1); // 1080p 显示器
    expect(initRes(true)).toBe(1.5);
  });

  it('竖屏手机按短边算（会被强制横屏）；低分屏不放大；4K 封顶 2.5', () => {
    setScreen(390, 844, 3); // 1170 / 720 = 1.63
    expect(initRes(true)).toBe(1.5);
    setScreen(1280, 720, 1);
    expect(initRes(true)).toBe(1);
    setScreen(3840, 2160, 2);
    expect(initRes(true)).toBe(2.5);
  });
});

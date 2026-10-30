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

  it('按物理像素选择清晰度，同时限制EXPAND长边不超过QHD', () => {
    setScreen(1512, 731, 2); // MacBook 浏览器：1462 / 720 = 2.03
    expect((initRes(true) * 720 * 1512) / 731).toBeCloseTo(2560);
    setScreen(1512, 842, 2); // MacBook 全屏（刘海屏）：1684 / 720 = 2.34
    expect((initRes(true) * 720 * 1512) / 842).toBeCloseTo(2560);
    setScreen(1920, 1080, 1); // 1080p 显示器
    expect(initRes(true)).toBe(1.5);
  });

  it('竖屏手机按短边算；低分屏不放大；4K封顶QHD', () => {
    setScreen(390, 844, 3); // 1170 / 720 = 1.63
    expect(initRes(true)).toBe(1.5);
    setScreen(1280, 720, 1);
    expect(initRes(true)).toBe(1);
    setScreen(3840, 2160, 2);
    expect(initRes(true)).toBe(2);
  });

  it('超宽屏、平板与低画质都服从两边像素预算', () => {
    for (const [w, h, dpr] of [
      [3440, 1440, 1],
      [5120, 1440, 2],
      [768, 1024, 2],
      [430, 932, 3],
    ]) {
      setScreen(w, h, dpr);
      const res = initRes(true);
      const aspect = Math.max(w, h) / Math.min(w, h);
      expect(Math.max(1280, 720 * aspect) * res).toBeLessThanOrEqual(2560.0001);
      expect(Math.max(720, 1280 / aspect) * res).toBeLessThanOrEqual(1440.0001);
    }
    setScreen(3840, 2160, 2);
    expect(initRes(true, 720, 1)).toBe(1);
  });
});

import { describe, expect, it } from 'vitest';
import { resolveGraphicsTier } from '../src/systems/GraphicsQuality';

describe('画质自动选择与手动覆盖', () => {
  it('自动档（含旧存档）默认高画质，手机也一样；只有内存受限的环境降到标准，不再自动降到低', () => {
    expect(resolveGraphicsTier(undefined, false)).toBe('high');
    expect(resolveGraphicsTier('auto', false)).toBe('high');
    expect(resolveGraphicsTier('auto', true)).toBe('standard');
    expect(resolveGraphicsTier(undefined, true)).toBe('standard');
  });
  it('手动降低画质始终有效，明确选择也不被自动档覆盖', () => {
    expect(resolveGraphicsTier('low', false)).toBe('low');
    expect(resolveGraphicsTier('standard', false)).toBe('standard');
    expect(resolveGraphicsTier('high', true)).toBe('high');
  });
});

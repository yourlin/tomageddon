import { describe, expect, it } from 'vitest';
import { resolveGraphicsTier } from '../src/systems/GraphicsQuality';

describe('画质自动选择与手动覆盖', () => {
  it('旧存档按设备选择，不要求用户重新配置', () => {
    expect(resolveGraphicsTier(undefined, true, true)).toBe('low');
    expect(resolveGraphicsTier('auto', false, true)).toBe('standard');
    expect(resolveGraphicsTier('auto', false, false)).toBe('high');
  });
  it('手动降低画质始终有效，明确选择也不被自动档覆盖', () => {
    expect(resolveGraphicsTier('low', false, false)).toBe('low');
    expect(resolveGraphicsTier('standard', false, false)).toBe('standard');
    expect(resolveGraphicsTier('high', true, true)).toBe('high');
  });
});

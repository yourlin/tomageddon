import { describe, expect, it, vi } from 'vitest';
import { rumble } from '../src/systems/Controls';

const pad = (playEffect: () => Promise<unknown>) => ({ connected: true, vibrationActuator: { playEffect } });

describe('手柄震动', () => {
  it('随屏幕震动触发，强度按 intensity 换算；更弱的震动不打断更强的', () => {
    const play = vi.fn(() => Promise.resolve());
    vi.stubGlobal('navigator', { getGamepads: () => [pad(play)] });
    rumble(0.02, 600);
    expect(play).toHaveBeenCalledTimes(1);
    expect((play.mock.calls[0] as unknown[])[1]).toMatchObject({ duration: 600, strongMagnitude: 0.8 });
    rumble(0.006, 160);
    expect(play).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('没有手柄 / 不支持震动时不报错', () => {
    vi.stubGlobal('navigator', { getGamepads: () => [null, { connected: true }] });
    expect(() => rumble(0.01, 100)).not.toThrow();
    vi.unstubAllGlobals();
  });
});

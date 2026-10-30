import { describe, it, expect, vi } from 'vitest';
import { BlinkState } from '../src/objects/BlinkState';

describe('illustrated character blinking', () => {
  it('closes briefly in idle and movement, then waits before blinking again', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const b = new BlinkState();
      b.tick(1.99, 'idle');
      expect(b.closed).toBe(false);
      b.tick(0.02, 'move');
      expect(b.closed).toBe(true);
      b.tick(0.1, 'move');
      expect(b.closed).toBe(true);
      b.tick(0.03, 'idle');
      expect(b.closed).toBe(false);
      b.tick(1, 'idle');
      expect(b.closed).toBe(false);
    } finally {
      random.mockRestore();
    }
  });
  it('holds the eyelids while frozen or paused and resets on reuse', () => {
    const b = new BlinkState();
    b.tick(6, 'idle');
    expect(b.closed).toBe(true);
    b.tick(30, 'frozen');
    b.tick(0, 'idle');
    expect(b.closed).toBe(true);
    b.reset();
    expect(b.closed).toBe(false);
    b.tick(6, 'move');
    b.tick(0.01, 'hurt');
    expect(b.closed).toBe(false);
  });
});

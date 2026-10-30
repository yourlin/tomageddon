import { describe, expect, it } from 'vitest';
import { motionFacing } from '../src/objects/MotionFacing';

describe('movement animation facing', () => {
  it('faces retreat and locked charge velocity instead of the current target', () => {
    expect(motionFacing(-100, 10, 1)).toBe(-1);
    expect(motionFacing(100, 10, -1)).toBe(1);
  });
  it('retains the last side on vertical travel without target-induced flips', () => {
    expect(motionFacing(0, 100, -1)).toBe(0);
    expect(motionFacing(0.1, -100, 1)).toBe(0);
  });
  it('uses target facing only while stationary', () => {
    expect(motionFacing(0, 0, -1)).toBe(-1);
    expect(motionFacing(0, 0)).toBe(0);
  });
});

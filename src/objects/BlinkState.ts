import type { RigState } from './visualTypes';

/** 使用游戏时间，暂停 / 冻结不推进；每个实例独立随机间隔。 */
export class BlinkState {
  closed = false;
  private remaining = 2 + Math.random() * 3.5;

  reset(): void {
    this.closed = false;
    this.remaining = 2 + Math.random() * 3.5;
  }

  tick(dt: number, state: RigState): void {
    if (state === 'frozen' || dt <= 0) return;
    if (state !== 'idle' && state !== 'move') {
      if (this.closed) this.reset();
      return;
    }
    this.remaining -= dt;
    if (this.remaining > 0) return;
    if (this.closed) this.reset();
    else {
      this.closed = true;
      this.remaining = 0.12;
    }
  }
}

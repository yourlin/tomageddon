// 外部美术外观的动作状态机（纯逻辑，可单测）：语义与 Rig 一致。
// - idle / move 随移动强度自动切换；同一循环状态重复 play 不重启，force 重播
// - attack / hurt / spawn / cast / die 按 TIMED 时长结束后回到 idle / move
// - die 期间只接受 force；frozen 期间只接受 die 或 force，且冻结时时间不推进（保持当前姿态）
// - 死亡回调由游戏时间驱动、只执行一次，与动画是否加载、是否有完成事件无关
import { TIMED, type RigState } from './visualTypes';

export class VisualState {
  state: RigState = 'idle';
  /** 当前状态已持续的游戏时间（秒，用于取帧） */
  elapsed = 0;
  /** 一次性状态剩余时间 */
  left = 0;
  /** 受击闪白剩余时间 */
  flash = 0;
  private base: 'idle' | 'move' = 'idle';
  onDieDone: (() => void) | null = null;

  /** 返回状态是否真正（重新）开始 */
  play(state: RigState, force = false): boolean {
    if (this.state === 'die' && !force) return false;
    if (this.state === 'frozen' && state !== 'die' && !force) return false;
    if (!force && state === this.state && TIMED[state] === undefined) return false;
    this.enter(state);
    if (state === 'hurt') this.flash = 0.08;
    return true;
  }

  private enter(state: RigState): void {
    this.state = state;
    this.left = TIMED[state] ?? 0;
    this.elapsed = 0;
  }

  die(cb: () => void): void {
    this.onDieDone = cb;
    this.play('die', true);
  }

  /** 一次性状态的进度 0~1（其它状态为 0） */
  get progress(): number {
    const T = TIMED[this.state];
    return T ? 1 - Math.max(0, this.left) / T : 0;
  }

  /**
   * 推进 dt 秒；返回 'died' 表示死亡已结束（回调已执行），'changed' 表示状态切换。
   * 冻结时什么都不推进。
   */
  tick(dt: number, mv: number): 'died' | 'changed' | null {
    if (this.state === 'frozen') return null;
    if (this.flash > 0) this.flash -= dt;
    this.elapsed += dt;
    let changed = false;
    if (this.left > 0) {
      this.left -= dt;
      if (this.left <= 0) {
        if (this.state === 'die') {
          const cb = this.onDieDone;
          this.onDieDone = null;
          this.state = 'idle';
          this.elapsed = 0;
          cb?.();
          return 'died';
        }
        this.enter(this.base);
        changed = true;
      }
    }
    this.base = mv > 0.15 ? 'move' : 'idle';
    if ((this.state === 'idle' || this.state === 'move') && this.state !== this.base) {
      this.enter(this.base);
      changed = true;
    }
    return changed ? 'changed' : null;
  }

  reset(): void {
    this.state = 'idle';
    this.base = 'idle';
    this.elapsed = this.left = this.flash = 0;
    this.onDieDone = null;
  }
}

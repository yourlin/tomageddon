// 实体外观的统一外壳：程序化 Rig 与外部美术（静态图 / 精灵表 / 图集）都继承它。
// 外层统一是 Phaser Container：位置、深度、缩放、透明度、可见性与销毁语义一致，业务代码只依赖这里的接口。
// 碰撞半径、伤害、预警、子弹与掉落都由玩法系统决定，外观的透明边距、可见大小与播放速度不影响这些数值。
import Phaser from 'phaser';
import type { RigState, VisualIdent, VisualForm } from './visualTypes';

export { RIG_STATES, TIMED, identKey, type RigState, type VisualIdent, type VisualKind } from './visualTypes';

export abstract class EntityVisual extends Phaser.GameObjects.Container {
  abstract readonly mode: 'procedural' | 'static' | 'spritesheet' | 'atlas';
  state: RigState = 'idle';
  radius = 1;
  /** 外观身份（工厂创建时写入；直接 new Rig 的调试 / 漫画用途可能为空） */
  ident: VisualIdent | null = null;
  onDieDone: (() => void) | null = null;

  /** 切换状态；同一循环状态重复调用不重启，force 强制重播 */
  abstract play(state: RigState, force?: boolean): void;
  /** 每帧推进（dt 为游戏时间，暂停时不调用） */
  abstract tick(dt: number, mv: number, face: number, lookX?: number, lookY?: number): void;
  /** 按玩法半径设置显示大小 */
  abstract setRadius(r: number): void;
  /** 状态色调（灼烧 / 中毒 / 冰冻等），-1 清除 */
  abstract setStatusTint(color: number): void;
  /** 回池前 / 出池后恢复干净状态：停动画、清回调、清染色、翻转与透明度 */
  abstract resetVisual(): void;
  /** 播放死亡并在结束时回调（只回调一次；与动画是否加载、是否有完成事件无关） */
  abstract die(cb: () => void): void;

  /** Whether this appearance has genuinely authored frames for an action. */
  hasAuthoredAnimation(_state: RigState): boolean {
    return false;
  }

  /** Ordinary attacks never interrupt skills, flinches, death, or an already playing attack.
   * Enemy attacks may also use procedural/static feedback; player weapons default to authored frames only.
   */
  tryAttackAnimation(allowFallback = false): void {
    if ((this.state === 'idle' || this.state === 'move') && (allowFallback || this.hasAuthoredAnimation('attack'))) this.play('attack');
  }

  /** 外部插画可切换形态；Rig 保留原有染色与特效。 */
  setBossForm(_form: VisualForm, _blendSeconds = 0.45): boolean {
    return false;
  }
}

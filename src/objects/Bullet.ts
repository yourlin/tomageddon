// 子弹（玩家与敌人共用，对象池复用）
import Phaser from 'phaser';
import type { Enemy } from './Enemy';
import type { WeaponEffect } from '../data/weapons';
import type { StatusApply } from '../data/statuses';

export class Bullet extends Phaser.GameObjects.Image {
  alive = false;
  vx = 0;
  vy = 0;
  radius = 8;
  dmg = 1;
  crit = false;
  life = 1; // 剩余存活秒数
  pierce = 0;
  bounce = 0;
  knockback = 0;
  effect: WeaponEffect | undefined;
  lifeSteal = 0;
  hitSet = new Set<Enemy>();
  kind: 'normal' | 'rocket' | 'flame' | 'boomerang' = 'normal';
  // 回旋镖
  returning = false;
  outT = 0;
  // 敌方子弹
  slow = 0;
  spin = 0;
  /** 伤害来源（武器 id 等），用于局后统计 */
  src = '';
  debuffs: StatusApply[] | undefined;
  owner: Enemy | null = null;
  status: StatusApply[] | undefined; // 玩家子弹附带的状态
  critBonus = 0; // 武器词条暴击伤害 %（命中时与道具暴击伤害合并结算）

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'proj_player');
    this.setActive(false).setVisible(false);
  }

  fire(key: string, x: number, y: number, angle: number, speed: number, life: number, radius: number): this {
    this.setTexture(key).setPosition(x, y).setActive(true).setVisible(true).setAlpha(1).setScale(1).clearTint();
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.setRotation(angle);
    this.life = life;
    this.radius = radius;
    this.alive = true;
    this.pierce = 0;
    this.bounce = 0;
    this.knockback = 0;
    this.effect = undefined;
    this.lifeSteal = 0;
    this.hitSet.clear();
    this.kind = 'normal';
    this.returning = false;
    this.slow = 0;
    this.spin = 0;
    this.src = '';
    this.debuffs = undefined;
    this.owner = null;
    this.status = undefined;
    this.crit = false;
    this.critBonus = 0;
    return this;
  }

  kill(): void {
    this.alive = false;
    this.setActive(false).setVisible(false);
  }
}

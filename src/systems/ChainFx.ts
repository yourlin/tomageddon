// 连锁闪电类超武的专属追击：链式闪电劈完后，再从天上补一道闪电
//   雷神打蛋器：金色「雷神之锤」——一道粗雷砸在链上血最多的敌人身上，必定暴击，并波及周围
//   风暴西兰花：绿色雷暴——三道小闪电随机落在被劈过的敌人身上，每道眩晕 0.6 秒
import Phaser from 'phaser';
import type { GameScene, HitInfo } from '../scenes/GameScene';
import type { Enemy } from '../objects/Enemy';

export type ChainStyle = 'thor' | 'storm';

export const CHAIN_STYLE: Record<string, ChainStyle> = {
  thor_whisk: 'thor',
  storm_broccoli: 'storm',
};

/** 链式闪电本身的颜色（超武换色，普通连锁武器保持原样） */
export function chainColor(id: string): number {
  const st = CHAIN_STYLE[id];
  return st === 'thor' ? 0xffe066 : st === 'storm' ? 0x7bd389 : 0x9bf6ff;
}

/** 从头顶劈下的一道闪电（纯表现） */
function skyBolt(g: GameScene, x: number, y: number, color: number, width: number): void {
  const top = y - 300;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= 6; i++) pts.push({ x: x + (i && i < 6 ? Phaser.Math.Between(-18, 18) : 0), y: top + ((y - top) * i) / 6 });
  g.fx.bolt(pts, color);
  if (width > 1)
    g.fx.bolt(
      pts.map((p, i) => ({ x: p.x + (i && i < 6 ? Phaser.Math.Between(-10, 10) : 0), y: p.y })),
      0xffffff,
    );
  // 云团与落点闪光
  const cloud = g.add
    .image(x, top, 'fx_smoke')
    .setDepth(14002)
    .setTint(0x3a3a4a)
    .setAlpha(0.8)
    .setScale(0.6 * width);
  g.tweens.add({ targets: cloud, alpha: 0, scale: cloud.scale * 1.4, duration: 420, onComplete: () => cloud.destroy() });
  const flash = g.add
    .image(x, y, 'fx_glow')
    .setDepth(14001)
    .setTint(color)
    .setBlendMode(Phaser.BlendModes.ADD)
    .setScale(0.5 * width);
  g.tweens.add({ targets: flash, alpha: 0, scale: flash.scale * 1.8, duration: 220, onComplete: () => flash.destroy() });
  g.fx.ring(x, y, 34 * width, color, 260);
  g.fx.burst(x, y, color, 6 * width);
}

/**
 * 链式闪电结束后的天降追击。
 * @param chained 本次被链式闪电劈中的敌人（按跳跃顺序）
 * @param critMult 武器暴击倍率（雷神之锤必定暴击）
 */
export function chainFollowUp(g: GameScene, st: ChainStyle, chained: Enemy[], info: HitInfo, critMult: number): void {
  if (!chained.length) return;
  if (st === 'thor') {
    // 选链上当前血最多的敌人，没有活着的就砸在最后一跳的位置
    const alive = chained.filter((e) => e.alive);
    const tgt = alive.sort((a, b) => b.hp - a.hp)[0];
    const last = chained[chained.length - 1];
    const x = tgt?.x ?? last.x,
      y = tgt?.y ?? last.y;
    g.time.delayedCall(150, () => {
      skyBolt(g, x, y, 0xffe066, 2);
      g.shake(0.006, 140);
      const dmg = (info.crit ? info.dmg : info.dmg * critMult) * 1.2;
      for (const e of [...g.grid.query(x, y, 70, g.tmp)]) {
        const center = e === tgt;
        g.weaponHit(e, { ...info, crit: true, dmg: center ? dmg : dmg * 0.4 }, x, y);
      }
    });
    return;
  }
  // storm：三道小闪电先后落下
  for (let i = 0; i < 3; i++) {
    const e = chained[Math.floor(Math.random() * chained.length)];
    const x0 = e.x + Phaser.Math.Between(-12, 12),
      y0 = e.y + Phaser.Math.Between(-12, 12);
    g.time.delayedCall(120 + i * 90, () => {
      const x = e.alive ? e.x : x0,
        y = e.alive ? e.y : y0;
      skyBolt(g, x, y, 0x7bd389, 1);
      for (const t of [...g.grid.query(x, y, 36, g.tmp)]) g.weaponHit(t, { ...info, dmg: info.dmg * 0.35, effect: { stun: 0.6 } }, x, y);
    });
  }
}

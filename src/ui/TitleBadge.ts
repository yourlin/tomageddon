// 称号徽章：圆角边框 + 稀有度符号 + 称号名，边框与文字按稀有度上色；传说称号带一圈呼吸光晕。
// 主菜单、选角、结算与称号选择界面共用。
import Phaser from 'phaser';
import { text } from './UI';
import { RARITY } from '../data/balance';
import { titleName, titleRarity } from '../data/titles';

/** 稀有度符号：普通 · 稀有 ◆ 史诗 ✦ 传说 ♛ */
export const TITLE_MARK = ['·', '◆', '✦', '♛'];

/**
 * 在 (x, y) 画一个称号徽章（以中心为原点）。返回容器，宽高可用 getBounds() 取。
 * size 为文字字号；没有称号时返回 null。
 */
export function titleBadge(scene: Phaser.Scene, x: number, y: number, id: string, size = 16): Phaser.GameObjects.Container | null {
  const name = titleName(id);
  if (!name) return null;
  const r = titleRarity(id);
  const css = RARITY[r].css,
    col = RARITY[r].color;
  const t = text(scene, 0, 0, `${TITLE_MARK[r]} ${name}`, size, css).setOrigin(0.5);
  const w = t.width + size * 1.4,
    h = size * 1.9;
  const g = scene.add.graphics();
  g.fillStyle(0x1a0a0c, 0.85).fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  g.lineStyle(r >= 2 ? 2.5 : 1.5, col, r === 0 ? 0.55 : 1).strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  const c = scene.add.container(x, y, [g, t]);
  c.setSize(w, h);
  if (r === 3) {
    // 传说：外圈呼吸光晕
    const glow = scene.add.graphics();
    glow.lineStyle(4, col, 0.6).strokeRoundedRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, h / 2 + 3);
    c.addAt(glow, 0);
    scene.tweens.add({ targets: glow, alpha: 0.15, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  return c;
}

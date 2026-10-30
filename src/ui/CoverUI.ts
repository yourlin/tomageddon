// 封面专用的奶油描边、番茄红漆面与黄铜装饰；文字保持可本地化。
import Phaser from 'phaser';
import { paint } from '../art/Painter';
import { button, text } from './UI';
import { lang, tx } from '../i18n';

export function coverTitle(scene: Phaser.Scene, x: number, y: number): void {
  const g = scene.add.graphics();
  g.lineStyle(1, 0xe9b86a, 0.65);
  g.lineBetween(x - 160, y - 80, x - 105, y - 80);
  g.lineBetween(x + 105, y - 80, x + 160, y - 80);
  text(scene, x, y - 80, tx('厨房里的小小英雄', 'A LITTLE KITCHEN HERO'), 13, '#f4d59d', {
    letterSpacing: 2,
    strokeThickness: 0,
  }).setOrigin(0.5);
  if (lang === 'en') {
    text(scene, x, y, 'TOMAGEDDON', 45, '#fff2c9', {
      fontStyle: 'bold',
      stroke: '#762d2c',
      strokeThickness: 10,
      shadow: { offsetX: 0, offsetY: 6, color: '#321320', blur: 0, fill: true, stroke: true },
    }).setOrigin(0.5);
  } else {
    [...'番茄酱'].forEach((letter, i) => {
      const lx = x + (i - 1) * 94,
        ly = y + (i === 1 ? -5 : 2);
      text(scene, lx, ly + 6, letter, 91, '#68282e', { fontStyle: 'bold', stroke: '#381722', strokeThickness: 14 })
        .setOrigin(0.5)
        .setAngle((i - 1) * 5);
      text(scene, lx, ly, letter, 91, '#fff1c7', { fontStyle: 'bold', stroke: '#a74732', strokeThickness: 8 })
        .setOrigin(0.5)
        .setAngle((i - 1) * 5);
    });
  }
  // 英文副标采用细长铭牌，压住字标底边。
  g.fillStyle(0x53242a).fillRoundedRect(x - 153, y + 55, 306, 30, 15);
  g.lineStyle(1, 0xd6a45d).strokeRoundedRect(x - 153, y + 55, 306, 30, 15);
  text(scene, x, y + 70, lang === 'en' ? 'FRESH • FIERCE • FEARLESS' : 'T O M A G E D D O N', 14, '#f6cf85', {
    strokeThickness: 0,
  }).setOrigin(0.5);
  // 小叶冠，呼应主角的番茄身份。
  g.fillStyle(0x80a845);
  g.fillEllipse(x - 4, y - 50, 27, 10);
  g.fillEllipse(x + 11, y - 55, 10, 22);
}

export function coverButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  onClick: () => void,
  primary = true,
  size = 25,
) {
  const c = button(scene, x, y, w, h, label, onClick, primary ? 0xd94f39 : 0x51332c, size);
  c.setName(`cover:${label}`);
  // 原按钮保留统一的点击、触屏和音效逻辑，封面仅替换外观。
  c.list[0].setActive(false);
  (c.list[0] as Phaser.GameObjects.Graphics).setVisible(false);
  const key = paint(scene, `cover_button_${w}_${h}_${primary}`, w + 16, h + 16, (ctx) => {
    const bx = 8,
      by = 4;
    ctx.fillStyle = '#29121b';
    ctx.beginPath();
    ctx.roundRect(bx, by + 6, w, h, 18);
    ctx.fill();
    const grad = ctx.createLinearGradient(0, by, 0, by + h);
    grad.addColorStop(0, primary ? '#f98752' : '#78513e');
    grad.addColorStop(0.5, primary ? '#df503a' : '#50332d');
    grad.addColorStop(1, primary ? '#ad302d' : '#38242a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(bx, by, w, h, 18);
    ctx.fill();
    ctx.strokeStyle = '#e9bd77';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,235,185,.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx + 5, by + 5, w - 10, h - 10, 13);
    ctx.stroke();
    for (const px of [bx + 15, bx + w - 15]) {
      ctx.fillStyle = '#f2cc83';
      ctx.beginPath();
      ctx.arc(px, by + h / 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const plate = scene.add.image(0, 2, key);
  c.addAt(plate, 0);
  c.list.forEach((o) => {
    if (o instanceof Phaser.GameObjects.Text) o.setStyle({ color: '#fff0ce', stroke: '#6a2825', strokeThickness: 3, fontStyle: 'bold' });
  });
  c.on('pointerover', () => {
    plate.setTint(0xffedd2);
    c.setScale(1.025);
  });
  c.on('pointerout', () => {
    plate.clearTint();
    plate.y = 2;
    c.setScale(1);
  });
  c.on('pointerdown', () => {
    plate.y = 5;
    c.setScale(0.99);
  });
  c.on('pointerup', () => {
    plate.y = 2;
    c.setScale(1);
  });
  return c;
}

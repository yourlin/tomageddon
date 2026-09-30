// 结算分享海报：角色、本局战绩、总进度 + 游戏二维码。
// 微信内网页无法直接把图片发给好友（需公众号 JS-SDK），因此以图片展示，长按即可发送或保存；
// 其他浏览器提供系统分享（支持文件分享时）与保存图片。
import Phaser from 'phaser';
import QRCode from 'qrcode';
import { run } from './RunState';
import { save } from './Save';
import { CHARACTERS } from '../data/characters';
import { portraitKey } from '../ui/Portrait';
import { FONT } from './Textures';
import { overlayRoot } from './ForceLandscape';
import { IS_WECHAT } from './Fullscreen';
import { isUnlocked } from './Save';
import { pointsEarned } from './Achievements';
import { tx } from '../i18n';

/** 游戏地址（去掉查询参数，扫码直接进入游戏） */
const gameUrl = () => location.origin + location.pathname;

/** 把 Phaser 纹理（含 WebGL 渲染纹理）截成图片 */
function snapshot(scene: Phaser.Scene, key: string, size: number): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const rt = scene.make.renderTexture({ width: size, height: size }, false);
    const img = scene.make.image({ key }, false);
    img.setScale(Math.min(size / img.width, size / img.height) * 0.94);
    rt.draw(img, size / 2, size / 2);
    rt.snapshot((el) => {
      resolve(el as HTMLImageElement);
      rt.destroy();
      img.destroy();
    });
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

async function drawPoster(scene: Phaser.Scene, win: boolean): Promise<HTMLCanvasElement> {
  const W = 750,
    H = 1180;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  const font = (size: number, bold = true) => `${bold ? 'bold ' : ''}${size}px ${FONT}`;
  const center = (str: string, y: number, size: number, color: string, bold = true) => {
    ctx.font = font(size, bold);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(str, W / 2, y);
  };
  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#3d1418');
  bg.addColorStop(1, '#140608');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,75,62,0.08)';
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    ctx.arc((i * 137) % W, (i * 263) % H, 30 + (i % 4) * 25, 0, Math.PI * 2);
    ctx.fill();
  }
  // 标题
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#140608';
  ctx.font = font(96);
  ctx.textAlign = 'center';
  ctx.strokeText('番茄酱', W / 2, 130);
  center('番茄酱', 130, 96, '#ff4b3e');
  center('TOMAGEDDON', 178, 34, '#ffd166');
  // 结果
  center(
    win ? tx('通关成功！', 'Chapter Cleared!') : tx(`奋战到第 ${run.wave} 波`, `Fought to wave ${run.wave}`),
    258,
    52,
    win ? '#ffd166' : '#ff9f9f',
  );
  center(run.chapter.name, 302, 26, '#c9a9a6', false);
  // 角色
  const pic = await snapshot(scene, portraitKey(scene, 'char', run.charId), 256);
  ctx.fillStyle = 'rgba(255,209,102,0.12)';
  ctx.beginPath();
  ctx.arc(W / 2, 450, 125, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(pic, W / 2 - 128, 450 - 128, 256, 256);
  center(`${run.char.name} · ${run.char.title}`, 620, 34, '#ffffff');
  // 本局战绩
  const items = Object.values(run.items).reduce((a, b) => a + b, 0);
  const stats: [string, string][] = [
    [tx('到达波次', 'Wave'), `${run.wave} / 15`],
    [tx('击杀', 'Kills'), run.kills.toLocaleString()],
    [tx('等级', 'Level'), String(run.level)],
    [tx('武器 / 道具', 'Gear'), `${run.weapons.length} / ${items}`],
  ];
  roundRect(ctx, 50, 660, W - 100, 170, 24);
  ctx.fillStyle = 'rgba(43,20,24,0.9)';
  ctx.fill();
  ctx.strokeStyle = '#7a2e35';
  ctx.lineWidth = 3;
  ctx.stroke();
  stats.forEach(([k, v], i) => {
    const x = 50 + ((W - 100) / 4) * (i + 0.5);
    ctx.textAlign = 'center';
    ctx.font = font(40);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(v, x, 745);
    ctx.font = font(22, false);
    ctx.fillStyle = '#c9a9a6';
    ctx.fillText(k, x, 790);
  });
  // 总进度
  const owned = CHARACTERS.filter(isUnlocked).length;
  center(
    tx(
      `累计通关 ${save.wins} 次 · 拥有角色 ${owned}/${CHARACTERS.length} · 成就点 ${pointsEarned()}`,
      `${save.wins} clears · ${owned}/${CHARACTERS.length} characters · ${pointsEarned()} pts`,
    ),
    880,
    24,
    '#fff4ea',
    false,
  );
  // 二维码
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, gameUrl(), { width: 200, margin: 1, color: { dark: '#1a0a0c', light: '#ffffff' } });
  roundRect(ctx, 60, 920, W - 120, 220, 24);
  ctx.fillStyle = '#fff4ea';
  ctx.fill();
  ctx.drawImage(qr, 80, 930, 200, 200);
  ctx.textAlign = 'left';
  ctx.font = font(34);
  ctx.fillStyle = '#b3261e';
  ctx.fillText(tx('扫码一起打番茄酱！', 'Scan to play!'), 310, 1000);
  ctx.font = font(22, false);
  ctx.fillStyle = '#52514e';
  ctx.fillText(tx('浏览器直接玩 · 无需下载', 'Plays in the browser · no install'), 310, 1045);
  ctx.font = font(18, false);
  ctx.fillText(gameUrl().replace(/^https?:\/\//, ''), 310, 1085);
  return c;
}

let overlay: HTMLDivElement | null = null;

export async function showSharePoster(scene: Phaser.Scene, win: boolean): Promise<void> {
  if (overlay) return;
  const canvas = await drawPoster(scene, win);
  const url = canvas.toDataURL('image/png');
  overlay = document.createElement('div');
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:45;background:rgba(10,4,6,0.9);display:flex;align-items:center;justify-content:center;gap:24px;' +
    'font:16px "PingFang SC","Microsoft YaHei",sans-serif;color:#fff4ea;';
  const img = document.createElement('img');
  img.src = url;
  img.alt = 'Tomageddon';
  img.style.cssText = 'height:92%;max-width:60%;object-fit:contain;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,0.5);';
  const side = document.createElement('div');
  side.style.cssText = 'display:flex;flex-direction:column;gap:12px;max-width:260px;text-align:center;';
  const btn = (label: string, onClick: () => void, bg = '#4a6fa5') => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = `padding:12px 20px;border:none;border-radius:10px;background:${bg};color:#fff;font:bold 17px inherit;cursor:pointer;`;
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      onClick();
    });
    side.appendChild(b);
  };
  const tip = document.createElement('div');
  tip.style.cssText = 'color:#ffd166;line-height:1.6;';
  tip.innerHTML = IS_WECHAT
    ? tx('长按左侧海报<br>「发送给朋友」或「保存图片」', 'Long-press the poster<br>to send or save it')
    : tx('分享海报给好友，一起来玩！', 'Share the poster with friends!');
  side.appendChild(tip);
  if (!IS_WECHAT) {
    const blob = await (await fetch(url)).blob();
    const file = new File([blob], 'tomageddon.png', { type: 'image/png' });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && nav.canShare?.({ files: [file] }))
      btn(tx('分享', 'Share'), () => void nav.share({ files: [file], title: 'Tomageddon', url: gameUrl() }).catch(() => {}), '#52b788');
    btn(tx('保存图片', 'Save image'), () => {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tomageddon.png';
      a.click();
    });
  }
  btn(tx('关闭', 'Close'), close, '#555555');
  overlay.append(img, side);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  overlayRoot().appendChild(overlay);
}

function close(): void {
  overlay?.remove();
  overlay = null;
}

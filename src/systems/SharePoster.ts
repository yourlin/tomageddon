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
import { overlayRoot } from './OverlayRoot';
import { IS_WECHAT } from './Fullscreen';
import { isUnlocked } from './Save';
import { pointsEarned } from './Achievements';
import { tx, lang } from '../i18n';
import { challengeCode } from '../data/challenges';
import { titleName, titleRarity, unlockedTitles } from '../data/titles';
import { TITLE_MARK } from '../ui/TitleBadge';
import { RARITY } from '../data/balance';
import { WEAPON_MAP, TIER_NAMES } from '../data/weapons';
import { RELIC_MAP } from '../data/relics';
import { counter } from './Counters';

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

/** 大数字缩写：中文用「万 / 亿」，英文用 k / M */
function big(n: number): string {
  n = Math.round(n);
  if (lang === 'zh') {
    if (n >= 1e8) return `${(n / 1e8).toFixed(n >= 1e9 ? 0 : 1)}亿`;
    if (n >= 1e4) return `${(n / 1e4).toFixed(n >= 1e5 ? 0 : 1)}万`;
    return n.toLocaleString();
  }
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e4) return `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1)}k`;
  return n.toLocaleString();
}

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

async function drawPoster(scene: Phaser.Scene, win: boolean): Promise<HTMLCanvasElement> {
  const W = 750,
    H = 1334;
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
  const card = (x: number, y: number, w: number, h: number, fill = 'rgba(43,20,24,0.9)', stroke = '#7a2e35') => {
    roundRect(ctx, x, y, w, h, 20);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  // 本局记录（结算时已写入 history[0]）与之前同角色同章节的最好成绩
  const rec = save.history[0];
  const prevBest = Math.max(
    0,
    ...save.history
      .slice(1)
      .filter((h) => h.charId === run.charId && h.chapterId === run.chapterId && h.endless === run.endless)
      .map((h) => h.wave),
  );
  const isRecord = run.wave > prevBest && save.history.length > 1;
  const totalDmg = rec ? rec.dmg.reduce((a, [, d]) => a + d, 0) : 0;
  const peakDps = rec?.dps?.length ? Math.max(...rec.dps) : 0;
  const earned = rec ? rec.income.reduce((a, b) => a + b, 0) : 0;
  // 主力武器：伤害来源里排最前的一把武器（来源还有持续伤害、爆炸、技能等，不算）
  const top = rec?.dmg.find(([k]) => WEAPON_MAP[k]);

  // 背景
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#3d1418');
  bg.addColorStop(1, '#140608');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,75,62,0.08)';
  for (let i = 0; i < 16; i++) {
    ctx.beginPath();
    ctx.arc((i * 137) % W, (i * 263) % H, 30 + (i % 4) * 25, 0, Math.PI * 2);
    ctx.fill();
  }
  // 标题
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#140608';
  ctx.font = font(88);
  ctx.textAlign = 'center';
  ctx.strokeText('番茄酱', W / 2, 112);
  center('番茄酱', 112, 88, '#ff4b3e');
  center('TOMAGEDDON', 154, 30, '#ffd166');
  // 结果 + 新纪录
  center(
    win ? tx('通关成功！', 'Chapter Cleared!') : tx(`奋战到第 ${run.wave} 波`, `Fought to wave ${run.wave}`),
    226,
    50,
    win ? '#ffd166' : '#ff9f9f',
  );
  // D5：挑战种子与得分、危机等级一起印在海报上，朋友可以输入同一个种子打同一局
  const extra: string[] = [run.endless ? tx(`${run.chapter.name} · 无尽`, `${run.chapter.name} · Endless`) : run.chapter.name];
  if (run.danger) extra.push(tx(`番茄危机 ${run.danger} 级`, `Danger ${run.danger}`));
  if (run.challenge) {
    const sc = rec?.challenge?.score;
    extra.push(
      tx(`种子 ${challengeCode(run.challenge)}`, `Seed ${challengeCode(run.challenge)}`) + (sc ? tx(` · ${sc} 分`, ` · ${sc} pts`) : ''),
    );
  }
  center(extra.join('  ·  '), 266, 22, '#c9a9a6', false);
  if (isRecord) {
    const label = tx('🏆 个人新纪录', '🏆 New personal best');
    ctx.font = font(22);
    const w = ctx.measureText(label).width + 36;
    roundRect(ctx, W / 2 - w / 2, 282, w, 38, 19);
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    center(label, 309, 22, '#3d1418');
  }

  // 角色 + 称号
  const cy = 430;
  const pic = await snapshot(scene, portraitKey(scene, 'char', run.charId), 230);
  ctx.fillStyle = 'rgba(255,209,102,0.12)';
  ctx.beginPath();
  ctx.arc(W / 2, cy, 112, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(pic, W / 2 - 115, cy - 115, 230, 230);
  center(`${run.char.name} · ${run.char.title}`, cy + 150, 32, '#ffffff');
  if (save.meta.title) {
    const r = titleRarity(save.meta.title);
    const label = `${TITLE_MARK[r]} ${titleName(save.meta.title)}`;
    ctx.font = font(22);
    const w = ctx.measureText(label).width + 40;
    roundRect(ctx, W / 2 - w / 2, cy + 168, w, 40, 20);
    ctx.fillStyle = 'rgba(26,10,12,0.9)';
    ctx.fill();
    ctx.strokeStyle = RARITY[r].css;
    ctx.lineWidth = r >= 2 ? 3 : 2;
    ctx.stroke();
    center(label, cy + 196, 22, RARITY[r].css);
  }

  // 本局战绩：2 行 × 3 列
  const stats: [string, string][] = [
    [tx('到达波次', 'Wave'), run.endless ? String(run.wave) : `${run.wave} / ${run.waveCount}`],
    [tx('击杀', 'Kills'), big(run.kills)],
    [tx('总伤害', 'Total damage'), big(totalDmg)],
    [tx('峰值 DPS', 'Peak DPS'), big(peakDps)],
    [tx('存活时间', 'Time'), mmss(rec?.sec ?? 0)],
    [tx('赚到番茄籽', 'Seeds earned'), big(earned)],
  ];
  const gx = 50,
    gy = 660,
    gw = W - 100,
    cellW = gw / 3,
    cellH = 112;
  card(gx, gy, gw, cellH * 2 + 10);
  stats.forEach(([k, v], i) => {
    const x = gx + cellW * ((i % 3) + 0.5),
      y = gy + Math.floor(i / 3) * cellH;
    ctx.textAlign = 'center';
    ctx.font = font(42);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(v, x, y + 66);
    ctx.font = font(20, false);
    ctx.fillStyle = '#c9a9a6';
    ctx.fillText(k, x, y + 98);
  });

  // 亮点：主力武器占比 + 个人最佳
  const hl: string[] = [];
  if (top && totalDmg > 0) {
    const name = WEAPON_MAP[top[0]]?.name ?? top[0];
    hl.push(
      tx(
        `主力「${name}」打出 ${Math.round((top[1] / totalDmg) * 100)}% 伤害`,
        `${name} dealt ${Math.round((top[1] / totalDmg) * 100)}% of damage`,
      ),
    );
  }
  const best = Math.max(prevBest, run.wave);
  if (best) hl.push(tx(`本角色最佳：第 ${best} 波`, `Best with this hero: wave ${best}`));
  center(hl.join('  ·  '), gy + cellH * 2 + 52, 22, '#fff4ea', false);

  // 构筑：武器图标（按品质描边，超武金色）+ 遗物
  const weapons = rec?.weapons ?? run.weapons.map((w) => ({ id: w.id, tier: w.tier, forge: w.forge }));
  const relics = (rec?.relics ?? []).slice(0, 4);
  const n = weapons.length + relics.length;
  // 最多 6 把武器 + 4 个遗物：一排放不下时按数量缩小图标
  const gap = 10,
    size = Math.min(76, Math.floor((W - 80 - (n - 1) * gap) / Math.max(1, n)));
  const by = gy + cellH * 2 + 78;
  let x = W / 2 - (n * size + (n - 1) * gap) / 2;
  for (const w of weapons) {
    const def = WEAPON_MAP[w.id];
    const sup = !!def?.evolvedFrom;
    roundRect(ctx, x, by, size, size, 14);
    ctx.fillStyle = 'rgba(26,10,12,0.9)';
    ctx.fill();
    ctx.strokeStyle = sup ? '#ffd166' : (RARITY[w.tier]?.css ?? '#888');
    ctx.lineWidth = sup ? 4 : 3;
    ctx.stroke();
    const key = scene.textures.exists(`icon_weapon_${w.id}`) ? `icon_weapon_${w.id}` : `weapon_${w.id}`;
    if (scene.textures.exists(key)) ctx.drawImage(await snapshot(scene, key, size - 12), x + 6, by + 6, size - 12, size - 12);
    ctx.textAlign = 'right';
    ctx.font = font(size < 60 ? 13 : 16);
    ctx.fillStyle = sup ? '#ffd166' : (RARITY[w.tier]?.css ?? '#fff');
    ctx.fillText(sup ? '★' : TIER_NAMES[w.tier], x + size - 6, by + size - 6);
    if (w.forge) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ffd166';
      ctx.fillText(`+${w.forge}`, x + 6, by + 20);
    }
    x += size + gap;
  }
  for (const id of relics) {
    const r = RELIC_MAP[id];
    roundRect(ctx, x, by, size, size, 38);
    ctx.fillStyle = 'rgba(26,10,12,0.9)';
    ctx.fill();
    ctx.strokeStyle = '#9d4edd';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.font = `${size * 0.5}px ${FONT}`;
    ctx.fillText(r?.icon ?? '✦', x + size / 2, by + size * 0.66);
    x += size + gap;
  }

  // 生涯
  const owned = CHARACTERS.filter(isUnlocked).length;
  const titles = unlockedTitles(save.achievements).length;
  const endlessBest = counter('endlessBest');
  center(
    tx(
      `累计通关 ${save.wins} 次 · 角色 ${owned}/${CHARACTERS.length} · 成就点 ${pointsEarned()} · 称号 ${titles}` +
        (endlessBest ? ` · 无尽最高 ${endlessBest} 波` : ''),
      `${save.wins} clears · ${owned}/${CHARACTERS.length} heroes · ${pointsEarned()} pts · ${titles} titles` +
        (endlessBest ? ` · endless best ${endlessBest}` : ''),
    ),
    by + size + 44,
    20,
    '#c9a9a6',
    false,
  );

  // 二维码
  const qy = H - 210;
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, gameUrl(), { width: 180, margin: 1, color: { dark: '#1a0a0c', light: '#ffffff' } });
  roundRect(ctx, 60, qy, W - 120, 190, 24);
  ctx.fillStyle = '#fff4ea';
  ctx.fill();
  ctx.drawImage(qr, 78, qy + 5, 180, 180);
  ctx.textAlign = 'left';
  ctx.font = font(32);
  ctx.fillStyle = '#b3261e';
  ctx.fillText(tx('扫码一起打番茄酱！', 'Scan to play!'), 284, qy + 70);
  ctx.font = font(22, false);
  ctx.fillStyle = '#52514e';
  ctx.fillText(tx('浏览器直接玩 · 无需下载', 'Plays in the browser · no install'), 284, qy + 112);
  ctx.font = font(18, false);
  ctx.fillText(gameUrl().replace(/^https?:\/\//, ''), 284, qy + 148);
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

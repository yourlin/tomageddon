// 程序化美术：武器、子弹、掉落物、特效、界面图标（Canvas 2D 卡通渲染）
// 角色 / 怪物 / Boss 由 Rig 部件动画实时绘制；道具图标按需生成（ItemArt）。
import { EVOLVED_WEAPONS } from '../data/evolutions';
import Phaser from 'phaser';
import { WEAPONS } from '../data/weapons';
import { STAT_INFO, STAT_ORDER, type StatKey } from '../data/stats';
import { CHARACTERS } from '../data/characters';
import { paint, rgb, darken, lighten, toon, ellipsePath, roundRectPath, starPath, glow, OUTLINE, type Ctx } from '../art/Painter';
import { drawWeapon, drawWeaponIcon } from '../art/WeaponArt';
import { drawMine, MINE_SIZE } from '../art/MineArt';
import { drawSkillIcon } from '../art/SkillIconArt';
import { texWeight, type TexTask } from './TexQueue';

export const FONT = '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';

const paintNow = paint;

/** 属性图标符号 */
function statGlyph(ctx: Ctx, k: StatKey, c: number): void {
  const cx = 48,
    cy = 48;
  ctx.lineWidth = 3;
  ctx.strokeStyle = OUTLINE;
  switch (k) {
    case 'maxHp':
    case 'regen':
    case 'lifeSteal':
      ctx.beginPath();
      ctx.moveTo(cx, cy + 26);
      ctx.bezierCurveTo(cx - 40, cy, cx - 26, cy - 34, cx, cy - 14);
      ctx.bezierCurveTo(cx + 26, cy - 34, cx + 40, cy, cx, cy + 26);
      toon(ctx, c, cx - 34, cy - 28, 68, 54);
      if (k === 'regen') {
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - 12, cy - 4, 24, 8);
        ctx.fillRect(cx - 4, cy - 12, 8, 24);
      }
      if (k === 'lifeSteal') {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy - 8);
        ctx.lineTo(cx - 5, cy + 8);
        ctx.lineTo(cx, cy - 8);
        ctx.moveTo(cx + 2, cy - 8);
        ctx.lineTo(cx + 7, cy + 8);
        ctx.lineTo(cx + 12, cy - 8);
        ctx.fill();
      }
      break;
    case 'damage':
    case 'crit':
    case 'skillDmg':
      starPath(ctx, cx, cy, 34, k === 'crit' ? 12 : 18, k === 'crit' ? 8 : 5);
      toon(ctx, c, cx - 34, cy - 34, 68, 68);
      break;
    case 'melee':
    case 'meleePct':
      for (const d of [-1, 1]) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(d * 0.7);
        roundRectPath(ctx, -5, -34, 10, 52, 4);
        toon(ctx, 0xdee2e6, -5, -34, 10, 52, { lineW: 2.5 });
        roundRectPath(ctx, -12, 14, 24, 8, 3);
        toon(ctx, c, -12, 14, 24, 8, { noShine: true, lineW: 2 });
        ctx.restore();
      }
      break;
    case 'ranged':
    case 'rangedPct':
    case 'range':
    case 'skillRange':
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 10;
      ctx.stroke();
      ctx.strokeStyle = rgb(c);
      ctx.lineWidth = 6;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      toon(ctx, c, cx - 12, cy - 12, 24, 24, { lineW: 2.5 });
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(cx - 42, cy);
      ctx.lineTo(cx - 20, cy);
      ctx.moveTo(cx + 20, cy);
      ctx.lineTo(cx + 42, cy);
      ctx.moveTo(cx, cy - 42);
      ctx.lineTo(cx, cy - 20);
      ctx.moveTo(cx, cy + 20);
      ctx.lineTo(cx, cy + 42);
      ctx.stroke();
      break;
    case 'elemental':
    case 'elementalPct':
    case 'auraPct':
    case 'auraSize':
      ctx.beginPath();
      ctx.moveTo(cx, cy - 36);
      ctx.bezierCurveTo(cx + 34, cy - 6, cx + 26, cy + 34, cx, cy + 34);
      ctx.bezierCurveTo(cx - 26, cy + 34, cx - 34, cy - 6, cx, cy - 36);
      toon(ctx, c, cx - 30, cy - 36, 60, 70);
      ctx.beginPath();
      ctx.moveTo(cx + 4, cy - 14);
      ctx.lineTo(cx - 8, cy + 6);
      ctx.lineTo(cx + 2, cy + 6);
      ctx.lineTo(cx - 4, cy + 24);
      ctx.lineTo(cx + 10, cy);
      ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      break;
    case 'explodeSize':
      // 爆炸星芒：外圈 10 角星 + 白色内核
      starPath(ctx, cx, cy, 40, 20, 10);
      toon(ctx, c, cx - 40, cy - 40, 80, 80);
      ctx.fillStyle = '#fff3b0';
      starPath(ctx, cx, cy, 18, 9, 8);
      ctx.fill();
      break;
    case 'attackSpeed':
    case 'skillCd':
    case 'skillDur':
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      toon(ctx, c, cx - 32, cy - 32, 64, 64);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cy - 20);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 14, cy + 8);
      ctx.stroke();
      break;
    case 'armor':
      ctx.beginPath();
      ctx.moveTo(cx, cy - 36);
      ctx.lineTo(cx + 32, cy - 24);
      ctx.quadraticCurveTo(cx + 32, cy + 20, cx, cy + 38);
      ctx.quadraticCurveTo(cx - 32, cy + 20, cx - 32, cy - 24);
      ctx.closePath();
      toon(ctx, c, cx - 32, cy - 36, 64, 74);
      break;
    case 'dodge':
    case 'speed':
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy - 10);
      ctx.lineTo(cx - 4, cy - 10);
      ctx.quadraticCurveTo(cx, cy + 4, cx + 22, cy + 8);
      ctx.quadraticCurveTo(cx + 34, cy + 12, cx + 30, cy + 24);
      ctx.lineTo(cx - 32, cy + 24);
      ctx.closePath();
      toon(ctx, c, cx - 32, cy - 10, 66, 34);
      ctx.strokeStyle = rgb(c);
      ctx.lineWidth = 4;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(cx - 42, cy - 20 + i * 10);
        ctx.lineTo(cx - 26 - i * 4, cy - 20 + i * 10);
        ctx.stroke();
      }
      break;
    case 'luck':
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2 + Math.PI / 4;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, 16, 12, a, 0, Math.PI * 2);
        toon(ctx, c, cx - 30, cy - 30, 60, 60, { noShine: true, lineW: 2.5 });
      }
      break;
    case 'harvest':
    case 'pickup':
    case 'xpGain':
      ctx.beginPath();
      ctx.moveTo(cx - 30, cy - 4);
      ctx.lineTo(cx + 30, cy - 4);
      ctx.lineTo(cx + 22, cy + 32);
      ctx.lineTo(cx - 22, cy + 32);
      ctx.closePath();
      toon(ctx, 0xbc6c25, cx - 30, cy - 4, 60, 36, { noShine: true });
      for (const [x, y] of [
        [-14, -12],
        [4, -18],
        [18, -8],
      ]) {
        ctx.beginPath();
        ctx.arc(cx + x, cy + y, 11, 0, Math.PI * 2);
        toon(ctx, c, cx + x - 11, cy + y - 11, 22, 22, { lineW: 2.5 });
      }
      break;
  }
}

/** 同步生成全部启动贴图 */
export function generateTextures(scene: Phaser.Scene): void {
  for (const t of textureTasks(scene)) t.run();
}

/**
 * 启动贴图拆成任务列表（每张贴图一个任务），交给 TexQueue 分帧执行。
 * 函数体内的 paint / proj 只登记任务、不立即绘制，所以下面的绘制代码保持原样。
 */
export function textureTasks(scene: Phaser.Scene): TexTask[] {
  const out: TexTask[] = [];
  const paint = (sc: Phaser.Scene, key: string, w: number, h: number, fn: (ctx: Ctx, w: number, h: number) => void): string => {
    out.push({ run: () => paintNow(sc, key, w, h, fn), w: texWeight(w, h), k: key });
    return key;
  };
  const proj = paint;
  buildTextures(scene, paint, proj);
  return out;
}

type PaintFn = (sc: Phaser.Scene, key: string, w: number, h: number, fn: (ctx: Ctx, w: number, h: number) => void) => string;

function buildTextures(scene: Phaser.Scene, paint: PaintFn, proj: PaintFn): void {
  const s = scene;
  // ---------- 武器 ----------
  for (const w of [...WEAPONS, ...EVOLVED_WEAPONS]) {
    paint(s, `weapon_${w.id}`, 128, 64, (ctx) => drawWeapon(ctx, w.id));
    paint(s, `icon_weapon_${w.id}`, 128, 128, (ctx) => drawWeaponIcon(ctx, w.id, w.cls));
    // 地雷类武器：布在地上的雷长得和名字一样
    if (w.kind === 'mine') paint(s, `mine_${w.id}`, MINE_SIZE, MINE_SIZE, (ctx) => drawMine(ctx, w.id));
  }

  // ---------- 子弹 ----------
  const orb = (key: string, r: number, c: number, core = 0xffffff) =>
    proj(s, key, r * 2 + 8, r * 2 + 8, (ctx) => {
      const m = r + 4;
      glow(ctx, m, m, m, c, 0.5);
      ctx.beginPath();
      ctx.arc(m, m, r * 0.72, 0, Math.PI * 2);
      toon(ctx, c, m - r * 0.72, m - r * 0.72, r * 1.44, r * 1.44, { lineW: 2 });
      ctx.fillStyle = rgb(core, 0.9);
      ctx.beginPath();
      ctx.arc(m - r * 0.2, m - r * 0.2, r * 0.25, 0, Math.PI * 2);
      ctx.fill();
    });
  orb('proj_player', 11, 0xfff3b0);
  orb('proj_enemy', 11, 0xd00000, 0xff9aa2);
  orb('proj_ice', 10, 0x48cae4);
  orb('proj_soda', 10, 0x90e0ef);
  orb('proj_ketchup', 8, 0xc1121f);
  orb('proj_pea', 8, 0x70e000);
  orb('proj_coin', 10, 0xffd700);
  proj(s, 'proj_tomato', 28, 28, (ctx) => {
    ctx.beginPath();
    ctx.arc(14, 15, 11, 0, Math.PI * 2);
    toon(ctx, 0xe63946, 3, 4, 22, 22, { lineW: 2.5 });
    ctx.fillStyle = '#2d6a4f';
    starPath(ctx, 14, 5, 6, 2.5, 5);
    ctx.fill();
  });
  proj(s, 'proj_corn', 30, 22, (ctx) => {
    ellipsePath(ctx, 15, 11, 12, 8);
    toon(ctx, 0xffd23f, 3, 3, 24, 16, { lineW: 2.5 });
  });
  proj(s, 'proj_rocket', 48, 24, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 16, 0);
    g.addColorStop(0, 'rgba(255,186,8,0)');
    g.addColorStop(1, 'rgba(255,186,8,0.9)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.lineTo(16, 6);
    ctx.lineTo(16, 18);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, 5);
    ctx.quadraticCurveTo(40, 2, 46, 12);
    ctx.quadraticCurveTo(40, 22, 14, 19);
    ctx.closePath();
    toon(ctx, 0xe71d36, 14, 3, 32, 18, { lineW: 2.5 });
    ctx.fillStyle = '#2d6a4f';
    ctx.beginPath();
    ctx.moveTo(14, 5);
    ctx.lineTo(8, 1);
    ctx.lineTo(18, 8);
    ctx.fill();
  });
  proj(s, 'proj_flame', 40, 40, (ctx) => {
    glow(ctx, 20, 20, 20, 0xff7b00, 0.9);
    glow(ctx, 20, 20, 10, 0xfff3b0, 1);
  });
  proj(s, 'proj_onion', 40, 40, (ctx) => {
    ctx.beginPath();
    ctx.arc(20, 20, 16, 0, Math.PI * 2);
    toon(ctx, 0xcdb4db, 4, 4, 32, 32, { lineW: 2.5 });
    ctx.strokeStyle = '#9d4edd';
    ctx.lineWidth = 2;
    for (const r of [11, 6]) {
      ctx.beginPath();
      ctx.arc(20, 20, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
  proj(s, 'proj_web', 30, 30, (ctx) => {
    ctx.strokeStyle = 'rgba(240,240,240,0.95)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(15, 15);
      ctx.lineTo(15 + Math.cos(a) * 13, 15 + Math.sin(a) * 13);
      ctx.stroke();
    }
    for (const r of [5, 10]) {
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.lineTo(15 + Math.cos(a) * r, 15 + Math.sin(a) * r);
      }
      ctx.stroke();
    }
  });
  // ---------- 各远程武器专属子弹（键为 proj_<武器 id>，WeaponSystem 优先使用；朝向一律向右 +x）----------
  // 酱料加特林：橙褐色拉长酱料弹（区别于番茄酱瓶的红色圆滴）
  proj(s, 'proj_sauce_gatling', 26, 14, (ctx) => {
    ellipsePath(ctx, 14, 7, 11, 4.5);
    toon(ctx, 0xbc6c25, 3, 2.5, 22, 9, { lineW: 2 });
    ctx.fillStyle = 'rgba(255,230,180,0.85)';
    ellipsePath(ctx, 17, 5.5, 4, 1.4);
    ctx.fill();
  });
  // 披萨滚刀：带刻痕的银色圆刀片（回旋，自转）
  proj(s, 'proj_pizza_cutter', 40, 40, (ctx) => {
    ctx.beginPath();
    ctx.arc(20, 20, 16, 0, Math.PI * 2);
    toon(ctx, 0xced4da, 4, 4, 32, 32, { lineW: 2.5 });
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(20 + Math.cos(a) * 7, 20 + Math.sin(a) * 7);
      ctx.lineTo(20 + Math.cos(a) * 15, 20 + Math.sin(a) * 15);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(20, 20, 5, 0, Math.PI * 2);
    toon(ctx, 0xe63946, 15, 15, 10, 10, { lineW: 1.5 });
  });
  // 橄榄发射器：绿橄榄 + 红色甜椒塞心
  proj(s, 'proj_olive_launcher', 26, 20, (ctx) => {
    ellipsePath(ctx, 13, 10, 10, 7.5);
    toon(ctx, 0x6a994e, 3, 2.5, 20, 15, { lineW: 2 });
    ctx.beginPath();
    ctx.arc(19, 10, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#e63946';
    ctx.fill();
  });
  // 葡萄霰弹枪：紫色小葡萄粒
  proj(s, 'proj_grape_shotgun', 20, 20, (ctx) => {
    ctx.beginPath();
    ctx.arc(10, 10, 7.5, 0, Math.PI * 2);
    toon(ctx, 0x7b2cbf, 2.5, 2.5, 15, 15, { lineW: 2 });
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(7.5, 7.5, 2, 0, Math.PI * 2);
    ctx.fill();
  });
  // 豆子火箭筒：大豆荚火箭（尾焰 + 绿色豆荚弹体 + 豆粒）
  proj(s, 'proj_bean_bazooka', 52, 26, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 16, 0);
    g.addColorStop(0, 'rgba(255,186,8,0)');
    g.addColorStop(1, 'rgba(255,186,8,0.9)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.lineTo(16, 7);
    ctx.lineTo(16, 19);
    ctx.closePath();
    ctx.fill();
    ellipsePath(ctx, 32, 13, 18, 9);
    toon(ctx, 0x80b918, 14, 4, 36, 18, { lineW: 2.5 });
    ctx.fillStyle = '#dde5b6';
    for (const x of [24, 32, 40]) {
      ctx.beginPath();
      ctx.arc(x, 13, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // 樱桃炸弹：红樱桃 + 引信梗 + 火星
  proj(s, 'proj_cherry_bomb', 30, 30, (ctx) => {
    ctx.strokeStyle = '#2d6a4f';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(14, 12);
    ctx.quadraticCurveTo(16, 4, 22, 3);
    ctx.stroke();
    glow(ctx, 23, 3, 4, 0xffba08, 1);
    ctx.beginPath();
    ctx.arc(13, 18, 9, 0, Math.PI * 2);
    toon(ctx, 0xd00000, 4, 9, 18, 18, { lineW: 2 });
  });
  // 蓝莓狙击枪：高速拉长的蓝莓弹 + 拖尾
  proj(s, 'proj_blueberry_sniper', 40, 16, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 26, 0);
    g.addColorStop(0, 'rgba(160,196,255,0)');
    g.addColorStop(1, 'rgba(160,196,255,0.8)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 6, 26, 4);
    ctx.beginPath();
    ctx.arc(31, 8, 6.5, 0, Math.PI * 2);
    toon(ctx, 0x3a0ca3, 24.5, 1.5, 13, 13, { lineW: 2 });
    ctx.fillStyle = '#c8b6ff';
    starPath(ctx, 31, 8, 2.6, 1.1, 5);
    ctx.fill();
  });
  // 餐盘飞碟：白瓷盘 + 蓝色花边（回旋，自转）
  proj(s, 'proj_plate_frisbee', 40, 40, (ctx) => {
    ctx.beginPath();
    ctx.arc(20, 20, 16, 0, Math.PI * 2);
    toon(ctx, 0xf8f9fa, 4, 4, 32, 32, { lineW: 2.5 });
    ctx.strokeStyle = '#4361ee';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(20, 20, 12.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(42,22,20,0.25)';
    ctx.beginPath();
    ctx.arc(20, 20, 7, 0, Math.PI * 2);
    ctx.stroke();
  });
  // 瓜子机枪：黑色西瓜籽（尖头朝前）
  proj(s, 'proj_seed_spitter', 20, 14, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(18, 7);
    ctx.quadraticCurveTo(10, 0, 3, 3.5);
    ctx.quadraticCurveTo(0, 7, 3, 10.5);
    ctx.quadraticCurveTo(10, 14, 18, 7);
    ctx.closePath();
    toon(ctx, 0x2b2118, 1, 1.5, 17, 11, { lineW: 1.5 });
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ellipsePath(ctx, 8, 5.5, 3, 1.2);
    ctx.fill();
  });
  // 胡萝卜弩：胡萝卜箭（尾部绿叶、橙色箭身、尖端朝前）
  proj(s, 'proj_carrot_crossbow', 44, 16, (ctx) => {
    ctx.fillStyle = '#52b788';
    for (const dy of [-5, 0, 5]) {
      ctx.beginPath();
      ctx.moveTo(10, 8);
      ctx.lineTo(1, 8 + dy - 2);
      ctx.lineTo(1, 8 + dy + 2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(9, 3);
    ctx.lineTo(42, 8);
    ctx.lineTo(9, 13);
    ctx.closePath();
    toon(ctx, 0xf3722c, 9, 3, 33, 10, { lineW: 2 });
    ctx.strokeStyle = 'rgba(42,22,20,0.35)';
    ctx.lineWidth = 1.2;
    for (const x of [17, 24, 31]) {
      ctx.beginPath();
      ctx.moveTo(x, 5.5);
      ctx.lineTo(x + 1.5, 9);
      ctx.stroke();
    }
  });
  // 蜂蜜喷枪：金色黏稠蜜滴（尖端朝后拖尾）
  proj(s, 'proj_honey_blaster', 28, 20, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(2, 10);
    ctx.quadraticCurveTo(10, 3, 18, 3);
    ctx.arc(18, 10, 7, -Math.PI / 2, Math.PI / 2);
    ctx.quadraticCurveTo(10, 17, 2, 10);
    ctx.closePath();
    toon(ctx, 0xffb703, 2, 3, 23, 14, { lineW: 2 });
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ellipsePath(ctx, 19, 7, 2.5, 1.5);
    ctx.fill();
  });
  // 酱油手枪：深褐色酱油滴
  proj(s, 'proj_soy_pistol', 22, 16, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(2, 8);
    ctx.quadraticCurveTo(8, 2.5, 14, 2.5);
    ctx.arc(14, 8, 5.5, -Math.PI / 2, Math.PI / 2);
    ctx.quadraticCurveTo(8, 13.5, 2, 8);
    ctx.closePath();
    toon(ctx, 0x4a2c1a, 2, 2.5, 17.5, 11, { lineW: 2 });
    ctx.fillStyle = 'rgba(255,220,180,0.55)';
    ellipsePath(ctx, 15, 6, 2, 1.2);
    ctx.fill();
  });
  // 冰块格：半透明浅蓝冰块
  proj(s, 'proj_ice_cube_tray', 22, 22, (ctx) => {
    roundRectPath(ctx, 3, 3, 16, 16, 4);
    toon(ctx, 0xa2d2ff, 3, 3, 16, 16, { lineW: 2 });
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    roundRectPath(ctx, 6, 5.5, 6, 3, 1.5);
    ctx.fill();
  });
  // 蒸汽水壶：白色蒸汽团（火焰类，飞行中放大淡出）
  proj(s, 'proj_steam_kettle', 40, 40, (ctx) => {
    glow(ctx, 20, 20, 20, 0xdee2e6, 0.85);
    for (const [x, y, r] of [
      [15, 21, 8],
      [24, 17, 9],
      [24, 25, 7],
    ] as const) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // 胡椒喷雾：红橙色辛辣粉雾 + 黑胡椒颗粒（火焰类）
  proj(s, 'proj_pepper_spray', 40, 40, (ctx) => {
    glow(ctx, 20, 20, 20, 0xe85d04, 0.85);
    glow(ctx, 20, 20, 10, 0xffba08, 0.9);
    ctx.fillStyle = '#2a1614';
    for (const [x, y] of [
      [13, 16],
      [24, 13],
      [27, 24],
      [16, 27],
      [20, 20],
    ] as const) {
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  // 雷霆榴莲：带刺的黄绿榴莲 + 电光
  proj(s, 'proj_thunder_durian', 36, 36, (ctx) => {
    glow(ctx, 18, 18, 18, 0x9bf6ff, 0.6);
    starPath(ctx, 18, 18, 15, 11, 12);
    toon(ctx, 0xb5c900, 3, 3, 30, 30, { lineW: 2 });
    ctx.strokeStyle = '#9bf6ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(20, 9);
    ctx.lineTo(14, 18);
    ctx.lineTo(20, 18);
    ctx.lineTo(15, 27);
    ctx.stroke();
  });
  // 火龙果法球：燃烧的粉色火龙果（绿色鳞片 + 火焰光晕）
  proj(s, 'proj_dragonfruit_orb', 32, 32, (ctx) => {
    glow(ctx, 16, 16, 16, 0xff7b00, 0.7);
    ellipsePath(ctx, 16, 16, 10, 9);
    toon(ctx, 0xf72585, 6, 7, 20, 18, { lineW: 2 });
    ctx.fillStyle = '#80b918';
    for (const [x, y] of [
      [12, 12],
      [19, 11],
      [15, 19],
      [21, 18],
    ] as const) {
      ctx.beginPath();
      ctx.moveTo(x - 3, y + 2);
      ctx.lineTo(x, y - 3);
      ctx.lineTo(x + 3, y + 2);
      ctx.closePath();
      ctx.fill();
    }
  });
  // 八角飞镖：褐色八角星（回旋，自转）
  proj(s, 'proj_star_anise_shuriken', 36, 36, (ctx) => {
    starPath(ctx, 18, 18, 16, 6, 8);
    toon(ctx, 0x9c6644, 2, 2, 32, 32, { lineW: 2 });
    ctx.fillStyle = '#ffd166';
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(18 + Math.cos(a) * 9, 18 + Math.sin(a) * 9, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(18, 18, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#5e3d27';
    ctx.fill();
  });

  paint(s, 'mine', 40, 40, (ctx) => {
    ctx.beginPath();
    ctx.arc(20, 22, 14, 0, Math.PI * 2);
    toon(ctx, 0x2d3142, 6, 8, 28, 28);
    glow(ctx, 20, 22, 9, 0xff3b30, 1);
  });

  // ---------- 掉落物 ----------
  paint(s, 'pickup_seed', 22, 26, (ctx) => {
    glow(ctx, 11, 13, 11, 0xffe066, 0.5);
    ellipsePath(ctx, 11, 13, 6, 9);
    toon(ctx, 0xffd23f, 5, 4, 12, 18, { lineW: 2 });
  });
  paint(s, 'pickup_fruit', 40, 40, (ctx) => {
    ctx.beginPath();
    ctx.arc(20, 23, 14, 0, Math.PI * 2);
    toon(ctx, 0xe63946, 6, 9, 28, 28);
    starPath(ctx, 20, 10, 8, 3, 5);
    ctx.fillStyle = '#2d6a4f';
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
  paint(s, 'pickup_crate', 52, 52, (ctx) => {
    glow(ctx, 26, 26, 26, 0xffd166, 0.5);
    roundRectPath(ctx, 8, 12, 36, 32, 5);
    toon(ctx, 0xa0522d, 8, 12, 36, 32, { noShine: true });
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(8, 22, 36, 5);
    ctx.fillRect(23, 12, 6, 32);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2;
    ctx.strokeRect(8, 22, 36, 5);
  });

  // ---------- 特效 ----------
  paint(s, 'fx_circle', 128, 128, (ctx) => {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(64, 64, 63, 0, Math.PI * 2);
    ctx.fill();
  });
  paint(s, 'fx_ring', 128, 128, (ctx) => {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(64, 64, 59, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.stroke();
  });
  paint(s, 'fx_glow', 128, 128, (ctx) => glow(ctx, 64, 64, 64, 0xffffff, 1));
  paint(s, 'fx_spark', 16, 16, (ctx) => {
    glow(ctx, 8, 8, 8, 0xffffff, 1);
  });
  paint(s, 'fx_hit', 64, 64, (ctx) => {
    starPath(ctx, 32, 32, 30, 8, 4);
    ctx.fillStyle = '#fff';
    ctx.fill();
    glow(ctx, 32, 32, 18, 0xffffff, 0.8);
  });
  paint(s, 'fx_smoke', 64, 64, (ctx) => {
    for (const [x, y, r] of [
      [26, 34, 18],
      [40, 30, 16],
      [32, 22, 14],
    ])
      glow(ctx, x, y, r * 1.4, 0xffffff, 0.7);
  });
  paint(s, 'fx_shadow', 64, 20, (ctx) => {
    const g = ctx.createRadialGradient(32, 10, 2, 32, 10, 32);
    g.addColorStop(0, 'rgba(0,0,0,0.5)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.save();
    ctx.scale(1, 0.31);
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.restore();
    ctx.fill();
  });
  paint(s, 'fx_warn', 64, 64, (ctx) => {
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(12, 12);
    ctx.lineTo(52, 52);
    ctx.moveTo(52, 12);
    ctx.lineTo(12, 52);
    ctx.stroke();
    ctx.strokeStyle = '#ff3b30';
    ctx.lineWidth = 7;
    ctx.stroke();
  });
  paint(s, 'fx_slash', 128, 128, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,1)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(64, 64, 54, -1.2, 1.2);
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(64, 64, 40, -0.9, 0.9);
    ctx.stroke();
  });
  paint(s, 'fx_streak', 128, 32, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 128, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 16);
    ctx.lineTo(110, 6);
    ctx.lineTo(128, 16);
    ctx.lineTo(110, 26);
    ctx.closePath();
    ctx.fill();
  });
  paint(s, 'fx_beam', 128, 64, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,1)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 64);
  });
  paint(s, 'fx_bubble', 96, 96, (ctx) => {
    const g = ctx.createRadialGradient(48, 48, 30, 48, 48, 46);
    g.addColorStop(0, 'rgba(155,246,255,0.05)');
    g.addColorStop(0.85, 'rgba(155,246,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0.8)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(48, 48, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(32, 28, 10, 5, -0.6, 0, Math.PI * 2);
    ctx.fill();
  });
  paint(s, 'fx_pool', 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.8, 'rgba(255,255,255,0.7)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(128, 128, 126, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    for (const [x, y, r] of [
      [90, 100, 14],
      [160, 140, 10],
      [120, 170, 8],
      [170, 90, 12],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  paint(s, 'fx_slime', 64, 64, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2,
        r = 22 + (i % 3) * 5;
      ctx.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r * 0.7);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(24, 28, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  for (let k = 0; k < 3; k++)
    paint(s, `fx_splat${k}`, 128, 128, (ctx) => {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2,
          r = 34 + ((i * 7 + k * 5) % 5) * 5 + (i % 2) * 8;
        ctx.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        const a = i * 1.1 + k,
          d = 54 + (i % 3) * 6;
        ctx.beginPath();
        ctx.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 4 + (i % 3) * 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

  // ---------- 地形机关 ----------
  paint(s, 'proj_rock', 26, 26, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(4, 14);
    ctx.lineTo(9, 5);
    ctx.lineTo(19, 4);
    ctx.lineTo(23, 13);
    ctx.lineTo(17, 22);
    ctx.lineTo(7, 21);
    ctx.closePath();
    toon(ctx, 0x8d8d8d, 4, 4, 19, 18, { lineW: 2.5 });
  });
  paint(s, 'terrain_hole', 120, 80, (ctx) => {
    ellipsePath(ctx, 60, 44, 54, 30);
    toon(ctx, 0x8d6e63, 6, 14, 108, 60, { noShine: true });
    ellipsePath(ctx, 60, 42, 38, 20);
    const g = ctx.createRadialGradient(60, 46, 4, 60, 42, 38);
    g.addColorStop(0, '#0d0705');
    g.addColorStop(1, '#3d2618');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = '#6b4f35';
    for (const [x, y, r] of [
      [16, 30, 7],
      [104, 34, 6],
      [30, 66, 6],
      [92, 64, 7],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  paint(s, 'terrain_sewer', 110, 110, (ctx) => {
    ctx.beginPath();
    ctx.arc(55, 55, 48, 0, Math.PI * 2);
    toon(ctx, 0x495057, 7, 7, 96, 96, { noShine: true });
    ctx.fillStyle = '#111';
    for (let i = -2; i <= 2; i++) {
      roundRectPath(ctx, 22, 51 + i * 15 - 4, 66, 8, 4);
      ctx.fill();
    }
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(55, 55, 44, 0, Math.PI * 2);
    ctx.stroke();
  });
  paint(s, 'terrain_quicksand', 256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 10, 128, 128, 126);
    g.addColorStop(0, 'rgba(60,40,20,0.95)');
    g.addColorStop(0.6, 'rgba(120,90,50,0.8)');
    g.addColorStop(1, 'rgba(150,120,70,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(128, 128, 126, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(40,25,10,0.6)';
    ctx.lineWidth = 5;
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      for (let t = 0; t < 9; t += 0.1) {
        const r = 12 + t * 12;
        const a = t + k * 2.1;
        const x = 128 + Math.cos(a) * r,
          y = 128 + Math.sin(a) * r;
        if (t === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
  paint(s, 'terrain_ice', 256, 180, (ctx) => {
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2,
        r = 1 - (i % 3) * 0.06;
      ctx.lineTo(128 + Math.cos(a) * 124 * r, 90 + Math.sin(a) * 86 * r);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 256, 180);
    g.addColorStop(0, 'rgba(230,250,255,0.85)');
    g.addColorStop(1, 'rgba(140,210,240,0.75)');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 4;
    for (const [x, y] of [
      [70, 60],
      [150, 110],
      [180, 50],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 30, y - 16);
      ctx.stroke();
    }
  });
  paint(s, 'terrain_conveyor', 128, 96, (ctx) => {
    ctx.fillStyle = '#343a40';
    ctx.fillRect(0, 0, 128, 96);
    ctx.fillStyle = '#212529';
    for (let x = 0; x < 128; x += 16) ctx.fillRect(x, 0, 3, 96);
    ctx.fillStyle = '#ffd60a';
    for (let x = 16; x < 128; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x + 26, 48);
      ctx.lineTo(x, 66);
      ctx.lineTo(x + 8, 48);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#6c757d';
    ctx.fillRect(0, 0, 128, 8);
    ctx.fillRect(0, 88, 128, 8);
  });
  paint(s, 'terrain_vent', 110, 110, (ctx) => {
    ctx.beginPath();
    ctx.arc(55, 55, 46, 0, Math.PI * 2);
    toon(ctx, 0x6c757d, 9, 9, 92, 92, { noShine: true });
    ctx.beginPath();
    ctx.arc(55, 55, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#1b1b1b';
    ctx.fill();
    ctx.strokeStyle = '#adb5bd';
    ctx.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(55 - Math.cos(a) * 30, 55 - Math.sin(a) * 30);
      ctx.lineTo(55 + Math.cos(a) * 30, 55 + Math.sin(a) * 30);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd60a';
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.arc(55 + Math.cos(a) * 40, 55 + Math.sin(a) * 40, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  paint(s, 'terrain_wind', 64, 32, (ctx) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(2, 16);
    ctx.bezierCurveTo(20, 4, 40, 28, 62, 12);
    ctx.stroke();
  });

  // ---------- UI ----------
  paint(s, 'ui_joy_base', 180, 180, (ctx) => {
    const g = ctx.createRadialGradient(90, 90, 40, 90, 90, 88);
    g.addColorStop(0, 'rgba(255,255,255,0.06)');
    g.addColorStop(1, 'rgba(255,255,255,0.22)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(90, 90, 86, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.save();
      ctx.translate(90 + Math.cos(a) * 68, 90 + Math.sin(a) * 68);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-4, -8);
      ctx.lineTo(-4, 8);
      ctx.fill();
      ctx.restore();
    }
  });
  paint(s, 'ui_joy_knob', 90, 90, (ctx) => {
    const g = ctx.createRadialGradient(36, 32, 4, 45, 45, 42);
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(1, 'rgba(220,220,220,0.6)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(45, 45, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 3;
    ctx.stroke();
  });
  paint(s, 'ui_seed_icon', 32, 32, (ctx) => {
    glow(ctx, 16, 16, 16, 0xffe066, 0.5);
    ellipsePath(ctx, 16, 16, 8, 12);
    toon(ctx, 0xffd23f, 8, 4, 16, 24, { lineW: 2 });
  });
  paint(s, 'ui_heart', 40, 40, (ctx) => {
    ctx.beginPath();
    ctx.moveTo(20, 34);
    ctx.bezierCurveTo(0, 20, 4, 4, 20, 12);
    ctx.bezierCurveTo(36, 4, 40, 20, 20, 34);
    toon(ctx, 0xff3b30, 2, 6, 36, 28, { lineW: 2.5 });
  });
  paint(s, 'ui_pause', 64, 64, (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    roundRectPath(ctx, 21, 19, 8, 26, 3);
    ctx.fill();
    roundRectPath(ctx, 35, 19, 8, 26, 3);
    ctx.fill();
  });
  for (const k of STAT_ORDER) {
    const c = Phaser.Display.Color.HexStringToColor(STAT_INFO[k].color).color;
    paint(s, `stat_${k}`, 96, 96, (ctx) => {
      statGlyph(ctx, k, c);
      // 百分比类与光环类属性：角标区分于同类的数值属性
      const badge = k === 'auraSize' || k === 'explodeSize' ? '◎' : k.endsWith('Pct') ? '%' : '';
      if (badge) {
        ctx.fillStyle = '#1a0a0c';
        ctx.beginPath();
        ctx.arc(76, 76, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(badge, 76, 77);
      }
    });
  }
  // 技能图标：金属边徽章 + 每个角色的专属图案（art/SkillIconArt.ts），128px 以便高分屏清晰
  for (const ch of CHARACTERS) paint(s, `skill_${ch.id}`, 128, 128, (ctx) => drawSkillIcon(ctx, ch.id, ch.skill, 128));
  // 状态图标底
  paint(s, 'ui_status', 40, 40, (ctx) => {
    ctx.beginPath();
    ctx.arc(20, 20, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  });
}

/** 按钮与面板贴图（带渐变与高光），可按颜色复用 */
export function buttonTex(scene: Phaser.Scene, w: number, h: number, color: number, pressed = false): string {
  return paint(scene, `btn_${w}_${h}_${color.toString(16)}_${pressed ? 1 : 0}`, w, h + 6, (ctx) => {
    const r = Math.min(18, h / 2.5);
    roundRectPath(ctx, 2, 6, w - 4, h - 4, r);
    ctx.fillStyle = rgb(darken(color, 0.45));
    ctx.fill();
    const y0 = pressed ? 5 : 2;
    roundRectPath(ctx, 2, y0, w - 4, h - 6, r);
    const g = ctx.createLinearGradient(0, y0, 0, y0 + h - 6);
    g.addColorStop(0, rgb(lighten(color, 0.25)));
    g.addColorStop(0.5, rgb(color));
    g.addColorStop(1, rgb(darken(color, 0.15)));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = rgb(darken(color, 0.55));
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.save();
    roundRectPath(ctx, 6, y0 + 3, w - 12, (h - 6) * 0.42, r * 0.8);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  });
}

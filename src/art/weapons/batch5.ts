// 武器专属造型 · 第 5 批：融合武器（一）
// 每个函数在 128×64 画布上画一把武器：手柄 / 握把在左、朝右，中线 y = 32，描边统一用 OUTLINE，上色用 toon / metal
import { type Ctx, OUTLINE, rgb, ellipsePath, roundRectPath, starPath, toon, glow } from '../Painter';
import { handle, metal } from '../weaponKit';

const C = 32;

/** 带描边的粗线：先画深色粗线再画彩色细线 */
function line2(ctx: Ctx, w: number, color: number, path: () => void): void {
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = w + 3;
  path();
  ctx.stroke();
  ctx.strokeStyle = rgb(color);
  ctx.lineWidth = w;
  path();
  ctx.stroke();
}

/** 折线路径 */
function poly(ctx: Ctx, pts: [number, number][], close = true): void {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (close) ctx.closePath();
}

/** 闪电：带描边的折线 */
function bolt(ctx: Ctx, pts: [number, number][], color = 0x9bf6ff, w = 2.5): void {
  line2(ctx, w, color, () => poly(ctx, pts, false));
}

/** 卡通圆球 */
function ball(ctx: Ctx, x: number, y: number, r: number, color: number, lineW = 2.5, noShine = false): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  toon(ctx, color, x - r, y - r, r * 2, r * 2, { lineW, noShine });
}

/** 圆角块（握把、枪托等） */
function block(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, color: number, noShine = true): void {
  roundRectPath(ctx, x, y, w, h, r);
  toon(ctx, color, x, y, w, h, { noShine, lineW: 3 });
}

/** 雪花 / 冰晶 */
function flake(ctx: Ctx, x: number, y: number, r: number, color = 0xe0fbfc): void {
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    line2(ctx, 1.5, color, () => {
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    });
  }
}

/** 火苗（尖朝右上） */
function flame(ctx: Ctx, x: number, y: number, s: number, color = 0xff7b00): void {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.6);
  ctx.quadraticCurveTo(x - s * 0.7, y, x + s * 0.2, y - s);
  ctx.quadraticCurveTo(x + s * 0.1, y - s * 0.3, x + s * 0.7, y - s * 0.5);
  ctx.quadraticCurveTo(x + s * 0.8, y + s * 0.4, x, y + s * 0.6);
  toon(ctx, color, x - s * 0.7, y - s, s * 1.5, s * 1.6, { lineW: 2, noShine: true });
  ctx.beginPath();
  ctx.ellipse(x + s * 0.05, y + s * 0.1, s * 0.22, s * 0.32, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = rgb(0xffe066, 0.95);
  ctx.fill();
}

/** 刀身高光线 */
function shine(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, a = 0.8, w = 2): void {
  ctx.strokeStyle = `rgba(255,255,255,${a})`;
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

export const ART: Record<string, (ctx: Ctx) => void> = {
  // 双刃寿司刀：缠绳刀柄 + 金色刀镡，上芥末绿刃、下钢刃两片并排熔接成一把，中段裹一圈海苔饭团箍，刀尖合一
  sushi_twin_blade: (ctx) => {
    handle(ctx, 4, 36, C, 11, 0x1d3557);
    ctx.strokeStyle = rgb(0xf1faee, 0.8);
    ctx.lineWidth = 2;
    for (let x = 10; x < 34; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, C - 5);
      ctx.lineTo(x + 3, C + 5);
      ctx.stroke();
    }
    // 下刃：钢
    poly(ctx, [
      [40, C + 1],
      [112, C + 3],
      [124, C],
      [114, C + 9],
      [40, C + 13],
    ]);
    metal(ctx, 40, C, 84, 13);
    // 上刃：芥末绿
    poly(ctx, [
      [40, C - 13],
      [112, C - 4],
      [124, C],
      [112, C - 1],
      [40, C - 1],
    ]);
    toon(ctx, 0x6ab04c, 40, C - 13, 84, 13, { lineW: 3, noShine: true });
    shine(ctx, 46, C - 10, 104, C - 4, 0.7);
    shine(ctx, 46, C + 10, 104, C + 7, 0.5);
    // 海苔饭团箍
    roundRectPath(ctx, 66, C - 12, 14, 26, 3);
    toon(ctx, 0xf8f9fa, 66, C - 12, 14, 26, { lineW: 2.5, noShine: true });
    roundRectPath(ctx, 69, C - 12, 8, 26, 2);
    ctx.fillStyle = rgb(0x1b4332);
    ctx.fill();
    ball(ctx, 73, C, 3, 0xff6b35, 1.5, true);
    // 刀镡
    ctx.beginPath();
    ctx.ellipse(39, C, 5, 17, 0, 0, Math.PI * 2);
    toon(ctx, 0xffc300, 34, C - 17, 10, 34, { lineW: 2.5 });
    // 余烬
    for (const [x, y, r] of [
      [92, C - 18, 2.5],
      [104, C + 16, 2],
      [118, C - 10, 2],
    ])
      glow(ctx, x, y, r * 2.5, 0xff7b00, 0.9);
  },

  // 爆裂豌豆炮：粗短豆荚炮管鼓出三颗大豆，炮口套红色火箭喷口，顶部两片尾翼，下方木握把
  blast_pea_cannon: (ctx) => {
    block(ctx, 14, C + 4, 16, 24, 5, 0x38b000);
    // 豆荚炮管
    ctx.beginPath();
    ctx.moveTo(6, C - 2);
    ctx.bezierCurveTo(10, C - 24, 80, C - 24, 96, C - 14);
    ctx.lineTo(96, C + 12);
    ctx.bezierCurveTo(80, C + 20, 10, C + 20, 6, C - 2);
    toon(ctx, 0x70e000, 6, C - 22, 90, 40);
    for (const x of [30, 52, 74]) ball(ctx, x, C - 2, 10, 0x9ef01a, 2.5);
    // 尾翼
    for (const s of [-1, 1]) {
      poly(ctx, [
        [86, C + s * 14],
        [100, C + s * 14],
        [108, C + s * 27],
        [92, C + s * 24],
      ]);
      toon(ctx, 0xffba08, 86, C - 27, 22, 54, { lineW: 2.5, noShine: true });
    }
    // 火箭喷口
    poly(ctx, [
      [94, C - 15],
      [116, C - 11],
      [116, C + 9],
      [94, C + 13],
    ]);
    toon(ctx, 0xe71d36, 94, C - 15, 22, 28, { lineW: 3 });
    roundRectPath(ctx, 114, C - 13, 8, 24, 3);
    metal(ctx, 114, C - 13, 8, 24, 0x6c757d);
    glow(ctx, 122, C - 1, 6, 0xffd166, 0.9);
  },

  // 咖喱蒜香结界：悬浮的咖喱碗里立着一颗大蒜，碗外一圈橙紫交织的光环带
  curry_garlic_field: (ctx) => {
    glow(ctx, 64, C, 31, 0xffb703, 0.55);
    ctx.lineWidth = 4;
    ctx.strokeStyle = rgb(0xffb703, 0.85);
    ctx.beginPath();
    ctx.ellipse(64, C + 10, 50, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = rgb(0xc77dff, 0.85);
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.ellipse(64, C + 10, 50, 13, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // 大蒜
    ctx.beginPath();
    ctx.moveTo(64, C - 28);
    ctx.bezierCurveTo(84, C - 18, 86, C + 6, 64, C + 6);
    ctx.bezierCurveTo(42, C + 6, 44, C - 18, 64, C - 28);
    toon(ctx, 0xf1e3d3, 44, C - 28, 40, 34, { lineW: 2.5 });
    ctx.strokeStyle = rgb(0xc8a2c8);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(64, C - 26);
    ctx.quadraticCurveTo(57, C - 10, 62, C + 4);
    ctx.moveTo(64, C - 26);
    ctx.quadraticCurveTo(72, C - 10, 67, C + 4);
    ctx.stroke();
    // 碗
    ctx.beginPath();
    ctx.moveTo(36, C + 2);
    ctx.lineTo(92, C + 2);
    ctx.quadraticCurveTo(90, C + 26, 64, C + 27);
    ctx.quadraticCurveTo(38, C + 26, 36, C + 2);
    toon(ctx, 0xf8f9fa, 36, C + 2, 56, 25, { lineW: 3 });
    ellipsePath(ctx, 64, C + 3, 28, 5);
    toon(ctx, 0xe09f3e, 36, C - 2, 56, 10, { lineW: 2.5, noShine: true });
    ctx.fillStyle = rgb(0x7b2cbf);
    ctx.fillRect(40, C + 13, 48, 3);
  },

  // 雷霆果园：长木杖顶端一棵西兰花小树，枝上挂两颗柠檬电池，电池之间跳着闪电
  thunder_orchard: (ctx) => {
    handle(ctx, 4, 80, C, 9, 0x6b4226);
    // 树杈
    line2(ctx, 4, 0x6b4226, () => {
      ctx.beginPath();
      ctx.moveTo(78, C);
      ctx.lineTo(94, C - 12);
      ctx.moveTo(78, C);
      ctx.lineTo(94, C + 12);
    });
    for (const [x, y, r] of [
      [96, C - 18, 9],
      [110, C - 10, 10],
      [114, C + 6, 10],
      [98, C + 16, 9],
      [100, C, 10],
    ])
      ball(ctx, x, y, r, 0x2d6a4f, 2.5, true);
    // 柠檬电池
    for (const [x, y] of [
      [86, C - 22],
      [86, C + 22],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 10, 7, 0, 0, Math.PI * 2);
      toon(ctx, 0xffe14d, x - 10, y - 7, 20, 14, { lineW: 2.5 });
      roundRectPath(ctx, x + 9, y - 2.5, 4, 5, 1);
      metal(ctx, x + 9, y - 2.5, 4, 5, 0xadb5bd);
      ctx.fillStyle = OUTLINE;
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(y < C ? '+' : '−', x - 3, y + 3);
    }
    bolt(ctx, [
      [96, C - 22],
      [106, C - 14],
      [100, C - 6],
      [114, C + 2],
      [106, C + 8],
      [120, C + 16],
    ]);
  },

  // 霜刃剁骨刀：冰蓝方刀身，刀背嵌雪糕球、刀口挂冰锥，表面带雪花纹
  frost_cleaver: (ctx) => {
    handle(ctx, 4, 48, C + 6, 12, 0x2b4162);
    poly(ctx, [
      [46, C - 18],
      [118, C - 18],
      [124, C - 12],
      [122, C + 12],
      [46, C + 10],
    ]);
    metal(ctx, 46, C - 18, 78, 30, 0xa8dadc);
    // 冰锥挂在刃口
    for (const [x, h] of [
      [56, 8],
      [70, 12],
      [84, 9],
      [98, 13],
      [112, 9],
    ]) {
      poly(ctx, [
        [x - 5, C + 10.5],
        [x + 5, C + 11],
        [x, C + 11 + h],
      ]);
      toon(ctx, 0xcaf0f8, x - 5, C + 10, 10, h, { lineW: 2, noShine: true });
    }
    // 刀背雪糕球
    for (const [x, c] of [
      [62, 0xffafcc],
      [80, 0xfdfcdc],
      [98, 0xbde0fe],
    ])
      ball(ctx, x, C - 20, 7, c, 2.5);
    flake(ctx, 76, C - 3, 6);
    flake(ctx, 104, C + 1, 5);
    ctx.beginPath();
    ctx.arc(114, C - 8, 4, 0, Math.PI * 2);
    ctx.fillStyle = rgb(0x457b9d);
    ctx.fill();
  },

  // 毒雾加特林：紫色毒罐弹鼓架在枪身上方，下方六管旋转炮管，炮口飘出绿色毒雾
  toxic_gatling: (ctx) => {
    block(ctx, 6, C + 4, 16, 22, 5, 0x343a40);
    roundRectPath(ctx, 12, C - 6, 40, 20, 6);
    toon(ctx, 0x6a4c93, 12, C - 6, 40, 20, { lineW: 3 });
    for (const dy of [-5, 1, 7]) {
      roundRectPath(ctx, 50, C + dy - 3, 56, 6, 3);
      metal(ctx, 50, C + dy - 3, 56, 6, 0x8d99ae);
    }
    roundRectPath(ctx, 72, C - 10, 8, 24, 3);
    metal(ctx, 72, C - 10, 8, 24, 0x495057);
    roundRectPath(ctx, 100, C - 10, 8, 24, 3);
    metal(ctx, 100, C - 10, 8, 24, 0x495057);
    // 毒罐
    ctx.beginPath();
    ctx.ellipse(36, C - 16, 20, 12, 0, 0, Math.PI * 2);
    toon(ctx, 0x9d4edd, 16, C - 28, 40, 24, { lineW: 3 });
    roundRectPath(ctx, 30, C - 30, 12, 6, 2);
    metal(ctx, 30, C - 30, 12, 6, 0xadb5bd);
    ctx.fillStyle = rgb(0xb5e48c);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('☠', 30, C - 12);
    // 毒雾
    for (const [x, y, r] of [
      [114, C - 2, 8],
      [120, C + 9, 5],
      [118, C - 13, 5],
    ]) {
      ball(ctx, x, y, r, 0x80b918, 2, true);
    }
  },

  // 炎狱迫击炮：粗短的喇叭口炮筒架在三脚架上，筒身烧烤网格纹，炮口窜出火焰
  inferno_mortar: (ctx) => {
    // 支架
    line2(ctx, 4, 0x495057, () => {
      ctx.beginPath();
      ctx.moveTo(40, C + 8);
      ctx.lineTo(26, C + 29);
      ctx.moveTo(48, C + 8);
      ctx.lineTo(62, C + 29);
    });
    // 尾座
    ctx.beginPath();
    ctx.arc(14, C + 2, 11, 0, Math.PI * 2);
    toon(ctx, 0x495057, 3, C - 9, 22, 22, { lineW: 3 });
    // 炮筒（喇叭口）
    poly(ctx, [
      [14, C - 10],
      [90, C - 14],
      [108, C - 24],
      [108, C + 20],
      [90, C + 10],
      [14, C + 14],
    ]);
    toon(ctx, 0x9d0208, 14, C - 24, 94, 44, { lineW: 3 });
    ctx.save();
    poly(ctx, [
      [16, C - 10],
      [90, C - 14],
      [90, C + 10],
      [16, C + 14],
    ]);
    ctx.clip();
    ctx.strokeStyle = rgb(0x370617, 0.8);
    ctx.lineWidth = 2.5;
    for (let x = 22; x < 92; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, C - 16);
      ctx.lineTo(x + 8, C + 16);
      ctx.stroke();
    }
    ctx.restore();
    roundRectPath(ctx, 54, C - 15, 8, 30, 3);
    metal(ctx, 54, C - 15, 8, 30, 0x6c757d);
    ellipsePath(ctx, 108, C - 2, 6, 21);
    toon(ctx, 0x370617, 102, C - 23, 12, 42, { lineW: 3, noShine: true });
    flame(ctx, 114, C - 6, 13, 0xff5400);
    flame(ctx, 116, C + 10, 8, 0xff9e00);
  },

  // 雷霆铁壁锅：厚铁锅正面焊着一只电打蛋器，钢丝从锅心穿出锅沿，锅面电光乱窜
  storm_whisk_pan: (ctx) => {
    handle(ctx, 4, 52, C, 12, 0x3d2c2e);
    roundRectPath(ctx, 48, C - 6, 12, 12, 3);
    metal(ctx, 48, C - 6, 12, 12, 0x6c757d);
    ctx.beginPath();
    ctx.ellipse(86, C, 28, 28, 0, 0, Math.PI * 2);
    toon(ctx, 0x495057, 58, C - 28, 56, 56, { lineW: 3.5 });
    ctx.beginPath();
    ctx.ellipse(86, C, 21, 21, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgb(0x212529);
    ctx.fill();
    // 铆钉一圈
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ball(ctx, 86 + Math.cos(a) * 24.5, C + Math.sin(a) * 24.5, 2, 0xadb5bd, 1, true);
    }
    // 打蛋器钢丝
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 5;
    for (const ry of [14, 8, 2]) {
      ctx.beginPath();
      ctx.ellipse(104, C, 22, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = rgb(0xffe066);
    ctx.lineWidth = 2.5;
    for (const ry of [14, 8, 2]) {
      ctx.beginPath();
      ctx.ellipse(104, C, 22, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    roundRectPath(ctx, 78, C - 5, 8, 10, 3);
    metal(ctx, 78, C - 5, 8, 10, 0xffd60a);
    bolt(ctx, [
      [70, C - 16],
      [78, C - 10],
      [72, C - 4],
    ]);
    bolt(ctx, [
      [92, C + 14],
      [100, C + 20],
      [94, C + 24],
    ]);
  },

  // 电磁蓝莓狙：细长枪托 + 上下两条导轨夹着发光蓝色电磁通道，中段串三颗蓝莓能量核，顶上长瞄具
  railgun_sniper: (ctx) => {
    poly(ctx, [
      [4, C - 2],
      [30, C - 6],
      [34, C + 8],
      [8, C + 16],
    ]);
    toon(ctx, 0x3a0ca3, 4, C - 6, 30, 22, { lineW: 3, noShine: true });
    block(ctx, 30, C + 4, 10, 16, 3, 0x343a40);
    roundRectPath(ctx, 28, C - 8, 34, 16, 5);
    metal(ctx, 28, C - 8, 34, 16, 0x495057);
    glow(ctx, 92, C, 20, 0x4cc9f0, 0.5);
    ctx.fillStyle = rgb(0x90e0ef, 0.9);
    ctx.fillRect(60, C - 3, 62, 6);
    for (const dy of [-7, 7]) {
      roundRectPath(ctx, 58, C + dy - 3, 66, 6, 2);
      metal(ctx, 58, C + dy - 3, 66, 6, 0x8d99ae);
    }
    for (const x of [70, 86, 102]) ball(ctx, x, C, 4.5, 0x4361ee, 2);
    // 瞄具
    roundRectPath(ctx, 36, C - 20, 30, 8, 4);
    metal(ctx, 36, C - 20, 30, 8, 0x212529);
    ball(ctx, 66, C - 16, 4, 0x4cc9f0, 2, true);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(48, C - 12, 4, 4);
  },

  // 蜜霜结界：悬浮的六角蜂巢冰晶，中心封着雪花，底部挂蜂蜜滴，周围飘冰屑
  honey_frost_aura: (ctx) => {
    glow(ctx, 64, C, 32, 0xffe066, 0.45);
    glow(ctx, 64, C, 22, 0xcaf0f8, 0.5);
    starPath(ctx, 64, C, 26, 26, 3, 0);
    toon(ctx, 0xffc300, 38, C - 26, 52, 52, { lineW: 3 });
    starPath(ctx, 64, C, 17, 17, 3, 0);
    toon(ctx, 0xbde0fe, 47, C - 17, 34, 34, { lineW: 2.5 });
    flake(ctx, 64, C, 10, 0xffffff);
    // 蜂蜜滴
    for (const [x, h] of [
      [54, 8],
      [72, 11],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x - 3, C + 21);
      ctx.lineTo(x + 3, C + 21);
      ctx.quadraticCurveTo(x + 5, C + 21 + h, x, C + 22 + h);
      ctx.quadraticCurveTo(x - 5, C + 21 + h, x - 3, C + 21);
      toon(ctx, 0xffaa00, x - 5, C + 21, 10, h + 1, { lineW: 2, noShine: true });
    }
    for (const [x, y] of [
      [30, C - 14],
      [98, C - 18],
      [100, C + 14],
      [28, C + 12],
    ]) {
      starPath(ctx, x, y, 5, 2, 4);
      toon(ctx, 0xe0fbfc, x - 5, y - 5, 10, 10, { lineW: 1.5, noShine: true });
    }
  },
  // 孢子雷区：一块长条铁雷座上挤着四颗大小不一的灰绿马勃菌，顶上裂口喷孢子烟，菌底由一根燃着的引线串起来
  spore_minefield: (ctx) => {
    // 雷座
    poly(ctx, [
      [14, C + 16],
      [114, C + 16],
      [120, C + 28],
      [8, C + 28],
    ]);
    metal(ctx, 8, C + 16, 112, 12, 0x495057);
    for (const x of [24, 64, 104]) {
      glow(ctx, x, C + 22, 6, 0xff3b30, 0.9);
      ball(ctx, x, C + 22, 2.5, 0xff3b30, 1, true);
    }
    // 马勃菌
    const puffs: [number, number, number][] = [
      [30, C + 6, 11],
      [56, C - 1, 17],
      [86, C + 4, 14],
      [108, C + 9, 8],
    ];
    for (const [x, y, r] of puffs) {
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * 0.9, 0, 0, Math.PI * 2);
      toon(ctx, 0xa3b18a, x - r, y - r * 0.9, r * 2, r * 1.8, { lineW: 2.5 });
      ctx.fillStyle = rgb(0x588157, 0.7);
      for (const [dx, dy] of [
        [-0.4, 0.1],
        [0.3, 0.3],
        [0, -0.2],
        [0.45, -0.1],
      ]) {
        ctx.beginPath();
        ctx.arc(x + dx * r, y + dy * r, Math.max(1, r * 0.09), 0, Math.PI * 2);
        ctx.fill();
      }
      // 顶部裂口
      starPath(ctx, x, y - r * 0.82, r * 0.32, r * 0.12, 5);
      ctx.fillStyle = rgb(0x3a5a40);
      ctx.fill();
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    // 孢子烟
    for (const [x, y, r] of [
      [56, C - 22, 6],
      [62, C - 27, 4],
      [50, C - 26, 3.5],
      [86, C - 14, 4.5],
      [91, C - 19, 3],
      [30, C - 9, 3.5],
    ])
      ball(ctx, x, y, r, 0xc5d86d, 1.5, true);
    // 引线
    line2(ctx, 2, 0xe9c46a, () => {
      ctx.beginPath();
      ctx.moveTo(4, C + 8);
      ctx.quadraticCurveTo(14, C + 18, 30, C + 15);
      ctx.quadraticCurveTo(44, C + 18, 56, C + 14);
      ctx.quadraticCurveTo(72, C + 19, 86, C + 15);
      ctx.quadraticCurveTo(98, C + 18, 108, C + 15);
    });
    glow(ctx, 5, C + 7, 6, 0xffd166, 1);
  },

  // 糖果霰弹枪：粉色枪托，上下双联炮管缠红白拐杖糖纹，泵把是一颗包装硬糖，管口塞着彩色糖豆
  candy_shotgun: (ctx) => {
    poly(ctx, [
      [4, C - 4],
      [34, C - 8],
      [36, C + 10],
      [6, C + 18],
    ]);
    toon(ctx, 0xff8fab, 4, C - 8, 32, 26, { lineW: 3, noShine: true });
    block(ctx, 32, C - 10, 18, 20, 4, 0x6d597a);
    for (const dy of [-5, 5]) {
      roundRectPath(ctx, 48, C + dy - 5, 72, 10, 4);
      toon(ctx, 0xffffff, 48, C + dy - 5, 72, 10, { lineW: 2.5, noShine: true });
      ctx.save();
      roundRectPath(ctx, 48, C + dy - 5, 72, 10, 4);
      ctx.clip();
      ctx.strokeStyle = rgb(0xe63946);
      ctx.lineWidth = 4;
      for (let x = 46; x < 124; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, C + dy + 6);
        ctx.lineTo(x + 8, C + dy - 6);
        ctx.stroke();
      }
      ctx.restore();
      roundRectPath(ctx, 48, C + dy - 5, 72, 10, 4);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    // 包装硬糖泵把
    for (const s of [-1, 1]) {
      poly(ctx, [
        [78 + s * 8, C + 12],
        [78 + s * 16, C + 6],
        [78 + s * 16, C + 20],
      ]);
      toon(ctx, 0xffd166, 70, C + 6, 16, 14, { lineW: 2, noShine: true });
    }
    ctx.beginPath();
    ctx.ellipse(78, C + 13, 9, 7, 0, 0, Math.PI * 2);
    toon(ctx, 0x06d6a0, 69, C + 6, 18, 14, { lineW: 2.5 });
    ball(ctx, 122, C - 6, 4, 0xffd166, 2);
    ball(ctx, 122, C + 5, 4, 0x4cc9f0, 2);
  },

  // 龙息喷流：红色火锅燃料罐 + 黄色芥末导管，喷口是张嘴的龙头，嘴里吐出火焰
  dragon_breath_flame: (ctx) => {
    block(ctx, 22, C + 6, 14, 20, 4, 0x3d2c2e);
    ctx.beginPath();
    ctx.ellipse(26, C - 4, 22, 17, 0, 0, Math.PI * 2);
    toon(ctx, 0xd00000, 4, C - 21, 44, 34, { lineW: 3 });
    roundRectPath(ctx, 14, C - 25, 24, 6, 3);
    metal(ctx, 14, C - 25, 24, 6, 0xadb5bd);
    roundRectPath(ctx, 44, C - 7, 30, 12, 4);
    toon(ctx, 0xffc300, 44, C - 7, 30, 12, { lineW: 3, noShine: true });
    // 龙头
    poly(ctx, [
      [70, C - 14],
      [86, C - 18],
      [104, C - 12],
      [108, C - 5],
      [92, C - 2],
      [94, C + 3],
      [106, C + 8],
      [96, C + 14],
      [72, C + 12],
    ]);
    toon(ctx, 0x2d6a4f, 70, C - 18, 38, 32, { lineW: 3 });
    // 角
    poly(ctx, [
      [78, C - 15],
      [70, C - 28],
      [86, C - 17],
    ]);
    toon(ctx, 0xffe066, 70, C - 28, 16, 13, { lineW: 2, noShine: true });
    ball(ctx, 90, C - 10, 3, 0xffe066, 1.5, true);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(89.5, C - 12, 1.5, 4);
    flame(ctx, 112, C + 1, 12, 0xff5400);
    flame(ctx, 120, C - 4, 7, 0xffba08);
  },

  // 椰雷流星锤：木柄 + 粗铁链，末端是毛茸茸的椰子雷，壳上钉一圈尖刺并插着点燃的引线
  coconut_quake_mace: (ctx) => {
    handle(ctx, 4, 46, C, 11, 0x6f4518);
    roundRectPath(ctx, 44, C - 6, 8, 12, 2);
    metal(ctx, 44, C - 6, 8, 12, 0x6c757d);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(57 + i * 8, C + i * 1.5, 5, 3.5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 4.5;
      ctx.stroke();
      ctx.strokeStyle = rgb(0xadb5bd);
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    // 尖刺
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const cx = 98,
        cy = C + 2;
      poly(ctx, [
        [cx + Math.cos(a - 0.18) * 16, cy + Math.sin(a - 0.18) * 16],
        [cx + Math.cos(a) * 28, cy + Math.sin(a) * 28],
        [cx + Math.cos(a + 0.18) * 16, cy + Math.sin(a + 0.18) * 16],
      ]);
      toon(ctx, 0xced4da, cx - 28, cy - 28, 56, 56, { lineW: 2, noShine: true });
    }
    ball(ctx, 98, C + 2, 18, 0x7f4f24, 3);
    ctx.strokeStyle = rgb(0x582f0e, 0.8);
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) {
      const x = 84 + i * 3.5;
      ctx.beginPath();
      ctx.moveTo(x, C - 12 + (i % 3) * 6);
      ctx.lineTo(x + 3, C - 8 + (i % 3) * 6);
      ctx.stroke();
    }
    for (const dx of [-6, 0, 6]) ball(ctx, 98 + dx, C + 10, 2, 0x3d2c2e, 1, true);
    line2(ctx, 2, 0xe9c46a, () => {
      ctx.beginPath();
      ctx.moveTo(104, C - 18);
      ctx.quadraticCurveTo(110, C - 26, 118, C - 24);
    });
    glow(ctx, 119, C - 24, 6, 0xffd166, 1);
  },

  // 霜星八角：八瓣八角飞镖，每瓣尖端包着冰晶、瓣里是冰蓝种子，中心一朵雪花
  anise_frost_storm: (ctx) => {
    glow(ctx, 64, C, 31, 0x90e0ef, 0.5);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const tx = 64 + Math.cos(a) * 29,
        ty = C + Math.sin(a) * 29;
      const p = a + Math.PI / 2;
      poly(ctx, [
        [64 + Math.cos(p) * 8, C + Math.sin(p) * 8],
        [tx, ty],
        [64 - Math.cos(p) * 8, C - Math.sin(p) * 8],
      ]);
      toon(ctx, 0x8c4a2f, 35, C - 29, 58, 58, { lineW: 2.5, noShine: true });
      ball(ctx, 64 + Math.cos(a) * 15, C + Math.sin(a) * 15, 2.8, 0xa2d2ff, 1.5, true);
      starPath(ctx, 64 + Math.cos(a) * 25, C + Math.sin(a) * 25, 5, 2, 4, a);
      toon(ctx, 0xe0fbfc, 59, C - 5, 10, 10, { lineW: 1.5, noShine: true });
    }
    ball(ctx, 64, C, 9, 0x48cae4, 2.5);
    flake(ctx, 64, C, 6, 0xffffff);
  },

  // 圣盐结界：一只斜着悬浮的白瓷盐瓶（金色十字、头顶金色光圈），瓶口洒出一道发光盐粒绕成光环，旁边飘薄荷叶
  holy_salt_barrier: (ctx) => {
    glow(ctx, 64, C, 32, 0xfff3b0, 0.4);
    // 盐粒光环（后半）
    ctx.strokeStyle = rgb(0xfff3b0, 0.6);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(64, C + 6, 46, 14, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    // 薄荷叶
    for (const [x, y, r] of [
      [20, C - 14, 0.6],
      [108, C + 18, -0.5],
      [16, C + 16, -0.4],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 8, 4, r, 0, Math.PI * 2);
      toon(ctx, 0x52b788, x - 8, y - 4, 16, 8, { lineW: 2, noShine: true });
      ctx.strokeStyle = rgb(0xb7e4c7);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(r) * 6, y - Math.sin(r) * 6);
      ctx.lineTo(x + Math.cos(r) * 6, y + Math.sin(r) * 6);
      ctx.stroke();
    }
    // 盐瓶（斜向右上）
    ctx.save();
    ctx.translate(60, C + 2);
    ctx.rotate(0.55);
    roundRectPath(ctx, -12, -14, 24, 34, 9);
    toon(ctx, 0xf8f9fa, -12, -14, 24, 34, { lineW: 3 });
    ctx.beginPath();
    ctx.ellipse(0, -15, 12, 9, 0, Math.PI, Math.PI * 2);
    ctx.closePath();
    metal(ctx, -12, -24, 24, 10, 0xc9d1d9);
    ctx.fillStyle = OUTLINE;
    for (const dx of [-5, 0, 5]) {
      ctx.beginPath();
      ctx.arc(dx, -19 + Math.abs(dx) * 0.2, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // 金色十字
    ctx.fillStyle = rgb(0xffc300);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 1.5;
    roundRectPath(ctx, -2.5, -6, 5, 18, 1.5);
    ctx.fill();
    ctx.stroke();
    roundRectPath(ctx, -7, -1, 14, 5, 1.5);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    // 光圈（瓶顶）
    ctx.save();
    ctx.translate(72, C - 18);
    ctx.rotate(0.55);
    ctx.beginPath();
    ctx.ellipse(0, -4, 13, 4, 0, 0, Math.PI * 2);
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = rgb(0xffd60a);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
    // 洒出的盐粒流 + 光环（前半）
    const grains: [number, number][] = [];
    for (let i = 0; i <= 14; i++) {
      const a = (i / 14) * Math.PI * 1.15 - 0.15;
      grains.push([64 + Math.cos(a) * 46, C + 6 + Math.sin(a) * 14]);
    }
    for (const [x, y] of [[82, C - 12], [92, C - 8], [102, C - 4], [108, C + 2], ...grains]) {
      glow(ctx, x, y, 4, 0xffffff, 0.8);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = rgb(0xadb5bd);
      ctx.lineWidth = 1;
      ctx.fillRect(x - 1.6, y - 1.6, 3.2, 3.2);
      ctx.strokeRect(x - 1.6, y - 1.6, 3.2, 3.2);
    }
    for (const [x, y] of [
      [100, C - 22],
      [30, C - 4],
    ]) {
      starPath(ctx, x, y, 5, 1.5, 4);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
  },

  // 烈焰菜刀：嵌着火炭的黑铁刀柄，焦黑刀身布满橙红熔裂纹，刃口发红光
  fz_knife_ember_mine: (ctx) => {
    glow(ctx, 90, C + 6, 30, 0xff5400, 0.35);
    roundRectPath(ctx, 6, C - 7, 44, 14, 6);
    toon(ctx, 0x2b2d42, 6, C - 7, 44, 14, { lineW: 3, noShine: true });
    for (const x of [16, 28, 40]) {
      glow(ctx, x, C, 6, 0xff7b00, 0.8);
      ball(ctx, x, C, 3, 0xff5400, 1.5, true);
    }
    poly(ctx, [
      [48, C - 13],
      [110, C - 9],
      [125, C - 2],
      [120, C + 4],
      [48, C + 11],
    ]);
    toon(ctx, 0x3d3d3d, 48, C - 13, 77, 24, { lineW: 3, noShine: true });
    // 刃口红光
    line2(ctx, 3, 0xff7b00, () => {
      ctx.beginPath();
      ctx.moveTo(52, C + 9);
      ctx.lineTo(118, C + 3.5);
    });
    // 熔裂纹
    ctx.strokeStyle = rgb(0xffb703);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(56, C - 6);
    ctx.lineTo(66, C - 1);
    ctx.lineTo(74, C - 7);
    ctx.lineTo(86, C);
    ctx.lineTo(96, C - 5);
    ctx.lineTo(108, C - 1);
    ctx.moveTo(74, C - 7);
    ctx.lineTo(78, C + 4);
    ctx.moveTo(96, C - 5);
    ctx.lineTo(100, C + 3);
    ctx.stroke();
    flame(ctx, 70, C - 18, 7, 0xff5400);
    flame(ctx, 100, C - 15, 6, 0xff9e00);
  },

  // 贯穿雷霆榴莲：一颗金黄刺榴莲弹头，前端伸出三叉电叉齿，后面接短弹体和尾翼，叉尖闪电
  fz_thunder_durian_volt_fork: (ctx) => {
    // 尾翼与弹体
    for (const s of [-1, 1]) {
      poly(ctx, [
        [22, C + s * 4],
        [8, C + s * 18],
        [4, C + s * 16],
        [12, C + s * 4],
      ]);
      toon(ctx, 0x6c757d, 4, C - 18, 18, 36, { lineW: 2.5, noShine: true });
    }
    roundRectPath(ctx, 10, C - 7, 34, 14, 5);
    metal(ctx, 10, C - 7, 34, 14, 0x495057);
    glow(ctx, 6, C, 8, 0x9bf6ff, 0.9);
    // 叉齿
    for (const dy of [-13, 0, 13]) {
      poly(ctx, [
        [80, C + dy - 3],
        [116, C + dy - 2],
        [124, C + dy],
        [116, C + dy + 2],
        [80, C + dy + 3],
      ]);
      metal(ctx, 80, C + dy - 3, 44, 6, 0xffd60a);
    }
    roundRectPath(ctx, 76, C - 16, 10, 32, 3);
    metal(ctx, 76, C - 16, 10, 32, 0xc9a227);
    // 榴莲
    starPath(ctx, 60, C, 25, 19, 14, 0);
    toon(ctx, 0xc9a227, 35, C - 25, 50, 50, { lineW: 2.5, noShine: true });
    ball(ctx, 60, C, 18, 0xe9d8a6, 2.5);
    bolt(
      ctx,
      [
        [54, C - 10],
        [64, C - 4],
        [56, C + 2],
        [66, C + 10],
      ],
      0xffd60a,
      3,
    );
    bolt(ctx, [
      [104, C - 22],
      [112, C - 16],
      [108, C - 12],
      [120, C - 7],
    ]);
    bolt(ctx, [
      [102, C + 22],
      [110, C + 17],
      [118, C + 22],
    ]);
  },

  // 鲜果餐盘飞碟：中空的白瓷环形盘，盘沿是一层层紫洋葱圈，盘上摆橙片、草莓和蓝莓
  fz_plate_frisbee_onion_boomerang: (ctx) => {
    ctx.beginPath();
    ctx.ellipse(64, C, 40, 25, 0, 0, Math.PI * 2);
    toon(ctx, 0x9d4edd, 24, C - 25, 80, 50, { lineW: 3 });
    ctx.strokeStyle = rgb(0xe0aaff);
    ctx.lineWidth = 2.5;
    for (const k of [0.92, 0.82]) {
      ctx.beginPath();
      ctx.ellipse(64, C, 40 * k, 25 * k, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(64, C, 29, 17, 0, 0, Math.PI * 2);
    toon(ctx, 0xf8f9fa, 35, C - 17, 58, 34, { lineW: 2.5 });
    // 中孔
    ctx.beginPath();
    ctx.ellipse(64, C, 10, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgb(0x2b1418);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // 橙片
    ctx.beginPath();
    ctx.arc(46, C - 4, 8, 0, Math.PI * 2);
    toon(ctx, 0xff9f1c, 38, C - 12, 16, 16, { lineW: 2, noShine: true });
    ctx.strokeStyle = rgb(0xfff3b0);
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(46, C - 4);
      ctx.lineTo(46 + Math.cos(a) * 6, C - 4 + Math.sin(a) * 6);
      ctx.stroke();
    }
    // 草莓
    ctx.beginPath();
    ctx.moveTo(78, C - 12);
    ctx.quadraticCurveTo(92, C - 12, 84, C + 1);
    ctx.quadraticCurveTo(72, C - 4, 78, C - 12);
    toon(ctx, 0xe63946, 74, C - 12, 16, 13, { lineW: 2 });
    ball(ctx, 70, C + 10, 4, 0x4361ee, 1.5);
    ball(ctx, 58, C + 11, 3.5, 0x4361ee, 1.5);
  },

  // 霜寒拐杖糖锤：红白螺纹长柄，锤头是一截竖立的粗拐杖糖柱，顶上压着冰川冰块、下沿挂冰锥
  fz_candy_cane_glacier_mortar: (ctx) => {
    const stripes = (x: number, y: number, w: number, h: number, r: number) => {
      roundRectPath(ctx, x, y, w, h, r);
      toon(ctx, 0xfff8f0, x, y, w, h, { lineW: 3, noShine: true });
      ctx.save();
      roundRectPath(ctx, x, y, w, h, r);
      ctx.clip();
      ctx.strokeStyle = rgb(0xe63946);
      ctx.lineWidth = 5;
      for (let k = -h; k < w + h; k += 11) {
        ctx.beginPath();
        ctx.moveTo(x + k, y + h);
        ctx.lineTo(x + k + h * 0.8, y);
        ctx.stroke();
      }
      ctx.restore();
      roundRectPath(ctx, x, y, w, h, r);
      ctx.strokeStyle = OUTLINE;
      ctx.lineWidth = 3;
      ctx.stroke();
    };
    stripes(4, C - 5, 80, 10, 5);
    // 锤头
    stripes(82, C - 22, 30, 42, 8);
    // 冰块
    poly(ctx, [
      [80, C - 18],
      [86, C - 28],
      [100, C - 30],
      [114, C - 26],
      [118, C - 16],
      [104, C - 14],
    ]);
    toon(ctx, 0xa2d2ff, 80, C - 30, 38, 16, { lineW: 2.5 });
    for (const x of [86, 96, 106]) {
      poly(ctx, [
        [x - 4, C + 19],
        [x + 4, C + 19],
        [x, C + 29],
      ]);
      toon(ctx, 0xcaf0f8, x - 4, C + 19, 8, 10, { lineW: 2, noShine: true });
    }
    roundRectPath(ctx, 110, C - 14, 10, 28, 4);
    toon(ctx, 0xbde0fe, 110, C - 14, 10, 28, { lineW: 2.5, noShine: true });
    flake(ctx, 115, C, 4, 0xffffff);
  },

  // 致命玉米散弹：玉米棒枪身，枪管外罩一层带孔的刨丝刀钢板，管口是三个并排喷孔
  fz_corn_scatter_grater_sweep: (ctx) => {
    block(ctx, 10, C + 4, 16, 24, 5, 0x8d5b3a);
    ctx.beginPath();
    ctx.ellipse(32, C - 2, 28, 14, 0, 0, Math.PI * 2);
    toon(ctx, 0xffd23f, 4, C - 16, 56, 28, { lineW: 3 });
    ctx.fillStyle = rgb(0xffffff, 0.35);
    for (let x = 12; x < 56; x += 7)
      for (let y = C - 10; y < C + 8; y += 6) {
        ctx.beginPath();
        ctx.ellipse(x + ((y / 6) % 2) * 3, y, 2.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    // 玉米叶
    poly(ctx, [
      [8, C + 2],
      [30, C - 2],
      [48, C + 14],
      [22, C + 12],
    ]);
    toon(ctx, 0x80b918, 8, C - 2, 40, 16, { lineW: 2.5, noShine: true });
    // 刨丝板枪管
    poly(ctx, [
      [54, C - 14],
      [116, C - 11],
      [116, C + 9],
      [54, C + 12],
    ]);
    metal(ctx, 54, C - 14, 62, 26, 0xc9d1d9);
    for (let x = 60; x < 112; x += 8)
      for (const dy of [-6, 1, 7]) {
        ctx.beginPath();
        ctx.ellipse(x + (dy === 1 ? 4 : 0), C + dy - 1, 2.5, 1.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = rgb(0x343a40);
        ctx.fill();
      }
    roundRectPath(ctx, 112, C - 14, 12, 26, 4);
    metal(ctx, 112, C - 14, 12, 26, 0x6c757d);
    for (const dy of [-8, -1, 6]) ball(ctx, 118, C + dy, 2.5, 0x212529, 1, true);
  },

  // 烈焰海胆雷：粉红火龙果肉做的圆雷，外面长满绿色鳞叶尖刺，表面点黑籽，顶上燃着火苗
  fz_sea_urchin_mine_dragonfruit_orb: (ctx) => {
    glow(ctx, 64, C + 2, 32, 0xff5400, 0.4);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.13;
      const cx = 64,
        cy = C + 4;
      poly(ctx, [
        [cx + Math.cos(a - 0.22) * 16, cy + Math.sin(a - 0.22) * 16],
        [cx + Math.cos(a) * 29, cy + Math.sin(a) * 25],
        [cx + Math.cos(a + 0.22) * 16, cy + Math.sin(a + 0.22) * 16],
      ]);
      toon(ctx, 0x70e000, cx - 29, cy - 27, 58, 54, { lineW: 2, noShine: true });
    }
    ball(ctx, 64, C + 4, 18, 0xf72585, 3);
    ctx.fillStyle = OUTLINE;
    for (const [x, y] of [
      [56, C - 4],
      [70, C - 6],
      [62, C + 6],
      [76, C + 6],
      [52, C + 12],
      [66, C + 16],
    ]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 1.6, 2.2, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    roundRectPath(ctx, 58, C - 22, 12, 8, 2);
    metal(ctx, 58, C - 22, 12, 8, 0x6c757d);
    flame(ctx, 64, C - 22, 6, 0xff5400);
  },

  // 散射双持菜刀：一根握柄分叉出上下两片菜刀刃（呈 V 形张开），叉口嵌一只番茄酱瓶嘴往前喷酱滴
  fz_twin_cleavers_ketchup: (ctx) => {
    handle(ctx, 4, 44, C, 12, 0x3d2c2e);
    for (const s of [-1, 1]) {
      poly(ctx, [
        [44, C + s * 2],
        [118, C + s * 14],
        [122, C + s * 24],
        [110, C + s * 29],
        [44, C + s * 14],
      ]);
      metal(ctx, 44, C - 29, 78, 58, 0xdee2e6);
      shine(ctx, 50, C + s * 12, 112, C + s * 25, 0.7);
    }
    // 番茄酱瓶嘴
    ctx.beginPath();
    ctx.moveTo(42, C - 9);
    ctx.lineTo(66, C - 9);
    ctx.quadraticCurveTo(74, C - 9, 76, C - 3);
    ctx.lineTo(88, C - 2);
    ctx.lineTo(88, C + 2);
    ctx.lineTo(76, C + 3);
    ctx.quadraticCurveTo(74, C + 9, 66, C + 9);
    ctx.lineTo(42, C + 9);
    ctx.closePath();
    toon(ctx, 0xd00000, 42, C - 9, 46, 18, { lineW: 3 });
    roundRectPath(ctx, 48, C - 5, 14, 10, 2);
    ctx.fillStyle = '#fff3e0';
    ctx.fill();
    ball(ctx, 55, C, 3, 0xe63946, 1, true);
    for (const [x, y, r] of [
      [96, C, 4],
      [106, C - 3, 3],
      [114, C + 2, 3.5],
    ])
      ball(ctx, x, y, r, 0xe63946, 1.5);
  },

  // 烈焰果冻弹：半透明粉色果冻发射筒（Q 弹波浪轮廓），侧面嵌一枚红色剁椒飞轮当弹仓，管口冒火
  fz_jelly_bounce_chili_shuriken: (ctx) => {
    block(ctx, 14, C + 4, 16, 24, 6, 0xc9184a);
    ctx.beginPath();
    ctx.moveTo(8, C - 10);
    for (let i = 0; i < 6; i++) ctx.quadraticCurveTo(18 + i * 18, C - 22, 26 + i * 18, C - 12);
    ctx.lineTo(116, C - 8);
    ctx.lineTo(116, C + 8);
    for (let i = 5; i >= 0; i--) ctx.quadraticCurveTo(18 + i * 18, C + 18, 8 + i * 18, C + 10);
    ctx.closePath();
    toon(ctx, 0xff70a6, 8, C - 20, 108, 36, { lineW: 3 });
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(40, C - 8, 20, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const [x, y] of [
      [70, C + 6],
      [94, C - 4],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();
    }
    // 剁椒飞轮弹仓
    starPath(ctx, 52, C, 17, 12, 8, 0.2);
    toon(ctx, 0xd00000, 35, C - 17, 34, 34, { lineW: 2.5 });
    ball(ctx, 52, C, 6, 0x6c757d, 2, true);
    roundRectPath(ctx, 112, C - 10, 10, 20, 4);
    toon(ctx, 0xc9184a, 112, C - 10, 10, 20, { lineW: 2.5, noShine: true });
    flame(ctx, 120, C - 4, 8, 0xff5400);
  },

  // 蚀骨冰沙喷雾：一大杯带圆顶盖的冰沙当燃料罐，杯身淌焦糖，吸管弯成喷嘴往前喷冰雾
  fz_slush_spray_caramel_aura: (ctx) => {
    block(ctx, 30, C + 10, 12, 18, 4, 0x6c757d);
    poly(ctx, [
      [6, C - 12],
      [50, C - 12],
      [46, C + 20],
      [10, C + 20],
    ]);
    toon(ctx, 0x90e0ef, 6, C - 12, 44, 32, { lineW: 3 });
    // 焦糖淌下
    ctx.beginPath();
    ctx.moveTo(6, C - 12);
    ctx.lineTo(50, C - 12);
    ctx.lineTo(49, C - 4);
    ctx.quadraticCurveTo(44, C + 6, 40, C - 3);
    ctx.quadraticCurveTo(32, C + 2, 26, C - 4);
    ctx.quadraticCurveTo(18, C + 10, 14, C - 3);
    ctx.lineTo(7, C - 4);
    ctx.closePath();
    toon(ctx, 0xbc6c25, 6, C - 12, 44, 18, { lineW: 2, noShine: true });
    // 圆顶盖
    ctx.beginPath();
    ctx.moveTo(4, C - 12);
    ctx.bezierCurveTo(6, C - 30, 50, C - 30, 52, C - 12);
    ctx.closePath();
    toon(ctx, 0xe0fbfc, 4, C - 26, 48, 14, { lineW: 2.5 });
    // 吸管喷嘴
    line2(ctx, 5, 0xff4d6d, () => {
      ctx.beginPath();
      ctx.moveTo(30, C - 24);
      ctx.lineTo(36, C - 28);
      ctx.lineTo(70, C - 6);
      ctx.lineTo(92, C - 4);
    });
    roundRectPath(ctx, 88, C - 9, 12, 10, 3);
    metal(ctx, 88, C - 9, 12, 10, 0x6c757d);
    // 冰雾
    for (const [x, y, r] of [
      [106, C - 4, 6],
      [116, C - 10, 5],
      [118, C + 2, 5.5],
      [110, C + 8, 4],
    ])
      ball(ctx, x, y, r, 0xcaf0f8, 2, true);
    flake(ctx, 114, C - 3, 4, 0xffffff);
  },

  // 酱爆烤串签：酱油瓶改成的手枪握把带扳机，前面伸出长竹签，签上串着刷了酱油的焦糖色肉块，滴着酱汁
  fz_skewer_soy_pistol: (ctx) => {
    // 握把（酱油瓶）
    roundRectPath(ctx, 8, C - 8, 34, 16, 5);
    toon(ctx, 0x582f0e, 8, C - 8, 34, 16, { lineW: 3 });
    poly(ctx, [
      [14, C + 4],
      [28, C + 4],
      [24, C + 26],
      [10, C + 26],
    ]);
    toon(ctx, 0x3d2c2e, 10, C + 4, 18, 22, { lineW: 3, noShine: true });
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(34, C + 12, 5, 0, Math.PI);
    ctx.stroke();
    roundRectPath(ctx, 14, C - 5, 18, 8, 2);
    ctx.fillStyle = '#fff3e0';
    ctx.fill();
    ctx.fillStyle = OUTLINE;
    ctx.font = 'bold 7px sans-serif';
    ctx.fillText('SOY', 16, C + 2);
    // 竹签
    line2(ctx, 3, 0xe9c46a, () => {
      ctx.beginPath();
      ctx.moveTo(42, C);
      ctx.lineTo(124, C);
    });
    for (const [x, c] of [
      [56, 0x9c4221],
      [74, 0x7f4f24],
      [92, 0x9c4221],
      [108, 0x7f4f24],
    ]) {
      roundRectPath(ctx, x - 7, C - 9, 14, 18, 5);
      toon(ctx, c, x - 7, C - 9, 14, 18, { lineW: 2.5 });
      ctx.strokeStyle = rgb(0x3d2c2e, 0.8);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 5, C - 3);
      ctx.lineTo(x + 5, C - 6);
      ctx.moveTo(x - 5, C + 4);
      ctx.lineTo(x + 5, C + 1);
      ctx.stroke();
    }
    for (const [x, h] of [
      [66, 7],
      [100, 10],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x - 2, C + 8);
      ctx.quadraticCurveTo(x + 4, C + 8 + h, x, C + 9 + h);
      ctx.quadraticCurveTo(x - 4, C + 8 + h, x - 2, C + 8);
      toon(ctx, 0x3d2c2e, x - 4, C + 8, 8, h + 1, { lineW: 1.5, noShine: true });
    }
  },

  // 霜寒黄瓜武士刀：易拉罐做的蓝色刀柄与圆形拉环刀镡，弧形黄瓜刀身结霜，刀面冒汽水气泡
  fz_cucumber_katana_soda: (ctx) => {
    roundRectPath(ctx, 4, C - 7, 32, 14, 5);
    metal(ctx, 4, C - 7, 32, 14, 0x4cc9f0);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px sans-serif';
    ctx.fillText('SODA', 8, C + 3);
    // 黄瓜刀身（微弧）
    ctx.beginPath();
    ctx.moveTo(40, C - 6);
    ctx.quadraticCurveTo(90, C - 14, 126, C - 12);
    ctx.quadraticCurveTo(96, C + 2, 40, C + 7);
    ctx.closePath();
    toon(ctx, 0x2d6a4f, 40, C - 14, 86, 21, { lineW: 3 });
    ctx.strokeStyle = rgb(0xd8f3dc);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(44, C + 4);
    ctx.quadraticCurveTo(90, C - 2, 118, C - 10);
    ctx.stroke();
    for (const [x, y] of [
      [56, C - 3],
      [72, C - 5],
      [88, C - 7],
      [104, C - 9],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#b7e4c7';
      ctx.fill();
    }
    // 拉环刀镡
    ctx.beginPath();
    ctx.ellipse(38, C, 5, 14, 0, 0, Math.PI * 2);
    metal(ctx, 33, C - 14, 10, 28, 0xc9d1d9);
    ctx.beginPath();
    ctx.ellipse(38, C - 6, 2, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = OUTLINE;
    ctx.fill();
    // 气泡与冰晶
    for (const [x, y, r] of [
      [70, C - 20, 4],
      [84, C - 24, 3],
      [100, C - 22, 3.5],
      [62, C + 14, 3],
    ]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,240,255,0.8)';
      ctx.fill();
      ctx.strokeStyle = '#48cae4';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    flake(ctx, 114, C + 4, 5);
  },

  // 锐锋玉米加农：玉米棒炮身沿上下两侧装满锯齿刀刃，炮口套着旋转的风刃圈
  fz_corn_cannon_blade_aura: (ctx) => {
    block(ctx, 10, C + 6, 16, 22, 5, 0x6b4226);
    for (const s of [-1, 1])
      for (let x = 22; x < 100; x += 12) {
        poly(ctx, [
          [x, C + s * 10],
          [x + 12, C + s * 10],
          [x + 15, C + s * 27],
        ]);
        metal(ctx, x, C - 27, 15, 54, 0xdee2e6);
      }
    roundRectPath(ctx, 8, C - 13, 98, 26, 12);
    toon(ctx, 0xffd23f, 8, C - 13, 98, 26, { lineW: 3 });
    ctx.save();
    roundRectPath(ctx, 8, C - 13, 98, 26, 12);
    ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    for (let x = 14; x < 104; x += 9)
      for (let y = C - 10; y < C + 12; y += 8) {
        ctx.beginPath();
        ctx.ellipse(x + ((y / 8) % 2) * 4, y, 3, 2.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    ctx.restore();
    // 风刃圈
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(112, C, 8, 18, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = rgb(0xa8dadc);
    ctx.lineWidth = 3;
    ctx.stroke();
    for (const a of [-1.2, 0.4, 2]) {
      line2(ctx, 2, 0xe0fbfc, () => {
        ctx.beginPath();
        ctx.ellipse(112, C, 12, 24, 0, a, a + 0.9);
      });
    }
    ctx.beginPath();
    ctx.ellipse(108, C, 4, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = rgb(0x3d2c2e);
    ctx.fill();
  },

  // 酱爆电烤架：长柄顶端一块方形烤网，网上烤着黑胡椒粒，网格间电弧跳动
  fz_grill_arc_pepper_storm_aura: (ctx) => {
    handle(ctx, 4, 74, C, 9, 0x495057);
    roundRectPath(ctx, 70, C - 5, 10, 10, 2);
    metal(ctx, 70, C - 5, 10, 10, 0x6c757d);
    glow(ctx, 101, C, 28, 0x9bf6ff, 0.35);
    roundRectPath(ctx, 78, C - 25, 46, 50, 6);
    ctx.fillStyle = rgb(0x212529, 0.75);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.strokeStyle = rgb(0xadb5bd);
    ctx.lineWidth = 2.5;
    ctx.stroke();
    for (let x = 87; x < 120; x += 8) {
      line2(ctx, 2, 0xced4da, () => {
        ctx.beginPath();
        ctx.moveTo(x, C - 23);
        ctx.lineTo(x, C + 23);
      });
    }
    for (const [x, y] of [
      [91, C - 14],
      [107, C - 6],
      [99, C + 10],
      [115, C + 16],
      [113, C - 18],
    ])
      ball(ctx, x, y, 3.5, 0x3d2c2e, 1.5);
    bolt(ctx, [
      [82, C - 4],
      [92, C + 2],
      [88, C + 6],
      [104, C + 4],
      [100, C + 12],
      [120, C + 6],
    ]);
  },

  // 烈焰茶壶雷暴：炭黑铸铁茶壶，壶身裂纹透出橙色炭火，壶嘴朝右喷出闪电，壶盖顶冒火
  fz_teapot_storm_charcoal_aura: (ctx) => {
    // 把手
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(24, C + 2, 14, Math.PI * 0.5, Math.PI * 1.5);
    ctx.stroke();
    ctx.strokeStyle = rgb(0x495057);
    ctx.lineWidth = 5;
    ctx.stroke();
    // 壶嘴
    ctx.beginPath();
    ctx.moveTo(70, C + 2);
    ctx.lineTo(98, C - 14);
    ctx.lineTo(104, C - 10);
    ctx.lineTo(80, C + 14);
    ctx.closePath();
    toon(ctx, 0x343a40, 70, C - 14, 34, 28, { lineW: 3, noShine: true });
    // 壶身
    ctx.beginPath();
    ctx.ellipse(50, C + 6, 28, 22, 0, 0, Math.PI * 2);
    toon(ctx, 0x343a40, 22, C - 16, 56, 44, { lineW: 3 });
    ctx.strokeStyle = rgb(0xff7b00);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(34, C + 2);
    ctx.lineTo(44, C + 8);
    ctx.lineTo(40, C + 16);
    ctx.moveTo(44, C + 8);
    ctx.lineTo(58, C + 4);
    ctx.lineTo(64, C + 14);
    ctx.moveTo(58, C + 4);
    ctx.lineTo(60, C - 6);
    ctx.stroke();
    glow(ctx, 48, C + 8, 12, 0xff5400, 0.5);
    // 壶盖
    ctx.beginPath();
    ctx.ellipse(50, C - 15, 15, 5, 0, 0, Math.PI * 2);
    toon(ctx, 0x495057, 35, C - 20, 30, 10, { lineW: 2.5, noShine: true });
    ball(ctx, 50, C - 21, 4, 0xff5400, 2);
    flame(ctx, 50, C - 24, 5, 0xff9e00);
    bolt(
      ctx,
      [
        [102, C - 14],
        [112, C - 20],
        [110, C - 10],
        [122, C - 16],
      ],
      0x9bf6ff,
      3,
    );
    bolt(ctx, [
      [104, C - 6],
      [114, C - 2],
      [122, C - 6],
    ]);
  },
};

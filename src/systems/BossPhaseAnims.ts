// 各 Boss 转阶段的专属动画（设计见 docs/design/BOSS_PHASES.md 第 3 节各 Boss 的「动画」行）。
// 键 = `Boss id:阶段序号`（序号从 0 开始，1 = 进入第 2 阶段）。
// start：转阶段开始（定格段）；charge：蓄势段每帧（k 为 0→1 进度）；burst：爆发瞬间；aura：进入该阶段后的常驻外观。
import type { GameScene } from '../scenes/GameScene';
import type { Enemy } from '../objects/Enemy';
import type { AuraSpec } from './BossAura';
import { portraitKey } from '../ui/Portrait';
import {
  fling,
  smoke,
  rings,
  converge,
  liftOff,
  submerge,
  popLid,
  shell,
  wings,
  rays,
  flash,
  scanline,
  waveSweep,
  silhouettes,
  lobBall,
  snip,
} from './BossFxKit';

export interface AnimCtx {
  g: GameScene;
  e: Enemy;
  /** 本次转阶段的场地变化里的障碍物 / 淹没圆心（已换算成场地坐标），供动画对准落点 */
  targets: { x: number; y: number; r: number }[];
  /** 动画之间共享的临时状态（比如茧的破壳函数） */
  mem: Record<string, unknown>;
}

export interface PhaseAnim {
  start?(c: AnimCtx): void;
  charge?(c: AnimCtx, k: number): void;
  burst?(c: AnimCtx): void;
  aura?: AuraSpec[];
}

const at = (c: AnimCtx, ms: number, fn: () => void) => c.g.time.delayedCall(ms, () => c.e.alive && fn());

export const PHASE_ANIMS: Record<string, PhaseAnim> = {
  // ════════ 第 1 章 ════════
  // 霉菌大王 Ⅱ：身体鼓胀后「噗」地喷出一团孢子云，长出绒毛霉斑
  'mold_king:1': {
    start: (c) => converge(c.g, c.e, 0x9ccc65, 12),
    burst: (c) => {
      smoke(c.g, c.e.x, c.e.y, 0x9ccc65, 12, 160, 1.4);
      fling(c.g, c.e.x, c.e.y, { n: 14, color: 0x7cb342, size: 9, shape: 'drop' });
    },
    aura: [{ kind: 'glow', color: 0x9ccc65 }],
  },
  // 霉菌大王 Ⅲ：裂成 3 块又重新黏合，霉斑发绿光
  'mold_king:2': {
    start: (c) => {
      fling(c.g, c.e.x, c.e.y, { n: 3, color: 0x558b2f, size: c.e.radius * 0.9, speed: 160, up: 80, life: 0.7, shape: 'chunk' });
    },
    charge: (c, k) => c.e.rig?.setAlpha(0.4 + 0.6 * k),
    burst: (c) => {
      converge(c.g, c.e, 0x76ff03, 16, 160);
      rings(c.g, c.e.x, c.e.y, 0x76ff03, 2, c.e.radius * 2);
    },
    aura: [
      { kind: 'glow', color: 0x76ff03 },
      { kind: 'smoke', color: 0x9ccc65 },
    ],
  },
  // 油烟怪厨 Ⅱ：锅盖被蒸汽顶飞，冒出浓烟柱
  'grease_chef:1': {
    start: (c) => at(c, 300, () => popLid(c.g, c.e, 0x9e9e9e)),
    charge: (c, k) => {
      if (Math.random() < 0.25) smoke(c.g, c.e.x, c.e.y - c.e.radius, 0xeeeeee, 1, 200 * k + 80, 0.8);
    },
    burst: (c) => smoke(c.g, c.e.x, c.e.y - c.e.radius, 0xffffff, 10, 260, 1.3),
    aura: [{ kind: 'smoke', color: 0xe0e0e0 }],
  },
  // 油烟怪厨 Ⅲ：全身燃起油火，黑烟拖尾
  'grease_chef:2': {
    charge: (c) => {
      if (Math.random() < 0.4) c.g.fx.burst(c.e.x, c.e.y, 0xff9800, 2);
    },
    burst: (c) => {
      rays(c.g, c.e, 0xff6d00, 8);
      smoke(c.g, c.e.x, c.e.y, 0x212121, 10, 200, 1.4);
    },
    aura: [
      { kind: 'flame', color: 0xff6d00 },
      { kind: 'smoke', color: 0x424242 },
    ],
  },
  // 蟑螂皇帝 Ⅱ：翅膀张开振动，地面涌出虫影
  'cockroach_emperor:1': {
    start: (c) => wings(c.g, c.e, 0xd7ccc8, 1.6),
    charge: (c) => {
      if (Math.random() < 0.3) converge(c.g, c.e, 0x3e2723, 2, 320);
    },
    burst: (c) => fling(c.g, c.e.x, c.e.y, { n: 12, color: 0x4e342e, size: 8, speed: 380, up: 40, shape: 'leaf' }),
  },
  // 蟑螂皇帝 Ⅲ：结成虫茧，破茧后外壳换成暗金色
  'cockroach_emperor:2': {
    start: (c) => {
      c.mem.crack = shell(c.g, c.e, 0x8d6e63);
    },
    burst: (c) => {
      (c.mem.crack as (() => void) | undefined)?.();
      rays(c.g, c.e, 0xffd54f, 10);
    },
    aura: [{ kind: 'glow', color: 0xffd54f }],
  },

  // ════════ 第 2 章 ════════
  // 蝗虫女皇 Ⅱ：升空盘旋，翅膀扇起风压
  'locust_queen:1': {
    start: (c) => {
      liftOff(c.g, c.e, 1.6);
      wings(c.g, c.e, 0xc5e1a5, 1.6);
    },
    charge: (c) => {
      if (Math.random() < 0.3) c.g.fx.ring(c.e.x, c.e.y, c.e.radius * 2.5, 0xdcedc8, 300);
    },
    burst: (c) => rings(c.g, c.e.x, c.e.y, 0xcddc39, 3, c.e.radius * 2),
  },
  // 蝗虫女皇 Ⅲ：身边虫影越来越多，形成虫群光环
  'locust_queen:2': {
    charge: (c) => {
      if (Math.random() < 0.4) converge(c.g, c.e, 0x33691e, 2, 300);
    },
    burst: (c) => fling(c.g, c.e.x, c.e.y, { n: 18, color: 0x558b2f, size: 7, speed: 420, up: 30, shape: 'leaf' }),
    aura: [{ kind: 'orbit', color: 0x33691e, n: 8 }],
  },
  // 腐烂南瓜王 Ⅱ：灯火从橙变紫
  'rotten_pumpkin:1': {
    charge: (c, k) => {
      if (Math.random() < 0.3) c.g.fx.burst(c.e.x, c.e.y - c.e.radius * 0.2, k < 0.5 ? 0xff9800 : 0x9c27b0, 2);
    },
    burst: (c) => rays(c.g, c.e, 0xba68c8, 6),
    aura: [{ kind: 'glow', color: 0x9c27b0 }],
  },
  // 腐烂南瓜王 Ⅲ：表面裂开，裂缝喷出籽和火光
  'rotten_pumpkin:2': {
    burst: (c) => {
      rays(c.g, c.e, 0xff6d00, 9, 320);
      fling(c.g, c.e.x, c.e.y, { n: 20, color: 0xfff3c4, size: 7, speed: 420, shape: 'drop' });
    },
    aura: [{ kind: 'flame', color: 0xff6d00 }],
  },
  // 鼹鼠大将 Ⅱ：钻进地下，从另一处破土而出
  'mole_general:1': {
    start: (c) => submerge(c.g, c.e, 0x6d4c41, 1.6),
  },
  // 鼹鼠大将 Ⅲ：戴上将军头盔，吹号角震出冲击波
  'mole_general:2': {
    charge: (c, k) => {
      if (k > 0.5 && Math.random() < 0.2) c.g.fx.ring(c.e.x, c.e.y, c.e.radius * 1.5, 0xffb300, 250);
    },
    burst: (c) => {
      rings(c.g, c.e.x, c.e.y, 0xffb300, 3, c.e.radius * 2.2, 160);
      fling(c.g, c.e.x, c.e.y, { n: 10, color: 0x6d4c41, size: 12, shape: 'chunk' });
    },
    aura: [{ kind: 'glow', color: 0xffb300 }],
  },

  // ════════ 第 3 章 ════════
  // 冰霜鼠王 Ⅱ：吸入寒气，身体结一层霜
  'frost_rat_king:1': {
    start: (c) => converge(c.g, c.e, 0xb3e5fc, 16, 260),
    charge: (c) => {
      if (Math.random() < 0.3) converge(c.g, c.e, 0xe1f5fe, 2, 240);
    },
    burst: (c) => {
      fling(c.g, c.e.x, c.e.y, { n: 12, color: 0xe1f5fe, size: 10, shape: 'shard' });
      flash(c.g, 0xb3e5fc, 200);
    },
  },
  // 冰霜鼠王 Ⅲ：冰冠变大，身边常驻冰晶飘落
  'frost_rat_king:2': {
    burst: (c) => {
      fling(c.g, c.e.x, c.e.y, { n: 16, color: 0x81d4fa, size: 12, speed: 360, shape: 'shard' });
      rings(c.g, c.e.x, c.e.y, 0x4fc3f7, 2, c.e.radius * 2.4);
    },
    aura: [
      { kind: 'orbit', color: 0xb3e5fc, n: 6 },
      { kind: 'snow', color: 0xffffff },
    ],
  },
  // 冰淇淋暴君 Ⅱ / Ⅲ：最上面的冰淇淋球掉下来滚走，落到障碍物的位置
  'ice_cream_tyrant:1': {
    start: (c) => {
      const t = c.targets[0];
      if (t) at(c, 350, () => lobBall(c.g, c.e, t.x, t.y, t.r, 0xf8bbd0, 1100));
    },
    burst: (c) => fling(c.g, c.e.x, c.e.y - c.e.radius, { n: 10, color: 0xfce4ec, size: 9, shape: 'drop' }),
  },
  'ice_cream_tyrant:2': {
    start: (c) => {
      const t = c.targets[0];
      if (t) at(c, 350, () => lobBall(c.g, c.e, t.x, t.y, t.r, 0xb2dfdb, 1100));
    },
    burst: (c) => fling(c.g, c.e.x, c.e.y - c.e.radius, { n: 12, color: 0xff80ab, size: 9, shape: 'drop' }),
    // 最后一球开始融化滴落
    aura: [{ kind: 'drip', color: 0xff80ab }],
  },
  // 冰柜之心 Ⅱ：冰壳出现裂纹，蓝光变强
  'freezer_heart:1': {
    start: (c) => {
      c.mem.crack = shell(c.g, c.e, 0xb3e5fc);
    },
    burst: (c) => {
      // 只裂不碎：裂纹壳淡出，换成蓝色光晕
      (c.mem.crack as (() => void) | undefined)?.();
      rays(c.g, c.e, 0x40c4ff, 6);
    },
    aura: [{ kind: 'glow', color: 0x40c4ff }],
  },
  // 冰柜之心 Ⅲ：冰壳崩碎，露出过热发红的核心，警报闪烁
  'freezer_heart:2': {
    charge: (c, k) => {
      if (k > 0.3 && Math.random() < 0.08) flash(c.g, 0xff5252, 120);
    },
    burst: (c) => {
      fling(c.g, c.e.x, c.e.y, { n: 22, color: 0xe1f5fe, size: 14, speed: 420, shape: 'shard' });
      rays(c.g, c.e, 0xff5252, 8);
    },
    aura: [
      { kind: 'alarm', color: 0xff1744 },
      { kind: 'sparks', color: 0xff8a80 },
    ],
  },
};

Object.assign(PHASE_ANIMS, {
  // ════════ 第 4 章 ════════
  // 垃圾巨像 Ⅱ / Ⅲ：身上掉下垃圾块（垃圾袋小怪从这里生成），越来越小、越来越快
  'trash_golem:1': {
    start: (c) => fling(c.g, c.e.x, c.e.y, { n: 8, color: 0x5d4037, size: 18, speed: 220, shape: 'chunk' }),
    burst: (c) => fling(c.g, c.e.x, c.e.y, { n: 12, color: 0x8d6e63, size: 14, speed: 320, shape: 'chunk' }),
  },
  'trash_golem:2': {
    start: (c) => fling(c.g, c.e.x, c.e.y, { n: 12, color: 0x4e342e, size: 18, speed: 260, shape: 'chunk' }),
    burst: (c) => {
      fling(c.g, c.e.x, c.e.y, { n: 16, color: 0x9e9e9e, size: 12, speed: 380, shape: 'shard' });
      rays(c.g, c.e, 0xffab40, 6);
    },
    // 只剩骨架：火星四溅
    aura: [{ kind: 'sparks', color: 0xffab40 }],
  },
  // 毒液桶魔 Ⅱ：桶盖崩飞，绿色毒液向四方喷涌
  'toxic_barrel:1': {
    start: (c) => at(c, 250, () => popLid(c.g, c.e, 0x546e7a, 1)),
    burst: (c) => {
      for (let i = 0; i < 4; i++)
        at(c, i * 60, () =>
          fling(c.g, c.e.x, c.e.y - c.e.radius * 0.6, { n: 6, color: 0x76ff03, size: 10, speed: 300, up: 300, shape: 'drop' }),
        );
      smoke(c.g, c.e.x, c.e.y, 0x76ff03, 6, 120);
    },
    aura: [{ kind: 'drip', color: 0x76ff03 }],
  },
  // 毒液桶魔 Ⅲ：桶身裂开多处，持续滴毒冒泡
  'toxic_barrel:2': {
    burst: (c) => {
      rays(c.g, c.e, 0x64dd17, 7);
      fling(c.g, c.e.x, c.e.y, { n: 20, color: 0x64dd17, size: 10, speed: 360, shape: 'drop' });
    },
    aura: [
      { kind: 'drip', color: 0x64dd17 },
      { kind: 'smoke', color: 0x9ccc65 },
    ],
  },
  // 废铁巨龙 Ⅱ：振翅升空（影子留在地面），落地
  'scrap_dragon:1': {
    start: (c) => {
      liftOff(c.g, c.e, 1.8);
      wings(c.g, c.e, 0x90a4ae, 1.8);
    },
    burst: (c) => {
      rings(c.g, c.e.x, c.e.y, 0xff7043, 2, c.e.radius * 2);
      fling(c.g, c.e.x, c.e.y, { n: 10, color: 0x78909c, size: 10, shape: 'shard' });
    },
  },
  // 废铁巨龙 Ⅲ：胸口装甲打开，露出发红的熔炉，喷出火星
  'scrap_dragon:2': {
    charge: (c) => {
      if (Math.random() < 0.3) c.g.fx.burst(c.e.x, c.e.y, 0xff3d00, 2);
    },
    burst: (c) => {
      fling(c.g, c.e.x, c.e.y, { n: 8, color: 0x607d8b, size: 16, shape: 'shard' });
      rays(c.g, c.e, 0xff3d00, 10, 300);
    },
    aura: [
      { kind: 'glow', color: 0xff3d00 },
      { kind: 'sparks', color: 0xffab40 },
    ],
  },

  // ════════ 第 5 章 ════════
  // 腐烂大厨 Ⅱ：抄起大汤勺敲锅，锅里冒出黑烟
  'rotten_chef:1': {
    charge: (c, k) => {
      if (k > 0.4 && Math.random() < 0.12) c.g.fx.ring(c.e.x, c.e.y, c.e.radius * 1.8, 0xd84315, 200);
    },
    burst: (c) => {
      rings(c.g, c.e.x, c.e.y, 0xd84315, 3, c.e.radius * 2, 140);
      smoke(c.g, c.e.x, c.e.y, 0x212121, 12, 220, 1.4);
    },
    aura: [{ kind: 'smoke', color: 0x424242 }],
  },
  // 腐烂大厨 Ⅲ：撕掉厨师帽，眼睛发红，身后燃起黑色火焰
  'rotten_chef:2': {
    start: (c) => at(c, 300, () => popLid(c.g, c.e, 0xffffff, 0.9)),
    burst: (c) => {
      rays(c.g, c.e, 0x6a1b9a, 8);
      smoke(c.g, c.e.x, c.e.y, 0x311b92, 10, 200, 1.3);
    },
    aura: [
      { kind: 'flame', color: 0x7b1fa2 },
      { kind: 'smoke', color: 0x212121 },
    ],
  },
  // 工厂主脑 Ⅱ：「协议 2 启动」扫描线，展开护盾环
  'factory_core:1': {
    start: (c) => scanline(c.g, 0x40c4ff, 1200),
    burst: (c) => rings(c.g, c.e.x, c.e.y, 0x40c4ff, 2, c.e.radius * 2),
    aura: [{ kind: 'shield', color: 0x40c4ff }],
  },
  // 工厂主脑 Ⅲ：红色警报闪烁，核心从蓝变红并高速旋转
  'factory_core:2': {
    start: (c) => {
      scanline(c.g, 0xff1744, 1000);
      flash(c.g, 0xff1744, 160, 3);
    },
    burst: (c) => rays(c.g, c.e, 0xff1744, 12, 320),
    aura: [
      { kind: 'alarm', color: 0xff1744 },
      { kind: 'sparks', color: 0xff8a80 },
    ],
  },
  // 番茄酱海怪 Ⅱ：沉入酱池（只剩触手），在附近翻涌冒出
  'ketchup_leviathan:1': {
    start: (c) => submerge(c.g, c.e, 0xc62828, 1.6),
  },
  // 番茄酱海怪 Ⅲ：掀起酱浪从场地一侧扫过，之后半场保持被淹
  'ketchup_leviathan:2': {
    start: (c) => at(c, 500, () => waveSweep(c.g, 0xc62828, true, 1000)),
    burst: (c) => fling(c.g, c.e.x, c.e.y, { n: 16, color: 0xe53935, size: 12, speed: 360, shape: 'drop' }),
    aura: [{ kind: 'drip', color: 0xc62828 }],
  },

  // ════════ 第 6 章 ════════
  // 枯萎园丁 Ⅱ：修枝剪「咔嚓」一合，周围冒出一圈毒苗
  'blight_gardener:1': {
    start: (c) => at(c, 400, () => snip(c.g, c.e)),
    burst: (c) => fling(c.g, c.e.x, c.e.y, { n: 16, color: 0x8bc34a, size: 10, speed: 320, shape: 'leaf' }),
  },
  // 枯萎园丁 Ⅲ：背后长出枯藤翅膀，园丁帽被藤蔓缠住
  'blight_gardener:2': {
    start: (c) => wings(c.g, c.e, 0x558b2f, 1.8),
    burst: (c) => {
      for (const t of c.targets) fling(c.g, t.x, t.y, { n: 6, color: 0x33691e, size: 10, up: 260, shape: 'leaf' });
      rays(c.g, c.e, 0x9ccc65, 6);
    },
    aura: [{ kind: 'orbit', color: 0x558b2f, n: 5 }],
  },

  // ════════ 第 7 章 ════════
  // 腐土之母 Ⅱ：身体张开，腐土一圈圈向外荡开
  'rot_mother:1': {
    burst: (c) => rings(c.g, c.e.x, c.e.y, 0x6d4c41, 3, c.e.radius * 2.4, 260),
  },
  // 腐土之母 Ⅲ：身上鼓出肿包，分离成独立的洒水器小怪
  'rot_mother:2': {
    charge: (c, k) => {
      if (Math.random() < 0.2) fling(c.g, c.e.x, c.e.y, { n: 1, color: 0x8d6e63, size: 10 + 20 * k, speed: 60, up: 40, life: 0.4 });
    },
    burst: (c) => fling(c.g, c.e.x, c.e.y, { n: 3, color: 0x795548, size: 28, speed: 240, up: 160, shape: 'chunk' }),
    aura: [{ kind: 'drip', color: 0x5d4037 }],
  },
  // 腐烂之王 Ⅱ：王座崩塌，站起身，王冠浮起
  'rot_king:1': {
    start: (c) => fling(c.g, c.e.x, c.e.y + c.e.radius, { n: 14, color: 0x4a148c, size: 18, speed: 260, shape: 'chunk' }),
    burst: (c) => {
      rays(c.g, c.e, 0xffd54f, 8);
      rings(c.g, c.e.x, c.e.y, 0x8e24aa, 2, c.e.radius * 2.4);
    },
    aura: [{ kind: 'glow', color: 0x8e24aa }],
  },
  // 腐烂之王 Ⅲ：身后依次闪过前代 Boss 的剪影，残影从剪影中走出
  'rot_king:2': {
    start: (c) => {
      const ids = ['mold_king', 'grease_chef', 'locust_queen', 'ice_cream_tyrant', 'scrap_dragon', 'rotten_chef'];
      silhouettes(
        c.g,
        c.e,
        ids.map((id) => portraitKey(c.g, 'boss', id)),
      );
    },
    burst: (c) => rings(c.g, c.e.x, c.e.y, 0x7e57c2, 3, c.e.radius * 2.6, 180),
    aura: [
      { kind: 'glow', color: 0x4a148c },
      { kind: 'smoke', color: 0x311b92 },
    ],
  },
  // 腐烂之王 Ⅳ：王冠碎裂成环绕的碎片，全屏色调偏暗红
  'rot_king:3': {
    start: (c) => flash(c.g, 0x8b0000, 300),
    burst: (c) => {
      fling(c.g, c.e.x, c.e.y - c.e.radius, { n: 12, color: 0xffd54f, size: 12, speed: 320, shape: 'shard' });
      rays(c.g, c.e, 0xb71c1c, 12, 360);
    },
    aura: [
      { kind: 'orbit', color: 0xffd54f, n: 7 },
      { kind: 'flame', color: 0xb71c1c },
    ],
  },
} satisfies Record<string, PhaseAnim>);

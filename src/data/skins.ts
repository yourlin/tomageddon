// F6：角色皮肤——每名角色 4 套，复用现有 Rig 部件，换配色（部分换花纹）并追加一件配饰。
// 用金番茄购买（I2），或熟练度 10 级免费解锁（F3）。
import type { RigSpec, Acc, Pattern } from '../art/RigSpec';
import { CHARACTERS, CHARACTER_MAP } from './characters';

export interface SkinDef {
  id: string;
  charId: string;
  /** 主题名（显示时与角色名拼接，见 skinName） */
  name: [string, string];
  /** 价格（金番茄） */
  price: number;
  look: Partial<RigSpec>;
}

interface Theme {
  name: [string, string];
  color: number;
  color2: number;
  limb: number;
  acc: Acc;
  /** 换花纹（不填沿用角色原花纹） */
  pattern?: Pattern;
}

/** 14 套主题（配饰都选身上 / 背后的，不和角色原有的头饰冲突）；每名角色分到其中 4 套 */
const THEMES: Theme[] = [
  { name: ['黄金', 'Golden'], color: 0xffc300, color2: 0xffe066, limb: 0xb08900, acc: { id: 'star', color: 0xfff3b0 } },
  { name: ['午夜', 'Midnight'], color: 0x3c096c, color2: 0x7b2cbf, limb: 0x240046, acc: { id: 'cape', color: 0x10002b, color2: 0x9d4edd } },
  { name: ['冰霜', 'Frost'], color: 0x90e0ef, color2: 0xcaf0f8, limb: 0x0077b6, acc: { id: 'scarf', color: 0x48cae4, color2: 0xffffff } },
  { name: ['熔岩', 'Magma'], color: 0x9d0208, color2: 0xff7b00, limb: 0x370617, acc: { id: 'spikes', color: 0xffba08 } },
  { name: ['翡翠', 'Jade'], color: 0x2d6a4f, color2: 0x95d5b2, limb: 0x1b4332, acc: { id: 'bell', color: 0xffd166 } },
  { name: ['樱花', 'Sakura'], color: 0xffafcc, color2: 0xffe5ec, limb: 0xc9184a, acc: { id: 'bow', color: 0xff4d6d } },
  { name: ['机甲', 'Mecha'], color: 0x6c757d, color2: 0xadb5bd, limb: 0x343a40, acc: { id: 'armor', color: 0x495057, color2: 0x4cc9f0 } },
  { name: ['海军', 'Navy'], color: 0x1d3557, color2: 0x457b9d, limb: 0x0b132b, acc: { id: 'tie', color: 0xe63946 }, pattern: 'stripes' },
  { name: ['糖果', 'Candy'], color: 0x80ffdb, color2: 0xffafcc, limb: 0x7b2cbf, acc: { id: 'bell', color: 0xff4d6d }, pattern: 'dots' },
  {
    name: ['大厨', 'Head Chef'],
    color: 0xf8f9fa,
    color2: 0xdee2e6,
    limb: 0x6c757d,
    acc: { id: 'apron', color: 0xffffff, color2: 0xe63946 },
    pattern: 'none',
  },
  {
    name: ['暗影', 'Shadow'],
    color: 0x212529,
    color2: 0x495057,
    limb: 0x000000,
    acc: { id: 'cape', color: 0x6a040f, color2: 0x9d0208 },
    pattern: 'cracks',
  },
  {
    name: ['霓虹', 'Neon'],
    color: 0x7400b8,
    color2: 0x80ffdb,
    limb: 0x3a0ca3,
    acc: { id: 'scarf', color: 0xf72585, color2: 0x4cc9f0 },
    pattern: 'grid',
  },
  {
    name: ['南瓜灯', 'Jack-o’-Lantern'],
    color: 0xf77f00,
    color2: 0xfcbf49,
    limb: 0x3d2c2e,
    acc: { id: 'spikes', color: 0x2b2d42 },
    pattern: 'segments',
  },
  { name: ['星空', 'Starry'], color: 0x14213d, color2: 0x5a189a, limb: 0x03071e, acc: { id: 'star', color: 0xffd60a }, pattern: 'spots' },
];

/** 每名角色的皮肤数 */
export const SKINS_PER_CHAR = 4;
/** 第 k 套的价格（金番茄）：越往后越贵 */
export const SKIN_PRICES = [120, 160, 200, 250];
/** 兼容旧版：第 1 套沿用这个价格常量 */
export const SKIN_PRICE = SKIN_PRICES[0];

/** 两种颜色的差距（RGB 欧氏距离） */
const colorGap = (a: number, b: number): number =>
  Math.hypot(((a >> 16) & 255) - ((b >> 16) & 255), ((a >> 8) & 255) - ((b >> 8) & 255), (a & 255) - (b & 255));

/**
 * 第 i 名角色的 4 套主题：从第 i 套起每隔 3 套取一套（相邻角色的组合错开），
 * 跳过和角色原色太像的（换了跟没换一样），以及和已选的几套撞色的
 */
function themesOf(i: number, color: number): Theme[] {
  const out: Theme[] = [];
  for (const minGap of [110, 70, 0])
    for (let j = 0; j < THEMES.length && out.length < SKINS_PER_CHAR; j++) {
      const t = THEMES[(i + j * 3) % THEMES.length];
      if (out.includes(t) || colorGap(t.color, color) < minGap || out.some((o) => colorGap(o.color, t.color) < minGap * 0.6)) continue;
      out.push(t);
    }
  return out;
}

/** 全部皮肤；第 1 套 id 沿用旧版的 `skin_<角色>`（老存档已买的保留），其余为 `skin_<角色>_<序号>` */
export const SKINS: SkinDef[] = CHARACTERS.flatMap((c, i) =>
  themesOf(i, c.look.color).map((t, k) => {
    return {
      id: k === 0 ? `skin_${c.id}` : `skin_${c.id}_${k + 1}`,
      charId: c.id,
      name: t.name,
      price: SKIN_PRICES[k],
      look: { color: t.color, color2: t.color2, limbColor: t.limb, acc: [t.acc], ...(t.pattern ? { pattern: t.pattern } : {}) },
    };
  }),
);
export const SKIN_MAP: Record<string, SkinDef> = Object.fromEntries(SKINS.map((s) => [s.id, s]));
/** 每名角色的皮肤列表（按价格从低到高） */
export const SKINS_OF: Record<string, SkinDef[]> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, SKINS.filter((s) => s.charId === c.id)]),
);
/** 每名角色的第 1 套（熟练度 10 级免费送的那套） */
export const SKIN_OF: Record<string, SkinDef> = Object.fromEntries(CHARACTERS.map((c) => [c.id, SKINS_OF[c.id][0]]));

/** 皮肤显示名（角色名在运行时按当前语言取） */
export const skinName = (s: SkinDef, en: boolean): string =>
  en ? `${s.name[1]} ${CHARACTER_MAP[s.charId]?.name ?? ''}` : `${s.name[0]}·${CHARACTER_MAP[s.charId]?.name ?? ''}`;

/** 套用皮肤：返回新对象（不改原外观）；配饰在原有配饰之后追加 */
export function applySkin(look: RigSpec, skin: SkinDef | undefined): RigSpec {
  if (!skin) return look;
  const { acc, ...rest } = skin.look;
  return { ...look, ...rest, acc: [...(look.acc ?? []), ...(acc ?? [])] };
}

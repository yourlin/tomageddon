// F6：角色皮肤——每名角色 1 套，复用现有 Rig 部件，只换配色并追加一件配饰。
// 用金番茄购买（I2），或熟练度 10 级免费解锁（F3）。
import type { RigSpec, Acc } from '../art/RigSpec';
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
}

/** 7 套主题轮流分配给角色（配饰都选身上 / 背后的，不和角色原有的头饰冲突） */
const THEMES: Theme[] = [
  { name: ['黄金', 'Golden'], color: 0xffc300, color2: 0xffe066, limb: 0xb08900, acc: { id: 'star', color: 0xfff3b0 } },
  { name: ['午夜', 'Midnight'], color: 0x3c096c, color2: 0x7b2cbf, limb: 0x240046, acc: { id: 'cape', color: 0x10002b, color2: 0x9d4edd } },
  { name: ['冰霜', 'Frost'], color: 0x90e0ef, color2: 0xcaf0f8, limb: 0x0077b6, acc: { id: 'scarf', color: 0x48cae4, color2: 0xffffff } },
  { name: ['熔岩', 'Magma'], color: 0x9d0208, color2: 0xff7b00, limb: 0x370617, acc: { id: 'spikes', color: 0xffba08 } },
  { name: ['翡翠', 'Jade'], color: 0x2d6a4f, color2: 0x95d5b2, limb: 0x1b4332, acc: { id: 'bell', color: 0xffd166 } },
  { name: ['樱花', 'Sakura'], color: 0xffafcc, color2: 0xffe5ec, limb: 0xc9184a, acc: { id: 'bow', color: 0xff4d6d } },
  { name: ['机甲', 'Mecha'], color: 0x6c757d, color2: 0xadb5bd, limb: 0x343a40, acc: { id: 'armor', color: 0x495057, color2: 0x4cc9f0 } },
];

export const SKIN_PRICE = 120;

export const SKINS: SkinDef[] = CHARACTERS.map((c, i) => {
  const t = THEMES[i % THEMES.length];
  return {
    id: `skin_${c.id}`,
    charId: c.id,
    name: t.name,
    price: SKIN_PRICE,
    look: { color: t.color, color2: t.color2, limbColor: t.limb, acc: [t.acc] },
  };
});
export const SKIN_OF: Record<string, SkinDef> = Object.fromEntries(SKINS.map((s) => [s.charId, s]));

/** 皮肤显示名（角色名在运行时按当前语言取） */
export const skinName = (s: SkinDef, en: boolean): string =>
  en ? `${s.name[1]} ${CHARACTER_MAP[s.charId]?.name ?? ''}` : `${s.name[0]}·${CHARACTER_MAP[s.charId]?.name ?? ''}`;

/** 套用皮肤：返回新对象（不改原外观）；配饰在原有配饰之后追加 */
export function applySkin(look: RigSpec, skin: SkinDef | undefined): RigSpec {
  if (!skin) return look;
  const { acc, ...rest } = skin.look;
  return { ...look, ...rest, acc: [...(look.acc ?? []), ...(acc ?? [])] };
}

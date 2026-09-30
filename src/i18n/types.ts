// 英文数据覆盖表的类型（键为数据 id），由 i18n/apply.ts 在启动时写回数据对象
import type { AffixId } from '../data/bosses';
import type { StatusId } from '../data/statuses';
import type { StatKey } from '../data/stats';

export interface CharacterEn {
  name: string;
  title: string;
  desc: string;
  traits: string[]; // 与中文 traits 一一对应
  skill: { name: string; desc: string };
  talent: { name: string; desc: string };
}
export type CharactersEn = Record<string, CharacterEn>;

export interface WeaponEn {
  name: string;
  desc: string;
}
export type WeaponsEn = Record<string, WeaponEn>;
/** 武器标签：中文标签 → 英文（标签在逻辑中作为套装键，数据保持中文，仅显示时翻译） */
export type WeaponTagsEn = Record<string, string>;

export interface ItemEn {
  name: string;
  desc?: string;
}
/** 经典（手工）道具，键为道具 id */
export type ItemsEn = Record<string, ItemEn>;
/** 系列道具：键为系列 id（itemGen.ts SERIES 第一列），items 为 10 个名字，顺序与中文一致 */
export type SeriesEn = Record<string, { name: string; items: string[] }>;

export interface NamedEn {
  name: string;
  desc: string;
}
export type EnemiesEn = Record<string, NamedEn>;
export type BossesEn = Record<string, NamedEn & { title: string }>;
export type AffixesEn = Record<AffixId, NamedEn>;
/** glyph：HUD 状态图标上的 1~2 个字母 */
export type StatusesEn = Record<StatusId, NamedEn & { glyph: string }>;
/** terrain：与 TERRAIN_INFO 中文条目一一对应 */
export type ChaptersEn = Record<number, NamedEn & { terrain: string[] }>;
export type StatsEn = Record<StatKey, string>;

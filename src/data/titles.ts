// I5：称号系统——完成任意成就的最高等级即可把它的名字设为称号，显示在主菜单、选角、结算与分享海报上。
// 称号 id 就是成就 id。稀有度按成就各级点数之和分 4 档（越难的成就点数越高），配色与道具稀有度一致。
import { ACH_MAP, ACHIEVEMENTS, ACH_CATEGORY_NAME, type AchCategory } from './achievements';
import { achText } from '../systems/Achievements';
import { lang } from '../i18n';

/** 称号显示名：成就最高一级的名字（替换 {char} / {boss} / {x} 等占位符，否则会显示模板原文） */
export function titleName(id: string): string {
  const a = ACH_MAP[id];
  return a ? achText(a, 'name', a.tiers.length - 1) : '';
}

/** 称号对应成就的说明（最高一级），用于选择界面 */
export function titleDesc(id: string): string {
  const a = ACH_MAP[id];
  return a ? achText(a, 'desc', a.tiers.length - 1) : '';
}

/** 稀有度分档：按成就各级点数之和（≤15 普通 · ≤40 稀有 · ≤95 史诗 · 更高为传说） */
const RARITY_STEPS = [15, 40, 95];
export function titleRarity(id: string): 0 | 1 | 2 | 3 {
  const a = ACH_MAP[id];
  if (!a) return 0;
  const pts = a.tiers.reduce((s, t) => s + t.points, 0);
  const i = RARITY_STEPS.findIndex((x) => pts <= x);
  return (i < 0 ? 3 : i) as 0 | 1 | 2 | 3;
}

export const titleCategory = (id: string): AchCategory | undefined => ACH_MAP[id]?.category;
export const categoryName = (c: AchCategory): string => ACH_CATEGORY_NAME[c][lang === 'en' ? 1 : 0];

/** 已解锁的称号：成就达到最高等级 */
export function unlockedTitles(achieved: Record<string, { tier: number }>): string[] {
  return ACHIEVEMENTS.filter((a) => (achieved[a.id]?.tier ?? 0) >= a.tiers.length).map((a) => a.id);
}

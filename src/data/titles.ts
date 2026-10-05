// I5：称号系统——完成任意成就的最高等级即可把它的名字设为称号，显示在主菜单与分享海报上
import { ACH_MAP, ACHIEVEMENTS } from './achievements';
import { lang } from '../i18n';

/** 称号显示名（称号 id 就是成就 id） */
export function titleName(id: string): string {
  const a = ACH_MAP[id];
  return a ? a.name[lang === 'en' ? 1 : 0] : '';
}

/** 已解锁的称号：成就达到最高等级 */
export function unlockedTitles(achieved: Record<string, { tier: number }>): string[] {
  return ACHIEVEMENTS.filter((a) => (achieved[a.id]?.tier ?? 0) >= a.tiers.length).map((a) => a.id);
}

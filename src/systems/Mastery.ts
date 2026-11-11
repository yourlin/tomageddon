// 熟练度等级与「契合解锁」。只依赖存档，RunState 和 Progress 都能直接引用（不会循环依赖）。
//
// 契合按熟练度逐步解锁：
//   阶段 0（熟练度 1–2）：只认第一个契合标签。武器标「契合」、开局三选一、商店推荐、只能用契合武器的角色都照常，
//                        但没有契合加成——伤害 +10%、契合特效、天赋对契合武器的强化都不生效
//   阶段 1（熟练度 3–6）：第一个标签的单契合完整生效
//   阶段 2（熟练度 7+）：  解锁第二个标签，两个标签都带的武器成为双契合（契合技 + 标签特性强化）
// 挑战模式一律按阶段 2：所有人条件相同。平衡测试默认也按阶段 2，可用 setFavorOverride 指定阶段。
import { save } from './Save';
import { tx } from '../i18n';

export const MASTERY_MAX = 10;
/** 升到第 n 级累计需要的经验（1 级 0 经验；通关第 1–4 章一局约 250 经验） */
export const masteryNeed = (lv: number): number => Math.round(150 * (lv - 1) * (1 + 0.25 * (lv - 1)));
export function masteryLevel(charId: string): number {
  const xp = save.meta.mastery[charId] ?? 0;
  let lv = 1;
  while (lv < MASTERY_MAX && xp >= masteryNeed(lv + 1)) lv++;
  return lv;
}

/** 契合阶段：0 = 只认标签、没有加成；1 = 单契合；2 = 双契合 */
export type FavorStage = 0 | 1 | 2;
/** 解锁单契合 / 双契合需要的熟练度等级 */
export const FAVOR_UNLOCK = { single: 3, double: 7 } as const;

export const favorStageForLevel = (lv: number): FavorStage => (lv >= FAVOR_UNLOCK.double ? 2 : lv >= FAVOR_UNLOCK.single ? 1 : 0);

let override: FavorStage | null = null;
/** 平衡测试 / 开发者面板用：强制所有角色处于某个契合阶段；null 恢复按熟练度 */
export function setFavorOverride(stage: FavorStage | null): void {
  override = stage;
}

/** 角色当前的契合阶段（不含挑战模式的规则，挑战模式由 RunState 处理） */
export function favorStage(charId: string): FavorStage {
  return override ?? favorStageForLevel(masteryLevel(charId));
}

/** 当前阶段认得的契合标签：阶段 0、1 只有第一个，阶段 2 全部 */
export const favoredTagsAt = (favored: readonly string[], stage: FavorStage): readonly string[] =>
  stage >= 2 ? favored : favored.slice(0, 1);

/** 第 i 个契合标签在这个阶段的解锁提示（已完整生效返回空串），选角 / 商店 / 图鉴共用 */
export function favorTagNote(i: number, stage: FavorStage): string {
  if (i === 0 && stage < 1) return tx(`（熟练度 ${FAVOR_UNLOCK.single} 级解锁加成）`, ` (bonus at Mastery ${FAVOR_UNLOCK.single})`);
  if (i >= 1 && stage < 2) return tx(`（熟练度 ${FAVOR_UNLOCK.double} 级解锁）`, ` (unlocks at Mastery ${FAVOR_UNLOCK.double})`);
  return '';
}
/** 双契合在这个阶段的解锁提示 */
export const doubleFavorNote = (stage: FavorStage): string =>
  stage < 2 ? tx(`（熟练度 ${FAVOR_UNLOCK.double} 级解锁）`, ` (unlocks at Mastery ${FAVOR_UNLOCK.double})`) : '';
/** 熟练度从 before 升到 after 时解锁的契合（结算界面用，没有新解锁返回空串） */
export function favorUnlockNote(before: number, after: number): string {
  if (before < FAVOR_UNLOCK.double && after >= FAVOR_UNLOCK.double) return tx(' · 解锁双契合！', ' · Double synergy unlocked!');
  if (before < FAVOR_UNLOCK.single && after >= FAVOR_UNLOCK.single) return tx(' · 解锁契合加成！', ' · Synergy bonus unlocked!');
  return '';
}

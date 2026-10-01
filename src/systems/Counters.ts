// 成就计数器：任意玩法事件按键累加（如 kill:mold、cast:nova），存于 save.counters，由成就系统读取
import { save } from './Save';

export function bump(key: string, n = 1): void {
  save.counters[key] = (save.counters[key] ?? 0) + n;
}

/** 只记录最大值（最高波次、最高打造等级、最大单次伤害等） */
export function bumpMax(key: string, v: number): void {
  if (v > (save.counters[key] ?? 0)) save.counters[key] = v;
}

export const counter = (key: string): number => save.counters[key] ?? 0;

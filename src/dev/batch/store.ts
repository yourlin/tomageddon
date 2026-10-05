// 批量模拟历史：每次运行存一条，最新在前；空间不足时丢弃最旧的
import type { BatchRecord } from './types';

export const HISTORY_KEY = 'tomageddon_dev_batch_history';
const MAX_RECORDS = 8;

export function loadHistory(): BatchRecord[] {
  try {
    const d = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as BatchRecord[];
    return Array.isArray(d) ? d.filter((r) => r && Array.isArray(r.results) && r.cfg) : [];
  } catch {
    return [];
  }
}

/** 写入历史；返回最终保留的条数（0 表示写入失败） */
export function saveHistory(list: BatchRecord[]): number {
  let l = list.slice(0, MAX_RECORDS);
  while (l.length) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(l));
      return l.length;
    } catch {
      // 超出配额：丢最旧的一条再试
      l = l.slice(0, -1);
    }
  }
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* 忽略 */
  }
  return 0;
}

export function pushRecord(rec: BatchRecord): number {
  return saveHistory([rec, ...loadHistory().filter((r) => r.id !== rec.id)]);
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    /* 忽略 */
  }
}

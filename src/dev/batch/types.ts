// 界面内批量模拟：配置、单局结果与一次运行记录的数据结构
import type { StatMods } from '../../data/stats';
import type { WeaponAffix } from '../../systems/WeaponMods';

/** 天赋预设（同 scripts/batch.mjs 的 --talents）：none 不点 · mid 40 点 · full 79 点 */
export type TalentPreset = 'none' | 'mid' | 'full';
export const TALENT_BUDGET: Record<TalentPreset, number> = { none: 0, mid: 40, full: 79 };
export const TALENT_NAME: Record<TalentPreset, string> = { none: '不点（基准）', mid: '中期 40 点', full: '全部 79 点' };

export interface BatchConfig {
  /** 角色 id 列表 */
  chars: string[];
  chapters: number[];
  /** 每个角色 × 章节的局数 */
  runs: number;
  talents: TalentPreset;
  /** 并发 iframe 数（1~6） */
  workers: number;
  /** 单局超时（秒） */
  timeoutSec: number;
}

export interface Job {
  charId: string;
  ch: number;
  run: number;
  key: string;
}

export interface FinalWeapon {
  id: string;
  tier: number;
  forge?: number;
  affixes?: WeaponAffix[];
}

/** 单局结果：机器人 window.__botState 的字段 + 结算时从 iframe 的 run 读取的最终构筑 */
export interface JobResult {
  key: string;
  charId: string;
  ch: number;
  run: number;
  win: boolean;
  wave: number;
  kills: number;
  level: number;
  /** 道具总件数 */
  items: number;
  /** 机器人的武器串：id+品质，逗号分隔 */
  weapons: string;
  sec: number;
  timeout?: boolean;
  stuckAt?: string;
  topDmg: string;
  /** 最终武器（含词条、打造） */
  wl: FinalWeapon[];
  /** 最终道具 id → 数量 */
  il: Record<string, number>;
  /** 最终 run.levelMods（升级加点 + 等级成长 + 每波成长） */
  lm: StatMods;
}

/** 一次批量运行（存 localStorage） */
export interface BatchRecord {
  id: string;
  at: number;
  cfg: BatchConfig;
  total: number;
  complete: boolean;
  elapsedMs: number;
  results: JobResult[];
}

// 开发者界面各页签共享的上下文
import type { DevBuild, Shelf } from './build';
import type { Sandbox, SpawnOpts, Snapshot } from './sandbox';

export type TabId =
  | 'build'
  | 'weapons'
  | 'skills'
  | 'monsters'
  | 'items'
  | 'status'
  | 'sandbox'
  | 'tests'
  | 'batch'
  | 'data'
  | 'debug'
  | 'assets';

export interface UiState {
  tab: TabId;
  // 构筑页
  shopMode: 'catalog' | 'shelf';
  shopKind: 'weapon' | 'item';
  shopSearch: string;
  shopTier: number;
  shopRarity: number; // -1 = 全部
  shelf: Shelf | null;
  presetName: string;
  pickKey: string;
  pickRarity: number;
  // 武器页
  wTier: number;
  wCls: string; // '' = 全部
  wSearch: string;
  wSort: number; // 列号 + 1，负数降序
  // 怪物页
  mChapter: number;
  mWave: number;
  mCat: 'pool' | 'minion' | 'elite' | 'boss';
  mSel: string; // 选中的怪物 id（boss: 前缀 b:）
  mSearch: string;
  spawn: SpawnOpts;
  affixMode: 'rule' | 'none' | 'pick';
}

export interface DevCtx {
  build: DevBuild;
  sb: Sandbox;
  ui: UiState;
  /** 构筑变更：保存、写入 run、（按设置）重启沙盒并重绘 */
  changed(restart?: boolean): void;
  setBuild(b: DevBuild): void;
  rerender(): void;
  toast(msg: string, bad?: boolean): void;
  /** 还原快照：构筑不同则先切构筑并重启沙盒，场景重建后再放回目标 */
  restoreSnapshot(s: Snapshot): void;
  /** 构筑撤销 / 重做 */
  undo(): void;
  redo(): void;
}

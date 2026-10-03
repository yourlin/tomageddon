// 开发者界面开关：地址带 ?dev 时启用（与 ?headless 互斥）。
// 这个文件刻意保持极小、无依赖：游戏主包只引用它，开发者界面本体按需动态加载，不进玩家首屏。
import type Phaser from 'phaser';

const params = new URLSearchParams(location.search);
export const DEV_MODE = params.has('dev') && !params.has('headless');

export const devHooks: { onBootReady: ((game: Phaser.Game) => void) | null; booted: boolean } = {
  onBootReady: null,
  booted: false,
};

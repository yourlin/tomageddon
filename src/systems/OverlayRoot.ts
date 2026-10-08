// 覆盖层（提示、弹窗）挂载点：放在游戏容器内，强制横屏旋转时一起旋转。
// 单独成文件、不依赖 Phaser：成就等纯逻辑模块也会引用（文档生成在 Node 里运行，加载不了 Phaser）
export const overlayRoot = (): HTMLElement => document.getElementById('game') ?? document.body;

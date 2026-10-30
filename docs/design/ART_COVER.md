# 横屏游戏封面试作

主菜单采用左侧标题与操作、右侧厨房冒险插画布局，沿用第一章可爱番茄妹、黄蝴蝶结、暖色厨房与月夜配色。菜单保留继续游戏、选角、挑战、图鉴等入口。

素材：`src/assets/cover/cover_kitchen.png`。由内置 image_gen 生成，参考番茄妹 body.png 与第一章漫画。原始提示词见同目录 ART_COVER_GENERATION.json。

本地预览：`http://127.0.0.1:4183/?lang=zh&art=1`。
截图：`docs/images/cover/menu-1600x900.png`、`menu-1280x720.png`。
验收脚本：`node scripts/preview-cover.mjs`，检查两种横屏分辨率、资源加载、开始游戏进入选角。

标题与控件使用 `src/ui/CoverUI.ts`：奶油色倾斜中文字标、叶冠、英文铭牌，番茄红渐变主按钮、黄铜描边、压下与悬停反馈；次级按钮、托盘及右上角工具入口共用暖色系。文字为原生可本地化内容。继续游戏与挑战同时显示时，进度与倒计时收在菜单列中。

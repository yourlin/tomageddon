# 第一关美术试装

本轮采用 `src/assets/comics/ch1.png` 中选定的可爱 Q 版漫画风格，使用内置 image_gen 制作透明实体插画和正俯视地图，通过现有美术清单接入。

敌方弹体和 Boss 形态转换的设计、素材及动画预览见 [ART_CH1_COMBAT.md](ART_CH1_COMBAT.md)。

预览：[素材总览](../images/art-ch1/roster.png)、[战斗截图](../images/art-ch1/battle.png)、[Boss 截图](../images/art-ch1/boss.png)。截图来自用于集中展示素材的本地测试场景，怪物组合和出现时机不代表正式波次。

## 覆盖范围

- 番茄妹基础外观；其他可玩角色及番茄妹皮肤继续使用原有外观。
- 第一关刷怪池的 18 种普通怪物；词缀精英显式复用对应插画并增加金色光环。
- 第一关 6 位精英、3 位随机 Boss，覆盖整个随机池。
- `chapterArtDeps(1)` 列出的兔子、土拨鼠、枯萎嫩芽等机关生物依赖。
- 第一关平底锅地图及选关缩略图，通行范围仍由 `arenas.ts` 决定。

这是静态素材试装：呼吸、移动弹跳、攻击挤压、受击闪白、眩晕、冻结和死亡淡出由现有 `SpriteVisual` 驱动，尚未制作专用逐帧动作。武器、弹幕、掉落、UI 和其他章节地图保持现有美术。

怪物条目按实体 ID 注册，同一怪物若在后续章节复用，也会显示该实体的新形象；本轮没有为后续章节单独制作素材。

## 文件与参数

| 内容 | 位置 |
|---|---|
| 番茄妹 | `src/assets/entities/char/tomato/body.png` |
| 怪物 / 机关生物 | `src/assets/entities/enemy/<id>/body.png` |
| 精英 / Boss | `src/assets/entities/boss/<id>/body.png` |
| 平底锅 | `src/assets/maps/ch1/ground.png` |
| 实体清单与地面接触点 | `src/data/artManifest.ts`、`src/data/artChapter1.ts` |
| 生图提示词与地图校准 | [ART_CH1_GENERATION.json](ART_CH1_GENERATION.json) |

原始 PNG 像素和透明通道保持生成结果；根据可见轮廓分别设置 `anchor`、`refRadius`，不改玩法碰撞半径。地图通过清单中的 `world` 将图中锅内圆对齐现有通行圆。

## 查看效果

1. 运行 `npm run dev -- --host 127.0.0.1`，打开终端显示的本地地址。
2. 选择番茄妹的基础外观，进入第一关。已装备皮肤时需先切回基础外观，皮肤本轮没有替换。
3. `?art=0` 可对比原程序化形象；`?arenaDebug=1` 可显示地图通行边界，用于检查锅沿对齐。
4. 从开发者面板的外观动画预览查看精英、Boss 和各种状态，避免等待随机刷到某一位 Boss。

校验与性能采样沿用现有工具：

```bash
npm run check:art -- --report
npm run typecheck
npm test
npm run build
npm run art:perf -- --label ch1-procedural --art 0
npm run art:perf -- --label ch1-pilot
node scripts/art-perf.mjs --compare reports/art-perf-ch1-procedural.json reports/art-perf-ch1-pilot.json
```

## 本轮评审重点

- 正常战斗缩放下，玩家、怪物、Boss 和弹幕是否足够清楚；不要仅按放大的原图评判。
- 锅内地面是否抢眼，锅沿与真实通行边界是否一致。
- 普通怪物、精英光环、Boss 的尺寸层级和各自轮廓是否容易辨识。
- 左右镜像、脚底锚点、受击与冻结反馈是否自然。

先确认实际战斗中的画风和可读性，再投入专用动画、皮肤和其他章节。当前保留高分辨率生成稿；正式发布前应再评审资源尺寸、下载体积、低内存设备纹理预算及图集打包方案。桌面截图与性能采样不能替代真机移动端验收。

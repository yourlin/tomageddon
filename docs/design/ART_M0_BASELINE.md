# 美术替换 M0：契约与基线

日期：2026-10-18
对应规划：[ART_REPLACEMENT_ROADMAP.md](ART_REPLACEMENT_ROADMAP.md) 第 4 节 M0；接入方法见 [ART_PIPELINE.md](ART_PIPELINE.md)。

## 1. 调用点清单（迁移前审计 → 迁移后状态）

审计范围：所有 `new Rig`、`Rig` 类型注解，以及对 `puppet` / `bodyImg` 等内部部件的访问。结论：业务代码没有访问内部部件，只用到 `play / tick / state / radius / setRadius / setStatusTint / resetVisual / die / onDieDone`，以及 Container 自身的位置、深度、缩放、透明度、可见性和 tween 能力。这些都已经收进 `EntityVisual` 接口。

| 调用点 | 用途 | 迁移后 |
|---|---|---|
| `scenes/GameScene.ts` 玩家 | 战斗主角（含皮肤） | `createEntityVisual({ kind: 'char', id, skinId })` |
| `systems/RigPool.ts` → `objects/Enemy.ts` | 怪物 / 精英 / Boss 对象池 | `VisualPool.acquire(ident)`。精英怪不再拼接 `enemy_xxx_champ` 字符串，改用 `variant: 'champ'` |
| `GameScene.dying`、`BossPhases.ts`、`BossFxKit.ts`、`BossPhaseAnims.ts` | 死亡动画、转阶段缩放 / tween / 透明度 | 类型改为 `EntityVisual`，回池时 `killTweensOf` |
| `systems/SkillSystem.ts` 分身 | 技能分身 | 沿用玩家的 `ident`，包括皮肤和外部美术 |
| `systems/SkillStyles2.ts` `makeRig` | 技能里的角色替身（诱饵等） | 同上 |
| `ui/Portrait.ts` `portraitKey` | 头像缩略图（图鉴、选角格子、商店、暂停、历史、挑战、分享海报、Boss 转阶段） | 依次尝试清单头像、旧版外部图、用统一外观烘焙；支持皮肤参数 |
| `ui/Portrait.ts` `showcaseRig` | 主菜单、选角详情、结算展示 | 统一工厂，按需加载后原地替换（选角详情会重新排版） |
| `dev/assets/rig.ts` | 开发者动画预览 | 统一工厂，可切换精英变体、强制程序化 |
| `scenes/ComicScene.ts` | 章节开场漫画演员 | **保留 `new Rig`**：roadmap 规定漫画维持现状，且该文件有未提交的漫画改动 |

## 2. 素材 schema

类型化入口为 `src/data/artManifest.ts`（`ART_SCHEMA_VERSION = 1`），校验命令为 `npm run check:art`。字段说明见 [ART_PIPELINE.md](ART_PIPELINE.md) 和清单注释。

## 3. 性能与截图基线（程序版）

**测量方法：** `scripts/art-perf.mjs`

- 场景：第 1 章第 8 波，角色为番茄妹，固定随机种子 20261018。
- 每个场景先维持目标怪物数量 1.5 秒，再采样 8 秒。玩家无敌，本波不结束。
- 指标：
  - 帧间隔 p95 / p99（受 60Hz 垂直同步限制）。
  - 每帧工作时间（Phaser `prestep` → `postrender`，即逻辑加渲染提交）的 p50 / p95。这是余量的主要指标，roadmap 里"p95 帧耗时增长不超过 15%"的门槛按它判断。
  - 纹理数量与 JS 堆。
  - 泄漏检查：强制 GC 后反复开局 / 回菜单 6 次。
- 目标设备：
  - 桌面：Apple M3 Pro / macOS 26.7.1 / Chrome 155（无头模式，1280×720@1x）。
  - 低内存移动端：同一台机器模拟 iPhone UA（触发 `LOW_MEM`）、844×390@3x、CPU 降速 4 倍。
  - 真机数据需要在实体 iPhone / 微信上补测（见第 5 节）。
- 代表性怪物密度：常规约 90 只同屏，高密度约 260 只（接近 `BALANCE.maxEnemies` = 260）。

**基线结果**（HEAD = 本次改动前的 4fcb347，cur = 统一外观框架，清单为空）：

| 设备 | 场景 | 同屏怪物 | 帧间隔 p95 / p99 | 每帧工作 p50 / p95 | 纹理 | 堆 |
|---|---|---:|---|---|---:|---:|
| 桌面 HEAD | 常规 | 95 | 16.7 / 16.8 ms | 3.9 / 8.8 ms | 918 | 75 MB |
| 桌面 cur | 常规 | 93 | 16.7 / 16.8 ms | 3.8 / 7.6 ms | 918 | 85 MB |
| 桌面 HEAD | 高密度 | 258 | 16.8 / 16.8 ms | 5.1 / 12.7 ms | 922 | 80 MB |
| 桌面 cur | 高密度 | 261 | 16.8 / 16.8 ms | 4.8 / 12.2 ms | 922 | 108 MB |
| 移动 HEAD | 常规 | 86 | 16.8 / 16.8 ms | 7.1 / 17.8 ms | 453 | 58 MB |
| 移动 cur | 常规 | 94 | 16.8 / 16.8 ms | 6.9 / 20.0 ms | 448 | 67 MB |
| 移动 HEAD | 高密度 | 254 | 33.4 / 50.0 ms | 14.5 / 36.7 ms | 455 | 60 MB |
| 移动 cur | 高密度 | 260 | 33.4 / 50.0 ms | 14.3 / 39.6 ms | 448 | 77 MB |

- 单次测量波动较大。移动端每帧工作 p95 各跑 3 次取中位数：常规 HEAD 18.0 / cur 16.6 ms，高密度 HEAD 38.9 / cur 38.6 ms。**统一外观框架没有带来可测量的退化。**
- 场景中的"堆"是未强制 GC 的瞬时值，只作参考。泄漏检查在强制 GC 后进行：桌面两版都稳定在 68–69 MB / 851 张纹理，移动端两版都稳定在 45 MB，6 次开局没有持续增长。
- 首次 / 缓存后加载（到主菜单）：桌面 HEAD 453 / 238 ms，cur 472 / 234 ms；移动 HEAD 1188 / 781 ms，cur 1188 / 804 ms。
- 模拟移动端在高密度场景下已经低于 60 fps（帧间隔 p95 为 33 ms）。这是程序版本身的基线，接入美术后按与它的差值验收，不能只看平均 FPS。
- 截图基线：`reports/art-baseline/<label>-menu|normal|dense.png`。`reports/` 不进仓库，需要时用下面的命令重新生成。

```bash
npm run build
node scripts/art-perf.mjs --label base-desktop --art 0
node scripts/art-perf.mjs --label base-mobile --art 0 --mobile
# 接入素材后：
node scripts/art-perf.mjs --label pilot-desktop
node scripts/art-perf.mjs --compare reports/art-perf-base-desktop.json reports/art-perf-pilot-desktop.json
```

绝对显存与首屏包体上限按 roadmap 的要求，在 M5 试点素材到位后，根据上表的纹理数量、堆和加载时间实测确定。

## 4. 试点素材表（第一章）

先做静态战斗图和头像。精灵表候选尺寸为普通角色单帧 256×256、Boss 单帧 512×512，在试点阶段比较清晰度与显存后再定。

| 优先级 | 实体 | 身体结构 | 交付 | 说明 |
|---|---|---|---|---|
| P0 | 番茄妹 `char:tomato` | 圆形 + 脚 | 头像、静态图 → idle / move / attack / hurt / die 精灵表 | 剧情主角与比例基准；皮肤先声明 `reuse.skins` 或回退 Rig |
| P0 | 霉菌团 `enemy:mold` | 软体（无肢体） | 静态图、头像、`reuse.champ: 'goldAura'` | 第 1 波起就会出现，数量最多 |
| P0 | 果蝇 `enemy:fly` | 椭圆 + 翅膀（漂浮） | 2–4 帧翅膀循环（图集，验证裁切） | 非圆身体与翅膀，验证接口不只适配圆形主角 |
| P0 | 行军蚁 `enemy:ant` | 六足 | 静态图 → move 帧 | 带腿实体 |
| P0 | 霉菌大王 `boss:mold_king` | 云形 | 512 单帧静态图 → windup / charge / cast | 第 1 章 Boss 池三选一，只换这一位，其余明确回退 Rig |
| P0 | 平底锅地图 `map:ch1` | — | ground、thumb（foreground 可选） | 用 `?arenaDebug=1` 对齐锅沿和障碍 |
| P1 | 第 1 章其余怪物池 | 见下 | 静态图 + 头像 | 蛆虫（节段）、烂苹果（心形 + 脚）、蟑螂 / 炸弹甲虫 / 锅底甲虫（六足）、面包屑螨（八足）、茶包幽灵（漂浮）、分裂霉菌等，共 18 种 |
| P1 | 地形 / 召唤额外怪 | — | 静态图 | 菜园兔子、土拨鼠、枯萎嫩芽（地形机关刷出，跨章节共用） |
| P2 | 第 1 章精英 6 位 | — | 静态图 | 蟑螂将军、霉菌长老、油腻平底锅、叉子骑士、蝇群之主、腐烂洋葱 |
| P2 | 第 1 章其余 Boss | — | 静态图 | 油烟怪厨、蟑螂皇帝（整章覆盖完成前保持回退 Rig） |

可以随时用 `npm run check:art -- --report` 查看第 1 章 51 个外观（含精英变体）的覆盖情况。

## 5. 验证记录与待办

| 项目 | 状态 |
|---|---|
| 仅程序素材 | ✅ 当前默认；全量单测、浏览器实测、Steam 构建、平衡回归 |
| 仅静态插画 / 完整动画 / 混合素材 | ✅ 用临时生成的测试素材（精灵表 + 静态图 + 裁切图集 + 地图）在浏览器中验证：混合战斗、精英金色光环、受击、死亡回收、60 次生成 / 击杀回池；测试素材已删除 |
| 坏图 / 缺图 | ✅ 坏图回退 Rig 并给出诊断，不阻塞开局；缺文件、未知实体、重复条目、帧越界、图集旋转由 `check:art` 与单测覆盖 |
| 桌面浏览器 | ✅ 见第 3 节 |
| 低内存移动设备 | ✅ Chrome 模拟（iPhone UA → LOW_MEM、CPU 降速 4 倍）见第 3 节。✅ 真实 WebKit 引擎（Playwright WebKit，iPhone 14 Pro 横屏配置）分别用 iPhone 和微信 UA 测试：都进入 LOW_MEM（地图按 0.5 倍绘制、多重采样抗锯齿关闭），WebGL 渲染；战斗帧间隔 p50 17 ms / p95 18 ms；没有页面错误和素材诊断。⚠️ 物理 iPhone / 微信 WebView 无法在开发机上自动化，需要在真机上手动打开网页版走一遍。这一项与美术素材无关，现在就可以测；素材接入后需要再测一次显存与内存峰值 |
| Steam 构建 | ✅ `npm run build:steam` 通过。✅ **Electron 客户端**（`npx electron .`，用 `--user-data-dir` 指向临时目录，不碰真实存档）通过远程调试端口驱动：主菜单 → 选角 → 选武器 → 跳过漫画 → 第 1 波（击杀、成就解锁、升级三选一）→ 商店买武器 → 第 2 波，全程没有页面错误，存档写到 userData/saves。✅ 旧存档兼容：复制 10 月 7 日的旧版 Steam 存档到临时目录后启动，进度（成就点、击杀）正常载入，「继续游戏」恢复到原来那局的商店（武器、道具、属性都在）；真实存档目录全程未被修改。未从 Steam 启动时 Steamworks 不初始化（成就不上报），符合 `electron/main.cjs` 的设计；⚠️ 从 Steam 客户端启动后的成就、浮层需要在装有 Steam 的机器上手动验证 |
| 平衡回归 | 见第 6 节 |

## 6. 平衡回归（batch.mjs）

使用相同参数分别跑本次改动前的 HEAD 与当前代码：`node scripts/batch.mjs --chapters 1,2,3,4,5,6,7 --runs 1 --no-archive`（全部 39 名角色 × 7 章，天赋 20%）。

两次各 273 局，**都没有页面错误或超时**，各用时约 24 分钟。

| 章 | HEAD 通关 | 当前 通关 | HEAD 平均波次 | 当前 平均波次 | HEAD 平均击杀 | 当前 平均击杀 |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 39/39 | 38/39 | 15.0 | 14.9 | 4155 | 4084 |
| 2 | 38/39 | 39/39 | 14.9 | 15.0 | 4604 | 4696 |
| 3 | 32/39 | 28/39 | 14.0 | 13.0 | 3479 | 3103 |
| 4 | 15/39 | 14/39 | 11.6 | 10.9 | 2551 | 2198 |
| 5 | 16/39 | 22/39 | 14.7 | 16.4 | 4787 | 6004 |
| 6 | 15/39 | 13/39 | 18.4 | 18.3 | 7431 | 7317 |
| 7 | 7/39 | 7/39 | 15.9 | 14.9 | 5107 | 4501 |
| 合计 | 162/273 | 161/273 | | | | |

结论：合计通关数基本一致。各章的差异方向不一致（第 5 章更好，第 3 章更差），而且 batch 没有固定随机种子：同一角色同一章节在两次运行中胜负不同的有 69 / 273 局，所以每格 1 局的差异属于随机噪声。统一外观框架只改动渲染与对象池，不涉及玩法数值，回归结果与此一致。如需更窄的置信区间，可在 push 前按惯例用 `--runs 2` 再跑一轮。

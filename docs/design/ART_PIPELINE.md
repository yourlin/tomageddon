# 外部美术接入指南

更新：2026-10-20
对应规划：[ART_REPLACEMENT_ROADMAP.md](ART_REPLACEMENT_ROADMAP.md)

程序框架已经完成：放入素材文件，并在 `src/data/artManifest.ts` 中登记后即可生效，不需要修改战斗代码。未登记、缺少文件或加载失败的素材会自动回退到程序化 Rig 或程序地图。

## 1. 原画与发布资源分离

原画、生成动作拼图和制作中间 PNG 保留在仓库外：`../tomato-sister-art-source`；本机路径为 `/Users/linyesh/playground/tomato-sister-art-source`，也可通过 `TOMATO_ART_SOURCE` 指定。Git 和发布包只包含编译后的游戏资源。

```text
../tomato-sister-art-source/
  drafts/char/tomato/                       原始动作拼图、修订版和提示词
  entities/char/tomato/motion.png           校准后的高档制作图集
  entities/boss/rot_king/phases/1/           Boss 阶段制作图集
src/assets/runtime/
  entities/char/tomato/base/standard/        motion.webp、motion-low.webp、motion-standard.webp
  entities/boss/rot_king/phases/1/standard/  阶段独立目录
  entities/enemy/maggot/base/standard/       body.webp、body-low.webp、body-standard.webp
  weapons/pea_shooter/standard/              held.webp、projectile.webp
  maps/ch1/standard/                        地图游戏资源
```

- 战斗实体必须有真实透明通道，不能带棋盘格、底色或烘焙地面。
- `src/data/artRuntime.generated.json` 把逻辑源文件名映射为发布 WebP；清单继续使用 `motion.png` / `body.png` 等逻辑名，运行时不会读取仓库外 PNG。
- 每个角色、怪物、武器和 Boss 阶段使用独立目录；纹理 key 带命名空间与版本号。
- 制作逐帧图集使用 `python3 scripts/build-animation-atlas.py <plan.json>`；静态资源使用 `python3 scripts/bake-runtime-art.py <external.png>`，后者会刷新静态实体的低／标准档副本。
- 图集每帧留白 4 px、帧间距 8 px；高档通常 256 px。腐烂之王采用 320 px 留出举杖空间，单张图集仍不得超过 2048×2048。低／标准档动画帧分别为 96／128 px。
- `referenceHeight` 校准整套动作，动作可单独覆盖该值；禁止逐帧归一化抹平蹲伏、跳跃和倒地。举起武器不能导致躯干突然缩小，空间不足时应调整图集留白及统一校准。
- 静态小型实体低／标准档最长边为 192／384 px，Boss 静态图为 256／512 px，高档保留现有清晰度。运行时同步换算 `refRadius`，避免换档后形象大小改变。

## 2. 登记清单

```ts
export const ENTITY_ART: EntityArtEntry[] = [
  {
    kind: 'char', id: 'tomato', version: 1,
    source: { type: 'spritesheet', file: 'motion.png', frameWidth: 256, frameHeight: 256, margin: 4, spacing: 8 },
    anims: {
      idle: { frames: [0, 1, 2, 3], fps: 6 },
      move: { frames: [4, 5, 6, 7], fps: 12 },
      attack: { frames: [8, 9, 10] },            // 默认 fit：拉伸到玩法时长 0.22 秒
      die: { frames: [11, 12, 13] },
    },
    anchor: { x: 0.5, y: 0.94 },                 // 脚底接触点（帧内 0~1）
    refRadius: 96,                               // 源图里 1 个玩法半径对应多少像素
    reuse: { skins: { skin_tomato_2: { tint: 0xffd6e0 } } },
  },
  { kind: 'enemy', id: 'maggot', version: 1, source: { type: 'static', file: 'body.png' }, refRadius: 90, reuse: { champ: 'goldAura' } },
];
export const MAP_ART: MapArtEntry[] = [{ ch: 1, version: 1, ground: 'ground.webp', thumb: 'thumb.png' }];
```

替换文件后应将 `version` 加 1。字段说明见 `artManifest.ts` 中的注释。

### 外观选择规则

1. 精确匹配实体、皮肤和变体的条目。
2. 基础条目显式声明了 `reuse`：皮肤可以原样复用或调色复用；词缀精英可以使用基础图加金色光环。
3. 不符合以上情况时，使用对应皮肤或变体的程序化 Rig。没有声明时不会用基础图覆盖已购买的皮肤，也不会把精英怪显示成普通怪。

头像、选角展示、结算、战斗、分身和技能里的角色外观都使用同一套规则。局内暂停页和商店的头像会显示当前皮肤。

### 动作

可登记的状态有：`idle move attack hurt windup charge stun die spawn cast victory frozen`。

- 帧由游戏时间推进，因此暂停、慢动作和冻结都与玩法保持一致。动画长度不会影响伤害发生时间、预警时长或死亡回收。
- 一次性动作（attack / hurt / die / spawn / cast）默认按玩法时长拉伸（`fit`）；使用 `hold` 时按 fps 播放并停在末帧。
- windup / charge 默认停在末帧，也可以设置 `loop`。
- 缺少的动作会使用 idle 帧序列或基准帧，并加上通用反馈（呼吸、弹跳、挤压、闪白、旋转、淡出），不会切换到 Rig 画风。眩晕时显示星星；冻结时保持当前姿态。
- 静态图只有一帧，所有动作都通过通用反馈表现。

### 地图

- `ground` 覆盖整张地图（场地外接矩形每边外扩 `MAP_MARGIN` = 220）。如果画面范围不同，可以用 `world` 指定世界矩形。
- `foreground` 默认画在地面之上、所有实体之下（depth -5）。
- `thumb` 是选关缩略图，会在启动时加载；没有缩略图时用程序地图生成。
- 通行区域仍由 `src/data/arenas.ts` 决定，外部图片不会改变碰撞。

## 3. 校验与验收

```bash
npm run check:art            # 未知 id / 皮肤 / 变体、重复条目、缺文件、帧范围、图集旋转、无透明通道、未登记文件
npm run check:art -- --report   # 额外列出每章每个实体用的是 exact / reuse / rig
```

浏览器中的调试工具：

- `?arenaDebug=1`：碰撞调试叠层。红色表示不可站立，青色表示障碍物；缩场和临时障碍物会实时重绘。用它核对地图美术是否与碰撞对齐。
- `?art=0`：强制使用程序化外观，便于并排对比新旧形象，或采集性能基线。
- 控制台 `__art.diag()` 查看诊断，`__art.textures()` 查看纹理状态、持有者和存活引用，`__art.retry()` 重试失败的素材，`__art.procedural(true)` 运行时切换到程序化外观。
- 开发者面板的外观动画预览可以逐个播放全部状态，并可切换词缀精英变体和强制程序化。

性能对比（程序版基线 vs 接入素材后，门槛：每帧工作 p95 增长不超过 15%）：

```bash
npm run build && npm run art:perf -- --label base --art 0 && npm run art:perf -- --label pilot
node scripts/art-perf.mjs --compare reports/art-perf-base.json reports/art-perf-pilot.json   # 加 --mobile 模拟低内存移动端
```

## 4. 加载与生命周期

| 时机 | 内容 |
|---|---|
| 启动（BootScene） | 已登记头像、选关缩略图、主菜单番茄妹；不预加载全部武器插画 |
| 进入战斗（GameScene.preload） | 当前角色与皮肤、当前波次怪物及召唤／分裂依赖、预选中的精英与 Boss 及所需阶段、已持有武器及相关弹体、当前地图；沙盒全量预览另行处理 |
| 选角 / 商店 / 图鉴 / 收藏 / 合成 / 战绩 | 根据实际展示对象加载；武器异步替换图标时保持显示尺寸，场景退出后释放无其他使用者的插画纹理 |

- 加载失败时会回退并记录诊断；每次进入章节会自动重试一次。
- 进入新章节时会卸载不再被任何场景持有、也没有存活外观对象使用的纹理。头像常驻不卸载。
- 实体回到对象池时会停止 tween，并清除回调、染色、翻转、透明度和临时特效；对象回池不会卸载纹理。

## 5. 当前逐帧检查范围

已生成并接入 39 个默认角色（1457 帧）、18 个 Boss 本体及 37 个阶段形态（1788 帧）。精英、小怪逐帧制作等待用户通知，156 套额外皮肤暂缓。静态图、调色和通用缩放反馈不计入逐帧数量。

关键帧目检与实际连续播放、性能验收分开记录。`reports/art-pilot/` 为本地验证产物，不提交 Git。审核指纹检查使用 `node scripts/check-animation-review.mjs --source`；发布资源使用 `npm run check:art-runtime` 和 `node scripts/check-runtime-release.mjs`。浏览器专项检查须先运行本地开发服务。

Steam 发布版还需从设置界面实际循环切换自动、低、标准、高画质，并在立即重载后核对下载图集的文件指纹与目标档位一致。主进程处理 `toma:storage-load` 时先提交待写存档，防止延迟落盘让新渲染进程读取上一档设置。仅核对磁盘中的设置值不足以证明本次加载档位正确。

Boss 招式与动画接线检查：`npx tsx scripts/check-boss-combat-motion.mjs`（可加 `--boss=rot_king`）。它在原生战斗场景中逐个调用实际 `Enemy.firePattern`，让游戏更新与渲染正常推进，验证当前阶段动作的显示帧及纹理身份。当前 18 个 Boss、55 个形态的 160 次招式触发通过。此检查预设阶段、隔离招式时机，不能代替扣血转阶段、自然 AI 节奏、画面目检或发布版验收。

加 `--natural` 检查原有 AI 冷却与移动：施法不可被紧邻的普通攻击覆盖，接触伤害也不可把冲锋切成普通攻击姿势；瞬移结束后允许已开始的重现动作继续播放，玩法恢复时机保持不变。普通攻击通过 `EntityVisual.tryAttackAnimation` 保护高优先级动作，敌人可启用程序化反馈，玩家武器默认只使用已绘制攻击帧。眨眼时序检查使用 `node scripts/check-animation-blink.mjs`；91 个可见眼睛形态每 4 秒完全闭眼 100ms，鼹鼠将军的 3 个墨镜形态不计为可见眨眼。

已有画质报告可用 `node scripts/check-animation-quality-reports.mjs` 与当前编译图集核对：覆盖 94 个形态的 376 条视口记录，检查实际图集几何、QHD 上限、指针映射和单一画质档位请求。Boss 阶段报告同时检查本体，优先于较早的本体单独报告。此核对不能代替新的连续播放、像素清晰度目检或手机真机测试。

2026-10-21 固定负载对照（`art-perf.mjs` fixtureVersion 3）：第 1 章第 8 波，60 / 240 个敌方单位均包含最终阶段腐烂之王，番茄妹与 Boss 使用逐帧，其余小怪仍为静态插画／代码形象。每场采样 8 秒，移动模拟采用 4 倍 CPU 降速。相对同配置程序化形象，每帧工作耗时 P95 的变化如下；四项均未超过 +15%：

| 配置 | 60 单位 | 240 单位 | 高密度帧间隔 P95 | 基础 RGBA 纹理估算 |
|---|---:|---:|---:|---:|
| 手机低画质模拟 | +9.4% | -23.9% | 33.3ms | 71.6 MiB |
| 2560×1440 高画质 | 约 0% | -36.5% | 16.8ms | 233.1 MiB |

两档均无缺失纹理对象，反复进出 6 次后监听数稳定为 24、纹理数量稳定。v3 先等待启动后台贴图完成，与正常界面的开局闸门一致；较早手机测试提前停止 Boot，出现占位图，42.5 MiB 的旧估算不作为最终内存结论。`--compare ... --assert-budget --comparison-report <路径>` 可输出门槛结果，配置或 fixtureVersion 不一致时拒绝比较。`art=0` 仍使用共享加载流程，仅用于渲染工作对照，不代表完全不加载插画的内存基线。

手机模拟采用浏览器移动视口及 CPU 降速，不能代替真机验收。RGBA 纹理估算不含驱动开销、mipmap 和 framebuffer；现有怪物仍包含静态／程序外观，不能把当前密集战斗结果当成未来全量小怪逐帧性能结论。


### 漫画动画回退与纹理生命周期（2026-10-21）

ComicScene 缺图面板通过 createEntityVisual 复用已有玩家与 Boss 逐帧动画，只有所有可选插画都失败的面板才加载演员资源。已有插画的面板不加载演员图集。弹入补间保持角色校准后的缩放值。退出时清理更新回调、释放当前章节插画和演员资源。

原生浏览器报告 `reports/art-pilot/comic-art-lifecycle-native.json` 验证全部7章插画退出后的GPU纹理删除、全部7章缺图回退演员及实际帧推进、第一章重复3次进入的监听器稳定和演员图集释放。第一章回退截图已人工查看；此检查不代表新增小怪动画或全部漫画动作的逐帧视觉审查。

同一漫画回归脚本支持 `--procedural`，通过 `?art=0` 验证7章缺图回退全部演员使用程序绘制、没有演员图像下载，且第一章3次进入监听器数量稳定。报告为 `reports/art-pilot/comic-art-lifecycle-procedural.json`。此项仅验证URL强制程序绘制模式，不证明设置界面提供了模式开关。

### 展示角色异步换图的动作保持（2026-10-21）

showcaseRig 从程序绘制回退切换为已加载的角色动画时，保留原外观的当前状态，避免覆盖调用方刚设置的结算庆祝动作。`scripts/check-showcase-load-state.mjs` 延迟胡萝卜、玉米、芦笋的图集请求，验证当前请求状态、校准后的相对缩放、位置、深度、旧对象销毁和更新回调清理。报告 `reports/art-pilot/showcase-load-state-native.json`。此项验证异步状态交接，不代表各角色都额外制作了 victory 动作，也不代替39角色结算页连续视觉验收。

### 结算页角色图集回收（2026-10-21）

showcaseRig 为每个展示对象分配独立持有者，对象销毁后释放持有者并在帧末回收零引用纹理；异步换图时由新实例继续持有。此前已加载图集直接复用时，结算页退出没有安排回收，图集会残留到后续其他清理事件。

`scripts/check-result-player-motion.mjs` 验证全部39个默认角色从 Game 进入模拟胜利结算再返回 Menu：展示期间纹理存在且动画实际推进，返回后对应 WebGL 句柄失效。未制作 victory 的后续角色只在探针中切到 move 检查播放，不增加额外动作。报告 `reports/art-pilot/result-player-motion-native.json`。此项是原生浏览器场景交接验收，不代表39角色完整通关、全部结算画面人工审查或手机真机验收。

### 同一选角页内的资源驻留（2026-10-21）

连续切换角色时，不再把看过的角色图集累积保留到场景退出。每个 showcase 独立持有加载资源，销毁时释放；被切走的待加载请求完成后同样安排清理。现存 SpriteVisual 引用继续保护共享纹理。

`scripts/check-selection-art-residency.mjs` 在同一个选角场景依次选择全部39个默认角色，等待加载及帧末清理后，角色身体图集均仅驻留当前1套，更新监听器恒为5。修复前切到胡萝卜即残留2套，证据保存在 `reports/art-pilot/selection-art-residency-before-fix.json`；修复后报告为 `reports/art-pilot/selection-art-residency-native.json`。头像缩略图仍按已有策略缓存，此检查不等同于全部GPU资源只有一张纹理。

### 加载中退出与角色快速切换（2026-10-21）

ArtRegistry 在所属加载场景关闭时清理被取消请求的 loading 状态和加载器关联，允许后续进入重新请求；等待其他场景加载器的调用也会在该加载场景退出时结束等待。取消不记为文件损坏或网络下载失败。

`scripts/check-selection-art-races.mjs` 实际拦截延迟三个角色的身体图集请求，快速切换后只展示并驻留最终选择；另在猕猴桃请求中退出，检查无残留身体资源状态，再进入并成功加载猕猴桃。修复前报告 `reports/art-pilot/selection-art-races-before-fix.json` 显示取消后永久 loading，修复后 `reports/art-pilot/selection-art-races-native.json` 三项通过。此检查覆盖同一选角场景的取消重试，跨场景等待另由 `scripts/check-art-loader-cancellation.mjs` 验证：两个真实 Phaser 场景共享延迟的猕猴桃图集请求，原加载场景停止后两方等待均结束，存活场景可重试，最后纹理及GPU句柄正常释放。报告 `reports/art-pilot/art-loader-cancellation-native.json`。这是合成场景的资源接口验证，不是完整双场景玩法验收。

### 第二章菜畦首版场景图层（2026-10-21）

最新制作顺序为场景→34精英→89小怪，精英小怪已获授权，额外皮肤后置。第二章地面、俯视稻草人和土堆使用内置 image_gen 生成，原图位于仓库外 `maps/ch2/`。`ART_CH2_SCENE_PLAN.json` 保存图像内部场地矩形和来自 arenas.ts 的三个原有圆障碍物；`scripts/build-scene-art.py` 只编译图层与缩略图，不修改玩法几何。

运行时地面与透明障碍层各有 low768、standard1024、高档原图1499×1049；缩略图最大256。高档画布验证为2560×1440，源图并非原生2K，不能把QHD输出当作原图细节达到2K。首版边界圆角与环境机关美术仍待继续审查，未标记整章场景最终完成。

`reports/art-pilot/scene-ch2-native.json` 记录3档实际图层尺寸、注册的世界变换与编译计划一致、三个障碍物中心误差小于1逻辑像素、只加载当前章节的大图、退出后GPU句柄删除。已查看高档实际游戏截图和全图概览；该检查不代替圆角边缘逐点对齐、手机真机和完整环境机关体验。游戏截图 `reports/art-pilot/scene-ch2-high.png`，概览 `scene-ch2-high-overview.png`。编译记录 `scene-ch2-compile.json`。

### 第二章环境机关与启动缩略图（2026-10-21）

MapArtEntry.objects 为章节环境机关声明贴图与逻辑显示尺寸。只在请求该章节 ground 时加载并由同一个场景持有者保护，缩略图请求不加载机关；缺图回退原有程序贴图。第二章5个洞口共享一张、2个洒水器共享另一张纹理，低/中/高档96/128/256。原画与256像素游戏编译中间图留仓库外，Git只保存WebP。

洞口保留120×80、洒水器77×77逻辑尺寸，位置与原机关逻辑不变。Terrain.pulse 分别补间 scaleX/scaleY，防止使用方形图集时丢失非等比显示比例；这是普通缩放反馈，不算逐帧动画。原生三档报告验证机关实例数、资源身份/档位、脉冲比例及回到初始尺寸；缺图报告另外实际中止机关下载，验证原贴图回退。全部大图与机关纹理在场景退出后回收。

第一章也改用独立256像素缩略图。原生测试排除Vite URL模块请求，仅统计image/xhr/fetch，验证启动不下载地图ground/foreground/机关插画。已查看第二章QHD实际画面和带碰撞调试层的全图，未把边界的人工观察当作逐点几何证明。源图1499×1049并非原生2K，最终细节质量验收保持待办。

### 第三章冰箱首版图层与第二章机关实战（2026-10-21）

第三章冷藏室地面及玻璃条由内置image_gen生成，原画在仓库外maps/ch3。编译器按原有4个矩形障碍生成玻璃层，未修改arenas.ts；保留中间800逻辑像素通道。三档地面/前景分别768、1024、1254像素宽，启动只加载256像素缩略图。scene-ch3-native.json验证实际图层世界变换、四段隔板中心与碰撞矩形一致、中央通道可通行、只加载本章大图并在退出后释放GPU；已查看QHD游戏画面与碰撞全图。动态冰面仍为程序图，整章最终视觉/性能验收未完成。

第二章实际Terrain.update及延迟回调检查见ch2-terrain-gameplay-native.json：兔子/土拨鼠从原洞口位置生成，土拨鼠500ms延迟、洒水器1s预警后浸湿玩家及敌人通过。测试提前触发机关计时并把目标放入范围，不是完整正常计时的章节通关。

### 第三章动态冰面首版（2026-10-21）

冰面原画由内置image_gen生成，源图保存于仓库外maps/ch3/ice-pilot-1.png。六个冰面实例共享同一章节纹理；低/中/高档宽96/128/256，高档保留256×180画布，避免方形打包后再非等比显示造成二次挤压。Terrain按逻辑显示尺寸计算淡入/淡出缩放，ICE_TUNING寿命、半径、打滑条件、位置选择和融化后补充算法均保留。此类缩放/淡出是原有机关反馈，不计为独立绘制逐帧。

scene-ch3-native.json和scene-ch3-fallback-native.json分别验证正常及实际中止冰面下载的程序回退：3档纹理、6实例共享、打滑判定、半寿命淡出alpha/缩放、12次过期替换后对象销毁和实例数不变，以及退出后的GPU回收。生命周期探针直接调用Terrain.update(0)以隔离规则，不代表整章自然计时实战。已查看QHD实际游戏画面。全部默认角色与非精英Boss仍共3245绘制帧，本次冰面不增加该数量。


### Chapter4 first scene integration
Generated ground and shared quicksand/acid assets use three quality tiers. No foreground texture is emitted for an arena without fixed obstacles. Acid is requested only from actual wave3 onward; ground/object scene ownership releases GPU textures on exit. Chapter4 native and missing-object fallback probes pass all three tiers, including cross-boundary samples and logical-size invariance. Terrain probes shorten timers and position targets; they do not establish full normal-timing chapter or native2K source-detail acceptance. Web and Steam runtime-only release checks pass.

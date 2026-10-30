# 全章节美术制作

目标：所有 89 种小怪（含召唤、分裂、地形生物）、34 种精英、18 位 Boss、37 张后续阶段形态，全部敌我弹体及 254 把武器（184 把普通/进化、70 把融合武器）制作并接入，沿用已选的可爱厨房漫画风格。第一章已验证素材继续保留；缺失项逐一制作，不以换色或通用替代图计作完成。

权威范围由玩法数据计算：`npx tsx scripts/inventory-global-art.ts`，输出 `reports/art-pilot/global-inventory.json`。该清单用于记录进度，不能替代最终逐项视觉与运行验收。

实体交付：单个角色一张透明 PNG，全身、完整轮廓、三分之四正面略朝右、光源左上；不含地面阴影或背景。按 alpha 可见范围校准脚底锚点与参考半径，保持玩法碰撞、伤害、攻速不变。词缀精英复用同种怪物插画并保留金色光环与原有状态提示；独立精英使用专属造型。

阶段形态：保持 Boss 身份、明确展示各阶段主题，接入已有冻结/暂停一致的转形态动画。武器需覆盖手持、商店/图鉴图标及对应攻击弹体；超武须有独立视觉差异。

弹体范围包含 184 种飞行弹丸及 18 种独立的地雷落地造型，共 202 张。地雷在场上显示对应食材制作的炸弹或陷阱，不再缩小复用手持发射器图片。

顺序：补齐第二至第七章敌人 → 全部精英/Boss及阶段 → 武器与敌我弹体；每批产出实际接入并生成对照预览，最终覆盖审计与全局运行验证通过后才完成目标。

2026-10-18 阶段验收：89 种小怪和 52 种精英/Boss 本体已全部接入，141 个实际生成的游戏对象验证通过，包含词缀光环、位置尺寸与碰撞半径检查。18 位 Boss 的 37 次后续阶段切换均通过实际扣血触发、最短阶段时间、暂停、冻结及对象池复用检查。生成图中南瓜藤蔓、冰淇淋星杖、废铁龙翅翼的裁边已使用生图模型修正，蛞蝓仅保留触角顶部的一对眼睛。

阶段形态对照预览：[第一组](../images/art-global/boss-forms-page1.png)、[第二组](../images/art-global/boss-forms-page2.png)、[第三组](../images/art-global/boss-forms-page3.png)、[第四组](../images/art-global/boss-forms-page4.png)、[第五组](../images/art-global/boss-forms-page5.png)、[第六组](../images/art-global/boss-forms-page6.png)。各图从左到右依次为本体及后续阶段，最终验收仍须包含全部武器、弹丸和构建结果。

提示词、生成来源和修订记录汇总于 [ART_GLOBAL_PROVENANCE.json](ART_GLOBAL_PROVENANCE.json)，使用内置 `image_gen`。原始透明 PNG 保存在仓库外 `../tomato-sister-art-source`；本地 `src/assets` 下的忽略别名仅用于制作流程；武器和弹丸在游戏内烘焙为适合实际显示尺寸的小纹理并释放大图纹理。

游戏加载 `src/assets/runtime` 中的 WebP 派生资源，制作原画保留不变。实体、地图和 Boss 阶段保持原始尺寸；武器派生图最长边 512，弹丸/地雷最长边 256，加载器按编译记录映射原画边界，随后生成原有游戏纹理。运行 `npm run art:bake` 重新编译，需安装 libwebp 的 `cwebp`；逐张登记脚本会自动编译新增图片。`npm run check:art-runtime` 校验源图 SHA-256、派生文件与尺寸，正式 `npm run build` 前自动检查，防止原画更新后误发旧缓存。

全量验收命令：`npm run check:global-art -- --complete`。弹丸范围直接由玩法数据推导，不依赖被 Git 忽略的本地生成报告。实体、阶段、武器和弹丸的浏览器验收分别运行 `node --import tsx scripts/preview-global-entities.mjs --complete`、`node --import tsx scripts/preview-global-boss-phases.mjs --complete`、`node scripts/preview-global-weapons.mjs` 与 `node scripts/preview-global-projectiles.mjs`。最后完成类型检查、代码检查、测试及正式构建后才能宣告全量交付。

用户追加的最终交付约束（2026-10-18）：

- 所有玩家角色及皮肤、小怪、独立精英、Boss 与阶段形态均使用真正的逐帧动画。当前静态插画、眨眼图和通用位移/缩放反馈不能计作动画完成。
- 动作覆盖实际会触发的待机、移动、攻击、受击、出生、死亡、蓄力、冲锋、施法、眩晕、胜利等场景；冻结与暂停保持当前帧。选角、菜单、图鉴、战斗及结算的外观入口一致，不只覆盖战斗。
- 最高渲染目标为 2560×1440（2K/QHD）；宽屏和手机横屏按实际宽高比适配，任何渲染目标均不得超过对应上限。素材档位按最终屏幕像素尺寸选择，不直接按手机 DPR 加载最大原图。
- 设置提供自动、低、标准、高画质档位，分别控制渲染分辨率、精灵/图集尺寸、动画帧率及特效预算；手机默认根据视口和设备能力选择，用户可主动降低配置。
- 所有图片按当前场景/当前波次及当前可见 UI 的需求加载。主菜单不得下载全部武器/弹丸，普通波次不得加载本波不可能出现的 Boss/阶段。商店仅请求货架、持有装备及当前弹窗需要的资源，图鉴按可见页请求。
- 以纹理键共享图集：同种小怪或弹丸的所有实例复用同一张纹理，不为单个实例创建 Canvas、复制帧或解码原图。对象池只复用实例，不应阻止已无使用者的纹理卸载。
- 场景、UI 和活跃对象持有资源租约；最后一位使用者释放后，清理 GPU 纹理、Phaser 缓存及解码图片引用。相邻阶段可有限预取，禁止无界预取整章或全图鉴。
- 使用共享裁切图集和边缘留白避免线性过滤串帧；按对象的屏幕尺寸分配像素预算。大量出现的小怪/弹丸优先控制总解码像素、GPU 字节、纹理切换与动画更新开销，而非仅压缩下载体积。
- 原画存放于仓库外 `../tomato-sister-art-source`，不进入 Git，也不进入发布包。本地忽略的源目录别名仅用于持续制作；发布只引用 `src/assets/runtime` 中的游戏资源。生产检查必须在没有外部原画目录的干净检出上通过。
- 运行资源按对象组织：`entities/<kind>/<id>/<base或phase-N>/<档位>/...`、`weapons/<id>/<档位>/...`、`maps/<chapter>/<档位>/...`；动作图集、头像、弹丸放在各自拥有者目录中。共享效果与剧情另设按 ID/章节划分的目录，不平铺所有图片。

当前动画与资源管理状态：完整逐帧动画、上述按场景动态加载/释放、画质分档和 2K 上限尚未完成。现有静态全量清单与 WebP 编译只证明前一阶段，不能替代这些新增验收项。最终须检查 2K 桌面、主流手机长宽比与 DPR、低配置档、连续切换场景后的内存/显存回落、密集小怪和弹幕，以及发布包无原画、无外部目录依赖。


## 首角色动画与画质试片

番茄妹基础外观已接入49帧、11个动作的共享精灵表，冻结保持当前帧。此为试片接入，跨场景与动作尺寸/锚点校准未完成，不计为全量动画生产验收。制作清单见 `ART_TOMATO_ANIMATION_PILOT.json`；原画和无损中间文件位于仓库外的 `tomato-sister-art-source`。

设置增加自动、低、标准、高画质，切换后重载。首角色动画帧尺寸分别为96、128、256像素，图集尺寸分别728、952、1848像素；RGBA基础纹理估算分别2.02、3.46、13.03 MiB，尚不等于实际进程或驱动总显存。当前仅首角色生成了这些素材档位，其他角色/怪物仍须继续制作。

渲染倍率上限按档位为1、1.5、2，同时按EXPAND实际宽高限制到2560×1440；后续缩放亦有画布上限。竖屏强制横屏的输入按画布实际CSS大小换算。`scripts/check-graphics-quality.mjs` 验证四种视口中只下载所选动画档位、画布上限、触摸/鼠标坐标；报告为 `reports/art-pilot/graphics-quality-native.json`。

波次加载试验已接入：主菜单不再预载全部弹丸；战斗按持有武器、当前波怪物及选定Boss加载弹丸和形态，并在场景结束时释放租约。浏览器检查确认首波仅加载10种通用/所需弹体，无后续波怪物和Boss形态；退出后怪物身体及插画弹体纹理回收，保留程序绘制回退图。共享纹理在最后一位场景使用者退出后删除WebGL纹理。18位Boss的37次实际阶段切换与全部202弹丸再次通过运行检查。

仍未完成：254种武器目前仍在启动时预载，需覆盖持有装备和所有可见UI的按需加载；普通Boss波次已验证预选与实际生成一致，仅加载选中Boss本体，退出后身体、阶段及弹体回收。专项测试还修复了加载器重用时完成监听未重新注册造成的纹理状态与回收缺口。当前检查不等于全局动态加载或最终性能验收。实际堆内存/显存/帧时间压测及最终发布包验收仍需执行。

武器加载迁移进度：战斗与暂停界面已按持有武器ID请求资源。专项浏览器验证在隔离旧启动预载的条件下，确认武器手持纹理跨场景共享、输入纹理释放、最后持有者退出后GPU纹理删除并恢复程序回退图。商店、选角、图鉴、合成和战绩等入口尚未迁移，启动仍预载254种武器；该专项通过不能视为全局按需加载完成。

## 默认玩家动画制作顺序与校准

最新优先级为39名玩家角色默认外观，额外156套皮肤暂缓；默认角色后制作Boss及阶段，精英与小怪等待用户通知。番茄妹49帧与胡萝卜骑士44帧均为11动作试片，不能计作完整生产验收。

胡萝卜骑士清单见 `ART_CARROT_ANIMATION_PILOT.json`。图集编译器支持每个动作选择站立参考帧，以同一180像素参考身高校准该动作所有帧，共用脚底旋转缩放中心，不单独缩放每帧，保留蹲伏与倒下等形变。全部11动作参考帧实测身高180像素，脚底位置230—231像素；越界校准直接拒绝。`python3 scripts/test-animation-calibration.py`验证形变保留与裁边拦截；`node scripts/preview-tomato-motion.mjs carrot`验证44帧播放、冻结与共享纹理。移动步态、跨场景和手机完整验收仍未完成。

辣椒姐默认动画试片已接入11动作44帧，低/标准/高三档图集已编译并使用参考身高180像素校准。清单 `ART_CHILI_ANIMATION_PILOT.json`；运行 `node scripts/preview-tomato-motion.mjs chili` 已验证全部44帧、冻结停帧与多实例共享纹理。闭眼两帧以20fps各播放一次，合计0.1秒；待机周期4秒。初稿移动尖端翻向的版本未接入，修订稿保持尖端方向。当前默认玩家试片3/39，完整跨场景/手机与视觉生产验收未完成。

默认角色场景专项已验证番茄妹、胡萝卜骑士、辣椒姐：真实选角展示与战斗使用同一动画纹理，暂停时角色动画时钟不推进，恢复后继续，能够返回主菜单。命令 `node scripts/check-player-scene-motion.mjs`，报告 `reports/art-pilot/player-scene-motion-native.json`。此检查发现并修复了界面重复刷新时未等待已有图片请求，导致永久显示程序化外观的竞争问题。胡萝卜骑士与辣椒姐各通过4个浏览器模拟视口/画质档位检查；不等于真机性能或全量视觉验收。玉米枪手已生成默认形象及4动作16帧草稿，未接入。

玉米枪手默认试片已接入11动作44帧，低/标准/高三档图集使用统一180像素参考身高校准。清单 `ART_CORN_ANIMATION_PILOT.json`。44帧实际播放、冻结与共享纹理通过；4种模拟视口的选档下载、QHD上限和输入坐标通过；选角/战斗/暂停恢复/返回菜单通过。默认角色试片4/39，仍不等于完整视觉及性能交付。原画及每个动作提示词位于仓库外 `../tomato-sister-art-source/drafts/char/corn`。

西瓜胖墩默认试片已接入11动作44帧，三档共享图集使用160像素参考身高校准以保留宽圆体型。清单 `ART_WATERMELON_ANIMATION_PILOT.json`；44帧播放、冻结与共享纹理，4种模拟视口，真实选角/战斗/暂停恢复/菜单均通过。默认试片5/39，完整视觉及最终性能验收仍未完成。

技能播放新增按实际动作帧能力选择表现：胡萝卜骑士先播放蓄力再播放冲锋，西瓜翻滚使用4帧图集并保持角色可见，未加载或无对应动作时仍使用原程序圆球。`node scripts/check-player-skill-motion.mjs` 实际触发两角色技能，验证冲锋/翻滚4帧、可见性及程序回退，并核对西瓜命中半径62、反弹、重复命中间隔0.3秒和击退160未变。399项单元测试通过。原画与提示词均位于仓库外。

柠檬刺客默认试片已接入11动作44帧和三档图集，清单 `ART_LEMON_ANIMATION_PILOT.json`。受击修订版删除多余黑色符号，面罩和围巾保留。44帧播放、冻结/共享纹理、4种模拟视口和六角色跨场景检查通过。真实隐身技能验证施法4帧、半透明、2.5秒隐身、诱饵释放及现身突袭。默认试片6/39，完整视觉及最终性能验收未完成。

普通武器攻击与布雷现在在角色处于待机或移动时播放已有攻击动作，不打断正在播放的攻击、施法、冲锋、受击、冻结、眩晕或死亡。`node scripts/check-player-attack-motion.mjs` 在六名角色真实自动开火时验证4帧和优先级；无攻击逐帧素材的程序形象继续沿用原表现。柠檬现身突袭也使用同一入口。399项单元测试通过。


### 茄子法师默认动画试片

已接入 11 动作、44 个绘制帧与 low/standard/high 三档共享图集，闭眼帧单次 0.1 秒。原画、提示词、被拒版本及关键帧合成来源均保存在仓库外 `tomato-sister-art-source/drafts/char/eggplant`。选择清单位于 `ART_EGGPLANT_ANIMATION_PILOT.json`。移动/冲刺的相反接触帧来自独立生成的 opposite-contact，未镜像整个人物；冲刺步态衔接仍需视觉细化。登场、施法选择无背景光晕的第三版。

原生浏览器验证：11 动作 44 帧、冻结时钟、共享纹理，四种画质/屏幕组合及单档下载，普通武器攻击四帧和状态优先级，全部七角色选角→游戏→暂停/恢复→菜单均通过。TypeScript 与 runtime 资源索引检查通过。当前默认角色已接入试片 7/39，313 绘制帧；这些检查不代表全动作视觉、性能或发布验收完成。


### 大蒜伯爵默认动画试片

已接入 11 动作、44 帧与三档共享图集；闭眼帧 0.1 秒。清单 `ART_GARLIC_ANIMATION_PILOT.json` 保留选用版本，原画与被拒版本/提示词/关键帧来源留在仓库外。共同参考高度 160 像素，避免冲刺披风越界，不裁剪姿势。移动/冲刺采用独立生成的相反接触帧，冲刺衔接仍待细化。

原生播放44帧、冻结时钟、共享纹理，四种屏幕/画质组合和单档下载、八角色选角→游戏→暂停/恢复→菜单均通过。大蒜默认光环是被动武器，攻击验证在隔离浏览器中临时装备 pea_shooter，确认四攻击帧及状态优先级，不改光环行为。TypeScript、目标 lint 与 runtime 索引通过。默认角色已接入试片8/39，共357绘制帧；完整视觉和性能验收未完成。


### 蓝莓双子默认动画试片

接入11动作44帧与三档共享图集，闭眼0.1秒，参考高度170像素。原画/提示词/被拒版本/合成来源均在仓库外。选择清单 `ART_BLUEBERRY_ANIMATION_PILOT.json`：受击v4、蓄力v5以干净待机图作参考解决背景光晕，冲刺v4后两帧镜像被弃，改为独立相反接触帧与移动过渡帧，冲刺衔接仍待细化。

原生44帧播放、冻结、共享纹理、四种画质/屏幕组合及单档下载、普通攻击和九角色跨场景检查通过，TypeScript/lint/runtime索引通过。双分身 echo 补充可选 onAttack 通知调用 tryAttackAnimation，现有399测试/54文件通过；真实双分身技能的8秒生命周期、攻击/退场及共享纹理仍需原生验证。默认已接入试片9/39，共401帧，完整视觉与最终性能验收未完成。


蓝莓真实双分身补充验证：技能到期与挡弹击破两条退场路径均通过，每个分身完整播放4登场、4攻击、4死亡帧，与本体共用同一纹理，退出后对象销毁、weaponClones和bulletShields归零。修复了分身移出战斗列表后停止tick、死亡卡首帧并残留的问题；现由短暂visual-only linger推进退场动画。检查脚本 `scripts/check-blueberry-clone-motion.mjs` 及 `--blocked`，报告在 reports/art-pilot，399测试/54文件、TypeScript和目标lint通过。


### 菠萝船长默认动画试片

已接入11动作44绘制帧、三档共享图集，闭眼0.1秒，参考高度180像素。清单 `ART_PINEAPPLE_ANIMATION_PILOT.json`：攻击/受击v2去除背景光晕，冲刺v2修正换脚，其他八动作v1。眼罩始终保持角色同侧，原画/提示词/被拒版本留仓库外。

原生44帧/冻结/共享纹理、四种屏幕和画质组合单档下载、普通攻击及十角色跨场景检查通过；TypeScript、目标lint和runtime索引通过。黄金炮击实际技能cast仍待单独验证，完整视觉/性能验收未完成。默认已接入试片10/39，共445绘制帧。


菠萝黄金炮击原生补验通过：实际技能触发4个cast帧、3枚炮弹及3次爆炸，保证掉落标识保持，炮弹结束后销毁。脚本 `scripts/check-pineapple-skill-motion.mjs`，报告 `reports/art-pilot/pineapple-skill-motion-native.json`。南瓜幽灵角色原画已生成并保存在仓库外；白色兜帽、漂浮布尾、可见琥珀眼，无脚，尚未制作动作表或接入。


### 南瓜幽灵默认动画试片

接入11动作44帧和三档共享图集，闭眼0.1秒、漂浮布尾、无脚。选择清单 `ART_PUMPKIN_ANIMATION_PILOT.json`，移动/攻击v3扩大透明格间隔通过分帧，蓄力/眩晕/倒下v2修正背景与多余符号，原画和提示词及被拒版本在仓库外。

原生44帧、冻结时钟、共享纹理、四种屏幕和画质组合单档加载、普通攻击、十一角色跨场景通过。实际灵体化验证4cast帧、2.5秒无敌半透明、诱饵、接触伤害和结束后alpha恢复通过，报告 `reports/art-pilot/pumpkin-skill-motion-native.json`。TypeScript、目标lint、runtime索引通过。默认试片11/39，共489帧；完整视觉与最终性能/发布验收仍未完成。用户要求每完成一个角色接入验证后报告一次进度。


### Strawberry default animation integration

- 11 authored actions / 44 frames, three compiled quality tiers; default players now 12/39 and 533 authored frames.
- Repaired move/charge foot alternation and removed background glow from attack/windup/die/cast with clean idle identity reference. Source sheets and prompts remain outside Git in sibling art-source directory.
- Native verification passed: all 44 frames, frozen clock, shared texture, four mobile/QHD viewport and tier cases, selection/gameplay/pause/menu lifecycle, real automatic attack and state priority. Actual idol buff verifies all four cast frames and six-second expiry.
- Typecheck, targeted lint and runtime resource index checks passed. Closed-eye frame is 0.1 seconds in four-second idle cycle. Full visual transition/gait and final stress/release acceptance remain pending.


### Ginger default animation integration

- 11 authored actions / 44 frames, low/standard/high compiled tiers. Default player integration now 13/39, 577 authored frames.
- Selected idle v2 for complete outer margins, charge v2 for opposite foot contacts, die v2 without surprise symbols; other eight sheets v1. Originals and prompts remain outside Git.
- Native checks passed all44frames, shared texture, frozen clock, four mobile/QHD cases, selection/gameplay/pause/menu lifecycle and automatic attack/state priority. Actual ninja skill verifies four cast frames,396px teleport,.6sec invulnerability and350ms timer with one delayed path hit. Timer verification uses Phaser TimerEvent elapsed, avoiding scene-frame sample phase discrepancy.
- Typecheck, targeted lint and runtime index passed. Closed-eye duration0.1sec per4sec idle. Full visual transition/gait, stress and release acceptance remain pending.


### Avocado default animation integration

- 11 authored actions /44 frames across three compiled tiers. Default player integration now14/39,621 authored frames.
- Selected move/attackv2 fixes facial mirroring and background glow; chargev3 composes existing generated poses with independently generated opposite-contact frame2. External derivation metadata preserves sources; no invented or mirrored drawings. Full gait transition refinement remains pending.
- Native checks passed44frames, frozen clock, sharedtexture, four mobile/QHD tier/download/pointer cases, selection/gameplay/pause/menu, automatic attack/statepriority. Actual core overload verifies four castframes and five explosions.
- Typecheck, targeted lint and runtime index passed. Blink closed0.1sec/foursecondidle. Originals/prompts external only. Fullvisual,stress and release acceptance pending.


### Onion default animation integration

- 11 authored actions /44frames across three compiled tiers. Default players now15/39,665 authored frames.
- Idle/move/charge/cast/victoryv2 clean spawn reference; hurtv3 removes detached shadow residue; otherfivev1. Hat brim consistently screenright; move alternating contacts; blinkclosed0.1sec. Originals/prompts remain external.
- Native checks passed all44frames, sharedtexture, frozenclock, four mobile/QHDcases, selection/gameplay/pause/menu, automatic attack/statepriority. Actual tearGas verifies four castframes, sustained damage and12clouds destroyed after field expiry.
- Typecheck,targetedlint,runtimeindexpassed. Fullvisual/gait,stress and release acceptance remainpending.


### Mushroom default animation integration

- 11 authored actions /44frames, three compiled quality tiers. Default players16/39,709 authored frames.
- Idle/victoryv1; otherninev2 using cleanidle reference removes glow, mirrored capspotpattern and detached death marks. Blinkclosed0.1sec. Originals/prompts external only.
- Nativechecks passed44frames, sharedtexture, frozenclock, four mobile/QHDcases, selection/gameplay/pause/menu, automatic attack/statepriority. Actual sporeCloud verifies four castframes, repeated poison applications and18fogimages cleanup.
- Typecheck,targetedlint,runtimeindexpassed. Fullvisual/gait,stress and release acceptance pending.


### Coconut default animation integration

- 11actions44authoredframes,three compiledtiers. Defaultplayers17/39,753frames. Selected idle/move/attack/hurt/castv2 cleanspawnreference;other6v1. Blinkclosed0.1sec;externaloriginals/prompts.
- Native44frames/sharedtexture/frozenclock, fourmobile/QHDcases, all17selection/gameplay/pause/menu, automaticattack passed. ActualgroundPound verifies fourcastframes/fixedscale/invulnerability/impactdamage; proceduralfallback riseandrestoration verified.
- Authoredcast skips generic1.45scale. Fixedprocedural rise/landing tweencompetition by stoppingrise beforelanding and explicitlyrestoringbase onimpact; originalimpacttiming preserved. Tsc/lint/runtimeindexpassed.
- Scene/graphics completed assertionsandreports; Chrome closehung and exact verifiernodeprocesses terminated afterward. Fullvisual/gait,stress/releaseacceptance pending.


### Grape default animation integration

- 11actions44frames,three compiledtiers;defaultplayers18/39,797frames. Spawn/castv2 removesglow;other9v1. Blinkclosed0.1sec. Externaloriginals/prompts.
- Native44frames/sharedtexture/frozenclock,fourmobile/QHDcases,all18selection/gameplay/pause/menu,automaticattack passed. Actualdecoy verifies4cast/4spawn/4deathframes,sharedplayertexture,oneexpiryexplosion and finalcleanup.
- Authoreddecoy skips extra codehat,playsexplicitspawn;deathretirement ticks until disposal. Tsc/lint/runtimeindexpassed. Scene/graphics assertions/reports completed butbrowserclosehung; exactverifiernodes terminatedafterward. Fullvisual/gait,stress/releasepending.


### 樱桃默认角色动画试片（第 19 / 39 个）

- 11 个动作、44 个独立绘制帧已编译并接入，累计 841 帧。默认待机闭眼帧持续 0.1 秒。
- 选用 idle/victory v3，其余十组 v2；胜利动作旁的游离色点经内置生图模型修复。原画和提示词保留在仓库外 `tomato-sister-art-source/drafts/char/cherry/`。
- 原生浏览器验证通过：11 动作 44 帧、冻结时钟、共享纹理；四种手机/2K/超宽画面只下载所选画质档；19 个角色选人→战斗→暂停恢复→返回菜单；樱桃普通攻击四帧及状态优先级。
- 实际双枪技能验证通过：四个施法帧、12 发左右交替子弹。施法结束后的持续射击触发已绘制攻击动作；首发测试等待敌人索引建立。类型检查、针对性 lint、运行资源清单检查通过。
- 图集尺寸低 728² / 中 952² / 高 1848²；原画不进入 Git 与发布包。完整视觉/步态、最终性能及发布验收仍待完成。
- 下一位：豌豆默认角色。精英与小怪继续等待用户指示。


### 豌豆默认角色动画试片（第 20 / 39 个）

- 11 动作、44 独立绘制帧已接入，累计 885 帧；待机第 2 帧闭眼 0.1 秒。原画和提示词保留在仓库外 `tomato-sister-art-source/drafts/char/pea/`。
- 选用 attack/hurt/charge v2，其余八组 v1。初版攻击/冲刺朝向翻转、受击附加符号均已退回并由内置生图重做，修正版逐图检查通过。
- 原生浏览器通过：11 动作 44 帧、冻结时钟、共享纹理；手机低/中、桌面2K及超宽四种画质下载与指针映射；20 个默认角色选人→战斗→暂停恢复→菜单；普通攻击四帧与状态优先级。
- 实际炮台技能显示四个施法帧，记录 20 颗豌豆子弹及到期炮台销毁。炮台目前仍为独立程序绘制对象，其美术替换与后续完整视觉验收仍需处理；没有将其计作新增逐帧角色。
- 图集低728² / 中952² / 高1848²，运行资源清单检查、类型检查、针对性lint通过；全量399个测试 / 54文件通过。浏览器退出曾延迟，最终正常退出；新增有界退出帮助函数仅清理验证脚本自身浏览器。
- 完整视觉/步态、性能与发布验收仍未完成。下一位：桃子默认角色。


### 桃子默认角色动画试片（第 21 / 39 个）

- 11 动作、44 独立绘制帧已接入，累计 929 帧，待机闭眼 0.1 秒。原画/提示词在仓库外 `tomato-sister-art-source/drafts/char/peach/`。
- idle/stun/die/victory 用 v1，其余七组初版大面积背景光晕退回，基于干净待机图重生 v2，逐图检查后编译。光环边缘和步态细节仍属于完整视觉验收待办。
- 原生验证通过：44帧/11动作、冻结时钟、共享纹理，手机低/中和桌面2K/超宽四种画质下载/指针映射，21个角色跨选人/战斗/暂停恢复/菜单；普通攻击四帧及技能优先级。
- 祝福技能美术模式不再创建额外程序翅膀和光环；保留光束、粒子、伤害及治疗。原生/程序两种模式均验证初始伤害、三次实际回血、光束和翅膀对象到期清理。夹具在降低血量前禁用自动施法，避免将两次施法误记为一次。
- 类型检查、针对性lint、运行资源检查通过；399测试/54文件通过。通用场景/画质验证脚本改用有界浏览器退出并重跑正常退出。
- 三档图集728²/952²/1848²。完整视觉、最终性能、发布包验收仍待完成。下一位：火龙果默认角色。


### 火龙果默认角色动画试片（第 22 / 39 个）

- 11 动作、44 独立绘制帧接入，累计 973 帧，闭眼 0.1 秒。原画/提示词保留在仓库外 `tomato-sister-art-source/drafts/char/dragonfruit/`。
- move/windup v2，其余九组 v1。行走初版重复同侧抬脚，蓄力初版贴近外边缘，均退回生图修正；新版行走有相反脚接触、尾巴保持左侧，编译边界检查通过。
- 11动作44帧/冻结时钟/共享纹理、四种手机和2K画质下载及指针映射、22角色跨场景、普通攻击四帧及优先级原生检查通过。
- 龙焰冲锋显式进入已绘制 charge 并在结束时恢复 idle。实际技能两种模式均冲锋约340像素；美术模式显示四个冲锋帧；固定路径敌人记录初始碰撞及后续火焰带伤害，持续效果到期清理，冲锋状态结束。未改变程序模式的移动和伤害规则。
- 三档图集728²/952²/1848²，类型检查、针对性lint、运行资源清单及399测试/54文件通过。完整视觉/步态、性能和发布验收仍待完成。
- 下一位：甜菜默认角色；精英/小怪继续等待用户通知。


### 甜菜与芦笋并行动画试片（第 23、24 / 39 个）

- 两名角色各11动作44独立绘制帧，累计1061帧。每名角色闭眼0.1秒，三档图集728²/952²/1848²。原画和每张提示词均在仓库外对象目录。
- 甜菜选idle/move/windup v2、cast v3、其余v1。初版待机/行走光晕、蓄力手部轮廓、施法白点退回；cast v2局部修补未成功，v3从干净参考重新生成后通过图片检查。
- 芦笋选charge v2，其余v1。初版冲刺重复同侧抬脚退回，新版相反脚接触。
- 两名角色均通过原生11动作44帧/冻结时钟/共享纹理、四种手机/2K画质下载及指针映射、24角色跨选人/战斗/暂停恢复/菜单、普通攻击四帧及优先级检查。
- 甜菜狂暴实测四帧施法、暴怒/嗜血生效与到期清理。美术模式跳过通用缩放心跳；程序模式保留并恢复基准缩放。芦笋显式切换四帧蓄力→四帧施法，400毫秒释放并命中两个路径目标。
- 类型检查、针对性lint、运行资源检查、399测试/54文件通过。完整视觉/步态、最终性能和发布验收仍未完成。
- 并行测速：同样最多3个生图请求并发，19张交错动作图队列709.3秒，原始吞吐1.61张/分钟；16张初检通过，3张返工。此前3张104秒只是单批观察，缺少匹配质量基线，不能宣称跨角色并行提速。测速报告位于reports/art-pilot/parallel-benchmark.json；一次性automation-2已删除，保留30分钟更新。

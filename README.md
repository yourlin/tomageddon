# 番茄酱 Tomageddon

**中文** · [English](README.en.md)

🎮 **在线试玩：<https://yourlin.github.io/tomageddon/>**（推送到 main 后由 GitHub Actions 自动发布）

俯视角 2D 割草生存 Roguelite 浏览器游戏。Phaser 3（WebGL）+ TypeScript + Vite，支持 PC 与移动端横屏，**中英双语**。**美术与背景音乐全部程序生成**，无需任何图片或音频资源即可运行。

## 目录

- [世界观](#世界观)
- [玩法](#玩法)
  - [核心循环](#核心循环)
  - [操作](#操作)
  - [成长与经济](#成长与经济)
- [内容设定](#内容设定)
- [文档](#文档)
- [开发](#开发)
  - [运行](#运行)
  - [调整数值](#调整数值)
  - [多语言](#多语言)
  - [代码规范](#代码规范)
  - [平衡测试](#平衡测试)
  - [版本号](#版本号)
  - [替换美术（可选）](#替换美术可选)
  - [调试](#调试)
- [许可证](#许可证)

## 世界观

番茄酱小镇被“腐烂”侵蚀：霉菌、害虫和成了精的厨具四处作乱。番茄妹与蔬果伙伴们从深夜厨房出发，穿过荒芜菜园、冰封冰箱、城市垃圾场，一路打进番茄酱工厂，击败腐烂之源。

## 玩法

### 核心循环

1. **选角色与章节**：每名[角色](docs/CHARACTERS.md)有独特的属性、被动、初始武器和主动技能。
2. **波次战斗**：每章 15 波，每波 20~60 秒。武器自动索敌攻击，玩家负责走位躲避弹幕、预警圈、激光与冲锋，并在合适时机释放[技能](docs/SKILLS.md)。
3. **精英与 Boss**：第 5、10 波出现[精英](docs/MONSTERS.md#elites)，第 15 波迎战 [Boss](docs/MONSTERS.md#bosses)（90 秒后狂暴，伤害持续叠加直到分出胜负）。每局从章节池中随机抽取，重玩性高。
4. **波间整备**：结算收获与利息 → 升级选属性 → 开宝箱 → 商店买卖[武器](docs/WEAPONS.md)与[道具](docs/ITEMS.md)、合成升品、刷新、锁定。
5. **成就与解锁**：通关解锁下一[章节](docs/CHAPTERS.md)；达成[成就](docs/ACHIEVEMENTS.md)（铜/银/金/钻石多级奖章）获得成就点，用成就点购买新角色，部分角色需先达成指定成就。

战斗中，玩家与敌人共用一套 [Buff / Debuff](docs/SKILLS.md#statuses)：中毒、冰冻、诅咒、破甲……对上护盾、怒气、急速、再生，彼此博弈。

### 操作

| 平台   | 移动                           | 技能         | 暂停     |
| ------ | ------------------------------ | ------------ | -------- |
| PC     | WASD / 方向键                  | 空格         | ESC / P  |
| 移动端 | 左侧屏幕任意处按下出现浮动摇杆 | 右下技能按钮 | 右上按钮 |

**手机与微信**

- 主菜单和暂停菜单都有「全屏」按钮；手机上首次点击屏幕会自动尝试进入全屏并锁定横屏
- iPhone 的 Safari 与微信受系统限制无法网页全屏：点全屏按钮会给出引导。Safari 可「分享 → 添加到主屏幕」，从桌面图标启动即为全屏横屏；微信可点右上角「···」→「在浏览器打开」
- 安卓微信通常可以直接全屏

### 成长与经济

- 击杀掉落**番茄籽**（经验 + 货币）、果实（回血）、宝箱（道具）
- 21 项属性：生命、再生、吸血、伤害、近战/远程/元素、攻速、暴击、射程、护甲、闪避、移速、幸运、收获、拾取、经验、技能冷却/伤害/范围/持续
- 同名同品质武器两两合成升级（T1~T4）；道具可无限叠加（部分有上限）
- 存钱罐类道具提供利息；每波开始生命回满
- 浏览器本地存档：永久进度 + 局内存档（主菜单「继续游戏」）

## 内容设定

| 类别        | 数量      | 说明                                                                                                                                                | 文档                                                              |
| ----------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| 角色        | 33        | 均衡、近战坦克、远程射手、元素状态、暴击刺杀、生存闪避、经济成长、爆破狂暴等流派                                                                    | [角色](docs/CHARACTERS.md)                                        |
| 技能        | 33        | 13 种形态：周身爆发、发射 AOE、全屏、单体连发、禁锢领域、群体减益、自身增益、无敌潜行、突进、轰炸、环形弹幕、吸取回复、召唤分身；冷却按威力自动计算 | [技能](docs/SKILLS.md)                                            |
| 状态        | 28        | 16 种减益 + 12 种增益，玩家与敌人共用                                                                                                               | [状态效果](docs/SKILLS.md#statuses)                               |
| 武器        | 18        | 近战 / 远程 / 元素，9 种攻击方式，4 个品质                                                                                                          | [武器](docs/WEAPONS.md)                                           |
| 道具        | 562       | 42 件经典道具 + 52 个主题系列 × 10 件，强度预算制保证同稀有度强度一致                                                                               | [道具](docs/ITEMS.md)                                             |
| 怪物        | 25 + 2    | 25 种小怪（10 种 AI 行为）+ 2 种地形生物                                                                                                            | [怪物](docs/MONSTERS.md)                                          |
| 精英 / Boss | 30 / 15   | 11 种招式、二阶段、狂暴；12 种精英词缀                                                                                                              | [精英](docs/MONSTERS.md#elites) · [Boss](docs/MONSTERS.md#bosses) |
| 成就        | 136       | 分级奖章（铜/银/金/钻石），成就点用于购买角色；每名角色都有开局与通关成就，每名精英与 Boss 都有首杀成就                                             | [成就](docs/ACHIEVEMENTS.md)                                      |
| 关卡        | 5 × 15 波 | 深夜厨房、荒芜菜园、冰封冰箱、城市垃圾场、番茄酱工厂；每章 2~3 种地形机关                                                                           | [关卡](docs/CHAPTERS.md)                                          |

美术全部程序绘制：Canvas 卡通渲染 + 部件骨骼 + 12 种动画状态（待机/移动/攻击/受击/蓄力/冲锋/眩晕/冰冻/施法/出生/死亡/胜利）。

背景音乐全部程序生成：WebAudio 实时合成的电子风格循环音乐，主菜单、商店、Boss 战与 5 个章节各有独立曲风（速度、调式、和弦进行、鼓组与旋律各不相同）。

## 文档

| 文档                          | 内容                                                    |
| ----------------------------- | ------------------------------------------------------- |
| [角色](docs/CHARACTERS.md)    | 全部角色的定位、被动、属性、初始武器、技能与解锁方式    |
| [技能与状态](docs/SKILLS.md)  | 技能规则、13 种形态、每个技能的数值；全部 Buff / Debuff |
| [武器](docs/WEAPONS.md)       | 全部武器的攻击方式、品质数值、特效                      |
| [道具](docs/ITEMS.md)         | 稀有度与强度预算、升级选项、经典道具与全部系列          |
| [怪物](docs/MONSTERS.md)      | 小怪、精英、Boss 的行为、招式、二阶段与词缀             |
| [关卡](docs/CHAPTERS.md)      | 波次规则、每章难度、地形机关、怪物池、精英与 Boss 池    |
| [成就](docs/ACHIEVEMENTS.md)  | 全部成就的等级目标与成就点、角色价格与前置成就          |
| [设计文档](docs/GDD.md)       | 系统设计、公式、美术与动画、平衡方法、技术架构          |
| [数值表](docs/DATA_TABLES.md) | 全部数值总表                                            |

以上除设计文档外均由 `npm run docs` 从 `src/data/` 自动生成，文档之间相互链接。角色、武器、道具、怪物、精英与 Boss 均配有图片，由 `npm run docs:images` 直接调用游戏的程序化绘制代码导出；修改外观后需重新导出。

## 开发

### 运行

```bash
npm install
npm run dev        # 开发服务器（--host，手机同一局域网可直接访问）
npm run build      # 生产构建到 dist/，纯静态文件，可部署到任意静态托管
npm run preview    # 预览构建结果
npm run release    # 发布：版本号 +0.0.1 后构建（release:minor / release:major 升次/主版本）
npm run typecheck  # TypeScript 类型检查
npm run lint       # ESLint 检查（lint:fix 自动修复）
npm run format     # Prettier 格式化（format:check 仅检查）
npm run docs       # 从数据重新生成中英双语文档（docs/ 与 docs/en/）
npm run docs:images # 从游戏程序化绘制导出文档配图到 docs/images/（需要 Chrome）
npm run balance    # 构建并跑无头平衡测试（参数见下文）
```

### 调整数值

所有数值在 `src/data/` 下：`balance.ts`（全局公式）、`characters.ts`、`weapons.ts`、`items.ts`、`enemies.ts`、`bosses.ts`、`chapters.ts`。改完运行 `npm run docs` 同步文档。

### 多语言

- 支持中文 / English。默认跟随浏览器语言，可在「设置 → 语言」切换（切换后重新加载），或用 URL 参数 `?lang=en` / `?lang=zh` 强制指定
- 界面文字用 `tx('中文', 'English')`（`src/i18n/index.ts`）；数据文字（角色、道具、怪物等）的英文在 `src/i18n/en/*.ts`，按 id 对应，启动时由 `src/i18n/apply.ts` 写回数据
- 新增数据时需同步补充英文条目；文档由 `npm run docs` 同时生成中英两版

### 代码规范

- ESLint（`eslint.config.js`，TypeScript 推荐规则）+ Prettier（`.prettierrc.json`，行宽 140、单引号）
- 提交前运行 `npm run lint && npm run format:check && npm run typecheck`
- TypeScript 固定为 6.0.x：TypeScript 7 不再提供 typescript-eslint 所需的编译器 API

### 平衡测试

```bash
npm run balance -- --chapters 1,2,3 --runs 2 [--workers 8] [--speed max] [--chars corn,tomato] [--timeout 240] [--fresh]
```

- 多个无头 Chrome 页面并发，默认并发数 = CPU 核数；测试模式不渲染画面，`--speed max`（默认）每帧在时间预算内尽可能多地模拟
- 每次产出 HTML 报告：`docs/reports/balance-<时间>.html`（未跑完的带 `-partial` 后缀），`docs/BALANCE_REPORT.html` / `.md` 为最新一次；报告不提交到仓库
- 每局完成即写入 `scripts/.batch-progress.json`；中断（Ctrl+C、崩溃、断电）后**用相同参数重新运行即自动续跑**，`--fresh` 从头开始
- 手动重新生成报告：`node scripts/report.mjs`

### 版本号

版本号以 `package.json` 的 `version` 为准，构建时注入并显示在主菜单标题下方（开发模式带 `-dev` 后缀）。发布一律用 `npm run release`，会自动递增版本号。

### 替换美术（可选）

把图片放进 `src/assets/`（任意子目录），**文件名即资源 key**：
`arena_ch1~5`（地图）、`item_<id>`、`weapon_<id>`、`icon_weapon_<id>`、`char_/enemy_/boss_<id>`（图鉴缩略图）；音频 `sfx_hit.mp3`、`bgm_menu.mp3` 等。同名音频文件优先于程序生成的音效与音乐。

### 调试

浏览器控制台可访问 `game`、`run`（当前对局状态）、`controls`、`GameScene`。例如：

```js
GameScene.simSpeed = 4; // 战斗 4 倍速模拟
await import('/scripts/bot.js');
startBot('corn', 1); // 自动化平衡测试机器人
run.seeds += 500; // 加番茄籽
```

## 许可证

[MIT](LICENSE)

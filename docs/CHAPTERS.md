# 关卡（5 章 × 15 波）

**中文** · [English](en/CHAPTERS.md)

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · **关卡** · [设计文档](GDD.md) · [数值表](DATA_TABLES.md)

> 由 `npm run docs` 从 `src/data/*.ts` 自动生成，请勿手改。

每章 15 波：第 5、10 波出现[精英](MONSTERS.md#elites)，第 15 波为 [Boss](MONSTERS.md#bosses)。通关解锁下一章与新[角色](CHARACTERS.md)。

## 目录

- [波次规则](#waves)
- [章节](#chapters)
  - [第一章 · 深夜厨房（Midnight Kitchen）](#chapter-1)
  - [第二章 · 荒芜菜园（Wild Garden）](#chapter-2)
  - [第三章 · 冰封冰箱（Frozen Fridge）](#chapter-3)
  - [第四章 · 城市垃圾场（Junkyard）](#chapter-4)
  - [第五章 · 番茄酱工厂（Ketchup Factory）](#chapter-5)

<a id="waves"></a>

## 波次规则

- 每章都从 0 级开局，章节倍率渐进生效：`1 + (倍率−1) × (0.1 + 0.9 × (波次−1)/14)`
- 波次时长 `min(20 + 5×(波次−1), 60)` 秒，Boss 波 90 秒；每波开始生命回满
- 波次结束：结算收获与利息 → 升级选属性 → 开宝箱 → 商店（买卖、合成、刷新、锁定）

| 波次 | 时长(s) | 刷怪间隔(s) | 每批数量 | 升级所需经验 |
| --- | --- | --- | --- | --- |
| 1 | 20 | 2.40 | 2 | 16 |
| 2 | 25 | 2.40 | 2 | 25 |
| 3 | 30 | 1.88 | 3 | 36 |
| 4 | 35 | 1.80 | 4 | 49 |
| 5 | 40 | 1.73 | 5 | 64 |
| 6 | 45 | 1.65 | 5 | 81 |
| 7 | 50 | 1.58 | 5 | 100 |
| 8 | 55 | 1.50 | 6 | 121 |
| 9 | 60 | 1.43 | 6 | 144 |
| 10 | 60 | 1.35 | 7 | 169 |
| 11 | 60 | 1.28 | 7 | 196 |
| 12 | 60 | 1.20 | 7 | 225 |
| 13 | 60 | 1.13 | 8 | 256 |
| 14 | 60 | 1.05 | 8 | 289 |
| 15 | 90 | 1.00 | 9 | 324 |

<a id="chapters"></a>

## 章节

<a id="chapter-1"></a>

### 第一章 · 深夜厨房（Midnight Kitchen）

> 厨房里长满了霉菌，番茄妹的冒险从这里开始。

| 项目 | 内容 |
| --- | --- |
| 难度倍率 | 生命 ×1 · 伤害 ×1 · 速度 ×1 |
| 地形机关 | 热油飞溅：地面会溅起灼烧油池<br>下水道口：定期钻出小怪<br>偶尔会有新鲜番茄从天而降 |
| 精英池 | <img src="images/boss/roach_general.png" width="24" height="24" alt=""> [蟑螂将军](MONSTERS.md#boss-roach_general)、<img src="images/boss/mold_elder.png" width="24" height="24" alt=""> [霉菌长老](MONSTERS.md#boss-mold_elder)、<img src="images/boss/greasy_pan.png" width="24" height="24" alt=""> [油腻平底锅](MONSTERS.md#boss-greasy_pan)、<img src="images/boss/fork_knight.png" width="24" height="24" alt=""> [叉子骑士](MONSTERS.md#boss-fork_knight)、<img src="images/boss/fly_swarm_king.png" width="24" height="24" alt=""> [蝇群之主](MONSTERS.md#boss-fly_swarm_king)、<img src="images/boss/rotten_onion.png" width="24" height="24" alt=""> [腐烂洋葱](MONSTERS.md#boss-rotten_onion) |
| Boss 池 | <img src="images/boss/mold_king.png" width="24" height="24" alt=""> [霉菌大王](MONSTERS.md#boss-mold_king)、<img src="images/boss/grease_chef.png" width="24" height="24" alt=""> [油烟怪厨](MONSTERS.md#boss-grease_chef)、<img src="images/boss/cockroach_emperor.png" width="24" height="24" alt=""> [蟑螂皇帝](MONSTERS.md#boss-cockroach_emperor) |

**怪物池**

| 小怪 | 出现波次 | 权重 |
| --- | --- | --- |
| <img src="images/enemy/mold.png" width="32" height="32" alt=""> [霉菌团](MONSTERS.md#enemy-mold) | 1+ | 10 (29%) |
| <img src="images/enemy/fly.png" width="32" height="32" alt=""> [果蝇](MONSTERS.md#enemy-fly) | 2+ | 5 (15%) |
| <img src="images/enemy/rotten_apple.png" width="32" height="32" alt=""> [烂苹果](MONSTERS.md#enemy-rotten_apple) | 3+ | 4 (12%) |
| <img src="images/enemy/maggot.png" width="32" height="32" alt=""> [蛆虫](MONSTERS.md#enemy-maggot) | 4+ | 4 (12%) |
| <img src="images/enemy/ant.png" width="32" height="32" alt=""> [行军蚁](MONSTERS.md#enemy-ant) | 6+ | 3 (9%) |
| <img src="images/enemy/cockroach.png" width="32" height="32" alt=""> [蟑螂](MONSTERS.md#enemy-cockroach) | 7+ | 3 (9%) |
| <img src="images/enemy/beetle.png" width="32" height="32" alt=""> [炸弹甲虫](MONSTERS.md#enemy-beetle) | 9+ | 3 (9%) |
| <img src="images/enemy/splitter.png" width="32" height="32" alt=""> [分裂霉菌](MONSTERS.md#enemy-splitter) | 11+ | 2 (6%) |

<a id="chapter-2"></a>

### 第二章 · 荒芜菜园（Wild Garden）

> 菜园被虫群占领，小心那些会治疗的毒蘑菇。

| 项目 | 内容 |
| --- | --- |
| 难度倍率 | 生命 ×1.45 · 伤害 ×1.3 · 速度 ×1.05 |
| 地形机关 | 兔子洞：兔子四处逃窜，击败掉落番茄籽与果实<br>土拨鼠：从地洞探头扔石头 |
| 精英池 | <img src="images/boss/rat_captain.png" width="24" height="24" alt=""> [鼠队长](MONSTERS.md#boss-rat_captain)、<img src="images/boss/snail_tank.png" width="24" height="24" alt=""> [装甲蜗牛](MONSTERS.md#boss-snail_tank)、<img src="images/boss/queen_bee.png" width="24" height="24" alt=""> [蜂后](MONSTERS.md#boss-queen_bee)、<img src="images/boss/scarecrow.png" width="24" height="24" alt=""> [邪恶稻草人](MONSTERS.md#boss-scarecrow)、<img src="images/boss/spider_matron.png" width="24" height="24" alt=""> [蛛后](MONSTERS.md#boss-spider_matron)、<img src="images/boss/mushroom_king.png" width="24" height="24" alt=""> [毒菇王](MONSTERS.md#boss-mushroom_king) |
| Boss 池 | <img src="images/boss/locust_queen.png" width="24" height="24" alt=""> [蝗虫女皇](MONSTERS.md#boss-locust_queen)、<img src="images/boss/rotten_pumpkin.png" width="24" height="24" alt=""> [腐烂南瓜王](MONSTERS.md#boss-rotten_pumpkin)、<img src="images/boss/mole_general.png" width="24" height="24" alt=""> [鼹鼠大将](MONSTERS.md#boss-mole_general) |

**怪物池**

| 小怪 | 出现波次 | 权重 |
| --- | --- | --- |
| <img src="images/enemy/mold.png" width="32" height="32" alt=""> [霉菌团](MONSTERS.md#enemy-mold) | 1~8 | 8 (20%) |
| <img src="images/enemy/ant.png" width="32" height="32" alt=""> [行军蚁](MONSTERS.md#enemy-ant) | 3+ | 4 (10%) |
| <img src="images/enemy/fly.png" width="32" height="32" alt=""> [果蝇](MONSTERS.md#enemy-fly) | 1+ | 5 (13%) |
| <img src="images/enemy/snail.png" width="32" height="32" alt=""> [鼻涕蜗牛](MONSTERS.md#enemy-snail) | 2+ | 4 (10%) |
| <img src="images/enemy/spider.png" width="32" height="32" alt=""> [毒蜘蛛](MONSTERS.md#enemy-spider) | 5+ | 3 (8%) |
| <img src="images/enemy/mushroom.png" width="32" height="32" alt=""> [毒蘑菇](MONSTERS.md#enemy-mushroom) | 5+ | 2 (5%) |
| <img src="images/enemy/splitter.png" width="32" height="32" alt=""> [分裂霉菌](MONSTERS.md#enemy-splitter) | 6+ | 3 (8%) |
| <img src="images/enemy/brood.png" width="32" height="32" alt=""> [虫母](MONSTERS.md#enemy-brood) | 8+ | 2 (5%) |
| <img src="images/enemy/beetle.png" width="32" height="32" alt=""> [炸弹甲虫](MONSTERS.md#enemy-beetle) | 10+ | 3 (8%) |
| <img src="images/enemy/bee.png" width="32" height="32" alt=""> [毒蜂](MONSTERS.md#enemy-bee) | 4+ | 3 (8%) |
| <img src="images/enemy/worm.png" width="32" height="32" alt=""> [泥蚯蚓](MONSTERS.md#enemy-worm) | 4+ | 3 (8%) |

<a id="chapter-3"></a>

### 第三章 · 冰封冰箱（Frozen Fridge）

> 寒气弥漫的冰箱内部，冰晶会让你行动迟缓。

| 项目 | 内容 |
| --- | --- |
| 难度倍率 | 生命 ×1.6 · 伤害 ×1.35 · 速度 ×1.1 |
| 地形机关 | 冰面：在冰上会打滑，但速度更快<br>冷风：周期性狂风吹动所有单位并减速 |
| 精英池 | <img src="images/boss/ice_golem.png" width="24" height="24" alt=""> [冰晶傀儡](MONSTERS.md#boss-ice_golem)、<img src="images/boss/popsicle_twins.png" width="24" height="24" alt=""> [冰棍双子](MONSTERS.md#boss-popsicle_twins)、<img src="images/boss/frozen_fish.png" width="24" height="24" alt=""> [冻鱼武士](MONSTERS.md#boss-frozen_fish)、<img src="images/boss/snow_rat.png" width="24" height="24" alt=""> [雪鼠刺客](MONSTERS.md#boss-snow_rat)、<img src="images/boss/milk_slime.png" width="24" height="24" alt=""> [变质牛奶怪](MONSTERS.md#boss-milk_slime)、<img src="images/boss/frost_penguin.png" width="24" height="24" alt=""> [冰霜企鹅](MONSTERS.md#boss-frost_penguin) |
| Boss 池 | <img src="images/boss/frost_rat_king.png" width="24" height="24" alt=""> [冰霜鼠王](MONSTERS.md#boss-frost_rat_king)、<img src="images/boss/ice_cream_tyrant.png" width="24" height="24" alt=""> [冰淇淋暴君](MONSTERS.md#boss-ice_cream_tyrant)、<img src="images/boss/freezer_heart.png" width="24" height="24" alt=""> [冰柜之心](MONSTERS.md#boss-freezer_heart) |

**怪物池**

| 小怪 | 出现波次 | 权重 |
| --- | --- | --- |
| <img src="images/enemy/mold.png" width="32" height="32" alt=""> [霉菌团](MONSTERS.md#enemy-mold) | 1~6 | 8 (21%) |
| <img src="images/enemy/fly.png" width="32" height="32" alt=""> [果蝇](MONSTERS.md#enemy-fly) | 1+ | 4 (10%) |
| <img src="images/enemy/ice_cube.png" width="32" height="32" alt=""> [冰块怪](MONSTERS.md#enemy-ice_cube) | 3+ | 3 (8%) |
| <img src="images/enemy/rat.png" width="32" height="32" alt=""> [下水道老鼠](MONSTERS.md#enemy-rat) | 7+ | 3 (8%) |
| <img src="images/enemy/maggot.png" width="32" height="32" alt=""> [蛆虫](MONSTERS.md#enemy-maggot) | 3+ | 4 (10%) |
| <img src="images/enemy/spider.png" width="32" height="32" alt=""> [毒蜘蛛](MONSTERS.md#enemy-spider) | 6+ | 3 (8%) |
| <img src="images/enemy/cockroach.png" width="32" height="32" alt=""> [蟑螂](MONSTERS.md#enemy-cockroach) | 5+ | 3 (8%) |
| <img src="images/enemy/mushroom.png" width="32" height="32" alt=""> [毒蘑菇](MONSTERS.md#enemy-mushroom) | 7+ | 2 (5%) |
| <img src="images/enemy/splitter.png" width="32" height="32" alt=""> [分裂霉菌](MONSTERS.md#enemy-splitter) | 9+ | 3 (8%) |
| <img src="images/enemy/frost_mosquito.png" width="32" height="32" alt=""> [冰蚊](MONSTERS.md#enemy-frost_mosquito) | 4+ | 3 (8%) |
| <img src="images/enemy/frozen_shrimp.png" width="32" height="32" alt=""> [冻虾兵](MONSTERS.md#enemy-frozen_shrimp) | 6+ | 3 (8%) |

<a id="chapter-4"></a>

### 第四章 · 城市垃圾场（Junkyard）

> 堆积如山的垃圾中，孕育着最恶心的怪物。

| 项目 | 内容 |
| --- | --- |
| 难度倍率 | 生命 ×2.1 · 伤害 ×1.55 · 速度 ×1.15 |
| 地形机关 | 流沙坑：会把人和怪物吸入中心，并造成伤害<br>垃圾坠落：注意地面的预警圈 |
| 精英池 | <img src="images/boss/tire_beast.png" width="24" height="24" alt=""> [轮胎兽](MONSTERS.md#boss-tire_beast)、<img src="images/boss/can_king.png" width="24" height="24" alt=""> [易拉罐之王](MONSTERS.md#boss-can_king)、<img src="images/boss/rag_wraith.png" width="24" height="24" alt=""> [抹布怨灵](MONSTERS.md#boss-rag_wraith)、<img src="images/boss/battery_bug.png" width="24" height="24" alt=""> [漏电电池虫](MONSTERS.md#boss-battery_bug)、<img src="images/boss/garbage_rat.png" width="24" height="24" alt=""> [垃圾鼠王](MONSTERS.md#boss-garbage_rat)、<img src="images/boss/oil_titan.png" width="24" height="24" alt=""> [石油泰坦](MONSTERS.md#boss-oil_titan) |
| Boss 池 | <img src="images/boss/trash_golem.png" width="24" height="24" alt=""> [垃圾巨像](MONSTERS.md#boss-trash_golem)、<img src="images/boss/toxic_barrel.png" width="24" height="24" alt=""> [毒液桶魔](MONSTERS.md#boss-toxic_barrel)、<img src="images/boss/scrap_dragon.png" width="24" height="24" alt=""> [废铁巨龙](MONSTERS.md#boss-scrap_dragon) |

**怪物池**

| 小怪 | 出现波次 | 权重 |
| --- | --- | --- |
| <img src="images/enemy/mold.png" width="32" height="32" alt=""> [霉菌团](MONSTERS.md#enemy-mold) | 1~5 | 8 (18%) |
| <img src="images/enemy/rat.png" width="32" height="32" alt=""> [下水道老鼠](MONSTERS.md#enemy-rat) | 5+ | 5 (11%) |
| <img src="images/enemy/cockroach.png" width="32" height="32" alt=""> [蟑螂](MONSTERS.md#enemy-cockroach) | 3+ | 4 (9%) |
| <img src="images/enemy/trash_bag.png" width="32" height="32" alt=""> [垃圾袋怪](MONSTERS.md#enemy-trash_bag) | 5+ | 4 (9%) |
| <img src="images/enemy/beetle.png" width="32" height="32" alt=""> [炸弹甲虫](MONSTERS.md#enemy-beetle) | 6+ | 4 (9%) |
| <img src="images/enemy/brood.png" width="32" height="32" alt=""> [虫母](MONSTERS.md#enemy-brood) | 5+ | 2 (5%) |
| <img src="images/enemy/rotten_apple.png" width="32" height="32" alt=""> [烂苹果](MONSTERS.md#enemy-rotten_apple) | 2+ | 3 (7%) |
| <img src="images/enemy/snail.png" width="32" height="32" alt=""> [鼻涕蜗牛](MONSTERS.md#enemy-snail) | 6+ | 3 (7%) |
| <img src="images/enemy/mushroom.png" width="32" height="32" alt=""> [毒蘑菇](MONSTERS.md#enemy-mushroom) | 8+ | 2 (5%) |
| <img src="images/enemy/can_crab.png" width="32" height="32" alt=""> [易拉罐蟹](MONSTERS.md#enemy-can_crab) | 7+ | 3 (7%) |
| <img src="images/enemy/rag_ghost.png" width="32" height="32" alt=""> [抹布幽灵](MONSTERS.md#enemy-rag_ghost) | 5+ | 3 (7%) |
| <img src="images/enemy/oil_blob.png" width="32" height="32" alt=""> [油污怪](MONSTERS.md#enemy-oil_blob) | 6+ | 3 (7%) |

<a id="chapter-5"></a>

### 第五章 · 番茄酱工厂（Ketchup Factory）

> 一切腐烂的源头。击败腐烂大厨，拯救番茄酱小镇！

| 项目 | 内容 |
| --- | --- |
| 难度倍率 | 生命 ×2.6 · 伤害 ×1.8 · 速度 ×1.2 |
| 地形机关 | 传送带：推动站在上面的所有单位<br>蒸汽阀门：周期性喷出灼热蒸汽 |
| 精英池 | <img src="images/boss/conveyor_worm.png" width="24" height="24" alt=""> [传送带蠕虫](MONSTERS.md#boss-conveyor_worm)、<img src="images/boss/ketchup_golem.png" width="24" height="24" alt=""> [番茄酱傀儡](MONSTERS.md#boss-ketchup_golem)、<img src="images/boss/security_bot.png" width="24" height="24" alt=""> [保安机器人](MONSTERS.md#boss-security_bot)、<img src="images/boss/press_machine.png" width="24" height="24" alt=""> [冲压机](MONSTERS.md#boss-press_machine)、<img src="images/boss/chef_minion.png" width="24" height="24" alt=""> [腐烂副厨](MONSTERS.md#boss-chef_minion)、<img src="images/boss/furnace_imp.png" width="24" height="24" alt=""> [熔炉小鬼](MONSTERS.md#boss-furnace_imp) |
| Boss 池 | <img src="images/boss/rotten_chef.png" width="24" height="24" alt=""> [腐烂大厨](MONSTERS.md#boss-rotten_chef)、<img src="images/boss/factory_core.png" width="24" height="24" alt=""> [工厂主脑](MONSTERS.md#boss-factory_core)、<img src="images/boss/ketchup_leviathan.png" width="24" height="24" alt=""> [番茄酱海怪](MONSTERS.md#boss-ketchup_leviathan) |

**怪物池**

| 小怪 | 出现波次 | 权重 |
| --- | --- | --- |
| <img src="images/enemy/mold.png" width="32" height="32" alt=""> [霉菌团](MONSTERS.md#enemy-mold) | 1~4 | 8 (17%) |
| <img src="images/enemy/fly.png" width="32" height="32" alt=""> [果蝇](MONSTERS.md#enemy-fly) | 1~6 | 4 (9%) |
| <img src="images/enemy/robot_can.png" width="32" height="32" alt=""> [罐头机器人](MONSTERS.md#enemy-robot_can) | 3+ | 4 (9%) |
| <img src="images/enemy/rat.png" width="32" height="32" alt=""> [下水道老鼠](MONSTERS.md#enemy-rat) | 5+ | 5 (11%) |
| <img src="images/enemy/beetle.png" width="32" height="32" alt=""> [炸弹甲虫](MONSTERS.md#enemy-beetle) | 6+ | 4 (9%) |
| <img src="images/enemy/spider.png" width="32" height="32" alt=""> [毒蜘蛛](MONSTERS.md#enemy-spider) | 5+ | 3 (6%) |
| <img src="images/enemy/trash_bag.png" width="32" height="32" alt=""> [垃圾袋怪](MONSTERS.md#enemy-trash_bag) | 5+ | 3 (6%) |
| <img src="images/enemy/ice_cube.png" width="32" height="32" alt=""> [冰块怪](MONSTERS.md#enemy-ice_cube) | 4+ | 3 (6%) |
| <img src="images/enemy/mushroom.png" width="32" height="32" alt=""> [毒蘑菇](MONSTERS.md#enemy-mushroom) | 5+ | 2 (4%) |
| <img src="images/enemy/brood.png" width="32" height="32" alt=""> [虫母](MONSTERS.md#enemy-brood) | 6+ | 2 (4%) |
| <img src="images/enemy/splitter.png" width="32" height="32" alt=""> [分裂霉菌](MONSTERS.md#enemy-splitter) | 7+ | 3 (6%) |
| <img src="images/enemy/gear_bug.png" width="32" height="32" alt=""> [齿轮虫](MONSTERS.md#enemy-gear_bug) | 4+ | 3 (6%) |
| <img src="images/enemy/curse_doll.png" width="32" height="32" alt=""> [诅咒娃娃](MONSTERS.md#enemy-curse_doll) | 5+ | 3 (6%) |

---

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · **关卡** · [设计文档](GDD.md) · [数值表](DATA_TABLES.md)

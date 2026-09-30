# 怪物

**中文** · [English](en/MONSTERS.md)

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · **怪物** · [关卡](CHAPTERS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md)

> 由 `npm run docs` 从 `src/data/*.ts` 自动生成，请勿手改。

小怪 25 种 · 地形生物 2 种 · 精英 30 名 · Boss 15 名 · 精英词缀 12 种。

每章第 5、10 波出现精英，第 15 波为 Boss，均从该章的池子中随机抽取。各章出现哪些怪物见[关卡](CHAPTERS.md)。

敌人生命与伤害随波次成长并乘以章节倍率；攻击附带的状态见[状态效果](SKILLS.md#statuses)。

## 目录

- [小怪](#enemies)
- [精英](#elites)
- [Boss](#bosses)
- [精英词缀](#affixes)

<a id="enemies"></a>

## 小怪

| 小怪 | 行为 | 生命 | 伤害 | 速度 | 掉落 | 攻击附带 |
| --- | --- | --- | --- | --- | --- | --- |
| <img src="images/enemy/mold.png" width="32" height="32" alt=""> [霉菌团](#enemy-mold) | 追击 | 5（每波 +45%） | 1（每波 +0.6） | 95 | 1 | - |
| <img src="images/enemy/fly.png" width="32" height="32" alt=""> [果蝇](#enemy-fly) | 游荡 | 3（每波 +50%） | 1（每波 +0.5） | 150 | 1 | - |
| <img src="images/enemy/maggot.png" width="32" height="32" alt=""> [蛆虫](#enemy-maggot) | 蓄力冲撞 | 7（每波 +55%） | 2（每波 +0.7） | 70 | 1 | - |
| <img src="images/enemy/rotten_apple.png" width="32" height="32" alt=""> [烂苹果](#enemy-rotten_apple) | 远程射击 | 6（每波 +55%） | 1（每波 +0.5） | 80 | 2 | - |
| <img src="images/enemy/cockroach.png" width="32" height="32" alt=""> [蟑螂](#enemy-cockroach) | 追击 | 22（每波 +70%） | 2（每波 +0.8） | 85 | 2 | - |
| <img src="images/enemy/ant.png" width="32" height="32" alt=""> [行军蚁](#enemy-ant) | 追击 | 2（每波 +45%） | 1（每波 +0.4） | 150 | 1 | - |
| <img src="images/enemy/beetle.png" width="32" height="32" alt=""> [炸弹甲虫](#enemy-beetle) | 自爆 | 6（每波 +55%） | 4（每波 +0.9） | 135 | 1 | - |
| <img src="images/enemy/snail.png" width="32" height="32" alt=""> [鼻涕蜗牛](#enemy-snail) | 留下黏液 | 16（每波 +70%） | 2（每波 +0.6） | 50 | 2 | [黏液](SKILLS.md#status-sticky) 2s |
| <img src="images/enemy/spider.png" width="32" height="32" alt=""> [毒蜘蛛](#enemy-spider) | 远程射击 | 10（每波 +60%） | 2（每波 +0.6） | 100 | 2 | [中毒](SKILLS.md#status-poison) 3s |
| <img src="images/enemy/splitter.png" width="32" height="32" alt=""> [分裂霉菌](#enemy-splitter) | 死亡分裂 | 18（每波 +70%） | 2（每波 +0.7） | 75 | 2 | - |
| <img src="images/enemy/mushroom.png" width="32" height="32" alt=""> [毒蘑菇](#enemy-mushroom) | 治疗同伴 | 14（每波 +65%） | 1（每波 +0.4） | 60 | 3 | - |
| <img src="images/enemy/brood.png" width="32" height="32" alt=""> [虫母](#enemy-brood) | 召唤 | 30（每波 +80%） | 2（每波 +0.6） | 45 | 4 | - |
| <img src="images/enemy/rat.png" width="32" height="32" alt=""> [下水道老鼠](#enemy-rat) | 蓄力冲撞 | 12（每波 +65%） | 2（每波 +0.7） | 115 | 2 | [流血](SKILLS.md#status-bleed) 3s（30%） |
| <img src="images/enemy/ice_cube.png" width="32" height="32" alt=""> [冰块怪](#enemy-ice_cube) | 远程射击 | 15（每波 +65%） | 2（每波 +0.6） | 70 | 2 | [减速](SKILLS.md#status-slow) 2s |
| <img src="images/enemy/trash_bag.png" width="32" height="32" alt=""> [垃圾袋怪](#enemy-trash_bag) | 死亡分裂 | 28（每波 +75%） | 3（每波 +0.7） | 65 | 3 | - |
| <img src="images/enemy/robot_can.png" width="32" height="32" alt=""> [罐头机器人](#enemy-robot_can) | 远程射击 | 20（每波 +70%） | 2（每波 +0.7） | 90 | 3 | - |
| <img src="images/enemy/bee.png" width="32" height="32" alt=""> [毒蜂](#enemy-bee) | 游荡 | 5（每波 +55%） | 1（每波 +0.55） | 160 | 1 | [中毒](SKILLS.md#status-poison) 3s |
| <img src="images/enemy/worm.png" width="32" height="32" alt=""> [泥蚯蚓](#enemy-worm) | 蓄力冲撞 | 9（每波 +60%） | 2（每波 +0.6） | 90 | 1 | - |
| <img src="images/enemy/frost_mosquito.png" width="32" height="32" alt=""> [冰蚊](#enemy-frost_mosquito) | 游荡 | 5（每波 +55%） | 1（每波 +0.5） | 140 | 1 | [冰冻](SKILLS.md#status-freeze) 0.5s（5%）、[减速](SKILLS.md#status-slow) 2s |
| <img src="images/enemy/frozen_shrimp.png" width="32" height="32" alt=""> [冻虾兵](#enemy-frozen_shrimp) | 蓄力冲撞 | 18（每波 +70%） | 3（每波 +0.7） | 80 | 2 | 2层[减速](SKILLS.md#status-slow) 3s |
| <img src="images/enemy/can_crab.png" width="32" height="32" alt=""> [易拉罐蟹](#enemy-can_crab) | 追击 | 30（每波 +75%） | 3（每波 +0.7） | 70 | 3 | [破甲](SKILLS.md#status-armorBreak) 4s |
| <img src="images/enemy/rag_ghost.png" width="32" height="32" alt=""> [抹布幽灵](#enemy-rag_ghost) | 游荡 | 14（每波 +65%） | 2（每波 +0.6） | 105 | 2 | [致盲](SKILLS.md#status-blind) 3s |
| <img src="images/enemy/oil_blob.png" width="32" height="32" alt=""> [油污怪](#enemy-oil_blob) | 留下黏液 | 20（每波 +70%） | 2（每波 +0.6） | 70 | 2 | [虚弱](SKILLS.md#status-weaken) 3s |
| <img src="images/enemy/gear_bug.png" width="32" height="32" alt=""> [齿轮虫](#enemy-gear_bug) | 远程射击 | 16（每波 +70%） | 2（每波 +0.7） | 95 | 2 | [破甲](SKILLS.md#status-armorBreak) 4s |
| <img src="images/enemy/curse_doll.png" width="32" height="32" alt=""> [诅咒娃娃](#enemy-curse_doll) | 远程射击 | 12（每波 +65%） | 2（每波 +0.6） | 90 | 3 | [诅咒](SKILLS.md#status-curse) 3s |

<a id="enemy-mold"></a>

### 霉菌团

<img src="images/enemy/mold.png" width="96" height="96" alt="">

> 最常见的害虫，缓慢逼近。

| 项目 | 数值 |
| --- | --- |
| 行为 | 追击 |
| 生命 | 5（每波 +45%） |
| 伤害 | 1（每波 +0.6） |
| 速度 | 95 |
| 掉落番茄籽 | 1 |
| 出现 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) 第 1+ 波；[第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) 第 1~8 波；[第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) 第 1~6 波；[第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) 第 1~5 波；[第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) 第 1~4 波 |

<a id="enemy-fly"></a>

### 果蝇

<img src="images/enemy/fly.png" width="96" height="96" alt="">

> 飞得快但很脆弱，行动飘忽。

| 项目 | 数值 |
| --- | --- |
| 行为 | 游荡 |
| 生命 | 3（每波 +50%） |
| 伤害 | 1（每波 +0.5） |
| 速度 | 150 |
| 掉落番茄籽 | 1 |
| 出现 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) 第 2+ 波；[第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) 第 1+ 波；[第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) 第 1+ 波；[第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) 第 1~6 波 |

<a id="enemy-maggot"></a>

### 蛆虫

<img src="images/enemy/maggot.png" width="96" height="96" alt="">

> 蓄力后高速冲撞。

| 项目 | 数值 |
| --- | --- |
| 行为 | 蓄力冲撞 |
| 生命 | 7（每波 +55%） |
| 伤害 | 2（每波 +0.7） |
| 速度 | 70 |
| 掉落番茄籽 | 1 |
| 特殊 | 每 3s 冲撞 |
| 出现 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) 第 4+ 波；[第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) 第 3+ 波 |

<a id="enemy-rotten_apple"></a>

### 烂苹果

<img src="images/enemy/rotten_apple.png" width="96" height="96" alt="">

> 保持距离吐出腐烂果核。

| 项目 | 数值 |
| --- | --- |
| 行为 | 远程射击 |
| 生命 | 6（每波 +55%） |
| 伤害 | 1（每波 +0.5） |
| 速度 | 80 |
| 掉落番茄籽 | 2 |
| 特殊 | 每 2.6s 射击 |
| 出现 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) 第 3+ 波；[第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) 第 2+ 波 |

<a id="enemy-cockroach"></a>

### 蟑螂

<img src="images/enemy/cockroach.png" width="96" height="96" alt="">

> 皮糙肉厚，难以击退。

| 项目 | 数值 |
| --- | --- |
| 行为 | 追击 |
| 生命 | 22（每波 +70%） |
| 伤害 | 2（每波 +0.8） |
| 速度 | 85 |
| 掉落番茄籽 | 2 |
| 出现 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) 第 7+ 波；[第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) 第 5+ 波；[第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) 第 3+ 波 |

<a id="enemy-ant"></a>

### 行军蚁

<img src="images/enemy/ant.png" width="96" height="96" alt="">

> 成群结队地出现。

| 项目 | 数值 |
| --- | --- |
| 行为 | 追击 |
| 生命 | 2（每波 +45%） |
| 伤害 | 1（每波 +0.4） |
| 速度 | 150 |
| 掉落番茄籽 | 1 |
| 出现 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) 第 6+ 波；[第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) 第 3+ 波 |

<a id="enemy-beetle"></a>

### 炸弹甲虫

<img src="images/enemy/beetle.png" width="96" height="96" alt="">

> 靠近后自爆，注意躲开！

| 项目 | 数值 |
| --- | --- |
| 行为 | 自爆 |
| 生命 | 6（每波 +55%） |
| 伤害 | 4（每波 +0.9） |
| 速度 | 135 |
| 掉落番茄籽 | 1 |
| 特殊 | 自爆半径 85 |
| 出现 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) 第 9+ 波；[第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) 第 10+ 波；[第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) 第 6+ 波；[第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) 第 6+ 波 |

<a id="enemy-snail"></a>

### 鼻涕蜗牛

<img src="images/enemy/snail.png" width="96" height="96" alt="">

> 缓慢爬行，留下减速黏液。

| 项目 | 数值 |
| --- | --- |
| 行为 | 留下黏液 |
| 生命 | 16（每波 +70%） |
| 伤害 | 2（每波 +0.6） |
| 速度 | 50 |
| 掉落番茄籽 | 2 |
| 攻击附带 | [黏液](SKILLS.md#status-sticky) 2s |
| 出现 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) 第 2+ 波；[第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) 第 6+ 波 |

<a id="enemy-spider"></a>

### 毒蜘蛛

<img src="images/enemy/spider.png" width="96" height="96" alt="">

> 吐出减速蛛网，蛛网带毒。

| 项目 | 数值 |
| --- | --- |
| 行为 | 远程射击 |
| 生命 | 10（每波 +60%） |
| 伤害 | 2（每波 +0.6） |
| 速度 | 100 |
| 掉落番茄籽 | 2 |
| 攻击附带 | [中毒](SKILLS.md#status-poison) 3s |
| 特殊 | 每 3s 射击 2 发 |
| 出现 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) 第 5+ 波；[第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) 第 6+ 波；[第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) 第 5+ 波 |

<a id="enemy-splitter"></a>

### 分裂霉菌

<img src="images/enemy/splitter.png" width="96" height="96" alt="">

> 死亡时分裂为多个霉菌团。

| 项目 | 数值 |
| --- | --- |
| 行为 | 死亡分裂 |
| 生命 | 18（每波 +70%） |
| 伤害 | 2（每波 +0.7） |
| 速度 | 75 |
| 掉落番茄籽 | 2 |
| 特殊 | 死亡分裂为 3 只[霉菌团](#enemy-mold) |
| 出现 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) 第 11+ 波；[第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) 第 6+ 波；[第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) 第 9+ 波；[第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) 第 7+ 波 |

<a id="enemy-mushroom"></a>

### 毒蘑菇

<img src="images/enemy/mushroom.png" width="96" height="96" alt="">

> 治疗周围的怪物，优先击杀！

| 项目 | 数值 |
| --- | --- |
| 行为 | 治疗同伴 |
| 生命 | 14（每波 +65%） |
| 伤害 | 1（每波 +0.4） |
| 速度 | 60 |
| 掉落番茄籽 | 3 |
| 特殊 | 治疗半径 180 内同伴 0.2 |
| 出现 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) 第 5+ 波；[第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) 第 7+ 波；[第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) 第 8+ 波；[第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) 第 5+ 波 |

<a id="enemy-brood"></a>

### 虫母

<img src="images/enemy/brood.png" width="96" height="96" alt="">

> 不断孵化果蝇。

| 项目 | 数值 |
| --- | --- |
| 行为 | 召唤 |
| 生命 | 30（每波 +80%） |
| 伤害 | 2（每波 +0.6） |
| 速度 | 45 |
| 掉落番茄籽 | 4 |
| 特殊 | 召唤 3 只[果蝇](#enemy-fly) |
| 出现 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) 第 8+ 波；[第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) 第 5+ 波；[第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) 第 6+ 波 |

<a id="enemy-rat"></a>

### 下水道老鼠

<img src="images/enemy/rat.png" width="96" height="96" alt="">

> 迅速冲撞的鼠辈，会咬出流血。

| 项目 | 数值 |
| --- | --- |
| 行为 | 蓄力冲撞 |
| 生命 | 12（每波 +65%） |
| 伤害 | 2（每波 +0.7） |
| 速度 | 115 |
| 掉落番茄籽 | 2 |
| 攻击附带 | [流血](SKILLS.md#status-bleed) 3s（30%） |
| 特殊 | 每 3s 冲撞 |
| 出现 | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) 第 7+ 波；[第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) 第 5+ 波；[第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) 第 5+ 波 |

<a id="enemy-ice_cube"></a>

### 冰块怪

<img src="images/enemy/ice_cube.png" width="96" height="96" alt="">

> 向四周射出冰晶，使人减速。

| 项目 | 数值 |
| --- | --- |
| 行为 | 远程射击 |
| 生命 | 15（每波 +65%） |
| 伤害 | 2（每波 +0.6） |
| 速度 | 70 |
| 掉落番茄籽 | 2 |
| 攻击附带 | [减速](SKILLS.md#status-slow) 2s |
| 特殊 | 每 3.2s 射击 6 发 |
| 出现 | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) 第 3+ 波；[第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) 第 4+ 波 |

<a id="enemy-trash_bag"></a>

### 垃圾袋怪

<img src="images/enemy/trash_bag.png" width="96" height="96" alt="">

> 被打破后放出一群果蝇。

| 项目 | 数值 |
| --- | --- |
| 行为 | 死亡分裂 |
| 生命 | 28（每波 +75%） |
| 伤害 | 3（每波 +0.7） |
| 速度 | 65 |
| 掉落番茄籽 | 3 |
| 特殊 | 死亡分裂为 4 只[果蝇](#enemy-fly) |
| 出现 | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) 第 5+ 波；[第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) 第 5+ 波 |

<a id="enemy-robot_can"></a>

### 罐头机器人

<img src="images/enemy/robot_can.png" width="96" height="96" alt="">

> 失控的机器人，三连发射击。

| 项目 | 数值 |
| --- | --- |
| 行为 | 远程射击 |
| 生命 | 20（每波 +70%） |
| 伤害 | 2（每波 +0.7） |
| 速度 | 90 |
| 掉落番茄籽 | 3 |
| 特殊 | 每 2.4s 射击 3 发 |
| 出现 | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) 第 3+ 波 |

<a id="enemy-bee"></a>

### 毒蜂

<img src="images/enemy/bee.png" width="96" height="96" alt="">

> 蜇人带毒，成群出没。

| 项目 | 数值 |
| --- | --- |
| 行为 | 游荡 |
| 生命 | 5（每波 +55%） |
| 伤害 | 1（每波 +0.55） |
| 速度 | 160 |
| 掉落番茄籽 | 1 |
| 攻击附带 | [中毒](SKILLS.md#status-poison) 3s |
| 出现 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) 第 4+ 波 |

<a id="enemy-worm"></a>

### 泥蚯蚓

<img src="images/enemy/worm.png" width="96" height="96" alt="">

> 从土里钻出突袭。

| 项目 | 数值 |
| --- | --- |
| 行为 | 蓄力冲撞 |
| 生命 | 9（每波 +60%） |
| 伤害 | 2（每波 +0.6） |
| 速度 | 90 |
| 掉落番茄籽 | 1 |
| 特殊 | 每 2.6s 冲撞 |
| 出现 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) 第 4+ 波 |

<a id="enemy-frost_mosquito"></a>

### 冰蚊

<img src="images/enemy/frost_mosquito.png" width="96" height="96" alt="">

> 叮咬会使人冰冻。

| 项目 | 数值 |
| --- | --- |
| 行为 | 游荡 |
| 生命 | 5（每波 +55%） |
| 伤害 | 1（每波 +0.5） |
| 速度 | 140 |
| 掉落番茄籽 | 1 |
| 攻击附带 | [冰冻](SKILLS.md#status-freeze) 0.5s（5%）、[减速](SKILLS.md#status-slow) 2s |
| 出现 | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) 第 4+ 波 |

<a id="enemy-frozen_shrimp"></a>

### 冻虾兵

<img src="images/enemy/frozen_shrimp.png" width="96" height="96" alt="">

> 坚硬的冻虾，冲撞使人减速。

| 项目 | 数值 |
| --- | --- |
| 行为 | 蓄力冲撞 |
| 生命 | 18（每波 +70%） |
| 伤害 | 3（每波 +0.7） |
| 速度 | 80 |
| 掉落番茄籽 | 2 |
| 攻击附带 | 2层[减速](SKILLS.md#status-slow) 3s |
| 特殊 | 每 3s 冲撞 |
| 出现 | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) 第 6+ 波 |

<a id="enemy-can_crab"></a>

### 易拉罐蟹

<img src="images/enemy/can_crab.png" width="96" height="96" alt="">

> 背着易拉罐的寄居蟹，反弹伤害。

| 项目 | 数值 |
| --- | --- |
| 行为 | 追击 |
| 生命 | 30（每波 +75%） |
| 伤害 | 3（每波 +0.7） |
| 速度 | 70 |
| 掉落番茄籽 | 3 |
| 攻击附带 | [破甲](SKILLS.md#status-armorBreak) 4s |
| 出现 | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) 第 7+ 波 |

<a id="enemy-rag_ghost"></a>

### 抹布幽灵

<img src="images/enemy/rag_ghost.png" width="96" height="96" alt="">

> 脏抹布化成的幽灵，接触致盲。

| 项目 | 数值 |
| --- | --- |
| 行为 | 游荡 |
| 生命 | 14（每波 +65%） |
| 伤害 | 2（每波 +0.6） |
| 速度 | 105 |
| 掉落番茄籽 | 2 |
| 攻击附带 | [致盲](SKILLS.md#status-blind) 3s |
| 出现 | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) 第 5+ 波 |

<a id="enemy-oil_blob"></a>

### 油污怪

<img src="images/enemy/oil_blob.png" width="96" height="96" alt="">

> 留下滑腻的油污，接触虚弱。

| 项目 | 数值 |
| --- | --- |
| 行为 | 留下黏液 |
| 生命 | 20（每波 +70%） |
| 伤害 | 2（每波 +0.6） |
| 速度 | 70 |
| 掉落番茄籽 | 2 |
| 攻击附带 | [虚弱](SKILLS.md#status-weaken) 3s |
| 出现 | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) 第 6+ 波 |

<a id="enemy-gear_bug"></a>

### 齿轮虫

<img src="images/enemy/gear_bug.png" width="96" height="96" alt="">

> 机械甲虫，射出破甲钉。

| 项目 | 数值 |
| --- | --- |
| 行为 | 远程射击 |
| 生命 | 16（每波 +70%） |
| 伤害 | 2（每波 +0.7） |
| 速度 | 95 |
| 掉落番茄籽 | 2 |
| 攻击附带 | [破甲](SKILLS.md#status-armorBreak) 4s |
| 特殊 | 每 2.2s 射击 2 发 |
| 出现 | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) 第 4+ 波 |

<a id="enemy-curse_doll"></a>

### 诅咒娃娃

<img src="images/enemy/curse_doll.png" width="96" height="96" alt="">

> 飘荡的破布娃娃，诅咒使人无法回血。

| 项目 | 数值 |
| --- | --- |
| 行为 | 远程射击 |
| 生命 | 12（每波 +65%） |
| 伤害 | 2（每波 +0.6） |
| 速度 | 90 |
| 掉落番茄籽 | 3 |
| 攻击附带 | [诅咒](SKILLS.md#status-curse) 3s |
| 特殊 | 每 3s 射击 |
| 出现 | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) 第 5+ 波 |

<a id="enemy-rabbit"></a>

### 菜园兔子（地形生物）

<img src="images/enemy/rabbit.png" width="96" height="96" alt="">

> 从兔子洞钻出的兔子，四处逃窜，击败后掉落番茄籽与果实。

| 项目 | 数值 |
| --- | --- |
| 行为 | 逃窜 |
| 生命 | 6（每波 +50%） |
| 伤害 | 0（每波 +0） |
| 速度 | 170 |
| 掉落番茄籽 | 4 |
| 出现 | 由其他怪物召唤/分裂 |

<a id="enemy-gopher"></a>

### 土拨鼠（地形生物）

<img src="images/enemy/gopher.png" width="96" height="96" alt="">

> 从地洞探出身子扔石头，打中可能眩晕，过一会儿会缩回地下。

| 项目 | 数值 |
| --- | --- |
| 行为 | 远程射击 |
| 生命 | 10（每波 +60%） |
| 伤害 | 2（每波 +0.5） |
| 速度 | 0 |
| 掉落番茄籽 | 3 |
| 攻击附带 | [眩晕](SKILLS.md#status-stun) 0.4s（25%） |
| 特殊 | 每 1.4s 射击 |
| 出现 | 由其他怪物召唤/分裂 |

<a id="elites"></a>

## 精英

第 5、10 波出现。第 10 波起额外 +1 个随机[词缀](#affixes)，第 3 章起 +1，第 5 章起再 +1。

| 章节 | 精英 |
| --- | --- |
| [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | <img src="images/boss/roach_general.png" width="32" height="32" alt=""> [蟑螂将军](#boss-roach_general)、<img src="images/boss/mold_elder.png" width="32" height="32" alt=""> [霉菌长老](#boss-mold_elder)、<img src="images/boss/greasy_pan.png" width="32" height="32" alt=""> [油腻平底锅](#boss-greasy_pan)、<img src="images/boss/fork_knight.png" width="32" height="32" alt=""> [叉子骑士](#boss-fork_knight)、<img src="images/boss/fly_swarm_king.png" width="32" height="32" alt=""> [蝇群之主](#boss-fly_swarm_king)、<img src="images/boss/rotten_onion.png" width="32" height="32" alt=""> [腐烂洋葱](#boss-rotten_onion) |
| [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | <img src="images/boss/rat_captain.png" width="32" height="32" alt=""> [鼠队长](#boss-rat_captain)、<img src="images/boss/snail_tank.png" width="32" height="32" alt=""> [装甲蜗牛](#boss-snail_tank)、<img src="images/boss/queen_bee.png" width="32" height="32" alt=""> [蜂后](#boss-queen_bee)、<img src="images/boss/scarecrow.png" width="32" height="32" alt=""> [邪恶稻草人](#boss-scarecrow)、<img src="images/boss/spider_matron.png" width="32" height="32" alt=""> [蛛后](#boss-spider_matron)、<img src="images/boss/mushroom_king.png" width="32" height="32" alt=""> [毒菇王](#boss-mushroom_king) |
| [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | <img src="images/boss/ice_golem.png" width="32" height="32" alt=""> [冰晶傀儡](#boss-ice_golem)、<img src="images/boss/popsicle_twins.png" width="32" height="32" alt=""> [冰棍双子](#boss-popsicle_twins)、<img src="images/boss/frozen_fish.png" width="32" height="32" alt=""> [冻鱼武士](#boss-frozen_fish)、<img src="images/boss/snow_rat.png" width="32" height="32" alt=""> [雪鼠刺客](#boss-snow_rat)、<img src="images/boss/milk_slime.png" width="32" height="32" alt=""> [变质牛奶怪](#boss-milk_slime)、<img src="images/boss/frost_penguin.png" width="32" height="32" alt=""> [冰霜企鹅](#boss-frost_penguin) |
| [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | <img src="images/boss/tire_beast.png" width="32" height="32" alt=""> [轮胎兽](#boss-tire_beast)、<img src="images/boss/can_king.png" width="32" height="32" alt=""> [易拉罐之王](#boss-can_king)、<img src="images/boss/rag_wraith.png" width="32" height="32" alt=""> [抹布怨灵](#boss-rag_wraith)、<img src="images/boss/battery_bug.png" width="32" height="32" alt=""> [漏电电池虫](#boss-battery_bug)、<img src="images/boss/garbage_rat.png" width="32" height="32" alt=""> [垃圾鼠王](#boss-garbage_rat)、<img src="images/boss/oil_titan.png" width="32" height="32" alt=""> [石油泰坦](#boss-oil_titan) |
| [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | <img src="images/boss/conveyor_worm.png" width="32" height="32" alt=""> [传送带蠕虫](#boss-conveyor_worm)、<img src="images/boss/ketchup_golem.png" width="32" height="32" alt=""> [番茄酱傀儡](#boss-ketchup_golem)、<img src="images/boss/security_bot.png" width="32" height="32" alt=""> [保安机器人](#boss-security_bot)、<img src="images/boss/press_machine.png" width="32" height="32" alt=""> [冲压机](#boss-press_machine)、<img src="images/boss/chef_minion.png" width="32" height="32" alt=""> [腐烂副厨](#boss-chef_minion)、<img src="images/boss/furnace_imp.png" width="32" height="32" alt=""> [熔炉小鬼](#boss-furnace_imp) |

<a id="boss-roach_general"></a>

### 蟑螂将军

<img src="images/boss/roach_general.png" width="96" height="96" alt="">

> 披着瓶盖铠甲的蟑螂军团首领。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) |
| 基础生命 | 320 |
| 伤害 | 4 |
| 速度 | 90 |
| 掉落番茄籽 | 22 |
| 招式 | 预警冲锋（每 4s）<br>环形弹 ×10（每 5s） |

<a id="boss-mold_elder"></a>

### 霉菌长老

<img src="images/boss/mold_elder.png" width="96" height="96" alt="">

> 古老的霉菌聚合体，会召唤子嗣。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) |
| 基础生命 | 300 |
| 伤害 | 3 |
| 速度 | 60 |
| 掉落番茄籽 | 22 |
| 招式 | 召唤 5 只[霉菌团](MONSTERS.md#enemy-mold)（每 6s）<br>扇形瞄准 ×3 命中附带 2层[中毒](SKILLS.md#status-poison) 3s（每 2.5s） |

<a id="boss-greasy_pan"></a>

### 油腻平底锅

<img src="images/boss/greasy_pan.png" width="96" height="96" alt="">

> 沾满陈年油垢的平底锅成了精。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) |
| 基础生命 | 360 |
| 伤害 | 4 |
| 速度 | 70 |
| 掉落番茄籽 | 22 |
| 招式 | 预警砸地 ×2 命中附带 2层[灼烧](SKILLS.md#status-burn) 3s（每 4s）<br>乱射 ×8 命中附带 [黏液](SKILLS.md#status-sticky) 1.5s（每 3.5s） |

<a id="boss-fork_knight"></a>

### 叉子骑士

<img src="images/boss/fork_knight.png" width="96" height="96" alt="">

> 被腐化的餐叉，冲刺穿刺。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) |
| 基础生命 | 300 |
| 伤害 | 5 |
| 速度 | 100 |
| 掉落番茄籽 | 22 |
| 招式 | 预警冲锋 命中附带 2层[流血](SKILLS.md#status-bleed) 3s（每 3s）<br>扇形瞄准 ×5（每 3s） |

<a id="boss-fly_swarm_king"></a>

### 蝇群之主

<img src="images/boss/fly_swarm_king.png" width="96" height="96" alt="">

> 嗡嗡作响的巨型苍蝇。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) |
| 基础生命 | 280 |
| 伤害 | 3 |
| 速度 | 120 |
| 掉落番茄籽 | 22 |
| 招式 | 召唤 5 只[果蝇](MONSTERS.md#enemy-fly)（每 5s）<br>瞬移（每 6s）<br>环形弹 ×12（每 4s） |

<a id="boss-rotten_onion"></a>

### 腐烂洋葱

<img src="images/boss/rotten_onion.png" width="96" height="96" alt="">

> 散发催泪毒气的烂洋葱。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) |
| 基础生命 | 340 |
| 伤害 | 3 |
| 速度 | 70 |
| 掉落番茄籽 | 22 |
| 招式 | 危险区 ×3 命中附带 [致盲](SKILLS.md#status-blind) 2s（每 5s）<br>环形弹 ×10 命中附带 [虚弱](SKILLS.md#status-weaken) 3s（每 4s） |

<a id="boss-rat_captain"></a>

### 鼠队长

<img src="images/boss/rat_captain.png" width="96" height="96" alt="">

> 戴着瓶盖头盔的老鼠头目。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) |
| 基础生命 | 380 |
| 伤害 | 4 |
| 速度 | 110 |
| 掉落番茄籽 | 26 |
| 招式 | 预警冲锋 命中附带 [流血](SKILLS.md#status-bleed) 3s（每 3s）<br>扇形瞄准 ×5（每 3.5s）<br>召唤 3 只[下水道老鼠](MONSTERS.md#enemy-rat)（每 8s） |

<a id="boss-snail_tank"></a>

### 装甲蜗牛

<img src="images/boss/snail_tank.png" width="96" height="96" alt="">

> 背着铁壳的巨型蜗牛。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) |
| 基础生命 | 480 |
| 伤害 | 4 |
| 速度 | 45 |
| 掉落番茄籽 | 26 |
| 招式 | 危险区 ×4 命中附带 [黏液](SKILLS.md#status-sticky) 2s（每 4s）<br>强化 自身/同伴获得 [屏障](SKILLS.md#status-barrier) 4s（每 10s） |
| 固定词缀 | [坚甲](#affixes) |

<a id="boss-queen_bee"></a>

### 蜂后

<img src="images/boss/queen_bee.png" width="96" height="96" alt="">

> 统领毒蜂的女王。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) |
| 基础生命 | 330 |
| 伤害 | 3 |
| 速度 | 100 |
| 掉落番茄籽 | 26 |
| 招式 | 召唤 4 只[毒蜂](MONSTERS.md#enemy-bee)（每 5s）<br>扇形瞄准 ×3 命中附带 3层[中毒](SKILLS.md#status-poison) 4s（每 2.5s） |

<a id="boss-scarecrow"></a>

### 邪恶稻草人

<img src="images/boss/scarecrow.png" width="96" height="96" alt="">

> 被腐化附身的稻草人。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) |
| 基础生命 | 350 |
| 伤害 | 4 |
| 速度 | 70 |
| 掉落番茄籽 | 26 |
| 招式 | 瞬移（每 5s）<br>环形弹 ×14 命中附带 [混乱](SKILLS.md#status-confuse) 1.5s（40%）（每 3.5s）<br>召唤 4 只[泥蚯蚓](MONSTERS.md#enemy-worm)（每 9s） |

<a id="boss-spider_matron"></a>

### 蛛后

<img src="images/boss/spider_matron.png" width="96" height="96" alt="">

> 在菜园织网的巨型毒蛛。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) |
| 基础生命 | 360 |
| 伤害 | 4 |
| 速度 | 80 |
| 掉落番茄籽 | 26 |
| 招式 | 乱射 ×10 命中附带 2层[中毒](SKILLS.md#status-poison) 3s（每 3s）<br>召唤 3 只[毒蜘蛛](MONSTERS.md#enemy-spider)（每 7s） |

<a id="boss-mushroom_king"></a>

### 毒菇王

<img src="images/boss/mushroom_king.png" width="96" height="96" alt="">

> 菌伞巨大的毒蘑菇之王。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) |
| 基础生命 | 340 |
| 伤害 | 3 |
| 速度 | 55 |
| 掉落番茄籽 | 26 |
| 招式 | 强化 自身/同伴获得 3层[再生](SKILLS.md#status-regen) 4s、[急速](SKILLS.md#status-haste) 4s（每 7s）<br>危险区 ×3 命中附带 3层[中毒](SKILLS.md#status-poison) 3s（每 4s） |
| 固定词缀 | [再生](#affixes) |

<a id="boss-ice_golem"></a>

### 冰晶傀儡

<img src="images/boss/ice_golem.png" width="96" height="96" alt="">

> 冰箱深处凝结的傀儡。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) |
| 基础生命 | 420 |
| 伤害 | 4 |
| 速度 | 55 |
| 掉落番茄籽 | 30 |
| 招式 | 预警砸地 ×1 命中附带 [冰冻](SKILLS.md#status-freeze) 1s（每 4s）<br>环形弹 ×12（每 4.5s） |

<a id="boss-popsicle_twins"></a>

### 冰棍双子

<img src="images/boss/popsicle_twins.png" width="96" height="96" alt="">

> 一根木棍上的两根冰棍。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) |
| 基础生命 | 380 |
| 伤害 | 4 |
| 速度 | 85 |
| 掉落番茄籽 | 30 |
| 招式 | 螺旋弹幕 ×4（每 6s）<br>预警冲锋 命中附带 2层[减速](SKILLS.md#status-slow) 3s（每 4s） |

<a id="boss-frozen_fish"></a>

### 冻鱼武士

<img src="images/boss/frozen_fish.png" width="96" height="96" alt="">

> 冻得邦邦硬的鱼，当剑来用。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) |
| 基础生命 | 400 |
| 伤害 | 5 |
| 速度 | 95 |
| 掉落番茄籽 | 30 |
| 招式 | 预警激光 命中附带 [冰冻](SKILLS.md#status-freeze) 0.8s（每 5s）<br>预警冲锋（每 3.5s） |

<a id="boss-snow_rat"></a>

### 雪鼠刺客

<img src="images/boss/snow_rat.png" width="96" height="96" alt="">

> 白色皮毛的鼠辈刺客。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) |
| 基础生命 | 330 |
| 伤害 | 5 |
| 速度 | 130 |
| 掉落番茄籽 | 30 |
| 招式 | 瞬移（每 3.5s）<br>扇形瞄准 ×3 命中附带 2层[流血](SKILLS.md#status-bleed) 3s（每 2s） |
| 固定词缀 | [迅捷](#affixes) |

<a id="boss-milk_slime"></a>

### 变质牛奶怪

<img src="images/boss/milk_slime.png" width="96" height="96" alt="">

> 过期牛奶凝成的史莱姆。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) |
| 基础生命 | 450 |
| 伤害 | 3 |
| 速度 | 60 |
| 掉落番茄籽 | 30 |
| 招式 | 危险区 ×4 命中附带 [虚弱](SKILLS.md#status-weaken) 3s、[黏液](SKILLS.md#status-sticky) 2s（每 4s）<br>召唤 4 只[霉菌团](MONSTERS.md#enemy-mold)（每 7s） |

<a id="boss-frost_penguin"></a>

### 冰霜企鹅

<img src="images/boss/frost_penguin.png" width="96" height="96" alt="">

> 冷酷的企鹅，滑行冲撞。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) |
| 基础生命 | 380 |
| 伤害 | 4 |
| 速度 | 90 |
| 掉落番茄籽 | 30 |
| 招式 | 预警冲锋 命中附带 2层[减速](SKILLS.md#status-slow) 2s（每 3s）<br>环形弹 ×16（每 4s） |

<a id="boss-tire_beast"></a>

### 轮胎兽

<img src="images/boss/tire_beast.png" width="96" height="96" alt="">

> 废轮胎堆成的野兽。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) |
| 基础生命 | 480 |
| 伤害 | 5 |
| 速度 | 80 |
| 掉落番茄籽 | 34 |
| 招式 | 预警冲锋（每 3s）<br>预警砸地 ×3（每 5s） |
| 固定词缀 | [坚甲](#affixes) |

<a id="boss-can_king"></a>

### 易拉罐之王

<img src="images/boss/can_king.png" width="96" height="96" alt="">

> 易拉罐蟹的巨型王者。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) |
| 基础生命 | 520 |
| 伤害 | 5 |
| 速度 | 65 |
| 掉落番茄籽 | 34 |
| 招式 | 乱射 ×10 命中附带 2层[破甲](SKILLS.md#status-armorBreak) 4s（每 3s）<br>召唤 3 只[易拉罐蟹](MONSTERS.md#enemy-can_crab)（每 8s） |
| 固定词缀 | [荆棘](#affixes) |

<a id="boss-rag_wraith"></a>

### 抹布怨灵

<img src="images/boss/rag_wraith.png" width="96" height="96" alt="">

> 无数脏抹布组成的怨灵。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) |
| 基础生命 | 400 |
| 伤害 | 4 |
| 速度 | 95 |
| 掉落番茄籽 | 34 |
| 招式 | 瞬移（每 4s）<br>环形弹 ×14 命中附带 [致盲](SKILLS.md#status-blind) 2s、[诅咒](SKILLS.md#status-curse) 2s（每 3.5s） |

<a id="boss-battery_bug"></a>

### 漏电电池虫

<img src="images/boss/battery_bug.png" width="96" height="96" alt="">

> 被丢弃的电池里孵出的电虫。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) |
| 基础生命 | 420 |
| 伤害 | 5 |
| 速度 | 85 |
| 掉落番茄籽 | 34 |
| 招式 | 预警激光 命中附带 [眩晕](SKILLS.md#status-stun) 0.6s（每 4s）<br>乱射 ×8（每 3s） |

<a id="boss-garbage_rat"></a>

### 垃圾鼠王

<img src="images/boss/garbage_rat.png" width="96" height="96" alt="">

> 在垃圾场称霸的肥硕老鼠。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) |
| 基础生命 | 520 |
| 伤害 | 5 |
| 速度 | 80 |
| 掉落番茄籽 | 34 |
| 招式 | 召唤 5 只[下水道老鼠](MONSTERS.md#enemy-rat)（每 6s）<br>预警冲锋 命中附带 2层[流血](SKILLS.md#status-bleed) 3s（每 4s） |
| 固定词缀 | [统帅](#affixes) |

<a id="boss-oil_titan"></a>

### 石油泰坦

<img src="images/boss/oil_titan.png" width="96" height="96" alt="">

> 泄漏的石油化成的巨人。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) |
| 基础生命 | 500 |
| 伤害 | 4 |
| 速度 | 55 |
| 掉落番茄籽 | 34 |
| 招式 | 危险区 ×5 命中附带 [黏液](SKILLS.md#status-sticky) 2s、2层[灼烧](SKILLS.md#status-burn) 3s（每 4s）<br>环形弹 ×16（每 4s） |

<a id="boss-conveyor_worm"></a>

### 传送带蠕虫

<img src="images/boss/conveyor_worm.png" width="96" height="96" alt="">

> 机械化的巨型蠕虫。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) |
| 基础生命 | 520 |
| 伤害 | 6 |
| 速度 | 100 |
| 掉落番茄籽 | 38 |
| 招式 | 预警冲锋（每 2.8s）<br>乱射 ×10 命中附带 2层[破甲](SKILLS.md#status-armorBreak) 4s（每 3s） |

<a id="boss-ketchup_golem"></a>

### 番茄酱傀儡

<img src="images/boss/ketchup_golem.png" width="96" height="96" alt="">

> 被腐化的番茄酱灌注而成的傀儡。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) |
| 基础生命 | 560 |
| 伤害 | 5 |
| 速度 | 65 |
| 掉落番茄籽 | 38 |
| 招式 | 危险区 ×4 命中附带 2层[灼烧](SKILLS.md#status-burn) 3s、[黏液](SKILLS.md#status-sticky) 1.5s（每 4s）<br>环形弹 ×16（每 3.5s） |

<a id="boss-security_bot"></a>

### 保安机器人

<img src="images/boss/security_bot.png" width="96" height="96" alt="">

> 工厂的巡逻保安。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) |
| 基础生命 | 500 |
| 伤害 | 6 |
| 速度 | 85 |
| 掉落番茄籽 | 38 |
| 招式 | 预警激光（每 3.5s）<br>扇形瞄准 ×3 命中附带 [眩晕](SKILLS.md#status-stun) 0.4s（30%）（每 2s）<br>强化 自身/同伴获得 [屏障](SKILLS.md#status-barrier) 3s（每 9s） |

<a id="boss-press_machine"></a>

### 冲压机

<img src="images/boss/press_machine.png" width="96" height="96" alt="">

> 巨大的冲压机械，砸下来就是一片。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) |
| 基础生命 | 600 |
| 伤害 | 7 |
| 速度 | 50 |
| 掉落番茄籽 | 38 |
| 招式 | 预警砸地 ×3 命中附带 [眩晕](SKILLS.md#status-stun) 0.8s（每 3s） |
| 固定词缀 | [坚甲](#affixes) |

<a id="boss-chef_minion"></a>

### 腐烂副厨

<img src="images/boss/chef_minion.png" width="96" height="96" alt="">

> 腐烂大厨的得力助手。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) |
| 基础生命 | 520 |
| 伤害 | 5 |
| 速度 | 90 |
| 掉落番茄籽 | 38 |
| 招式 | 扇形瞄准 ×5 命中附带 2层[中毒](SKILLS.md#status-poison) 3s（每 2.2s）<br>瞬移（每 5s）<br>召唤 2 只[罐头机器人](MONSTERS.md#enemy-robot_can)（每 8s） |

<a id="boss-furnace_imp"></a>

### 熔炉小鬼

<img src="images/boss/furnace_imp.png" width="96" height="96" alt="">

> 在熔炉中诞生的火焰小鬼。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) |
| 基础生命 | 460 |
| 伤害 | 6 |
| 速度 | 110 |
| 掉落番茄籽 | 38 |
| 招式 | 螺旋弹幕 ×5 命中附带 2层[灼烧](SKILLS.md#status-burn) 3s（每 5s）<br>瞬移（每 4s） |
| 固定词缀 | [迅捷](#affixes) |

<a id="bosses"></a>

## Boss

第 15 波出现，波次持续 90 秒，超时后狂暴。生命降到一半进入第二阶段。

| 章节 | Boss |
| --- | --- |
| [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | <img src="images/boss/mold_king.png" width="32" height="32" alt=""> [霉菌大王](#boss-mold_king)、<img src="images/boss/grease_chef.png" width="32" height="32" alt=""> [油烟怪厨](#boss-grease_chef)、<img src="images/boss/cockroach_emperor.png" width="32" height="32" alt=""> [蟑螂皇帝](#boss-cockroach_emperor) |
| [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | <img src="images/boss/locust_queen.png" width="32" height="32" alt=""> [蝗虫女皇](#boss-locust_queen)、<img src="images/boss/rotten_pumpkin.png" width="32" height="32" alt=""> [腐烂南瓜王](#boss-rotten_pumpkin)、<img src="images/boss/mole_general.png" width="32" height="32" alt=""> [鼹鼠大将](#boss-mole_general) |
| [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | <img src="images/boss/frost_rat_king.png" width="32" height="32" alt=""> [冰霜鼠王](#boss-frost_rat_king)、<img src="images/boss/ice_cream_tyrant.png" width="32" height="32" alt=""> [冰淇淋暴君](#boss-ice_cream_tyrant)、<img src="images/boss/freezer_heart.png" width="32" height="32" alt=""> [冰柜之心](#boss-freezer_heart) |
| [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | <img src="images/boss/trash_golem.png" width="32" height="32" alt=""> [垃圾巨像](#boss-trash_golem)、<img src="images/boss/toxic_barrel.png" width="32" height="32" alt=""> [毒液桶魔](#boss-toxic_barrel)、<img src="images/boss/scrap_dragon.png" width="32" height="32" alt=""> [废铁巨龙](#boss-scrap_dragon) |
| [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | <img src="images/boss/rotten_chef.png" width="32" height="32" alt=""> [腐烂大厨](#boss-rotten_chef)、<img src="images/boss/factory_core.png" width="32" height="32" alt=""> [工厂主脑](#boss-factory_core)、<img src="images/boss/ketchup_leviathan.png" width="32" height="32" alt=""> [番茄酱海怪](#boss-ketchup_leviathan) |

<a id="boss-mold_king"></a>

### 霉菌大王 · 第一章 Boss

<img src="images/boss/mold_king.png" width="96" height="96" alt="">

> 盘踞在厨房水槽里的霉菌之王。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) |
| 基础生命 | 1800 |
| 伤害 | 5 |
| 速度 | 55 |
| 掉落番茄籽 | 72 |
| 招式 | 环形弹 ×14（每 3.5s）<br>召唤 6 只[霉菌团](MONSTERS.md#enemy-mold)（每 7s）<br>预警砸地 ×3（每 6s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.3，冷却 ×0.8；新增 螺旋弹幕 ×6 命中附带 2层[中毒](SKILLS.md#status-poison) 3s（每 8s） |

<a id="boss-grease_chef"></a>

### 油烟怪厨 · 第一章 Boss

<img src="images/boss/grease_chef.png" width="96" height="96" alt="">

> 抽油烟机里积攒百年的油烟成了精。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) |
| 基础生命 | 1900 |
| 伤害 | 5 |
| 速度 | 60 |
| 掉落番茄籽 | 72 |
| 招式 | 危险区 ×4 命中附带 2层[灼烧](SKILLS.md#status-burn) 3s、[致盲](SKILLS.md#status-blind) 1.5s（每 5s）<br>扇形瞄准 ×5（每 2.5s）<br>预警激光（每 6s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.2，冷却 ×0.8；新增 环形弹 ×18（每 3s）；获得 [暴怒](SKILLS.md#status-enrage) 999s |

<a id="boss-cockroach_emperor"></a>

### 蟑螂皇帝 · 第一章 Boss

<img src="images/boss/cockroach_emperor.png" width="96" height="96" alt="">

> 打不死的蟑螂皇帝，拥有惊人的再生力。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) |
| 基础生命 | 2000 |
| 伤害 | 6 |
| 速度 | 75 |
| 掉落番茄籽 | 72 |
| 招式 | 预警冲锋（每 3.5s）<br>召唤 4 只[蟑螂](MONSTERS.md#enemy-cockroach)（每 6s）<br>强化 自身/同伴获得 5层[再生](SKILLS.md#status-regen) 4s（每 12s） |
| 二阶段 | 生命 ≤ 40%：移速 ×1.3，冷却 ×0.75；新增 乱射 ×12 命中附带 2层[破甲](SKILLS.md#status-armorBreak) 5s（每 3s） |

<a id="boss-locust_queen"></a>

### 蝗虫女皇 · 第二章 Boss

<img src="images/boss/locust_queen.png" width="96" height="96" alt="">

> 吞噬整片菜园的虫群女王。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) |
| 基础生命 | 2200 |
| 伤害 | 6 |
| 速度 | 80 |
| 掉落番茄籽 | 84 |
| 招式 | 预警冲锋（每 4s）<br>召唤 6 只[果蝇](MONSTERS.md#enemy-fly)（每 6s）<br>扇形瞄准 ×5（每 2.8s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.25，冷却 ×0.75；新增 环形弹 ×18（每 4s） |

<a id="boss-rotten_pumpkin"></a>

### 腐烂南瓜王 · 第二章 Boss

<img src="images/boss/rotten_pumpkin.png" width="96" height="96" alt="">

> 万圣节后被遗弃的巨型南瓜。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) |
| 基础生命 | 2400 |
| 伤害 | 6 |
| 速度 | 55 |
| 掉落番茄籽 | 84 |
| 招式 | 预警砸地 ×4（每 4.5s）<br>召唤 4 只[泥蚯蚓](MONSTERS.md#enemy-worm)（每 7s）<br>螺旋弹幕 ×5 命中附带 [诅咒](SKILLS.md#status-curse) 3s（每 8s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.2，冷却 ×0.75；新增 瞬移（每 5s） |

<a id="boss-mole_general"></a>

### 鼹鼠大将 · 第二章 Boss

<img src="images/boss/mole_general.png" width="96" height="96" alt="">

> 在菜园底下挖了无数地道的鼹鼠将军。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) |
| 基础生命 | 2300 |
| 伤害 | 7 |
| 速度 | 70 |
| 掉落番茄籽 | 84 |
| 招式 | 瞬移（每 4s）<br>预警砸地 ×2 命中附带 [眩晕](SKILLS.md#status-stun) 0.6s（每 3.5s）<br>乱射 ×12（每 3s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.2，冷却 ×0.7；新增 召唤 4 只[泥蚯蚓](MONSTERS.md#enemy-worm)（每 7s） |

<a id="boss-frost_rat_king"></a>

### 冰霜鼠王 · 第三章 Boss

<img src="images/boss/frost_rat_king.png" width="96" height="96" alt="">

> 统治冰箱的鼠王，寒气逼人。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) |
| 基础生命 | 2600 |
| 伤害 | 7 |
| 速度 | 70 |
| 掉落番茄籽 | 96 |
| 招式 | 螺旋弹幕 ×5（每 7s）<br>预警冲锋 命中附带 [冰冻](SKILLS.md#status-freeze) 0.8s（每 5s）<br>危险区 ×4（每 6s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.2，冷却 ×0.75；新增 召唤 4 只[下水道老鼠](MONSTERS.md#enemy-rat)（每 7s） |

<a id="boss-ice_cream_tyrant"></a>

### 冰淇淋暴君 · 第三章 Boss

<img src="images/boss/ice_cream_tyrant.png" width="96" height="96" alt="">

> 三层冰淇淋球叠成的暴君。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) |
| 基础生命 | 2700 |
| 伤害 | 7 |
| 速度 | 60 |
| 掉落番茄籽 | 96 |
| 招式 | 环形弹 ×16（每 3s）<br>预警激光 命中附带 [冰冻](SKILLS.md#status-freeze) 1s（每 5s）<br>召唤 4 只[冰块怪](MONSTERS.md#enemy-ice_cube)（每 8s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.2，冷却 ×0.75；新增 螺旋弹幕 ×6（每 7s） |

<a id="boss-freezer_heart"></a>

### 冰柜之心 · 第三章 Boss

<img src="images/boss/freezer_heart.png" width="96" height="96" alt="">

> 冰柜压缩机中诞生的寒冰核心。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) |
| 基础生命 | 2500 |
| 伤害 | 7 |
| 速度 | 50 |
| 掉落番茄籽 | 96 |
| 招式 | 瞬移（每 5s）<br>乱射 ×12（每 2.5s）<br>危险区 ×5 命中附带 [冰冻](SKILLS.md#status-freeze) 0.8s（每 5s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.3，冷却 ×0.7；新增 环形弹 ×20（每 3s）；获得 [屏障](SKILLS.md#status-barrier) 5s |

<a id="boss-trash_golem"></a>

### 垃圾巨像 · 第四章 Boss

<img src="images/boss/trash_golem.png" width="96" height="96" alt="">

> 由城市垃圾堆积而成的庞然大物。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) |
| 基础生命 | 3200 |
| 伤害 | 8 |
| 速度 | 45 |
| 掉落番茄籽 | 108 |
| 招式 | 预警砸地 ×4（每 4.5s）<br>扇形瞄准 ×3（每 2.5s）<br>召唤 2 只[垃圾袋怪](MONSTERS.md#enemy-trash_bag)（每 8s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.3，冷却 ×0.7；新增 环形弹 ×20（每 3.5s） |

<a id="boss-toxic_barrel"></a>

### 毒液桶魔 · 第四章 Boss

<img src="images/boss/toxic_barrel.png" width="96" height="96" alt="">

> 泄漏的化学毒液桶。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) |
| 基础生命 | 3000 |
| 伤害 | 7 |
| 速度 | 55 |
| 掉落番茄籽 | 108 |
| 招式 | 危险区 ×5 命中附带 3层[中毒](SKILLS.md#status-poison) 4s（每 3.5s）<br>螺旋弹幕 ×6 命中附带 2层[中毒](SKILLS.md#status-poison) 3s（每 7s）<br>召唤 3 只[油污怪](MONSTERS.md#enemy-oil_blob)（每 8s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.2，冷却 ×0.7；新增 乱射 ×14 命中附带 [虚弱](SKILLS.md#status-weaken) 3s（每 2.5s） |

<a id="boss-scrap_dragon"></a>

### 废铁巨龙 · 第四章 Boss

<img src="images/boss/scrap_dragon.png" width="96" height="96" alt="">

> 废旧金属拼成的机械龙。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) |
| 基础生命 | 3300 |
| 伤害 | 8 |
| 速度 | 70 |
| 掉落番茄籽 | 108 |
| 招式 | 预警激光 命中附带 3层[灼烧](SKILLS.md#status-burn) 3s（每 4.5s）<br>预警冲锋（每 4s）<br>螺旋弹幕 ×5 命中附带 [灼烧](SKILLS.md#status-burn) 2s（每 7s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.25，冷却 ×0.7；新增 召唤 3 只[齿轮虫](MONSTERS.md#enemy-gear_bug)（每 8s） |

<a id="boss-rotten_chef"></a>

### 腐烂大厨 · 第五章 Boss

<img src="images/boss/rotten_chef.png" width="96" height="96" alt="">

> 番茄工厂的黑心厨师长，一切腐烂的源头。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) |
| 基础生命 | 4000 |
| 伤害 | 9 |
| 速度 | 85 |
| 掉落番茄籽 | 120 |
| 招式 | 扇形瞄准 ×7 命中附带 [腐烂](SKILLS.md#status-rot) 4s（每 2.2s）<br>预警冲锋（每 5s）<br>预警砸地 ×5（每 6s）<br>召唤 3 只[罐头机器人](MONSTERS.md#enemy-robot_can)（每 9s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.3，冷却 ×0.7；新增 螺旋弹幕 ×8（每 7s）、危险区 ×5 命中附带 [诅咒](SKILLS.md#status-curse) 3s（每 6s）；获得 [暴怒](SKILLS.md#status-enrage) 999s |

<a id="boss-factory_core"></a>

### 工厂主脑 · 第五章 Boss

<img src="images/boss/factory_core.png" width="96" height="96" alt="">

> 控制整座番茄酱工厂的邪恶 AI。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) |
| 基础生命 | 3800 |
| 伤害 | 9 |
| 速度 | 50 |
| 掉落番茄籽 | 120 |
| 招式 | 预警激光（每 3.5s）<br>召唤 3 只[罐头机器人](MONSTERS.md#enemy-robot_can)（每 7s）<br>瞬移（每 5s）<br>强化 自身/同伴获得 [屏障](SKILLS.md#status-barrier) 4s（每 10s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.3，冷却 ×0.7；新增 环形弹 ×22 命中附带 [沉默](SKILLS.md#status-silence) 2s（30%）（每 2.5s） |

<a id="boss-ketchup_leviathan"></a>

### 番茄酱海怪 · 第五章 Boss

<img src="images/boss/ketchup_leviathan.png" width="96" height="96" alt="">

> 在番茄酱池中翻腾的巨型怪物。

| 项目 | 数值 |
| --- | --- |
| 章节 | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) |
| 基础生命 | 4200 |
| 伤害 | 9 |
| 速度 | 55 |
| 掉落番茄籽 | 120 |
| 招式 | 危险区 ×6 命中附带 [黏液](SKILLS.md#status-sticky) 2s、2层[流血](SKILLS.md#status-bleed) 3s（每 4s）<br>螺旋弹幕 ×7（每 6s）<br>预警砸地 ×4（每 5s） |
| 二阶段 | 生命 ≤ 50%：移速 ×1.2，冷却 ×0.7；新增 召唤 4 只[油污怪](MONSTERS.md#enemy-oil_blob)（每 7s）、乱射 ×14（每 2.5s） |

<a id="affixes"></a>

## 精英词缀

精英随机获得词缀；第 7 波起小怪有概率以“词缀精英”形态出现（生命 ×3.5、掉落 ×4、必掉宝箱）。

| 词缀 | 效果 |
| --- | --- |
| 迅捷 | 移速 +35% |
| 坚甲 | 受到伤害 -30%，免疫击退 |
| 狂暴 | 生命低于 40% 时暴怒 |
| 再生 | 每秒回复 1.5% 生命 |
| 冰霜 | 攻击附带减速 |
| 剧毒 | 攻击附带 3 层中毒 |
| 诅咒 | 攻击附带诅咒（无法回血） |
| 护盾 | 每 8 秒获得 3 秒屏障 |
| 爆裂 | 死亡时爆炸 |
| 吸血 | 造成伤害时回复生命 |
| 荆棘 | 反弹 20% 近战伤害 |
| 统帅 | 周围怪物获得急速 |

---

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · **怪物** · [关卡](CHAPTERS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md)

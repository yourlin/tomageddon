# 武器（18 把）

**中文** · [English](en/WEAPONS.md)

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · **武器** · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · [成就](ACHIEVEMENTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md)

> 由 `npm run docs` 从 `src/data/*.ts` 自动生成，请勿手改。

武器自动索敌、自动攻击，每名角色最多携带 6 把（部分[角色](CHARACTERS.md)例外）。每把武器有 T1~T4 四个品质，两把同名同品质可在商店合成升一级。

价格：T1 基础价 × [1, 2, 4, 8]，再随波次上涨。伤害 = (基础 + Σ属性×系数) × (1+伤害%) × 类别倍率。

## 目录

- [武器一览](#overview)
- [随机词条与打造](#affixes)
- [近战武器](#class-melee)
  - [番茄叉](#weapon-fork)
  - [擀面杖](#weapon-rolling_pin)
  - [菜刀](#weapon-knife)
  - [平底锅](#weapon-pan)
  - [西瓜锤](#weapon-watermelon_hammer)
  - [剁骨刀](#weapon-cleaver)
- [远程武器](#class-ranged)
  - [番茄弹弓](#weapon-slingshot)
  - [豌豆枪](#weapon-pea_shooter)
  - [辣椒火箭](#weapon-chili_rocket)
  - [玉米加农](#weapon-corn_cannon)
  - [番茄酱瓶](#weapon-ketchup)
  - [洋葱回旋镖](#weapon-onion_boomerang)
  - [酱料加特林](#weapon-sauce_gatling)
- [元素武器](#class-elemental)
  - [芥末喷枪](#weapon-mustard_flamer)
  - [冰镇汽水](#weapon-soda)
  - [大蒜光环](#weapon-garlic_aura)
  - [胡椒雷](#weapon-pepper_mine)
  - [西兰花法杖](#weapon-broccoli_staff)

<a id="overview"></a>

## 武器一览

| 武器 | 类别 | 攻击方式 | 标签 | 伤害 T1~T4 | 冷却 T1~T4 | 射程 | 价格 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <img src="images/weapon/fork.png" width="32" height="32" alt=""> [番茄叉](#weapon-fork) | 近战 | 直刺 | 厨具 | 8 / 14 / 22 / 34 | 0.9 / 0.85 / 0.78 / 0.7 | 150 | 15 |
| <img src="images/weapon/rolling_pin.png" width="32" height="32" alt=""> [擀面杖](#weapon-rolling_pin) | 近战 | 横扫 | 厨具 | 12 / 20 / 32 / 48 | 1.25 / 1.18 / 1.1 / 1 | 130 | 18 |
| <img src="images/weapon/knife.png" width="32" height="32" alt=""> [菜刀](#weapon-knife) | 近战 | 直刺 | 厨具/锋利 | 6 / 10 / 16 / 25 | 0.6 / 0.55 / 0.5 / 0.44 | 130 | 20 |
| <img src="images/weapon/pan.png" width="32" height="32" alt=""> [平底锅](#weapon-pan) | 近战 | 横扫 | 厨具 | 18 / 30 / 46 / 70 | 1.6 / 1.5 / 1.4 / 1.3 | 120 | 25 |
| <img src="images/weapon/watermelon_hammer.png" width="32" height="32" alt=""> [西瓜锤](#weapon-watermelon_hammer) | 近战 | 横扫 | 蔬果 | 30 / 50 / 80 / 120 | 2.2 / 2.1 / 2 / 1.8 | 140 | 35 |
| <img src="images/weapon/slingshot.png" width="32" height="32" alt=""> [番茄弹弓](#weapon-slingshot) | 远程 | 子弹 | 蔬果 | 8 / 13 / 20 / 30 | 0.95 / 0.9 / 0.83 / 0.75 | 380 | 15 |
| <img src="images/weapon/pea_shooter.png" width="32" height="32" alt=""> [豌豆枪](#weapon-pea_shooter) | 远程 | 子弹 | 枪械/蔬果 | 4 / 6 / 9 / 13 | 0.32 / 0.29 / 0.26 / 0.22 | 400 | 22 |
| <img src="images/weapon/chili_rocket.png" width="32" height="32" alt=""> [辣椒火箭](#weapon-chili_rocket) | 远程 | 爆炸弹 | 枪械/元素 | 14 / 24 / 38 / 58 | 1.8 / 1.7 / 1.6 / 1.4 | 450 | 30 |
| <img src="images/weapon/corn_cannon.png" width="32" height="32" alt=""> [玉米加农](#weapon-corn_cannon) | 远程 | 子弹 | 枪械 | 16 / 28 / 44 / 68 | 1.1 / 1 / 0.92 / 0.84 | 520 | 28 |
| <img src="images/weapon/ketchup.png" width="32" height="32" alt=""> [番茄酱瓶](#weapon-ketchup) | 远程 | 子弹 | 酱料 | 5 / 8 / 12 / 17 | 0.75 / 0.7 / 0.65 / 0.6 | 280 | 20 |
| <img src="images/weapon/mustard_flamer.png" width="32" height="32" alt=""> [芥末喷枪](#weapon-mustard_flamer) | 元素 | 喷火 | 酱料/元素 | 2 / 3 / 5 / 8 | 0.2 / 0.18 / 0.16 / 0.14 | 200 | 28 |
| <img src="images/weapon/soda.png" width="32" height="32" alt=""> [冰镇汽水](#weapon-soda) | 元素 | 子弹 | 元素 | 9 / 15 / 22 / 32 | 0.75 / 0.7 / 0.65 / 0.58 | 400 | 22 |
| <img src="images/weapon/garlic_aura.png" width="32" height="32" alt=""> [大蒜光环](#weapon-garlic_aura) | 元素 | 光环 | 蔬果/元素 | 4 / 6 / 9 / 13 | 0.5 / 0.5 / 0.5 / 0.5 | 110 | 30 |
| <img src="images/weapon/pepper_mine.png" width="32" height="32" alt=""> [胡椒雷](#weapon-pepper_mine) | 元素 | 地雷 | 元素 | 20 / 34 / 52 / 80 | 2.5 / 2.3 / 2.1 / 1.8 | 200 | 25 |
| <img src="images/weapon/onion_boomerang.png" width="32" height="32" alt=""> [洋葱回旋镖](#weapon-onion_boomerang) | 远程 | 回旋镖 | 蔬果 | 10 / 17 / 26 / 40 | 1.4 / 1.3 / 1.2 / 1.1 | 360 | 24 |
| <img src="images/weapon/broccoli_staff.png" width="32" height="32" alt=""> [西兰花法杖](#weapon-broccoli_staff) | 元素 | 连锁闪电 | 蔬果/元素 | 10 / 17 / 26 / 40 | 1.1 / 1 / 0.92 / 0.84 | 420 | 30 |
| <img src="images/weapon/sauce_gatling.png" width="32" height="32" alt=""> [酱料加特林](#weapon-sauce_gatling) | 远程 | 子弹 | 枪械/酱料 | 4 / 6 / 8 / 11 | 0.16 / 0.14 / 0.12 / 0.1 | 420 | 40 |
| <img src="images/weapon/cleaver.png" width="32" height="32" alt=""> [剁骨刀](#weapon-cleaver) | 近战 | 横扫 | 厨具/锋利 | 13 / 22 / 35 / 54 | 1.1 / 1.05 / 1 / 0.9 | 125 | 26 |

<a id="affixes"></a>

## 随机词条与打造

- T3 武器随机 1 条词条、T4 武器 2 条；词条分 I~IV 级（I 常见、IV 稀有，幸运越高越容易出高等级）
- 商店中可花番茄籽洗练：全部重洗 `8 + 2×波次`，单条重洗为其 2.5 倍
- T4 武器可打造，每级伤害 +8%，最高 +10；费用随等级 ×1.45 递增，失败只扣费用不降级

| 词条 | I | II | III | IV |
| --- | --- | --- | --- | --- |
| 伤害 +N% | 8 | 14 | 22 | 32 |
| 攻速 +N% | 6 | 10 | 15 | 22 |
| 暴击率 +N% | 4 | 7 | 11 | 16 |
| 暴击伤害 +N% | 15 | 25 | 40 | 60 |
| 射程 +N | 20 | 35 | 55 | 80 |
| 吸血 +N% | 1 | 2 | 3 | 5 |
| 命中 N% 概率灼烧 | 8 | 14 | 22 | 32 |
| 命中 N% 概率中毒 | 8 | 14 | 22 | 32 |
| 命中 N% 概率减速 | 10 | 18 | 28 | 40 |

| 打造等级 | +1 | +2 | +3 | +4 | +5 | +6 | +7 | +8 | +9 | +10 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 成功率 | 95% | 90% | 82% | 74% | 65% | 56% | 48% | 40% | 34% | 30% |

<a id="class-melee"></a>

## 近战武器

<a id="weapon-fork"></a>

### 番茄叉

<img src="images/weapon/fork.png" width="64" height="64" alt="">

> 朴实的三齿叉，向前直刺。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 直刺 |
| 标签 | 厨具 |
| 伤害 T1~T4 | 8 / 14 / 22 / 34 |
| 冷却 T1~T4 | 0.9s / 0.85s / 0.78s / 0.7s |
| 射程 | 150 |
| 属性加成 | 近战伤害 ×1 |
| 暴击倍率 | ×2 |
| 特效 | 击退 10 |
| T1 价格 | 15 |
| 初始携带 | [番茄妹](CHARACTERS.md#char-tomato)、[豆芽学徒](CHARACTERS.md#char-sprout) |

<a id="weapon-rolling_pin"></a>

### 擀面杖

<img src="images/weapon/rolling_pin.png" width="64" height="64" alt="">

> 横扫一片，击退敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 横扫 |
| 标签 | 厨具 |
| 伤害 T1~T4 | 12 / 20 / 32 / 48 |
| 冷却 T1~T4 | 1.25s / 1.18s / 1.1s / 1s |
| 射程 | 130 |
| 属性加成 | 近战伤害 ×1 |
| 暴击倍率 | ×1.5 |
| 特效 | 击退 30 |
| T1 价格 | 18 |
| 初始携带 | [胡萝卜骑士](CHARACTERS.md#char-carrot)、[火龙果龙骑](CHARACTERS.md#char-dragonfruit)、[红薯厨神](CHARACTERS.md#char-sweetpotato)、[冬瓜和尚](CHARACTERS.md#char-wintermelon) |

<a id="weapon-knife"></a>

### 菜刀

<img src="images/weapon/knife.png" width="64" height="64" alt="">

> 快速直刺，高暴击。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 直刺 |
| 标签 | 厨具、锋利 |
| 伤害 T1~T4 | 6 / 10 / 16 / 25 |
| 冷却 T1~T4 | 0.6s / 0.55s / 0.5s / 0.44s |
| 射程 | 130 |
| 属性加成 | 近战伤害 ×0.8 |
| 暴击倍率 | ×2.5 |
| 特效 | 额外暴击 15% |
| T1 价格 | 20 |
| 初始携带 | [柠檬刺客](CHARACTERS.md#char-lemon)、[蓝莓双子](CHARACTERS.md#char-blueberry)、[猕猴桃侦探](CHARACTERS.md#char-kiwi) |

<a id="weapon-pan"></a>

### 平底锅

<img src="images/weapon/pan.png" width="64" height="64" alt="">

> 沉重横扫，眩晕敌人 0.4 秒。伤害受护甲加成。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 横扫 |
| 标签 | 厨具 |
| 伤害 T1~T4 | 18 / 30 / 46 / 70 |
| 冷却 T1~T4 | 1.6s / 1.5s / 1.4s / 1.3s |
| 射程 | 120 |
| 属性加成 | 近战伤害 ×1.2，护甲 ×1 |
| 暴击倍率 | ×1.5 |
| 特效 | 眩晕 0.4s，击退 20 |
| T1 价格 | 25 |
| 初始携带 | [洋葱大叔](CHARACTERS.md#char-onion)、[椰子拳师](CHARACTERS.md#char-coconut) |

<a id="weapon-watermelon_hammer"></a>

### 西瓜锤

<img src="images/weapon/watermelon_hammer.png" width="64" height="64" alt="">

> 砸地产生爆炸，范围巨大。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 横扫 |
| 标签 | 蔬果 |
| 伤害 T1~T4 | 30 / 50 / 80 / 120 |
| 冷却 T1~T4 | 2.2s / 2.1s / 2s / 1.8s |
| 射程 | 140 |
| 属性加成 | 近战伤害 ×1.5，最大生命 ×0.1 |
| 暴击倍率 | ×1.5 |
| 特效 | 爆炸半径 80，击退 40 |
| T1 价格 | 35 |
| 初始携带 | [西瓜胖墩](CHARACTERS.md#char-watermelon) |

<a id="weapon-cleaver"></a>

### 剁骨刀

<img src="images/weapon/cleaver.png" width="64" height="64" alt="">

> 大力横扫，击杀敌人时 20% 概率额外掉落番茄籽。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 横扫 |
| 标签 | 厨具、锋利 |
| 伤害 T1~T4 | 13 / 22 / 35 / 54 |
| 冷却 T1~T4 | 1.1s / 1.05s / 1s / 0.9s |
| 射程 | 125 |
| 属性加成 | 近战伤害 ×1 |
| 暴击倍率 | ×2 |
| 特效 | 击退 15，额外暴击 5% |
| T1 价格 | 26 |
| 初始携带 | [甜菜狂战士](CHARACTERS.md#char-beet) |

<a id="class-ranged"></a>

## 远程武器

<a id="weapon-slingshot"></a>

### 番茄弹弓

<img src="images/weapon/slingshot.png" width="64" height="64" alt="">

> 弹出番茄，命中后弹射到下一个敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 子弹 |
| 标签 | 蔬果 |
| 伤害 T1~T4 | 8 / 13 / 20 / 30 |
| 冷却 T1~T4 | 0.95s / 0.9s / 0.83s / 0.75s |
| 射程 | 380 |
| 属性加成 | 远程伤害 ×0.9 |
| 暴击倍率 | ×1.5 |
| 特效 | 弹射 1/1/2/3 |
| T1 价格 | 15 |
| 初始携带 | [菠萝船长](CHARACTERS.md#char-pineapple)、[蜜桃天使](CHARACTERS.md#char-peach)、[荔枝公主](CHARACTERS.md#char-lychee) |

<a id="weapon-pea_shooter"></a>

### 豌豆枪

<img src="images/weapon/pea_shooter.png" width="64" height="64" alt="">

> 高射速豌豆连发。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 子弹 |
| 标签 | 枪械、蔬果 |
| 伤害 T1~T4 | 4 / 6 / 9 / 13 |
| 冷却 T1~T4 | 0.32s / 0.29s / 0.26s / 0.22s |
| 射程 | 400 |
| 属性加成 | 远程伤害 ×0.6 |
| 暴击倍率 | ×1.5 |
| 特效 | - |
| T1 价格 | 22 |
| 初始携带 | [蓝莓双子](CHARACTERS.md#char-blueberry)、[樱桃双枪](CHARACTERS.md#char-cherry)、[豌豆士兵](CHARACTERS.md#char-pea) |

<a id="weapon-chili_rocket"></a>

### 辣椒火箭

<img src="images/weapon/chili_rocket.png" width="64" height="64" alt="">

> 命中爆炸并灼烧敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 爆炸弹 |
| 标签 | 枪械、元素 |
| 伤害 T1~T4 | 14 / 24 / 38 / 58 |
| 冷却 T1~T4 | 1.8s / 1.7s / 1.6s / 1.4s |
| 射程 | 450 |
| 属性加成 | 远程伤害 ×1，元素伤害 ×0.5 |
| 暴击倍率 | ×1.5 |
| 特效 | 灼烧 3/秒 2s，爆炸半径 70 |
| T1 价格 | 30 |
| 初始携带 | [牛油果博士](CHARACTERS.md#char-avocado)、[山葵爆破手](CHARACTERS.md#char-wasabi) |

<a id="weapon-corn_cannon"></a>

### 玉米加农

<img src="images/weapon/corn_cannon.png" width="64" height="64" alt="">

> 玉米粒炮弹，穿透多个敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 子弹 |
| 标签 | 枪械 |
| 伤害 T1~T4 | 16 / 28 / 44 / 68 |
| 冷却 T1~T4 | 1.1s / 1s / 0.92s / 0.84s |
| 射程 | 520 |
| 属性加成 | 远程伤害 ×1.2 |
| 暴击倍率 | ×2 |
| 特效 | 穿透 3/4/5/6，击退 15 |
| T1 价格 | 28 |
| 初始携带 | [玉米枪手](CHARACTERS.md#char-corn)、[芦笋弓手](CHARACTERS.md#char-asparagus) |

<a id="weapon-ketchup"></a>

### 番茄酱瓶

<img src="images/weapon/ketchup.png" width="64" height="64" alt="">

> 扇形喷射番茄酱，命中额外吸血。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 子弹 |
| 标签 | 酱料 |
| 伤害 T1~T4 | 5 / 8 / 12 / 17 |
| 冷却 T1~T4 | 0.75s / 0.7s / 0.65s / 0.6s |
| 射程 | 280 |
| 属性加成 | 远程伤害 ×0.6 |
| 暴击倍率 | ×1.5 |
| 特效 | 额外吸血 5%，弹丸 3/3/4/5 |
| T1 价格 | 20 |
| 初始携带 | [草莓偶像](CHARACTERS.md#char-strawberry)、[葡萄魔术师](CHARACTERS.md#char-grape) |

<a id="weapon-onion_boomerang"></a>

### 洋葱回旋镖

<img src="images/weapon/onion_boomerang.png" width="64" height="64" alt="">

> 飞出后返回，沿途无限穿透。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 回旋镖 |
| 标签 | 蔬果 |
| 伤害 T1~T4 | 10 / 17 / 26 / 40 |
| 冷却 T1~T4 | 1.4s / 1.3s / 1.2s / 1.1s |
| 射程 | 360 |
| 属性加成 | 远程伤害 ×0.9 |
| 暴击倍率 | ×1.5 |
| 特效 | - |
| T1 价格 | 24 |
| 初始携带 | [生姜忍者](CHARACTERS.md#char-ginger) |

<a id="weapon-sauce_gatling"></a>

### 酱料加特林

<img src="images/weapon/sauce_gatling.png" width="64" height="64" alt="">

> 疯狂扫射的酱料机枪。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 子弹 |
| 标签 | 枪械、酱料 |
| 伤害 T1~T4 | 4 / 6 / 8 / 11 |
| 冷却 T1~T4 | 0.16s / 0.14s / 0.12s / 0.1s |
| 射程 | 420 |
| 属性加成 | 远程伤害 ×0.4 |
| 暴击倍率 | ×1.5 |
| 特效 | 额外吸血 1% |
| T1 价格 | 40 |
| 初始携带 | [青椒机甲](CHARACTERS.md#char-bellpepper) |

<a id="class-elemental"></a>

## 元素武器

<a id="weapon-mustard_flamer"></a>

### 芥末喷枪

<img src="images/weapon/mustard_flamer.png" width="64" height="64" alt="">

> 短距离喷射火焰，无限穿透并灼烧。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 喷火 |
| 标签 | 酱料、元素 |
| 伤害 T1~T4 | 2 / 3 / 5 / 8 |
| 冷却 T1~T4 | 0.2s / 0.18s / 0.16s / 0.14s |
| 射程 | 200 |
| 属性加成 | 元素伤害 ×0.25 |
| 暴击倍率 | ×1.5 |
| 特效 | 灼烧 2/秒 2s |
| T1 价格 | 28 |
| 初始携带 | [辣椒姐](CHARACTERS.md#char-chili) |

<a id="weapon-soda"></a>

### 冰镇汽水

<img src="images/weapon/soda.png" width="64" height="64" alt="">

> 冰冷的气泡穿透敌人并减速 40%。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 子弹 |
| 标签 | 元素 |
| 伤害 T1~T4 | 9 / 15 / 22 / 32 |
| 冷却 T1~T4 | 0.75s / 0.7s / 0.65s / 0.58s |
| 射程 | 400 |
| 属性加成 | 元素伤害 ×0.9 |
| 暴击倍率 | ×1.5 |
| 特效 | 减速 40% 1.5s，穿透 1/1/2/2 |
| T1 价格 | 22 |
| 初始携带 | [南瓜幽灵](CHARACTERS.md#char-pumpkin)、[蘑菇巫医](CHARACTERS.md#char-mushroom)、[苦瓜冰法](CHARACTERS.md#char-bittermelon) |

<a id="weapon-garlic_aura"></a>

### 大蒜光环

<img src="images/weapon/garlic_aura.png" width="64" height="64" alt="">

> 持续伤害周围敌人（每 0.5 秒）。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 光环 |
| 标签 | 蔬果、元素 |
| 伤害 T1~T4 | 4 / 6 / 9 / 13 |
| 冷却 T1~T4 | 0.5s / 0.5s / 0.5s / 0.5s |
| 射程 | 110 |
| 属性加成 | 元素伤害 ×0.5 |
| 暴击倍率 | ×1.5 |
| 特效 | - |
| T1 价格 | 30 |
| 初始携带 | [大蒜伯爵](CHARACTERS.md#char-garlic)、[榴莲霸王](CHARACTERS.md#char-durian) |

<a id="weapon-pepper_mine"></a>

### 胡椒雷

<img src="images/weapon/pepper_mine.png" width="64" height="64" alt="">

> 在身边布雷，敌人踩中后爆炸。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 地雷 |
| 标签 | 元素 |
| 伤害 T1~T4 | 20 / 34 / 52 / 80 |
| 冷却 T1~T4 | 2.5s / 2.3s / 2.1s / 1.8s |
| 射程 | 200 |
| 属性加成 | 元素伤害 ×1 |
| 暴击倍率 | ×1.5 |
| 特效 | 爆炸半径 90 |
| T1 价格 | 25 |
| 初始携带 | [牛油果博士](CHARACTERS.md#char-avocado) |

<a id="weapon-broccoli_staff"></a>

### 西兰花法杖

<img src="images/weapon/broccoli_staff.png" width="64" height="64" alt="">

> 释放连锁闪电，在敌人间跳跃。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 连锁闪电 |
| 标签 | 蔬果、元素 |
| 伤害 T1~T4 | 10 / 17 / 26 / 40 |
| 冷却 T1~T4 | 1.1s / 1s / 0.92s / 0.84s |
| 射程 | 420 |
| 属性加成 | 元素伤害 ×1 |
| 暴击倍率 | ×1.5 |
| 特效 | 连锁 2/3/4/6 次 |
| T1 价格 | 30 |
| 初始携带 | [茄子法师](CHARACTERS.md#char-eggplant) |

---

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · **武器** · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · [成就](ACHIEVEMENTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md)

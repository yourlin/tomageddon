# 武器（50 把）

**中文** · [English](en/WEAPONS.md)

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · **武器** · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · [成就](ACHIEVEMENTS.md) · [天赋](TALENTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

> 由 `npm run docs` 从 `src/data/*.ts` 自动生成，请勿手改。

武器自动索敌、自动攻击，每名角色最多携带 6 把（部分[角色](CHARACTERS.md)例外）。每把武器有 T1~T4 四个品质，两把同名同品质可在商店合成升一级。

价格：T1 基础价 × [1, 2.1, 4, 7.5]，再随波次上涨。伤害 = (基础 + Σ属性×系数) × (1+伤害%) × 类别倍率。

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
  - [锅铲](#weapon-spatula)
  - [旋风打蛋器](#weapon-whisk_spin)
  - [松肉锤](#weapon-meat_tenderizer)
  - [烤串签](#weapon-skewer)
  - [汤勺](#weapon-ladle)
  - [法棍剑](#weapon-baguette_sword)
  - [黄瓜武士刀](#weapon-cucumber_katana)
  - [披萨滚刀](#weapon-pizza_cutter)
  - [竹筷](#weapon-chopsticks)
  - [竹笋长矛](#weapon-bamboo_spear)
  - [菠萝流星锤](#weapon-pineapple_mace)
- [远程武器](#class-ranged)
  - [番茄弹弓](#weapon-slingshot)
  - [豌豆枪](#weapon-pea_shooter)
  - [辣椒火箭](#weapon-chili_rocket)
  - [玉米加农](#weapon-corn_cannon)
  - [番茄酱瓶](#weapon-ketchup)
  - [洋葱回旋镖](#weapon-onion_boomerang)
  - [酱料加特林](#weapon-sauce_gatling)
  - [橄榄发射器](#weapon-olive_launcher)
  - [爆米花机](#weapon-popcorn_machine)
  - [葡萄霰弹枪](#weapon-grape_shotgun)
  - [豆子火箭筒](#weapon-bean_bazooka)
  - [樱桃炸弹](#weapon-cherry_bomb)
  - [蓝莓狙击枪](#weapon-blueberry_sniper)
  - [餐盘飞碟](#weapon-plate_frisbee)
  - [瓜子机枪](#weapon-seed_spitter)
  - [胡萝卜弩](#weapon-carrot_crossbow)
  - [蜂蜜喷枪](#weapon-honey_blaster)
  - [酱油手枪](#weapon-soy_pistol)
- [元素武器](#class-elemental)
  - [芥末喷枪](#weapon-mustard_flamer)
  - [冰镇汽水](#weapon-soda)
  - [大蒜光环](#weapon-garlic_aura)
  - [胡椒雷](#weapon-pepper_mine)
  - [西兰花法杖](#weapon-broccoli_staff)
  - [冰块格](#weapon-ice_cube_tray)
  - [闪电打蛋器](#weapon-lightning_whisk)
  - [蒸汽水壶](#weapon-steam_kettle)
  - [咖喱光环](#weapon-curry_aura)
  - [胡椒喷雾](#weapon-pepper_spray)
  - [薄荷冰雷](#weapon-mint_frost_mine)
  - [雷霆榴莲](#weapon-thunder_durian)
  - [火龙果法球](#weapon-dragonfruit_orb)
  - [八角飞镖](#weapon-star_anise_shuriken)
  - [柠檬电池](#weapon-lemon_battery)
- [武器进化（12 把超武）](#evolution)

<a id="overview"></a>

## 武器一览

| 武器 | 类别 | 攻击方式 | 标签 | 伤害 T1~T4 | 冷却 T1~T4 | 射程 | 价格 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| <img src="images/weapon/fork.png" width="32" height="32" alt=""> [番茄叉](#weapon-fork) | 近战 | 直刺 | 厨具 | 8 / 14 / 22 / 34 | 0.9 / 0.85 / 0.78 / 0.7 | 150 | 15 |
| <img src="images/weapon/rolling_pin.png" width="32" height="32" alt=""> [擀面杖](#weapon-rolling_pin) | 近战 | 横扫 | 厨具 | 12 / 20 / 32 / 48 | 1.25 / 1.18 / 1.1 / 1 | 130 | 18 |
| <img src="images/weapon/knife.png" width="32" height="32" alt=""> [菜刀](#weapon-knife) | 近战 | 直刺 | 厨具/锋利 | 6 / 10 / 16 / 25 | 0.6 / 0.55 / 0.5 / 0.44 | 130 | 20 |
| <img src="images/weapon/pan.png" width="32" height="32" alt=""> [平底锅](#weapon-pan) | 近战 | 横扫 | 厨具 | 18 / 30 / 46 / 70 | 1.6 / 1.5 / 1.4 / 1.3 | 120 | 25 |
| <img src="images/weapon/watermelon_hammer.png" width="32" height="32" alt=""> [西瓜锤](#weapon-watermelon_hammer) | 近战 | 横扫 | 蔬果/爆破 | 30 / 50 / 80 / 120 | 2.2 / 2.1 / 2 / 1.8 | 140 | 35 |
| <img src="images/weapon/slingshot.png" width="32" height="32" alt=""> [番茄弹弓](#weapon-slingshot) | 远程 | 子弹 | 蔬果 | 8 / 13 / 20 / 30 | 0.95 / 0.9 / 0.83 / 0.75 | 380 | 15 |
| <img src="images/weapon/pea_shooter.png" width="32" height="32" alt=""> [豌豆枪](#weapon-pea_shooter) | 远程 | 子弹 | 枪械/蔬果 | 4 / 6 / 9 / 13 | 0.32 / 0.29 / 0.26 / 0.22 | 400 | 22 |
| <img src="images/weapon/chili_rocket.png" width="32" height="32" alt=""> [辣椒火箭](#weapon-chili_rocket) | 远程 | 爆炸弹 | 枪械/元素/爆破 | 14 / 24 / 38 / 58 | 1.8 / 1.7 / 1.6 / 1.4 | 450 | 30 |
| <img src="images/weapon/corn_cannon.png" width="32" height="32" alt=""> [玉米加农](#weapon-corn_cannon) | 远程 | 子弹 | 枪械 | 16 / 28 / 44 / 68 | 1.1 / 1 / 0.92 / 0.84 | 520 | 28 |
| <img src="images/weapon/ketchup.png" width="32" height="32" alt=""> [番茄酱瓶](#weapon-ketchup) | 远程 | 子弹 | 酱料 | 5 / 8 / 12 / 17 | 0.75 / 0.7 / 0.65 / 0.6 | 280 | 20 |
| <img src="images/weapon/mustard_flamer.png" width="32" height="32" alt=""> [芥末喷枪](#weapon-mustard_flamer) | 元素 | 喷火 | 酱料/元素 | 2 / 3 / 5 / 8 | 0.2 / 0.18 / 0.16 / 0.14 | 200 | 28 |
| <img src="images/weapon/soda.png" width="32" height="32" alt=""> [冰镇汽水](#weapon-soda) | 元素 | 子弹 | 元素 | 9 / 15 / 22 / 32 | 0.75 / 0.7 / 0.65 / 0.58 | 400 | 22 |
| <img src="images/weapon/garlic_aura.png" width="32" height="32" alt=""> [大蒜光环](#weapon-garlic_aura) | 元素 | 光环 | 蔬果/元素 | 4 / 6 / 9 / 13 | 0.5 / 0.5 / 0.5 / 0.5 | 110 | 30 |
| <img src="images/weapon/pepper_mine.png" width="32" height="32" alt=""> [胡椒雷](#weapon-pepper_mine) | 元素 | 地雷 | 元素/爆破 | 20 / 34 / 52 / 80 | 2.5 / 2.3 / 2.1 / 1.8 | 200 | 25 |
| <img src="images/weapon/onion_boomerang.png" width="32" height="32" alt=""> [洋葱回旋镖](#weapon-onion_boomerang) | 远程 | 回旋镖 | 蔬果 | 10 / 17 / 26 / 40 | 1.4 / 1.3 / 1.2 / 1.1 | 360 | 24 |
| <img src="images/weapon/broccoli_staff.png" width="32" height="32" alt=""> [西兰花法杖](#weapon-broccoli_staff) | 元素 | 连锁闪电 | 蔬果/元素 | 10 / 17 / 26 / 40 | 1.1 / 1 / 0.92 / 0.84 | 420 | 30 |
| <img src="images/weapon/sauce_gatling.png" width="32" height="32" alt=""> [酱料加特林](#weapon-sauce_gatling) | 远程 | 子弹 | 枪械/酱料 | 4 / 6 / 8 / 11 | 0.16 / 0.14 / 0.12 / 0.1 | 420 | 40 |
| <img src="images/weapon/cleaver.png" width="32" height="32" alt=""> [剁骨刀](#weapon-cleaver) | 近战 | 横扫 | 厨具/锋利 | 13 / 22 / 35 / 54 | 1.1 / 1.05 / 1 / 0.9 | 125 | 26 |
| <img src="images/weapon/spatula.png" width="32" height="32" alt=""> [锅铲](#weapon-spatula) | 近战 | 横扫 | 厨具 | 9 / 16 / 25 / 38 | 1.05 / 1 / 0.92 / 0.84 | 115 | 16 |
| <img src="images/weapon/whisk_spin.png" width="32" height="32" alt=""> [旋风打蛋器](#weapon-whisk_spin) | 近战 | 光环 | 厨具 | 3 / 5 / 8 / 12 | 0.45 / 0.45 / 0.42 / 0.4 | 90 | 22 |
| <img src="images/weapon/meat_tenderizer.png" width="32" height="32" alt=""> [松肉锤](#weapon-meat_tenderizer) | 近战 | 横扫 | 厨具 | 22 / 36 / 56 / 84 | 1.9 / 1.8 / 1.7 / 1.55 | 110 | 30 |
| <img src="images/weapon/skewer.png" width="32" height="32" alt=""> [烤串签](#weapon-skewer) | 近战 | 直刺 | 厨具/锋利 | 12 / 21 / 33 / 51 | 1.05 / 1 / 0.92 / 0.84 | 185 | 24 |
| <img src="images/weapon/ladle.png" width="32" height="32" alt=""> [汤勺](#weapon-ladle) | 近战 | 横扫 | 厨具/酱料 | 10 / 17 / 27 / 41 | 1.15 / 1.1 / 1.02 / 0.94 | 120 | 20 |
| <img src="images/weapon/baguette_sword.png" width="32" height="32" alt=""> [法棍剑](#weapon-baguette_sword) | 近战 | 横扫 | 蔬果 | 11 / 19 / 30 / 46 | 1.3 / 1.22 / 1.14 / 1.04 | 140 | 22 |
| <img src="images/weapon/cucumber_katana.png" width="32" height="32" alt=""> [黄瓜武士刀](#weapon-cucumber_katana) | 近战 | 直刺 | 蔬果/锋利 | 9 / 15 / 24 / 36 | 0.8 / 0.75 / 0.69 / 0.62 | 140 | 24 |
| <img src="images/weapon/pizza_cutter.png" width="32" height="32" alt=""> [披萨滚刀](#weapon-pizza_cutter) | 近战 | 回旋镖 | 厨具/锋利 | 9 / 15 / 24 / 36 | 1.3 / 1.2 / 1.1 / 1 | 230 | 26 |
| <img src="images/weapon/chopsticks.png" width="32" height="32" alt=""> [竹筷](#weapon-chopsticks) | 近战 | 直刺 | 厨具 | 5 / 9 / 14 / 21 | 0.5 / 0.46 / 0.42 / 0.38 | 155 | 18 |
| <img src="images/weapon/bamboo_spear.png" width="32" height="32" alt=""> [竹笋长矛](#weapon-bamboo_spear) | 近战 | 直刺 | 蔬果 | 19 / 32 / 50 / 77 | 1.5 / 1.42 / 1.32 / 1.2 | 200 | 28 |
| <img src="images/weapon/pineapple_mace.png" width="32" height="32" alt=""> [菠萝流星锤](#weapon-pineapple_mace) | 近战 | 横扫 | 蔬果/爆破 | 20 / 34 / 53 / 80 | 1.8 / 1.7 / 1.6 / 1.45 | 130 | 32 |
| <img src="images/weapon/olive_launcher.png" width="32" height="32" alt=""> [橄榄发射器](#weapon-olive_launcher) | 远程 | 子弹 | 枪械/蔬果 | 6 / 10 / 15 / 23 | 0.8 / 0.75 / 0.7 / 0.62 | 400 | 22 |
| <img src="images/weapon/popcorn_machine.png" width="32" height="32" alt=""> [爆米花机](#weapon-popcorn_machine) | 远程 | 地雷 | 枪械/爆破 | 14 / 24 / 37 / 56 | 2 / 1.9 / 1.75 / 1.6 | 220 | 24 |
| <img src="images/weapon/grape_shotgun.png" width="32" height="32" alt=""> [葡萄霰弹枪](#weapon-grape_shotgun) | 远程 | 子弹 | 枪械/蔬果 | 4 / 7 / 10 / 15 | 1 / 0.95 / 0.88 / 0.8 | 240 | 26 |
| <img src="images/weapon/bean_bazooka.png" width="32" height="32" alt=""> [豆子火箭筒](#weapon-bean_bazooka) | 远程 | 爆炸弹 | 枪械/爆破 | 22 / 36 / 56 / 84 | 2.4 / 2.25 / 2.1 / 1.9 | 480 | 34 |
| <img src="images/weapon/cherry_bomb.png" width="32" height="32" alt=""> [樱桃炸弹](#weapon-cherry_bomb) | 远程 | 爆炸弹 | 蔬果/爆破 | 10 / 17 / 26 / 40 | 1.6 / 1.5 / 1.4 / 1.3 | 360 | 28 |
| <img src="images/weapon/blueberry_sniper.png" width="32" height="32" alt=""> [蓝莓狙击枪](#weapon-blueberry_sniper) | 远程 | 子弹 | 枪械/蔬果 | 26 / 44 / 68 / 100 | 1.9 / 1.8 / 1.65 / 1.5 | 650 | 32 |
| <img src="images/weapon/plate_frisbee.png" width="32" height="32" alt=""> [餐盘飞碟](#weapon-plate_frisbee) | 远程 | 回旋镖 | 厨具 | 12 / 20 / 31 / 47 | 1.5 / 1.4 / 1.3 / 1.2 | 330 | 24 |
| <img src="images/weapon/seed_spitter.png" width="32" height="32" alt=""> [瓜子机枪](#weapon-seed_spitter) | 远程 | 子弹 | 枪械/蔬果 | 3 / 5 / 7 / 10 | 0.22 / 0.2 / 0.18 / 0.16 | 360 | 26 |
| <img src="images/weapon/carrot_crossbow.png" width="32" height="32" alt=""> [胡萝卜弩](#weapon-carrot_crossbow) | 远程 | 子弹 | 蔬果 | 12 / 20 / 31 / 47 | 1.05 / 1 / 0.92 / 0.84 | 460 | 25 |
| <img src="images/weapon/honey_blaster.png" width="32" height="32" alt=""> [蜂蜜喷枪](#weapon-honey_blaster) | 远程 | 子弹 | 酱料 | 6 / 10 / 15 / 22 | 0.7 / 0.66 / 0.6 / 0.54 | 360 | 22 |
| <img src="images/weapon/soy_pistol.png" width="32" height="32" alt=""> [酱油手枪](#weapon-soy_pistol) | 远程 | 子弹 | 枪械/酱料 | 7 / 12 / 18 / 27 | 0.55 / 0.5 / 0.46 / 0.42 | 380 | 20 |
| <img src="images/weapon/ice_cube_tray.png" width="32" height="32" alt=""> [冰块格](#weapon-ice_cube_tray) | 元素 | 子弹 | 厨具/元素 | 5 / 8 / 12 / 18 | 1 / 0.95 / 0.88 / 0.8 | 340 | 26 |
| <img src="images/weapon/lightning_whisk.png" width="32" height="32" alt=""> [闪电打蛋器](#weapon-lightning_whisk) | 元素 | 连锁闪电 | 厨具/元素 | 7 / 12 / 18 / 27 | 0.95 / 0.9 / 0.82 / 0.74 | 380 | 30 |
| <img src="images/weapon/steam_kettle.png" width="32" height="32" alt=""> [蒸汽水壶](#weapon-steam_kettle) | 元素 | 喷火 | 厨具/元素 | 3 / 5 / 7 / 11 | 0.26 / 0.24 / 0.21 / 0.18 | 170 | 28 |
| <img src="images/weapon/curry_aura.png" width="32" height="32" alt=""> [咖喱光环](#weapon-curry_aura) | 元素 | 光环 | 酱料/元素 | 3 / 5 / 7 / 11 | 0.5 / 0.5 / 0.5 / 0.5 | 120 | 32 |
| <img src="images/weapon/pepper_spray.png" width="32" height="32" alt=""> [胡椒喷雾](#weapon-pepper_spray) | 元素 | 喷火 | 元素 | 2 / 4 / 6 / 9 | 0.18 / 0.16 / 0.14 / 0.12 | 150 | 26 |
| <img src="images/weapon/mint_frost_mine.png" width="32" height="32" alt=""> [薄荷冰雷](#weapon-mint_frost_mine) | 元素 | 地雷 | 蔬果/元素/爆破 | 16 / 27 / 42 / 64 | 2.6 / 2.4 / 2.2 / 1.9 | 220 | 26 |
| <img src="images/weapon/thunder_durian.png" width="32" height="32" alt=""> [雷霆榴莲](#weapon-thunder_durian) | 元素 | 爆炸弹 | 蔬果/元素/爆破 | 16 / 27 / 42 / 64 | 2.2 / 2.1 / 1.95 / 1.75 | 400 | 32 |
| <img src="images/weapon/dragonfruit_orb.png" width="32" height="32" alt=""> [火龙果法球](#weapon-dragonfruit_orb) | 元素 | 子弹 | 蔬果/元素 | 8 / 13 / 20 / 30 | 1 / 0.95 / 0.88 / 0.8 | 400 | 28 |
| <img src="images/weapon/star_anise_shuriken.png" width="32" height="32" alt=""> [八角飞镖](#weapon-star_anise_shuriken) | 元素 | 回旋镖 | 锋利/元素 | 9 / 15 / 23 / 35 | 1.3 / 1.2 / 1.1 / 1 | 320 | 28 |
| <img src="images/weapon/lemon_battery.png" width="32" height="32" alt=""> [柠檬电池](#weapon-lemon_battery) | 元素 | 连锁闪电 | 蔬果/元素 | 12 / 20 / 31 / 47 | 1.3 / 1.2 / 1.1 / 1 | 360 | 30 |

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
| 吸血概率 +N% | 1 | 2 | 3 | 5 |
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
| 标签 | 蔬果、爆破 |
| 伤害 T1~T4 | 30 / 50 / 80 / 120 |
| 冷却 T1~T4 | 2.2s / 2.1s / 2s / 1.8s |
| 射程 | 140 |
| 属性加成 | 近战伤害 ×1.5，最大生命 ×0.1 |
| 暴击倍率 | ×1.5 |
| 特效 | 爆炸半径 100，击退 40 |
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

<a id="weapon-spatula"></a>

### 锅铲

<img src="images/weapon/spatula.png" width="64" height="64" alt="">

> 轻快横扫，把敌人铲飞老远。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 横扫 |
| 标签 | 厨具 |
| 伤害 T1~T4 | 9 / 16 / 25 / 38 |
| 冷却 T1~T4 | 1.05s / 1s / 0.92s / 0.84s |
| 射程 | 115 |
| 属性加成 | 近战伤害 ×0.8 |
| 暴击倍率 | ×1.5 |
| 特效 | 击退 38 |
| T1 价格 | 16 |
| 初始携带 | - |

<a id="weapon-whisk_spin"></a>

### 旋风打蛋器

<img src="images/weapon/whisk_spin.png" width="64" height="64" alt="">

> 在身边高速搅拌，持续伤害并减速周围敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 光环 |
| 标签 | 厨具 |
| 伤害 T1~T4 | 3 / 5 / 8 / 12 |
| 冷却 T1~T4 | 0.45s / 0.45s / 0.42s / 0.4s |
| 射程 | 90 |
| 属性加成 | 近战伤害 ×0.4 |
| 暴击倍率 | ×1.5 |
| 特效 | 减速 20% 0.6s |
| T1 价格 | 22 |
| 初始携带 | - |

<a id="weapon-meat_tenderizer"></a>

### 松肉锤

<img src="images/weapon/meat_tenderizer.png" width="64" height="64" alt="">

> 沉重一锤，眩晕敌人 0.6 秒。受护甲加成。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 横扫 |
| 标签 | 厨具 |
| 伤害 T1~T4 | 22 / 36 / 56 / 84 |
| 冷却 T1~T4 | 1.9s / 1.8s / 1.7s / 1.55s |
| 射程 | 110 |
| 属性加成 | 近战伤害 ×1.3，护甲 ×0.5 |
| 暴击倍率 | ×1.5 |
| 特效 | 眩晕 0.6s，击退 25 |
| T1 价格 | 30 |
| 初始携带 | - |

<a id="weapon-skewer"></a>

### 烤串签

<img src="images/weapon/skewer.png" width="64" height="64" alt="">

> 长距离直刺，烤得敌人滋滋冒烟。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 直刺 |
| 标签 | 厨具、锋利 |
| 伤害 T1~T4 | 12 / 21 / 33 / 51 |
| 冷却 T1~T4 | 1.05s / 1s / 0.92s / 0.84s |
| 射程 | 185 |
| 属性加成 | 近战伤害 ×0.9 |
| 暴击倍率 | ×2 |
| 特效 | 灼烧 2/秒 2s |
| T1 价格 | 24 |
| 初始携带 | - |

<a id="weapon-ladle"></a>

### 汤勺

<img src="images/weapon/ladle.png" width="64" height="64" alt="">

> 舀一勺热汤横扫，命中额外提高吸血概率。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 横扫 |
| 标签 | 厨具、酱料 |
| 伤害 T1~T4 | 10 / 17 / 27 / 41 |
| 冷却 T1~T4 | 1.15s / 1.1s / 1.02s / 0.94s |
| 射程 | 120 |
| 属性加成 | 近战伤害 ×0.9，最大生命 ×0.05 |
| 暴击倍率 | ×1.5 |
| 特效 | 额外吸血概率 3%，击退 20 |
| T1 价格 | 20 |
| 初始携带 | - |

<a id="weapon-baguette_sword"></a>

### 法棍剑

<img src="images/weapon/baguette_sword.png" width="64" height="64" alt="">

> 超长法棍大范围横扫。受最大生命加成。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 横扫 |
| 标签 | 蔬果 |
| 伤害 T1~T4 | 11 / 19 / 30 / 46 |
| 冷却 T1~T4 | 1.3s / 1.22s / 1.14s / 1.04s |
| 射程 | 140 |
| 属性加成 | 近战伤害 ×1，最大生命 ×0.15 |
| 暴击倍率 | ×1.5 |
| 特效 | 击退 25 |
| T1 价格 | 22 |
| 初始携带 | - |

<a id="weapon-cucumber_katana"></a>

### 黄瓜武士刀

<img src="images/weapon/cucumber_katana.png" width="64" height="64" alt="">

> 清脆一斩，暴击率极高。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 直刺 |
| 标签 | 蔬果、锋利 |
| 伤害 T1~T4 | 9 / 15 / 24 / 36 |
| 冷却 T1~T4 | 0.8s / 0.75s / 0.69s / 0.62s |
| 射程 | 140 |
| 属性加成 | 近战伤害 ×0.9 |
| 暴击倍率 | ×2.5 |
| 特效 | 额外暴击 10% |
| T1 价格 | 24 |
| 初始携带 | - |

<a id="weapon-pizza_cutter"></a>

### 披萨滚刀

<img src="images/weapon/pizza_cutter.png" width="64" height="64" alt="">

> 甩出滚刀再收回，沿途切开一切。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 回旋镖 |
| 标签 | 厨具、锋利 |
| 伤害 T1~T4 | 9 / 15 / 24 / 36 |
| 冷却 T1~T4 | 1.3s / 1.2s / 1.1s / 1s |
| 射程 | 230 |
| 属性加成 | 近战伤害 ×0.8 |
| 暴击倍率 | ×2 |
| 特效 | - |
| T1 价格 | 26 |
| 初始携带 | - |

<a id="weapon-chopsticks"></a>

### 竹筷

<img src="images/weapon/chopsticks.png" width="64" height="64" alt="">

> 闪电般连戳，快准狠。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 直刺 |
| 标签 | 厨具 |
| 伤害 T1~T4 | 5 / 9 / 14 / 21 |
| 冷却 T1~T4 | 0.5s / 0.46s / 0.42s / 0.38s |
| 射程 | 155 |
| 属性加成 | 近战伤害 ×0.7 |
| 暴击倍率 | ×2 |
| 特效 | 额外暴击 5% |
| T1 价格 | 18 |
| 初始携带 | - |

<a id="weapon-bamboo_spear"></a>

### 竹笋长矛

<img src="images/weapon/bamboo_spear.png" width="64" height="64" alt="">

> 缓慢而有力的超远直刺。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 直刺 |
| 标签 | 蔬果 |
| 伤害 T1~T4 | 19 / 32 / 50 / 77 |
| 冷却 T1~T4 | 1.5s / 1.42s / 1.32s / 1.2s |
| 射程 | 200 |
| 属性加成 | 近战伤害 ×1.2 |
| 暴击倍率 | ×2 |
| 特效 | 击退 20 |
| T1 价格 | 28 |
| 初始携带 | - |

<a id="weapon-pineapple_mace"></a>

### 菠萝流星锤

<img src="images/weapon/pineapple_mace.png" width="64" height="64" alt="">

> 带刺的菠萝砸下，引发小范围爆炸。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 近战 / 横扫 |
| 标签 | 蔬果、爆破 |
| 伤害 T1~T4 | 20 / 34 / 53 / 80 |
| 冷却 T1~T4 | 1.8s / 1.7s / 1.6s / 1.45s |
| 射程 | 130 |
| 属性加成 | 近战伤害 ×1.3 |
| 暴击倍率 | ×1.5 |
| 特效 | 爆炸半径 75，击退 30 |
| T1 价格 | 32 |
| 初始携带 | - |

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
| 标签 | 枪械、元素、爆破 |
| 伤害 T1~T4 | 14 / 24 / 38 / 58 |
| 冷却 T1~T4 | 1.8s / 1.7s / 1.6s / 1.4s |
| 射程 | 450 |
| 属性加成 | 远程伤害 ×1，元素伤害 ×0.5 |
| 暴击倍率 | ×1.5 |
| 特效 | 灼烧 3/秒 2s，爆炸半径 90 |
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

> 扇形喷射番茄酱，命中额外提高吸血概率。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 子弹 |
| 标签 | 酱料 |
| 伤害 T1~T4 | 5 / 8 / 12 / 17 |
| 冷却 T1~T4 | 0.75s / 0.7s / 0.65s / 0.6s |
| 射程 | 280 |
| 属性加成 | 远程伤害 ×0.6 |
| 暴击倍率 | ×1.5 |
| 特效 | 额外吸血概率 5%，弹丸 3/3/4/5 |
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
| 特效 | 额外吸血概率 1% |
| T1 价格 | 40 |
| 初始携带 | [青椒机甲](CHARACTERS.md#char-bellpepper) |

<a id="weapon-olive_launcher"></a>

### 橄榄发射器

<img src="images/weapon/olive_launcher.png" width="64" height="64" alt="">

> 滑溜溜的橄榄可在敌人间多次弹射。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 子弹 |
| 标签 | 枪械、蔬果 |
| 伤害 T1~T4 | 6 / 10 / 15 / 23 |
| 冷却 T1~T4 | 0.8s / 0.75s / 0.7s / 0.62s |
| 射程 | 400 |
| 属性加成 | 远程伤害 ×0.8 |
| 暴击倍率 | ×1.5 |
| 特效 | 弹射 2/2/3/4 |
| T1 价格 | 22 |
| 初始携带 | - |

<a id="weapon-popcorn_machine"></a>

### 爆米花机

<img src="images/weapon/popcorn_machine.png" width="64" height="64" alt="">

> 撒出玉米粒，敌人靠近时砰地爆开。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 地雷 |
| 标签 | 枪械、爆破 |
| 伤害 T1~T4 | 14 / 24 / 37 / 56 |
| 冷却 T1~T4 | 2s / 1.9s / 1.75s / 1.6s |
| 射程 | 220 |
| 属性加成 | 远程伤害 ×0.9 |
| 暴击倍率 | ×1.5 |
| 特效 | 爆炸半径 75 |
| T1 价格 | 24 |
| 初始携带 | - |

<a id="weapon-grape_shotgun"></a>

### 葡萄霰弹枪

<img src="images/weapon/grape_shotgun.png" width="64" height="64" alt="">

> 近距离喷出一串葡萄，击退敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 子弹 |
| 标签 | 枪械、蔬果 |
| 伤害 T1~T4 | 4 / 7 / 10 / 15 |
| 冷却 T1~T4 | 1s / 0.95s / 0.88s / 0.8s |
| 射程 | 240 |
| 属性加成 | 远程伤害 ×0.5 |
| 暴击倍率 | ×1.5 |
| 特效 | 弹丸 5/5/6/7，击退 12 |
| T1 价格 | 26 |
| 初始携带 | - |

<a id="weapon-bean_bazooka"></a>

### 豆子火箭筒

<img src="images/weapon/bean_bazooka.png" width="64" height="64" alt="">

> 发射巨型豆荚，造成大范围爆炸。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 爆炸弹 |
| 标签 | 枪械、爆破 |
| 伤害 T1~T4 | 22 / 36 / 56 / 84 |
| 冷却 T1~T4 | 2.4s / 2.25s / 2.1s / 1.9s |
| 射程 | 480 |
| 属性加成 | 远程伤害 ×1.3 |
| 暴击倍率 | ×1.5 |
| 特效 | 爆炸半径 115，击退 30 |
| T1 价格 | 34 |
| 初始携带 | - |

<a id="weapon-cherry_bomb"></a>

### 樱桃炸弹

<img src="images/weapon/cherry_bomb.png" width="64" height="64" alt="">

> 一次抛出成对樱桃，各自爆炸。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 爆炸弹 |
| 标签 | 蔬果、爆破 |
| 伤害 T1~T4 | 10 / 17 / 26 / 40 |
| 冷却 T1~T4 | 1.6s / 1.5s / 1.4s / 1.3s |
| 射程 | 360 |
| 属性加成 | 远程伤害 ×0.8 |
| 暴击倍率 | ×1.5 |
| 特效 | 爆炸半径 70，弹丸 2/2/2/3 |
| T1 价格 | 28 |
| 初始携带 | - |

<a id="weapon-blueberry_sniper"></a>

### 蓝莓狙击枪

<img src="images/weapon/blueberry_sniper.png" width="64" height="64" alt="">

> 超远距离精准狙击，高暴击。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 子弹 |
| 标签 | 枪械、蔬果 |
| 伤害 T1~T4 | 26 / 44 / 68 / 100 |
| 冷却 T1~T4 | 1.9s / 1.8s / 1.65s / 1.5s |
| 射程 | 650 |
| 属性加成 | 远程伤害 ×1.5 |
| 暴击倍率 | ×2.5 |
| 特效 | 穿透 1/1/2/2，额外暴击 10% |
| T1 价格 | 32 |
| 初始携带 | - |

<a id="weapon-plate_frisbee"></a>

### 餐盘飞碟

<img src="images/weapon/plate_frisbee.png" width="64" height="64" alt="">

> 掷出餐盘，飞回时再撞一次。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 回旋镖 |
| 标签 | 厨具 |
| 伤害 T1~T4 | 12 / 20 / 31 / 47 |
| 冷却 T1~T4 | 1.5s / 1.4s / 1.3s / 1.2s |
| 射程 | 330 |
| 属性加成 | 远程伤害 ×1 |
| 暴击倍率 | ×1.5 |
| 特效 | 击退 15 |
| T1 价格 | 24 |
| 初始携带 | - |

<a id="weapon-seed_spitter"></a>

### 瓜子机枪

<img src="images/weapon/seed_spitter.png" width="64" height="64" alt="">

> 噗噗噗！高速连射西瓜籽。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 子弹 |
| 标签 | 枪械、蔬果 |
| 伤害 T1~T4 | 3 / 5 / 7 / 10 |
| 冷却 T1~T4 | 0.22s / 0.2s / 0.18s / 0.16s |
| 射程 | 360 |
| 属性加成 | 远程伤害 ×0.45 |
| 暴击倍率 | ×1.5 |
| 特效 | - |
| T1 价格 | 26 |
| 初始携带 | - |

<a id="weapon-carrot_crossbow"></a>

### 胡萝卜弩

<img src="images/weapon/carrot_crossbow.png" width="64" height="64" alt="">

> 尖尖的胡萝卜箭穿透一排敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 子弹 |
| 标签 | 蔬果 |
| 伤害 T1~T4 | 12 / 20 / 31 / 47 |
| 冷却 T1~T4 | 1.05s / 1s / 0.92s / 0.84s |
| 射程 | 460 |
| 属性加成 | 远程伤害 ×1 |
| 暴击倍率 | ×2 |
| 特效 | 穿透 2/3/3/4 |
| T1 价格 | 25 |
| 初始携带 | - |

<a id="weapon-honey_blaster"></a>

### 蜂蜜喷枪

<img src="images/weapon/honey_blaster.png" width="64" height="64" alt="">

> 黏糊糊的蜂蜜弹，减速敌人 35%。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 子弹 |
| 标签 | 酱料 |
| 伤害 T1~T4 | 6 / 10 / 15 / 22 |
| 冷却 T1~T4 | 0.7s / 0.66s / 0.6s / 0.54s |
| 射程 | 360 |
| 属性加成 | 远程伤害 ×0.7 |
| 暴击倍率 | ×1.5 |
| 特效 | 减速 35% 1.5s |
| T1 价格 | 22 |
| 初始携带 | - |

<a id="weapon-soy_pistol"></a>

### 酱油手枪

<img src="images/weapon/soy_pistol.png" width="64" height="64" alt="">

> 稳定的点射手枪，命中额外提高吸血概率。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 远程 / 子弹 |
| 标签 | 枪械、酱料 |
| 伤害 T1~T4 | 7 / 12 / 18 / 27 |
| 冷却 T1~T4 | 0.55s / 0.5s / 0.46s / 0.42s |
| 射程 | 380 |
| 属性加成 | 远程伤害 ×0.7 |
| 暴击倍率 | ×1.5 |
| 特效 | 额外吸血概率 2% |
| T1 价格 | 20 |
| 初始携带 | - |

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
| 标签 | 元素、爆破 |
| 伤害 T1~T4 | 20 / 34 / 52 / 80 |
| 冷却 T1~T4 | 2.5s / 2.3s / 2.1s / 1.8s |
| 射程 | 200 |
| 属性加成 | 元素伤害 ×1 |
| 暴击倍率 | ×1.5 |
| 特效 | 爆炸半径 115 |
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

<a id="weapon-ice_cube_tray"></a>

### 冰块格

<img src="images/weapon/ice_cube_tray.png" width="64" height="64" alt="">

> 甩出一排冰块，大幅减速敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 子弹 |
| 标签 | 厨具、元素 |
| 伤害 T1~T4 | 5 / 8 / 12 / 18 |
| 冷却 T1~T4 | 1s / 0.95s / 0.88s / 0.8s |
| 射程 | 340 |
| 属性加成 | 元素伤害 ×0.6 |
| 暴击倍率 | ×1.5 |
| 特效 | 减速 50% 1.2s，弹丸 3/3/4/4 |
| T1 价格 | 26 |
| 初始携带 | - |

<a id="weapon-lightning_whisk"></a>

### 闪电打蛋器

<img src="images/weapon/lightning_whisk.png" width="64" height="64" alt="">

> 搅出电流，在更多敌人间跳跃。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 连锁闪电 |
| 标签 | 厨具、元素 |
| 伤害 T1~T4 | 7 / 12 / 18 / 27 |
| 冷却 T1~T4 | 0.95s / 0.9s / 0.82s / 0.74s |
| 射程 | 380 |
| 属性加成 | 元素伤害 ×0.8 |
| 暴击倍率 | ×1.5 |
| 特效 | 连锁 3/4/5/7 次 |
| T1 价格 | 30 |
| 初始携带 | - |

<a id="weapon-steam_kettle"></a>

### 蒸汽水壶

<img src="images/weapon/steam_kettle.png" width="64" height="64" alt="">

> 喷出宽幅蒸汽，穿透并减速敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 喷火 |
| 标签 | 厨具、元素 |
| 伤害 T1~T4 | 3 / 5 / 7 / 11 |
| 冷却 T1~T4 | 0.26s / 0.24s / 0.21s / 0.18s |
| 射程 | 170 |
| 属性加成 | 元素伤害 ×0.3 |
| 暴击倍率 | ×1.5 |
| 特效 | 减速 20% 1s，击退 4 |
| T1 价格 | 28 |
| 初始携带 | - |

<a id="weapon-curry_aura"></a>

### 咖喱光环

<img src="images/weapon/curry_aura.png" width="64" height="64" alt="">

> 浓郁的咖喱香气灼烧周围敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 光环 |
| 标签 | 酱料、元素 |
| 伤害 T1~T4 | 3 / 5 / 7 / 11 |
| 冷却 T1~T4 | 0.5s / 0.5s / 0.5s / 0.5s |
| 射程 | 120 |
| 属性加成 | 元素伤害 ×0.4 |
| 暴击倍率 | ×1.5 |
| 特效 | 灼烧 2/秒 2s |
| T1 价格 | 32 |
| 初始携带 | - |

<a id="weapon-pepper_spray"></a>

### 胡椒喷雾

<img src="images/weapon/pepper_spray.png" width="64" height="64" alt="">

> 极近距离喷出辛辣粉末，强力灼烧。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 喷火 |
| 标签 | 元素 |
| 伤害 T1~T4 | 2 / 4 / 6 / 9 |
| 冷却 T1~T4 | 0.18s / 0.16s / 0.14s / 0.12s |
| 射程 | 150 |
| 属性加成 | 元素伤害 ×0.25 |
| 暴击倍率 | ×1.5 |
| 特效 | 灼烧 3/秒 1.5s |
| T1 价格 | 26 |
| 初始携带 | - |

<a id="weapon-mint_frost_mine"></a>

### 薄荷冰雷

<img src="images/weapon/mint_frost_mine.png" width="64" height="64" alt="">

> 清凉薄荷雷，爆炸冻得敌人走不动。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 地雷 |
| 标签 | 蔬果、元素、爆破 |
| 伤害 T1~T4 | 16 / 27 / 42 / 64 |
| 冷却 T1~T4 | 2.6s / 2.4s / 2.2s / 1.9s |
| 射程 | 220 |
| 属性加成 | 元素伤害 ×0.9 |
| 暴击倍率 | ×1.5 |
| 特效 | 减速 50% 2s，爆炸半径 125 |
| T1 价格 | 26 |
| 初始携带 | - |

<a id="weapon-thunder_durian"></a>

### 雷霆榴莲

<img src="images/weapon/thunder_durian.png" width="64" height="64" alt="">

> 扔出带电榴莲，爆炸并眩晕敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 爆炸弹 |
| 标签 | 蔬果、元素、爆破 |
| 伤害 T1~T4 | 16 / 27 / 42 / 64 |
| 冷却 T1~T4 | 2.2s / 2.1s / 1.95s / 1.75s |
| 射程 | 400 |
| 属性加成 | 元素伤害 ×1 |
| 暴击倍率 | ×1.5 |
| 特效 | 眩晕 0.35s，爆炸半径 100 |
| T1 价格 | 32 |
| 初始携带 | - |

<a id="weapon-dragonfruit_orb"></a>

### 火龙果法球

<img src="images/weapon/dragonfruit_orb.png" width="64" height="64" alt="">

> 燃烧的火龙果弹射并点燃敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 子弹 |
| 标签 | 蔬果、元素 |
| 伤害 T1~T4 | 8 / 13 / 20 / 30 |
| 冷却 T1~T4 | 1s / 0.95s / 0.88s / 0.8s |
| 射程 | 400 |
| 属性加成 | 元素伤害 ×0.8 |
| 暴击倍率 | ×1.5 |
| 特效 | 灼烧 3/秒 2s，弹射 1/2/2/3 |
| T1 价格 | 28 |
| 初始携带 | - |

<a id="weapon-star_anise_shuriken"></a>

### 八角飞镖

<img src="images/weapon/star_anise_shuriken.png" width="64" height="64" alt="">

> 香料飞镖回旋而归，灼烧沿途敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 回旋镖 |
| 标签 | 锋利、元素 |
| 伤害 T1~T4 | 9 / 15 / 23 / 35 |
| 冷却 T1~T4 | 1.3s / 1.2s / 1.1s / 1s |
| 射程 | 320 |
| 属性加成 | 元素伤害 ×0.8 |
| 暴击倍率 | ×2 |
| 特效 | 灼烧 2/秒 1.5s |
| T1 价格 | 28 |
| 初始携带 | - |

<a id="weapon-lemon_battery"></a>

### 柠檬电池

<img src="images/weapon/lemon_battery.png" width="64" height="64" alt="">

> 强力电击，跳跃较少但会眩晕敌人。

| 项目 | 数值 |
| --- | --- |
| 类别 / 方式 | 元素 / 连锁闪电 |
| 标签 | 蔬果、元素 |
| 伤害 T1~T4 | 12 / 20 / 31 / 47 |
| 冷却 T1~T4 | 1.3s / 1.2s / 1.1s / 1s |
| 射程 | 360 |
| 属性加成 | 元素伤害 ×1.1 |
| 暴击倍率 | ×1.5 |
| 特效 | 眩晕 0.25s，连锁 1/2/2/3 次 |
| T1 价格 | 30 |
| 初始携带 | - |

<a id="evolution"></a>

## 武器进化（12 把超武）

T4 武器 + 持有指定的经典道具时，在商店点开武器即可进化为超武：伤害、冷却、射程整体强化并获得专属效果，原有词条与打造等级保留，道具不会被消耗。超武不进商店池；持有可进化武器但还没有对应道具时，商店每次上架有 20% 概率直接出现该道具。

| 原武器 | 进化道具 | 超武 | T4 伤害 / 冷却 / 射程 | 说明 |
| --- | --- | --- | --- | --- |
| <img src="images/weapon/fork.png" width="32" height="32" alt=""> [番茄叉](#weapon-fork) | <img src="images/item/hot_sauce.png" width="32" height="32" alt=""> 辣酱包 | <img src="images/weapon/hell_trident.png" width="32" height="32" alt=""> **地狱三叉戟** | 34→**58** / 0.7s→**0.6s** / 150→**173** | 浸过辣酱的三叉戟，刺中即燃。 |
| <img src="images/weapon/rolling_pin.png" width="32" height="32" alt=""> [擀面杖](#weapon-rolling_pin) | <img src="images/item/iron_wok.png" width="32" height="32" alt=""> 铁锅盾 | <img src="images/weapon/titan_pin.png" width="32" height="32" alt=""> **擎天擀面柱** | 48→**82** / 1s→**0.85s** / 130→**176** | 铁锅做的配重，一扫震晕一片。 |
| <img src="images/weapon/knife.png" width="32" height="32" alt=""> [菜刀](#weapon-knife) | <img src="images/item/sharpener.png" width="32" height="32" alt=""> 磨刀石 | <img src="images/weapon/paoding_blade.png" width="32" height="32" alt=""> **庖丁神刀** | 25→**40** / 0.44s→**0.33s** / 130→**150** | 游刃有余，刀刀致命。 |
| <img src="images/weapon/cleaver.png" width="32" height="32" alt=""> [剁骨刀](#weapon-cleaver) | <img src="images/item/chef_knife_set.png" width="32" height="32" alt=""> 大厨刀具套装 | <img src="images/weapon/dragon_cleaver.png" width="32" height="32" alt=""> **屠龙菜刀** | 54→**103** / 0.9s→**0.77s** / 125→**163** | 整套刀具熔铸而成，劈开一切。 |
| <img src="images/weapon/pea_shooter.png" width="32" height="32" alt=""> [豌豆枪](#weapon-pea_shooter) | <img src="images/item/seed_bag.png" width="32" height="32" alt=""> 种子袋 | <img src="images/weapon/pea_gatling.png" width="32" height="32" alt=""> **豌豆加特林** | 13→**18** / 0.22s→**0.12s** / 400→**460** | 一整袋豌豆，扫射不停。 |
| <img src="images/weapon/ketchup.png" width="32" height="32" alt=""> [番茄酱瓶](#weapon-ketchup) | <img src="images/item/tomato_juice.png" width="32" height="32" alt=""> 番茄汁 | <img src="images/weapon/ketchup_flood.png" width="32" height="32" alt=""> **番茄酱洪流** | 17→**26** / 0.6s→**0.36s** / 280→**322** | 源源不断的番茄酱，淹没一切。 |
| <img src="images/weapon/chili_rocket.png" width="32" height="32" alt=""> [辣椒火箭](#weapon-chili_rocket) | <img src="images/item/fire_pepper.png" width="32" height="32" alt=""> 魔鬼椒 | <img src="images/weapon/devil_missile.png" width="32" height="32" alt=""> **魔鬼椒导弹** | 58→**104** / 1.4s→**1.19s** / 450→**518** | 辣度破表，爆炸范围翻倍。 |
| <img src="images/weapon/lightning_whisk.png" width="32" height="32" alt=""> [闪电打蛋器](#weapon-lightning_whisk) | <img src="images/item/tesla_coil.png" width="32" height="32" alt=""> 特斯拉线圈 | <img src="images/weapon/thor_whisk.png" width="32" height="32" alt=""> **雷神打蛋器** | 27→**46** / 0.74s→**0.63s** / 380→**437** | 特斯拉线圈加持，雷电在怪群里跳个不停。 |
| <img src="images/weapon/garlic_aura.png" width="32" height="32" alt=""> [大蒜光环](#weapon-garlic_aura) | <img src="images/item/vampire_cape.png" width="32" height="32" alt=""> 吸血鬼披风 | <img src="images/weapon/vampire_garlic.png" width="32" height="32" alt=""> **吸血鬼大蒜** | 13→**23** / 0.5s→**0.43s** / 110→**143** | 吸血鬼也爱上了大蒜：光环吸取生命。 |
| <img src="images/weapon/blueberry_sniper.png" width="32" height="32" alt=""> [蓝莓狙击枪](#weapon-blueberry_sniper) | <img src="images/item/railgun_core.png" width="32" height="32" alt=""> 电磁核心 | <img src="images/weapon/blueberry_railgun.png" width="32" height="32" alt=""> **蓝莓电磁炮** | 100→**200** / 1.5s→**1.2s** / 650→**910** | 电磁加速的蓝莓，贯穿整列敌人。 |
| <img src="images/weapon/corn_cannon.png" width="32" height="32" alt=""> [玉米加农](#weapon-corn_cannon) | <img src="images/item/golden_tomato.png" width="32" height="32" alt=""> 黄金番茄 | <img src="images/weapon/golden_corn.png" width="32" height="32" alt=""> **黄金爆米花炮** | 68→**116** / 0.84s→**0.71s** / 520→**598** | 金色爆米花四散炸开。 |
| <img src="images/weapon/star_anise_shuriken.png" width="32" height="32" alt=""> [八角飞镖](#weapon-star_anise_shuriken) | <img src="images/item/feather.png" width="32" height="32" alt=""> 羽毛 | <img src="images/weapon/anise_storm.png" width="32" height="32" alt=""> **八角风暴** | 35→**53** / 1s→**0.7s** / 320→**368** | 轻如羽毛的八角，弹来弹去停不下来。 |

---

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · **武器** · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · [成就](ACHIEVEMENTS.md) · [天赋](TALENTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

# 角色（33 名）

**中文** · [English](en/CHARACTERS.md)

[README](../README.md) · **角色** · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md)

> 由 `npm run docs` 从 `src/data/*.ts` 自动生成，请勿手改。

每名角色 = 属性修正 + 初始武器 + 被动特性 + 主动技能 + 独特外观。默认解锁 4 名，其余通过「通关章节 / 累计击杀 / 通关次数」解锁。

技能详情见 [技能](SKILLS.md)，武器详情见 [武器](WEAPONS.md)。

## 目录

- [角色一览](#overview)
- [角色详情](#details)
  - [番茄妹 · 全能少女](#char-tomato)
  - [胡萝卜骑士 · 近战坦克](#char-carrot)
  - [辣椒姐 · 火焰专家](#char-chili)
  - [玉米枪手 · 远程射手](#char-corn)
  - [西瓜胖墩 · 重装坦克](#char-watermelon)
  - [柠檬刺客 · 暴击刺客](#char-lemon)
  - [茄子法师 · 雷电法师](#char-eggplant)
  - [大蒜伯爵 · 吸血贵族](#char-garlic)
  - [蓝莓双子 · 武器大师](#char-blueberry)
  - [菠萝船长 · 商人海盗](#char-pineapple)
  - [南瓜幽灵 · 闪避大师](#char-pumpkin)
  - [草莓偶像 · 成长明星](#char-strawberry)
  - [生姜忍者 · 疾风忍者](#char-ginger)
  - [牛油果博士 · 炸弹专家](#char-avocado)
  - [洋葱大叔 · 催泪硬汉](#char-onion)
  - [蘑菇巫医 · 剧毒专家](#char-mushroom)
  - [椰子拳师 · 重拳格斗](#char-coconut)
  - [葡萄魔术师 · 幻术大师](#char-grape)
  - [樱桃双枪 · 连射枪手](#char-cherry)
  - [豌豆士兵 · 军团兵](#char-pea)
  - [蜜桃天使 · 治愈者](#char-peach)
  - [火龙果龙骑 · 烈焰骑士](#char-dragonfruit)
  - [甜菜狂战士 · 狂战士](#char-beet)
  - [芦笋弓手 · 精准射手](#char-asparagus)
  - [红薯厨神 · 美食家](#char-sweetpotato)
  - [猕猴桃侦探 · 弱点洞察](#char-kiwi)
  - [荔枝公主 · 幸运公主](#char-lychee)
  - [榴莲霸王 · 毒刺霸主](#char-durian)
  - [青椒机甲 · 机甲驾驶员](#char-bellpepper)
  - [冬瓜和尚 · 禅修武僧](#char-wintermelon)
  - [苦瓜冰法 · 寒冰法师](#char-bittermelon)
  - [豆芽学徒 · 潜力新星](#char-sprout)
  - [山葵爆破手 · 爆破狂人](#char-wasabi)

<a id="overview"></a>

## 角色一览

| 角色 | 定位 | 初始武器 | 技能 | 解锁条件 |
| --- | --- | --- | --- | --- |
| <img src="images/char/tomato.png" width="32" height="32" alt=""> [番茄妹](#char-tomato) | 全能少女 | [番茄叉](WEAPONS.md#weapon-fork) | [番茄酱爆](SKILLS.md#skill-tomato) （周身爆发） | 默认解锁 |
| <img src="images/char/carrot.png" width="32" height="32" alt=""> [胡萝卜骑士](#char-carrot) | 近战坦克 | [擀面杖](WEAPONS.md#weapon-rolling_pin) | [骑士冲锋](SKILLS.md#skill-carrot) （突进冲撞） | 默认解锁 |
| <img src="images/char/chili.png" width="32" height="32" alt=""> [辣椒姐](#char-chili) | 火焰专家 | [芥末喷枪](WEAPONS.md#weapon-mustard_flamer) | [烈焰新星](SKILLS.md#skill-chili) （周身爆发） | 默认解锁 |
| <img src="images/char/corn.png" width="32" height="32" alt=""> [玉米枪手](#char-corn) | 远程射手 | [玉米加农](WEAPONS.md#weapon-corn_cannon) | [爆米花弹幕](SKILLS.md#skill-corn) （环形弹幕） | 默认解锁 |
| <img src="images/char/watermelon.png" width="32" height="32" alt=""> [西瓜胖墩](#char-watermelon) | 重装坦克 | [西瓜锤](WEAPONS.md#weapon-watermelon_hammer) | [西瓜翻滚](SKILLS.md#skill-watermelon) （突进冲撞） | 通关第 1 章解锁 |
| <img src="images/char/lemon.png" width="32" height="32" alt=""> [柠檬刺客](#char-lemon) | 暴击刺客 | [菜刀](WEAPONS.md#weapon-knife) | [酸雾隐身](SKILLS.md#skill-lemon) （无敌潜行） | 累计击杀 1000 个敌人解锁 |
| <img src="images/char/eggplant.png" width="32" height="32" alt=""> [茄子法师](#char-eggplant) | 雷电法师 | [西兰花法杖](WEAPONS.md#weapon-broccoli_staff) | [紫雷天罚](SKILLS.md#skill-eggplant) （全屏攻击） | 通关第 1 章解锁 |
| <img src="images/char/garlic.png" width="32" height="32" alt=""> [大蒜伯爵](#char-garlic) | 吸血贵族 | [大蒜光环](WEAPONS.md#weapon-garlic_aura) | [血之领域](SKILLS.md#skill-garlic) （吸取回复） | 累计击杀 3000 个敌人解锁 |
| <img src="images/char/blueberry.png" width="32" height="32" alt=""> [蓝莓双子](#char-blueberry) | 武器大师 | [豌豆枪](WEAPONS.md#weapon-pea_shooter)、[菜刀](WEAPONS.md#weapon-knife) | [双子分身](SKILLS.md#skill-blueberry) （召唤分身） | 通关第 2 章解锁 |
| <img src="images/char/pineapple.png" width="32" height="32" alt=""> [菠萝船长](#char-pineapple) | 商人海盗 | [番茄弹弓](WEAPONS.md#weapon-slingshot) | [黄金炮击](SKILLS.md#skill-pineapple) （发射 AOE） | 任意角色通关 1 次解锁 |
| <img src="images/char/pumpkin.png" width="32" height="32" alt=""> [南瓜幽灵](#char-pumpkin) | 闪避大师 | [冰镇汽水](WEAPONS.md#weapon-soda) | [灵体化](SKILLS.md#skill-pumpkin) （无敌潜行） | 通关第 3 章解锁 |
| <img src="images/char/strawberry.png" width="32" height="32" alt=""> [草莓偶像](#char-strawberry) | 成长明星 | [番茄酱瓶](WEAPONS.md#weapon-ketchup) | [应援打 Call](SKILLS.md#skill-strawberry) （自身增益） | 通关第 2 章解锁 |
| <img src="images/char/ginger.png" width="32" height="32" alt=""> [生姜忍者](#char-ginger) | 疾风忍者 | [洋葱回旋镖](WEAPONS.md#weapon-onion_boomerang) | [瞬影斩](SKILLS.md#skill-ginger) （突进冲撞） | 累计击杀 6000 个敌人解锁 |
| <img src="images/char/avocado.png" width="32" height="32" alt=""> [牛油果博士](#char-avocado) | 炸弹专家 | [胡椒雷](WEAPONS.md#weapon-pepper_mine)、[辣椒火箭](WEAPONS.md#weapon-chili_rocket) | [核心过载](SKILLS.md#skill-avocado) （多点轰炸） | 通关第 4 章解锁 |
| <img src="images/char/onion.png" width="32" height="32" alt=""> [洋葱大叔](#char-onion) | 催泪硬汉 | [平底锅](WEAPONS.md#weapon-pan) | [催泪领域](SKILLS.md#skill-onion) （禁锢领域） | 通关第 5 章解锁 |
| <img src="images/char/mushroom.png" width="32" height="32" alt=""> [蘑菇巫医](#char-mushroom) | 剧毒专家 | [冰镇汽水](WEAPONS.md#weapon-soda) | [孢子云](SKILLS.md#skill-mushroom) （群体减益） | 累计击杀 500 个敌人解锁 |
| <img src="images/char/coconut.png" width="32" height="32" alt=""> [椰子拳师](#char-coconut) | 重拳格斗 | [平底锅](WEAPONS.md#weapon-pan) | [震地拳](SKILLS.md#skill-coconut) （周身爆发） | 通关第 1 章解锁 |
| <img src="images/char/grape.png" width="32" height="32" alt=""> [葡萄魔术师](#char-grape) | 幻术大师 | [番茄酱瓶](WEAPONS.md#weapon-ketchup) | [葡萄分身](SKILLS.md#skill-grape) （召唤分身） | 累计击杀 1500 个敌人解锁 |
| <img src="images/char/cherry.png" width="32" height="32" alt=""> [樱桃双枪](#char-cherry) | 连射枪手 | [豌豆枪](WEAPONS.md#weapon-pea_shooter) | [双枪连射](SKILLS.md#skill-cherry) （单体连发） | 通关第 1 章解锁 |
| <img src="images/char/pea.png" width="32" height="32" alt=""> [豌豆士兵](#char-pea) | 军团兵 | [豌豆枪](WEAPONS.md#weapon-pea_shooter)、[豌豆枪](WEAPONS.md#weapon-pea_shooter) | [豌豆炮台](SKILLS.md#skill-pea) （单体连发） | 通关 2 次解锁 |
| <img src="images/char/peach.png" width="32" height="32" alt=""> [蜜桃天使](#char-peach) | 治愈者 | [番茄弹弓](WEAPONS.md#weapon-slingshot) | [天使祝福](SKILLS.md#skill-peach) （吸取回复） | 通关第 2 章解锁 |
| <img src="images/char/dragonfruit.png" width="32" height="32" alt=""> [火龙果龙骑](#char-dragonfruit) | 烈焰骑士 | [擀面杖](WEAPONS.md#weapon-rolling_pin) | [龙焰冲锋](SKILLS.md#skill-dragonfruit) （突进冲撞） | 通关第 3 章解锁 |
| <img src="images/char/beet.png" width="32" height="32" alt=""> [甜菜狂战士](#char-beet) | 狂战士 | [剁骨刀](WEAPONS.md#weapon-cleaver) | [狂暴](SKILLS.md#skill-beet) （自身增益） | 累计击杀 4000 个敌人解锁 |
| <img src="images/char/asparagus.png" width="32" height="32" alt=""> [芦笋弓手](#char-asparagus) | 精准射手 | [玉米加农](WEAPONS.md#weapon-corn_cannon) | [穿心箭](SKILLS.md#skill-asparagus) （单体连发） | 通关第 2 章解锁 |
| <img src="images/char/sweetpotato.png" width="32" height="32" alt=""> [红薯厨神](#char-sweetpotato) | 美食家 | [擀面杖](WEAPONS.md#weapon-rolling_pin) | [烤红薯盛宴](SKILLS.md#skill-sweetpotato) （吸取回复） | 任意角色通关 1 次解锁 |
| <img src="images/char/kiwi.png" width="32" height="32" alt=""> [猕猴桃侦探](#char-kiwi) | 弱点洞察 | [菜刀](WEAPONS.md#weapon-knife) | [真相只有一个](SKILLS.md#skill-kiwi) （群体减益） | 累计击杀 2000 个敌人解锁 |
| <img src="images/char/lychee.png" width="32" height="32" alt=""> [荔枝公主](#char-lychee) | 幸运公主 | [番茄弹弓](WEAPONS.md#weapon-slingshot) | [公主的好运](SKILLS.md#skill-lychee) （自身增益） | 通关第 3 章解锁 |
| <img src="images/char/durian.png" width="32" height="32" alt=""> [榴莲霸王](#char-durian) | 毒刺霸主 | [大蒜光环](WEAPONS.md#weapon-garlic_aura) | [臭气熏天](SKILLS.md#skill-durian) （群体减益） | 通关第 4 章解锁 |
| <img src="images/char/bellpepper.png" width="32" height="32" alt=""> [青椒机甲](#char-bellpepper) | 机甲驾驶员 | [酱料加特林](WEAPONS.md#weapon-sauce_gatling) | [无人机支援](SKILLS.md#skill-bellpepper) （召唤分身） | 通关第 4 章解锁 |
| <img src="images/char/wintermelon.png" width="32" height="32" alt=""> [冬瓜和尚](#char-wintermelon) | 禅修武僧 | [擀面杖](WEAPONS.md#weapon-rolling_pin) | [金钟罩](SKILLS.md#skill-wintermelon) （无敌潜行） | 累计击杀 8000 个敌人解锁 |
| <img src="images/char/bittermelon.png" width="32" height="32" alt=""> [苦瓜冰法](#char-bittermelon) | 寒冰法师 | [冰镇汽水](WEAPONS.md#weapon-soda) | [冰封领域](SKILLS.md#skill-bittermelon) （禁锢领域） | 通关第 3 章解锁 |
| <img src="images/char/sprout.png" width="32" height="32" alt=""> [豆芽学徒](#char-sprout) | 潜力新星 | [番茄叉](WEAPONS.md#weapon-fork) | [拔苗助长](SKILLS.md#skill-sprout) （自身增益） | 通关 3 次解锁 |
| <img src="images/char/wasabi.png" width="32" height="32" alt=""> [山葵爆破手](#char-wasabi) | 爆破狂人 | [辣椒火箭](WEAPONS.md#weapon-chili_rocket) | [冲鼻核弹](SKILLS.md#skill-wasabi) （发射 AOE） | 通关第 5 章解锁 |

<a id="details"></a>

## 角色详情

<a id="char-tomato"></a>

### 番茄妹 · 全能少女

<img src="images/char/tomato.png" width="96" height="96" alt="">

> 番茄酱小镇的守护者，各项能力均衡，适合新手。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +5% 伤害；+1 生命再生 |
| 属性修正 | +1 生命再生，+5% 伤害 |
| 初始武器 | [番茄叉](WEAPONS.md#weapon-fork) |
| 主动技能 | [番茄酱爆](SKILLS.md#skill-tomato)【周身爆发】冷却 26s — 炸开番茄酱，造成伤害并减速敌人。 |
| 解锁条件 | 默认解锁 |

<a id="char-carrot"></a>

### 胡萝卜骑士 · 近战坦克

<img src="images/char/carrot.png" width="96" height="96" alt="">

> 身披银甲的骑士，擅长近身肉搏。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +3 护甲；+3 近战伤害；远程伤害 -50% |
| 属性修正 | +5 最大生命，+3 近战伤害，+3 护甲，远程伤害 ×0.5 |
| 初始武器 | [擀面杖](WEAPONS.md#weapon-rolling_pin) |
| 主动技能 | [骑士冲锋](SKILLS.md#skill-carrot)【突进冲撞】冷却 16s — 无敌冲锋，撞晕沿途敌人。 |
| 解锁条件 | 默认解锁 |

<a id="char-chili"></a>

### 辣椒姐 · 火焰专家

<img src="images/char/chili.png" width="96" height="96" alt="">

> 脾气火爆，所到之处烈焰滚滚。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +3 元素伤害；-2 最大生命；所有命中 25% 概率灼烧 |
| 属性修正 | -2 最大生命，+3 元素伤害 |
| 初始武器 | [芥末喷枪](WEAPONS.md#weapon-mustard_flamer) |
| 主动技能 | [烈焰新星](SKILLS.md#skill-chili)【周身爆发】冷却 31s — 火焰冲击波，叠加 3 层灼烧。 |
| 解锁条件 | 默认解锁 |

<a id="char-corn"></a>

### 玉米枪手 · 远程射手

<img src="images/char/corn.png" width="96" height="96" alt="">

> 西部神枪手，用玉米粒击穿一切。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +3 远程伤害；+50 射程；+3 最大生命；近战伤害 -50% |
| 属性修正 | +3 最大生命，+3 远程伤害，+50 射程，近战伤害 ×0.5 |
| 初始武器 | [玉米加农](WEAPONS.md#weapon-corn_cannon) |
| 主动技能 | [爆米花弹幕](SKILLS.md#skill-corn)【环形弹幕】冷却 12s — 向四周发射 18 发爆米花。 |
| 解锁条件 | 默认解锁 |

<a id="char-watermelon"></a>

### 西瓜胖墩 · 重装坦克

<img src="images/char/watermelon.png" width="96" height="96" alt="">

> 圆滚滚的大块头，皮糙肉厚。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +25 最大生命；+2 护甲；-12% 移速；-10% 攻速 |
| 属性修正 | +25 最大生命，-10% 攻击速度，+2 护甲，-12% 移动速度 |
| 初始武器 | [西瓜锤](WEAPONS.md#weapon-watermelon_hammer) |
| 主动技能 | [西瓜翻滚](SKILLS.md#skill-watermelon)【突进冲撞】冷却 16s — 翻滚冲撞并回复 10% 生命。 |
| 解锁条件 | 通关第 1 章解锁 |

<a id="char-lemon"></a>

### 柠檬刺客 · 暴击刺客

<img src="images/char/lemon.png" width="96" height="96" alt="">

> 酸溜溜的刺客，一击致命。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +20% 暴击；+10% 闪避；-4 最大生命 |
| 属性修正 | -4 最大生命，+20% 暴击率，+10% 闪避，+5% 移动速度 |
| 初始武器 | [菜刀](WEAPONS.md#weapon-knife) |
| 主动技能 | [酸雾隐身](SKILLS.md#skill-lemon)【无敌潜行】冷却 18s — 隐身 3 秒（无敌），暴击 +50%。 |
| 解锁条件 | 累计击杀 1000 个敌人解锁 |

<a id="char-eggplant"></a>

### 茄子法师 · 雷电法师

<img src="images/char/eggplant.png" width="96" height="96" alt="">

> 紫袍法师，召唤天雷惩戒害虫。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +4 元素伤害；+10 幸运；+3 最大生命；近战伤害 -70% |
| 属性修正 | +3 最大生命，+4 元素伤害，+10 幸运，近战伤害 ×0.3 |
| 初始武器 | [西兰花法杖](WEAPONS.md#weapon-broccoli_staff) |
| 主动技能 | [紫雷天罚](SKILLS.md#skill-eggplant)【全屏攻击】冷却 21s — 天雷覆盖全屏，劈中所有敌人并短暂眩晕。 |
| 解锁条件 | 通关第 1 章解锁 |

<a id="char-garlic"></a>

### 大蒜伯爵 · 吸血贵族

<img src="images/char/garlic.png" width="96" height="96" alt="">

> 古老的吸血鬼……却是大蒜做的。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +10% 吸血；-3 生命再生；+5% 伤害 |
| 属性修正 | -3 生命再生，+10% 吸血，+5% 伤害 |
| 初始武器 | [大蒜光环](WEAPONS.md#weapon-garlic_aura) |
| 主动技能 | [血之领域](SKILLS.md#skill-garlic)【吸取回复】冷却 21s — 吸取周围敌人生命，施加流血。 |
| 解锁条件 | 累计击杀 3000 个敌人解锁 |

<a id="char-blueberry"></a>

### 蓝莓双子 · 武器大师

<img src="images/char/blueberry.png" width="96" height="96" alt="">

> 形影不离的双胞胎，可以携带更多武器。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | 武器栏 8 格；-10% 伤害 |
| 属性修正 | -10% 伤害，武器栏 8 |
| 初始武器 | [豌豆枪](WEAPONS.md#weapon-pea_shooter)、[菜刀](WEAPONS.md#weapon-knife) |
| 主动技能 | [双子分身](SKILLS.md#skill-blueberry)【召唤分身】冷却 16s — 召唤分身 8 秒自动射击。 |
| 解锁条件 | 通关第 2 章解锁 |

<a id="char-pineapple"></a>

### 菠萝船长 · 商人海盗

<img src="images/char/pineapple.png" width="96" height="96" alt="">

> 精明的海盗船长，擅长讨价还价。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | 商店价格 -15%；+20 幸运；+10 收获 |
| 属性修正 | -3 最大生命，+20 幸运，+10 收获，商店折扣 15% |
| 初始武器 | [番茄弹弓](WEAPONS.md#weapon-slingshot) |
| 主动技能 | [黄金炮击](SKILLS.md#skill-pineapple)【发射 AOE】冷却 24s — 向敌群最密集处发射黄金炮弹，大范围爆炸，击杀必掉番茄籽。 |
| 解锁条件 | 任意角色通关 1 次解锁 |

<a id="char-pumpkin"></a>

### 南瓜幽灵 · 闪避大师

<img src="images/char/pumpkin.png" width="96" height="96" alt="">

> 万圣节的小幽灵，总是飘来飘去。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +25% 闪避；闪避上限 75%；-4 最大生命 |
| 属性修正 | -4 最大生命，+25% 闪避，+8% 移动速度，闪避上限 75% |
| 初始武器 | [冰镇汽水](WEAPONS.md#weapon-soda) |
| 主动技能 | [灵体化](SKILLS.md#skill-pumpkin)【无敌潜行】冷却 17s — 无敌 2.5 秒并大幅加速。 |
| 解锁条件 | 通关第 3 章解锁 |

<a id="char-strawberry"></a>

### 草莓偶像 · 成长明星

<img src="images/char/strawberry.png" width="96" height="96" alt="">

> 人气偶像，成长速度惊人。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +40% 经验获取；升级时 5 个选项 |
| 属性修正 | -3 最大生命，+40% 经验获取，升级选项 5 个 |
| 初始武器 | [番茄酱瓶](WEAPONS.md#weapon-ketchup) |
| 主动技能 | [应援打 Call](SKILLS.md#skill-strawberry)【自身增益】冷却 20s — 6 秒内急速 3 层 + 怒气 5 层。 |
| 解锁条件 | 通关第 2 章解锁 |

<a id="char-ginger"></a>

### 生姜忍者 · 疾风忍者

<img src="images/char/ginger.png" width="96" height="96" alt="">

> 来无影去无踪的生姜忍者。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +20% 移速；+15% 攻速；-1 护甲 |
| 属性修正 | +15% 攻击速度，-1 护甲，+20% 移动速度 |
| 初始武器 | [洋葱回旋镖](WEAPONS.md#weapon-onion_boomerang) |
| 主动技能 | [瞬影斩](SKILLS.md#skill-ginger)【突进冲撞】冷却 17s — 突进斩击，施加流血。 |
| 解锁条件 | 累计击杀 6000 个敌人解锁 |

<a id="char-avocado"></a>

### 牛油果博士 · 炸弹专家

<img src="images/char/avocado.png" width="96" height="96" alt="">

> 疯狂科学家，热衷于爆炸实验。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +2 元素伤害；+5% 伤害；击杀 15% 概率爆炸 |
| 属性修正 | +5% 伤害，+2 元素伤害，+30 射程 |
| 初始武器 | [胡椒雷](WEAPONS.md#weapon-pepper_mine)、[辣椒火箭](WEAPONS.md#weapon-chili_rocket) |
| 主动技能 | [核心过载](SKILLS.md#skill-avocado)【多点轰炸】冷却 17s — 连环爆炸 5 次。 |
| 解锁条件 | 通关第 4 章解锁 |

<a id="char-onion"></a>

### 洋葱大叔 · 催泪硬汉

<img src="images/char/onion.png" width="96" height="96" alt="">

> 层层叠叠的硬汉，让敌人泪流满面。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +4 护甲；+10 最大生命；受击时反弹 15 点伤害 |
| 属性修正 | +10 最大生命，+2 生命再生，+4 护甲，-5% 移动速度 |
| 初始武器 | [平底锅](WEAPONS.md#weapon-pan) |
| 主动技能 | [催泪领域](SKILLS.md#skill-onion)【禁锢领域】冷却 18s — 释放 5 秒催泪瓦斯区域，区域内敌人大幅减速并致盲。 |
| 解锁条件 | 通关第 5 章解锁 |

<a id="char-mushroom"></a>

### 蘑菇巫医 · 剧毒专家

<img src="images/char/mushroom.png" width="96" height="96" alt="">

> 森林深处的巫医，擅长用孢子毒倒敌人。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +2 元素伤害；所有命中 30% 概率中毒 |
| 属性修正 | +2 元素伤害，+5 幸运 |
| 初始武器 | [冰镇汽水](WEAPONS.md#weapon-soda) |
| 主动技能 | [孢子云](SKILLS.md#skill-mushroom)【群体减益】冷却 29s — 对大范围内敌人施加 5 层中毒与 2 层虚弱。 |
| 解锁条件 | 累计击杀 500 个敌人解锁 |

<a id="char-coconut"></a>

### 椰子拳师 · 重拳格斗

<img src="images/char/coconut.png" width="96" height="96" alt="">

> 坚硬外壳下是一颗火热的格斗之心。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +4 近战伤害；+2 护甲；+5 最大生命；击杀叠加怒气（每层 +4% 伤害） |
| 属性修正 | +5 最大生命，+4 近战伤害，+2 护甲，元素伤害 ×0.5 |
| 初始武器 | [平底锅](WEAPONS.md#weapon-pan) |
| 主动技能 | [震地拳](SKILLS.md#skill-coconut)【周身爆发】冷却 33s — 重击地面，眩晕并破甲。 |
| 解锁条件 | 通关第 1 章解锁 |

<a id="char-grape"></a>

### 葡萄魔术师 · 幻术大师

<img src="images/char/grape.png" width="96" height="96" alt="">

> 一串葡萄组成的魔术师，真真假假难以分辨。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +10 幸运；+3 最大生命；受到攻击 20% 概率使敌人混乱 |
| 属性修正 | +3 最大生命，+1 远程伤害，+1 元素伤害，+10 幸运 |
| 初始武器 | [番茄酱瓶](WEAPONS.md#weapon-ketchup) |
| 主动技能 | [葡萄分身](SKILLS.md#skill-grape)【召唤分身】冷却 16s — 召唤分身 8 秒自动射击。 |
| 解锁条件 | 累计击杀 1500 个敌人解锁 |

<a id="char-cherry"></a>

### 樱桃双枪 · 连射枪手

<img src="images/char/cherry.png" width="96" height="96" alt="">

> 一根梗上的两颗樱桃，枪法快如闪电。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +20% 攻速；-8% 伤害；射击时 10% 概率获得急速 |
| 属性修正 | -8% 伤害，+1 远程伤害，+20% 攻击速度 |
| 初始武器 | [豌豆枪](WEAPONS.md#weapon-pea_shooter) |
| 主动技能 | [双枪连射](SKILLS.md#skill-cherry)【单体连发】冷却 17s — 对最近的敌人连续射出 12 发子弹。 |
| 解锁条件 | 通关第 1 章解锁 |

<a id="char-pea"></a>

### 豌豆士兵 · 军团兵

<img src="images/char/pea.png" width="96" height="96" alt="">

> 豆荚里走出的小兵，人多力量大。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +2 远程伤害；初始 2 把豌豆枪；每把同名武器 +3% 伤害 |
| 属性修正 | +3 最大生命，+2 远程伤害 |
| 初始武器 | [豌豆枪](WEAPONS.md#weapon-pea_shooter)、[豌豆枪](WEAPONS.md#weapon-pea_shooter) |
| 主动技能 | [豌豆炮台](SKILLS.md#skill-pea)【单体连发】冷却 16s — 对最近的敌人高速连发 16 颗豌豆。 |
| 解锁条件 | 通关 2 次解锁 |

<a id="char-peach"></a>

### 蜜桃天使 · 治愈者

<img src="images/char/peach.png" width="96" height="96" alt="">

> 温柔的天使，守护着每一个伙伴。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +5 生命再生；每波开始获得 15 点护盾；-10% 伤害 |
| 属性修正 | +5 最大生命，+5 生命再生，-10% 伤害 |
| 初始武器 | [番茄弹弓](WEAPONS.md#weapon-slingshot) |
| 主动技能 | [天使祝福](SKILLS.md#skill-peach)【吸取回复】冷却 23s — 回复 20% 生命，无敌 1.5 秒。 |
| 解锁条件 | 通关第 2 章解锁 |

<a id="char-dragonfruit"></a>

### 火龙果龙骑 · 烈焰骑士

<img src="images/char/dragonfruit.png" width="96" height="96" alt="">

> 拥有龙之血脉的骑士，冲锋时烈焰相随。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +2 近战/元素伤害；+5 最大生命；近战命中 20% 概率灼烧 |
| 属性修正 | +5 最大生命，+2 近战伤害，+2 元素伤害，+5% 移动速度 |
| 初始武器 | [擀面杖](WEAPONS.md#weapon-rolling_pin) |
| 主动技能 | [龙焰冲锋](SKILLS.md#skill-dragonfruit)【突进冲撞】冷却 18s — 冲锋并在路径上叠加 4 层灼烧。 |
| 解锁条件 | 通关第 3 章解锁 |

<a id="char-beet"></a>

### 甜菜狂战士 · 狂战士

<img src="images/char/beet.png" width="96" height="96" alt="">

> 血红的甜菜，越战越勇。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +15% 伤害；+3% 吸血；-1 护甲；受伤时获得怒气 |
| 属性修正 | +3% 吸血，+15% 伤害，-1 护甲 |
| 初始武器 | [剁骨刀](WEAPONS.md#weapon-cleaver) |
| 主动技能 | [狂暴](SKILLS.md#skill-beet)【自身增益】冷却 21s — 6 秒暴怒（移速、伤害 +30%）与嗜血。 |
| 解锁条件 | 累计击杀 4000 个敌人解锁 |

<a id="char-asparagus"></a>

### 芦笋弓手 · 精准射手

<img src="images/char/asparagus.png" width="96" height="96" alt="">

> 修长的芦笋，百步穿杨。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +80 射程；+10% 暴击；命中 15% 概率标记敌人（下次必暴击） |
| 属性修正 | +1 远程伤害，+10% 暴击率，+80 射程，近战伤害 ×0.6 |
| 初始武器 | [玉米加农](WEAPONS.md#weapon-corn_cannon) |
| 主动技能 | [穿心箭](SKILLS.md#skill-asparagus)【单体连发】冷却 19s — 向生命最高的敌人连射 8 支穿透箭，并标记目标。 |
| 解锁条件 | 通关第 2 章解锁 |

<a id="char-sweetpotato"></a>

### 红薯厨神 · 美食家

<img src="images/char/sweetpotato.png" width="96" height="96" alt="">

> 烤红薯的香味让人精神百倍。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +20 收获；果实回血翻倍；-5% 伤害 |
| 属性修正 | +5 最大生命，-5% 伤害，+20 收获 |
| 初始武器 | [擀面杖](WEAPONS.md#weapon-rolling_pin) |
| 主动技能 | [烤红薯盛宴](SKILLS.md#skill-sweetpotato)【吸取回复】冷却 28s — 回复 20% 生命，获得 5 层再生。 |
| 解锁条件 | 任意角色通关 1 次解锁 |

<a id="char-kiwi"></a>

### 猕猴桃侦探 · 弱点洞察

<img src="images/char/kiwi.png" width="96" height="96" alt="">

> 毛茸茸的侦探，一眼看穿敌人弱点。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +8% 暴击；+3 最大生命；+1 近战伤害；命中 20% 概率易伤；暴击伤害 +30% |
| 属性修正 | +3 最大生命，+1 近战伤害，+8% 暴击率，+10 幸运 |
| 初始武器 | [菜刀](WEAPONS.md#weapon-knife) |
| 主动技能 | [真相只有一个](SKILLS.md#skill-kiwi)【群体减益】冷却 24s — 看穿全屏敌人：施加标记与 2 层易伤。 |
| 解锁条件 | 累计击杀 2000 个敌人解锁 |

<a id="char-lychee"></a>

### 荔枝公主 · 幸运公主

<img src="images/char/lychee.png" width="96" height="96" alt="">

> 剥开红色外壳，是晶莹剔透的公主。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +40 幸运；宝箱掉率翻倍 |
| 属性修正 | +40 幸运 |
| 初始武器 | [番茄弹弓](WEAPONS.md#weapon-slingshot) |
| 主动技能 | [公主的好运](SKILLS.md#skill-lychee)【自身增益】冷却 16s — 6 秒好运 5 层 + 专注 3 层。 |
| 解锁条件 | 通关第 3 章解锁 |

<a id="char-durian"></a>

### 榴莲霸王 · 毒刺霸主

<img src="images/char/durian.png" width="96" height="96" alt="">

> 浑身是刺，臭名远扬，谁敢靠近？

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +3 护甲；+10 最大生命；-4% 移速；反弹 10 伤害；周围敌人持续虚弱 |
| 属性修正 | +10 最大生命，+3 护甲，-4% 移动速度 |
| 初始武器 | [大蒜光环](WEAPONS.md#weapon-garlic_aura) |
| 主动技能 | [臭气熏天](SKILLS.md#skill-durian)【群体减益】冷却 32s — 对周围敌人施加中毒、3 层虚弱与混乱。 |
| 解锁条件 | 通关第 4 章解锁 |

<a id="char-bellpepper"></a>

### 青椒机甲 · 机甲驾驶员

<img src="images/char/bellpepper.png" width="96" height="96" alt="">

> 驾驶着改装青椒机甲的少年。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +5 护甲；+10 生命；-10% 闪避；每 12 秒获得 20 点护盾 |
| 属性修正 | +10 最大生命，+5 护甲，-10% 闪避，-10% 移动速度 |
| 初始武器 | [酱料加特林](WEAPONS.md#weapon-sauce_gatling) |
| 主动技能 | [无人机支援](SKILLS.md#skill-bellpepper)【召唤分身】冷却 16s — 部署无人机 8 秒。 |
| 解锁条件 | 通关第 4 章解锁 |

<a id="char-wintermelon"></a>

### 冬瓜和尚 · 禅修武僧

<img src="images/char/wintermelon.png" width="96" height="96" alt="">

> 心如止水的武僧，以静制动。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +15% 闪避；+3 再生；闪避成功时获得专注 |
| 属性修正 | +3 生命再生，+15% 闪避，+5% 移动速度，远程伤害 ×0.7 |
| 初始武器 | [擀面杖](WEAPONS.md#weapon-rolling_pin) |
| 主动技能 | [金钟罩](SKILLS.md#skill-wintermelon)【无敌潜行】冷却 24s — 冥想 2 秒无敌，获得 5 层坚韧。 |
| 解锁条件 | 累计击杀 8000 个敌人解锁 |

<a id="char-bittermelon"></a>

### 苦瓜冰法 · 寒冰法师

<img src="images/char/bittermelon.png" width="96" height="96" alt="">

> 外表苦涩的冰系法师，冻结一切。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +3 元素伤害；+3 最大生命；命中 8% 概率冰冻敌人 1 秒 |
| 属性修正 | +3 最大生命，+3 元素伤害，+5% 攻击速度 |
| 初始武器 | [冰镇汽水](WEAPONS.md#weapon-soda) |
| 主动技能 | [冰封领域](SKILLS.md#skill-bittermelon)【禁锢领域】冷却 25s — 在身边展开 5 秒冰封领域，敌人进入后减速并被冻结。 |
| 解锁条件 | 通关第 3 章解锁 |

<a id="char-sprout"></a>

### 豆芽学徒 · 潜力新星

<img src="images/char/sprout.png" width="96" height="96" alt="">

> 小小的豆芽，却有无限可能。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +80% 经验获取；-8% 伤害；-3 最大生命；升级时 5 个选项 |
| 属性修正 | -3 最大生命，-8% 伤害，+80% 经验获取，升级选项 5 个 |
| 初始武器 | [番茄叉](WEAPONS.md#weapon-fork) |
| 主动技能 | [拔苗助长](SKILLS.md#skill-sprout)【自身增益】冷却 16s — 获得 12 点经验与 5 秒急速。 |
| 解锁条件 | 通关 3 次解锁 |

<a id="char-wasabi"></a>

### 山葵爆破手 · 爆破狂人

<img src="images/char/wasabi.png" width="96" height="96" alt="">

> 一点就炸的山葵，冲鼻又致命。

| 项目 | 内容 |
| --- | --- |
| 被动特性 | +8% 伤害；击杀 25% 概率爆炸；爆炸施加灼烧 |
| 属性修正 | -5 最大生命，+8% 伤害，+2 元素伤害 |
| 初始武器 | [辣椒火箭](WEAPONS.md#weapon-chili_rocket) |
| 主动技能 | [冲鼻核弹](SKILLS.md#skill-wasabi)【发射 AOE】冷却 36s — 向敌群发射山葵核弹，超大范围爆炸并灼烧。 |
| 解锁条件 | 通关第 5 章解锁 |

---

[README](../README.md) · **角色** · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md)

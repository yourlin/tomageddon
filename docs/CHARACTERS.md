# 角色（39 名）

**中文** · [English](en/CHARACTERS.md)

[README](../README.md) · **角色** · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · [成就](ACHIEVEMENTS.md) · [天赋](TALENTS.md) · [遗物](RELICS.md) · [危机](DANGER.md) · [任务](QUESTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

> 由 `npm run docs` 从 `src/data/*.ts` 自动生成，请勿手改。

每名角色 = 属性修正 + 初始武器 + 被动特性 + 主动技能 + 独特外观。默认解锁 4 名，其余每名都绑定一项[成就](ACHIEVEMENTS.md)，达成后自动解锁。

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
  - [黄豆军师 · 召唤统领](#char-soybean)
  - [菠萝蜜卫士 · 荆棘反伤](#char-jackfruit)
  - [石榴炮手 · 弹幕狂潮](#char-pomegranate)
  - [芋头术士 · 一心一器](#char-taro)
  - [卷心菜老兵 · 不屈老兵](#char-cabbage)
  - [黑莓女巫 · 诅咒术士](#char-blackberry)

<a id="overview"></a>

## 角色一览

| 角色 | 定位 | 天赋 | 初始武器 | 技能 | 解锁条件 |
| --- | --- | --- | --- | --- | --- |
| <img src="images/char/tomato.png" width="32" height="32" alt=""> [番茄妹](#char-tomato) | 全能少女 | 番茄之心 | [番茄叉](WEAPONS.md#weapon-fork) | [番茄酱爆](SKILLS.md#skill-tomato) （周身爆发） | 默认解锁 |
| <img src="images/char/carrot.png" width="32" height="32" alt=""> [胡萝卜骑士](#char-carrot) | 近战坦克 | 骑士之盾 | [擀面杖](WEAPONS.md#weapon-rolling_pin) | [骑士冲锋](SKILLS.md#skill-carrot) （突进冲撞） | 默认解锁 |
| <img src="images/char/chili.png" width="32" height="32" alt=""> [辣椒姐](#char-chili) | 火焰专家 | 火上浇油 | [芥末喷枪](WEAPONS.md#weapon-mustard_flamer) | [烈焰新星](SKILLS.md#skill-chili) （周身爆发） | 默认解锁 |
| <img src="images/char/corn.png" width="32" height="32" alt=""> [玉米枪手](#char-corn) | 远程射手 | 远程压制 | [玉米加农](WEAPONS.md#weapon-corn_cannon) | [爆米花弹幕](SKILLS.md#skill-corn) （环形弹幕） | 默认解锁 |
| <img src="images/char/watermelon.png" width="32" height="32" alt=""> [西瓜胖墩](#char-watermelon) | 重装坦克 | 皮糙肉厚 | [西瓜锤](WEAPONS.md#weapon-watermelon_hammer) | [西瓜翻滚](SKILLS.md#skill-watermelon) （突进冲撞） | 达成成就 [水果补给（银）](ACHIEVEMENTS.md#ach-fruits)：累计吃到 50 个果实 |
| <img src="images/char/lemon.png" width="32" height="32" alt=""> [柠檬刺客](#char-lemon) | 暴击刺客 | 酸爽一击 | [菜刀](WEAPONS.md#weapon-knife) | [酸雾隐身](SKILLS.md#skill-lemon) （无敌潜行） | 达成成就 [会心一击（铜）](ACHIEVEMENTS.md#ach-crits)：累计造成 100 次暴击 |
| <img src="images/char/eggplant.png" width="32" height="32" alt=""> [茄子法师](#char-eggplant) | 雷电法师 | 雷霆之力 | [西兰花法杖](WEAPONS.md#weapon-broccoli_staff) | [紫雷天罚](SKILLS.md#skill-eggplant) （全屏攻击） | 达成成就 [大招成瘾（银）](ACHIEVEMENTS.md#ach-casts)：累计释放 100 次技能 |
| <img src="images/char/garlic.png" width="32" height="32" alt=""> [大蒜伯爵](#char-garlic) | 吸血贵族 | 血之盛宴 | [大蒜光环](WEAPONS.md#weapon-garlic_aura) | [血之领域](SKILLS.md#skill-garlic) （吸取回复） | 达成成就 [精英猎手（银）](ACHIEVEMENTS.md#ach-elites)：累计击败 10 名精英 |
| <img src="images/char/blueberry.png" width="32" height="32" alt=""> [蓝莓双子](#char-blueberry) | 武器大师 | 双生默契 | [豌豆枪](WEAPONS.md#weapon-pea_shooter)、[菜刀](WEAPONS.md#weapon-knife) | [双子分身](SKILLS.md#skill-blueberry) （召唤分身） | 达成成就 [多面手（铜）](ACHIEVEMENTS.md#ach-chars_won)：用 3 名不同角色通关 |
| <img src="images/char/pineapple.png" width="32" height="32" alt=""> [菠萝船长](#char-pineapple) | 商人海盗 | 海盗分赃 | [番茄弹弓](WEAPONS.md#weapon-slingshot) | [黄金炮击](SKILLS.md#skill-pineapple) （发射 AOE） | 达成成就 [小有积蓄（铜）](ACHIEVEMENTS.md#ach-rich)：同时持有 200 番茄籽 |
| <img src="images/char/pumpkin.png" width="32" height="32" alt=""> [南瓜幽灵](#char-pumpkin) | 闪避大师 | 幽灵突袭 | [冰镇汽水](WEAPONS.md#weapon-soda) | [灵体化](SKILLS.md#skill-pumpkin) （无敌潜行） | 达成成就 [菜园守护者](ACHIEVEMENTS.md#ach-clear_2)：通关第二章 |
| <img src="images/char/strawberry.png" width="32" height="32" alt=""> [草莓偶像](#char-strawberry) | 成长明星 | 人气飙升 | [番茄酱瓶](WEAPONS.md#weapon-ketchup) | [应援打 Call](SKILLS.md#skill-strawberry) （自身增益） | 达成成就 [茁壮成长（银）](ACHIEVEMENTS.md#ach-level)：单局达到 20 级 |
| <img src="images/char/ginger.png" width="32" height="32" alt=""> [生姜忍者](#char-ginger) | 疾风忍者 | 疾风步 | [洋葱回旋镖](WEAPONS.md#weapon-onion_boomerang) | [瞬影斩](SKILLS.md#skill-ginger) （突进冲撞） | 达成成就 [毫发无伤（银）](ACHIEVEMENTS.md#ach-perfect)：累计 10 次无伤完成波次 |
| <img src="images/char/avocado.png" width="32" height="32" alt=""> [牛油果博士](#char-avocado) | 炸弹专家 | 连环爆破 | [胡椒雷](WEAPONS.md#weapon-pepper_mine)、[辣椒火箭](WEAPONS.md#weapon-chili_rocket) | [核心过载](SKILLS.md#skill-avocado) （多点轰炸） | 达成成就 [神兵利器（铜）](ACHIEVEMENTS.md#ach-t4)：累计合成 1 把 T4 武器 |
| <img src="images/char/onion.png" width="32" height="32" alt=""> [洋葱大叔](#char-onion) | 催泪硬汉 | 催泪弹 | [平底锅](WEAPONS.md#weapon-pan) | [催泪领域](SKILLS.md#skill-onion) （禁锢领域） | 达成成就 [屡败屡战（银）](ACHIEVEMENTS.md#ach-deaths)：累计阵亡 10 次 |
| <img src="images/char/mushroom.png" width="32" height="32" alt=""> [蘑菇巫医](#char-mushroom) | 剧毒专家 | 孢子扩散 | [冰镇汽水](WEAPONS.md#weapon-soda) | [孢子云](SKILLS.md#skill-mushroom) （群体减益） | 达成成就 [中毒专家（铜）](ACHIEVEMENTS.md#ach-inflict_poison)：对敌人施加 50 次【中毒】 |
| <img src="images/char/coconut.png" width="32" height="32" alt=""> [椰子拳师](#char-coconut) | 重拳格斗 | 重拳出击 | [平底锅](WEAPONS.md#weapon-pan) | [震地拳](SKILLS.md#skill-coconut) （周身爆发） | 达成成就 [厨房清扫](ACHIEVEMENTS.md#ach-clear_1)：通关第一章 |
| <img src="images/char/grape.png" width="32" height="32" alt=""> [葡萄魔术师](#char-grape) | 幻术大师 | 障眼法 | [番茄酱瓶](WEAPONS.md#weapon-ketchup) | [葡萄分身](SKILLS.md#skill-grape) （召唤分身） | 达成成就 [开箱达人（银）](ACHIEVEMENTS.md#ach-crates)：累计打开 50 个宝箱 |
| <img src="images/char/cherry.png" width="32" height="32" alt=""> [樱桃双枪](#char-cherry) | 连射枪手 | 连珠炮 | [豌豆枪](WEAPONS.md#weapon-pea_shooter) | [双枪连射](SKILLS.md#skill-cherry) （单体连发） | 达成成就 [枪械套装（铜）](ACHIEVEMENTS.md#ach-set_枪械)：单局持有 2 把【枪械】武器 |
| <img src="images/char/pea.png" width="32" height="32" alt=""> [豌豆士兵](#char-pea) | 军团兵 | 豌豆军团 | [豌豆枪](WEAPONS.md#weapon-pea_shooter)、[豌豆枪](WEAPONS.md#weapon-pea_shooter) | [豌豆炮台](SKILLS.md#skill-pea) （单体连发） | 达成成就 [番茄酱风暴（银）](ACHIEVEMENTS.md#ach-kills)：累计击败 1,000 只怪物 |
| <img src="images/char/peach.png" width="32" height="32" alt=""> [蜜桃天使](#char-peach) | 治愈者 | 天使庇护 | [番茄弹弓](WEAPONS.md#weapon-slingshot) | [天使祝福](SKILLS.md#skill-peach) （吸取回复） | 达成成就 [凤凰涅槃](ACHIEVEMENTS.md#ach-revive)：在战斗中复活 1 次 |
| <img src="images/char/dragonfruit.png" width="32" height="32" alt=""> [火龙果龙骑](#char-dragonfruit) | 烈焰骑士 | 龙息 | [擀面杖](WEAPONS.md#weapon-rolling_pin) | [龙焰冲锋](SKILLS.md#skill-dragonfruit) （突进冲撞） | 达成成就 [灼烧专家（银）](ACHIEVEMENTS.md#ach-inflict_burn)：对敌人施加 1,000 次【灼烧】 |
| <img src="images/char/beet.png" width="32" height="32" alt=""> [甜菜狂战士](#char-beet) | 狂战士 | 狂战之血 | [剁骨刀](WEAPONS.md#weapon-cleaver) | [狂暴](SKILLS.md#skill-beet) （自身增益） | 达成成就 [割草机（银）](ACHIEVEMENTS.md#ach-run_kills)：单局击败 800 只怪物 |
| <img src="images/char/asparagus.png" width="32" height="32" alt=""> [芦笋弓手](#char-asparagus) | 精准射手 | 一箭穿心 | [玉米加农](WEAPONS.md#weapon-corn_cannon) | [穿心箭](SKILLS.md#skill-asparagus) （单体连发） | 达成成就 [一击必杀（银）](ACHIEVEMENTS.md#ach-max_hit)：单次造成 5,000 点伤害 |
| <img src="images/char/sweetpotato.png" width="32" height="32" alt=""> [红薯厨神](#char-sweetpotato) | 美食家 | 美食家 | [擀面杖](WEAPONS.md#weapon-rolling_pin) | [烤红薯盛宴](SKILLS.md#skill-sweetpotato) （吸取回复） | 达成成就 [厨具套装（银）](ACHIEVEMENTS.md#ach-set_厨具)：单局持有 4 把【厨具】武器 |
| <img src="images/char/kiwi.png" width="32" height="32" alt=""> [猕猴桃侦探](#char-kiwi) | 弱点洞察 | 弱点洞察 | [菜刀](WEAPONS.md#weapon-knife) | [真相只有一个](SKILLS.md#skill-kiwi) （群体减益） | 达成成就 [怪物学者（铜）](ACHIEVEMENTS.md#ach-codex_monsters)：在图鉴中发现 20 种小怪 |
| <img src="images/char/lychee.png" width="32" height="32" alt=""> [荔枝公主](#char-lychee) | 幸运公主 | 好运连连 | [番茄弹弓](WEAPONS.md#weapon-slingshot) | [公主的好运](SKILLS.md#skill-lychee) （自身增益） | 达成成就 [番茄大亨（银）](ACHIEVEMENTS.md#ach-earned)：累计获得 20,000 番茄籽 |
| <img src="images/char/durian.png" width="32" height="32" alt=""> [榴莲霸王](#char-durian) | 毒刺霸主 | 臭气熏天 | [大蒜光环](WEAPONS.md#weapon-garlic_aura) | [臭气熏天](SKILLS.md#skill-durian) （群体减益） | 达成成就 [Boss 终结者（银）](ACHIEVEMENTS.md#ach-bosses)：累计击败 5 名 Boss |
| <img src="images/char/bellpepper.png" width="32" height="32" alt=""> [青椒机甲](#char-bellpepper) | 机甲驾驶员 | 机甲装甲 | [酱料加特林](WEAPONS.md#weapon-sauce_gatling) | [无人机支援](SKILLS.md#skill-bellpepper) （召唤分身） | 达成成就 [垃圾场之王](ACHIEVEMENTS.md#ach-clear_4)：通关第四章 |
| <img src="images/char/wintermelon.png" width="32" height="32" alt=""> [冬瓜和尚](#char-wintermelon) | 禅修武僧 | 禅定 | [擀面杖](WEAPONS.md#weapon-rolling_pin) | [金钟罩](SKILLS.md#skill-wintermelon) （无敌潜行） | 达成成就 [绝地反击（铜）](ACHIEVEMENTS.md#ach-overtime)：在 Boss 狂暴后将其击败 1 次 |
| <img src="images/char/bittermelon.png" width="32" height="32" alt=""> [苦瓜冰法](#char-bittermelon) | 寒冰法师 | 寒霜侵袭 | [冰镇汽水](WEAPONS.md#weapon-soda) | [冰封领域](SKILLS.md#skill-bittermelon) （禁锢领域） | 达成成就 [破冰者](ACHIEVEMENTS.md#ach-clear_3)：通关第三章 |
| <img src="images/char/sprout.png" width="32" height="32" alt=""> [豆芽学徒](#char-sprout) | 潜力新星 | 厚积薄发 | [番茄叉](WEAPONS.md#weapon-fork) | [拔苗助长](SKILLS.md#skill-sprout) （自身增益） | 达成成就 [步步高升（银）](ACHIEVEMENTS.md#ach-levelups)：累计升级选择 200 次属性 |
| <img src="images/char/wasabi.png" width="32" height="32" alt=""> [山葵爆破手](#char-wasabi) | 爆破狂人 | 连锁反应 | [辣椒火箭](WEAPONS.md#weapon-chili_rocket) | [冲鼻核弹](SKILLS.md#skill-wasabi) （发射 AOE） | 达成成就 [爆破套装（银）](ACHIEVEMENTS.md#ach-set_爆破)：单局持有 4 把【爆破】武器 |
| <img src="images/char/soybean.png" width="32" height="32" alt=""> [黄豆军师](#char-soybean) | 召唤统领 | 撒豆成兵 | [爆米花机](WEAPONS.md#weapon-popcorn_machine) | [豆兵出阵](SKILLS.md#skill-soybean) （召唤分身） | 达成成就 [全员集结（银）](ACHIEVEMENTS.md#ach-chars_owned)：拥有 20 名角色 |
| <img src="images/char/jackfruit.png" width="32" height="32" alt=""> [菠萝蜜卫士](#char-jackfruit) | 荆棘反伤 | 以刺还刺 | [旋风打蛋器](WEAPONS.md#weapon-whisk_spin) | [千刺甲](SKILLS.md#skill-jackfruit) （自身增益） | 达成成就 [精英怪克星（银）](ACHIEVEMENTS.md#ach-champions)：累计击败 50 只词缀精英怪 |
| <img src="images/char/pomegranate.png" width="32" height="32" alt=""> [石榴炮手](#char-pomegranate) | 弹幕狂潮 | 籽弹倾泻 | [瓜子机枪](WEAPONS.md#weapon-seed_spitter)、[橄榄发射器](WEAPONS.md#weapon-olive_launcher) | [石榴籽爆裂](SKILLS.md#skill-pomegranate) （环形弹幕） | 达成成就 [番茄酱风暴（金）](ACHIEVEMENTS.md#ach-kills)：累计击败 10,000 只怪物 |
| <img src="images/char/taro.png" width="32" height="32" alt=""> [芋头术士](#char-taro) | 一心一器 | 芋香结界 | [咖喱光环](WEAPONS.md#weapon-curry_aura) | [芋泥结界](SKILLS.md#skill-taro) （禁锢领域） | 达成成就 [进化论（铜）](ACHIEVEMENTS.md#ach-evolutions)：累计进化武器 1 次 |
| <img src="images/char/cabbage.png" width="32" height="32" alt=""> [卷心菜老兵](#char-cabbage) | 不屈老兵 | 层层不倒 | [汤勺](WEAPONS.md#weapon-ladle) | [不倒金身](SKILLS.md#skill-cabbage) （自身增益） | 达成成就 [常胜将军（银）](ACHIEVEMENTS.md#ach-wins)：累计通关 10 次 |
| <img src="images/char/blackberry.png" width="32" height="32" alt=""> [黑莓女巫](#char-blackberry) | 诅咒术士 | 黑暗契约 | [火龙果法球](WEAPONS.md#weapon-dragonfruit_orb) | [枯萎咒](SKILLS.md#skill-blackberry) （群体减益） | 达成成就 [腐烂终结](ACHIEVEMENTS.md#ach-clear_5)：通关第五章，击败腐烂之源 |

<a id="details"></a>

## 角色详情

<a id="char-tomato"></a>

### 番茄妹 · 全能少女

<img src="images/char/tomato.png" width="96" height="96" alt="">

> 番茄酱小镇的守护者，各项能力均衡，适合新手。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **番茄之心**：每完成一波，永久 +1 最大生命，契合武器连击率 +2%（最多 +20%） |
| 被动特性 | +5% 伤害；+1 生命再生 |
| 属性修正 | +1 生命再生，+5% 全伤害 |
| 初始武器 | [番茄叉](WEAPONS.md#weapon-fork) |
| 主动技能 | [番茄酱爆](SKILLS.md#skill-tomato)【周身爆发】冷却 17s — 炸开番茄酱，造成伤害并减速敌人。 |
| 解锁条件 | 默认解锁 |

<a id="char-carrot"></a>

### 胡萝卜骑士 · 近战坦克

<img src="images/char/carrot.png" width="96" height="96" alt="">

> 身披银甲的骑士，擅长近身肉搏。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **骑士之盾**：每 1 点护甲让契合武器横扫与爆炸范围 +2%（最多 +40%）；打破甲 3 层以上的敌人时眩晕 0.3 秒 |
| 被动特性 | +3 护甲；+3 近战伤害；远程伤害 -50% |
| 属性修正 | +5 最大生命，+3 近战伤害，+3 护甲，远程伤害 ×0.5 |
| 初始武器 | [擀面杖](WEAPONS.md#weapon-rolling_pin) |
| 主动技能 | [骑士冲锋](SKILLS.md#skill-carrot)【突进冲撞】冷却 11s — 无敌冲锋，撞晕沿途敌人。 |
| 解锁条件 | 默认解锁 |

<a id="char-chili"></a>

### 辣椒姐 · 火焰专家

<img src="images/char/chili.png" width="96" height="96" alt="">

> 脾气火爆，所到之处烈焰滚滚。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **火上浇油**：契合武器打中灼烧中的敌人时溅出火花，对周围造成 30% 伤害 |
| 被动特性 | +3 元素伤害；-2 最大生命；所有命中 25% 概率灼烧 |
| 属性修正 | -2 最大生命，+3 元素伤害 |
| 初始武器 | [芥末喷枪](WEAPONS.md#weapon-mustard_flamer) |
| 主动技能 | [烈焰新星](SKILLS.md#skill-chili)【周身爆发】冷却 20s — 火焰冲击波，叠加 3 层灼烧。 |
| 解锁条件 | 默认解锁 |

<a id="char-corn"></a>

### 玉米枪手 · 远程射手

<img src="images/char/corn.png" width="96" height="96" alt="">

> 西部神枪手，用玉米粒击穿一切。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **远程压制**：契合子弹每飞行 100 距离，额外穿透 +1（最多 +3） |
| 被动特性 | +3 远程伤害；+50 射程；+3 最大生命；近战伤害 -50% |
| 属性修正 | +3 最大生命，+3 远程伤害，+50 射程，近战伤害 ×0.5 |
| 初始武器 | [玉米加农](WEAPONS.md#weapon-corn_cannon) |
| 主动技能 | [爆米花弹幕](SKILLS.md#skill-corn)【环形弹幕】冷却 8s — 向四周发射 18 发爆米花。 |
| 解锁条件 | 默认解锁 |

<a id="char-watermelon"></a>

### 西瓜胖墩 · 重装坦克

<img src="images/char/watermelon.png" width="96" height="96" alt="">

> 圆滚滚的大块头，皮糙肉厚。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **皮糙肉厚**：受到的伤害 -10%；每 20 最大生命让契合武器范围 +5%（最多 +50%） |
| 被动特性 | +25 最大生命；+2 护甲；-12% 移速；-10% 攻速 |
| 属性修正 | +25 最大生命，-10% 攻击速度，+2 护甲，-12% 移动速度 |
| 初始武器 | [西瓜锤](WEAPONS.md#weapon-watermelon_hammer) |
| 主动技能 | [西瓜翻滚](SKILLS.md#skill-watermelon)【突进冲撞】冷却 13s — 翻滚冲撞并回复 4.5% 最大生命。 |
| 解锁条件 | 达成成就 [水果补给（银）](ACHIEVEMENTS.md#ach-fruits)：累计吃到 50 个果实 |

<a id="char-lemon"></a>

### 柠檬刺客 · 暴击刺客

<img src="images/char/lemon.png" width="96" height="96" alt="">

> 酸溜溜的刺客，一击致命。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **酸爽一击**：契合武器暴击后立刻重置冷却（每把武器每秒最多 1 次） |
| 被动特性 | +20% 暴击；+10% 闪避；-4 最大生命；暴击伤害 +40% |
| 属性修正 | -4 最大生命，+20% 暴击率，+10% 闪避，+5% 移动速度 |
| 初始武器 | [菜刀](WEAPONS.md#weapon-knife) |
| 主动技能 | [酸雾隐身](SKILLS.md#skill-lemon)【无敌潜行】冷却 11s — 隐身 3 秒（无敌），暴击 +50%。 |
| 解锁条件 | 达成成就 [会心一击（铜）](ACHIEVEMENTS.md#ach-crits)：累计造成 100 次暴击 |

<a id="char-eggplant"></a>

### 茄子法师 · 雷电法师

<img src="images/char/eggplant.png" width="96" height="96" alt="">

> 紫袍法师，召唤天雷惩戒害虫。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **雷霆之力**：契合连锁每跳到一个敌人，15% 概率引下落雷 |
| 被动特性 | +4 元素伤害；+10 幸运；+3 最大生命；近战伤害 -70%；命中 10% 概率落雷 |
| 属性修正 | +3 最大生命，+4 元素伤害，+10 幸运，近战伤害 ×0.3 |
| 初始武器 | [西兰花法杖](WEAPONS.md#weapon-broccoli_staff) |
| 主动技能 | [紫雷天罚](SKILLS.md#skill-eggplant)【全屏攻击】冷却 14s — 天雷覆盖全屏，劈中所有敌人并短暂眩晕。 |
| 解锁条件 | 达成成就 [大招成瘾（银）](ACHIEVEMENTS.md#ach-casts)：累计释放 100 次技能 |

<a id="char-garlic"></a>

### 大蒜伯爵 · 吸血贵族

<img src="images/char/garlic.png" width="96" height="96" alt="">

> 古老的吸血鬼……却是大蒜做的。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **血之盛宴**：生命低于 50% 时吸血概率翻倍，契合武器攻速 +30% |
| 被动特性 | +10% 吸血概率；-3 生命再生；+5% 伤害 |
| 属性修正 | -3 生命再生，+10% 吸血概率，+5% 全伤害 |
| 初始武器 | [大蒜光环](WEAPONS.md#weapon-garlic_aura) |
| 主动技能 | [血之领域](SKILLS.md#skill-garlic)【吸取回复】冷却 14s — 吸取周围敌人生命，施加流血。 |
| 解锁条件 | 达成成就 [精英猎手（银）](ACHIEVEMENTS.md#ach-elites)：累计击败 10 名精英 |

<a id="char-blueberry"></a>

### 蓝莓双子 · 武器大师

<img src="images/char/blueberry.png" width="96" height="96" alt="">

> 形影不离的双胞胎，可以携带更多武器。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **双生默契**：每持有一对同名契合武器，契合武器弹丸再 +1（最多 +2） |
| 被动特性 | 武器栏 8 格；-10% 伤害 |
| 属性修正 | -10% 全伤害，武器栏 8 |
| 初始武器 | [豌豆枪](WEAPONS.md#weapon-pea_shooter)、[菜刀](WEAPONS.md#weapon-knife) |
| 主动技能 | [双子分身](SKILLS.md#skill-blueberry)【召唤分身】冷却 10s — 召唤分身 8 秒自动射击。 |
| 解锁条件 | 达成成就 [多面手（铜）](ACHIEVEMENTS.md#ach-chars_won)：用 3 名不同角色通关 |

<a id="char-pineapple"></a>

### 菠萝船长 · 商人海盗

<img src="images/char/pineapple.png" width="96" height="96" alt="">

> 精明的海盗船长，擅长讨价还价。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **海盗分赃**：每波结束获得当前番茄籽 8% 的利息（上限随波次提高）；每持有 100 番茄籽，契合武器弹射再 +1（最多 +3） |
| 被动特性 | 商店价格 -15%；+20 幸运；+10 收获 |
| 属性修正 | -3 最大生命，+20 幸运，+10 收获，商店折扣 15% |
| 初始武器 | [番茄弹弓](WEAPONS.md#weapon-slingshot) |
| 主动技能 | [黄金炮击](SKILLS.md#skill-pineapple)【发射 AOE】冷却 16s — 向敌群最密集处发射黄金炮弹，大范围爆炸，击杀必掉番茄籽。 |
| 解锁条件 | 达成成就 [小有积蓄（铜）](ACHIEVEMENTS.md#ach-rich)：同时持有 200 番茄籽 |

<a id="char-pumpkin"></a>

### 南瓜幽灵 · 闪避大师

<img src="images/char/pumpkin.png" width="96" height="96" alt="">

> 万圣节的小幽灵，总是飘来飘去。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **幽灵突袭**：闪避成功后 1.5 秒内契合武器攻速 +40% |
| 被动特性 | +25% 闪避；闪避上限 75%；-4 最大生命 |
| 属性修正 | -4 最大生命，+25% 闪避，+8% 移动速度，闪避上限 75% |
| 初始武器 | [冰镇汽水](WEAPONS.md#weapon-soda) |
| 主动技能 | [灵体化](SKILLS.md#skill-pumpkin)【无敌潜行】冷却 11s — 无敌 2.5 秒并大幅加速。 |
| 解锁条件 | 达成成就 [菜园守护者](ACHIEVEMENTS.md#ach-clear_2)：通关第二章 |

<a id="char-strawberry"></a>

### 草莓偶像 · 成长明星

<img src="images/char/strawberry.png" width="96" height="96" alt="">

> 人气偶像，成长速度惊人。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **人气飙升**：每次升级 +1 最大生命；每 4 级契合武器轮流获得一项永久强化：射程 +15%、弹丸 +1、穿透 +1、暴击 +5% |
| 被动特性 | +40% 经验获取；升级时 5 个选项 |
| 属性修正 | -3 最大生命，+40% 经验获取，升级选项 5 个 |
| 初始武器 | [番茄酱瓶](WEAPONS.md#weapon-ketchup) |
| 主动技能 | [应援打 Call](SKILLS.md#skill-strawberry)【自身增益】冷却 13s — 6 秒内急速 3 层 + 怒气 5 层。 |
| 解锁条件 | 达成成就 [茁壮成长（银）](ACHIEVEMENTS.md#ach-level)：单局达到 20 级 |

<a id="char-ginger"></a>

### 生姜忍者 · 疾风忍者

<img src="images/char/ginger.png" width="96" height="96" alt="">

> 来无影去无踪的生姜忍者。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **疾风步**：移速每 +10%，契合武器攻速 +4% |
| 被动特性 | +20% 移速；+15% 攻速；-1 护甲 |
| 属性修正 | +15% 攻击速度，-1 护甲，+20% 移动速度 |
| 初始武器 | [洋葱回旋镖](WEAPONS.md#weapon-onion_boomerang) |
| 主动技能 | [瞬影斩](SKILLS.md#skill-ginger)【突进冲撞】冷却 11s — 突进斩击，施加流血。 |
| 解锁条件 | 达成成就 [毫发无伤（银）](ACHIEVEMENTS.md#ach-perfect)：累计 10 次无伤完成波次 |

<a id="char-avocado"></a>

### 牛油果博士 · 炸弹专家

<img src="images/char/avocado.png" width="96" height="96" alt="">

> 疯狂科学家，热衷于爆炸实验。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **连环爆破**：契合武器爆炸后 30% 概率在边缘再炸一次（50% 伤害），概率每波 +3%（最多 60%） |
| 被动特性 | +2 元素伤害；+5% 伤害；击杀 15% 概率爆炸 |
| 属性修正 | +5% 全伤害，+2 元素伤害，+30 射程 |
| 初始武器 | [胡椒雷](WEAPONS.md#weapon-pepper_mine)、[辣椒火箭](WEAPONS.md#weapon-chili_rocket) |
| 主动技能 | [核心过载](SKILLS.md#skill-avocado)【多点轰炸】冷却 11s — 连环爆炸 5 次。 |
| 解锁条件 | 达成成就 [神兵利器（铜）](ACHIEVEMENTS.md#ach-t4)：累计合成 1 把 T4 武器 |

<a id="char-onion"></a>

### 洋葱大叔 · 催泪硬汉

<img src="images/char/onion.png" width="96" height="96" alt="">

> 层层叠叠的硬汉，让敌人泪流满面。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **催泪弹**：受击时使周围敌人致盲 2 秒（每 3 秒最多一次）；契合武器打致盲的敌人暴击率 +30% |
| 被动特性 | +4 护甲；+10 最大生命；受击时反弹 15 点伤害 |
| 属性修正 | +10 最大生命，+2 生命再生，+4 护甲，-5% 移动速度 |
| 初始武器 | [平底锅](WEAPONS.md#weapon-pan) |
| 主动技能 | [催泪领域](SKILLS.md#skill-onion)【禁锢领域】冷却 12s — 释放 5 秒催泪瓦斯区域，区域内敌人大幅减速并致盲。 |
| 解锁条件 | 达成成就 [屡败屡战（银）](ACHIEVEMENTS.md#ach-deaths)：累计阵亡 10 次 |

<a id="char-mushroom"></a>

### 蘑菇巫医 · 剧毒专家

<img src="images/char/mushroom.png" width="96" height="96" alt="">

> 森林深处的巫医，擅长用孢子毒倒敌人。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **孢子扩散**：中毒的敌人死亡时爆出 3 颗追踪孢子弹，并使周围敌人中毒 3 层 |
| 被动特性 | +2 元素伤害；所有命中 30% 概率中毒 |
| 属性修正 | +2 元素伤害，+5 幸运 |
| 初始武器 | [冰镇汽水](WEAPONS.md#weapon-soda) |
| 主动技能 | [孢子云](SKILLS.md#skill-mushroom)【群体减益】冷却 19s — 对大范围内敌人施加 5 层中毒与 2 层虚弱。 |
| 解锁条件 | 达成成就 [中毒专家（铜）](ACHIEVEMENTS.md#ach-inflict_poison)：对敌人施加 50 次【中毒】 |

<a id="char-coconut"></a>

### 椰子拳师 · 重拳格斗

<img src="images/char/coconut.png" width="96" height="96" alt="">

> 坚硬外壳下是一颗火热的格斗之心。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **重拳出击**：契合武器打中眩晕的敌人时打出冲击波，对周围造成 50% 伤害 |
| 被动特性 | +4 近战伤害；+2 护甲；+5 最大生命；击杀叠加怒气（每层 +4% 伤害）；命中 12% 概率眩晕 0.6 秒 |
| 属性修正 | +5 最大生命，+4 近战伤害，+2 护甲，元素伤害 ×0.5 |
| 初始武器 | [平底锅](WEAPONS.md#weapon-pan) |
| 主动技能 | [震地拳](SKILLS.md#skill-coconut)【周身爆发】冷却 21s — 重击地面，眩晕并破甲。 |
| 解锁条件 | 达成成就 [厨房清扫](ACHIEVEMENTS.md#ach-clear_1)：通关第一章 |

<a id="char-grape"></a>

### 葡萄魔术师 · 幻术大师

<img src="images/char/grape.png" width="96" height="96" alt="">

> 一串葡萄组成的魔术师，真真假假难以分辨。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **障眼法**：每 8 秒获得 1 秒无敌；契合武器命中 15% 概率变出幻影弹打向另一个敌人（60% 伤害），无敌期间必定触发 |
| 被动特性 | +10 幸运；+3 最大生命；受到攻击 20% 概率使敌人混乱 |
| 属性修正 | +3 最大生命，+1 远程伤害，+1 元素伤害，+10 幸运 |
| 初始武器 | [番茄酱瓶](WEAPONS.md#weapon-ketchup) |
| 主动技能 | [葡萄分身](SKILLS.md#skill-grape)【召唤分身】冷却 10s — 召唤分身 8 秒自动射击。 |
| 解锁条件 | 达成成就 [开箱达人（银）](ACHIEVEMENTS.md#ach-crates)：累计打开 50 个宝箱 |

<a id="char-cherry"></a>

### 樱桃双枪 · 连射枪手

<img src="images/char/cherry.png" width="96" height="96" alt="">

> 一根梗上的两颗樱桃，枪法快如闪电。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **连珠炮**：契合武器持续开火时每发叠 1 层热枪（攻速 +1%，最多 30 层），停火 1 秒清零 |
| 被动特性 | +20% 攻速；-8% 伤害；射击时 10% 概率获得急速 |
| 属性修正 | -8% 全伤害，+1 远程伤害，+20% 攻击速度 |
| 初始武器 | [豌豆枪](WEAPONS.md#weapon-pea_shooter) |
| 主动技能 | [双枪连射](SKILLS.md#skill-cherry)【单体连发】冷却 11s — 对最近的敌人连续射出 12 发子弹。 |
| 解锁条件 | 达成成就 [枪械套装（铜）](ACHIEVEMENTS.md#ach-set_枪械)：单局持有 2 把【枪械】武器 |

<a id="char-pea"></a>

### 豌豆士兵 · 军团兵

<img src="images/char/pea.png" width="96" height="96" alt="">

> 豆荚里走出的小兵，人多力量大。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **豌豆军团**：每持有 1 把武器，契合子弹一分为二的概率 +8% |
| 被动特性 | +2 远程伤害；初始 2 把豌豆枪；每把同名武器 +3% 伤害 |
| 属性修正 | +3 最大生命，+2 远程伤害 |
| 初始武器 | [豌豆枪](WEAPONS.md#weapon-pea_shooter)、[豌豆枪](WEAPONS.md#weapon-pea_shooter) |
| 主动技能 | [豌豆炮台](SKILLS.md#skill-pea)【单体连发】冷却 10s — 对最近的敌人高速连发 16 颗豌豆。 |
| 解锁条件 | 达成成就 [番茄酱风暴（银）](ACHIEVEMENTS.md#ach-kills)：累计击败 1,000 只怪物 |

<a id="char-peach"></a>

### 蜜桃天使 · 治愈者

<img src="images/char/peach.png" width="96" height="96" alt="">

> 温柔的天使，守护着每一个伙伴。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **天使庇护**：每波首次受到致命伤害时保留 1 点生命，并获得 2 秒无敌；有护盾时契合武器穿透 +1，命中必定回血（每秒最多 3 次） |
| 被动特性 | +5 生命再生；每波开始获得 15 点护盾；-10% 伤害 |
| 属性修正 | +5 最大生命，+5 生命再生，-10% 全伤害 |
| 初始武器 | [番茄弹弓](WEAPONS.md#weapon-slingshot) |
| 主动技能 | [天使祝福](SKILLS.md#skill-peach)【吸取回复】冷却 21s — 吸取周围敌人生命并回复 9% 最大生命，无敌 1.5 秒。 |
| 解锁条件 | 达成成就 [凤凰涅槃](ACHIEVEMENTS.md#ach-revive)：在战斗中复活 1 次 |

<a id="char-dragonfruit"></a>

### 火龙果龙骑 · 烈焰骑士

<img src="images/char/dragonfruit.png" width="96" height="96" alt="">

> 拥有龙之血脉的骑士，冲锋时烈焰相随。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **龙息**：契合武器打中灼烧中的敌人时喷出短程龙息（3 道火焰，40% 伤害） |
| 被动特性 | +2 近战/元素伤害；+5 最大生命；近战命中 20% 概率灼烧；持续伤害 +40% |
| 属性修正 | +5 最大生命，+2 近战伤害，+2 元素伤害，+5% 移动速度 |
| 初始武器 | [擀面杖](WEAPONS.md#weapon-rolling_pin) |
| 主动技能 | [龙焰冲锋](SKILLS.md#skill-dragonfruit)【突进冲撞】冷却 12s — 冲锋并在路径上叠加 4 层灼烧。 |
| 解锁条件 | 达成成就 [灼烧专家（银）](ACHIEVEMENTS.md#ach-inflict_burn)：对敌人施加 1,000 次【灼烧】 |

<a id="char-beet"></a>

### 甜菜狂战士 · 狂战士

<img src="images/char/beet.png" width="96" height="96" alt="">

> 血红的甜菜，越战越勇。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **狂战之血**：每损失 10% 生命，契合武器攻速 +6%、范围 +3% |
| 被动特性 | +15% 伤害；+3% 吸血概率；-1 护甲；受伤时获得怒气 |
| 属性修正 | +3% 吸血概率，+15% 全伤害，-1 护甲 |
| 初始武器 | [剁骨刀](WEAPONS.md#weapon-cleaver) |
| 主动技能 | [狂暴](SKILLS.md#skill-beet)【自身增益】冷却 13s — 6 秒暴怒（移速、伤害 +30%）与嗜血。 |
| 解锁条件 | 达成成就 [割草机（银）](ACHIEVEMENTS.md#ach-run_kills)：单局击败 800 只怪物 |

<a id="char-asparagus"></a>

### 芦笋弓手 · 精准射手

<img src="images/char/asparagus.png" width="96" height="96" alt="">

> 修长的芦笋，百步穿杨。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **一箭穿心**：契合武器打满血敌人必定暴击，且这次命中不消耗穿透 |
| 被动特性 | +80 射程；+10% 暴击；命中 15% 概率标记敌人（下次必暴击） |
| 属性修正 | +1 远程伤害，+10% 暴击率，+80 射程，近战伤害 ×0.6 |
| 初始武器 | [玉米加农](WEAPONS.md#weapon-corn_cannon) |
| 主动技能 | [穿心箭](SKILLS.md#skill-asparagus)【单体连发】冷却 12s — 向生命最高的敌人连射 8 支穿透箭，并标记目标。 |
| 解锁条件 | 达成成就 [一击必杀（银）](ACHIEVEMENTS.md#ach-max_hit)：单次造成 5,000 点伤害 |

<a id="char-sweetpotato"></a>

### 红薯厨神 · 美食家

<img src="images/char/sweetpotato.png" width="96" height="96" alt="">

> 烤红薯的香味让人精神百倍。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **美食家**：拾取果实时额外获得番茄籽（随波次增加），并在 5 秒内让契合武器攻速 +25%、范围 +20% |
| 被动特性 | +20 收获；果实回血翻倍；-5% 伤害 |
| 属性修正 | +5 最大生命，-5% 全伤害，+20 收获 |
| 初始武器 | [擀面杖](WEAPONS.md#weapon-rolling_pin) |
| 主动技能 | [烤红薯盛宴](SKILLS.md#skill-sweetpotato)【吸取回复】冷却 24s — 吸取周围敌人生命并回复 9% 最大生命，获得 5 层再生。 |
| 解锁条件 | 达成成就 [厨具套装（银）](ACHIEVEMENTS.md#ach-set_厨具)：单局持有 4 把【厨具】武器 |

<a id="char-kiwi"></a>

### 猕猴桃侦探 · 弱点洞察

<img src="images/char/kiwi.png" width="96" height="96" alt="">

> 毛茸茸的侦探，一眼看穿敌人弱点。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **弱点洞察**：目标身上每有一种减益，契合武器对它的暴击率 +5% |
| 被动特性 | +8% 暴击；+3 最大生命；+1 近战伤害；命中 20% 概率易伤；暴击伤害 +30% |
| 属性修正 | +3 最大生命，+1 近战伤害，+8% 暴击率，+10 幸运 |
| 初始武器 | [菜刀](WEAPONS.md#weapon-knife) |
| 主动技能 | [真相只有一个](SKILLS.md#skill-kiwi)【群体减益】冷却 15s — 看穿全屏敌人：施加标记与 2 层易伤。 |
| 解锁条件 | 达成成就 [怪物学者（铜）](ACHIEVEMENTS.md#ach-codex_monsters)：在图鉴中发现 20 种小怪 |

<a id="char-lychee"></a>

### 荔枝公主 · 幸运公主

<img src="images/char/lychee.png" width="96" height="96" alt="">

> 剥开红色外壳，是晶莹剔透的公主。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **好运连连**：每波第一次商店刷新免费；每 10 点幸运让契合子弹 1% 概率变成红包弹（必定暴击、弹射 +2，最多 30%） |
| 被动特性 | +40 幸运；宝箱掉率翻倍 |
| 属性修正 | +40 幸运 |
| 初始武器 | [番茄弹弓](WEAPONS.md#weapon-slingshot) |
| 主动技能 | [公主的好运](SKILLS.md#skill-lychee)【自身增益】冷却 10s — 6 秒好运 5 层 + 专注 3 层。 |
| 解锁条件 | 达成成就 [番茄大亨（银）](ACHIEVEMENTS.md#ach-earned)：累计获得 20,000 番茄籽 |

<a id="char-durian"></a>

### 榴莲霸王 · 毒刺霸主

<img src="images/char/durian.png" width="96" height="96" alt="">

> 浑身是刺，臭名远扬，谁敢靠近？

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **臭气熏天**：契合武器每次命中给敌人叠 1 层臭气，叠满 5 层时向四周爆出 8 根尖刺（40% 伤害） |
| 被动特性 | +3 护甲；+10 最大生命；-4% 移速；反弹 10 伤害；周围敌人持续虚弱 |
| 属性修正 | +10 最大生命，+3 护甲，-4% 移动速度 |
| 初始武器 | [大蒜光环](WEAPONS.md#weapon-garlic_aura) |
| 主动技能 | [臭气熏天](SKILLS.md#skill-durian)【群体减益】冷却 21s — 对周围敌人施加中毒、3 层虚弱与混乱。 |
| 解锁条件 | 达成成就 [Boss 终结者（银）](ACHIEVEMENTS.md#ach-bosses)：累计击败 5 名 Boss |

<a id="char-bellpepper"></a>

### 青椒机甲 · 机甲驾驶员

<img src="images/char/bellpepper.png" width="96" height="96" alt="">

> 驾驶着改装青椒机甲的少年。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **机甲装甲**：受到的伤害 -15%；有护盾时契合武器攻速 +30%、弹丸 +1 |
| 被动特性 | +5 护甲；+10 生命；-10% 闪避；每 12 秒获得 20 点护盾 |
| 属性修正 | +10 最大生命，+5 护甲，-10% 闪避，-10% 移动速度 |
| 初始武器 | [酱料加特林](WEAPONS.md#weapon-sauce_gatling) |
| 主动技能 | [无人机支援](SKILLS.md#skill-bellpepper)【召唤分身】冷却 10s — 部署无人机 8 秒。 |
| 解锁条件 | 达成成就 [垃圾场之王](ACHIEVEMENTS.md#ach-clear_4)：通关第四章 |

<a id="char-wintermelon"></a>

### 冬瓜和尚 · 禅修武僧

<img src="images/char/wintermelon.png" width="96" height="96" alt="">

> 心如止水的武僧，以静制动。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **禅定**：静止不动时受到的伤害 -25%、每秒回复 2% 最大生命，契合武器 50% 概率连击（60% 伤害） |
| 被动特性 | +15% 闪避；+3 再生；闪避成功时获得专注 |
| 属性修正 | +3 生命再生，+15% 闪避，+5% 移动速度，远程伤害 ×0.7 |
| 初始武器 | [擀面杖](WEAPONS.md#weapon-rolling_pin) |
| 主动技能 | [金钟罩](SKILLS.md#skill-wintermelon)【无敌潜行】冷却 16s — 冥想 2 秒无敌，获得 5 层坚韧。 |
| 解锁条件 | 达成成就 [绝地反击（铜）](ACHIEVEMENTS.md#ach-overtime)：在 Boss 狂暴后将其击败 1 次 |

<a id="char-bittermelon"></a>

### 苦瓜冰法 · 寒冰法师

<img src="images/char/bittermelon.png" width="96" height="96" alt="">

> 外表苦涩的冰系法师，冻结一切。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **寒霜侵袭**：契合武器打中冰冻的敌人必定暴击，并震碎冰块，对周围造成 50% 伤害 |
| 被动特性 | +3 元素伤害；+3 最大生命；命中 8% 概率冰冻敌人 1 秒 |
| 属性修正 | +3 最大生命，+3 元素伤害，+5% 攻击速度 |
| 初始武器 | [冰镇汽水](WEAPONS.md#weapon-soda) |
| 主动技能 | [冰封领域](SKILLS.md#skill-bittermelon)【禁锢领域】冷却 16s — 在身边展开 5 秒冰封领域，敌人进入后减速并被冻结。 |
| 解锁条件 | 达成成就 [破冰者](ACHIEVEMENTS.md#ach-clear_3)：通关第三章 |

<a id="char-sprout"></a>

### 豆芽学徒 · 潜力新星

<img src="images/char/sprout.png" width="96" height="96" alt="">

> 小小的豆芽，却有无限可能。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **厚积薄发**：每升 1 级契合武器攻速 +1%（最多 +40%）；每 5 级穿透 +1（最多 +3） |
| 被动特性 | +80% 经验获取；-8% 伤害；-3 最大生命；升级时 5 个选项 |
| 属性修正 | -3 最大生命，-8% 全伤害，+80% 经验获取，升级选项 5 个 |
| 初始武器 | [番茄叉](WEAPONS.md#weapon-fork) |
| 主动技能 | [拔苗助长](SKILLS.md#skill-sprout)【自身增益】冷却 10s — 获得 12 点经验与 5 秒急速。 |
| 解锁条件 | 达成成就 [步步高升（银）](ACHIEVEMENTS.md#ach-levelups)：累计升级选择 200 次属性 |

<a id="char-wasabi"></a>

### 山葵爆破手 · 爆破狂人

<img src="images/char/wasabi.png" width="96" height="96" alt="">

> 一点就炸的山葵，冲鼻又致命。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **连锁反应**：被爆炸击杀的敌人 40% 概率再次爆炸，并溅出 2 道火花 |
| 被动特性 | +8% 伤害；击杀 25% 概率爆炸；爆炸施加灼烧 |
| 属性修正 | -5 最大生命，+8% 全伤害，+2 元素伤害 |
| 初始武器 | [辣椒火箭](WEAPONS.md#weapon-chili_rocket) |
| 主动技能 | [冲鼻核弹](SKILLS.md#skill-wasabi)【发射 AOE】冷却 23s — 向敌群发射山葵核弹，超大范围爆炸并灼烧。 |
| 解锁条件 | 达成成就 [爆破套装（银）](ACHIEVEMENTS.md#ach-set_爆破)：单局持有 4 把【爆破】武器 |

<a id="char-soybean"></a>

### 黄豆军师 · 召唤统领

<img src="images/char/soybean.png" width="96" height="96" alt="">

> 运筹帷幄的小黄豆，一声令下豆兵齐出。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **撒豆成兵**：豆兵分身在场时，契合武器攻速 +50% |
| 被动特性 | +40% 技能持续；+15% 技能冷却缩减；+3 最大生命；-5% 伤害 |
| 属性修正 | +3 最大生命，-5% 全伤害，+15% 技能冷却缩减，+40% 技能持续 |
| 初始武器 | [爆米花机](WEAPONS.md#weapon-popcorn_machine) |
| 主动技能 | [豆兵出阵](SKILLS.md#skill-soybean)【召唤分身】冷却 14s — 召唤豆兵分身 10 秒自动射击。 |
| 解锁条件 | 达成成就 [全员集结（银）](ACHIEVEMENTS.md#ach-chars_owned)：拥有 20 名角色 |

<a id="char-jackfruit"></a>

### 菠萝蜜卫士 · 荆棘反伤

<img src="images/char/jackfruit.png" width="96" height="96" alt="">

> 浑身硬刺的守卫，谁打它谁疼。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **以刺还刺**：受伤时获得 1 层荆棘 4 秒（每层反弹 5 伤害，最多 5 层）；契合飞刺穿透 +1 |
| 被动特性 | +4 护甲；+12 最大生命；-6% 移速；-5% 伤害；受伤反弹 25 伤害 |
| 属性修正 | +12 最大生命，-5% 全伤害，+4 护甲，-6% 移动速度 |
| 初始武器 | [旋风打蛋器](WEAPONS.md#weapon-whisk_spin) |
| 主动技能 | [千刺甲](SKILLS.md#skill-jackfruit)【自身增益】冷却 12s — 6 秒内获得 5 层荆棘与 3 层坚韧。 |
| 解锁条件 | 达成成就 [精英怪克星（银）](ACHIEVEMENTS.md#ach-champions)：累计击败 50 只词缀精英怪 |

<a id="char-pomegranate"></a>

### 石榴炮手 · 弹幕狂潮

<img src="images/char/pomegranate.png" width="96" height="96" alt="">

> 肚子里装满籽弹的炮手，开火就停不下来。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **籽弹倾泻**：用契合武器击杀时，敌人爆出 3 颗石榴籽弹（50% 伤害） |
| 被动特性 | 武器栏 7 格；+25% 攻速；+2 远程伤害；-12% 伤害；-2 最大生命；近战伤害 -50%；击杀获得 1 层急速 |
| 属性修正 | -2 最大生命，-12% 全伤害，+2 远程伤害，+25% 攻击速度，近战伤害 ×0.5，武器栏 7 |
| 初始武器 | [瓜子机枪](WEAPONS.md#weapon-seed_spitter)、[橄榄发射器](WEAPONS.md#weapon-olive_launcher) |
| 主动技能 | [石榴籽爆裂](SKILLS.md#skill-pomegranate)【环形弹幕】冷却 8s — 向四周喷射 30 颗石榴籽。 |
| 解锁条件 | 达成成就 [番茄酱风暴（金）](ACHIEVEMENTS.md#ach-kills)：累计击败 10,000 只怪物 |

<a id="char-taro"></a>

### 芋头术士 · 一心一器

<img src="images/char/taro.png" width="96" height="96" alt="">

> 不爱刀枪的芋头，只凭一身芋香结界御敌。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **芋香结界**：契合光环每 3 秒向外脉冲一次：范围瞬间 ×1.5，造成一次伤害并击退敌人 |
| 被动特性 | 武器栏 1 格；+35% 光环伤害；+25% 光环范围；+40% 技能伤害；+20% 技能冷却缩减；+6 最大生命；+2 元素伤害；周围 170 范围敌人每秒灼烧 |
| 属性修正 | +6 最大生命，+35% 光环伤害，+25% 光环范围，+2 元素伤害，+20% 技能冷却缩减，+40% 技能伤害，武器栏 1 |
| 初始武器 | [咖喱光环](WEAPONS.md#weapon-curry_aura) |
| 主动技能 | [芋泥结界](SKILLS.md#skill-taro)【禁锢领域】冷却 30s — 展开 6 秒芋泥结界，持续灼烧并减速区域内敌人。 |
| 解锁条件 | 达成成就 [进化论（铜）](ACHIEVEMENTS.md#ach-evolutions)：累计进化武器 1 次 |

<a id="char-cabbage"></a>

### 卷心菜老兵 · 不屈老兵

<img src="images/char/cabbage.png" width="96" height="96" alt="">

> 剥掉一层还有一层，怎么也打不倒的老兵。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **层层不倒**：每局可复活 1 次；每 8 秒净化自身减益；每次净化或复活后 5 秒内契合武器攻速 +30% |
| 被动特性 | +8 最大生命；+2 护甲；+2 生命再生；-8% 伤害；受伤时获得 1 层坚韧 |
| 属性修正 | +8 最大生命，+2 生命再生，-8% 全伤害，+2 护甲 |
| 初始武器 | [汤勺](WEAPONS.md#weapon-ladle) |
| 主动技能 | [不倒金身](SKILLS.md#skill-cabbage)【自身增益】冷却 15s — 5 秒屏障（受到伤害 -40%）、5 层坚韧与 3 层再生。 |
| 解锁条件 | 达成成就 [常胜将军（银）](ACHIEVEMENTS.md#ach-wins)：累计通关 10 次 |

<a id="char-blackberry"></a>

### 黑莓女巫 · 诅咒术士

<img src="images/char/blackberry.png" width="96" height="96" alt="">

> 林间的黑莓女巫，低声念咒便让敌人枯萎。

| 项目 | 内容 |
| --- | --- |
| 专属天赋 | **黑暗契约**：命中 20% 概率腐烂、8% 概率诅咒；契合武器打中被诅咒的敌人时，把诅咒传给附近 1 个敌人 |
| 被动特性 | +3 元素伤害；+5 幸运；-2 最大生命；命中附带腐烂与诅咒 |
| 属性修正 | -2 最大生命，+3 元素伤害，+5 幸运 |
| 初始武器 | [火龙果法球](WEAPONS.md#weapon-dragonfruit_orb) |
| 主动技能 | [枯萎咒](SKILLS.md#skill-blackberry)【群体减益】冷却 16s — 诅咒周围敌人，施加 3 层腐烂并沉默 3 秒。 |
| 解锁条件 | 达成成就 [腐烂终结](ACHIEVEMENTS.md#ach-clear_5)：通关第五章，击败腐烂之源 |

---

[README](../README.md) · **角色** · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · [成就](ACHIEVEMENTS.md) · [天赋](TALENTS.md) · [遗物](RELICS.md) · [危机](DANGER.md) · [任务](QUESTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

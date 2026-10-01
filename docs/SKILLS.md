# 技能与状态效果

**中文** · [English](en/SKILLS.md)

[README](../README.md) · [角色](CHARACTERS.md) · **技能** · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · [成就](ACHIEVEMENTS.md) · [天赋](TALENTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

> 由 `npm run docs` 从 `src/data/*.ts` 自动生成，请勿手改。

每名[角色](CHARACTERS.md)拥有一个主动技能（PC 空格 / 移动端右下按钮）。技能分 13 种形态，冷却按威力自动计算。

怪物攻击、道具和武器施加的 Buff / Debuff 与技能共用同一套[状态效果](#statuses)。

## 目录

- [技能规则](#rules)
- [技能形态](#forms)
- [角色技能](#skills)
  - [番茄酱爆（番茄妹）](#skill-tomato)
  - [骑士冲锋（胡萝卜骑士）](#skill-carrot)
  - [烈焰新星（辣椒姐）](#skill-chili)
  - [爆米花弹幕（玉米枪手）](#skill-corn)
  - [西瓜翻滚（西瓜胖墩）](#skill-watermelon)
  - [酸雾隐身（柠檬刺客）](#skill-lemon)
  - [紫雷天罚（茄子法师）](#skill-eggplant)
  - [血之领域（大蒜伯爵）](#skill-garlic)
  - [双子分身（蓝莓双子）](#skill-blueberry)
  - [黄金炮击（菠萝船长）](#skill-pineapple)
  - [灵体化（南瓜幽灵）](#skill-pumpkin)
  - [应援打 Call（草莓偶像）](#skill-strawberry)
  - [瞬影斩（生姜忍者）](#skill-ginger)
  - [核心过载（牛油果博士）](#skill-avocado)
  - [催泪领域（洋葱大叔）](#skill-onion)
  - [孢子云（蘑菇巫医）](#skill-mushroom)
  - [震地拳（椰子拳师）](#skill-coconut)
  - [葡萄分身（葡萄魔术师）](#skill-grape)
  - [双枪连射（樱桃双枪）](#skill-cherry)
  - [豌豆炮台（豌豆士兵）](#skill-pea)
  - [天使祝福（蜜桃天使）](#skill-peach)
  - [龙焰冲锋（火龙果龙骑）](#skill-dragonfruit)
  - [狂暴（甜菜狂战士）](#skill-beet)
  - [穿心箭（芦笋弓手）](#skill-asparagus)
  - [烤红薯盛宴（红薯厨神）](#skill-sweetpotato)
  - [真相只有一个（猕猴桃侦探）](#skill-kiwi)
  - [公主的好运（荔枝公主）](#skill-lychee)
  - [臭气熏天（榴莲霸王）](#skill-durian)
  - [无人机支援（青椒机甲）](#skill-bellpepper)
  - [金钟罩（冬瓜和尚）](#skill-wintermelon)
  - [冰封领域（苦瓜冰法）](#skill-bittermelon)
  - [拔苗助长（豆芽学徒）](#skill-sprout)
  - [冲鼻核弹（山葵爆破手）](#skill-wasabi)
- [状态效果（28 种）](#statuses)
  - [减益](#statuses-debuff)
  - [增益](#statuses-buff)

<a id="rules"></a>

## 技能规则

- 伤害 = 当前所有武器平均单次伤害 × 招式系数 × (1 + 技能伤害%)
- 范围 = 基础半径 × (1 + 射程/600，限制 0.8~1.4) × (1 + 技能范围%)
- 持续时间（领域/增益/无敌/分身/施加的状态）× (1 + 技能持续%)
- 冷却 × (1 − 技能冷却缩减%，最多 −70%)；每波开始时冷却重置，技能立即可用
- 冷却按威力自动计算：`冷却 = (8 + 0.9×伤害分 + 控制分 + 增益分) × 0.65`，限制 8~30 秒（`src/data/skills.ts`）
- 技能强化属性「技能伤害 / 技能范围 / 技能持续 / 技能冷却缩减」来自[道具](ITEMS.md)（技能秘籍、技能法器系列）与升级选项

<a id="forms"></a>

## 技能形态

| 形态 | 角色 |
| --- | --- |
| 周身爆发 `nova` | [番茄酱爆](#skill-tomato)、[烈焰新星](#skill-chili)、[震地拳](#skill-coconut) |
| 突进冲撞 `dash` | [骑士冲锋](#skill-carrot)、[西瓜翻滚](#skill-watermelon)、[瞬影斩](#skill-ginger)、[龙焰冲锋](#skill-dragonfruit) |
| 自身增益 `buff` | [应援打 Call](#skill-strawberry)、[狂暴](#skill-beet)、[公主的好运](#skill-lychee)、[拔苗助长](#skill-sprout) |
| 无敌潜行 `ghost` | [酸雾隐身](#skill-lemon)、[灵体化](#skill-pumpkin)、[金钟罩](#skill-wintermelon) |
| 环形弹幕 `ring` | [爆米花弹幕](#skill-corn) |
| 吸取回复 `heal` | [血之领域](#skill-garlic)、[天使祝福](#skill-peach)、[烤红薯盛宴](#skill-sweetpotato) |
| 多点轰炸 `strikes` | [核心过载](#skill-avocado) |
| 召唤分身 `clone` | [双子分身](#skill-blueberry)、[葡萄分身](#skill-grape)、[无人机支援](#skill-bellpepper) |
| 单体连发 `barrage` | [双枪连射](#skill-cherry)、[豌豆炮台](#skill-pea)、[穿心箭](#skill-asparagus) |
| 发射 AOE `missile` | [黄金炮击](#skill-pineapple)、[冲鼻核弹](#skill-wasabi) |
| 全屏攻击 `screen` | [紫雷天罚](#skill-eggplant) |
| 禁锢领域 `field` | [催泪领域](#skill-onion)、[冰封领域](#skill-bittermelon) |
| 群体减益 `curse` | [孢子云](#skill-mushroom)、[真相只有一个](#skill-kiwi)、[臭气熏天](#skill-durian) |

<a id="skills"></a>

## 角色技能

<a id="skill-tomato"></a>

### 番茄酱爆（番茄妹）

<img src="images/char/tomato.png" width="64" height="64" alt="">

> 炸开番茄酱，造成伤害并减速敌人。

| 项目 | 数值 |
| --- | --- |
| 角色 | [番茄妹](CHARACTERS.md#char-tomato) |
| 形态 | 周身爆发 |
| 冷却 | 17s |
| 伤害系数 | ×2.2 |
| 半径 | 180 |
| 对敌施加 | 3层[减速](#status-slow) 3s |

<a id="skill-carrot"></a>

### 骑士冲锋（胡萝卜骑士）

<img src="images/char/carrot.png" width="64" height="64" alt="">

> 无敌冲锋，撞晕沿途敌人。

| 项目 | 数值 |
| --- | --- |
| 角色 | [胡萝卜骑士](CHARACTERS.md#char-carrot) |
| 形态 | 突进冲撞 |
| 冷却 | 11s |
| 伤害系数 | ×2 |
| 冲刺距离 | 320 |
| 对敌施加 | [眩晕](#status-stun) 0.8s |

<a id="skill-chili"></a>

### 烈焰新星（辣椒姐）

<img src="images/char/chili.png" width="64" height="64" alt="">

> 火焰冲击波，叠加 3 层灼烧。

| 项目 | 数值 |
| --- | --- |
| 角色 | [辣椒姐](CHARACTERS.md#char-chili) |
| 形态 | 周身爆发 |
| 冷却 | 20s |
| 伤害系数 | ×2.2 |
| 半径 | 200 |
| 对敌施加 | 3层[灼烧](#status-burn) 4s |

<a id="skill-corn"></a>

### 爆米花弹幕（玉米枪手）

<img src="images/char/corn.png" width="64" height="64" alt="">

> 向四周发射 18 发爆米花。

| 项目 | 数值 |
| --- | --- |
| 角色 | [玉米枪手](CHARACTERS.md#char-corn) |
| 形态 | 环形弹幕 |
| 冷却 | 8s |
| 伤害系数 | ×0.7 |
| 数量 | 18 |

<a id="skill-watermelon"></a>

### 西瓜翻滚（西瓜胖墩）

<img src="images/char/watermelon.png" width="64" height="64" alt="">

> 翻滚冲撞并回复 10% 生命。

| 项目 | 数值 |
| --- | --- |
| 角色 | [西瓜胖墩](CHARACTERS.md#char-watermelon) |
| 形态 | 突进冲撞 |
| 冷却 | 13s |
| 伤害系数 | ×2 |
| 冲刺距离 | 260 |
| 回复 | 10% 最大生命 |

<a id="skill-lemon"></a>

### 酸雾隐身（柠檬刺客）

<img src="images/char/lemon.png" width="64" height="64" alt="">

> 隐身 3 秒（无敌），暴击 +50%。

| 项目 | 数值 |
| --- | --- |
| 角色 | [柠檬刺客](CHARACTERS.md#char-lemon) |
| 形态 | 无敌潜行 |
| 冷却 | 11s |
| 持续 | 2.5s |
| 属性增益 | +50% 暴击率，+20% 移动速度 |

<a id="skill-eggplant"></a>

### 紫雷天罚（茄子法师）

<img src="images/char/eggplant.png" width="64" height="64" alt="">

> 天雷覆盖全屏，劈中所有敌人并短暂眩晕。

| 项目 | 数值 |
| --- | --- |
| 角色 | [茄子法师](CHARACTERS.md#char-eggplant) |
| 形态 | 全屏攻击 |
| 冷却 | 14s |
| 伤害系数 | ×0.9 |
| 对敌施加 | [眩晕](#status-stun) 0.4s |

<a id="skill-garlic"></a>

### 血之领域（大蒜伯爵）

<img src="images/char/garlic.png" width="64" height="64" alt="">

> 吸取周围敌人生命，施加流血。

| 项目 | 数值 |
| --- | --- |
| 角色 | [大蒜伯爵](CHARACTERS.md#char-garlic) |
| 形态 | 吸取回复 |
| 冷却 | 14s |
| 伤害系数 | ×1 |
| 半径 | 200 |
| 对敌施加 | 3层[流血](#status-bleed) 4s |

<a id="skill-blueberry"></a>

### 双子分身（蓝莓双子）

<img src="images/char/blueberry.png" width="64" height="64" alt="">

> 召唤分身 8 秒自动射击。

| 项目 | 数值 |
| --- | --- |
| 角色 | [蓝莓双子](CHARACTERS.md#char-blueberry) |
| 形态 | 召唤分身 |
| 冷却 | 10s |
| 伤害系数 | ×0.45 |
| 持续 | 8s |

<a id="skill-pineapple"></a>

### 黄金炮击（菠萝船长）

<img src="images/char/pineapple.png" width="64" height="64" alt="">

> 向敌群最密集处发射黄金炮弹，大范围爆炸，击杀必掉番茄籽。

| 项目 | 数值 |
| --- | --- |
| 角色 | [菠萝船长](CHARACTERS.md#char-pineapple) |
| 形态 | 发射 AOE |
| 冷却 | 16s |
| 伤害系数 | ×3.2 |
| 半径 | 150 |

<a id="skill-pumpkin"></a>

### 灵体化（南瓜幽灵）

<img src="images/char/pumpkin.png" width="64" height="64" alt="">

> 无敌 2.5 秒并大幅加速。

| 项目 | 数值 |
| --- | --- |
| 角色 | [南瓜幽灵](CHARACTERS.md#char-pumpkin) |
| 形态 | 无敌潜行 |
| 冷却 | 11s |
| 持续 | 2.5s |
| 属性增益 | +60% 移动速度 |

<a id="skill-strawberry"></a>

### 应援打 Call（草莓偶像）

<img src="images/char/strawberry.png" width="64" height="64" alt="">

> 6 秒内急速 3 层 + 怒气 5 层。

| 项目 | 数值 |
| --- | --- |
| 角色 | [草莓偶像](CHARACTERS.md#char-strawberry) |
| 形态 | 自身增益 |
| 冷却 | 13s |
| 持续 | 6s |
| 自身获得 | 3层[急速](#status-haste) 6s、5层[怒气](#status-rage) 6s |

<a id="skill-ginger"></a>

### 瞬影斩（生姜忍者）

<img src="images/char/ginger.png" width="64" height="64" alt="">

> 突进斩击，施加流血。

| 项目 | 数值 |
| --- | --- |
| 角色 | [生姜忍者](CHARACTERS.md#char-ginger) |
| 形态 | 突进冲撞 |
| 冷却 | 11s |
| 伤害系数 | ×2 |
| 冲刺距离 | 360 |
| 对敌施加 | 2层[流血](#status-bleed) 4s |

<a id="skill-avocado"></a>

### 核心过载（牛油果博士）

<img src="images/char/avocado.png" width="64" height="64" alt="">

> 连环爆炸 5 次。

| 项目 | 数值 |
| --- | --- |
| 角色 | [牛油果博士](CHARACTERS.md#char-avocado) |
| 形态 | 多点轰炸 |
| 冷却 | 11s |
| 伤害系数 | ×1.6 |
| 半径 | 90 |
| 数量 | 5 |

<a id="skill-onion"></a>

### 催泪领域（洋葱大叔）

<img src="images/char/onion.png" width="64" height="64" alt="">

> 释放 5 秒催泪瓦斯区域，区域内敌人大幅减速并致盲。

| 项目 | 数值 |
| --- | --- |
| 角色 | [洋葱大叔](CHARACTERS.md#char-onion) |
| 形态 | 禁锢领域 |
| 冷却 | 12s |
| 伤害系数 | ×0.4 |
| 半径 | 180 |
| 持续 | 5s |
| 对敌施加 | 3层[减速](#status-slow) 1s、[致盲](#status-blind) 1s |

<a id="skill-mushroom"></a>

### 孢子云（蘑菇巫医）

<img src="images/char/mushroom.png" width="64" height="64" alt="">

> 对大范围内敌人施加 5 层中毒与 2 层虚弱。

| 项目 | 数值 |
| --- | --- |
| 角色 | [蘑菇巫医](CHARACTERS.md#char-mushroom) |
| 形态 | 群体减益 |
| 冷却 | 19s |
| 伤害系数 | ×0.3 |
| 半径 | 320 |
| 对敌施加 | 5层[中毒](#status-poison) 6s、2层[虚弱](#status-weaken) 5s |

<a id="skill-coconut"></a>

### 震地拳（椰子拳师）

<img src="images/char/coconut.png" width="64" height="64" alt="">

> 重击地面，眩晕并破甲。

| 项目 | 数值 |
| --- | --- |
| 角色 | [椰子拳师](CHARACTERS.md#char-coconut) |
| 形态 | 周身爆发 |
| 冷却 | 21s |
| 伤害系数 | ×2.2 |
| 半径 | 170 |
| 对敌施加 | [眩晕](#status-stun) 1.2s、3层[破甲](#status-armorBreak) 6s |

<a id="skill-grape"></a>

### 葡萄分身（葡萄魔术师）

<img src="images/char/grape.png" width="64" height="64" alt="">

> 召唤分身 8 秒自动射击。

| 项目 | 数值 |
| --- | --- |
| 角色 | [葡萄魔术师](CHARACTERS.md#char-grape) |
| 形态 | 召唤分身 |
| 冷却 | 10s |
| 伤害系数 | ×0.45 |
| 持续 | 8s |

<a id="skill-cherry"></a>

### 双枪连射（樱桃双枪）

<img src="images/char/cherry.png" width="64" height="64" alt="">

> 对最近的敌人连续射出 12 发子弹。

| 项目 | 数值 |
| --- | --- |
| 角色 | [樱桃双枪](CHARACTERS.md#char-cherry) |
| 形态 | 单体连发 |
| 冷却 | 11s |
| 伤害系数 | ×0.9 |
| 数量 | 12 |

<a id="skill-pea"></a>

### 豌豆炮台（豌豆士兵）

<img src="images/char/pea.png" width="64" height="64" alt="">

> 对最近的敌人高速连发 16 颗豌豆。

| 项目 | 数值 |
| --- | --- |
| 角色 | [豌豆士兵](CHARACTERS.md#char-pea) |
| 形态 | 单体连发 |
| 冷却 | 10s |
| 伤害系数 | ×0.6 |
| 数量 | 16 |

<a id="skill-peach"></a>

### 天使祝福（蜜桃天使）

<img src="images/char/peach.png" width="64" height="64" alt="">

> 回复 20% 生命，无敌 1.5 秒。

| 项目 | 数值 |
| --- | --- |
| 角色 | [蜜桃天使](CHARACTERS.md#char-peach) |
| 形态 | 吸取回复 |
| 冷却 | 21s |
| 伤害系数 | ×1 |
| 半径 | 150 |
| 自身获得 | [无敌](#status-invuln) 1.5s |
| 回复 | 20% 最大生命 |

<a id="skill-dragonfruit"></a>

### 龙焰冲锋（火龙果龙骑）

<img src="images/char/dragonfruit.png" width="64" height="64" alt="">

> 冲锋并在路径上叠加 4 层灼烧。

| 项目 | 数值 |
| --- | --- |
| 角色 | [火龙果龙骑](CHARACTERS.md#char-dragonfruit) |
| 形态 | 突进冲撞 |
| 冷却 | 12s |
| 伤害系数 | ×2 |
| 冲刺距离 | 330 |
| 对敌施加 | 4层[灼烧](#status-burn) 4s |

<a id="skill-beet"></a>

### 狂暴（甜菜狂战士）

<img src="images/char/beet.png" width="64" height="64" alt="">

> 6 秒暴怒（移速、伤害 +30%）与嗜血。

| 项目 | 数值 |
| --- | --- |
| 角色 | [甜菜狂战士](CHARACTERS.md#char-beet) |
| 形态 | 自身增益 |
| 冷却 | 13s |
| 持续 | 6s |
| 自身获得 | [暴怒](#status-enrage) 6s、3层[嗜血](#status-vampiric) 6s |

<a id="skill-asparagus"></a>

### 穿心箭（芦笋弓手）

<img src="images/char/asparagus.png" width="64" height="64" alt="">

> 向生命最高的敌人连射 8 支穿透箭，并标记目标。

| 项目 | 数值 |
| --- | --- |
| 角色 | [芦笋弓手](CHARACTERS.md#char-asparagus) |
| 形态 | 单体连发 |
| 冷却 | 12s |
| 伤害系数 | ×1.3 |
| 数量 | 8 |
| 对敌施加 | [标记](#status-mark) 4s |

<a id="skill-sweetpotato"></a>

### 烤红薯盛宴（红薯厨神）

<img src="images/char/sweetpotato.png" width="64" height="64" alt="">

> 回复 20% 生命，获得 5 层再生。

| 项目 | 数值 |
| --- | --- |
| 角色 | [红薯厨神](CHARACTERS.md#char-sweetpotato) |
| 形态 | 吸取回复 |
| 冷却 | 24s |
| 伤害系数 | ×1 |
| 半径 | 160 |
| 自身获得 | 5层[再生](#status-regen) 6s |
| 回复 | 20% 最大生命 |

<a id="skill-kiwi"></a>

### 真相只有一个（猕猴桃侦探）

<img src="images/char/kiwi.png" width="64" height="64" alt="">

> 看穿全屏敌人：施加标记与 2 层易伤。

| 项目 | 数值 |
| --- | --- |
| 角色 | [猕猴桃侦探](CHARACTERS.md#char-kiwi) |
| 形态 | 群体减益 |
| 冷却 | 15s |
| 伤害系数 | ×0.2 |
| 半径 | 900 |
| 对敌施加 | [标记](#status-mark) 6s、2层[易伤](#status-vulnerable) 6s |

<a id="skill-lychee"></a>

### 公主的好运（荔枝公主）

<img src="images/char/lychee.png" width="64" height="64" alt="">

> 6 秒好运 5 层 + 专注 3 层。

| 项目 | 数值 |
| --- | --- |
| 角色 | [荔枝公主](CHARACTERS.md#char-lychee) |
| 形态 | 自身增益 |
| 冷却 | 10s |
| 持续 | 6s |
| 自身获得 | 5层[好运](#status-lucky) 6s、3层[专注](#status-focus) 6s |

<a id="skill-durian"></a>

### 臭气熏天（榴莲霸王）

<img src="images/char/durian.png" width="64" height="64" alt="">

> 对周围敌人施加中毒、3 层虚弱与混乱。

| 项目 | 数值 |
| --- | --- |
| 角色 | [榴莲霸王](CHARACTERS.md#char-durian) |
| 形态 | 群体减益 |
| 冷却 | 21s |
| 伤害系数 | ×0.4 |
| 半径 | 240 |
| 对敌施加 | 4层[中毒](#status-poison) 5s、3层[虚弱](#status-weaken) 5s、[混乱](#status-confuse) 3s |

<a id="skill-bellpepper"></a>

### 无人机支援（青椒机甲）

<img src="images/char/bellpepper.png" width="64" height="64" alt="">

> 部署无人机 8 秒。

| 项目 | 数值 |
| --- | --- |
| 角色 | [青椒机甲](CHARACTERS.md#char-bellpepper) |
| 形态 | 召唤分身 |
| 冷却 | 10s |
| 伤害系数 | ×0.45 |
| 持续 | 8s |

<a id="skill-wintermelon"></a>

### 金钟罩（冬瓜和尚）

<img src="images/char/wintermelon.png" width="64" height="64" alt="">

> 冥想 2 秒无敌，获得 5 层坚韧。

| 项目 | 数值 |
| --- | --- |
| 角色 | [冬瓜和尚](CHARACTERS.md#char-wintermelon) |
| 形态 | 无敌潜行 |
| 冷却 | 16s |
| 持续 | 2s |
| 自身获得 | 5层[坚韧](#status-fortify) 8s |

<a id="skill-bittermelon"></a>

### 冰封领域（苦瓜冰法）

<img src="images/char/bittermelon.png" width="64" height="64" alt="">

> 在身边展开 5 秒冰封领域，敌人进入后减速并被冻结。

| 项目 | 数值 |
| --- | --- |
| 角色 | [苦瓜冰法](CHARACTERS.md#char-bittermelon) |
| 形态 | 禁锢领域 |
| 冷却 | 16s |
| 伤害系数 | ×0.5 |
| 半径 | 170 |
| 持续 | 5s |
| 对敌施加 | 3层[减速](#status-slow) 1s、[冰冻](#status-freeze) 0.8s（25%） |

<a id="skill-sprout"></a>

### 拔苗助长（豆芽学徒）

<img src="images/char/sprout.png" width="64" height="64" alt="">

> 获得 12 点经验与 5 秒急速。

| 项目 | 数值 |
| --- | --- |
| 角色 | [豆芽学徒](CHARACTERS.md#char-sprout) |
| 形态 | 自身增益 |
| 冷却 | 10s |
| 持续 | 5s |
| 自身获得 | 2层[急速](#status-haste) 5s |
| 经验 | +12 |

<a id="skill-wasabi"></a>

### 冲鼻核弹（山葵爆破手）

<img src="images/char/wasabi.png" width="64" height="64" alt="">

> 向敌群发射山葵核弹，超大范围爆炸并灼烧。

| 项目 | 数值 |
| --- | --- |
| 角色 | [山葵爆破手](CHARACTERS.md#char-wasabi) |
| 形态 | 发射 AOE |
| 冷却 | 23s |
| 伤害系数 | ×2.8 |
| 半径 | 190 |
| 对敌施加 | 3层[灼烧](#status-burn) 4s |

<a id="statuses"></a>

## 状态效果（28 种）

玩家与敌人共用。Boss 对控制类减益有 75% 抗性（精英 50%）；玩家受到的眩晕/冰冻最长 0.8 秒，之后 1.5 秒免疫。

<a id="statuses-debuff"></a>

### 减益

| 状态 | 最大层数 | 效果 |
| --- | --- | --- |
| <a id="status-burn"></a>灼烧 | 5 | 每层每秒受到火焰伤害 |
| <a id="status-poison"></a>中毒 | 8 | 每层每秒受到毒素伤害，可叠加 8 层 |
| <a id="status-bleed"></a>流血 | 5 | 每层每秒流失生命 |
| <a id="status-slow"></a>减速 | 3 | 移动速度降低 |
| <a id="status-freeze"></a>冰冻 | 1 | 无法行动，受到伤害 +20% |
| <a id="status-stun"></a>眩晕 | 1 | 无法行动 |
| <a id="status-weaken"></a>虚弱 | 3 | 造成的伤害降低 |
| <a id="status-vulnerable"></a>易伤 | 3 | 受到的伤害提高 |
| <a id="status-armorBreak"></a>破甲 | 5 | 护甲降低 |
| <a id="status-curse"></a>诅咒 | 1 | 无法回复生命，受到伤害 +10% |
| <a id="status-blind"></a>致盲 | 1 | 射程降低 30%（敌人无法射击） |
| <a id="status-confuse"></a>混乱 | 1 | 移动方向紊乱 |
| <a id="status-sticky"></a>黏液 | 1 | 移动速度大幅降低 |
| <a id="status-mark"></a>标记 | 1 | 下一次受到的攻击必定暴击 |
| <a id="status-silence"></a>沉默 | 1 | 无法释放技能 |
| <a id="status-rot"></a>腐烂 | 3 | 最大生命效果降低，攻速 -10% |

<a id="statuses-buff"></a>

### 增益

| 状态 | 最大层数 | 效果 |
| --- | --- | --- |
| <a id="status-haste"></a>急速 | 3 | 移速与攻速提高 |
| <a id="status-rage"></a>怒气 | 10 | 造成的伤害提高 |
| <a id="status-shield"></a>护盾 | 1 | 抵挡等量伤害 |
| <a id="status-regen"></a>再生 | 5 | 每秒回复生命 |
| <a id="status-fortify"></a>坚韧 | 5 | 护甲提高 |
| <a id="status-invuln"></a>无敌 | 1 | 免疫所有伤害 |
| <a id="status-thorns"></a>荆棘 | 5 | 反弹近身伤害 |
| <a id="status-focus"></a>专注 | 5 | 暴击率提高 |
| <a id="status-barrier"></a>屏障 | 1 | 受到的伤害降低 40% |
| <a id="status-enrage"></a>暴怒 | 1 | 移速 +30%，伤害 +30% |
| <a id="status-lucky"></a>好运 | 5 | 幸运提高 |
| <a id="status-vampiric"></a>嗜血 | 5 | 吸血提高 |

---

[README](../README.md) · [角色](CHARACTERS.md) · **技能** · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · [成就](ACHIEVEMENTS.md) · [天赋](TALENTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

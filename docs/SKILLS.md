# 技能与状态效果

**中文** · [English](en/SKILLS.md)

[README](../README.md) · [角色](CHARACTERS.md) · **技能** · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · [成就](ACHIEVEMENTS.md) · [天赋](TALENTS.md) · [遗物](RELICS.md) · [危机](DANGER.md) · [任务](QUESTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

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
  - [豆兵出阵（黄豆军师）](#skill-soybean)
  - [千刺甲（菠萝蜜卫士）](#skill-jackfruit)
  - [石榴籽爆裂（石榴炮手）](#skill-pomegranate)
  - [芋泥结界（芋头术士）](#skill-taro)
  - [不倒金身（卷心菜老兵）](#skill-cabbage)
  - [枯萎咒（黑莓女巫）](#skill-blackberry)
- [状态效果（33 种）](#statuses)
  - [减益](#statuses-debuff)
  - [增益](#statuses-buff)

<a id="rules"></a>

## 技能规则

- 伤害 = 当前所有武器平均单次伤害 × 招式系数 × (1 + 技能伤害%)
- 范围 = 基础半径 × (1 + 射程/600，限制 0.8~1.4) × (1 + 技能范围%)
- 持续时间（领域/增益/无敌/分身/施加的状态）× (1 + 技能持续%)
- 冷却 × (1 − 技能冷却缩减%，最多 −70%)；每波开始时冷却重置，技能立即可用
- 冷却按威力自动计算：`冷却 = (8 + 0.9×伤害分 + 控制分 + 增益分) × 0.65`，限制 8~30 秒（`src/data/skills.ts`）
- 默认自动释放：按技能形态判断时机（范围伤害等敌人扎堆、回复等掉血、保命技能等危险时）；可在设置中切换为手动，自动模式下也能手动释放
- 技能强化属性「技能伤害 / 技能范围 / 技能持续 / 技能冷却缩减」来自[道具](ITEMS.md)（技能秘籍、技能法器系列）与升级选项

<a id="forms"></a>

## 技能形态

| 形态 | 角色 |
| --- | --- |
| 周身爆发 `nova` | [番茄酱爆](#skill-tomato)、[烈焰新星](#skill-chili)、[震地拳](#skill-coconut) |
| 突进冲撞 `dash` | [骑士冲锋](#skill-carrot)、[西瓜翻滚](#skill-watermelon)、[瞬影斩](#skill-ginger)、[龙焰冲锋](#skill-dragonfruit) |
| 自身增益 `buff` | [应援打 Call](#skill-strawberry)、[狂暴](#skill-beet)、[公主的好运](#skill-lychee)、[拔苗助长](#skill-sprout)、[千刺甲](#skill-jackfruit)、[不倒金身](#skill-cabbage) |
| 无敌潜行 `ghost` | [酸雾隐身](#skill-lemon)、[灵体化](#skill-pumpkin)、[金钟罩](#skill-wintermelon) |
| 环形弹幕 `ring` | [爆米花弹幕](#skill-corn)、[石榴籽爆裂](#skill-pomegranate) |
| 吸取回复 `heal` | [血之领域](#skill-garlic)、[天使祝福](#skill-peach)、[烤红薯盛宴](#skill-sweetpotato) |
| 多点轰炸 `strikes` | [核心过载](#skill-avocado) |
| 召唤分身 `clone` | [双子分身](#skill-blueberry)、[葡萄分身](#skill-grape)、[无人机支援](#skill-bellpepper)、[豆兵出阵](#skill-soybean) |
| 单体连发 `barrage` | [双枪连射](#skill-cherry)、[豌豆炮台](#skill-pea)、[穿心箭](#skill-asparagus) |
| 发射 AOE `missile` | [黄金炮击](#skill-pineapple)、[冲鼻核弹](#skill-wasabi) |
| 全屏攻击 `screen` | [紫雷天罚](#skill-eggplant) |
| 禁锢领域 `field` | [催泪领域](#skill-onion)、[冰封领域](#skill-bittermelon)、[芋泥结界](#skill-taro) |
| 群体减益 `curse` | [孢子云](#skill-mushroom)、[真相只有一个](#skill-kiwi)、[臭气熏天](#skill-durian)、[枯萎咒](#skill-blackberry) |

<a id="skills"></a>

## 角色技能

<a id="skill-tomato"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/tomato.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">番茄酱爆（番茄妹）</th></tr>
<tr><td colspan="2"><i>番茄酱炸开造成 220% 伤害并减速，地面留下 4 秒酱汁，踩中的敌人持续减速。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-tomato">番茄妹</a></td></tr>
<tr><td nowrap>形态</td><td>周身爆发</td></tr>
<tr><td nowrap>冷却</td><td>17s</td></tr>
<tr><td nowrap>伤害系数</td><td>×2.2</td></tr>
<tr><td nowrap>半径</td><td>180</td></tr>
<tr><td nowrap>对敌施加</td><td>3层<a href="#status-slow">减速</a> 3s</td></tr>
</table>

<a id="skill-carrot"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/carrot.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">骑士冲锋（胡萝卜骑士）</th></tr>
<tr><td colspan="2"><i>蓄力后无敌冲锋，撞飞并眩晕沿途敌人，终点再震出冲击波造成二次伤害。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-carrot">胡萝卜骑士</a></td></tr>
<tr><td nowrap>形态</td><td>突进冲撞</td></tr>
<tr><td nowrap>冷却</td><td>11s</td></tr>
<tr><td nowrap>伤害系数</td><td>×2</td></tr>
<tr><td nowrap>冲刺距离</td><td>320</td></tr>
<tr><td nowrap>对敌施加</td><td><a href="#status-stun">眩晕</a> 0.8s</td></tr>
</table>

<a id="skill-chili"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/chili.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">烈焰新星（辣椒姐）</th></tr>
<tr><td colspan="2"><i>火环由内向外扩散，被火线扫过的敌人受到伤害并叠加 3 层灼烧。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-chili">辣椒姐</a></td></tr>
<tr><td nowrap>形态</td><td>周身爆发</td></tr>
<tr><td nowrap>冷却</td><td>20s</td></tr>
<tr><td nowrap>伤害系数</td><td>×2.2</td></tr>
<tr><td nowrap>半径</td><td>200</td></tr>
<tr><td nowrap>对敌施加</td><td>3层<a href="#status-burn">灼烧</a> 4s</td></tr>
</table>

<a id="skill-corn"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/corn.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">爆米花弹幕（玉米枪手）</th></tr>
<tr><td colspan="2"><i>向四周抛出 18 颗玉米粒，落地后炸成爆米花，对落点周围敌人造成 70% 伤害。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-corn">玉米枪手</a></td></tr>
<tr><td nowrap>形态</td><td>环形弹幕</td></tr>
<tr><td nowrap>冷却</td><td>8s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.7</td></tr>
<tr><td nowrap>数量</td><td>18</td></tr>
</table>

<a id="skill-watermelon"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/watermelon.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">西瓜翻滚（西瓜胖墩）</th></tr>
<tr><td colspan="2"><i>化身大西瓜翻滚 0.9 秒，撞墙反弹，反复碾压并撞飞敌人，回复 4.5% 最大生命。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-watermelon">西瓜胖墩</a></td></tr>
<tr><td nowrap>形态</td><td>突进冲撞</td></tr>
<tr><td nowrap>冷却</td><td>13s</td></tr>
<tr><td nowrap>伤害系数</td><td>×2</td></tr>
<tr><td nowrap>冲刺距离</td><td>260</td></tr>
<tr><td nowrap>回复</td><td>4.5% 最大生命</td></tr>
</table>

<a id="skill-lemon"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/lemon.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">酸雾隐身（柠檬刺客）</th></tr>
<tr><td colspan="2"><i>隐身 2.5 秒（无敌），暴击 +50%，原地留下酸雾引走敌人；现身时突袭最近敌人。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-lemon">柠檬刺客</a></td></tr>
<tr><td nowrap>形态</td><td>无敌潜行</td></tr>
<tr><td nowrap>冷却</td><td>11s</td></tr>
<tr><td nowrap>持续</td><td>2.5s</td></tr>
<tr><td nowrap>属性增益</td><td>+50% 暴击率，+10 移动速度</td></tr>
</table>

<a id="skill-eggplant"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/eggplant.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">紫雷天罚（茄子法师）</th></tr>
<tr><td colspan="2"><i>天雷劈中屏幕内所有敌人，造成 90% 伤害并眩晕 0.4 秒。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-eggplant">茄子法师</a></td></tr>
<tr><td nowrap>形态</td><td>全屏攻击</td></tr>
<tr><td nowrap>冷却</td><td>14s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.9</td></tr>
<tr><td nowrap>对敌施加</td><td><a href="#status-stun">眩晕</a> 0.4s</td></tr>
</table>

<a id="skill-garlic"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/skill/garlic.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">血之领域（大蒜伯爵）</th></tr>
<tr><td colspan="2"><i>吸取周围敌人生命造成 100% 伤害并施加 3 层流血，每命中一个敌人回复 1.5% 最大生命（最多 10%）。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-garlic">大蒜伯爵</a></td></tr>
<tr><td nowrap>形态</td><td>吸取回复</td></tr>
<tr><td nowrap>冷却</td><td>14s</td></tr>
<tr><td nowrap>伤害系数</td><td>×1</td></tr>
<tr><td nowrap>半径</td><td>200</td></tr>
<tr><td nowrap>对敌施加</td><td>3层<a href="#status-bleed">流血</a> 4s</td></tr>
<tr><td nowrap>吸取</td><td>每命中 1 个敌人 +0.015 生命（最多 10% 最大生命）</td></tr>
</table>

<a id="skill-blueberry"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/blueberry.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">双子分身（蓝莓双子）</th></tr>
<tr><td colspan="2"><i>召唤 2 个环绕你的分身 8 秒，用你的全部武器以 50% 伤害攻击并挡子弹，倒下或消失时爆炸。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-blueberry">蓝莓双子</a></td></tr>
<tr><td nowrap>形态</td><td>召唤分身</td></tr>
<tr><td nowrap>冷却</td><td>10s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.45</td></tr>
<tr><td nowrap>持续</td><td>8s</td></tr>
</table>

<a id="skill-pineapple"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/pineapple.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">黄金炮击（菠萝船长）</th></tr>
<tr><td colspan="2"><i>连发 3 枚黄金炮弹，依次砸向附近随机 3 个敌人并范围爆炸，炸死的敌人必掉番茄籽。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-pineapple">菠萝船长</a></td></tr>
<tr><td nowrap>形态</td><td>发射 AOE</td></tr>
<tr><td nowrap>冷却</td><td>16s</td></tr>
<tr><td nowrap>伤害系数</td><td>×3.2</td></tr>
<tr><td nowrap>半径</td><td>150</td></tr>
</table>

<a id="skill-pumpkin"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/pumpkin.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">灵体化（南瓜幽灵）</th></tr>
<tr><td colspan="2"><i>灵体化 2.5 秒（无敌），移速 +30%，周围敌人短暂失去目标，穿过敌人时对其造成伤害。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-pumpkin">南瓜幽灵</a></td></tr>
<tr><td nowrap>形态</td><td>无敌潜行</td></tr>
<tr><td nowrap>冷却</td><td>11s</td></tr>
<tr><td nowrap>持续</td><td>2.5s</td></tr>
<tr><td nowrap>属性增益</td><td>+30 移动速度</td></tr>
</table>

<a id="skill-strawberry"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/strawberry.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">应援打 Call（草莓偶像）</th></tr>
<tr><td colspan="2"><i>6 秒内获得急速 3 层（移速、攻速 +30%）与怒气 5 层（伤害 +20%）。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-strawberry">草莓偶像</a></td></tr>
<tr><td nowrap>形态</td><td>自身增益</td></tr>
<tr><td nowrap>冷却</td><td>13s</td></tr>
<tr><td nowrap>持续</td><td>6s</td></tr>
<tr><td nowrap>自身获得</td><td>3层<a href="#status-haste">急速</a> 6s、5层<a href="#status-rage">怒气</a> 6s</td></tr>
</table>

<a id="skill-ginger"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/ginger.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">瞬影斩（生姜忍者）</th></tr>
<tr><td colspan="2"><i>瞬移至前方并留下刀痕，0.35 秒后刀痕爆开，斩击路径上的敌人并施加 2 层流血。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-ginger">生姜忍者</a></td></tr>
<tr><td nowrap>形态</td><td>突进冲撞</td></tr>
<tr><td nowrap>冷却</td><td>11s</td></tr>
<tr><td nowrap>伤害系数</td><td>×2</td></tr>
<tr><td nowrap>冲刺距离</td><td>360</td></tr>
<tr><td nowrap>对敌施加</td><td>2层<a href="#status-bleed">流血</a> 4s</td></tr>
</table>

<a id="skill-avocado"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/avocado.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">核心过载（牛油果博士）</th></tr>
<tr><td colspan="2"><i>在附近随机 5 个敌人身上依次引爆，每次范围爆炸造成 160% 伤害。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-avocado">牛油果博士</a></td></tr>
<tr><td nowrap>形态</td><td>多点轰炸</td></tr>
<tr><td nowrap>冷却</td><td>11s</td></tr>
<tr><td nowrap>伤害系数</td><td>×1.6</td></tr>
<tr><td nowrap>半径</td><td>90</td></tr>
<tr><td nowrap>数量</td><td>5</td></tr>
</table>

<a id="skill-onion"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/skill/onion.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">催泪领域（洋葱大叔）</th></tr>
<tr><td colspan="2"><i>原地释放 5 秒催泪瓦斯，每 0.5 秒对雾中敌人造成 40% 伤害，并大幅减速、致盲（无法射击）。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-onion">洋葱大叔</a></td></tr>
<tr><td nowrap>形态</td><td>禁锢领域</td></tr>
<tr><td nowrap>冷却</td><td>12s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.4</td></tr>
<tr><td nowrap>半径</td><td>180</td></tr>
<tr><td nowrap>持续</td><td>5s</td></tr>
<tr><td nowrap>对敌施加</td><td>3层<a href="#status-slow">减速</a> 1s、<a href="#status-blind">致盲</a> 1s</td></tr>
</table>

<a id="skill-mushroom"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/mushroom.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">孢子云（蘑菇巫医）</th></tr>
<tr><td colspan="2"><i>撒下持续 6 秒的大片孢子云并造成少量伤害，云中敌人每秒叠加中毒与虚弱。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-mushroom">蘑菇巫医</a></td></tr>
<tr><td nowrap>形态</td><td>群体减益</td></tr>
<tr><td nowrap>冷却</td><td>19s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.3</td></tr>
<tr><td nowrap>半径</td><td>320</td></tr>
<tr><td nowrap>对敌施加</td><td>5层<a href="#status-poison">中毒</a> 6s、2层<a href="#status-weaken">虚弱</a> 5s</td></tr>
</table>

<a id="skill-coconut"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/coconut.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">震地拳（椰子拳师）</th></tr>
<tr><td colspan="2"><i>跃起砸地（期间无敌），对周围敌人造成 220% 伤害并震开，眩晕 1.2 秒并施加 3 层破甲。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-coconut">椰子拳师</a></td></tr>
<tr><td nowrap>形态</td><td>周身爆发</td></tr>
<tr><td nowrap>冷却</td><td>21s</td></tr>
<tr><td nowrap>伤害系数</td><td>×2.2</td></tr>
<tr><td nowrap>半径</td><td>170</td></tr>
<tr><td nowrap>对敌施加</td><td><a href="#status-stun">眩晕</a> 1.2s、3层<a href="#status-armorBreak">破甲</a> 6s</td></tr>
</table>

<a id="skill-grape"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/grape.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">葡萄分身（葡萄魔术师）</th></tr>
<tr><td colspan="2"><i>原地留下戴礼帽的幻象 6 秒，吸引敌人追过去，结束时幻象炸开伤害周围敌人。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-grape">葡萄魔术师</a></td></tr>
<tr><td nowrap>形态</td><td>召唤分身</td></tr>
<tr><td nowrap>冷却</td><td>9s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.45</td></tr>
<tr><td nowrap>持续</td><td>6s</td></tr>
</table>

<a id="skill-cherry"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/cherry.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">双枪连射（樱桃双枪）</th></tr>
<tr><td colspan="2"><i>左右手交替连射 12 发子弹，分别锁定最近的两个敌人，每发造成 90% 伤害。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-cherry">樱桃双枪</a></td></tr>
<tr><td nowrap>形态</td><td>单体连发</td></tr>
<tr><td nowrap>冷却</td><td>11s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.9</td></tr>
<tr><td nowrap>数量</td><td>12</td></tr>
</table>

<a id="skill-pea"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/pea.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">豌豆炮台（豌豆士兵）</th></tr>
<tr><td colspan="2"><i>在脚下种下一座豌豆炮台，5 秒内自动向最近的敌人连发 20 颗豌豆。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-pea">豌豆士兵</a></td></tr>
<tr><td nowrap>形态</td><td>单体连发</td></tr>
<tr><td nowrap>冷却</td><td>10s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.6</td></tr>
<tr><td nowrap>数量</td><td>16</td></tr>
</table>

<a id="skill-peach"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/skill/peach.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">天使祝福（蜜桃天使）</th></tr>
<tr><td colspan="2"><i>降下圣光，对周围敌人造成 100% 伤害，无敌 1.5 秒，并分 3 次回复共 9% 最大生命。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-peach">蜜桃天使</a></td></tr>
<tr><td nowrap>形态</td><td>吸取回复</td></tr>
<tr><td nowrap>冷却</td><td>21s</td></tr>
<tr><td nowrap>伤害系数</td><td>×1</td></tr>
<tr><td nowrap>半径</td><td>150</td></tr>
<tr><td nowrap>自身获得</td><td><a href="#status-invuln">无敌</a> 1.5s</td></tr>
<tr><td nowrap>回复</td><td>9% 最大生命</td></tr>
<tr><td nowrap>吸取</td><td>每命中 1 个敌人 +0.015 生命（最多 10% 最大生命）</td></tr>
</table>

<a id="skill-dragonfruit"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/dragonfruit.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">龙焰冲锋（火龙果龙骑）</th></tr>
<tr><td colspan="2"><i>冲锋点燃路径，叠加 4 层灼烧，并留下约 3 秒火焰带，持续灼伤踏入的敌人。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-dragonfruit">火龙果龙骑</a></td></tr>
<tr><td nowrap>形态</td><td>突进冲撞</td></tr>
<tr><td nowrap>冷却</td><td>12s</td></tr>
<tr><td nowrap>伤害系数</td><td>×2</td></tr>
<tr><td nowrap>冲刺距离</td><td>330</td></tr>
<tr><td nowrap>对敌施加</td><td>4层<a href="#status-burn">灼烧</a> 5s</td></tr>
</table>

<a id="skill-beet"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/beet.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">狂暴（甜菜狂战士）</th></tr>
<tr><td colspan="2"><i>6 秒内获得暴怒（移速、伤害 +30%）与嗜血 3 层（吸血概率 +12%）。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-beet">甜菜狂战士</a></td></tr>
<tr><td nowrap>形态</td><td>自身增益</td></tr>
<tr><td nowrap>冷却</td><td>13s</td></tr>
<tr><td nowrap>持续</td><td>6s</td></tr>
<tr><td nowrap>自身获得</td><td><a href="#status-enrage">暴怒</a> 6s、3层<a href="#status-vampiric">嗜血</a> 6s</td></tr>
</table>

<a id="skill-asparagus"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/asparagus.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">穿心箭（芦笋弓手）</th></tr>
<tr><td colspan="2"><i>蓄力 0.4 秒后朝生命最高的敌人射出贯穿直线的巨型穿心箭，造成高额伤害并标记命中敌人。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-asparagus">芦笋弓手</a></td></tr>
<tr><td nowrap>形态</td><td>单体连发</td></tr>
<tr><td nowrap>冷却</td><td>12s</td></tr>
<tr><td nowrap>伤害系数</td><td>×1.3</td></tr>
<tr><td nowrap>数量</td><td>8</td></tr>
<tr><td nowrap>对敌施加</td><td><a href="#status-mark">标记</a> 4s</td></tr>
</table>

<a id="skill-sweetpotato"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/skill/sweetpotato.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">烤红薯盛宴（红薯厨神）</th></tr>
<tr><td colspan="2"><i>震击周围敌人，抛出 3 个烤红薯，8 秒内拾取共回复 10.8% 最大生命，并获得 5 层再生。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-sweetpotato">红薯厨神</a></td></tr>
<tr><td nowrap>形态</td><td>吸取回复</td></tr>
<tr><td nowrap>冷却</td><td>24s</td></tr>
<tr><td nowrap>伤害系数</td><td>×1</td></tr>
<tr><td nowrap>半径</td><td>160</td></tr>
<tr><td nowrap>自身获得</td><td>5层<a href="#status-regen">再生</a> 6s</td></tr>
<tr><td nowrap>回复</td><td>9% 最大生命</td></tr>
<tr><td nowrap>吸取</td><td>每命中 1 个敌人 +0.015 生命（最多 10% 最大生命）</td></tr>
</table>

<a id="skill-kiwi"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/kiwi.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">真相只有一个（猕猴桃侦探）</th></tr>
<tr><td colspan="2"><i>放大镜扫过全屏，对屏内所有敌人造成少量伤害，施加标记与 2 层易伤 6 秒。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-kiwi">猕猴桃侦探</a></td></tr>
<tr><td nowrap>形态</td><td>群体减益</td></tr>
<tr><td nowrap>冷却</td><td>15s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.2</td></tr>
<tr><td nowrap>半径</td><td>900</td></tr>
<tr><td nowrap>对敌施加</td><td><a href="#status-mark">标记</a> 6s、2层<a href="#status-vulnerable">易伤</a> 6s</td></tr>
</table>

<a id="skill-lychee"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/lychee.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">公主的好运（荔枝公主）</th></tr>
<tr><td colspan="2"><i>四叶草绕身旋转 6 秒，期间获得 5 层好运与 3 层专注。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-lychee">荔枝公主</a></td></tr>
<tr><td nowrap>形态</td><td>自身增益</td></tr>
<tr><td nowrap>冷却</td><td>10s</td></tr>
<tr><td nowrap>持续</td><td>6s</td></tr>
<tr><td nowrap>自身获得</td><td>5层<a href="#status-lucky">好运</a> 6s、3层<a href="#status-focus">专注</a> 6s</td></tr>
</table>

<a id="skill-durian"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/durian.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">臭气熏天（榴莲霸王）</th></tr>
<tr><td colspan="2"><i>臭气随身 5 秒，周围敌人每秒被施加中毒、虚弱与混乱，释放时造成少量伤害。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-durian">榴莲霸王</a></td></tr>
<tr><td nowrap>形态</td><td>群体减益</td></tr>
<tr><td nowrap>冷却</td><td>21s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.4</td></tr>
<tr><td nowrap>半径</td><td>240</td></tr>
<tr><td nowrap>对敌施加</td><td>4层<a href="#status-poison">中毒</a> 5s、3层<a href="#status-weaken">虚弱</a> 5s、<a href="#status-confuse">混乱</a> 3s</td></tr>
</table>

<a id="skill-bellpepper"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/bellpepper.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">无人机支援（青椒机甲）</th></tr>
<tr><td colspan="2"><i>部署一架无人机跟随 8 秒，每 0.35 秒用激光点射最近的敌人，造成 45% 伤害。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-bellpepper">青椒机甲</a></td></tr>
<tr><td nowrap>形态</td><td>召唤分身</td></tr>
<tr><td nowrap>冷却</td><td>10s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.45</td></tr>
<tr><td nowrap>持续</td><td>8s</td></tr>
</table>

<a id="skill-wintermelon"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/wintermelon.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">金钟罩（冬瓜和尚）</th></tr>
<tr><td colspan="2"><i>罩下金钟 2 秒无敌，持续震开靠近的敌人（首领除外），并获得 5 层坚韧。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-wintermelon">冬瓜和尚</a></td></tr>
<tr><td nowrap>形态</td><td>无敌潜行</td></tr>
<tr><td nowrap>冷却</td><td>16s</td></tr>
<tr><td nowrap>持续</td><td>2s</td></tr>
<tr><td nowrap>自身获得</td><td>5层<a href="#status-fortify">坚韧</a> 8s</td></tr>
</table>

<a id="skill-bittermelon"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/skill/bittermelon.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">冰封领域（苦瓜冰法）</th></tr>
<tr><td colspan="2"><i>展开 5 秒冰面，每 0.5 秒对区域内敌人造成 50% 伤害并减速，25% 几率冰冻。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-bittermelon">苦瓜冰法</a></td></tr>
<tr><td nowrap>形态</td><td>禁锢领域</td></tr>
<tr><td nowrap>冷却</td><td>16s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.5</td></tr>
<tr><td nowrap>半径</td><td>170</td></tr>
<tr><td nowrap>持续</td><td>5s</td></tr>
<tr><td nowrap>对敌施加</td><td>3层<a href="#status-slow">减速</a> 1s、<a href="#status-freeze">冰冻</a> 0.8s（25%）</td></tr>
</table>

<a id="skill-sprout"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/sprout.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">拔苗助长（豆芽学徒）</th></tr>
<tr><td colspan="2"><i>身体猛地长高，5 秒内打怪经验 +30%，并获得 5 秒 2 层急速。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-sprout">豆芽学徒</a></td></tr>
<tr><td nowrap>形态</td><td>自身增益</td></tr>
<tr><td nowrap>冷却</td><td>10s</td></tr>
<tr><td nowrap>持续</td><td>5s</td></tr>
<tr><td nowrap>自身获得</td><td>2层<a href="#status-haste">急速</a> 5s</td></tr>
<tr><td nowrap>打怪经验</td><td>+30%</td></tr>
</table>

<a id="skill-wasabi"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/wasabi.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">冲鼻核弹（山葵爆破手）</th></tr>
<tr><td colspan="2"><i>向敌群最密处投下山葵核弹，短暂倒数后大爆炸，留下 3 秒毒地持续伤害并灼烧。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-wasabi">山葵爆破手</a></td></tr>
<tr><td nowrap>形态</td><td>发射 AOE</td></tr>
<tr><td nowrap>冷却</td><td>23s</td></tr>
<tr><td nowrap>伤害系数</td><td>×2.8</td></tr>
<tr><td nowrap>半径</td><td>190</td></tr>
<tr><td nowrap>对敌施加</td><td>3层<a href="#status-burn">灼烧</a> 4s</td></tr>
</table>

<a id="skill-soybean"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/soybean.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">豆兵出阵（黄豆军师）</th></tr>
<tr><td colspan="2"><i>在自身周围 8 个方向各召唤 1 名豆兵，持续 10 秒，自动冲向附近敌人近身肉搏，每击造成 54% 伤害。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-soybean">黄豆军师</a></td></tr>
<tr><td nowrap>形态</td><td>召唤分身</td></tr>
<tr><td nowrap>冷却</td><td>14s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.6</td></tr>
<tr><td nowrap>持续</td><td>10s</td></tr>
</table>

<a id="skill-jackfruit"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/jackfruit.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">千刺甲（菠萝蜜卫士）</th></tr>
<tr><td colspan="2"><i>一圈尖刺绕身旋转 6 秒，持续扎伤贴身敌人；同时获得 5 层荆棘与 3 层坚韧。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-jackfruit">菠萝蜜卫士</a></td></tr>
<tr><td nowrap>形态</td><td>自身增益</td></tr>
<tr><td nowrap>冷却</td><td>12s</td></tr>
<tr><td nowrap>持续</td><td>6s</td></tr>
<tr><td nowrap>自身获得</td><td>5层<a href="#status-thorns">荆棘</a> 6s、3层<a href="#status-fortify">坚韧</a> 6s</td></tr>
</table>

<a id="skill-pomegranate"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/pomegranate.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">石榴籽爆裂（石榴炮手）</th></tr>
<tr><td colspan="2"><i>石榴籽双股螺旋喷射约 1 秒，共射出 30 颗可穿透的籽弹，各造成 50% 伤害。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-pomegranate">石榴炮手</a></td></tr>
<tr><td nowrap>形态</td><td>环形弹幕</td></tr>
<tr><td nowrap>冷却</td><td>8s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.5</td></tr>
<tr><td nowrap>数量</td><td>30</td></tr>
</table>

<a id="skill-taro"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/skill/taro.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">芋泥结界（芋头术士）</th></tr>
<tr><td colspan="2"><i>展开 6 秒芋泥结界，每 0.5 秒造成 100% 伤害并灼烧减速，挡住飞入结界的敌弹。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-taro">芋头术士</a></td></tr>
<tr><td nowrap>形态</td><td>禁锢领域</td></tr>
<tr><td nowrap>冷却</td><td>27s</td></tr>
<tr><td nowrap>伤害系数</td><td>×1</td></tr>
<tr><td nowrap>半径</td><td>230</td></tr>
<tr><td nowrap>持续</td><td>6s</td></tr>
<tr><td nowrap>对敌施加</td><td>2层<a href="#status-burn">灼烧</a> 2s、2层<a href="#status-slow">减速</a> 1s</td></tr>
</table>

<a id="skill-cabbage"></a>

<table>
<tr><td rowspan="7" align="center" valign="middle"><img src="images/skill/cabbage.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">不倒金身（卷心菜老兵）</th></tr>
<tr><td colspan="2"><i>层层菜叶包身 5 秒，获得屏障（受到伤害 -40%）、5 层坚韧与 3 层再生。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-cabbage">卷心菜老兵</a></td></tr>
<tr><td nowrap>形态</td><td>自身增益</td></tr>
<tr><td nowrap>冷却</td><td>15s</td></tr>
<tr><td nowrap>持续</td><td>5s</td></tr>
<tr><td nowrap>自身获得</td><td><a href="#status-barrier">屏障</a> 5s、5层<a href="#status-fortify">坚韧</a> 5s、3层<a href="#status-regen">再生</a> 5s</td></tr>
</table>

<a id="skill-blackberry"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/skill/blackberry.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">枯萎咒（黑莓女巫）</th></tr>
<tr><td colspan="2"><i>在周围展开 6 秒瘴气法阵，区域内敌人每秒被施加诅咒、3 层腐烂与沉默。</i></td></tr>
<tr><td nowrap>角色</td><td><a href="CHARACTERS.md#char-blackberry">黑莓女巫</a></td></tr>
<tr><td nowrap>形态</td><td>群体减益</td></tr>
<tr><td nowrap>冷却</td><td>16s</td></tr>
<tr><td nowrap>伤害系数</td><td>×0.3</td></tr>
<tr><td nowrap>半径</td><td>280</td></tr>
<tr><td nowrap>对敌施加</td><td><a href="#status-curse">诅咒</a> 6s、3层<a href="#status-rot">腐烂</a> 6s、<a href="#status-silence">沉默</a> 3s</td></tr>
</table>

<a id="statuses"></a>

## 状态效果（33 种）

玩家与敌人共用。Boss 对控制类减益有 75% 抗性（精英 50%）；玩家受到的眩晕/冰冻最长 0.8 秒，之后 1.5 秒免疫。

<a id="statuses-debuff"></a>

### 减益

| 状态 | 最大层数 | 效果 |
| --- | --- | --- |
| <a id="status-burn"></a>灼烧 | 5 | 每层每秒受到火焰伤害 |
| <a id="status-poison"></a>中毒 | 8 | 每层每秒受到毒素伤害，可叠加 8 层 |
| <a id="status-bleed"></a>流血 | 5 | 每层每秒流失生命 |
| <a id="status-slow"></a>减速 | 3 | 移动速度降低 |
| <a id="status-suppress"></a>压制 | 3 | 被火力压制，每层移速 -5% |
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
| <a id="status-soaked"></a>浸湿 | 3 | 每层移速 -10%、攻速 -8%，最多 3 层 |
| <a id="status-corrode"></a>腐蚀 | 4 | 每层每秒受到酸蚀伤害，受到伤害 +6%，最多 4 层 |

<a id="statuses-buff"></a>

### 增益

| 状态 | 最大层数 | 效果 |
| --- | --- | --- |
| <a id="status-haste"></a>急速 | 3 | 移速与攻速提高 |
| <a id="status-rage"></a>怒气 | 10 | 造成的伤害提高 |
| <a id="status-shield"></a>护盾 | 1 | 抵挡等量伤害 |
| <a id="status-regen"></a>再生 | 5 | 每层每秒回复 1 生命 |
| <a id="status-fortify"></a>坚韧 | 5 | 护甲提高 |
| <a id="status-invuln"></a>无敌 | 1 | 免疫所有伤害 |
| <a id="status-thorns"></a>荆棘 | 5 | 反弹近身伤害 |
| <a id="status-focus"></a>专注 | 5 | 暴击率提高 |
| <a id="status-barrier"></a>屏障 | 1 | 受到的伤害降低 40% |
| <a id="status-enrage"></a>暴怒 | 1 | 移速 +30%，伤害 +30% |
| <a id="status-lucky"></a>好运 | 5 | 幸运提高 |
| <a id="status-vampiric"></a>嗜血 | 5 | 吸血概率每层 +4% |
| <a id="status-tailwind"></a>顺风 | 3 | 每层移速 +12%、闪避 +4%，最多 3 层 |
| <a id="status-hardened"></a>硬化 | 2 | 每层护甲 +3、受到伤害 -10%，最多 2 层 |

---

[README](../README.md) · [角色](CHARACTERS.md) · **技能** · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · [成就](ACHIEVEMENTS.md) · [天赋](TALENTS.md) · [遗物](RELICS.md) · [危机](DANGER.md) · [任务](QUESTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

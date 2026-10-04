# 成就（1178 项）

**中文** · [English](en/ACHIEVEMENTS.md)

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · **成就** · [天赋](TALENTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

> 由 `npm run docs` 从 `src/data/*.ts` 自动生成，请勿手改。

成就分为多个等级（🥉 铜 → 🥈 银 → 🥇 金 → 💎 钻石，单级成就直接为金牌），每达成一级获得成就点，全部成就点共 NaN 点。

除默认的 4 名外，每名[角色](CHARACTERS.md)都绑定一项成就，达成该成就的指定等级后自动解锁；成就点只作为累计成绩展示。解锁时屏幕顶部会弹出提示，主菜单「成就」可查看全部进度，可解锁角色的成就会标出 🔓。

## 目录

- [角色价格](#prices)
- [战斗](#cat-combat)
- [怪物](#cat-monster)
- [进度](#cat-progress)
- [章节](#cat-chapter)
- [挑战](#cat-challenge)
- [构筑](#cat-build)
- [武器](#cat-arsenal)
- [收藏](#cat-collection)
- [技能](#cat-skill)
- [经济](#cat-economy)
- [图鉴](#cat-codex)
- [无尽](#cat-endless)
- [Boss](#cat-slayer)
- [角色](#cat-character)

<a id="prices"></a>

## 角色价格

| 角色 | 解锁方式 |
| --- | --- |
| <img src="images/char/tomato.png" width="32" height="32" alt=""> [番茄妹](CHARACTERS.md#char-tomato) | 默认解锁 |
| <img src="images/char/carrot.png" width="32" height="32" alt=""> [胡萝卜骑士](CHARACTERS.md#char-carrot) | 默认解锁 |
| <img src="images/char/chili.png" width="32" height="32" alt=""> [辣椒姐](CHARACTERS.md#char-chili) | 默认解锁 |
| <img src="images/char/corn.png" width="32" height="32" alt=""> [玉米枪手](CHARACTERS.md#char-corn) | 默认解锁 |
| <img src="images/char/watermelon.png" width="32" height="32" alt=""> [西瓜胖墩](CHARACTERS.md#char-watermelon) | 达成成就 [水果补给（银）](#ach-fruits)：累计吃到 50 个果实 |
| <img src="images/char/lemon.png" width="32" height="32" alt=""> [柠檬刺客](CHARACTERS.md#char-lemon) | 达成成就 [会心一击（铜）](#ach-crits)：累计造成 100 次暴击 |
| <img src="images/char/eggplant.png" width="32" height="32" alt=""> [茄子法师](CHARACTERS.md#char-eggplant) | 达成成就 [大招成瘾（银）](#ach-casts)：累计释放 100 次技能 |
| <img src="images/char/garlic.png" width="32" height="32" alt=""> [大蒜伯爵](CHARACTERS.md#char-garlic) | 达成成就 [精英猎手（银）](#ach-elites)：累计击败 10 名精英 |
| <img src="images/char/blueberry.png" width="32" height="32" alt=""> [蓝莓双子](CHARACTERS.md#char-blueberry) | 达成成就 [多面手（铜）](#ach-chars_won)：用 3 名不同角色通关 |
| <img src="images/char/pineapple.png" width="32" height="32" alt=""> [菠萝船长](CHARACTERS.md#char-pineapple) | 达成成就 [小有积蓄（铜）](#ach-rich)：同时持有 200 番茄籽 |
| <img src="images/char/pumpkin.png" width="32" height="32" alt=""> [南瓜幽灵](CHARACTERS.md#char-pumpkin) | 达成成就 [菜园守护者](#ach-clear_2)：通关第二章 |
| <img src="images/char/strawberry.png" width="32" height="32" alt=""> [草莓偶像](CHARACTERS.md#char-strawberry) | 达成成就 [茁壮成长（银）](#ach-level)：单局达到 20 级 |
| <img src="images/char/ginger.png" width="32" height="32" alt=""> [生姜忍者](CHARACTERS.md#char-ginger) | 达成成就 [毫发无伤（银）](#ach-perfect)：累计 10 次无伤完成波次 |
| <img src="images/char/avocado.png" width="32" height="32" alt=""> [牛油果博士](CHARACTERS.md#char-avocado) | 达成成就 [神兵利器（铜）](#ach-t4)：累计合成 1 把 T4 武器 |
| <img src="images/char/onion.png" width="32" height="32" alt=""> [洋葱大叔](CHARACTERS.md#char-onion) | 达成成就 [屡败屡战（银）](#ach-deaths)：累计阵亡 10 次 |
| <img src="images/char/mushroom.png" width="32" height="32" alt=""> [蘑菇巫医](CHARACTERS.md#char-mushroom) | 达成成就 [中毒专家（铜）](#ach-inflict_poison)：对敌人施加 50 次【中毒】 |
| <img src="images/char/coconut.png" width="32" height="32" alt=""> [椰子拳师](CHARACTERS.md#char-coconut) | 达成成就 [厨房清扫](#ach-clear_1)：通关第一章 |
| <img src="images/char/grape.png" width="32" height="32" alt=""> [葡萄魔术师](CHARACTERS.md#char-grape) | 达成成就 [开箱达人（银）](#ach-crates)：累计打开 50 个宝箱 |
| <img src="images/char/cherry.png" width="32" height="32" alt=""> [樱桃双枪](CHARACTERS.md#char-cherry) | 达成成就 [枪械套装（铜）](#ach-set_枪械)：单局持有 2 把【枪械】武器 |
| <img src="images/char/pea.png" width="32" height="32" alt=""> [豌豆士兵](CHARACTERS.md#char-pea) | 达成成就 [番茄酱风暴（银）](#ach-kills)：累计击败 1,000 只怪物 |
| <img src="images/char/peach.png" width="32" height="32" alt=""> [蜜桃天使](CHARACTERS.md#char-peach) | 达成成就 [凤凰涅槃](#ach-revive)：在战斗中复活 1 次 |
| <img src="images/char/dragonfruit.png" width="32" height="32" alt=""> [火龙果龙骑](CHARACTERS.md#char-dragonfruit) | 达成成就 [灼烧专家（银）](#ach-inflict_burn)：对敌人施加 1,000 次【灼烧】 |
| <img src="images/char/beet.png" width="32" height="32" alt=""> [甜菜狂战士](CHARACTERS.md#char-beet) | 达成成就 [割草机（银）](#ach-run_kills)：单局击败 800 只怪物 |
| <img src="images/char/asparagus.png" width="32" height="32" alt=""> [芦笋弓手](CHARACTERS.md#char-asparagus) | 达成成就 [一击必杀（银）](#ach-max_hit)：单次造成 5,000 点伤害 |
| <img src="images/char/sweetpotato.png" width="32" height="32" alt=""> [红薯厨神](CHARACTERS.md#char-sweetpotato) | 达成成就 [厨具套装（银）](#ach-set_厨具)：单局持有 4 把【厨具】武器 |
| <img src="images/char/kiwi.png" width="32" height="32" alt=""> [猕猴桃侦探](CHARACTERS.md#char-kiwi) | 达成成就 [怪物学者（铜）](#ach-codex_monsters)：在图鉴中发现 20 种小怪 |
| <img src="images/char/lychee.png" width="32" height="32" alt=""> [荔枝公主](CHARACTERS.md#char-lychee) | 达成成就 [番茄大亨（银）](#ach-earned)：累计获得 20,000 番茄籽 |
| <img src="images/char/durian.png" width="32" height="32" alt=""> [榴莲霸王](CHARACTERS.md#char-durian) | 达成成就 [Boss 终结者（银）](#ach-bosses)：累计击败 5 名 Boss |
| <img src="images/char/bellpepper.png" width="32" height="32" alt=""> [青椒机甲](CHARACTERS.md#char-bellpepper) | 达成成就 [垃圾场之王](#ach-clear_4)：通关第四章 |
| <img src="images/char/wintermelon.png" width="32" height="32" alt=""> [冬瓜和尚](CHARACTERS.md#char-wintermelon) | 达成成就 [绝地反击（铜）](#ach-overtime)：在 Boss 狂暴后将其击败 1 次 |
| <img src="images/char/bittermelon.png" width="32" height="32" alt=""> [苦瓜冰法](CHARACTERS.md#char-bittermelon) | 达成成就 [破冰者](#ach-clear_3)：通关第三章 |
| <img src="images/char/sprout.png" width="32" height="32" alt=""> [豆芽学徒](CHARACTERS.md#char-sprout) | 达成成就 [步步高升（银）](#ach-levelups)：累计升级选择 200 次属性 |
| <img src="images/char/wasabi.png" width="32" height="32" alt=""> [山葵爆破手](CHARACTERS.md#char-wasabi) | 达成成就 [爆破套装（银）](#ach-set_爆破)：单局持有 4 把【爆破】武器 |
| <img src="images/char/soybean.png" width="32" height="32" alt=""> [黄豆军师](CHARACTERS.md#char-soybean) | 达成成就 [全员集结（银）](#ach-chars_owned)：拥有 20 名角色 |
| <img src="images/char/jackfruit.png" width="32" height="32" alt=""> [菠萝蜜卫士](CHARACTERS.md#char-jackfruit) | 达成成就 [精英怪克星（银）](#ach-champions)：累计击败 50 只词缀精英怪 |
| <img src="images/char/pomegranate.png" width="32" height="32" alt=""> [石榴炮手](CHARACTERS.md#char-pomegranate) | 达成成就 [番茄酱风暴（金）](#ach-kills)：累计击败 10,000 只怪物 |
| <img src="images/char/taro.png" width="32" height="32" alt=""> [芋头术士](CHARACTERS.md#char-taro) | 达成成就 [进化论（铜）](#ach-evolutions)：累计进化武器 1 次 |
| <img src="images/char/cabbage.png" width="32" height="32" alt=""> [卷心菜老兵](CHARACTERS.md#char-cabbage) | 达成成就 [常胜将军（银）](#ach-wins)：累计通关 10 次 |
| <img src="images/char/blackberry.png" width="32" height="32" alt=""> [黑莓女巫](CHARACTERS.md#char-blackberry) | 达成成就 [腐烂终结](#ach-clear_5)：通关第五章，击败腐烂之源 |

<a id="cat-combat"></a>

## 战斗

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-kills"></a>🔪 番茄酱风暴 | 累计击败 N 只怪物 | 🥉 100（+2 点 · 天赋点 +1）<br>🥈 1,000（+6 点 · 天赋点 +1）<br>🥇 10,000（+20 点 · 天赋点 +1）<br>💎 50,000（+60 点 · 天赋点 +2） |
| <a id="ach-run_kills"></a>🌪️ 割草机 | 单局击败 N 只怪物 | 🥉 300（+3 点）<br>🥈 800（+10 点）<br>🥇 1,500（+30 点） |
| <a id="ach-perfect"></a>🛡️ 毫发无伤 | 累计 N 次无伤完成波次 | 🥉 1（+2 点）<br>🥈 10（+8 点 · 天赋点 +1）<br>🥇 50（+25 点 · 天赋点 +1）<br>💎 200（+60 点 · 天赋点 +1） |
| <a id="ach-revive"></a>🔥 凤凰涅槃 | 在战斗中复活 1 次 | 🥇 1（+5 点） |
| <a id="ach-crits"></a>💥 会心一击 | 累计造成 N 次暴击 | 🥉 100（+1 点）<br>🥈 5,000（+5 点）<br>🥇 100,000（+20 点） |
| <a id="ach-max_hit"></a>🔨 一击必杀 | 单次造成 N 点伤害 | 🥉 500（+2 点）<br>🥈 5,000（+8 点）<br>🥇 50,000（+25 点）<br>💎 500,000（+60 点） |
| <a id="ach-champions"></a>✨ 精英怪克星 | 累计击败 N 只词缀精英怪 | 🥉 1（+1 点）<br>🥈 50（+5 点）<br>🥇 500（+20 点） |
| <a id="ach-waves"></a>🌊 波涛不息 | 累计完成 N 个波次 | 🥉 10（+2 点）<br>🥈 100（+10 点）<br>🥇 1,000（+40 点） |
| <a id="ach-casts"></a>🌟 大招成瘾 | 累计释放 N 次技能 | 🥉 1（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-fruits"></a>🍎 水果补给 | 累计吃到 N 个果实 | 🥉 1（+1 点）<br>🥈 50（+4 点）<br>🥇 500（+15 点） |

<a id="cat-monster"></a>

## 怪物

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-kill_mold"></a>👾 霉菌团克星 | 击败 N 只霉菌团 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_fly"></a>👾 果蝇克星 | 击败 N 只果蝇 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_maggot"></a>👾 蛆虫克星 | 击败 N 只蛆虫 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_rotten_apple"></a>👾 烂苹果克星 | 击败 N 只烂苹果 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_cockroach"></a>👾 蟑螂克星 | 击败 N 只蟑螂 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_ant"></a>👾 行军蚁克星 | 击败 N 只行军蚁 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_beetle"></a>👾 炸弹甲虫克星 | 击败 N 只炸弹甲虫 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_snail"></a>👾 鼻涕蜗牛克星 | 击败 N 只鼻涕蜗牛 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_spider"></a>👾 毒蜘蛛克星 | 击败 N 只毒蜘蛛 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_splitter"></a>👾 分裂霉菌克星 | 击败 N 只分裂霉菌 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_mushroom"></a>👾 毒蘑菇克星 | 击败 N 只毒蘑菇 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_brood"></a>👾 虫母克星 | 击败 N 只虫母 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_rat"></a>👾 下水道老鼠克星 | 击败 N 只下水道老鼠 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_ice_cube"></a>👾 冰块怪克星 | 击败 N 只冰块怪 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_trash_bag"></a>👾 垃圾袋怪克星 | 击败 N 只垃圾袋怪 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_robot_can"></a>👾 罐头机器人克星 | 击败 N 只罐头机器人 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_bee"></a>👾 毒蜂克星 | 击败 N 只毒蜂 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_worm"></a>👾 泥蚯蚓克星 | 击败 N 只泥蚯蚓 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_frost_mosquito"></a>👾 冰蚊克星 | 击败 N 只冰蚊 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_frozen_shrimp"></a>👾 冻虾兵克星 | 击败 N 只冻虾兵 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_can_crab"></a>👾 易拉罐蟹克星 | 击败 N 只易拉罐蟹 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_rag_ghost"></a>👾 抹布幽灵克星 | 击败 N 只抹布幽灵 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_oil_blob"></a>👾 油污怪克星 | 击败 N 只油污怪 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_gear_bug"></a>👾 齿轮虫克星 | 击败 N 只齿轮虫 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_curse_doll"></a>👾 诅咒娃娃克星 | 击败 N 只诅咒娃娃 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_burnt_toast"></a>👾 焦吐司克星 | 击败 N 只焦吐司 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_grease_drop"></a>👾 油滴精克星 | 击败 N 只油滴精 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_dust_bunny"></a>👾 灰尘团克星 | 击败 N 只灰尘团 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_sour_milk"></a>👾 酸奶盒克星 | 击败 N 只酸奶盒 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_crumb_mite"></a>👾 面包屑螨克星 | 击败 N 只面包屑螨 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_moldy_bread"></a>👾 发霉面包克星 | 击败 N 只发霉面包 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_stink_egg"></a>👾 臭鸡蛋克星 | 击败 N 只臭鸡蛋 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_sponge_slug"></a>👾 洗碗海绵克星 | 击败 N 只洗碗海绵 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_teabag_ghost"></a>👾 茶包幽灵克星 | 击败 N 只茶包幽灵 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_pan_beetle"></a>👾 锅底甲虫克星 | 击败 N 只锅底甲虫 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_aphid"></a>👾 蚜虫克星 | 击败 N 只蚜虫 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_garden_slug"></a>👾 菜园蛞蝓克星 | 击败 N 只菜园蛞蝓 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_weevil"></a>👾 象鼻虫克星 | 击败 N 只象鼻虫 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_thorn_weed"></a>👾 荆棘杂草克星 | 击败 N 只荆棘杂草 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_caterpillar"></a>👾 菜青虫克星 | 击败 N 只菜青虫 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_ladybug_bomb"></a>👾 爆爆瓢虫克星 | 击败 N 只爆爆瓢虫 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_rotten_potato"></a>👾 烂土豆克星 | 击败 N 只烂土豆 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_locust"></a>👾 飞蝗克星 | 击败 N 只飞蝗 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_mantis"></a>👾 刀螳螂克星 | 击败 N 只刀螳螂 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_pollen_bloom"></a>👾 毒花苞克星 | 击败 N 只毒花苞 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_frost_mite"></a>👾 霜螨克星 | 击败 N 只霜螨 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_freezer_burn"></a>👾 冻伤肉块克星 | 击败 N 只冻伤肉块 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_ice_slime"></a>👾 冰史莱姆克星 | 击败 N 只冰史莱姆 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_moldy_cheese"></a>👾 霉奶酪克星 | 击败 N 只霉奶酪 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_popsicle_bat"></a>👾 冰棍蝙蝠克星 | 击败 N 只冰棍蝙蝠 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_frozen_pea"></a>👾 冻豌豆克星 | 击败 N 只冻豌豆 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_leftover_box"></a>👾 剩饭盒克星 | 击败 N 只剩饭盒 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_jelly_cube"></a>👾 果冻方块克星 | 击败 N 只果冻方块 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_icicle_imp"></a>👾 冰锥小鬼克星 | 击败 N 只冰锥小鬼 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_frozen_soda"></a>👾 冻爆汽水克星 | 击败 N 只冻爆汽水 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_rust_crab"></a>👾 锈铁蟹克星 | 击败 N 只锈铁蟹 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_oil_slick"></a>👾 油膜怪克星 | 击败 N 只油膜怪 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_bag_ghost"></a>👾 塑料袋幽灵克星 | 击败 N 只塑料袋幽灵 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_battery_mite"></a>👾 漏电电池克星 | 击败 N 只漏电电池 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_tire_roller"></a>👾 滚轮胎克星 | 击败 N 只滚轮胎 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_scrap_drone"></a>👾 废铁无人机克星 | 击败 N 只废铁无人机 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_glass_shard"></a>👾 碎玻璃怪克星 | 击败 N 只碎玻璃怪 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_rusty_nail"></a>👾 锈钉虫克星 | 击败 N 只锈钉虫 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_junk_heap"></a>👾 垃圾堆克星 | 击败 N 只垃圾堆 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_junk_radio"></a>👾 破收音机克星 | 击败 N 只破收音机 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_conveyor_gremlin"></a>👾 传送带小妖克星 | 击败 N 只传送带小妖 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_sauce_drip"></a>👾 酱汁滴克星 | 击败 N 只酱汁滴 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_cap_drone"></a>👾 瓶盖无人机克星 | 击败 N 只瓶盖无人机 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_ketchup_slime"></a>👾 番茄酱史莱姆克星 | 击败 N 只番茄酱史莱姆 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_steam_imp"></a>👾 蒸汽小鬼克星 | 击败 N 只蒸汽小鬼 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_rivet_bot"></a>👾 铆钉机器人克星 | 击败 N 只铆钉机器人 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_label_ghost"></a>👾 标签幽灵克星 | 击败 N 只标签幽灵 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_bottling_bot"></a>👾 灌装机器人克星 | 击败 N 只灌装机器人 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_welder_bug"></a>👾 焊枪虫克星 | 击败 N 只焊枪虫 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_press_piston"></a>👾 冲压活塞克星 | 击败 N 只冲压活塞 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_rabbit"></a>🐇 菜园兔子克星 | 击败 N 只菜园兔子 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_gopher"></a>🐇 土拨鼠克星 | 击败 N 只土拨鼠 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_blight_sprout"></a>👾 枯萎嫩芽克星 | 击败 N 只枯萎嫩芽 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_fungus_gnat"></a>👾 菌蚊克星 | 击败 N 只菌蚊 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_rot_chili"></a>👾 腐辣椒克星 | 击败 N 只腐辣椒 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_slime_cucumber"></a>👾 流汗黄瓜克星 | 击败 N 只流汗黄瓜 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_spore_puff"></a>👾 孢子马勃克星 | 击败 N 只孢子马勃 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_vine_lasher"></a>👾 腐藤鞭克星 | 击败 N 只腐藤鞭 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_moldy_pumpkin"></a>👾 霉变南瓜克星 | 击败 N 只霉变南瓜 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_compost_heap"></a>👾 堆肥桶克星 | 击败 N 只堆肥桶 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_rot_cabbage"></a>👾 烂心卷心菜克星 | 击败 N 只烂心卷心菜 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_zombie_carrot"></a>👾 僵尸胡萝卜克星 | 击败 N 只僵尸胡萝卜 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_rot_sprinkler"></a>👾 腐水洒水器克星 | 击败 N 只腐水洒水器 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-kill_blight_onion"></a>👾 枯萎洋葱克星 | 击败 N 只枯萎洋葱 | 🥉 10（+1 点）<br>🥈 100（+3 点）<br>🥇 1,000（+10 点） |
| <a id="ach-champ_swift"></a>✨ 迅捷终结者 | 击败 N 只带【迅捷】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_armored"></a>✨ 坚甲终结者 | 击败 N 只带【坚甲】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_berserk"></a>✨ 狂暴终结者 | 击败 N 只带【狂暴】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_regen"></a>✨ 再生终结者 | 击败 N 只带【再生】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_frost"></a>✨ 冰霜终结者 | 击败 N 只带【冰霜】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_venom"></a>✨ 剧毒终结者 | 击败 N 只带【剧毒】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_cursed"></a>✨ 诅咒终结者 | 击败 N 只带【诅咒】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_shielded"></a>✨ 护盾终结者 | 击败 N 只带【护盾】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_explosive"></a>✨ 爆裂终结者 | 击败 N 只带【爆裂】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_vampiric"></a>✨ 吸血终结者 | 击败 N 只带【吸血】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_thorny"></a>✨ 荆棘终结者 | 击败 N 只带【荆棘】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_commander"></a>✨ 统帅终结者 | 击败 N 只带【统帅】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_giant"></a>✨ 巨大终结者 | 击败 N 只带【巨大】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_brutal"></a>✨ 残暴终结者 | 击败 N 只带【残暴】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_burning"></a>✨ 灼热终结者 | 击败 N 只带【灼热】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_bleeding"></a>✨ 撕裂终结者 | 击败 N 只带【撕裂】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_weakening"></a>✨ 衰弱终结者 | 击败 N 只带【衰弱】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_unstoppable"></a>✨ 不屈终结者 | 击败 N 只带【不屈】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_rich"></a>✨ 富有终结者 | 击败 N 只带【富有】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |
| <a id="ach-champ_splitting"></a>✨ 分裂终结者 | 击败 N 只带【分裂】词缀的精英怪 | 🥉 1（+2 点）<br>🥈 25（+6 点）<br>🥇 200（+20 点） |

<a id="cat-progress"></a>

## 进度

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-clear_1"></a>🍳 厨房清扫 | 通关第一章 | 🥇 1（+15 点 · 天赋点 +2） |
| <a id="ach-clear_2"></a>🌱 菜园守护者 | 通关第二章 | 🥇 2（+30 点 · 天赋点 +2） |
| <a id="ach-clear_3"></a>❄️ 破冰者 | 通关第三章 | 🥇 3（+50 点 · 天赋点 +2） |
| <a id="ach-clear_4"></a>🗑️ 垃圾场之王 | 通关第四章 | 🥇 4（+80 点 · 天赋点 +3） |
| <a id="ach-clear_5"></a>🏭 腐烂终结 | 通关第五章，击败腐烂之源 | 🥇 5（+120 点 · 天赋点 +3） |
| <a id="ach-wins"></a>🎖️ 常胜将军 | 累计通关 N 次 | 🥉 1（+10 点 · 天赋点 +1）<br>🥈 10（+30 点 · 天赋点 +1）<br>🥇 30（+60 点 · 天赋点 +2）<br>💎 100（+150 点 · 天赋点 +3） |
| <a id="ach-chars_won"></a>🎭 多面手 | 用 N 名不同角色通关 | 🥉 3（+15 点 · 天赋点 +1）<br>🥈 10（+40 点 · 天赋点 +2）<br>🥇 39（+150 点 · 天赋点 +4） |
| <a id="ach-chars_owned"></a>🔓 全员集结 | 拥有 N 名角色 | 🥉 8（+5 点）<br>🥈 20（+20 点）<br>🥇 39（+60 点） |
| <a id="ach-deaths"></a>🪦 屡败屡战 | 累计阵亡 N 次 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 100（+10 点） |
| <a id="ach-death_w1"></a>🤕 出师未捷 | 在第 1 波阵亡 | 🥇 1（+2 点） |
| <a id="ach-levelups"></a>⬆️ 步步高升 | 累计升级选择 N 次属性 | 🥉 10（+1 点）<br>🥈 200（+5 点）<br>🥇 2,000（+20 点） |
| <a id="ach-crates"></a>🎁 开箱达人 | 累计打开 N 个宝箱 | 🥉 1（+1 点）<br>🥈 50（+5 点）<br>🥇 300（+15 点） |
| <a id="ach-event_gold_rain"></a>🌧️ 金币雨 | 经历 3 次金币雨 | 🥇 3（+3 点） |
| <a id="ach-event_chest_horde"></a>📦 宝箱怪潮 | 经历 3 次宝箱怪潮 | 🥇 3（+3 点） |
| <a id="ach-event_merchant_raid"></a>🛒 商人突袭 | 经历 3 次商人突袭 | 🥇 3（+3 点） |
| <a id="ach-event_darkness"></a>🌑 黑暗之中 | 经历 3 次黑暗波 | 🥇 3（+5 点） |
| <a id="ach-hard_routes"></a>☠️ 偏向虎山行 | 走完 N 次危险路线 | 🥉 1（+2 点）<br>🥈 10（+10 点）<br>🥇 30（+30 点） |

<a id="cat-chapter"></a>

## 章节

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-ch_wave_1"></a>🚩 第一章 · 深夜厨房探索者 | 在「第一章 · 深夜厨房」完成第 N 波 | 🥉 5（+1 点）<br>🥈 10（+3 点） |
| <a id="ach-ch_kills_1"></a>💀 第一章 · 深夜厨房清道夫 | 在「第一章 · 深夜厨房」累计击败 N 只怪物 | 🥉 500（+1 点）<br>🥈 5,000（+5 点）<br>🥇 30,000（+20 点） |
| <a id="ach-ch_perfect_1"></a>🛡️ 第一章 · 深夜厨房无伤 | 在「第一章 · 深夜厨房」无伤完成 N 个波次 | 🥉 1（+2 点）<br>🥈 20（+8 点）<br>🥇 100（+25 点） |
| <a id="ach-ch_wave_2"></a>🚩 第二章 · 荒芜菜园探索者 | 在「第二章 · 荒芜菜园」完成第 N 波 | 🥉 5（+2 点）<br>🥈 10（+6 点） |
| <a id="ach-ch_kills_2"></a>💀 第二章 · 荒芜菜园清道夫 | 在「第二章 · 荒芜菜园」累计击败 N 只怪物 | 🥉 500（+1 点）<br>🥈 5,000（+5 点）<br>🥇 30,000（+20 点） |
| <a id="ach-ch_perfect_2"></a>🛡️ 第二章 · 荒芜菜园无伤 | 在「第二章 · 荒芜菜园」无伤完成 N 个波次 | 🥉 1（+3 点）<br>🥈 20（+11 点）<br>🥇 100（+33 点） |
| <a id="ach-ch_wave_3"></a>🚩 第三章 · 冰封冰箱探索者 | 在「第三章 · 冰封冰箱」完成第 N 波 | 🥉 5（+3 点）<br>🥈 10（+9 点） |
| <a id="ach-ch_kills_3"></a>💀 第三章 · 冰封冰箱清道夫 | 在「第三章 · 冰封冰箱」累计击败 N 只怪物 | 🥉 500（+1 点）<br>🥈 5,000（+5 点）<br>🥇 30,000（+20 点） |
| <a id="ach-ch_perfect_3"></a>🛡️ 第三章 · 冰封冰箱无伤 | 在「第三章 · 冰封冰箱」无伤完成 N 个波次 | 🥉 1（+4 点）<br>🥈 20（+14 点）<br>🥇 100（+41 点） |
| <a id="ach-ch_wave_4"></a>🚩 第四章 · 城市垃圾场探索者 | 在「第四章 · 城市垃圾场」完成第 N 波 | 🥉 5（+4 点）<br>🥈 10（+12 点） |
| <a id="ach-ch_kills_4"></a>💀 第四章 · 城市垃圾场清道夫 | 在「第四章 · 城市垃圾场」累计击败 N 只怪物 | 🥉 500（+1 点）<br>🥈 5,000（+5 点）<br>🥇 30,000（+20 点） |
| <a id="ach-ch_perfect_4"></a>🛡️ 第四章 · 城市垃圾场无伤 | 在「第四章 · 城市垃圾场」无伤完成 N 个波次 | 🥉 1（+5 点）<br>🥈 20（+17 点）<br>🥇 100（+49 点） |
| <a id="ach-ch_wave_5"></a>🚩 第五章 · 番茄酱工厂探索者 | 在「第五章 · 番茄酱工厂」完成第 N 波 | 🥉 5（+5 点）<br>🥈 10（+15 点） |
| <a id="ach-ch_kills_5"></a>💀 第五章 · 番茄酱工厂清道夫 | 在「第五章 · 番茄酱工厂」累计击败 N 只怪物 | 🥉 500（+1 点）<br>🥈 5,000（+5 点）<br>🥇 30,000（+20 点） |
| <a id="ach-ch_perfect_5"></a>🛡️ 第五章 · 番茄酱工厂无伤 | 在「第五章 · 番茄酱工厂」无伤完成 N 个波次 | 🥉 1（+6 点）<br>🥈 20（+20 点）<br>🥇 100（+57 点） |
| <a id="ach-ch_wave_6"></a>🚩 第六章 · 腐烂温室探索者 | 在「第六章 · 腐烂温室」完成第 N 波 | 🥉 5（+6 点）<br>🥈 10（+18 点） |
| <a id="ach-ch_kills_6"></a>💀 第六章 · 腐烂温室清道夫 | 在「第六章 · 腐烂温室」累计击败 N 只怪物 | 🥉 500（+1 点）<br>🥈 5,000（+5 点）<br>🥇 30,000（+20 点） |
| <a id="ach-ch_perfect_6"></a>🛡️ 第六章 · 腐烂温室无伤 | 在「第六章 · 腐烂温室」无伤完成 N 个波次 | 🥉 1（+7 点）<br>🥈 20（+23 点）<br>🥇 100（+65 点） |
| <a id="ach-ch_wave_7"></a>🚩 第七章 · 腐烂菜园探索者 | 在「第七章 · 腐烂菜园」完成第 N 波 | 🥉 5（+7 点）<br>🥈 10（+21 点） |
| <a id="ach-ch_kills_7"></a>💀 第七章 · 腐烂菜园清道夫 | 在「第七章 · 腐烂菜园」累计击败 N 只怪物 | 🥉 500（+1 点）<br>🥈 5,000（+5 点）<br>🥇 30,000（+20 点） |
| <a id="ach-ch_perfect_7"></a>🛡️ 第七章 · 腐烂菜园无伤 | 在「第七章 · 腐烂菜园」无伤完成 N 个波次 | 🥉 1（+8 点）<br>🥈 20（+26 点）<br>🥇 100（+73 点） |

<a id="cat-challenge"></a>

## 挑战

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-win_solo"></a>🗡️ 孤胆英雄 | 只带 1 把武器通关 | 🥇 1（+60 点 · 天赋点 +2） |
| <a id="ach-win_low_hp"></a>❤️‍🩹 命悬一线 | 以不到 10% 的生命通关 | 🥇 1（+30 点 · 天赋点 +1） |
| <a id="ach-win_pure_melee"></a>🥊 纯粹近战 | 只用近战武器（至少 4 把）通关 | 🥇 1（+25 点 · 天赋点 +1） |
| <a id="ach-win_pure_ranged"></a>🏹 纯粹远程 | 只用远程武器（至少 4 把）通关 | 🥇 1（+25 点 · 天赋点 +1） |
| <a id="ach-win_pure_elemental"></a>🔮 纯粹元素 | 只用元素武器（至少 4 把）通关 | 🥇 1（+25 点 · 天赋点 +1） |
| <a id="ach-win_all_t4"></a>👑 全副神兵 | 通关时持有 6 把 T4 武器 | 🥇 1（+120 点 · 天赋点 +2） |
| <a id="ach-win_hoarder"></a>🎒 满载而归 | 通关时持有 60 件道具 | 🥇 1（+40 点 · 天赋点 +1） |
| <a id="ach-daily_runs"></a>🗓️ 每日打卡 | 参加 N 次每日挑战 | 🥉 1（+2 点）<br>🥈 10（+8 点）<br>🥇 50（+25 点） |
| <a id="ach-daily_wins"></a>🏆 今日之星 | 通关 N 次每日挑战 | 🥉 1（+5 点）<br>🥈 10（+20 点）<br>🥇 30（+50 点） |
| <a id="ach-daily_streak"></a>🔥 风雨无阻 | 连续 N 天参加每日挑战 | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 30（+60 点） |
| <a id="ach-weekly_runs"></a>♾️ 周末战士 | 参加 N 次每周挑战 | 🥉 1（+3 点）<br>🥈 10（+15 点） |
| <a id="ach-weekly_best"></a>🏔️ 本周之巅 | 每周挑战中完成第 N 波 | 🥉 20（+5 点）<br>🥈 30（+15 点）<br>🥇 45（+40 点） |
| <a id="ach-danger_max"></a>🍅 番茄危机 | 通关番茄危机 N 级 | 🥉 1（+3 点）<br>🥈 5（+10 点）<br>🥇 10（+25 点）<br>💎 15（+50 点）<br>undefined 20（+100 点） |
| <a id="ach-danger_wins"></a>🔥 危机常客 | 在危机等级下通关 N 次 | 🥉 1（+2 点）<br>🥈 10（+10 点）<br>🥇 50（+40 点） |
| <a id="ach-danger_ch_1"></a>📈 第 1 章危机 | 第 1 章通关危机 N 级 | 🥉 5（+5 点）<br>🥈 10（+15 点）<br>🥇 20（+50 点） |
| <a id="ach-danger_ch_2"></a>📈 第 2 章危机 | 第 2 章通关危机 N 级 | 🥉 5（+5 点）<br>🥈 10（+15 点）<br>🥇 20（+50 点） |
| <a id="ach-danger_ch_3"></a>📈 第 3 章危机 | 第 3 章通关危机 N 级 | 🥉 5（+5 点）<br>🥈 10（+15 点）<br>🥇 20（+50 点） |
| <a id="ach-danger_ch_4"></a>📈 第 4 章危机 | 第 4 章通关危机 N 级 | 🥉 5（+5 点）<br>🥈 10（+15 点）<br>🥇 20（+50 点） |
| <a id="ach-danger_ch_5"></a>📈 第 5 章危机 | 第 N 章通关危机 5 级 | 🥉 5（+5 点）<br>🥈 10（+15 点）<br>🥇 20（+50 点） |
| <a id="ach-gold_frames"></a>🖼️ 金色边框 | 让 N 名角色获得金色边框 | 🥉 1（+30 点）<br>🥈 5（+80 点）<br>🥇 15（+150 点） |

<a id="cat-build"></a>

## 构筑

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-level"></a>📈 茁壮成长 | 单局达到 N 级 | 🥉 10（+2 点 · 天赋点 +1）<br>🥈 20（+8 点 · 天赋点 +1）<br>🥇 30（+40 点 · 天赋点 +1） |
| <a id="ach-items"></a>🎒 收藏家 | 单局持有 N 件道具 | 🥉 15（+3 点）<br>🥈 30（+8 点）<br>🥇 50（+25 点）<br>💎 80（+60 点） |
| <a id="ach-weapons"></a>🧰 武装到牙齿 | 单局持有 6 把武器 | 🥇 6（+3 点） |
| <a id="ach-t4"></a>💎 神兵利器 | 累计合成 N 把 T4 武器 | 🥉 1（+10 点 · 天赋点 +1）<br>🥈 5（+25 点 · 天赋点 +1）<br>🥇 20（+60 点 · 天赋点 +1） |
| <a id="ach-combines"></a>🔗 合二为一 | 累计合成武器 N 次 | 🥉 1（+1 点）<br>🥈 20（+5 点）<br>🥇 200（+20 点） |
| <a id="ach-forges"></a>⚒️ 铁匠学徒 | 累计打造武器 N 次 | 🥉 1（+2 点）<br>🥈 50（+10 点）<br>🥇 300（+30 点） |
| <a id="ach-forge_fail"></a>💔 失败是成功之母 | 打造失败 N 次 | 🥉 1（+1 点）<br>🥈 20（+5 点）<br>🥇 100（+15 点） |
| <a id="ach-forge_max"></a>🔥 千锤百炼 | 把任意武器打造到 +N | 🥉 3（+5 点）<br>🥈 7（+20 点 · 天赋点 +1）<br>🥇 10（+60 点 · 天赋点 +1） |
| <a id="ach-affix_rerolls"></a>🎲 词条赌徒 | 累计洗练词条 N 次 | 🥉 1（+1 点）<br>🥈 50（+5 点）<br>🥇 500（+20 点） |

<a id="cat-arsenal"></a>

## 武器

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-wpn_got_fork"></a>🗡️ 番茄叉收藏者 | 累计获得 N 次番茄叉 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_fork"></a>💎 神兵·番茄叉 | 获得 N 把 T4 番茄叉 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_fork"></a>🔨 番茄叉匠心 | 将番茄叉打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_rolling_pin"></a>🗡️ 擀面杖收藏者 | 累计获得 N 次擀面杖 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_rolling_pin"></a>💎 神兵·擀面杖 | 获得 N 把 T4 擀面杖 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_rolling_pin"></a>🔨 擀面杖匠心 | 将擀面杖打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_knife"></a>🗡️ 菜刀收藏者 | 累计获得 N 次菜刀 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_knife"></a>💎 神兵·菜刀 | 获得 N 把 T4 菜刀 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_knife"></a>🔨 菜刀匠心 | 将菜刀打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_pan"></a>🗡️ 平底锅收藏者 | 累计获得 N 次平底锅 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_pan"></a>💎 神兵·平底锅 | 获得 N 把 T4 平底锅 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_pan"></a>🔨 平底锅匠心 | 将平底锅打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_watermelon_hammer"></a>🗡️ 西瓜锤收藏者 | 累计获得 N 次西瓜锤 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_watermelon_hammer"></a>💎 神兵·西瓜锤 | 获得 N 把 T4 西瓜锤 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_watermelon_hammer"></a>🔨 西瓜锤匠心 | 将西瓜锤打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_slingshot"></a>🗡️ 番茄弹弓收藏者 | 累计获得 N 次番茄弹弓 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_slingshot"></a>💎 神兵·番茄弹弓 | 获得 N 把 T4 番茄弹弓 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_slingshot"></a>🔨 番茄弹弓匠心 | 将番茄弹弓打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_pea_shooter"></a>🗡️ 豌豆枪收藏者 | 累计获得 N 次豌豆枪 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_pea_shooter"></a>💎 神兵·豌豆枪 | 获得 N 把 T4 豌豆枪 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_pea_shooter"></a>🔨 豌豆枪匠心 | 将豌豆枪打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_chili_rocket"></a>🗡️ 辣椒火箭收藏者 | 累计获得 N 次辣椒火箭 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_chili_rocket"></a>💎 神兵·辣椒火箭 | 获得 N 把 T4 辣椒火箭 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_chili_rocket"></a>🔨 辣椒火箭匠心 | 将辣椒火箭打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_corn_cannon"></a>🗡️ 玉米加农收藏者 | 累计获得 N 次玉米加农 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_corn_cannon"></a>💎 神兵·玉米加农 | 获得 N 把 T4 玉米加农 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_corn_cannon"></a>🔨 玉米加农匠心 | 将玉米加农打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_ketchup"></a>🗡️ 番茄酱瓶收藏者 | 累计获得 N 次番茄酱瓶 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_ketchup"></a>💎 神兵·番茄酱瓶 | 获得 N 把 T4 番茄酱瓶 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_ketchup"></a>🔨 番茄酱瓶匠心 | 将番茄酱瓶打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_mustard_flamer"></a>🗡️ 芥末喷枪收藏者 | 累计获得 N 次芥末喷枪 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_mustard_flamer"></a>💎 神兵·芥末喷枪 | 获得 N 把 T4 芥末喷枪 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_mustard_flamer"></a>🔨 芥末喷枪匠心 | 将芥末喷枪打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_soda"></a>🗡️ 冰镇汽水收藏者 | 累计获得 N 次冰镇汽水 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_soda"></a>💎 神兵·冰镇汽水 | 获得 N 把 T4 冰镇汽水 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_soda"></a>🔨 冰镇汽水匠心 | 将冰镇汽水打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_garlic_aura"></a>🗡️ 大蒜光环收藏者 | 累计获得 N 次大蒜光环 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_garlic_aura"></a>💎 神兵·大蒜光环 | 获得 N 把 T4 大蒜光环 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_garlic_aura"></a>🔨 大蒜光环匠心 | 将大蒜光环打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_pepper_mine"></a>🗡️ 胡椒雷收藏者 | 累计获得 N 次胡椒雷 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_pepper_mine"></a>💎 神兵·胡椒雷 | 获得 N 把 T4 胡椒雷 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_pepper_mine"></a>🔨 胡椒雷匠心 | 将胡椒雷打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_onion_boomerang"></a>🗡️ 洋葱回旋镖收藏者 | 累计获得 N 次洋葱回旋镖 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_onion_boomerang"></a>💎 神兵·洋葱回旋镖 | 获得 N 把 T4 洋葱回旋镖 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_onion_boomerang"></a>🔨 洋葱回旋镖匠心 | 将洋葱回旋镖打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_broccoli_staff"></a>🗡️ 西兰花法杖收藏者 | 累计获得 N 次西兰花法杖 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_broccoli_staff"></a>💎 神兵·西兰花法杖 | 获得 N 把 T4 西兰花法杖 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_broccoli_staff"></a>🔨 西兰花法杖匠心 | 将西兰花法杖打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_sauce_gatling"></a>🗡️ 酱料加特林收藏者 | 累计获得 N 次酱料加特林 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_sauce_gatling"></a>💎 神兵·酱料加特林 | 获得 N 把 T4 酱料加特林 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_sauce_gatling"></a>🔨 酱料加特林匠心 | 将酱料加特林打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_cleaver"></a>🗡️ 剁骨刀收藏者 | 累计获得 N 次剁骨刀 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_cleaver"></a>💎 神兵·剁骨刀 | 获得 N 把 T4 剁骨刀 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_cleaver"></a>🔨 剁骨刀匠心 | 将剁骨刀打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_spatula"></a>🗡️ 锅铲收藏者 | 累计获得 N 次锅铲 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_spatula"></a>💎 神兵·锅铲 | 获得 N 把 T4 锅铲 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_spatula"></a>🔨 锅铲匠心 | 将锅铲打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_whisk_spin"></a>🗡️ 旋风打蛋器收藏者 | 累计获得 N 次旋风打蛋器 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_whisk_spin"></a>💎 神兵·旋风打蛋器 | 获得 N 把 T4 旋风打蛋器 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_whisk_spin"></a>🔨 旋风打蛋器匠心 | 将旋风打蛋器打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_meat_tenderizer"></a>🗡️ 松肉锤收藏者 | 累计获得 N 次松肉锤 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_meat_tenderizer"></a>💎 神兵·松肉锤 | 获得 N 把 T4 松肉锤 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_meat_tenderizer"></a>🔨 松肉锤匠心 | 将松肉锤打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_skewer"></a>🗡️ 烤串签收藏者 | 累计获得 N 次烤串签 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_skewer"></a>💎 神兵·烤串签 | 获得 N 把 T4 烤串签 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_skewer"></a>🔨 烤串签匠心 | 将烤串签打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_ladle"></a>🗡️ 汤勺收藏者 | 累计获得 N 次汤勺 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_ladle"></a>💎 神兵·汤勺 | 获得 N 把 T4 汤勺 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_ladle"></a>🔨 汤勺匠心 | 将汤勺打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_baguette_sword"></a>🗡️ 法棍剑收藏者 | 累计获得 N 次法棍剑 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_baguette_sword"></a>💎 神兵·法棍剑 | 获得 N 把 T4 法棍剑 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_baguette_sword"></a>🔨 法棍剑匠心 | 将法棍剑打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_cucumber_katana"></a>🗡️ 黄瓜武士刀收藏者 | 累计获得 N 次黄瓜武士刀 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_cucumber_katana"></a>💎 神兵·黄瓜武士刀 | 获得 N 把 T4 黄瓜武士刀 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_cucumber_katana"></a>🔨 黄瓜武士刀匠心 | 将黄瓜武士刀打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_pizza_cutter"></a>🗡️ 披萨滚刀收藏者 | 累计获得 N 次披萨滚刀 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_pizza_cutter"></a>💎 神兵·披萨滚刀 | 获得 N 把 T4 披萨滚刀 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_pizza_cutter"></a>🔨 披萨滚刀匠心 | 将披萨滚刀打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_chopsticks"></a>🗡️ 竹筷收藏者 | 累计获得 N 次竹筷 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_chopsticks"></a>💎 神兵·竹筷 | 获得 N 把 T4 竹筷 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_chopsticks"></a>🔨 竹筷匠心 | 将竹筷打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_bamboo_spear"></a>🗡️ 竹笋长矛收藏者 | 累计获得 N 次竹笋长矛 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_bamboo_spear"></a>💎 神兵·竹笋长矛 | 获得 N 把 T4 竹笋长矛 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_bamboo_spear"></a>🔨 竹笋长矛匠心 | 将竹笋长矛打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_pineapple_mace"></a>🗡️ 菠萝流星锤收藏者 | 累计获得 N 次菠萝流星锤 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_pineapple_mace"></a>💎 神兵·菠萝流星锤 | 获得 N 把 T4 菠萝流星锤 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_pineapple_mace"></a>🔨 菠萝流星锤匠心 | 将菠萝流星锤打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_olive_launcher"></a>🗡️ 橄榄发射器收藏者 | 累计获得 N 次橄榄发射器 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_olive_launcher"></a>💎 神兵·橄榄发射器 | 获得 N 把 T4 橄榄发射器 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_olive_launcher"></a>🔨 橄榄发射器匠心 | 将橄榄发射器打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_popcorn_machine"></a>🗡️ 爆米花机收藏者 | 累计获得 N 次爆米花机 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_popcorn_machine"></a>💎 神兵·爆米花机 | 获得 N 把 T4 爆米花机 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_popcorn_machine"></a>🔨 爆米花机匠心 | 将爆米花机打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_grape_shotgun"></a>🗡️ 葡萄霰弹枪收藏者 | 累计获得 N 次葡萄霰弹枪 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_grape_shotgun"></a>💎 神兵·葡萄霰弹枪 | 获得 N 把 T4 葡萄霰弹枪 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_grape_shotgun"></a>🔨 葡萄霰弹枪匠心 | 将葡萄霰弹枪打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_bean_bazooka"></a>🗡️ 豆子火箭筒收藏者 | 累计获得 N 次豆子火箭筒 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_bean_bazooka"></a>💎 神兵·豆子火箭筒 | 获得 N 把 T4 豆子火箭筒 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_bean_bazooka"></a>🔨 豆子火箭筒匠心 | 将豆子火箭筒打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_cherry_bomb"></a>🗡️ 樱桃炸弹收藏者 | 累计获得 N 次樱桃炸弹 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_cherry_bomb"></a>💎 神兵·樱桃炸弹 | 获得 N 把 T4 樱桃炸弹 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_cherry_bomb"></a>🔨 樱桃炸弹匠心 | 将樱桃炸弹打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_blueberry_sniper"></a>🗡️ 蓝莓狙击枪收藏者 | 累计获得 N 次蓝莓狙击枪 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_blueberry_sniper"></a>💎 神兵·蓝莓狙击枪 | 获得 N 把 T4 蓝莓狙击枪 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_blueberry_sniper"></a>🔨 蓝莓狙击枪匠心 | 将蓝莓狙击枪打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_plate_frisbee"></a>🗡️ 餐盘飞碟收藏者 | 累计获得 N 次餐盘飞碟 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_plate_frisbee"></a>💎 神兵·餐盘飞碟 | 获得 N 把 T4 餐盘飞碟 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_plate_frisbee"></a>🔨 餐盘飞碟匠心 | 将餐盘飞碟打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_seed_spitter"></a>🗡️ 瓜子机枪收藏者 | 累计获得 N 次瓜子机枪 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_seed_spitter"></a>💎 神兵·瓜子机枪 | 获得 N 把 T4 瓜子机枪 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_seed_spitter"></a>🔨 瓜子机枪匠心 | 将瓜子机枪打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_carrot_crossbow"></a>🗡️ 胡萝卜弩收藏者 | 累计获得 N 次胡萝卜弩 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_carrot_crossbow"></a>💎 神兵·胡萝卜弩 | 获得 N 把 T4 胡萝卜弩 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_carrot_crossbow"></a>🔨 胡萝卜弩匠心 | 将胡萝卜弩打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_honey_blaster"></a>🗡️ 蜂蜜喷枪收藏者 | 累计获得 N 次蜂蜜喷枪 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_honey_blaster"></a>💎 神兵·蜂蜜喷枪 | 获得 N 把 T4 蜂蜜喷枪 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_honey_blaster"></a>🔨 蜂蜜喷枪匠心 | 将蜂蜜喷枪打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_soy_pistol"></a>🗡️ 酱油手枪收藏者 | 累计获得 N 次酱油手枪 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_soy_pistol"></a>💎 神兵·酱油手枪 | 获得 N 把 T4 酱油手枪 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_soy_pistol"></a>🔨 酱油手枪匠心 | 将酱油手枪打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_ice_cube_tray"></a>🗡️ 冰块格收藏者 | 累计获得 N 次冰块格 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_ice_cube_tray"></a>💎 神兵·冰块格 | 获得 N 把 T4 冰块格 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_ice_cube_tray"></a>🔨 冰块格匠心 | 将冰块格打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_lightning_whisk"></a>🗡️ 闪电打蛋器收藏者 | 累计获得 N 次闪电打蛋器 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_lightning_whisk"></a>💎 神兵·闪电打蛋器 | 获得 N 把 T4 闪电打蛋器 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_lightning_whisk"></a>🔨 闪电打蛋器匠心 | 将闪电打蛋器打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_steam_kettle"></a>🗡️ 蒸汽水壶收藏者 | 累计获得 N 次蒸汽水壶 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_steam_kettle"></a>💎 神兵·蒸汽水壶 | 获得 N 把 T4 蒸汽水壶 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_steam_kettle"></a>🔨 蒸汽水壶匠心 | 将蒸汽水壶打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_curry_aura"></a>🗡️ 咖喱光环收藏者 | 累计获得 N 次咖喱光环 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_curry_aura"></a>💎 神兵·咖喱光环 | 获得 N 把 T4 咖喱光环 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_curry_aura"></a>🔨 咖喱光环匠心 | 将咖喱光环打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_pepper_spray"></a>🗡️ 胡椒喷雾收藏者 | 累计获得 N 次胡椒喷雾 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_pepper_spray"></a>💎 神兵·胡椒喷雾 | 获得 N 把 T4 胡椒喷雾 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_pepper_spray"></a>🔨 胡椒喷雾匠心 | 将胡椒喷雾打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_mint_frost_mine"></a>🗡️ 薄荷冰雷收藏者 | 累计获得 N 次薄荷冰雷 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_mint_frost_mine"></a>💎 神兵·薄荷冰雷 | 获得 N 把 T4 薄荷冰雷 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_mint_frost_mine"></a>🔨 薄荷冰雷匠心 | 将薄荷冰雷打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_thunder_durian"></a>🗡️ 雷霆榴莲收藏者 | 累计获得 N 次雷霆榴莲 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_thunder_durian"></a>💎 神兵·雷霆榴莲 | 获得 N 把 T4 雷霆榴莲 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_thunder_durian"></a>🔨 雷霆榴莲匠心 | 将雷霆榴莲打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_dragonfruit_orb"></a>🗡️ 火龙果法球收藏者 | 累计获得 N 次火龙果法球 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_dragonfruit_orb"></a>💎 神兵·火龙果法球 | 获得 N 把 T4 火龙果法球 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_dragonfruit_orb"></a>🔨 火龙果法球匠心 | 将火龙果法球打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_star_anise_shuriken"></a>🗡️ 八角飞镖收藏者 | 累计获得 N 次八角飞镖 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_star_anise_shuriken"></a>💎 神兵·八角飞镖 | 获得 N 把 T4 八角飞镖 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_star_anise_shuriken"></a>🔨 八角飞镖匠心 | 将八角飞镖打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_lemon_battery"></a>🗡️ 柠檬电池收藏者 | 累计获得 N 次柠檬电池 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_lemon_battery"></a>💎 神兵·柠檬电池 | 获得 N 把 T4 柠檬电池 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_lemon_battery"></a>🔨 柠檬电池匠心 | 将柠檬电池打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_wasabi_katana"></a>🗡️ 芥末太刀收藏者 | 累计获得 N 次芥末太刀 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_wasabi_katana"></a>💎 神兵·芥末太刀 | 获得 N 把 T4 芥末太刀 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_wasabi_katana"></a>🔨 芥末太刀匠心 | 将芥末太刀打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_kitchen_scissors"></a>🗡️ 厨房剪刀收藏者 | 累计获得 N 次厨房剪刀 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_kitchen_scissors"></a>💎 神兵·厨房剪刀 | 获得 N 把 T4 厨房剪刀 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_kitchen_scissors"></a>🔨 厨房剪刀匠心 | 将厨房剪刀打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_blender_aura"></a>🗡️ 破壁机收藏者 | 累计获得 N 次破壁机 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_blender_aura"></a>💎 神兵·破壁机 | 获得 N 把 T4 破壁机 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_blender_aura"></a>🔨 破壁机匠心 | 将破壁机打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_dynamite_drumstick"></a>🗡️ 炸药鸡腿收藏者 | 累计获得 N 次炸药鸡腿 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_dynamite_drumstick"></a>💎 神兵·炸药鸡腿 | 获得 N 把 T4 炸药鸡腿 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_dynamite_drumstick"></a>🔨 炸药鸡腿匠心 | 将炸药鸡腿打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_pepper_grinder"></a>🗡️ 胡椒研磨枪收藏者 | 累计获得 N 次胡椒研磨枪 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_pepper_grinder"></a>💎 神兵·胡椒研磨枪 | 获得 N 把 T4 胡椒研磨枪 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_pepper_grinder"></a>🔨 胡椒研磨枪匠心 | 将胡椒研磨枪打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_soy_bomb"></a>🗡️ 酱油炸弹收藏者 | 累计获得 N 次酱油炸弹 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_soy_bomb"></a>💎 神兵·酱油炸弹 | 获得 N 把 T4 酱油炸弹 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_soy_bomb"></a>🔨 酱油炸弹匠心 | 将酱油炸弹打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_bbq_torch"></a>🗡️ 烧烤喷枪收藏者 | 累计获得 N 次烧烤喷枪 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_bbq_torch"></a>💎 神兵·烧烤喷枪 | 获得 N 把 T4 烧烤喷枪 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_bbq_torch"></a>🔨 烧烤喷枪匠心 | 将烧烤喷枪打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_jam_mortar"></a>🗡️ 果酱迫击炮收藏者 | 累计获得 N 次果酱迫击炮 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_jam_mortar"></a>💎 神兵·果酱迫击炮 | 获得 N 把 T4 果酱迫击炮 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_jam_mortar"></a>🔨 果酱迫击炮匠心 | 将果酱迫击炮打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_sea_urchin_mine"></a>🗡️ 海胆雷收藏者 | 累计获得 N 次海胆雷 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_sea_urchin_mine"></a>💎 神兵·海胆雷 | 获得 N 把 T4 海胆雷 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_sea_urchin_mine"></a>🔨 海胆雷匠心 | 将海胆雷打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_salt_aura"></a>🗡️ 海盐结界收藏者 | 累计获得 N 次海盐结界 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_salt_aura"></a>💎 神兵·海盐结界 | 获得 N 把 T4 海盐结界 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_salt_aura"></a>🔨 海盐结界匠心 | 将海盐结界打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_cola_zapper"></a>🗡️ 可乐电击枪收藏者 | 累计获得 N 次可乐电击枪 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_cola_zapper"></a>💎 神兵·可乐电击枪 | 获得 N 把 T4 可乐电击枪 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_cola_zapper"></a>🔨 可乐电击枪匠心 | 将可乐电击枪打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-wpn_got_hotpot_breath"></a>🗡️ 火锅吐息收藏者 | 累计获得 N 次火锅吐息 | 🥉 1（+1 点）<br>🥈 10（+3 点）<br>🥇 30（+8 点） |
| <a id="ach-wpn_t4_hotpot_breath"></a>💎 神兵·火锅吐息 | 获得 N 把 T4 火锅吐息 | 🥉 1（+10 点）<br>🥈 5（+30 点） |
| <a id="ach-wpn_forge_hotpot_breath"></a>🔨 火锅吐息匠心 | 将火锅吐息打造到 +N | 🥉 3（+5 点）<br>🥈 7（+15 点）<br>🥇 10（+40 点） |
| <a id="ach-evolutions"></a>✨ 进化论 | 累计进化武器 N 次 | 🥉 1（+5 点）<br>🥈 10（+20 点）<br>🥇 50（+60 点） |
| <a id="ach-evolve_hell_trident"></a>🌟 地狱三叉戟诞生 | 首次进化出「地狱三叉戟」 | 🥇 1（+20 点） |
| <a id="ach-evolve_titan_pin"></a>🌟 擎天擀面柱诞生 | 首次进化出「擎天擀面柱」 | 🥇 1（+20 点） |
| <a id="ach-evolve_paoding_blade"></a>🌟 庖丁神刀诞生 | 首次进化出「庖丁神刀」 | 🥇 1（+20 点） |
| <a id="ach-evolve_dragon_cleaver"></a>🌟 屠龙菜刀诞生 | 首次进化出「屠龙菜刀」 | 🥇 1（+20 点） |
| <a id="ach-evolve_pea_gatling"></a>🌟 豌豆加特林诞生 | 首次进化出「豌豆加特林」 | 🥇 1（+20 点） |
| <a id="ach-evolve_ketchup_flood"></a>🌟 番茄酱洪流诞生 | 首次进化出「番茄酱洪流」 | 🥇 1（+20 点） |
| <a id="ach-evolve_devil_missile"></a>🌟 魔鬼椒导弹诞生 | 首次进化出「魔鬼椒导弹」 | 🥇 1（+20 点） |
| <a id="ach-evolve_thor_whisk"></a>🌟 雷神打蛋器诞生 | 首次进化出「雷神打蛋器」 | 🥇 1（+20 点） |
| <a id="ach-evolve_vampire_garlic"></a>🌟 吸血鬼大蒜诞生 | 首次进化出「吸血鬼大蒜」 | 🥇 1（+20 点） |
| <a id="ach-evolve_blueberry_railgun"></a>🌟 蓝莓电磁炮诞生 | 首次进化出「蓝莓电磁炮」 | 🥇 1（+20 点） |
| <a id="ach-evolve_golden_corn"></a>🌟 黄金爆米花炮诞生 | 首次进化出「黄金爆米花炮」 | 🥇 1（+20 点） |
| <a id="ach-evolve_anise_storm"></a>🌟 八角风暴诞生 | 首次进化出「八角风暴」 | 🥇 1（+20 点） |
| <a id="ach-evolve_iron_bastion_pan"></a>🌟 铸铁壁垒锅诞生 | 首次进化出「铸铁壁垒锅」 | 🥇 1（+20 点） |
| <a id="ach-evolve_melon_quake"></a>🌟 西瓜震地锤诞生 | 首次进化出「西瓜震地锤」 | 🥇 1（+20 点） |
| <a id="ach-evolve_storm_broccoli"></a>🌟 风暴西兰花诞生 | 首次进化出「风暴西兰花」 | 🥇 1（+20 点） |
| <a id="ach-evolve_mustard_dragon"></a>🌟 芥末龙息诞生 | 首次进化出「芥末龙息」 | 🥇 1（+20 点） |
| <a id="ach-evolve_pepper_minefield"></a>🌟 胡椒雷区诞生 | 首次进化出「胡椒雷区」 | 🥇 1（+20 点） |
| <a id="ach-evolve_tsunami_katana"></a>🌟 怒涛芥末刀诞生 | 首次进化出「怒涛芥末刀」 | 🥇 1（+20 点） |
| <a id="ach-evolve_tornado_blender"></a>🌟 龙卷破壁机诞生 | 首次进化出「龙卷破壁机」 | 🥇 1（+20 点） |
| <a id="ach-evolve_umami_bomb"></a>🌟 鲜味核弹诞生 | 首次进化出「鲜味核弹」 | 🥇 1（+20 点） |

<a id="cat-collection"></a>

## 收藏

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-series_tomatoes"></a>📚 番茄制品系列 | 单局持有 N 件「番茄制品」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_spices"></a>📚 香料系列 | 单局持有 N 件「香料」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_sauces"></a>📚 酱料系列 | 单局持有 N 件「酱料」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_knives"></a>📚 刀具系列 | 单局持有 N 件「刀具」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_pots"></a>📚 锅具系列 | 单局持有 N 件「锅具」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_utensils"></a>📚 餐具系列 | 单局持有 N 件「餐具」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_guns"></a>📚 玩具枪系列 | 单局持有 N 件「玩具枪」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_ammo"></a>📚 弹药系列 | 单局持有 N 件「弹药」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_fire"></a>📚 火焰系列 | 单局持有 N 件「火焰」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_ice"></a>📚 冰品系列 | 单局持有 N 件「冰品」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_thunder"></a>📚 雷电系列 | 单局持有 N 件「雷电」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_poisons"></a>📚 毒物系列 | 单局持有 N 件「毒物」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_herbs"></a>📚 草药系列 | 单局持有 N 件「草药」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_teas"></a>📚 茶饮系列 | 单局持有 N 件「茶饮」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_coffee"></a>📚 咖啡系列 | 单局持有 N 件「咖啡」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_sweets"></a>📚 甜点系列 | 单局持有 N 件「甜点」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_breads"></a>📚 面包系列 | 单局持有 N 件「面包」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_cheese"></a>📚 奶酪系列 | 单局持有 N 件「奶酪」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_fish"></a>📚 海鲜系列 | 单局持有 N 件「海鲜」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_eggs"></a>📚 蛋类系列 | 单局持有 N 件「蛋类」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_farm"></a>📚 农具系列 | 单局持有 N 件「农具」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_seedsS"></a>📚 种子系列 | 单局持有 N 件「种子」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_bugs"></a>📚 昆虫标本系列 | 单局持有 N 件「昆虫标本」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_shoes"></a>📚 鞋子系列 | 单局持有 N 件「鞋子」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_hats"></a>📚 帽子系列 | 单局持有 N 件「帽子」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_gloves"></a>📚 手套系列 | 单局持有 N 件「手套」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_shields"></a>📚 盾牌系列 | 单局持有 N 件「盾牌」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_books"></a>📚 书籍系列 | 单局持有 N 件「书籍」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_scrolls"></a>📚 卷轴系列 | 单局持有 N 件「卷轴」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_gems"></a>📚 宝石系列 | 单局持有 N 件「宝石」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_rings"></a>📚 戒指系列 | 单局持有 N 件「戒指」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_amulets"></a>📚 护身符系列 | 单局持有 N 件「护身符」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_coins"></a>📚 钱币系列 | 单局持有 N 件「钱币」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_potions"></a>📚 药水系列 | 单局持有 N 件「药水」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_bones"></a>📚 骨头系列 | 单局持有 N 件「骨头」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_feathers"></a>📚 羽毛系列 | 单局持有 N 件「羽毛」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_candies"></a>📚 糖果系列 | 单局持有 N 件「糖果」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_gears"></a>📚 机械零件系列 | 单局持有 N 件「机械零件」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_batteries"></a>📚 能源系列 | 单局持有 N 件「能源」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_masks"></a>📚 面具系列 | 单局持有 N 件「面具」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_toys"></a>📚 玩具系列 | 单局持有 N 件「玩具」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_music"></a>📚 乐器系列 | 单局持有 N 件「乐器」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_dark"></a>📚 暗黑系列 | 单局持有 N 件「暗黑」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_holy"></a>📚 神圣系列 | 单局持有 N 件「神圣」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_ninja"></a>📚 忍具系列 | 单局持有 N 件「忍具」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_pirate"></a>📚 海盗系列 | 单局持有 N 件「海盗」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_science"></a>📚 实验系列 | 单局持有 N 件「实验」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_sports"></a>📚 运动系列 | 单局持有 N 件「运动」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_rot"></a>📚 腐败系列 | 单局持有 N 件「腐败」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_skillbook"></a>📚 技能秘籍系列 | 单局持有 N 件「技能秘籍」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_talisman"></a>📚 技能法器系列 | 单局持有 N 件「技能法器」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-series_stars"></a>📚 星辰系列 | 单局持有 N 件「星辰」系列道具 | 🥉 3（+1 点）<br>🥈 6（+4 点）<br>🥇 10（+15 点） |
| <a id="ach-set_厨具"></a>🧩 厨具套装 | 单局持有 N 把【厨具】武器 | 🥉 2（+1 点）<br>🥈 4（+4 点）<br>🥇 6（+15 点） |
| <a id="ach-set_锋利"></a>🧩 锋利套装 | 单局持有 N 把【锋利】武器 | 🥉 2（+1 点）<br>🥈 3（+4 点）<br>🥇 4（+15 点） |
| <a id="ach-set_蔬果"></a>🧩 蔬果套装 | 单局持有 N 把【蔬果】武器 | 🥉 2（+1 点）<br>🥈 4（+4 点）<br>🥇 6（+15 点） |
| <a id="ach-set_枪械"></a>🧩 枪械套装 | 单局持有 N 把【枪械】武器 | 🥉 2（+1 点）<br>🥈 4（+4 点）<br>🥇 6（+15 点） |
| <a id="ach-set_酱料"></a>🧩 酱料套装 | 单局持有 N 把【酱料】武器 | 🥉 2（+1 点）<br>🥈 4（+4 点）<br>🥇 6（+15 点） |
| <a id="ach-set_元素"></a>🧩 元素套装 | 单局持有 N 把【元素】武器 | 🥉 2（+1 点）<br>🥈 4（+4 点）<br>🥇 6（+15 点） |
| <a id="ach-set_爆破"></a>🧩 爆破套装 | 单局持有 N 把【爆破】武器 | 🥉 2（+1 点）<br>🥈 4（+4 点）<br>🥇 6（+15 点） |
| <a id="ach-rarity_0"></a>⚪ 普通买家 | 累计购买 N 件普通道具 | 🥉 20（+1 点）<br>🥈 200（+4 点）<br>🥇 1,000（+12 点） |
| <a id="ach-rarity_1"></a>🔵 稀有买家 | 累计购买 N 件稀有道具 | 🥉 10（+1 点）<br>🥈 100（+5 点）<br>🥇 500（+15 点） |
| <a id="ach-rarity_2"></a>🟣 史诗买家 | 累计购买 N 件史诗道具 | 🥉 5（+2 点）<br>🥈 50（+8 点）<br>🥇 300（+25 点） |
| <a id="ach-rarity_3"></a>🔴 传说买家 | 累计购买 N 件传说道具 | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 50（+40 点） |
| <a id="ach-relics_total"></a>🏺 遗物猎人 | 累计获得 N 件遗物 | 🥉 5（+3 点）<br>🥈 25（+10 点）<br>🥇 100（+30 点） |
| <a id="ach-relics_codex"></a>📖 遗物图鉴 | 图鉴收录 N 件遗物 | 🥉 10（+5 点）<br>🥈 25（+15 点）<br>🥇 45（+40 点） |
| <a id="ach-relic_boon"></a>🌿 福星高照 | 获得 20 件增益遗物 | 🥇 20（+5 点） |
| <a id="ach-relic_trade"></a>⚖️ 等价交换 | 获得 20 件交易遗物 | 🥇 20（+8 点） |
| <a id="ach-relic_curse"></a>🕯️ 与诅咒共舞 | 获得 10 件诅咒遗物 | 🥇 10（+10 点） |
| <a id="ach-relic_set_greenhouse"></a>✦ 温室套装 | 集齐「温室」套装 | 🥇 1（+15 点） |
| <a id="ach-relic_set_fortune"></a>✦ 财运套装 | 集齐「财运」套装 | 🥇 1（+15 点） |
| <a id="ach-relic_set_kitchen"></a>✦ 厨房套装 | 集齐「厨房」套装 | 🥇 1（+15 点） |
| <a id="ach-relic_set_field"></a>✦ 田野套装 | 集齐「田野」套装 | 🥇 1（+15 点） |
| <a id="ach-relic_set_night"></a>✦ 夜行套装 | 集齐「夜行」套装 | 🥇 1（+15 点） |
| <a id="ach-relic_set_glass"></a>✦ 玻璃套装 | 集齐「玻璃」套装 | 🥇 1（+15 点） |
| <a id="ach-relic_set_stone"></a>✦ 磐石套装 | 集齐「磐石」套装 | 🥇 1（+15 点） |
| <a id="ach-relic_set_plague"></a>✦ 瘟疫套装 | 集齐「瘟疫」套装 | 🥇 1（+15 点） |

<a id="cat-skill"></a>

## 技能

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-cast_nova"></a>🌟 周身爆发大师 | 释放 N 次【周身爆发】类技能 | 🥉 10（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-cast_dash"></a>🌟 突进冲撞大师 | 释放 N 次【突进冲撞】类技能 | 🥉 10（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-cast_buff"></a>🌟 自身增益大师 | 释放 N 次【自身增益】类技能 | 🥉 10（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-cast_ghost"></a>🌟 无敌潜行大师 | 释放 N 次【无敌潜行】类技能 | 🥉 10（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-cast_ring"></a>🌟 环形弹幕大师 | 释放 N 次【环形弹幕】类技能 | 🥉 10（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-cast_heal"></a>🌟 吸取回复大师 | 释放 N 次【吸取回复】类技能 | 🥉 10（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-cast_strikes"></a>🌟 多点轰炸大师 | 释放 N 次【多点轰炸】类技能 | 🥉 10（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-cast_clone"></a>🌟 召唤分身大师 | 释放 N 次【召唤分身】类技能 | 🥉 10（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-cast_barrage"></a>🌟 单体连发大师 | 释放 N 次【单体连发】类技能 | 🥉 10（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-cast_missile"></a>🌟 发射 AOE大师 | 释放 N 次【发射 AOE】类技能 | 🥉 10（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-cast_screen"></a>🌟 全屏攻击大师 | 释放 N 次【全屏攻击】类技能 | 🥉 10（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-cast_field"></a>🌟 禁锢领域大师 | 释放 N 次【禁锢领域】类技能 | 🥉 10（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-cast_curse"></a>🌟 群体减益大师 | 释放 N 次【群体减益】类技能 | 🥉 10（+1 点）<br>🥈 100（+4 点）<br>🥇 1,000（+15 点） |
| <a id="ach-inflict_burn"></a>🧪 灼烧专家 | 对敌人施加 N 次【灼烧】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_poison"></a>🧪 中毒专家 | 对敌人施加 N 次【中毒】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_bleed"></a>🧪 流血专家 | 对敌人施加 N 次【流血】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_slow"></a>🧪 减速专家 | 对敌人施加 N 次【减速】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_freeze"></a>🧪 冰冻专家 | 对敌人施加 N 次【冰冻】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_stun"></a>🧪 眩晕专家 | 对敌人施加 N 次【眩晕】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_weaken"></a>🧪 虚弱专家 | 对敌人施加 N 次【虚弱】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_vulnerable"></a>🧪 易伤专家 | 对敌人施加 N 次【易伤】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_armorBreak"></a>🧪 破甲专家 | 对敌人施加 N 次【破甲】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_curse"></a>🧪 诅咒专家 | 对敌人施加 N 次【诅咒】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_blind"></a>🧪 致盲专家 | 对敌人施加 N 次【致盲】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_confuse"></a>🧪 混乱专家 | 对敌人施加 N 次【混乱】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_sticky"></a>🧪 黏液专家 | 对敌人施加 N 次【黏液】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_mark"></a>🧪 标记专家 | 对敌人施加 N 次【标记】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_silence"></a>🧪 沉默专家 | 对敌人施加 N 次【沉默】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_rot"></a>🧪 腐烂专家 | 对敌人施加 N 次【腐烂】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_soaked"></a>🧪 浸湿专家 | 对敌人施加 N 次【浸湿】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |
| <a id="ach-inflict_corrode"></a>🧪 腐蚀专家 | 对敌人施加 N 次【腐蚀】 | 🥉 50（+1 点）<br>🥈 1,000（+4 点）<br>🥇 20,000（+15 点） |

<a id="cat-economy"></a>

## 经济

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-rich"></a>💰 小有积蓄 | 同时持有 N 番茄籽 | 🥉 200（+3 点）<br>🥈 500（+8 点）<br>🥇 1,000（+20 点）<br>💎 3,000（+50 点） |
| <a id="ach-earned"></a>🏦 番茄大亨 | 累计获得 N 番茄籽 | 🥉 2,000（+3 点）<br>🥈 20,000（+15 点）<br>🥇 100,000（+40 点）<br>💎 500,000（+100 点） |
| <a id="ach-items_bought"></a>🛒 购物狂 | 累计购买 N 件道具 | 🥉 1（+1 点）<br>🥈 100（+5 点）<br>🥇 1,000（+20 点） |
| <a id="ach-weapons_bought"></a>🏪 军火商 | 累计购买 N 把武器 | 🥉 1（+1 点）<br>🥈 50（+5 点）<br>🥇 300（+15 点） |
| <a id="ach-shop_rerolls"></a>🔄 再来一次 | 累计刷新商店 N 次 | 🥉 1（+1 点）<br>🥈 100（+5 点）<br>🥇 1,000（+20 点） |
| <a id="ach-sells"></a>💸 以旧换新 | 累计出售武器 N 次 | 🥉 1（+1 点）<br>🥈 50（+6 点） |
| <a id="ach-gold_earned"></a>🥇 金番茄 | 累计获得 N 个金番茄 | 🥉 50（+5 点）<br>🥈 500（+20 点）<br>🥇 3,000（+60 点） |
| <a id="ach-merchant_buys"></a>🧙 神秘交易 | 向神秘商人购买 N 件遗物 | 🥉 1（+3 点）<br>🥈 10（+15 点） |

<a id="cat-codex"></a>

## 图鉴

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-codex_weapons"></a>🗡️ 军火库 | 在图鉴中发现 N 把武器 | 🥉 9（+2 点）<br>🥈 25（+8 点）<br>🥇 62（+30 点 · 天赋点 +1） |
| <a id="ach-codex_items"></a>📦 道具百科 | 在图鉴中发现 N 件道具 | 🥉 50（+3 点）<br>🥈 200（+10 点）<br>🥇 600（+60 点 · 天赋点 +1） |
| <a id="ach-codex_monsters"></a>🔬 怪物学者 | 在图鉴中发现 N 种小怪 | 🥉 20（+3 点）<br>🥈 87（+30 点 · 天赋点 +1） |
| <a id="ach-codex_bosses"></a>📜 猎魔名录 | 在图鉴中发现 N 名精英与 Boss | 🥉 15（+10 点）<br>🥈 52（+50 点 · 天赋点 +1） |

<a id="cat-endless"></a>

## 无尽

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-endless_runs"></a>♾️ 永不停歇 | 开始 N 次无尽模式 | 🥉 1（+2 点）<br>🥈 20（+10 点） |
| <a id="ach-endless_best"></a>🏔️ 无尽攀登 | 无尽模式完成第 N 波 | 🥉 20（+5 点 · 天赋点 +1）<br>🥈 30（+15 点 · 天赋点 +1）<br>🥇 45（+40 点 · 天赋点 +1）<br>💎 60（+80 点 · 天赋点 +2）<br>undefined 100（+150 点 · 天赋点 +2） |
| <a id="ach-endless_waves"></a>🌊 无尽浪潮 | 无尽模式累计完成 N 个波次 | 🥉 50（+3 点）<br>🥈 500（+15 点）<br>🥇 3,000（+50 点） |
| <a id="ach-endless_bosses"></a>👑 轮回猎手 | 无尽模式击败 N 名 Boss | 🥉 1（+10 点 · 天赋点 +1）<br>🥈 10（+30 点 · 天赋点 +1）<br>🥇 50（+80 点 · 天赋点 +1） |
| <a id="ach-endless_kills"></a>🌪️ 无尽收割 | 无尽模式单局击败 N 只怪物 | 🥉 3,000（+10 点）<br>🥈 10,000（+40 点） |
| <a id="ach-endless_ch_1"></a>🚩 第一章 · 深夜厨房·无尽 | 在「第一章 · 深夜厨房」无尽模式完成第 N 波 | 🥉 20（+3 点）<br>🥈 30（+10 点）<br>🥇 45（+30 点） |
| <a id="ach-endless_ch_2"></a>🚩 第二章 · 荒芜菜园·无尽 | 在「第二章 · 荒芜菜园」无尽模式完成第 N 波 | 🥉 20（+5 点）<br>🥈 30（+15 点）<br>🥇 45（+40 点） |
| <a id="ach-endless_ch_3"></a>🚩 第三章 · 冰封冰箱·无尽 | 在「第三章 · 冰封冰箱」无尽模式完成第 N 波 | 🥉 20（+7 点）<br>🥈 30（+20 点）<br>🥇 45（+50 点） |
| <a id="ach-endless_ch_4"></a>🚩 第四章 · 城市垃圾场·无尽 | 在「第四章 · 城市垃圾场」无尽模式完成第 N 波 | 🥉 20（+9 点）<br>🥈 30（+25 点）<br>🥇 45（+60 点） |
| <a id="ach-endless_ch_5"></a>🚩 第五章 · 番茄酱工厂·无尽 | 在「第五章 · 番茄酱工厂」无尽模式完成第 N 波 | 🥉 20（+11 点）<br>🥈 30（+30 点）<br>🥇 45（+70 点） |
| <a id="ach-endless_ch_6"></a>🚩 第六章 · 腐烂温室·无尽 | 在「第六章 · 腐烂温室」无尽模式完成第 N 波 | 🥉 20（+13 点）<br>🥈 30（+35 点）<br>🥇 45（+80 点） |
| <a id="ach-endless_ch_7"></a>🚩 第七章 · 腐烂菜园·无尽 | 在「第七章 · 腐烂菜园」无尽模式完成第 N 波 | 🥉 20（+15 点）<br>🥈 30（+40 点）<br>🥇 45（+90 点） |
| <a id="ach-endless_char_tomato"></a>♾️ 番茄妹·无尽 | 使用番茄妹在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_carrot"></a>♾️ 胡萝卜骑士·无尽 | 使用胡萝卜骑士在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_chili"></a>♾️ 辣椒姐·无尽 | 使用辣椒姐在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_corn"></a>♾️ 玉米枪手·无尽 | 使用玉米枪手在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_watermelon"></a>♾️ 西瓜胖墩·无尽 | 使用西瓜胖墩在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_lemon"></a>♾️ 柠檬刺客·无尽 | 使用柠檬刺客在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_eggplant"></a>♾️ 茄子法师·无尽 | 使用茄子法师在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_garlic"></a>♾️ 大蒜伯爵·无尽 | 使用大蒜伯爵在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_blueberry"></a>♾️ 蓝莓双子·无尽 | 使用蓝莓双子在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_pineapple"></a>♾️ 菠萝船长·无尽 | 使用菠萝船长在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_pumpkin"></a>♾️ 南瓜幽灵·无尽 | 使用南瓜幽灵在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_strawberry"></a>♾️ 草莓偶像·无尽 | 使用草莓偶像在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_ginger"></a>♾️ 生姜忍者·无尽 | 使用生姜忍者在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_avocado"></a>♾️ 牛油果博士·无尽 | 使用牛油果博士在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_onion"></a>♾️ 洋葱大叔·无尽 | 使用洋葱大叔在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_mushroom"></a>♾️ 蘑菇巫医·无尽 | 使用蘑菇巫医在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_coconut"></a>♾️ 椰子拳师·无尽 | 使用椰子拳师在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_grape"></a>♾️ 葡萄魔术师·无尽 | 使用葡萄魔术师在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_cherry"></a>♾️ 樱桃双枪·无尽 | 使用樱桃双枪在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_pea"></a>♾️ 豌豆士兵·无尽 | 使用豌豆士兵在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_peach"></a>♾️ 蜜桃天使·无尽 | 使用蜜桃天使在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_dragonfruit"></a>♾️ 火龙果龙骑·无尽 | 使用火龙果龙骑在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_beet"></a>♾️ 甜菜狂战士·无尽 | 使用甜菜狂战士在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_asparagus"></a>♾️ 芦笋弓手·无尽 | 使用芦笋弓手在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_sweetpotato"></a>♾️ 红薯厨神·无尽 | 使用红薯厨神在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_kiwi"></a>♾️ 猕猴桃侦探·无尽 | 使用猕猴桃侦探在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_lychee"></a>♾️ 荔枝公主·无尽 | 使用荔枝公主在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_durian"></a>♾️ 榴莲霸王·无尽 | 使用榴莲霸王在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_bellpepper"></a>♾️ 青椒机甲·无尽 | 使用青椒机甲在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_wintermelon"></a>♾️ 冬瓜和尚·无尽 | 使用冬瓜和尚在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_bittermelon"></a>♾️ 苦瓜冰法·无尽 | 使用苦瓜冰法在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_sprout"></a>♾️ 豆芽学徒·无尽 | 使用豆芽学徒在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_wasabi"></a>♾️ 山葵爆破手·无尽 | 使用山葵爆破手在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_soybean"></a>♾️ 黄豆军师·无尽 | 使用黄豆军师在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_jackfruit"></a>♾️ 菠萝蜜卫士·无尽 | 使用菠萝蜜卫士在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_pomegranate"></a>♾️ 石榴炮手·无尽 | 使用石榴炮手在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_taro"></a>♾️ 芋头术士·无尽 | 使用芋头术士在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_cabbage"></a>♾️ 卷心菜老兵·无尽 | 使用卷心菜老兵在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_char_blackberry"></a>♾️ 黑莓女巫·无尽 | 使用黑莓女巫在无尽模式完成第 N 波 | 🥉 20（+2 点）<br>🥈 30（+8 点） |
| <a id="ach-endless_revive"></a>💚 再来一次 | 在无尽模式中复活 1 次 | 🥇 1（+3 点） |
| <a id="ach-endless_superboss"></a>👹 双王之战 | 击败 N 次超级 Boss 波 | 🥉 1（+20 点）<br>🥈 5（+60 点） |
| <a id="ach-endless_mutation"></a>🧬 变异体 | 在带 N 个变异词缀的无尽波次中存活 | 🥉 3（+15 点）<br>🥈 6（+50 点） |
| <a id="ach-endless_relics"></a>🏺 里程碑收藏家 | 通过无尽里程碑获得 N 件遗物 | 🥉 3（+10 点）<br>🥈 10（+30 点） |
| <a id="ach-endless_pure"></a>🕊️ 不借来生 | 不复活打到无尽第 N 波 | 🥉 45（+40 点）<br>🥈 60（+90 点） |
| <a id="ach-endless_events"></a>🎪 无尽奇遇 | 在无尽模式中经历 N 次事件波 | 🥉 5（+5 点）<br>🥈 30（+25 点） |
| <a id="ach-endless_hard"></a>☠️ 刀尖起舞 | 在无尽模式中走完 N 次危险路线 | 🥉 5（+10 点）<br>🥈 25（+40 点） |
| <a id="ach-endless_chapters"></a>🗺️ 处处无尽 | 在 N 个章节的无尽模式打到第 30 波 | 🥉 3（+20 点）<br>🥈 5（+50 点） |
| <a id="ach-endless_chars"></a>👥 群英无尽 | 用 N 名角色在无尽模式打到第 30 波 | 🥉 5（+20 点）<br>🥈 15（+60 点） |
| <a id="ach-endless_legend"></a>🌌 无尽传说 | 无尽模式完成第 150 波 | 🥇 150（+200 点） |

<a id="cat-slayer"></a>

## Boss

每名精英与 Boss 各一项成就，按击败次数分级：精英 1 / 5 / 20 次（+8 / +15 / +40 点），Boss 1 / 5 / 15 次（+20 / +40 / +80 点）。

| 精英 / Boss | 章节 | 成就 | 等级目标与奖励 |
| --- | --- | --- | --- |
| <img src="images/boss/roach_general.png" width="32" height="32" alt=""> [蟑螂将军](MONSTERS.md#boss-roach_general)<a id="ach-slay_roach_general"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 蟑螂将军克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/mold_elder.png" width="32" height="32" alt=""> [霉菌长老](MONSTERS.md#boss-mold_elder)<a id="ach-slay_mold_elder"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 霉菌长老克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/greasy_pan.png" width="32" height="32" alt=""> [油腻平底锅](MONSTERS.md#boss-greasy_pan)<a id="ach-slay_greasy_pan"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 油腻平底锅克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/fork_knight.png" width="32" height="32" alt=""> [叉子骑士](MONSTERS.md#boss-fork_knight)<a id="ach-slay_fork_knight"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 叉子骑士克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/fly_swarm_king.png" width="32" height="32" alt=""> [蝇群之主](MONSTERS.md#boss-fly_swarm_king)<a id="ach-slay_fly_swarm_king"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 蝇群之主克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/rotten_onion.png" width="32" height="32" alt=""> [腐烂洋葱](MONSTERS.md#boss-rotten_onion)<a id="ach-slay_rotten_onion"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 腐烂洋葱克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/rat_captain.png" width="32" height="32" alt=""> [鼠队长](MONSTERS.md#boss-rat_captain)<a id="ach-slay_rat_captain"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 鼠队长克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/snail_tank.png" width="32" height="32" alt=""> [装甲蜗牛](MONSTERS.md#boss-snail_tank)<a id="ach-slay_snail_tank"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 装甲蜗牛克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/queen_bee.png" width="32" height="32" alt=""> [蜂后](MONSTERS.md#boss-queen_bee)<a id="ach-slay_queen_bee"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 蜂后克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/scarecrow.png" width="32" height="32" alt=""> [邪恶稻草人](MONSTERS.md#boss-scarecrow)<a id="ach-slay_scarecrow"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 邪恶稻草人克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/spider_matron.png" width="32" height="32" alt=""> [蛛后](MONSTERS.md#boss-spider_matron)<a id="ach-slay_spider_matron"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 蛛后克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/mushroom_king.png" width="32" height="32" alt=""> [毒菇王](MONSTERS.md#boss-mushroom_king)<a id="ach-slay_mushroom_king"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 毒菇王克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/ice_golem.png" width="32" height="32" alt=""> [冰晶傀儡](MONSTERS.md#boss-ice_golem)<a id="ach-slay_ice_golem"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冰晶傀儡克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/popsicle_twins.png" width="32" height="32" alt=""> [冰棍双子](MONSTERS.md#boss-popsicle_twins)<a id="ach-slay_popsicle_twins"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冰棍双子克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/frozen_fish.png" width="32" height="32" alt=""> [冻鱼武士](MONSTERS.md#boss-frozen_fish)<a id="ach-slay_frozen_fish"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冻鱼武士克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/snow_rat.png" width="32" height="32" alt=""> [雪鼠刺客](MONSTERS.md#boss-snow_rat)<a id="ach-slay_snow_rat"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 雪鼠刺客克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/milk_slime.png" width="32" height="32" alt=""> [变质牛奶怪](MONSTERS.md#boss-milk_slime)<a id="ach-slay_milk_slime"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 变质牛奶怪克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/frost_penguin.png" width="32" height="32" alt=""> [冰霜企鹅](MONSTERS.md#boss-frost_penguin)<a id="ach-slay_frost_penguin"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冰霜企鹅克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/tire_beast.png" width="32" height="32" alt=""> [轮胎兽](MONSTERS.md#boss-tire_beast)<a id="ach-slay_tire_beast"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 轮胎兽克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/can_king.png" width="32" height="32" alt=""> [易拉罐之王](MONSTERS.md#boss-can_king)<a id="ach-slay_can_king"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 易拉罐之王克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/rag_wraith.png" width="32" height="32" alt=""> [抹布怨灵](MONSTERS.md#boss-rag_wraith)<a id="ach-slay_rag_wraith"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 抹布怨灵克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/battery_bug.png" width="32" height="32" alt=""> [漏电电池虫](MONSTERS.md#boss-battery_bug)<a id="ach-slay_battery_bug"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 漏电电池虫克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/garbage_rat.png" width="32" height="32" alt=""> [垃圾鼠王](MONSTERS.md#boss-garbage_rat)<a id="ach-slay_garbage_rat"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 垃圾鼠王克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/oil_titan.png" width="32" height="32" alt=""> [石油泰坦](MONSTERS.md#boss-oil_titan)<a id="ach-slay_oil_titan"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 石油泰坦克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/conveyor_worm.png" width="32" height="32" alt=""> [传送带蠕虫](MONSTERS.md#boss-conveyor_worm)<a id="ach-slay_conveyor_worm"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 传送带蠕虫克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/ketchup_golem.png" width="32" height="32" alt=""> [番茄酱傀儡](MONSTERS.md#boss-ketchup_golem)<a id="ach-slay_ketchup_golem"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 番茄酱傀儡克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/security_bot.png" width="32" height="32" alt=""> [保安机器人](MONSTERS.md#boss-security_bot)<a id="ach-slay_security_bot"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 保安机器人克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/press_machine.png" width="32" height="32" alt=""> [冲压机](MONSTERS.md#boss-press_machine)<a id="ach-slay_press_machine"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 冲压机克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/chef_minion.png" width="32" height="32" alt=""> [腐烂副厨](MONSTERS.md#boss-chef_minion)<a id="ach-slay_chef_minion"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 腐烂副厨克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/furnace_imp.png" width="32" height="32" alt=""> [熔炉小鬼](MONSTERS.md#boss-furnace_imp)<a id="ach-slay_furnace_imp"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 熔炉小鬼克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/pumpkin_brute.png" width="32" height="32" alt=""> [南瓜蛮汉](MONSTERS.md#boss-pumpkin_brute)<a id="ach-slay_pumpkin_brute"></a> | [第六章 · 腐烂温室](CHAPTERS.md#chapter-6) | 南瓜蛮汉克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/spore_matron.png" width="32" height="32" alt=""> [孢子女王](MONSTERS.md#boss-spore_matron)<a id="ach-slay_spore_matron"></a> | [第六章 · 腐烂温室](CHAPTERS.md#chapter-6) | 孢子女王克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/carrot_knight.png" width="32" height="32" alt=""> [胡萝卜亡骑](MONSTERS.md#boss-carrot_knight)<a id="ach-slay_carrot_knight"></a> | [第七章 · 腐烂菜园](CHAPTERS.md#chapter-7) | 胡萝卜亡骑克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/onion_witch.png" width="32" height="32" alt=""> [洋葱巫婆](MONSTERS.md#boss-onion_witch)<a id="ach-slay_onion_witch"></a> | [第七章 · 腐烂菜园](CHAPTERS.md#chapter-7) | 洋葱巫婆克星 | 🥉 1（+8 点）<br>🥈 5（+15 点）<br>🥇 20（+40 点） |
| <img src="images/boss/mold_king.png" width="32" height="32" alt=""> [霉菌大王](MONSTERS.md#boss-mold_king)<a id="ach-slay_mold_king"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 霉菌大王克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/grease_chef.png" width="32" height="32" alt=""> [油烟怪厨](MONSTERS.md#boss-grease_chef)<a id="ach-slay_grease_chef"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 油烟怪厨克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/cockroach_emperor.png" width="32" height="32" alt=""> [蟑螂皇帝](MONSTERS.md#boss-cockroach_emperor)<a id="ach-slay_cockroach_emperor"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 蟑螂皇帝克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/locust_queen.png" width="32" height="32" alt=""> [蝗虫女皇](MONSTERS.md#boss-locust_queen)<a id="ach-slay_locust_queen"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 蝗虫女皇克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/rotten_pumpkin.png" width="32" height="32" alt=""> [腐烂南瓜王](MONSTERS.md#boss-rotten_pumpkin)<a id="ach-slay_rotten_pumpkin"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 腐烂南瓜王克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/mole_general.png" width="32" height="32" alt=""> [鼹鼠大将](MONSTERS.md#boss-mole_general)<a id="ach-slay_mole_general"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 鼹鼠大将克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/frost_rat_king.png" width="32" height="32" alt=""> [冰霜鼠王](MONSTERS.md#boss-frost_rat_king)<a id="ach-slay_frost_rat_king"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冰霜鼠王克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/ice_cream_tyrant.png" width="32" height="32" alt=""> [冰淇淋暴君](MONSTERS.md#boss-ice_cream_tyrant)<a id="ach-slay_ice_cream_tyrant"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冰淇淋暴君克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/freezer_heart.png" width="32" height="32" alt=""> [冰柜之心](MONSTERS.md#boss-freezer_heart)<a id="ach-slay_freezer_heart"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冰柜之心克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/trash_golem.png" width="32" height="32" alt=""> [垃圾巨像](MONSTERS.md#boss-trash_golem)<a id="ach-slay_trash_golem"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 垃圾巨像克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/toxic_barrel.png" width="32" height="32" alt=""> [毒液桶魔](MONSTERS.md#boss-toxic_barrel)<a id="ach-slay_toxic_barrel"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 毒液桶魔克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/scrap_dragon.png" width="32" height="32" alt=""> [废铁巨龙](MONSTERS.md#boss-scrap_dragon)<a id="ach-slay_scrap_dragon"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 废铁巨龙克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/rotten_chef.png" width="32" height="32" alt=""> [腐烂大厨](MONSTERS.md#boss-rotten_chef)<a id="ach-slay_rotten_chef"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 腐烂大厨克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/factory_core.png" width="32" height="32" alt=""> [工厂主脑](MONSTERS.md#boss-factory_core)<a id="ach-slay_factory_core"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 工厂主脑克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/ketchup_leviathan.png" width="32" height="32" alt=""> [番茄酱海怪](MONSTERS.md#boss-ketchup_leviathan)<a id="ach-slay_ketchup_leviathan"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 番茄酱海怪克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/blight_gardener.png" width="32" height="32" alt=""> [枯萎园丁](MONSTERS.md#boss-blight_gardener)<a id="ach-slay_blight_gardener"></a> | [第六章 · 腐烂温室](CHAPTERS.md#chapter-6) | 枯萎园丁克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/rot_mother.png" width="32" height="32" alt=""> [腐土之母](MONSTERS.md#boss-rot_mother)<a id="ach-slay_rot_mother"></a> | [第七章 · 腐烂菜园](CHAPTERS.md#chapter-7) | 腐土之母克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |
| <img src="images/boss/rot_king.png" width="32" height="32" alt=""> [腐烂之王](MONSTERS.md#boss-rot_king)<a id="ach-slay_rot_king"></a> | [第七章 · 腐烂菜园](CHAPTERS.md#chapter-7) | 腐烂之王克星 | 🥉 1（+20 点）<br>🥈 5（+40 点）<br>🥇 15（+80 点） |

<a id="cat-character"></a>

## 角色

每名角色 11 项成就（以番茄妹为例）：


| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| 🤝 番茄妹的伙伴 | 使用番茄妹开局 N 次 | 🥉 1（+1 点）<br>🥈 10（+5 点）<br>🥇 100（+30 点） |
| 🏅 番茄妹凯旋 | 使用番茄妹通关 N 次 | 🥉 1（+10 点）<br>🥈 5（+25 点）<br>🥇 20（+60 点） |
| 🌊 番茄妹出征 | 使用番茄妹完成第 N 波 | 🥉 5（+1 点）<br>🥈 10（+3 点） |
| 📈 番茄妹成长记 | 使用番茄妹单局达到 N 级 | 🥉 10（+1 点）<br>🥈 20（+5 点）<br>🥇 30（+25 点） |
| ⚔️ 番茄妹的战绩 | 使用番茄妹累计击败 N 只怪物 | 🥉 500（+1 点）<br>🥈 5,000（+5 点）<br>🥇 30,000（+20 点） |
| 🎯 番茄妹猎精英 | 使用番茄妹击败 N 名精英 | 🥉 1（+2 点）<br>🥈 10（+8 点） |
| 🍳 番茄妹·第1章 | 使用番茄妹通关第 1 章 | 🥇 1（+8 点） |
| 🌱 番茄妹·第2章 | 使用番茄妹通关第 2 章 | 🥇 1（+15 点） |
| ❄️ 番茄妹·第3章 | 使用番茄妹通关第 3 章 | 🥇 1（+25 点） |
| 🗑️ 番茄妹·第4章 | 使用番茄妹通关第 4 章 | 🥇 1（+40 点） |
| 🏭 番茄妹·第5章 | 使用番茄妹通关第 5 章 | 🥇 1（+60 点） |

---

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · **成就** · [天赋](TALENTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

# 成就（91 项）

**中文** · [English](en/ACHIEVEMENTS.md)

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · **成就** · [设计文档](GDD.md) · [数值表](DATA_TABLES.md)

> 由 `npm run docs` 从 `src/data/*.ts` 自动生成，请勿手改。

成就分为多个等级（🥉 铜 → 🥈 银 → 🥇 金 → 💎 钻石，单级成就直接为金牌），每达成一级获得成就点，全部成就点共 5495 点。

成就点用于在选角界面购买[角色](CHARACTERS.md)；部分角色需要先达成指定成就才能购买。解锁时屏幕顶部会弹出提示，主菜单「成就」可查看全部进度。

## 目录

- [角色价格](#prices)
- [战斗](#cat-combat)
- [精英与 Boss](#cat-boss)
- [进度](#cat-progress)
- [构筑](#cat-build)
- [经济](#cat-economy)
- [图鉴](#cat-codex)
- [角色](#cat-character)

<a id="prices"></a>

## 角色价格

| 角色 | 解锁方式 |
| --- | --- |
| <img src="images/char/tomato.png" width="32" height="32" alt=""> [番茄妹](CHARACTERS.md#char-tomato) | 默认解锁 |
| <img src="images/char/carrot.png" width="32" height="32" alt=""> [胡萝卜骑士](CHARACTERS.md#char-carrot) | 默认解锁 |
| <img src="images/char/chili.png" width="32" height="32" alt=""> [辣椒姐](CHARACTERS.md#char-chili) | 默认解锁 |
| <img src="images/char/corn.png" width="32" height="32" alt=""> [玉米枪手](CHARACTERS.md#char-corn) | 默认解锁 |
| <img src="images/char/mushroom.png" width="32" height="32" alt=""> [蘑菇巫医](CHARACTERS.md#char-mushroom) | 30 成就点 |
| <img src="images/char/watermelon.png" width="32" height="32" alt=""> [西瓜胖墩](CHARACTERS.md#char-watermelon) | 40 成就点 |
| <img src="images/char/lemon.png" width="32" height="32" alt=""> [柠檬刺客](CHARACTERS.md#char-lemon) | 40 成就点 |
| <img src="images/char/eggplant.png" width="32" height="32" alt=""> [茄子法师](CHARACTERS.md#char-eggplant) | 40 成就点 |
| <img src="images/char/pineapple.png" width="32" height="32" alt=""> [菠萝船长](CHARACTERS.md#char-pineapple) | 40 成就点 |
| <img src="images/char/coconut.png" width="32" height="32" alt=""> [椰子拳师](CHARACTERS.md#char-coconut) | 40 成就点 |
| <img src="images/char/cherry.png" width="32" height="32" alt=""> [樱桃双枪](CHARACTERS.md#char-cherry) | 40 成就点 |
| <img src="images/char/sweetpotato.png" width="32" height="32" alt=""> [红薯厨神](CHARACTERS.md#char-sweetpotato) | 40 成就点 |
| <img src="images/char/grape.png" width="32" height="32" alt=""> [葡萄魔术师](CHARACTERS.md#char-grape) | 60 成就点 |
| <img src="images/char/pea.png" width="32" height="32" alt=""> [豌豆士兵](CHARACTERS.md#char-pea) | 60 成就点 |
| <img src="images/char/kiwi.png" width="32" height="32" alt=""> [猕猴桃侦探](CHARACTERS.md#char-kiwi) | 60 成就点 |
| <img src="images/char/garlic.png" width="32" height="32" alt=""> [大蒜伯爵](CHARACTERS.md#char-garlic) | 80 成就点 |
| <img src="images/char/blueberry.png" width="32" height="32" alt=""> [蓝莓双子](CHARACTERS.md#char-blueberry) | 80 成就点 |
| <img src="images/char/strawberry.png" width="32" height="32" alt=""> [草莓偶像](CHARACTERS.md#char-strawberry) | 80 成就点 |
| <img src="images/char/peach.png" width="32" height="32" alt=""> [蜜桃天使](CHARACTERS.md#char-peach) | 80 成就点 |
| <img src="images/char/beet.png" width="32" height="32" alt=""> [甜菜狂战士](CHARACTERS.md#char-beet) | 80 成就点 |
| <img src="images/char/asparagus.png" width="32" height="32" alt=""> [芦笋弓手](CHARACTERS.md#char-asparagus) | 80 成就点 |
| <img src="images/char/sprout.png" width="32" height="32" alt=""> [豆芽学徒](CHARACTERS.md#char-sprout) | 80 成就点 |
| <img src="images/char/pumpkin.png" width="32" height="32" alt=""> [南瓜幽灵](CHARACTERS.md#char-pumpkin) | 100 成就点，需先达成 [菜园守护者](#ach-clear_2) |
| <img src="images/char/ginger.png" width="32" height="32" alt=""> [生姜忍者](CHARACTERS.md#char-ginger) | 100 成就点，需先达成 [番茄酱风暴（银）](#ach-kills) |
| <img src="images/char/dragonfruit.png" width="32" height="32" alt=""> [火龙果龙骑](CHARACTERS.md#char-dragonfruit) | 100 成就点，需先达成 [菜园守护者](#ach-clear_2) |
| <img src="images/char/lychee.png" width="32" height="32" alt=""> [荔枝公主](CHARACTERS.md#char-lychee) | 100 成就点，需先达成 [菜园守护者](#ach-clear_2) |
| <img src="images/char/bittermelon.png" width="32" height="32" alt=""> [苦瓜冰法](CHARACTERS.md#char-bittermelon) | 100 成就点，需先达成 [菜园守护者](#ach-clear_2) |
| <img src="images/char/avocado.png" width="32" height="32" alt=""> [牛油果博士](CHARACTERS.md#char-avocado) | 130 成就点，需先达成 [破冰者](#ach-clear_3) |
| <img src="images/char/durian.png" width="32" height="32" alt=""> [榴莲霸王](CHARACTERS.md#char-durian) | 130 成就点，需先达成 [破冰者](#ach-clear_3) |
| <img src="images/char/bellpepper.png" width="32" height="32" alt=""> [青椒机甲](CHARACTERS.md#char-bellpepper) | 130 成就点，需先达成 [破冰者](#ach-clear_3) |
| <img src="images/char/wintermelon.png" width="32" height="32" alt=""> [冬瓜和尚](CHARACTERS.md#char-wintermelon) | 130 成就点，需先达成 [Boss 终结者（铜）](#ach-bosses) |
| <img src="images/char/onion.png" width="32" height="32" alt=""> [洋葱大叔](CHARACTERS.md#char-onion) | 160 成就点，需先达成 [垃圾场之王](#ach-clear_4) |
| <img src="images/char/wasabi.png" width="32" height="32" alt=""> [山葵爆破手](CHARACTERS.md#char-wasabi) | 160 成就点，需先达成 [垃圾场之王](#ach-clear_4) |

<a id="cat-combat"></a>

## 战斗

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-kills"></a>🔪 番茄酱风暴 | 累计击败 N 只怪物 | 🥉 100（+10 点）<br>🥈 1,000（+20 点）<br>🥇 10,000（+40 点）<br>💎 50,000（+60 点） |
| <a id="ach-run_kills"></a>🌪️ 割草机 | 单局击败 N 只怪物 | 🥉 300（+10 点）<br>🥈 800（+20 点）<br>🥇 1,500（+40 点） |
| <a id="ach-perfect"></a>🛡️ 毫发无伤 | 累计 N 次无伤完成波次 | 🥉 1（+10 点）<br>🥈 10（+20 点）<br>🥇 50（+40 点） |
| <a id="ach-revive"></a>🔥 凤凰涅槃 | 在战斗中复活 N 次 | 🥇 1（+15 点） |

<a id="cat-boss"></a>

## 精英与 Boss

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-elites"></a>🎯 精英猎手 | 累计击败 N 名精英 | 🥉 1（+10 点）<br>🥈 10（+20 点）<br>🥇 50（+40 点） |
| <a id="ach-bosses"></a>👑 Boss 终结者 | 累计击败 N 名 Boss | 🥉 1（+20 点）<br>🥈 5（+30 点）<br>🥇 15（+50 点） |
| <a id="ach-overtime"></a>😤 绝地反击 | 在 Boss 狂暴后将其击败 N 次 | 🥇 1（+25 点） |

<a id="cat-progress"></a>

## 进度

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-clear_1"></a>🍳 厨房清扫 | 通关第一章 | 🥇 1（+20 点） |
| <a id="ach-clear_2"></a>🌱 菜园守护者 | 通关第二章 | 🥇 2（+30 点） |
| <a id="ach-clear_3"></a>❄️ 破冰者 | 通关第三章 | 🥇 3（+40 点） |
| <a id="ach-clear_4"></a>🗑️ 垃圾场之王 | 通关第四章 | 🥇 4（+50 点） |
| <a id="ach-clear_5"></a>🏭 腐烂终结 | 通关第五章，击败腐烂之源 | 🥇 5（+60 点） |
| <a id="ach-wins"></a>🎖️ 常胜将军 | 累计通关 N 次 | 🥉 1（+15 点）<br>🥈 10（+30 点）<br>🥇 30（+50 点） |
| <a id="ach-chars_won"></a>🎭 多面手 | 用 N 名不同角色通关 | 🥉 3（+15 点）<br>🥈 10（+30 点）<br>🥇 33（+60 点） |
| <a id="ach-chars_owned"></a>🔓 全员集结 | 拥有 N 名角色 | 🥉 8（+10 点）<br>🥈 20（+25 点）<br>🥇 33（+50 点） |

<a id="cat-build"></a>

## 构筑

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-level"></a>📈 茁壮成长 | 单局达到 N 级 | 🥉 10（+10 点）<br>🥈 20（+20 点）<br>🥇 30（+40 点） |
| <a id="ach-items"></a>🎒 收藏家 | 单局持有 N 件道具 | 🥉 15（+10 点）<br>🥈 30（+20 点）<br>🥇 50（+40 点） |
| <a id="ach-weapons"></a>🧰 武装到牙齿 | 单局持有 N 把武器 | 🥇 6（+15 点） |
| <a id="ach-t4"></a>💎 神兵利器 | 累计合成 N 把 T4 武器 | 🥉 1（+20 点）<br>🥈 5（+40 点） |

<a id="cat-economy"></a>

## 经济

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-rich"></a>💰 小有积蓄 | 同时持有 N 番茄籽 | 🥉 200（+10 点）<br>🥈 500（+20 点）<br>🥇 1,000（+40 点） |
| <a id="ach-earned"></a>🏦 番茄大亨 | 累计获得 N 番茄籽 | 🥉 2,000（+10 点）<br>🥈 20,000（+25 点）<br>🥇 100,000（+50 点） |

<a id="cat-codex"></a>

## 图鉴

| 成就 | 条件 | 等级目标与奖励 |
| --- | --- | --- |
| <a id="ach-codex_weapons"></a>🗡️ 军火库 | 在图鉴中发现 N 把武器 | 🥉 9（+10 点）<br>🥈 18（+25 点） |
| <a id="ach-codex_items"></a>📦 道具百科 | 在图鉴中发现 N 件道具 | 🥉 50（+10 点）<br>🥈 200（+25 点）<br>🥇 562（+50 点） |
| <a id="ach-codex_monsters"></a>🔬 怪物学者 | 在图鉴中发现 N 种小怪 | 🥇 25（+25 点） |
| <a id="ach-codex_bosses"></a>📜 猎魔名录 | 在图鉴中发现 N 名精英与 Boss | 🥉 15（+15 点）<br>🥈 45（+40 点） |

<a id="cat-character"></a>

## 角色

每名角色两项成就：「X的伙伴」使用该角色开局，「X凯旋」使用该角色通关。

| 角色 | 开局次数 | 通关次数 |
| --- | --- | --- |
| <img src="images/char/tomato.png" width="32" height="32" alt=""> [番茄妹](CHARACTERS.md#char-tomato)<a id="ach-char_runs_tomato"></a><a id="ach-char_wins_tomato"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/carrot.png" width="32" height="32" alt=""> [胡萝卜骑士](CHARACTERS.md#char-carrot)<a id="ach-char_runs_carrot"></a><a id="ach-char_wins_carrot"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/chili.png" width="32" height="32" alt=""> [辣椒姐](CHARACTERS.md#char-chili)<a id="ach-char_runs_chili"></a><a id="ach-char_wins_chili"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/corn.png" width="32" height="32" alt=""> [玉米枪手](CHARACTERS.md#char-corn)<a id="ach-char_runs_corn"></a><a id="ach-char_wins_corn"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/watermelon.png" width="32" height="32" alt=""> [西瓜胖墩](CHARACTERS.md#char-watermelon)<a id="ach-char_runs_watermelon"></a><a id="ach-char_wins_watermelon"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/lemon.png" width="32" height="32" alt=""> [柠檬刺客](CHARACTERS.md#char-lemon)<a id="ach-char_runs_lemon"></a><a id="ach-char_wins_lemon"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/eggplant.png" width="32" height="32" alt=""> [茄子法师](CHARACTERS.md#char-eggplant)<a id="ach-char_runs_eggplant"></a><a id="ach-char_wins_eggplant"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/garlic.png" width="32" height="32" alt=""> [大蒜伯爵](CHARACTERS.md#char-garlic)<a id="ach-char_runs_garlic"></a><a id="ach-char_wins_garlic"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/blueberry.png" width="32" height="32" alt=""> [蓝莓双子](CHARACTERS.md#char-blueberry)<a id="ach-char_runs_blueberry"></a><a id="ach-char_wins_blueberry"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/pineapple.png" width="32" height="32" alt=""> [菠萝船长](CHARACTERS.md#char-pineapple)<a id="ach-char_runs_pineapple"></a><a id="ach-char_wins_pineapple"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/pumpkin.png" width="32" height="32" alt=""> [南瓜幽灵](CHARACTERS.md#char-pumpkin)<a id="ach-char_runs_pumpkin"></a><a id="ach-char_wins_pumpkin"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/strawberry.png" width="32" height="32" alt=""> [草莓偶像](CHARACTERS.md#char-strawberry)<a id="ach-char_runs_strawberry"></a><a id="ach-char_wins_strawberry"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/ginger.png" width="32" height="32" alt=""> [生姜忍者](CHARACTERS.md#char-ginger)<a id="ach-char_runs_ginger"></a><a id="ach-char_wins_ginger"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/avocado.png" width="32" height="32" alt=""> [牛油果博士](CHARACTERS.md#char-avocado)<a id="ach-char_runs_avocado"></a><a id="ach-char_wins_avocado"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/onion.png" width="32" height="32" alt=""> [洋葱大叔](CHARACTERS.md#char-onion)<a id="ach-char_runs_onion"></a><a id="ach-char_wins_onion"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/mushroom.png" width="32" height="32" alt=""> [蘑菇巫医](CHARACTERS.md#char-mushroom)<a id="ach-char_runs_mushroom"></a><a id="ach-char_wins_mushroom"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/coconut.png" width="32" height="32" alt=""> [椰子拳师](CHARACTERS.md#char-coconut)<a id="ach-char_runs_coconut"></a><a id="ach-char_wins_coconut"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/grape.png" width="32" height="32" alt=""> [葡萄魔术师](CHARACTERS.md#char-grape)<a id="ach-char_runs_grape"></a><a id="ach-char_wins_grape"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/cherry.png" width="32" height="32" alt=""> [樱桃双枪](CHARACTERS.md#char-cherry)<a id="ach-char_runs_cherry"></a><a id="ach-char_wins_cherry"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/pea.png" width="32" height="32" alt=""> [豌豆士兵](CHARACTERS.md#char-pea)<a id="ach-char_runs_pea"></a><a id="ach-char_wins_pea"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/peach.png" width="32" height="32" alt=""> [蜜桃天使](CHARACTERS.md#char-peach)<a id="ach-char_runs_peach"></a><a id="ach-char_wins_peach"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/dragonfruit.png" width="32" height="32" alt=""> [火龙果龙骑](CHARACTERS.md#char-dragonfruit)<a id="ach-char_runs_dragonfruit"></a><a id="ach-char_wins_dragonfruit"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/beet.png" width="32" height="32" alt=""> [甜菜狂战士](CHARACTERS.md#char-beet)<a id="ach-char_runs_beet"></a><a id="ach-char_wins_beet"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/asparagus.png" width="32" height="32" alt=""> [芦笋弓手](CHARACTERS.md#char-asparagus)<a id="ach-char_runs_asparagus"></a><a id="ach-char_wins_asparagus"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/sweetpotato.png" width="32" height="32" alt=""> [红薯厨神](CHARACTERS.md#char-sweetpotato)<a id="ach-char_runs_sweetpotato"></a><a id="ach-char_wins_sweetpotato"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/kiwi.png" width="32" height="32" alt=""> [猕猴桃侦探](CHARACTERS.md#char-kiwi)<a id="ach-char_runs_kiwi"></a><a id="ach-char_wins_kiwi"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/lychee.png" width="32" height="32" alt=""> [荔枝公主](CHARACTERS.md#char-lychee)<a id="ach-char_runs_lychee"></a><a id="ach-char_wins_lychee"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/durian.png" width="32" height="32" alt=""> [榴莲霸王](CHARACTERS.md#char-durian)<a id="ach-char_runs_durian"></a><a id="ach-char_wins_durian"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/bellpepper.png" width="32" height="32" alt=""> [青椒机甲](CHARACTERS.md#char-bellpepper)<a id="ach-char_runs_bellpepper"></a><a id="ach-char_wins_bellpepper"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/wintermelon.png" width="32" height="32" alt=""> [冬瓜和尚](CHARACTERS.md#char-wintermelon)<a id="ach-char_runs_wintermelon"></a><a id="ach-char_wins_wintermelon"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/bittermelon.png" width="32" height="32" alt=""> [苦瓜冰法](CHARACTERS.md#char-bittermelon)<a id="ach-char_runs_bittermelon"></a><a id="ach-char_wins_bittermelon"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/sprout.png" width="32" height="32" alt=""> [豆芽学徒](CHARACTERS.md#char-sprout)<a id="ach-char_runs_sprout"></a><a id="ach-char_wins_sprout"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |
| <img src="images/char/wasabi.png" width="32" height="32" alt=""> [山葵爆破手](CHARACTERS.md#char-wasabi)<a id="ach-char_runs_wasabi"></a><a id="ach-char_wins_wasabi"></a> | 🥉 1（+5 点）<br>🥈 10（+15 点）<br>🥇 100（+40 点） | 🥉 1（+20 点）<br>🥈 5（+40 点） |

---

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · **成就** · [设计文档](GDD.md) · [数值表](DATA_TABLES.md)

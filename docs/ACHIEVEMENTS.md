# 成就（136 项）

**中文** · [English](en/ACHIEVEMENTS.md)

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · **成就** · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

> 由 `npm run docs` 从 `src/data/*.ts` 自动生成，请勿手改。

成就分为多个等级（🥉 铜 → 🥈 银 → 🥇 金 → 💎 钻石，单级成就直接为金牌），每达成一级获得成就点，全部成就点共 6095 点。

成就点用于在选角界面购买[角色](CHARACTERS.md)；部分角色需要先达成指定成就才能购买。解锁时屏幕顶部会弹出提示，主菜单「成就」可查看全部进度。

## 目录

- [角色价格](#prices)
- [战斗](#cat-combat)
- [精英与 Boss](#cat-boss)
- [进度](#cat-progress)
- [构筑](#cat-build)
- [经济](#cat-economy)
- [图鉴](#cat-codex)
- [首杀](#cat-slayer)
- [角色](#cat-character)

<a id="prices"></a>

## 角色价格

| 角色 | 解锁方式 |
| --- | --- |
| <img src="images/char/tomato.png" width="32" height="32" alt=""> [番茄妹](CHARACTERS.md#char-tomato) | 默认解锁 |
| <img src="images/char/carrot.png" width="32" height="32" alt=""> [胡萝卜骑士](CHARACTERS.md#char-carrot) | 默认解锁 |
| <img src="images/char/chili.png" width="32" height="32" alt=""> [辣椒姐](CHARACTERS.md#char-chili) | 默认解锁 |
| <img src="images/char/corn.png" width="32" height="32" alt=""> [玉米枪手](CHARACTERS.md#char-corn) | 默认解锁 |
| <img src="images/char/mushroom.png" width="32" height="32" alt=""> [蘑菇巫医](CHARACTERS.md#char-mushroom) | 70 成就点 |
| <img src="images/char/watermelon.png" width="32" height="32" alt=""> [西瓜胖墩](CHARACTERS.md#char-watermelon) | 80 成就点 |
| <img src="images/char/lemon.png" width="32" height="32" alt=""> [柠檬刺客](CHARACTERS.md#char-lemon) | 80 成就点 |
| <img src="images/char/eggplant.png" width="32" height="32" alt=""> [茄子法师](CHARACTERS.md#char-eggplant) | 80 成就点 |
| <img src="images/char/pineapple.png" width="32" height="32" alt=""> [菠萝船长](CHARACTERS.md#char-pineapple) | 80 成就点 |
| <img src="images/char/coconut.png" width="32" height="32" alt=""> [椰子拳师](CHARACTERS.md#char-coconut) | 80 成就点 |
| <img src="images/char/cherry.png" width="32" height="32" alt=""> [樱桃双枪](CHARACTERS.md#char-cherry) | 80 成就点 |
| <img src="images/char/sweetpotato.png" width="32" height="32" alt=""> [红薯厨神](CHARACTERS.md#char-sweetpotato) | 80 成就点 |
| <img src="images/char/grape.png" width="32" height="32" alt=""> [葡萄魔术师](CHARACTERS.md#char-grape) | 140 成就点 |
| <img src="images/char/pea.png" width="32" height="32" alt=""> [豌豆士兵](CHARACTERS.md#char-pea) | 140 成就点 |
| <img src="images/char/kiwi.png" width="32" height="32" alt=""> [猕猴桃侦探](CHARACTERS.md#char-kiwi) | 140 成就点 |
| <img src="images/char/garlic.png" width="32" height="32" alt=""> [大蒜伯爵](CHARACTERS.md#char-garlic) | 170 成就点 |
| <img src="images/char/blueberry.png" width="32" height="32" alt=""> [蓝莓双子](CHARACTERS.md#char-blueberry) | 170 成就点 |
| <img src="images/char/strawberry.png" width="32" height="32" alt=""> [草莓偶像](CHARACTERS.md#char-strawberry) | 170 成就点 |
| <img src="images/char/peach.png" width="32" height="32" alt=""> [蜜桃天使](CHARACTERS.md#char-peach) | 170 成就点 |
| <img src="images/char/beet.png" width="32" height="32" alt=""> [甜菜狂战士](CHARACTERS.md#char-beet) | 170 成就点 |
| <img src="images/char/asparagus.png" width="32" height="32" alt=""> [芦笋弓手](CHARACTERS.md#char-asparagus) | 170 成就点 |
| <img src="images/char/sprout.png" width="32" height="32" alt=""> [豆芽学徒](CHARACTERS.md#char-sprout) | 170 成就点 |
| <img src="images/char/pumpkin.png" width="32" height="32" alt=""> [南瓜幽灵](CHARACTERS.md#char-pumpkin) | 175 成就点，需先达成 [菜园守护者](#ach-clear_2) |
| <img src="images/char/ginger.png" width="32" height="32" alt=""> [生姜忍者](CHARACTERS.md#char-ginger) | 175 成就点，需先达成 [番茄酱风暴（银）](#ach-kills) |
| <img src="images/char/dragonfruit.png" width="32" height="32" alt=""> [火龙果龙骑](CHARACTERS.md#char-dragonfruit) | 175 成就点，需先达成 [菜园守护者](#ach-clear_2) |
| <img src="images/char/lychee.png" width="32" height="32" alt=""> [荔枝公主](CHARACTERS.md#char-lychee) | 175 成就点，需先达成 [菜园守护者](#ach-clear_2) |
| <img src="images/char/bittermelon.png" width="32" height="32" alt=""> [苦瓜冰法](CHARACTERS.md#char-bittermelon) | 175 成就点，需先达成 [菜园守护者](#ach-clear_2) |
| <img src="images/char/avocado.png" width="32" height="32" alt=""> [牛油果博士](CHARACTERS.md#char-avocado) | 190 成就点，需先达成 [破冰者](#ach-clear_3) |
| <img src="images/char/durian.png" width="32" height="32" alt=""> [榴莲霸王](CHARACTERS.md#char-durian) | 190 成就点，需先达成 [破冰者](#ach-clear_3) |
| <img src="images/char/bellpepper.png" width="32" height="32" alt=""> [青椒机甲](CHARACTERS.md#char-bellpepper) | 190 成就点，需先达成 [破冰者](#ach-clear_3) |
| <img src="images/char/wintermelon.png" width="32" height="32" alt=""> [冬瓜和尚](CHARACTERS.md#char-wintermelon) | 190 成就点，需先达成 [Boss 终结者（铜）](#ach-bosses) |
| <img src="images/char/onion.png" width="32" height="32" alt=""> [洋葱大叔](CHARACTERS.md#char-onion) | 200 成就点，需先达成 [垃圾场之王](#ach-clear_4) |
| <img src="images/char/wasabi.png" width="32" height="32" alt=""> [山葵爆破手](CHARACTERS.md#char-wasabi) | 200 成就点，需先达成 [垃圾场之王](#ach-clear_4) |

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
| <a id="ach-codex_weapons"></a>🗡️ 军火库 | 在图鉴中发现 N 把武器 | 🥉 9（+10 点）<br>🥈 50（+25 点） |
| <a id="ach-codex_items"></a>📦 道具百科 | 在图鉴中发现 N 件道具 | 🥉 50（+10 点）<br>🥈 200（+25 点）<br>🥇 566（+50 点） |
| <a id="ach-codex_monsters"></a>🔬 怪物学者 | 在图鉴中发现 N 种小怪 | 🥇 75（+25 点） |
| <a id="ach-codex_bosses"></a>📜 猎魔名录 | 在图鉴中发现 N 名精英与 Boss | 🥉 15（+15 点）<br>🥈 45（+40 点） |

<a id="cat-slayer"></a>

## 首杀

每名精英与 Boss 首次击败时解锁，精英 +10 点，Boss +20 点。

| 精英 / Boss | 章节 | 成就 | 奖励 |
| --- | --- | --- | --- |
| <img src="images/boss/roach_general.png" width="32" height="32" alt=""> [蟑螂将军](MONSTERS.md#boss-roach_general)<a id="ach-slay_roach_general"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 蟑螂将军克星 | +10 |
| <img src="images/boss/mold_elder.png" width="32" height="32" alt=""> [霉菌长老](MONSTERS.md#boss-mold_elder)<a id="ach-slay_mold_elder"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 霉菌长老克星 | +10 |
| <img src="images/boss/greasy_pan.png" width="32" height="32" alt=""> [油腻平底锅](MONSTERS.md#boss-greasy_pan)<a id="ach-slay_greasy_pan"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 油腻平底锅克星 | +10 |
| <img src="images/boss/fork_knight.png" width="32" height="32" alt=""> [叉子骑士](MONSTERS.md#boss-fork_knight)<a id="ach-slay_fork_knight"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 叉子骑士克星 | +10 |
| <img src="images/boss/fly_swarm_king.png" width="32" height="32" alt=""> [蝇群之主](MONSTERS.md#boss-fly_swarm_king)<a id="ach-slay_fly_swarm_king"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 蝇群之主克星 | +10 |
| <img src="images/boss/rotten_onion.png" width="32" height="32" alt=""> [腐烂洋葱](MONSTERS.md#boss-rotten_onion)<a id="ach-slay_rotten_onion"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 腐烂洋葱克星 | +10 |
| <img src="images/boss/rat_captain.png" width="32" height="32" alt=""> [鼠队长](MONSTERS.md#boss-rat_captain)<a id="ach-slay_rat_captain"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 鼠队长克星 | +10 |
| <img src="images/boss/snail_tank.png" width="32" height="32" alt=""> [装甲蜗牛](MONSTERS.md#boss-snail_tank)<a id="ach-slay_snail_tank"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 装甲蜗牛克星 | +10 |
| <img src="images/boss/queen_bee.png" width="32" height="32" alt=""> [蜂后](MONSTERS.md#boss-queen_bee)<a id="ach-slay_queen_bee"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 蜂后克星 | +10 |
| <img src="images/boss/scarecrow.png" width="32" height="32" alt=""> [邪恶稻草人](MONSTERS.md#boss-scarecrow)<a id="ach-slay_scarecrow"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 邪恶稻草人克星 | +10 |
| <img src="images/boss/spider_matron.png" width="32" height="32" alt=""> [蛛后](MONSTERS.md#boss-spider_matron)<a id="ach-slay_spider_matron"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 蛛后克星 | +10 |
| <img src="images/boss/mushroom_king.png" width="32" height="32" alt=""> [毒菇王](MONSTERS.md#boss-mushroom_king)<a id="ach-slay_mushroom_king"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 毒菇王克星 | +10 |
| <img src="images/boss/ice_golem.png" width="32" height="32" alt=""> [冰晶傀儡](MONSTERS.md#boss-ice_golem)<a id="ach-slay_ice_golem"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冰晶傀儡克星 | +10 |
| <img src="images/boss/popsicle_twins.png" width="32" height="32" alt=""> [冰棍双子](MONSTERS.md#boss-popsicle_twins)<a id="ach-slay_popsicle_twins"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冰棍双子克星 | +10 |
| <img src="images/boss/frozen_fish.png" width="32" height="32" alt=""> [冻鱼武士](MONSTERS.md#boss-frozen_fish)<a id="ach-slay_frozen_fish"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冻鱼武士克星 | +10 |
| <img src="images/boss/snow_rat.png" width="32" height="32" alt=""> [雪鼠刺客](MONSTERS.md#boss-snow_rat)<a id="ach-slay_snow_rat"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 雪鼠刺客克星 | +10 |
| <img src="images/boss/milk_slime.png" width="32" height="32" alt=""> [变质牛奶怪](MONSTERS.md#boss-milk_slime)<a id="ach-slay_milk_slime"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 变质牛奶怪克星 | +10 |
| <img src="images/boss/frost_penguin.png" width="32" height="32" alt=""> [冰霜企鹅](MONSTERS.md#boss-frost_penguin)<a id="ach-slay_frost_penguin"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冰霜企鹅克星 | +10 |
| <img src="images/boss/tire_beast.png" width="32" height="32" alt=""> [轮胎兽](MONSTERS.md#boss-tire_beast)<a id="ach-slay_tire_beast"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 轮胎兽克星 | +10 |
| <img src="images/boss/can_king.png" width="32" height="32" alt=""> [易拉罐之王](MONSTERS.md#boss-can_king)<a id="ach-slay_can_king"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 易拉罐之王克星 | +10 |
| <img src="images/boss/rag_wraith.png" width="32" height="32" alt=""> [抹布怨灵](MONSTERS.md#boss-rag_wraith)<a id="ach-slay_rag_wraith"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 抹布怨灵克星 | +10 |
| <img src="images/boss/battery_bug.png" width="32" height="32" alt=""> [漏电电池虫](MONSTERS.md#boss-battery_bug)<a id="ach-slay_battery_bug"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 漏电电池虫克星 | +10 |
| <img src="images/boss/garbage_rat.png" width="32" height="32" alt=""> [垃圾鼠王](MONSTERS.md#boss-garbage_rat)<a id="ach-slay_garbage_rat"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 垃圾鼠王克星 | +10 |
| <img src="images/boss/oil_titan.png" width="32" height="32" alt=""> [石油泰坦](MONSTERS.md#boss-oil_titan)<a id="ach-slay_oil_titan"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 石油泰坦克星 | +10 |
| <img src="images/boss/conveyor_worm.png" width="32" height="32" alt=""> [传送带蠕虫](MONSTERS.md#boss-conveyor_worm)<a id="ach-slay_conveyor_worm"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 传送带蠕虫克星 | +10 |
| <img src="images/boss/ketchup_golem.png" width="32" height="32" alt=""> [番茄酱傀儡](MONSTERS.md#boss-ketchup_golem)<a id="ach-slay_ketchup_golem"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 番茄酱傀儡克星 | +10 |
| <img src="images/boss/security_bot.png" width="32" height="32" alt=""> [保安机器人](MONSTERS.md#boss-security_bot)<a id="ach-slay_security_bot"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 保安机器人克星 | +10 |
| <img src="images/boss/press_machine.png" width="32" height="32" alt=""> [冲压机](MONSTERS.md#boss-press_machine)<a id="ach-slay_press_machine"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 冲压机克星 | +10 |
| <img src="images/boss/chef_minion.png" width="32" height="32" alt=""> [腐烂副厨](MONSTERS.md#boss-chef_minion)<a id="ach-slay_chef_minion"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 腐烂副厨克星 | +10 |
| <img src="images/boss/furnace_imp.png" width="32" height="32" alt=""> [熔炉小鬼](MONSTERS.md#boss-furnace_imp)<a id="ach-slay_furnace_imp"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 熔炉小鬼克星 | +10 |
| <img src="images/boss/mold_king.png" width="32" height="32" alt=""> [霉菌大王](MONSTERS.md#boss-mold_king)<a id="ach-slay_mold_king"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 霉菌大王克星 | +20 |
| <img src="images/boss/grease_chef.png" width="32" height="32" alt=""> [油烟怪厨](MONSTERS.md#boss-grease_chef)<a id="ach-slay_grease_chef"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 油烟怪厨克星 | +20 |
| <img src="images/boss/cockroach_emperor.png" width="32" height="32" alt=""> [蟑螂皇帝](MONSTERS.md#boss-cockroach_emperor)<a id="ach-slay_cockroach_emperor"></a> | [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | 蟑螂皇帝克星 | +20 |
| <img src="images/boss/locust_queen.png" width="32" height="32" alt=""> [蝗虫女皇](MONSTERS.md#boss-locust_queen)<a id="ach-slay_locust_queen"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 蝗虫女皇克星 | +20 |
| <img src="images/boss/rotten_pumpkin.png" width="32" height="32" alt=""> [腐烂南瓜王](MONSTERS.md#boss-rotten_pumpkin)<a id="ach-slay_rotten_pumpkin"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 腐烂南瓜王克星 | +20 |
| <img src="images/boss/mole_general.png" width="32" height="32" alt=""> [鼹鼠大将](MONSTERS.md#boss-mole_general)<a id="ach-slay_mole_general"></a> | [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | 鼹鼠大将克星 | +20 |
| <img src="images/boss/frost_rat_king.png" width="32" height="32" alt=""> [冰霜鼠王](MONSTERS.md#boss-frost_rat_king)<a id="ach-slay_frost_rat_king"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冰霜鼠王克星 | +20 |
| <img src="images/boss/ice_cream_tyrant.png" width="32" height="32" alt=""> [冰淇淋暴君](MONSTERS.md#boss-ice_cream_tyrant)<a id="ach-slay_ice_cream_tyrant"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冰淇淋暴君克星 | +20 |
| <img src="images/boss/freezer_heart.png" width="32" height="32" alt=""> [冰柜之心](MONSTERS.md#boss-freezer_heart)<a id="ach-slay_freezer_heart"></a> | [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | 冰柜之心克星 | +20 |
| <img src="images/boss/trash_golem.png" width="32" height="32" alt=""> [垃圾巨像](MONSTERS.md#boss-trash_golem)<a id="ach-slay_trash_golem"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 垃圾巨像克星 | +20 |
| <img src="images/boss/toxic_barrel.png" width="32" height="32" alt=""> [毒液桶魔](MONSTERS.md#boss-toxic_barrel)<a id="ach-slay_toxic_barrel"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 毒液桶魔克星 | +20 |
| <img src="images/boss/scrap_dragon.png" width="32" height="32" alt=""> [废铁巨龙](MONSTERS.md#boss-scrap_dragon)<a id="ach-slay_scrap_dragon"></a> | [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | 废铁巨龙克星 | +20 |
| <img src="images/boss/rotten_chef.png" width="32" height="32" alt=""> [腐烂大厨](MONSTERS.md#boss-rotten_chef)<a id="ach-slay_rotten_chef"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 腐烂大厨克星 | +20 |
| <img src="images/boss/factory_core.png" width="32" height="32" alt=""> [工厂主脑](MONSTERS.md#boss-factory_core)<a id="ach-slay_factory_core"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 工厂主脑克星 | +20 |
| <img src="images/boss/ketchup_leviathan.png" width="32" height="32" alt=""> [番茄酱海怪](MONSTERS.md#boss-ketchup_leviathan)<a id="ach-slay_ketchup_leviathan"></a> | [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | 番茄酱海怪克星 | +20 |

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

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · [怪物](MONSTERS.md) · [关卡](CHAPTERS.md) · **成就** · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

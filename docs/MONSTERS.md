# 怪物

**中文** · [English](en/MONSTERS.md)

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · **怪物** · [关卡](CHAPTERS.md) · [成就](ACHIEVEMENTS.md) · [天赋](TALENTS.md) · [遗物](RELICS.md) · [危机](DANGER.md) · [任务](QUESTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

> 由 `npm run docs` 从 `src/data/*.ts` 自动生成，请勿手改。

小怪 87 种 · 地形生物 2 种 · 精英 34 名 · Boss 18 名 · 精英词缀 20 种。

每 5 波出现一只精英（第 1–4 章为第 5、10 波），每章最后一波为 Boss（第 1–4 章为第 15 波，第 5 章起章节更长），均从该章的池子中随机抽取。各章出现哪些怪物见[关卡](CHAPTERS.md)。

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
| <img src="images/enemy/robot_can.png" width="32" height="32" alt=""> [罐头机器人](#enemy-robot_can) | 远程射击 | 16（每波 +70%） | 2（每波 +0.7） | 90 | 3 | - |
| <img src="images/enemy/bee.png" width="32" height="32" alt=""> [毒蜂](#enemy-bee) | 游荡 | 5（每波 +55%） | 1（每波 +0.55） | 160 | 1 | [中毒](SKILLS.md#status-poison) 3s |
| <img src="images/enemy/worm.png" width="32" height="32" alt=""> [泥蚯蚓](#enemy-worm) | 蓄力冲撞 | 9（每波 +60%） | 2（每波 +0.6） | 90 | 1 | - |
| <img src="images/enemy/frost_mosquito.png" width="32" height="32" alt=""> [冰蚊](#enemy-frost_mosquito) | 游荡 | 5（每波 +55%） | 1（每波 +0.5） | 140 | 1 | [冰冻](SKILLS.md#status-freeze) 0.5s（5%）、[减速](SKILLS.md#status-slow) 2s |
| <img src="images/enemy/frozen_shrimp.png" width="32" height="32" alt=""> [冻虾兵](#enemy-frozen_shrimp) | 蓄力冲撞 | 18（每波 +70%） | 3（每波 +0.7） | 80 | 2 | 2层[减速](SKILLS.md#status-slow) 3s |
| <img src="images/enemy/can_crab.png" width="32" height="32" alt=""> [易拉罐蟹](#enemy-can_crab) | 追击 | 30（每波 +75%） | 3（每波 +0.7） | 70 | 3 | [破甲](SKILLS.md#status-armorBreak) 4s |
| <img src="images/enemy/rag_ghost.png" width="32" height="32" alt=""> [抹布幽灵](#enemy-rag_ghost) | 游荡 | 14（每波 +65%） | 2（每波 +0.6） | 105 | 2 | [致盲](SKILLS.md#status-blind) 3s |
| <img src="images/enemy/oil_blob.png" width="32" height="32" alt=""> [油污怪](#enemy-oil_blob) | 留下黏液 | 20（每波 +70%） | 2（每波 +0.6） | 70 | 2 | [虚弱](SKILLS.md#status-weaken) 3s |
| <img src="images/enemy/gear_bug.png" width="32" height="32" alt=""> [齿轮虫](#enemy-gear_bug) | 远程射击 | 16（每波 +70%） | 2（每波 +0.7） | 95 | 2 | [破甲](SKILLS.md#status-armorBreak) 4s |
| <img src="images/enemy/curse_doll.png" width="32" height="32" alt=""> [诅咒娃娃](#enemy-curse_doll) | 远程射击 | 12（每波 +65%） | 2（每波 +0.6） | 90 | 3 | [诅咒](SKILLS.md#status-curse) 3s |
| <img src="images/enemy/burnt_toast.png" width="32" height="32" alt=""> [焦吐司](#enemy-burnt_toast) | 追击 | 8（每波 +55%） | 1（每波 +0.6） | 90 | 1 | [灼烧](SKILLS.md#status-burn) 2s（40%） |
| <img src="images/enemy/grease_drop.png" width="32" height="32" alt=""> [油滴精](#enemy-grease_drop) | 游荡 | 3（每波 +45%） | 1（每波 +0.5） | 155 | 1 | - |
| <img src="images/enemy/dust_bunny.png" width="32" height="32" alt=""> [灰尘团](#enemy-dust_bunny) | 游荡 | 4（每波 +50%） | 1（每波 +0.5） | 120 | 1 | - |
| <img src="images/enemy/sour_milk.png" width="32" height="32" alt=""> [酸奶盒](#enemy-sour_milk) | 远程射击 | 6（每波 +55%） | 1（每波 +0.5） | 75 | 2 | - |
| <img src="images/enemy/crumb_mite.png" width="32" height="32" alt=""> [面包屑螨](#enemy-crumb_mite) | 追击 | 2（每波 +40%） | 1（每波 +0.4） | 140 | 1 | - |
| <img src="images/enemy/moldy_bread.png" width="32" height="32" alt=""> [发霉面包](#enemy-moldy_bread) | 死亡分裂 | 14（每波 +65%） | 2（每波 +0.6） | 70 | 2 | - |
| <img src="images/enemy/stink_egg.png" width="32" height="32" alt=""> [臭鸡蛋](#enemy-stink_egg) | 自爆 | 5（每波 +50%） | 3（每波 +0.8） | 130 | 1 | 2层[中毒](SKILLS.md#status-poison) 3s |
| <img src="images/enemy/sponge_slug.png" width="32" height="32" alt=""> [洗碗海绵](#enemy-sponge_slug) | 留下黏液 | 12（每波 +60%） | 1（每波 +0.5） | 60 | 2 | [黏液](SKILLS.md#status-sticky) 2s |
| <img src="images/enemy/teabag_ghost.png" width="32" height="32" alt=""> [茶包幽灵](#enemy-teabag_ghost) | 治疗同伴 | 10（每波 +60%） | 1（每波 +0.4） | 65 | 3 | - |
| <img src="images/enemy/pan_beetle.png" width="32" height="32" alt=""> [锅底甲虫](#enemy-pan_beetle) | 蓄力冲撞 | 10（每波 +60%） | 2（每波 +0.7） | 80 | 1 | - |
| <img src="images/enemy/aphid.png" width="32" height="32" alt=""> [蚜虫](#enemy-aphid) | 追击 | 2（每波 +45%） | 1（每波 +0.4） | 135 | 1 | - |
| <img src="images/enemy/garden_slug.png" width="32" height="32" alt=""> [菜园蛞蝓](#enemy-garden_slug) | 留下黏液 | 14（每波 +65%） | 2（每波 +0.6） | 55 | 2 | [黏液](SKILLS.md#status-sticky) 2s |
| <img src="images/enemy/weevil.png" width="32" height="32" alt=""> [象鼻虫](#enemy-weevil) | 蓄力冲撞 | 11（每波 +60%） | 2（每波 +0.7） | 85 | 2 | - |
| <img src="images/enemy/thorn_weed.png" width="32" height="32" alt=""> [荆棘杂草](#enemy-thorn_weed) | 远程射击 | 8（每波 +55%） | 1（每波 +0.5） | 60 | 2 | [流血](SKILLS.md#status-bleed) 3s（35%） |
| <img src="images/enemy/caterpillar.png" width="32" height="32" alt=""> [菜青虫](#enemy-caterpillar) | 追击 | 9（每波 +60%） | 1（每波 +0.6） | 90 | 1 | - |
| <img src="images/enemy/ladybug_bomb.png" width="32" height="32" alt=""> [爆爆瓢虫](#enemy-ladybug_bomb) | 自爆 | 6（每波 +55%） | 4（每波 +0.85） | 125 | 1 | - |
| <img src="images/enemy/rotten_potato.png" width="32" height="32" alt=""> [烂土豆](#enemy-rotten_potato) | 死亡分裂 | 20（每波 +70%） | 2（每波 +0.6） | 60 | 3 | - |
| <img src="images/enemy/locust.png" width="32" height="32" alt=""> [飞蝗](#enemy-locust) | 游荡 | 4（每波 +50%） | 1（每波 +0.5） | 165 | 1 | - |
| <img src="images/enemy/mantis.png" width="32" height="32" alt=""> [刀螳螂](#enemy-mantis) | 蓄力冲撞 | 12（每波 +65%） | 2（每波 +0.7） | 95 | 2 | [流血](SKILLS.md#status-bleed) 3s（40%） |
| <img src="images/enemy/pollen_bloom.png" width="32" height="32" alt=""> [毒花苞](#enemy-pollen_bloom) | 远程射击 | 7（每波 +55%） | 1（每波 +0.5） | 55 | 2 | [中毒](SKILLS.md#status-poison) 3s |
| <img src="images/enemy/frost_mite.png" width="32" height="32" alt=""> [霜螨](#enemy-frost_mite) | 追击 | 3（每波 +45%） | 1（每波 +0.4） | 135 | 1 | - |
| <img src="images/enemy/freezer_burn.png" width="32" height="32" alt=""> [冻伤肉块](#enemy-freezer_burn) | 追击 | 24（每波 +75%） | 3（每波 +0.7） | 65 | 3 | - |
| <img src="images/enemy/ice_slime.png" width="32" height="32" alt=""> [冰史莱姆](#enemy-ice_slime) | 死亡分裂 | 16（每波 +65%） | 2（每波 +0.6） | 75 | 2 | - |
| <img src="images/enemy/moldy_cheese.png" width="32" height="32" alt=""> [霉奶酪](#enemy-moldy_cheese) | 留下黏液 | 14（每波 +65%） | 2（每波 +0.6） | 60 | 2 | [中毒](SKILLS.md#status-poison) 3s |
| <img src="images/enemy/popsicle_bat.png" width="32" height="32" alt=""> [冰棍蝙蝠](#enemy-popsicle_bat) | 游荡 | 6（每波 +55%） | 1（每波 +0.5） | 150 | 1 | - |
| <img src="images/enemy/frozen_pea.png" width="32" height="32" alt=""> [冻豌豆](#enemy-frozen_pea) | 远程射击 | 6（每波 +55%） | 1（每波 +0.5） | 85 | 1 | - |
| <img src="images/enemy/leftover_box.png" width="32" height="32" alt=""> [剩饭盒](#enemy-leftover_box) | 召唤 | 26（每波 +75%） | 2（每波 +0.6） | 45 | 4 | - |
| <img src="images/enemy/jelly_cube.png" width="32" height="32" alt=""> [果冻方块](#enemy-jelly_cube) | 蓄力冲撞 | 14（每波 +65%） | 2（每波 +0.65） | 80 | 2 | - |
| <img src="images/enemy/icicle_imp.png" width="32" height="32" alt=""> [冰锥小鬼](#enemy-icicle_imp) | 远程射击 | 9（每波 +60%） | 2（每波 +0.55） | 90 | 2 | [减速](SKILLS.md#status-slow) 2s |
| <img src="images/enemy/frozen_soda.png" width="32" height="32" alt=""> [冻爆汽水](#enemy-frozen_soda) | 自爆 | 7（每波 +55%） | 4（每波 +0.85） | 120 | 1 | [冰冻](SKILLS.md#status-freeze) 0.6s（30%） |
| <img src="images/enemy/rust_crab.png" width="32" height="32" alt=""> [锈铁蟹](#enemy-rust_crab) | 蓄力冲撞 | 22（每波 +70%） | 3（每波 +0.7） | 75 | 2 | - |
| <img src="images/enemy/oil_slick.png" width="32" height="32" alt=""> [油膜怪](#enemy-oil_slick) | 留下黏液 | 16（每波 +65%） | 2（每波 +0.6） | 75 | 2 | [黏液](SKILLS.md#status-sticky) 2s |
| <img src="images/enemy/bag_ghost.png" width="32" height="32" alt=""> [塑料袋幽灵](#enemy-bag_ghost) | 游荡 | 10（每波 +60%） | 2（每波 +0.55） | 115 | 2 | [致盲](SKILLS.md#status-blind) 2s |
| <img src="images/enemy/battery_mite.png" width="32" height="32" alt=""> [漏电电池](#enemy-battery_mite) | 自爆 | 8（每波 +55%） | 4（每波 +0.85） | 125 | 1 | [眩晕](SKILLS.md#status-stun) 0.5s（35%） |
| <img src="images/enemy/tire_roller.png" width="32" height="32" alt=""> [滚轮胎](#enemy-tire_roller) | 蓄力冲撞 | 24（每波 +75%） | 3（每波 +0.75） | 70 | 2 | - |
| <img src="images/enemy/scrap_drone.png" width="32" height="32" alt=""> [废铁无人机](#enemy-scrap_drone) | 远程射击 | 10（每波 +60%） | 2（每波 +0.6） | 110 | 2 | - |
| <img src="images/enemy/glass_shard.png" width="32" height="32" alt=""> [碎玻璃怪](#enemy-glass_shard) | 追击 | 12（每波 +60%） | 2（每波 +0.7） | 100 | 2 | [流血](SKILLS.md#status-bleed) 3s（40%） |
| <img src="images/enemy/rusty_nail.png" width="32" height="32" alt=""> [锈钉虫](#enemy-rusty_nail) | 追击 | 4（每波 +45%） | 1（每波 +0.5） | 140 | 1 | - |
| <img src="images/enemy/junk_heap.png" width="32" height="32" alt=""> [垃圾堆](#enemy-junk_heap) | 召唤 | 32（每波 +80%） | 3（每波 +0.65） | 40 | 4 | - |
| <img src="images/enemy/junk_radio.png" width="32" height="32" alt=""> [破收音机](#enemy-junk_radio) | 治疗同伴 | 16（每波 +65%） | 1（每波 +0.4） | 55 | 3 | - |
| <img src="images/enemy/conveyor_gremlin.png" width="32" height="32" alt=""> [传送带小妖](#enemy-conveyor_gremlin) | 游荡 | 12（每波 +60%） | 2（每波 +0.45） | 125 | 2 | - |
| <img src="images/enemy/sauce_drip.png" width="32" height="32" alt=""> [酱汁滴](#enemy-sauce_drip) | 追击 | 5（每波 +50%） | 1（每波 +0.5） | 130 | 1 | - |
| <img src="images/enemy/cap_drone.png" width="32" height="32" alt=""> [瓶盖无人机](#enemy-cap_drone) | 远程射击 | 12（每波 +65%） | 2（每波 +0.65） | 115 | 2 | - |
| <img src="images/enemy/ketchup_slime.png" width="32" height="32" alt=""> [番茄酱史莱姆](#enemy-ketchup_slime) | 死亡分裂 | 28（每波 +75%） | 3（每波 +0.7） | 70 | 3 | - |
| <img src="images/enemy/steam_imp.png" width="32" height="32" alt=""> [蒸汽小鬼](#enemy-steam_imp) | 自爆 | 10（每波 +60%） | 4（每波 +0.9） | 135 | 2 | 2层[灼烧](SKILLS.md#status-burn) 3s |
| <img src="images/enemy/rivet_bot.png" width="32" height="32" alt=""> [铆钉机器人](#enemy-rivet_bot) | 追击 | 32（每波 +80%） | 3（每波 +0.75） | 75 | 3 | [破甲](SKILLS.md#status-armorBreak) 4s |
| <img src="images/enemy/label_ghost.png" width="32" height="32" alt=""> [标签幽灵](#enemy-label_ghost) | 游荡 | 14（每波 +65%） | 2（每波 +0.6） | 110 | 2 | [诅咒](SKILLS.md#status-curse) 3s |
| <img src="images/enemy/bottling_bot.png" width="32" height="32" alt=""> [灌装机器人](#enemy-bottling_bot) | 召唤 | 34（每波 +80%） | 3（每波 +0.65） | 45 | 4 | - |
| <img src="images/enemy/welder_bug.png" width="32" height="32" alt=""> [焊枪虫](#enemy-welder_bug) | 远程射击 | 14（每波 +65%） | 2（每波 +0.65） | 95 | 2 | [灼烧](SKILLS.md#status-burn) 2s |
| <img src="images/enemy/press_piston.png" width="32" height="32" alt=""> [冲压活塞](#enemy-press_piston) | 蓄力冲撞 | 26（每波 +75%） | 3（每波 +0.8） | 70 | 3 | - |
| <img src="images/enemy/blight_sprout.png" width="32" height="32" alt=""> [枯萎嫩芽](#enemy-blight_sprout) | 追击 | 5（每波 +50%） | 1（每波 +0.5） | 130 | 1 | - |
| <img src="images/enemy/fungus_gnat.png" width="32" height="32" alt=""> [菌蚊](#enemy-fungus_gnat) | 游荡 | 9（每波 +55%） | 2（每波 +0.45） | 145 | 1 | [致盲](SKILLS.md#status-blind) 1.2s（25%） |
| <img src="images/enemy/rot_chili.png" width="32" height="32" alt=""> [腐辣椒](#enemy-rot_chili) | 远程射击 | 13（每波 +65%） | 2（每波 +0.6） | 105 | 2 | [灼烧](SKILLS.md#status-burn) 2s |
| <img src="images/enemy/slime_cucumber.png" width="32" height="32" alt=""> [流汗黄瓜](#enemy-slime_cucumber) | 留下黏液 | 18（每波 +70%） | 2（每波 +0.6） | 80 | 2 | [黏液](SKILLS.md#status-sticky) 1.5s |
| <img src="images/enemy/spore_puff.png" width="32" height="32" alt=""> [孢子马勃](#enemy-spore_puff) | 自爆 | 10（每波 +60%） | 4（每波 +0.85） | 125 | 2 | 3层[中毒](SKILLS.md#status-poison) 3s |
| <img src="images/enemy/vine_lasher.png" width="32" height="32" alt=""> [腐藤鞭](#enemy-vine_lasher) | 蓄力冲撞 | 24（每波 +75%） | 3（每波 +0.8） | 75 | 3 | 2层[流血](SKILLS.md#status-bleed) 3s |
| <img src="images/enemy/moldy_pumpkin.png" width="32" height="32" alt=""> [霉变南瓜](#enemy-moldy_pumpkin) | 死亡分裂 | 30（每波 +75%） | 3（每波 +0.7） | 65 | 3 | - |
| <img src="images/enemy/compost_heap.png" width="32" height="32" alt=""> [堆肥桶](#enemy-compost_heap) | 召唤 | 34（每波 +80%） | 3（每波 +0.65） | 45 | 4 | - |
| <img src="images/enemy/rot_cabbage.png" width="32" height="32" alt=""> [烂心卷心菜](#enemy-rot_cabbage) | 追击 | 32（每波 +80%） | 3（每波 +0.75） | 75 | 3 | [腐烂](SKILLS.md#status-rot) 3s |
| <img src="images/enemy/zombie_carrot.png" width="32" height="32" alt=""> [僵尸胡萝卜](#enemy-zombie_carrot) | 蓄力冲撞 | 24（每波 +75%） | 3（每波 +0.65） | 80 | 3 | [腐烂](SKILLS.md#status-rot) 3s |
| <img src="images/enemy/rot_sprinkler.png" width="32" height="32" alt=""> [腐水洒水器](#enemy-rot_sprinkler) | 治疗同伴 | 22（每波 +70%） | 2（每波 +0.5） | 70 | 3 | - |
| <img src="images/enemy/blight_onion.png" width="32" height="32" alt=""> [枯萎洋葱](#enemy-blight_onion) | 远程射击 | 15（每波 +65%） | 2（每波 +0.6） | 95 | 2 | [致盲](SKILLS.md#status-blind) 1.5s（35%） |

<a id="enemy-mold"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/mold.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">霉菌团</th></tr>
<tr><td colspan="2"><i>最常见的害虫，缓慢逼近。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>5（每波 +45%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>95</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 1+ 波；<a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 1~8 波；<a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 1~6 波；<a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 1~5 波；<a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 1~5 波</td></tr>
</table>

<a id="enemy-fly"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/fly.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">果蝇</th></tr>
<tr><td colspan="2"><i>飞得快但很脆弱，行动飘忽。</i></td></tr>
<tr><td nowrap>行为</td><td>游荡</td></tr>
<tr><td nowrap>生命</td><td>3（每波 +50%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>150</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 2+ 波；<a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 1+ 波；<a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 1+ 波；<a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 1~8 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 1~9 波</td></tr>
</table>

<a id="enemy-maggot"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/maggot.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">蛆虫</th></tr>
<tr><td colspan="2"><i>蓄力后高速冲撞。</i></td></tr>
<tr><td nowrap>行为</td><td>蓄力冲撞</td></tr>
<tr><td nowrap>生命</td><td>7（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>特殊</td><td>每 3s 冲撞</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 4+ 波；<a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 3+ 波</td></tr>
</table>

<a id="enemy-rotten_apple"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/rotten_apple.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">烂苹果</th></tr>
<tr><td colspan="2"><i>保持距离吐出腐烂果核。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>6（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>80</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>特殊</td><td>每 2.6s 射击</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 3+ 波；<a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 2+ 波</td></tr>
</table>

<a id="enemy-cockroach"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/cockroach.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">蟑螂</th></tr>
<tr><td colspan="2"><i>皮糙肉厚，难以击退。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>22（每波 +70%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.8）</td></tr>
<tr><td nowrap>速度</td><td>85</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 7+ 波；<a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 5+ 波；<a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 3+ 波</td></tr>
</table>

<a id="enemy-ant"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/ant.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">行军蚁</th></tr>
<tr><td colspan="2"><i>成群结队地出现。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>2（每波 +45%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.4）</td></tr>
<tr><td nowrap>速度</td><td>150</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 6+ 波；<a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 3+ 波</td></tr>
</table>

<a id="enemy-beetle"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/beetle.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">炸弹甲虫</th></tr>
<tr><td colspan="2"><i>靠近后自爆，注意躲开！</i></td></tr>
<tr><td nowrap>行为</td><td>自爆</td></tr>
<tr><td nowrap>生命</td><td>6（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>4（每波 +0.9）</td></tr>
<tr><td nowrap>速度</td><td>135</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>特殊</td><td>自爆半径 85</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 9+ 波；<a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 10+ 波；<a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 6+ 波；<a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 8+ 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 9+ 波</td></tr>
</table>

<a id="enemy-snail"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/snail.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">鼻涕蜗牛</th></tr>
<tr><td colspan="2"><i>缓慢爬行，留下减速黏液。</i></td></tr>
<tr><td nowrap>行为</td><td>留下黏液</td></tr>
<tr><td nowrap>生命</td><td>16（每波 +70%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>50</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-sticky">黏液</a> 2s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 2+ 波；<a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 6+ 波</td></tr>
</table>

<a id="enemy-spider"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/spider.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">毒蜘蛛</th></tr>
<tr><td colspan="2"><i>吐出减速蛛网，蛛网带毒。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>10（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>100</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-poison">中毒</a> 3s</td></tr>
<tr><td nowrap>特殊</td><td>每 3s 射击 2 发</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 5+ 波；<a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 6+ 波；<a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 6+ 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 8+ 波</td></tr>
</table>

<a id="enemy-splitter"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/splitter.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">分裂霉菌</th></tr>
<tr><td colspan="2"><i>死亡时分裂为多个霉菌团。</i></td></tr>
<tr><td nowrap>行为</td><td>死亡分裂</td></tr>
<tr><td nowrap>生命</td><td>18（每波 +70%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>75</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>特殊</td><td>死亡分裂为 3 只<a href="#enemy-mold">霉菌团</a></td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 11+ 波；<a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 6+ 波；<a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 9+ 波；<a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 9+ 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 11+ 波</td></tr>
</table>

<a id="enemy-mushroom"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/mushroom.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">毒蘑菇</th></tr>
<tr><td colspan="2"><i>治疗周围的怪物，优先击杀！</i></td></tr>
<tr><td nowrap>行为</td><td>治疗同伴</td></tr>
<tr><td nowrap>生命</td><td>14（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.4）</td></tr>
<tr><td nowrap>速度</td><td>60</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>特殊</td><td>治疗半径 180 内同伴 0.2</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 5+ 波；<a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 7+ 波；<a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 8+ 波；<a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 6+ 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 8+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 11+ 波</td></tr>
</table>

<a id="enemy-brood"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/brood.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">虫母</th></tr>
<tr><td colspan="2"><i>不断孵化果蝇。</i></td></tr>
<tr><td nowrap>行为</td><td>召唤</td></tr>
<tr><td nowrap>生命</td><td>30（每波 +80%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>45</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>4</td></tr>
<tr><td nowrap>特殊</td><td>召唤 3 只<a href="#enemy-fly">果蝇</a></td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 8+ 波；<a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 5+ 波；<a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 8+ 波</td></tr>
</table>

<a id="enemy-rat"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/rat.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">下水道老鼠</th></tr>
<tr><td colspan="2"><i>迅速冲撞的鼠辈，会咬出流血。</i></td></tr>
<tr><td nowrap>行为</td><td>蓄力冲撞</td></tr>
<tr><td nowrap>生命</td><td>12（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>115</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-bleed">流血</a> 3s（30%）</td></tr>
<tr><td nowrap>特殊</td><td>每 3s 冲撞</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 7+ 波；<a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 5+ 波；<a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 6+ 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 9+ 波</td></tr>
</table>

<a id="enemy-ice_cube"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/ice_cube.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">冰块怪</th></tr>
<tr><td colspan="2"><i>向四周射出冰晶，使人减速。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>15（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-slow">减速</a> 2s</td></tr>
<tr><td nowrap>特殊</td><td>每 3.2s 射击 6 发</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 3+ 波；<a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 5+ 波</td></tr>
</table>

<a id="enemy-trash_bag"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/trash_bag.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">垃圾袋怪</th></tr>
<tr><td colspan="2"><i>被打破后放出一群果蝇。</i></td></tr>
<tr><td nowrap>行为</td><td>死亡分裂</td></tr>
<tr><td nowrap>生命</td><td>28（每波 +75%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>65</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>特殊</td><td>死亡分裂为 4 只<a href="#enemy-fly">果蝇</a></td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 5+ 波；<a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 6+ 波</td></tr>
</table>

<a id="enemy-robot_can"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/robot_can.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">罐头机器人</th></tr>
<tr><td colspan="2"><i>失控的机器人，三连发射击。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>16（每波 +70%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>90</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>特殊</td><td>每 2.8s 射击 3 发</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 5+ 波</td></tr>
</table>

<a id="enemy-bee"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/bee.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">毒蜂</th></tr>
<tr><td colspan="2"><i>蜇人带毒，成群出没。</i></td></tr>
<tr><td nowrap>行为</td><td>游荡</td></tr>
<tr><td nowrap>生命</td><td>5（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.55）</td></tr>
<tr><td nowrap>速度</td><td>160</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-poison">中毒</a> 3s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 4+ 波</td></tr>
</table>

<a id="enemy-worm"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/worm.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">泥蚯蚓</th></tr>
<tr><td colspan="2"><i>从土里钻出突袭。</i></td></tr>
<tr><td nowrap>行为</td><td>蓄力冲撞</td></tr>
<tr><td nowrap>生命</td><td>9（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>90</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>特殊</td><td>每 2.6s 冲撞</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 4+ 波</td></tr>
</table>

<a id="enemy-frost_mosquito"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/frost_mosquito.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">冰蚊</th></tr>
<tr><td colspan="2"><i>叮咬会使人冰冻。</i></td></tr>
<tr><td nowrap>行为</td><td>游荡</td></tr>
<tr><td nowrap>生命</td><td>5（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>140</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-freeze">冰冻</a> 0.5s（5%）、<a href="SKILLS.md#status-slow">减速</a> 2s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 4+ 波</td></tr>
</table>

<a id="enemy-frozen_shrimp"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/frozen_shrimp.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">冻虾兵</th></tr>
<tr><td colspan="2"><i>坚硬的冻虾，冲撞使人减速。</i></td></tr>
<tr><td nowrap>行为</td><td>蓄力冲撞</td></tr>
<tr><td nowrap>生命</td><td>18（每波 +70%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>80</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td>2层<a href="SKILLS.md#status-slow">减速</a> 3s</td></tr>
<tr><td nowrap>特殊</td><td>每 3s 冲撞</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 6+ 波</td></tr>
</table>

<a id="enemy-can_crab"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/can_crab.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">易拉罐蟹</th></tr>
<tr><td colspan="2"><i>背着易拉罐的寄居蟹，反弹伤害。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>30（每波 +75%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-armorBreak">破甲</a> 4s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 7+ 波</td></tr>
</table>

<a id="enemy-rag_ghost"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/rag_ghost.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">抹布幽灵</th></tr>
<tr><td colspan="2"><i>脏抹布化成的幽灵，接触致盲。</i></td></tr>
<tr><td nowrap>行为</td><td>游荡</td></tr>
<tr><td nowrap>生命</td><td>14（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>105</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-blind">致盲</a> 3s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 5+ 波</td></tr>
</table>

<a id="enemy-oil_blob"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/oil_blob.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">油污怪</th></tr>
<tr><td colspan="2"><i>留下滑腻的油污，接触虚弱。</i></td></tr>
<tr><td nowrap>行为</td><td>留下黏液</td></tr>
<tr><td nowrap>生命</td><td>20（每波 +70%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-weaken">虚弱</a> 3s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 6+ 波</td></tr>
</table>

<a id="enemy-gear_bug"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/gear_bug.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">齿轮虫</th></tr>
<tr><td colspan="2"><i>机械甲虫，射出破甲钉。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>16（每波 +70%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>95</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-armorBreak">破甲</a> 4s</td></tr>
<tr><td nowrap>特殊</td><td>每 2.8s 射击 2 发</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 5+ 波</td></tr>
</table>

<a id="enemy-curse_doll"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/curse_doll.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">诅咒娃娃</th></tr>
<tr><td colspan="2"><i>飘荡的破布娃娃，诅咒使人无法回血。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>12（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>90</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-curse">诅咒</a> 3s</td></tr>
<tr><td nowrap>特殊</td><td>每 3s 射击</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 6+ 波</td></tr>
</table>

<a id="enemy-burnt_toast"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/burnt_toast.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">焦吐司</th></tr>
<tr><td colspan="2"><i>烤糊的吐司，碰到会被烫伤。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>8（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>90</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-burn">灼烧</a> 2s（40%）</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 3+ 波</td></tr>
</table>

<a id="enemy-grease_drop"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/grease_drop.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">油滴精</th></tr>
<tr><td colspan="2"><i>四处乱溅的热油滴。</i></td></tr>
<tr><td nowrap>行为</td><td>游荡</td></tr>
<tr><td nowrap>生命</td><td>3（每波 +45%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>155</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 2+ 波</td></tr>
</table>

<a id="enemy-dust_bunny"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/dust_bunny.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">灰尘团</th></tr>
<tr><td colspan="2"><i>床底滚出的灰球，飘忽不定。</i></td></tr>
<tr><td nowrap>行为</td><td>游荡</td></tr>
<tr><td nowrap>生命</td><td>4（每波 +50%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>120</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 3+ 波</td></tr>
</table>

<a id="enemy-sour_milk"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/sour_milk.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">酸奶盒</th></tr>
<tr><td colspan="2"><i>过期牛奶盒，远远喷出酸奶。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>6（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>75</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>特殊</td><td>每 2.8s 射击</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 4+ 波</td></tr>
</table>

<a id="enemy-crumb_mite"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/crumb_mite.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">面包屑螨</th></tr>
<tr><td colspan="2"><i>聚在面包屑里的小螨虫。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>2（每波 +40%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.4）</td></tr>
<tr><td nowrap>速度</td><td>140</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 2+ 波</td></tr>
</table>

<a id="enemy-moldy_bread"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/moldy_bread.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">发霉面包</th></tr>
<tr><td colspan="2"><i>被打碎后洒出一群面包屑螨。</i></td></tr>
<tr><td nowrap>行为</td><td>死亡分裂</td></tr>
<tr><td nowrap>生命</td><td>14（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>特殊</td><td>死亡分裂为 3 只<a href="#enemy-crumb_mite">面包屑螨</a></td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 9+ 波</td></tr>
</table>

<a id="enemy-stink_egg"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/stink_egg.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">臭鸡蛋</th></tr>
<tr><td colspan="2"><i>滚到脚边就炸开，臭气带毒。</i></td></tr>
<tr><td nowrap>行为</td><td>自爆</td></tr>
<tr><td nowrap>生命</td><td>5（每波 +50%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.8）</td></tr>
<tr><td nowrap>速度</td><td>130</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>攻击附带</td><td>2层<a href="SKILLS.md#status-poison">中毒</a> 3s</td></tr>
<tr><td nowrap>特殊</td><td>自爆半径 80</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 8+ 波</td></tr>
</table>

<a id="enemy-sponge_slug"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/sponge_slug.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">洗碗海绵</th></tr>
<tr><td colspan="2"><i>吸饱脏水的海绵，留下黏滑水渍。</i></td></tr>
<tr><td nowrap>行为</td><td>留下黏液</td></tr>
<tr><td nowrap>生命</td><td>12（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>60</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-sticky">黏液</a> 2s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 6+ 波</td></tr>
</table>

<a id="enemy-teabag_ghost"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/teabag_ghost.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">茶包幽灵</th></tr>
<tr><td colspan="2"><i>泡烂的茶包，为同伴回血。</i></td></tr>
<tr><td nowrap>行为</td><td>治疗同伴</td></tr>
<tr><td nowrap>生命</td><td>10（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.4）</td></tr>
<tr><td nowrap>速度</td><td>65</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>特殊</td><td>治疗半径 170 内同伴 0.15</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 10+ 波</td></tr>
</table>

<a id="enemy-pan_beetle"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/pan_beetle.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">锅底甲虫</th></tr>
<tr><td colspan="2"><i>躲在锅底的甲虫，猛然冲撞。</i></td></tr>
<tr><td nowrap>行为</td><td>蓄力冲撞</td></tr>
<tr><td nowrap>生命</td><td>10（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>80</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>特殊</td><td>每 3s 冲撞</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a> 第 5+ 波</td></tr>
</table>

<a id="enemy-aphid"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/aphid.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">蚜虫</th></tr>
<tr><td colspan="2"><i>密密麻麻的小绿虫。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>2（每波 +45%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.4）</td></tr>
<tr><td nowrap>速度</td><td>135</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 2+ 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 1~11 波</td></tr>
</table>

<a id="enemy-garden_slug"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/garden_slug.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">菜园蛞蝓</th></tr>
<tr><td colspan="2"><i>滑溜溜的蛞蝓，所过之处满是黏液。</i></td></tr>
<tr><td nowrap>行为</td><td>留下黏液</td></tr>
<tr><td nowrap>生命</td><td>14（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>55</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-sticky">黏液</a> 2s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 4+ 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 4+ 波</td></tr>
</table>

<a id="enemy-weevil"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/weevil.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">象鼻虫</th></tr>
<tr><td colspan="2"><i>长鼻子的甲虫，低头猛冲。</i></td></tr>
<tr><td nowrap>行为</td><td>蓄力冲撞</td></tr>
<tr><td nowrap>生命</td><td>11（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>85</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>特殊</td><td>每 2.8s 冲撞</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 5+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 9+ 波</td></tr>
</table>

<a id="enemy-thorn_weed"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/thorn_weed.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">荆棘杂草</th></tr>
<tr><td colspan="2"><i>甩出尖刺，划伤流血。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>8（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>60</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-bleed">流血</a> 3s（35%）</td></tr>
<tr><td nowrap>特殊</td><td>每 2.8s 射击 3 发</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 6+ 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 6+ 波</td></tr>
</table>

<a id="enemy-caterpillar"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/caterpillar.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">菜青虫</th></tr>
<tr><td colspan="2"><i>啃菜叶长大的肥虫子。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>9（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>90</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 2+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 1~15 波</td></tr>
</table>

<a id="enemy-ladybug_bomb"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/ladybug_bomb.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">爆爆瓢虫</th></tr>
<tr><td colspan="2"><i>背上的斑点其实是引信。</i></td></tr>
<tr><td nowrap>行为</td><td>自爆</td></tr>
<tr><td nowrap>生命</td><td>6（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>4（每波 +0.85）</td></tr>
<tr><td nowrap>速度</td><td>125</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>特殊</td><td>自爆半径 85</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 8+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 11+ 波</td></tr>
</table>

<a id="enemy-rotten_potato"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/rotten_potato.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">烂土豆</th></tr>
<tr><td colspan="2"><i>被虫蛀空的土豆，里面全是蚜虫。</i></td></tr>
<tr><td nowrap>行为</td><td>死亡分裂</td></tr>
<tr><td nowrap>生命</td><td>20（每波 +70%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>60</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>特殊</td><td>死亡分裂为 4 只<a href="#enemy-aphid">蚜虫</a></td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 10+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 13+ 波</td></tr>
</table>

<a id="enemy-locust"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/locust.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">飞蝗</th></tr>
<tr><td colspan="2"><i>一阵风似地掠过菜园。</i></td></tr>
<tr><td nowrap>行为</td><td>游荡</td></tr>
<tr><td nowrap>生命</td><td>4（每波 +50%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>165</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 3+ 波</td></tr>
</table>

<a id="enemy-mantis"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/mantis.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">刀螳螂</th></tr>
<tr><td colspan="2"><i>镰刀般的前臂，冲刺割伤。</i></td></tr>
<tr><td nowrap>行为</td><td>蓄力冲撞</td></tr>
<tr><td nowrap>生命</td><td>12（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>95</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-bleed">流血</a> 3s（40%）</td></tr>
<tr><td nowrap>特殊</td><td>每 3.2s 冲撞</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 9+ 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 13+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 9+ 波</td></tr>
</table>

<a id="enemy-pollen_bloom"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/pollen_bloom.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">毒花苞</th></tr>
<tr><td colspan="2"><i>喷射有毒花粉团。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>7（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>55</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-poison">中毒</a> 3s</td></tr>
<tr><td nowrap>特殊</td><td>每 3s 射击 2 发</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a> 第 7+ 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 9+ 波</td></tr>
</table>

<a id="enemy-frost_mite"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/frost_mite.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">霜螨</th></tr>
<tr><td colspan="2"><i>藏在霜层里的小虫，叮咬冰凉。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>3（每波 +45%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.4）</td></tr>
<tr><td nowrap>速度</td><td>135</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 2+ 波</td></tr>
</table>

<a id="enemy-freezer_burn"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/freezer_burn.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">冻伤肉块</th></tr>
<tr><td colspan="2"><i>冻得硬邦邦的肉块，推都推不动。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>24（每波 +75%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>65</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 9+ 波</td></tr>
</table>

<a id="enemy-ice_slime"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/ice_slime.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">冰史莱姆</th></tr>
<tr><td colspan="2"><i>死亡时碎成一群霜螨。</i></td></tr>
<tr><td nowrap>行为</td><td>死亡分裂</td></tr>
<tr><td nowrap>生命</td><td>16（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>75</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>特殊</td><td>死亡分裂为 3 只<a href="#enemy-frost_mite">霜螨</a></td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 7+ 波</td></tr>
</table>

<a id="enemy-moldy_cheese"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/moldy_cheese.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">霉奶酪</th></tr>
<tr><td colspan="2"><i>长毛的奶酪，一路滴着毒霉汁。</i></td></tr>
<tr><td nowrap>行为</td><td>留下黏液</td></tr>
<tr><td nowrap>生命</td><td>14（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>60</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-poison">中毒</a> 3s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 5+ 波</td></tr>
</table>

<a id="enemy-popsicle_bat"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/popsicle_bat.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">冰棍蝙蝠</th></tr>
<tr><td colspan="2"><i>冰棍变的蝙蝠，成对乱飞。</i></td></tr>
<tr><td nowrap>行为</td><td>游荡</td></tr>
<tr><td nowrap>生命</td><td>6（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>150</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 2+ 波</td></tr>
</table>

<a id="enemy-frozen_pea"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/frozen_pea.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">冻豌豆</th></tr>
<tr><td colspan="2"><i>从冷冻袋里弹出冰豆子。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>6（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>85</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>特殊</td><td>每 2.4s 射击</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 3+ 波</td></tr>
</table>

<a id="enemy-leftover_box"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/leftover_box.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">剩饭盒</th></tr>
<tr><td colspan="2"><i>忘在冰箱深处的饭盒，不断滋生霜螨。</i></td></tr>
<tr><td nowrap>行为</td><td>召唤</td></tr>
<tr><td nowrap>生命</td><td>26（每波 +75%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>45</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>4</td></tr>
<tr><td nowrap>特殊</td><td>召唤 3 只<a href="#enemy-frost_mite">霜螨</a></td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 10+ 波</td></tr>
</table>

<a id="enemy-jelly_cube"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/jelly_cube.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">果冻方块</th></tr>
<tr><td colspan="2"><i>冻硬的果冻，蹦跳着撞过来。</i></td></tr>
<tr><td nowrap>行为</td><td>蓄力冲撞</td></tr>
<tr><td nowrap>生命</td><td>14（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.65）</td></tr>
<tr><td nowrap>速度</td><td>80</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>特殊</td><td>每 2.6s 冲撞</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 4+ 波</td></tr>
</table>

<a id="enemy-icicle_imp"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/icicle_imp.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">冰锥小鬼</th></tr>
<tr><td colspan="2"><i>扇形射出尖利冰锥。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>9（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.55）</td></tr>
<tr><td nowrap>速度</td><td>90</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-slow">减速</a> 2s</td></tr>
<tr><td nowrap>特殊</td><td>每 3s 射击 3 发</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 6+ 波</td></tr>
</table>

<a id="enemy-frozen_soda"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/frozen_soda.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">冻爆汽水</th></tr>
<tr><td colspan="2"><i>冻胀的汽水罐，靠近就爆出冰渣。</i></td></tr>
<tr><td nowrap>行为</td><td>自爆</td></tr>
<tr><td nowrap>生命</td><td>7（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>4（每波 +0.85）</td></tr>
<tr><td nowrap>速度</td><td>120</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-freeze">冰冻</a> 0.6s（30%）</td></tr>
<tr><td nowrap>特殊</td><td>自爆半径 90</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a> 第 8+ 波</td></tr>
</table>

<a id="enemy-rust_crab"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/rust_crab.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">锈铁蟹</th></tr>
<tr><td colspan="2"><i>锈迹斑斑的铁皮蟹，横冲直撞。</i></td></tr>
<tr><td nowrap>行为</td><td>蓄力冲撞</td></tr>
<tr><td nowrap>生命</td><td>22（每波 +70%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>75</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>特殊</td><td>每 3s 冲撞</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 7+ 波</td></tr>
</table>

<a id="enemy-oil_slick"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/oil_slick.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">油膜怪</th></tr>
<tr><td colspan="2"><i>薄薄一层机油，拖出黏腻油迹。</i></td></tr>
<tr><td nowrap>行为</td><td>留下黏液</td></tr>
<tr><td nowrap>生命</td><td>16（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>75</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-sticky">黏液</a> 2s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 5+ 波</td></tr>
</table>

<a id="enemy-bag_ghost"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/bag_ghost.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">塑料袋幽灵</th></tr>
<tr><td colspan="2"><i>随风飘荡的塑料袋，蒙住你的眼睛。</i></td></tr>
<tr><td nowrap>行为</td><td>游荡</td></tr>
<tr><td nowrap>生命</td><td>10（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.55）</td></tr>
<tr><td nowrap>速度</td><td>115</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-blind">致盲</a> 2s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 3+ 波</td></tr>
</table>

<a id="enemy-battery_mite"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/battery_mite.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">漏电电池</th></tr>
<tr><td colspan="2"><i>鼓包的电池，爆炸时电得人发麻。</i></td></tr>
<tr><td nowrap>行为</td><td>自爆</td></tr>
<tr><td nowrap>生命</td><td>8（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>4（每波 +0.85）</td></tr>
<tr><td nowrap>速度</td><td>125</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-stun">眩晕</a> 0.5s（35%）</td></tr>
<tr><td nowrap>特殊</td><td>自爆半径 90</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 6+ 波</td></tr>
</table>

<a id="enemy-tire_roller"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/tire_roller.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">滚轮胎</th></tr>
<tr><td colspan="2"><i>废轮胎滚滚而来，撞飞一切。</i></td></tr>
<tr><td nowrap>行为</td><td>蓄力冲撞</td></tr>
<tr><td nowrap>生命</td><td>24（每波 +75%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.75）</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>特殊</td><td>每 3.4s 冲撞</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 8+ 波</td></tr>
</table>

<a id="enemy-scrap_drone"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/scrap_drone.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">废铁无人机</th></tr>
<tr><td colspan="2"><i>拼凑的无人机，投掷废铁块。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>10（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>110</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>特殊</td><td>每 2.5s 射击</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 4+ 波</td></tr>
</table>

<a id="enemy-glass_shard"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/glass_shard.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">碎玻璃怪</th></tr>
<tr><td colspan="2"><i>锋利的碎玻璃，蹭一下就流血。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>12（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>100</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-bleed">流血</a> 3s（40%）</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 3+ 波</td></tr>
</table>

<a id="enemy-rusty_nail"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/rusty_nail.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">锈钉虫</th></tr>
<tr><td colspan="2"><i>成群爬行的锈钉子。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>4（每波 +45%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>140</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 2+ 波</td></tr>
</table>

<a id="enemy-junk_heap"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/junk_heap.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">垃圾堆</th></tr>
<tr><td colspan="2"><i>会蠕动的垃圾堆，不断抖出锈钉虫。</i></td></tr>
<tr><td nowrap>行为</td><td>召唤</td></tr>
<tr><td nowrap>生命</td><td>32（每波 +80%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.65）</td></tr>
<tr><td nowrap>速度</td><td>40</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>4</td></tr>
<tr><td nowrap>特殊</td><td>召唤 3 只<a href="#enemy-rusty_nail">锈钉虫</a></td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 11+ 波</td></tr>
</table>

<a id="enemy-junk_radio"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/junk_radio.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">破收音机</th></tr>
<tr><td colspan="2"><i>播放刺耳噪音，为周围怪物回血。</i></td></tr>
<tr><td nowrap>行为</td><td>治疗同伴</td></tr>
<tr><td nowrap>生命</td><td>16（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.4）</td></tr>
<tr><td nowrap>速度</td><td>55</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>特殊</td><td>治疗半径 180 内同伴 0.2</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a> 第 9+ 波</td></tr>
</table>

<a id="enemy-conveyor_gremlin"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/conveyor_gremlin.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">传送带小妖</th></tr>
<tr><td colspan="2"><i>在流水线上窜来窜去捣乱。</i></td></tr>
<tr><td nowrap>行为</td><td>游荡</td></tr>
<tr><td nowrap>生命</td><td>12（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.45）</td></tr>
<tr><td nowrap>速度</td><td>125</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 2+ 波</td></tr>
</table>

<a id="enemy-sauce_drip"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/sauce_drip.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">酱汁滴</th></tr>
<tr><td colspan="2"><i>滴落的番茄酱，成群涌来。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>5（每波 +50%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>130</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 2+ 波</td></tr>
</table>

<a id="enemy-cap_drone"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/cap_drone.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">瓶盖无人机</th></tr>
<tr><td colspan="2"><i>旋转的瓶盖，连射汽水弹。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>12（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.65）</td></tr>
<tr><td nowrap>速度</td><td>115</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>特殊</td><td>每 2.8s 射击 2 发</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 4+ 波</td></tr>
</table>

<a id="enemy-ketchup_slime"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/ketchup_slime.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">番茄酱史莱姆</th></tr>
<tr><td colspan="2"><i>被腐化的番茄酱，死后溅成酱汁滴。</i></td></tr>
<tr><td nowrap>行为</td><td>死亡分裂</td></tr>
<tr><td nowrap>生命</td><td>28（每波 +75%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>特殊</td><td>死亡分裂为 3 只<a href="#enemy-sauce_drip">酱汁滴</a></td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 10+ 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 16+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 17+ 波</td></tr>
</table>

<a id="enemy-steam_imp"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/steam_imp.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">蒸汽小鬼</th></tr>
<tr><td colspan="2"><i>冲到身边喷发滚烫蒸汽。</i></td></tr>
<tr><td nowrap>行为</td><td>自爆</td></tr>
<tr><td nowrap>生命</td><td>10（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>4（每波 +0.9）</td></tr>
<tr><td nowrap>速度</td><td>135</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td>2层<a href="SKILLS.md#status-burn">灼烧</a> 3s</td></tr>
<tr><td nowrap>特殊</td><td>自爆半径 95</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 5+ 波</td></tr>
</table>

<a id="enemy-rivet_bot"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/rivet_bot.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">铆钉机器人</th></tr>
<tr><td colspan="2"><i>全身铆钉的重型机器人，拳拳破甲。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>32（每波 +80%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.75）</td></tr>
<tr><td nowrap>速度</td><td>75</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-armorBreak">破甲</a> 4s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 9+ 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 13+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 17+ 波</td></tr>
</table>

<a id="enemy-label_ghost"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/label_ghost.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">标签幽灵</th></tr>
<tr><td colspan="2"><i>撕下的商标纸，诅咒使人无法回血。</i></td></tr>
<tr><td nowrap>行为</td><td>游荡</td></tr>
<tr><td nowrap>生命</td><td>14（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>110</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-curse">诅咒</a> 3s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 6+ 波</td></tr>
</table>

<a id="enemy-bottling_bot"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/bottling_bot.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">灌装机器人</th></tr>
<tr><td colspan="2"><i>失控的灌装机，源源不断灌出酱汁滴。</i></td></tr>
<tr><td nowrap>行为</td><td>召唤</td></tr>
<tr><td nowrap>生命</td><td>34（每波 +80%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.65）</td></tr>
<tr><td nowrap>速度</td><td>45</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>4</td></tr>
<tr><td nowrap>特殊</td><td>召唤 3 只<a href="#enemy-sauce_drip">酱汁滴</a></td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 14+ 波</td></tr>
</table>

<a id="enemy-welder_bug"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/welder_bug.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">焊枪虫</th></tr>
<tr><td colspan="2"><i>喷射焊接火花，灼烧目标。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>14（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.65）</td></tr>
<tr><td nowrap>速度</td><td>95</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-burn">灼烧</a> 2s</td></tr>
<tr><td nowrap>特殊</td><td>每 2.6s 射击 3 发</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 8+ 波</td></tr>
</table>

<a id="enemy-press_piston"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/press_piston.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">冲压活塞</th></tr>
<tr><td colspan="2"><i>蓄力后猛冲，势大力沉。</i></td></tr>
<tr><td nowrap>行为</td><td>蓄力冲撞</td></tr>
<tr><td nowrap>生命</td><td>26（每波 +75%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.8）</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>特殊</td><td>每 3.4s 冲撞</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a> 第 12+ 波；<a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 18+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 19+ 波</td></tr>
</table>

<a id="enemy-blight_sprout"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/blight_sprout.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">枯萎嫩芽</th></tr>
<tr><td colspan="2"><i>刚冒头就烂掉的幼苗，成群扑来。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>5（每波 +50%）</td></tr>
<tr><td nowrap>伤害</td><td>1（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>130</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 1~8 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 1~9 波</td></tr>
</table>

<a id="enemy-fungus_gnat"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/fungus_gnat.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">菌蚊</th></tr>
<tr><td colspan="2"><i>从潮湿花盆里飞出的小蚊子，叮咬可能致盲。</i></td></tr>
<tr><td nowrap>行为</td><td>游荡</td></tr>
<tr><td nowrap>生命</td><td>9（每波 +55%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.45）</td></tr>
<tr><td nowrap>速度</td><td>145</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>1</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-blind">致盲</a> 1.2s（25%）</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 2+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 1+ 波</td></tr>
</table>

<a id="enemy-rot_chili"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/rot_chili.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">腐辣椒</th></tr>
<tr><td colspan="2"><i>发霉的朝天椒，远远喷出灼烧辣籽。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>13（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>105</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-burn">灼烧</a> 2s</td></tr>
<tr><td nowrap>特殊</td><td>每 3.5s 射击 3 发</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 4+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 7+ 波</td></tr>
</table>

<a id="enemy-slime_cucumber"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/slime_cucumber.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">流汗黄瓜</th></tr>
<tr><td colspan="2"><i>闷在温室里发酵的黄瓜，一路淌下粘液。</i></td></tr>
<tr><td nowrap>行为</td><td>留下黏液</td></tr>
<tr><td nowrap>生命</td><td>18（每波 +70%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>80</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-sticky">黏液</a> 1.5s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 4+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 5+ 波</td></tr>
</table>

<a id="enemy-spore_puff"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/spore_puff.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">孢子马勃</th></tr>
<tr><td colspan="2"><i>圆滚滚的毒蘑菇球，凑近就炸出毒孢子。</i></td></tr>
<tr><td nowrap>行为</td><td>自爆</td></tr>
<tr><td nowrap>生命</td><td>10（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>4（每波 +0.85）</td></tr>
<tr><td nowrap>速度</td><td>125</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td>3层<a href="SKILLS.md#status-poison">中毒</a> 3s</td></tr>
<tr><td nowrap>特殊</td><td>自爆半径 100</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 6+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 5+ 波</td></tr>
</table>

<a id="enemy-vine_lasher"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/vine_lasher.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">腐藤鞭</th></tr>
<tr><td colspan="2"><i>缠满倒刺的烂藤，蓄力后猛抽过来。</i></td></tr>
<tr><td nowrap>行为</td><td>蓄力冲撞</td></tr>
<tr><td nowrap>生命</td><td>24（每波 +75%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.8）</td></tr>
<tr><td nowrap>速度</td><td>75</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>攻击附带</td><td>2层<a href="SKILLS.md#status-bleed">流血</a> 3s</td></tr>
<tr><td nowrap>特殊</td><td>每 3.2s 冲撞</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 8+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 7+ 波</td></tr>
</table>

<a id="enemy-moldy_pumpkin"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/moldy_pumpkin.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">霉变南瓜</th></tr>
<tr><td colspan="2"><i>烂透的南瓜，被打破就滚出一窝枯萎嫩芽。</i></td></tr>
<tr><td nowrap>行为</td><td>死亡分裂</td></tr>
<tr><td nowrap>生命</td><td>30（每波 +75%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.7）</td></tr>
<tr><td nowrap>速度</td><td>65</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>特殊</td><td>死亡分裂为 4 只<a href="#enemy-blight_sprout">枯萎嫩芽</a></td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 11+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 11+ 波</td></tr>
</table>

<a id="enemy-compost_heap"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/compost_heap.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">堆肥桶</th></tr>
<tr><td colspan="2"><i>咕嘟冒泡的堆肥桶，不停孵出菌蚊。</i></td></tr>
<tr><td nowrap>行为</td><td>召唤</td></tr>
<tr><td nowrap>生命</td><td>34（每波 +80%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.65）</td></tr>
<tr><td nowrap>速度</td><td>45</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>4</td></tr>
<tr><td nowrap>特殊</td><td>召唤 3 只<a href="#enemy-fungus_gnat">菌蚊</a></td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a> 第 14+ 波；<a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 15+ 波</td></tr>
</table>

<a id="enemy-rot_cabbage"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/rot_cabbage.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">烂心卷心菜</th></tr>
<tr><td colspan="2"><i>一层层烂叶裹着的重型菜头，碰到会染上腐烂。</i></td></tr>
<tr><td nowrap>行为</td><td>追击</td></tr>
<tr><td nowrap>生命</td><td>32（每波 +80%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.75）</td></tr>
<tr><td nowrap>速度</td><td>75</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-rot">腐烂</a> 3s</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 2+ 波</td></tr>
</table>

<a id="enemy-zombie_carrot"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/zombie_carrot.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">僵尸胡萝卜</th></tr>
<tr><td colspan="2"><i>从烂泥里拔出来的胡萝卜，蓄力后一头扎来。</i></td></tr>
<tr><td nowrap>行为</td><td>蓄力冲撞</td></tr>
<tr><td nowrap>生命</td><td>24（每波 +75%）</td></tr>
<tr><td nowrap>伤害</td><td>3（每波 +0.65）</td></tr>
<tr><td nowrap>速度</td><td>80</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-rot">腐烂</a> 3s</td></tr>
<tr><td nowrap>特殊</td><td>每 3s 冲撞</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 5+ 波</td></tr>
</table>

<a id="enemy-rot_sprinkler"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/enemy/rot_sprinkler.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">腐水洒水器</th></tr>
<tr><td colspan="2"><i>喷洒腐水的洒水器，给周围的怪物浇水回血。先打它！</i></td></tr>
<tr><td nowrap>行为</td><td>治疗同伴</td></tr>
<tr><td nowrap>生命</td><td>22（每波 +70%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>特殊</td><td>治疗半径 200 内同伴 0.2</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 11+ 波</td></tr>
</table>

<a id="enemy-blight_onion"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/blight_onion.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">枯萎洋葱</th></tr>
<tr><td colspan="2"><i>一剥就流泪的烂洋葱，远程喷出呛眼的辛辣汁。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>15（每波 +65%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.6）</td></tr>
<tr><td nowrap>速度</td><td>95</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>2</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-blind">致盲</a> 1.5s（35%）</td></tr>
<tr><td nowrap>特殊</td><td>每 2.5s 射击 2 发</td></tr>
<tr><td nowrap>出现</td><td><a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a> 第 7+ 波</td></tr>
</table>

<a id="enemy-rabbit"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/enemy/rabbit.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">菜园兔子（地形生物）</th></tr>
<tr><td colspan="2"><i>从兔子洞钻出的兔子，四处逃窜，击败后掉落番茄籽与果实。</i></td></tr>
<tr><td nowrap>行为</td><td>逃窜</td></tr>
<tr><td nowrap>生命</td><td>6（每波 +50%）</td></tr>
<tr><td nowrap>伤害</td><td>0（每波 +0）</td></tr>
<tr><td nowrap>速度</td><td>170</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>4</td></tr>
<tr><td nowrap>出现</td><td>由其他怪物召唤/分裂</td></tr>
</table>

<a id="enemy-gopher"></a>

<table>
<tr><td rowspan="10" align="center" valign="middle"><img src="images/enemy/gopher.webp" width="112" height="112" alt=""></td><th colspan="2" align="left">土拨鼠（地形生物）</th></tr>
<tr><td colspan="2"><i>从地洞探出身子扔石头，打中可能眩晕，过一会儿会缩回地下。</i></td></tr>
<tr><td nowrap>行为</td><td>远程射击</td></tr>
<tr><td nowrap>生命</td><td>10（每波 +60%）</td></tr>
<tr><td nowrap>伤害</td><td>2（每波 +0.5）</td></tr>
<tr><td nowrap>速度</td><td>0</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>3</td></tr>
<tr><td nowrap>攻击附带</td><td><a href="SKILLS.md#status-stun">眩晕</a> 0.4s（25%）</td></tr>
<tr><td nowrap>特殊</td><td>每 1.4s 射击</td></tr>
<tr><td nowrap>出现</td><td>由其他怪物召唤/分裂</td></tr>
</table>

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
| [第六章 · 腐烂温室](CHAPTERS.md#chapter-6) | <img src="images/boss/pumpkin_brute.png" width="32" height="32" alt=""> [南瓜蛮汉](#boss-pumpkin_brute)、<img src="images/boss/spore_matron.png" width="32" height="32" alt=""> [孢子女王](#boss-spore_matron) |
| [第七章 · 腐烂菜园](CHAPTERS.md#chapter-7) | <img src="images/boss/carrot_knight.png" width="32" height="32" alt=""> [胡萝卜亡骑](#boss-carrot_knight)、<img src="images/boss/onion_witch.png" width="32" height="32" alt=""> [洋葱巫婆](#boss-onion_witch) |

<a id="boss-roach_general"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/roach_general.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">蟑螂将军</th></tr>
<tr><td colspan="2"><i>披着瓶盖铠甲的蟑螂军团首领。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a></td></tr>
<tr><td nowrap>基础生命</td><td>320</td></tr>
<tr><td nowrap>伤害</td><td>4</td></tr>
<tr><td nowrap>速度</td><td>90</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>22</td></tr>
<tr><td nowrap>招式</td><td>预警冲锋（每 4s）<br>环形弹 ×10（每 5s）</td></tr>
</table>

<a id="boss-mold_elder"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/mold_elder.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">霉菌长老</th></tr>
<tr><td colspan="2"><i>古老的霉菌聚合体，会召唤子嗣。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a></td></tr>
<tr><td nowrap>基础生命</td><td>300</td></tr>
<tr><td nowrap>伤害</td><td>3</td></tr>
<tr><td nowrap>速度</td><td>60</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>22</td></tr>
<tr><td nowrap>招式</td><td>召唤 5 只<a href="MONSTERS.md#enemy-mold">霉菌团</a>（每 6s）<br>扇形瞄准 ×3 命中附带 2层<a href="SKILLS.md#status-poison">中毒</a> 3s（每 2.5s）</td></tr>
</table>

<a id="boss-greasy_pan"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/greasy_pan.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">油腻平底锅</th></tr>
<tr><td colspan="2"><i>沾满陈年油垢的平底锅成了精。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a></td></tr>
<tr><td nowrap>基础生命</td><td>360</td></tr>
<tr><td nowrap>伤害</td><td>4</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>22</td></tr>
<tr><td nowrap>招式</td><td>预警砸地 ×2 命中附带 2层<a href="SKILLS.md#status-burn">灼烧</a> 3s（每 4s）<br>乱射 ×8 命中附带 <a href="SKILLS.md#status-sticky">黏液</a> 1.5s（每 3.5s）</td></tr>
</table>

<a id="boss-fork_knight"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/fork_knight.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">叉子骑士</th></tr>
<tr><td colspan="2"><i>被腐化的餐叉，冲刺穿刺。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a></td></tr>
<tr><td nowrap>基础生命</td><td>300</td></tr>
<tr><td nowrap>伤害</td><td>5</td></tr>
<tr><td nowrap>速度</td><td>100</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>22</td></tr>
<tr><td nowrap>招式</td><td>预警冲锋 命中附带 2层<a href="SKILLS.md#status-bleed">流血</a> 3s（每 3s）<br>扇形瞄准 ×5（每 3s）</td></tr>
</table>

<a id="boss-fly_swarm_king"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/fly_swarm_king.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">蝇群之主</th></tr>
<tr><td colspan="2"><i>嗡嗡作响的巨型苍蝇。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a></td></tr>
<tr><td nowrap>基础生命</td><td>280</td></tr>
<tr><td nowrap>伤害</td><td>3</td></tr>
<tr><td nowrap>速度</td><td>120</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>22</td></tr>
<tr><td nowrap>招式</td><td>召唤 5 只<a href="MONSTERS.md#enemy-fly">果蝇</a>（每 5s）<br>瞬移（每 6s）<br>环形弹 ×12（每 4s）</td></tr>
</table>

<a id="boss-rotten_onion"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/rotten_onion.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">腐烂洋葱</th></tr>
<tr><td colspan="2"><i>散发催泪毒气的烂洋葱。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a></td></tr>
<tr><td nowrap>基础生命</td><td>340</td></tr>
<tr><td nowrap>伤害</td><td>3</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>22</td></tr>
<tr><td nowrap>招式</td><td>危险区 ×3 命中附带 <a href="SKILLS.md#status-blind">致盲</a> 2s（每 5s）<br>环形弹 ×10 命中附带 <a href="SKILLS.md#status-weaken">虚弱</a> 3s（每 4s）</td></tr>
</table>

<a id="boss-rat_captain"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/rat_captain.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">鼠队长</th></tr>
<tr><td colspan="2"><i>戴着瓶盖头盔的老鼠头目。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a></td></tr>
<tr><td nowrap>基础生命</td><td>380</td></tr>
<tr><td nowrap>伤害</td><td>4</td></tr>
<tr><td nowrap>速度</td><td>110</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>26</td></tr>
<tr><td nowrap>招式</td><td>预警冲锋 命中附带 <a href="SKILLS.md#status-bleed">流血</a> 3s（每 3s）<br>扇形瞄准 ×5（每 3.5s）<br>召唤 3 只<a href="MONSTERS.md#enemy-rat">下水道老鼠</a>（每 8s）</td></tr>
</table>

<a id="boss-snail_tank"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/snail_tank.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">装甲蜗牛</th></tr>
<tr><td colspan="2"><i>背着铁壳的巨型蜗牛。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a></td></tr>
<tr><td nowrap>基础生命</td><td>480</td></tr>
<tr><td nowrap>伤害</td><td>4</td></tr>
<tr><td nowrap>速度</td><td>45</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>26</td></tr>
<tr><td nowrap>招式</td><td>危险区 ×4 命中附带 <a href="SKILLS.md#status-sticky">黏液</a> 2s（每 4s）<br>强化 自身/同伴获得 <a href="SKILLS.md#status-barrier">屏障</a> 4s（每 10s）</td></tr>
<tr><td nowrap>固定词缀</td><td><a href="#affixes">坚甲</a></td></tr>
</table>

<a id="boss-queen_bee"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/queen_bee.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">蜂后</th></tr>
<tr><td colspan="2"><i>统领毒蜂的女王。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a></td></tr>
<tr><td nowrap>基础生命</td><td>330</td></tr>
<tr><td nowrap>伤害</td><td>3</td></tr>
<tr><td nowrap>速度</td><td>100</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>26</td></tr>
<tr><td nowrap>招式</td><td>召唤 4 只<a href="MONSTERS.md#enemy-bee">毒蜂</a>（每 5s）<br>扇形瞄准 ×3 命中附带 3层<a href="SKILLS.md#status-poison">中毒</a> 4s（每 2.5s）</td></tr>
</table>

<a id="boss-scarecrow"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/scarecrow.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">邪恶稻草人</th></tr>
<tr><td colspan="2"><i>被腐化附身的稻草人。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a></td></tr>
<tr><td nowrap>基础生命</td><td>350</td></tr>
<tr><td nowrap>伤害</td><td>4</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>26</td></tr>
<tr><td nowrap>招式</td><td>瞬移（每 5s）<br>环形弹 ×14 命中附带 <a href="SKILLS.md#status-confuse">混乱</a> 1.5s（40%）（每 3.5s）<br>召唤 4 只<a href="MONSTERS.md#enemy-worm">泥蚯蚓</a>（每 9s）</td></tr>
</table>

<a id="boss-spider_matron"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/spider_matron.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">蛛后</th></tr>
<tr><td colspan="2"><i>在菜园织网的巨型毒蛛。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a></td></tr>
<tr><td nowrap>基础生命</td><td>360</td></tr>
<tr><td nowrap>伤害</td><td>4</td></tr>
<tr><td nowrap>速度</td><td>80</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>26</td></tr>
<tr><td nowrap>招式</td><td>乱射 ×10 命中附带 2层<a href="SKILLS.md#status-poison">中毒</a> 3s（每 3s）<br>召唤 3 只<a href="MONSTERS.md#enemy-spider">毒蜘蛛</a>（每 7s）</td></tr>
</table>

<a id="boss-mushroom_king"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/mushroom_king.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">毒菇王</th></tr>
<tr><td colspan="2"><i>菌伞巨大的毒蘑菇之王。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a></td></tr>
<tr><td nowrap>基础生命</td><td>340</td></tr>
<tr><td nowrap>伤害</td><td>3</td></tr>
<tr><td nowrap>速度</td><td>55</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>26</td></tr>
<tr><td nowrap>招式</td><td>强化 自身/同伴获得 3层<a href="SKILLS.md#status-regen">再生</a> 4s、<a href="SKILLS.md#status-haste">急速</a> 4s（每 7s）<br>危险区 ×3 命中附带 3层<a href="SKILLS.md#status-poison">中毒</a> 3s（每 4s）</td></tr>
<tr><td nowrap>固定词缀</td><td><a href="#affixes">再生</a></td></tr>
</table>

<a id="boss-ice_golem"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/ice_golem.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">冰晶傀儡</th></tr>
<tr><td colspan="2"><i>冰箱深处凝结的傀儡。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a></td></tr>
<tr><td nowrap>基础生命</td><td>420</td></tr>
<tr><td nowrap>伤害</td><td>4</td></tr>
<tr><td nowrap>速度</td><td>55</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>30</td></tr>
<tr><td nowrap>招式</td><td>预警砸地 ×1 命中附带 <a href="SKILLS.md#status-freeze">冰冻</a> 1s（每 4s）<br>环形弹 ×12（每 4.5s）</td></tr>
</table>

<a id="boss-popsicle_twins"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/popsicle_twins.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">冰棍双子</th></tr>
<tr><td colspan="2"><i>一根木棍上的两根冰棍。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a></td></tr>
<tr><td nowrap>基础生命</td><td>380</td></tr>
<tr><td nowrap>伤害</td><td>4</td></tr>
<tr><td nowrap>速度</td><td>85</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>30</td></tr>
<tr><td nowrap>招式</td><td>螺旋弹幕 ×4（每 6s）<br>预警冲锋 命中附带 2层<a href="SKILLS.md#status-slow">减速</a> 3s（每 4s）</td></tr>
</table>

<a id="boss-frozen_fish"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/frozen_fish.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">冻鱼武士</th></tr>
<tr><td colspan="2"><i>冻得邦邦硬的鱼，当剑来用。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a></td></tr>
<tr><td nowrap>基础生命</td><td>400</td></tr>
<tr><td nowrap>伤害</td><td>5</td></tr>
<tr><td nowrap>速度</td><td>95</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>30</td></tr>
<tr><td nowrap>招式</td><td>预警激光 命中附带 <a href="SKILLS.md#status-freeze">冰冻</a> 0.8s（每 5s）<br>预警冲锋（每 3.5s）</td></tr>
</table>

<a id="boss-snow_rat"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/snow_rat.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">雪鼠刺客</th></tr>
<tr><td colspan="2"><i>白色皮毛的鼠辈刺客。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a></td></tr>
<tr><td nowrap>基础生命</td><td>330</td></tr>
<tr><td nowrap>伤害</td><td>5</td></tr>
<tr><td nowrap>速度</td><td>130</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>30</td></tr>
<tr><td nowrap>招式</td><td>瞬移（每 3.5s）<br>扇形瞄准 ×3 命中附带 2层<a href="SKILLS.md#status-bleed">流血</a> 3s（每 2s）</td></tr>
<tr><td nowrap>固定词缀</td><td><a href="#affixes">迅捷</a></td></tr>
</table>

<a id="boss-milk_slime"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/milk_slime.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">变质牛奶怪</th></tr>
<tr><td colspan="2"><i>过期牛奶凝成的史莱姆。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a></td></tr>
<tr><td nowrap>基础生命</td><td>450</td></tr>
<tr><td nowrap>伤害</td><td>3</td></tr>
<tr><td nowrap>速度</td><td>60</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>30</td></tr>
<tr><td nowrap>招式</td><td>危险区 ×4 命中附带 <a href="SKILLS.md#status-weaken">虚弱</a> 3s、<a href="SKILLS.md#status-sticky">黏液</a> 2s（每 4s）<br>召唤 4 只<a href="MONSTERS.md#enemy-mold">霉菌团</a>（每 7s）</td></tr>
</table>

<a id="boss-frost_penguin"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/frost_penguin.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">冰霜企鹅</th></tr>
<tr><td colspan="2"><i>冷酷的企鹅，滑行冲撞。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a></td></tr>
<tr><td nowrap>基础生命</td><td>380</td></tr>
<tr><td nowrap>伤害</td><td>4</td></tr>
<tr><td nowrap>速度</td><td>90</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>30</td></tr>
<tr><td nowrap>招式</td><td>预警冲锋 命中附带 2层<a href="SKILLS.md#status-slow">减速</a> 2s（每 3s）<br>环形弹 ×16（每 4s）</td></tr>
</table>

<a id="boss-tire_beast"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/tire_beast.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">轮胎兽</th></tr>
<tr><td colspan="2"><i>废轮胎堆成的野兽。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a></td></tr>
<tr><td nowrap>基础生命</td><td>480</td></tr>
<tr><td nowrap>伤害</td><td>5</td></tr>
<tr><td nowrap>速度</td><td>80</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>34</td></tr>
<tr><td nowrap>招式</td><td>预警冲锋（每 3s）<br>预警砸地 ×3（每 5s）</td></tr>
<tr><td nowrap>固定词缀</td><td><a href="#affixes">坚甲</a></td></tr>
</table>

<a id="boss-can_king"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/can_king.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">易拉罐之王</th></tr>
<tr><td colspan="2"><i>易拉罐蟹的巨型王者。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a></td></tr>
<tr><td nowrap>基础生命</td><td>520</td></tr>
<tr><td nowrap>伤害</td><td>5</td></tr>
<tr><td nowrap>速度</td><td>65</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>34</td></tr>
<tr><td nowrap>招式</td><td>乱射 ×10 命中附带 2层<a href="SKILLS.md#status-armorBreak">破甲</a> 4s（每 3s）<br>召唤 3 只<a href="MONSTERS.md#enemy-can_crab">易拉罐蟹</a>（每 8s）</td></tr>
<tr><td nowrap>固定词缀</td><td><a href="#affixes">荆棘</a></td></tr>
</table>

<a id="boss-rag_wraith"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/rag_wraith.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">抹布怨灵</th></tr>
<tr><td colspan="2"><i>无数脏抹布组成的怨灵。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a></td></tr>
<tr><td nowrap>基础生命</td><td>400</td></tr>
<tr><td nowrap>伤害</td><td>4</td></tr>
<tr><td nowrap>速度</td><td>95</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>34</td></tr>
<tr><td nowrap>招式</td><td>瞬移（每 4s）<br>环形弹 ×14 命中附带 <a href="SKILLS.md#status-blind">致盲</a> 2s、<a href="SKILLS.md#status-curse">诅咒</a> 2s（每 3.5s）</td></tr>
</table>

<a id="boss-battery_bug"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/battery_bug.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">漏电电池虫</th></tr>
<tr><td colspan="2"><i>被丢弃的电池里孵出的电虫。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a></td></tr>
<tr><td nowrap>基础生命</td><td>420</td></tr>
<tr><td nowrap>伤害</td><td>5</td></tr>
<tr><td nowrap>速度</td><td>85</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>34</td></tr>
<tr><td nowrap>招式</td><td>预警激光 命中附带 <a href="SKILLS.md#status-stun">眩晕</a> 0.6s（每 4s）<br>乱射 ×8（每 3s）</td></tr>
</table>

<a id="boss-garbage_rat"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/garbage_rat.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">垃圾鼠王</th></tr>
<tr><td colspan="2"><i>在垃圾场称霸的肥硕老鼠。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a></td></tr>
<tr><td nowrap>基础生命</td><td>520</td></tr>
<tr><td nowrap>伤害</td><td>5</td></tr>
<tr><td nowrap>速度</td><td>80</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>34</td></tr>
<tr><td nowrap>招式</td><td>召唤 5 只<a href="MONSTERS.md#enemy-rat">下水道老鼠</a>（每 6s）<br>预警冲锋 命中附带 2层<a href="SKILLS.md#status-bleed">流血</a> 3s（每 4s）</td></tr>
<tr><td nowrap>固定词缀</td><td><a href="#affixes">统帅</a></td></tr>
</table>

<a id="boss-oil_titan"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/oil_titan.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">石油泰坦</th></tr>
<tr><td colspan="2"><i>泄漏的石油化成的巨人。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a></td></tr>
<tr><td nowrap>基础生命</td><td>500</td></tr>
<tr><td nowrap>伤害</td><td>4</td></tr>
<tr><td nowrap>速度</td><td>55</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>34</td></tr>
<tr><td nowrap>招式</td><td>危险区 ×5 命中附带 <a href="SKILLS.md#status-sticky">黏液</a> 2s、2层<a href="SKILLS.md#status-burn">灼烧</a> 3s（每 4s）<br>环形弹 ×16（每 4s）</td></tr>
</table>

<a id="boss-conveyor_worm"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/conveyor_worm.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">传送带蠕虫</th></tr>
<tr><td colspan="2"><i>机械化的巨型蠕虫。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a></td></tr>
<tr><td nowrap>基础生命</td><td>520</td></tr>
<tr><td nowrap>伤害</td><td>6</td></tr>
<tr><td nowrap>速度</td><td>100</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>38</td></tr>
<tr><td nowrap>招式</td><td>预警冲锋（每 2.8s）<br>乱射 ×10 命中附带 2层<a href="SKILLS.md#status-armorBreak">破甲</a> 4s（每 3s）</td></tr>
</table>

<a id="boss-ketchup_golem"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/ketchup_golem.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">番茄酱傀儡</th></tr>
<tr><td colspan="2"><i>被腐化的番茄酱灌注而成的傀儡。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a></td></tr>
<tr><td nowrap>基础生命</td><td>560</td></tr>
<tr><td nowrap>伤害</td><td>5</td></tr>
<tr><td nowrap>速度</td><td>65</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>38</td></tr>
<tr><td nowrap>招式</td><td>危险区 ×4 命中附带 2层<a href="SKILLS.md#status-burn">灼烧</a> 3s、<a href="SKILLS.md#status-sticky">黏液</a> 1.5s（每 4s）<br>环形弹 ×16（每 3.5s）</td></tr>
</table>

<a id="boss-security_bot"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/security_bot.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">保安机器人</th></tr>
<tr><td colspan="2"><i>工厂的巡逻保安。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a></td></tr>
<tr><td nowrap>基础生命</td><td>500</td></tr>
<tr><td nowrap>伤害</td><td>6</td></tr>
<tr><td nowrap>速度</td><td>85</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>38</td></tr>
<tr><td nowrap>招式</td><td>预警激光（每 3.5s）<br>扇形瞄准 ×3 命中附带 <a href="SKILLS.md#status-stun">眩晕</a> 0.4s（30%）（每 2s）<br>强化 自身/同伴获得 <a href="SKILLS.md#status-barrier">屏障</a> 3s（每 9s）</td></tr>
</table>

<a id="boss-press_machine"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/press_machine.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">冲压机</th></tr>
<tr><td colspan="2"><i>巨大的冲压机械，砸下来就是一片。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a></td></tr>
<tr><td nowrap>基础生命</td><td>600</td></tr>
<tr><td nowrap>伤害</td><td>7</td></tr>
<tr><td nowrap>速度</td><td>50</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>38</td></tr>
<tr><td nowrap>招式</td><td>预警砸地 ×3 命中附带 <a href="SKILLS.md#status-stun">眩晕</a> 0.8s（每 3s）</td></tr>
<tr><td nowrap>固定词缀</td><td><a href="#affixes">坚甲</a></td></tr>
</table>

<a id="boss-chef_minion"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/chef_minion.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">腐烂副厨</th></tr>
<tr><td colspan="2"><i>腐烂大厨的得力助手。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a></td></tr>
<tr><td nowrap>基础生命</td><td>520</td></tr>
<tr><td nowrap>伤害</td><td>5</td></tr>
<tr><td nowrap>速度</td><td>90</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>38</td></tr>
<tr><td nowrap>招式</td><td>扇形瞄准 ×5 命中附带 2层<a href="SKILLS.md#status-poison">中毒</a> 3s（每 2.2s）<br>瞬移（每 5s）<br>召唤 2 只<a href="MONSTERS.md#enemy-robot_can">罐头机器人</a>（每 8s）</td></tr>
</table>

<a id="boss-furnace_imp"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/furnace_imp.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">熔炉小鬼</th></tr>
<tr><td colspan="2"><i>在熔炉中诞生的火焰小鬼。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a></td></tr>
<tr><td nowrap>基础生命</td><td>460</td></tr>
<tr><td nowrap>伤害</td><td>6</td></tr>
<tr><td nowrap>速度</td><td>110</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>38</td></tr>
<tr><td nowrap>招式</td><td>螺旋弹幕 ×5 命中附带 2层<a href="SKILLS.md#status-burn">灼烧</a> 3s（每 5s）<br>瞬移（每 4s）</td></tr>
<tr><td nowrap>固定词缀</td><td><a href="#affixes">迅捷</a></td></tr>
</table>

<a id="boss-pumpkin_brute"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/pumpkin_brute.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">南瓜蛮汉</th></tr>
<tr><td colspan="2"><i>烂成空壳的巨型南瓜，横冲直撞、落地震地。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a></td></tr>
<tr><td nowrap>基础生命</td><td>580</td></tr>
<tr><td nowrap>伤害</td><td>7</td></tr>
<tr><td nowrap>速度</td><td>75</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>42</td></tr>
<tr><td nowrap>招式</td><td>预警冲锋（每 4s）<br>预警砸地 ×3 命中附带 <a href="SKILLS.md#status-stun">眩晕</a> 0.6s（每 5s）</td></tr>
<tr><td nowrap>固定词缀</td><td><a href="#affixes">坚甲</a></td></tr>
</table>

<a id="boss-spore_matron"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/spore_matron.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">孢子女王</th></tr>
<tr><td colspan="2"><i>温室角落里的巨型马勃，散播毒雾、催生孢子。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a></td></tr>
<tr><td nowrap>基础生命</td><td>520</td></tr>
<tr><td nowrap>伤害</td><td>6</td></tr>
<tr><td nowrap>速度</td><td>60</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>42</td></tr>
<tr><td nowrap>招式</td><td>召唤 3 只<a href="MONSTERS.md#enemy-spore_puff">孢子马勃</a>（每 7s）<br>危险区 ×4 命中附带 3层<a href="SKILLS.md#status-poison">中毒</a> 3s（每 5s）<br>环形弹 ×14（每 4s）</td></tr>
</table>

<a id="boss-carrot_knight"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/carrot_knight.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">胡萝卜亡骑</th></tr>
<tr><td colspan="2"><i>披着烂叶披风的僵尸胡萝卜骑士，冲锋后乱刺。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a></td></tr>
<tr><td nowrap>基础生命</td><td>640</td></tr>
<tr><td nowrap>伤害</td><td>7</td></tr>
<tr><td nowrap>速度</td><td>95</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>46</td></tr>
<tr><td nowrap>招式</td><td>预警冲锋（每 3.5s）<br>乱射 ×10 命中附带 <a href="SKILLS.md#status-rot">腐烂</a> 3s（每 3s）<br>瞬移（每 6s）</td></tr>
<tr><td nowrap>固定词缀</td><td><a href="#affixes">迅捷</a></td></tr>
</table>

<a id="boss-onion_witch"></a>

<table>
<tr><td rowspan="8" align="center" valign="middle"><img src="images/boss/onion_witch.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">洋葱巫婆</th></tr>
<tr><td colspan="2"><i>一层层剥开全是诅咒的老洋葱，让人泪流满面。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a></td></tr>
<tr><td nowrap>基础生命</td><td>560</td></tr>
<tr><td nowrap>伤害</td><td>6</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>46</td></tr>
<tr><td nowrap>招式</td><td>环形弹 ×16 命中附带 <a href="SKILLS.md#status-blind">致盲</a> 1.5s（40%）（每 4s）<br>扇形瞄准 ×3 命中附带 <a href="SKILLS.md#status-curse">诅咒</a> 3s（每 2.4s）<br>强化 自身/同伴获得 <a href="SKILLS.md#status-haste">急速</a> 4s、<a href="SKILLS.md#status-regen">再生</a> 4s（每 10s）</td></tr>
</table>

<a id="bosses"></a>

## Boss

每章最后一波出现，生命降到一半进入第二阶段。波次持续 90 秒，超时后 Boss 狂暴：此后每 10 秒 Boss 伤害 ×1.25，并叠加一层狂暴威压（每秒扣除玩家 3% 最大生命 × 1.25^层数，无视闪避、护甲与无敌帧，不设上限），保证战斗一定会结束。

| 章节 | Boss |
| --- | --- |
| [第一章 · 深夜厨房](CHAPTERS.md#chapter-1) | <img src="images/boss/mold_king.png" width="32" height="32" alt=""> [霉菌大王](#boss-mold_king)、<img src="images/boss/grease_chef.png" width="32" height="32" alt=""> [油烟怪厨](#boss-grease_chef)、<img src="images/boss/cockroach_emperor.png" width="32" height="32" alt=""> [蟑螂皇帝](#boss-cockroach_emperor) |
| [第二章 · 荒芜菜园](CHAPTERS.md#chapter-2) | <img src="images/boss/locust_queen.png" width="32" height="32" alt=""> [蝗虫女皇](#boss-locust_queen)、<img src="images/boss/rotten_pumpkin.png" width="32" height="32" alt=""> [腐烂南瓜王](#boss-rotten_pumpkin)、<img src="images/boss/mole_general.png" width="32" height="32" alt=""> [鼹鼠大将](#boss-mole_general) |
| [第三章 · 冰封冰箱](CHAPTERS.md#chapter-3) | <img src="images/boss/frost_rat_king.png" width="32" height="32" alt=""> [冰霜鼠王](#boss-frost_rat_king)、<img src="images/boss/ice_cream_tyrant.png" width="32" height="32" alt=""> [冰淇淋暴君](#boss-ice_cream_tyrant)、<img src="images/boss/freezer_heart.png" width="32" height="32" alt=""> [冰柜之心](#boss-freezer_heart) |
| [第四章 · 城市垃圾场](CHAPTERS.md#chapter-4) | <img src="images/boss/trash_golem.png" width="32" height="32" alt=""> [垃圾巨像](#boss-trash_golem)、<img src="images/boss/toxic_barrel.png" width="32" height="32" alt=""> [毒液桶魔](#boss-toxic_barrel)、<img src="images/boss/scrap_dragon.png" width="32" height="32" alt=""> [废铁巨龙](#boss-scrap_dragon) |
| [第五章 · 番茄酱工厂](CHAPTERS.md#chapter-5) | <img src="images/boss/rotten_chef.png" width="32" height="32" alt=""> [腐烂大厨](#boss-rotten_chef)、<img src="images/boss/factory_core.png" width="32" height="32" alt=""> [工厂主脑](#boss-factory_core)、<img src="images/boss/ketchup_leviathan.png" width="32" height="32" alt=""> [番茄酱海怪](#boss-ketchup_leviathan) |
| [第六章 · 腐烂温室](CHAPTERS.md#chapter-6) | <img src="images/boss/blight_gardener.png" width="32" height="32" alt=""> [枯萎园丁](#boss-blight_gardener) |
| [第七章 · 腐烂菜园](CHAPTERS.md#chapter-7) | <img src="images/boss/rot_mother.png" width="32" height="32" alt=""> [腐土之母](#boss-rot_mother)、<img src="images/boss/rot_king.png" width="32" height="32" alt=""> [腐烂之王](#boss-rot_king) |

<a id="boss-mold_king"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/mold_king.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">霉菌大王 · 第一章 Boss</th></tr>
<tr><td colspan="2"><i>盘踞在厨房水槽里的霉菌之王。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a></td></tr>
<tr><td nowrap>基础生命</td><td>1800</td></tr>
<tr><td nowrap>伤害</td><td>5</td></tr>
<tr><td nowrap>速度</td><td>55</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>72</td></tr>
<tr><td nowrap>招式</td><td>环形弹 ×14（每 3.5s）<br>召唤 6 只<a href="MONSTERS.md#enemy-mold">霉菌团</a>（每 7s）<br>预警砸地 ×3（每 6s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.3，冷却 ×0.8；新增 螺旋弹幕 ×6 命中附带 2层<a href="SKILLS.md#status-poison">中毒</a> 3s（每 8s）</td></tr>
</table>

<a id="boss-grease_chef"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/grease_chef.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">油烟怪厨 · 第一章 Boss</th></tr>
<tr><td colspan="2"><i>抽油烟机里积攒百年的油烟成了精。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a></td></tr>
<tr><td nowrap>基础生命</td><td>1900</td></tr>
<tr><td nowrap>伤害</td><td>5</td></tr>
<tr><td nowrap>速度</td><td>60</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>72</td></tr>
<tr><td nowrap>招式</td><td>危险区 ×4 命中附带 2层<a href="SKILLS.md#status-burn">灼烧</a> 3s、<a href="SKILLS.md#status-blind">致盲</a> 1.5s（每 5s）<br>扇形瞄准 ×5（每 2.5s）<br>预警激光（每 6s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.2，冷却 ×0.8；新增 环形弹 ×18（每 3s）；获得 <a href="SKILLS.md#status-enrage">暴怒</a> 999s</td></tr>
</table>

<a id="boss-cockroach_emperor"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/cockroach_emperor.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">蟑螂皇帝 · 第一章 Boss</th></tr>
<tr><td colspan="2"><i>打不死的蟑螂皇帝，拥有惊人的再生力。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-1">第一章 · 深夜厨房</a></td></tr>
<tr><td nowrap>基础生命</td><td>2000</td></tr>
<tr><td nowrap>伤害</td><td>6</td></tr>
<tr><td nowrap>速度</td><td>75</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>72</td></tr>
<tr><td nowrap>招式</td><td>预警冲锋（每 3.5s）<br>召唤 4 只<a href="MONSTERS.md#enemy-cockroach">蟑螂</a>（每 6s）<br>强化 自身/同伴获得 5层<a href="SKILLS.md#status-regen">再生</a> 4s（每 12s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 40%：移速 ×1.3，冷却 ×0.75；新增 乱射 ×12 命中附带 2层<a href="SKILLS.md#status-armorBreak">破甲</a> 5s（每 3s）</td></tr>
</table>

<a id="boss-locust_queen"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/locust_queen.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">蝗虫女皇 · 第二章 Boss</th></tr>
<tr><td colspan="2"><i>吞噬整片菜园的虫群女王。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a></td></tr>
<tr><td nowrap>基础生命</td><td>2200</td></tr>
<tr><td nowrap>伤害</td><td>6</td></tr>
<tr><td nowrap>速度</td><td>80</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>84</td></tr>
<tr><td nowrap>招式</td><td>预警冲锋（每 4s）<br>召唤 6 只<a href="MONSTERS.md#enemy-fly">果蝇</a>（每 6s）<br>扇形瞄准 ×5（每 2.8s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.25，冷却 ×0.75；新增 环形弹 ×18（每 4s）</td></tr>
</table>

<a id="boss-rotten_pumpkin"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/rotten_pumpkin.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">腐烂南瓜王 · 第二章 Boss</th></tr>
<tr><td colspan="2"><i>万圣节后被遗弃的巨型南瓜。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a></td></tr>
<tr><td nowrap>基础生命</td><td>2400</td></tr>
<tr><td nowrap>伤害</td><td>6</td></tr>
<tr><td nowrap>速度</td><td>55</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>84</td></tr>
<tr><td nowrap>招式</td><td>预警砸地 ×4（每 4.5s）<br>召唤 4 只<a href="MONSTERS.md#enemy-worm">泥蚯蚓</a>（每 7s）<br>螺旋弹幕 ×5 命中附带 <a href="SKILLS.md#status-curse">诅咒</a> 3s（每 8s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.2，冷却 ×0.75；新增 瞬移（每 5s）</td></tr>
</table>

<a id="boss-mole_general"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/mole_general.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">鼹鼠大将 · 第二章 Boss</th></tr>
<tr><td colspan="2"><i>在菜园底下挖了无数地道的鼹鼠将军。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-2">第二章 · 荒芜菜园</a></td></tr>
<tr><td nowrap>基础生命</td><td>2300</td></tr>
<tr><td nowrap>伤害</td><td>7</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>84</td></tr>
<tr><td nowrap>招式</td><td>瞬移（每 4s）<br>预警砸地 ×2 命中附带 <a href="SKILLS.md#status-stun">眩晕</a> 0.6s（每 3.5s）<br>乱射 ×12（每 3s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.2，冷却 ×0.7；新增 召唤 4 只<a href="MONSTERS.md#enemy-worm">泥蚯蚓</a>（每 7s）</td></tr>
</table>

<a id="boss-frost_rat_king"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/frost_rat_king.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">冰霜鼠王 · 第三章 Boss</th></tr>
<tr><td colspan="2"><i>统治冰箱的鼠王，寒气逼人。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a></td></tr>
<tr><td nowrap>基础生命</td><td>2600</td></tr>
<tr><td nowrap>伤害</td><td>7</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>96</td></tr>
<tr><td nowrap>招式</td><td>螺旋弹幕 ×5（每 7s）<br>预警冲锋 命中附带 <a href="SKILLS.md#status-freeze">冰冻</a> 0.8s（每 5s）<br>危险区 ×4（每 6s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.2，冷却 ×0.75；新增 召唤 4 只<a href="MONSTERS.md#enemy-rat">下水道老鼠</a>（每 7s）</td></tr>
</table>

<a id="boss-ice_cream_tyrant"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/ice_cream_tyrant.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">冰淇淋暴君 · 第三章 Boss</th></tr>
<tr><td colspan="2"><i>三层冰淇淋球叠成的暴君。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a></td></tr>
<tr><td nowrap>基础生命</td><td>2700</td></tr>
<tr><td nowrap>伤害</td><td>7</td></tr>
<tr><td nowrap>速度</td><td>60</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>96</td></tr>
<tr><td nowrap>招式</td><td>环形弹 ×16（每 3s）<br>预警激光 命中附带 <a href="SKILLS.md#status-freeze">冰冻</a> 1s（每 5s）<br>召唤 4 只<a href="MONSTERS.md#enemy-ice_cube">冰块怪</a>（每 8s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.2，冷却 ×0.75；新增 螺旋弹幕 ×6（每 7s）</td></tr>
</table>

<a id="boss-freezer_heart"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/freezer_heart.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">冰柜之心 · 第三章 Boss</th></tr>
<tr><td colspan="2"><i>冰柜压缩机中诞生的寒冰核心。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-3">第三章 · 冰封冰箱</a></td></tr>
<tr><td nowrap>基础生命</td><td>2500</td></tr>
<tr><td nowrap>伤害</td><td>7</td></tr>
<tr><td nowrap>速度</td><td>50</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>96</td></tr>
<tr><td nowrap>招式</td><td>瞬移（每 5s）<br>乱射 ×12（每 2.5s）<br>危险区 ×5 命中附带 <a href="SKILLS.md#status-freeze">冰冻</a> 0.8s（每 5s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.3，冷却 ×0.7；新增 环形弹 ×20（每 3s）；获得 <a href="SKILLS.md#status-barrier">屏障</a> 5s</td></tr>
</table>

<a id="boss-trash_golem"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/trash_golem.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">垃圾巨像 · 第四章 Boss</th></tr>
<tr><td colspan="2"><i>由城市垃圾堆积而成的庞然大物。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a></td></tr>
<tr><td nowrap>基础生命</td><td>3200</td></tr>
<tr><td nowrap>伤害</td><td>8</td></tr>
<tr><td nowrap>速度</td><td>45</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>108</td></tr>
<tr><td nowrap>招式</td><td>预警砸地 ×4（每 4.5s）<br>扇形瞄准 ×3（每 2.5s）<br>召唤 2 只<a href="MONSTERS.md#enemy-trash_bag">垃圾袋怪</a>（每 8s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.3，冷却 ×0.7；新增 环形弹 ×20（每 3.5s）</td></tr>
</table>

<a id="boss-toxic_barrel"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/toxic_barrel.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">毒液桶魔 · 第四章 Boss</th></tr>
<tr><td colspan="2"><i>泄漏的化学毒液桶。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a></td></tr>
<tr><td nowrap>基础生命</td><td>3000</td></tr>
<tr><td nowrap>伤害</td><td>7</td></tr>
<tr><td nowrap>速度</td><td>55</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>108</td></tr>
<tr><td nowrap>招式</td><td>危险区 ×5 命中附带 3层<a href="SKILLS.md#status-poison">中毒</a> 4s（每 3.5s）<br>螺旋弹幕 ×6 命中附带 2层<a href="SKILLS.md#status-poison">中毒</a> 3s（每 7s）<br>召唤 3 只<a href="MONSTERS.md#enemy-oil_blob">油污怪</a>（每 8s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.2，冷却 ×0.7；新增 乱射 ×14 命中附带 <a href="SKILLS.md#status-weaken">虚弱</a> 3s（每 2.5s）</td></tr>
</table>

<a id="boss-scrap_dragon"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/scrap_dragon.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">废铁巨龙 · 第四章 Boss</th></tr>
<tr><td colspan="2"><i>废旧金属拼成的机械龙。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-4">第四章 · 城市垃圾场</a></td></tr>
<tr><td nowrap>基础生命</td><td>3300</td></tr>
<tr><td nowrap>伤害</td><td>8</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>108</td></tr>
<tr><td nowrap>招式</td><td>预警激光 命中附带 3层<a href="SKILLS.md#status-burn">灼烧</a> 3s（每 4.5s）<br>预警冲锋（每 4s）<br>螺旋弹幕 ×5 命中附带 <a href="SKILLS.md#status-burn">灼烧</a> 2s（每 7s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.25，冷却 ×0.7；新增 召唤 3 只<a href="MONSTERS.md#enemy-gear_bug">齿轮虫</a>（每 8s）</td></tr>
</table>

<a id="boss-rotten_chef"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/rotten_chef.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">腐烂大厨 · 第五章 Boss</th></tr>
<tr><td colspan="2"><i>番茄工厂的黑心厨师长，一切腐烂的源头。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a></td></tr>
<tr><td nowrap>基础生命</td><td>4000</td></tr>
<tr><td nowrap>伤害</td><td>9</td></tr>
<tr><td nowrap>速度</td><td>85</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>120</td></tr>
<tr><td nowrap>招式</td><td>扇形瞄准 ×7 命中附带 <a href="SKILLS.md#status-rot">腐烂</a> 4s（每 2.2s）<br>预警冲锋（每 5s）<br>预警砸地 ×5（每 6s）<br>召唤 3 只<a href="MONSTERS.md#enemy-robot_can">罐头机器人</a>（每 9s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.3，冷却 ×0.7；新增 螺旋弹幕 ×8（每 7s）、危险区 ×5 命中附带 <a href="SKILLS.md#status-curse">诅咒</a> 3s（每 6s）；获得 <a href="SKILLS.md#status-enrage">暴怒</a> 999s</td></tr>
</table>

<a id="boss-factory_core"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/factory_core.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">工厂主脑 · 第五章 Boss</th></tr>
<tr><td colspan="2"><i>控制整座番茄酱工厂的邪恶 AI。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a></td></tr>
<tr><td nowrap>基础生命</td><td>3800</td></tr>
<tr><td nowrap>伤害</td><td>9</td></tr>
<tr><td nowrap>速度</td><td>50</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>120</td></tr>
<tr><td nowrap>招式</td><td>预警激光（每 3.5s）<br>召唤 3 只<a href="MONSTERS.md#enemy-robot_can">罐头机器人</a>（每 7s）<br>瞬移（每 5s）<br>强化 自身/同伴获得 <a href="SKILLS.md#status-barrier">屏障</a> 4s（每 10s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.3，冷却 ×0.7；新增 环形弹 ×22 命中附带 <a href="SKILLS.md#status-silence">沉默</a> 2s（30%）（每 2.5s）</td></tr>
</table>

<a id="boss-ketchup_leviathan"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/ketchup_leviathan.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">番茄酱海怪 · 第五章 Boss</th></tr>
<tr><td colspan="2"><i>在番茄酱池中翻腾的巨型怪物。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-5">第五章 · 番茄酱工厂</a></td></tr>
<tr><td nowrap>基础生命</td><td>4200</td></tr>
<tr><td nowrap>伤害</td><td>9</td></tr>
<tr><td nowrap>速度</td><td>55</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>120</td></tr>
<tr><td nowrap>招式</td><td>危险区 ×6 命中附带 <a href="SKILLS.md#status-sticky">黏液</a> 2s、2层<a href="SKILLS.md#status-bleed">流血</a> 3s（每 4s）<br>螺旋弹幕 ×7（每 6s）<br>预警砸地 ×4（每 5s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.2，冷却 ×0.7；新增 召唤 4 只<a href="MONSTERS.md#enemy-oil_blob">油污怪</a>（每 7s）、乱射 ×14（每 2.5s）</td></tr>
</table>

<a id="boss-blight_gardener"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/blight_gardener.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">枯萎园丁 · 第六章 Boss</th></tr>
<tr><td colspan="2"><i>把温室变成腐烂苗圃的疯园丁，挥着生锈的修枝剪。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-6">第六章 · 腐烂温室</a></td></tr>
<tr><td nowrap>基础生命</td><td>4200</td></tr>
<tr><td nowrap>伤害</td><td>9</td></tr>
<tr><td nowrap>速度</td><td>80</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>132</td></tr>
<tr><td nowrap>招式</td><td>扇形瞄准 ×5 命中附带 2层<a href="SKILLS.md#status-bleed">流血</a> 3s（每 2.2s）<br>危险区 ×5 命中附带 2层<a href="SKILLS.md#status-poison">中毒</a> 3s、<a href="SKILLS.md#status-sticky">黏液</a> 1.5s（每 5s）<br>召唤 5 只<a href="MONSTERS.md#enemy-blight_sprout">枯萎嫩芽</a>（每 8s）<br>预警冲锋（每 5s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.25，冷却 ×0.7；新增 螺旋弹幕 ×7 命中附带 <a href="SKILLS.md#status-poison">中毒</a> 2s（每 7s）、召唤 2 只<a href="MONSTERS.md#enemy-vine_lasher">腐藤鞭</a>（每 9s）；获得 <a href="SKILLS.md#status-enrage">暴怒</a> 999s</td></tr>
</table>

<a id="boss-rot_mother"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/rot_mother.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">腐土之母 · 第七章 Boss</th></tr>
<tr><td colspan="2"><i>整座菜园腐烂的温床，从烂泥里不断孕育新的腐烂。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a></td></tr>
<tr><td nowrap>基础生命</td><td>4600</td></tr>
<tr><td nowrap>伤害</td><td>10</td></tr>
<tr><td nowrap>速度</td><td>55</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>144</td></tr>
<tr><td nowrap>招式</td><td>危险区 ×6 命中附带 <a href="SKILLS.md#status-rot">腐烂</a> 4s（每 4.5s）<br>召唤 3 只<a href="MONSTERS.md#enemy-rot_cabbage">烂心卷心菜</a>（每 8s）<br>螺旋弹幕 ×7（每 6s）<br>预警砸地 ×4（每 5s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.25，冷却 ×0.7；新增 召唤 1 只<a href="MONSTERS.md#enemy-rot_sprinkler">腐水洒水器</a>（每 9s）、乱射 ×14 命中附带 <a href="SKILLS.md#status-weaken">虚弱</a> 3s（每 2.5s）</td></tr>
</table>

<a id="boss-rot_king"></a>

<table>
<tr><td rowspan="9" align="center" valign="middle"><img src="images/boss/rot_king.webp" width="128" height="128" alt=""></td><th colspan="2" align="left">腐烂之王 · 真结局 Boss</th></tr>
<tr><td colspan="2"><i>所有腐烂的真正源头——腐烂大厨也不过是他的一枚棋子。</i></td></tr>
<tr><td nowrap>章节</td><td><a href="CHAPTERS.md#chapter-7">第七章 · 腐烂菜园</a></td></tr>
<tr><td nowrap>基础生命</td><td>6000</td></tr>
<tr><td nowrap>伤害</td><td>11</td></tr>
<tr><td nowrap>速度</td><td>70</td></tr>
<tr><td nowrap>掉落番茄籽</td><td>200</td></tr>
<tr><td nowrap>招式</td><td>环形弹 ×20 命中附带 <a href="SKILLS.md#status-rot">腐烂</a> 3s（每 3.5s）<br>扇形瞄准 ×7 命中附带 <a href="SKILLS.md#status-curse">诅咒</a> 3s（每 2.2s）<br>预警冲锋（每 5s）<br>预警砸地 ×5 命中附带 <a href="SKILLS.md#status-stun">眩晕</a> 0.6s（每 6s）<br>危险区 ×6 命中附带 3层<a href="SKILLS.md#status-poison">中毒</a> 3s、<a href="SKILLS.md#status-sticky">黏液</a> 1.5s（每 5s）<br>召唤 3 只<a href="MONSTERS.md#enemy-zombie_carrot">僵尸胡萝卜</a>（每 9s）<br>瞬移（每 7s）</td></tr>
<tr><td nowrap>二阶段</td><td>生命 ≤ 50%：移速 ×1.3，冷却 ×0.65；新增 螺旋弹幕 ×8 命中附带 <a href="SKILLS.md#status-rot">腐烂</a> 2s（每 7s）、预警激光 命中附带 2层<a href="SKILLS.md#status-burn">灼烧</a> 3s（每 5s）、乱射 ×16 命中附带 <a href="SKILLS.md#status-weaken">虚弱</a> 3s（每 3s）、强化 自身/同伴获得 <a href="SKILLS.md#status-barrier">屏障</a> 3s（每 12s）；获得 <a href="SKILLS.md#status-enrage">暴怒</a> 999s</td></tr>
</table>

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
| 荆棘 | 近战命中时反弹 5% 伤害（经护甲减免，单次最多 2%、每秒最多 8% 最大生命） |
| 统帅 | 周围怪物获得急速 |
| 巨大 | 生命 +60%，体型变大 |
| 残暴 | 伤害 +40% |
| 灼热 | 攻击附带 2 层灼烧 |
| 撕裂 | 攻击附带 2 层流血 |
| 衰弱 | 攻击附带虚弱 |
| 不屈 | 免疫减速、眩晕与击退 |
| 富有 | 掉落番茄籽 ×3 |
| 分裂 | 死亡时分裂出 2 只同类小怪 |

---

[README](../README.md) · [角色](CHARACTERS.md) · [技能](SKILLS.md) · [武器](WEAPONS.md) · [道具](ITEMS.md) · **怪物** · [关卡](CHAPTERS.md) · [成就](ACHIEVEMENTS.md) · [天赋](TALENTS.md) · [遗物](RELICS.md) · [危机](DANGER.md) · [任务](QUESTS.md) · [设计文档](GDD.md) · [数值表](DATA_TABLES.md) · [更新日志](CHANGELOG.md)

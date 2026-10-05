// 1.4.0 F1：角色专属任务。每名角色 3 个，难度递增；完成 3 个后可开启该角色的觉醒（见 awakenings.ts）。
// 两类任务：
//  - counter：读 save.counters[counter] ≥ target 即完成。只能用代码里真实 bump / bumpMax 过的键
//    （角色维度可用：charWave / charLevel / charKills / charElite / charClear:<角色>:<章节>）。
//  - run：局末用本局结果调用 evalRunQuest 判定，target 恒为 1。
// 描述里的数字必须与条件一致（quests.test.ts 会校验）。

export interface QuestRunCond {
  /** 本局到达的最高波次 ≥ */
  minWave?: number;
  /** 必须通关 */
  win?: boolean;
  /** 危机等级 ≥ */
  minDanger?: number;
  /** 必须是无尽模式 */
  endless?: boolean;
  /** 局末持有武器数 ≤ */
  maxWeapons?: number;
  /** 本局击杀数 ≥ */
  minKills?: number;
  /** 本局等级 ≥ */
  minLevel?: number;
  /** 本局无伤波数 ≥ */
  perfectWaves?: number;
  /** 必须在该章节（精确匹配） */
  chapter?: number;
}

export interface QuestDef {
  id: string;
  charId: string;
  name: [string, string];
  desc: [string, string];
  kind: 'counter' | 'run';
  counter?: string;
  run?: QuestRunCond;
  target: number;
}

/** 局末判定 run 类任务所需的本局结果 */
export interface QuestRunResult {
  charId: string;
  chapterId: number;
  wave: number;
  win: boolean;
  danger: number;
  endless: boolean;
  weapons: number;
  kills: number;
  level: number;
  perfectWaves: number;
}

type Txt = [string, string];

/** counter 类任务：序号 n 决定 id（`${charId}_q${n}`） */
const C = (charId: string, n: number, counter: string, target: number, name: Txt, desc: Txt): QuestDef => ({
  id: `${charId}_q${n}`,
  charId,
  name,
  desc,
  kind: 'counter',
  counter,
  target,
});

/** run 类任务：target 恒为 1 */
const R = (charId: string, n: number, run: QuestRunCond, name: Txt, desc: Txt): QuestDef => ({
  id: `${charId}_q${n}`,
  charId,
  name,
  desc,
  kind: 'run',
  run,
  target: 1,
});

// 常用描述片段（保证同类任务措辞统一）
const reachWave = (n: number): Txt => [`单局到达第 ${n} 波`, `Reach wave ${n} in a run`];
const reachLevel = (n: number): Txt => [`单局达到 ${n} 级`, `Reach level ${n} in a run`];
const totalKills = (n: number): Txt => [`累计击杀 ${n} 名敌人`, `Defeat ${n} enemies in total`];
const totalElites = (n: number): Txt => [`累计击败 ${n} 名精英首领`, `Defeat ${n} elite bosses in total`];
const clearChapter = (ch: number): Txt => [`通关第 ${ch} 章`, `Clear Chapter ${ch}`];
const winDanger = (d: number): Txt => [`在危机等级 ${d} 或以上通关`, `Win on Danger ${d} or higher`];
const endlessWave = (n: number): Txt => [`在无尽模式中到达第 ${n} 波`, `Reach wave ${n} in Endless mode`];
const winKills = (n: number): Txt => [`单局击杀至少 ${n} 名敌人并通关`, `Win a run with at least ${n} kills`];
const winPerfect = (n: number): Txt => [`通关，且单局至少 ${n} 波未受到伤害`, `Win a run with at least ${n} waves without taking damage`];
const winMaxWeapons = (n: number): Txt => [`持有不超过 ${n} 把武器通关`, `Win holding no more than ${n} weapons`];

export const QUESTS: QuestDef[] = [
  // ---------- 番茄妹：全能新手 ----------
  C('tomato', 1, 'charWave:tomato', 10, ['初出茅庐', 'First Steps'], reachWave(10)),
  C('tomato', 2, 'charClear:tomato:1', 1, ['小镇守护者', 'Town Guardian'], clearChapter(1)),
  R('tomato', 3, { win: true, minDanger: 5 }, ['番茄末日', 'Tomageddon Survivor'], winDanger(5)),
  // ---------- 胡萝卜骑士：近战坦克 ----------
  C('carrot', 1, 'charKills:carrot', 1000, ['新兵上阵', 'Recruit'], totalKills(1000)),
  R('carrot', 2, { win: true, maxWeapons: 3 }, ['精兵简政', 'Lean Arsenal'], winMaxWeapons(3)),
  R('carrot', 3, { win: true, minDanger: 6 }, ['不倒骑士', 'Unbreakable Knight'], winDanger(6)),
  // ---------- 辣椒姐：火焰 ----------
  C('chili', 1, 'charWave:chili', 10, ['点火', 'Ignition'], reachWave(10)),
  R('chili', 2, { win: true, minKills: 1500 }, ['燎原之火', 'Wildfire'], winKills(1500)),
  R('chili', 3, { endless: true, minWave: 30 }, ['永不熄灭', 'Eternal Flame'], endlessWave(30)),
  // ---------- 玉米枪手：远程 ----------
  C('corn', 1, 'charLevel:corn', 15, ['瞄准训练', 'Target Practice'], reachLevel(15)),
  R('corn', 2, { win: true, perfectWaves: 3 }, ['风筝大师', 'Kite Master'], winPerfect(3)),
  R('corn', 3, { win: true, minDanger: 5 }, ['西部传奇', 'Wild West Legend'], winDanger(5)),
  // ---------- 西瓜胖墩：重装坦克 ----------
  C('watermelon', 1, 'charWave:watermelon', 12, ['滚起来', 'Rolling'], reachWave(12)),
  C('watermelon', 2, 'charElite:watermelon', 10, ['巨石阵', 'Boulder'], totalElites(10)),
  R('watermelon', 3, { win: true, minDanger: 8 }, ['铜墙铁壁', 'Iron Wall'], winDanger(8)),
  // ---------- 柠檬刺客：暴击 ----------
  C('lemon', 1, 'charKills:lemon', 1500, ['暗杀名单', 'Hit List'], totalKills(1500)),
  R('lemon', 2, { win: true, perfectWaves: 5 }, ['无声无息', 'Untouchable'], winPerfect(5)),
  R(
    'lemon',
    3,
    { win: true, minDanger: 7, maxWeapons: 4 },
    ['致命一击', 'Killing Blow'],
    ['持有不超过 4 把武器，在危机等级 7 或以上通关', 'Win on Danger 7 or higher holding no more than 4 weapons'],
  ),
  // ---------- 茄子法师：雷电 ----------
  C('eggplant', 1, 'charLevel:eggplant', 15, ['学徒法袍', 'Apprentice Robe'], reachLevel(15)),
  R('eggplant', 2, { win: true, minLevel: 25 }, ['大法师', 'Archmage'], ['单局达到 25 级并通关', 'Win a run at level 25 or higher']),
  R('eggplant', 3, { endless: true, minWave: 30 }, ['万雷天牢', 'Thunder Prison'], endlessWave(30)),
  // ---------- 大蒜伯爵：吸血 ----------
  C('garlic', 1, 'charWave:garlic', 12, ['夜幕降临', 'Nightfall'], reachWave(12)),
  R('garlic', 2, { win: true, minKills: 1500 }, ['血宴', 'Blood Feast'], winKills(1500)),
  R('garlic', 3, { win: true, minDanger: 8 }, ['不死伯爵', 'Undying Count'], winDanger(8)),
  // ---------- 蓝莓双子：多武器 ----------
  C('blueberry', 1, 'charWave:blueberry', 12, ['形影不离', 'Inseparable'], reachWave(12)),
  C('blueberry', 2, 'charClear:blueberry:3', 1, ['兵器库', 'Armory'], clearChapter(3)),
  R(
    'blueberry',
    3,
    { win: true, chapter: 5, minDanger: 6 },
    ['双子极限', 'Twin Limit'],
    ['在第 5 章以危机等级 6 或以上通关', 'Win Chapter 5 on Danger 6 or higher'],
  ),
  // ---------- 菠萝船长：经济 ----------
  C('pineapple', 1, 'charWave:pineapple', 10, ['起锚', 'Weigh Anchor'], reachWave(10)),
  R(
    'pineapple',
    2,
    { win: true, chapter: 2, minDanger: 2 },
    ['满载而归', 'Full Cargo'],
    ['在第 2 章以危机等级 2 或以上通关', 'Win Chapter 2 on Danger 2 or higher'],
  ),
  R('pineapple', 3, { endless: true, minWave: 35 }, ['远洋航行', 'Long Voyage'], endlessWave(35)),
  // ---------- 南瓜幽灵：闪避 ----------
  C('pumpkin', 1, 'charKills:pumpkin', 1500, ['不给糖就捣蛋', 'Trick or Treat'], totalKills(1500)),
  R(
    'pumpkin',
    2,
    { perfectWaves: 8 },
    ['飘忽不定', 'Elusive'],
    ['单局至少 8 波未受到伤害', 'Go at least 8 waves without taking damage in a run'],
  ),
  R('pumpkin', 3, { win: true, minDanger: 7 }, ['万圣之夜', 'Hallow Night'], winDanger(7)),
  // ---------- 草莓偶像：成长 ----------
  C('strawberry', 1, 'charLevel:strawberry', 20, ['新人出道', 'Debut'], reachLevel(20)),
  C('strawberry', 2, 'charLevel:strawberry', 35, ['顶流巨星', 'Superstar'], reachLevel(35)),
  R(
    'strawberry',
    3,
    { win: true, minDanger: 6, minLevel: 30 },
    ['巡回演唱会', 'World Tour'],
    ['单局达到 30 级，并在危机等级 6 或以上通关', 'Win on Danger 6 or higher at level 30 or higher'],
  ),
  // ---------- 生姜忍者：疾风 ----------
  C('ginger', 1, 'charWave:ginger', 12, ['下忍', 'Genin'], reachWave(12)),
  R('ginger', 2, { win: true, perfectWaves: 5 }, ['无影', 'Shadowless'], winPerfect(5)),
  R('ginger', 3, { win: true, minDanger: 7 }, ['上忍', 'Jonin'], winDanger(7)),
  // ---------- 牛油果博士：爆炸 ----------
  C('avocado', 1, 'charKills:avocado', 2000, ['实验记录', 'Lab Notes'], totalKills(2000)),
  R('avocado', 2, { win: true, minKills: 2000 }, ['连环爆破', 'Chain Reaction'], winKills(2000)),
  R('avocado', 3, { endless: true, minWave: 35 }, ['终极实验', 'Final Experiment'], endlessWave(35)),
  // ---------- 洋葱大叔：反伤硬汉 ----------
  C('onion', 1, 'charWave:onion', 12, ['第一层', 'First Layer'], reachWave(12)),
  C('onion', 2, 'charElite:onion', 15, ['催泪审判', 'Tear Trial'], totalElites(15)),
  R('onion', 3, { win: true, minDanger: 10 }, ['千层硬汉', 'Thousand Layers'], winDanger(10)),
  // ---------- 蘑菇巫医：剧毒 ----------
  C('mushroom', 1, 'charKills:mushroom', 1000, ['采集孢子', 'Spore Harvest'], totalKills(1000)),
  C('mushroom', 2, 'charClear:mushroom:2', 1, ['菌落扩张', 'Colony'], clearChapter(2)),
  R('mushroom', 3, { win: true, minDanger: 6 }, ['瘟疫之源', 'Plague Source'], winDanger(6)),
  // ---------- 椰子拳师：重拳 ----------
  C('coconut', 1, 'charWave:coconut', 10, ['热身', 'Warm-up'], reachWave(10)),
  R('coconut', 2, { win: true, maxWeapons: 2 }, ['赤手空拳', 'Bare Knuckles'], winMaxWeapons(2)),
  R('coconut', 3, { win: true, minDanger: 7 }, ['拳王', 'Champion'], winDanger(7)),
  // ---------- 葡萄魔术师：幻术 ----------
  C('grape', 1, 'charLevel:grape', 15, ['小把戏', 'Parlor Trick'], reachLevel(15)),
  R('grape', 2, { win: true, perfectWaves: 6 }, ['大变活人', 'Vanishing Act'], winPerfect(6)),
  R('grape', 3, { endless: true, minWave: 30 }, ['终场谢幕', 'Grand Finale'], endlessWave(30)),
  // ---------- 樱桃双枪：连射 ----------
  C('cherry', 1, 'charKills:cherry', 1500, ['弹无虚发', 'Sharpshooter'], totalKills(1500)),
  R('cherry', 2, { win: true, minKills: 2000 }, ['枪林弹雨', 'Bullet Storm'], winKills(2000)),
  R('cherry', 3, { win: true, minDanger: 7 }, ['双枪传说', 'Twin Gun Legend'], winDanger(7)),
  // ---------- 豌豆士兵：军团 ----------
  C('pea', 1, 'charWave:pea', 10, ['列队', 'Fall In'], reachWave(10)),
  C('pea', 2, 'charKills:pea', 5000, ['豌豆大军', 'Pea Army'], totalKills(5000)),
  R(
    'pea',
    3,
    { win: true, chapter: 4, minDanger: 6 },
    ['攻陷垃圾场', 'Storm the Dump'],
    ['在第 4 章以危机等级 6 或以上通关', 'Win Chapter 4 on Danger 6 or higher'],
  ),
  // ---------- 蜜桃天使：治愈 ----------
  C('peach', 1, 'charWave:peach', 12, ['降临', 'Descent'], reachWave(12)),
  C('peach', 2, 'charClear:peach:4', 1, ['净化之地', 'Purified Ground'], clearChapter(4)),
  R('peach', 3, { win: true, minDanger: 8 }, ['大天使', 'Archangel'], winDanger(8)),
  // ---------- 火龙果龙骑：烈焰骑士 ----------
  C('dragonfruit', 1, 'charKills:dragonfruit', 1500, ['龙之血脉', 'Dragon Blood'], totalKills(1500)),
  C('dragonfruit', 2, 'charClear:dragonfruit:3', 1, ['融化冰箱', 'Melt the Fridge'], clearChapter(3)),
  R('dragonfruit', 3, { endless: true, minWave: 35 }, ['龙王', 'Dragon King'], endlessWave(35)),
  // ---------- 甜菜狂战士：狂战 ----------
  C('beet', 1, 'charWave:beet', 12, ['热血', 'Hot Blood'], reachWave(12)),
  R('beet', 2, { win: true, minKills: 1800 }, ['杀戮盛宴', 'Carnage'], winKills(1800)),
  R('beet', 3, { win: true, minDanger: 8 }, ['血战到底', 'Last Stand'], winDanger(8)),
  // ---------- 芦笋弓手：精准 ----------
  C('asparagus', 1, 'charLevel:asparagus', 15, ['拉弓', 'Draw'], reachLevel(15)),
  R('asparagus', 2, { win: true, perfectWaves: 5 }, ['百步穿杨', 'Bullseye'], winPerfect(5)),
  R(
    'asparagus',
    3,
    { win: true, minDanger: 7, maxWeapons: 4 },
    ['神射手', 'Marksman'],
    ['持有不超过 4 把武器，在危机等级 7 或以上通关', 'Win on Danger 7 or higher holding no more than 4 weapons'],
  ),
  // ---------- 红薯厨神：美食 ----------
  C('sweetpotato', 1, 'charWave:sweetpotato', 10, ['开火', 'Fire Up'], reachWave(10)),
  R('sweetpotato', 2, { endless: true, minWave: 20 }, ['流水席', 'Endless Banquet'], endlessWave(20)),
  R('sweetpotato', 3, { win: true, minDanger: 6 }, ['满汉全席', 'Imperial Feast'], winDanger(6)),
  // ---------- 猕猴桃侦探：弱点 ----------
  C('kiwi', 1, 'charKills:kiwi', 1500, ['调查取证', 'Evidence'], totalKills(1500)),
  C('kiwi', 2, 'charElite:kiwi', 20, ['悬案告破', 'Case Closed'], totalElites(20)),
  R('kiwi', 3, { win: true, minDanger: 8 }, ['名侦探', 'Master Detective'], winDanger(8)),
  // ---------- 荔枝公主：幸运 ----------
  C('lychee', 1, 'charWave:lychee', 12, ['出巡', 'Royal Outing'], reachWave(12)),
  R('lychee', 2, { win: true, minDanger: 3 }, ['好运加冕', 'Lucky Crown'], winDanger(3)),
  R('lychee', 3, { endless: true, minWave: 40 }, ['天选之人', 'Chosen One'], endlessWave(40)),
  // ---------- 榴莲霸王：毒刺 ----------
  C('durian', 1, 'charKills:durian', 2000, ['臭名远扬', 'Infamous'], totalKills(2000)),
  R('durian', 2, { win: true, maxWeapons: 3 }, ['刺头', 'Thorny'], winMaxWeapons(3)),
  R('durian', 3, { win: true, minDanger: 10 }, ['水果之王', 'King of Fruits'], winDanger(10)),
  // ---------- 青椒机甲：机甲 ----------
  C('bellpepper', 1, 'charWave:bellpepper', 12, ['系统启动', 'Boot Up'], reachWave(12)),
  C('bellpepper', 2, 'charClear:bellpepper:5', 1, ['攻占工厂', 'Seize the Factory'], clearChapter(5)),
  R(
    'bellpepper',
    3,
    { win: true, chapter: 5, minDanger: 8 },
    ['终极形态', 'Final Form'],
    ['在第 5 章以危机等级 8 或以上通关', 'Win Chapter 5 on Danger 8 or higher'],
  ),
  // ---------- 冬瓜和尚：禅修 ----------
  C('wintermelon', 1, 'charLevel:wintermelon', 15, ['入定', 'Meditation'], reachLevel(15)),
  R(
    'wintermelon',
    2,
    { perfectWaves: 10 },
    ['心如止水', 'Still Water'],
    ['单局至少 10 波未受到伤害', 'Go at least 10 waves without taking damage in a run'],
  ),
  R('wintermelon', 3, { win: true, minDanger: 8 }, ['金刚不坏', 'Diamond Body'], winDanger(8)),
  // ---------- 苦瓜冰法：寒冰 ----------
  C('bittermelon', 1, 'charKills:bittermelon', 1500, ['初雪', 'First Snow'], totalKills(1500)),
  R('bittermelon', 2, { win: true, minKills: 1500 }, ['暴风雪', 'Blizzard'], winKills(1500)),
  R('bittermelon', 3, { endless: true, minWave: 35 }, ['永冻', 'Permafrost'], endlessWave(35)),
  // ---------- 豆芽学徒：潜力 ----------
  C('sprout', 1, 'charLevel:sprout', 20, ['破土', 'Sprouting'], reachLevel(20)),
  C('sprout', 2, 'charLevel:sprout', 40, ['参天', 'Towering'], reachLevel(40)),
  R(
    'sprout',
    3,
    { win: true, minDanger: 7, minLevel: 35 },
    ['大器晚成', 'Late Bloomer'],
    ['单局达到 35 级，并在危机等级 7 或以上通关', 'Win on Danger 7 or higher at level 35 or higher'],
  ),
  // ---------- 山葵爆破手：爆破 ----------
  C('wasabi', 1, 'charKills:wasabi', 2000, ['引信', 'Fuse'], totalKills(2000)),
  R('wasabi', 2, { win: true, minKills: 2500 }, ['冲鼻风暴', 'Nose Burner'], winKills(2500)),
  R('wasabi', 3, { win: true, minDanger: 10 }, ['末日引爆', 'Doomsday Blast'], winDanger(10)),
  // ---------- 1.4.0 新角色 ----------
  // 黄豆军师：技能召唤
  C('soybean', 1, 'charLevel:soybean', 15, ['排兵布阵', 'Formation'], reachLevel(15)),
  C('soybean', 2, 'charElite:soybean', 10, ['以多胜少', 'Strength in Numbers'], totalElites(10)),
  R('soybean', 3, { win: true, minDanger: 5 }, ['运筹帷幄', 'Master Strategist'], winDanger(5)),
  // 菠萝蜜卫士：反伤
  C('jackfruit', 1, 'charWave:jackfruit', 10, ['满身是刺', 'All Spikes'], reachWave(10)),
  C('jackfruit', 2, 'charKills:jackfruit', 3000, ['刺猬战术', 'Hedgehog Tactics'], totalKills(3000)),
  R('jackfruit', 3, { endless: true, minWave: 30 }, ['坚不可摧', 'Impregnable'], endlessWave(30)),
  // 石榴炮手：全弹幕
  C('pomegranate', 1, 'charKills:pomegranate', 1500, ['籽弹上膛', 'Locked and Loaded'], totalKills(1500)),
  R('pomegranate', 2, { win: true, minKills: 1500 }, ['弹幕风暴', 'Bullet Storm'], winKills(1500)),
  R('pomegranate', 3, { win: true, minDanger: 6 }, ['万籽齐发', 'Full Barrage'], winDanger(6)),
  // 芋头术士：零武器
  C('taro', 1, 'charWave:taro', 10, ['结界初成', 'First Ward'], reachWave(10)),
  C('taro', 2, 'charClear:taro:2', 1, ['芋香四溢', 'Taro Aroma'], clearChapter(2)),
  R(
    'taro',
    3,
    { win: true, minDanger: 5, maxWeapons: 1 },
    ['无招胜有招', 'The Empty Hand'],
    ['只持有 1 把武器在危机等级 5 或以上通关', 'Win on Danger 5 or higher holding only 1 weapon'],
  ),
  // 卷心菜老兵：不屈复活
  C('cabbage', 1, 'charWave:cabbage', 12, ['老兵不死', 'Old Soldiers Never Die'], reachWave(12)),
  R('cabbage', 2, { win: true, perfectWaves: 5 }, ['层层设防', 'Layered Defense'], winPerfect(5)),
  R('cabbage', 3, { endless: true, minWave: 40 }, ['百折不挠', 'Indomitable'], endlessWave(40)),
  // 黑莓女巫：诅咒腐蚀
  C('blackberry', 1, 'charLevel:blackberry', 15, ['熬制药水', 'Brewing'], reachLevel(15)),
  C('blackberry', 2, 'charClear:blackberry:3', 1, ['冰封诅咒', 'Frozen Hex'], clearChapter(3)),
  R('blackberry', 3, { win: true, minDanger: 7 }, ['大巫师', 'Archwitch'], winDanger(7)),
];

export const QUEST_MAP: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

/** 某角色的 3 个任务（按难度顺序） */
export const questsOf = (charId: string): QuestDef[] => QUESTS.filter((q) => q.charId === charId);

/** 局末判定 run 类任务；counter 类（由计数器判定）恒返回 false */
export function evalRunQuest(q: QuestDef, r: QuestRunResult): boolean {
  if (q.kind !== 'run' || !q.run) return false;
  if (r.charId !== q.charId) return false;
  const c = q.run;
  if (c.win && !r.win) return false;
  if (c.endless && !r.endless) return false;
  if (c.chapter !== undefined && r.chapterId !== c.chapter) return false;
  if (c.minWave !== undefined && r.wave < c.minWave) return false;
  if (c.minDanger !== undefined && r.danger < c.minDanger) return false;
  if (c.maxWeapons !== undefined && r.weapons > c.maxWeapons) return false;
  if (c.minKills !== undefined && r.kills < c.minKills) return false;
  if (c.minLevel !== undefined && r.level < c.minLevel) return false;
  if (c.perfectWaves !== undefined && r.perfectWaves < c.perfectWaves) return false;
  return true;
}

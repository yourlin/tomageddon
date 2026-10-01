// 玩家可见的版本变化（最新版本在最前）。完整改动见 git 提交记录。
// 每条 [中文, English]；highlight 是这个版本的重点变化，一句话说清。

export interface ChangeEntry {
  version: string;
  date: string;
  highlight: [string, string];
  items: [string, string][];
}

export const CHANGELOG: ChangeEntry[] = [
  {
    version: '1.2.0',
    date: '2026-10-01',
    highlight: ['全新天赋树与无尽模式上线，成就扩充到 847 项', 'New talent tree and Endless mode, plus 847 achievements'],
    items: [
      [
        '天赋树：6 个专精方向、81 个天赋，像地图一样从核心向外延展；完成里程碑成就获得天赋点，强化开局属性或获得特殊能力（闪避掷飞刀、施法回血、斩杀、复活……），随时免费重置',
        'Talent tree: 6 branches and 81 talents laid out like maps around a core; milestone achievements grant points to boost starting stats or unlock abilities (knives on dodge, healing on cast, executes, a revive…), with free resets any time',
      ],
      [
        '无尽模式：通关某章后可开启，不限波数，每 15 波一轮精英与 Boss，怪物越来越强，看你能坚持到第几波',
        'Endless mode: unlocked per chapter after clearing it — no wave limit, elites and a boss every 15 waves, ever-stronger monsters',
      ],
      [
        '成就扩充到 847 项：每种怪物、武器、道具系列、技能、状态、章节、挑战、无尽模式与每名角色都有成就；越难的成就奖励越多',
        '847 achievements covering every monster, weapon, item series, skill, status, chapter, challenge, Endless and each character — harder goals pay more',
      ],
      [
        '角色价格按新的成就点总量调整，首次通关第 1 章就能买下第一名新角色',
        'Character prices rescaled to the new point total — your first Chapter 1 clear buys your first new character',
      ],
      [
        '成就页新增分类、只看未完成与快速翻页；一次解锁很多成就时合并提示',
        'Achievements screen: more categories, an unfinished-only filter and quick paging; bursts of unlocks are grouped',
      ],
    ],
  },
  {
    version: '1.1.0',
    date: '2026-09-30',
    highlight: [
      '大招有了完整的技能动画，新增 50 种怪物与 32 把武器，经济与高阶武器掉率整体重做',
      'Full ultimate animations, 50 new monsters, 32 new weapons, and a reworked economy',
    ],
    items: [
      [
        '技能动画：释放大招时显示技能名横幅、旋转光芒与镜头冲击，冲击波、光柱、速度线、全屏落雷、召唤法阵等按技能形态区分',
        'Skill animations: casting now shows the skill name, rotating light rays and a camera punch, with a distinct effect per skill form — shockwaves, light pillars, speed lines, screen-wide lightning, summoning circles',
      ],
      [
        '新增 50 种小怪（共 77 种），每章 15 种，五章各有专属阵容',
        '50 new monsters (77 total), 15 per chapter with a distinct roster each',
      ],
      ['新增 32 把武器（共 50 把）：近战 17、远程 18、元素 15', '32 new weapons (50 total): 17 melee, 18 ranged, 15 elemental'],
      [
        '契合武器：多数角色有 3 把与天赋呼应的武器，使用时伤害 +20%，商店也更容易刷到',
        'Favored weapons: most characters have 3 weapons matching their talent for +20% damage, and they show up more often in the shop',
      ],
      [
        '伤害属性拆分为近战 / 远程 / 元素 / 光环四类，光环范围与射程分开，拾取距离改为固定像素',
        'Damage split into melee / ranged / elemental / aura; aura size is separate from range; pickup radius is now a flat distance',
      ],
      [
        '升级只提供当前武器涉及的流派伤害选项，不再被无用选项稀释',
        'Level-ups only offer damage options for the weapon classes you actually own',
      ],
      [
        '经济重做：第 1 波钱变多（开局买得起东西），中后期不再滚雪球；商店刷新次数默认 3 次，可用道具提高到 10 次，刷新价随波次与章节上涨',
        'Economy rework: more money on wave 1 so you can actually buy something, no more late-game snowballing; 3 rerolls per shop by default (items raise it to 10), and reroll price scales with wave and chapter',
      ],
      [
        '高阶武器掉率重新标定：T4 从第 7 波起逐步出现，后期章节概率更高',
        'High-tier weapon rates recalibrated: T4 appears from wave 7 onward and is more common in later chapters',
      ],
      [
        '关卡难度重新标定，第 2~5 章的生命与伤害倍率更平滑',
        'Chapter difficulty recalibrated with smoother HP and damage curves for chapters 2–5',
      ],
    ],
  },
  {
    version: '1.0.0',
    date: '2026-09-29',
    highlight: [
      '首个正式版本：5 章 × 15 波、33 名角色、成就解锁与武器词条打造',
      'First release: 5 chapters × 15 waves, 33 characters, achievement unlocks and weapon forging',
    ],
    items: [
      ['5 个章节、每章 15 波，第 5 / 10 波精英、第 15 波 Boss', '5 chapters of 15 waves each, elites on waves 5 and 10, a boss on wave 15'],
      [
        '33 名角色，各有天赋、初始武器与主动技能；技能支持自动释放与手动切换',
        '33 characters with unique talents, starting weapons and ultimates; auto-cast with a manual toggle',
      ],
      ['136 项成就与分级奖章，成就点用于购买角色', '136 achievements with tiered medals; points buy characters'],
      ['T3 / T4 武器随机词条，可洗练；T4 可打造升级到 +10', 'Random affixes on T3/T4 weapons with rerolling; T4 can be forged up to +10'],
      ['暂停可保存进度，下次从当波继续', 'Save from the pause menu and resume at the same wave'],
      ['手机全屏与横屏适配，结算可生成分享海报', 'Mobile fullscreen and landscape support; end-of-run share poster'],
      ['全部美术与音乐程序生成', 'All art and music are procedurally generated'],
    ],
  },
];

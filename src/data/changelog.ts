// 玩家可见的版本变化（最新版本在最前）。完整改动见 git 提交记录。
// 每条 [中文, English]；highlight 是这个版本的重点变化，一句话说清。

export interface ChangeEntry {
  version: string;
  date: string;
  highlight: [string, string];
  items: [string, string][];
  /** M4：老玩家首次进入新版本时主菜单弹出的「新功能」卡片 */
  news?: { icon: string; title: [string, string]; desc: [string, string] }[];
}

export const CHANGELOG: ChangeEntry[] = [
  {
    version: '1.5.2',
    date: '2026-10-08',
    highlight: [
      '玩法循序渐进：解锁前不再露出，主菜单提示下一个解锁，开放时弹卡片；选关改为 7 个章节缩略图',
      'Features unfold step by step: hidden until unlocked, the menu shows your next unlock and a card pops when one opens; chapter select now shows all 7 chapters as thumbnails',
    ],
    items: [
      [
        '无尽、危机、每日挑战、金番茄、皮肤、天赋树、大师天赋在解锁前不显示；危机规则只露出下一级的「？？？」',
        'Endless, Danger, Daily challenges, Golden Tomatoes, skins, the talent tree and Master talents stay hidden until unlocked; Danger rules only tease the next level as "???"',
      ],
      [
        '主菜单显示「下一个解锁」：做什么、开放什么；新玩法开放时弹出说明卡片，可直接跳过去看看',
        'The main menu shows your next unlock — what to do and what opens; a card pops up when a feature opens, with a shortcut to it',
      ],
      [
        '结算页提示离下一个玩法还差什么，以及离解锁最近的角色和进度',
        'The results screen tells you what is left for the next feature and the closest character unlock',
      ],
      [
        '选关改为 7 个章节缩略图直接点选，未解锁的为灰色，隐藏章节显示「？」',
        'Chapter select shows all 7 chapters as thumbnails — locked ones in gray, the hidden chapter as "?"',
      ],
    ],
  },
  {
    version: '1.5.1',
    date: '2026-10-08',
    highlight: [
      '商店卡片按钮与边框重叠修复，超武相关文字更新',
      'Fixed shop card buttons overlapping the frame; updated super weapon wording',
    ],
    items: [
      [
        '商店商品卡底部的购买 / 锁定按钮不再压到卡片边框（触屏放大时尤其明显）',
        'Shop card buy / lock buttons no longer overlap the card frame (most visible with the larger touch layout)',
      ],
      [
        '商店道具卡、图鉴与新手提示里的「进化」说法改为按配方合成超武',
        'Shop item cards, the collection and tutorial tips now describe crafting super weapons by recipe instead of "evolving"',
      ],
    ],
  },
  {
    version: '1.5.0',
    date: '2026-10-08',
    highlight: [
      '「合成之路」：武器按标签契合角色，新增 60 把融合武器、合成表与仓库，T3 → T4 → 超武一路合成；画面高清化，每名角色 4 套皮肤',
      '"The Crafting Road": weapons match characters by tag, 60 new fusion weapons, a crafting table and storage — craft T3 → T4 → super weapons; sharper visuals and 4 skins per character',
    ],
    items: [
      [
        '角色契合改为按武器标签：带契合标签的任意武器都算契合武器（伤害 +10% 并触发角色天赋）',
        'Character synergy now works by weapon tag: any weapon with a synergy tag counts (+10% damage and triggers the talent)',
      ],
      [
        '新增 60 把融合武器（共 199 把）：每把 T3 至少有 2 条配方升到 T4，每把 T4 的配方唯一；超武改为 2 把指定 T4 合成',
        '60 new fusion weapons (199 total): every T3 has at least 2 recipes to T4, every T4 has a unique recipe; super weapons are crafted from two specific T4s',
      ],
      [
        '配方要求指定道具：T4 要指定的史诗道具，超武要催化道具 + 1 件指定传说道具；快凑齐时商店会补货缺的道具',
        'Recipes need specific items: T4s need specific Epic items, super weapons the catalyst + 1 specific Legendary; the shop restocks missing items when you are close',
      ],
      [
        '合成表：分类筛选、推荐视图（契合武器优先）、横向升级树，点自己的武器就能看到可走的配方和缺的材料',
        'Crafting table: category filters, a recommended view (synergy first) and a horizontal upgrade tree; tap a weapon to see its recipes and what is missing',
      ],
      [
        '仓库 6 格：武器栏满时买的武器自动进仓库，可对调、出售，也能当合成材料',
        '6-slot storage: weapons bought with a full bar go to storage; swap, sell or use them as recipe materials',
      ],
      [
        '商店不再卖 T4；买光商店算一次刷新；价格改用番茄籽图标；属性两列带图标显示',
        'The shop never sells T4s; buying it out counts as a reroll; prices use the seed icon; stats show in two columns with icons',
      ],
      [
        '高清渲染：按屏幕像素密度渲染，桌面版和高分屏不再发糊（设置里可关）；桌面版默认全屏',
        'HiDPI rendering: sharp on high-density screens and the desktop build (toggle in Settings); the desktop build starts fullscreen',
      ],
      [
        '移动端：按钮触控区加大，商店、武器弹窗、合成表整体放大',
        'Mobile: larger touch targets; the shop, weapon popup and crafting table are scaled up',
      ],
      [
        '暂停界面重做：左边角色与装备武器（悬停或点按看属性），右边两列属性',
        'Redesigned pause screen: character and equipped weapons on the left (hover or tap for stats), two-column stats on the right',
      ],
      [
        '角色的「被动特性」和「属性修正」合并为「属性与特性」，数值按实际生效自动生成',
        'Character "traits" and "stat modifiers" merged into one "Stats & traits" list generated from the real values',
      ],
      [
        '角色解锁节奏调整：一局一般解锁 0–2 名，随进度慢慢解锁；解锁提示与结算页展示角色形象',
        'Character unlocks are paced out: usually 0–2 per run as you progress; unlock toasts and the results screen show the character',
      ],
      [
        '每名角色 4 套皮肤（金番茄 120 / 160 / 200 / 250，第 1 套熟练度 10 级免费），纯外观',
        '4 skins per character (120 / 160 / 200 / 250 Golden Tomatoes; the first is free at Mastery 10), cosmetic only',
      ],
      [
        '新增 81 项成就：融合武器、合成表、挑战规则修饰、天赋树与大师天赋；「全副神兵」在无尽模式撑过第 15 波后也算',
        '81 new achievements: fusion weapons, the crafting table, challenge modifiers, the talent tree and Master talents; "Fully Legendary" now also counts in Endless after wave 15',
      ],
      [
        '称号：分类、稀有度、搜索与带光效的称号徽章；分享战绩海报加入更多数据和本局构筑',
        'Titles: categories, rarity, search and glowing title badges; the share poster shows more stats and your build',
      ],
      [
        '负面属性显示为红色；受伤 / 回血数字更大、停留更久；持续伤害按状态分色跳字（灼烧红、中毒绿……）；修复点「合成」可能误卖武器的问题',
        'Negative stats show in red; damage / heal numbers are bigger and last longer; damage-over-time numbers are colored by status (Burn red, Poison green…); fixed tapping "Combine" sometimes selling the weapon',
      ],
    ],
    news: [
      {
        icon: '🧪',
        title: ['合成之路', 'The Crafting Road'],
        desc: ['商店里打开合成表，T3 → T4 → 超武，按配方一路合成', 'Open the crafting table in the shop and craft T3 → T4 → super weapons'],
      },
      {
        icon: '🏷️',
        title: ['标签契合', 'Tag synergy'],
        desc: ['带契合标签的武器都算契合武器，选角界面可查看', 'Any weapon with a synergy tag counts — check it on character select'],
      },
      {
        icon: '🎨',
        title: ['4 套皮肤', '4 skins each'],
        desc: [
          '每名角色 4 套皮肤，在选角界面用金番茄购买',
          'Every character has 4 skins — buy them on character select with Golden Tomatoes',
        ],
      },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-10-05',
    highlight: [
      '「通关之后」：番茄危机 20 级难度阶梯、遗物、角色任务与觉醒、第 6/7 章与真结局，通关后还有很长的路可以走',
      '"After the Credits": a 20-level Tomato Danger ladder, relics, character quests and Awakenings, chapters 6/7 and a true ending — plenty to chase after your first clear',
    ],
    items: [
      [
        '番茄危机 0–20 级：通关一级解锁下一级，每级叠加一条规则，奖励随等级提高',
        'Tomato Danger 0–20: each clear unlocks the next level, each level stacks one more rule, and rewards scale up',
      ],
      [
        '新增 45 件遗物与 8 个套装：精英、无尽里程碑与神秘商人提供，改变规则而不只是加属性',
        '45 new relics in 8 sets from elites, Endless milestones and the Mysterious Merchant — they bend the rules, not just stats',
      ],
      [
        '无尽模式深化：每 10 波里程碑奖励、超级双 Boss、变异词缀、一次复活',
        'Deeper Endless: milestone rewards every 10 waves, double-boss waves, mutations and one revive',
      ],
      [
        '每名角色 3 个专属任务、觉醒被动、1–10 级熟练度与一套皮肤；新增 6 名角色',
        'Every character gets 3 quests, an Awakening, Mastery 1–10 and a skin; 6 new characters',
      ],
      [
        '角色改为达成指定成就自动解锁，不再花成就点购买',
        'Characters now unlock automatically from specific achievements instead of being bought with points',
      ],
      [
        '第 6 章「腐烂温室」、隐藏第 7 章「腐烂菜园」与真结局 Boss',
        'Chapter 6 "Rotting Greenhouse", hidden Chapter 7 "Rot Garden" and a true final boss',
      ],
      ['12 把新武器、8 组进化、30 个新道具与 23 条道具组合', '12 new weapons, 8 evolutions, 30 new items and 23 item combos'],
      [
        '事件波、危险路线、神秘商人、局内小任务、天气与 5 种新地形机关；这些机制从第 2 章起按章节逐步出现',
        'Event waves, risky routes, the Mysterious Merchant, in-wave mini-quests, weather and 5 new terrain hazards — introduced chapter by chapter from chapter 2',
      ],
      [
        '第 5 章起关卡变长：第 5 章 20 波，之后每章 +5 波（最多 50 波），每 5 波一只精英',
        'Longer chapters from chapter 5: 20 waves, then +5 per chapter (up to 50), with an elite every 5 waves',
      ],
      [
        '商店武器品质、道具稀有度与升级属性等级改为只按幸运分层：幸运 5 起出 T2，15 起出 T3，30 起才可能出 T4',
        'Shop weapon tiers, item rarity and upgrade ranks are now tiered by Luck only: T2 from 5 Luck, T3 from 15, T4 only from 30',
      ],
      [
        '每种传说道具默认最多持有 1 件；战斗中暂停键旁新增技能「自动 / 手动」切换按钮',
        'Each legendary item can be held once by default; a skill AUTO / MANUAL toggle now sits next to the pause button',
      ],
      [
        '每日 / 每周挑战连续奖励、种子分享、自定义挑战与练习模式',
        'Daily / weekly streak rewards, seed sharing, custom challenges and practice mode',
      ],
      [
        '天赋大师层、收藏度总览、称号、76 个新成就、构筑分享码与局后 DPS 曲线',
        'Talent master tiers, a collection overview, titles, 76 new achievements, build codes and a post-run DPS chart',
      ],
      ['技能演出全面重做：同类技能各有不同的动画与效果', 'Skill visuals reworked: similar skills now look and play differently'],
      [
        '光环武器按名字各有专属特效：若隐若现的光晕、环绕物与粒子，不再只是一个圈',
        'Aura weapons get themed effects by name — shimmering glows, orbiting props and particles instead of a plain ring',
      ],
      [
        '横扫超武各有专属招式：擎天擀面柱 360° 回旋、屠龙菜刀交叉双斩、铸铁壁垒锅盾击拍碎子弹、西瓜震地锤砸地余震',
        'Sweep super weapons get signature moves: Titan Pin full spin, Dragon Cleaver X-slash, Iron Bastion Pan shield bash that shatters bullets, Melon Quake aftershocks',
      ],
      [
        '回旋镖改为曲线飞行（泪滴、甩弯、蛇形、螺旋），八角风暴远端连转三圈且每圈可再命中',
        'Boomerangs now fly curved paths (teardrop, hook, serpentine, spiral); Anise Storm loops three times at range and can hit on every loop',
      ],
      [
        '连锁闪电超武追加天降落雷；地雷按名字有专属造型与爆炸颜色',
        'Chain lightning super weapons call down extra strikes; mines have their own look and explosion color',
      ],
      [
        '重置存档改为三步确认（倒数、换位、长按 3 秒），防止误删',
        'Resetting your save now takes three confirmations (countdown, moved button, 3-second hold) to prevent accidents',
      ],
      [
        '选角详情拆成基本 / 成长两页；修复成就页总成就点显示 NaN',
        'Character details split into Basics / Progress pages; fixed the achievement total showing NaN',
      ],
      [
        '修复荆棘词缀反伤可能秒杀高伤害近战构筑的问题（现在有单次与每秒上限）',
        'Fixed Thorny reflection being able to one-shot high-damage melee builds (now capped per hit and per second)',
      ],
      [
        '设置新增伤害数字密度、震动强度、粒子数量、摇杆与按钮大小、手柄支持，以及存档导入导出',
        'Settings: damage number density, shake strength, particle amount, joystick and button size, gamepad support, and save import/export',
      ],
    ],
    news: [
      {
        icon: '🔥',
        title: ['番茄危机', 'Tomato Danger'],
        desc: [
          '通关后在选角界面选危机等级，越高越难、奖励越多',
          'Pick a Danger level on character select after a clear — harder, with bigger rewards',
        ],
      },
      {
        icon: '🏺',
        title: ['遗物', 'Relics'],
        desc: ['击败章节精英后三选一，改变一局的玩法', 'Beat a chapter elite to pick one of three run-changing relics'],
      },
      {
        icon: '📜',
        title: ['角色任务与觉醒', 'Quests & Awakenings'],
        desc: ['每名角色 3 个任务，完成后解锁觉醒被动', '3 quests per character unlock an Awakening passive'],
      },
      {
        icon: '🔓',
        title: ['成就解锁角色', 'Achievement unlocks'],
        desc: ['角色改为达成指定成就后自动解锁', 'Characters now unlock automatically from specific achievements'],
      },
      {
        icon: '🥀',
        title: ['第 6/7 章与真结局', 'Chapters 6/7 & true ending'],
        desc: ['新章节与隐藏章节，等你来发现', 'A new chapter and a hidden one are waiting'],
      },
      {
        icon: '♾️',
        title: ['无尽与每日挑战', 'Endless & dailies'],
        desc: ['超级 Boss、变异、连续挑战奖励与种子分享', 'Super bosses, mutations, streak rewards and seed sharing'],
      },
      {
        icon: '📏',
        title: ['更长的关卡', 'Longer chapters'],
        desc: [
          '第 5 章起每章 20 波并逐章 +5 波；新机制随章节逐步登场',
          'From chapter 5: 20 waves, +5 per chapter; new mechanics arrive chapter by chapter',
        ],
      },
      {
        icon: '🍀',
        title: ['幸运分层', 'Luck tiers'],
        desc: [
          '幸运决定能出什么：5 起 T2、15 起 T3、30 起才有 T4 与传说',
          'Luck decides what can drop: T2 from 5, T3 from 15, T4 and legendaries only from 30',
        ],
      },
    ],
  },
  {
    version: '1.3.2',
    date: '2026-10-03',
    highlight: [
      '修正吸血与回复相关描述，使其与实际机制一致',
      'Corrected life steal and healing descriptions to match how they actually work',
    ],
    items: [
      [
        '「吸血」更名为「吸血概率」：每次命中按该概率回复 1 生命，属性面板显示每秒最多回复 5 点',
        '"Life Steal" is now "Life Steal Chance": each hit has that chance to heal 1 HP, and the stat panel shows the 5 HP/s maximum',
      ],
      [
        '修正西瓜翻滚、天使祝福、烤红薯盛宴的回复量描述（实际为 4.5% / 9% / 9% 最大生命），并说明吸取回复的额外回血',
        'Fixed the heal amounts shown for Melon Roll, Angel’s Blessing and Roast Yam Feast (actually 4.5% / 9% / 9% Max HP) and documented the extra drain healing',
      ],
      ['再生与嗜血状态描述写明每层效果', 'Regen and Bloodlust status descriptions now state their per-stack effect'],
    ],
  },
  {
    version: '1.3.1',
    date: '2026-10-03',
    highlight: [
      '全面调整成长与道具平衡，修复继续游戏后的商店问题，并为远程武器加入专属弹丸',
      'Rebalanced progression and items, fixed the shop after continuing a run, and added unique projectiles for ranged weapons',
    ],
    items: [
      [
        '统一并参数化敌人、章节与经济成长公式，使难度曲线更连续稳定',
        'Unified and parameterized enemy, chapter and economy growth formulas for a smoother difficulty curve',
      ],
      [
        '重做吸血与生命再生机制，并调整爆炸范围、近战武器类型和地面效果伤害',
        'Reworked life steal and HP regeneration, and adjusted explosion radius, melee weapon typing and ground-effect damage',
      ],
      [
        '限制传说道具获取，并为普通与稀有道具补充合理代价，降低后期属性膨胀',
        'Limited legendary item availability and added trade-offs to common and rare items to curb late-game stat inflation',
      ],
      [
        '每把远程武器现在使用专属弹丸贴图，地面效果伤害新增清晰飘字',
        'Every ranged weapon now uses a unique projectile visual, with clearer damage numbers for ground effects',
      ],
      [
        '修复读取存档继续游戏后商店为空且无法刷新的问题',
        'Fixed the shop being empty and impossible to refresh after continuing a saved run',
      ],
    ],
  },
  {
    version: '1.3.0',
    date: '2026-10-01',
    highlight: [
      '武器进化、每日 / 每周挑战、局后数据与战绩，新手也有引导了',
      'Weapon evolution, daily / weekly challenges, run stats and history — plus tips for new players',
    ],
    items: [
      [
        '武器进化：T4 武器 + 指定道具，在商店进化为 12 把超武之一，保留词条与打造等级；商店会提示进化配方',
        'Weapon evolution: a T4 weapon plus a specific item evolves in the shop into one of 12 super weapons, keeping affixes and forge level; the shop shows recipes',
      ],
      [
        '每日 / 每周挑战：每天、每周一套固定的角色、章节、规则和商店，15 种规则修饰；记录个人最佳和连续挑战天数',
        'Daily / weekly challenges: a fixed character, chapter, ruleset and shop every day and every week, 15 rule modifiers; personal bests and streaks are tracked',
      ],
      [
        '局后数据：伤害来源排行（每把武器、技能、持续伤害……）与每波收入；主菜单新增「战绩」，保留最近 30 局',
        'Run stats: damage by source (each weapon, skill, damage over time…) and seeds per wave; new "History" on the main menu keeps your last 30 runs',
      ],
      [
        '新手引导：第一次遇到移动、商店、合成、词条、进化、精英、Boss、天赋等系统时给出简短提示，可在设置里重新显示',
        'Tutorial tips the first time you meet movement, the shop, combining, affixes, evolution, elites, bosses, talents and more — re-enable them in Settings',
      ],
      [
        '天赋平衡：影舞无敌缩短为 0.35 秒，不屈改为每局一次以 25% 生命站起，战意最多 3 层，斩杀线降到 8%，部分生命 / 攻速 / 拾取天赋下调',
        'Talent balance: Shadow Dance invulnerability cut to 0.35s, Unyielding now gets you up once per run at 25% HP, Battle Lust caps at 3 stacks, Execution at 8%, and some HP / attack speed / pickup talents reduced',
      ],
      [
        'Boss 战音乐重做：168 BPM 的激烈曲目，Boss 登场时切入、倒下后恢复章节音乐',
        'New boss music: an intense 168 BPM track that kicks in when the boss appears and hands back to the chapter music once it falls',
      ],
      [
        '回复平衡：番茄掉率大幅降低且每波有上限，按拾取范围吸取；吸血每 0.25 秒最多触发一次、群体伤害触发率 ×0.4、上限 30%；回血技能回复量减半、冷却变长；生命再生明确为每 5 秒',
        'Healing balance: far fewer fruit drops with a per-wave cap, collected by pickup range; life steal triggers at most every 0.25s, at 40% rate for area damage, capped at 30%; healing skills heal about half as much with longer cooldowns; HP Regen is now clearly per 5 seconds',
      ],
      ['属性面板显示闪避（60%）与吸血（30%）上限', 'The stat panel shows the Dodge (60%) and Life Steal (30%) caps'],
      ['新增 18 项成就（武器进化、挑战）', '18 new achievements (evolution, challenges)'],
    ],
  },
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

// 系列化道具生成：50 个主题系列 × 10 件 = 500 件。
// 数值采用“强度预算”：每个稀有度有固定预算，按属性单价换算，保证同稀有度强度一致。
import type { ItemDef, ItemSpecial } from './items';
import type { StatKey, StatMods } from './stats';
import type { StatusApply } from './statuses';

/** 每点属性的预算单价（由手工道具校准） */
export const STAT_COST: Partial<Record<StatKey, number>> = {
  maxHp: 3,
  regen: 4.5,
  lifeSteal: 5.5,
  damage: 1.8,
  meleePct: 1.4,
  rangedPct: 1.4,
  elementalPct: 1.4,
  auraPct: 1.3,
  auraSize: 1.4,
  explodeSize: 0.8,
  melee: 4.5,
  ranged: 4.5,
  elemental: 4.5,
  attackSpeed: 2,
  crit: 2.2,
  range: 0.3,
  armor: 4.5,
  dodge: 3,
  speed: 3.6,
  luck: 1.1,
  harvest: 1.5,
  pickup: 0.3,
  xpGain: 0.9,
  skillCd: 1.5,
  skillDmg: 0.9,
  skillRange: 1.3,
  skillDur: 0.8,
};
/** 各稀有度预算与价格系数 */
export const RARITY_BUDGET = [10, 22, 40, 75];
const PRICE_MULT = [1.2, 1.5, 1.75, 1.6];

type Arch =
  | 'poison'
  | 'burn'
  | 'frost'
  | 'freeze'
  | 'bleed'
  | 'weaken'
  | 'vuln'
  | 'mark'
  | 'stun'
  | 'rageKill'
  | 'hasteKill'
  | 'shieldWave'
  | 'regenHurt'
  | 'fortifyHurt'
  | 'thorns'
  | 'confuseHurt'
  | 'explode'
  | 'lightning'
  | 'seeds'
  | 'killHeal'
  | 'critDmg'
  | 'statusDmg'
  | 'fruit'
  | 'cleanse'
  | 'auraWeaken'
  | 'auraSlow'
  | 'periodicHaste'
  | 'focusHit'
  | 'luckyWave'
  | 'curseHit'
  | 'armorBreak'
  | 'vampKill';

const A = (id: StatusApply['id'], dur: number, chance: number, stacks = 1): StatusApply => ({
  id,
  dur,
  chance: Math.round(Math.min(100, chance)),
  stacks,
});

/** 预算 b → 特效 */
function makeSpecial(arch: Arch, b: number): ItemSpecial {
  switch (arch) {
    case 'poison':
      return { onHit: [A('poison', 4, Math.min(45, b * 1.5))] };
    case 'burn':
      return { onHit: [A('burn', 3, Math.min(40, b * 1.2))] };
    case 'frost':
      return { onHit: [A('slow', 2, Math.min(50, b * 2))] };
    case 'freeze':
      return { onHit: [A('freeze', 1, Math.min(10, b * 0.3))] };
    case 'bleed':
      return { onHit: [A('bleed', 3, Math.min(40, b * 1.2))] };
    case 'weaken':
      return { onHit: [A('weaken', 3, Math.min(35, b * 1.2))] };
    case 'vuln':
      return { onHit: [A('vulnerable', 3, Math.min(30, b * 1))] };
    case 'mark':
      return { onHit: [A('mark', 4, Math.min(20, b * 0.7))] };
    case 'stun':
      return { onHit: [A('stun', 0.5, Math.min(12, b * 0.4))] };
    case 'curseHit':
      return { onHit: [A('curse', 4, Math.min(25, b * 0.8))] };
    case 'armorBreak':
      return { onHit: [A('armorBreak', 4, Math.min(40, b * 1.3))] };
    case 'rageKill':
      return { onKillSelf: [A('rage', 4, Math.min(100, b * 2.5))] };
    case 'hasteKill':
      return { onKillSelf: [A('haste', 2, Math.min(60, b * 2))] };
    case 'vampKill':
      return { onKillSelf: [A('vampiric', 3, Math.min(50, b * 1.5))] };
    case 'shieldWave':
      return { waveStartSelf: [{ id: 'shield', dur: 999, value: Math.round(b * 0.9) }] };
    case 'luckyWave':
      return { waveStartSelf: [{ id: 'lucky', dur: 20, stacks: Math.max(1, Math.round(b / 12)) }] };
    case 'regenHurt':
      return { onHurtSelf: [{ id: 'regen', dur: 4, stacks: Math.max(1, Math.round(b / 10)) }] };
    case 'fortifyHurt':
      return { onHurtSelf: [{ id: 'fortify', dur: 4, stacks: Math.max(1, Math.round(b / 10)) }] };
    case 'confuseHurt':
      return { onHurtEnemy: [A('confuse', 3, Math.min(60, b * 2))] };
    case 'thorns':
      return { thorns: Math.round(b * 0.8) };
    case 'explode':
      return { explodeOnKill: { chance: Math.round(Math.min(30, b * 0.6)), dmg: Math.round(10 + b * 0.4) } };
    case 'lightning':
      return { lightningOnHit: Math.round(Math.min(20, b * 0.5)) };
    case 'seeds':
      return { doubleSeed: Math.round(Math.min(25, b * 0.8)) };
    case 'killHeal':
      return { killHeal: Math.max(8, Math.round(60 - b)) };
    case 'critDmg':
      return { critDmg: Math.round(b * 1.2) };
    case 'statusDmg':
      return { statusDmg: Math.round(b * 2) };
    case 'fruit':
      return { fruitHeal: Math.round(b * 4) };
    case 'cleanse':
      return { cleanseEvery: Math.max(5, Math.round(25 - b / 2)) };
    case 'auraWeaken':
      return { aura: { radius: 110 + Math.round(b), every: 1.5, status: [{ id: 'weaken', dur: 2, stacks: 1 }] } };
    case 'auraSlow':
      return { aura: { radius: 110 + Math.round(b), every: 1, status: [{ id: 'slow', dur: 1.5, stacks: 1 }] } };
    case 'periodicHaste':
      return { periodicSelf: { every: Math.max(6, Math.round(20 - b / 3)), status: [{ id: 'haste', dur: 3, stacks: 2 }] } };
    case 'focusHit':
      return { onHitSelf: [A('focus', 3, Math.min(25, b * 0.8))] };
  }
}

type Series = [
  id: string,
  name: string,
  stats: StatKey[],
  shape: string,
  color: number,
  color2: number,
  arch: Arch | null,
  drawback: StatKey,
  names: string,
];

// 系列：id, 名称, 主/副属性, 图标形状, 主色, 辅色, 特效原型, 代价属性, 10 个名字（普通×4 稀有×3 史诗×2 传说×1）
const SERIES: Series[] = [
  [
    'tomatoes',
    '番茄制品',
    ['maxHp', 'regen'],
    'fruit',
    0xe63946,
    0x2d6a4f,
    'fruit',
    'speed',
    '番茄干,番茄泥,樱桃番茄,番茄种子,浓缩番茄汁,番茄炖菜,番茄罐头,番茄酱大王瓶,传家番茄,番茄之心',
  ],
  [
    'spices',
    '香料',
    ['elementalPct', 'crit'],
    'jar',
    0xbc6c25,
    0xffd166,
    'burn',
    'maxHp',
    '黑胡椒粒,花椒,八角,桂皮,孜然粉,咖喱块,十三香,辣椒精,魔鬼椒粉,龙息香料',
  ],
  [
    'sauces',
    '酱料',
    ['lifeSteal', 'regen'],
    'bottle',
    0x9d0208,
    0xffd166,
    'vampKill',
    'armor',
    '酱油,醋,蚝油,甜面酱,豆瓣酱,沙茶酱,XO酱,秘制烤肉酱,血色辣酱,永恒母酱',
  ],
  [
    'knives',
    '刀具',
    ['meleePct', 'crit'],
    'blade',
    0xadb5bd,
    0x6b4226,
    'bleed',
    'rangedPct',
    '水果刀,削皮刀,面包刀,剔骨刀,片鱼刀,斩骨刀,柳刃刀,大马士革刀,屠龙菜刀,名匠之刃',
  ],
  [
    'pots',
    '锅具',
    ['armor', 'maxHp'],
    'bowl',
    0x343a40,
    0xadb5bd,
    'fortifyHurt',
    'speed',
    '奶锅,汤锅,蒸笼,砂锅,高压锅,珐琅锅,铸铁锅,千层锅盾,不锈钢堡垒,老祖宗铁锅',
  ],
  [
    'utensils',
    '餐具',
    ['melee', 'attackSpeed'],
    'blade',
    0xdee2e6,
    0xe9c46a,
    'rageKill',
    'armor',
    '筷子,汤匙,叉子,餐刀,银叉,金汤匙,象牙筷,双龙筷,神速筷,宴会银器',
  ],
  [
    'guns',
    '玩具枪',
    ['ranged', 'range'],
    'gear',
    0xff8c42,
    0x2ec4b6,
    'mark',
    'melee',
    '水枪,橡皮筋枪,泡泡枪,软弹枪,弹珠枪,气动枪,激光笔,精准瞄具,狙击水枪,豪华弹射器',
  ],
  [
    'ammo',
    '弹药',
    ['rangedPct', 'attackSpeed'],
    'can',
    0xb08968,
    0xffd166,
    'armorBreak',
    'dodge',
    '豆子弹,玉米粒弹,石子,弹珠,钢珠,穿甲豆,爆裂弹,追踪弹,钨芯弹,星辰弹药',
  ],
  [
    'fire',
    '火焰',
    ['elemental', 'elementalPct'],
    'orb',
    0xff7b00,
    0xffd166,
    'burn',
    'regen',
    '火柴,蜡烛,酒精灯,打火石,火焰喷嘴,岩浆石,凤凰炭,烈焰核心,太阳碎片,不灭之火',
  ],
  [
    'ice',
    '冰品',
    ['elemental', 'armor'],
    'gem',
    0x90e0ef,
    0xffffff,
    'frost',
    'speed',
    '冰块,冰棍,雪糕,刨冰,冰淇淋,干冰,冰川水,永冻晶石,极寒之心,冰雪女王冠',
  ],
  [
    'thunder',
    '雷电',
    ['elemental', 'attackSpeed'],
    'orb',
    0xffd60a,
    0x4361ee,
    'lightning',
    'armor',
    '纽扣电池,干电池,充电宝,静电毛衣,避雷针,电容器,闪电瓶,雷神电池,暴风雷核,宙斯之火花',
  ],
  [
    'poisons',
    '毒物',
    ['elemental', 'luck'],
    'potion',
    0x70e000,
    0x3c096c,
    'poison',
    'maxHp',
    '发霉面包,变质牛奶,毒蘑菇片,臭豆腐,蛇毒瓶,蝎尾,剧毒孢子,瘟疫烧瓶,腐化之核,万毒之王',
  ],
  [
    'herbs',
    '草药',
    ['regen', 'maxHp'],
    'leaf',
    0x52b788,
    0xd8f3dc,
    'regenHurt',
    'speed',
    '薄荷叶,甘草,枸杞,金银花,人参须,灵芝片,雪莲,千年人参,仙草,生命之树叶',
  ],
  [
    'teas',
    '茶饮',
    ['attackSpeed', 'skillCd'],
    'cup',
    0x95d5b2,
    0x6b4226,
    'periodicHaste',
    'maxHp',
    '绿茶,红茶,奶茶,乌龙茶,抹茶,普洱饼,金骏眉,大红袍,仙人茶,永恒茶壶',
  ],
  [
    'coffee',
    '咖啡',
    ['attackSpeed', 'speed'],
    'cup',
    0x6f4518,
    0xf1e3d3,
    'hasteKill',
    'regen',
    '速溶咖啡,拿铁,美式咖啡,卡布奇诺,浓缩咖啡,冷萃咖啡,猫屎咖啡,三倍浓缩,咖啡因结晶,时间停止咖啡',
  ],
  [
    'sweets',
    '甜点',
    ['maxHp', 'luck'],
    'candy',
    0xffd6a5,
    0xff8fab,
    'shieldWave',
    'attackSpeed',
    '棒棒糖,软糖,棉花糖,马卡龙,甜甜圈,舒芙蕾,千层蛋糕,彩虹蛋糕,皇家布丁,梦幻甜点塔',
  ],
  [
    'breads',
    '面包',
    ['maxHp', 'armor'],
    'bread',
    0xdda15e,
    0x6b4226,
    'shieldWave',
    'attackSpeed',
    '吐司,馒头,法棍,牛角包,贝果,菠萝包,全麦面包,石炉面包,黄金面包,面包之神',
  ],
  [
    'cheese',
    '奶酪',
    ['armor', 'regen'],
    'cheese',
    0xffd166,
    0xe09f3e,
    'fortifyHurt',
    'speed',
    '奶酪片,奶酪条,马苏里拉,切达奶酪,蓝纹奶酪,帕玛森,百年陈酪,奶酪堡垒,至尊奶酪轮,奶酪女神',
  ],
  [
    'fish',
    '海鲜',
    ['luck', 'harvest'],
    'fish',
    0x4895ef,
    0xffffff,
    'seeds',
    'armor',
    '小鱼干,虾皮,海带,扇贝,生蚝,龙虾钳,帝王蟹,金枪鱼大腹,深海珍珠,海王之鳞',
  ],
  [
    'eggs',
    '蛋类',
    ['maxHp', 'xpGain'],
    'egg',
    0xfff3b0,
    0xffd166,
    'regenHurt',
    'armor',
    '鸡蛋,鹌鹑蛋,鸭蛋,咸蛋,皮蛋,溏心蛋,鸵鸟蛋,金蛋,龙蛋,混沌之卵',
  ],
  [
    'farm',
    '农具',
    ['harvest', 'maxHp'],
    'blade',
    0x6a994e,
    0xadb5bd,
    'seeds',
    'speed',
    '小铲子,水壶,草帽,锄头,镰刀,稻草人,拖拉机钥匙,丰收号角,大地之犁,丰饶女神镰',
  ],
  [
    'seedsS',
    '种子',
    ['harvest', 'luck'],
    'seed',
    0xe9c46a,
    0x6b4226,
    'seeds',
    'pickup',
    '葵花籽,南瓜子,西瓜子,莲子,松子,银杏果,魔豆,星光种子,世界树种子,创世之种',
  ],
  [
    'bugs',
    '昆虫标本',
    ['lifeSteal', 'crit'],
    'bug',
    0x6b4226,
    0xffd166,
    'vampKill',
    'maxHp',
    '蚂蚁标本,瓢虫标本,蝴蝶标本,甲虫标本,螳螂标本,蜂后标本,蝎子标本,黄金圣甲虫,吸血蝙蝠,虫王琥珀',
  ],
  [
    'shoes',
    '鞋子',
    ['speed', 'dodge'],
    'shoe',
    0xe63946,
    0xffffff,
    'hasteKill',
    'armor',
    '拖鞋,凉鞋,布鞋,帆布鞋,跑步鞋,溜冰鞋,弹簧鞋,疾风靴,火箭靴,赫尔墨斯之翼',
  ],
  [
    'hats',
    '帽子',
    ['armor', 'dodge'],
    'hat',
    0x264653,
    0xe9c46a,
    'confuseHurt',
    'speed',
    '毛线帽,棒球帽,渔夫帽,贝雷帽,礼帽,魔术帽,将军帽,隐身斗笠,魔王之冠,百变神帽',
  ],
  [
    'gloves',
    '手套',
    ['melee', 'armor'],
    'shield',
    0xf4a261,
    0xe76f51,
    'stun',
    'ranged',
    '洗碗手套,隔热手套,棉手套,皮手套,拳击手套,铁手套,烈焰拳套,巨人护手,雷霆拳套,神之手',
  ],
  [
    'shields',
    '盾牌',
    ['armor', 'maxHp'],
    'shield',
    0x8d99ae,
    0xffd166,
    'thorns',
    'attackSpeed',
    '锅盖,砧板,垃圾桶盖,木盾,圆盾,塔盾,刺盾,反击之盾,不破之壁,圣盾',
  ],
  [
    'books',
    '书籍',
    ['xpGain', 'skillCd'],
    'book',
    0x6d597a,
    0xffd166,
    'focusHit',
    'maxHp',
    '菜谱,笔记本,百科全书,地图册,魔法入门,战术手册,禁书,贤者之书,万物图鉴,知识之源',
  ],
  [
    'scrolls',
    '卷轴',
    ['elemental', 'skillCd'],
    'scroll',
    0xf1e3d3,
    0x9d0208,
    'lightning',
    'armor',
    '便签,符纸,咒语卷,召唤卷轴,火球卷轴,冰霜卷轴,雷霆卷轴,禁咒卷轴,天启卷轴,创世卷轴',
  ],
  [
    'gems',
    '宝石',
    ['crit', 'luck'],
    'gem',
    0xe63946,
    0x4cc9f0,
    'critDmg',
    'regen',
    '玻璃珠,石英,玛瑙,紫水晶,翡翠,蓝宝石,红宝石,钻石,星辰宝石,无限宝石',
  ],
  [
    'rings',
    '戒指',
    ['crit', 'rangedPct'],
    'ring',
    0xffd166,
    0xe63946,
    'mark',
    'maxHp',
    '易拉罐环,铜戒,银戒,金戒,宝石戒指,猎手之戒,暴君之戒,王者之戒,命运之戒,至尊魔戒',
  ],
  [
    'amulets',
    '护身符',
    ['dodge', 'luck'],
    'amulet',
    0x9d4edd,
    0xffd166,
    'cleanse',
    'maxHp',
    '平安符,红绳,幸运硬币,护身石,驱虫香囊,圣徽,守护水晶,天使之泪,神明加护,永恒守护',
  ],
  [
    'coins',
    '钱币',
    ['luck', 'harvest'],
    'coin',
    0xffd166,
    0xb8860b,
    'seeds',
    'maxHp',
    '一毛钱,硬币,纪念币,银元,金币,古钱币,藏宝图,聚宝盆,点金石,财神之手',
  ],
  [
    'potions',
    '药水',
    ['regen', 'lifeSteal'],
    'potion',
    0xff006e,
    0xffd6e0,
    'killHeal',
    'speed',
    '红药水,蓝药水,绿药水,解毒剂,回复药,高级回复药,万能药,不死药水,凤凰药剂,生命之泉',
  ],
  [
    'bones',
    '骨头',
    ['melee', 'lifeSteal'],
    'bone',
    0xf1e3d3,
    0x8d6e63,
    'curseHit',
    'regen',
    '鸡骨头,鱼刺,猪骨,牛骨,恐龙骨,骷髅头,诅咒之骨,死灵骨杖,骨龙之牙,冥王之骨',
  ],
  [
    'feathers',
    '羽毛',
    ['dodge', 'speed'],
    'feather',
    0xffffff,
    0x4cc9f0,
    'hasteKill',
    'armor',
    '鸡毛,鸭毛,鸽子羽毛,孔雀羽,鹰羽,天鹅羽,雷鸟之羽,凤凰尾羽,天使之羽,神鸟金羽',
  ],
  [
    'candies',
    '糖果',
    ['xpGain', 'luck'],
    'candy',
    0xf15bb5,
    0x00bbf9,
    'luckyWave',
    'armor',
    '水果糖,奶糖,跳跳糖,巧克力,太妃糖,酒心糖,彩虹糖,魔法糖果,许愿糖,永恒甜蜜',
  ],
  [
    'gears',
    '机械零件',
    ['ranged', 'armor'],
    'gear',
    0x6c757d,
    0xffd166,
    'armorBreak',
    'dodge',
    '螺丝,螺母,弹簧,齿轮,轴承,马达,活塞,涡轮,永动机,机械之心',
  ],
  [
    'batteries',
    '能源',
    ['attackSpeed', 'elemental'],
    'battery',
    0x38b000,
    0x222222,
    'lightning',
    'regen',
    '五号电池,纽扣电池,太阳能板,锂电池,燃料电池,聚变电池,反物质电池,核电池,零点能源,宇宙能源',
  ],
  [
    'masks',
    '面具',
    ['dodge', 'crit'],
    'mask',
    0xf8f9fa,
    0x9d0208,
    'confuseHurt',
    'maxHp',
    '口罩,眼罩,纸面具,京剧脸谱,狐狸面具,傩面,忍者面具,鬼面,千面之面,无相之面',
  ],
  [
    'toys',
    '玩具',
    ['luck', 'xpGain'],
    'box',
    0xff9f1c,
    0x2ec4b6,
    'luckyWave',
    'armor',
    '弹力球,陀螺,积木,拼图,魔方,遥控车,机器人玩具,限定手办,传说卡牌,童心之匣',
  ],
  [
    'music',
    '乐器',
    ['attackSpeed', 'skillCd'],
    'bell',
    0xffd166,
    0x9d0208,
    'periodicHaste',
    'armor',
    '口哨,铃铛,口琴,三角铁,小鼓,吉他拨片,小号,金色竖琴,战鼓,天籁之音',
  ],
  [
    'dark',
    '暗黑',
    ['auraPct', 'lifeSteal'],
    'orb',
    0x3c096c,
    0xff006e,
    'curseHit',
    'regen',
    '黑猫毛,乌鸦羽,诅咒娃娃,暗影布,邪眼,恶魔角,深渊之石,魔王契约,虚空之眼,混沌黑洞',
  ],
  [
    'holy',
    '神圣',
    ['regen', 'armor'],
    'amulet',
    0xfff3b0,
    0xffd166,
    'cleanse',
    'xpGain',
    '白蜡烛,圣水,念珠,祈祷书,天使雕像,圣光碎片,神圣护符,神之祝福,圣杯,光明之心',
  ],
  [
    'ninja',
    '忍具',
    ['speed', 'crit'],
    'blade',
    0x2b2d42,
    0xe63946,
    'bleed',
    'maxHp',
    '苦无,手里剑,烟雾弹,钩爪,忍者绳,飞镖,影分身卷,暗杀匕首,忍之极意,影之王',
  ],
  [
    'pirate',
    '海盗',
    ['luck', 'melee'],
    'coin',
    0x6b4226,
    0xffd166,
    'seeds',
    'armor',
    '独眼罩,朗姆酒,望远镜,船锚,弯刀,火枪,宝箱钥匙,黑胡子旗,幽灵船舵,海盗王宝藏',
  ],
  [
    'science',
    '实验',
    ['elemental', 'range'],
    'potion',
    0x4cc9f0,
    0x70e000,
    'explode',
    'maxHp',
    '试管,烧杯,放大镜,显微镜,化学试剂,离心机,等离子瓶,粒子加速器,反物质,宇宙方程式',
  ],
  [
    'sports',
    '运动',
    ['speed', 'maxHp'],
    'shoe',
    0x2ec4b6,
    0xffffff,
    'regenHurt',
    'luck',
    '跳绳,哑铃,网球,篮球,拳击绷带,运动饮料,奥运奖牌,冠军腰带,传奇球衣,体育之神',
  ],
  [
    'rot',
    '腐败',
    ['auraPct', 'auraSize'],
    'jar',
    0x6a994e,
    0x3d2c2e,
    'weaken',
    'regen',
    '烂菜叶,馊饭,腐烂苹果,霉菌样本,沼气瓶,腐蚀液,瘟疫之瓶,腐王之眼,堕落精华,终焉腐化',
  ],
  [
    'skillbook',
    '技能秘籍',
    ['skillDmg', 'skillCd'],
    'book',
    0x7209b7,
    0xffd166,
    null,
    'maxHp',
    '入门心法,招式图解,奥义残页,必杀技手册,绝招秘录,宗师笔记,奥义真解,天书残卷,无上心经,大招圣典',
  ],
  [
    'talisman',
    '技能法器',
    ['skillRange', 'skillDur'],
    'orb',
    0x4cc9f0,
    0xffffff,
    null,
    'skillCd',
    '扩音喇叭,放大镜片,延时沙漏,共鸣水晶,聚能棱镜,时之砂,空间罗盘,永恒沙漏,星辰罗盘,天穹法器',
  ],
  [
    'stars',
    '星辰',
    ['crit', 'xpGain'],
    'star',
    0xffd60a,
    0x3a0ca3,
    'critDmg',
    'armor',
    '星星贴纸,流星碎片,星砂,月光石,北极星,星座图,银河之尘,超新星,星辰之核,宇宙之眼',
  ],
];

/** 代价属性 → 与之对应的正向属性：代价不超过正向加成的 60% */
const PEN_PAIR: Partial<Record<StatKey, StatKey>> = { ranged: 'melee', rangedPct: 'meleePct' };

/** 只出现在超武上的叠层增益原型 */
const SUPER_ONLY = new Set<Arch>(['rageKill', 'hasteKill', 'vampKill', 'focusHit']);

const RARITY_OF = [0, 0, 0, 0, 1, 1, 1, 2, 2, 3];

function round(v: number, key: StatKey): number {
  const cost = STAT_COST[key] ?? 1;
  if (cost < 0.5) return Math.max(5, Math.round(v / 5) * 5);
  return Math.max(1, Math.round(v));
}

function build(): ItemDef[] {
  const out: ItemDef[] = [];
  SERIES.forEach(([sid, sname, stats, shape, color, color2, arch, drawback, namesStr]) => {
    const names = namesStr.split(',');
    names.forEach((name, i) => {
      const rarity = RARITY_OF[i];
      let budget = RARITY_BUDGET[rarity] * (0.95 + (i % 4) * 0.03);
      const mods: StatMods = {};
      let special: ItemSpecial | undefined;
      // 稀有及以上的特效
      // 叠层增益（怒气 / 急速 / 嗜血 / 专注）只给超武：这几个原型不再生成特效，预算全部转成属性
      const hasSpecial = !!arch && !SUPER_ONLY.has(arch) && (rarity >= 2 || (rarity === 1 && i % 2 === 0));
      // 普通道具奇数位只加一项属性
      const pShare = rarity === 0 && i % 2 === 1 ? 1 : 0.6;
      // 代价规则（参考土豆兄弟）：
      //  · 普通 / 稀有：只要加两项属性或带特效就必须带代价；代价占预算 25%，
      //    正属性按代价的实际价值等额补回（总价值不变，不额外奖励）。只加一项属性的普通道具不带代价。
      //  · 史诗 / 传说：奇数位带代价，补回 1.1 倍（原规则不变）。
      const lowNeedsPen = rarity <= 1 && (pShare < 1 || hasSpecial);
      const highNeedsPen = rarity >= 2 && i % 2 === 1;
      if (lowNeedsPen || highNeedsPen) {
        const pen = drawback;
        const penVal = -round((budget * 0.25) / (STAT_COST[pen] ?? 1), pen);
        mods[pen] = penVal;
        budget += -penVal * (STAT_COST[pen] ?? 1) * (highNeedsPen ? 1.1 : 1);
      }
      let statBudget = budget;
      if (hasSpecial) {
        const sb = budget * (rarity === 3 ? 0.35 : 0.45);
        special = makeSpecial(arch!, sb);
        // 光环系列（主属性是光环伤害 / 光环范围）：命中效果只在光环武器命中时触发，不作用于其他武器
        if (special.onHit && stats.some((k) => k === 'auraPct' || k === 'auraSize')) {
          special = { ...special, onAuraHit: special.onHit };
          delete special.onHit;
        }
        statBudget -= sb;
      }
      // 属性分配：主 60% / 副 40%（名字位置轮换，让同系列有变化）
      const p = stats[i % 3 === 2 ? 1 : 0],
        s2 = stats[i % 3 === 2 ? 0 : 1];
      mods[p] = (mods[p] ?? 0) + round((statBudget * pShare) / (STAT_COST[p] ?? 1), p);
      if (pShare < 1) mods[s2] = (mods[s2] ?? 0) + round((statBudget * (1 - pShare)) / (STAT_COST[s2] ?? 1), s2);
      // 近战系的代价是削减远程伤害（不再削射程），且削减量少于自身加的近战伤害
      const pair = PEN_PAIR[drawback];
      if (pair && mods[drawback] && mods[pair]) {
        mods[drawback] = -Math.min(-mods[drawback]!, Math.max(1, Math.floor(mods[pair]! * 0.6)));
        mods[pair] = Math.max(mods[pair]!, 1 - mods[drawback]!);
      }
      const price = Math.round(RARITY_BUDGET[rarity] * PRICE_MULT[rarity] + 3);
      out.push({
        id: `${sid}_${i}`,
        name,
        rarity,
        price,
        mods,
        special,
        series: sname,
        icon: { shape, color: shiftHue(color, i), color2 },
      });
    });
  });
  return out;
}

/** 同系列不同物品的颜色轻微变化 */
function shiftHue(c: number, i: number): number {
  const r = (c >> 16) & 255,
    g = (c >> 8) & 255,
    b = c & 255;
  const k = 1 + ((i % 5) - 2) * 0.06;
  const cl = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return (cl(r) << 16) | (cl(g) << 8) | cl(b);
}

export const GENERATED_ITEMS: ItemDef[] = build();
export const SERIES_COUNT = SERIES.length;

// F7：角色台词气泡与彩蛋。通用台词池按场合分类；部分角色有专属彩蛋台词（优先、概率触发）
export type BarkKind = 'start' | 'kill' | 'hurt' | 'win' | 'boss';
type Line = [string, string];

export const BARKS: Record<BarkKind, Line[]> = {
  start: [
    ['开工啦！', "Let's go!"],
    ['这波我包了', "I've got this wave"],
    ['今天也要新鲜', 'Stay fresh today'],
    ['谁敢来烂掉我？', 'Who dares rot me?'],
    ['热身结束', 'Warm-up over'],
    ['准备好了！', 'Ready!'],
  ],
  kill: [
    ['下一个！', 'Next!'],
    ['腐烂退散！', 'Begone, rot!'],
    ['太嫩了', 'Too green'],
    ['一个不留', 'None left standing'],
    ['收获满满', 'What a harvest'],
    ['还有谁？', 'Who else?'],
  ],
  hurt: [
    ['哎哟！', 'Ouch!'],
    ['皮都破了', "That's a bruise"],
    ['别碰我的籽！', 'Hands off my seeds!'],
    ['我还能撑', 'I can take it'],
    ['有点疼……', 'That stung…'],
  ],
  boss: [
    ['大家伙来了', 'Here comes the big one'],
    ['就是你在捣乱？', "So you're the troublemaker?"],
    ['正好练练手', 'Good practice'],
  ],
  win: [
    ['菜园保住了！', 'The garden is safe!'],
    ['完美收获', 'Perfect harvest'],
    ['下次再来', 'Come again'],
    ['我是最新鲜的！', "I'm the freshest!"],
  ],
};

/** 角色专属彩蛋：触发时优先于通用台词 */
export const EASTER_EGGS: { charId: string; kind: BarkKind; text: Line }[] = [
  { charId: 'tomato', kind: 'start', text: ['番茄酱小镇，我来守护！', 'Ketchup Town, I will protect you!'] },
  { charId: 'tomato', kind: 'win', text: ['番茄才不是蔬菜呢', "Tomatoes aren't even vegetables"] },
  { charId: 'carrot', kind: 'start', text: ['胡萝卜骑士，参上！', 'Carrot Knight, reporting!'] },
  { charId: 'chili', kind: 'kill', text: ['太辣了吧？', 'Too spicy for you?'] },
  { charId: 'corn', kind: 'kill', text: ['爆米花时间', 'Popcorn time'] },
  { charId: 'watermelon', kind: 'hurt', text: ['我皮厚，没事', 'Thick rind, no worries'] },
  { charId: 'soybean', kind: 'start', text: ['豆兵听令！', 'Bean troops, fall in!'] },
  { charId: 'jackfruit', kind: 'hurt', text: ['碰我？扎手吧', 'Touch me? Enjoy the spikes'] },
  { charId: 'pomegranate', kind: 'kill', text: ['一籽一个', 'One seed, one foe'] },
  { charId: 'taro', kind: 'start', text: ['武器？我不需要', 'Weapons? Not needed'] },
  { charId: 'cabbage', kind: 'hurt', text: ['剥掉一层而已', 'Just one leaf peeled'] },
  { charId: 'blackberry', kind: 'kill', text: ['诅咒生效了', 'The hex takes hold'] },
];

/** 各场合触发概率与冷却（秒） */
export const BARK_CHANCE: Record<BarkKind, number> = { start: 0.5, kill: 0.04, hurt: 0.2, boss: 0.8, win: 1 };
export const BARK_COOLDOWN = 9;

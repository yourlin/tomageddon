// 玩法露出：解锁之前不在界面上展示（不显示灰色或带锁的入口），达成条件后才出现。
// 老存档满足条件的直接显示；条件都读存档，不新增字段。
import { save, persist } from './Save';
import { talentPointsEarned, talentPointsSpent, masterUnlocked, rankOf } from './TalentTree';
import { TALENT_NODES } from '../data/talentTree';
import { tx } from '../i18n';
import { MASTERY_MAX, masteryLevel } from './Progress';
import { CHARACTERS } from '../data/characters';

/** 通关过任意一章 */
const clearedAny = (): boolean => save.clearedChapters >= 1;

export const reveal = {
  /** 无尽模式开关：首次通关任意一章后 */
  endless: clearedAny,
  /** 危机等级：首次通关任意一章后（通关当章才开放危机 1 级） */
  danger: clearedAny,
  /** 金番茄：第一次获得后（只从危机与无尽获得） */
  gold: (): boolean => save.meta.goldEarned > 0 || save.meta.gold > 0,
  /** 皮肤：有过金番茄，或已拥有皮肤（买过 / 熟练度满级送） */
  skins: (): boolean => reveal.gold() || save.meta.skins.length > 0 || CHARACTERS.some((c) => masteryLevel(c.id) >= MASTERY_MAX),
  /** 每日 / 每周挑战：首次通关第 1 章后（玩过挑战的老存档照常显示） */
  challenges: (): boolean => clearedAny() || Object.keys(save.challenges).length > 0,
  /** 天赋树：第一次获得天赋点后 */
  talents: (): boolean => talentPointsEarned() > 0 || talentPointsSpent() > 0,
  /** 大师天赋：天赋树点满后（买过的老存档照常显示） */
  master: (): boolean => masterUnlocked() || save.meta.master > 0,
};

// ---------------- 里程碑：让玩家对还没开放的玩法有预期 ----------------
// 「下一个解锁」提示、解锁卡片、结算页钩子都读这张表；按通常的达成顺序排列
export interface Milestone {
  id: string;
  icon: string;
  open: () => boolean;
  /** 怎么解锁 */
  cond: [string, string];
  /** 开放什么（只说名字，不展开规则） */
  reward: [string, string];
  /** 解锁卡片上的一句话说明 */
  desc: [string, string];
  /** 卡片「去看看」跳转的场景 */
  scene: string;
}

/** 点满天赋树还差几点（二选一的关键天赋每组只算点满其中一个） */
export function talentPointsToMax(): number {
  let need = 0;
  const groups = new Map<string, number>();
  for (const n of TALENT_NODES) {
    const gap = Math.max(0, n.max - rankOf(n.id));
    if (n.exclusive) groups.set(n.exclusive, Math.min(groups.get(n.exclusive) ?? Infinity, gap));
    else need += gap;
  }
  for (const g of groups.values()) need += g;
  return need;
}

export const MILESTONES: Milestone[] = [
  {
    id: 'talents',
    icon: '🌳',
    open: reveal.talents,
    cond: ['达成里程碑成就获得天赋点（比如首次通关第 1 章）', 'Earn talent points from milestone achievements (e.g. clear Chapter 1)'],
    reward: ['天赋树', 'Talent tree'],
    desc: ['用成就给的天赋点强化每一局，随时免费重置', 'Spend points from achievements to power up every run; respec for free any time'],
    scene: 'TalentTree',
  },
  {
    id: 'firstClear',
    icon: '♾️',
    open: reveal.endless,
    cond: ['通关第 1 章', 'Clear Chapter 1'],
    reward: ['无尽模式 · 番茄危机 · 每日 / 每周挑战', 'Endless · Tomato Danger · Daily / Weekly'],
    desc: [
      '通关过的章节可开无尽模式和更高的危机等级；每日 / 每周挑战每天一套新规则',
      'Cleared chapters open Endless and higher Danger levels; Daily / Weekly challenges bring new rules every day',
    ],
    scene: 'CharSelect',
  },
  {
    id: 'gold',
    icon: '🥇',
    open: reveal.gold,
    cond: ['在番茄危机 1 级以上或无尽模式中打一局', 'Play a run on Danger 1+ or in Endless'],
    reward: ['金番茄与角色皮肤', 'Golden Tomatoes & skins'],
    desc: [
      '危机与无尽会奖励金番茄，可在选角界面购买每名角色的 4 套皮肤',
      'Danger and Endless reward Golden Tomatoes — spend them on 4 skins per character',
    ],
    scene: 'CharSelect',
  },
  {
    id: 'master',
    icon: '👑',
    open: reveal.master,
    cond: ['点满天赋树', 'Max out the talent tree'],
    reward: ['大师天赋', 'Master talents'],
    desc: ['用金番茄购买无限层的大师天赋，每层一点小属性', 'Buy unlimited Master layers with Golden Tomatoes, a small stat each'],
    scene: 'TalentTree',
  },
];

/** 下一个还没开放的里程碑 */
export const nextMilestone = (): Milestone | undefined => MILESTONES.find((m) => !m.open());
/** 还有几项玩法没开放 */
export const lockedMilestones = (): number => MILESTONES.filter((m) => !m.open()).length;

/** 主菜单一行：下一个解锁 + 还剩几项（全部开放后返回空串） */
export function nextUnlockLine(): string {
  const m = nextMilestone();
  if (!m) return '';
  const left = lockedMilestones() - 1;
  const more = left > 0 ? tx(`（之后还有 ${left} 项玩法）`, ` (${left} more after that)`) : '';
  return tx(`🔓 下一个解锁：${m.cond[0]} → ${m.reward[0]}${more}`, `🔓 Next unlock: ${m.cond[1]} → ${m.reward[1]}${more}`);
}

/** 结算页钩子：离下一个玩法还差什么（比主菜单那行更具体） */
export function resultHook(): string {
  const m = nextMilestone();
  if (!m) return '';
  if (m.id === 'master') {
    const n = talentPointsToMax();
    return tx(`🔓 天赋树再投入 ${n} 点就能点满，开启大师天赋`, `🔓 ${n} more talent points to max the tree and open Master talents`);
  }
  if (m.id === 'gold')
    return tx(
      '🔓 在选角界面把番茄危机调到 1 级再出发，就能开始获得金番茄、解锁皮肤',
      '🔓 Set Tomato Danger to 1 on character select to start earning Golden Tomatoes and skins',
    );
  return tx(`🔓 ${m.cond[0]}，即可开启：${m.reward[0]}`, `🔓 ${m.cond[1]} to open: ${m.reward[1]}`);
}

/** 刚开放、还没弹过卡片的里程碑（调用后记为已看过）。老存档第一次调用时把已开放的直接记为已看过，不补弹 */
export function takeNewMilestones(): Milestone[] {
  const open = MILESTONES.filter((m) => m.open());
  if (!save.revealSeen) {
    save.revealSeen = open.map((m) => m.id);
    persist();
    return [];
  }
  const fresh = open.filter((m) => !save.revealSeen!.includes(m.id));
  if (fresh.length) {
    save.revealSeen.push(...fresh.map((m) => m.id));
    persist();
  }
  return fresh;
}

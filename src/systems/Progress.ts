// F 模块：角色专属任务（F1）、觉醒（F2）、熟练度（F3）。局后结算 + 开局奖励
import { QUESTS, questsOf, evalRunQuest, type QuestDef } from '../data/quests';
import { AWAKENINGS } from '../data/awakenings';
import { CHARACTERS } from '../data/characters';
import { ALL_ITEMS } from '../data/items';
import { save } from './Save';
import { run, runHooks } from './RunState';
import { bump, bumpMax, counter } from './Counters';
import { tx } from '../i18n';
import { SKIN_OF } from '../data/skins';

// ---------------- 任务与觉醒 ----------------
export const questDone = (q: QuestDef): boolean => !!save.meta.quests[q.id];
export const questProgress = (q: QuestDef): number =>
  q.kind === 'counter' && q.counter ? Math.min(q.target, counter(q.counter)) : questDone(q) ? 1 : 0;
/** 3 个任务都完成即解锁觉醒 */
export const awakenUnlocked = (charId: string): boolean => questsOf(charId).length > 0 && questsOf(charId).every(questDone);
/** 觉醒是否生效：解锁后默认开启，可在选角界面关闭 */
export const awakenOn = (charId: string): boolean => awakenUnlocked(charId) && save.meta.awaken[charId] !== false;

export interface ProgressResult {
  quests: QuestDef[];
  awakened: boolean;
  masteryBefore: number;
  masteryAfter: number;
  masteryXp: number;
}

/** 局后结算：判定任务（计数器类随时检查，对局类按本局结果）、觉醒与熟练度 */
export function settleProgress(win: boolean): ProgressResult {
  const res: ProgressResult = { quests: [], awakened: false, masteryBefore: masteryLevel(run.charId), masteryAfter: 0, masteryXp: 0 };
  const wasAwake = awakenUnlocked(run.charId);
  const r = {
    charId: run.charId,
    chapterId: run.chapterId,
    wave: run.wave,
    win,
    danger: run.danger,
    endless: run.endless,
    weapons: run.weapons.length,
    kills: run.kills,
    level: run.level,
    perfectWaves: run.perfectWaves,
  };
  // 计数器任务对所有角色检查（计数器可能在别的角色局里涨），对局任务只看本局角色；挑战模式不计对局任务
  for (const q of QUESTS) {
    if (questDone(q)) continue;
    const ok = q.kind === 'counter' ? questProgress(q) >= q.target : !run.challenge && q.charId === run.charId && evalRunQuest(q, r);
    if (!ok) continue;
    save.meta.quests[q.id] = Date.now();
    bump('quests');
    res.quests.push(q);
  }
  for (const c of CHARACTERS)
    if (awakenUnlocked(c.id) && !counter(`awaken:${c.id}`)) {
      bump(`awaken:${c.id}`);
      bump('awakened');
      if (c.id === run.charId && !wasAwake) res.awakened = true;
    }
  // 熟练度：每局按波次与胜负获得经验（挑战模式也算）
  const xp = Math.round(run.wave * 10 * (run.endless ? 0.6 : 1) + (win ? 100 : 0) + run.danger * 8);
  save.meta.mastery[run.charId] = (save.meta.mastery[run.charId] ?? 0) + xp;
  res.masteryXp = xp;
  res.masteryAfter = masteryLevel(run.charId);
  bumpMax('masteryMax', res.masteryAfter);
  bumpMax('mastery10', CHARACTERS.filter((c) => masteryLevel(c.id) >= MASTERY_MAX).length);
  return res;
}

// ---------------- 熟练度 ----------------
export const MASTERY_MAX = 10;
/** 升到第 n 级累计需要的经验（1 级 0 经验；10 级约 30 局通关） */
export const masteryNeed = (lv: number): number => Math.round(150 * (lv - 1) * (1 + 0.25 * (lv - 1)));
export function masteryLevel(charId: string): number {
  const xp = save.meta.mastery[charId] ?? 0;
  let lv = 1;
  while (lv < MASTERY_MAX && xp >= masteryNeed(lv + 1)) lv++;
  return lv;
}

/** 熟练度奖励（F3）：开局番茄籽、开局道具槽、专属天赋（全伤害） */
export const MASTERY_REWARDS: { lv: number; desc: [string, string] }[] = [
  { lv: 2, desc: ['开局 +15 番茄籽', 'Start with +15 Seeds'] },
  { lv: 4, desc: ['开局 +30 番茄籽（替代 2 级）', 'Start with +30 Seeds (replaces Lv 2)'] },
  { lv: 5, desc: ['开局道具槽：开局获得 1 个随机普通道具', 'Starting item slot: start with a random Common item'] },
  { lv: 7, desc: ['专属天赋：全伤害 +3%', 'Signature talent: +3% damage'] },
  { lv: 8, desc: ['开局道具槽升级：改为随机稀有道具', 'Starting item slot upgrade: a random Rare item instead'] },
  {
    lv: 10,
    desc: ['专属天赋：全伤害再 +3%，并解锁该角色的皮肤', 'Signature talent: another +3% damage, and unlock this character’s skin'],
  },
];

export const masteryDamage = (charId: string): number => (masteryLevel(charId) >= 10 ? 6 : masteryLevel(charId) >= 7 ? 3 : 0);

/** 开局时发放熟练度奖励（挑战模式不发，保证公平） */
export function applyStartRewards(): void {
  if (run.challenge) return;
  const lv = masteryLevel(run.charId);
  if (lv >= 4) run.seeds += 30;
  else if (lv >= 2) run.seeds += 15;
  if (lv >= 5) {
    const rarity = lv >= 8 ? 1 : 0;
    const pool = ALL_ITEMS.filter((i) => i.rarity === rarity && run.canTakeItem(i.id) && i.price > 0);
    if (pool.length) run.addItem(pool[Math.floor(Math.random() * pool.length)].id);
  }
  run.awakened = awakenOn(run.charId);
  run.masteryDmg = masteryDamage(run.charId);
  run.dirty();
}
runHooks.onStart = applyStartRewards;

// ---------------- 皮肤（F6） ----------------
/** 是否拥有该角色的皮肤：金番茄购买，或熟练度满级免费 */
export const skinOwned = (charId: string): boolean =>
  !!SKIN_OF[charId] && (save.meta.skins.includes(SKIN_OF[charId].id) || masteryLevel(charId) >= MASTERY_MAX);
export const skinActive = (charId: string): boolean => skinOwned(charId) && save.meta.skinOf[charId] === SKIN_OF[charId].id;
/** 购买皮肤（金番茄不够返回 false） */
export function buySkin(charId: string): boolean {
  const s = SKIN_OF[charId];
  if (!s || skinOwned(charId) || save.meta.gold < s.price) return false;
  save.meta.gold -= s.price;
  save.meta.skins.push(s.id);
  save.meta.skinOf[charId] = s.id;
  bump('skinsBought');
  return true;
}
export function toggleSkin(charId: string): void {
  if (!skinOwned(charId)) return;
  save.meta.skinOf[charId] = skinActive(charId) ? '' : SKIN_OF[charId].id;
}

export const awakeningOf = (charId: string) => AWAKENINGS[charId];
export const masteryLabel = (charId: string): string => {
  const lv = masteryLevel(charId);
  const xp = save.meta.mastery[charId] ?? 0;
  return lv >= MASTERY_MAX
    ? tx(`熟练度 ${lv}（满级）`, `Mastery ${lv} (max)`)
    : tx(`熟练度 ${lv} · ${xp}/${masteryNeed(lv + 1)}`, `Mastery ${lv} · ${xp}/${masteryNeed(lv + 1)}`);
};

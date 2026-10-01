// 成就系统：读取存档与当前对局的指标，逐级解锁并发放成就点；成就点用于购买角色
import { ACHIEVEMENTS, ACH_MAP, TIER_MEDALS, TIER_NAME, type AchievementDef, type AchMetric } from '../data/achievements';
import { CHARACTERS, CHARACTER_MAP, type CharacterDef } from '../data/characters';
import { WEAPONS } from '../data/weapons';
import { ENEMIES } from '../data/enemies';
import { BOSSES, BOSS_MAP } from '../data/bosses';
import { ALL_ITEMS, ITEM_MAP } from '../data/items';
import { WEAPON_MAP } from '../data/weapons';
import { AFFIXES, type AffixId } from '../data/bosses';
import { STATUSES, type StatusId } from '../data/statuses';
import { CHAPTERS } from '../data/chapters';
import { SKILL_TYPE_NAME } from '../data/skills';
import { RARITY } from '../data/balance';
import type { SkillType } from '../data/characters';
import { tagName } from '../i18n/apply';
import { counter } from './Counters';
import { save, persist, isUnlocked, isSeen, buyCharacter } from './Save';
import { run } from './RunState';
import { lang, tx } from '../i18n';
import { overlayRoot } from './ForceLandscape';

/** 是否处于对局中（对局类指标只在对局中统计） */
let inRun = false;
export function setInRun(v: boolean): void {
  inRun = v;
}

const regularEnemies = () => ENEMIES.filter((e) => !e.critter);
const runItemCount = () => Object.values(run.items).reduce((a, b) => a + b, 0);
const METRICS: Record<AchMetric, (a: AchievementDef) => number> = {
  totalKills: () => save.totalKills,
  runKills: () => (inRun ? run.kills : 0),
  eliteKills: () => save.stats.eliteKills,
  bossKills: () => save.stats.bossKills,
  overtimeWins: () => save.stats.overtimeWins,
  perfectWaves: () => save.stats.perfectWaves,
  revives: () => save.stats.revives,
  clearedChapters: () => save.clearedChapters,
  wins: () => save.wins,
  charsWon: () => CHARACTERS.filter((c) => (save.charWins[c.id] ?? 0) > 0).length,
  charsOwned: () => CHARACTERS.filter(isUnlocked).length,
  runLevel: () => (inRun ? run.level : 0),
  runItems: () => (inRun ? runItemCount() : 0),
  runWeapons: () => (inRun ? run.weapons.length : 0),
  t4Crafted: () => save.stats.t4Crafted,
  runSeeds: () => (inRun ? run.seeds : 0),
  seedsEarned: () => save.stats.seedsEarned,
  seenWeapons: () => WEAPONS.filter((w) => isSeen('weapons', w.id)).length,
  seenItems: () => save.seen.items.length,
  seenEnemies: () => regularEnemies().filter((e) => isSeen('enemies', e.id)).length,
  seenBosses: () => BOSSES.filter((b) => isSeen('bosses', b.id)).length,
  charRuns: (a) => save.charRuns[a.charId!] ?? 0,
  charWins: (a) => save.charWins[a.charId!] ?? 0,
  bossDefeated: (a) => save.killedBosses[a.bossId!] ?? 0,
  counter: (a) => counter(a.key!),
  runSeries: (a) => {
    if (!inRun) return 0;
    let n = 0;
    for (const [id, c] of Object.entries(run.items)) if (id.startsWith(`${a.key}_`)) n += c;
    return n;
  },
  runSet: (a) => (inRun ? (run.setCounts()[a.key!] ?? 0) : 0),
};

/** {x} 指代对象的名字（读取当前语言下的数据） */
function subjectName(a: AchievementDef): string {
  const s = a.subject;
  if (!s) return '';
  switch (s.kind) {
    case 'enemy':
      return ENEMIES.find((e) => e.id === s.id)?.name ?? s.id;
    case 'weapon':
      return WEAPON_MAP[s.id]?.name ?? s.id;
    case 'series':
      return ITEM_MAP[`${s.id}_0`]?.series ?? s.id;
    case 'set':
      return tagName(s.id);
    case 'skill':
      return SKILL_TYPE_NAME[s.id as SkillType] ?? s.id;
    case 'status':
      return STATUSES[s.id as StatusId]?.name ?? s.id;
    case 'affix':
      return AFFIXES[s.id as AffixId]?.name ?? s.id;
    case 'chapter':
      return CHAPTERS[Number(s.id) - 1]?.name ?? s.id;
    case 'rarity':
      return RARITY[Number(s.id)]?.name ?? s.id;
  }
}

const TOTALS: Partial<Record<AchMetric, () => number>> = {
  charsWon: () => CHARACTERS.length,
  charsOwned: () => CHARACTERS.length,
  seenWeapons: () => WEAPONS.length,
  seenItems: () => ALL_ITEMS.length,
  seenEnemies: () => regularEnemies().length,
  seenBosses: () => BOSSES.length,
};

// ---------------- 等级与进度 ----------------
export function tierGoal(a: AchievementDef, i: number): number {
  const g = a.tiers[i].goal;
  return g === 'all' ? (TOTALS[a.metric]?.() ?? 1) : g;
}

export const achValue = (a: AchievementDef): number => METRICS[a.metric](a);
/** 已达成的等级数（0 = 未解锁） */
export const achTier = (id: string): number => save.achievements[id]?.tier ?? 0;
export const isMaxed = (a: AchievementDef): boolean => achTier(a.id) >= a.tiers.length;

/** 成就文字：{n} → 目标值（默认下一等级），{char} → 角色名 */
export function achText(a: AchievementDef, field: 'name' | 'desc', tierIdx?: number): string {
  const t = a[field][lang === 'en' ? 1 : 0];
  const i = tierIdx ?? Math.min(achTier(a.id), a.tiers.length - 1);
  return t
    .replace('{n}', tierGoal(a, i).toLocaleString())
    .replace('{char}', a.charId ? CHARACTER_MAP[a.charId].name : '')
    .replace('{boss}', a.bossId ? BOSS_MAP[a.bossId].name : '')
    .replace(/\{x\}/g, subjectName(a));
}
export const pick = (t: [string, string]): string => (lang === 'en' ? t[1] : t[0]);

/** 奖章：单级成就直接给金牌；多级按已达等级 */
export function medalOf(a: AchievementDef, tier = achTier(a.id)): string {
  if (tier <= 0) return '';
  return a.tiers.length === 1 ? TIER_MEDALS[2] : TIER_MEDALS[Math.min(tier, TIER_MEDALS.length) - 1];
}
export function tierLabel(a: AchievementDef, tier: number): string {
  return a.tiers.length === 1 ? '' : pick(TIER_NAME[Math.min(tier, TIER_NAME.length) - 1]);
}

// ---------------- 成就点 ----------------
export function pointsEarned(): number {
  let p = 0;
  for (const a of ACHIEVEMENTS) for (let i = 0; i < achTier(a.id); i++) p += a.tiers[i].points;
  return p;
}
export const pointsBalance = (): number => pointsEarned() - save.pointsSpent;
export const pointsTotal = (): number => ACHIEVEMENTS.reduce((s, a) => s + a.tiers.reduce((t, x) => t + x.points, 0), 0);

/** 角色价格：characters.ts 里的 cost 是相对权重，按「全部角色总价 = 全部成就点 × 70%」缩放，取整到 5 */
const ALL_CHARS_SHARE = 0.7;
let priceScale = 0;
export function charCost(c: CharacterDef): number {
  if (!c.cost) return 0;
  if (!priceScale) priceScale = (pointsTotal() * ALL_CHARS_SHARE) / CHARACTERS.reduce((s, x) => s + (x.cost ?? 0), 0);
  return Math.max(5, Math.round((c.cost * priceScale) / 5) * 5);
}

/** 购买角色前置：未满足时返回需要完成的成就说明 */
export function missingRequirement(c: CharacterDef): string | null {
  const r = c.requires;
  if (!r || achTier(r.ach) >= r.tier) return null;
  const a = ACH_MAP[r.ach];
  const tier = tierLabel(a, r.tier);
  return `${achText(a, 'name', r.tier - 1)}${tier ? `（${tier}）` : ''}：${achText(a, 'desc', r.tier - 1)}`;
}

/** 未拥有角色的解锁说明：前置成就（如有）+ 价格 */
export function unlockHint(c: CharacterDef): string {
  if (isUnlocked(c)) return '';
  const req = missingRequirement(c);
  const price = tx(`价格 ${charCost(c)} 成就点`, `Costs ${charCost(c)} pts`);
  return req ? tx(`需先达成 ${req}；${price}`, `Requires ${req}; ${price}`) : price;
}

export type BuyResult = 'ok' | 'owned' | 'locked' | 'poor';
export function tryBuyCharacter(c: CharacterDef): BuyResult {
  if (isUnlocked(c)) return 'owned';
  if (missingRequirement(c)) return 'locked';
  if (!buyCharacter(c, pointsBalance(), charCost(c))) return 'poor';
  checkAchievements();
  return 'ok';
}

// ---------------- 检查与解锁 ----------------
/** 检查所有成就，逐级解锁；返回本次新获得的成就点 */
export function checkAchievements(): number {
  const fresh: { a: AchievementDef; tier: number; points: number }[] = [];
  for (const a of ACHIEVEMENTS) {
    let tier = achTier(a.id);
    if (tier >= a.tiers.length) continue;
    const v = achValue(a);
    let points = 0;
    while (tier < a.tiers.length && v >= tierGoal(a, tier)) points += a.tiers[tier++].points;
    if (tier > achTier(a.id)) {
      save.achievements[a.id] = { tier, t: Date.now() };
      fresh.push({ a, tier, points });
    }
  }
  if (!fresh.length) return 0;
  persist();
  // 一次解锁很多时只逐条提示点数最高的 3 条，其余合并成一条汇总
  fresh.sort((x, y) => y.points - x.points);
  for (const f of fresh.slice(0, 3)) notify(f.a, f.tier, f.points);
  if (fresh.length > 3)
    notifyMore(
      fresh.length - 3,
      fresh.slice(3).reduce((s, f) => s + f.points, 0),
    );
  const gained = fresh.reduce((s, f) => s + f.points, 0);
  if (inRun) run.achPoints += gained;
  return gained;
}

// ---------------- 解锁提示（DOM 覆盖层，跨场景显示） ----------------
const HEADLESS = typeof location !== 'undefined' && new URLSearchParams(location.search).has('headless');
const queue: (() => void)[] = [];
let showing = false;

function notify(a: AchievementDef, tier: number, points: number): void {
  if (HEADLESS || typeof document === 'undefined') return;
  queue.push(() => {
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;left:50%;top:14px;transform:translate(-50%,-130%);z-index:30;display:flex;align-items:center;gap:12px;' +
      'padding:10px 18px;border-radius:12px;background:rgba(40,16,20,0.94);border:2px solid #ffd166;color:#fff4ea;' +
      'font:15px "PingFang SC","Microsoft YaHei",sans-serif;box-shadow:0 6px 20px rgba(0,0,0,0.4);transition:transform .35s ease;pointer-events:none;';
    const tl = tierLabel(a, tier);
    el.innerHTML =
      `<span style="font-size:30px">${a.icon}${medalOf(a, tier)}</span><span>` +
      `<div style="color:#ffd166;font-size:12px">${tx('成就解锁', 'Achievement unlocked')}${tl ? ` · ${tl}` : ''} · +${points} ${tx('成就点', 'pts')}</div>` +
      `<div style="font-weight:bold;font-size:17px">${achText(a, 'name', tier - 1)}</div>` +
      `<div style="opacity:.75;font-size:12px">${achText(a, 'desc', tier - 1)}</div></span>`;
    overlayRoot().appendChild(el);
    requestAnimationFrame(() => (el.style.transform = 'translate(-50%,0)'));
    setTimeout(() => (el.style.transform = 'translate(-50%,-130%)'), 3000);
    setTimeout(() => {
      el.remove();
      next();
    }, 3400);
  });
  if (!showing) next();
}

function notifyMore(n: number, points: number): void {
  if (HEADLESS || typeof document === 'undefined') return;
  queue.push(() => {
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;left:50%;top:14px;transform:translate(-50%,-130%);z-index:30;padding:10px 18px;border-radius:12px;' +
      'background:rgba(40,16,20,0.94);border:2px solid #ffd166;color:#fff4ea;font:15px "PingFang SC","Microsoft YaHei",sans-serif;' +
      'box-shadow:0 6px 20px rgba(0,0,0,0.4);transition:transform .35s ease;pointer-events:none;';
    el.innerHTML = `🏆 ${tx(`另有 ${n} 项成就解锁`, `${n} more achievements unlocked`)} · <b style="color:#ffd166">+${points} ${tx('成就点', 'pts')}</b>`;
    overlayRoot().appendChild(el);
    requestAnimationFrame(() => (el.style.transform = 'translate(-50%,0)'));
    setTimeout(() => (el.style.transform = 'translate(-50%,-130%)'), 2400);
    setTimeout(() => {
      el.remove();
      next();
    }, 2800);
  });
  if (!showing) next();
}

function next(): void {
  const show = queue.shift();
  showing = !!show;
  show?.();
}

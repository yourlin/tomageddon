// 成就系统：读取存档与当前对局的指标，逐级解锁并发放成就点；部分成就达成后自动解锁对应角色
import { ACHIEVEMENTS, ACH_MAP, TIER_MEDALS, TIER_NAME, type AchievementDef, type AchMetric } from '../data/achievements';
import { unlockPlatformAchievement } from '../platform';
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
import { save, persist, isUnlocked, isSeen } from './Save';
import { run, freeChallengeActive } from './RunState';
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

// ---------------- 成就点（只作为累计成绩展示，不再用于购买角色） ----------------
export function pointsEarned(): number {
  let p = 0;
  for (const a of ACHIEVEMENTS) for (let i = 0; i < achTier(a.id); i++) p += a.tiers[i].points;
  return p;
}
export const pointsTotal = (): number => ACHIEVEMENTS.reduce((s, a) => s + a.tiers.reduce((t, x) => t + x.points, 0), 0);

// ---------------- 角色解锁：达成指定成就即自动解锁 ----------------
/** 解锁成就的名称与条件说明（含等级） */
export function unlockRequirement(c: CharacterDef): string {
  if (!c.unlock) return '';
  const a = ACH_MAP[c.unlock.ach];
  const tier = tierLabel(a, c.unlock.tier);
  return `${achText(a, 'name', c.unlock.tier - 1)}${tier ? `（${tier}）` : ''}：${achText(a, 'desc', c.unlock.tier - 1)}`;
}

/** 未拥有角色的解锁进度：当前值 / 目标值 */
export function unlockProgress(c: CharacterDef): { value: number; goal: number } {
  if (!c.unlock) return { value: 1, goal: 1 };
  const a = ACH_MAP[c.unlock.ach];
  const goal = tierGoal(a, c.unlock.tier - 1);
  return { value: Math.min(goal, achValue(a)), goal };
}

/** 未拥有角色的解锁说明（已拥有返回空串） */
export function unlockHint(c: CharacterDef): string {
  if (isUnlocked(c)) return '';
  const { value, goal } = unlockProgress(c);
  return tx(
    `达成成就解锁 · ${unlockRequirement(c)}（${value}/${goal}）`,
    `Unlock via achievement · ${unlockRequirement(c)} (${value}/${goal})`,
  );
}

/** 由某项成就解锁的角色 */
const charsByAch = (id: string): CharacterDef[] => CHARACTERS.filter((c) => c.unlock?.ach === id);

// ---------------- 检查与解锁 ----------------
/** Steam 版启动时把已获得的成就全部同步一次（网页存档导入、离线游玩后补报） */
export function syncPlatformAchievements(): void {
  for (const a of ACHIEVEMENTS) for (let t = 1; t <= achTier(a.id); t++) unlockPlatformAchievement(`${a.id}_${t}`);
}

/** 检查所有成就，逐级解锁；返回本次新获得的成就点 */
const unlockedChars: CharacterDef[] = [];
export function checkAchievements(): number {
  if (freeChallengeActive()) return 0;
  const fresh: { a: AchievementDef; tier: number; points: number }[] = [];
  // 新解锁的角色会让「拥有角色」类成就前进，可能连锁解锁下一名角色，所以重复检查直到不再变化
  for (let changed = true; changed;) {
    changed = false;
    for (const a of ACHIEVEMENTS) {
      let tier = achTier(a.id);
      if (tier >= a.tiers.length) continue;
      const v = achValue(a);
      let points = 0;
      while (tier < a.tiers.length && v >= tierGoal(a, tier)) points += a.tiers[tier++].points;
      if (tier > achTier(a.id)) {
        // Steam：每一级是一个独立的 Steam 成就（API 名 `${id}_${级}`，见 docs/steam/achievements.csv）
        for (let t = achTier(a.id) + 1; t <= tier; t++) unlockPlatformAchievement(`${a.id}_${t}`);
        const before = charsByAch(a.id).filter((c) => !isUnlocked(c));
        save.achievements[a.id] = { tier, t: Date.now() };
        for (const c of before)
          if (isUnlocked(c)) {
            unlockedChars.push(c);
            if (inRun) run.newChars.push(c.id);
          }
        fresh.push({ a, tier, points });
        changed = true;
      }
    }
  }
  if (!fresh.length) return 0;
  persist();
  // 新角色解锁最重要，排在最前面提示
  for (const c of unlockedChars.splice(0)) notifyChar(c);
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
    const tp = a.tp?.[tier - 1] ?? 0;
    el.innerHTML =
      `<span style="font-size:30px">${a.icon}${medalOf(a, tier)}</span><span>` +
      `<div style="color:#ffd166;font-size:12px">${tx('成就解锁', 'Achievement unlocked')}${tl ? ` · ${tl}` : ''} · +${points} ${tx('成就点', 'pts')}${tp ? ` · <b style="color:#e0aaff">+${tp} ${tx('天赋点', 'talent pts')}</b>` : ''}</div>` +
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

function notifyChar(c: CharacterDef): void {
  if (HEADLESS || typeof document === 'undefined') return;
  queue.push(() => {
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;left:50%;top:14px;transform:translate(-50%,-130%);z-index:30;display:flex;align-items:center;gap:12px;' +
      'padding:10px 18px;border-radius:12px;background:rgba(16,40,24,0.95);border:2px solid #52ff8a;color:#f0fff4;' +
      'font:15px "PingFang SC","Microsoft YaHei",sans-serif;box-shadow:0 6px 20px rgba(0,0,0,0.4);transition:transform .35s ease;pointer-events:none;';
    const a = c.unlock ? ACH_MAP[c.unlock.ach] : undefined;
    el.innerHTML =
      `<span style="font-size:30px">🎉</span><span>` +
      `<div style="color:#52ff8a;font-size:12px">${tx('新角色解锁', 'New character unlocked')}</div>` +
      `<div style="font-weight:bold;font-size:17px">${c.name}</div>` +
      (a
        ? `<div style="opacity:.75;font-size:12px">${tx('达成成就', 'Achievement')}「${achText(a, 'name', c.unlock!.tier - 1)}」</div>`
        : '') +
      `</span>`;
    overlayRoot().appendChild(el);
    requestAnimationFrame(() => (el.style.transform = 'translate(-50%,0)'));
    setTimeout(() => (el.style.transform = 'translate(-50%,-130%)'), 3400);
    setTimeout(() => {
      el.remove();
      next();
    }, 3800);
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

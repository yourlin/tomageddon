// H5：局内小任务（纯逻辑，不依赖 Phaser / RunState）。
//
// 每波开始时以一定概率给出 1 个小任务（本波不受伤、N 秒内击杀 M 只、击杀精英、不用技能、光环击杀……），
// 由 GameScene 把战斗事件喂给 WaveQuestTracker，波末 finish() 结算奖励。
//
// ── 主代理接线步骤 ─────────────────────────────────────────────────────────────
// 1. GameScene 持有一个实例：`private quests = new WaveQuestTracker();`
// 2. 每波开始（applyWaveRules() 之后）：
//      const q = this.quests.start(run.wave, rnd, {
//        isBoss: isBossWaveNo(run.wave), hasElite: isEliteWaveNo(run.wave),
//        hasSkill: <角色有主动技能>, hasAura: <持有光环武器>,
//      });
//    rnd 建议用局内确定性随机：mulberry32(hashSeed(`${run.challenge?.seed ?? run.startedAt}:quest:${run.wave}`))，
//    读档重开同一波结果不变。q 非空时 HUD 弹出任务名（q.name / q.desc，用 tx(zh,en)）。
// 3. 战斗事件：
//      敌人死亡       → this.quests.onKill(enemy.isElite || enemy.isBoss, killedByAura)
//      玩家受到伤害   → this.quests.onHurt()          （闪避 / 护盾完全抵挡不算）
//      释放主动技能   → this.quests.onSkill()
//      update(dt 秒)  → this.quests.tick(dt)          （暂停 / 商店期间不要调用）
// 4. HUD：每帧或节流读取 this.quests.status()，显示 text[zh/en] 与 progress（0–1），
//    state 变为 'done' / 'failed' 时可做一次提示（status().changed 只在状态切换后第一次读取为 true）。
// 5. 波末（进商店前）：const reward = this.quests.finish();
//    reward 非空 → run.seeds += reward.seeds; 经验走正常加经验函数 reward.xp；HUD 提示「任务完成」。
//    玩家死亡 / 放弃时调用 this.quests.reset()。
// ─────────────────────────────────────────────────────────────────────────────
import type { Rand } from './Rng';

export type WaveQuestId = 'no_hurt' | 'speed_kill' | 'elite_kill' | 'no_skill' | 'aura_kill' | 'kill_count' | 'few_hits' | 'combo';

export type QuestState = 'active' | 'done' | 'failed';

export interface WaveQuestDef {
  id: WaveQuestId;
  icon: string;
  name: [string, string];
  /** 需要的条件（不满足就不会抽到） */
  needs?: 'elite' | 'skill' | 'aura';
  /** 是否在 Boss 波出现 */
  boss: boolean;
  weight: number;
  /** 奖励倍率（难度越高给得越多） */
  rewardMult: number;
}

export const WAVE_QUESTS: WaveQuestDef[] = [
  { id: 'no_hurt', icon: '🛡️', name: ['毫发无伤', 'Untouched'], boss: true, weight: 10, rewardMult: 1.5 },
  { id: 'speed_kill', icon: '⏱️', name: ['速战速决', 'Blitz'], boss: false, weight: 12, rewardMult: 1.2 },
  { id: 'elite_kill', icon: '👑', name: ['猎杀精英', 'Elite Hunter'], needs: 'elite', boss: false, weight: 10, rewardMult: 1 },
  { id: 'no_skill', icon: '🚫', name: ['自力更生', 'No Skills'], needs: 'skill', boss: true, weight: 8, rewardMult: 0.8 },
  { id: 'aura_kill', icon: '🌀', name: ['光环收割', 'Aura Reaper'], needs: 'aura', boss: false, weight: 8, rewardMult: 1 },
  { id: 'kill_count', icon: '💀', name: ['大扫除', 'Clean Sweep'], boss: false, weight: 12, rewardMult: 0.8 },
  { id: 'few_hits', icon: '❤️', name: ['小心翼翼', 'Careful'], boss: true, weight: 10, rewardMult: 0.9 },
  { id: 'combo', icon: '⚡', name: ['连斩', 'Killing Spree'], boss: false, weight: 10, rewardMult: 1.1 },
];
export const WAVE_QUEST_MAP = Object.fromEntries(WAVE_QUESTS.map((q) => [q.id, q])) as Record<WaveQuestId, WaveQuestDef>;

/** 平衡参数 */
export const QUEST_TUNING = {
  /** 每波出任务的概率 */
  chance: 0.45,
  /** 第几波起出任务 */
  fromWave: 2,
  /** 奖励：番茄籽 = (base + perWave × 波次) × rewardMult；经验同理 */
  seedBase: 8,
  seedPerWave: 3,
  xpBase: 5,
  xpPerWave: 2,
  /** 速战速决：时限（秒）与击杀数 */
  speedTime: 30,
  speedKills: (wave: number) => 40 + wave * 5,
  /** 大扫除：本波击杀数 */
  killCount: (wave: number) => 60 + wave * 8,
  /** 光环击杀数 */
  auraKills: (wave: number) => 15 + wave * 2,
  /** 小心翼翼：最多受伤次数 */
  maxHits: 3,
  /** 连斩：在 window 秒内击杀 n 只 */
  comboWindow: 5,
  comboKills: (wave: number) => 15 + wave,
};

export interface QuestStartOpts {
  /** 本波是 Boss 波（只出不受伤 / 不用技能 / 少受伤这类） */
  isBoss?: boolean;
  /** 本波会出现精英 */
  hasElite?: boolean;
  /** 角色有主动技能 */
  hasSkill?: boolean;
  /** 持有光环武器 */
  hasAura?: boolean;
  /** 覆盖出任务概率（测试 / 特殊模式），0 = 关闭 */
  chance?: number;
  /** 强制指定任务（调试用，忽略概率与条件） */
  force?: WaveQuestId;
}

export interface ActiveQuest {
  id: WaveQuestId;
  icon: string;
  name: [string, string];
  desc: [string, string];
  wave: number;
  /** 目标数量（击杀数 / 最大受伤次数等；无则为 1） */
  target: number;
  /** 时间限制（秒），0 = 本波内 */
  timeLimit: number;
}

export interface QuestStatus {
  id: WaveQuestId;
  icon: string;
  name: [string, string];
  /** 进度文本 [zh, en] */
  text: [string, string];
  /** 0–1 */
  progress: number;
  state: QuestState;
  /** 状态在上一次读取之后发生了切换（done / failed 提示用） */
  changed: boolean;
}

export interface QuestReward {
  id: WaveQuestId;
  seeds: number;
  xp: number;
}

export const questReward = (id: WaveQuestId, wave: number): QuestReward => {
  const m = WAVE_QUEST_MAP[id].rewardMult;
  const t = QUEST_TUNING;
  return {
    id,
    seeds: Math.round((t.seedBase + t.seedPerWave * wave) * m),
    xp: Math.round((t.xpBase + t.xpPerWave * wave) * m),
  };
};

function describe(id: WaveQuestId, target: number, time: number): [string, string] {
  switch (id) {
    case 'no_hurt':
      return ['本波不受到任何伤害', 'Take no damage this wave'];
    case 'speed_kill':
      return [`${time} 秒内击杀 ${target} 只敌人`, `Kill ${target} enemies within ${time}s`];
    case 'elite_kill':
      return ['本波击杀一只精英', 'Kill an elite this wave'];
    case 'no_skill':
      return ['本波不使用主动技能', 'Do not use your skill this wave'];
    case 'aura_kill':
      return [`用光环击杀 ${target} 只敌人`, `Kill ${target} enemies with auras`];
    case 'kill_count':
      return [`本波击杀 ${target} 只敌人`, `Kill ${target} enemies this wave`];
    case 'few_hits':
      return [`本波受伤不超过 ${target} 次`, `Get hit at most ${target} times this wave`];
    case 'combo':
      return [`${time} 秒内连续击杀 ${target} 只`, `Kill ${target} enemies within any ${time}s`];
  }
}

function buildQuest(id: WaveQuestId, wave: number): ActiveQuest {
  const t = QUEST_TUNING;
  let target = 1;
  let timeLimit = 0;
  if (id === 'speed_kill') {
    target = t.speedKills(wave);
    timeLimit = t.speedTime;
  } else if (id === 'kill_count') target = t.killCount(wave);
  else if (id === 'aura_kill') target = t.auraKills(wave);
  else if (id === 'few_hits') target = t.maxHits;
  else if (id === 'combo') {
    target = t.comboKills(wave);
    timeLimit = t.comboWindow;
  }
  const def = WAVE_QUEST_MAP[id];
  return { id, icon: def.icon, name: def.name, desc: describe(id, target, timeLimit), wave, target, timeLimit };
}

/** 本波可抽的任务池 */
export function questPool(opts: QuestStartOpts = {}): WaveQuestDef[] {
  return WAVE_QUESTS.filter((q) => {
    if (opts.isBoss && !q.boss) return false;
    if (q.needs === 'elite' && !opts.hasElite) return false;
    if (q.needs === 'skill' && !opts.hasSkill) return false;
    if (q.needs === 'aura' && !opts.hasAura) return false;
    return true;
  });
}

/** 按概率与权重决定本波任务（纯函数，rng 可注入） */
export function rollQuest(wave: number, rng: Rand, opts: QuestStartOpts = {}): WaveQuestId | null {
  if (opts.force) return opts.force;
  if (wave < QUEST_TUNING.fromWave) return null;
  if (rng() >= (opts.chance ?? QUEST_TUNING.chance)) return null;
  const pool = questPool(opts);
  const total = pool.reduce((s, q) => s + q.weight, 0);
  if (total <= 0) return null;
  let x = rng() * total;
  for (const q of pool) {
    x -= q.weight;
    if (x < 0) return q.id;
  }
  return pool[pool.length - 1].id;
}

export class WaveQuestTracker {
  quest: ActiveQuest | null = null;
  state: QuestState = 'active';
  kills = 0;
  eliteKills = 0;
  auraKills = 0;
  hits = 0;
  skills = 0;
  elapsed = 0;
  /** 连斩：最近击杀的时间戳 */
  private killTimes: number[] = [];
  private bestCombo = 0;
  private lastReadState: QuestState = 'active';

  /** 每波开始调用；返回本波任务（可能为 null） */
  start(wave: number, rng: Rand, opts: QuestStartOpts = {}): ActiveQuest | null {
    this.reset();
    const id = rollQuest(wave, rng, opts);
    this.quest = id ? buildQuest(id, wave) : null;
    return this.quest;
  }

  reset(): void {
    this.quest = null;
    this.state = 'active';
    this.lastReadState = 'active';
    this.kills = this.eliteKills = this.auraKills = this.hits = this.skills = 0;
    this.elapsed = 0;
    this.killTimes = [];
    this.bestCombo = 0;
  }

  get active(): boolean {
    return !!this.quest && this.state === 'active';
  }

  private done(): void {
    if (this.state === 'active') this.state = 'done';
  }
  private fail(): void {
    if (this.state === 'active') this.state = 'failed';
  }

  onKill(isElite = false, byAura = false): void {
    if (!this.active) return;
    const q = this.quest!;
    this.kills++;
    if (isElite) this.eliteKills++;
    if (byAura) this.auraKills++;
    switch (q.id) {
      case 'speed_kill':
      case 'kill_count':
        if (this.kills >= q.target) this.done();
        break;
      case 'elite_kill':
        if (this.eliteKills >= 1) this.done();
        break;
      case 'aura_kill':
        if (this.auraKills >= q.target) this.done();
        break;
      case 'combo': {
        this.killTimes.push(this.elapsed);
        const from = this.elapsed - q.timeLimit;
        while (this.killTimes.length && this.killTimes[0] < from) this.killTimes.shift();
        this.bestCombo = Math.max(this.bestCombo, this.killTimes.length);
        if (this.killTimes.length >= q.target) this.done();
        break;
      }
    }
  }

  onHurt(): void {
    if (!this.active) return;
    this.hits++;
    const q = this.quest!;
    if (q.id === 'no_hurt') this.fail();
    else if (q.id === 'few_hits' && this.hits > q.target) this.fail();
  }

  onSkill(): void {
    if (!this.active) return;
    this.skills++;
    if (this.quest!.id === 'no_skill') this.fail();
  }

  tick(dt: number): void {
    if (!this.active) return;
    this.elapsed += dt;
    const q = this.quest!;
    if (q.id === 'speed_kill' && this.elapsed > q.timeLimit) this.fail();
    else if (q.id === 'combo') {
      const from = this.elapsed - q.timeLimit;
      while (this.killTimes.length && this.killTimes[0] < from) this.killTimes.shift();
    }
  }

  /** HUD 用的进度；无任务时为 null */
  status(): QuestStatus | null {
    const q = this.quest;
    if (!q) return null;
    let progress = 0;
    let zh = '';
    let en = '';
    switch (q.id) {
      case 'no_hurt':
      case 'no_skill':
        progress = this.state === 'failed' ? 0 : 1;
        zh = q.desc[0];
        en = q.desc[1];
        break;
      case 'few_hits':
        progress = this.state === 'failed' ? 0 : 1 - this.hits / (q.target + 1);
        zh = `受伤 ${this.hits}/${q.target}`;
        en = `Hits ${this.hits}/${q.target}`;
        break;
      case 'speed_kill': {
        const left = Math.max(0, Math.ceil(q.timeLimit - this.elapsed));
        progress = Math.min(1, this.kills / q.target);
        zh = `击杀 ${Math.min(this.kills, q.target)}/${q.target} · 剩 ${left} 秒`;
        en = `Kills ${Math.min(this.kills, q.target)}/${q.target} · ${left}s left`;
        break;
      }
      case 'kill_count':
        progress = Math.min(1, this.kills / q.target);
        zh = `击杀 ${Math.min(this.kills, q.target)}/${q.target}`;
        en = `Kills ${Math.min(this.kills, q.target)}/${q.target}`;
        break;
      case 'aura_kill':
        progress = Math.min(1, this.auraKills / q.target);
        zh = `光环击杀 ${Math.min(this.auraKills, q.target)}/${q.target}`;
        en = `Aura kills ${Math.min(this.auraKills, q.target)}/${q.target}`;
        break;
      case 'elite_kill':
        progress = Math.min(1, this.eliteKills);
        zh = `精英 ${Math.min(this.eliteKills, 1)}/1`;
        en = `Elites ${Math.min(this.eliteKills, 1)}/1`;
        break;
      case 'combo': {
        const n = this.state === 'done' ? q.target : this.killTimes.length;
        progress = Math.min(1, n / q.target);
        zh = `连斩 ${n}/${q.target}（最佳 ${Math.max(this.bestCombo, n)}）`;
        en = `Spree ${n}/${q.target} (best ${Math.max(this.bestCombo, n)})`;
        break;
      }
    }
    if (this.state === 'done') {
      zh = `✔ ${zh}`;
      en = `✔ ${en}`;
    } else if (this.state === 'failed') {
      zh = `✘ ${zh}`;
      en = `✘ ${en}`;
    }
    const changed = this.state !== this.lastReadState;
    this.lastReadState = this.state;
    return { id: q.id, icon: q.icon, name: q.name, text: [zh, en], progress, state: this.state, changed };
  }

  /** 波末结算：「保持型」任务（不受伤、不用技能、少受伤）在此判定完成，其余未完成即失败。返回奖励或 null，并清空任务 */
  finish(): QuestReward | null {
    const q = this.quest;
    if (!q) return null;
    if (this.state === 'active') {
      if (q.id === 'no_hurt' || q.id === 'no_skill' || q.id === 'few_hits') this.done();
      else this.fail();
    }
    const reward = this.state === 'done' ? questReward(q.id, q.wave) : null;
    this.reset();
    return reward;
  }
}

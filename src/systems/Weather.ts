// H6：天气系统（纯逻辑与数据，不依赖 Phaser / RunState）。
//
// 天气按章节权重随机，前 2 波固定晴天，之后每 WEATHER_INTERVAL 波可能变化一次。
// 每种天气给玩家一组 StatMods、给规则层一条可选 RuleDelta（仅用 danger.ts 已有字段），并附带视觉参数。
//
// ── 主代理接线步骤 ─────────────────────────────────────────────────────────────
// 1. 每波开始（RunEvents.applyWaveRules() 旁边）：
//      const wid = weatherForWave(run.chapterId, run.wave, String(run.challenge?.seed ?? run.startedAt), {
//        enabled: !run.challenge && !<练习模式>,
//      });
//      const w = WEATHER_MAP[wid];
//      if (w.rule) run.extraRules[WEATHER_RULE_KEY] = w.rule; else delete run.extraRules[WEATHER_RULE_KEY];
//      run.dirty();
//    weatherForWave 由「局种子 + 章节 + 天气段」决定，读档后同一波天气不变，无需存档字段。
// 2. 玩家属性：在 RunState.stats() 汇总处 `addMods(s, WEATHER_MAP[当前天气].mods)`
//    （当前天气可存为 run 上的非持久字段，如 run.weather = wid，每波开始时写入）。
//    换天气后需让属性缓存失效（与 addMods / dirty 同一套机制）。
// 3. 表现（GameScene）：读 w.visual —— kind 决定粒子形状（rain 竖线 / snow 圆点 / dust 小方块 /
//    leaf 斜线），color / alpha、density（每秒粒子数，按 960 宽屏）、angle（下落方向，度，0 = 正下方，
//    正值向右偏）、speed（像素/秒）；overlay / overlayAlpha 为全屏叠色（雾、暴雪变暗）。
// 4. HUD：天气变化的那一波（isWeatherChangeWave 或 wid 与上一波不同）弹出 `${w.icon} ${tx(...w.name)}`
//    与 describeWeather(w)（属性部分可再拼上 relics.ts 的 describeRule(w.rule)）。
// ─────────────────────────────────────────────────────────────────────────────
import type { RuleDelta } from '../data/danger';
import { describeMods, type StatMods } from '../data/stats';
import { hashSeed, mulberry32, type Rand } from './Rng';

export type WeatherId = 'clear' | 'rain' | 'drought' | 'wind' | 'fog' | 'blizzard';

export interface WeatherVisual {
  kind: 'none' | 'rain' | 'snow' | 'dust' | 'leaf';
  color: number;
  alpha: number;
  /** 每秒生成粒子数 */
  density: number;
  /** 下落方向（度）：0 = 正下方，正值向右偏 */
  angle: number;
  /** 粒子速度（像素/秒） */
  speed: number;
  /** 全屏叠色 */
  overlay: number;
  overlayAlpha: number;
}

export interface WeatherDef {
  id: WeatherId;
  icon: string;
  name: [string, string];
  desc: [string, string];
  /** 给玩家的属性修正 */
  mods: StatMods;
  /** 规则层修正（敌人移速、治疗、收入……） */
  rule?: RuleDelta;
  visual: WeatherVisual;
}

export const WEATHER_RULE_KEY = 'weather';
/** 第 1..WEATHER_CLEAR_WAVES 波固定晴天 */
export const WEATHER_CLEAR_WAVES = 2;
/** 每多少波可能换一次天气 */
export const WEATHER_INTERVAL = 3;

const NONE_VISUAL: WeatherVisual = {
  kind: 'none',
  color: 0xffffff,
  alpha: 0,
  density: 0,
  angle: 0,
  speed: 0,
  overlay: 0x000000,
  overlayAlpha: 0,
};

export const WEATHERS: WeatherDef[] = [
  {
    id: 'clear',
    icon: '☀️',
    name: ['晴天', 'Clear'],
    desc: ['风和日丽，一切如常', 'Calm skies, nothing special'],
    mods: {},
    visual: NONE_VISUAL,
  },
  {
    id: 'rain',
    icon: '🌧️',
    name: ['雨天', 'Rain'],
    desc: ['地面湿滑，跑得更快，敌人也更急躁', 'Slippery ground: you move faster, so do enemies'],
    mods: { speed: 10, elementalPct: -5 },
    rule: { enemySpeed: 5 },
    visual: { kind: 'rain', color: 0x8ec5ff, alpha: 0.55, density: 120, angle: 10, speed: 700, overlay: 0x1a2a4a, overlayAlpha: 0.12 },
  },
  {
    id: 'drought',
    icon: '🏜️',
    name: ['干旱', 'Drought'],
    desc: ['酷热难耐，治疗减弱，但收获更丰', 'Scorching heat: weaker healing, richer harvest'],
    mods: { elementalPct: 10, regen: -2 },
    rule: { heal: -25, income: 15 },
    visual: { kind: 'dust', color: 0xe8c07a, alpha: 0.4, density: 30, angle: 70, speed: 120, overlay: 0xffa040, overlayAlpha: 0.1 },
  },
  {
    id: 'wind',
    icon: '🌬️',
    name: ['大风', 'Gale'],
    desc: ['狂风扰乱弹道，却更容易闪开攻击', 'Gusts throw off projectiles but help you dodge'],
    mods: { dodge: 5, rangedPct: -10, pickup: 30 },
    rule: { enemySpeed: -5 },
    visual: { kind: 'leaf', color: 0xb8d68a, alpha: 0.6, density: 25, angle: 75, speed: 380, overlay: 0x000000, overlayAlpha: 0 },
  },
  {
    id: 'fog',
    icon: '🌫️',
    name: ['浓雾', 'Fog'],
    desc: ['视野受限，射程缩短，精英藏在雾里，经验更多', 'Low visibility: shorter range, more champions, more XP'],
    mods: { range: -40 },
    rule: { champ: 30, xp: 15 },
    visual: { kind: 'none', color: 0xdddddd, alpha: 0, density: 0, angle: 0, speed: 0, overlay: 0xd8dde3, overlayAlpha: 0.28 },
  },
  {
    id: 'blizzard',
    icon: '🌨️',
    name: ['暴风雪', 'Blizzard'],
    desc: ['寒风刺骨，所有人都慢了下来', 'Freezing winds slow everyone down'],
    mods: { speed: -8, attackSpeed: -5 },
    rule: { enemySpeed: -15, xp: 10 },
    visual: { kind: 'snow', color: 0xffffff, alpha: 0.85, density: 90, angle: 25, speed: 220, overlay: 0xcfe6ff, overlayAlpha: 0.15 },
  },
];
export const WEATHER_MAP = Object.fromEntries(WEATHERS.map((w) => [w.id, w])) as Record<WeatherId, WeatherDef>;

/** 章节天气权重（id 1–7）：厨房多晴/雾（蒸汽），菜园多雨风，冰箱暴雪，垃圾场风沙，番茄酱厂干旱，温室雨雾，腐烂菜园雨雾风 */
export const CHAPTER_WEATHER: Record<number, Partial<Record<WeatherId, number>>> = {
  1: { clear: 60, fog: 20, rain: 10, drought: 10 },
  2: { clear: 35, rain: 30, wind: 20, drought: 15 },
  3: { clear: 25, blizzard: 50, fog: 20, wind: 5 },
  4: { clear: 30, wind: 30, drought: 25, rain: 15 },
  5: { clear: 30, drought: 45, fog: 25 },
  6: { clear: 30, rain: 35, fog: 30, drought: 5 },
  7: { clear: 25, rain: 30, fog: 25, wind: 20 },
};
export const DEFAULT_WEATHER_WEIGHTS: Partial<Record<WeatherId, number>> = { clear: 40, rain: 15, drought: 15, wind: 15, fog: 15 };

export interface WeatherOpts {
  /** false = 关闭天气（挑战 / 练习模式），总是晴天 */
  enabled?: boolean;
  /** 上一波的天气；非换天气波时沿用（rollWeather 用） */
  prev?: WeatherId;
  /** 覆盖换天气间隔 */
  interval?: number;
}

/** 本波是否是「可能换天气」的波 */
export const isWeatherChangeWave = (wave: number, interval = WEATHER_INTERVAL): boolean =>
  wave > WEATHER_CLEAR_WAVES && (wave - WEATHER_CLEAR_WAVES - 1) % interval === 0;

/** 天气段编号：同一段内天气相同（前 2 波为 -1） */
export const weatherSegment = (wave: number, interval = WEATHER_INTERVAL): number =>
  wave <= WEATHER_CLEAR_WAVES ? -1 : Math.floor((wave - WEATHER_CLEAR_WAVES - 1) / interval);

/** 按章节权重抽一个天气 */
export function pickWeather(chapterId: number, rng: Rand): WeatherId {
  const weights = CHAPTER_WEATHER[chapterId] ?? DEFAULT_WEATHER_WEIGHTS;
  const entries = WEATHERS.map((w) => [w.id, weights[w.id] ?? 0] as const).filter(([, v]) => v > 0);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  let x = rng() * total;
  for (const [id, v] of entries) {
    x -= v;
    if (x < 0) return id;
  }
  return entries[entries.length - 1][0];
}

/** 有状态版本：给出上一波天气 prev，非换天气波沿用；换天气波按章节权重重抽 */
export function rollWeather(chapterId: number, wave: number, rng: Rand, opts: WeatherOpts = {}): WeatherId {
  if (opts.enabled === false || wave <= WEATHER_CLEAR_WAVES) return 'clear';
  const interval = opts.interval ?? WEATHER_INTERVAL;
  if (opts.prev && !isWeatherChangeWave(wave, interval)) return opts.prev;
  return pickWeather(chapterId, rng);
}

/** 无状态版本（推荐）：由局种子 + 章节 + 天气段确定，读档后不变 */
export function weatherForWave(chapterId: number, wave: number, seed: string, opts: WeatherOpts = {}): WeatherId {
  if (opts.enabled === false || wave <= WEATHER_CLEAR_WAVES) return 'clear';
  const seg = weatherSegment(wave, opts.interval ?? WEATHER_INTERVAL);
  return pickWeather(chapterId, mulberry32(hashSeed(`${seed}:weather:${chapterId}:${seg}`)));
}

/** 天气说明：文案 + 属性修正（规则部分可由 describeRule(w.rule) 补充） */
export const describeWeather = (w: WeatherDef, lang: 0 | 1 = 0): string[] => [w.desc[lang], ...describeMods(w.mods)];

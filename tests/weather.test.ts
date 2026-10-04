// H6：天气——数据合法性（属性键 / 规则键 / 中英文）、章节权重、确定性与换天气节奏
import { describe, it, expect } from 'vitest';
import {
  WEATHERS,
  WEATHER_MAP,
  CHAPTER_WEATHER,
  WEATHER_CLEAR_WAVES,
  WEATHER_INTERVAL,
  rollWeather,
  weatherForWave,
  pickWeather,
  isWeatherChangeWave,
  weatherSegment,
  describeWeather,
  type WeatherId,
} from '../src/systems/Weather';
import { BASE_STATS } from '../src/data/stats';
import { mulberry32 } from '../src/systems/Rng';

const RULE_KEYS = [
  'enemyHp',
  'enemyDmg',
  'enemySpeed',
  'spawn',
  'champ',
  'eliteHp',
  'eliteAffix',
  'bossSkill',
  'shopPrice',
  'rerollPrice',
  'heal',
  'xp',
  'income',
];

describe('天气数据', () => {
  it('6 种，id 唯一，中英文非空', () => {
    expect(WEATHERS.length).toBe(6);
    expect(new Set(WEATHERS.map((w) => w.id)).size).toBe(6);
    for (const w of WEATHERS) {
      for (const s of [...w.name, ...w.desc]) expect(s.trim().length, w.id).toBeGreaterThan(0);
      expect(describeWeather(w, 0).length).toBeGreaterThan(0);
      expect(describeWeather(w, 1)[0]).toBe(w.desc[1]);
    }
  });
  it('mods 键都属于 BASE_STATS，数值有限', () => {
    for (const w of WEATHERS)
      for (const [k, v] of Object.entries(w.mods)) {
        expect(BASE_STATS, `${w.id}.${k}`).toHaveProperty(k);
        expect(Number.isFinite(v)).toBe(true);
      }
  });
  it('RuleDelta 键合法', () => {
    for (const w of WEATHERS) for (const k of Object.keys(w.rule ?? {})) expect(RULE_KEYS, `${w.id}.${k}`).toContain(k);
  });
  it('晴天无修正；其余天气都有效果；雨天加移速、干旱减治疗', () => {
    expect(WEATHER_MAP.clear.mods).toEqual({});
    expect(WEATHER_MAP.clear.rule).toBeUndefined();
    for (const w of WEATHERS.filter((x) => x.id !== 'clear'))
      expect(Object.keys(w.mods).length + Object.keys(w.rule ?? {}).length).toBeGreaterThan(0);
    expect(WEATHER_MAP.rain.mods.speed!).toBeGreaterThan(0);
    expect(WEATHER_MAP.drought.rule!.heal!).toBeLessThan(0);
  });
  it('视觉参数合法', () => {
    for (const w of WEATHERS) {
      const v = w.visual;
      expect(v.alpha).toBeGreaterThanOrEqual(0);
      expect(v.alpha).toBeLessThanOrEqual(1);
      expect(v.overlayAlpha).toBeGreaterThanOrEqual(0);
      expect(v.overlayAlpha).toBeLessThanOrEqual(1);
      expect(v.density).toBeGreaterThanOrEqual(0);
      if (v.kind !== 'none') expect(v.density).toBeGreaterThan(0);
    }
  });
  it('章节 1–7 都有权重，且只引用已有天气', () => {
    for (let c = 1; c <= 7; c++) {
      const w = CHAPTER_WEATHER[c];
      expect(w, `chapter ${c}`).toBeTruthy();
      for (const k of Object.keys(w)) expect(WEATHER_MAP).toHaveProperty(k);
    }
  });
});

describe('天气判定', () => {
  it('前 2 波固定晴天；关闭时总是晴天', () => {
    for (let wave = 1; wave <= WEATHER_CLEAR_WAVES; wave++) {
      expect(rollWeather(3, wave, () => 0.5)).toBe('clear');
      expect(weatherForWave(3, wave, 'seed')).toBe('clear');
    }
    for (let wave = 1; wave <= 30; wave++) {
      expect(rollWeather(3, wave, () => 0.5, { enabled: false })).toBe('clear');
      expect(weatherForWave(3, wave, 'seed', { enabled: false })).toBe('clear');
    }
  });
  it('确定性：同 rng / 同种子结果一致', () => {
    const a = Array.from({ length: 20 }, () => pickWeather(2, mulberry32(9)));
    expect(new Set(a).size).toBe(1);
    const seq = (s: string) => Array.from({ length: 30 }, (_, i) => weatherForWave(4, i + 1, s));
    expect(seq('abc')).toEqual(seq('abc'));
  });
  it('换天气节奏：同一段内天气不变', () => {
    expect(isWeatherChangeWave(WEATHER_CLEAR_WAVES)).toBe(false);
    expect(isWeatherChangeWave(WEATHER_CLEAR_WAVES + 1)).toBe(true);
    expect(isWeatherChangeWave(WEATHER_CLEAR_WAVES + 2)).toBe(false);
    expect(isWeatherChangeWave(WEATHER_CLEAR_WAVES + 1 + WEATHER_INTERVAL)).toBe(true);
    for (const seed of ['s1', 's2', 's3', 's4'])
      for (let wave = WEATHER_CLEAR_WAVES + 1; wave <= 40; wave++)
        if (!isWeatherChangeWave(wave)) {
          expect(weatherSegment(wave)).toBe(weatherSegment(wave - 1));
          expect(weatherForWave(5, wave, seed)).toBe(weatherForWave(5, wave - 1, seed));
        }
  });
  it('rollWeather：非换天气波沿用 prev，换天气波重抽', () => {
    const w = WEATHER_CLEAR_WAVES + 2;
    expect(rollWeather(1, w, () => 0, { prev: 'fog' })).toBe('fog');
    expect(rollWeather(1, WEATHER_CLEAR_WAVES + 1, () => 0, { prev: 'fog' })).toBe(pickWeather(1, () => 0));
  });
  it('章节权重：冰箱章暴风雪最多，厨房章不下暴风雪', () => {
    const count = (chapter: number) => {
      const r = mulberry32(1234);
      const c: Partial<Record<WeatherId, number>> = {};
      for (let i = 0; i < 4000; i++) {
        const id = pickWeather(chapter, r);
        c[id] = (c[id] ?? 0) + 1;
      }
      return c;
    };
    const fridge = count(3);
    const top = Object.entries(fridge).sort((a, b) => b[1]! - a[1]!)[0][0];
    expect(top).toBe('blizzard');
    expect(count(1).blizzard ?? 0).toBe(0);
    expect(count(5).drought!).toBeGreaterThan(count(1).drought ?? 0);
  });
  it('未知章节用默认权重，不抛错', () => {
    expect(WEATHER_MAP).toHaveProperty(pickWeather(99, mulberry32(3)));
  });
});

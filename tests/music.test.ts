// 程序化音乐自检：所有章节曲目都有曲谱；曲谱结构合法（16 步型、和弦级数、调式、速度）；1.4.0 新曲与切换规则
import { describe, it, expect } from 'vitest';
import { TRACKS, ENDLESS_DEEP_WAVE, stageMusic, bossMusic, type TrackSpec } from '../src/systems/Music';
import { CHAPTERS } from '../src/data/chapters';
import { EXTRA_CHAPTERS, EXTRA_MUSIC_FALLBACK } from '../src/data/chaptersExtra';

const NEW_TRACKS = ['bgm_greenhouse', 'bgm_rotgarden', 'bgm_endless_deep'];
const DRUMS = ['kick', 'snare', 'clap', 'hat', 'open'] as const;

describe('Music 曲目', () => {
  it('每个章节（含第 6 / 7 章）的 music 都存在于 TRACKS', () => {
    for (const ch of CHAPTERS) expect(TRACKS[ch.music], `第 ${ch.id} 章 ${ch.music}`).toBeDefined();
  });

  it('第 6 / 7 章直接使用新曲，不再回退', () => {
    expect(CHAPTERS.find((c) => c.id === 6)?.music).toBe('bgm_greenhouse');
    expect(CHAPTERS.find((c) => c.id === 7)?.music).toBe('bgm_rotgarden');
    for (const c of EXTRA_CHAPTERS) expect(EXTRA_MUSIC_FALLBACK[c.music]).toBeUndefined();
  });

  it('新增三首曲目已定义且彼此风格不同（速度 / 调式不重复）', () => {
    const specs = NEW_TRACKS.map((k) => TRACKS[k]);
    for (const [i, s] of specs.entries()) expect(s, NEW_TRACKS[i]).toBeDefined();
    expect(new Set(specs.map((s) => s.bpm)).size).toBe(3);
    expect(new Set(specs.map((s) => s.scale.join())).size).toBe(3);
  });

  it.each(Object.entries(TRACKS))('%s 结构合法', (key, t: TrackSpec) => {
    expect(t.bpm, key).toBeGreaterThanOrEqual(60);
    expect(t.bpm, key).toBeLessThanOrEqual(200);
    expect(t.root).toBeGreaterThanOrEqual(24);
    expect(t.root).toBeLessThanOrEqual(60);
    // 调式：7 个音、从 0 起严格递增且在一个八度内（chordTones / makeMelody 按 7 声音阶取模）
    expect(t.scale).toHaveLength(7);
    expect(t.scale[0]).toBe(0);
    for (let i = 1; i < 7; i++) expect(t.scale[i]).toBeGreaterThan(t.scale[i - 1]);
    expect(t.scale[6]).toBeLessThan(12);
    // 和弦进行：非空，级数 0~6
    expect(t.prog.length).toBeGreaterThan(0);
    for (const d of t.prog) expect(Number.isInteger(d) && d >= 0 && d <= 6).toBe(true);
    // 鼓型：16 步，仅 x / X / .
    for (const k of DRUMS) {
      const p = t[k];
      if (p === undefined) continue;
      expect(p, `${key}.${k}`).toMatch(/^[xX.]{16}$/);
    }
    expect(t.kick).toMatch(/x/i);
    // 贝斯：16 步，0~3 和弦音 / 7 高八度 / 休止，且至少一个音
    expect(t.bass).toMatch(/^[01237.]{16}$/);
    expect(t.bass).toMatch(/[01237]/);
    if (t.arp !== undefined) expect(t.arp).toMatch(/^[0123.]{16}$/);
    expect(t.bassCut).toBeGreaterThan(0);
    if (t.swing !== undefined) expect(t.swing >= 0 && t.swing < 0.5).toBe(true);
    if (t.lead) {
      expect(t.lead.density > 0 && t.lead.density <= 1).toBe(true);
      expect(t.lead.oct >= 1 && t.lead.oct <= 3).toBe(true);
    }
    if (t.vol !== undefined) expect(t.vol > 0 && t.vol <= 1.2).toBe(true);
  });
});

describe('曲目切换规则', () => {
  it('无尽模式第 30 波起切到 bgm_endless_deep', () => {
    expect(ENDLESS_DEEP_WAVE).toBe(30);
    expect(stageMusic('bgm_kitchen', 29, true)).toBe('bgm_kitchen');
    expect(stageMusic('bgm_kitchen', 30, true)).toBe('bgm_endless_deep');
    expect(stageMusic('bgm_kitchen', 45, false)).toBe('bgm_kitchen');
  });
  it('真结局 Boss 用 bgm_rotgarden，其它 Boss 用 bgm_boss', () => {
    expect(bossMusic(true)).toBe('bgm_rotgarden');
    expect(bossMusic(false)).toBe('bgm_boss');
    expect(TRACKS[bossMusic(true)]).toBeDefined();
  });
});

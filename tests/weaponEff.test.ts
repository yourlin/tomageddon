import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { weaponFingerprints } from '../src/systems/weaponFingerprint';
import { WEAPON_MAP } from '../src/data/weapons';
import { StatusSet } from '../src/systems/Status';
// @ts-expect-error 纯 JS 脚本，没有类型声明
import { summarizeRun, mergeArchives } from '../scripts/weapon-eff.mjs';

describe('武器数值指纹', () => {
  it('每把武器都有指纹，重复计算结果一致', () => {
    const a = weaponFingerprints();
    expect(Object.keys(a.weapons).length).toBe(Object.keys(WEAPON_MAP).length);
    expect(a.global).toMatch(/^[0-9a-f]{8}$/);
    expect(weaponFingerprints()).toEqual(a);
  });
  it('不同武器的指纹基本不撞', () => {
    const fps = Object.values(weaponFingerprints().weapons);
    expect(new Set(fps).size).toBeGreaterThan(fps.length * 0.99);
  });
});

/** 造一局：两波快照，第 2 波里 gun@T1 纸面 10 DPS、打满 10 秒、实际造成 300 伤害（转换率 300%） */
const fakeRun = (key: string, dmg = 300) => ({
  key,
  ch: 1,
  win: true,
  waves: [{ wave: 1, paperT: { gun: [[0, 10]] }, dmgBy: { gun: 0 }, wl: { sec: 10 } }],
  final: { wave: 2, paperT: { gun: [[0, 10]] }, dmgBy: { gun: dmg }, wl: { sec: 10 } },
});

describe('转换率存档与合并', () => {
  let dir = '';
  afterEach(() => dir && rmSync(dir, { recursive: true, force: true }));
  const save = (name: string, a: object) => writeFileSync(join(dir, name), JSON.stringify(a));
  const now = Date.UTC(2026, 9, 16);
  const fp = { global: 'g1', weapons: { gun: 'w1' } };

  it('单次测试：按武器×品质×章节汇总出转换率', () => {
    const a = summarizeRun({ version: 't', fp, finishedAt: now }, [fakeRun('a')]);
    expect(a.samples['gun@0@c1']).toMatchObject({ n: 1, runs: 1, paper: 100, dmg: 300 });
    // 没有出怪数 → 记在「稀」档
    expect(a.samples['gun@0@c1'].b).toEqual([
      [1, 100, 300],
      [0, 0, 0],
      [0, 0, 0],
    ]);
    expect(a.usage.gun.games).toBe(1);
  });

  it('只作废改动过的那一章的样本，其他章照常合并', () => {
    dir = mkdtempSync(join(tmpdir(), 'eff-'));
    const out = pathToFileURL(dir + '/');
    const old = { ...fp, chapters: { 1: 'c1', 2: 'c2' } };
    const cur = { ...fp, chapters: { 1: 'c1', 2: 'c2-new' } };
    save(
      'eff-20261016-000000-natural.json',
      summarizeRun({ version: 't', fp: old, finishedAt: now }, [fakeRun('a', 300), { ...fakeRun('b', 900), ch: 2 }]),
    );
    const m = mergeArchives({ fp: cur, now, outDir: out });
    expect(m.weapons.gun[0].n).toBe(1);
    expect(m.weapons.gun[0].eff).toBeCloseTo(3, 2);
    expect(m.weapons.gun[0].files).toBe(1);
    expect(m.excludedChapters).toBe(1);
  });

  it('只合并指纹一致的存档，旧样本按半衰期降权', () => {
    dir = mkdtempSync(join(tmpdir(), 'eff-'));
    const out = pathToFileURL(dir + '/');
    // 当前、7 天前（同指纹，权重 0.5）、全局指纹不同、武器指纹不同
    save('eff-20261016-000000-natural.json', summarizeRun({ version: 't', fp, finishedAt: now }, [fakeRun('a', 300)]));
    save(
      'eff-20261009-000000-focus.json',
      summarizeRun({ version: 't', fp, finishedAt: now - 7 * 86400000, mode: 'focus' }, [fakeRun('b', 100)]),
    );
    save(
      'eff-20261008-000000-natural.json',
      summarizeRun({ version: 't', fp: { ...fp, global: 'g0' }, finishedAt: now }, [fakeRun('c', 900)]),
    );
    save(
      'eff-20261007-000000-natural.json',
      summarizeRun({ version: 't', fp: { global: 'g1', weapons: { gun: 'w0' } }, finishedAt: now }, [fakeRun('d', 900)]),
    );
    const m = mergeArchives({ fp, halfLife: 7, now, outDir: out });
    const t = m.weapons.gun[0];
    expect(t.n).toBe(2);
    expect(t.focusN).toBe(1);
    expect(t.natN).toBe(1);
    // (300 + 100 × 0.5) ÷ (100 + 100 × 0.5) = 350 / 150
    expect(t.eff).toBeCloseTo(350 / 150, 2);
    expect(m.sources.filter((s: { used: boolean }) => s.used)).toHaveLength(3);
    expect(m.excludedWeapons).toBe(1);
    // 使用统计只取最新一份可用的普通测试
    expect(m.usageFrom.file).toBe('eff-20261016-000000-natural.json');
  });
});

describe('易伤辅助归属', () => {
  it('StatusSet.amp 按施加者汇总易伤，没有来源的不计', () => {
    const st = new StatusSet();
    st.apply({ id: 'vulnerable', dur: 3, src: 'aura_a' });
    st.apply({ id: 'freeze', dur: 3, src: 'ice_b' });
    st.apply({ id: 'weaken', dur: 3, src: 'ice_b' }); // 只降伤害，不算易伤
    st.update(0.01);
    const amp = Object.fromEntries(st.amp);
    expect(amp.aura_a).toBeGreaterThan(0);
    expect(amp.ice_b).toBe(20);
    expect(st.totals.dmgTaken).toBe(amp.aura_a + amp.ice_b);
  });
});

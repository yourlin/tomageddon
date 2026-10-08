// I1 / I3 / D8 / J2 / J4 / J5：大师层、收藏度、个人最佳、构筑分享码、自定义挑战、战绩筛选
import { describe, it, expect, beforeEach } from 'vitest';
import { run } from '../src/systems/RunState';
import { save, type RunRecord } from '../src/systems/Save';
import { encodeBuild, decodeBuild, snapshotRun, applySnapshot, BUILD_PREFIX } from '../src/systems/BuildCode';
import { masterMods, masterCost, buyMaster, masterUnlocked, MASTER_CYCLE } from '../src/systems/TalentTree';
import { TALENT_NODES } from '../src/data/talentTree';
import { freeKey, parseFreeKey, makeFreeChallenge, parseChallengeCode, challengeCode, MODIFIERS } from '../src/data/challenges';
import { filterHistory, personalBests } from '../src/scenes/HistoryScene';
import { collectionRows, collectionPercent } from '../src/scenes/CollectionScene';

describe('J2 构筑分享码', () => {
  it('编码后解码得到同一构筑，并能写回 run', () => {
    run.start('tomato', 2);
    run.level = 12;
    run.wave = 9;
    run.items = { [Object.keys(run.items)[0] ?? 'helmet']: 2 };
    run.levelMods = { damage: 7, maxHp: 12 };
    const snap = snapshotRun(run);
    const code = encodeBuild(snap);
    expect(code.startsWith(BUILD_PREFIX)).toBe(true);
    const back = decodeBuild(code);
    expect(back).toEqual(snap);
    run.start('carrot', 1);
    applySnapshot(run, back!);
    expect(run.charId).toBe('tomato');
    expect(run.level).toBe(12);
    expect(run.weapons.map((w) => w.id)).toEqual(snap.w.map((w) => w[0]));
    expect(run.levelMods.damage).toBe(7);
  });
  it('拒绝伪造或损坏的分享码', () => {
    const snap = snapshotRun(run);
    expect(decodeBuild('hello')).toBeNull();
    expect(decodeBuild(BUILD_PREFIX + '!!!')).toBeNull();
    expect(decodeBuild(encodeBuild({ ...snap, c: 'nobody' }))).toBeNull();
    expect(decodeBuild(encodeBuild({ ...snap, w: [['laser_of_doom', 1]] }))).toBeNull();
    expect(decodeBuild(encodeBuild({ ...snap, w: [[snap.w[0][0], 9]] }))).toBeNull();
    expect(decodeBuild(encodeBuild({ ...snap, i: { not_an_item: 1 } }))).toBeNull();
    expect(decodeBuild(encodeBuild({ ...snap, m: { hacks: 1 } as never }))).toBeNull();
    expect(decodeBuild(encodeBuild({ ...snap, m: { damage: 1e9 } }))).toBeNull();
  });
});

describe('I1 大师层', () => {
  beforeEach(() => {
    save.talents = {};
    save.meta.master = 0;
    save.meta.gold = 0;
  });
  it('天赋没点满时不能买', () => {
    save.meta.gold = 9999;
    expect(masterUnlocked()).toBe(false);
    expect(buyMaster()).toBe(false);
  });
  it('点满后用金番茄购买，价格递增，属性按循环累加', () => {
    // 二选一的关键天赋每组只点一个（第二个选项不点）
    save.talents = Object.fromEntries(TALENT_NODES.filter((n) => !n.id.endsWith('_key2')).map((n) => [n.id, n.max]));
    save.meta.gold = masterCost(0) + masterCost(1) + 5;
    expect(buyMaster()).toBe(true);
    expect(buyMaster()).toBe(true);
    expect(buyMaster()).toBe(false);
    expect(save.meta.gold).toBe(5);
    expect(save.meta.master).toBe(2);
    const m = masterMods(MASTER_CYCLE.length * 2);
    for (const [k, v] of MASTER_CYCLE) expect(m[k]).toBeCloseTo(v * 2);
  });
});

describe('J4 自定义挑战', () => {
  it('key 可往返，分享码可解析回同一挑战', () => {
    const o = { charId: 'chili', chapterId: 3, endless: true, modifiers: [MODIFIERS[0].id, MODIFIERS[1].id] };
    expect(parseFreeKey(freeKey(o))).toEqual(o);
    const c = makeFreeChallenge(o);
    const back = parseChallengeCode(challengeCode(c));
    expect(back?.kind).toBe('free');
    expect(back?.charId).toBe('chili');
    expect(back?.modifiers).toEqual(o.modifiers);
  });
  it('非法 key 返回 null', () => {
    expect(parseFreeKey('nobody.1.n.')).toBeNull();
    expect(parseFreeKey('tomato.9.n.')).toBeNull();
    expect(parseFreeKey('tomato.1.x.')).toBeNull();
    expect(parseFreeKey('tomato.1.n.fake_mod')).toBeNull();
    expect(parseChallengeCode('free:garbage')).toBeNull();
  });
});

describe('J5 战绩筛选与 D8 个人最佳', () => {
  const rec = (o: Partial<RunRecord>): RunRecord =>
    ({
      t: 0,
      charId: 'tomato',
      chapterId: 1,
      endless: false,
      win: false,
      wave: 1,
      level: 1,
      kills: 0,
      sec: 0,
      weapons: [],
      items: 0,
      dmg: [],
      income: [],
      ...o,
    }) as RunRecord;
  const list = [
    rec({ t: 3, win: true, wave: 15, kills: 500 }),
    rec({ t: 2, wave: 7, kills: 900 }),
    rec({ t: 1, endless: true, wave: 40, kills: 3000 }),
    rec({ t: 4, challenge: { kind: 'daily', key: 'x', score: 10 }, wave: 3 }),
  ];
  it('按类型筛选', () => {
    expect(filterHistory(list, 'win', 'time').map((r) => r.t)).toEqual([3]);
    expect(filterHistory(list, 'lose', 'time').map((r) => r.t)).toEqual([2]);
    expect(filterHistory(list, 'endless', 'time').map((r) => r.t)).toEqual([1]);
    expect(filterHistory(list, 'challenge', 'time').map((r) => r.t)).toEqual([4]);
  });
  it('按字段降序排序，不改原数组', () => {
    expect(filterHistory(list, 'all', 'kills').map((r) => r.t)).toEqual([1, 2, 3, 4]);
    expect(filterHistory(list, 'all', 'time').map((r) => r.t)).toEqual([4, 3, 2, 1]);
    expect(list.map((r) => r.t)).toEqual([3, 2, 1, 4]);
  });
  it('个人最佳：无尽按波数降序，最快通关按章节升序', () => {
    save.meta.endlessBest = { tomato_1: 20, chili_2: 45 };
    save.meta.fastest = { '2_3': 600, '1_5': 700, '1_8': 800 };
    const b = personalBests();
    expect(b.endless[0]).toEqual(['chili_2', 45]);
    expect(b.fastest.map((x) => x[0])).toEqual(['1_8', '1_5', '2_3']);
  });
});

describe('I3 收藏度', () => {
  it('每项 have ≤ total，总完成度在 0~100', () => {
    const rows = collectionRows();
    expect(rows.length).toBeGreaterThanOrEqual(10);
    for (const r of rows) {
      expect(r.have).toBeGreaterThanOrEqual(0);
      expect(r.have).toBeLessThanOrEqual(r.total);
    }
    const p = collectionPercent(rows);
    expect(p).toBeGreaterThanOrEqual(0);
    expect(p).toBeLessThanOrEqual(100);
  });
});

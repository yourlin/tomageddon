import { describe, expect, it, vi } from 'vitest';
import { run, saveRun, loadRun } from '../src/systems/RunState';

describe('合成扣材料', () => {
  it('6 个 T1 番茄酱瓶：合成一次只消耗 1 把材料', () => {
    run.start('tomato', 1);
    run.weapons = [];
    for (let i = 0; i < 6; i++) run.addWeapon('ketchup', 0);
    const last = run.weapons[run.weapons.length - 1];
    const up = run.combine(last.uid);
    expect(up).toBeGreaterThan(0);
    expect(run.allWeapons).toHaveLength(5);
  });

  it('真实重启后读档再买武器：uid 不撞号，合成不会多扣', async () => {
    run.start('tomato', 1);
    run.weapons = [];
    for (let i = 0; i < 3; i++) run.addWeapon('ketchup', 0);
    run.weapons.forEach((w, i) => (w.uid = i + 1)); // 新开局的真实 uid 就是从 1 起
    saveRun();
    vi.resetModules(); // 模拟重启游戏：uidSeq 从 1 重新计数
    const m = await import('../src/systems/RunState');
    expect(m.loadRun()).toBe(true);
    for (let i = 0; i < 3; i++) m.run.addWeapon('ketchup', 0);
    const uids = m.run.allWeapons.map((w) => w.uid);
    expect(new Set(uids).size).toBe(uids.length);
    m.run.combine(m.run.weapons[5].uid);
    expect(m.run.allWeapons).toHaveLength(5);
  });

  it('已撞号的旧存档：读档时自动重新编号', () => {
    run.start('tomato', 1);
    run.weapons = [];
    for (let i = 0; i < 4; i++) run.addWeapon('ketchup', 0);
    run.weapons.forEach((w) => (w.uid = 1));
    saveRun();
    expect(loadRun()).toBe(true);
    const uids = run.allWeapons.map((w) => w.uid);
    expect(new Set(uids).size).toBe(uids.length);
    run.combine(run.weapons[3].uid);
    expect(run.allWeapons).toHaveLength(3);
  });
});

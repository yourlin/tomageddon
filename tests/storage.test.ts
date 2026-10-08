import { describe, expect, it, vi } from 'vitest';
import { run } from '../src/systems/RunState';
import { BALANCE } from '../src/data/balance';

describe('仓库', () => {
  it('武器栏满时买到的武器自动进仓库，仓库也满时不能再买', () => {
    run.start('tomato', 1);
    while (run.weapons.length < run.maxWeapons) run.addWeapon('knife', 0);
    expect(run.weapons).toHaveLength(run.maxWeapons);
    for (let i = 0; i < run.storageMax; i++) {
      expect(run.canAddWeapon('pan', 1)).toBe(true);
      run.addWeapon('pan', 1);
    }
    expect(run.storage).toHaveLength(BALANCE.storageSlots);
    expect(run.canAddWeapon('fork', 1)).toBe(false);
    run.addWeapon('fork', 1);
    expect(run.storage).toHaveLength(BALANCE.storageSlots);
  });

  it('存入 / 取回：武器栏至少留一把，栏位满时与指定武器对调', () => {
    run.start('tomato', 1);
    run.addWeapon('pan', 0);
    const [a, b] = run.weapons;
    expect(run.toStorage(a.uid)).toBe(true);
    expect(run.weapons.map((w) => w.uid)).toEqual([b.uid]);
    expect(run.inStorage(a.uid)).toBe(true);
    // 只剩一把时不能再存
    expect(run.toStorage(b.uid)).toBe(false);
    // 取回（栏位没满，直接回来）
    expect(run.fromStorage(a.uid)).toBe(true);
    expect(run.storage).toHaveLength(0);
    // 栏位满时必须指定对调的武器
    while (run.weapons.length < run.maxWeapons) run.addWeapon('fork', 0);
    run.addWeapon('ladle', 2);
    const st = run.storage[0];
    expect(run.fromStorage(st.uid)).toBe(false);
    expect(run.fromStorage(st.uid, b.uid)).toBe(true);
    expect(run.weapons.some((w) => w.uid === st.uid)).toBe(true);
    expect(run.inStorage(b.uid)).toBe(true);
  });

  it('仓库里的武器可以当合成材料', () => {
    run.start('tomato', 1);
    run.addWeapon('knife', 0);
    const stored = run.weapons.find((w) => w.id === 'knife')!;
    expect(run.toStorage(stored.uid)).toBe(true);
    run.addWeapon('knife', 0); // 栏位有空位，进武器栏
    const target = run.weapons.find((w) => w.id === 'knife')!;
    // 固定随机数避开 15% 的「合成暴击」（+2 级），否则 tier 时而是 2
    const rnd = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(run.combine(target.uid)).toBeGreaterThan(0);
    rnd.mockRestore();
    expect(target.tier).toBe(1);
    expect(run.storage).toHaveLength(0);
  });

  it('存档后恢复仓库', () => {
    run.start('tomato', 1);
    run.addWeapon('pan', 1);
    run.toStorage(run.weapons[0].uid);
    const ext = run.saveExt();
    run.start('carrot', 1);
    expect(run.storage).toHaveLength(0);
    run.loadExt(ext);
    expect(run.storage).toHaveLength(1);
  });
});

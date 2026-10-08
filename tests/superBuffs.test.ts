import { describe, expect, it } from 'vitest';
import { EVOLVED_WEAPONS } from '../src/data/evolutions';
import { WEAPON_MAP, WEAPONS } from '../src/data/weapons';
import { ALL_ITEMS } from '../src/data/items';
import { TALENT_NODES } from '../src/data/talentTree';
import { CHARACTERS } from '../src/data/characters';
import { AWAKENINGS } from '../src/data/awakenings';
import { SuperBuffs, superBuffText, type SuperBuffKind } from '../src/systems/SuperBuffs';
import { BALANCE } from '../src/data/balance';

const BUFFS: SuperBuffKind[] = ['rage', 'haste', 'focus', 'vampiric'];

describe('超武增益', () => {
  it('只有 8 把超武带增益，每种 2 把，都有中英文说明', () => {
    const withBuff = EVOLVED_WEAPONS.filter((w) => w.superBuff);
    expect(withBuff).toHaveLength(8);
    for (const k of BUFFS) {
      expect(
        withBuff.filter((w) => w.superBuff === k),
        k,
      ).toHaveLength(2);
      const [zh, en] = superBuffText(k);
      expect(zh.length).toBeGreaterThan(0);
      expect(/[一-鿿]/.test(en), `${k} 英文说明含中文`).toBe(false);
    }
    // 基础武器不带增益
    for (const w of WEAPONS.filter((x) => !x.evolvedFrom)) expect(w.superBuff, w.id).toBeUndefined();
  });

  it('道具、天赋、角色、觉醒都不再带这 4 种叠层增益', () => {
    const hasBuff = (sp: { onKillSelf?: { id: string }[]; onHitSelf?: { id: string }[] } | undefined) =>
      [...(sp?.onKillSelf ?? []), ...(sp?.onHitSelf ?? [])].some((s) => (BUFFS as string[]).includes(s.id));
    for (const it of ALL_ITEMS) expect(hasBuff(it.special), it.id).toBe(false);
    for (const n of TALENT_NODES) expect(hasBuff(n.fx.special), n.id).toBe(false);
    for (const c of CHARACTERS) expect(hasBuff(c.special), c.id).toBe(false);
    for (const [id, a] of Object.entries(AWAKENINGS)) expect(hasBuff(a.special), id).toBe(false);
  });

  it('击败精英叠层、满层不重置、结束后进冷却；同种增益只算一份', () => {
    const S = BALANCE.superBuff;
    const owned = new Set<SuperBuffKind>(['rage']);
    const b = new SuperBuffs(() => owned);
    // 持有两把同增益的超武也只算一份（owned 是 Set）
    expect(b.stacks('rage')).toBe(0);
    for (let i = 1; i <= S.maxStacks; i++) {
      b.onEliteKill();
      expect(b.stacks('rage')).toBe(i);
    }
    b.onEliteKill();
    expect(b.stacks('rage')).toBe(S.maxStacks); // 满层后不再增加
    b.update(S.dur + 0.1);
    expect(b.stacks('rage')).toBe(0);
    b.onEliteKill();
    expect(b.stacks('rage'), '冷却中不触发').toBe(0);
    b.update(S.cd + 0.1);
    b.onEliteKill();
    expect(b.stacks('rage')).toBe(1);
  });

  it('怒气满层爆发后清空；增益只作用于带它的那把超武', () => {
    const S = BALANCE.superBuff;
    const b = new SuperBuffs(() => new Set<SuperBuffKind>(['rage', 'haste']));
    for (let i = 0; i < S.maxStacks; i++) b.onEliteKill();
    const rageWeapon = EVOLVED_WEAPONS.find((w) => w.superBuff === 'rage')!;
    const other = WEAPON_MAP.knife;
    expect(b.hitMult(other).mult).toBe(1);
    const hit = b.hitMult(rageWeapon);
    expect(hit.burst).toBe(true);
    expect(hit.mult).toBeCloseTo((1 + (S.rage.per * S.maxStacks) / 100) * S.rage.burstMult, 6);
    expect(b.stacks('rage'), '爆发后清空').toBe(0);
    // 急速只给带急速的超武
    const hasteWeapon = EVOLVED_WEAPONS.find((w) => w.superBuff === 'haste')!;
    expect(b.attackSpeed(hasteWeapon)).toBe(S.haste.per * S.maxStacks);
    expect(b.attackSpeed(rageWeapon)).toBe(0);
    expect(b.attackSpeed(other)).toBe(0);
  });

  it('专注暴击消耗 1 层；嗜血只在残血生效', () => {
    const S = BALANCE.superBuff;
    const b = new SuperBuffs(() => new Set<SuperBuffKind>(['focus', 'vampiric']));
    b.onEliteKill();
    b.onEliteKill();
    const focusW = EVOLVED_WEAPONS.find((w) => w.superBuff === 'focus')!;
    expect(b.onCrit(focusW)).toBeCloseTo(1 + S.focus.per / 100, 6);
    expect(b.stacks('focus')).toBe(1);
    const vampW = EVOLVED_WEAPONS.find((w) => w.superBuff === 'vampiric')!;
    expect(b.lifeSteal(vampW, 0.9)).toBe(0);
    expect(b.lifeSteal(vampW, 0.3)).toBe(S.vampiric.per * 2);
    expect(b.lifeSteal(focusW, 0.3)).toBe(0);
  });
});

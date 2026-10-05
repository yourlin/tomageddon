import { describe, expect, it } from 'vitest';
import { BALANCE, auraBaseRadius, auraPower } from '../src/data/balance';
import { WEAPONS } from '../src/data/weapons';

const A = BALANCE.aura;
const minR = BALANCE.player.radius + A.minBodies * A.bodyPx;

describe('光环默认半径', () => {
  it('所有光环武器至少「玩家半径 + 1.5 个身位」', () => {
    const auras = WEAPONS.filter((w) => w.kind === 'aura');
    expect(auras.length).toBeGreaterThan(0);
    for (const w of auras) expect(w.range).toBeGreaterThanOrEqual(minR);
  });

  it('威力越高半径越小：DPS、单次伤害、攻速任一项提高都不会变大', () => {
    const base = { damage: [4], cooldown: [0.5], critMult: 1.5 };
    const r0 = auraBaseRadius(base);
    expect(auraBaseRadius({ ...base, damage: [8] })).toBeLessThan(r0); // 单次伤害更高
    expect(auraBaseRadius({ ...base, cooldown: [0.3] })).toBeLessThan(r0); // 攻速更快
    expect(auraBaseRadius({ ...base, effect: { burn: { dps: 3 } } })).toBeLessThan(r0); // 额外持续伤害
    expect(auraPower({ ...base, damage: [8] })).toBeGreaterThan(auraPower(base));
  });

  it('极强 / 极弱的光环被限制在身位范围内', () => {
    expect(auraBaseRadius({ damage: [500], cooldown: [0.1], critMult: 3 })).toBe(Math.round(minR));
    expect(auraBaseRadius({ damage: [0.5], cooldown: [2], critMult: 1 })).toBe(Math.round(BALANCE.player.radius + A.maxBodies * A.bodyPx));
  });
});

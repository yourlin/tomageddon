import { describe, expect, it } from 'vitest';
import { WEAPONS, WEAPON_MAP, isShopWeapon, SHOP_MAX_TIER } from '../src/data/weapons';
import { FUSED_WEAPONS } from '../src/data/recipes';
import { EVOLVED_WEAPONS } from '../src/data/evolutions';
import { newBuild, rollShelf } from '../src/dev/build';

describe('商店不卖 T4', () => {
  it('合成专属 T4 与超武不在商店可售池里', () => {
    for (const w of [...FUSED_WEAPONS, ...EVOLVED_WEAPONS]) expect(isShopWeapon(w), w.id).toBe(false);
    expect(WEAPONS.filter(isShopWeapon).every((w) => !w.minTier && !w.evolvedFrom)).toBe(true);
  });

  it('高幸运、持有合成专属 T4 时，刷 2000 次货架也不出现 T4 或只能合成的武器', () => {
    const b = newBuild('lemon');
    b.wave = 12;
    b.ignoreBudget = true;
    b.extraMods = { luck: 300 };
    // 持有合成专属 T4 与超武：「补货已持有的武器」不能把它们补出来
    b.weapons.push({ id: FUSED_WEAPONS[0].id, tier: 3 }, { id: EVOLVED_WEAPONS[0].id, tier: 3 });
    let shelf = rollShelf(b);
    for (let i = 0; i < 2000; i++) {
      for (const o of shelf.offers.filter((x) => x.kind === 'weapon')) {
        expect(o.tier, o.id).toBeLessThanOrEqual(SHOP_MAX_TIER);
        expect(isShopWeapon(WEAPON_MAP[o.id]), o.id).toBe(true);
      }
      shelf = rollShelf(b, shelf);
    }
  });
});

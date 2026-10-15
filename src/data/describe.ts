// 道具 / 特效的文字描述（自动生成）
import type { ItemDef, ItemSpecial } from './items';
import { describeMods, STAT_INFO, type StatKey } from './stats';
import { WEAPON_MAP, bulletArchetype, basePierce, type WeaponDef } from './weapons';
import { setsOf, setTiers } from './weaponSets';

import { STATUSES, type StatusApply } from './statuses';
import { tx } from '../i18n';
import { BALANCE, armorMultiplier, speedBonusPct } from './balance';

/** 角色的「属性与特性」：属性修正（按数值自动生成，与实际生效一致）+ 特性里的特殊效果（特性不再重复写属性） */
export function charTraitLines(c: { mods: Parameters<typeof describeMods>[0]; traits: string[] }): string[] {
  return [...describeMods(c.mods), ...c.traits];
}

const st = (a: StatusApply) =>
  `${a.stacks && a.stacks > 1 ? a.stacks + tx('层', '× ') : ''}${STATUSES[a.id].name}${a.value && a.id === 'shield' ? tx(`（${a.value}）`, ` (${a.value})`) : ''}`;
const ch = (a: StatusApply) => (a.chance !== undefined && a.chance < 100 ? tx(`${a.chance}% 概率`, `${a.chance}% chance of `) : '');
const list = (l: StatusApply[]) => l.map((a) => `${ch(a)}${st(a)}`).join(tx('、', ', '));

export function describeSpecial(s: ItemSpecial | undefined): string[] {
  if (!s) return [];
  const out: string[] = [];
  if (s.onHit) out.push(tx(`命中时${list(s.onHit)}`, `On hit: ${list(s.onHit)}`));
  if (s.onAuraHit) out.push(tx(`光环武器命中时${list(s.onAuraHit)}`, `On aura weapon hit: ${list(s.onAuraHit)}`));
  if (s.onHitSelf) out.push(tx(`命中时自身获得${list(s.onHitSelf)}`, `On hit, gain ${list(s.onHitSelf)}`));
  if (s.onKillSelf) out.push(tx(`击杀时获得${list(s.onKillSelf)}`, `On kill, gain ${list(s.onKillSelf)}`));
  if (s.onHurtSelf) out.push(tx(`受伤时获得${list(s.onHurtSelf)}`, `When hurt, gain ${list(s.onHurtSelf)}`));
  if (s.onHurtEnemy) out.push(tx(`受伤时使攻击者${list(s.onHurtEnemy)}`, `When hurt, inflict ${list(s.onHurtEnemy)} on the attacker`));
  if (s.onDodgeSelf) out.push(tx(`闪避时获得${list(s.onDodgeSelf)}`, `On dodge, gain ${list(s.onDodgeSelf)}`));
  if (s.waveStartSelf) out.push(tx(`每波开始获得${list(s.waveStartSelf)}`, `At wave start, gain ${list(s.waveStartSelf)}`));
  if (s.periodicSelf)
    out.push(
      tx(
        `每 ${s.periodicSelf.every} 秒获得${list(s.periodicSelf.status)}`,
        `Every ${s.periodicSelf.every}s, gain ${list(s.periodicSelf.status)}`,
      ),
    );
  if (s.aura)
    out.push(
      tx(
        `每 ${s.aura.every} 秒使周围 ${s.aura.radius} 范围敌人${list(s.aura.status)}`,
        `Every ${s.aura.every}s, inflict ${list(s.aura.status)} on enemies within ${s.aura.radius}`,
      ),
    );
  if (s.explodeOnKill)
    out.push(
      tx(
        `击杀 ${s.explodeOnKill.chance}% 概率爆炸（${s.explodeOnKill.dmg} 伤害）`,
        `${s.explodeOnKill.chance}% chance for kills to explode (${s.explodeOnKill.dmg} damage)`,
      ),
    );
  if (s.thorns) out.push(tx(`受伤反弹 ${s.thorns} 伤害`, `Reflect ${s.thorns} damage when hurt`));
  if (s.revive) out.push(tx(`死亡时复活 ${s.revive} 次`, `Revive ${s.revive} time(s) on death`));
  if (s.weaponSlot) out.push(tx(`武器栏 +${s.weaponSlot}`, `+${s.weaponSlot} weapon slot`));
  if (s.legendCap) out.push(tx(`每种传说道具持有上限 +${s.legendCap}`, `+${s.legendCap} holding limit per legendary item`));
  if (s.burnChance) out.push(tx(`命中 ${s.burnChance}% 概率灼烧`, `${s.burnChance}% chance to Burn on hit`));
  if (s.shield) out.push(tx(`每 ${s.shield} 秒获得泡泡护盾`, `Gain a bubble shield every ${s.shield}s`));
  if (s.doubleSeed) out.push(tx(`${s.doubleSeed}% 概率番茄籽翻倍`, `${s.doubleSeed}% chance to double Seeds`));
  if (s.interest) out.push(tx(`每波获得 ${s.interest}% 利息`, `Earn ${s.interest}% interest each wave`));
  if (s.lightningOnHit) out.push(tx(`命中 ${s.lightningOnHit}% 概率落雷`, `${s.lightningOnHit}% chance to call lightning on hit`));
  if (s.split) {
    const S = BALANCE.split;
    const pct = Math.round(S.dmg * 100);
    out.push(
      tx(
        `远程子弹命中后分裂 +${s.split} 层：每层分出 ${S.shards} 颗，伤害为上一层的 ${pct}%（总层数最多 ${S.cap}）`,
        `Ranged bullets split +${s.split} time(s) on hit: ${S.shards} shards per split, each dealing ${pct}% of the previous (max ${S.cap} splits total)`,
      ),
    );
  }
  if (s.killHeal) out.push(tx(`每击杀 ${s.killHeal} 个敌人回复 1 生命`, `Heal 1 HP every ${s.killHeal} kills`));
  if (s.shopDiscount) out.push(tx(`商店价格 -${s.shopDiscount}%`, `Shop prices -${s.shopDiscount}%`));
  if (s.rerolls) out.push(tx(`每波商店刷新次数 +${s.rerolls}`, `+${s.rerolls} shop reroll(s) per wave`));
  if (s.sameWeaponBonus) out.push(tx(`每把同名武器 +${s.sameWeaponBonus}% 伤害`, `+${s.sameWeaponBonus}% damage per duplicate weapon`));
  if (s.fruitHeal) out.push(tx(`果实回血 +${s.fruitHeal}%`, `Fruit healing +${s.fruitHeal}%`));
  if (s.crateMult) out.push(tx(`宝箱掉率 x${s.crateMult}`, `Crate drop rate x${s.crateMult}`));
  if (s.critDmg) out.push(tx(`暴击伤害 +${s.critDmg}%`, `Crit Damage +${s.critDmg}%`));
  if (s.statusDmg) out.push(tx(`持续伤害 +${s.statusDmg}%`, `Damage over time +${s.statusDmg}%`));
  if (s.cleanseEvery) out.push(tx(`每 ${s.cleanseEvery} 秒净化所有减益`, `Cleanse all debuffs every ${s.cleanseEvery}s`));
  return out;
}

export function describeItem(it: ItemDef): string[] {
  return [...describeMods(it.mods), ...(it.desc ? [it.desc] : describeSpecial(it.special))];
}

/** 武器的伤害类型（决定吃哪个「分类伤害 %」）：光环武器算光环，其余按武器类别；icon 为类型图标纹理（见 Textures） */
/** 子弹类型特性的说明（狙击 / 霰弹 / 慢速单发 / 手枪机枪），其他武器返回 null */
export function archetypeText(def: WeaponDef, tier = 0): string | null {
  const a = bulletArchetype(def);
  if (!a) return null;
  const A = BALANCE.archetype;
  const p = basePierce(def, tier);
  const pierce = p > 0 ? tx(`穿透 ${p}；`, `Pierce ${p}; `) : '';
  if (a === 'sniper')
    return tx(
      `🎯 狙击：${pierce}打生命 ≥ ${A.sniper.hpPct * 100}% 的敌人伤害 +${A.sniper.dmg}%`,
      `🎯 Sniper: ${pierce}+${A.sniper.dmg}% damage to enemies at ≥ ${A.sniper.hpPct * 100}% HP`,
    );
  if (a === 'shotgun')
    return tx(
      `💥 霰弹：${pierce}打半个射程以内的敌人伤害 +${A.shotgun.dmg}%`,
      `💥 Shotgun: ${pierce}+${A.shotgun.dmg}% damage within half range`,
    );
  if (a === 'heavy')
    return tx(
      `🔨 重弹：${pierce}击退更强，${A.heavy.stun}% 概率硬直 ${A.heavy.stunDur} 秒`,
      `🔨 Heavy shot: ${pierce}stronger knockback, ${A.heavy.stun}% chance to stagger for ${A.heavy.stunDur}s`,
    );
  return tx('🔫 速射：命中叠加压制（每层移速 -5%，最多 3 层）', '🔫 Rapid fire: hits stack Suppression (-5% Move Speed each, up to 3)');
}

export function weaponDmgType(def: WeaponDef): { key: StatKey; name: string; color: string; icon: string } {
  const key: StatKey =
    def.kind === 'aura' ? 'auraPct' : def.cls === 'melee' ? 'meleePct' : def.cls === 'ranged' ? 'rangedPct' : 'elementalPct';
  const name = {
    auraPct: tx('光环', 'Aura'),
    meleePct: tx('近战', 'Melee'),
    rangedPct: tx('远程', 'Ranged'),
    elementalPct: tx('元素', 'Elemental'),
  }[key as 'auraPct'];
  const icon = `dmgtype_${key === 'auraPct' ? 'aura' : def.cls}`;
  return { key, name, color: STAT_INFO[key].color, icon };
}

/** 移动速度点数的实际加速说明，例：「(+18%)」「(−10%)」「(+95%·趋近上限 +120%)」 */
export function speedText(points: number): string {
  const p = Math.round(speedBonusPct(points));
  return `(${p >= 0 ? '+' : ''}${p}%)`;
}

/** 护甲的减伤说明，例：「(减伤 50%)」「(减伤 75%·上限)」 */
export function armorText(armor: number): string {
  const r = Math.round((1 - armorMultiplier(armor)) * 100);
  const capped = armorMultiplier(armor) <= BALANCE.armorMinTaken;
  return tx(`(减伤 ${r}%${capped ? '·上限' : ''})`, ` (−${r}% dmg${capped ? ', cap' : ''})`);
}

/** 商店卡片上的一行套装简介：套装名、件数（买下后），以及买下后生效的档位或下一档 */
export function setSummary(def: WeaponDef, counts: Record<string, number>, adding = false): string[] {
  return setsOf(def.id).map((set) => {
    const n = (counts[set.id] ?? 0) + (adding ? 1 : 0);
    const name = tx(set.name[0], set.name[1]);
    const tiers = setTiers(set);
    const on = tiers.filter((k) => n >= k).pop();
    const next = tiers.find((k) => n < k);
    const mods = (k: number) => describeMods(set.bonus[k] as Parameters<typeof describeMods>[0]).join(' ');
    const tail =
      on !== undefined
        ? tx(`生效 ${mods(on)}`, `active ${mods(on)}`)
        : next !== undefined
          ? tx(`${next} 件 ${mods(next)}`, `${next}: ${mods(next)}`)
          : '';
    return `✦ ${name} ${n}/${set.members.length} · ${tail}`;
  });
}

/** 套装说明的一行：kind = head（套装名与件数）/ members（成员）/ on（已生效的档位）/ off（未生效的档位） */
export interface SetRow {
  text: string;
  kind: 'head' | 'members' | 'on' | 'off';
}
/** 套装行的颜色：生效绿色、未生效灰色 */
export const SET_ROW_COLOR: Record<SetRow['kind'], string> = { head: '#ffd166', members: '#cfc6bd', on: '#52ff8a', off: '#7d746c' };

/** 武器所属套装的说明（data/weaponSets.ts）：套装名与件数、成员（已持有打 ✓）、各档加成（生效绿 / 未生效灰）。
 *  counts 为当前各套装件数（RunState.setCounts）；adding 表示这把还没持有（商店预览），按买下后的件数显示 */
export function describeWeaponSets(def: WeaponDef, counts: Record<string, number>, adding = false, held: string[] = []): SetRow[] {
  const out: SetRow[] = [];
  for (const set of setsOf(def.id)) {
    const n = (counts[set.id] ?? 0) + (adding ? 1 : 0);
    const name = tx(set.name[0], set.name[1]);
    out.push({ text: tx(`✦ ${name}（${n}/${set.members.length}）`, `✦ ${name} (${n}/${set.members.length})`), kind: 'head' });
    const own = new Set(held);
    if (adding) own.add(def.id);
    out.push({
      text:
        '   ' +
        set.members
          .map((m) => {
            const w = WEAPON_MAP[m];
            return `${w?.name ?? m}${own.has(m) ? ' ✓' : ''}`;
          })
          .join(tx('、', ', ')),
      kind: 'members',
    });
    for (const k of setTiers(set)) {
      const mods = describeMods(set.bonus[k] as Parameters<typeof describeMods>[0]).join(tx('，', ', '));
      const label = k === set.members.length ? tx(`全套 ${k} 件`, `Full ${k}`) : tx(`${k} 件`, `${k} pcs`);
      out.push({ text: `   ${label}：${mods}`, kind: n >= k ? 'on' : 'off' });
    }
  }
  return out;
}

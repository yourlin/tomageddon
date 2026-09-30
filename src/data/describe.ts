// 道具 / 特效的文字描述（自动生成）
import type { ItemDef, ItemSpecial } from './items';
import { describeMods } from './stats';
import { STATUSES, type StatusApply } from './statuses';
import { tx } from '../i18n';

const st = (a: StatusApply) =>
  `${a.stacks && a.stacks > 1 ? a.stacks + tx('层', '× ') : ''}${STATUSES[a.id].name}${a.value && a.id === 'shield' ? tx(`（${a.value}）`, ` (${a.value})`) : ''}`;
const ch = (a: StatusApply) => (a.chance !== undefined && a.chance < 100 ? tx(`${a.chance}% 概率`, `${a.chance}% chance of `) : '');
const list = (l: StatusApply[]) => l.map((a) => `${ch(a)}${st(a)}`).join(tx('、', ', '));

export function describeSpecial(s: ItemSpecial | undefined): string[] {
  if (!s) return [];
  const out: string[] = [];
  if (s.onHit) out.push(tx(`命中时${list(s.onHit)}`, `On hit: ${list(s.onHit)}`));
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
  if (s.burnChance) out.push(tx(`命中 ${s.burnChance}% 概率灼烧`, `${s.burnChance}% chance to Burn on hit`));
  if (s.shield) out.push(tx(`每 ${s.shield} 秒获得泡泡护盾`, `Gain a bubble shield every ${s.shield}s`));
  if (s.doubleSeed) out.push(tx(`${s.doubleSeed}% 概率番茄籽翻倍`, `${s.doubleSeed}% chance to double Seeds`));
  if (s.interest) out.push(tx(`每波获得 ${s.interest}% 利息`, `Earn ${s.interest}% interest each wave`));
  if (s.lightningOnHit) out.push(tx(`命中 ${s.lightningOnHit}% 概率落雷`, `${s.lightningOnHit}% chance to call lightning on hit`));
  if (s.killHeal) out.push(tx(`每击杀 ${s.killHeal} 个敌人回复 1 生命`, `Heal 1 HP every ${s.killHeal} kills`));
  if (s.shopDiscount) out.push(tx(`商店价格 -${s.shopDiscount}%`, `Shop prices -${s.shopDiscount}%`));
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

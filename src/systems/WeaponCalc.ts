// 武器数值计算（单体期望 DPS 等）：开发者界面与测试 bot 共用。放在 systems 下而不是 dev/，避免把开发者代码带进首屏包
import type { WeaponDef } from '../data/weapons';
import { BALANCE, explodeSizeMultiplier } from '../data/balance';
import { run } from './RunState';
import { weaponDamage, weaponCooldown, weaponRange } from './WeaponSystem';
import { isFavoredWeapon, isDoubleFavored } from '../data/affinity';

// ---------------- 武器 ----------------
export interface WeaponCalc {
  dmg: number;
  cd: number;
  range: number;
  count: number;
  critChance: number;
  critMult: number;
  /** 期望单次命中伤害（计入暴击） */
  hit: number;
  /** 单体期望 DPS（多弹丸按全部命中、连锁按首个目标） */
  dps: number;
  /** 爆炸半径（已乘爆炸范围属性），无爆炸为 0 */
  explode: number;
  /** 多目标总伤系数说明 */
  multi: string;
  effects: string[];
}

export function weaponCalc(def: WeaponDef, tier: number): WeaponCalc {
  const s = run.stats;
  const sp = run.specials;
  const dmg = weaponDamage(def, tier, s);
  const cd = weaponCooldown(def, tier, s);
  const range = weaponRange(def, s);
  const count = def.kind === 'chain' ? 1 : (def.count?.[tier] ?? 1);
  const critChance = Math.min(1, Math.max(0, (s.crit + (def.critBonus ?? 0) + (def.kind === 'thrust' ? BALANCE.thrustCrit : 0)) / 100));
  // 暴击：武器倍率 × (1 + 道具/角色/天赋暴击伤害%)，后者有上限
  const critMult = def.critMult * (1 + Math.min(BALANCE.critDmgCap, sp.critDmg) / 100);
  const hit = dmg * (1 + critChance * (critMult - 1));
  const exMul = explodeSizeMultiplier(s.explodeSize);
  const baseExplode = def.effect?.explode ?? (def.kind === 'rocket' ? 60 : def.kind === 'mine' ? 80 : 0);
  const explode = baseExplode * exMul;
  let perAttack = hit * count;
  const effects: string[] = [];
  let multi = '';
  if (def.kind === 'sweep' && def.effect?.explode) {
    perAttack += hit * 0.6; // 横扫末端追加 60% 伤害的爆炸
    multi = `扇形 + 末端爆炸（60%）`;
  } else if (def.kind === 'chain') {
    const jumps = def.effect?.chain?.[tier] ?? 2;
    let k = 0;
    for (let j = 0; j <= jumps; j++) k += 0.85 ** j;
    multi = `连锁 ${jumps} 次，总伤 ×${k.toFixed(2)}`;
  } else if (def.kind === 'aura') multi = '范围内所有敌人';
  else if (def.kind === 'flame' || def.kind === 'boomerang') multi = '无限穿透';
  else if (def.kind === 'sweep') multi = '扇形 ±72°';
  else if (def.kind === 'thrust') multi = '直线穿刺';
  const pierce = def.pierce?.[tier] ?? 0;
  const bounce = def.bounce?.[tier] ?? 0;
  if (pierce && def.kind !== 'flame' && def.kind !== 'boomerang') effects.push(`穿透 ${pierce}（每次 ×0.8）`);
  if (bounce) effects.push(`弹射 ${bounce}（每次 ×0.8）`);
  if (count > 1) effects.push(`${count} 发${def.spread ? ` / 散射 ${def.spread}°` : ''}`);
  const e = def.effect;
  if (e?.burn) effects.push(`灼烧 ${e.burn.dps}/s ${e.burn.dur}s`);
  if (e?.slow) effects.push(`减速 ${e.slow.pct}% ${e.slow.dur}s`);
  if (e?.stun) effects.push(`眩晕 ${e.stun}s`);
  if (e?.lifeSteal) effects.push(`吸血概率 +${e.lifeSteal}%`);
  if (def.knockback) effects.push(`击退 ${def.knockback}`);
  if (def.critBonus) effects.push(`暴击率 +${def.critBonus}%`);
  if (isDoubleFavored(run.char.favored, def)) effects.push('★★双契合 +10%');
  else if (isFavoredWeapon(run.char.favored, def)) effects.push('★契合 +10%');
  return { dmg, cd, range, count, critChance, critMult, hit, dps: perAttack / cd, explode, multi, effects };
}

/** 当前持有武器的平均单次伤害（技能伤害基准，同 SkillSystem.power） */

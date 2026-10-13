// 开发者界面的数据说明：武器 / 技能 / 怪物的中文名词表与理论数值计算（全部基于当前 run 的属性）
import type { WeaponKind } from '../data/weapons';
import type { EnemyBehavior, EnemyDef } from '../data/enemies';
import type { PatternType, Pattern, BossDef } from '../data/bosses';
import { STATUSES, type StatusApply } from '../data/statuses';
import { BALANCE, armorMultiplier } from '../data/balance';
import { run } from '../systems/RunState';
import { weaponDamage } from '../systems/WeaponSystem';
import { WEAPON_MAP } from '../data/weapons';
import type { SkillDef } from '../data/characters';
import { skillHealPct } from '../data/skills';
import { fmt } from './dom';

export const KIND_NAME: Record<WeaponKind, string> = {
  thrust: '直刺',
  sweep: '横扫',
  bullet: '子弹',
  rocket: '爆炸弹',
  flame: '喷火',
  aura: '光环',
  mine: '地雷',
  boomerang: '回旋镖',
  chain: '连锁闪电',
};
export const CLS_NAME = { melee: '近战', ranged: '远程', elemental: '元素' } as const;

export const BEHAVIOR_NAME: Record<EnemyBehavior, string> = {
  chase: '追击',
  wander: '游走',
  charger: '蓄力冲撞',
  shooter: '远程射击',
  bomber: '自爆',
  splitter: '分裂',
  healer: '治疗同伴',
  summoner: '召唤',
  trail: '拖尾粘液',
  flee: '逃窜',
};

export const PATTERN_NAME: Record<PatternType, string> = {
  ring: '环形弹幕',
  spiral: '螺旋弹幕',
  aimed: '瞄准射击',
  charge: '冲锋',
  summon: '召唤',
  slam: '砸地',
  hazard: '地面危险区',
  laser: '激光',
  teleport: '瞬移',
  buff: '增益',
  scatter: '散射',
};

/** 招式未写 dmg 时的默认伤害系数（与 Enemy.bossAI / GameScene.boss* 中的默认值一致） */
const PATTERN_DEFAULT_DMG: Partial<Record<PatternType, number>> = {
  ring: 1,
  spiral: 1,
  aimed: 1,
  scatter: 1,
  slam: 1,
  hazard: 0.4,
  laser: 1.4,
};

export function statusText(list: StatusApply[] | undefined): string {
  return (list ?? [])
    .map(
      (s) =>
        `${STATUSES[s.id].name}${s.stacks && s.stacks > 1 ? `×${s.stacks}` : ''} ${fmt(s.dur)}s${s.chance !== undefined ? ` ${s.chance}%` : ''}`,
    )
    .join('、');
}

export { weaponCalc, type WeaponCalc } from '../systems/WeaponCalc';
export function weaponPower(): number {
  const ws = run.weapons;
  if (!ws.length) return 8;
  let sum = 0;
  for (const w of ws) sum += weaponDamage(WEAPON_MAP[w.id], w.tier, run.stats, w);
  return sum / ws.length;
}

// ---------------- 技能 ----------------
export function skillCalc(sk: SkillDef): { cd: number; dmg: number; radius: number; dur: number; lines: string[] } {
  const s = run.stats;
  const cd = sk.cd * Math.max(0.3, 1 - s.skillCd / 100);
  const dmg = Math.max(1, weaponPower() * (sk.mult ?? 1) * (1 + s.skillDmg / 100));
  const rMul = Math.min(1.4, Math.max(0.8, 1 + s.range / 600)) * Math.max(0.5, 1 + s.skillRange / 100);
  const base = sk.type === 'dash' ? (sk.distance ?? 300) : (sk.radius ?? 0);
  const radius = base * rMul;
  const dur = (sk.duration ?? 0) * Math.max(0.5, 1 + s.skillDur / 100);
  const lines: string[] = [];
  if (sk.mult) lines.push(`伤害系数 ×${sk.mult}`);
  if (sk.radius) lines.push(`半径 ${sk.radius}`);
  if (sk.distance) lines.push(`距离 ${sk.distance}`);
  if (sk.count) lines.push(`数量 ${sk.count}`);
  if (sk.duration) lines.push(`持续 ${sk.duration}s`);
  if (sk.heal) lines.push(`回复 ${skillHealPct(sk.heal)}% 最大生命`);
  if (sk.xp) lines.push(`经验 +${sk.xp}`);
  if (sk.xpBoost) lines.push(`打怪经验 +${sk.xpBoost}%`);
  if (sk.mods)
    lines.push(
      '增益 ' +
        Object.entries(sk.mods)
          .map(([k, v]) => `${k} ${v! > 0 ? '+' : ''}${v}`)
          .join(' '),
    );
  if (sk.status?.length) lines.push(`敌人：${statusText(sk.status)}`);
  if (sk.selfStatus?.length) lines.push(`自身：${statusText(sk.selfStatus)}`);
  return { cd, dmg, radius, dur, lines };
}

// ---------------- 怪物 ----------------
export function minionTraits(d: EnemyDef): string[] {
  const t: string[] = [BEHAVIOR_NAME[d.behavior] ?? d.behavior];
  if (d.behavior === 'shooter')
    t.push(
      `射击 ${d.shots ?? 1} 发${d.spread ? `/${d.spread}°` : ''} 每 ${d.shootCd ?? 2.5}s${d.projMult !== undefined ? ` 弹伤 ×${d.projMult}` : ''}`,
    );
  if (d.behavior === 'charger') t.push(`蓄力 ${d.windup ?? 0.5}s 冲速 ${d.chargeSpeed ?? 500} 每 ${d.chargeCd ?? 3}s`);
  if (d.behavior === 'bomber') t.push(`引信 ${BALANCE.bomb.min}~${BALANCE.bomb.max}s（按威力） 半径 ${d.blastRadius ?? 80}`);
  if (d.behavior === 'healer') t.push(`治疗 ${(d.healAmount ?? 0.2) * 100}% 半径 ${d.healRadius ?? 180} 每 ${d.healCd ?? 3}s`);
  if (d.behavior === 'summoner') t.push(`召唤 ${d.summon ?? 'fly'}×${d.summonCount ?? 2} 每 ${d.summonCd ?? 5}s`);
  if (d.splitInto) t.push(`死亡分裂 ${d.splitInto}×${d.splitCount ?? 2}`);
  if (d.group && d.group > 1) t.push(`成群 ×${d.group}`);
  if (d.knockResist) t.push(`抗击退 ${Math.round(d.knockResist * 100)}%`);
  if (d.onHit?.length) t.push(`命中：${statusText(d.onHit)}`);
  if (d.critter) t.push('地形生物');
  return t;
}

export function patternText(p: Pattern, baseDmg: number): { name: string; dmg: number | null; detail: string } {
  const k = p.dmg ?? PATTERN_DEFAULT_DMG[p.type];
  const parts: string[] = [`CD ${p.cd}s`];
  if (p.count) parts.push(`数量 ${p.count}`);
  if (p.waves) parts.push(`${p.waves} 轮`);
  if (p.speed) parts.push(`速度 ${p.speed}`);
  if (p.spread) parts.push(`散射 ${p.spread}°`);
  if (p.radius) parts.push(`半径 ${p.radius}`);
  if (p.windup) parts.push(`预警 ${p.windup}s`);
  if (p.slow) parts.push(`减速 ${p.slow}%`);
  if (p.enemy) parts.push(`召唤 ${p.enemy}`);
  if (p.type === 'hazard') parts.push('每 0.5s 结算，持续 5s');
  if (p.type === 'charge') parts.push('伤害 = 接触伤害');
  if (p.debuff?.length) parts.push(`命中：${statusText(p.debuff)}`);
  if (p.buff?.length) parts.push(`增益：${statusText(p.buff)}`);
  return {
    name: PATTERN_NAME[p.type] ?? p.type,
    dmg: k !== undefined ? Math.max(1, Math.round(baseDmg * k)) : null,
    detail: parts.join(' · '),
  };
}

/** 对当前构筑的实际伤害（护甲减伤后，不含闪避） */
export const afterArmor = (dmg: number): number => Math.max(1, Math.round(dmg * armorMultiplier(run.stats.armor)));

export function bossSummary(b: BossDef): string {
  const p = b.phase2;
  const out: string[] = [];
  if (b.contact?.length) out.push(`接触：${statusText(b.contact)}`);
  if (b.affixes?.length) out.push(`固定词缀 ${b.affixes.join('/')}`);
  if (p)
    out.push(
      `二阶段 ≤${Math.round(p.at * 100)}%：移速 ×${p.speedMult} 冷却 ×${p.cdMult}，新增 ${p.add.map((x) => PATTERN_NAME[x.type]).join('/')}`,
    );
  return out.join(' · ');
}

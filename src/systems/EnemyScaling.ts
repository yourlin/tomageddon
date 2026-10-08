// 敌人实际数值（按章节 + 波次缩放）。GameScene 刷怪与开发者界面的强度表共用，保证两边永远一致。
// 挑战修饰（巨人、蜂群、强化 Boss 等）不在这里，由调用方另行乘算。
import {
  enemyHp,
  enemyDamage,
  chapterScale,
  endlessHp,
  endlessDmg,
  eliteHpScale,
  eliteDmgScale,
  eliteDmgMult,
  bossHpScale,
  bossDmgScale,
  chapterWaves,
  firstEliteDmgMult,
} from '../data/balance';
import type { EnemyDef } from '../data/enemies';
import type { BossDef } from '../data/bosses';
import type { ChapterDef } from '../data/chapters';

/** 小怪：生命、接触伤害、移速倍率（未含词缀精英的 ×3.5 生命 / ×1.3 伤害，见 Enemy.spawnMinion） */
export function minionStats(def: EnemyDef, wave: number, ch: ChapterDef): { hp: number; dmg: number; speedMult: number } {
  return {
    hp: enemyHp(def.hp, def.hpGrowth, wave, ch.hpMult, chapterWaves(ch.id)),
    dmg: enemyDamage(def.dmg, def.dmgGrowth, wave, ch.dmgMult, chapterWaves(ch.id)),
    speedMult: ch.speedMult,
  };
}

/** 精英 / Boss：生命与基础伤害（招式伤害 = 基础伤害 × 招式 dmg 系数）。hpMult 为挑战修饰等额外倍率 */
export function bossStats(def: BossDef, wave: number, ch: ChapterDef, hpMult = 1): { hp: number; dmg: number } {
  const from = chapterWaves(ch.id);
  const hp = Math.round(
    def.hp * chapterScale(ch.bossHpMult, wave, from) * (def.elite ? eliteHpScale(wave) : bossHpScale()) * endlessHp(wave, from) * hpMult,
  );
  const dmg = Math.round(
    def.dmg *
      chapterScale(ch.dmgMult, wave, from) *
      (def.elite ? eliteDmgMult() * eliteDmgScale(wave, from) * firstEliteDmgMult(ch.id, wave) : bossDmgScale(ch.id)) *
      endlessDmg(wave, from),
  );
  return { hp, dmg };
}

// K3：描述与代码数值一致（1.3.2 修过「技能描述写 20%，实际回复 9%」这类问题，这里防止再次出现）
import { describe, it, expect } from 'vitest';
import { CHARACTERS } from '../src/data/characters';
import { skillHealPct } from '../src/data/skills';
import { ALL_ITEMS } from '../src/data/items';
import { describeItem } from '../src/data/describe';
import { STAT_INFO } from '../src/data/stats';
import { MODIFIERS } from '../src/data/challenges';

describe('技能描述', () => {
  it.each(CHARACTERS.filter((c) => c.skill.heal).map((c) => [c.name, c] as const))('%s 的回复量与代码一致', (_n, c) => {
    const pct = skillHealPct(c.skill.heal!);
    expect(c.skill.desc).toContain(`${pct}%`);
  });
  it('没有技能描述还写着按伤害百分比吸血', () => {
    for (const c of CHARACTERS) expect(c.skill.desc).not.toMatch(/伤害的\s*\d+%\s*吸血|吸血\s*\d+%\s*伤害/);
  });
});

describe('道具描述', () => {
  it('每个道具都能生成描述，且不含未替换的占位符', () => {
    for (const it of ALL_ITEMS) {
      const lines = describeItem(it);
      for (const l of lines) expect(l).not.toMatch(/\{v\}|undefined|NaN/);
    }
  });
  it('有属性加成的道具，描述里出现对应属性名', () => {
    for (const it of ALL_ITEMS) {
      const text = describeItem(it).join(' ');
      for (const k of Object.keys(it.mods ?? {})) {
        const info = STAT_INFO[k as keyof typeof STAT_INFO];
        if (info) expect(text, `${it.id}.${k}`).toContain(info.name);
      }
    }
  });
});

describe('挑战修饰描述', () => {
  it('带属性修正的修饰，描述里的数字与 mods 一致', () => {
    for (const m of MODIFIERS) for (const v of Object.values(m.mods ?? {})) expect(m.desc[0], m.id).toContain(String(Math.abs(v!)));
  });
});

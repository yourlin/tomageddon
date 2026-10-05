import { describe, expect, it } from 'vitest';
import { LEVELUP_OPTIONS } from '../src/data/items';

describe('升级属性选项', () => {
  it('不提供范围类属性：爆炸范围、光环范围、技能范围只能靠道具等获得', () => {
    const keys = LEVELUP_OPTIONS.map((o) => o.key as string);
    for (const k of ['explodeSize', 'auraSize', 'skillArea']) expect(keys).not.toContain(k);
  });
});

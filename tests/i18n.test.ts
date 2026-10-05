// M3：英文覆盖——切到英文后，所有会显示给玩家的数据文字都不应再含中文
import { describe, expect, it } from 'vitest';
import { setLang } from '../src/i18n';
import { applyLanguage } from '../src/i18n/apply';
import { CHARACTERS } from '../src/data/characters';
import { WEAPONS } from '../src/data/weapons';
import { EVOLVED_WEAPONS } from '../src/data/evolutions';
import { ALL_ITEMS } from '../src/data/items';
import { ENEMIES } from '../src/data/enemies';
import { BOSSES, AFFIXES } from '../src/data/bosses';
import { STATUSES } from '../src/data/statuses';
import { CHAPTERS, TERRAIN_INFO } from '../src/data/chapters';
import { STAT_INFO } from '../src/data/stats';
import { RARITY } from '../src/data/balance';
import { SKILL_TYPE_NAME } from '../src/data/skills';
import { RELICS, RELIC_SETS, describeRelic } from '../src/data/relics';
import { DANGER_LEVELS } from '../src/data/danger';
import { MODIFIERS } from '../src/data/challenges';
import { QUESTS } from '../src/data/quests';
import { AWAKENINGS } from '../src/data/awakenings';
import { RUN_EVENTS } from '../src/systems/RunEvents';
import { ACHIEVEMENTS } from '../src/data/achievements';
import { achText } from '../src/systems/Achievements';
import { describeMods } from '../src/data/stats';
import { describeSpecial } from '../src/data/describe';

setLang('en');
applyLanguage('en');

const CJK = /[\u4e00-\u9fff]/;
/** 只检查给玩家看的文字字段 */
const TEXT_KEYS = new Set(['name', 'title', 'desc', 'traits', 'subtitle', 'series', 'note', 'flavor']);
/** 会继续往下找文字的嵌套字段（tags 等内部键不检查） */
const NEST_KEYS = new Set(['skill', 'talent', 'phases', 'patterns', 'tiers']);

/** 递归收集含中文的文字字段；[中文, English] 二元组只看英文那一项 */
function cjkFields(obj: unknown, path: string, out: string[], depth = 0): void {
  if (depth > 6 || obj === null || obj === undefined) return;
  if (typeof obj === 'string') {
    if (CJK.test(obj)) out.push(`${path} = ${obj.slice(0, 40)}`);
    return;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 2 && typeof obj[0] === 'string' && typeof obj[1] === 'string')
      return cjkFields(obj[1], path + '[1]', out, depth + 1);
    obj.forEach((v, i) => cjkFields(v, `${path}[${i}]`, out, depth + 1));
    return;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (TEXT_KEYS.has(k) || NEST_KEYS.has(k)) cjkFields(v, `${path}.${k}`, out, depth + 1);
    }
  }
}

const check = (label: string, list: unknown[], idOf: (x: never) => string = (x: never) => (x as { id: string }).id) => {
  const out: string[] = [];
  for (const x of list) cjkFields(x, `${label}:${idOf(x as never)}`, out);
  return out;
};

describe('英文覆盖（M3）', () => {
  it('角色、武器、道具、怪物、Boss、词缀、状态、章节', () => {
    const bad = [
      ...check('char', CHARACTERS),
      ...check('weapon', [...WEAPONS, ...EVOLVED_WEAPONS]),
      ...check(
        'item',
        ALL_ITEMS.map((i) => ({ ...i, nameZh: undefined })),
      ),
      ...check('enemy', ENEMIES),
      ...check('boss', BOSSES),
      ...check('affix', Object.values(AFFIXES)),
      ...check('status', Object.values(STATUSES)),
      ...check('chapter', CHAPTERS),
      ...check(
        'terrain',
        Object.entries(TERRAIN_INFO).map(([id, t]) => ({ id, desc: t })),
      ),
    ];
    expect(bad).toEqual([]);
  });

  it('属性名、稀有度、技能类型', () => {
    const bad = [
      ...Object.entries(STAT_INFO)
        .filter(([, v]) => CJK.test(v.name))
        .map(([k, v]) => `stat:${k} ${v.name}`),
      ...RARITY.filter((r) => CJK.test(r.name)).map((r) => `rarity ${r.name}`),
      ...Object.entries(SKILL_TYPE_NAME)
        .filter(([, v]) => CJK.test(v))
        .map(([k, v]) => `skillType:${k} ${v}`),
    ];
    expect(bad).toEqual([]);
  });

  it('1.4.0 新系统：遗物、危机、挑战规则、任务、觉醒、事件', () => {
    const bad = [
      ...check('relic', RELICS),
      ...check('relicSet', RELIC_SETS),
      ...check('danger', DANGER_LEVELS),
      ...check('modifier', MODIFIERS),
      ...check('quest', QUESTS),
      ...check('awaken', Object.values(AWAKENINGS), (a: never) => (a as { charId: string }).charId),
      ...check('event', RUN_EVENTS),
    ];
    expect(bad).toEqual([]);
  });

  it('自动生成的描述（属性、特效、遗物）', () => {
    const lines = [
      ...RELICS.flatMap((r) => describeRelic(r)),
      ...RELIC_SETS.flatMap((s) => describeRelic(s)),
      ...ALL_ITEMS.flatMap((i) => [...describeMods(i.mods ?? {}), ...describeSpecial(i.special)]),
    ];
    expect(lines.filter((l) => CJK.test(l))).toEqual([]);
  });

  it('成就名称与描述', () => {
    const bad: string[] = [];
    for (const a of ACHIEVEMENTS)
      a.tiers.forEach((_, i) => {
        for (const f of ['name', 'desc'] as const) {
          const t = achText(a, f, i);
          if (CJK.test(t)) bad.push(`${a.id}#${i}.${f} ${t}`);
        }
      });
    if (bad.length) console.log('ACHBAD\n' + bad.join('\n'));
    expect(bad).toEqual([]);
  });
});

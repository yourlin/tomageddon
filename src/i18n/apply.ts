// 启动时按当前语言把英文覆盖表写回游戏数据（数据对象被各模块共享，写回后所有界面/文档自动使用英文）
import { lang, type Lang } from './index';
import { CHARACTERS } from '../data/characters';
import { WEAPONS } from '../data/weapons';
import { ITEMS, ALL_ITEMS } from '../data/items';
import { ENEMIES } from '../data/enemies';
import { BOSSES, AFFIXES } from '../data/bosses';
import { STATUSES } from '../data/statuses';
import { CHAPTERS, TERRAIN_INFO } from '../data/chapters';
import { STAT_INFO, type StatKey } from '../data/stats';
import { SKILL_TYPE_NAME } from '../data/skills';
import { RARITY } from '../data/balance';
import { EN_CHARACTERS } from './en/characters';
import { EN_ITEMS, EN_SERIES } from './en/items';
import { EN_ENEMIES, EN_BOSSES, EN_AFFIXES } from './en/monsters';
import { EN_WEAPONS, EN_WEAPON_TAGS, EN_STATUSES, EN_CHAPTERS, EN_STATS, EN_SKILL_TYPES, EN_RARITY } from './en/misc';

let applied: Lang = 'zh';

/** 武器标签显示名（标签在逻辑里是套装键，数据保持中文） */
export const tagName = (t: string): string => (applied === 'en' ? (EN_WEAPON_TAGS[t] ?? t) : t);

export function applyLanguage(l: Lang = lang): void {
  if (l !== 'en' || applied === 'en') return;
  applied = 'en';
  for (const c of CHARACTERS) {
    const e = EN_CHARACTERS[c.id];
    if (!e) continue;
    Object.assign(c, { name: e.name, title: e.title, desc: e.desc, traits: e.traits });
    c.skill.name = e.skill.name;
    c.skill.desc = e.skill.desc;
    c.talent = { ...e.talent };
  }
  for (const w of WEAPONS) Object.assign(w, EN_WEAPONS[w.id] ?? {});
  for (const it of ITEMS) Object.assign(it, EN_ITEMS[it.id] ?? {});
  for (const it of ALL_ITEMS) {
    const m = /^(.+)_(\d+)$/.exec(it.id);
    const s = it.series && m ? EN_SERIES[m[1]] : undefined;
    if (!s) continue;
    it.name = s.items[Number(m![2])] ?? it.name;
    it.series = s.name;
  }
  for (const e of ENEMIES) Object.assign(e, EN_ENEMIES[e.id] ?? {});
  for (const b of BOSSES) Object.assign(b, EN_BOSSES[b.id] ?? {});
  for (const a of Object.values(AFFIXES)) Object.assign(a, EN_AFFIXES[a.id]);
  for (const s of Object.values(STATUSES)) Object.assign(s, EN_STATUSES[s.id]);
  for (const c of CHAPTERS) {
    const e = EN_CHAPTERS[c.id];
    if (!e) continue;
    c.name = e.name;
    c.desc = e.desc;
    TERRAIN_INFO[c.id] = e.terrain;
  }
  for (const k of Object.keys(STAT_INFO) as StatKey[]) STAT_INFO[k].name = EN_STATS[k];
  Object.assign(SKILL_TYPE_NAME, EN_SKILL_TYPES);
  RARITY.forEach((r, i) => (r.name = EN_RARITY[i]));
}

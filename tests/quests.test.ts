// 1.4.0 F1 / F2：角色专属任务与觉醒的数据校验
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTERS, CHARACTER_MAP } from '../src/data/characters';
import { QUESTS, QUEST_MAP, questsOf, evalRunQuest, type QuestRunResult } from '../src/data/quests';
import { AWAKENINGS } from '../src/data/awakenings';
import { BASE_STATS } from '../src/data/stats';
import type { StatusApply } from '../src/data/statuses';

/** 递归读取 src 下所有 .ts 源码（不含测试） */
function readSources(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...readSources(p));
    else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) out.push(readFileSync(p, 'utf8'));
  }
  return out;
}

/** 源码中 bump / bumpMax 的键：静态字符串为完整键，模板字符串取 `${` 之前的静态前缀 */
function bumpedKeys(): { exact: Set<string>; prefixes: string[] } {
  const exact = new Set<string>();
  const prefixes = new Set<string>();
  const re = /\bbump(?:Max)?\(\s*(?:'([^']*)'|`([^`$]*)(\$\{)?)/g;
  for (const src of readSources(fileURLToPath(new URL('../src', import.meta.url)))) {
    for (const m of src.matchAll(re)) {
      if (m[1] !== undefined) exact.add(m[1]);
      else if (m[3]) {
        // 前缀为空（如 `${c.kind}Runs`）无法约束任何键，跳过
        if (m[2]) prefixes.add(m[2]);
      } else if (m[2] !== undefined) exact.add(m[2]);
    }
  }
  return { exact, prefixes: [...prefixes] };
}

/** 描述里是否作为独立数字出现（1 不会误匹配 1.5 / 10） */
const hasNum = (text: string, n: number): boolean => new RegExp(`(?<![\\d.])${String(n).replace('.', '\\.')}(?![\\d.]|\\.\\d)`).test(text);

describe('角色任务', () => {
  it('共 117 个任务（33 名原有角色 + 6 名新角色），每名角色恰好 3 个，id 唯一', () => {
    expect(CHARACTERS.length).toBe(39);
    expect(QUESTS.length).toBe(117);
    expect(new Set(QUESTS.map((q) => q.id)).size).toBe(QUESTS.length);
    expect(Object.keys(QUEST_MAP).length).toBe(QUESTS.length);
    for (const c of CHARACTERS) expect(questsOf(c.id).length, c.id).toBe(3);
  });

  it('charId 都是存在的角色', () => {
    for (const q of QUESTS) expect(CHARACTER_MAP[q.charId], q.id).toBeDefined();
  });

  it('counter 类任务的键都在源码中被 bump / bumpMax 过', () => {
    const { exact, prefixes } = bumpedKeys();
    for (const q of QUESTS.filter((x) => x.kind === 'counter')) {
      expect(q.counter, q.id).toBeTruthy();
      const k = q.counter!;
      const ok = exact.has(k) || prefixes.some((p) => k.startsWith(p) && k.length > p.length);
      expect(ok, `${q.id}: ${k}`).toBe(true);
      expect(q.target, q.id).toBeGreaterThanOrEqual(1);
      expect(q.run, q.id).toBeUndefined();
    }
  });

  it('run 类任务有条件且 target 为 1', () => {
    for (const q of QUESTS.filter((x) => x.kind === 'run')) {
      expect(q.run && Object.keys(q.run).length, q.id).toBeTruthy();
      expect(q.target, q.id).toBe(1);
    }
  });

  it('中英文名称与描述齐全，且描述中的数字与条件一致', () => {
    for (const q of QUESTS) {
      for (const s of [...q.name, ...q.desc]) expect(s.trim(), q.id).not.toBe('');
      const nums: number[] = [];
      if (q.kind === 'counter') {
        if (q.target > 1) nums.push(q.target);
        const ch = /^charClear:[^:]+:(\d+)$/.exec(q.counter!);
        if (ch) nums.push(Number(ch[1]));
      } else {
        for (const v of Object.values(q.run!)) if (typeof v === 'number') nums.push(v);
      }
      for (const n of nums) for (const d of q.desc) expect(hasNum(d, n), `${q.id}「${d}」缺少 ${n}`).toBe(true);
    }
  });

  it('角色维度的计数器键都指向本角色', () => {
    for (const q of QUESTS.filter((x) => x.kind === 'counter')) {
      const owner = q.counter!.split(':')[1];
      expect(owner, q.id).toBe(q.charId);
    }
  });

  it('evalRunQuest 按条件判定', () => {
    const base: QuestRunResult = {
      charId: 'tomato',
      chapterId: 1,
      wave: 15,
      win: true,
      danger: 5,
      endless: false,
      weapons: 6,
      kills: 800,
      level: 20,
      perfectWaves: 0,
    };
    const q3 = QUEST_MAP['tomato_q3'];
    expect(evalRunQuest(q3, base)).toBe(true);
    expect(evalRunQuest(q3, { ...base, danger: 4 })).toBe(false);
    expect(evalRunQuest(q3, { ...base, win: false })).toBe(false);
    expect(evalRunQuest(q3, { ...base, charId: 'carrot' })).toBe(false);
    // counter 类恒为 false
    expect(evalRunQuest(QUEST_MAP['tomato_q1'], base)).toBe(false);
    // 武器数上限
    const carrot = QUEST_MAP['carrot_q2'];
    expect(evalRunQuest(carrot, { ...base, charId: 'carrot', weapons: 3 })).toBe(true);
    expect(evalRunQuest(carrot, { ...base, charId: 'carrot', weapons: 4 })).toBe(false);
    // 无尽波次
    const chili = QUEST_MAP['chili_q3'];
    expect(evalRunQuest(chili, { ...base, charId: 'chili', endless: true, wave: 30, win: false })).toBe(true);
    expect(evalRunQuest(chili, { ...base, charId: 'chili', endless: false, wave: 30 })).toBe(false);
    // 指定章节
    const bb = QUEST_MAP['blueberry_q3'];
    expect(evalRunQuest(bb, { ...base, charId: 'blueberry', chapterId: 5, danger: 6 })).toBe(true);
    expect(evalRunQuest(bb, { ...base, charId: 'blueberry', chapterId: 4, danger: 6 })).toBe(false);
  });
});

describe('角色觉醒', () => {
  it('39 名角色的觉醒齐全，且没有多余条目', () => {
    expect(Object.keys(AWAKENINGS).sort()).toEqual(CHARACTERS.map((c) => c.id).sort());
    for (const [id, a] of Object.entries(AWAKENINGS)) expect(a.charId).toBe(id);
  });

  it('mods 键都是合法属性，且至少有 mods 或 special', () => {
    for (const a of Object.values(AWAKENINGS)) {
      expect(a.mods || a.special, a.charId).toBeTruthy();
      for (const k of Object.keys(a.mods ?? {})) expect(k in BASE_STATS, `${a.charId}.${k}`).toBe(true);
      for (const s of [...a.name, ...a.desc]) expect(s.trim(), a.charId).not.toBe('');
    }
  });

  it('觉醒 special 不与角色自身 special 使用同一字段（避免合并时覆盖）', () => {
    for (const a of Object.values(AWAKENINGS)) {
      const own = Object.keys(CHARACTER_MAP[a.charId].special ?? {});
      for (const k of Object.keys(a.special ?? {})) expect(own, `${a.charId}.${k}`).not.toContain(k);
    }
  });

  it('描述中的数字与 mods / special 一致', () => {
    for (const a of Object.values(AWAKENINGS)) {
      const nums: number[] = Object.values(a.mods ?? {}).map((v) => Math.abs(v as number));
      const sp = a.special ?? {};
      const st = (list?: StatusApply[]): void => {
        for (const s of list ?? []) {
          nums.push(s.dur);
          if (s.chance !== undefined) nums.push(s.chance);
          if (s.value !== undefined) nums.push(s.value);
        }
      };
      for (const k of ['thorns', 'revive', 'weaponSlot', 'doubleSeed', 'killHeal', 'rerolls', 'critDmg', 'cleanseEvery'] as const)
        if (sp[k] !== undefined) nums.push(sp[k]!);
      if (sp.explodeOnKill) nums.push(sp.explodeOnKill.chance, sp.explodeOnKill.dmg);
      if (sp.aura) {
        nums.push(sp.aura.radius, sp.aura.every);
        st(sp.aura.status);
      }
      if (sp.periodicSelf) {
        nums.push(sp.periodicSelf.every);
        st(sp.periodicSelf.status);
      }
      st(sp.onHit);
      st(sp.onKillSelf);
      st(sp.onHurtSelf);
      st(sp.onHurtEnemy);
      st(sp.onDodgeSelf);
      st(sp.waveStartSelf);
      for (const n of nums) for (const d of a.desc) expect(hasNum(d, n), `${a.charId}「${d}」缺少 ${n}`).toBe(true);
    }
  });
});

// 开场漫画数据：7 章各 4 格，演员 / 背景 / 对白指向都合法
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { COMICS } from '../src/data/comics';
import { CHAPTERS } from '../src/data/chapters';
import { CHARACTER_MAP } from '../src/data/characters';
import { ENEMY_MAP } from '../src/data/enemies';
import { BOSS_MAP } from '../src/data/bosses';
import runtimeIndex from '../src/data/artRuntime.generated.json';

const MAPS = { char: CHARACTER_MAP, enemy: ENEMY_MAP, boss: BOSS_MAP } as const;

describe('开场四格漫画', () => {
  // 原画 src/assets/comics 不进仓库，这里检查游戏实际下载的编译副本
  it('每章都有可分成四格的横版插画（编译后的 WebP），尺寸和比例一致', () => {
    const rows = runtimeIndex.files as Record<string, { file: string; width: number; height: number }>;
    for (const ch of CHAPTERS) {
      const row = rows[`comics/ch${ch.id}.png`];
      expect(row, `第 ${ch.id} 章插画清单`).toBeDefined();
      const webp = readFileSync(new URL(`../src/assets/runtime/${row.file}`, import.meta.url));
      expect(webp.subarray(0, 4).toString('ascii')).toBe('RIFF');
      expect(webp.subarray(8, 12).toString('ascii')).toBe('WEBP');
      const { width: w, height: h } = row;
      expect(w, `第 ${ch.id} 章宽度`).toBeGreaterThanOrEqual(1536);
      expect(h, `第 ${ch.id} 章高度`).toBeGreaterThanOrEqual(1024);
      expect(w / h).toBeCloseTo(1.5, 1);
      expect(w % 2).toBe(0);
      expect(h % 2).toBe(0);
    }
  });

  it('每一章都有 4 格漫画', () => {
    for (const ch of CHAPTERS) expect(COMICS[ch.id]?.panels.length, `第 ${ch.id} 章`).toBe(4);
  });

  it('演员都存在、背景是合法章节、对白指向格子里的演员、坐标在格子内', () => {
    for (const [ch, comic] of Object.entries(COMICS)) {
      comic.panels.forEach((p, i) => {
        const where = `第 ${ch} 章第 ${i + 1} 格`;
        expect(p.bg, where).toBeGreaterThanOrEqual(1);
        expect(p.bg, where).toBeLessThanOrEqual(CHAPTERS.length);
        for (const a of p.actors ?? []) {
          expect(MAPS[a.kind][a.id], `${where}：${a.kind}/${a.id}`).toBeDefined();
          for (const v of [a.x, a.y]) expect(v >= 0 && v <= 1, `${where}：${a.id} 坐标`).toBe(true);
        }
        if (p.say) expect(p.actors?.[p.say.who], `${where}：对白说话者`).toBeDefined();
        for (const t of [p.caption, p.say?.text, p.sfx?.text]) if (t) expect(t[0] && t[1], `${where}：中英文`).toBeTruthy();
      });
    }
  });

  it('第 1–5 章的 Boss 每局随机，只能以剪影出场', () => {
    for (let ch = 1; ch <= 5; ch++)
      for (const p of COMICS[ch].panels)
        for (const a of p.actors ?? []) if (a.kind === 'boss') expect(a.shadow, `第 ${ch} 章 ${a.id}`).toBe(true);
  });
});

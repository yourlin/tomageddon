// 平衡测试结果速览：各章节每波收入、构筑与 T4 分布（node scripts/econ.mjs [结果文件]）
import { readFileSync } from 'node:fs';

const src = process.argv[2] ?? new URL('./.batch-results.json', import.meta.url);
const data = JSON.parse(readFileSync(src, 'utf8'));
const rs = Array.isArray(data) ? data : data.results;
const q = (l, p) => {
  const a = [...l].sort((x, y) => x - y);
  return a.length ? a[Math.min(a.length - 1, Math.max(0, Math.ceil(p * a.length) - 1))] : NaN;
};
const sum = (o) => Object.values(o ?? {}).reduce((a, b) => a + b, 0);
for (const ch of [...new Set(rs.map((r) => r.ch))].sort()) {
  const c = rs.filter((r) => r.ch === ch);
  const win = c.filter((r) => r.win).length;
  console.log(
    `\n== 第 ${ch} 章 ${c.length} 局 通关 ${Math.round((win / c.length) * 100)}% · 死亡波次 P50 ${q(
      c.filter((r) => !r.win).map((r) => r.wave),
      0.5,
    )}`,
  );
  console.log('波  收入P50 收入P90  持有P50 刷新P50 道具P50 T3+P50  T4P50 等级 击杀/波');
  for (const W of [1, 2, 3, 4, 5, 7, 10, 12, 14]) {
    const s = c.map((r) => r.waves?.find((w) => w.wave === W)).filter(Boolean);
    const prev = c.map((r) => r.waves?.find((w) => w.wave === W - 1));
    if (!s.length) continue;
    const kills = c
      .map((r, i) => {
        const a = r.waves?.find((w) => w.wave === W),
          b = prev[i];
        return a ? a.kills - (b?.kills ?? 0) : null;
      })
      .filter((x) => x != null);
    const inc = s.map((w) => sum(w.inc));
    console.log(
      [
        W,
        q(inc, 0.5),
        q(inc, 0.9),
        q(
          s.map((w) => w.seeds),
          0.5,
        ),
        q(
          s.map((w) => w.rerolls),
          0.5,
        ),
        q(
          s.map((w) => w.items),
          0.5,
        ),
        q(
          s.map((w) => w.wTier[2] + w.wTier[3]),
          0.5,
        ),
        q(
          s.map((w) => w.wTier[3]),
          0.5,
        ),
        q(
          s.map((w) => w.lvl),
          0.5,
        ),
        q(kills, 0.5),
      ]
        .map((v) => String(v).padStart(6))
        .join(' '),
    );
  }
  const t4 = c
    .map((r) => r.waves?.find((w) => w.wave === 14))
    .filter(Boolean)
    .map((w) => w.wTier[3]);
  const ge = (k) => Math.round((t4.filter((x) => x >= k).length / Math.max(1, t4.length)) * 100);
  console.log(`T4（到第 15 波 ${t4.length} 局）：≥1 ${ge(1)}%  ≥2 ${ge(2)}%  ≥3 ${ge(3)}%   目标 50/30/10`);
  const ev = c.map((r) => r.final?.evolved ?? 0);
  console.log(`进化超武：至少 1 把 ${Math.round((ev.filter((x) => x > 0).length / Math.max(1, ev.length)) * 100)}%`);
}

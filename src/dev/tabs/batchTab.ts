// 批量模拟页：在界面里用隐藏 iframe 跑无头机器人对局（scripts/batch.mjs 的界面版）
// G1 配置与开始 / 停止 · G2 进度与角色×章节结果 · G3 武器 / 道具持有率与胜率 · G4 与上一次对比 · G5 失败局载入沙盒 · CSV 导出
import { h, btn, check, select, num, table, fmt } from '../dom';
import type { DevCtx } from '../ctx';
import { CHARACTERS } from '../../data/characters';
import { CHAPTERS } from '../../data/chapters';
import { batch, onBatchFinish, onBatchUpdate, startBatch, stopBatch, buildJobs } from '../batch/runner';
import { clearHistory, loadHistory, pushRecord } from '../batch/store';
import {
  canLoad,
  cfgDiff,
  charName,
  compareChars,
  compareWeapons,
  deathBar,
  deathText,
  groupRows,
  itemRows,
  maxWaveOf,
  pct,
  toCsv,
  toDevBuild,
  weaponName,
  weaponRows,
  type Delta,
  type PickRow,
} from '../batch/stats';
import { TALENT_NAME, type BatchConfig, type BatchRecord, type JobResult, type TalentPreset } from '../batch/types';

// ---------------- 模块级状态 ----------------
const ui = {
  chars: new Set<string>(CHARACTERS.map((c) => c.id)),
  chapters: new Set<number>([1]),
  runs: 2,
  talents: 'none' as TalentPreset,
  workers: 2,
  timeoutSec: 240,
  /** 查看的历史记录下标（0 = 最新） */
  view: 0,
  allWeapons: false,
  allItems: false,
  allFails: false,
  csv: '',
};
let curCtx: DevCtx | null = null;
let liveEl: HTMLElement | null = null;
let pending = false;

onBatchFinish((rec) => {
  const kept = rec.results.length ? pushRecord(rec) : -1;
  ui.view = 0;
  ui.csv = '';
  if (curCtx) {
    if (kept === 0) curCtx.toast('结果未能存入 localStorage（空间不足）', true);
    else curCtx.toast(`批量模拟结束：${rec.results.length}/${rec.total} 局`);
    curCtx.rerender();
  }
});

const cfgNow = (): BatchConfig => ({
  chars: CHARACTERS.map((c) => c.id).filter((id) => ui.chars.has(id)),
  chapters: [...ui.chapters].sort((a, b) => a - b),
  runs: ui.runs,
  talents: ui.talents,
  workers: ui.workers,
  timeoutSec: ui.timeoutSec,
});

const mmss = (ms: number): string => {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const pctText = (v: number): string => `${Math.round(v)}%`;
const signed = (v: number): string => `${v > 0 ? '+' : ''}${Math.round(v)}`;
const winCls = (v: number): string => (v >= 70 ? 'good' : v >= 35 ? 'warn' : 'bad');
const stamp = (t: number): string => new Date(t).toLocaleString('zh-CN', { hour12: false });

export function renderBatch(ctx: DevCtx): HTMLElement {
  curCtx = ctx;
  const root = h('div');
  const history = loadHistory();
  if (ui.view >= history.length) ui.view = 0;

  // ---------------- G1 配置 ----------------
  root.append(h('h3', null, '批量模拟（无头机器人）'));
  const cfgBox = h('div', { class: 'box' });
  cfgBox.append(
    h(
      'div',
      { class: 'row' },
      h('b', null, `角色（${ui.chars.size}/${CHARACTERS.length}）`),
      btn('全选', () => {
        CHARACTERS.forEach((c) => ui.chars.add(c.id));
        ctx.rerender();
      }),
      btn('全不选', () => {
        ui.chars.clear();
        ctx.rerender();
      }),
    ),
    h(
      'div',
      { class: 'row' },
      ...CHARACTERS.map((c) =>
        check(c.name, ui.chars.has(c.id), (v) => {
          if (v) ui.chars.add(c.id);
          else ui.chars.delete(c.id);
          ctx.rerender();
        }),
      ),
    ),
    h(
      'div',
      { class: 'row' },
      h('b', null, '章节'),
      ...CHAPTERS.map((c) =>
        check(
          String(c.id),
          ui.chapters.has(c.id),
          (v) => {
            if (v) ui.chapters.add(c.id);
            else ui.chapters.delete(c.id);
            ctx.rerender();
          },
          c.name,
        ),
      ),
    ),
    h(
      'div',
      { class: 'row' },
      h('span', null, '每组局数'),
      num(
        ui.runs,
        (v) => {
          ui.runs = Math.round(v);
          ctx.rerender();
        },
        { min: 1, max: 50, width: 52 },
      ),
      h('span', null, '天赋'),
      select(
        (Object.keys(TALENT_NAME) as TalentPreset[]).map((k) => [k, TALENT_NAME[k]]),
        ui.talents,
        (v) => (ui.talents = v as TalentPreset),
      ),
      h('span', null, '并发'),
      num(ui.workers, (v) => (ui.workers = Math.round(v)), { min: 1, max: 6, width: 44 }),
      h('span', null, '单局超时(秒)'),
      num(ui.timeoutSec, (v) => (ui.timeoutSec = Math.round(v)), { min: 30, max: 1800, step: 30, width: 60 }),
      h('span', { class: 'muted' }, `共 ${buildJobs(cfgNow()).length} 局`),
    ),
    h(
      'div',
      { class: 'muted small' },
      '机器人与 scripts/batch.mjs 相同（bot2.js，极速）。iframe 与本页同源，共用同一个主线程：并发只是交错执行，总吞吐约等于单核，' +
        '本页操作会变卡；要真正多核并行仍用命令行 batch.mjs。运行期间请保持本标签页在前台（后台标签页的定时器会被浏览器降频）。',
    ),
  );
  root.append(cfgBox);

  // ---------------- G2~G5 实时区（节流局部重绘） ----------------
  const live = h('div');
  liveEl = live;
  const fill = (): void => {
    live.replaceChildren(...renderLive(ctx, loadHistory()));
  };
  fill();
  root.append(live);
  onBatchUpdate(() => {
    if (pending) return;
    pending = true;
    setTimeout(() => {
      pending = false;
      if (liveEl?.isConnected) {
        const hist = loadHistory();
        liveEl.replaceChildren(...renderLive(ctx, hist));
      }
    }, 500);
  });

  // ---------------- 历史与导出 ----------------
  root.append(h('h3', null, `历史记录（${history.length}）`));
  if (history.length) {
    root.append(
      h(
        'div',
        { class: 'row' },
        h('span', null, '查看'),
        select(
          history.map((r, i) => [
            i,
            `${stamp(r.at)} · ${r.results.length}/${r.total} 局 · ${TALENT_NAME[r.cfg.talents]}${r.complete ? '' : '（未完成）'}`,
          ]),
          ui.view,
          (v) => {
            ui.view = Number(v);
            ui.csv = '';
            ctx.rerender();
          },
        ),
        btn(
          '清空历史',
          () => {
            if (!confirm('删除全部批量模拟历史？')) return;
            clearHistory();
            ui.view = 0;
            ui.csv = '';
            ctx.rerender();
          },
          '',
          '删除 localStorage 中的 tomageddon_dev_batch_history',
        ),
      ),
    );
  } else root.append(h('div', { class: 'muted' }, '还没有运行记录。每次运行结束（含手动停止）都会存一条，用于和下一次对比。'));

  const shown = viewRecord(history);
  if (shown?.results.length) {
    root.append(h('h3', null, '导出 CSV'));
    const ta = h('textarea', { readOnly: true, value: ui.csv, placeholder: '点「生成 CSV」' });
    root.append(
      h(
        'div',
        { class: 'row' },
        btn('生成 CSV', () => {
          ui.csv = toCsv(shown.results);
          ta.value = ui.csv;
        }),
        btn('复制', () => {
          if (!ui.csv) ui.csv = ta.value = toCsv(shown.results);
          void navigator.clipboard?.writeText(ui.csv).then(
            () => ctx.toast('已复制 CSV'),
            () => {
              ta.select();
              ctx.toast('剪贴板不可用，已选中文本，请手动复制', true);
            },
          );
        }),
        h('span', { class: 'muted' }, `${shown.results.length} 行 · 逗号分隔，含表头`),
      ),
      ta,
    );
  }
  return root;
}

/** 正在运行时显示进行中的记录，否则显示选中的历史记录 */
function viewRecord(history: BatchRecord[]): BatchRecord | null {
  if (batch.running && batch.record) return batch.record;
  return history[ui.view] ?? null;
}
/** 对比对象：运行中 → 最新历史；否则 → 被查看记录的上一条 */
function prevRecord(history: BatchRecord[]): BatchRecord | null {
  if (batch.running) return history[0] ?? null;
  return history[ui.view + 1] ?? null;
}

function renderLive(ctx: DevCtx, history: BatchRecord[]): HTMLElement[] {
  const out: HTMLElement[] = [];
  const rec = viewRecord(history);

  // ---------------- 开始 / 停止 + 进度 ----------------
  const cfg = cfgNow();
  out.push(
    h(
      'div',
      { class: 'row' },
      btn(
        batch.running ? (batch.stopping ? '正在停止…' : '运行中…') : '▶ 开始',
        () => {
          const e = startBatch(cfg);
          if (e) ctx.toast(e, true);
        },
        'pri',
      ),
      btn('■ 停止', () => stopBatch(), '', '进行中的局会被中断（不计入结果），已完成的局保留并存档'),
    ),
  );
  const [startB, stopB] = out[0].querySelectorAll('button');
  startB.disabled = batch.running || !buildJobs(cfg).length;
  stopB.disabled = !batch.running || batch.stopping;

  if (batch.running && batch.record) {
    const r = batch.record;
    const done = r.results.length;
    const ratio = r.total ? done / r.total : 1;
    const el = Date.now() - batch.startedAt;
    const eta = done ? mmss((el / done) * (r.total - done)) : '--:--';
    out.push(
      h(
        'div',
        { class: 'box' },
        h(
          'div',
          { style: 'height:10px;background:#3a1a1f;border-radius:5px;overflow:hidden;margin-bottom:4px' },
          h('div', { style: `height:100%;width:${(ratio * 100).toFixed(1)}%;background:#ff4b3e` }),
        ),
        h(
          'div',
          null,
          `${Math.round(ratio * 100)}% · ${done}/${r.total} 局 · 已用 ${mmss(el)} · 预计剩余 ${eta} · 并发 ${r.cfg.workers} · 队列 ${batch.queue.length}`,
        ),
        h(
          'div',
          { class: 'muted small' },
          ...[...batch.active.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([i, a]) =>
              h(
                'div',
                null,
                `槽位 ${i + 1}：第${a.job.ch}章 ${charName(a.job.charId)} #${a.job.run + 1}（${mmss(performance.now() - a.since)}）`,
              ),
            ),
        ),
      ),
    );
  }
  if (batch.log.length) out.push(h('div', { class: 'muted small', style: 'white-space:pre-wrap' }, batch.log.slice(-6).join('\n')));

  if (!rec) return out;
  const res = rec.results;
  if (!res.length) {
    out.push(h('div', { class: 'muted' }, '等待第一局结果…'));
    return out;
  }

  // ---------------- G2 角色 × 章节 ----------------
  const wins = res.filter((r) => r.win).length;
  out.push(
    h('h3', null, `结果（${batch.running ? '进行中' : stamp(rec.at)}）`),
    h(
      'div',
      { class: 'row' },
      h('span', null, `${res.length}/${rec.total} 局`),
      h('b', { class: winCls(pct(wins, res.length)) }, `通关率 ${pctText(pct(wins, res.length))}`),
      h('span', null, `平均到达波次 ${fmt(res.reduce((a, r) => a + r.wave, 0) / res.length)}`),
      h('span', { class: 'muted' }, `天赋：${TALENT_NAME[rec.cfg.talents]} · 用时 ${mmss(rec.elapsedMs)}`),
    ),
  );
  const maxWave = maxWaveOf(res);
  out.push(
    table(
      ['章', '角色', '局数', '通关率', '平均波次', '超时', `死亡波次分布（1→${maxWave}）`],
      groupRows(res).map((g) => [
        String(g.ch),
        charName(g.charId),
        String(g.n),
        h('b', { class: winCls(g.winRate) }, `${pctText(g.winRate)}（${g.wins}）`),
        fmt(g.avgWave),
        g.timeouts ? h('span', { class: 'warn' }, String(g.timeouts)) : '0',
        h('span', { title: deathText(g.deaths), style: 'font-family:Consolas,monospace;letter-spacing:1px' }, deathBar(g.deaths, maxWave)),
      ]),
      { numeric: [2, 3, 4, 5] },
    ),
    h('div', { class: 'muted small' }, '死亡波次：每个字符代表一波，柱越高死得越多，「·」为无；悬停看具体数字。'),
  );

  // ---------------- G3 武器 / 道具 ----------------
  const pickTable = (rows: PickRow[], all: boolean, avgHead: string, avgFmt: (v: number) => string): HTMLElement =>
    table(
      ['名称', '持有局数', '持有率', '持有时胜率', '较整体', avgHead],
      rows
        .slice(0, all ? rows.length : 25)
        .map((r) => [
          r.name,
          String(r.n),
          pctText(r.pickRate),
          h('span', { class: winCls(r.winRate) }, pctText(r.winRate)),
          h('span', { class: r.lift > 5 ? 'good' : r.lift < -5 ? 'bad' : 'muted' }, signed(r.lift)),
          avgFmt(r.avg),
        ]),
      { numeric: [1, 2, 3, 4, 5] },
    );
  const wr = weaponRows(res);
  out.push(
    h('h3', null, `武器（终局持有，${wr.length} 种）`),
    pickTable(wr, ui.allWeapons, '平均最高品质', (v) => `T${fmt(v)}`),
  );
  if (wr.length > 25)
    out.push(
      btn(ui.allWeapons ? '只看前 25' : `显示全部 ${wr.length}`, () => {
        ui.allWeapons = !ui.allWeapons;
        ctx.rerender();
      }),
    );
  const ir = itemRows(res);
  out.push(
    h('h3', null, `道具（终局持有，${ir.length} 种）`),
    pickTable(ir, ui.allItems, '平均件数', (v) => fmt(v)),
  );
  if (ir.length > 25)
    out.push(
      btn(ui.allItems ? '只看前 25' : `显示全部 ${ir.length}`, () => {
        ui.allItems = !ui.allItems;
        ctx.rerender();
      }),
    );
  out.push(
    h(
      'div',
      { class: 'muted small' },
      '持有率 = 结束时持有该武器 / 道具的局数 ÷ 总局数（机器人不记录购买过程，卖掉的不算）；较整体 = 持有时胜率 − 全体胜率（百分点）。',
    ),
  );

  // ---------------- G4 对比 ----------------
  const prev = prevRecord(history);
  out.push(h('h3', null, '与上一次运行对比'));
  if (!prev || prev.id === rec.id) out.push(h('div', { class: 'muted' }, '没有更早的运行记录。'));
  else {
    out.push(h('div', { class: 'muted' }, `对比对象：${stamp(prev.at)} · ${prev.results.length} 局 · ${TALENT_NAME[prev.cfg.talents]}`));
    for (const w of cfgDiff(rec, prev)) out.push(h('div', { class: 'warn' }, `⚠ ${w}`));
    const deltaTable = (title: string, ds: Delta[], unit: string): HTMLElement => {
      const top = ds.slice(0, 8);
      return h(
        'div',
        { class: 'box' },
        h('b', null, title),
        top.length
          ? table(
              ['', '上次', '本次', '变化'],
              top.map((d, i) => [
                i === 0 && Math.abs(d.diff) >= 1 ? h('b', { class: 'warn' }, `★ ${d.label}`) : d.label,
                pctText(d.prev),
                pctText(d.cur),
                h('b', { class: d.diff > 0 ? 'good' : d.diff < 0 ? 'bad' : 'muted' }, `${signed(d.diff)}${unit}`),
              ]),
              { numeric: [1, 2, 3] },
            )
          : h('div', { class: 'muted' }, '两次运行没有相同的角色 × 章节'),
      );
    };
    out.push(
      deltaTable('通关率变化最大的角色（按章节对齐）', compareChars(res, prev.results), ' 点'),
      deltaTable('持有率变化最大的武器', compareWeapons(res, prev.results), ' 点'),
    );
  }

  // ---------------- G5 失败局 ----------------
  const fails = res.filter((r) => !r.win).sort((a, b) => a.wave - b.wave);
  out.push(h('h3', null, `失败对局（${fails.length}）`));
  if (fails.length) {
    const list = ui.allFails ? fails : fails.slice(0, 30);
    out.push(
      table(
        ['章', '角色', '波次', '等级', '武器', '道具', '伤害前三', ''],
        list.map((r: JobResult) => [
          String(r.ch),
          charName(r.charId),
          r.timeout ? h('span', { class: 'warn', title: `超时，卡在 ${r.stuckAt ?? '?'}` }, `${r.wave}（超时）`) : String(r.wave),
          String(r.level),
          h('span', { class: 'small' }, (r.wl ?? []).map((w) => `${weaponName(w.id)} T${w.tier + 1}`).join('、')),
          String(r.items),
          h('span', { class: 'muted small' }, r.topDmg),
          canLoad(r)
            ? btn(
                '载入沙盒',
                () => {
                  const b = toDevBuild(r, rec.cfg.talents);
                  ctx.setBuild(b);
                  ctx.toast(
                    `已载入：第${r.ch}章 第${r.wave}波 ${charName(r.charId)} Lv${r.level}` +
                      (rec.cfg.talents === 'mid' ? '（中期天赋无法还原，已用存档天赋）' : ''),
                  );
                },
                '',
                '武器 / 道具 / 等级 / 波次照搬；升级加点折算进「额外属性」；资金为 0',
              )
            : h('span', { class: 'muted' }, '无构筑'),
        ]),
        { numeric: [2, 3, 5] },
      ),
    );
    if (fails.length > 30)
      out.push(
        btn(ui.allFails ? '只看前 30' : `显示全部 ${fails.length}`, () => {
          ui.allFails = !ui.allFails;
          ctx.rerender();
        }),
      );
  }
  return out;
}

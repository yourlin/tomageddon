// 并行无头平衡测试（支持中断续跑，每次产出 HTML 报告）
// 用法：npm run build && node scripts/batch.mjs --chapters 1,2,3 --runs 2 [--workers 8] [--speed max]
//   --speed：每帧模拟步数，默认 max（每帧 10ms 预算内尽可能多跑）；--workers 默认 CPU 核数
//   意外中断后用相同参数重新运行即可从断点继续；加 --fresh 放弃进度从头跑
// 需要本机安装 Google Chrome。
// 报告：docs/reports/balance-<时间>.html（每次一份）、docs/BALANCE_REPORT.html/.md（最新）
// 进度：scripts/.batch-progress.json（每局完成即写入，全部完成后转存为 .batch-results.json）
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { readFileSync, writeFileSync, existsSync, renameSync, unlinkSync } from 'node:fs';
import { writeReports } from './report.mjs';

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
const CHAPTERS = arg('chapters', '1,2,3').split(',').map(Number);
const RUNS = Number(arg('runs', '1'));
const WORKERS = Number(arg('workers', String(availableParallelism())));
const SPEED = arg('speed', 'max') === 'max' ? 'max' : Number(arg('speed'));
const ONLY = arg('chars', '');
const FRESH = process.argv.includes('--fresh');
const PORT = 4174;
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PROGRESS = new URL('./.batch-progress.json', import.meta.url);
const RESULTS = new URL('./.batch-results.json', import.meta.url);
const JOB_TIMEOUT = Number(arg('timeout', '240')) * 1000; // 单局超时（秒）
const MAX_RETRY = 2;

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const PAGE_URL = `http://localhost:${PORT}/?headless=1`;
for (let i = 0; ; i++) {
  try {
    if ((await fetch(PAGE_URL)).ok) break;
  } catch {
    /* 服务未就绪 */
  }
  if (i > 50) {
    console.error('预览服务启动失败（端口被占用或未 build？）');
    server.kill();
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 200));
}
const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const botSrc = readFileSync(new URL('./bot2.js', import.meta.url), 'utf8');

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: JOB_TIMEOUT + 120000,
  handleSIGINT: false,
  handleSIGTERM: false,
  handleSIGHUP: false,
  args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
});

async function newWorker() {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('\n[页面错误]', e.message));
  await page.goto(PAGE_URL);
  await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
  await page.addScriptTag({ type: 'module', content: botSrc });
  await page.waitForFunction(() => typeof window.startBot2 === 'function');
  return page;
}

const pages = await Promise.all(Array.from({ length: WORKERS }, newWorker));
const chars = ONLY ? ONLY.split(',') : await pages[0].evaluate(() => window.ALL_CHARS);
const names = await pages[0].evaluate(() => Object.fromEntries(window.__dev.CHARACTERS.map((c) => [c.id, c.name])));
const jobs = [];
for (const ch of CHAPTERS) for (const id of chars) for (let r = 0; r < RUNS; r++) jobs.push({ id, ch, run: r, key: `${ch}:${id}:${r}` });

// ---------- 进度：相同参数自动续跑 ----------
const config = { chapters: CHAPTERS, runs: RUNS, speed: SPEED, chars };
let state = {
  meta: { ...config, version: VERSION, workers: WORKERS, names, total: jobs.length, startedAt: Date.now(), elapsedMs: 0, resumed: 0 },
  results: [],
};
if (existsSync(PROGRESS) && !FRESH) {
  const prev = JSON.parse(readFileSync(PROGRESS, 'utf8'));
  const same =
    JSON.stringify({ chapters: prev.meta.chapters, runs: prev.meta.runs, speed: prev.meta.speed, chars: prev.meta.chars }) ===
    JSON.stringify(config);
  if (same) {
    state = prev;
    state.meta = { ...prev.meta, version: VERSION, workers: WORKERS, names, resumed: (prev.meta.resumed ?? 0) + 1 };
    console.log(`检测到未完成的进度，续跑：已完成 ${state.results.length}/${jobs.length}`);
  } else {
    console.log('已有进度文件与本次参数不同，已忽略并从头开始（旧进度将被覆盖）');
  }
}
const doneKeys = new Set(state.results.map((r) => r.key));
const queue = jobs.filter((j) => !doneKeys.has(j.key));
const sessionStart = Date.now();
const baseElapsed = state.meta.elapsedMs;

function saveProgress() {
  state.meta.elapsedMs = baseElapsed + (Date.now() - sessionStart);
  writeFileSync(new URL('./.batch-progress.json.tmp', import.meta.url), JSON.stringify(state));
  renameSync(new URL('./.batch-progress.json.tmp', import.meta.url), PROGRESS);
}
saveProgress();

function report(complete) {
  const file = writeReports({ ...state.meta, complete, finishedAt: Date.now() }, state.results);
  console.log(`报告：${file}`);
}

// 中断（Ctrl+C / kill）时保存进度并输出部分报告
let stopping = false;
async function shutdown(sig) {
  if (stopping) process.exit(130);
  stopping = true;
  console.log(`\n收到 ${sig}，已保存进度 ${state.results.length}/${jobs.length}，用相同参数重新运行即可续跑`);
  saveProgress();
  report(false);
  await browser.close().catch(() => {});
  server.kill();
  process.exit(130);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGHUP', () => shutdown('SIGHUP'));

console.log(
  `角色 ${chars.length} × 章节 ${CHAPTERS.join('/')} × ${RUNS} 次 = ${jobs.length} 局，待跑 ${queue.length} 局，${WORKERS} 并行，${SPEED === 'max' ? '极速' : SPEED + ' 倍速'}`,
);

const t0 = Date.now();
const retries = {};
async function playJob(page, job) {
  return page.evaluate(
    async ({ id, ch, speed, limit }) => {
      window.__dmg = [];
      window.startBot2(id, ch, speed);
      const t = performance.now();
      while (!window.__botState.done) {
        await new Promise((res) => setTimeout(res, 200));
        if (performance.now() - t > limit) {
          window.__botState = {
            ...window.__botState,
            done: true,
            timeout: true,
            wave: window.run.wave,
            stuckAt: game.scene
              .getScenes(true)
              .map((s) => s.scene.key)
              .join('+'),
          };
        }
      }
      const agg = {};
      for (const [, , src, d] of window.__dmg) agg[src] = (agg[src] || 0) + d;
      return {
        ...window.__botState,
        topDmg: Object.entries(agg)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k, v]) => `${k}:${Math.round(v)}`)
          .join(' '),
      };
    },
    { ...job, speed: SPEED, limit: JOB_TIMEOUT },
  );
}
async function worker(page) {
  while (queue.length && !stopping) {
    const job = queue.shift();
    try {
      const r = await playJob(page, job);
      if (stopping) return;
      state.results.push({ ...r, ch: job.ch, run: job.run, key: job.key });
      saveProgress();
    } catch (e) {
      if (stopping) return;
      // 页面崩溃/卡死：重建页面并把该局放回队列
      retries[job.key] = (retries[job.key] ?? 0) + 1;
      console.error(`\n[${job.key}] 出错（第 ${retries[job.key]} 次）：${e.message.split('\n')[0]}`);
      if (retries[job.key] <= MAX_RETRY) queue.push(job);
      else console.error(`[${job.key}] 重试次数用尽，跳过（下次续跑会再试）`);
      await page
        .browserContext()
        .close()
        .catch(() => {});
      page = null;
      for (let i = 0; i < 3 && !page && !stopping; i++)
        page = await newWorker().catch((err) => {
          console.error(`\n重建页面失败：${err.message.split('\n')[0]}`);
          return null;
        });
      if (!page) {
        console.error('\n该并发槽位退出，剩余任务由其他槽位完成');
        return;
      }
    }
    process.stdout.write(`\r已完成 ${state.results.length}/${jobs.length}（本次 ${Math.round((Date.now() - t0) / 1000)}s）`);
  }
}
await Promise.all(pages.map(worker));
if (stopping) await new Promise(() => {}); // 交给 shutdown 收尾退出
console.log('');
await browser.close();
server.kill();

// ---------- 汇总 ----------
const complete = state.results.length >= jobs.length;
saveProgress();
report(complete);
if (complete) {
  writeFileSync(RESULTS, JSON.stringify(state.results, null, 1));
  unlinkSync(PROGRESS);
} else {
  console.log(`有 ${jobs.length - state.results.length} 局未完成，进度已保留，重新运行可续跑`);
}
for (const ch of CHAPTERS) {
  const rs = state.results.filter((r) => r.ch === ch);
  if (rs.length)
    console.log(
      `第 ${ch} 章 通关率 ${Math.round((rs.filter((r) => r.win).length / rs.length) * 100)}%  平均波次 ${(rs.reduce((a, r) => a + r.wave, 0) / rs.length).toFixed(1)}`,
    );
}
console.log(`累计用时 ${Math.round(state.meta.elapsedMs / 1000)} 秒`);

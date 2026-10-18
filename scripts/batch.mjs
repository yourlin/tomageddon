// 并行无头平衡测试（支持中断续跑，每次产出 HTML 报告）
// 用法：npm run build && node scripts/batch.mjs --chapters 1,2,3 --runs 2 [--workers 8] [--speed max] [--budget 30]
//   --speed：每帧模拟步数，默认 max（每帧在 --budget 毫秒预算内尽可能多跑，默认 30）
//   --workers：并发上限（默认 CPU 核数 − 1）；--min-workers：并发下限（默认核数的 40%）；
//   --cpu：目标整机 CPU 占用率（默认 80），并发数在上下限之间据此动态调整
//   --checks：检测项配置（默认 scripts/balance-checks.json），报告按它逐项判定通过 / 偏离 / 严重
//   意外中断后用相同参数重新运行即可从断点继续；加 --fresh 放弃进度从头跑
// 需要本机安装 Google Chrome。
// 报告：reports/balance-<时间>.html（每次一份）、reports/BALANCE_REPORT.html/.md（最新）；reports/ 不进仓库
// 进度：scripts/.batch-progress.json（每局完成即写入，全部完成后转存为 .batch-results.json）
// 武器实战转换率：每次结束都存档 reports/eff-<时间>-<natural|focus>.json，并按数值指纹合并成 reports/weapon-eff.json（见 weapon-eff.mjs）
//
// 专项补测：node scripts/batch.mjs --focus auto|all|<武器id[@T1-4],...> [--focus-runs 3] [--focus-min 20] [--chapters 1,2,3,4,5,6,7]
//   开局强制给一把指定武器和品质（整局不卖、不合成），专门给 bot 平时不选的武器、T4 和超武补转换率样本。
//   auto = 只补合并数据里样本不足 --focus-min 波的武器×品质；all = 全部武器×品质。
//   每个武器×品质跑 --focus-runs 局（默认 4），一半用契合这把武器的角色、一半用不契合的，章节在 --chapters 里轮换（补测默认第 1–7 章）。
//   结果另存 .batch-focus-*.json，不出 HTML 报告（强制给武器的对局不能代表平衡）。
// --no-archive：诊断 / 复现用，不出报告、不存档转换率、不改 weapon-eff.json，进度文件另存 .batch(-focus)-diag-*.json
// --bot-style：默认契合远程 / 元素武器的角色风筝走位；kite = 所有非近战起手角色都风筝；classic = 都不风筝（旧行为）
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { availableParallelism, cpus, setPriority } from 'node:os';
import { readFileSync, writeFileSync, existsSync, renameSync, unlinkSync } from 'node:fs';
import { writeReports } from './report.mjs';
import { archiveAndMerge, describeMerged, mergeArchives } from './weapon-eff.mjs';

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};
// 专项补测默认在第 1–7 章轮换：只跑第 1–3 章时开局给的武器全在怪少血薄的前期章节，实测转换率被系统性压低
// （2026-10-17 实测：同为 T4 近战，补测 74%、普通测试 387%），和普通测试的样本没法放在一起比
const CHAPTERS = arg('chapters', arg('focus', '') ? '1,2,3,4,5,6,7' : '1,2,3')
  .split(',')
  .map(Number);
const RUNS = Number(arg('runs', '1'));
// 并发数按系统 CPU 负载动态调整：--workers 为上限（默认 CPU 核数 − 1），--cpu 为目标整机 CPU 占用率（默认 80%）
const WORKERS = Number(arg('workers', String(Math.max(1, availableParallelism() - 1))));
const CPU_TARGET = Number(arg('cpu', '80'));
// 最低并发数：即使整机被其他程序占用也不低于此值（默认 CPU 核数的 40%）
const MIN_WORKERS = Math.min(WORKERS, Number(arg('min-workers', String(Math.max(2, Math.round(availableParallelism() * 0.4))))));
const SPEED = arg('speed', 'max') === 'max' ? 'max' : Number(arg('speed'));
// 极速模式每帧的模拟预算（毫秒）：不渲染时帧率低也无妨，预算越大吞吐越高（默认 30）
const BUDGET = Number(arg('budget', '30'));
const ONLY = arg('chars', '');
const FRESH = process.argv.includes('--fresh');
// 天赋预设：none 不点（基准）· mid 40 点（中期玩家）· full 79 点（全部天赋点）
// 默认按可获得天赋点的 20% 加点（约 16 / 79 点）；也可以 none / mid / full / 具体点数 / 百分比
const TALENTS = arg('talents', '20%');
// 无尽模式：不限波数，打到阵亡为止（报告里的波次即到达的最远波次）
const ENDLESS = process.argv.includes('--endless');
// 测试用：从天赋预设里去掉指定天赋（逗号分隔），用来找出过强的天赋
const NO_TALENTS = arg('no-talents', '');
// --bot-style kite：远程角色按武器射程放风筝（保持在射程边缘、更早避开近身怪），用来区分「角色弱」还是「bot 不会玩远程」
const BOT_STYLE = arg('bot-style', '');
const TALENT_BUDGET = { none: 0, mid: 40, full: 79 }[TALENTS] ?? (TALENTS.endsWith('%') ? TALENTS : Number(TALENTS));
const PORT = 4174;
const CHROME =
  process.env.CHROME ??
  (process.platform === 'win32'
    ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
    : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
const FOCUS_SPEC = arg('focus', '');
const FOCUS_RUNS = Number(arg('focus-runs', '4'));
const FOCUS_MIN = Number(arg('focus-min', '20'));
// --no-archive：诊断 / 复现用，跑完不存档转换率、不改 weapon-eff.json，进度文件也与正式测试分开
const NO_ARCHIVE = process.argv.includes('--no-archive');
const FILE_TAG = (FOCUS_SPEC ? 'batch-focus' : 'batch') + (NO_ARCHIVE ? '-diag' : '');
const PROGRESS = new URL(`./.${FILE_TAG}-progress.json`, import.meta.url);
const PROGRESS_TMP = new URL(`./.${FILE_TAG}-progress.json.tmp`, import.meta.url);
const RESULTS = new URL(`./.${FILE_TAG}-results.json`, import.meta.url);
const JOB_TIMEOUT = Number(arg('timeout', '240')) * 1000; // 单局超时（秒）
/** 章节波数（与 balance.chapterWaves 一致）：第 1–4 章 15 波，第 5 章 20 波，之后每章 +5，最多 50 */
// 与 src/data/balance.ts 的 chapterWaves 一致（第 7 章覆盖为 25 波）
const chapterWaves = (ch) => (ch <= 4 ? 15 : ch === 7 ? 25 : Math.min(50, 20 + (ch - 5) * 5));
const MAX_RETRY = 2;

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
  stdio: 'ignore',
  shell: process.platform === 'win32',
});
const PAGE_URL = `http://127.0.0.1:${PORT}/?headless=1`;
/** ????????Windows ? shell ???? cmd???????????????? vite ??????? */
function killServer() {
  if (process.platform === 'win32' && server.pid) spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' });
  else server.kill();
}
for (let i = 0; ; i++) {
  try {
    if ((await fetch(PAGE_URL)).ok) break;
  } catch {
    /* 服务未就绪 */
  }
  if (i > 50) {
    console.error('预览服务启动失败（端口被占用或未 build？）');
    killServer();
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 200));
}
const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
const botSrc = readFileSync(new URL('./bot2.js', import.meta.url), 'utf8');

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  protocolTimeout: JOB_TIMEOUT * 4 + 120000, // 覆盖最长的单局（无尽 ×4、长章节 ×2）
  handleSIGINT: false,
  handleSIGTERM: false,
  handleSIGHUP: false,
  args: ['--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'],
});
// 降低测试进程优先级：满载时也优先让出 CPU 给其他程序（之后启动的渲染进程会继承）
try {
  setPriority(0, 10);
  const pid = browser.process()?.pid;
  if (pid) setPriority(pid, 10);
} catch {
  /* 无权限时忽略 */
}

/** 每个页面当前在跑的对局，页面报错时用来标出是哪一局 */
const pageJob = new WeakMap();
async function newWorker() {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  // 报错时带上当前对局（角色 / 章节 / 专项武器）和调用栈顶部几帧，便于定位是哪把武器触发的
  page.on('pageerror', (e) => {
    const job = pageJob.get(page);
    const where = job ? ` [${job.key}${job.focus ? ` 专项 ${job.focus.id}@T${job.focus.tier + 1}` : ''}]` : '';
    const stack = (e.stack ?? '').split('\n').slice(1, 9).join('\n');
    console.error(`\n[页面错误]${where} ${e.message}${stack ? `\n${stack}` : ''}`);
  });
  await page.goto(PAGE_URL);
  await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
  await page.addScriptTag({ type: 'module', content: botSrc });
  await page.waitForFunction(() => typeof window.startBot2 === 'function');
  return page;
}

const firstPage = await newWorker();
const chars = ONLY ? ONLY.split(',') : await firstPage.evaluate(() => window.ALL_CHARS);
const names = await firstPage.evaluate(() => Object.fromEntries(window.__dev.CHARACTERS.map((c) => [c.id, c.name])));
// 当前代码的武器数值指纹：存档时记下，合并时只用指纹一致的历史样本
const FP = await firstPage.evaluate(() => window.__dev.weaponFingerprints());
const jobs = [];
if (!FOCUS_SPEC) {
  for (const ch of CHAPTERS) for (const id of chars) for (let r = 0; r < RUNS; r++) jobs.push({ id, ch, run: r, key: `${ch}:${id}:${r}` });
} else {
  // 每个武器×品质的候选角色：契合这把武器的优先；只能装备契合武器的角色（favoredOnly）不用
  const info = await firstPage.evaluate((chars) => {
    const { WEAPON_MAP, CHARACTER_MAP, isFavoredWeapon } = window.__dev;
    const ok = chars.filter((c) => !CHARACTER_MAP[c].favoredOnly);
    return {
      weapons: Object.values(WEAPON_MAP).map((w) => ({
        id: w.id,
        tiers: w.evolvedFrom || (w.minTier ?? 0) >= 3 ? [3] : [0, 1, 2, 3].filter((t) => t >= (w.minTier ?? 0)),
        fav: ok.filter((c) => isFavoredWeapon(CHARACTER_MAP[c].favored, w)),
      })),
      ok,
    };
  }, chars);
  let combos = info.weapons.flatMap((w) => w.tiers.map((t) => ({ w, t })));
  if (FOCUS_SPEC === 'auto') {
    // 只补样本不足的：按「当前代码」的指纹现场重新合并所有存档（只在内存里算，不写文件）。
    // 不能直接读 weapon-eff.json：它是上次测试结束时按当时的指纹合并的，之后改过数值或 WEAPON_SALT，
    // 里面仍算着已作废的样本，会把该补测的武器当成「样本够了」。
    let have = {};
    try {
      have = mergeArchives({ fp: FP }).weapons;
    } catch (e) {
      console.warn(`读取历史存档失败，按全部需要补测处理：${e.message}`);
    }
    combos = combos.filter(({ w, t }) => (have[w.id]?.[t]?.n ?? 0) < FOCUS_MIN);
  } else if (FOCUS_SPEC !== 'all') {
    const want = FOCUS_SPEC.split(',').map((x) => {
      const [id, tt] = x.split('@');
      return { id, t: tt ? Number(tt.replace(/^T/i, '')) - 1 : null };
    });
    for (const x of want) if (!info.weapons.some((w) => w.id === x.id)) console.warn(`--focus：找不到武器 ${x.id}`);
    combos = combos.filter(({ w, t }) => want.some((x) => x.id === w.id && (x.t === null || x.t === t)));
  }
  // 简单字符串哈希：同一参数每次生成同样的任务列表，中断后能续跑
  const hs = (str) => [...str].reduce((a, c) => (Math.imul(a, 31) + c.charCodeAt(0)) >>> 0, 7);
  for (const { w, t } of combos)
    for (let r = 0; r < FOCUS_RUNS; r++) {
      // 偶数局用契合这把武器的角色，奇数局用不契合的：两边都有样本，才能算出契合收益
      const nofav = info.ok.filter((c) => !w.fav.includes(c));
      const side = r % 2 === 0 ? w.fav : nofav;
      const pool = side.length ? side : info.ok;
      const h0 = hs(`${w.id}@${t}`);
      const id = pool[(h0 + r) % pool.length];
      const ch = CHAPTERS[(h0 + r) % CHAPTERS.length];
      jobs.push({ id, ch, run: r, focus: { id: w.id, tier: t }, key: `F:${w.id}@${t}:${r}` });
    }
  console.log(`专项补测：${combos.length} 个武器×品质 × ${FOCUS_RUNS} 局${FOCUS_SPEC === 'auto' ? `（样本 < ${FOCUS_MIN} 波的）` : ''}`);
  if (!jobs.length) {
    console.log('没有需要补测的武器');
    await browser.close();
    killServer();
    process.exit(0);
  }
}

// ---------- 进度：相同参数自动续跑 ----------
// 检测项配置（报告逐项判定，见 scripts/balance-checks.json）
const CHECKS = arg('checks', '');
const config = { chapters: CHAPTERS, runs: RUNS, speed: SPEED, chars, talents: TALENTS, endless: ENDLESS, noTalents: NO_TALENTS };
if (FOCUS_SPEC) Object.assign(config, { focus: FOCUS_SPEC, focusRuns: FOCUS_RUNS, focusMin: FOCUS_MIN });
let state = {
  meta: {
    ...config,
    mode: FOCUS_SPEC ? 'focus' : 'natural',
    fp: FP,
    version: VERSION,
    workers: WORKERS,
    names,
    total: jobs.length,
    startedAt: Date.now(),
    elapsedMs: 0,
    resumed: 0,
  },
  results: [],
};
if (existsSync(PROGRESS) && !FRESH) {
  const prev = JSON.parse(readFileSync(PROGRESS, 'utf8'));
  const same =
    JSON.stringify({
      chapters: prev.meta.chapters,
      runs: prev.meta.runs,
      speed: prev.meta.speed,
      chars: prev.meta.chars,
      talents: prev.meta.talents ?? 'none',
      ...(FOCUS_SPEC ? { focus: prev.meta.focus, focusRuns: prev.meta.focusRuns, focusMin: prev.meta.focusMin } : {}),
    }) ===
      JSON.stringify({
        chapters: config.chapters,
        runs: config.runs,
        speed: config.speed,
        chars: config.chars,
        talents: config.talents,
        ...(FOCUS_SPEC ? { focus: config.focus, focusRuns: config.focusRuns, focusMin: config.focusMin } : {}),
      }) &&
    // 数值改过（指纹不同）就不续跑：前后两半数据不可比
    prev.meta.fp?.global === FP.global;
  if (same) {
    state = prev;
    state.meta = { ...prev.meta, fp: FP, version: VERSION, workers: WORKERS, names, resumed: (prev.meta.resumed ?? 0) + 1 };
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
  writeFileSync(PROGRESS_TMP, JSON.stringify(state));
  renameSync(PROGRESS_TMP, PROGRESS);
}
saveProgress();

function report(complete) {
  // 专项补测强制给武器，不代表正常平衡，不出 HTML 报告
  if (!FOCUS_SPEC && !NO_ARCHIVE) {
    const file = writeReports(
      { ...state.meta, complete, finishedAt: Date.now(), ...(CHECKS ? { checksFile: CHECKS } : {}) },
      state.results,
    );
    console.log(`报告：${file}`);
  }
  // 只有完整跑完才存档转换率（中断的半份数据等续跑完再存，避免同一批样本存两次）
  if (complete && NO_ARCHIVE) console.log('--no-archive：不存档转换率');
  else if (complete) {
    const { file, merged } = archiveAndMerge({ ...state.meta, complete, finishedAt: Date.now() }, state.results);
    console.log(`转换率存档：${file}\n${describeMerged(merged)}`);
  }
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
  killServer();
  process.exit(130);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGHUP', () => shutdown('SIGHUP'));

console.log(
  `角色 ${chars.length} × 章节 ${CHAPTERS.join('/')} × ${RUNS} 次 = ${jobs.length} 局，待跑 ${queue.length} 局，并行 ${MIN_WORKERS}~${WORKERS}（目标 CPU ${CPU_TARGET}%），${SPEED === 'max' ? '极速' : SPEED + ' 倍速'}`,
);

const t0 = Date.now();
const retries = {};
// 长章节（20 / 25 / 30 波）按波数放大单局超时，避免第 7 章这种 30 波章节没打完就被判超时
const jobLimit = (job) => (ENDLESS ? JOB_TIMEOUT * 4 : JOB_TIMEOUT * Math.max(1, chapterWaves(job.ch) / 15));
/** 页面内的超时靠页面自己的定时器；页面主线程卡死或渲染进程悄悄崩掉时它永远不会触发，
 *  evaluate 也不返回，整轮测试会卡在最后一局。这里在 Node 侧再加一道看门狗：超过单局上限 60 秒仍无结果，
 *  就按出错处理（重建页面、把这局放回队列重试） */
async function playJob(page, job) {
  let timer;
  const guard = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`页面无响应：超过单局上限 ${Math.round(jobLimit(job) / 1000) + 60} 秒仍未返回`)),
      jobLimit(job) + 60000,
    );
  });
  try {
    return await Promise.race([playJobInPage(page, job), guard]);
  } finally {
    clearTimeout(timer);
  }
}
async function playJobInPage(page, job) {
  return page.evaluate(
    async ({ id, ch, speed, budget, limit, talents, endless, noTalents, botStyle, focus }) => {
      window.__dmg = [];
      window.__botStyle = botStyle;
      window.__focus = focus ?? null;
      window.botTalents(id, talents, noTalents ? noTalents.split(',') : []);
      window.startBot2(id, ch, speed, budget);
      if (endless) window.run.endless = true;
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
        perSeed: window.__dev.BALANCE?.loot.perSeed,
        topDmg: Object.entries(agg)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k, v]) => `${k}:${Math.round(v)}`)
          .join(' '),
      };
    },
    {
      ...job,
      speed: SPEED,
      budget: BUDGET,
      limit: jobLimit(job),
      talents: TALENT_BUDGET,
      endless: ENDLESS,
      noTalents: NO_TALENTS,
      botStyle: BOT_STYLE,
    },
  );
}
// ---------- 动态并发 ----------
let limit = Math.max(MIN_WORKERS, Math.ceil(WORKERS / 2));
let lastCpu = cpuSample();
let cpuNow = 0;
function cpuSample() {
  let idle = 0,
    total = 0;
  for (const c of cpus()) {
    for (const v of Object.values(c.times)) total += v;
    idle += c.times.idle;
  }
  return { idle, total };
}
const controller = setInterval(() => {
  const s = cpuSample();
  cpuNow = Math.round((1 - (s.idle - lastCpu.idle) / Math.max(1, s.total - lastCpu.total)) * 100);
  lastCpu = s;
  if (cpuNow > CPU_TARGET + 5 && limit > MIN_WORKERS) limit--;
  else if (cpuNow < CPU_TARGET - 10 && limit < WORKERS && queue.length > limit) limit++;
}, 2000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- 进度条：已完成比例、已用时间、预计剩余、当前并行与 CPU ----------
const doneAtStart = state.results.length;
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
function progress() {
  const done = state.results.length,
    total = jobs.length;
  const ratio = total ? done / total : 1;
  const width = 24,
    fill = Math.round(ratio * width);
  const elapsed = (Date.now() - t0) / 1000;
  const doneHere = done - doneAtStart;
  const eta = doneHere > 0 ? mmss((elapsed / doneHere) * (total - done)) : '--:--';
  const bar = '█'.repeat(fill) + '░'.repeat(width - fill);
  process.stdout.write(
    `\r[${bar}] ${Math.round(ratio * 100)}% ${done}/${total} · 已用 ${mmss(elapsed)} · 预计剩余 ${eta} · 并行 ${limit} · CPU ${cpuNow}%   `,
  );
}
const ticker = setInterval(progress, 1000);

/** 并发槽位：序号 ≥ 当前并发上限时暂停（进行中的局会跑完）；页面按需创建 */
async function worker(slot, page) {
  while (queue.length && !stopping) {
    if (slot >= limit) {
      await sleep(500);
      continue;
    }
    if (!page) {
      page = await newWorker().catch(() => null);
      if (!page) {
        await sleep(2000);
        continue;
      }
    }
    const job = queue.shift();
    if (!job) break;
    try {
      pageJob.set(page, job);
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
    progress();
  }
}
await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(i, i === 0 ? firstPage : null)));
clearInterval(controller);
clearInterval(ticker);
progress();
if (stopping) await new Promise(() => {}); // 交给 shutdown 收尾退出
console.log('');
await browser.close();
killServer();

// ---------- 汇总 ----------
const complete = state.results.length >= jobs.length;
saveProgress();
report(complete);
if (complete) {
  // 连同元信息一起存：之后单独重新生成报告（report.mjs）时，章节、局数、用时等不会丢
  writeFileSync(RESULTS, JSON.stringify({ meta: { ...state.meta, finishedAt: Date.now() }, results: state.results }, null, 1));
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

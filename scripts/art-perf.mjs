// 外部美术性能 / 截图基线（ART_REPLACEMENT_ROADMAP M0）：同一章节、固定随机种子、固定怪物数量，
// 记录帧耗时 p50 / p95 / p99、首次与缓存后加载时间、纹理 / 显示对象 / 事件监听数量与 JS 堆，并截图。
// 用法：npm run build && node scripts/art-perf.mjs [--label base] [--art 0|1] [--mobile] [--chapter 1] [--seconds 8]
//   --art 0：强制程序化外观（?art=0），用来采集程序版基线；默认 1（使用清单里的外部美术）
//   --mobile：模拟低内存移动设备（iPhone UA → LOW_MEM 模式、844×390@3x、CPU 降速 4 倍）
//   --url：被测地址（默认在 4175 端口启动 vite preview 预览 dist/）；Steam 构建关闭了调试入口，不能用本脚本驱动
// 输出：reports/art-perf-<label>.json 与 reports/art-baseline/<label>-*.png（reports/ 不进仓库）
// 对比两份结果：node scripts/art-perf.mjs --compare reports/art-perf-a.json reports/art-perf-b.json
import puppeteer from 'puppeteer-core';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 ? process.argv[i + 1] : d;
};

if (process.argv.includes('--compare')) {
  const i = process.argv.indexOf('--compare');
  const [a, b] = [process.argv[i + 1], process.argv[i + 2]].map((f) => JSON.parse(readFileSync(f, 'utf8')));
  const configErrors = ['fixtureVersion', 'mobile', 'viewport', 'quality', 'chapter', 'boss', 'seed', 'seconds']
    .filter((key) => JSON.stringify(a[key]) !== JSON.stringify(b[key]))
    .map((key) => `Different ${key}`);
  if (a.errors?.length || b.errors?.length) configErrors.push('Benchmark contains page errors');
  if (a.scenarios.length !== b.scenarios.length) configErrors.push('Different scenario count');
  const comparisons = [];
  console.log(`对比：${a.label} → ${b.label}`);
  for (const s of a.scenarios) {
    const t = b.scenarios.find((x) => x.name === s.name);
    if (!t) {
      configErrors.push(`Missing scenario ${s.name}`);
      continue;
    }
    if (s.target !== t.target || s.alive !== t.alive || JSON.stringify(s.canvas) !== JSON.stringify(t.canvas))
      configErrors.push(`Different population/canvas: ${s.name}`);
    const d = ((t.work.p95 - s.work.p95) / s.work.p95) * 100;
    comparisons.push({ name: s.name, beforeWorkP95: s.work.p95, afterWorkP95: t.work.p95, changePercent: d, budgetPassed: d <= 15 });
    console.log(
      `  ${s.name.padEnd(8)} 帧间隔 p95 ${s.frame.p95.toFixed(2)} → ${t.frame.p95.toFixed(2)} ms · 每帧工作 p95 ${s.work.p95.toFixed(2)} → ${t.work.p95.toFixed(2)} ms（${d >= 0 ? '+' : ''}${d.toFixed(1)}%${d > 15 ? '，超过 15% 门槛' : ''}）` +
        ` · 纹理 ${s.textures} → ${t.textures} · 堆 ${s.heapMB} → ${t.heapMB} MB`,
    );
  }
  console.log(`  首次加载 ${a.load.coldMs} → ${b.load.coldMs} ms · 缓存后 ${a.load.warmMs} → ${b.load.warmMs} ms`);
  const passed = !configErrors.length && comparisons.every((c) => c.budgetPassed);
  const reportPath = arg('comparison-report', '');
  if (reportPath)
    writeFileSync(
      reportPath,
      JSON.stringify(
        {
          status: passed ? 'passed' : 'failed',
          before: a.label,
          after: b.label,
          scope:
            'Same-config render-work comparison; art=0 is procedural appearance with the shared loading pipeline, not a no-art memory baseline. Browser emulation is not physical-device evidence.',
          configErrors,
          comparisons,
        },
        null,
        2,
      ),
    );
  if (configErrors.length) console.error('Cannot compare:', configErrors.join('; '));
  process.exit(configErrors.length || (process.argv.includes('--assert-budget') && !passed) ? 1 : 0);
}

const LABEL = arg('label', 'base');
const ART = arg('art', '1');
const MOBILE = process.argv.includes('--mobile');
const WIDTH = Number(arg('width', MOBILE ? '844' : '1280'));
const HEIGHT = Number(arg('height', MOBILE ? '390' : '720'));
const QUALITY = arg('quality', 'auto');
if (!['auto', 'low', 'standard', 'high'].includes(QUALITY)) throw Error('Invalid graphics quality');
const CHAPTER = Number(arg('chapter', '1'));
const BOSS = arg('boss', '');
if (BOSS && !/^[a-z_]+$/.test(BOSS)) throw Error('Invalid Boss id');
if (BOSS && !arg('url', '')) throw Error('Boss fixture requires a local development --url');
const SECONDS = Number(arg('seconds', '8'));
const SEED = Number(arg('seed', '20261018'));
const PORT = 4175;
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
/** 常规战斗 / 高密度场景的同屏怪物数量（高密度接近 BALANCE.maxEnemies） */
const SCENARIOS = [
  { name: 'normal', enemies: 60 },
  { name: 'dense', enemies: 240 },
];

let server = null;
let URL_BASE = arg('url', '');
if (!URL_BASE) {
  server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    stdio: 'ignore',
    detached: true, // 独立进程组：结束时连同 npx 拉起的 vite 子进程一起关掉
  });
  URL_BASE = `http://127.0.0.1:${PORT}/`;
  for (let i = 0; ; i++) {
    try {
      if ((await fetch(URL_BASE)).ok) break;
    } catch {
      /* 未就绪 */
    }
    if (i > 50) throw new Error('预览服务启动失败（端口被占用或未 build？）');
    await new Promise((r) => setTimeout(r, 200));
  }
}
const url = `${URL_BASE}${URL_BASE.includes('?') ? '&' : '?'}${ART === '0' ? 'art=0' : 'art=1'}`;

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: [
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--enable-precise-memory-info',
    '--use-angle=metal',
    '--js-flags=--expose-gc',
  ],
});
const errors = [];

async function openPage() {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await freezeArtHmr(page);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  if (MOBILE) {
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    );
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 3, isMobile: true, hasTouch: true, isLandscape: true });
    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  } else await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument((quality) => {
    if (!location.protocol.startsWith('http')) return;
    const key = 'tomato_sister_save_v1';
    const value = JSON.parse(localStorage.getItem(key) ?? '{}');
    value.settings = { ...value.settings, graphicsQuality: quality, hiDpi: true };
    localStorage.setItem(key, JSON.stringify(value));
  }, QUALITY);
  // RGBA8 base-level estimate of unique resident WebGL sources, not texture-key count.
  // Driver padding, mipmaps, framebuffers and browser decoded-image memory are excluded.
  await page.evaluateOnNewDocument(() => {
    window.__artTextureFootprint = () => {
      const seen = new Set();
      const categories = {};
      for (const [key, texture] of Object.entries(window.game.textures.list)) {
        const data = texture.customData ?? {};
        const category = data.illustratedWeapon
          ? 'weapon-illustration'
          : data.illustratedProjectile
            ? 'projectile-illustration'
            : /motion/.test(key)
              ? 'motion'
              : key.startsWith('art:') || key.startsWith('combat:')
                ? 'other-art'
                : 'procedural-and-ui';
        for (const source of texture.source ?? []) {
          const identity = source.glTexture;
          if (!identity || seen.has(identity)) continue;
          seen.add(identity);
          const bucket = (categories[category] ??= { sources: 0, rgbaBaseBytes: 0 });
          bucket.sources++;
          bucket.rgbaBaseBytes += source.width * source.height * 4;
        }
      }
      return { categories, sources: seen.size, rgbaBaseBytes: Object.values(categories).reduce((sum, row) => sum + row.rgbaBaseBytes, 0) };
    };
  });
  // 固定随机种子（与 dev/seed.ts 同一算法），让刷怪位置、暴击、掉落可重复
  await page.evaluateOnNewDocument((seed) => {
    let a = seed >>> 0;
    Math.random = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }, SEED);
  return { ctx, page };
}

const menuReady = (page) =>
  page.waitForFunction(() => window.game?.scene.getScenes(true).some((s) => s.scene.key === 'Menu'), { timeout: 120000 });

try {
  const { ctx, page } = await openPage();
  mkdirSync('reports/art-baseline', { recursive: true });
  let t0 = Date.now();
  await page.goto(url);
  await menuReady(page);
  const coldMs = Date.now() - t0;
  t0 = Date.now();
  await page.reload();
  await menuReady(page);
  const warmMs = Date.now() - t0;
  // Menu is interactive before background fallback textures finish. Real UI routes
  // wait at gateSceneStart; our direct scene fixture must honor the same gate.
  // Otherwise stopping Boot leaves missing UI/effect textures and understates memory.
  await page.waitForFunction(() => !window.game.scene.isActive('Boot'), { timeout: 120000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: `reports/art-baseline/${LABEL}-menu.png` });

  // Optional isolated fixture: selected final-phase Boss plus the fixed wave population.
  // HP-gated phase transitions are verified separately by preview-global-boss-phases.mjs.
  await page.evaluate(() => {
    window.__perfSetupBoss = async (scene, id) => {
      if (!id) return null;
      const { BOSS_MAP } = await import('/src/data/bosses.ts');
      const { queueArt } = await import('/src/systems/ArtRegistry.ts');
      const { queueCombatArt, bossForm } = await import('/src/systems/CombatArt.ts');
      const { queueProjectileArt } = await import('/src/systems/ProjectileArtRegistry.ts');
      const { projectileArtDeps } = await import('/src/systems/ProjectileArtDeps.ts');
      const definition = BOSS_MAP[id];
      if (!definition) throw Error('Unknown fixture Boss: ' + id);
      await new Promise((resolve) => {
        scene.load.once('complete', resolve);
        queueArt(scene, { bodies: [{ kind: 'boss', id }] }, 'Game');
        queueCombatArt(scene, window.run.chapterId, new Set([id]));
        queueProjectileArt(
          scene,
          projectileArtDeps(
            window.run.weapons.map((w) => w.id),
            [id],
          ),
        );
        scene.load.start();
      });
      const point = scene.arena.clamp(scene.player.x + 280, scene.player.y - 140, definition.radius);
      const enemy = scene.spawnBossNow(id, point.x, point.y, []);
      if (!enemy) throw Error('No slot for fixture Boss');
      enemy.hp = enemy.maxHp = 1e9;
      scene.iframes = 100000;
      const phase = (definition.phases?.length ?? 1) - 1;
      if (phase > 0) {
        enemy.phaseIdx = phase;
        enemy.setPhasePatterns(definition.phases[phase], true);
        const form = bossForm(scene, id, phase);
        if (form && !enemy.rig.setBossForm(form, 0)) throw Error('Boss fixture phase texture failed');
      }
      return enemy;
    };
  });

  const scenarios = [];
  for (const sc of SCENARIOS) {
    const r = await page.evaluate(
      async ({ ch, enemies, seconds, boss }) => {
        const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
        const { run, game } = window;
        const fixtureScene = game.scene.getScene('Game');
        const automaticSpawn = fixtureScene.updateSpawning;
        const queuedSpawn = fixtureScene.queueSpawn;
        // Disable only in this isolated browser fixture, before create() queues warnings.
        fixtureScene.updateSpawning = () => {};
        fixtureScene.queueSpawn = () => {};
        run.start('tomato', ch, false, 0);
        run.wave = 8;
        game.scene.getScenes(true).forEach((s) => s.scene.stop());
        game.scene.start('Game');
        await sleep(1500);
        const g = game.scene.getScene('Game');
        const bossActor = await window.__perfSetupBoss(g, boss);
        const bossFrames = new Set();
        const pool = run.chapter.pool.filter((p) => run.wave >= p.from && (p.to === undefined || run.wave <= p.to)).map((p) => p.enemy);
        if (!pool.length) throw Error('Empty current-wave fixture pool');
        let i = 0;
        // 维持固定怪物数量、玩家不死、本波不结束
        const spawnEnemy = g.spawnEnemyNow;
        g.spawnEnemyNow = function (...args) {
          if (this.enemies.filter((e) => e.alive).length >= enemies) return null;
          return spawnEnemy.apply(this, args);
        };
        const maintainPopulation = () => {
          run.hp = 1e7;
          if (bossActor?.alive && bossActor.rig?.img) bossFrames.add(String(bossActor.rig.img.frame.name));
          g.timeLeft = 999;
          const alive = g.enemies.filter((e) => e.alive).length;
          for (let k = alive; k < enemies; k++) {
            const a = (i++ * 2.399) % (Math.PI * 2);
            const d = 260 + (i % 7) * 40;
            const p = g.arena.clamp(g.player.x + Math.cos(a) * d, g.player.y + Math.sin(a) * d, 30);
            const e = g.spawnEnemyNow(pool[i % pool.length], p.x, p.y);
            if (e) e.hp = e.maxHp = 1e9;
          }
        };
        // Self-destructing and summoning actors remain active; replenish after logic,
        // before rendering, and cap all spawn paths to the selected population.
        g.events.on('postupdate', maintainPopulation);
        maintainPopulation();
        await sleep(1500);
        const dts = [];
        const aliveSamples = [];
        // 每帧实际工作时间（逻辑 + 渲染提交）：帧间隔受垂直同步限制，看不出余量
        const works = [];
        // Phaser 的主循环持有 bind 过的 step，改用每帧开始 / 渲染结束事件计时
        let s0 = 0;
        const onPre = () => (s0 = performance.now());
        const onPost = () => s0 && works.push(performance.now() - s0);
        game.events.on('prestep', onPre);
        game.events.on('postrender', onPost);
        let last = performance.now();
        const end = last + seconds * 1000;
        await new Promise((res) => {
          const f = (t) => {
            dts.push(t - last);
            aliveSamples.push(g.enemies.filter((e) => e.alive).length);
            last = t;
            if (t < end) requestAnimationFrame(f);
            else res();
          };
          requestAnimationFrame(f);
        });
        g.events.off('postupdate', maintainPopulation);
        g.spawnEnemyNow = spawnEnemy;
        fixtureScene.updateSpawning = automaticSpawn;
        fixtureScene.queueSpawn = queuedSpawn;
        if (bossActor && (!bossActor.alive || (bossActor.rig.mode === 'spritesheet' && bossFrames.size < 2)))
          throw Error('Boss fixture did not keep animating');
        if (aliveSamples.some((n) => n !== enemies))
          throw new Error(
            `Uncontrolled enemy count: target ${enemies}, observed ${Math.min(...aliveSamples)}–${Math.max(...aliveSamples)}`,
          );
        game.events.off('prestep', onPre);
        game.events.off('postrender', onPost);
        dts.sort((a, b) => a - b);
        works.sort((a, b) => a - b);
        const q = (p, arr = dts) => arr[Math.min(arr.length - 1, Math.floor(arr.length * p))];
        const listeners = g.events.eventNames().reduce((n, k) => n + g.events.listenerCount(k), 0);
        const modes = {};
        for (const e of g.enemies) if (e.alive && e.rig) modes[e.rig.mode] = (modes[e.rig.mode] ?? 0) + 1;
        const missingTextureObjects = [];
        const visited = new Set();
        const inspect = (object) => {
          if (!object || visited.has(object)) return;
          visited.add(object);
          if (object.texture?.key === '__MISSING') missingTextureObjects.push({ type: object.type, x: object.x, y: object.y });
          if (Array.isArray(object.list)) object.list.forEach(inspect);
        };
        game.scene.getScenes(true).forEach((scene) => scene.children.list.forEach(inspect));
        if (missingTextureObjects.length)
          throw Error('Invalid benchmark: missing textures ' + JSON.stringify(missingTextureObjects.slice(0, 5)));
        return {
          alive: g.enemies.filter((e) => e.alive).length,
          aliveRange: [Math.min(...aliveSamples), Math.max(...aliveSamples)],
          canvas: [game.canvas.width, game.canvas.height],
          playerMode: g.player.mode,
          scope:
            'Animated tomato and optional final-phase Boss; fixed current-wave population includes the Boss. Existing enemies remain static/procedural; future enemy animations are not covered.',
          boss: bossActor ? { id: boss, phase: bossActor.phaseIdx, mode: bossActor.rig.mode, drawnFramesSeen: bossFrames.size } : null,

          frame: { avg: dts.reduce((a, b) => a + b, 0) / dts.length, p50: q(0.5), p95: q(0.95), p99: q(0.99), frames: dts.length },
          work: { avg: works.reduce((a, b) => a + b, 0) / works.length, p50: q(0.5, works), p95: q(0.95, works), p99: q(0.99, works) },
          textures: Object.keys(game.textures.list).length,
          textureFootprint: window.__artTextureFootprint(),
          displayObjects: g.children.list.length,
          listeners,
          heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
          player: g.player.mode,
          modes,
          missingTextureObjects,
        };
      },
      { ch: CHAPTER, enemies: sc.enemies, seconds: SECONDS, boss: BOSS },
    );
    await page.evaluate(() => window.game.scene.getScene('Game').scene.pause());
    await page.screenshot({ path: `reports/art-baseline/${LABEL}-${sc.name}.png` });
    scenarios.push({ name: sc.name, target: sc.enemies, ...r });
    console.log(
      `${sc.name.padEnd(8)} 怪 ${r.alive} · 帧 avg ${r.frame.avg.toFixed(2)} p50 ${r.frame.p50.toFixed(2)} p95 ${r.frame.p95.toFixed(2)} p99 ${r.frame.p99.toFixed(2)} ms` +
        ` · 工作 p50 ${r.work.p50.toFixed(2)} p95 ${r.work.p95.toFixed(2)} ms · 纹理 ${r.textures} · 对象 ${r.displayObjects} · 监听 ${r.listeners} · 堆 ${r.heapMB} MB · 外观 ${JSON.stringify(r.modes)}`,
    );
  }

  // 泄漏检查：反复开局 / 回菜单，纹理、监听与堆不应持续增长
  const leak = await page.evaluate(
    async ({ ch, boss }) => {
      const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
      const { run, game } = window;
      const snap = () => {
        window.gc?.(); // 强制回收后再量堆，避免把未回收的垃圾当成泄漏
        const g = game.scene.getScene('Game');
        return {
          textures: Object.keys(game.textures.list).length,
          textureFootprint: window.__artTextureFootprint(),
          gameListeners: g ? g.events.eventNames().reduce((n, k) => n + g.events.listenerCount(k), 0) : 0,
          listenerEvents: g ? Object.fromEntries(g.events.eventNames().map((k) => [String(k), g.events.listenerCount(k)])) : {},
          heapMB: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null,
        };
      };
      const out = [];
      for (let i = 0; i < 6; i++) {
        run.start('tomato', ch, false, 0);
        game.scene.getScenes(true).forEach((s) => s.scene.stop());
        game.scene.start('Game');
        await sleep(2500);
        if (boss) {
          await window.__perfSetupBoss(game.scene.getScene('Game'), boss);
          await sleep(600);
        }
        game.scene.getScenes(true).forEach((s) => s.scene.stop());
        game.scene.start('Menu');
        await sleep(800);
        window.gc?.();
        await sleep(200);
        out.push(snap());
      }
      return out;
    },
    { ch: CHAPTER, boss: BOSS },
  );
  console.log(`反复开局 6 次：纹理 ${leak.map((x) => x.textures).join(' → ')} · 堆 ${leak.map((x) => x.heapMB).join(' → ')} MB`);

  const result = {
    label: LABEL,
    date: new Date().toISOString(),
    art: ART !== '0',
    mobile: MOBILE,
    viewport: { width: WIDTH, height: HEIGHT },
    quality: QUALITY,
    chapter: CHAPTER,
    boss: BOSS || null,
    fixtureVersion: 3,
    seed: SEED,
    seconds: SECONDS,
    load: { coldMs, warmMs },
    scenarios,
    leak,
    errors,
  };
  writeFileSync(`reports/art-perf-${LABEL}.json`, JSON.stringify(result, null, 2));
  console.log(
    `加载：首次 ${coldMs} ms · 缓存后 ${warmMs} ms${errors.length ? ` · 页面错误 ${errors.length} 条：${errors.slice(0, 3).join(' | ')}` : ' · 无页面错误'}`,
  );
  console.log(`已写入 reports/art-perf-${LABEL}.json、reports/art-baseline/${LABEL}-*.png`);
  await ctx.close();
  if (errors.length) process.exitCode = 1;
} finally {
  await closeArtBrowser(browser);
  if (server?.pid) process.kill(-server.pid);
}

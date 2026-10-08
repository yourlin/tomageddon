// 导出文档用实战动图：在无头 Chrome 里用开发者沙盒（不刷怪、不计时）开一局，角色周围摆一圈不会动的靶子，
// 暂停游戏主循环后逐帧推进并截取角色周围的画面，用 img2webp 合成循环播放的动态 WebP
//   skill  技能：角色不带武器，开场释放一次技能   → docs/images/skill/<角色 id>.webp（SKILLS.md）
//   weapon 武器：番茄妹只带这一把武器自动攻击     → docs/images/weapon/<id>.webp（WEAPONS.md）
// 用法：npm run docs:combat [-- --only skill] [-- --ids fork,knife]
// （需要本机安装 Google Chrome 与 webp 工具：brew install webp；缩放用 macOS 自带的 sips）
import puppeteer from 'puppeteer-core';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 4178;
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = fileURLToPath(new URL('../docs/images/', import.meta.url));
const FPS = 15;
const STEP_MS = 1000 / 30; // 每帧推进两步，碰撞与特效判定更细
// clip：截取角色周围的区域（逻辑像素）；武器多是近身攻击，取景更近
const SPEC = { skill: { frames: 30, size: 160, q: 70, clip: 360 }, weapon: { frames: 30, size: 128, q: 65, clip: 300 } };
const arg = (k) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > 0 ? process.argv[i + 1].split(',') : null;
};
const ONLY = arg('only') ?? ['skill', 'weapon'];
const IDS = arg('ids');

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const URL_ = `http://localhost:${PORT}/?lang=zh`;
for (let i = 0; ; i++) {
  try {
    if ((await fetch(URL_)).ok) break;
  } catch {
    /* 服务未就绪 */
  }
  if (i > 100) throw new Error('开发服务器启动失败');
  await new Promise((r) => setTimeout(r, 200));
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const tmp = mkdtempSync(join(tmpdir(), 'combat-'));

async function openPage() {
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  p.on('pageerror', (e) => console.error('[页面错误]', e.message));
  // 干净存档：不弹教程 / 成就
  await p.evaluateOnNewDocument(() => localStorage.clear());
  await p.goto(URL_);
  await p.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 120000 });
  // 贴图在后台分帧生成：等队列清空，否则图标会是缺失贴图
  await p.evaluate(async () => (await import('/src/systems/TexQueue.ts')).flushTex());
  await p.waitForFunction(() => import('/src/systems/TexQueue.ts').then((Q) => Q.texReady()), { timeout: 120000 });
  // 隐藏成就等 DOM 提示
  await p.addStyleTag({ content: '#game > div:not(:has(canvas)) { display: none !important; }' });
  return p;
}

async function capture(page, kind, id) {
  const spec = SPEC[kind];
  // 开局：沙盒 + 指定角色 / 武器
  await page.evaluate(
    async (kind, id) => {
      const { WEAPON_MAP, isShopWeapon } = await import('/src/data/weapons.ts');
      const { EVOLVED_WEAPONS } = await import('/src/data/evolutions.ts');
      const { GameScene, run, game } = window;
      if (game.loop.sleeping) game.loop.wake();
      GameScene.sandbox = { terrain: false, deaths: 0 };
      GameScene.simSpeed = 1;
      run.start(kind === 'skill' ? id : 'tomato', 1);
      run.wave = 6;
      run.weapons = [];
      if (kind === 'weapon') {
        // 合成专属 T4 / 超武按 T4 展示，其余按 T3
        const w = WEAPON_MAP[id] ?? EVOLVED_WEAPONS.find((x) => x.id === id);
        run.addWeapon(id, !w || w.evolvedFrom || !isShopWeapon(w) ? 3 : 2);
      }
      // 武器展示加攻速，2 秒的循环里多出几次攻击
      if (kind === 'weapon') run.levelMods = { attackSpeed: 80 };
      run.dirty();
      game.scene.getScenes(true).forEach((s) => s.scene.stop());
      game.scene.start('Game');
    },
    kind,
    id,
  );
  // 战斗场景偶尔起不来（首次进入时分包还在加载）：等不到就重新启动，最多 3 次
  for (let k = 0; ; k++) {
    const ok = await page
      .waitForFunction(() => game.scene.isActive('Game') && game.scene.getScene('Game').player, { timeout: 12000 })
      .then(() => true)
      .catch(() => false);
    if (ok) break;
    if (k >= 2) throw new Error(`${kind} ${id}：战斗场景启动失败`);
    await page.evaluate(() => {
      game.scene.getScenes(true).forEach((s) => s.scene.stop());
      game.scene.start('Game');
    });
  }
  await page.evaluate(() => {
    const g = game.scene.getScene('Game');
    g.damagePlayer = () => {};
    g.hurtDirect = () => {};
    g.enragePressure = () => {};
    // 技能先锁住冷却（开局冷却就绪会被自动释放），录制时再手动放
    g.skill.cd = 999;
    // HUD 不入镜
    game.scene.getScene('Hud')?.sys.setVisible(false);
    // 一圈不会动、打不死的靶子
    const ids = ['mold', 'fly', 'maggot', 'rotten_apple'];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = i % 2 ? 120 : 175;
      const e = g.spawnEnemyNow(ids[i % ids.length], g.player.x + Math.cos(a) * r, g.player.y + Math.sin(a) * r);
      if (e) {
        e.speed = 0;
        e.hp = e.maxHp = 1e9;
        e.__home = [e.x, e.y];
      }
    }
  });
  // 让武器先转起来（冷却、环绕类武器就位）
  await new Promise((r) => setTimeout(r, kind === 'weapon' ? 700 : 300));
  const rect = await page.evaluate(() => {
    const c = game.canvas.getBoundingClientRect();
    return { x: c.left + c.width / 2, y: c.top + c.height / 2 };
  });
  await page.evaluate(() => game.loop.sleep());
  const files = [];
  let t = performance.now();
  for (let f = 0; f < spec.frames; f++) {
    await page.evaluate(
      (f, kind, STEP_MS, t) => {
        const g = game.scene.getScene('Game');
        if (kind === 'skill' && f === 2) {
          g.skill.cd = 0;
          g.skill.use();
        }
        // 靶子不会死、不会动（被击退后也拉回原处附近）
        for (const e of g.enemies) {
          e.hp = Math.max(e.hp, 1e8);
          e.speed = 0;
          if (e.__home) {
            e.x += (e.__home[0] - e.x) * 0.25;
            e.y += (e.__home[1] - e.y) * 0.25;
          }
        }
        game.step(t, STEP_MS);
        game.step(t + STEP_MS, STEP_MS);
      },
      f,
      kind,
      STEP_MS,
      (t += STEP_MS * 2),
    );
    const file = join(tmp, `${kind}_${id}_${String(f).padStart(3, '0')}.png`);
    await page.screenshot({
      path: file,
      clip: { x: rect.x - spec.clip / 2, y: rect.y - spec.clip / 2, width: spec.clip, height: spec.clip },
    });
    execFileSync('sips', ['-Z', String(spec.size), file], { stdio: 'ignore' });
    // 画布偶尔是空的（整帧纯黑，PNG 很小）：判为失败，交给外层重开页面重试
    if (f === 0 && statSync(file).size < 4000) throw new Error('截到空白画面');
    files.push(file);
  }
  await page.evaluate(() => game.loop.wake());
  const dir = join(OUT, kind);
  mkdirSync(dir, { recursive: true });
  execFileSync(
    'img2webp',
    ['-loop', '0', '-lossy', '-q', String(spec.q), '-d', String(Math.round(1000 / FPS)), ...files, '-o', join(dir, `${id}.webp`)],
    { stdio: 'ignore' },
  );
  for (const f of files) rmSync(f);
}

try {
  let page = await openPage();

  const jobs = await page.evaluate(async (ONLY) => {
    const { CHARACTERS } = await import('/src/data/characters.ts');
    const { WEAPONS } = await import('/src/data/weapons.ts');
    const { EVOLVED_WEAPONS } = await import('/src/data/evolutions.ts');
    const ids = { skill: CHARACTERS.map((c) => c.id), weapon: [...WEAPONS, ...EVOLVED_WEAPONS].map((w) => w.id) };
    return ONLY.flatMap((k) => ids[k].map((id) => [k, id]));
  }, ONLY);
  const count = {};
  for (const [kind, id] of jobs) {
    if (IDS && !IDS.includes(id)) continue;
    // 偶发失败（场景切换、贴图未就绪等）：重开页面重试，最多 3 次
    for (let k = 0; ; k++) {
      try {
        await capture(page, kind, id);
        break;
      } catch (e) {
        console.error(`${kind} ${id} 失败（第 ${k + 1} 次）：${e.message.split('\n')[0]}`);
        if (k >= 2) throw e;
        await page.close().catch(() => {});
        page = await openPage();
      }
    }
    count[kind] = (count[kind] ?? 0) + 1;
    if (count[kind] % 20 === 0) console.log('进度', count);
  }
  console.log('导出实战动图：', count);
} finally {
  await browser.close();
  server.kill();
  rmSync(tmp, { recursive: true, force: true });
}

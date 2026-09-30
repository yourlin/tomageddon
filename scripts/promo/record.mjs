// 宣传视频素材录制：在无头 Chrome 中按脚本操作游戏，逐段录屏到 promo/raw/，并录制配乐到 promo/raw/music.webm
// 用法：node scripts/promo/record.mjs [片段名...]（不传则录制全部）
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const PORT = 5191;
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = new URL('../../promo/raw/', import.meta.url);
mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
for (let i = 0; ; i++) {
  try {
    if ((await fetch(`http://localhost:${PORT}/`)).ok) break;
  } catch {
    /* 未就绪 */
  }
  if (i > 150) throw new Error('开发服务器启动失败');
  await sleep(200);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
});
const bot = readFileSync(new URL('../bot2.js', import.meta.url), 'utf8');

/** 新页面：中文界面、干净存档、注入测试机器人与动画光标 */
async function openPage(saveData = {}) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 720 });
  p.on('pageerror', (e) => console.error('[页面错误]', e.message));
  await p.evaluateOnNewDocument((d) => localStorage.setItem('tomato_sister_save_v1', JSON.stringify(d)), saveData);
  await p.goto(`http://localhost:${PORT}/?lang=zh`);
  await p.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 120000 });
  await p.addScriptTag({ type: 'module', content: bot });
  await p.waitForFunction(() => typeof window.botAutopilot === 'function');
  await p.evaluate(() => {
    // 动画手指光标（DOM 覆盖层）
    const el = document.createElement('div');
    el.style.cssText =
      'position:fixed;left:0;top:0;z-index:99;width:44px;height:44px;pointer-events:none;transition:transform .45s cubic-bezier(.3,.7,.3,1);font-size:40px;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5));display:none;';
    el.textContent = '👆';
    document.body.appendChild(el);
    window.__cursor = {
      show(x, y) {
        el.style.display = 'block';
        el.style.transition = 'none';
        el.style.transform = `translate(${x - 14}px, ${y - 4}px)`;
        void el.offsetWidth;
        el.style.transition = 'transform .45s cubic-bezier(.3,.7,.3,1)';
      },
      move(x, y) {
        el.style.display = 'block';
        el.style.transform = `translate(${x - 14}px, ${y - 4}px)`;
      },
      tap(x, y) {
        const r = document.createElement('div');
        r.style.cssText = `position:fixed;left:${x - 24}px;top:${y - 24}px;width:48px;height:48px;border-radius:50%;border:4px solid #ffd166;z-index:98;pointer-events:none;transition:all .4s ease-out;`;
        document.body.appendChild(r);
        requestAnimationFrame(() => {
          r.style.transform = 'scale(1.8)';
          r.style.opacity = '0';
        });
        setTimeout(() => r.remove(), 450);
      },
      hide() {
        el.style.display = 'none';
      },
    };
    // 游戏对象 → 屏幕坐标
    window.__screenOf = (obj) => {
      const b = obj.getBounds();
      const k = game.canvas.clientWidth / game.scale.width;
      return { x: b.centerX * k, y: b.centerY * k };
    };
  });
  return p;
}

/** 找到场景中文字匹配的按钮（含弹窗内），光标移过去并点击 */
async function tapButton(p, sceneKey, re, { inPopup = false } = {}) {
  const pos = await p.evaluate(
    (k, src, inPopup) => {
      const s = game.scene.getScene(k);
      const rx = new RegExp(src);
      const pool = inPopup ? (s.popup?.list ?? []) : [...s.children.list, ...(s.layer?.list ?? [])];
      const btn = pool.find((o) => o.type === 'Container' && o.label && rx.test(o.label.text));
      if (!btn) return null;
      window.__lastBtn = btn;
      return window.__screenOf(btn);
    },
    sceneKey,
    re.source,
    inPopup,
  );
  if (!pos) throw new Error(`找不到按钮 ${re}`);
  await p.evaluate((x, y) => window.__cursor.move(x, y), pos.x, pos.y);
  await sleep(550);
  await p.evaluate(
    (x, y) => {
      window.__cursor.tap(x, y);
      window.__lastBtn.emit('pointerup');
    },
    pos.x,
    pos.y,
  );
  await sleep(350);
}

async function record(p, name, fn) {
  if (only.length && !only.includes(name)) return;
  console.log('录制', name);
  const rec = await p.screencast({ path: new URL(`${name}.webm`, OUT).pathname, fps: 30, quality: 12 });
  await fn();
  await rec.stop();
}

/** 一局准备好的对局：角色 + 章节 + 波次 + 武器 + 无敌（录制时不被打断） */
const setupRun = (p, { char = 'tomato', ch = 1, wave = 10, weapons = [], items = {}, seeds = 0 }) =>
  p.evaluate(
    (o) => {
      run.start(o.char, o.ch);
      run.wave = o.wave;
      run.seeds = o.seeds;
      run.level = Math.max(1, o.wave + 4);
      run.levelMods = { maxHp: 60 + o.wave * 6, damage: o.wave * 2, attackSpeed: o.wave * 2 };
      for (const [id, tier] of o.weapons) run.addWeapon(id, tier);
      for (const [id, n] of Object.entries(o.items)) for (let i = 0; i < n; i++) run.addItem(id);
      run.dirty();
    },
    { char, ch, wave, weapons, items, seeds },
  );

const startGame = (p, char) =>
  p.evaluate((c) => {
    game.scene.getScenes(true).forEach((s) => s.scene.stop());
    game.scene.start('Game');
    window.botAutopilot(c);
  }, char);

/** 录制时无敌（战斗场景创建后再打补丁） */
async function godMode(p) {
  await p.waitForFunction(() => game.scene.isActive('Game') && game.scene.getScene('Game').player, { timeout: 30000 });
  await p.evaluate(() => {
    const g = game.scene.getScene('Game');
    g.damagePlayer = () => {};
    g.enragePressure = () => {};
    g.hurtDirect = () => {};
  });
}

/** 在玩家周围刷一圈怪 */
const spawnRing = (p, ids, n, radius) =>
  p.evaluate(
    (ids, n, radius) => {
      const g = game.scene.getScene('Game');
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        g.spawnEnemyNow(
          ids[i % ids.length],
          g.player.x + Math.cos(a) * radius,
          g.player.y + Math.sin(a) * radius,
          i % 9 === 0 ? ['swift'] : [],
        );
      }
    },
    ids,
    n,
    radius,
  );

const BUILD = [
  ['knife', 3],
  ['fork', 3],
  ['ketchup', 2],
  ['pea_shooter', 3],
  ['chili_rocket', 2],
  ['cleaver', 2],
];

// ---------------- 片段 ----------------
{
  const p = await openPage();
  // A. 怪潮 + 大招清屏
  await setupRun(p, { char: 'tomato', ch: 1, wave: 12, weapons: BUILD, items: { hot_sauce: 4, coffee: 3 }, seeds: 380 });
  await startGame(p, 'tomato');
  await godMode(p);
  await sleep(1800);
  await spawnRing(p, ['mold', 'fly', 'cockroach', 'maggot', 'rotten_apple'], 70, 420);
  await record(p, 'combat', async () => {
    await sleep(2500);
    await spawnRing(p, ['mold', 'fly', 'cockroach', 'ant'], 60, 460);
    await sleep(6500);
  });
  await p.close();
}
{
  // B. Boss 战
  const p = await openPage();
  await setupRun(p, { char: 'corn', ch: 3, wave: 15, weapons: BUILD, items: { hot_sauce: 6 }, seeds: 640 });
  await startGame(p, 'corn');
  await godMode(p);
  await sleep(3500);
  await record(p, 'boss', async () => {
    await sleep(9000);
  });
  await p.close();
}
{
  // C. 升级选属性
  const p = await openPage();
  await setupRun(p, { char: 'tomato', ch: 1, wave: 6, weapons: BUILD.slice(0, 3), seeds: 120 });
  await p.evaluate(() => {
    run.pendingLevelUps = 2;
    run.level = 7;
    game.scene.getScenes(true).forEach((s) => s.scene.stop());
    game.scene.start('LevelUp');
  });
  await sleep(1200);
  await record(p, 'levelup', async () => {
    await p.evaluate(() => window.__cursor.show(640, 650));
    await sleep(500);
    await tapButton(p, 'LevelUp', /选择/);
    await sleep(900);
    await tapButton(p, 'LevelUp', /选择/);
    await sleep(1200);
  });
  await p.close();
}
{
  // D. 商店购物 + E. 洗词条与打造
  const p = await openPage();
  await setupRun(p, {
    char: 'tomato',
    ch: 1,
    wave: 9,
    weapons: [...BUILD.slice(0, 3), ['knife', 3]],
    seeds: 1600,
    items: { hot_sauce: 2, clover: 3 },
  });
  await p.evaluate(() => {
    run.shop = [];
    game.scene.getScenes(true).forEach((s) => s.scene.stop());
    game.scene.start('Shop');
  });
  await sleep(1500);
  await record(p, 'shop', async () => {
    await p.evaluate(() => window.__cursor.show(640, 650));
    for (let i = 0; i < 3; i++) {
      await p.evaluate(() => {
        const s = game.scene.getScene('Shop');
        // 选一件买得起、放得下的商品，再按价格找到对应的购买按钮
        const offer = run.shop.find((o) => !o.sold && o.price <= run.seeds && (o.kind === 'item' || run.canAddWeapon(o.id, o.tier)));
        window.__lastBtn = offer
          ? s.layer.list.find((o) => o.type === 'Container' && o.label && o.label.text === `🌱 ${offer.price}`)
          : null;
      });
      const pos = await p.evaluate(() => (window.__lastBtn ? window.__screenOf(window.__lastBtn) : null));
      if (!pos) break;
      await p.evaluate((x, y) => window.__cursor.move(x, y), pos.x, pos.y);
      await sleep(550);
      await p.evaluate(
        (x, y) => {
          window.__cursor.tap(x, y);
          window.__lastBtn.emit('pointerup');
        },
        pos.x,
        pos.y,
      );
      await sleep(700);
    }
    await sleep(600);
  });
  await record(p, 'forge', async () => {
    // 打开 T4 菜刀的弹窗
    const pos = await p.evaluate(() => {
      const s = game.scene.getScene('Shop');
      const w = run.weapons.find((x) => x.id === 'knife' && x.tier === 3);
      s.weaponPopup(w, 360, 560);
      return window.__screenOf(s.popup.list[0]);
    });
    void pos;
    await sleep(700);
    await tapButton(p, 'Shop', /洗全部/, { inPopup: true });
    await sleep(700);
    await tapButton(p, 'Shop', /洗全部/, { inPopup: true });
    await sleep(700);
    for (let i = 0; i < 3; i++) {
      await tapButton(p, 'Shop', /打造/, { inPopup: true });
      await sleep(800);
    }
    await sleep(600);
  });
  await p.close();
}
{
  // F. 选角：用成就点购买角色（先弹出几条成就）
  const p = await openPage({
    totalKills: 1500,
    clearedChapters: 1,
    wins: 1,
    charWins: { tomato: 1 },
    charRuns: { tomato: 12 },
    stats: { eliteKills: 12, bossKills: 1, perfectWaves: 3 },
  });
  await record(p, 'unlock', async () => {
    await p.evaluate(() => {
      game.scene.getScenes(true).forEach((s) => s.scene.stop());
      game.scene.start('CharSelect');
    });
    await sleep(1600);
    await p.evaluate(() => window.__cursor.show(900, 600));
    // 选中一名可购买的角色
    const pos = await p.evaluate(() => {
      const s = game.scene.getScene('CharSelect');
      const card = s.cards.find((k) => k.c.id === 'mushroom');
      const kk = game.canvas.clientWidth / game.scale.width;
      return { x: (card.x + card.s / 2) * kk, y: (card.y + card.s / 2) * kk };
    });
    await p.evaluate((x, y) => window.__cursor.move(x, y), pos.x, pos.y);
    await sleep(600);
    await p.evaluate(
      (x, y) => {
        window.__cursor.tap(x, y);
        const s = game.scene.getScene('CharSelect');
        s.selected = window.__dev.CHARACTER_MAP.mushroom;
        s.refresh();
      },
      pos.x,
      pos.y,
    );
    await sleep(900);
    await tapButton(p, 'CharSelect', /购买/);
    await sleep(2200);
  });
  // G. 片尾背景：主菜单
  await record(p, 'menu', async () => {
    await p.evaluate(() => {
      window.__cursor.hide();
      game.scene.getScenes(true).forEach((s) => s.scene.stop());
      game.scene.start('Menu');
    });
    await sleep(5000);
  });
  await p.close();
}
if (!only.length || only.includes('music')) {
  // 配乐：实时录制 Boss 战程序化电子乐 32 秒
  console.log('录制 music');
  const p = await browser.newPage();
  // 同源但不启动游戏的页面（游戏自己的菜单音乐会占用音乐引擎单例）
  await p.goto(`http://localhost:${PORT}/favicon.ico`);
  const b64 = await p.evaluate(async () => {
    const ctx = new AudioContext();
    const dest = ctx.createMediaStreamDestination();
    const orig = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function (d, ...a) {
      return orig.call(this, d === ctx.destination ? dest : d, ...a);
    };
    const M = await import('/src/systems/Music.ts');
    const rec = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 });
    const chunks = [];
    rec.ondataavailable = (e) => chunks.push(e.data);
    rec.start();
    M.playProceduralMusic(ctx, 'bgm_boss', 0.9);
    await new Promise((r) => setTimeout(r, 32000));
    rec.stop();
    await new Promise((r) => (rec.onstop = r));
    const buf = await new Blob(chunks).arrayBuffer();
    let s = '';
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  });
  writeFileSync(new URL('music.webm', OUT), Buffer.from(b64, 'base64'));
  await p.close();
}
await browser.close();
server.kill();
console.log('完成，素材在 promo/raw/');

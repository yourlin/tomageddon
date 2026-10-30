/* global window, document */
import puppeteer from 'puppeteer-core';
import { freezeArtHmr } from './art-browser.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
let rows = JSON.parse(readFileSync('src/data/artGlobal.generated.json', 'utf8'));
if (process.argv.includes('--complete')) {
  const { ENTITY_ART } = await import('../src/data/artManifest.ts');
  const { ENEMIES } = await import('../src/data/enemies.ts');
  const { BOSSES } = await import('../src/data/bosses.ts');
  rows = ENTITY_ART.filter((a) => a.kind !== 'char' && !a.skinId && !a.variant && a.source);
  if (rows.length !== ENEMIES.length + BOSSES.length) throw Error('Full entity scope is incomplete');
}
const inventory = JSON.parse(readFileSync('reports/art-pilot/global-inventory.json', 'utf8'));
const runtime = JSON.parse(readFileSync('src/data/artRuntime.generated.json', 'utf8')).files;
const names = new Map([...inventory.enemies, ...inventory.bosses].map((e) => [e.id, e.name]));
const out = 'docs/images/art-global';
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const errors = [];
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  page.setDefaultTimeout(120000);
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  for (let offset = 0; offset < rows.length; offset += 16) {
    const cards = rows
      .slice(offset, offset + 16)
      .map(
        (r) =>
          `<article><img src="http://127.0.0.1:4183/src/assets/runtime/${runtime[`entities/${r.kind}/${r.id}/body.png`].file}"><b>${names.get(r.id) ?? r.id}</b><small>${r.id}</small><div><img class="small" src="http://127.0.0.1:4183/src/assets/runtime/${runtime[`entities/${r.kind}/${r.id}/body.png`].file}"></div></article>`,
      )
      .join('');
    await page.setContent(
      `<html><head><meta charset="utf-8"><style>body{background:#211924;color:#f8dfb2;font:16px system-ui;margin:24px}h1{font-size:26px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}article{background:#352939;border:1px solid #9b7751;border-radius:18px;text-align:center;padding:14px}img{height:210px;width:100%;object-fit:contain}b{display:block;margin:8px}small{color:#b9a0b5}.small{height:48px;width:48px}article div{border-top:1px solid #57465b;margin-top:10px;padding-top:10px}</style></head><body><h1>全章节美术制作 · 实体形象 ${offset + 1}–${Math.min(offset + 16, rows.length)}</h1><p>大图检查造型，下排检查 48px 的轮廓与识别度。</p><div class="cards">${cards}</div></body></html>`,
    );
    await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth));
    await page.screenshot({ path: `${out}/new-entities-page${offset / 16 + 1}.png`, fullPage: true });
    if (offset === 0) await page.screenshot({ path: `${out}/new-entities.png`, fullPage: true });
  }
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  const verification = [];
  for (let offset = 0; offset < rows.length; offset += 16) {
    // 逐批刷新，避免验收时同时把所有章节的大图保留在 GPU 中。
    await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu'));
    await page.evaluate(async () => {
      const { flushTex } = await import('/src/systems/TexQueue.ts');
      flushTex();
      window.game.scene.getScene('Game').constructor.sandbox = { terrain: false, deaths: 0 };
      window.run.start('tomato', 2, false, 0);
      window.game.scene.getScenes(true).forEach((s) => window.game.scene.stop(s.scene.key));
      window.game.scene.start('Game');
    });
    await page.waitForFunction(() => window.game.scene.getScene('Game')?.player?.active);
    const checks = await page.evaluate(
      async (rows) => {
        const g = window.game.scene.getScene('Game');
        g.weapons.update = () => {};
        g.iframes = 10000;
        const { loadArt } = await import('/src/systems/ArtRegistry.ts');
        await loadArt(g, { bodies: rows.map((r) => ({ kind: r.kind, id: r.id })) }, 'global-preview');
        const checks = [];
        for (const [i, r] of rows.entries()) {
          const x = 350 + (i % 4) * 160,
            y = 500 + Math.floor(i / 4) * 150;
          const e = r.kind === 'enemy' ? g.spawnEnemyNow(r.id, x, y, []) : g.spawnBossNow(r.id, x, y, []);
          if (!e || e.rig.mode !== 'static') throw Error(`Missing live art ${r.id}`);
          const expected = e.def?.radius ?? e.boss.radius;
          if (e.radius !== expected) throw Error(`Physics radius changed ${r.id}`);
          e.speed = 0;
          e.actT = 9999;
          g.add.graphics().lineStyle(1, 0xffffff, 0.24).strokeCircle(x, y, expected).setDepth(1);
          g.add
            .text(x, y + expected + 22, e.def?.name ?? e.boss.name, {
              fontSize: '13px',
              color: '#fff1d0',
              stroke: '#321b26',
              strokeThickness: 3,
            })
            .setOrigin(0.5)
            .setDepth(20000);
          checks.push({ id: r.id, kind: r.kind, mode: e.rig.mode, radius: e.radius, texture: e.rig.art.texKey });
          if (r.kind === 'enemy') {
            const elite = g.spawnEnemyNow(r.id, -500, -500, ['swift']);
            if (elite.rig.mode !== 'static' || elite.rig.art.choice.aura !== 'gold') throw Error(`Champion fallback ${r.id}`);
            checks[checks.length - 1].champion = true;
          }
        }
        g.player.setPosition(1050, 850);
        g.cameras.main.stopFollow().centerOn(650, 740);
        return checks;
      },
      rows.slice(offset, offset + 16),
    );
    verification.push(...checks);
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: `${out}/battle-entities-page${offset / 16 + 1}.png` });
    if (offset === 0) await page.screenshot({ path: `${out}/battle-ch2.png` });
  }
  writeFileSync(
    'reports/art-pilot/global-entities-verification.json',
    JSON.stringify(
      { fullScope: process.argv.includes('--complete'), checked: verification.length, entities: verification, errors },
      null,
      2,
    ) + '\n',
  );
  if (errors.length) throw Error(errors.join('\n'));
  console.log(`Verified ${verification.length} live sprites, champion variants and unchanged collision radii, in bounded batches.`);
} finally {
  await browser.close();
}

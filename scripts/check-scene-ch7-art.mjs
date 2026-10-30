/* global window */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const missing = process.argv.includes('--missing-objects');
const compiled = JSON.parse(readFileSync('reports/art-pilot/scene-ch7-compile.json'));
const report = {
  scope:
    'Native chapter7 three-tier seed-pit geometry, shared mud textures and inward force with isolated direct terrain probe; not full normal-timing chapter or bramble/debris acceptance.',
  cases: [],
  errors: [],
};
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  for (const tier of ['low', 'standard', 'high']) {
    const p = await browser.newPage();
    await freezeArtHmr(p);
    await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: tier === 'high' ? 2 : 1 });
    await p.evaluateOnNewDocument(
      (t) => localStorage.setItem('tomato_sister_save_v1', JSON.stringify({ saveVersion: 2, settings: { graphicsQuality: t } })),
      tier,
    );
    p.on('pageerror', (e) => report.errors.push(e.message));
    if (missing) {
      await p.setRequestInterception(true);
      p.on('request', (r) =>
        ['image', 'fetch', 'xhr'].includes(r.resourceType()) && /\/maps\/ch7\/objects\//.test(r.url()) ? r.abort() : r.continue(),
      );
    }
    await p.goto('http://127.0.0.1:4183/?art=1');
    await p.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await p.evaluate(() => {
      window.run.start('tomato', 7, false, 0);
      window.run.wave = 3;
      window.game.scene.getScene('Menu').scene.start('Game');
    });
    await p.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').terrain, { timeout: 60000 });
    const sample = await p.evaluate(
      ({ tier, missing, compiled }) => {
        const g = window.game.scene.getScene('Game');
        g.scene.pause();
        const t = g.terrain,
          w = compiled.world;
        const rows = window.__art
          .textures()
          .filter((r) => r.key.startsWith('art:maps/') && !r.key.endsWith(':thumb') && r.status === 'ready');
        if (rows.length !== (missing ? 2 : 3) || rows.some((r) => !r.key.includes('/ch7@'))) throw Error('Wrong scene residency');
        for (const row of rows) {
          const src = g.textures.get(row.key).getSourceImage();
          const expected = row.key.includes(':object:')
            ? tier === 'low'
              ? 96
              : tier === 'standard'
                ? 128
                : 256
            : tier === 'low'
              ? 768
              : tier === 'standard'
                ? 1024
                : compiled.dimensions[0];
          if (src.width !== expected) throw Error('Wrong asset tier');
          if (!row.key.includes(':object:')) {
            const o = g.children.list.find((o) => o.texture?.key === row.key);
            if (
              Math.abs(o.x - w.x) > 0.01 ||
              Math.abs(o.y - w.y) > 0.01 ||
              Math.abs(o.displayWidth - w.w) > 0.01 ||
              Math.abs(o.displayHeight - w.h) > 0.01
            )
              throw Error('Layer transform');
          }
        }
        if (g.arena.obstacles.length !== 4) throw Error('Seed pit count');
        for (let i = 0; i < 4; i++) {
          const o = g.arena.obstacles[i],
            c = compiled.obstacles[i];
          if (o.x !== c.x || o.y !== c.y || o.r !== c.radius) throw Error('Seed collision changed');
          const [cx, cy] = c.centerPixel;
          const x = w.x + (cx / compiled.dimensions[0] - 0.5) * w.w,
            y = w.y + (cy / compiled.dimensions[1] - 0.5) * w.h;
          if (Math.hypot(x - o.x, y - o.y) > 0.01) throw Error('Pit art center alignment');
        }
        const zones = t.zones.filter((z) => z.kind === 'quicksand');
        if (zones.length !== 3) throw Error('Mud count');
        const key = missing ? 'terrain_quicksand' : 'art:maps/ch7@1:object:quicksand';
        for (const z of zones)
          if (z.img.texture.key !== key || Math.abs(z.img.displayWidth - z.r * 2.2) > 0.01) throw Error('Mud art/size');
        const all = t.zones;
        t.zones = [zones[0]];
        g.player.setPosition(zones[0].x + zones[0].r / 2, zones[0].y);
        g.envVX = 0;
        t.timers = { debris: 1e6, bramble: 1e6 };
        t.update(0);
        if (g.envVX >= 0) throw Error('Mud inward force');
        t.zones = all;
        window.__ch7Gpu = rows.map((r) => ({ key: r.key, gpu: g.textures.get(r.key).source[0].glTexture.webGLTexture }));
        g.cameras.main
          .stopFollow()
          .removeBounds()
          .setZoom(Math.min(g.scale.width / w.w, g.scale.height / w.h) * 0.9)
          .centerOnX(1012)
          .centerOnY(914);
        return {
          tier,
          missing,
          layers: 2,
          objectTextures: missing ? 0 : 1,
          mudInstances: 3,
          seedPits: 4,
          inwardForce: true,
          canvas: [g.game.canvas.width, g.game.canvas.height],
        };
      },
      { tier, missing, compiled },
    );

    await p.evaluate(() => window.game.scene.getScene('Game').scene.resume());
    await new Promise((r) => setTimeout(r, 900));
    await p.evaluate(() => window.game.scene.getScene('Game').scene.pause());
    await p.screenshot({ path: `reports/art-pilot/scene-ch7-${missing ? 'fallback-' : ''}${tier}-overview.png` });
    await p.evaluate(() => {
      window.game.scene.stop('Hud');
      window.game.scene.getScene('Game').scene.start('Menu');
    });
    await p.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Game'));
    await p.waitForFunction(
      () => window.__ch7Gpu.every((r) => !window.game.textures.exists(r.key) && !window.game.renderer.gl.isTexture(r.gpu)),
      { timeout: 5000 },
    );
    report.cases.push({ ...sample, gpuReleased: true });
    await p.close();
  }
  if (report.errors.length) throw Error('Page errors');
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  throw e;
} finally {
  writeFileSync(`reports/art-pilot/scene-ch7-${missing ? 'fallback-' : ''}native.json`, JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

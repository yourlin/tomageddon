/* global window */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const missing = process.argv.includes('--missing-objects');
const compiled = JSON.parse(readFileSync('reports/art-pilot/scene-ch5-compile.json'));
const report = {
  scope:
    'Native chapter5 three-tier map geometry, shared object textures, belt motion and fan status with isolated direct terrain update. No full normal-timing run or steam damage acceptance.',
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
        ['image', 'fetch', 'xhr'].includes(r.resourceType()) && /\/maps\/ch5\/objects\//.test(r.url()) ? r.abort() : r.continue(),
      );
    }
    await p.goto('http://127.0.0.1:4183/?art=1');
    await p.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await p.evaluate(() => {
      window.run.start('tomato', 5, false, 0);
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
        if (rows.length !== (missing ? 2 : 5) || rows.some((r) => !r.key.includes('/ch5@'))) throw Error('Wrong scene residency');
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
        if (g.arena.obstacles.length !== 4) throw Error('Machine collision count');
        for (let i = 0; i < 4; i++) {
          const o = g.arena.obstacles[i],
            c = compiled.obstacles[i];
          for (const k of ['x', 'y', 'w', 'h']) if (o[k] !== c[k]) throw Error('Machine collision changed');
        }
        const belts = t.zones.filter((z) => z.kind === 'conveyor'),
          fans = t.zones.filter((z) => z.kind === 'fan');
        if (belts.length !== 2 || fans.length !== 2 || t.holes.length !== 4) throw Error('Terrain object counts');
        for (const z of belts) {
          const s = z.img.displayTexture.getSourceImage();
          if (
            z.img.displayWidth !== 2200 ||
            z.img.displayHeight !== 96 ||
            Math.abs(z.img.tileScaleX * s.width - 128) > 0.01 ||
            Math.abs(z.img.tileScaleY * s.height - 96) > 0.01
          )
            throw Error('Belt tier size changed');
        }
        for (const z of fans) if (Math.abs(z.img.displayWidth - 180) > 0.01) throw Error('Fan size');
        for (const h of t.holes) if (h.img.displayWidth !== 110 || h.img.displayHeight !== 110) throw Error('Vent size');
        const b = belts[0],
          old = b.img.tilePositionX;
        g.player.setPosition(b.x, b.y);
        g.envVX = 0;
        t.update(0.1);
        if (g.envVX !== 120 || Math.abs(b.img.tilePositionX - old + 11) > 0.01) throw Error('Belt motion/force');
        g.player.setPosition(fans[0].x, fans[0].y);
        t.update(0);
        if (!g.pstatus.has('tailwind')) throw Error('Fan status');
        const expected = (n, fallback) => (missing ? fallback : `art:maps/ch5@1:object:${n}`);
        if (
          belts.some((z) => z.img.displayTexture.key !== expected('conveyor', 'terrain_conveyor')) ||
          fans.some((z) => z.img.texture.key !== expected('fan', 'fx_ring')) ||
          t.holes.some((h) => h.img.texture.key !== expected('vent', 'terrain_vent'))
        )
          throw Error('Art/fallback mismatch');
        window.__ch5Gpu = rows.map((r) => ({ key: r.key, gpu: g.textures.get(r.key).source[0].glTexture.webGLTexture }));
        g.cameras.main
          .stopFollow()
          .removeBounds()
          .setZoom(Math.min(g.scale.width / w.w, g.scale.height / w.h) * 0.9)
          .centerOnX(1200)
          .centerOnY(650);
        return {
          tier,
          missing,
          layers: 2,
          objectTextures: missing ? 0 : 3,
          belts: 2,
          fans: 2,
          vents: 4,
          beltForce: 120,
          fanTailwind: true,
          canvas: [g.game.canvas.width, g.game.canvas.height],
        };
      },
      { tier, missing, compiled },
    );
    await p.screenshot({ path: `reports/art-pilot/scene-ch5-${missing ? 'fallback-' : ''}${tier}-overview.png` });
    await p.evaluate(() => {
      window.game.scene.stop('Hud');
      window.game.scene.getScene('Game').scene.start('Menu');
    });
    await p.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Game'));
    await p.waitForFunction(
      () => window.__ch5Gpu.every((r) => !window.game.textures.exists(r.key) && !window.game.renderer.gl.isTexture(r.gpu)),
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
  writeFileSync(`reports/art-pilot/scene-ch5-${missing ? 'fallback-' : ''}native.json`, JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

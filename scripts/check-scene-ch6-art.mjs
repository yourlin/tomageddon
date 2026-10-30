/* global window */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const missing = process.argv.includes('--missing-objects');
const compiled = JSON.parse(readFileSync('reports/art-pilot/scene-ch6-compile.json'));
const report = {
  scope:
    'Native chapter6 three-tier octagon/planter geometry, shared compost/lamp/spore textures, hardened status and lamp replacement with direct terrain probes. No full normal-timing chapter or spore damage acceptance.',
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
        ['image', 'fetch', 'xhr'].includes(r.resourceType()) && /\/maps\/ch6\/objects\//.test(r.url()) ? r.abort() : r.continue(),
      );
    }
    await p.goto('http://127.0.0.1:4183/?art=1');
    await p.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await p.evaluate(() => {
      window.run.start('tomato', 6, false, 0);
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
        if (rows.length !== (missing ? 2 : 5) || rows.some((r) => !r.key.includes('/ch6@'))) throw Error('Wrong scene residency');
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
        const obstacle = g.arena.obstacles[0];
        if (g.arena.obstacles.length !== 1 || obstacle.x !== 950 || obstacle.y !== 950 || obstacle.r !== 150)
          throw Error('Planter collision changed');
        for (const [x, y] of [
          [950, 100],
          [100, 950],
          [1800, 950],
          [950, 1800],
        ])
          if (!g.arena.contains(x, y)) throw Error('Octagon passage blocked');
        for (const [x, y] of [
          [100, 100],
          [1800, 100],
          [100, 1800],
          [1800, 1800],
        ])
          if (g.arena.contains(x, y)) throw Error('Octagon corner walkable');
        const lamps = t.zones.filter((z) => z.kind === 'lamp');
        if (lamps.length !== 2 || t.holes.length !== 4) throw Error('Terrain object count');
        const expected = (n, fallback) => (missing ? fallback : `art:maps/ch6@1:object:${n}`);
        for (const z of lamps)
          if (z.img.texture.key !== expected('lamp', 'fx_glow') || Math.abs(z.img.displayWidth - 220) > 0.01) throw Error('Lamp art/size');
        for (const h of t.holes)
          if (
            h.img.texture.key !== expected('compost', 'terrain_hole') ||
            Math.abs(h.img.displayWidth - 120) > 0.01 ||
            Math.abs(h.img.displayHeight - 80) > 0.01
          )
            throw Error('Compost art/size');
        g.player.setPosition(lamps[0].x, lamps[0].y);
        t.timers = { spore: 1e6, compost: 1e6, lamp_move: 1e6 };
        t.update(0);
        if (!g.pstatus.has('hardened')) throw Error('Lamp hardened status');
        window.__oldLamp = lamps[0].img;
        t.moveLamp();
        if (t.zones.filter((z) => z.kind === 'lamp').length !== 2) throw Error('Lamp replacement count');
        window.__ch6Gpu = rows.map((r) => ({ key: r.key, gpu: g.textures.get(r.key).source[0].glTexture.webGLTexture }));
        g.cameras.main
          .stopFollow()
          .removeBounds()
          .setZoom(Math.min(g.scale.width / w.w, g.scale.height / w.h) * 0.9)
          .centerOnX(950)
          .centerOnY(950);
        return {
          tier,
          missing,
          layers: 2,
          objectTextures: missing ? 0 : 3,
          lamps: 2,
          compost: 4,
          hardened: true,
          canvas: [g.game.canvas.width, g.game.canvas.height],
        };
      },
      { tier, missing, compiled },
    );
    await p.evaluate(() => window.game.scene.getScene('Game').scene.resume());
    await p.waitForFunction(() => !window.__oldLamp.scene, { timeout: 5000 });
    await p.evaluate(() => window.game.scene.getScene('Game').scene.pause());
    await p.screenshot({ path: `reports/art-pilot/scene-ch6-${missing ? 'fallback-' : ''}${tier}-overview.png` });
    await p.evaluate(() => {
      window.game.scene.stop('Hud');
      window.game.scene.getScene('Game').scene.start('Menu');
    });
    await p.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Game'));
    await p.waitForFunction(
      () => window.__ch6Gpu.every((r) => !window.game.textures.exists(r.key) && !window.game.renderer.gl.isTexture(r.gpu)),
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
  writeFileSync(`reports/art-pilot/scene-ch6-${missing ? 'fallback-' : ''}native.json`, JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

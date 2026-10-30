/* global window */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const missingIce = process.argv.includes('--missing-ice');
const compiled = JSON.parse(readFileSync('reports/art-pilot/scene-ch3-compile.json', 'utf8'));
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const report = {
  scope:
    'Chapter3 generated floor/shelves: native3tiers, actual map transforms, four original shelf collision rectangles and800unit passages, currentchapter loading and GPUrelease. Ice lifecycle probes use direct Terrain.update(0) to isolate melt/replacement mechanics; not full normal-timing gameplay.',
  cases: [],
  errors: [],
};
try {
  for (const tier of ['low', 'standard', 'high']) {
    const page = await browser.newPage();
    await freezeArtHmr(page);
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: tier === 'high' ? 2 : 1 });
    await page.evaluateOnNewDocument(
      (tier) => localStorage.setItem('tomato_sister_save_v1', JSON.stringify({ saveVersion: 2, settings: { graphicsQuality: tier } })),
      tier,
    );
    page.on('pageerror', (e) => report.errors.push(e.message));
    if (missingIce) {
      await page.setRequestInterception(true);
      page.on('request', (r) =>
        ['image', 'xhr', 'fetch'].includes(r.resourceType()) && /\/maps\/ch3\/objects\//.test(r.url()) ? r.abort() : r.continue(),
      );
    }
    await page.goto('http://127.0.0.1:4183/?art=1&lang=zh');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('tomato', 3, false, 0);
      window.game.scene.getScene('Menu').scene.start('Game');
    });
    await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').terrain, { timeout: 60000 });
    await page.screenshot({ path: `reports/art-pilot/scene-ch3-${missingIce ? 'fallback-' : ''}${tier}.png` });
    const sample = await page.evaluate(
      ({ tier, compiled, missingIce }) => {
        const g = window.game.scene.getScene('Game');
        g.scene.pause();
        const a = g.arena,
          w = compiled.world;
        const allRows = window.__art
          .textures()
          .filter((r) => r.key.startsWith('art:maps/') && !r.key.endsWith(':thumb') && r.status === 'ready');
        const rows = allRows.filter((r) => !r.key.includes(':object:'));
        const objects = allRows.filter((r) => r.key.includes(':object:'));
        if (rows.length !== 2 || rows.some((r) => !r.key.includes('/ch3@'))) throw Error('Incorrect scene layer residency');
        const dimensions = rows.map((r) => {
          const t = g.textures.get(r.key),
            image = t.getSourceImage(),
            layer = g.children.list.find((o) => o.texture?.key === r.key);
          if (
            !layer ||
            Math.abs(layer.x - w.x) > 0.01 ||
            Math.abs(layer.y - w.y) > 0.01 ||
            Math.abs(layer.displayWidth - w.w) > 0.01 ||
            Math.abs(layer.displayHeight - w.h) > 0.01
          )
            throw Error('Uncalibrated layer transform');
          return { key: r.key, width: image.width, height: image.height };
        });
        const expected = tier === 'low' ? 768 : tier === 'standard' ? 1024 : compiled.dimensions[0];
        if (dimensions.some((d) => d.width !== expected)) throw Error('Wrong map quality tier');
        if (a.obstacles.length !== 4) throw Error('Shelf collision count changed');
        for (let i = 0; i < 4; i++) {
          const p = a.obstacles[i],
            q = compiled.obstacles[i];
          if (p.kind !== 'rect' || p.x !== q.x || p.y !== q.y || p.w !== q.w || p.h !== q.h) throw Error('Collision shelf changed');
          const [cx, cy] = q.centerPixel;
          const x = w.x + (cx / compiled.dimensions[0] - 0.5) * w.w,
            y = w.y + (cy / compiled.dimensions[1] - 0.5) * w.h;
          if (Math.hypot(x - (p.x + p.w / 2), y - (p.y + p.h / 2)) > 1) throw Error('Shelf art center misaligned');
        }
        if (!a.contains(750, 497) || !a.contains(750, 1017)) throw Error('Central shelf passage blocked');
        const ice = g.terrain.zones.filter((z) => z.kind === 'ice');
        if (ice.length !== 6 || objects.length !== (missingIce ? 0 : 1)) throw Error('Ice object residency/count incorrect');
        const objectWidth = tier === 'low' ? 96 : tier === 'standard' ? 128 : 256;
        if (!missingIce) {
          const source = g.textures.get(objects[0].key).getSourceImage();
          if (source.width !== objectWidth || Math.abs(source.width / source.height - 256 / 180) > 0.02)
            throw Error('Wrong ice quality tier/aspect');
        }
        const key = missingIce ? 'terrain_ice' : objects[0].key;
        if (ice.some((z) => z.img.texture.key !== key)) throw Error('Ice art/fallback mismatch');
        const z = ice[0];
        z.t = 2;
        g.player.setPosition(z.x, z.y);
        g.terrain.update(0);
        if (!g.slippery || Math.abs(z.img.displayWidth / z.img.displayHeight - 256 / 180) > 0.001)
          throw Error('Slippery state or aspect changed');
        const solid = { width: z.img.displayWidth, height: z.img.displayHeight, alpha: z.img.alpha, radius: z.r, scale: z.s };
        z.t = z.life - 1.5;
        g.terrain.update(0);
        if (Math.abs(z.img.alpha - 0.475) > 0.01 || Math.abs(z.img.displayWidth / (256 * z.s) - 0.8) > 0.001)
          throw Error('Melt fade/scale changed');
        const oldTexture = z.img.texture;
        for (let i = 0; i < 12; i++) {
          const current = g.terrain.zones.find((z) => z.kind === 'ice'),
            old = current.img;
          current.t = current.life;
          g.terrain.update(0);
          if (old.scene || g.terrain.zones.filter((z) => z.kind === 'ice').length !== 6) throw Error('Melted ice leaked or count drifted');
        }
        if (g.terrain.zones.some((z) => z.kind === 'ice' && z.img.texture !== oldTexture))
          throw Error('Ice replacement stopped sharing texture');
        for (const active of g.terrain.zones.filter((z) => z.kind === 'ice')) active.t = 2;
        g.terrain.update(0);
        const lifecycle = { solid, replacements: 12, instances: 6, sharedTexture: true, objectWidth: missingIce ? null : objectWidth };
        window.__ch3Gpu = allRows.map((r) => ({ key: r.key, gpu: g.textures.get(r.key).source[0].glTexture.webGLTexture }));
        g.cameras.main
          .stopFollow()
          .removeBounds()
          .setZoom(Math.min(g.scale.width / w.w, g.scale.height / w.h) * 0.9)
          .centerOnX(a.centerX)
          .centerOnY(a.centerY);
        return {
          tier,
          missingIce,
          lifecycle,
          dimensions,
          canvas: [g.game.canvas.width, g.game.canvas.height],
          shelves: a.obstacles,
          centerPassagesOpen: true,
        };
      },
      { tier, compiled, missingIce },
    );
    await new Promise((r) => setTimeout(r, 100));
    sample.icePauseHeld = await page.evaluate(
      () =>
        window.game.scene.isPaused('Game') &&
        window.game.scene
          .getScene('Game')
          .terrain.zones.filter((z) => z.kind === 'ice')
          .every((z) => z.t === 2),
    );
    if (!sample.icePauseHeld) throw Error('Paused ice lifecycle advanced');
    await page.screenshot({ path: `reports/art-pilot/scene-ch3-${missingIce ? 'fallback-' : ''}${tier}-overview.png` });
    if (tier === 'high') {
      await page.evaluate(() => {
        const g = window.game.scene.getScene('Game');
        g.arenaDebug();
        g.events.emit('postupdate');
      });
      await page.screenshot({ path: `reports/art-pilot/scene-ch3-${missingIce ? 'fallback-' : ''}high-collision.png` });
    }
    await page.evaluate(() => {
      window.game.scene.stop('Hud');
      window.game.scene.getScene('Game').scene.start('Menu');
    });
    await page.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Game'));
    await page.waitForFunction(
      () => window.__ch3Gpu.every((r) => !window.game.textures.exists(r.key) && !window.game.renderer.gl.isTexture(r.gpu)),
      { timeout: 5000 },
    );
    report.cases.push({ ...sample, gpuReleased: true });
    await page.close();
  }
  if (report.errors.length) throw Error(JSON.stringify(report.errors));
  report.status = 'passed';
} catch (e) {
  report.errors.push(String(e));
  report.status = 'failed';
  throw e;
} finally {
  writeFileSync(`reports/art-pilot/scene-ch3-${missingIce ? 'fallback-' : ''}native.json`, JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

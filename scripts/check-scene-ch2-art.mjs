/* global window */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const missingObjects = process.argv.includes('--missing-objects');
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const report = {
  scope:
    'Chapter2 generated ground/obstacle layers: native landscape rendering, three texture tiers, unchanged obstacle coordinates, current-chapter loading and GPU release. Boundary artwork requires visual review.',
  cases: [],
  errors: [],
};
const compiled = JSON.parse(readFileSync('reports/art-pilot/scene-ch2-compile.json', 'utf8'));
try {
  for (const tier of ['low', 'standard', 'high']) {
    const page = await browser.newPage();
    await freezeArtHmr(page);
    await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: tier === 'high' ? 2 : 1 });
    await page.evaluateOnNewDocument(
      (tier) => localStorage.setItem('tomato_sister_save_v1', JSON.stringify({ saveVersion: 2, settings: { graphicsQuality: tier } })),
      tier,
    );
    const requests = [];
    page.on('request', (r) => {
      if (['image', 'xhr', 'fetch'].includes(r.resourceType())) requests.push(r.url());
    });
    if (missingObjects) {
      await page.setRequestInterception(true);
      page.on('request', (r) =>
        ['image', 'xhr', 'fetch'].includes(r.resourceType()) && /\/maps\/ch2\/objects\//.test(r.url()) ? r.abort() : r.continue(),
      );
    }
    page.on('pageerror', (e) => report.errors.push(e.message));
    await page.goto('http://127.0.0.1:4183/?art=1&lang=zh');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    if (requests.some((u) => /\/maps\/ch\d+\/.*(?:ground|foreground|hole|sprinkler).*\.webp/.test(u)))
      throw Error('Startup downloaded full map/object art');
    await page.evaluate(() => {
      window.run.start('tomato', 2, false, 0);
      window.game.scene.getScene('Menu').scene.start('Game');
    });
    await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').player, { timeout: 60000 });
    await page.screenshot({ path: `reports/art-pilot/scene-ch2-${missingObjects ? 'fallback-' : ''}${tier}.png` });
    const sample = await page.evaluate(
      async ({ tier, compiled, missingObjects }) => {
        const g = window.game.scene.getScene('Game');
        g.scene.pause();
        const allRows = window.__art
          .textures()
          .filter((r) => r.key.startsWith('art:maps/') && !r.key.endsWith(':thumb') && r.status === 'ready');
        const rows = allRows.filter((r) => !r.key.includes(':object:'));
        const objectRows = allRows.filter((r) => r.key.includes(':object:'));
        const textures = rows.map((r) => {
          const t = g.textures.get(r.key),
            im = t.getSourceImage();
          return { key: r.key, width: im.width, height: im.height };
        });
        if (textures.length !== 2 || textures.some((r) => !r.key.includes('/ch2@'))) throw Error('Incorrect current chapter layer loading');
        const expected = tier === 'low' ? 768 : tier === 'standard' ? 1024 : 1499;
        if (textures.some((r) => r.width !== expected)) throw Error('Incorrect map tier');
        const world = compiled.world,
          obstacles = g.arena.obstacles;
        for (const row of rows) {
          const layer = g.children.list.find((o) => o.texture?.key === row.key);
          if (
            !layer ||
            Math.abs(layer.x - world.x) > 0.01 ||
            Math.abs(layer.y - world.y) > 0.01 ||
            Math.abs(layer.displayWidth - world.w) > 0.01 ||
            Math.abs(layer.displayHeight - world.h) > 0.01
          )
            throw Error('Runtime layer placement differs from calibrated plan');
        }
        if (obstacles.length !== compiled.obstacles.length) throw Error('Obstacle count changed');
        for (let i = 0; i < obstacles.length; i++) {
          const a = obstacles[i],
            b = compiled.obstacles[i];
          if (a.kind !== 'circle' || a.x !== b.x || a.y !== b.y || a.r !== b.radius) throw Error('Collision geometry mismatch');
          const [px, py] = b.centerPixel;
          const x = world.x + (px / compiled.dimensions[0] - 0.5) * world.w,
            y = world.y + (py / compiled.dimensions[1] - 0.5) * world.h;
          if (Math.hypot(x - a.x, y - a.y) > 1) throw Error('Visual obstacle center misaligned');
        }
        if (objectRows.length !== (missingObjects ? 0 : 2)) throw Error('Incorrect environment object loading');
        const objectWidth = tier === 'low' ? 96 : tier === 'standard' ? 128 : 256;
        for (const row of objectRows)
          if (g.textures.get(row.key).getSourceImage().width !== objectWidth) throw Error('Wrong object texture tier');
        if (g.terrain.holes.length !== 5 || g.terrain.sprinklers.length !== 2) throw Error('Terrain object count changed');
        for (const h of g.terrain.holes)
          if (missingObjects ? h.img.texture.key !== 'terrain_hole' : !h.img.texture.key.endsWith(':object:hole'))
            throw Error('Hole art/fallback missing');
        for (const h of g.terrain.sprinklers)
          if (missingObjects ? h.img.texture.key !== 'terrain_vent' : !h.img.texture.key.endsWith(':object:sprinkler'))
            throw Error('Sprinkler art/fallback missing');
        window.__sceneGpu = allRows.map((r) => ({ key: r.key, gpu: g.textures.get(r.key).source[0].glTexture.webGLTexture }));
        g.cameras.main
          .stopFollow()
          .removeBounds()
          .setZoom(Math.min(g.scale.width / world.w, g.scale.height / world.h) * 0.9)
          .centerOnX(g.arena.centerX)
          .centerOnY(g.arena.centerY);
        return {
          tier,
          missingObjects,
          textures,
          objectTextureWidth: missingObjects ? null : objectWidth,
          holes: 5,
          sprinklers: 2,
          obstacleCenters: obstacles.map((o) => [o.x, o.y]),
          canvas: [g.game.canvas.width, g.game.canvas.height],
        };
      },
      { tier, compiled, missingObjects },
    );
    await new Promise((r) => setTimeout(r, 150));
    await page.screenshot({ path: `reports/art-pilot/scene-ch2-${missingObjects ? 'fallback-' : ''}${tier}-overview.png` });
    if (tier === 'high') {
      await page.evaluate(() => {
        const g = window.game.scene.getScene('Game');
        g.arenaDebug();
        g.events.emit('postupdate');
      });
      await page.screenshot({ path: `reports/art-pilot/scene-ch2-${missingObjects ? 'fallback-' : ''}${tier}-collision.png` });
    }
    sample.pulse = await page.evaluate(async () => {
      const g = window.game.scene.getScene('Game'),
        h = g.terrain.holes[0];
      const before = [h.img.displayWidth, h.img.displayHeight];
      g.scene.resume();
      g.terrain.pulse(h);
      await new Promise((r) => setTimeout(r, 100));
      const during = [h.img.displayWidth, h.img.displayHeight];
      if (Math.abs(during[0] / during[1] - before[0] / before[1]) > 0.001) throw Error('Hole pulse distorted aspect');
      await new Promise((r) => setTimeout(r, 350));
      const after = [h.img.displayWidth, h.img.displayHeight];
      if (Math.abs(after[0] - before[0]) > 0.01 || Math.abs(after[1] - before[1]) > 0.01 || during[0] <= before[0] * 1.01)
        throw Error('Hole pulse did not animate/reset');
      return { before, during, after };
    });
    await page.evaluate(() => {
      window.game.scene.stop('Hud');
      window.game.scene.getScene('Game').scene.start('Menu');
    });
    await page.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Game'));
    await page.waitForFunction(
      () => window.__sceneGpu.every((r) => !window.game.textures.exists(r.key) && !window.game.renderer.gl.isTexture(r.gpu)),
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
  writeFileSync(`reports/art-pilot/scene-ch2-${missingObjects ? 'fallback-' : ''}native.json`, JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

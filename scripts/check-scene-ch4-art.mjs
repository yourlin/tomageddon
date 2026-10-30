/* global window */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const missingObjects = process.argv.includes('--missing-objects');
const compiled = JSON.parse(readFileSync('reports/art-pilot/scene-ch4-compile.json', 'utf8'));
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const report = {
  scope:
    'Native chapter4 cross-shaped map,3qualitytiers,shared quicksand and actual acid telegraph callback. Terrain timers shortened and player placed in acid with guaranteed status for deterministic probe; not full normal-cooldown run.',
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
    const requests = [];
    page.on('request', (r) => {
      if (['image', 'xhr', 'fetch'].includes(r.resourceType())) requests.push(r.url());
    });
    if (missingObjects) {
      await page.setRequestInterception(true);
      page.on('request', (r) =>
        ['image', 'xhr', 'fetch'].includes(r.resourceType()) && /\/maps\/ch4\/objects\//.test(r.url()) ? r.abort() : r.continue(),
      );
    }
    await page.goto('http://127.0.0.1:4183/?art=1&lang=zh');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    if (requests.some((u) => /\/maps\/ch\d+\/.*(?:ground|foreground|quicksand|acid).*\.webp/.test(u)))
      throw Error('Startup eagerly loaded map art');
    const start = async (wave) => {
      await page.evaluate((wave) => {
        window.run.start('tomato', 4, false, 0);
        window.run.wave = wave;
        window.game.scene.getScene('Menu').scene.start('Game');
      }, wave);
      await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').terrain, {
        timeout: 60000,
      });
    };
    const leave = async () => {
      await page.evaluate(() => {
        window.game.scene.stop('Hud');
        window.game.scene.getScene('Game').scene.start('Menu');
      });
      await page.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Game'));
    };
    if (tier === 'low') {
      await start(1);
      if (requests.some((u) => /\/maps\/ch4\/objects\/.*acid.*\.webp/.test(u))) throw Error('Wave1 downloaded future acid art');
      await leave();
      await page.waitForFunction(
        () => !window.__art.textures().some((r) => r.key.includes('/ch4@') && !r.key.endsWith(':thumb') && r.status === 'ready'),
      );
      report.wave1AcidNotDownloaded = true;
    }
    await start(3);
    await page.evaluate(() => {
      const g = window.game.scene.getScene('Game'),
        t = g.terrain;
      g.iframes = 100;
      g.skill.cd = 999;
      for (const w of g.weapons.list) w.cd = 999;
      window.__ch4Old = t.zones.find((z) => z.kind === 'quicksand').img;
      window.__ch4Probe = { started: g.time.now };
      const telegraph = g.fx.telegraphCircle.bind(g.fx),
        add = g.addHazard.bind(g);
      g.fx.telegraphCircle = (x, y, r, dur, color, cb) => {
        if (color === 0xa7c957 && r === 70) window.__ch4Probe.warning = { at: g.time.now, duration: dur, radius: r };
        return telegraph(x, y, r, dur, color, cb);
      };
      g.addHazard = (x, y, r, life, dps, debuff, color, object) => {
        add(x, y, r, life, dps, debuff, color, object);
        if (object === 'acid') {
          const h = g.hazards.at(-1);
          g.player.setPosition(x, y);
          for (const st of h.debuff ?? []) st.chance = 100;
          window.__ch4Hazard = h;
          window.__ch4Probe.acid = { at: g.time.now, radius: r, life, dps };
        }
      };
      t.timers = { debris: 1e6, move: 0, acid: 0 };
    });
    await page.waitForFunction(
      () => window.__ch4Probe.acid && window.game.scene.getScene('Game').time.now - window.__ch4Probe.acid.at > 750,
      { timeout: 12000 },
    );
    const sample = await page.evaluate(
      ({ tier, missingObjects, compiled }) => {
        const g = window.game.scene.getScene('Game');
        g.scene.pause();
        const a = g.arena,
          world = compiled.world;
        const rows = window.__art
          .textures()
          .filter((r) => r.key.startsWith('art:maps/') && !r.key.endsWith(':thumb') && r.status === 'ready');
        if (rows.length !== (missingObjects ? 1 : 3) || rows.some((r) => !r.key.includes('/ch4@')))
          throw Error('Wrong map/scene residency');
        const ground = rows.find((r) => r.key.endsWith(':ground')),
          image = g.textures.get(ground.key).getSourceImage();
        if (image.width !== (tier === 'low' ? 768 : tier === 'standard' ? 1024 : compiled.dimensions[0])) throw Error('Wrong ground tier');
        const layer = g.children.list.find((o) => o.texture?.key === ground.key);
        if (
          Math.abs(layer.x - world.x) > 0.01 ||
          Math.abs(layer.y - world.y) > 0.01 ||
          Math.abs(layer.displayWidth - world.w) > 0.01 ||
          Math.abs(layer.displayHeight - world.h) > 0.01
        )
          throw Error('Wrong calibrated layer transform');
        for (const [x, y] of [
          [1100, 750],
          [1100, 100],
          [100, 750],
          [2100, 750],
          [1100, 1400],
        ])
          if (!a.contains(x, y)) throw Error('Cross corridor blocked');
        for (const [x, y] of [
          [100, 100],
          [2100, 100],
          [100, 1400],
          [2100, 1400],
        ])
          if (a.contains(x, y)) throw Error('Trash corner became walkable');
        const objectWidth = tier === 'low' ? 96 : tier === 'standard' ? 128 : 256;
        for (const r of rows.filter((r) => r.key.includes(':object:')))
          if (g.textures.get(r.key).getSourceImage().width !== objectWidth) throw Error('Wrong hazard art tier');
        const zones = g.terrain.zones.filter((z) => z.kind === 'quicksand'),
          qkey = missingObjects ? 'terrain_quicksand' : rows.find((r) => r.key.endsWith(':object:quicksand')).key;
        if (
          zones.length !== 3 ||
          window.__ch4Old.scene ||
          zones.some((z) => z.img.texture.key !== qkey || Math.abs(z.img.displayWidth - z.r * 2.2) > 0.01)
        )
          throw Error('Quicksand replacement/size regression');
        const player = [g.player.x, g.player.y],
          all = g.terrain.zones,
          z = zones[0];
        g.terrain.zones = [z];
        g.player.setPosition(z.x + z.r / 2, z.y);
        g.terrain.update(0);
        const pulled = g.envVX < 0;
        g.terrain.zones = all;
        g.player.setPosition(...player);
        if (!pulled) throw Error('Quicksand no longer pulls inward');
        const h = window.__ch4Hazard,
          akey = missingObjects ? 'fx_pool' : rows.find((r) => r.key.endsWith(':object:acid')).key;
        if (h.img.texture.key !== akey || Math.abs(h.img.displayWidth - 140) > 0.01 || !g.pstatus.has('corrode'))
          throw Error('Acid size/art/status regression');
        const timing = window.__ch4Probe;
        if (timing.acid.at - timing.warning.at < 1050) throw Error('Acid warning shortened');
        window.__ch4Gpu = rows.map((r) => ({ key: r.key, gpu: g.textures.get(r.key).source[0].glTexture.webGLTexture }));
        g.cameras.main
          .stopFollow()
          .removeBounds()
          .setZoom(Math.min(g.scale.width / world.w, g.scale.height / world.h) * 0.9)
          .centerOnX(a.centerX)
          .centerOnY(a.centerY);
        return {
          tier,
          missingObjects,
          ground: [image.width, image.height],
          objectWidth: missingObjects ? null : objectWidth,
          quicksandInstances: 3,
          replacedOldDestroyed: true,
          pullsInward: pulled,
          acidWidth: h.img.displayWidth,
          acidCorrode: true,
          timing,
          canvas: [g.game.canvas.width, g.game.canvas.height],
        };
      },
      { tier, missingObjects, compiled },
    );
    await new Promise((r) => setTimeout(r, 100));
    await page.screenshot({ path: `reports/art-pilot/scene-ch4-${missingObjects ? 'fallback-' : ''}${tier}-overview.png` });
    if (tier === 'high') {
      await page.evaluate(() => {
        const g = window.game.scene.getScene('Game');
        g.arenaDebug();
        g.events.emit('postupdate');
      });
      await page.screenshot({ path: `reports/art-pilot/scene-ch4-${missingObjects ? 'fallback-' : ''}high-collision.png` });
    }
    await leave();
    await page.waitForFunction(
      () => window.__ch4Gpu.every((r) => !window.game.textures.exists(r.key) && !window.game.renderer.gl.isTexture(r.gpu)),
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
  writeFileSync(`reports/art-pilot/scene-ch4-${missingObjects ? 'fallback-' : ''}native.json`, JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

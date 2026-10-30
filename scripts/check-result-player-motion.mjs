/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const report = {
  scope:
    'All default players: Game→Result→Menu native scene handoff, authored hero clock/frame advance, texture survival and eventual GPU release. Synthetic immediate win, not full completed runs.',
  results: [],
  errors: [],
};
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.goto('http://127.0.0.1:4183/?art=1&lang=zh');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  const actors = await page.evaluate(async () => (await import('/src/data/characters.ts')).CHARACTERS.map((c) => c.id));
  for (const actor of actors) {
    await page.evaluate((actor) => {
      window.run.start(actor, 1, false, 0);
      window.game.scene.getScene('Menu').scene.start('Game');
    }, actor);
    await page.waitForFunction(
      () => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').player?.mode === 'spritesheet',
      { timeout: 60000 },
    );
    await page.evaluate(() => {
      window.game.scene.stop('Hud');
      window.game.scene.getScene('Game').scene.start('Result', { win: true, counted: true });
    });
    await page.waitForFunction(
      (actor) =>
        window.game.scene.isActive('Result') &&
        window.game.scene.getScene('Result').children.list.some((v) => v.ident?.id === actor && v.mode === 'spritesheet'),
      { timeout: 30000 },
      actor,
    );
    const sample = await page.evaluate(async (actor) => {
      const s = window.game.scene.getScene('Result'),
        v = s.children.list.find((v) => v.ident?.id === actor && v.mode === 'spritesheet');
      const key = v.art.texKey,
        texture = s.textures.get(key),
        gpu = texture.source[0].glTexture?.webGLTexture;
      const authoredVictory = v.hasAuthoredAnimation('victory');
      if (!authoredVictory) v.play('move', true);
      const states = [],
        frames = new Set(),
        initialClock = v.t;
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => window.game.events.once('poststep', r));
        states.push(v.state);
        frames.add(v.img.frame.name);
        if (!s.textures.exists(key)) throw Error('Result hero texture unloaded while live');
      }
      if (v.t === initialClock || frames.size < 2) throw Error('Result hero animation did not advance: ' + actor);
      window.__resultTexture = { key, gpu };
      return { actor, key, states: [...new Set(states)], frames: [...frames], listeners: s.events.listenerCount('update') };
    }, actor);
    await page.evaluate(() => window.game.scene.getScene('Result').scene.start('Menu'));
    await page.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Result'));
    await page.evaluate(async () => {
      for (let i = 0; i < 4; i++) await new Promise((r) => window.game.events.once('poststep', r));
    });
    const released = await page.evaluate(
      () => !window.game.textures.exists(window.__resultTexture.key) && !window.game.renderer.gl.isTexture(window.__resultTexture.gpu),
    );
    if (!released) {
      const diag = await page.evaluate(async () => ({
        key: window.__resultTexture.key,
        exists: window.game.textures.exists(window.__resultTexture.key),
        gpuLive: window.game.renderer.gl.isTexture(window.__resultTexture.gpu),
        actualKeys: window.game.textures.getTextureKeys().filter((k) => k.includes('tomato')),
        debug: window.__art.textures(),
        scenes: window.game.scene.getScenes(true).map((s) => s.scene.key),
      }));
      throw Error('Result hero GPU texture retained after exit: ' + JSON.stringify(diag));
    }
    report.results.push({ ...sample, gpuReleased: true });
    console.log('Verified result handoff:', actor);
  }
  if (report.errors.length) throw Error(JSON.stringify(report.errors));
  report.status = 'passed';
} catch (e) {
  report.errors.push(String(e));
  report.status = 'failed';
  throw e;
} finally {
  writeFileSync('reports/art-pilot/result-player-motion-native.json', JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

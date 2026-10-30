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
  scope: 'Delayed showcase image replacement preserves caller action and calibrated scale, and removes old update listeners.',
  cases: [],
  errors: [],
};
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.goto('http://127.0.0.1:4183/?art=1&lang=zh');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.setRequestInterception(true);
  let held;
  page.on('request', (request) => {
    if (/\/runtime\/entities\//.test(request.url())) held = request;
    else request.continue();
  });
  for (const actor of ['carrot', 'corn', 'asparagus']) {
    held = null;
    await page.evaluate(async (actor) => {
      const { showcaseRig } = await import('/src/ui/Portrait.ts');
      const s = window.game.scene.getScene('Menu');
      window.__showcaseBefore = s.events.listenerCount('update');
      const v = showcaseRig(s, 'char', actor, 250, 250, 62);
      if (v.mode !== 'procedural') throw Error('Expected unloaded actor');
      v.setDepth(12).setScale(v.scaleX * 0.75);
      window.__showcaseOld = v;
    }, actor);
    const deadline = Date.now() + 15000;
    while (!held && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
    if (!held) throw Error('No delayed body request');
    await page.evaluate(() => window.__showcaseOld.play('victory', true));
    await held.continue();
    await page.waitForFunction(
      (actor) => window.game.scene.getScene('Menu').children.list.some((v) => v.ident?.id === actor && v.mode === 'spritesheet'),
      { timeout: 30000 },
      actor,
    );
    const sample = await page.evaluate(async (actor) => {
      const s = window.game.scene.getScene('Menu');
      const v = s.children.list.find((v) => v.ident?.id === actor && v.mode === 'spritesheet');
      const { createEntityVisual } = await import('/src/objects/visualFactory.ts');
      const baseline = createEntityVisual(s, { kind: 'char', id: actor }, 62);
      const expectedScale = baseline.scaleX * 0.75;
      baseline.destroy();
      if (Math.abs(v.scaleX - expectedScale) > 1e-6) throw Error('Calibrated scale lost');
      const sample = {
        actor,
        expectedScale,
        state: v.state,
        depth: v.depth,
        x: v.x,
        y: v.y,
        scale: v.scaleX,
        oldDestroyed: !window.__showcaseOld.scene,
        listeners: s.events.listenerCount('update') - window.__showcaseBefore,
      };
      if (
        sample.state !== 'victory' ||
        sample.depth !== 12 ||
        sample.x !== 250 ||
        sample.y !== 250 ||
        !sample.oldDestroyed ||
        sample.listeners !== 1
      )
        throw Error(JSON.stringify(sample));
      v.destroy();
      if (s.events.listenerCount('update') !== window.__showcaseBefore) throw Error('Update callback leaked');
      return sample;
    }, actor);
    report.cases.push(sample);
  }
  if (report.errors.length) throw Error(JSON.stringify(report.errors));
  report.status = 'passed';
} catch (e) {
  report.errors.push(String(e));
  report.status = 'failed';
  throw e;
} finally {
  writeFileSync('reports/art-pilot/showcase-load-state-native.json', JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

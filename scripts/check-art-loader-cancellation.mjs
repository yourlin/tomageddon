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
  scope: 'Native Phaser scenes sharing a real delayed art request; originating-loader cancellation wakes a live waiter and permits retry.',
  errors: [],
};
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.goto('http://127.0.0.1:4183/?art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  let held,
    intercept = true;
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    if (intercept && /\/runtime\/entities\/char\/kiwi\/.*motion/.test(r.url())) held = r;
    else r.continue();
  });
  await page.evaluate(async () => {
    const Scene = Object.getPrototypeOf(Object.getPrototypeOf(window.game.scene.getScene('Menu'))).constructor;
    window.game.scene.add('ArtOwner', new Scene('ArtOwner'), true);
    window.game.scene.add('ArtWaiter', new Scene('ArtWaiter'), true);
    window.__cancelArt = await import('/src/systems/ArtRegistry.ts');
    window.__cancelResult = {};
  });
  await page.waitForFunction(() => window.game.scene.isActive('ArtOwner') && window.game.scene.isActive('ArtWaiter'));
  await page.evaluate(() => {
    const a = window.__cancelArt,
      req = { bodies: [{ kind: 'char', id: 'kiwi' }] };
    window.__ownerPromise = a
      .loadArt(window.game.scene.getScene('ArtOwner'), req, 'cancel:owner')
      .then(() => (window.__cancelResult.ownerResolved = true));
    window.__waiterPromise = a
      .loadArt(window.game.scene.getScene('ArtWaiter'), req, 'cancel:waiter')
      .then(() => (window.__cancelResult.waiterResolved = true));
  });
  const until = Date.now() + 15000;
  while (!held && Date.now() < until) await new Promise((r) => setTimeout(r, 30));
  if (!held) throw Error('Expected held request');
  await page.evaluate(() => {
    window.game.scene.stop('ArtOwner');
    window.__cancelArt.releaseArt('cancel:owner');
  });
  await page.waitForFunction(() => window.__cancelResult.ownerResolved && window.__cancelResult.waiterResolved, { timeout: 5000 });
  report.cancelled = await page.evaluate(() => ({
    resolved: window.__cancelResult,
    remaining: window.__cancelArt.artDebugInfo().filter((r) => r.key.includes('/kiwi')),
    waiterActive: window.game.scene.isActive('ArtWaiter'),
  }));
  if (!report.cancelled.waiterActive || report.cancelled.remaining.some((r) => r.status === 'loading'))
    throw Error('Cancelled load remained pending');
  intercept = false;
  await held.continue();
  report.retry = await page.evaluate(async () => {
    const a = window.__cancelArt,
      s = window.game.scene.getScene('ArtWaiter');
    await a.loadArt(s, { bodies: [{ kind: 'char', id: 'kiwi' }] }, 'cancel:waiter');
    const art = a.readyArt(s, { kind: 'char', id: 'kiwi' });
    if (!art) throw Error('Retry failed');
    const key = art.texKey,
      gpu = s.textures.get(key).source[0].glTexture.webGLTexture;
    a.releaseArt('cancel:waiter');
    a.unloadUnusedArt(s.textures);
    return { key, released: !s.textures.exists(key) && !s.game.renderer.gl.isTexture(gpu) };
  });
  if (!report.retry.released || report.errors.length) throw Error('Retry cleanup failed');
  report.status = 'passed';
} catch (e) {
  report.errors.push(String(e));
  report.status = 'failed';
  throw e;
} finally {
  writeFileSync('reports/art-pilot/art-loader-cancellation-native.json', JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

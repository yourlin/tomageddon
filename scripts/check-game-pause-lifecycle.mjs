/* global window, document */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const report = {
  status: 'pending',
  errors: [],
  scope: 'Actual game destruction followed by blur/hidden events; no access to destroyed SceneManager.',
};
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  page.on('pageerror', (e) => report.errors.push(e.stack || e.message));
  await page.goto('http://127.0.0.1:4183/?art=1');
  await page.waitForFunction(() => window.game?.scene?.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate(() => window.game.destroy(true));
  // Phaser retains the manager object; destroy clears its game reference.
  await page.waitForFunction(() => window.game.scene?.game === null, { timeout: 10000 });
  await page.evaluate(() => {
    window.dispatchEvent(new Event('blur'));
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await new Promise((resolve) => setTimeout(resolve, 100));
  if (report.errors.length) throw Error('Pause listeners accessed destroyed game');
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  process.exitCode = 1;
} finally {
  writeFileSync('reports/art-pilot/direction-audit/game-pause-lifecycle.json', JSON.stringify(report, null, 2));
  await closeArtBrowser(browser);
}

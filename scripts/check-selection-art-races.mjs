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
  scope: 'Native CharSelect with delayed body image requests: rapid selection and exit during pending load.',
  results: [],
  errors: [],
};
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.evaluateOnNewDocument(() =>
    localStorage.setItem(
      'tomato_sister_save_v1',
      JSON.stringify({
        ownedChars: [
          'tomato',
          'carrot',
          'chili',
          'corn',
          'watermelon',
          'lemon',
          'eggplant',
          'garlic',
          'blueberry',
          'pineapple',
          'pumpkin',
          'strawberry',
          'ginger',
          'avocado',
          'onion',
          'mushroom',
          'coconut',
          'grape',
          'cherry',
          'pea',
          'peach',
          'dragonfruit',
          'beet',
          'asparagus',
          'sweetpotato',
          'kiwi',
          'lychee',
          'durian',
          'bellpepper',
          'wintermelon',
          'bittermelon',
          'sprout',
          'wasabi',
          'soybean',
          'jackfruit',
          'pomegranate',
          'taro',
          'cabbage',
          'blackberry',
        ],
        saveVersion: 2,
      }),
    ),
  );
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.goto('http://127.0.0.1:4183/?art=1&lang=zh');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate(() => window.game.scene.getScene('Menu').scene.start('CharSelect', { chapter: 1 }));
  await page.waitForFunction(() => window.game.scene.isActive('CharSelect'));
  await page.setCacheEnabled(false);
  await page.setRequestInterception(true);
  let hold = true;
  const pending = [];
  page.on('request', (r) => {
    if (hold && /\/runtime\/entities\/char\//.test(r.url()) && /motion/.test(r.url())) pending.push(r);
    else r.continue();
  });
  const select = async (actor) =>
    page.evaluate(async (actor) => {
      const { CHARACTERS } = await import('/src/data/characters.ts');
      const s = window.game.scene.getScene('CharSelect');
      s.selected = CHARACTERS.find((c) => c.id === actor);
      s.refresh();
    }, actor);
  const waitPending = async (count) => {
    const until = Date.now() + 15000;
    while (pending.length < count && Date.now() < until) await new Promise((r) => setTimeout(r, 30));
    if (pending.length < count) throw Error('Expected delayed body requests');
  };
  const settle = async () =>
    page.evaluate(async () => {
      for (let i = 0; i < 8; i++) await new Promise((r) => window.game.events.once('poststep', r));
    });
  const initialListeners = await page.evaluate(() => window.game.scene.getScene('CharSelect').events.listenerCount('update'));
  for (const actor of ['carrot', 'corn', 'asparagus']) {
    await select(actor);
    await new Promise((r) => setTimeout(r, 80));
  }
  await waitPending(3);
  hold = false;
  for (const r of pending.splice(0)) await r.continue();
  await page.waitForFunction(
    () => {
      const v = window.game.scene.getScene('CharSelect').showcase;
      return v?.ident?.id === 'asparagus' && v.mode === 'spritesheet';
    },
    { timeout: 30000 },
  );
  await settle();
  const rapid = await page.evaluate(() => {
    const s = window.game.scene.getScene('CharSelect');
    return {
      case: 'rapid selection',
      selected: s.selected.id,
      shown: s.showcase.ident.id,
      listeners: s.events.listenerCount('update'),
      bodies: window.__art.textures().filter((r) => r.key.startsWith('art:char/') && r.key.endsWith(':body')),
    };
  });
  report.results.push(rapid);
  if (rapid.selected !== 'asparagus' || rapid.shown !== 'asparagus' || rapid.bodies.length !== 1 || rapid.listeners !== initialListeners)
    throw Error('Stale rapid selection or resource retention');
  hold = true;
  await select('kiwi');
  await waitPending(1);
  await page.evaluate(() => window.game.scene.getScene('CharSelect').scene.start('Menu'));
  await page.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('CharSelect'));
  hold = false;
  for (const r of pending.splice(0)) await r.continue();
  await new Promise((r) => setTimeout(r, 500));
  await settle();
  const exited = await page.evaluate(() => ({
    case: 'exit pending',
    bodies: window.__art.textures().filter((r) => r.key.startsWith('art:char/') && r.key.endsWith(':body')),
    active: window.game.scene.getScenes(true).map((s) => s.scene.key),
  }));
  report.results.push(exited);
  if (exited.bodies.length || exited.active.includes('CharSelect')) throw Error('Late load retained body after exit');
  await page.evaluate(() => window.game.scene.getScene('Menu').scene.start('CharSelect', { chapter: 1 }));
  await page.waitForFunction(() => window.game.scene.isActive('CharSelect'));
  await select('kiwi');
  await page.waitForFunction(
    () => {
      const v = window.game.scene.getScene('CharSelect').showcase;
      return v?.ident?.id === 'kiwi' && v.mode === 'spritesheet';
    },
    { timeout: 30000 },
  );
  await settle();
  report.results.push({ case: 'cancelled request retried', actor: 'kiwi', mode: 'spritesheet' });
  if (report.errors.length) throw Error(JSON.stringify(report.errors));
  report.status = 'passed';
} catch (e) {
  report.errors.push(String(e));
  report.status = 'failed';
  throw e;
} finally {
  writeFileSync('reports/art-pilot/selection-art-races-native.json', JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

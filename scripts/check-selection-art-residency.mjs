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
  scope: 'Single CharSelect session, all39 defaults, only selected body resident after settled load; shared/live textures protected.',
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
  const actors = await page.evaluate(async () => (await import('/src/data/characters.ts')).CHARACTERS.map((c) => c.id));
  for (const actor of actors) {
    await page.evaluate(async (actor) => {
      const { CHARACTERS } = await import('/src/data/characters.ts');
      const s = window.game.scene.getScene('CharSelect');
      s.selected = CHARACTERS.find((c) => c.id === actor);
      s.refresh();
    }, actor);
    await page.waitForFunction(
      (actor) => {
        const v = window.game.scene.getScene('CharSelect').showcase;
        return v?.ident?.id === actor && v.mode === 'spritesheet';
      },
      { timeout: 30000 },
      actor,
    );
    const sample = await page.evaluate(async (actor) => {
      for (let i = 0; i < 4; i++) await new Promise((r) => window.game.events.once('poststep', r));
      const s = window.game.scene.getScene('CharSelect');
      return {
        actor,
        key: s.showcase.art.texKey,
        bodies: window.__art.textures().filter((r) => r.key.startsWith('art:char/') && r.key.endsWith(':body')),
        listeners: s.events.listenerCount('update'),
      };
    }, actor);
    report.results.push(sample);
    if (sample.bodies.length !== 1 || sample.bodies[0].key !== sample.key)
      throw Error('Nonselected player atlas retained: ' + actor + ' count=' + sample.bodies.length);
  }
  if (new Set(report.results.map((r) => r.listeners)).size !== 1) throw Error('Selection listeners accumulated');
  if (report.errors.length) throw Error(JSON.stringify(report.errors));
  report.status = 'passed';
} catch (e) {
  report.errors.push(String(e));
  report.status = 'failed';
  throw e;
} finally {
  writeFileSync('reports/art-pilot/selection-art-residency-native.json', JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

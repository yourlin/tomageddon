/* global window */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const results = [];
const requested = process.argv.slice(2);
const actors = requested.length
  ? requested
  : [
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
    ];
if (actors.some((id) => !/^[a-z_]+$/.test(id))) throw Error('Invalid actor');
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.evaluateOnNewDocument(() => {
    if (window.location.origin === 'http://127.0.0.1:4183')
      window.localStorage.setItem(
        'tomato_sister_save_v1',
        JSON.stringify({
          ownedChars: [
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
      );
  });
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  for (const actor of actors) {
    await page.evaluate(() => window.game.scene.getScene('Menu').scene.start('CharSelect', { chapter: 1 }));
    await page.waitForFunction(() => window.game.scene.isActive('CharSelect'));
    await page.evaluate(async (actor) => {
      const { CHARACTERS } = await import('/src/data/characters.ts');
      const scene = window.game.scene.getScene('CharSelect');
      scene.selected = CHARACTERS.find((c) => c.id === actor);
      scene.refresh();
    }, actor);
    console.log('Checking showcase:', actor);
    await page
      .waitForFunction(
        (actor) => {
          const v = window.game.scene.getScene('CharSelect').showcase;
          return v?.mode === 'spritesheet' && v.ident?.id === actor;
        },
        { timeout: 15000 },
        actor,
      )
      .catch(async (e) => {
        console.log(
          await page.evaluate(() => {
            const s = window.game.scene.getScene('CharSelect');
            return {
              selected: s.selected.id,
              active: s.scene.isActive(),
              mode: s.showcase?.mode,
              ident: s.showcase?.ident,
              textures: window.game.textures.getTextureKeys().filter((k) => k.startsWith('art:char/')),
            };
          }),
        );
        throw e;
      });
    const showcase = await page.evaluate(() => {
      const v = window.game.scene.getScene('CharSelect').showcase;
      return { id: v.ident.id, texture: v.art.texKey, width: v.img.frame.width };
    });
    await page.evaluate((actor) => {
      window.run.start(actor, 1, false, 0);
      window.game.scene.getScene('CharSelect').scene.start('Game');
    }, actor);
    await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
    const combat = await page.evaluate(() => {
      const g = window.game.scene.getScene('Game');
      const p = g.player;
      if (p.mode !== 'spritesheet') throw Error('Gameplay used procedural player');
      g.scene.pause();
      g.scene.pause('Hud');
      g.scene.launch('Pause');
      window.__playerPausedClock = p.t;
      return { id: p.ident.id, texture: p.art.texKey };
    });
    await page.waitForFunction(() => window.game.scene.isActive('Pause'));
    await page.evaluate(async () => {
      for (let i = 0; i < 5; i++) await new Promise((resolve) => window.game.events.once('poststep', resolve));
      if (window.game.scene.getScene('Game').player.t !== window.__playerPausedClock) throw Error('Paused player animation advanced');
      window.game.scene.getScene('Pause').resume();
    });
    await page.waitForFunction(
      () => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').player.t !== window.__playerPausedClock,
    );
    if (showcase.texture !== combat.texture || combat.id !== actor) throw Error('Selection and gameplay appearance differ');
    await page.evaluate(() => {
      window.game.scene.stop('Hud');
      window.game.scene.getScene('Game').scene.start('Menu');
    });
    await page.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Game'));
    results.push({ actor, showcase, combat, pauseClockHeld: true, resumed: true, returnedToMenu: true });
    console.log('Verified selection, gameplay, pause/resume and return:', actor);
  }
  if (errors.length) throw Error(errors.join('\n'));
  mkdirSync('reports/art-pilot', { recursive: true });
  writeFileSync('reports/art-pilot/player-scene-motion-native.json', JSON.stringify({ status: 'passed', results }, null, 2) + '\n');
} finally {
  await closeArtBrowser(browser);
}

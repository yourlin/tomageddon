/* global window */
import assert from 'node:assert/strict';
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate(() => {
    window.run.start('tomato', 1, false, 0);
    window.run.addWeapon('pea_shooter', 1);
  });
  const results = [];
  for (const name of ['CharSelect', 'Shop', 'Codex', 'Collection', 'Craft', 'RunStats']) {
    await page.evaluate((name) => {
      for (const scene of window.game.scene.getScenes(true)) scene.scene.stop();
      window.game.scene.start(
        name,
        name === 'RunStats'
          ? {
              record: {
                charId: 'tomato',
                chapterId: 1,
                wave: 1,
                level: 1,
                kills: 0,
                sec: 60,
                dmg: [['pea_shooter', 100]],
                weapons: [{ id: 'pea_shooter', tier: 1 }],
                income: [],
              },
            }
          : undefined,
      );
    }, name);
    await page.waitForFunction(
      (name) => {
        const scene = window.game.scene.getScene(name);
        return (
          window.game.scene.isActive(name) &&
          (name === 'Codex'
            ? typeof scene.draw === 'function'
            : name === 'Collection'
              ? typeof scene.openDrawer === 'function'
              : name === 'Craft'
                ? typeof scene.draw === 'function'
                : name === 'RunStats'
                  ? scene.constructor.name === 'RunStatsScene'
                  : true)
        );
      },
      {},
      name,
    );
    await page.evaluate(async (name) => {
      const scene = window.game.scene.getScene(name);
      if (name === 'CharSelect') scene.showWeaponPick();
      if (name === 'Codex') {
        scene.tab = 'weapon';
        scene.draw();
      }
      if (name === 'Collection') {
        const { collectionRows } = await import('/src/scenes/CollectionScene.ts');
        scene.openDrawer(collectionRows().find((row) => row.id === 'weapon'));
      }
    }, name);
    await page.waitForFunction((name) => !window.game.scene.getScene(name).load.isLoading(), { timeout: 30000 }, name);
    const result = await page.evaluate((name) => {
      const scene = window.game.scene.getScene(name);
      const images = [];
      const visit = (objects) => {
        for (const object of objects) {
          if (/^(?:icon_)?weapon_/.test(object.texture?.key ?? '')) images.push(object);
          if (Array.isArray(object.list)) visit(object.list);
        }
      };
      visit(scene.children.list);
      return {
        name,
        images: images.length,
        missing: images.filter((image) => !image.texture.customData.illustratedWeapon).map((image) => image.texture.key),
      };
    }, name);
    assert(result.images > 0, `${name}: no weapon images tested`);
    assert.deepEqual(result.missing, [], `${name}: missing illustrated weapon images`);
    results.push(result);
    await page.evaluate(() => {
      for (const scene of window.game.scene.getScenes(true)) scene.scene.stop();
      window.game.scene.start('Menu');
    });
    await page.waitForFunction(() => window.game.scene.isActive('Menu'));
    await page.evaluate(() => new Promise((resolve) => window.game.events.once('poststep', resolve)));
    const retained = await page.evaluate(() =>
      window.game.textures.getTextureKeys().filter((key) => window.game.textures.get(key).customData.illustratedWeapon),
    );
    assert.deepEqual(retained, [], `${name}: weapon illustration retained after exit`);
  }
  assert.deepEqual(errors, []);
  writeFileSync('reports/art-pilot/weapon-ui-loading-native.json', JSON.stringify({ results, errors, exitRelease: true }, null, 2));
  console.log('Verified actual weapon UI images and exit release:', results);
} finally {
  await closeArtBrowser(browser);
}

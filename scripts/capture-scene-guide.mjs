/* global window */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const chapter = Number(process.argv[2]);
if (!Number.isInteger(chapter) || chapter < 1 || chapter > 7) throw Error('Chapter1..7 required');
const directory = join(process.env.TOMATO_ART_SOURCE ?? '../tomato-sister-art-source', 'maps', `ch${chapter}`, 'guides');
mkdirSync(directory, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.goto('http://127.0.0.1:4183/?art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate((chapter) => {
    window.run.start('tomato', chapter, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  }, chapter);
  await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').player, { timeout: 60000 });
  const data = await page.evaluate((chapter) => {
    const g = window.game.scene.getScene('Game'),
      source = g.textures.get(`arena_map_${chapter}`).getSourceImage();
    if (typeof source.toDataURL !== 'function') throw Error('Procedural guide unavailable');
    const a = g.arena;
    return {
      dataUrl: source.toDataURL('image/png'),
      width: source.width,
      height: source.height,
      arenaWidth: a.width,
      arenaHeight: a.height,
      world: { x: a.centerX, y: a.centerY, w: a.width + 440, h: a.height + 440 },
      obstacles: a.obstacles,
    };
  }, chapter);
  writeFileSync(join(directory, 'geometry.png'), Buffer.from(data.dataUrl.split(',')[1], 'base64'));
  delete data.dataUrl;
  writeFileSync(join(directory, 'geometry.json'), JSON.stringify(data, null, 2) + '\n');
  console.log(directory, data.width, data.height);
} finally {
  await closeArtBrowser(browser);
}

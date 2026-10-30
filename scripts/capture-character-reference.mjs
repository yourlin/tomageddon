/* global window, document, getComputedStyle */
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const actors = process.argv.slice(2);
if (!actors.length || actors.some((id) => !/^[a-z_]+$/.test(id))) throw Error('Provide character ids');
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720 });
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=0');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 60000 });
  await page.waitForFunction(
    () => {
      const loader = document.getElementById('boot-loader');
      return !loader || getComputedStyle(loader).opacity === '0' || getComputedStyle(loader).display === 'none';
    },
    { timeout: 60000 },
  );
  for (const actor of actors) {
    await page.evaluate(async (actor) => {
      const { createEntityVisual } = await import('/src/objects/visualFactory.ts');
      const scene = window.game.scene.getScene('Menu');
      window.__referenceVisual?.destroy();
      scene.add.rectangle(640, 360, 1280, 720, 0x28222c).setDepth(20000);
      const v = createEntityVisual(scene, { kind: 'char', id: actor }, 150, { procedural: true });
      scene.add.existing(v);
      v.setPosition(640, 380).setDepth(20001);
      window.__referenceVisual = v;
      await new Promise((resolve) => window.game.events.once('postrender', resolve));
      await new Promise((resolve) => window.game.events.once('postrender', resolve));
    }, actor);
    const dir = resolve(process.env.TOMATO_ART_SOURCE || '../tomato-sister-art-source', 'drafts/char', actor);
    mkdirSync(dir, { recursive: true });
    await page.screenshot({ path: resolve(dir, 'procedural-reference.png'), clip: { x: 384, y: 104, width: 512, height: 512 } });
    console.log('Captured', actor);
  }
} finally {
  await closeArtBrowser(browser);
}

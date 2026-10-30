/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr } from './art-browser.mjs';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate(() => {
    window.run.start('strawberry', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(() => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    const frames = new Set(),
      start = g.time.now;
    window.__idol = { frames, done: false };
    const sample = () => {
      if (p.state === 'cast') frames.add(String(p.img.frame.name));
      if (g.time.now - start > 6400) {
        window.__idol.finalBuff = g.skill.buffT;
        window.__idol.done = true;
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
    g.skill.cd = 0;
    g.skill.use();
    window.__idol.duration = g.skill.buffT;
    sample();
  });
  await page.waitForFunction(() => window.__idol.done, { timeout: 12000 });
  const result = await page.evaluate(() => ({ ...window.__idol, frames: [...window.__idol.frames] }));
  writeFileSync('reports/art-pilot/strawberry-skill-motion-native.json', JSON.stringify(result, null, 2) + '\n');
  if (result.frames.length !== 4 || Math.abs(result.duration - 6) > 0.01 || result.finalBuff > 0) throw Error(JSON.stringify(result));
  console.log('Verified strawberry: four cast frames, six-second idol buff and expiry.');
} finally {
  await browser.close();
}

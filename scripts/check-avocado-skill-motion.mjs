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
    window.run.start('avocado', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(() => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    for (const w of g.weapons.list) w.cd = 1000;
    const frames = new Set(),
      explosions = [],
      start = g.time.now;
    const explode = g.explode.bind(g);
    g.explode = (...args) => {
      if (args[5] === 0xa7c957) explosions.push({ radius: args[2], damage: args[3] });
      return explode(...args);
    };
    window.__core = { frames, explosions, done: false };
    const sample = () => {
      if (p.state === 'cast') frames.add(String(p.img.frame.name));
      if (g.time.now - start > 1100) {
        window.__core.done = true;
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
    g.skill.cd = 0;
    g.skill.use();
    sample();
  });
  await page.waitForFunction(() => window.__core.done, { timeout: 10000 });
  const result = await page.evaluate(() => ({ ...window.__core, frames: [...window.__core.frames] }));
  writeFileSync('reports/art-pilot/avocado-skill-motion-native.json', JSON.stringify(result, null, 2) + '\n');
  if (result.frames.length !== 4 || result.explosions.length !== 5 || result.explosions.some((x) => x.radius <= 0 || x.damage <= 0))
    throw Error(JSON.stringify(result));
  console.log('Verified avocado: four cast frames and five core overload explosions.');
} finally {
  await browser.close();
}

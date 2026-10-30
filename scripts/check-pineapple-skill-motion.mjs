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
    window.run.start('pineapple', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(() => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    const shots = new Set(),
      frames = new Set(),
      explosions = [];
    const start = g.time.now;
    const explode = g.explode.bind(g);
    g.explode = (...args) => {
      if (args[5] === 0xffd166) explosions.push({ radius: args[2], guaranteedDrop: args[6] });
      return explode(...args);
    };
    window.__cannon = { shots, frames, explosions, done: false };
    const sample = () => {
      if (p.state === 'cast') frames.add(String(p.img.frame.name));
      for (const c of g.children.list) if (c.texture?.key === 'proj_coin') shots.add(c);
      if (g.time.now - start > 1300) {
        window.__cannon.done = true;
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
    g.skill.cd = 0;
    g.skill.use();
    sample();
  });
  await page.waitForFunction(() => window.__cannon.done, { timeout: 10000 });
  const result = await page.evaluate(() => {
    const q = window.__cannon;
    return {
      castFrames: [...q.frames],
      shots: q.shots.size,
      shotsDestroyed: [...q.shots].every((x) => !x.scene),
      explosions: q.explosions,
    };
  });
  writeFileSync('reports/art-pilot/pineapple-skill-motion-native.json', JSON.stringify(result, null, 2) + '\n');
  if (
    result.castFrames.length !== 4 ||
    result.shots !== 3 ||
    !result.shotsDestroyed ||
    result.explosions.length !== 3 ||
    result.explosions.some((x) => !x.guaranteedDrop)
  )
    throw Error(JSON.stringify(result));
  console.log('Verified pineapple skill: four cast frames, three cannonballs/explosions and projectile cleanup.');
} finally {
  await browser.close();
}

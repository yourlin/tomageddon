/* global window */
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
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate(() => {
    window.run.start('cherry', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(async () => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    for (const w of g.weapons.list) w.cd = 1000;
    for (const dx of [-100, 100]) {
      const t = g.spawnEnemyNow('mold', p.x + dx, p.y);
      t.hp = t.maxHp = 1e8;
      t.speed = 0;
    }
    await new Promise((resolve) => g.events.once('postupdate', resolve));
    const frames = new Set(),
      shots = [],
      start = g.time.now,
      spawn = g.spawnPlayerBullet.bind(g);
    g.spawnPlayerBullet = (...args) => {
      shots.push({ time: g.time.now - start, side: Math.sign(args[1] - p.x), state: p.state });
      return spawn(...args);
    };
    window.__cherryCheck = { frames, shots, done: false };
    const sample = () => {
      if (p.state === 'cast') frames.add(String(p.img.frame.name));
      if (g.time.now - start > 1400) {
        window.__cherryCheck.done = true;
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
    g.skill.cd = 0;
    g.skill.use();
  });
  await page.waitForFunction(() => window.__cherryCheck.done, { timeout: 10000 });
  const result = await page.evaluate(() => ({ ...window.__cherryCheck, frames: [...window.__cherryCheck.frames] }));
  writeFileSync('reports/art-pilot/cherry-skill-motion-native.json', JSON.stringify(result, null, 2) + '\n');
  if (
    result.frames.length !== 4 ||
    result.shots.length !== 12 ||
    result.shots.some((s, i) => s.side !== (i % 2 ? 1 : -1) || !['cast', 'attack'].includes(s.state))
  )
    throw Error(JSON.stringify(result));
  console.log('Verified cherry: four cast frames and twelve alternating left/right skill shots.');
} finally {
  await closeArtBrowser(browser);
}

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
    window.run.start('ginger', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(() => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    for (const w of g.weapons.list) w.cd = 1000;
    g.moveX = 1;
    g.moveY = 0;
    const sx = p.x,
      sy = p.y;
    const e = g.spawnEnemyNow('mold', sx + 150, sy);
    e.speed = 0;
    e.hp = e.maxHp = 1e8;
    const frames = new Set(),
      hits = [],
      start = g.time.now;
    const hit = g.weaponHit.bind(g);
    g.weaponHit = (enemy, ...args) => {
      if (enemy === e) hits.push(g.time.now - start);
      return hit(enemy, ...args);
    };
    window.__ninja = { frames, hits, done: false };
    const delayed = g.time.delayedCall.bind(g.time);
    g.time.delayedCall = (delay, callback, ...rest) => {
      if (delay !== 350) return delayed(delay, callback, ...rest);
      const timer = delayed(
        delay,
        (...args) => {
          window.__ninja.slashTimer = { delay: timer.delay, elapsed: timer.elapsed };
          return callback(...args);
        },
        ...rest,
      );
      return timer;
    };
    const sample = () => {
      if (p.state === 'cast') frames.add(String(p.img.frame.name));
      if (g.time.now - start > 1100) {
        Object.assign(window.__ninja, { done: true, damaged: e.hp < 1e8 });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
    g.skill.cd = 0;
    g.skill.use();
    window.__ninja.distance = Math.hypot(p.x - sx, p.y - sy);
    window.__ninja.invulnerable = g.skill.invulnT;
    sample();
  });
  await page.waitForFunction(() => window.__ninja.done, { timeout: 10000 });
  const result = await page.evaluate(() => ({ ...window.__ninja, frames: [...window.__ninja.frames] }));
  writeFileSync('reports/art-pilot/ginger-skill-motion-native.json', JSON.stringify(result, null, 2) + '\n');
  if (
    result.frames.length !== 4 ||
    result.distance < 300 ||
    result.invulnerable < 0.59 ||
    !result.damaged ||
    result.hits.length !== 1 ||
    result.slashTimer?.delay !== 350 ||
    result.slashTimer.elapsed < 350
  )
    throw Error(JSON.stringify(result));
  console.log('Verified ginger: four cast frames, teleport, invulnerability and delayed path slash.');
} finally {
  await browser.close();
}

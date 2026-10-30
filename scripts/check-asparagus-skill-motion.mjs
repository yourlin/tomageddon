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
    window.run.start('asparagus', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(async () => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    g.skill.cd = 1000;
    for (const w of g.weapons.list) w.cd = 1000;
    const targets = [100, 250].map((dx) => {
      const e = g.spawnEnemyNow('mold', p.x + dx, p.y);
      e.hp = e.maxHp = 1e8;
      e.speed = 0;
      return e;
    });
    await new Promise((resolve) => g.events.once('postupdate', resolve));
    const windup = new Set(),
      cast = new Set(),
      hits = [],
      start = g.time.now,
      hit = g.weaponHit.bind(g),
      delayed = g.time.delayedCall.bind(g.time);
    window.__arrow = { windup, cast, hits, done: false };
    g.weaponHit = (e, ...args) => {
      if (targets.includes(e)) hits.push({ target: targets.indexOf(e), time: g.time.now - start });
      return hit(e, ...args);
    };
    g.time.delayedCall = (delay, callback, ...rest) => {
      if (delay !== 400) return delayed(delay, callback, ...rest);
      const timer = delayed(
        delay,
        (...args) => {
          window.__arrow.timer = { delay: timer.delay, elapsed: timer.elapsed };
          return callback(...args);
        },
        ...rest,
      );
      return timer;
    };
    const sample = () => {
      if (p.state === 'windup') windup.add(String(p.img.frame.name));
      if (p.state === 'cast') cast.add(String(p.img.frame.name));
      if (g.time.now - start > 1300) {
        Object.assign(window.__arrow, { done: true, ended: p.state !== 'windup' && p.state !== 'cast' });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
    g.skill.cd = 0;
    g.skill.use();
    g.skill.cd = 1000;
  });
  await page.waitForFunction(() => window.__arrow.done, { timeout: 10000 });
  const r = await page.evaluate(() => ({ ...window.__arrow, windup: [...window.__arrow.windup], cast: [...window.__arrow.cast] }));
  writeFileSync('reports/art-pilot/asparagus-skill-motion-native.json', JSON.stringify(r, null, 2) + '\n');
  if (
    r.windup.length !== 4 ||
    r.cast.length !== 4 ||
    !r.ended ||
    r.timer?.delay !== 400 ||
    r.timer.elapsed < 400 ||
    new Set(r.hits.map((h) => h.target)).size !== 2
  )
    throw Error(JSON.stringify(r));
  console.log('Verified asparagus: four windup/cast frames, 400ms release, two path targets.');
} finally {
  await closeArtBrowser(browser);
}

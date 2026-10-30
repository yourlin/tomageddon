/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const report = {
  scope:
    'Live chapter5 steam vent actual telegraph and callback, shortened vent timer and targets positioned inside radius; not full normal-timing run.',
  errors: [],
};
try {
  const p = await browser.newPage();
  await freezeArtHmr(p);
  p.on('pageerror', (e) => report.errors.push(e.message));
  await p.goto('http://127.0.0.1:4183/?art=1');
  await p.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await p.evaluate(() => {
    window.run.start('tomato', 5, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await p.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').terrain, { timeout: 60000 });
  await p.evaluate(() => {
    const g = window.game.scene.getScene('Game'),
      t = g.terrain;
    g.skill.cd = 999;
    for (const w of g.weapons.list) w.cd = 999;
    for (const h of t.holes) h.t = 1e6;
    const h = t.holes[0];
    h.t = 0;
    window.__steamProbe = { done: false, ventKey: h.img.texture.key };
    const original = g.fx.telegraphCircle.bind(g.fx);
    g.fx.telegraphCircle = (x, y, r, dur, color, callback) => {
      if (r !== 80 || color !== 0xffffff) return original(x, y, r, dur, color, callback);
      g.player.setPosition(x, y);
      window.run.hp = 10000;
      g.shieldUp = false;
      g.stats.dodge = 0;
      g.iframes = 100;
      const e = g.spawnEnemyNow('mold', x + 20, y);
      e.hp = e.maxHp = 10000;
      e.speed = 0;
      const a = window.__steamProbe;
      a.warningAt = g.time.now;
      a.radius = r;
      a.duration = dur;
      return original(x, y, r, dur, color, () => {
        g.iframes = 0;
        const before = window.run.hp,
          enemyBefore = e.hp;
        callback();
        Object.assign(a, {
          callbackAt: g.time.now,
          playerDamage: before - window.run.hp,
          enemyDamage: enemyBefore - e.hp,
          burn: g.pstatus.has('burn'),
          done: true,
        });
        g.iframes = 100;
      });
    };
  });
  await p.waitForFunction(() => window.__steamProbe.done, { timeout: 12000 });
  report.result = await p.evaluate(() => window.__steamProbe);
  const r = report.result;
  if (
    r.callbackAt - r.warningAt < 950 ||
    r.playerDamage <= 0 ||
    r.enemyDamage <= 0 ||
    !r.burn ||
    !r.ventKey.includes(':object:vent') ||
    report.errors.length
  )
    throw Error('Steam callback regression');
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  throw e;
} finally {
  writeFileSync('reports/art-pilot/ch5-steam-gameplay-native.json', JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

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
    'Live chapter2 terrain with generated sprites: rabbit/gopher actual spawns, delayed gopher, sprinkler telegraph/soaked statuses. Test timers shortened and target placed inside spray; not full normal-cooldown chapter run.',
  errors: [],
};
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.goto('http://127.0.0.1:4183/?art=1&lang=zh');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate(() => {
    window.run.start('tomato', 2, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').terrain, { timeout: 60000 });
  await page.evaluate(() => {
    const g = window.game.scene.getScene('Game'),
      t = g.terrain;
    window.run.wave = 3;
    g.iframes = 100;
    g.skill.cd = 999;
    for (const w of g.weapons.list) w.cd = 999;
    const p = { spawns: [], sprinkler: null, done: false };
    window.__terrainProbe = p;
    const spawn = g.spawnEnemyNow.bind(g),
      telegraph = g.fx.telegraphCircle.bind(g.fx);
    g.spawnEnemyNow = (id, x, y, ...rest) => {
      if (id === 'rabbit' || id === 'gopher') {
        p.spawns.push({ id, x, y, at: g.time.now });
        if (id === 'gopher') t.timers.sprinkler = 0;
      }
      return spawn(id, x, y, ...rest);
    };
    g.fx.telegraphCircle = (x, y, r, dur, color, callback) => {
      if (color !== 0x4895ef || r !== 150) return telegraph(x, y, r, dur, color, callback);
      g.player.setPosition(x, y);
      const target = spawn('mold', x + 20, y);
      target.hp = target.maxHp = 1e6;
      target.speed = 0;
      p.sprinkler = { at: g.time.now, radius: r, duration: dur, x, y };
      return telegraph(x, y, r, dur, color, () => {
        callback();
        Object.assign(p.sprinkler, {
          callbackAt: g.time.now,
          playerSoaked: g.pstatus.has('soaked'),
          enemySoaked: target.status.has('soaked'),
        });
        p.done = true;
      });
    };
    t.timers.rabbit = 0;
    t.timers.gopher = 0;
    t.timers.sprinkler = 1e6;
    p.started = g.time.now;
  });
  await page.waitForFunction(() => window.__terrainProbe.done, { timeout: 12000 });
  report.result = await page.evaluate(() => {
    const p = window.__terrainProbe,
      g = window.game.scene.getScene('Game');
    for (const s of p.spawns) {
      if (!g.terrain.holes.some((h) => Math.hypot(h.x - s.x, h.y - (s.y + (s.id === 'gopher' ? 6 : 0))) < 0.1))
        throw Error('Spawn detached from burrow artwork');
    }
    return p;
  });
  const r = report.result,
    gopher = r.spawns.find((s) => s.id === 'gopher');
  if (
    !r.spawns.some((s) => s.id === 'rabbit') ||
    !gopher ||
    gopher.at - r.started < 480 ||
    !r.sprinkler.playerSoaked ||
    !r.sprinkler.enemySoaked ||
    r.sprinkler.callbackAt - r.sprinkler.at < 950 ||
    report.errors.length
  )
    throw Error('Terrain timing/status regression');
  report.status = 'passed';
} catch (e) {
  report.errors.push(String(e));
  report.status = 'failed';
  throw e;
} finally {
  writeFileSync('reports/art-pilot/ch2-terrain-gameplay-native.json', JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

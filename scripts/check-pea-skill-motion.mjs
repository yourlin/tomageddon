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
    window.run.start('pea', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(async () => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    for (const w of g.weapons.list) w.cd = 1000;
    const target = g.spawnEnemyNow('mold', p.x + 100, p.y);
    target.hp = target.maxHp = 1e8;
    target.speed = 0;
    await new Promise((resolve) => g.events.once('postupdate', resolve));
    const frames = new Set(),
      shots = [],
      start = g.time.now,
      spawn = g.spawnPlayerBullet.bind(g),
      previous = new Set(g.children.list);
    g.spawnPlayerBullet = (...args) => {
      if (args[0] === 'proj_pea') shots.push({ time: g.time.now - start, x: args[1], y: args[2] });
      return spawn(...args);
    };
    window.__peaCheck = { frames, shots, done: false };
    g.skill.cd = 0;
    g.skill.use();
    const gun = g.children.list.find((c) => !previous.has(c) && c.type === 'Graphics' && c.depth === p.y + 10);
    window.__peaCheck.turretCreated = !!gun;
    const sample = () => {
      if (p.state === 'cast') frames.add(String(p.img.frame.name));
      if (g.time.now - start > 5800) {
        Object.assign(window.__peaCheck, { done: true, turretDestroyed: !gun?.scene });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
  });
  await page.waitForFunction(() => window.__peaCheck.done, { timeout: 12000 });
  const result = await page.evaluate(() => ({ ...window.__peaCheck, frames: [...window.__peaCheck.frames] }));
  writeFileSync('reports/art-pilot/pea-skill-motion-native.json', JSON.stringify(result, null, 2) + '\n');
  if (result.frames.length !== 4 || result.shots.length !== 20 || !result.turretCreated || !result.turretDestroyed)
    throw Error(JSON.stringify(result));
  console.log('Verified pea: four cast frames, ' + result.shots.length + ' turret shots, expiry cleanup.');
} finally {
  await closeArtBrowser(browser);
}

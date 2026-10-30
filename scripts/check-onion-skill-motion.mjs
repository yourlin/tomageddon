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
    window.run.start('onion', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(() => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    for (const w of g.weapons.list) w.cd = 1000;
    const e = g.spawnEnemyNow('mold', p.x + 30, p.y);
    e.speed = 0;
    e.hp = e.maxHp = 1e8;
    const frames = new Set(),
      hits = [],
      start = g.time.now;
    const before = new Set(g.children.list);
    const hit = g.weaponHit.bind(g);
    g.weaponHit = (target, ...args) => {
      if (target === e) hits.push(g.time.now - start);
      return hit(target, ...args);
    };
    window.__gas = { frames, hits, done: false };
    let clouds = [];
    const sample = () => {
      if (p.state === 'cast') frames.add(String(p.img.frame.name));
      if (g.time.now - start > 5600) {
        Object.assign(window.__gas, { done: true, cloudsDestroyed: clouds.every((c) => !c.scene), damaged: e.hp < 1e8 });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
    g.skill.cd = 0;
    g.skill.use();
    clouds = g.children.list.filter((c) => !before.has(c) && c.texture?.key === 'fx_glow' && c.tintTopLeft === 0xe9edc9);
    window.__gas.cloudCount = clouds.length;
    sample();
  });
  await page.waitForFunction(() => window.__gas.done, { timeout: 12000 });
  const result = await page.evaluate(() => ({ ...window.__gas, frames: [...window.__gas.frames] }));
  writeFileSync('reports/art-pilot/onion-skill-motion-native.json', JSON.stringify(result, null, 2) + '\n');
  if (
    result.frames.length !== 4 ||
    result.cloudCount !== 12 ||
    !result.cloudsDestroyed ||
    !result.damaged ||
    result.hits.length < 8 ||
    result.hits.at(-1) > 5300
  )
    throw Error(JSON.stringify(result));
  console.log('Verified onion: four cast frames, sustained tear gas damage and twelve clouds cleaned up.');
} finally {
  await closeArtBrowser(browser);
}

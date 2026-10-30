/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr } from './art-browser.mjs';
const procedural = process.argv.includes('--procedural');
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.goto(`http://127.0.0.1:4183/?lang=zh&art=${procedural ? 0 : 1}`);
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate(() => {
    window.run.start('coconut', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(() => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    for (const w of g.weapons.list) w.cd = 1000;
    const e = g.spawnEnemyNow('mold', p.x + 25, p.y);
    e.speed = 0;
    e.hp = e.maxHp = 1e8;
    const frames = new Set(),
      scales = new Set(),
      hits = [],
      start = g.time.now;
    const hit = g.weaponHit.bind(g);
    const base = p.scale;
    g.weaponHit = (target, ...args) => {
      if (target === e) hits.push(g.time.now - start);
      return hit(target, ...args);
    };
    window.__pound = { frames, scales, hits, base, done: false };
    const sample = () => {
      if (p.state === 'cast' && p.img) frames.add(String(p.img.frame.name));
      scales.add(p.scale);
      if (g.time.now - start > 1100) {
        Object.assign(window.__pound, { done: true, damaged: e.hp < 1e8, finalScale: p.scale });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
    g.skill.cd = 0;
    g.skill.use();
    window.__pound.invulnerable = g.skill.invulnT;
    sample();
  });
  await page.waitForFunction(() => window.__pound.done, { timeout: 10000 });
  const result = await page.evaluate(() => ({ ...window.__pound, frames: [...window.__pound.frames], scales: [...window.__pound.scales] }));
  writeFileSync(
    `reports/art-pilot/coconut-skill-${procedural ? 'procedural' : 'motion'}-native.json`,
    JSON.stringify(result, null, 2) + '\n',
  );
  if (
    (!procedural && result.frames.length !== 4) ||
    !result.damaged ||
    result.hits.length !== 1 ||
    result.invulnerable < 0.59 ||
    (procedural ? Math.max(...result.scales) < result.base * 1.2 : result.scales.some((x) => Math.abs(x - result.base) > 0.001)) ||
    Math.abs(result.finalScale - result.base) > 0.001
  )
    throw Error(JSON.stringify(result));
  console.log('Verified coconut: four authored cast frames, fixed scale, invulnerability and ground impact damage.');
} finally {
  await browser.close();
}

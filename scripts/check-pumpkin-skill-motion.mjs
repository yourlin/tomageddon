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
    window.run.start('pumpkin', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(() => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    for (const w of g.weapons.list) w.cd = 1000;
    const target = g.spawnEnemyNow('mold', p.x + 15, p.y);
    target.speed = 0;
    target.hp = target.maxHp = 1e8;
    const frames = new Set(),
      start = g.time.now;
    const q = { frames, minAlpha: 1, sawDecoy: false, done: false };
    window.__phase = q;
    const sample = () => {
      if (p.state === 'cast') frames.add(String(p.img.frame.name));
      if (g.skill.ghostT > 0) q.minAlpha = Math.min(q.minAlpha, p.alpha);
      q.sawDecoy ||= !!g.decoy;
      if (g.time.now - start > 3300) {
        Object.assign(q, { done: true, finalGhost: g.skill.ghostT, finalDecoy: !!g.decoy, finalAlpha: p.alpha, damaged: target.hp < 1e8 });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
    g.skill.cd = 0;
    g.skill.use();
    q.duration = g.skill.ghostT;
    q.invulnerable = g.skill.invulnerable;
    sample();
  });
  await page.waitForFunction(() => window.__phase.done, { timeout: 10000 });
  const result = await page.evaluate(() => ({ ...window.__phase, frames: [...window.__phase.frames] }));
  writeFileSync('reports/art-pilot/pumpkin-skill-motion-native.json', JSON.stringify(result, null, 2) + '\n');
  if (
    result.frames.length !== 4 ||
    Math.abs(result.duration - 2.5) > 0.01 ||
    !result.invulnerable ||
    !result.sawDecoy ||
    result.finalDecoy ||
    result.finalGhost > 0 ||
    !result.damaged ||
    result.minAlpha <= 0 ||
    result.minAlpha >= 0.5 ||
    result.finalAlpha !== 1
  )
    throw Error(JSON.stringify(result));
  console.log('Verified pumpkin: four cast frames, 2.5s translucent phase, decoy/contact damage and restoration.');
} finally {
  await browser.close();
}

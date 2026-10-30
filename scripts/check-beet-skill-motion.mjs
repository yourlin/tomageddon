/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const procedural = process.argv.includes('--procedural');
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=' + (procedural ? '0' : '1'));
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate(() => {
    window.run.start('beet', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(() => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    for (const w of g.weapons.list) w.cd = 1000;
    const frames = new Set(),
      start = g.time.now,
      base = p.scale;
    window.__beetCheck = { frames, done: false, base, minScale: base, maxScale: base };
    const sample = () => {
      if (p.state === 'cast' && p.img) frames.add(String(p.img.frame.name));
      const r = window.__beetCheck;
      r.minScale = Math.min(r.minScale, p.scale);
      r.maxScale = Math.max(r.maxScale, p.scale);
      if (g.time.now - start > 6600) {
        Object.assign(r, {
          done: true,
          finalScale: p.scale,
          effectsCleared: g.skill.effects.length === 0,
          expired: !g.pstatus.has('enrage') && !g.pstatus.has('vampiric'),
        });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
    g.skill.cd = 0;
    g.skill.use();
    g.skill.cd = 1000;
    window.__beetCheck.statusApplied = g.pstatus.has('enrage') && g.pstatus.has('vampiric');
  });
  await page.waitForFunction(() => window.__beetCheck.done, { timeout: 12000 });
  const r = await page.evaluate(() => ({ ...window.__beetCheck, frames: [...window.__beetCheck.frames] }));
  writeFileSync(
    'reports/art-pilot/beet-skill-motion-' + (procedural ? 'procedural' : 'native') + '.json',
    JSON.stringify(r, null, 2) + '\n',
  );
  if (
    (!procedural && r.frames.length !== 4) ||
    !r.statusApplied ||
    !r.expired ||
    !r.effectsCleared ||
    Math.abs(r.finalScale - r.base) > 0.001 ||
    (procedural ? r.maxScale <= r.base * 1.02 : Math.abs(r.maxScale - r.base) > 0.001)
  )
    throw Error(JSON.stringify(r));
  console.log('Verified beet ' + (procedural ? 'procedural' : 'authored') + ': berserk statuses, scale policy, expiry cleanup.');
} finally {
  await closeArtBrowser(browser);
}

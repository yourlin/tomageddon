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
    window.run.start('dragonfruit', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(async () => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    g.skill.cd = 1000;
    for (const w of g.weapons.list) w.cd = 1000;
    const sx = p.x,
      sy = p.y;
    g.moveX = 1;
    g.moveY = 0;
    const target = g.spawnEnemyNow('mold', sx + 120, sy);
    target.hp = target.maxHp = 1e8;
    target.speed = 0;
    await new Promise((resolve) => g.events.once('postupdate', resolve));
    const frames = new Set(),
      hits = [],
      start = g.time.now,
      hit = g.weaponHit.bind(g);
    g.weaponHit = (e, ...args) => {
      if (e === target) hits.push({ time: g.time.now - start, damage: args[0].dmg });
      return hit(e, ...args);
    };
    window.__dragonCheck = { frames, hits, done: false, distance: 0 };
    const sample = () => {
      target.x = sx + 120;
      target.y = sy;
      if (p.state === 'charge' && p.img) frames.add(String(p.img.frame.name));
      window.__dragonCheck.distance = Math.max(window.__dragonCheck.distance, Math.hypot(p.x - sx, p.y - sy));
      if (g.time.now - start > 4300) {
        Object.assign(window.__dragonCheck, {
          done: true,
          dashCleared: !g.skill.dash,
          effectsCleared: g.skill.effects.length === 0,
          chargeEnded: p.state !== 'charge',
        });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
    g.moveX = 1;
    g.moveY = 0;
    g.skill.cd = 0;
    g.skill.use();
    g.skill.cd = 1000;
    window.__dragonCheck.invulnerable = g.skill.invulnT;
  });
  await page.waitForFunction(() => window.__dragonCheck.done, { timeout: 12000 });
  const result = await page.evaluate(() => ({ ...window.__dragonCheck, frames: [...window.__dragonCheck.frames] }));
  writeFileSync(
    'reports/art-pilot/dragonfruit-skill-motion-' + (procedural ? 'procedural' : 'native') + '.json',
    JSON.stringify(result, null, 2) + '\n',
  );
  if (
    (!procedural && result.frames.length !== 4) ||
    result.distance < 300 ||
    result.invulnerable < 0.5 ||
    !result.hits.some((h) => h.time < 450) ||
    !result.hits.some((h) => h.time > 500) ||
    !result.dashCleared ||
    !result.effectsCleared ||
    !result.chargeEnded
  )
    throw Error(JSON.stringify(result));
  console.log(
    'Verified dragonfruit ' + (procedural ? 'procedural' : 'authored') + ': charge, path damage, sustained trail, expiry cleanup.',
  );
} finally {
  await closeArtBrowser(browser);
}

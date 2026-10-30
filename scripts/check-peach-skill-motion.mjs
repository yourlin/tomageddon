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
    window.run.start('peach', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(async () => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    g.skill.cd = 1000;
    for (const w of g.weapons.list) w.cd = 1000;
    window.run.hp = 10;
    const frames = new Set(),
      heals = [],
      heal = g.heal.bind(g),
      previous = new Set(g.children.list),
      start = g.time.now;
    g.heal = (...args) => {
      const before = window.run.hp;
      const value = heal(...args);
      if (args[2] === 'skill') heals.push({ time: g.time.now - start, amount: args[0], actual: window.run.hp - before });
      return value;
    };
    const target = g.spawnEnemyNow('mold', p.x + 80, p.y);
    target.hp = target.maxHp = 1e8;
    target.speed = 0;
    const hp = target.hp;
    await new Promise((resolve) => g.events.once('postupdate', resolve));
    window.__peachCheck = { frames, heals, done: false, maxWingCommands: 0 };
    g.skill.cd = 0;
    g.skill.use();
    g.skill.cd = 1000;
    const wings = g.children.list.find((c) => !previous.has(c) && c.type === 'Graphics' && c.depth === 10900);
    const beam = g.children.list.find((c) => !previous.has(c) && c.type === 'Graphics' && c.depth === 11400);
    window.__peachCheck.wingsCreated = !!wings;
    window.__peachCheck.initialDamage = target.hp < hp;
    window.__peachCheck.authored = p.hasAuthoredAnimation('cast');
    const sample = () => {
      if (p.state === 'cast' && p.img) frames.add(String(p.img.frame.name));
      window.__peachCheck.maxWingCommands = Math.max(window.__peachCheck.maxWingCommands, wings?.commandBuffer?.length ?? 0);
      if (g.time.now - start > 2800) {
        Object.assign(window.__peachCheck, { done: true, wingsDestroyed: !wings?.scene, beamDestroyed: !beam?.scene });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
  });
  await page.waitForFunction(() => window.__peachCheck.done, { timeout: 10000 });
  const result = await page.evaluate(() => ({ ...window.__peachCheck, frames: [...window.__peachCheck.frames] }));
  writeFileSync(
    'reports/art-pilot/peach-skill-motion-' + (procedural ? 'procedural' : 'native') + '.json',
    JSON.stringify(result, null, 2) + '\n',
  );
  if (
    (!procedural && result.frames.length !== 4) ||
    result.heals.length !== 3 ||
    result.heals.some((h) => h.amount <= 0 || h.actual <= 0) ||
    !result.initialDamage ||
    !result.wingsDestroyed ||
    !result.beamDestroyed ||
    (procedural ? result.maxWingCommands === 0 : result.wingsCreated)
  )
    throw Error(JSON.stringify(result));
  console.log('Verified peach ' + (procedural ? 'procedural' : 'authored') + ': blessing damage, three heals, wing policy and cleanup.');
} finally {
  await closeArtBrowser(browser);
}

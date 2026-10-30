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
    window.run.start('grape', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(() => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    for (const w of g.weapons.list) w.cd = 1000;
    const cast = new Set(),
      spawn = new Set(),
      die = new Set(),
      start = g.time.now;
    const explosions = [];
    const explode = g.explode.bind(g);
    g.explode = (...args) => {
      if (args[5] === 0x9d4edd) explosions.push(g.time.now - start);
      return explode(...args);
    };
    window.__decoyCheck = { cast, spawn, die, explosions, done: false };
    const sample = () => {
      if (p.state === 'cast') cast.add(String(p.img.frame.name));
      if (clone?.scene && clone.state === 'spawn') spawn.add(String(clone.img.frame.name));
      if (clone?.scene && clone.state === 'die') die.add(String(clone.img.frame.name));
      if (g.time.now - start > 6800) {
        Object.assign(window.__decoyCheck, { done: true, destroyed: !clone.scene, decoyCleared: !g.decoy });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
    g.skill.cd = 0;
    g.skill.use();
    const clone = g.children.list.find((c) => c !== p && c.ident?.kind === 'char' && c.ident?.id === 'grape');
    window.__decoyCheck.sameTexture = clone?.art?.texKey === p.art.texKey;
    window.__decoyCheck.initialDecoy = !!g.decoy;
    sample();
  });
  await page.waitForFunction(() => window.__decoyCheck.done, { timeout: 12000 });
  const result = await page.evaluate(() => ({
    ...window.__decoyCheck,
    cast: [...window.__decoyCheck.cast],
    spawn: [...window.__decoyCheck.spawn],
    die: [...window.__decoyCheck.die],
  }));
  writeFileSync('reports/art-pilot/grape-skill-motion-native.json', JSON.stringify(result, null, 2) + '\n');
  if (
    result.cast.length !== 4 ||
    result.spawn.length !== 4 ||
    result.die.length !== 4 ||
    !result.sameTexture ||
    !result.initialDecoy ||
    !result.decoyCleared ||
    !result.destroyed ||
    result.explosions.length !== 1
  )
    throw Error(JSON.stringify(result));
  console.log('Verified grape: four cast/spawn/death frames, shared clone texture, decoy explosion and cleanup.');
} finally {
  await browser.close();
}

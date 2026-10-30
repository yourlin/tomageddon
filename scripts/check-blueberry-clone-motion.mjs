/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr } from './art-browser.mjs';
const blocked = process.argv.includes('--blocked');
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
    window.run.start('blueberry', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate((blocked) => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    const target = g.spawnEnemyNow('mold', p.x + 140, p.y);
    target.hp = target.maxHp = 1e8;
    target.speed = 0;
    const rigs = new Map();
    const start = g.time.now;
    const sample = () => {
      for (const r of g.children.list)
        if (r !== p && r.ident?.kind === 'char' && r.ident.id === 'blueberry' && r.mode === 'spritesheet') {
          if (!rigs.has(r))
            rigs.set(r, { texture: r.img.texture.key, states: new Set(), spawn: new Set(), attack: new Set(), die: new Set() });
          const q = rigs.get(r);
          q.states.add(r.state);
          if (q[r.state] instanceof Set) q[r.state].add(String(r.img.frame.name));
        }
      if (g.time.now - start > (blocked ? 3000 : 9300)) {
        window.__twins.done = true;
        g.events.off('postupdate', sample);
      }
    };
    window.__twins = { rigs, done: false, texture: p.img.texture.key };
    g.events.on('postupdate', sample);
    g.skill.cd = 0;
    g.skill.use();
    sample();
    if (blocked)
      g.time.delayedCall(1500, () => {
        for (const shield of [...g.bulletShields]) shield.block?.(1e9);
      });
  }, blocked);
  await page.waitForFunction(() => window.__twins.done, { timeout: 20000 });
  const result = await page.evaluate(() => {
    const q = window.__twins;
    const g = window.game.scene.getScene('Game');
    return {
      texture: q.texture,
      clones: [...q.rigs].map(([r, x]) => ({
        texture: x.texture,
        states: [...x.states],
        spawn: [...x.spawn],
        attack: [...x.attack],
        die: [...x.die],
        destroyed: !r.scene,
      })),
      weaponClones: g.weaponClones.length,
      shields: g.bulletShields.length,
    };
  });
  writeFileSync(
    `reports/art-pilot/blueberry-clone-${blocked ? 'blocked' : 'expiry'}-motion-native.json`,
    JSON.stringify(result, null, 2) + '\n',
  );
  if (result.clones.length !== 2) throw Error('Expected two clones: ' + JSON.stringify(result));
  for (const c of result.clones)
    if (c.texture !== result.texture || c.spawn.length !== 4 || c.attack.length !== 4 || c.die.length !== 4 || !c.destroyed)
      throw Error('Clone animation/lifetime failed: ' + JSON.stringify(result));
  if (result.weaponClones || result.shields) throw Error('Clone gameplay references leaked');
  console.log('Verified two blueberry clones: shared texture, four spawn/attack/death frames and lifecycle cleanup.');
} finally {
  await browser.close();
}

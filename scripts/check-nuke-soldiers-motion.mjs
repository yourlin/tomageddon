/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const actor = process.argv[2],
  procedural = process.argv.includes('--procedural');
if (!['wasabi', 'soybean'].includes(actor)) throw Error('Unsupported actor');
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=' + (procedural ? '0' : '1'));
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate((id) => {
    window.run.start(id, 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  }, actor);
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(async (actor) => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    g.skill.cd = 1000;
    for (const w of g.weapons.list) w.cd = 1000;
    const target = g.spawnEnemyNow('mold', p.x + 100, p.y);
    target.hp = target.maxHp = 1e8;
    target.speed = 0;
    await new Promise((resolve) => g.events.once('postupdate', resolve));
    const start = g.time.now,
      frames = new Set(),
      hits = [],
      before = new Set(g.children.list),
      hit = g.weaponHit.bind(g),
      explode = g.explode.bind(g),
      origin = { x: p.x, y: p.y };
    const r = (window.__nukeSoldiers = { frames, hits, explosions: [], done: false, authored: p.hasAuthoredAnimation('cast') });
    g.weaponHit = (e, info, x, y) => {
      if (e === target && info.weaponId === 'skill') hits.push(g.time.now - start);
      return hit(e, info, x, y);
    };
    g.explode = (...args) => {
      r.explosions.push({ at: g.time.now - start, x: args[0], y: args[1] });
      return explode(...args);
    };
    g.skill.cd = 0;
    g.skill.use();
    g.skill.cd = 1000;
    const troops = actor === 'soybean' ? g.children.list.filter((c) => !before.has(c) && c.type === 'Graphics' && c.depth === 0) : [];
    const bomb =
      actor === 'wasabi' ? g.children.list.find((c) => !before.has(c) && c.type === 'Image' && c.texture.key === 'proj_rocket') : null;
    r.troops = troops.length;
    r.bombCreated = !!bomb;
    r.initialHp = target.hp;
    const skillObjects = new Set(troops);
    if (bomb) skillObjects.add(bomb);
    const sample = () => {
      const elapsed = g.time.now - start;
      if (p.state === 'cast' && p.img) frames.add(String(p.img.frame.name));
      for (const c of g.children.list)
        if (!before.has(c) && c.type === 'Image' && ['fx_pool', 'fx_glow'].includes(c.texture?.key)) skillObjects.add(c);
      if (actor === 'soybean' && elapsed > 2200 && !r.relocated) {
        r.relocated = true;
        target.x = origin.x + 380;
        target.y = origin.y;
        target.rig?.setPosition(target.x, target.y);
        r.hitsBeforeRelocation = hits.length;
      }
      const end = actor === 'soybean' ? 15800 : 5700;
      if (elapsed > end) {
        Object.assign(r, {
          done: true,
          damage: r.initialHp - target.hp,
          effectsCleared: g.skill.effects.length === 0,
          objectsDestroyed: [...skillObjects].every((c) => !c.scene),
          hitsAfterRelocation: actor === 'soybean' ? hits.length - r.hitsBeforeRelocation : 0,
        });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
  }, actor);
  await page.waitForFunction(() => window.__nukeSoldiers.done, { timeout: 26000 });
  const r = await page.evaluate(() => ({ ...window.__nukeSoldiers, frames: [...window.__nukeSoldiers.frames] }));
  writeFileSync(`reports/art-pilot/${actor}-skill-${procedural ? 'procedural' : 'native'}.json`, JSON.stringify(r, null, 2) + '\n');
  if (errors.length || (!procedural && r.frames.length !== 4) || !r.effectsCleared || !r.objectsDestroyed || r.damage <= 0)
    throw Error(JSON.stringify({ r, errors }));
  if (actor === 'wasabi' && (!r.bombCreated || r.explosions.length !== 1 || r.explosions[0].at < 800 || r.hits.length < 4))
    throw Error(JSON.stringify(r));
  if (actor === 'soybean' && (r.troops !== 8 || !r.relocated || r.hitsAfterRelocation < 4)) throw Error(JSON.stringify(r));
  console.log(`Verified ${actor} ${procedural ? 'procedural' : 'authored'}: cast, actual damage, delayed/summoned mechanics and cleanup.`);
} finally {
  await closeArtBrowser(browser);
}

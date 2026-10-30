/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const actor = process.argv[2],
  procedural = process.argv.includes('--procedural');
if (!['bellpepper', 'wintermelon'].includes(actor)) throw Error('Unsupported actor');
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
    const e = g.spawnEnemyNow('mold', p.x + 60, p.y);
    e.hp = e.maxHp = 1e8;
    e.speed = 0;
    await new Promise((resolve) => g.events.once('postupdate', resolve));
    const frames = new Set(),
      hits = [],
      start = g.time.now,
      origin = { x: p.x, y: p.y },
      hit = g.weaponHit.bind(g),
      before = new Set(g.children.list);
    const r = (window.__mechMonk = { frames, hits, done: false, maxCommands: 0, maxPush: 0, authored: p.hasAuthoredAnimation('cast') });
    g.weaponHit = (enemy, info, x, y) => {
      if (info.weaponId === 'skill') hits.push({ time: g.time.now - start, x, y });
      return hit(enemy, info, x, y);
    };
    g.skill.cd = 0;
    g.skill.use();
    g.skill.cd = 1000;
    const effect = g.children.list.find(
      (c) => !before.has(c) && c.type === 'Graphics' && c.depth === (actor === 'bellpepper' ? 12300 : 11900),
    );
    r.effectCreated = !!effect;
    r.fortifyApplied = actor === 'bellpepper' || g.pstatus.has('fortify');
    r.invulnerabilityApplied = actor === 'bellpepper' || g.skill.invulnerable;
    const sample = () => {
      const elapsed = g.time.now - start;
      if (p.state === 'cast' && p.img) frames.add(String(p.img.frame.name));
      r.maxCommands = Math.max(r.maxCommands, effect?.commandBuffer?.length || 0);
      r.maxPush = Math.max(r.maxPush, Math.hypot(e.kvx, e.kvy));
      if (actor === 'bellpepper' && elapsed > 1300 && !r.moved) {
        r.moved = true;
        p.setPosition(origin.x + 350, origin.y);
        e.x = p.x + 70;
        e.y = p.y;
      }
      if (elapsed > 8800) {
        Object.assign(r, {
          done: true,
          effectDestroyed: !effect?.scene,
          effectsCleared: g.skill.effects.length === 0,
          fortifyExpired: actor === 'bellpepper' || !g.pstatus.has('fortify'),
          invulnerabilityExpired: !g.skill.invulnerable,
          castEnded: p.state !== 'cast',
        });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
  }, actor);
  await page.waitForFunction(() => window.__mechMonk.done, { timeout: 18000 });
  const r = await page.evaluate(() => ({ ...window.__mechMonk, frames: [...window.__mechMonk.frames] }));
  writeFileSync(`reports/art-pilot/${actor}-skill-${procedural ? 'procedural' : 'native'}.json`, JSON.stringify(r, null, 2) + '\n');
  if (
    errors.length ||
    (!procedural && r.frames.length !== 4) ||
    !r.effectCreated ||
    !r.maxCommands ||
    !r.effectDestroyed ||
    !r.effectsCleared ||
    !r.castEnded
  )
    throw Error(JSON.stringify({ r, errors }));
  if (actor === 'bellpepper' && (r.hits.length < 5 || !r.hits.some((h) => h.time > 2200 && h.x > r.hits[0].x + 200)))
    throw Error(JSON.stringify(r));
  if (
    actor === 'wintermelon' &&
    (!r.fortifyApplied || !r.invulnerabilityApplied || !r.fortifyExpired || !r.invulnerabilityExpired || r.maxPush <= 0)
  )
    throw Error(JSON.stringify(r));
  console.log(`Verified ${actor} ${procedural ? 'procedural' : 'authored'}: cast frames, skill mechanics and cleanup.`);
} finally {
  await closeArtBrowser(browser);
}

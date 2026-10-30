/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const actor = process.argv[2],
  procedural = process.argv.includes('--procedural');
if (!['taro', 'cabbage'].includes(actor)) throw Error('Unsupported actor');
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
    const target = g.spawnEnemyNow('mold', p.x + 70, p.y);
    target.hp = target.maxHp = 1e8;
    target.speed = 0;
    await new Promise((resolve) => g.events.once('postupdate', resolve));
    const origin = { x: p.x, y: p.y },
      start = g.time.now,
      frames = new Set(),
      hits = [],
      before = new Set(g.children.list),
      hit = g.weaponHit.bind(g);
    const r = (window.__fieldArmor = { frames, hits, done: false });
    g.weaponHit = (e, info, x, y) => {
      if (e === target && info.weaponId === 'skill') hits.push(g.time.now - start);
      return hit(e, info, x, y);
    };
    g.skill.cd = 0;
    g.skill.use();
    g.skill.cd = 1000;
    const field = g.skill.fields[0],
      effects = g.children.list.filter((c) => !before.has(c) && (c.depth === 11800 || c.depth === 1.5 || c.depth === 1.6));
    r.fieldCreated = !!field;
    r.shieldAdded = !!field && g.bulletShields.includes(field.shield);
    r.effectCount = effects.length;
    r.statusesApplied = actor === 'taro' || ['barrier', 'fortify', 'regen'].every((s) => g.pstatus.has(s));
    let probe;
    if (actor === 'taro') {
      g.enemyBullet('proj_enemy', origin.x + 100, origin.y, Math.PI, 10, 1, 0, 1, undefined, target);
      probe = g.enemyBullets.find((b) => b.alive && b.owner === target);
      r.probeCreated = !!probe;
    }
    const sample = () => {
      const elapsed = g.time.now - start;
      if (p.state === 'cast' && p.img) frames.add(String(p.img.frame.name));
      if (actor === 'taro' && elapsed > 250 && !r.probeChecked) {
        r.probeChecked = true;
        r.bulletBlocked = !!probe && !probe.alive;
      }
      if (target.status.has('burn')) r.burnApplied = true;
      if (target.status.has('slow')) r.slowApplied = true;
      if (elapsed > 1600 && !r.moved) {
        r.moved = true;
        p.setPosition(origin.x + 400, origin.y);
      }
      if (actor === 'taro' && elapsed > 2400 && !r.fieldChecked) {
        r.fieldChecked = true;
        r.fieldStayedAtCast = !!field && field.x === origin.x && field.y === origin.y && Math.abs(field.img.x - origin.x) < 1;
      }
      if (elapsed > 8800) {
        Object.assign(r, {
          done: true,
          fieldsCleared: g.skill.fields.length === 0,
          shieldRemoved: !field || !g.bulletShields.includes(field.shield),
          effectsCleared: g.skill.effects.length === 0,
          effectsDestroyed: effects.every((c) => !c.scene),
          statusesExpired: ['barrier', 'fortify', 'regen'].every((s) => !g.pstatus.has(s)),
          slowExpired: !target.status.has('slow'),
        });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
  }, actor);
  await page.waitForFunction(() => window.__fieldArmor.done, { timeout: 19000 });
  const r = await page.evaluate(() => ({ ...window.__fieldArmor, frames: [...window.__fieldArmor.frames] }));
  writeFileSync(`reports/art-pilot/${actor}-skill-${procedural ? 'procedural' : 'native'}.json`, JSON.stringify(r, null, 2) + '\n');
  if (errors.length || (!procedural && r.frames.length !== 4) || !r.effectsCleared || !r.effectsDestroyed)
    throw Error(JSON.stringify({ r, errors }));
  if (
    actor === 'taro' &&
    (!r.fieldCreated ||
      !r.shieldAdded ||
      !r.probeCreated ||
      !r.bulletBlocked ||
      !r.fieldStayedAtCast ||
      r.hits.length < 8 ||
      !r.fieldsCleared ||
      !r.shieldRemoved ||
      !r.burnApplied ||
      !r.slowApplied ||
      !r.slowExpired)
  )
    throw Error(JSON.stringify(r));
  if (actor === 'cabbage' && (!r.effectCount || !r.statusesApplied || !r.statusesExpired)) throw Error(JSON.stringify(r));
  console.log(`Verified ${actor} ${procedural ? 'procedural' : 'authored'}: cast, actual field/armor, expiry and cleanup.`);
} finally {
  await closeArtBrowser(browser);
}

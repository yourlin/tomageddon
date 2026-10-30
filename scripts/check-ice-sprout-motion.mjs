/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const actor = process.argv[2],
  procedural = process.argv.includes('--procedural');
if (!['bittermelon', 'sprout'].includes(actor)) throw Error('Unsupported actor');
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
    const enemy = actor === 'bittermelon' ? g.spawnEnemyNow('mold', p.x + 60, p.y) : null;
    if (enemy) {
      enemy.hp = enemy.maxHp = 1e8;
      enemy.speed = 0;
      g.applyDot(enemy, { id: 'freeze', dur: 0.8 });
    }
    await new Promise((resolve) => g.events.once('postupdate', resolve));
    const base = p.scale,
      origin = { x: p.x, y: p.y },
      frames = new Set(),
      hits = [],
      blocks = new Set(),
      start = g.time.now,
      hit = g.weaponHit.bind(g),
      before = new Set(g.children.list);
    const r = (window.__iceSprout = {
      frames,
      hits,
      done: false,
      base,
      maxScale: base,
      maxBlocks: 0,
      authored: p.hasAuthoredAnimation('cast'),
    });
    g.weaponHit = (e, info, x, y) => {
      if (e === enemy && info.weaponId === 'skill') hits.push(g.time.now - start);
      return hit(e, info, x, y);
    };
    g.skill.cd = 0;
    g.skill.use();
    g.skill.cd = 1000;
    const effects = g.children.list.filter(
      (c) =>
        !before.has(c) &&
        (actor === 'sprout' ? c.depth === 11800 || (c.type === 'Arc' && c.depth === 12000) : c.depth === 1.5 || c.depth === 1.6),
    );
    const ice = effects.find((c) => c.type === 'Image');
    r.effectCount = effects.length;
    r.hasteApplied = actor === 'bittermelon' || g.pstatus.has('haste');
    r.xpBoostApplied = actor === 'bittermelon' || g.skill.xpMult > 1;
    const sample = () => {
      const elapsed = g.time.now - start;
      if (p.state === 'cast' && p.img) frames.add(String(p.img.frame.name));
      r.maxScale = Math.max(r.maxScale, p.scale);
      for (const c of g.children.list) if (!before.has(c) && c.type === 'Rectangle' && c.fillColor === 0x90e0ef) blocks.add(c);
      r.maxBlocks = Math.max(r.maxBlocks, [...blocks].filter((c) => !!c.scene).length);
      if (enemy?.status.has('slow')) r.slowApplied = true;
      if (actor === 'bittermelon' && elapsed > 1300 && !r.moved) {
        r.moved = true;
        p.setPosition(origin.x + 400, origin.y);
      }
      if (actor === 'bittermelon' && elapsed > 2400 && !r.fixedFieldChecked) {
        r.fixedFieldChecked = true;
        r.fieldStayedAtCast = !!ice && Math.abs(ice.x - origin.x) < 1 && Math.abs(ice.y - origin.y) < 1;
      }
      if (elapsed > 6600) {
        Object.assign(r, {
          done: true,
          effectsDestroyed: effects.every((c) => !c.scene),
          blocksDestroyed: [...blocks].every((c) => !c.scene),
          effectsCleared: g.skill.effects.length === 0,
          finalScale: p.scale,
          hasteExpired: !g.pstatus.has('haste'),
          xpBoostExpired: g.skill.xpMult === 1,
          slowExpired: !enemy || !enemy.status.has('slow'),
        });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
  }, actor);
  await page.waitForFunction(() => window.__iceSprout.done, { timeout: 16000 });
  const r = await page.evaluate(() => ({ ...window.__iceSprout, frames: [...window.__iceSprout.frames] }));
  writeFileSync(`reports/art-pilot/${actor}-skill-${procedural ? 'procedural' : 'native'}.json`, JSON.stringify(r, null, 2) + '\n');
  if (errors.length || (!procedural && r.frames.length !== 4) || !r.effectsDestroyed || !r.effectsCleared)
    throw Error(JSON.stringify({ r, errors }));
  if (
    actor === 'bittermelon' &&
    (r.hits.length < 8 || !r.slowApplied || !r.slowExpired || !r.maxBlocks || !r.blocksDestroyed || !r.fieldStayedAtCast)
  )
    throw Error(JSON.stringify(r));
  if (
    actor === 'sprout' &&
    (!r.hasteApplied ||
      !r.hasteExpired ||
      !r.xpBoostApplied ||
      !r.xpBoostExpired ||
      r.maxScale < r.base * 1.29 ||
      Math.abs(r.finalScale - r.base) > 0.001 ||
      r.effectCount < 15)
  )
    throw Error(JSON.stringify(r));
  console.log(`Verified ${actor} ${procedural ? 'procedural' : 'authored'}: cast frames, actual skill mechanics and cleanup.`);
} finally {
  await closeArtBrowser(browser);
}

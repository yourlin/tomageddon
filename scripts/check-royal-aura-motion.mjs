/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const actor = process.argv[2],
  procedural = process.argv.includes('--procedural');
if (!['lychee', 'durian'].includes(actor)) throw Error('Unsupported actor');
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
    const start = g.time.now,
      origin = { x: p.x, y: p.y },
      frames = new Set(),
      hits = [];
    const targets =
      actor === 'durian'
        ? [80, 700].map((dx) => {
            const e = g.spawnEnemyNow('mold', p.x + dx, p.y);
            e.hp = e.maxHp = 1e8;
            e.speed = 0;
            return e;
          })
        : [];
    await new Promise((resolve) => g.events.once('postupdate', resolve));
    const result = (window.__royalAura = { frames, hits, done: false, authored: p.hasAuthoredAnimation('cast') });
    const hit = g.weaponHit.bind(g);
    g.weaponHit = (e, ...args) => {
      if (targets.includes(e) && args[0]?.weaponId === 'skill') hits.push(targets.indexOf(e));
      return hit(e, ...args);
    };
    const before = new Set(g.children.list);
    g.skill.cd = 0;
    g.skill.use();
    g.skill.cd = 1000;
    const objects = g.children.list.filter((c) => !before.has(c) && (actor === 'lychee' ? c.depth === 11900 : c.depth === 10800));
    const initial = objects.map((c) => ({ x: c.x, y: c.y }));
    result.objects = objects.length;
    result.statusApplied = actor === 'lychee' ? g.pstatus.has('lucky') && g.pstatus.has('focus') : targets[0].status.has('confuse');
    let moved = false;
    const sample = () => {
      const elapsed = g.time.now - start;
      if (p.state === 'cast' && p.img) frames.add(String(p.img.frame.name));
      if (elapsed > 1200 && !moved) {
        p.setPosition(origin.x + 620, origin.y);
        moved = true;
      }
      if (elapsed > 3400 && !result.followChecked) {
        result.followChecked = true;
        result.followed = objects.every((c, i) => c.x - initial[i].x > 400);
        result.followTargetAffected = actor === 'lychee' || targets[1].status.has('confuse');
      }
      if (elapsed > actorEnd(actor)) {
        Object.assign(result, {
          done: true,
          objectsDestroyed: objects.every((c) => !c.scene),
          effectsCleared: g.skill.effects.length === 0,
          statusExpired: actor === 'lychee' ? !g.pstatus.has('lucky') && !g.pstatus.has('focus') : !targets[0].status.has('confuse'),
        });
        g.events.off('postupdate', sample);
      }
    };
    function actorEnd(id) {
      return id === 'lychee' ? 6800 : 6500;
    }
    g.events.on('postupdate', sample);
  }, actor);
  await page.waitForFunction(() => window.__royalAura.done, { timeout: 15000 });
  const r = await page.evaluate(() => ({ ...window.__royalAura, frames: [...window.__royalAura.frames] }));
  writeFileSync(`reports/art-pilot/${actor}-skill-${procedural ? 'procedural' : 'native'}.json`, JSON.stringify(r, null, 2) + '\n');
  if (
    errors.length ||
    (!procedural && r.frames.length !== 4) ||
    !r.statusApplied ||
    !r.followed ||
    !r.objectsDestroyed ||
    !r.effectsCleared ||
    !r.statusExpired ||
    !r.followTargetAffected ||
    r.objects !== (actor === 'lychee' ? 4 : 14) ||
    (actor === 'durian' && !r.hits.includes(0))
  )
    throw Error(JSON.stringify({ r, errors }));
  console.log(`Verified ${actor} ${procedural ? 'procedural' : 'authored'}: four cast frames, aura follows, statuses and effect cleanup.`);
} finally {
  await closeArtBrowser(browser);
}

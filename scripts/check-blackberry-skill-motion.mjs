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
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=' + (procedural ? '0' : '1'));
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate(() => {
    window.run.start('blackberry', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(async () => {
    const g = window.game.scene.getScene('Game'),
      p = g.player;
    g.iframes = 100;
    g.skill.cd = 1000;
    for (const w of g.weapons.list) w.cd = 1000;
    const first = g.spawnEnemyNow('mold', p.x + 70, p.y),
      second = g.spawnEnemyNow('mold', p.x + 500, p.y);
    for (const e of [first, second]) {
      e.hp = e.maxHp = 1e8;
      e.speed = 0;
    }
    await new Promise((resolve) => g.events.once('postupdate', resolve));
    const origin = { x: p.x, y: p.y },
      start = g.time.now,
      frames = new Set(),
      before = new Set(g.children.list),
      glyphs = new Set();
    const r = (window.__blackberry = { frames, done: false, initialHp: first.hp });
    g.skill.cd = 0;
    g.skill.use();
    g.skill.cd = 1000;
    const circle = g.children.list.find(
      (c) => !before.has(c) && c.type === 'Graphics' && c.depth === 1.6 && c.x === origin.x && c.y === origin.y,
    );
    const effects = g.children.list.filter((c) => !before.has(c) && (c.depth === 10800 || c.depth === 1.6));
    r.clouds = effects.filter((c) => c.type === 'Image').length;
    const statuses = ['curse', 'rot', 'silence'];
    r.initialStatuses = statuses.every((s) => first.status.has(s));
    r.outsideUnaffected = statuses.every((s) => !second.status.has(s));
    const sample = () => {
      const elapsed = g.time.now - start;
      if (p.state === 'cast' && p.img) frames.add(String(p.img.frame.name));
      for (const c of g.children.list) if (!before.has(c) && c.type === 'Text' && c.text === '☠') glyphs.add(c);
      if (elapsed > 1700 && !r.moved) {
        r.moved = true;
        p.setPosition(origin.x + 400, origin.y);
        second.x = origin.x + 100;
        second.y = origin.y;
      }
      if (elapsed > 3300 && !r.enterChecked) {
        r.enterChecked = true;
        r.newEntrantStatuses = statuses.every((s) => second.status.has(s));
        r.circleStayedAtCast = !!circle && Math.abs(circle.x - origin.x) < 1 && Math.abs(circle.y - origin.y) < 1;
      }
      if (elapsed > 13200) {
        Object.assign(r, {
          done: true,
          damage: r.initialHp - first.hp,
          effectsCleared: g.skill.effects.length === 0,
          effectsDestroyed: effects.every((c) => !c.scene),
          glyphCount: glyphs.size,
          glyphsDestroyed: [...glyphs].every((c) => !c.scene),
          statusesExpired: [first, second].every((e) => statuses.every((s) => !e.status.has(s))),
        });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
  });
  await page.waitForFunction(() => window.__blackberry.done, { timeout: 24000 });
  const r = await page.evaluate(() => ({ ...window.__blackberry, frames: [...window.__blackberry.frames] }));
  writeFileSync(`reports/art-pilot/blackberry-skill-${procedural ? 'procedural' : 'native'}.json`, JSON.stringify(r, null, 2) + '\n');
  if (
    errors.length ||
    (!procedural && r.frames.length !== 4) ||
    r.clouds !== 16 ||
    !r.initialStatuses ||
    !r.outsideUnaffected ||
    !r.newEntrantStatuses ||
    !r.circleStayedAtCast ||
    r.damage <= 0 ||
    !r.effectsCleared ||
    !r.effectsDestroyed ||
    r.glyphCount < 2 ||
    !r.glyphsDestroyed ||
    !r.statusesExpired
  )
    throw Error(JSON.stringify({ r, errors }));
  console.log(`Verified blackberry ${procedural ? 'procedural' : 'authored'}: cast, fixed zone, new entrant statuses, damage and cleanup.`);
} finally {
  await closeArtBrowser(browser);
}

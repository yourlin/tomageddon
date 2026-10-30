/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const actor = process.argv[2],
  procedural = process.argv.includes('--procedural');
if (!['jackfruit', 'pomegranate'].includes(actor)) throw Error('Unsupported actor');
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
    const origin = { x: p.x, y: p.y },
      targets = [];
    for (let i = 0; i < (actor === 'jackfruit' ? 1 : 12); i++) {
      const a = (i * Math.PI * 2) / 12,
        r = actor === 'jackfruit' ? 38 : 110,
        e = g.spawnEnemyNow('mold', p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
      e.hp = e.maxHp = 1e8;
      e.speed = 0;
      e.knockResist = 1;
      targets.push(e);
    }
    await new Promise((resolve) => g.events.once('postupdate', resolve));
    const start = g.time.now,
      frames = new Set(),
      before = new Set(g.children.list),
      spawn = g.spawnPlayerBullet.bind(g),
      shots = [],
      bullets = new Set();
    const r = (window.__spikesSpiral = { frames, shots, done: false, initialHp: targets.reduce((n, e) => n + e.hp, 0) });
    g.spawnPlayerBullet = (...args) => {
      const b = spawn(...args);
      shots.push({ at: g.time.now - start, x: args[1], y: args[2], angle: args[3], life: args[5] });
      bullets.add(b);
      return b;
    };
    g.skill.cd = 0;
    g.skill.use();
    g.skill.cd = 1000;
    const effects = g.children.list.filter((c) => !before.has(c) && c.type === 'Graphics' && c.depth === 11800);
    r.effectCount = effects.length;
    r.thornsApplied = actor !== 'jackfruit' || g.pstatus.has('thorns');
    r.fortifyApplied = actor !== 'jackfruit' || g.pstatus.has('fortify');
    const sample = () => {
      const elapsed = g.time.now - start;
      if (p.state === 'cast' && p.img) frames.add(String(p.img.frame.name));
      if (actor === 'jackfruit' && elapsed > 1700 && !r.moved) {
        r.moved = true;
        p.setPosition(origin.x + 280, origin.y);
        targets[0].x = p.x + 38;
        targets[0].y = p.y;
        r.hpAtMove = targets[0].hp;
      }
      if (actor === 'jackfruit' && elapsed > 4300 && !r.followChecked) {
        r.followChecked = true;
        r.damageAfterMove = r.hpAtMove - targets[0].hp;
      }
      if (elapsed > (actor === 'jackfruit' ? 7600 : 3100)) {
        Object.assign(r, {
          done: true,
          damage: r.initialHp - targets.reduce((n, e) => n + e.hp, 0),
          effectsCleared: g.skill.effects.length === 0,
          effectsDestroyed: effects.every((c) => !c.scene),
          bulletsExpired: [...bullets].every((b) => !b.alive),
          thornsExpired: !g.pstatus.has('thorns'),
          fortifyExpired: !g.pstatus.has('fortify'),
        });
        g.events.off('postupdate', sample);
      }
    };
    g.events.on('postupdate', sample);
  }, actor);
  await page.waitForFunction(() => window.__spikesSpiral.done, { timeout: 18000 });
  const r = await page.evaluate(() => ({ ...window.__spikesSpiral, frames: [...window.__spikesSpiral.frames] }));
  writeFileSync(`reports/art-pilot/${actor}-skill-${procedural ? 'procedural' : 'native'}.json`, JSON.stringify(r, null, 2) + '\n');
  if (errors.length || (!procedural && r.frames.length !== 4) || r.damage <= 0 || !r.effectsCleared || !r.effectsDestroyed)
    throw Error(JSON.stringify({ r, errors }));
  if (
    actor === 'jackfruit' &&
    (!r.effectCount ||
      !r.thornsApplied ||
      !r.fortifyApplied ||
      !r.thornsExpired ||
      !r.fortifyExpired ||
      !r.followChecked ||
      r.damageAfterMove <= 0)
  )
    throw Error(JSON.stringify(r));
  if (actor === 'pomegranate' && (r.shots.length !== 30 || !r.bulletsExpired || r.shots.at(-1).at < 800 || r.shots.at(-1).at > 1300))
    throw Error(JSON.stringify(r));
  console.log(`Verified ${actor} ${procedural ? 'procedural' : 'authored'}: cast, actual skill damage, follow/spiral and expiry cleanup.`);
} finally {
  await closeArtBrowser(browser);
}

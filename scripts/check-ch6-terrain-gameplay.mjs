/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const report = {
  scope:
    'Live chapter6 with shortened timers, placed invulnerable target: spore warning/poison and compost staggered spawns (checks separate ticks, not exact250ms intervals). Wave1 actual image requests exclude spore. Not full normal-timing chapter.',
  errors: [],
};
try {
  const p = await browser.newPage();
  await freezeArtHmr(p);
  const requests = [];
  p.on('request', (r) => {
    if (['image', 'fetch', 'xhr'].includes(r.resourceType())) requests.push(r.url());
  });
  p.on('pageerror', (e) => report.errors.push(e.message));
  await p.goto('http://127.0.0.1:4183/?art=1');
  await p.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  const start = async (wave) => {
    await p.evaluate((w) => {
      window.run.start('tomato', 6, false, 0);
      window.run.wave = w;
      window.game.scene.getScene('Menu').scene.start('Game');
    }, wave);
    await p.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').terrain, { timeout: 60000 });
  };
  await start(1);
  if (requests.some((u) => /\/maps\/ch6\/objects\/.*spore.*webp/.test(u))) throw Error('Future spore downloaded wave1');
  report.wave1SporeNotDownloaded = true;
  await p.evaluate(() => {
    window.game.scene.stop('Hud');
    window.game.scene.getScene('Game').scene.start('Menu');
  });
  await p.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Game'));
  await start(3);
  await p.evaluate(() => {
    const g = window.game.scene.getScene('Game'),
      t = g.terrain;
    g.iframes = 100;
    g.skill.cd = 999;
    for (const w of g.weapons.list) w.cd = 999;
    const probe = (window.__ch6Probe = { spawns: [], warnings: [] });
    const spawn = g.spawnEnemyNow.bind(g),
      add = g.addHazard.bind(g),
      warn = g.fx.telegraphCircle.bind(g.fx);
    g.spawnEnemyNow = (id, x, y, ...rest) => {
      if (id === 'blight_sprout' && t.holes.some((h) => Math.hypot(h.x - x, h.y - y) < 0.1)) probe.spawns.push({ x, y, at: g.time.now });
      return spawn(id, x, y, ...rest);
    };
    g.fx.telegraphCircle = (x, y, r, d, c, cb) => {
      if (c === 0x70e000) probe.warnings.push({ at: g.time.now, duration: d, radius: r });
      return warn(x, y, r, d, c, cb);
    };
    g.addHazard = (x, y, r, l, d, debuff, c, obj) => {
      add(x, y, r, l, d, debuff, c, obj);
      if (obj === 'spore' && !probe.hazard) {
        const h = g.hazards.at(-1);
        window.__ch6Hazard = h;
        g.player.setPosition(x, y);
        probe.hazard = { at: g.time.now, key: h.img.texture.key, width: h.img.displayWidth };
      }
    };
    t.timers = { spore: 0, compost: 0, lamp_move: 1e6 };
  });
  await p.waitForFunction(
    () =>
      window.__ch6Probe.spawns.length >= 3 &&
      window.__ch6Probe.hazard &&
      window.game.scene.getScene('Game').pstatus.has('poison') &&
      window.game.scene.getScene('Game').time.now - window.__ch6Probe.hazard.at > 350,
    { timeout: 12000 },
  );
  report.result = await p.evaluate(() => {
    const g = window.game.scene.getScene('Game'),
      r = window.__ch6Probe;
    if (r.spawns.some((s) => !g.terrain.holes.some((h) => Math.hypot(h.x - s.x, h.y - s.y) < 0.1)))
      throw Error('Spawn detached from compost');
    return { ...r, hazard: { ...r.hazard, width: window.__ch6Hazard.img.displayWidth }, poison: true };
  });
  const r = report.result;
  if (
    r.spawns[1].at <= r.spawns[0].at ||
    r.spawns[2].at <= r.spawns[1].at ||
    r.hazard.at - r.warnings[0].at < 1050 ||
    Math.abs(r.hazard.width - 130) > 1 ||
    !r.hazard.key.includes(':object:spore') ||
    report.errors.length
  )
    throw Error('Spore/compost regression');
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  throw e;
} finally {
  writeFileSync('reports/art-pilot/ch6-terrain-gameplay-native.json', JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const actor = process.argv[2],
  expire = process.argv.includes('--expire'),
  procedural = process.argv.includes('--procedural');
if (!['kiwi', 'sweetpotato'].includes(actor)) throw Error('Unsupported actor');
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
  await page.evaluate(
    async ({ actor, expire }) => {
      const g = window.game.scene.getScene('Game'),
        p = g.player;
      g.iframes = 100;
      g.skill.cd = 1000;
      for (const w of g.weapons.list) w.cd = 1000;
      await new Promise((resolve) => g.events.once('postupdate', resolve));
      window.run.hp = 1;
      const frames = new Set(),
        hits = [],
        heals = [],
        drops = [],
        effects = new Set(),
        start = g.time.now;
      const result = (window.__feastDetective = { frames, hits, heals, done: false, authored: p.hasAuthoredAnimation('cast') });
      const hit = g.weaponHit.bind(g),
        heal = g.heal.bind(g),
        tween = g.tweens.add.bind(g.tweens);
      const view = g.cameras.main.worldView;
      const targets = (actor === 'kiwi' ? [view.centerX - 150, view.centerX + 150, view.right + 400] : [p.x + 70]).map((x) => {
        const e = g.spawnEnemyNow('mold', x, p.y);
        e.hp = e.maxHp = 1e8;
        e.speed = 0;
        return e;
      });
      g.weaponHit = (e, ...args) => {
        if (targets.includes(e)) hits.push({ target: targets.indexOf(e), time: g.time.now - start, status: args[0]?.status });
        return hit(e, ...args);
      };
      g.heal = (...args) => {
        const before = window.run.hp;
        const value = heal(...args);
        if (args[2] === 'skill') heals.push({ amount: args[0], actual: window.run.hp - before });
        return value;
      };
      g.tweens.add = (config) => {
        if (actor === 'sweetpotato' && config.duration === 400 && config.ease === 'Back.easeOut' && config.targets?.type === 'Graphics')
          drops.push({ x: config.x, y: config.y, graphic: config.targets });
        return tween(config);
      };
      const before = new Set(g.children.list);
      const sample = () => {
        const elapsed = g.time.now - start;
        if (p.state === 'cast' && p.img) frames.add(String(p.img.frame.name));
        for (const c of g.children.list) if (!before.has(c) && [12000, 12100, 12200].includes(c.depth)) effects.add(c);
        if (actor === 'sweetpotato' && !expire) {
          const i = Math.floor((elapsed - 600) / 300);
          if (i >= 0 && i < drops.length) p.setPosition(drops[i].x, drops[i].y);
        }
        if (actor === 'kiwi' && elapsed > 1100 && !result.marked)
          result.marked = targets.slice(0, 2).every((e) => e.status.has('mark') && e.status.has('vulnerable'));
        if (elapsed > 8700) {
          Object.assign(result, {
            done: true,
            drops: drops.length,
            dropsDestroyed: drops.every((d) => !d.graphic.scene),
            effectsDestroyed: [...effects].every((e) => !e.scene),
            effectsCount: effects.size,
            lingersCleared: g.skill.effects.length === 0,
            statusExpired:
              actor === 'kiwi' ? targets.every((e) => !e.status.has('mark') && !e.status.has('vulnerable')) : !g.pstatus.has('regen'),
          });
          g.events.off('postupdate', sample);
        }
      };
      await new Promise((resolve) => g.events.once('postupdate', resolve));
      g.events.on('postupdate', sample);
      g.skill.cd = 0;
      g.skill.use();
      g.skill.cd = 1000;
      result.regenApplied = g.pstatus.has('regen');
    },
    { actor, expire },
  );
  await page.waitForFunction(() => window.__feastDetective.done, { timeout: 18000 });
  const r = await page.evaluate(() => ({ ...window.__feastDetective, frames: [...window.__feastDetective.frames] }));
  writeFileSync(
    `reports/art-pilot/${actor}-skill-${procedural ? 'procedural' : 'native'}${expire ? '-expiry' : ''}.json`,
    JSON.stringify(r, null, 2) + '\n',
  );
  if (errors.length || (!procedural && r.frames.length !== 4) || !r.statusExpired || !r.lingersCleared)
    throw Error(JSON.stringify({ r, errors }));
  if (
    actor === 'kiwi' &&
    (!r.marked ||
      new Set(r.hits.map((h) => h.target)).size !== 2 ||
      r.hits.some((h) => h.target === 2) ||
      !r.effectsDestroyed ||
      r.effectsCount < 4)
  )
    throw Error(JSON.stringify(r));
  if (
    actor === 'sweetpotato' &&
    (r.drops !== 3 ||
      !r.dropsDestroyed ||
      !r.regenApplied ||
      !r.hits.length ||
      (expire ? r.heals.length !== 0 : r.heals.length !== 3) ||
      r.heals.some((h) => h.actual <= 0))
  )
    throw Error(JSON.stringify(r));
  console.log(
    `Verified ${actor} ${procedural ? 'procedural' : 'authored'} ${expire ? 'uncollected expiry' : 'skill'}: playback, mechanics and cleanup.`,
  );
} finally {
  await closeArtBrowser(browser);
}

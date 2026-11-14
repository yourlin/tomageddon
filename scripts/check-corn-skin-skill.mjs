/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_corn(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass corn skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual popcorn cast:18 kernels,ballistic displacement,18 delayed52radius explosions,damage,90 popcorn puffs andcleanup;deterministic cast landingfixture;three tiers/both directions;final visual separate.',
};
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  for (const tier of ['low', 'standard', 'high'])
    for (const direction of [1, -1]) {
      const page = await browser.newPage();
      await freezeArtHmr(page);
      page.on('pageerror', (e) => report.errors.push(e.stack || e.message));
      await page.evaluateOnNewDocument(
        ({ skinId, tier }) =>
          localStorage.setItem(
            'tomato_sister_save_v1',
            JSON.stringify({
              saveVersion: 2,
              settings: { autoSkill: false, graphicsQuality: tier },
              meta: { skins: [skinId], skinOf: { corn: skinId } },
            }),
          ),
        { skinId, tier },
      );
      await page.goto('http://127.0.0.1:4183/?art=1&skins=1', { timeout: 90000 });
      await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
      await page.evaluate(() => {
        window.run.start('corn', 1, false, 0);
        window.game.scene.getScene('Menu').scene.start('Game');
      });
      await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game')?.player?.active, {
        timeout: 60000,
      });
      await page.evaluate(
        async ({ skinId, direction }) => {
          const g = window.game.scene.getScene('Game'),
            p = g.player;
          if (p.art?.choice.entry.skinId !== skinId || !p.hasAuthoredAnimation('cast')) throw Error('Skin fallback or missing cast');
          g.timeLeft = 999;
          g.iframes = 0;
          g.damagePlayer = () => {};
          g.weapons.update = () => {};
          g.stats.speed = 0;
          const { controls } = await import('/src/systems/Controls.ts');
          controls.joyX = 0;
          controls.joyY = 0;
          g.moveX = 0;
          g.moveY = 0;
          g.facing = direction;
          p.tick(0, 0, direction);
          const x = p.x,
            y = p.y,
            R = g.skill.radius(240);
          // Fix only the cast's randomized landing choices so target placement is reproducible.
          const targets = Array.from({ length: 18 }, (_, i) => {
            const a = (i / 18) * Math.PI * 2;
            const e = g.spawnEnemyNow('mold', x + Math.cos(a) * R * 0.775, y + Math.sin(a) * R * 0.775 * 0.8);
            e.speed = 0;
            e.hp = e.maxHp = 1e8;
            return e;
          });
          const positions = targets.map((e) => ({ x: e.x, y: e.y }));
          await new Promise((resolve) => g.time.delayedCall(600, resolve));
          const start = g.time.now,
            before = new Set(g.children.list),
            originalQuery = g.grid.query;
          const q = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            wrongFlip: false,
            explosions: [],
            maxFlightDisplacement: 0,
            done: false,
          };
          g.grid.query = function (cx, cy, r, ...rest) {
            if (r === 52) q.explosions.push({ x: cx, y: cy, at: g.time.now - start });
            return originalQuery.call(this, cx, cy, r, ...rest);
          };
          let kernels = [];
          const puffs = new Set();
          const sample = () => {
            const t = g.time.now - start;
            if (p.state === 'cast') {
              q.frames.add(Number(p.img.frame.name));
              q.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            p.x = x;
            p.y = y;
            targets.forEach((e, i) => {
              e.x = positions[i].x;
              e.y = positions[i].y;
              e.kvx = e.kvy = 0;
            });
            for (const k of kernels) if (k.scene) q.maxFlightDisplacement = Math.max(q.maxFlightDisplacement, Math.hypot(k.x - x, k.y - y));
            for (const v of g.children.list) if (!before.has(v) && v.depth === 11900) puffs.add(v);
            if (t > 2000) {
              Object.assign(q, {
                done: true,
                kernelCount: kernels.length,
                kernelsDestroyed: kernels.every((k) => !k.scene),
                puffCount: puffs.size,
                puffsDestroyed: [...puffs].every((v) => !v.scene),
                damagedTargets: targets.filter((e) => e.hp < 1e8).length,
              });
              g.grid.query = originalQuery;
              g.events.off('postupdate', sample);
            }
          };
          window.__cornSkinProbe = q;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          const random = Math.random;
          try {
            Math.random = () => 0.5;
            g.skill.use();
          } finally {
            Math.random = random;
          }
          kernels = g.children.list.filter((v) => !before.has(v) && v.type === 'Ellipse' && v.depth === 11800);
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__cornSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => {
        const q = window.__cornSkinProbe;
        return { ...q, frames: [...q.frames] };
      });
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        result.kernelCount !== 18 ||
        !result.kernelsDestroyed ||
        result.explosions.length !== 18 ||
        result.explosions.some((e) => e.at < 350 || e.at > 800) ||
        result.maxFlightDisplacement < 100 ||
        result.puffCount !== 90 ||
        !result.puffsDestroyed ||
        result.damagedTargets < 1
      )
        throw Error(JSON.stringify({ tier, direction, ...result }));
      report.cases.push({ tier, direction, ...result });
      await page.close();
    }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(e.stack || String(e));
  process.exitCode = 1;
} finally {
  writeFileSync(`reports/art-pilot/${skinId}-skill-motion-native.json`, JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

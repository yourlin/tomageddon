/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_pineapple(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass pineapple skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Equipped cannonVolley cast4frames/3ballisticcannonballs/220mslaunchspacing/3positiveexplosions guaranteedDrop/projectilecleanup;3tiers/bothdirections;finalvisual separate.',
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
              meta: { skins: [skinId], skinOf: { pineapple: skinId } },
            }),
          ),
        { skinId, tier },
      );
      await page.goto('http://127.0.0.1:4183/?art=1&skins=1', { timeout: 90000 });
      await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
      await page.evaluate(() => {
        window.run.start('pineapple', 1, false, 0);
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
          await new Promise((resolve) => g.time.delayedCall(600, resolve));
          const start = g.time.now,
            before = new Set(g.children.list),
            originalExplode = g.explode,
            shots = new Set();
          const q = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            wrongFlip: false,
            launches: [],
            explosions: [],
            done: false,
          };
          g.explode = function (...args) {
            if (args[5] === 0xffd166)
              q.explosions.push({ at: g.time.now - start, radius: args[2], damage: args[3], guaranteedDrop: args[6] });
            return originalExplode.apply(this, args);
          };
          const sample = () => {
            if (p.state === 'cast') {
              q.frames.add(Number(p.img.frame.name));
              q.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            for (const c of g.children.list)
              if (!before.has(c) && c.texture?.key === 'proj_coin' && !shots.has(c)) {
                shots.add(c);
                q.launches.push(g.time.now - start);
              }
            if (g.time.now - start > 1700) {
              Object.assign(q, { done: true, shots: shots.size, shotsDestroyed: [...shots].every((c) => !c.scene) });
              g.explode = originalExplode;
              g.events.off('postupdate', sample);
            }
          };
          window.__pineappleSkinProbe = q;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__pineappleSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => {
        const q = window.__pineappleSkinProbe;
        return { ...q, frames: [...q.frames] };
      });
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        result.shots !== 3 ||
        !result.shotsDestroyed ||
        result.explosions.length !== 3 ||
        result.explosions.some((e) => !e.guaranteedDrop || e.radius <= 0 || e.damage <= 0) ||
        result.launches.some((t, i) => i > 0 && (t - result.launches[i - 1] < 150 || t - result.launches[i - 1] > 350))
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

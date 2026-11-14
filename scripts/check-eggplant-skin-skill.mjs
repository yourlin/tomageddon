/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_eggplant(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass eggplant skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped eggplant screen lightning:cast4frames,two viewporttargets damaged/stunned,outsideviewport target untouched,bolt endpoints andstunexpiry;three tiers/bothdirections;finalvisual separate.',
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
              meta: { skins: [skinId], skinOf: { eggplant: skinId } },
            }),
          ),
        { skinId, tier },
      );
      await page.goto('http://127.0.0.1:4183/?art=1&skins=1', { timeout: 90000 });
      await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
      await page.evaluate(() => {
        window.run.start('eggplant', 1, false, 0);
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
          const v = g.cameras.main.worldView,
            positions = [
              { x: p.x + 60, y: p.y },
              { x: p.x - 60, y: p.y },
              { x: v.right + 1000, y: p.y },
            ];
          const targets = positions.map((o) => {
            const e = g.spawnEnemyNow('mold', o.x, o.y);
            e.hp = e.maxHp = 1e8;
            e.speed = 0;
            return e;
          });
          const start = g.time.now,
            originalBolt = g.fx.bolt;
          const q = { frames: new Set(), requiredFrames: p.art.choice.entry.anims.cast.frames, wrongFlip: false, bolts: [], done: false };
          g.fx.bolt = function (points, ...rest) {
            q.bolts.push(points.map((o) => ({ ...o })));
            return originalBolt.call(this, points, ...rest);
          };
          const sample = () => {
            if (p.state === 'cast') {
              q.frames.add(Number(p.img.frame.name));
              q.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            if (g.time.now - start > 1400) {
              Object.assign(q, { done: true, stunsExpired: targets.slice(0, 2).every((e) => !e.status.has('stun')) });
              g.fx.bolt = originalBolt;
              g.events.off('postupdate', sample);
            }
          };
          window.__eggplantSkinProbe = q;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          q.insideViewport = targets.slice(0, 2).every((e) => v.contains(e.x, e.y));
          q.outsideViewport = !v.contains(targets[2].x, targets[2].y);
          q.insideDamaged = targets.slice(0, 2).every((e) => e.hp < 1e8);
          q.insideStunned = targets.slice(0, 2).every((e) => e.status.has('stun'));
          q.outsideUnaffected = targets[2].hp === 1e8 && !targets[2].status.has('stun');
          q.targetBolts = positions
            .slice(0, 2)
            .every((o) => q.bolts.some((points) => points.some((v) => Math.hypot(v.x - o.x, v.y - o.y) < 1)));
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__eggplantSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => {
        const q = window.__eggplantSkinProbe;
        return { ...q, frames: [...q.frames] };
      });
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        !result.insideViewport ||
        !result.outsideViewport ||
        !result.insideDamaged ||
        !result.insideStunned ||
        !result.outsideUnaffected ||
        !result.targetBolts ||
        !result.stunsExpired
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

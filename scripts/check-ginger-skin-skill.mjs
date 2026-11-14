/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_ginger(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass ginger skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Equipped gingerBlink cast4frames/right-leftteleport/invulnerability/350msdelayedpathslashsinglehit/fiveafterimages/inkcleanup;3tiers/bothdirections;finalvisual separate.',
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
              meta: { skins: [skinId], skinOf: { ginger: skinId } },
            }),
          ),
        { skinId, tier },
      );
      await page.goto('http://127.0.0.1:4183/?art=1&skins=1', { timeout: 90000 });
      await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
      await page.evaluate(() => {
        window.run.start('ginger', 1, false, 0);
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
          const sx = p.x,
            sy = p.y,
            target = g.spawnEnemyNow('mold', sx + direction * 150, sy);
          target.speed = 0;
          target.hp = target.maxHp = 1e8;
          await new Promise((resolve) => g.time.delayedCall(600, resolve));
          const start = g.time.now,
            before = new Set(g.children.list),
            originalHit = g.weaponHit,
            originalDelay = g.time.delayedCall;
          const q = { frames: new Set(), requiredFrames: p.art.choice.entry.anims.cast.frames, wrongFlip: false, hits: [], done: false };
          g.weaponHit = function (e, ...args) {
            if (e === target) q.hits.push(g.time.now - start);
            return originalHit.call(this, e, ...args);
          };
          g.time.delayedCall = function (delay, callback, ...rest) {
            if (delay !== 350) return originalDelay.call(this, delay, callback, ...rest);
            const timer = originalDelay.call(
              this,
              delay,
              (...args) => {
                q.slashTimer = { delay: timer.delay, elapsed: timer.elapsed };
                return callback(...args);
              },
              ...rest,
            );
            return timer;
          };
          let created = [];
          const sample = () => {
            if (p.state === 'cast') {
              q.frames.add(Number(p.img.frame.name));
              q.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            if (g.time.now - start > 1600) {
              Object.assign(q, {
                done: true,
                damaged: target.hp < 1e8,
                ghostCount: created.filter((v) => v.depth === 11500).length,
                inkCount: created.filter((v) => v.depth === 10500).length,
                visualsDestroyed: created.filter((v) => v.depth === 11500 || v.depth === 10500).every((v) => !v.scene),
              });
              g.weaponHit = originalHit;
              g.time.delayedCall = originalDelay;
              g.events.off('postupdate', sample);
            }
          };
          window.__gingerSkinProbe = q;
          g.events.on('postupdate', sample);
          g.moveX = direction;
          g.moveY = 0;
          g.skill.cd = 0;
          g.skill.use();
          g.moveX = 0;
          q.dx = p.x - sx;
          q.dy = p.y - sy;
          q.invulnerable = g.skill.invulnT;
          created = g.children.list.filter((v) => !before.has(v));
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__gingerSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => {
        const q = window.__gingerSkinProbe;
        return { ...q, frames: [...q.frames] };
      });
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        result.dx * direction < 300 ||
        Math.abs(result.dy) > 1 ||
        result.invulnerable < 0.59 ||
        !result.damaged ||
        result.hits.length !== 1 ||
        result.slashTimer?.delay !== 350 ||
        result.slashTimer.elapsed < 350 ||
        result.ghostCount !== 5 ||
        result.inkCount !== 1 ||
        !result.visualsDestroyed
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

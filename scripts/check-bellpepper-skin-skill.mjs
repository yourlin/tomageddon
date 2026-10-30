/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const skinId = process.argv[2];
if (!/^skin_bellpepper(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass bellpepper skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped bellpepper droneSupport: four cast frames, both directions/three tiers, repeated drone beams/hits and timed cleanup. Final anatomy/mobile acceptance separate.',
};
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  for (const tier of ['low', 'standard', 'high']) {
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
            meta: { skins: [skinId], skinOf: { bellpepper: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('bellpepper', 1, false, 0);
      window.game.scene.getScene('Menu').scene.start('Game');
    });
    await page.waitForFunction(
      () =>
        window.game.scene.isActive('Game') &&
        window.game.scene.getScene('Game')?.keys?.RIGHT &&
        window.game.scene.getScene('Game')?.player?.state === 'idle',
      { timeout: 60000 },
    );
    for (const direction of [1, -1]) {
      await page.evaluate(
        async ({ skinId, direction }) => {
          const g = window.game.scene.getScene('Game'),
            p = g.player;
          const { controls } = await import('/src/systems/Controls.ts');
          if (p.art?.choice.entry.skinId !== skinId || !p.hasAuthoredAnimation('cast')) throw Error('Wrong skin/missing cast');
          g.iframes = 100000;
          g.weapons.update = () => {};
          g.stats.speed = 0;
          controls.joyX = direction;
          controls.joyY = 0;
          g.moveX = direction;
          g.moveY = 0;
          p.tick(0, 0, direction);
          const targets = [g.spawnEnemyNow('mold', p.x + 100, p.y), g.spawnEnemyNow('mold', p.x + 120, p.y + 20)];
          for (const target of targets) {
            target.speed = 0;
            target.hp = target.maxHp = 1e8;
            g.grid.insert(target);
          }
          const original = g.fx.beam,
            start = g.time.now;
          const durationMs = g.skill.dur(8) * 1000,
            beforeEffects = g.skill.effects.length;
          const originalGraphics = g.add.graphics,
            created = [];
          g.add.graphics = function (...args) {
            const obj = originalGraphics.apply(this, args);
            created.push(obj);
            return obj;
          };
          const probe = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            shots: [],
            wrongFlip: false,
            expectedShots: Math.ceil(durationMs / 350),
            durationMs,
            turretDestroyed: false,
            effectCleared: false,
            done: false,
          };
          const originalHit = g.weaponHit;
          probe.hits = 0;
          let pendingDroneHit = false;
          g.weaponHit = function (target, ...rest) {
            if (pendingDroneHit) {
              probe.hits++;
              pendingDroneHit = false;
            }
            return originalHit.call(this, target, ...rest);
          };
          g.fx.beam = function (x, y, ...rest) {
            if (rest[3] === 0x80ffdb) {
              pendingDroneHit = true;
              probe.shots.push({ offsetX: x - p.x, offsetY: y - p.y, at: g.time.now - start });
            }
            return original.call(this, x, y, ...rest);
          };
          const sample = () => {
            targets.forEach((target, i) => {
              target.x = p.x + 100 + i * 20;
              target.y = p.y + i * 20;
              target.speed = 0;
            });
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            if (g.time.now - start > durationMs + 500) {
              probe.turretDestroyed = !!created[0] && !created[0].scene;
              probe.effectCleared = g.skill.effects.length <= beforeEffects;
              probe.done = true;
              controls.joyX = 0;
              g.fx.beam = original;
              g.weaponHit = originalHit;
              for (const target of targets) target.alive = false;
              g.events.off('postupdate', sample);
            }
          };
          window.__bellpepperSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          g.add.graphics = originalGraphics;
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__bellpepperSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => ({ ...window.__bellpepperSkinProbe, frames: [...window.__bellpepperSkinProbe.frames] }));
      if (
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        result.shots.length < result.expectedShots - 3 ||
        result.hits < result.shots.length ||
        new Set(result.shots.map((s) => Math.round(s.offsetX))).size < 8 ||
        !result.turretDestroyed ||
        !result.effectCleared ||
        result.shots.some((s) => s.at > result.durationMs + 100)
      )
        throw Error(JSON.stringify({ tier, direction, ...result }));
      report.cases.push({ tier, direction, ...result });
    }
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

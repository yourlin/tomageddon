/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_pomegranate(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass pomegranate skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped Pomegranate seed spiral: four cast frames, thirty seeded projectiles in fifteen opposite-angle pairs over one second, authored skin both directions and projectile release, both directions/three tiers. final visual acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { pomegranate: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('pomegranate', 1, false, 0);
      window.game.scene.getScene('Menu').scene.start('Game');
    });
    await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game')?.player?.active, {
      timeout: 60000,
    });
    for (const direction of [1, -1]) {
      await page.evaluate(
        async ({ skinId, direction }) => {
          const g = window.game.scene.getScene('Game'),
            p = g.player;
          const { controls } = await import('/src/systems/Controls.ts');
          if (p.art?.choice.entry.skinId !== skinId || !p.hasAuthoredAnimation('cast')) throw Error('Wrong skin or missing cast');
          g.timeLeft = 999;
          g.iframes = 100000;
          g.weapons.update = () => {};
          g.stats.speed = 0;
          controls.joyX = direction;
          controls.joyY = 0;
          g.moveX = direction;
          g.moveY = 0;
          p.tick(0, 0, direction);
          const target = g.spawnEnemyNow('mold', p.x + 30, p.y);
          target.speed = 0;
          target.hp = target.maxHp = 1e8;
          // Normal combat enemies are indexed before skill input; this fixture was just spawned.
          g.grid.insert(target);
          const originX = p.x,
            originY = p.y;
          controls.joyX = 0;
          g.moveX = 0;
          g.facing = direction;
          // Let the newly loaded scene finish its startup timer catch-up before timing a cast.
          await new Promise((resolve) => g.time.delayedCall(600, resolve));
          const start = g.time.now,
            wallStart = performance.now(),
            originalSpawn = g.spawnPlayerBullet,
            originalDelayed = g.time.delayedCall;
          let requestedDelay = null;
          g.time.delayedCall = function (delay, callback, args, scope) {
            return originalDelayed.call(this, delay, function (...values) {
              requestedDelay = delay;
              try { return callback.apply(this, values); }
              finally { requestedDelay = null; }
            }, args, scope);
          };
          const shots = [],
            spawned = [];
          const probe = { frames: new Set(), requiredFrames: p.art.choice.entry.anims.cast.frames, wrongFlip: false, done: false };
          g.spawnPlayerBullet = function (...args) {
            const bullet = originalSpawn.apply(this, args);
            if (args[0] === 'proj_player' && args[4] === 560 && args[6] === 10) {
              const shot = { at: g.time.now - start, wallAt: performance.now() - wallStart, requestedDelay, angle: args[3], speed: args[4], life: args[5] };
              shots.push(shot);
              spawned.push(bullet);
              // Capture skill assignment before same-frame collision consumes piercing.
              const tint = bullet.setTint;
              bullet.setTint = function (...colors) {
                const value = tint.apply(this, colors);
                Object.assign(shot, { dmg: this.dmg, pierce: this.pierce, tint: this.tintTopLeft });
                this.setTint = tint;
                return value;
              };
            }
            return bullet;
          };
          const sample = () => {
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            p.x = originX;
            p.y = originY;
            target.x = originX + 30;
            target.y = originY;
            target.kvx = target.kvy = 0;
            if (g.time.now - start > 2600) {
              Object.assign(probe, {
                done: true,
                shots,
                projectilesReleased: spawned.every((b) => !b.alive || !b.active),
                expectedDamage: g.skill.damage(g.stats),
              });
              controls.joyX = 0;
              g.spawnPlayerBullet = originalSpawn; g.time.delayedCall = originalDelayed;
              target.alive = false;
              g.events.off('postupdate', sample);
            }
          };
          window.__pomegranateSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__pomegranateSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => ({ ...window.__pomegranateSkinProbe, frames: [...window.__pomegranateSkinProbe.frames] }));
      const pairAnglesValid =
        result.shots.length === 30 &&
        result.shots.every((s, i) => Math.abs(s.angle - (Math.floor(i / 2) * 0.84 + (i % 2 ? Math.PI : 0))) < 0.001);
      const shotsValid = result.shots.every(
        (s) => s.pierce === 1 && s.dmg === result.expectedDamage && [0xc1121f, 0xff4d6d, 0xffccd5].includes(s.tint),
      );
      const duration = result.shots.at(-1)?.wallAt - result.shots[0]?.wallAt;
      const delaysValid = result.shots.every((s, i) => s.requestedDelay === Math.floor(i / 2) * 66);
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        !pairAnglesValid ||
        !shotsValid ||
        !delaysValid ||
        duration < 800 ||
        duration > 10000 ||
        !result.projectilesReleased
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

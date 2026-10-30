/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const skinId = process.argv[2];
if (!/^skin_sweetpotato(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass sweetpotato skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual yamFeast: authored cast, three pickups or expiry, regeneration, both directions/three tiers; final visual acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { sweetpotato: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('sweetpotato', 1, false, 0);
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
          // Use open ground: arena obstacles can clamp a dropped yam straight onto
          // the player, which would accidentally turn the expiry case into pickup.
          let origin;
          for (let attempt = 0; attempt < 100 && !origin; attempt++) {
            const point = g.arena.randomPoint(200);
            const clear = Array.from({ length: 64 }, (_, i) => {
              const angle = (i * Math.PI) / 32;
              const drop = g.arena.clamp(point.x + Math.cos(angle) * 130, point.y + Math.sin(angle) * 100, 40);
              return Math.hypot(drop.x - point.x, drop.y - point.y) > 75;
            }).every(Boolean);
            if (clear) origin = point;
          }
          if (!origin) throw Error('No clear yamFeast fixture location');
          p.setPosition(origin.x, origin.y);
          const start = g.time.now,
            beforeEffects = g.skill.effects.length;
          const originalTween = g.tweens.add,
            originalHeal = g.heal,
            yams = [];
          const probe = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            wrongFlip: false,
            heals: 0,
            sawRegen: false,
            done: false,
            pickupMode: direction > 0,
          };
          g.tweens.add = function (cfg) {
            if (cfg.duration === 400 && cfg.ease === 'Back.easeOut') yams.push({ obj: cfg.targets, x: cfg.x, y: cfg.y });
            return originalTween.call(this, cfg);
          };
          g.heal = function (...args) {
            if (args[2] === 'skill') probe.heals++;
            return originalHeal.apply(this, args);
          };
          let pickupIndex = 0,
            nextPickup = 600;
          const sample = () => {
            const elapsed = g.time.now - start;
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            probe.sawRegen ||= (g.pstatus.get('regen')?.stacks ?? 0) >= 5;
            if (probe.pickupMode && pickupIndex < yams.length && elapsed > nextPickup) {
              const yam = yams[pickupIndex++];
              p.setPosition(yam.x, yam.y);
              nextPickup += 180;
            }
            if (!probe.pickupMode) p.setPosition(origin.x, origin.y);
            if (elapsed > (probe.pickupMode ? 1500 : 8500)) {
              probe.yams = yams.length;
              probe.allDestroyed = yams.every((y) => !y.obj.scene);
              probe.effectCleared = g.skill.effects.length <= beforeEffects;
              probe.done = true;
              p.setPosition(origin.x, origin.y);
              controls.joyX = 0;
              g.heal = originalHeal;
              g.events.off('postupdate', sample);
            }
          };
          window.__yamSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          g.tweens.add = originalTween;
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__yamSkinProbe.done, { timeout: 16000 });
      const result = await page.evaluate(() => ({ ...window.__yamSkinProbe, frames: [...window.__yamSkinProbe.frames] }));
      if (
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        result.yams !== 3 ||
        !result.allDestroyed ||
        !result.sawRegen ||
        result.heals !== (direction > 0 ? 3 : 0) ||
        (direction < 0 && !result.effectCleared)
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

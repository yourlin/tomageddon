/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const skinId = process.argv[2];
if (!/^skin_sprout(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass sprout skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual sproutGrow: authored cast4, haste2/xpBoost30 activation and expiry, scale1.3 growth and return,14 incoming circles cleanup, aura/effect cleanup;3tiers2directions;finalvisual separate.',
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
            meta: { skins: [skinId], skinOf: { sprout: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('sprout', 1, false, 0);
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
          controls.joyX = 0;
          g.moveX = 0;
          g.facing = direction;
          const start = g.time.now,
            durationMs = 5000,
            beforeEffects = g.skill.effects.length,
            baseScale = p.scale;
          const originalGraphics = g.add.graphics,
            originalCircle = g.add.circle,
            created = [],
            circles = [];
          g.add.graphics = function (...args) {
            const obj = originalGraphics.apply(this, args);
            created.push(obj);
            return obj;
          };
          g.add.circle = function (...args) {
            const obj = originalCircle.apply(this, args);
            if (args[3] === 0x52ff8a) circles.push(obj);
            return obj;
          };
          const probe = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            wrongFlip: false,
            sawHaste: false,
            sawXpBoost: false,
            maxScale: baseScale,
            baseScale,
            done: false,
          };
          const sample = () => {
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            probe.sawHaste ||= (g.pstatus.get('haste')?.stacks ?? 0) >= 2;
            probe.sawXpBoost ||= g.skill.xpBoostT > 0 && Math.abs(g.skill.xpMult - 1.3) < 0.001;
            probe.maxScale = Math.max(probe.maxScale, p.scale);
            if (g.time.now - start > durationMs + 800) {
              Object.assign(probe, {
                circleCount: circles.length,
                circlesDestroyed: circles.every((o) => !o.scene),
                auraDestroyed: created.some((o) => o.depth === 11800 && !o.scene),
                effectCleared: g.skill.effects.length <= beforeEffects,
                statusExpired: !g.pstatus.has('haste') && g.skill.xpBoostT <= 0,
                scaleReturned: Math.abs(p.scale - baseScale) < 0.001,
                done: true,
              });
              controls.joyX = 0;
              g.events.off('postupdate', sample);
            }
          };
          window.__sproutSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          g.add.graphics = originalGraphics;
          g.add.circle = originalCircle;
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__sproutSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => ({ ...window.__sproutSkinProbe, frames: [...window.__sproutSkinProbe.frames] }));
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        !result.sawHaste ||
        !result.sawXpBoost ||
        !result.statusExpired ||
        !result.auraDestroyed ||
        !result.effectCleared ||
        result.maxScale < result.baseScale * 1.29 ||
        !result.scaleReturned ||
        result.circleCount !== 14 ||
        !result.circlesDestroyed
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

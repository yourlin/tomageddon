/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const skinId = process.argv[2];
if (!/^skin_beet(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass beet skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped beet berserk: authored cast, enrage/vampiric activation and expiry, aura cleanup, no procedural body scaling, both directions/three tiers. Final anatomy/mobile acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { beet: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('beet', 1, false, 0);
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
          const start = g.time.now,
            durationMs = 6000,
            beforeEffects = g.skill.effects.length;
          const originalGraphics = g.add.graphics,
            created = [],
            baseScale = p.scale;
          g.add.graphics = function (...args) {
            const obj = originalGraphics.apply(this, args);
            created.push(obj);
            return obj;
          };
          const probe = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            wrongFlip: false,
            durationMs,
            sawEnrage: false,
            sawVampiric: false,
            scaleChanged: false,
            done: false,
          };
          const sample = () => {
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            probe.sawEnrage ||= g.pstatus.has('enrage');
            probe.sawVampiric ||= (g.pstatus.get('vampiric')?.stacks ?? 0) >= 3;
            probe.scaleChanged ||= Math.abs(p.scale - baseScale) > 0.001;
            if (g.time.now - start > durationMs + 700) {
              probe.auraDestroyed = created.some((obj) => obj.depth === 11800 && !obj.scene);
              probe.effectCleared = g.skill.effects.length <= beforeEffects;
              probe.statusExpired = !g.pstatus.has('enrage') && !g.pstatus.has('vampiric');
              probe.done = true;
              controls.joyX = 0;
              g.events.off('postupdate', sample);
            }
          };
          window.__beetSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          g.add.graphics = originalGraphics;
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__beetSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => ({ ...window.__beetSkinProbe, frames: [...window.__beetSkinProbe.frames] }));
      if (
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        !result.sawEnrage ||
        !result.sawVampiric ||
        !result.statusExpired ||
        !result.auraDestroyed ||
        !result.effectCleared ||
        result.scaleChanged
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

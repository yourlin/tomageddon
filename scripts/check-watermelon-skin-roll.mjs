/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_watermelon(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass a watermelon skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped roll in both directions/three tiers: skin stays visible, all authored frames play, movement/hit rules remain intact, scale/alpha restored. Final visual acceptance remains separate.',
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
            meta: { skins: [skinId], skinOf: { watermelon: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('watermelon', 1, false, 0);
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
          if (p.art?.choice.entry.skinId !== skinId || !p.hasAuthoredAnimation('charge')) throw Error('Equipped skin lacks authored roll');
          g.iframes = 100000;
          g.weapons.update = () => {};
          controls.joyX = direction;
          controls.joyY = 0;
          g.moveX = direction;
          g.moveY = 0;
          p.tick(0, 0, direction);
          const probe = {
            frames: new Set(),
            required: p.art.choice.entry.anims.charge.frames,
            baseScale: p.scaleX,
            minAlpha: 1,
            maxScale: p.scaleX,
            wrongFlip: false,
            wrongSkin: false,
            dash: null,
            done: false,
          };
          const deadline = g.time.now + 1400;
          const sample = () => {
            if (p.state === 'charge') {
              probe.frames.add(Number(p.img.frame.name));
              probe.minAlpha = Math.min(probe.minAlpha, p.alpha);
              probe.maxScale = Math.max(probe.maxScale, p.scaleX);
              probe.wrongSkin ||= p.art.choice.entry.skinId !== skinId;
              // A real wall bounce reverses travel; facing must follow that velocity.
              if (g.skill.dash?.vx) probe.wrongFlip ||= p.img.flipX !== g.skill.dash.vx < 0;
            }
            const dash = g.skill.dash;
            if (dash) probe.dash ??= { hitR: dash.hitR, bounce: dash.bounce, rehit: dash.rehit, knock: dash.knock };
            if (g.time.now >= deadline) {
              Object.assign(probe, { finalScale: p.scaleX, finalAlpha: p.alpha, done: true });
              controls.joyX = 0;
              g.events.off('postupdate', sample);
            }
          };
          window.__skinRollProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          const dash = g.skill.dash;
          if (dash) {
            const end = dash.onEnd;
            dash.onEnd = (...args) => {
              end?.(...args);
              probe.endScale = p.scaleX;
              probe.endAlpha = p.alpha;
            };
          }
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__skinRollProbe.done, { timeout: 10000 });
      const result = await page.evaluate(() => ({ ...window.__skinRollProbe, frames: [...window.__skinRollProbe.frames] }));
      // Invulnerability may flash at entry/afterward; the generic-ball fallback
      // hides the equipped sprite entirely (alpha 0), which must never happen.
      // The existing end animation rebounds to 1.25x then eases back over 260ms.
      if (
        result.required.some((f) => !result.frames.includes(f)) ||
        result.minAlpha <= 0 ||
        result.wrongFlip ||
        result.wrongSkin ||
        Math.abs(result.maxScale / result.baseScale - 1.5) > 0.001 ||
        Math.abs(result.finalScale - result.baseScale) > 0.001 ||
        Math.abs(result.endScale / result.baseScale - 1.25) > 0.001 ||
        result.endAlpha !== 1 ||
        result.dash?.hitR !== 62 ||
        !result.dash.bounce ||
        result.dash.rehit !== 0.3 ||
        result.dash.knock !== 160
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
  writeFileSync(`reports/art-pilot/${skinId}-roll-motion-native.json`, JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

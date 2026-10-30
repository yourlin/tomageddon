/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_dragonfruit(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass dragonfruit skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped dragonfruit charge in both directions and three tiers; exact skin, four authored frames, whole-sprite mirror, dash movement/invulnerability/expiry. Visual anatomy and final continuous acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { dragonfruit: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('dragonfruit', 1, false, 0);
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
          if (p.art?.choice.entry.skinId !== skinId || !p.hasAuthoredAnimation('charge')) throw Error('Wrong skin or missing charge');
          g.iframes = 100000;
          g.weapons.update = () => {};
          controls.joyX = direction;
          controls.joyY = 0;
          g.moveX = direction;
          g.moveY = 0;
          p.tick(0, 0, direction);
          const sx = p.x,
            sy = p.y,
            deadline = g.time.now + 900;
          const probe = { charge: new Set(), wrongFlip: false, sawDash: false, distance: 0, invulnerable: 0, done: false };
          const sample = () => {
            if (p.state === 'charge') {
              probe.charge.add(Number(p.img.frame.name));
              if (g.skill.dash) {
                probe.sawDash = true;
                probe.wrongFlip ||= p.img.flipX !== g.skill.dash.vx < 0;
              }
            }
            probe.distance = Math.max(probe.distance, Math.hypot(p.x - sx, p.y - sy));
            if (g.time.now >= deadline) {
              Object.assign(probe, { done: true, dashCleared: !g.skill.dash, chargeEnded: p.state !== 'charge' });
              controls.joyX = 0;
              g.events.off('postupdate', sample);
            }
          };
          window.__dragonSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          probe.invulnerable = g.skill.invulnT;
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__dragonSkinProbe.done, { timeout: 10000 });
      const result = await page.evaluate(() => ({ ...window.__dragonSkinProbe, charge: [...window.__dragonSkinProbe.charge] }));
      if (
        result.charge.length !== 4 ||
        !result.sawDash ||
        result.wrongFlip ||
        result.distance < 300 ||
        result.invulnerable < 0.5 ||
        !result.dashCleared ||
        !result.chargeEnded
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

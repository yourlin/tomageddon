/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_carrot(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass a carrot skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped carrot skill: authored windup then charge in both directions and three tiers. Anatomy and final continuous visual acceptance remain separate.',
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
            meta: { skins: [skinId], skinOf: { carrot: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('carrot', 1, false, 0);
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
          if (p.art?.choice.entry.skinId !== skinId) throw Error('Wrong equipped skin');
          for (const state of ['windup', 'charge']) if (!p.hasAuthoredAnimation(state)) throw Error('Missing real skill state ' + state);
          g.iframes = 100000;
          g.weapons.update = () => {};
          controls.joyX = direction;
          controls.joyY = 0;
          g.moveX = direction;
          g.moveY = 0;
          const probe = { states: [], windup: new Set(), charge: new Set(), wrongFlip: false, sawDash: false, done: false };
          const deadline = g.time.now + 1100;
          const sample = () => {
            if (probe.states.at(-1) !== p.state) probe.states.push(p.state);
            if (p.state === 'windup' || p.state === 'charge') probe[p.state].add(Number(p.img.frame.name));
            if (p.state === 'charge' && g.skill.dash) {
              probe.sawDash = true;
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            if (g.time.now >= deadline) {
              probe.done = true;
              controls.joyX = 0;
              g.events.off('postupdate', sample);
            }
          };
          window.__carrotSkillProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__carrotSkillProbe.done, { timeout: 10000 });
      const result = await page.evaluate(() => {
        const p = window.__carrotSkillProbe;
        return { ...p, windup: [...p.windup], charge: [...p.charge] };
      });
      if (
        result.windup.length !== 4 ||
        result.charge.length !== 4 ||
        !result.sawDash ||
        result.wrongFlip ||
        result.states.indexOf('windup') >= result.states.indexOf('charge')
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

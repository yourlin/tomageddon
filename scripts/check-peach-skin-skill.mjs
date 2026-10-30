/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const skinId = process.argv[2];
if (!/^skin_peach(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass peach skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped peach angelLight: four cast frames, both directions/three tiers, three real healing pulses and beam cleanup, no duplicate procedural wings. Final anatomy/mobile acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { peach: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('peach', 1, false, 0);
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
          const original = g.heal,
            start = g.time.now;
          const durationMs = 1600,
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
            heals: [],
            wrongFlip: false,
            durationMs,
            beamDestroyed: false,
            graphicsCount: 0,
            effectCleared: false,
            done: false,
          };
          g.heal = function (amount, ...rest) {
            probe.heals.push({ amount, at: g.time.now - start, source: rest[1] });
            return original.call(this, amount, ...rest);
          };
          const sample = () => {
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            if (g.time.now - start > durationMs + 500) {
              probe.beamDestroyed = created.some((obj) => obj.depth === 11400 && !obj.scene);
              probe.graphicsCount = created.length;
              probe.duplicateWings = created.some((obj) => obj.depth === 10900);
              probe.effectCleared = g.skill.effects.length <= beforeEffects;
              probe.done = true;
              controls.joyX = 0;
              g.heal = original;
              for (const target of targets) target.alive = false;
              g.events.off('postupdate', sample);
            }
          };
          window.__peachSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          g.add.graphics = originalGraphics;
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__peachSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => ({ ...window.__peachSkinProbe, frames: [...window.__peachSkinProbe.frames] }));
      if (
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        result.heals.filter((h) => h.source === 'skill').length !== 3 ||
        !result.beamDestroyed ||
        !result.effectCleared ||
        result.duplicateWings
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

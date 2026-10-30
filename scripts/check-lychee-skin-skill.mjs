/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const skinId = process.argv[2];
if (!/^skin_lychee(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass lychee skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual luckyClovers: authored cast, lucky5/focus3 activation and expiry, four orbiting clovers and cleanup, aura cleanup; three tiers/two directions; final visual acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { lychee: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('lychee', 1, false, 0);
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
          const originalText = g.add.text,
            glyphs = [],
            positions = new Map();
          g.add.text = function (...args) {
            const obj = originalText.apply(this, args);
            if (args[2] === '☘') glyphs.push(obj);
            return obj;
          };
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
            sawLucky: false,
            sawFocus: false,
            scaleChanged: false,
            done: false,
          };
          const sample = () => {
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            probe.sawLucky ||= (g.pstatus.get('lucky')?.stacks ?? 0) >= 5;
            probe.sawFocus ||= (g.pstatus.get('focus')?.stacks ?? 0) >= 3;
            probe.scaleChanged ||= Math.abs(p.scale - baseScale) > 0.001;
            glyphs.forEach((o) => {
              if (o.scene) {
                const set = positions.get(o) ?? new Set();
                set.add(`${Math.round(o.x)},${Math.round(o.y)}`);
                positions.set(o, set);
              }
            });
            if (g.time.now - start > durationMs + 700) {
              probe.glyphCount = glyphs.length;
              probe.glyphsMoved = glyphs.every((o) => (positions.get(o)?.size ?? 0) > 10);
              probe.glyphsDestroyed = glyphs.every((o) => !o.scene);
              probe.auraDestroyed = created.some((obj) => obj.depth === 11800 && !obj.scene);
              probe.effectCleared = g.skill.effects.length <= beforeEffects;
              probe.statusExpired = !g.pstatus.has('lucky') && !g.pstatus.has('focus');
              probe.done = true;
              controls.joyX = 0;
              g.events.off('postupdate', sample);
            }
          };
          window.__lycheeSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          g.add.graphics = originalGraphics;
          g.add.text = originalText;
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__lycheeSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => ({ ...window.__lycheeSkinProbe, frames: [...window.__lycheeSkinProbe.frames] }));
      if (
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        !result.sawLucky ||
        !result.sawFocus ||
        !result.statusExpired ||
        !result.auraDestroyed ||
        !result.effectCleared ||
        result.scaleChanged ||
        result.glyphCount !== 4 ||
        !result.glyphsMoved ||
        !result.glyphsDestroyed
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

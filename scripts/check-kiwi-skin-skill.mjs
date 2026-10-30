/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const skinId = process.argv[2];
if (!/^skin_kiwi(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass kiwi skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual detectiveScan: authored cast, screen targets hit once and marked/vulnerable, offscreen exclusion, scan/reticle cleanup; both directions/three tiers. Final visual acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { kiwi: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('kiwi', 1, false, 0);
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
          const v = g.cameras.main.worldView;
          const positions = [
            [v.x + v.width * 0.25, v.centerY - 60],
            [v.x + v.width * 0.75, v.centerY + 60],
            [v.right + 240, v.centerY],
          ];
          const targets = positions.map(([x, y]) => g.spawnEnemyNow('mold', x, y));
          targets.forEach((e, i) => {
            e.x = positions[i][0];
            e.y = positions[i][1];
            e.speed = 0;
            e.hp = e.maxHp = 1e8;
            g.grid.insert(e);
          });
          const originalHit = g.weaponHit,
            originalGraphics = g.add.graphics,
            created = [],
            start = g.time.now;
          const probe = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            wrongFlip: false,
            hits: [],
            sawStatuses: false,
            done: false,
          };
          g.weaponHit = function (target, ...args) {
            const index = targets.indexOf(target);
            if (index >= 0) probe.hits.push({ index, at: g.time.now - start });
            return originalHit.call(this, target, ...args);
          };
          g.add.graphics = function (...args) {
            const obj = originalGraphics.apply(this, args);
            created.push(obj);
            return obj;
          };
          const sample = () => {
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            probe.sawStatuses ||= targets.slice(0, 2).every((e) => e.status.has('mark') && (e.status.get('vulnerable')?.stacks ?? 0) >= 2);
            if (g.time.now - start > 7600) {
              probe.lensDestroyed = created.some((o) => o.depth === 12100 && !o.scene);
              const reticles = created.filter((o) => o.depth === 12200);
              probe.reticles = reticles.length;
              probe.reticlesDestroyed = reticles.every((o) => !o.scene);
              probe.done = true;
              controls.joyX = 0;
              g.weaponHit = originalHit;
              g.add.graphics = originalGraphics;
              targets.forEach((e) => {
                e.alive = false;
              });
              g.events.off('postupdate', sample);
            }
          };
          window.__kiwiSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__kiwiSkinProbe.done, { timeout: 18000 });
      const result = await page.evaluate(() => ({ ...window.__kiwiSkinProbe, frames: [...window.__kiwiSkinProbe.frames] }));
      if (
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        !result.sawStatuses ||
        !result.lensDestroyed ||
        result.reticles < 2 ||
        !result.reticlesDestroyed ||
        result.hits.some((h) => h.index === 2) ||
        [0, 1].some((i) => result.hits.filter((h) => h.index === i).length !== 1)
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

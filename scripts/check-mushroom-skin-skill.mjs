/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_mushroom(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass mushroom skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped Spore Cloud: four cast frames, eighteen clouds, repeated poison applications and initial damage and cloud expiry, both directions/three tiers. Anatomy/final continuous acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { mushroom: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('mushroom', 1, false, 0);
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
          g.iframes = 100000;
          g.weapons.update = () => {};
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
          const start = g.time.now,
            originalHit = g.weaponHit,
            before = new Set(g.children.list);
          const probe = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            hits: [],
            wrongFlip: false,
            poisonApplications: 0,
            sawPoison: false,
            done: false,
          };
          g.weaponHit = function (e, ...args) {
            if (e === target) probe.hits.push(g.time.now - start);
            return originalHit.call(this, e, ...args);
          };
          const originalDot = g.applyDot;
          g.applyDot = function (e, status, ...args) {
            if (e === target && status.id === 'poison') probe.poisonApplications++;
            return originalDot.call(this, e, status, ...args);
          };
          let clouds = [];
          const sample = () => {
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            probe.sawPoison ||= target.status.has('poison');
            if (g.time.now - start > 6600) {
              Object.assign(probe, { done: true, cloudsDestroyed: clouds.every((c) => !c.scene), damaged: target.hp < 1e8 });
              controls.joyX = 0;
              g.weaponHit = originalHit;
              g.applyDot = originalDot;
              target.alive = false;
              g.events.off('postupdate', sample);
            }
          };
          window.__mushroomSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          clouds = g.children.list.filter((c) => !before.has(c) && c.texture?.key === 'fx_glow' && c.tintTopLeft === 0x6a994e);
          probe.cloudCount = clouds.length;
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__mushroomSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => ({ ...window.__mushroomSkinProbe, frames: [...window.__mushroomSkinProbe.frames] }));
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        result.cloudCount !== 18 ||
        !result.cloudsDestroyed ||
        !result.damaged ||
        !result.sawPoison ||
        result.poisonApplications < 5 ||
        result.hits.length < 1
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

/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_bittermelon(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass bittermelon skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped Ice Field: four cast frames, repeated field damage, slow status, fixed origin and effect cleanup, both directions/three tiers. Random freeze is not guaranteed; final visual acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { bittermelon: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('bittermelon', 1, false, 0);
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
          g.stats.speed = 0;
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
          const originX = p.x,
            originY = p.y;
          controls.joyX = 0;
          g.moveX = 0;
          g.facing = direction;
          const start = g.time.now,
            originalHit = g.weaponHit,
            before = new Set(g.children.list),
            beforeEffects = g.skill.effects.length;
          const probe = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            hits: [],
            wrongFlip: false,
            slowApplications: 0,
            sawSlow: false,
            done: false,
          };
          g.weaponHit = function (e, ...args) {
            if (e === target) probe.hits.push(g.time.now - start);
            return originalHit.call(this, e, ...args);
          };
          const originalDot = g.applyDot;
          g.applyDot = function (e, status, ...args) {
            if (e === target && status.id === 'slow') probe.slowApplications++;
            return originalDot.call(this, e, status, ...args);
          };
          let pools = [],
            frost = [];
          const sample = () => {
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            probe.sawSlow ||= target.status.has('slow');
            p.x = originX;
            p.y = originY;
            target.x = originX + 30;
            target.y = originY;
            target.kvx = target.kvy = 0;
            if (g.time.now - start > 6200) {
              Object.assign(probe, {
                done: true,
                poolsDestroyed: pools.every((c) => !c.scene),
                frostDestroyed: frost.every((c) => !c.scene),
                effectCleared: g.skill.effects.length <= beforeEffects,
                damaged: target.hp < 1e8,
              });
              controls.joyX = 0;
              g.weaponHit = originalHit;
              g.applyDot = originalDot;
              target.alive = false;
              g.events.off('postupdate', sample);
            }
          };
          window.__bittermelonSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          pools = g.children.list.filter((c) => !before.has(c) && c.texture?.key === 'fx_pool' && c.tintTopLeft === 0xcaf0f8);
          frost = g.children.list.filter((c) => !before.has(c) && c.type === 'Graphics' && c.depth === 1.6);
          probe.poolCount = pools.length;
          probe.frostCount = frost.length;
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__bittermelonSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => ({ ...window.__bittermelonSkinProbe, frames: [...window.__bittermelonSkinProbe.frames] }));
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        result.poolCount !== 1 ||
        result.frostCount !== 1 ||
        !result.poolsDestroyed ||
        !result.frostDestroyed ||
        !result.effectCleared ||
        !result.damaged ||
        !result.sawSlow ||
        result.slowApplications < 5 ||
        result.hits.length < 5
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

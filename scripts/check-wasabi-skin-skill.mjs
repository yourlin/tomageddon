/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_wasabi(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass wasabi skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped Wasabi Nuke: four cast frames, delayed explosion, repeated residue damage, fixed target and effect cleanup, both directions/three tiers. final visual acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { wasabi: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('wasabi', 1, false, 0);
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
            originalExplode = g.explode,
            originalImage = g.add.image,
            beforeEffects = g.skill.effects.length;
          const createdImages = [];
          const probe = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            hits: [],
            wrongFlip: false,
            explosions: [],
            done: false,
          };
          g.weaponHit = function (e, ...args) {
            if (e === target) probe.hits.push(g.time.now - start);
            return originalHit.call(this, e, ...args);
          };
          g.explode = function (...args) {
            if (args[5] === 0x70e000) probe.explosions.push({ at: g.time.now - start, x: args[0], y: args[1], radius: args[2] });
            return originalExplode.apply(this, args);
          };
          g.add.image = function (...args) {
            const image = originalImage.apply(this, args);
            createdImages.push({ image, key: args[2] });
            return image;
          };
          const sample = () => {
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            p.x = originX;
            p.y = originY;
            target.x = originX + 30;
            target.y = originY;
            target.kvx = target.kvy = 0;
            if (g.time.now - start > 4800) {
              const pools = createdImages.filter((c) => c.key === 'fx_pool' && c.image.tintTopLeft === 0x70e000);
              const bombs = createdImages.filter((c) => c.key === 'proj_rocket');
              const puffs = createdImages.filter((c) => c.key === 'fx_glow' && c.image.depth === 13000);
              Object.assign(probe, {
                done: true,
                poolCount: pools.length,
                bombCount: bombs.length,
                puffCount: puffs.length,
                visualsDestroyed: [...pools, ...bombs, ...puffs].every((c) => !c.image.scene),
                effectCleared: g.skill.effects.length <= beforeEffects,
                damaged: target.hp < 1e8,
              });
              controls.joyX = 0;
              g.weaponHit = originalHit;
              g.explode = originalExplode;
              g.add.image = originalImage;
              target.alive = false;
              g.events.off('postupdate', sample);
            }
          };
          window.__wasabiSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__wasabiSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => ({ ...window.__wasabiSkinProbe, frames: [...window.__wasabiSkinProbe.frames] }));
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        result.poolCount !== 1 ||
        result.bombCount !== 1 ||
        result.puffCount !== 10 ||
        !result.visualsDestroyed ||
        !result.effectCleared ||
        !result.damaged ||
        result.hits.length < 5 ||
        result.explosions.length !== 1 ||
        result.explosions[0].at < 800 ||
        result.explosions[0].at > 1400
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

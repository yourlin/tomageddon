/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_jackfruit(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass jackfruit skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped Jackfruit spike armor: four cast frames, twelve rotating spikes, repeated close damage, thorns/fortify and effect cleanup, both directions/three tiers. final visual acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { jackfruit: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('jackfruit', 1, false, 0);
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
          g.timeLeft = 999;
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
            originalGraphics = g.add.graphics,
            beforeEffects = g.skill.effects.length;
          const graphics = [];
          const probe = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            hits: [],
            wrongFlip: false,
            spikeTriangles: 0,
            sawThorns: false,
            sawFortify: false,
            done: false,
          };
          g.weaponHit = function (e, ...args) {
            if (e === target) probe.hits.push(g.time.now - start);
            return originalHit.call(this, e, ...args);
          };
          g.add.graphics = function (...args) {
            const gr = originalGraphics.apply(this, args),
              triangle = gr.fillTriangle;
            gr.fillTriangle = function (...coords) {
              if (this.depth === 11800) probe.spikeTriangles++;
              return triangle.apply(this, coords);
            };
            graphics.push(gr);
            return gr;
          };
          const sample = () => {
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            probe.sawThorns ||= (g.pstatus.get('thorns')?.stacks ?? 0) >= 5;
            probe.sawFortify ||= (g.pstatus.get('fortify')?.stacks ?? 0) >= 3;
            p.x = originX;
            p.y = originY;
            target.x = originX + 30;
            target.y = originY;
            target.kvx = target.kvy = 0;
            if (g.time.now - start > 7300) {
              const auras = graphics.filter((gr) => gr.depth === 11800);
              Object.assign(probe, {
                done: true,
                auraCount: auras.length,
                visualsDestroyed: auras.every((gr) => !gr.scene),
                statusesExpired: !g.pstatus.has('thorns') && !g.pstatus.has('fortify'),
                effectCleared: g.skill.effects.length <= beforeEffects,
                damaged: target.hp < 1e8,
              });
              controls.joyX = 0;
              g.weaponHit = originalHit;
              g.add.graphics = originalGraphics;
              target.alive = false;
              g.events.off('postupdate', sample);
            }
          };
          window.__jackfruitSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__jackfruitSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => ({ ...window.__jackfruitSkinProbe, frames: [...window.__jackfruitSkinProbe.frames] }));
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        result.auraCount !== 1 ||
        result.spikeTriangles < 120 ||
        !result.sawThorns ||
        !result.sawFortify ||
        !result.statusesExpired ||
        !result.visualsDestroyed ||
        !result.effectCleared ||
        !result.damaged ||
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

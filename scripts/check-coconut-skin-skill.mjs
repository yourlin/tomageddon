/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_coconut(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass coconut skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped Ground Pound: four cast frames, fixed authored sprite scale, impact damage, invulnerability and temporary shadow cleanup; both directions/three tiers. Final anatomy/mobile acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { coconut: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('coconut', 1, false, 0);
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
          if (p.art?.choice.entry.skinId !== skinId || !p.hasAuthoredAnimation('cast')) throw Error('Wrong skin or missing cast');
          g.iframes = 100000;
          g.weapons.update = () => {};
          controls.joyX = direction;
          controls.joyY = 0;
          g.moveX = direction;
          g.moveY = 0;
          p.tick(0, 0, direction);
          const target = g.spawnEnemyNow('mold', p.x + 25, p.y);
          target.speed = 0;
          target.hp = target.maxHp = 1e8;
          const start = g.time.now,
            originalHit = g.weaponHit,
            before = new Set(g.children.list),
            base = p.scale;
          const probe = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            hits: [],
            wrongFlip: false,
            scaleChanged: false,
            base,
            done: false,
          };
          g.weaponHit = function (e, ...args) {
            if (e === target) probe.hits.push(g.time.now - start);
            return originalHit.call(this, e, ...args);
          };
          let shadows = [];
          const sample = () => {
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            probe.scaleChanged ||= Math.abs(p.scale - base) > 0.001;
            if (g.time.now - start > 1100) {
              Object.assign(probe, {
                done: true,
                shadowsDestroyed: shadows.every((s) => !s.scene),
                damaged: target.hp < 1e8,
                finalScale: p.scale,
              });
              controls.joyX = 0;
              g.weaponHit = originalHit;
              target.alive = false;
              g.events.off('postupdate', sample);
            }
          };
          window.__coconutSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          probe.invulnerable = g.skill.invulnT;
          shadows = g.children.list.filter((c) => !before.has(c) && c.type === 'Ellipse' && c.width === 70 && c.height === 24);
          probe.shadowCount = shadows.length;
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__coconutSkinProbe.done, { timeout: 10000 });
      const result = await page.evaluate(() => ({ ...window.__coconutSkinProbe, frames: [...window.__coconutSkinProbe.frames] }));
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        result.scaleChanged ||
        Math.abs(result.finalScale - result.base) > 0.001 ||
        result.invulnerable < 0.59 ||
        result.shadowCount !== 1 ||
        !result.shadowsDestroyed ||
        !result.damaged ||
        result.hits.length !== 1 ||
        result.hits[0] < 250 ||
        result.hits[0] > 600
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

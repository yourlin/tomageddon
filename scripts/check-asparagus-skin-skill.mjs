/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const skinId = process.argv[2];
if (!/^skin_asparagus(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass asparagus skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped asparagus piercingArrow: 400ms authored windup, release frames, aimed beam hits/mark and off-line exclusion, three tiers/both directions. Final visual/mobile acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { asparagus: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('asparagus', 1, false, 0);
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
          if (p.art?.choice.entry.skinId !== skinId || !p.hasAuthoredAnimation('cast') || !p.hasAuthoredAnimation('windup'))
            throw Error('Wrong skin/missing cast');
          g.iframes = 100000;
          g.weapons.update = () => {};
          g.stats.speed = 0;
          controls.joyX = direction;
          controls.joyY = 0;
          g.moveX = direction;
          g.moveY = 0;
          p.tick(0, 0, direction);
          const targets = [
            g.spawnEnemyNow('mold', p.x + direction * 180, p.y),
            g.spawnEnemyNow('mold', p.x + direction * 300, p.y),
            g.spawnEnemyNow('mold', p.x + direction * 180, p.y + 180),
          ];
          targets.forEach((e, i) => {
            e.speed = 0;
            e.hp = e.maxHp = 1e8 / (i + 1);
            g.grid.insert(e);
          });
          const start = g.time.now,
            durationMs = 1300,
            originalHit = g.weaponHit,
            originalBeam = g.fx.beam;
          const probe = {
            windupFrames: new Set(),
            frames: new Set(),
            requiredWindup: p.art.choice.entry.anims.windup.frames,
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            wrongFlip: false,
            hits: [],
            beams: [],
            done: false,
          };
          g.weaponHit = function (target, ...args) {
            const i = targets.indexOf(target);
            if (i >= 0) probe.hits.push({ index: i, at: g.time.now - start });
            return originalHit.call(this, target, ...args);
          };
          g.fx.beam = function (x, y, a, ...rest) {
            probe.beams.push({ at: g.time.now - start, facing: Math.sign(Math.cos(a)) });
            return originalBeam.call(this, x, y, a, ...rest);
          };
          const sample = () => {
            if (p.state === 'cast') {
              probe.frames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            if (p.state === 'windup') {
              probe.windupFrames.add(Number(p.img.frame.name));
              probe.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            if (g.time.now - start > durationMs) {
              probe.marked = targets.slice(0, 2).every((e) => e.status.has('mark'));
              probe.offLineUntouched = !probe.hits.some((h) => h.index === 2);
              probe.done = true;
              controls.joyX = 0;
              g.weaponHit = originalHit;
              g.fx.beam = originalBeam;
              for (const target of targets) target.alive = false;
              g.events.off('postupdate', sample);
            }
          };
          window.__asparagusSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__asparagusSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => ({
        ...window.__asparagusSkinProbe,
        frames: [...window.__asparagusSkinProbe.frames],
        windupFrames: [...window.__asparagusSkinProbe.windupFrames],
      }));
      if (
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.requiredWindup.some((f) => !result.windupFrames.includes(f)) ||
        result.wrongFlip ||
        result.beams.length !== 2 ||
        result.beams.some((b) => b.at < 350 || b.at > 700 || b.facing !== direction) ||
        !result.marked ||
        !result.offLineUntouched ||
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

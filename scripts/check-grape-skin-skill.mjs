/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_grape(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass grape skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped grape decoy: player cast, matching skin clone spawn/death, lure lifetime and explosion cleanup in three tiers/both facing directions; final visual acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { grape: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('grape', 1, false, 0);
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
          controls.joyX = direction;
          controls.joyY = 0;
          g.moveX = direction;
          g.moveY = 0;
          p.tick(0, 0, direction);
          const start = g.time.now,
            before = new Set(g.children.list),
            originalExplode = g.explode;
          const probe = {
            castFrames: new Set(),
            spawnFrames: new Set(),
            deathFrames: new Set(),
            explosions: [],
            sawDecoy: false,
            done: false,
          };
          g.explode = function (x, y, ...args) {
            probe.explosions.push({ x, y, at: g.time.now - start });
            return originalExplode.call(this, x, y, ...args);
          };
          const sample = () => {
            if (p.state === 'cast') probe.castFrames.add(Number(p.img.frame.name));
            probe.sawDecoy ||= !!g.decoy;
            if (rig?.scene && rig.img) {
              if (rig.state === 'spawn') probe.spawnFrames.add(Number(rig.img.frame.name));
              if (rig.state === 'die') probe.deathFrames.add(Number(rig.img.frame.name));
            }
            if (g.time.now - start > 7500) {
              Object.assign(probe, { done: true, cleared: !g.decoy, cloneDestroyed: !rig?.scene });
              controls.joyX = 0;
              g.explode = originalExplode;
              g.events.off('postupdate', sample);
            }
          };
          window.__grapeSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          const rig = g.children.list.find((c) => !before.has(c) && c.ident?.kind === 'char' && c.ident?.id === 'grape' && c.art);
          if (!rig || rig.art.choice.entry.skinId !== skinId || !rig.hasAuthoredAnimation('spawn'))
            throw Error('Decoy must use equipped authored skin');
          Object.assign(probe, {
            cloneSkin: rig.art.choice.entry.skinId,
            requiredCast: p.art.choice.entry.anims.cast.frames,
            requiredSpawn: rig.art.choice.entry.anims.spawn.frames,
            requiredDeath: rig.art.choice.entry.anims.die.frames,
          });
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__grapeSkinProbe.done, { timeout: 20000 });
      const result = await page.evaluate(() => ({
        ...window.__grapeSkinProbe,
        castFrames: [...window.__grapeSkinProbe.castFrames],
        spawnFrames: [...window.__grapeSkinProbe.spawnFrames],
        deathFrames: [...window.__grapeSkinProbe.deathFrames],
      }));
      if (
        !result.sawDecoy ||
        !result.cleared ||
        !result.cloneDestroyed ||
        result.explosions.length !== 1 ||
        result.requiredCast.some((f) => !result.castFrames.includes(f)) ||
        result.requiredSpawn.some((f) => !result.spawnFrames.includes(f)) ||
        result.requiredDeath.some((f) => !result.deathFrames.includes(f))
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

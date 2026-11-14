/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_blueberry(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass blueberry skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Equipped blueberry twins:player cast,two matching skin clones,sharedtexture,authored spawn/move/death,shieldblockeddeath andnaturalexpiry,explosions/referencecleanup;three tiers/both directions;finalvisual separate.',
};
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  for (const tier of ['low', 'standard', 'high'])
    for (const direction of [1, -1]) {
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
              meta: { skins: [skinId], skinOf: { blueberry: skinId } },
            }),
          ),
        { skinId, tier },
      );
      await page.goto('http://127.0.0.1:4183/?art=1&skins=1', { timeout: 90000 });
      await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
      await page.evaluate(() => {
        window.run.start('blueberry', 1, false, 0);
        window.game.scene.getScene('Menu').scene.start('Game');
      });
      await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game')?.player?.active, {
        timeout: 60000,
      });
      await page.evaluate(
        async ({ skinId, direction }) => {
          const g = window.game.scene.getScene('Game'),
            p = g.player;
          if (p.art?.choice.entry.skinId !== skinId || !p.hasAuthoredAnimation('cast')) throw Error('Skin fallback or missing cast');
          g.timeLeft = 999;
          g.iframes = 0;
          g.damagePlayer = () => {};
          g.stats.speed = 0;
          const { controls } = await import('/src/systems/Controls.ts');
          controls.joyX = 0;
          controls.joyY = 0;
          g.moveX = 0;
          g.moveY = 0;
          g.facing = direction;
          p.tick(0, 0, direction);
          if (!p.hasAuthoredAnimation('spawn')) throw Error('Equipped skin needs authored clone spawn');
          const target = g.spawnEnemyNow('mold', p.x + 140, p.y);
          target.hp = target.maxHp = 1e8;
          target.speed = 0;
          await new Promise((resolve) => g.time.delayedCall(600, resolve));
          const start = g.time.now,
            before = new Set(g.children.list),
            originalExplode = g.explode,
            originalEcho = g.weapons.echo;
          const q = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            wrongFlip: false,
            echoCalls: 0,
            explosions: [],
            done: false,
          };
          g.explode = function (x, y, ...rest) {
            q.explosions.push({ x, y, at: g.time.now - start });
            return originalExplode.call(this, x, y, ...rest);
          };
          g.weapons.echo = function (...args) {
            if (g.weaponClones.length) q.echoCalls++;
            return originalEcho.apply(this, args);
          };
          const rigs = new Map();
          const sample = () => {
            if (p.state === 'cast') {
              q.frames.add(Number(p.img.frame.name));
              q.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            for (const r of g.children.list)
              if (!before.has(r) && r.ident?.kind === 'char' && r.ident.id === 'blueberry' && r.art) {
                if (!rigs.has(r))
                  rigs.set(r, {
                    skinId: r.art.choice.entry.skinId,
                    texture: r.img.texture.key,
                    spawn: new Set(),
                    move: new Set(),
                    die: new Set(),
                  });
                const row = rigs.get(r);
                if (row[r.state] instanceof Set) row[r.state].add(Number(r.img.frame.name));
                // Locomotion can advance while logical state is idle.
                if (p.art.choice.entry.anims.move.frames.includes(Number(r.img.frame.name))) row.move.add(Number(r.img.frame.name));
              }
            if (g.time.now - start > 9400) {
              Object.assign(q, {
                done: true,
                playerTexture: p.img.texture.key,
                clones: [...rigs].map(([r, row]) => ({
                  ...row,
                  spawn: [...row.spawn],
                  move: [...row.move],
                  die: [...row.die],
                  destroyed: !r.scene,
                })),
                weaponClones: g.weaponClones.length,
                shields: g.bulletShields.length,
              });
              g.explode = originalExplode;
              g.weapons.echo = originalEcho;
              g.events.off('postupdate', sample);
            }
          };
          window.__blueberrySkinProbe = q;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          sample();
          g.time.delayedCall(1500, () => {
            const shield = g.bulletShields[0];
            if (!shield?.block) throw Error('Clone shield absent');
            shield.block(1e9);
          });
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__blueberrySkinProbe.done, { timeout: 20000 });
      const result = await page.evaluate(() => {
        const q = window.__blueberrySkinProbe;
        return { ...q, frames: [...q.frames] };
      });
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        result.clones.length !== 2 ||
        result.clones.some(
          (c) => c.skinId !== skinId || c.texture !== result.playerTexture || c.spawn.length !== 4 || c.die.length !== 4 || !c.destroyed,
        ) ||
        result.echoCalls < 1 ||
        result.explosions.length !== 2 ||
        result.explosions[0].at < 1400 ||
        result.explosions[0].at > 2200 ||
        result.explosions[1].at < 7800 ||
        result.explosions[1].at > 9000 ||
        result.weaponClones ||
        result.shields
      )
        throw Error(JSON.stringify({ tier, direction, ...result }));
      report.cases.push({ tier, direction, ...result });
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

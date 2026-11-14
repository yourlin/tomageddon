/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_strawberry(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass strawberry skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Equipped idolStage cast4frames/6second haste3/rage5 totals/spotlighttriangles/musicnotes/expirycleanup/no proceduralbodyscale;3tiers/bothdirections;finalvisual separate.',
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
              meta: { skins: [skinId], skinOf: { strawberry: skinId } },
            }),
          ),
        { skinId, tier },
      );
      await page.goto('http://127.0.0.1:4183/?art=1&skins=1', { timeout: 90000 });
      await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
      await page.evaluate(() => {
        window.run.start('strawberry', 1, false, 0);
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
          g.weapons.update = () => {};
          g.stats.speed = 0;
          const { controls } = await import('/src/systems/Controls.ts');
          controls.joyX = 0;
          controls.joyY = 0;
          g.moveX = 0;
          g.moveY = 0;
          g.facing = direction;
          p.tick(0, 0, direction);
          await new Promise((resolve) => g.time.delayedCall(600, resolve));
          const start = g.time.now,
            before = new Set(g.children.list),
            effects = g.skill.effects.length,
            originalGraphics = g.add.graphics,
            created = [],
            notes = new Set(),
            baseScale = p.scale;
          const q = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            wrongFlip: false,
            triangles: 0,
            sawHaste: false,
            sawRage: false,
            sawTotals: false,
            scaleChanged: false,
            done: false,
          };
          g.add.graphics = function (...args) {
            const gr = originalGraphics.apply(this, args),
              triangle = gr.fillTriangle;
            gr.fillTriangle = function (...coords) {
              if (this.depth === 11800) q.triangles++;
              return triangle.apply(this, coords);
            };
            created.push(gr);
            return gr;
          };
          const sample = () => {
            if (p.state === 'cast') {
              q.frames.add(Number(p.img.frame.name));
              q.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            q.sawHaste ||= (g.pstatus.get('haste')?.stacks ?? 0) >= 3;
            q.sawRage ||= (g.pstatus.get('rage')?.stacks ?? 0) >= 5;
            q.sawTotals ||= g.pstatus.totals.speed >= 30 && g.pstatus.totals.attackSpeed >= 30 && g.pstatus.totals.dmgDealt >= 20;
            q.scaleChanged ||= Math.abs(p.scale - baseScale) > 0.001;
            for (const c of g.children.list) if (!before.has(c) && ['♪', '♫', '♥'].includes(c.text)) notes.add(c);
            if (g.time.now - start > 7400) {
              Object.assign(q, {
                done: true,
                statusesExpired: !g.pstatus.has('haste') && !g.pstatus.has('rage'),
                buffExpired: g.skill.buffT <= 0,
                auraCount: created.filter((v) => v.depth === 11800).length,
                visualsDestroyed: created.every((v) => !v.scene),
                noteCount: notes.size,
                notesDestroyed: [...notes].every((v) => !v.scene),
                effectsCleared: g.skill.effects.length <= effects,
              });
              g.events.off('postupdate', sample);
            }
          };
          window.__strawberrySkinProbe = q;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          q.duration = g.skill.buffT;
          g.add.graphics = originalGraphics;
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__strawberrySkinProbe.done, { timeout: 20000 });
      const result = await page.evaluate(() => {
        const q = window.__strawberrySkinProbe;
        return { ...q, frames: [...q.frames] };
      });
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        Math.abs(result.duration - 6) > 0.02 ||
        !result.sawHaste ||
        !result.sawRage ||
        !result.sawTotals ||
        result.scaleChanged ||
        !result.statusesExpired ||
        !result.buffExpired ||
        result.auraCount !== 1 ||
        !result.visualsDestroyed ||
        result.noteCount < 5 ||
        !result.notesDestroyed ||
        !result.effectsCleared ||
        result.triangles < 20
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

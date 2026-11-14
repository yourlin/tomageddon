/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_garlic(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass garlic skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Equipped drain skill cast4frames/12nearbytargets damaged andbleed3/outsideuntouched/healcap10percent/bleedexpiry;3tiers/bothdirections;finalvisual separate.',
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
              meta: { skins: [skinId], skinOf: { garlic: skinId } },
            }),
          ),
        { skinId, tier },
      );
      await page.goto('http://127.0.0.1:4183/?art=1&skins=1', { timeout: 90000 });
      await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
      await page.evaluate(() => {
        window.run.start('garlic', 1, false, 0);
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
          const x = p.x,
            y = p.y,
            targets = Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI * 2;
              const e = g.spawnEnemyNow('mold', x + Math.cos(a) * 70, y + Math.sin(a) * 70);
              e.hp = e.maxHp = 1e8;
              e.speed = 0;
              return e;
            });
          const outside = g.spawnEnemyNow('mold', x + 600, y);
          outside.hp = outside.maxHp = 1e8;
          outside.speed = 0;
          await new Promise((resolve) => g.time.delayedCall(600, resolve));
          g.stats.maxHp = 200;
          g.stats.regen = 0;
          window.run.hp = 20;
          const start = g.time.now,
            beforeHp = targets.map((e) => e.hp),
            originalHeal = g.heal;
          const q = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            wrongFlip: false,
            heals: [],
            healDetails: [],
            done: false,
          };
          g.heal = function (n, show, src) {
            const before = window.run.hp;
            const result = originalHeal.call(this, n, show, src);
            if (src === 'skill') q.heals.push(n);
            q.healDetails.push({ n, src, got: window.run.hp - before });
            return result;
          };
          const sample = () => {
            const t = g.time.now - start;
            if (p.state === 'cast') {
              q.frames.add(Number(p.img.frame.name));
              q.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            if (t > 500)
              targets.forEach((e, i) => {
                e.x = x + 350 + i * 5;
                e.y = y;
                e.kvx = e.kvy = 0;
              });
            if (t > 5300) {
              Object.assign(q, { done: true, bleedExpired: targets.every((e) => !e.status.has('bleed')) });
              g.heal = originalHeal;
              g.events.off('postupdate', sample);
            }
          };
          window.__garlicSkinProbe = q;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          q.damaged = targets.every((e, i) => e.hp < beforeHp[i]);
          q.bleedStacks = targets.map((e) => e.status.get('bleed')?.stacks ?? 0);
          q.outsideUnaffected = outside.hp === 1e8 && !outside.status.has('bleed');
          q.hpAfterCast = window.run.hp;
          q.healAtCast = q.healDetails.slice();
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__garlicSkinProbe.done, { timeout: 15000 });
      const result = await page.evaluate(() => {
        const q = window.__garlicSkinProbe;
        return { ...q, frames: [...q.frames] };
      });
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        !result.damaged ||
        result.bleedStacks.some((n) => n < 3) ||
        !result.outsideUnaffected ||
        result.heals.length !== 1 ||
        result.heals[0] !== 20 ||
        result.hpAfterCast !== 20 + result.healAtCast.reduce((sum, h) => sum + h.got, 0) ||
        !result.healAtCast.some((h) => h.src === 'skill' && h.got === 20) ||
        !result.bleedExpired
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

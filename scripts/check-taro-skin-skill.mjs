/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_taro(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass taro skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Actual equipped Taro field: four cast frames, actual six-second field repeated damage and burn/slow, enemy projectile absorption and field/shield cleanup, both directions/three tiers. final visual acceptance separate.',
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
            meta: { skins: [skinId], skinOf: { taro: skinId } },
          }),
        ),
      { skinId, tier },
    );
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1', { timeout: 90000 });
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.run.start('taro', 1, false, 0);
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
          await new Promise((resolve) => g.time.delayedCall(600, resolve));
          const start = g.time.now,
            originalHit = g.weaponHit;
          const probe = {
            frames: new Set(),
            requiredFrames: p.art.choice.entry.anims.cast.frames,
            hits: [],
            wrongFlip: false,
            sawBurnSlow: false,
            blockedBeforeExpiry: false,
            done: false,
          };
          g.weaponHit = function (e, info, ...args) {
            if (e === target && info.weaponId === 'skill') {
              probe.hits.push(g.time.now - start);
              probe.sawBurnSlow ||=
                info.status?.some((s) => s.id === 'burn' && s.stacks >= 2) && info.status?.some((s) => s.id === 'slow' && s.stacks >= 2);
            }
            return originalHit.call(this, e, info, ...args);
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
            if (incoming && !incoming.alive && incoming.life > 1 && field && g.bulletShields.includes(field.shield)) {
              probe.blockedBeforeExpiry ||= Math.hypot(incoming.x - field.x, incoming.y - field.y) > 180;
            }
            if (field && !g.skill.fields.includes(field)) {
              Object.assign(probe, {
                done: true,
                fieldRadius: field.r,
                expectedRadius: g.skill.radius(230),
                visualsDestroyed: !field.img.scene && !field.ring.scene,
                shieldRemoved: !g.bulletShields.includes(field.shield),
                damaged: target.hp < 1e8,
              });
              controls.joyX = 0;
              g.weaponHit = originalHit;
              target.alive = false;
              g.events.off('postupdate', sample);
            }
          };
          window.__taroSkinProbe = probe;
          g.events.on('postupdate', sample);
          g.skill.cd = 0;
          g.skill.use();
          const field = g.skill.fields.at(-1);
          if (!field || !field.shield || !g.bulletShields.includes(field.shield)) throw Error('Missing actual Taro field shield');
          const incoming = g.enemyBullets.find((b) => !b.alive);
          if (!incoming) throw Error('No free enemy bullet fixture');
          g.enemyBullet('proj_enemy', field.x + field.r + 70, field.y, Math.PI, 1000, 1, 0, 1, undefined, target);
          sample();
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__taroSkinProbe.done, { timeout: 30000 });
      const result = await page.evaluate(() => ({ ...window.__taroSkinProbe, frames: [...window.__taroSkinProbe.frames] }));
      if (
        result.requiredFrames.length !== 4 ||
        result.requiredFrames.some((f) => !result.frames.includes(f)) ||
        result.wrongFlip ||
        result.fieldRadius !== result.expectedRadius ||
        !result.visualsDestroyed ||
        !result.shieldRemoved ||
        !result.damaged ||
        !result.sawBurnSlow ||
        !result.blockedBeforeExpiry ||
        result.hits.length < 10
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

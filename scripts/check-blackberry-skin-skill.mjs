/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const skinId = process.argv[2];
if (!/^skin_blackberry(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass blackberry skin id');
const report = {
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Equipped skin actual witherHex:4cast frames,fixedzone,16clouds,curse/rot/silence on newentrant,damage/expiry/glyphcleanup;three tiers both directions;finalvisual separate',
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
      await page.setViewport({ width: 1280, height: 720 });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.evaluateOnNewDocument(
        ({ skinId, tier }) =>
          localStorage.setItem(
            'tomato_sister_save_v1',
            JSON.stringify({
              saveVersion: 2,
              settings: { autoSkill: false, graphicsQuality: tier },
              meta: { skins: [skinId], skinOf: { blackberry: skinId } },
            }),
          ),
        { skinId, tier },
      );
      await page.goto('http://127.0.0.1:4183/?lang=zh&art=1&skins=1', { timeout: 90000 });
      await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
      await page.evaluate(() => {
        window.run.start('blackberry', 1, false, 0);
        window.game.scene.getScene('Menu').scene.start('Game');
      });
      await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
      await page.evaluate(
        async ({ skinId, direction }) => {
          const g = window.game.scene.getScene('Game'),
            p = g.player;
          if (p.art?.choice.entry.skinId !== skinId || !p.hasAuthoredAnimation('cast')) throw Error('Wrong skin or missingcast');
          const { controls } = await import('/src/systems/Controls.ts');
          controls.joyX = direction;
          controls.joyY = 0;
          g.moveX = direction;
          g.moveY = 0;
          p.tick(0, 0, direction);
          controls.joyX = 0;
          g.moveX = 0;
          g.facing = direction;
          g.stats.speed = 0;
          g.timeLeft = 999;
          g.weapons.update = () => {};
          g.iframes = 100000;
          g.skill.cd = 1000;
          for (const w of g.weapons.list) w.cd = 1000;
          const first = g.spawnEnemyNow('mold', p.x + 70, p.y),
            second = g.spawnEnemyNow('mold', p.x + 500, p.y);
          for (const e of [first, second]) {
            e.hp = e.maxHp = 1e8;
            e.speed = 0;
          }
          await new Promise((resolve) => g.time.delayedCall(600, resolve));
          const origin = { x: p.x, y: p.y },
            start = g.time.now,
            frames = new Set(),
            before = new Set(g.children.list),
            glyphs = new Set();
          const r = (window.__blackberry = {
            frames,
            requiredFrames: p.art.choice.entry.anims.cast.frames.map(String),
            wrongFlip: false,
            done: false,
            initialHp: first.hp,
          });
          g.skill.cd = 0;
          g.skill.use();
          g.skill.cd = 1000;
          const circle = g.children.list.find(
            (c) => !before.has(c) && c.type === 'Graphics' && c.depth === 1.6 && c.x === origin.x && c.y === origin.y,
          );
          const effects = g.children.list.filter((c) => !before.has(c) && (c.depth === 10800 || c.depth === 1.6));
          r.clouds = effects.filter((c) => c.type === 'Image').length;
          const statuses = ['curse', 'rot', 'silence'];
          r.initialStatuses = statuses.every((s) => first.status.has(s));
          r.outsideUnaffected = statuses.every((s) => !second.status.has(s));
          const sample = () => {
            const elapsed = g.time.now - start;
            if (p.state === 'cast' && p.img) {
              frames.add(String(p.img.frame.name));
              r.wrongFlip ||= p.img.flipX !== direction < 0;
            }
            for (const c of g.children.list) if (!before.has(c) && c.type === 'Text' && c.text === '☠') glyphs.add(c);
            if (elapsed > 1700 && !r.moved) {
              r.moved = true;
              p.setPosition(origin.x + 400, origin.y);
              second.x = origin.x + 100;
              second.y = origin.y;
            }
            if (elapsed > 3300 && !r.enterChecked) {
              r.enterChecked = true;
              r.newEntrantStatuses = statuses.every((s) => second.status.has(s));
              r.circleStayedAtCast = !!circle && Math.abs(circle.x - origin.x) < 1 && Math.abs(circle.y - origin.y) < 1;
            }
            if (elapsed > 13200) {
              Object.assign(r, {
                done: true,
                damage: r.initialHp - first.hp,
                effectsCleared: g.skill.effects.length === 0,
                effectsDestroyed: effects.every((c) => !c.scene),
                glyphCount: glyphs.size,
                glyphsDestroyed: [...glyphs].every((c) => !c.scene),
                statusesExpired: [first, second].every((e) => statuses.every((s) => !e.status.has(s))),
              });
              g.events.off('postupdate', sample);
            }
          };
          g.events.on('postupdate', sample);
        },
        { skinId, direction },
      );
      await page.waitForFunction(() => window.__blackberry.done, { timeout: 24000 });
      const r = await page.evaluate(() => ({ ...window.__blackberry, frames: [...window.__blackberry.frames] }));
      report.errors.push(...errors);
      if (
        errors.length ||
        r.requiredFrames.some((f) => !r.frames.includes(f)) ||
        r.frames.length !== 4 ||
        r.wrongFlip ||
        r.clouds !== 16 ||
        !r.initialStatuses ||
        !r.outsideUnaffected ||
        !r.newEntrantStatuses ||
        !r.circleStayedAtCast ||
        r.damage <= 0 ||
        !r.effectsCleared ||
        !r.effectsDestroyed ||
        r.glyphCount < 2 ||
        !r.glyphsDestroyed ||
        !r.statusesExpired
      )
        throw Error(JSON.stringify({ r, errors }));
      report.cases.push({ tier, direction, ...r });
      await page.close();
    }
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(e.stack || String(e));
  process.exitCode = 1;
} finally {
  writeFileSync(`reports/art-pilot/${skinId}-skill-motion-native.json`, JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

/* global window */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const actor = process.argv[2];
if (!/^[a-z]+$/.test(actor ?? '')) throw Error('Pass a default player id');
const skinId = process.argv[3];
if (skinId && !/^skin_[a-z0-9_]+$/.test(skinId)) throw Error('Invalid skin id');
const output = skinId
  ? resolve('../tomato-sister-art-source/qa/locomotion', actor, 'skins', skinId, 'game-capture')
  : resolve('../tomato-sister-art-source/qa/locomotion', actor, 'game-capture');
mkdirSync(output, { recursive: true });
const report = {
  actor,
  skinId,
  status: 'pending',
  scope:
    'Actual GameScene continuous movement using real keyboard input, high tier; captured frames support manual visual review, not final mobile/performance acceptance.',
  directions: [],
  errors: [],
};
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => report.errors.push(e.stack || e.message));
  await page.evaluateOnNewDocument(
    ({ actor, skinId }) =>
      localStorage.setItem(
        'tomato_sister_save_v1',
        JSON.stringify({
          saveVersion: 2,
          settings: { autoSkill: false, graphicsQuality: 'high' },
          meta: skinId ? { skins: [skinId], skinOf: { [actor]: skinId } } : {},
        }),
      ),
    { actor, skinId },
  );
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1&skins=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate((actor) => {
    window.run.start(actor, 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  }, actor);
  await page.waitForFunction(
    () => {
      const g = window.game.scene.getScene('Game');
      return g?.keys?.RIGHT && g.player?.active && g.player.state === 'idle' && window.game.scene.isActive('Hud');
    },
    { timeout: 60000 },
  );
  await page.evaluate((skinId) => {
    const g = window.game.scene.getScene('Game');
    if (skinId && g.player.art?.choice.entry.skinId !== skinId) throw Error('Equipped skin fell back');
    g.iframes = 100;
    g.skill.cd = 1000;
    for (const w of g.weapons.list) w.cd = 1000;
    // A close camera makes the actual runtime sprite readable without changing its scale.
    g.cameras.main.setZoom(2);
  }, skinId);
  for (const direction of [1, -1]) {
    const name = direction === 1 ? 'right' : 'left';
    const folder = resolve(output, name);
    mkdirSync(folder, { recursive: true });
    await page.keyboard.down(direction > 0 ? 'ArrowRight' : 'ArrowLeft');
    const samples = [];
    for (let i = 0; i < 32; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const sample = await page.evaluate(() => {
        const g = window.game.scene.getScene('Game'),
          p = g.player,
          c = g.cameras.main;
        const rect = window.game.canvas.getBoundingClientRect();
        const point = c.matrix.transformPoint(p.x - c.scrollX, p.y - c.scrollY);
        const x = rect.x + (point.x * rect.width) / window.game.scale.width;
        const y = rect.y + (point.y * rect.height) / window.game.scale.height;
        return {
          time: g.time.now,
          x: p.x,
          y: p.y,
          frame: Number(p.img.frame.name),
          flipX: p.img.flipX,
          state: p.state,
          screenX: x,
          screenY: y,
        };
      });
      const clip = {
        x: Math.max(0, Math.min(1024, sample.screenX - 128)),
        y: Math.max(0, Math.min(464, sample.screenY - 170)),
        width: 256,
        height: 256,
      };
      const file = resolve(folder, `${String(i).padStart(3, '0')}.png`);
      await page.screenshot({ path: file, clip });
      samples.push({ ...sample, file });
    }
    await page.keyboard.up(direction > 0 ? 'ArrowRight' : 'ArrowLeft');
    // The visual's automatic walking sequence can run while its logical state is idle.
    const seen = [...new Set(samples.map((s) => s.frame).filter((f) => f >= 4 && f <= 7))];
    const dx = samples.at(-1).x - samples[0].x;
    report.directions.push({ name, dx, seen, samples });
    if ([4, 5, 6, 7].some((f) => !seen.includes(f))) throw Error(`${name}: incomplete actual move frames ${seen}`);
    if (samples.slice(2).some((s) => s.flipX !== direction < 0)) throw Error(`${name}: incorrect actual mirror`);
    if (dx * direction < 30) throw Error(`${name}: player did not travel in requested direction: ${dx}`);
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'captured-runtime-assertions-passed; manual visual review required';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  process.exitCode = 1;
} finally {
  writeFileSync(resolve(output, 'capture.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(`reports/art-pilot/direction-audit/${skinId ?? actor}-continuous-game.json`, JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

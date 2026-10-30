/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const report = {
  status: 'pending',
  scope: 'Actual GameScene player dash/ice and Enemy.tick facing; image anatomy and continuous visual acceptance remain separate.',
  cases: [],
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
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.evaluateOnNewDocument(() =>
    localStorage.setItem(
      'tomato_sister_save_v1',
      JSON.stringify({ saveVersion: 2, settings: { autoSkill: false, graphicsQuality: 'high' } }),
    ),
  );
  await page.goto('http://127.0.0.1:4183/?art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate(() => {
    window.run.start('tomato', 1, false, 0);
    window.game.scene.stop('Menu');
    window.game.scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.getScene('Game')?.enemies?.some((e) => e.alive && !e.boss), { timeout: 60000 });
  report.cases = await page.evaluate(async () => {
    const g = window.game.scene.getScene('Game');
    window.game.scene.pause('Game');
    const { controls } = await import('/src/systems/Controls.ts');
    const checks = [];
    const check = (name, actual, expected) => {
      if (actual !== expected) throw Error(`${name}: ${actual}, expected ${expected}`);
      checks.push({ name, actual, expected });
    };
    g.waveOver = true;
    for (const key of Object.values(g.keys)) if (key && typeof key === 'object') key.isDown = false;
    controls.joyX = 1;
    controls.joyY = 0;
    g.skill.dash = { t: 1, vx: -500, vy: 0, hit: new Set(), info: {} };
    g.updatePlayer(0.016);
    check('dash left despite right input', g.facing, -1);
    check('illustrated player mirrored left', g.player.img.flipX, true);
    controls.joyX = -1;
    g.skill.dash.vx = 500;
    g.updatePlayer(0.016);
    check('dash right despite left input', g.facing, 1);
    check('illustrated player faces right', g.player.img.flipX, false);
    g.skill.dash = null;
    g.slippery = true;
    g.velX = 200;
    g.velY = 0;
    g.updatePlayer(0.016);
    check('ice still travelling right while stick left', g.facing, 1);
    const enemy = g.enemies.find((e) => e.alive && !e.boss);
    const originalTick = enemy.rig.tick.bind(enemy.rig);
    let face;
    enemy.rig.tick = (...args) => {
      face = args[2];
      originalTick(...args);
    };
    g.arena.steer = (_x, _y, _r, vx, vy) => [vx, vy];
    enemy.x = g.player.x - 200;
    enemy.y = g.player.y;
    enemy.minionAI = () => [-100, 0];
    enemy.tick(0.016, g);
    check('retreat left despite target right', face, -1);
    if (enemy.rig.img) check('illustrated enemy mirrored left', enemy.rig.img.flipX, true);
    enemy.state = 'charge';
    enemy.minionAI = () => [-300, 0];
    enemy.tick(0.016, g);
    check('locked charge left past target', face, -1);
    enemy.minionAI = () => [0, 100];
    enemy.tick(0.016, g);
    check('vertical movement retains side', face, 0);
    enemy.state = 'move';
    enemy.minionAI = () => [0, 0];
    enemy.tick(0.016, g);
    check('stationary enemy can face target', Math.sign(face), 1);
    return checks;
  });
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  process.exitCode = 1;
} finally {
  writeFileSync('reports/art-pilot/direction-audit/runtime-facing.json', JSON.stringify(report, null, 2));
  await closeArtBrowser(browser);
}

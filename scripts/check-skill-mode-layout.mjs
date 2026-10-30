/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const report = { cases: [], errors: [] };
try {
  for (const config of [
    { name: 'desktop', width: 1280, height: 720, bs: 1, right: false },
    { name: 'phone', width: 844, height: 390, bs: 1, right: false },
    { name: 'phone-left-large', width: 844, height: 390, bs: 1.4, right: true },
  ]) {
    const p = await browser.newPage();
    await freezeArtHmr(p);
    await p.setViewport({
      width: config.width,
      height: config.height,
      isMobile: config.name !== 'desktop',
      hasTouch: config.name !== 'desktop',
    });
    await p.evaluateOnNewDocument(
      (c) =>
        localStorage.setItem(
          'tomato_sister_save_v1',
          JSON.stringify({ saveVersion: 2, settings: { btnScale: c.bs, joyRight: c.right, autoSkill: false } }),
        ),
      config,
    );
    p.on('pageerror', (e) => report.errors.push(e.message));
    await p.goto('http://127.0.0.1:4183/?lang=zh&art=1');
    await p.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 60000 });
    await p.evaluate(() => {
      window.run.start('tomato', 1, false, 0);
      window.game.scene.getScenes(true).forEach((s) => window.game.scene.stop(s.scene.key));
      window.game.scene.start('Game');
    });
    await p.waitForFunction(() => window.game.scene.getScene('Game')?.player?.active, { timeout: 60000 });
    const row = await p.evaluate(async (c) => {
      const h = window.game.scene.getScene('Hud');
      const a = h.children.getByName('skill-mode-toggle'),
        s = h.children.getByName('skill-action-button');
      if (!a || !s) throw Error('Missing controls');
      const bounds = {
        left: a.x - 60 * a.scaleX,
        right: a.x + 60 * a.scaleX,
        top: a.y - 23 * a.scaleY,
        bottom: a.y + 26 * a.scaleY,
        x: a.x - 60 * a.scaleX,
        y: a.y - 23 * a.scaleY,
        width: 120 * a.scaleX,
        height: 49 * a.scaleY,
      };
      const skill = { top: s.y - 72 * s.scaleY };
      if (a.input.hitArea.width !== 116 || a.input.hitArea.height !== 44) throw Error('Touch target size');
      const W = window.game.canvas.width,
        H = window.game.canvas.height;
      if (bounds.left < 0 || bounds.top < 0 || bounds.right > W || bounds.bottom > H) throw Error('Toggle clipped');
      if (bounds.bottom > skill.top) throw Error('Toggle overlaps skill');
      if (a.x !== s.x || a.y >= s.y || a.scaleX !== c.bs) throw Error('Control grouping/layout');
      const before = a.list[1].text;
      a.emit('pointerdown');
      const stored = JSON.parse(localStorage.getItem('tomato_sister_save_v1')).settings.autoSkill;
      if (a.list[1].text === before || stored !== (a.list[1].text === '自动')) throw Error('Toggle persistence');
      await new Promise((r) => setTimeout(r, 180));
      if (Math.abs(a.scaleX - c.bs) > 0.01) throw Error('Scale reset');
      return {
        name: c.name,
        bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
        canvas: [W, H],
        toggledAndSaved: true,
        bs: a.scaleX,
      };
    }, config);
    await p.screenshot({ path: `reports/art-pilot/skill-mode-${config.name}.png` });
    report.cases.push(row);
    await p.close();
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  process.exitCode = 1;
} finally {
  writeFileSync('reports/art-pilot/skill-mode-layout-native.json', JSON.stringify(report, null, 2));
  await closeArtBrowser(browser);
}

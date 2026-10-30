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
  for (const mode of [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'phone', width: 844, height: 390 },
  ]) {
    const p = await browser.newPage();
    await freezeArtHmr(p);
    await p.setViewport({ width: mode.width, height: mode.height, hasTouch: mode.name === 'phone' });
    p.on('pageerror', (e) => report.errors.push(e.message));
    await p.goto('http://127.0.0.1:4183/?lang=zh&art=1');
    await p.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 60000 });
    await p.evaluate(() => {
      window.game.scene.stop('Menu');
      window.game.scene.start('Settings');
    });
    await p.waitForFunction(
      () => {
        const s = window.game.scene.getScene('Settings');
        return (
          s?.stylePreview?.list
            .filter((x) => x.name?.startsWith('art-style-card:'))
            .every((c) => c.list.some((x) => x.name?.startsWith('art-style-image:'))) && s.stylePreview.list.length === 3
        );
      },
      { timeout: 30000 },
    );
    await p.screenshot({ path: `reports/art-pilot/art-style-previews-${mode.name}.png` });
    const geometry = await p.evaluate(() => {
      const s = window.game.scene.getScene('Settings');
      return s.stylePreview.list
        .filter((x) => x.name?.startsWith('art-style-card:'))
        .map((c) => {
          const b = { left: c.x - 150, right: c.x + 150, top: c.y - 43, bottom: c.y + 43 };
          if (b.left < 0 || b.right > window.game.scale.width || b.top < 0 || b.bottom > window.game.scale.height)
            throw Error('Clipped preview');
          if (c.list.filter((x) => x.type === 'Image').length !== 1) throw Error('Missing tomato preview');
          return { name: c.name, bounds: b };
        });
    });
    for (const style of ['retro', 'cute']) {
      await p.evaluate((style) => {
        const s = window.game.scene.getScene('Settings');
        s.stylePreview.list.find((x) => x.name === `art-style-card:${style}`).emit('pointerup');
      }, style);
      await p.waitForFunction(
        (style) => {
          const s = window.game.scene.getScene('Settings');
          const card = s.stylePreview?.list.find((x) => x.name === `art-style-card:${style}`);
          return (
            card?.list.some((x) => x.type === 'Text' && x.text.startsWith('✓')) &&
            JSON.parse(localStorage.getItem('tomato_sister_save_v1')).settings.artStyle === style
          );
        },
        { timeout: 60000 },
        style,
      );
    }
    report.cases.push({ mode: mode.name, geometry, bothPreviewsVisible: true, switchBothDirectionsSaved: true });
    await p.close();
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  process.exitCode = 1;
} finally {
  writeFileSync('reports/art-pilot/art-style-previews-native.json', JSON.stringify(report, null, 2));
  await closeArtBrowser(browser);
}

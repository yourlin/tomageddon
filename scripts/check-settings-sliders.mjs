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
    { name: 'pause', width: 1280, height: 720 },
  ]) {
    const page = await browser.newPage();
    await freezeArtHmr(page);
    await page.setViewport({ width: mode.width, height: mode.height, hasTouch: mode.name === 'phone', isMobile: mode.name === 'phone' });
    page.on('pageerror', (e) => report.errors.push(e.message));
    await page.goto('http://127.0.0.1:4183/?lang=zh');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 60000 });
    await page.evaluate((pause) => {
      window.game.scene.stop('Menu');
      window.game.scene.start('Settings', pause ? { from: 'pause' } : undefined);
    }, mode.name === 'pause');
    await page.waitForFunction(() => window.game.scene.isActive('Settings'));
    await new Promise((r) => setTimeout(r, 600));
    const sliders = await page.evaluate(() => {
      const scene = window.game.scene.getScene('Settings'),
        rect = window.game.canvas.getBoundingClientRect();
      return scene.children.list
        .filter((x) => x.name?.startsWith('setting-slider:'))
        .map((c) => ({
          id: c.name.split(':')[1],
          x: rect.x + (c.x * rect.width) / window.game.scale.width,
          y: rect.y + (c.y * rect.height) / window.game.scale.height,
          half: (86 * rect.width) / window.game.scale.width,
          min: c.getData('min'),
          max: c.getData('max'),
          step: c.getData('step'),
        }));
    });
    if (sliders.length !== 8) throw Error('Expected all8 numeric settings');
    for (const s of sliders) {
      for (const fraction of [0, 0.5, 1]) {
        await page.mouse.move(s.x, s.y + 4);
        await page.mouse.down();
        await new Promise((r) => setTimeout(r, 60));
        await page.mouse.move(s.x + (fraction * 2 - 1) * (s.half + (fraction === 0.5 ? 0 : 20)), s.y + 4, { steps: 3 });
        await new Promise((r) => setTimeout(r, 60));
        await page.mouse.up();
        await new Promise((r) => setTimeout(r, 100));
        const actual = await page.evaluate(
          (id) => window.game.scene.getScene('Settings').children.getByName(`setting-slider:${id}`).getData('value'),
          s.id,
        );
        const expected = Number(Math.min(s.max, s.min + Math.round((fraction * (s.max - s.min)) / s.step) * s.step).toFixed(4));
        if (Math.abs(actual - expected) > (fraction === 0.5 ? s.step + 0.001 : 0.001))
          throw Error(
            `${mode.name}/${s.id}/${fraction}: ${actual} != ${expected}; ${JSON.stringify({ s, info: await page.evaluate(() => ({ pointer: [window.game.input.activePointer.x, window.game.input.activePointer.y], rect: window.game.canvas.getBoundingClientRect().toJSON(), vp: [window.innerWidth, window.innerHeight], scale: [window.game.scale.width, window.game.scale.height] })) })}`,
          );
        const stored = await page.evaluate((id) => {
          const st = JSON.parse(localStorage.getItem('tomato_sister_save_v1')).settings;
          return id === 'shake' ? (st.shake ? st.shakeScale : 0) : st[id];
        }, s.id);
        if (stored !== actual) throw Error('Not persisted ' + s.id);
      }
    }
    if (mode.name === 'phone') {
      const client = await page.createCDPSession(),
        s = sliders[0];
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: s.x, y: s.y + 4 }] });
      await new Promise((r) => setTimeout(r, 50));
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: s.x - s.half - 15, y: s.y + 4 }] });
      await new Promise((r) => setTimeout(r, 50));
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const value = await page.evaluate(() =>
        window.game.scene.getScene('Settings').children.getByName('setting-slider:sfx').getData('value'),
      );
      if (value !== 0)
        throw Error(
          'Touch drag failed ' +
            JSON.stringify({
              value,
              s,
              info: await page.evaluate(() => ({
                touch: window.game.device.input.touch,
                pointers: window.game.input.pointers.map((p) => ({ x: p.x, y: p.y, isDown: p.isDown })),
                canvas: window.game.canvas.getBoundingClientRect().toJSON(),
                vp: [window.innerWidth, window.innerHeight],
              })),
            }),
        );
      await client.detach();
    }
    await page.screenshot({ path: `reports/art-pilot/settings-sliders-${mode.name}.png` });
    report.cases.push({
      mode: mode.name,
      sliders: sliders.map((s) => s.id),
      clampedDragMinMidMax: true,
      persisted: true,
      touchDragVerified: mode.name === 'phone',
    });
    await page.close();
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  process.exitCode = 1;
} finally {
  writeFileSync('reports/art-pilot/settings-sliders-native.json', JSON.stringify(report, null, 2));
  await closeArtBrowser(browser);
}

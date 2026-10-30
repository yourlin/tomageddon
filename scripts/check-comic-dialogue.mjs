/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const report = {
  scope: 'Authored chapter copy present, readable size and bounds in illustrated panels; native screenshots inspected separately.',
  cases: [],
  errors: [],
};
try {
  for (const mode of [
    { lang: 'zh', width: 1280, height: 720 },
    { lang: 'en', width: 1280, height: 720 },
    { lang: 'zh', width: 844, height: 390 },
  ]) {
    const page = await browser.newPage();
    await freezeArtHmr(page);
    await page.setViewport({ width: mode.width, height: mode.height });
    page.on('pageerror', (e) => report.errors.push(e.message));
    await page.goto(`http://127.0.0.1:4183/?lang=${mode.lang}&art=1`);
    await page.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 60000 });
    for (let ch = 1; ch <= 7; ch++) {
      await page.evaluate((ch) => {
        window.game.scene.getScenes(true).forEach((s) => window.game.scene.stop(s.scene.key));
        window.game.scene.start('Comic', { ch, next: 'Menu' });
      }, ch);
      await page.waitForFunction(
        (ch) =>
          window.game.scene.isActive('Comic') &&
          window.game.scene.getScene('Comic').cd?.ch === ch &&
          window.game.scene.getScene('Comic').shown >= 1,
        { timeout: 30000 },
        ch,
      );
      const row = await page.evaluate(
        async ({ ch, lang }) => {
          const s = window.game.scene.getScene('Comic');
          while (s.shown < 4) {
            if (!s.busy) s.advance();
            await new Promise((r) => setTimeout(r, 100));
          }
          await new Promise((r) => setTimeout(r, 350));
          const { COMICS } = await import('/src/data/comics.ts');
          const li = lang === 'zh' ? 0 : 1;
          const checked = COMICS[ch].panels.map((p, i) => {
            const expected = [
              ...(p.props ?? []).filter((x) => x.text).map((x) => x.text[li]),
              ...(p.caption ? [p.caption[li]] : []),
              ...(p.say ? [p.say.text[li]] : []),
            ];
            if (!expected.length && p.sfx) expected.push(p.sfx.text[li]);
            const texts = s.children.list
              .filter((x) => x.type === 'Container')
              .flatMap((c) => c.list)
              .filter((x) => x.name === `comic-copy-${ch}-${i + 1}`);
            if (!expected.length) return { panel: i + 1, noAuthoredCopy: true };
            const t = texts[0],
              b = s.boxes[i];
            if (!t || expected.some((line) => !t.text.includes(line))) throw Error(`Missing authored copy ${ch}/${i + 1}/${lang}`);
            const bb = t.getBounds();
            if (bb.left < b.x || bb.right > b.x + b.w || bb.top < b.y || bb.bottom > b.y + b.h) throw Error(`Clipped copy ${ch}/${i + 1}`);
            if (parseInt(t.style.fontSize) < 16 || !t.visible || t.parentContainer.alpha < 0.99) throw Error('Unreadable copy');
            return { panel: i + 1, text: t.text, fontSize: t.style.fontSize, inBounds: true };
          });
          return { ch, lang, checked };
        },
        { ch, lang: mode.lang },
      );
      report.cases.push({ ...row, viewport: [mode.width, mode.height] });
      if (ch === 1) await page.screenshot({ path: `reports/art-pilot/comic-dialogue-${mode.lang}-${mode.width}.png` });
    }
    await page.close();
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  process.exitCode = 1;
} finally {
  writeFileSync('reports/art-pilot/comic-dialogue-native.json', JSON.stringify(report, null, 2));
  await closeArtBrowser(browser);
}

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
  const p = await browser.newPage();
  await freezeArtHmr(p);
  p.on('pageerror', (e) => report.errors.push(e.message));
  await p.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await p.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 60000 });
  for (const { seen, ch } of [{ seen: false, ch: 1 }, ...Array.from({ length: 7 }, (_, i) => ({ seen: true, ch: i + 1 }))]) {
    await p.evaluate(
      async ({ seen, ch }) => {
        const { save } = await import('/src/systems/Save.ts');
        save.meta.comicsSeen = seen ? [1, 2, 3, 4, 5, 6, 7] : [];
        (await import('/src/systems/TexQueue.ts')).flushTex();
        window.game.scene.getScenes(true).forEach((s) => window.game.scene.stop(s.scene.key));
        window.game.scene.start('CharSelect', { chapter: ch });
      },
      { seen, ch },
    );
    await p.waitForFunction(() => window.game.scene.isActive('CharSelect'));
    await p.evaluate(() => {
      const s = window.game.scene.getScene('CharSelect');
      if ('storyBtn' in s || s.children.list.some((x) => /本章故事|Chapter Story/.test(x.text ?? ''))) throw Error('Story button remains');
      s.begin(s.selected.startWeapons[0]);
    });
    await p.waitForFunction(() => window.game.scene.isActive('Comic') && window.game.scene.getScene('Comic').cd?.next === 'Game', {
      timeout: 30000,
    });
    const illustrated = await p.evaluate(() => window.game.textures.exists('comic_sheet_' + window.game.scene.getScene('Comic').cd.ch));
    if (!illustrated) throw Error('Missing chapter1 comic');
    await p.evaluate(() => window.game.scene.getScene('Comic').finish());
    await p.waitForFunction(() => window.game.scene.getScene('Game')?.player?.active && window.game.scene.isActive('Game'), {
      timeout: 60000,
    });
    report.cases.push({ chapter: ch, previouslySeen: seen, comicShown: true, illustrated, skipEntersGame: true });
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  process.exitCode = 1;
} finally {
  writeFileSync('reports/art-pilot/comic-start-native.json', JSON.stringify(report, null, 2));
  await closeArtBrowser(browser);
}

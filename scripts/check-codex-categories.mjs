/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const p = await browser.newPage();
  await freezeArtHmr(p);
  await p.setViewport({ width: 1280, height: 720 });
  await p.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await p.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'));
  const result = await p.evaluate(async () => {
    const { BOSSES, TRUE_FINAL_BOSS_ID, bossPool } = await import('/src/data/bosses.ts');
    window.game.scene.getScene('Menu').scene.start('Codex');
    await new Promise((resolve) => setTimeout(resolve, 400));
    const c = window.game.scene.getScene('Codex');
    c.tab = 'boss';
    const boss = c.entries().map((e) => e.key.replace('@boss:', ''));
    c.tab = 'elite';
    const elite = c.entries().map((e) => e.key.replace('@boss:', ''));
    c.tab = 'boss';
    c.draw();
    const chapters = Array.from({ length: 7 }, (_, i) => ({ chapter: i + 1, candidates: bossPool(i + 1).length }));
    if (
      boss.length !== 18 ||
      elite.length !== 34 ||
      boss.some((id) => BOSSES.find((b) => b.id === id).elite) ||
      elite.some((id) => !BOSSES.find((b) => b.id === id).elite) ||
      boss.some((id) => elite.includes(id))
    )
      throw Error('Incorrect codex grouping');
    if (chapters.map((c) => c.candidates).join(',') !== '3,3,3,3,3,1,1' || !boss.includes(TRUE_FINAL_BOSS_ID))
      throw Error('Incorrect Boss pools');
    return { boss: boss.length, elites: elite.length, chapterPools: chapters, trueFinal: TRUE_FINAL_BOSS_ID, status: 'passed' };
  });
  await p.screenshot({ path: 'reports/art-pilot/codex-boss-category.png' });
  writeFileSync('reports/art-pilot/codex-categories-native.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result));
} finally {
  await closeArtBrowser(browser);
}

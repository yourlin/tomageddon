/* global window */
import puppeteer from 'puppeteer-core';
import { writeFile } from 'node:fs/promises';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const cases = [];
try {
  for (const [name, width, height] of [
    ['desktop', 1280, 720],
    ['phone', 844, 390],
  ]) {
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    // 皮肤玩法本版本对玩家关闭，这里用 ?skins=1 打开，照常验收完整的换肤交互
    await page.goto('http://127.0.0.1:4183/?lang=zh&art=1&skins=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => {
      window.game.scene.stop('Menu');
      window.game.scene.start('CharSelect');
    });
    await new Promise((r) => setTimeout(r, 4000));
    await page.screenshot({ path: `reports/art-pilot/journal-current-${name}.png` });
    const state = await page.evaluate(() => {
      const s = window.game.scene.getScene('CharSelect');
      return { active: s.scene.isActive(), journal: !!s.children.getByName('character-journal') };
    });
    const interactions = await page.evaluate(async () => {
      const scene = window.game.scene.getScene('CharSelect'),
        journal = scene.journal;
      const root = () => scene.children.getByName('character-journal');
      journal.input('rb');
      journal.input('tab');
      journal.input('tab');
      journal.input('tab');
      journal.input('tab');
      journal.input('tab');
      const pageFocus = root().getData('focus');
      if (pageFocus.group !== 'roster' || pageFocus.index !== 18) throw Error('Roster page focus lost after Tab');
      journal.input('lb');
      journal.input('rt');
      const preview = journal.previewSkin?.id;
      const { activeSkin } = await import('/src/systems/Progress.ts');
      const before = activeSkin(scene.selected.id)?.id ?? '';
      journal.input('a');
      if ((activeSkin(scene.selected.id)?.id ?? '') !== before) throw Error('Locked preview equipped');
      scene.showDangerRules();
      journal.input('right');
      const dangerOpen = !!scene.dangerPanel;
      journal.input('b');
      if (!dangerOpen || scene.dangerPanel) throw Error('Danger controller navigation failed');
      return { pageFocus, lockedPreview: preview, lockedEquipPrevented: true, dangerModal: true };
    });
    cases.push({ name, width, height, errors, ...state, interactions });
    await page.close();
  }
  await writeFile(
    'reports/art-pilot/journal-browser-smoke.json',
    JSON.stringify({ cases, scope: 'render smoke only; interaction and final visual acceptance pending' }, null, 2) + '\n',
  );
  console.log(JSON.stringify(cases));
  if (cases.some((c) => c.errors.length || !c.active || !c.journal)) process.exitCode = 1;
} finally {
  await browser.close();
}

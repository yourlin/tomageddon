/* global window */
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const [width, height] of [
    [1600, 900],
    [1280, 720],
  ]) {
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu'));
    await page.waitForFunction(() => window.game.scene.getScene('Menu').textures.exists('cover_kitchen'));
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: `docs/images/cover/menu-${width}x${height}.png` });
    const title = await page.evaluate(() =>
      window.game.scene
        .getScene('Menu')
        .children.list.find((o) => o.list?.some((t) => t.text === '开始游戏'))
        ?.getBounds(),
    );
    console.log({ width, height, title });
  }
  if (errors.length) throw Error(errors.join('\n'));
  await page.evaluate(() => {
    const menu = window.game.scene.getScene('Menu');
    const button = menu.children.list.find((o) => o.list?.some((t) => t.text === '开始游戏'));
    if (!button) throw Error('Start button missing');
    button.emit('pointerup');
  });
  await page.waitForFunction(() => window.game.scene.isActive('CharSelect'));
  console.log('Start navigation passed; no browser errors.');
  await page.evaluate(async () => {
    const { save } = await import('/src/systems/Save.ts');
    save.clearedChapters = 1;
    save.seenVersion = '0.7.2';
    const { takeNewMilestones } = await import('/src/systems/Reveal.ts');
    takeNewMilestones();
    localStorage.setItem('tomato_sister_run_v1', JSON.stringify({ v: 1, charId: 'tomato', chapterId: 1, wave: 3 }));
    window.game.scene.stop('CharSelect');
    window.game.scene.start('Menu');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Menu'));
  await new Promise((r) => setTimeout(r, 300));
  await page.evaluate(() => {
    const scene = window.game.scene.getScene('Menu');
    const find = (list) => {
      for (const o of list) {
        if (o.label?.text === '知道了') return o;
        if (o.list) {
          const b = find(o.list);
          if (b) return b;
        }
      }
    };
    for (let i = 0; i < 12; i++) {
      const b = find(scene.children.list);
      if (!b) break;
      b.emit('pointerup');
    }
  });
  await new Promise((r) => setTimeout(r, 3500));
  await page.screenshot({ path: 'docs/images/cover/menu-continue-1280x720.png' });
  if (errors.length) throw Error(errors.join('\n'));
} finally {
  await browser.close();
}

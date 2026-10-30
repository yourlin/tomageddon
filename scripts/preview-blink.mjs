/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu'));
  const report = await page.evaluate(async () => {
    const scene = window.game.scene.getScene('Menu');
    const { readyArt } = await import('/src/systems/ArtRegistry.ts');
    const { SpriteVisual } = await import('/src/objects/SpriteVisual.ts');
    const art = readyArt(scene, { kind: 'char', id: 'tomato' });
    if (!art?.blinkKey) throw Error('Blink asset was not loaded at boot');
    const rig = new SpriteVisual(scene, art, 90);
    scene.add.existing(rig);
    rig.setPosition(300, 300);
    const check = (ok, msg) => {
      if (!ok) throw Error(msg);
    };
    rig.tick(6, 0, 1);
    check(rig.img.texture.key === art.blinkKey, 'Idle failed to close eyes');
    rig.play('frozen');
    rig.tick(10, 0, 1);
    check(rig.img.texture.key === art.blinkKey, 'Frozen eyelids advanced');
    rig.play('idle', true);
    rig.tick(0.13, 0, 1);
    check(rig.img.texture.key === art.texKey, 'Eyes failed to reopen');
    rig.tick(6, 1, -1);
    check(rig.img.texture.key === art.blinkKey, 'Moving failed to blink');
    rig.play('hurt');
    check(rig.img.texture.key === art.texKey, 'Hurt kept eyes closed');
    rig.resetVisual();
    check(rig.img.texture.key === art.texKey, 'Pool reset failed');
    const result = { blinkKey: art.blinkKey, idle: true, move: true, freeze: true, reopen: true, hurt: true, reset: true };
    rig.destroy();
    return result;
  });
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync('reports/art-pilot/blink-verification.json', JSON.stringify({ ...report, errors }, null, 2) + '\n');
  console.log(report);
} finally {
  await browser.close();
}

/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const [id, skinId] = process.argv.slice(2);
if (!/^[a-z0-9_]+$/.test(id ?? '') || !/^[a-z0-9_]+$/.test(skinId ?? '')) throw Error('Pass character and skin id');
const report = {
  id,
  skinId,
  scope:
    'Exact skin atlas, authored playback,100ms closedframe,shared texture,Game equipped identity,pause/resume,exit GPUrelease;not final physicalmobile or allwave visual acceptance.',
  cases: [],
  errors: [],
};
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  for (const tier of ['low', 'standard', 'high']) {
    const p = await browser.newPage();
    await freezeArtHmr(p);
    await p.setViewport({ width: 1280, height: 720 });
    p.on('pageerror', (e) => report.errors.push(e.stack || e.message));
    await p.evaluateOnNewDocument(
      ({ id, skinId, tier }) =>
        localStorage.setItem(
          'tomato_sister_save_v1',
          JSON.stringify({ saveVersion: 2, settings: { graphicsQuality: tier }, meta: { skins: [skinId], skinOf: { [id]: skinId } } }),
        ),
      { id, skinId, tier },
    );
    await p.goto('http://127.0.0.1:4183/?art=1&skins=1');
    await p.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    const playback = await p.evaluate(
      async ({ id, skinId, tier }) => {
        const g = window.game.scene.getScene('Menu');
        const { loadArt, releaseArt, unloadUnusedArt } = await import('/src/systems/ArtRegistry.ts');
        const { createEntityVisual } = await import('/src/objects/visualFactory.ts');
        const ident = { kind: 'char', id, skinId };
        await loadArt(g, { bodies: [ident] }, 'skin-probe');
        const v = createEntityVisual(g, ident, 40);
        g.add.existing(v);
        const entry = v.art?.choice.entry;
        if (v.mode !== 'spritesheet' || entry?.skinId !== skinId || v.art.choice.via !== 'exact')
          throw Error('Skin fell back/reused default');
        if (entry.source.frameWidth !== (tier === 'high' ? 256 : tier === 'low' ? 96 : 128)) throw Error('Wrong tier');
        const checks = [];
        for (const [state, a] of Object.entries(entry.anims)) {
          v.play(state, true);
          const seen = new Set([Number(v.img.frame.name)]);
          for (let i = 0; i < 4100; i++) {
            v.tick(0.001, state === 'move' ? 1 : 0, 1);
            seen.add(Number(v.img.frame.name));
          }
          if (a.frames.some((f) => !seen.has(f))) throw Error('Missing skin frame ' + state);
          checks.push({ state, uniqueFrames: new Set(a.frames).size });
        }
        v.play('idle', true);
        let closed = 0;
        for (let i = 0; i < 4000; i++) {
          if (Number(v.img.frame.name) === 3) closed++;
          v.tick(0.001, 0, 1);
        }
        if (closed !== 100) throw Error('Blink ' + closed);
        const copy = createEntityVisual(g, ident, 40);
        g.add.existing(copy);
        if (copy.img.texture !== v.img.texture) throw Error('Duplicate texture');
        const key = v.img.texture.key,
          gpu = v.img.texture.source[0].glTexture.webGLTexture;
        copy.destroy();
        v.destroy();
        releaseArt('skin-probe');
        unloadUnusedArt(g.textures);
        if (g.textures.exists(key) || g.game.renderer.gl.isTexture(gpu)) throw Error('Skin probe texture retained');
        return { checks, closedMilliseconds: closed, sharedTexture: true, gpuReleased: true };
      },
      { id, skinId, tier },
    );
    await p.evaluate(
      ({ id }) => {
        window.run.start(id, 1, false, 0);
        window.game.scene.stop('Menu');
        window.game.scene.start('Game');
      },
      { id },
    );
    await p.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game')?.player?.active, {
      timeout: 60000,
    });
    const game = await p.evaluate(
      ({ skinId }) => {
        const g = window.game.scene.getScene('Game');
        g.weapons.update = () => {};
        g.iframes = 100000;
        const v = g.player;
        if (v.art?.choice.entry.skinId !== skinId || v.ident.skinId !== skinId) throw Error('Equipped skin not used in Game');
        window.skinGpu = v.img.texture.source[0].glTexture.webGLTexture;
        window.skinKey = v.img.texture.key;
        return { equippedSkin: v.ident.skinId, mode: v.mode };
      },
      { skinId },
    );
    await p.evaluate(() => window.game.scene.pause('Game'));
    const clock = await p.evaluate(() => window.game.scene.getScene('Game').player.t);
    await new Promise((r) => setTimeout(r, 120));
    if ((await p.evaluate(() => window.game.scene.getScene('Game').player.t)) !== clock) throw Error('Skin advances during pause');
    await p.evaluate(() => window.game.scene.resume('Game'));
    await p.screenshot({ path: `reports/art-pilot/skin-${skinId}-${tier}.png` });
    await p.evaluate(() => {
      window.game.scene.getScenes(true).forEach((s) => window.game.scene.stop(s.scene.key));
      window.game.scene.start('Menu');
    });
    await p.waitForFunction(() => !window.game.textures.exists(window.skinKey) && !window.game.renderer.gl.isTexture(window.skinGpu));
    report.cases.push({ tier, ...playback, ...game, pauseHeld: true, gameExitGpuReleased: true });
    await p.close();
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  process.exitCode = 1;
} finally {
  writeFileSync(`reports/art-pilot/skin-${skinId}-animation-native.json`, JSON.stringify(report, null, 2));
  await closeArtBrowser(browser);
}

/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const id = process.argv[2];
const skinId = process.argv[3];
if (!/^[a-z_]+$/.test(id ?? '')) throw Error('Pass default character id');
if (skinId !== undefined && !/^[a-z0-9_]+$/.test(skinId)) throw Error('Invalid skin id');
const report = {
  id,
  skinId,
  status: 'pending',
  cases: [],
  errors: [],
  scope:
    'Character/skin move and available cast/charge/windup frames in three tiers; same source frames mirrored left, shared texture and GPU release. Visual anatomy/continuous acceptance is separate.',
};
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  for (const tier of ['low', 'standard', 'high']) {
    const page = await browser.newPage();
    await freezeArtHmr(page);
    page.on('pageerror', (e) => report.errors.push(e.message));
    await page.evaluateOnNewDocument(
      (tier) => localStorage.setItem('tomato_sister_save_v1', JSON.stringify({ saveVersion: 2, settings: { graphicsQuality: tier } })),
      tier,
    );
    await page.goto('http://127.0.0.1:4183/?art=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    const result = await page.evaluate(
      async ({ id, skinId, tier }) => {
        const scene = window.game.scene.getScene('Menu');
        const { loadArt, releaseArt, unloadUnusedArt } = await import('/src/systems/ArtRegistry.ts');
        const { createEntityVisual } = await import('/src/objects/visualFactory.ts');
        const ident = { kind: 'char', id, ...(skinId ? { skinId } : {}) };
        await loadArt(scene, { bodies: [ident] }, 'locomotion-probe');
        const right = createEntityVisual(scene, ident, 40),
          left = createEntityVisual(scene, ident, 40);
        scene.add.existing(right);
        scene.add.existing(left);
        if (right.mode !== 'spritesheet' || right.art.choice.entry.id !== id) throw Error('Wrong default identity');
        if (skinId && right.art.choice.entry.skinId !== skinId) throw Error('Skin fell back to another appearance');
        if (right.img.frame.width !== { high: 256, standard: 128, low: 96 }[tier]) throw Error('Wrong tier');
        if (right.img.texture !== left.img.texture) throw Error('Separate left texture allocated');
        const actions = [];
        for (const state of ['move', 'cast', 'charge', 'windup']) {
          if (!right.art.choice.entry.anims[state]) continue;
          // Actors intentionally start at random idle/move phases; compare equal clocks.
          right.t = left.t = 0;
          right.play(state, true);
          left.play(state, true);
          const seen = new Set();
          for (let i = 0; i < 200; i++) {
            right.tick(0.005, state === 'move' ? 1 : 0, 1);
            left.tick(0.005, state === 'move' ? 1 : 0, -1);
            seen.add(Number(right.img.frame.name));
            if (right.img.frame.name !== left.img.frame.name || right.img.flipX || !left.img.flipX)
              throw Error('Left playback not identical mirrored frames');
          }
          const required = right.art.choice.entry.anims[state].frames;
          if (required.some((frame) => !seen.has(frame))) throw Error('Missing authored frame: ' + state);
          actions.push({ state, frames: required });
        }
        const key = right.img.texture.key,
          gpu = right.img.texture.source[0].glTexture.webGLTexture;
        right.destroy();
        left.destroy();
        releaseArt('locomotion-probe');
        unloadUnusedArt(scene.textures);
        if (scene.textures.exists(key) || scene.game.renderer.gl.isTexture(gpu)) throw Error('Texture retained');
        return { tier, actions, sharedTexture: true, leftUsesMirroredRightFrames: true, gpuReleased: true };
      },
      { id, skinId, tier },
    );
    report.cases.push(result);
    await page.close();
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  process.exitCode = 1;
} finally {
  writeFileSync(`reports/art-pilot/direction-audit/${skinId ?? id}-runtime.json`, JSON.stringify(report, null, 2));
  await closeArtBrowser(browser);
}

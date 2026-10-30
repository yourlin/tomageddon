/* global window */
// Tests phase playback infrastructure with a labelled duplicate-texture fixture.
// Fixture frames never count as generated or accepted Boss phase art.
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  const report = await page.evaluate(async () => {
    const scene = window.game.scene.getScene('Menu');
    const { loadArt, releaseArt, unloadUnusedArt } = await import('/src/systems/ArtRegistry.ts');
    const { createEntityVisual } = await import('/src/objects/visualFactory.ts');
    await loadArt(scene, { bodies: [{ kind: 'boss', id: 'mold_king' }] }, 'phase-fixture');
    const v = createEntityVisual(scene, { kind: 'boss', id: 'mold_king' }, 60);
    scene.add.existing(v);
    const source = v.art.choice.entry.source,
      e = v.art.choice.entry,
      baseKey = v.art.texKey;
    const key = 'fixture:boss-phase';
    scene.textures.addSpriteSheet(key, scene.textures.get(baseKey).getSourceImage(), {
      frameWidth: source.frameWidth,
      frameHeight: source.frameHeight,
      margin: source.margin,
      spacing: source.spacing,
    });
    const form = { key, phase: 1, anchor: e.anchor, refRadius: e.refRadius, animation: { baseFrame: 0, anims: e.anims, mirror: false } };
    if (!v.setBossForm(form, 0.1)) throw Error('Animated form rejected');
    const checks = [];
    for (const state of ['idle', 'move', 'hurt', 'die', 'spawn', 'stun', 'attack', 'cast']) {
      v.play(state, true);
      const seen = new Set([String(v.img.frame.name)]),
        duration = { hurt: 0.28, die: 0.3, spawn: 0.35, attack: 0.22, cast: 0.45 }[state] ?? (state === 'idle' ? 4 : 0.4);
      for (let i = 1; i < 200; i++) {
        v.tick(duration / 200, state === 'move' ? 1 : 0, -1);
        seen.add(String(v.img.frame.name));
      }
      const expected = new Set(e.anims[state].frames.map(String));
      if (!v.hasAuthoredAnimation(state) || [...expected].some((f) => !seen.has(f))) throw Error('Phase frames missing ' + state);
      if (v.img.flipX) throw Error('Phase mirror setting ignored');
      checks.push({ state, frames: [...expected] });
    }
    v.play('idle', true);
    v.tick(0.03, 0, 1);
    const frame = v.img.frame.name,
      clock = v.t;
    v.play('frozen', true);
    v.tick(9, 0, 1);
    if (v.img.frame.name !== frame || v.t !== clock) throw Error('Frozen phase advanced');
    v.play('idle', true);
    v.tick(0.2, 0, 1);
    if (v.formGhost) throw Error('Blend ghost leaked');
    const staticKey = 'fixture:boss-static';
    scene.textures.addImage(staticKey, scene.textures.get(baseKey).getSourceImage());
    v.setBossForm({ key: staticKey, phase: 2, anchor: e.anchor, refRadius: e.refRadius }, 0);
    if (v.hasAuthoredAnimation('attack')) throw Error('Static phase claimed authored action');
    v.resetVisual();
    if (v.bossFormPhase !== 0 || v.img.texture.key !== baseKey || !v.hasAuthoredAnimation('attack')) throw Error('Pool reset failed');
    let deaths = 0;
    v.setBossForm(form, 0);
    v.die(() => deaths++);
    for (let i = 0; i < 20; i++) v.tick(0.05, 0, 1);
    if (deaths !== 1) throw Error('Death callback not exactly once');
    v.destroy();
    scene.textures.remove(key);
    scene.textures.remove(staticKey);
    releaseArt('phase-fixture');
    unloadUnusedArt(scene.textures);
    if (scene.textures.exists(baseKey)) throw Error('Body texture still retained after disposal');
    return {
      status: 'passed',
      fixtureOnly: true,
      productionPhaseArtVerified: false,
      checks,
      frozenClockHeld: true,
      blendGhostRemoved: true,
      staticFallback: true,
      poolReset: true,
      deathCallbacks: deaths,
      bodyReleased: true,
    };
  });
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync('reports/art-pilot/boss-phase-animation-api-native.json', JSON.stringify(report, null, 2) + '\n');
  console.log('Verified phase animation switching, frozen clock, static fallback, death, pooled reset and body release (fixture only).');
} finally {
  await closeArtBrowser(browser);
}

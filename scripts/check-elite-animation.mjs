/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const id = process.argv[2] ?? 'roach_general';
const kind = process.argv.includes('--enemy') ? 'enemy' : 'boss';
const category = kind === 'enemy' ? 'enemy' : 'elite';
if (!/^[a-z_]+$/.test(id)) throw Error('Invalid elite');
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const report = {
  id,
  scope:
    'Native compiled frame playback/100ms final idle frame, frozen clock and final GPU release; visible blink requires separate visual inspection. Real skill routing checked separately. Not final visual/mobile acceptance.',
  cases: [],
  errors: [],
};
try {
  for (const tier of ['low', 'standard', 'high']) {
    const p = await browser.newPage();
    await freezeArtHmr(p);
    await p.evaluateOnNewDocument(
      (t) => localStorage.setItem('tomato_sister_save_v1', JSON.stringify({ saveVersion: 2, settings: { graphicsQuality: t } })),
      tier,
    );
    await p.goto('http://127.0.0.1:4183/?art=1');
    await p.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    const r = await p.evaluate(
      async ({ id, tier, kind }) => {
        const g = window.game.scene.getScene('Menu');
        const { loadArt, releaseArt, unloadUnusedArt } = await import('/src/systems/ArtRegistry.ts');
        const { createEntityVisual } = await import('/src/objects/visualFactory.ts');
        await loadArt(g, { bodies: [{ kind, id }] }, 'elite-probe');
        const v = createEntityVisual(g, { kind, id }, 40);
        g.add.existing(v);
        const e = v.art.choice.entry,
          checks = [];
        for (const [state, a] of Object.entries(e.anims)) {
          v.play(state, true);
          const seen = new Set([Number(v.img.frame.name)]);
          for (let i = 0; i < 4100; i++) {
            v.tick(0.001, state === 'move' ? 1 : 0, 1);
            seen.add(Number(v.img.frame.name));
          }
          if (a.frames.some((f) => !seen.has(f))) throw Error('Missing authored frame ' + state);
          checks.push({ state, uniqueFrames: new Set(a.frames).size });
        }
        v.play('idle', true);
        let closed = 0;
        for (let i = 0; i < 4000; i++) {
          if (Number(v.img.frame.name) === 3) closed++;
          v.tick(0.001, 0, 1);
        }
        if (Math.abs(closed - 100) > 1) throw Error('Blink timing ' + closed);
        v.play('move', true);
        v.tick(0.02, 1, 1);
        const frame = v.img.frame.name,
          clock = v.t;
        v.play('frozen', true);
        v.tick(9, 0, 1);
        if (v.t !== clock || v.img.frame.name !== frame) throw Error('Freeze advanced');
        let sharedInstances = 1;
        if (kind === 'enemy') {
          const copies = Array.from({ length: 199 }, () => {
            const copy = createEntityVisual(g, { kind, id }, 18);
            g.add.existing(copy);
            copy.play('move', true);
            copy.tick(0.1, 1, 1);
            if (copy.img.texture !== v.img.texture) throw Error('Enemy instances duplicated atlas');
            return copy;
          });
          sharedInstances = 200;
          for (const copy of copies) copy.destroy();
        }
        const key = v.img.texture.key,
          tex = g.textures.get(key),
          src = tex.getSourceImage(),
          gpu = tex.source[0].glTexture.webGLTexture;
        if (e.source.frameWidth !== (tier === 'low' ? 96 : tier === 'standard' ? 128 : 256)) throw Error('Wrong quality tier');
        v.destroy();
        releaseArt('elite-probe');
        unloadUnusedArt(g.textures);
        if (g.textures.exists(key) || g.game.renderer.gl.isTexture(gpu)) throw Error('GPU retained');
        return {
          tier,
          checks,
          sharedInstances,
          closedMilliseconds: id === 'press_machine' ? null : closed,
          idleFinalFrameMilliseconds: closed,
          eyesConcealed: id === 'press_machine',
          atlas: [src.width, src.height],
          frozen: true,
          gpuReleased: true,
        };
      },
      { id, tier, kind },
    );
    report.cases.push(r);
    await p.close();
  }
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  throw e;
} finally {
  writeFileSync(`reports/art-pilot/${category}-${id}-animation-native.json`, JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

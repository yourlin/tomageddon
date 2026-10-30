/* global window */
// All chapter illustrations: scene leases. Failed illustrations: authored actor fallback.
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const procedural = process.argv.includes('--procedural');
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const report = {
  procedural,
  scope: 'Native comic illustration loading/release and failed-image actor animation fallback; not new comic illustration artwork.',
  chapters: [],
  fallback: [],
  errors: [],
};
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', (e) => report.errors.push(e.stack ?? e.message));
  const requests = [];
  page.on('request', (r) => {
    if (r.resourceType() === 'image') requests.push(r.url());
  });
  await page.goto(`http://127.0.0.1:4183/?lang=zh&art=${procedural ? 0 : 1}`);
  await page.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 60000 });
  await page.evaluate(async () => (await import('/src/systems/TexQueue.ts')).flushTex());
  const start = async (ch) => {
    await page.evaluate((ch) => {
      window.game.scene.getScenes(true).forEach((s) => window.game.scene.stop(s.scene.key));
      window.game.scene.start('Comic', { ch, next: 'Menu' });
    }, ch);
    await page.waitForFunction(
      (ch) => window.game.scene.isActive('Comic') && window.game.scene.getScene('Comic').cd?.ch === ch,
      { timeout: 30000 },
      ch,
    );
  };
  const leave = async () => {
    await page.evaluate(() => window.game.scene.getScene('Comic').finish());
    await page.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Comic'));
    await page.waitForFunction(() => !Object.keys(window.game.textures.list).some((k) => /^comic_(art|sheet)_/.test(k)));
  };
  for (let ch = 1; ch <= 7; ch++) {
    const begin = requests.length;
    await start(ch);
    const sample = await page.evaluate(() => {
      const s = window.game.scene.getScene('Comic');
      const keys = Object.keys(s.textures.list).filter((k) => /^comic_(art|sheet)_/.test(k));
      if (!keys.length) throw Error('No chapter illustration loaded');
      window.__comicGpu = keys.map((key) => ({ key, texture: s.textures.get(key).source[0].glTexture?.webGLTexture }));
      return { ch: s.cd.ch, keys, actors: s.live.length };
    });
    if (requests.slice(begin).some((u) => /\/entities\//.test(u))) throw Error('Illustrated comic loaded unnecessary actor art');
    await leave();
    const deleted = await page.evaluate(() => window.__comicGpu.every((r) => !window.game.renderer.gl.isTexture(r.texture)));
    if (!deleted) throw Error('Comic WebGL source retained after exit');
    report.chapters.push({ ...sample, gpuDeleted: deleted });
  }
  await page.setCacheEnabled(false);
  await page.setRequestInterception(true);
  page.on('request', (r) => (/\/runtime\/story\/ch\d+\/.*comic\.webp/.test(r.url()) ? r.abort() : r.continue()));
  for (const ch of [1, 2, 3, 4, 5, 6, 7, 1, 1]) {
    const begin = requests.length;
    await start(ch);
    const sample = await page.evaluate(async (procedural) => {
      const s = window.game.scene.getScene('Comic');
      const { COMICS } = await import('/src/data/comics.ts');
      const expected = COMICS[s.cd.ch].panels.flatMap((p) => p.actors ?? []);
      while (s.shown < 4) {
        if (!s.busy) s.advance();
        await new Promise((r) => setTimeout(r, 100));
      }
      await new Promise((r) => setTimeout(r, 800));
      const modes = s.live.map((l) => ({
        kind: l.rig.ident.kind,
        id: l.rig.ident.id,
        mode: l.rig.mode,
        radius: l.rig.radius,
        scale: l.rig.scaleX,
      }));
      if (modes.length !== expected.length)
        throw Error(
          `Missing fallback actors: ${modes.length}/${expected.length}; textures=${Object.keys(s.textures.list).filter((k) => /^comic_/.test(k))}`,
        );
      if (procedural && modes.some((a) => a.mode !== 'procedural')) throw Error('Forced procedural mode ignored');
      if (!procedural && modes.some((a) => a.kind === 'char' && a.mode !== 'spritesheet'))
        throw Error('Character still procedural in comic fallback');
      if (procedural) return { ch: s.cd.ch, modes, listeners: s.events.listenerCount('update') };
      const live = s.live.find((l) => l.rig.mode === 'spritesheet');
      live.anim = 'move';
      const actor = live.rig;
      actor.play('move', true);
      const first = actor.img.frame.name;
      await new Promise((r) => setTimeout(r, 120));
      const next = actor.img.frame.name;
      if (first === next) throw Error('Fallback actor did not animate');
      const listeners = s.events.listenerCount('update');
      window.__fallbackKeys = [...new Set(s.live.filter((l) => l.rig.mode === 'spritesheet').map((l) => l.rig.img.texture.key))];
      return { ch: s.cd.ch, modes, listeners, frames: [first, next] };
    }, procedural);
    if (procedural && requests.slice(begin).some((u) => /\/entities\//.test(u)))
      throw Error('Forced procedural fallback downloaded actor art');
    if (report.fallback.length === 0)
      await page.screenshot({ path: `reports/art-pilot/comic-fallback-${procedural ? 'procedural' : 'native'}.png` });
    await leave();
    if (!procedural) await page.waitForFunction(() => window.__fallbackKeys.every((k) => !window.game.textures.exists(k)));
    report.fallback.push(sample);
  }
  if (new Set(report.fallback.map((r) => r.listeners)).size !== 1) throw Error('Comic update listeners accumulated');
  if (report.errors.length) throw Error(JSON.stringify(report.errors));
  report.status = 'passed';
} catch (error) {
  report.errors.push(String(error));
  report.status = 'failed';
  throw error;
} finally {
  writeFileSync(`reports/art-pilot/comic-art-lifecycle-${procedural ? 'procedural' : 'native'}.json`, JSON.stringify(report, null, 2));
  await closeArtBrowser(browser);
}
console.log('Verified7 chapter texture leases/GPU release, authored actor fallback for7 chapters and3 chapter1 entries.');

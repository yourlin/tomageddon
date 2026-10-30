/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const report = {
  scope: 'Native combat-only loading, six variants, bounded shared pool and exit GPU release; desktop browser, not physical phone.',
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
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await freezeArtHmr(page);
    const requests = [];
    page.on('request', (r) => {
      if (r.url().includes('/juice/')) {
        if (!r.url().includes('?import') && !r.url().includes('?url')) requests.push(r.url());
      }
    });
    page.on('pageerror', (e) => report.errors.push(e.message));
    await page.evaluateOnNewDocument(
      (tier) => localStorage.setItem('tomato_sister_save_v1', JSON.stringify({ saveVersion: 2, settings: { graphicsQuality: tier } })),
      tier,
    );
    await page.goto('http://127.0.0.1:4183/?art=1');
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    if (requests.length) throw Error('Menu downloaded juice art');
    await page.evaluate(() => {
      window.run.start('tomato', 1, false, 0);
      window.game.scene.getScenes(true).forEach((s) => window.game.scene.stop(s.scene.key));
      window.game.scene.start('Game');
    });
    await page.waitForFunction(() => window.game.scene.getScene('Game')?.player?.active, { timeout: 60000 });
    const row = await page.evaluate(async (tier) => {
      const g = window.game.scene.getScene('Game');
      g.weapons.update = () => {};
      g.iframes = 100000;
      const { juiceArtKey } = await import('/src/systems/JuiceArt.ts');
      const key = juiceArtKey();
      if (!g.textures.exists(key)) throw Error('Missing juice atlas');
      const texture = g.textures.get(key);
      window.juiceProbeGpu = texture.source[0].glTexture.webGLTexture;
      window.juiceProbeKey = key;
      for (let i = 0; i < 300; i++)
        g.fx.splat(250 + (i % 6) * 120, 280 + (Math.floor(i / 6) % 3) * 90, [0xd54e3c, 0x76a842, 0xd9ae54][i % 3], 28);
      const pool = g.fx.splats;
      const frames = [...new Set(pool.map((x) => Number(x.frame.name)))];
      if (frames.length !== 6 || pool.length !== (tier === 'low' ? 40 : 90)) throw Error('Variants/pool mismatch');
      if (pool.some((x) => x.texture !== texture)) throw Error('Duplicated texture');
      if (new Set(pool.map((x) => x.rotation.toFixed(2))).size < 10) throw Error('Missing rotation variety');
      if (pool.some((x) => x.scaleX === x.scaleY)) throw Error('Missing aspect variety');
      // Exercise both red-pool producers, not only death decoration.
      for (const im of pool) im.setVisible(false);
      g.player.setPosition(600, 600);
      const { STYLES } = await import('/src/systems/SkillStyles.ts');
      const lingering = [];
      STYLES.tomato({
        g,
        host: { radius: (x) => x, linger: (x) => lingering.push(x) },
        sk: { radius: 180, color: 0xff3b30 },
        info: { dmg: 0, crit: false },
        status: [{ id: 'slow', dur: 3, stacks: 3 }],
        dir: { x: 1, y: 0 },
      });
      const skillPools = g.children.list.filter((x) => x.name === 'sauce-pool');
      if (skillPools.length !== 10 || skillPools[0].getData('radius') !== 180 * 1.3 * 0.45 || lingering[0].t !== 4)
        throw Error('Skill pool footprint/lifetime changed');
      const { Synergy } = await import('/src/systems/Synergy.ts');
      const syn = new Synergy(g);
      syn.zone(820, 600, 70, 3, { dmg: 0, crit: false }, 0xc1121f, false, true);
      const z = syn.zones[0];
      if (z.r !== 70 || z.t !== 3 || z.img.name !== 'sauce-pool') throw Error('Synergy pool geometry');
      for (const group of [...skillPools, z.img]) {
        const images = group.list.filter((x) => x.type === 'Image');
        if (images.length !== 3 || images.some((x) => x.texture.key !== key)) throw Error('Old circular sauce texture remains');
      }
      window.juiceProbeSynergy = syn;
      const src = texture.getSourceImage();
      return { tier, frames, pool: pool.length, sharedTexture: true, atlas: [src.width, src.height] };
    }, tier);
    await new Promise((r) => setTimeout(r, 700));
    await page.screenshot({ path: `reports/art-pilot/juice-${tier}.png` });
    await page.evaluate(() => {
      window.game.scene.stop('Game');
      window.game.scene.start('Menu');
    });
    await page.waitForFunction(
      () => !window.game.textures.exists(window.juiceProbeKey) && !window.game.renderer.gl.isTexture(window.juiceProbeGpu),
    );
    row.gpuReleased = true;
    row.sauceSkillPools = 10;
    row.sauceSynergyRadius = 70;
    row.oldFilledCircle = false;
    row.downloads = requests.length;
    if (requests.length !== 1) throw Error('Expected one atlas download');
    report.cases.push(row);
    await page.close();
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  process.exitCode = 1;
} finally {
  writeFileSync('reports/art-pilot/juice-native.json', JSON.stringify(report, null, 2));
  await closeArtBrowser(browser);
}

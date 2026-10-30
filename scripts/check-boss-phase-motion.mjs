/* global window */
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const actor = process.argv[2] ?? 'mold_king';
if (
  ![
    'mold_king',
    'grease_chef',
    'cockroach_emperor',
    'locust_queen',
    'rotten_pumpkin',
    'mole_general',
    'frost_rat_king',
    'ice_cream_tyrant',
    'freezer_heart',
    'trash_golem',
    'toxic_barrel',
    'scrap_dragon',
    'rotten_chef',
    'factory_core',
    'ketchup_leviathan',
    'blight_gardener',
    'rot_mother',
    'rot_king',
  ].includes(actor)
)
  throw Error('Unsupported Boss ' + actor);
const phaseIds = actor === 'rot_king' ? [1, 2, 3] : [1, 2];
const requiredActions = Object.fromEntries(
  phaseIds.map((phase) => [
    phase,
    JSON.parse(readFileSync(`docs/design/ART_${actor.toUpperCase()}_PHASE_${phase}_ANIMATION_PILOT.json`, 'utf8')).actions.map(
      (a) => a.name,
    ),
  ]),
);
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [],
    requests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (r.resourceType() === 'image') requests.push(r.url());
  });
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  const reports = await page.evaluate(
    async (actor, requiredActions) => {
      const scene = window.game.scene.getScene('Menu');
      const { loadArt, releaseArt, unloadUnusedArt } = await import('/src/systems/ArtRegistry.ts');
      const { queueCombatArt, bossForm } = await import('/src/systems/CombatArt.ts');
      const { createEntityVisual } = await import('/src/objects/visualFactory.ts');
      const { TIMED } = await import('/src/objects/visualTypes.ts');
      await loadArt(scene, { bodies: [{ kind: 'boss', id: actor }] }, 'boss-phase-preview');
      await new Promise((resolve) => {
        scene.load.once('complete', resolve);
        queueCombatArt(scene, 1, new Set([actor]));
        scene.load.start();
      });
      const reports = [];
      for (const phase of Object.keys(requiredActions).map(Number)) {
        const form = bossForm(scene, actor, phase);
        if (!form?.animation) throw Error('Phase still static ' + phase);
        const v = createEntityVisual(scene, { kind: 'boss', id: actor }, 65),
          other = createEntityVisual(scene, { kind: 'boss', id: actor }, 65);
        scene.add.existing(v);
        scene.add.existing(other);
        v.setPosition(400, 340);
        other.setPosition(850, 340);
        if (!v.setBossForm(form, 0.1) || !other.setBossForm(form, 0) || v.img.texture !== other.img.texture)
          throw Error('Phase texture not shared');
        const checks = [];
        for (const state of requiredActions[phase]) {
          v.play(state, true);
          const anim = form.animation.anims[state];
          if (!anim) throw Error('Missing action ' + state);
          const seen = new Set([String(v.img.frame.name)]),
            duration = TIMED[state] ?? (state === 'idle' ? 4 : 0.4);
          for (let i = 1; i < 200; i++) {
            v.tick(duration / 200, state === 'move' ? 1 : 0, 1);
            seen.add(String(v.img.frame.name));
          }
          const expected = new Set(anim.frames.map(String));
          if ([...expected].some((f) => !seen.has(f))) throw Error('Frame never displayed ' + state);
          checks.push({ state, authoredFrames: expected.size, displayed: [...seen] });
        }
        v.play('idle', true);
        v.tick(0.02, 0, 1);
        const frame = v.img.frame.name,
          clock = v.t;
        v.play('frozen', true);
        v.tick(9, 0, 1);
        if (frame !== v.img.frame.name || clock !== v.t) throw Error('Frozen phase advanced');
        v.resetVisual();
        const count = v.list.length;
        for (let i = 0; i < 20; i++) {
          v.setBossForm(form, 0.3);
          v.tick(0.05, 0, 1);
          v.resetVisual();
          if (v.bossFormPhase || v.formGhost || v.list.length !== count) throw Error('Pooled phase reset leaked');
        }
        v.setBossForm(form, 0);
        let deaths = 0;
        v.die(() => deaths++);
        for (let i = 0; i < 20; i++) v.tick(0.05, 0, 1);
        if (deaths !== 1) throw Error('Death callback count');
        reports.push({
          phase,
          status: 'passed',
          checks,
          frozenClockHeld: true,
          sharedTexture: true,
          midBlendResets: 20,
          deathCallbacks: deaths,
          key: form.key,
        });
        v.destroy();
        other.destroy();
      }
      releaseArt('boss-phase-preview');
      unloadUnusedArt(scene.textures);
      const gl = scene.game.renderer.gl;
      window.__phaseRelease = reports.map((r) => ({ key: r.key, glTexture: scene.textures.get(r.key).source[0].glTexture?.webGLTexture }));
      window.__phaseGL = gl;
      if (window.__phaseRelease.some((r) => !r.glTexture || !gl.isTexture(r.glTexture)))
        throw Error('Phase GPU texture was never allocated');
      scene.scene.start('CharSelect');
      return reports;
    },
    actor,
    requiredActions,
  );
  await page.waitForFunction(() => window.__phaseRelease.every((r) => !window.game.textures.exists(r.key)), { timeout: 10000 });
  const released = await page.evaluate(() =>
    window.__phaseRelease.map((r) => ({
      key: r.key,
      textureRemoved: !window.game.textures.exists(r.key),
      gpuDeleted: !window.__phaseGL.isTexture(r.glTexture),
    })),
  );
  if (errors.length || released.some((r) => !r.textureRemoved || !r.gpuDeleted)) throw Error(JSON.stringify({ errors, released }));
  if (requests.some((u) => new RegExp('/boss/(?!' + actor + '/)').test(u))) throw Error('Unselected Boss downloaded');
  if (requests.some((u) => new RegExp(actor + '/phase-[0-9]+/standard/body').test(u))) throw Error('Unused static phase downloaded');
  for (const r of reports)
    writeFileSync(`reports/art-pilot/${actor}-phase-${r.phase}-motion-native.json`, JSON.stringify(r, null, 2) + '\n');
  writeFileSync(
    `reports/art-pilot/${actor}-phase-loading-native.json`,
    JSON.stringify({ status: 'passed', requests, released }, null, 2) + '\n',
  );
  console.log(
    'Verified',
    actor,
    reports.reduce((n, r) => n + r.checks.reduce((m, c) => m + c.authoredFrames, 0), 0),
    'drawn phase frames, frozen clock, shared textures, pooled reset, death and GPU release.',
  );
} finally {
  await closeArtBrowser(browser);
}

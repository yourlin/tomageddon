/* global window */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { freezeArtHmr } from './art-browser.mjs';
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  const weaponRequests = [];
  const requests = [],
    errors = [];
  page.on('request', (r) => {
    if (['image', 'xhr', 'fetch'].includes(r.resourceType()) && /\/weapons\//.test(r.url()) && /\.webp(?:\?|$)/.test(r.url()))
      weaponRequests.push(r.url());
    if (['xhr', 'fetch', 'image'].includes(r.resourceType()) && /\/(projectile|mine|primary)\.webp/.test(r.url())) requests.push(r.url());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  if (requests.length) throw Error('Menu downloaded combat projectiles');
  if (weaponRequests.length) throw Error(`Menu eagerly downloaded weapon illustrations: ${weaponRequests.slice(0, 5).join(', ')}`);
  await page.evaluate(() => {
    window.run.start('tomato', 1, false, 0);
    window.run.addWeapon('pea_shooter', 1);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  const wave = await page.evaluate(() => {
    const game = window.game;
    game.scene.pause('Game');
    const keys = game.textures.getTextureKeys();
    const projectiles = keys.flatMap((key) => {
      const id = game.textures.get(key).customData.illustratedProjectile;
      return id ? [id] : [];
    });
    const bossBodies = keys.filter((key) => key.startsWith('art:boss/'));
    const forms = keys.filter((key) => key.startsWith('combat:') && key.includes('/forms/'));
    const laterBodies = keys.filter((key) => key.startsWith('art:enemy/fly@') || key.startsWith('art:enemy/rotten_apple@'));
    return { projectiles, bossBodies, forms, laterBodies };
  });
  if (!wave.projectiles.includes('player_pea_shooter') || wave.projectiles.includes('player_chili_rocket'))
    throw Error('Wrong equipped weapon dependencies');
  if (wave.projectiles.length >= 202 || wave.bossBodies.length || wave.forms.length || wave.laterBodies.length)
    throw Error('Unneeded future-wave art loaded');
  await page.evaluate(() => {
    window.game.scene.stop('Hud');
    window.game.scene.getScene('Game').scene.start('Menu');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Game'));
  await page.evaluate(() => new Promise((resolve) => window.game.events.once('poststep', () => resolve())));
  const released = await page.evaluate(() => {
    const textures = window.game.textures;
    return {
      authored: textures.getTextureKeys().filter((key) => textures.get(key).customData.illustratedProjectile),
      commonFallback: textures.exists('proj_player'),
      enemyBodies: textures.getTextureKeys().filter((key) => key.startsWith('art:enemy/')),
    };
  });
  if (released.authored.length || released.enemyBodies.length || !released.commonFallback)
    throw Error('Wave art not released or fallback lost');
  await page.evaluate(() => {
    window.run.wave = window.run.waveCount;
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game').marks.some((m) => m.boss), {
    timeout: 60000,
  });
  const bossWave = await page.evaluate(() => {
    const game = window.game;
    const scene = game.scene.getScene('Game');
    game.scene.pause('Game');
    const planned = scene.waveBossIds;
    const spawned = scene.marks.filter((m) => m.boss).map((m) => m.id);
    const bodies = game.textures.getTextureKeys().filter((key) => key.startsWith('art:boss/'));
    if (planned.length !== 1 || spawned[0] !== planned[0]) throw Error('Boss selection changed between preload and spawn');
    if (!bodies.some((key) => key.startsWith(`art:boss/${planned[0]}@`))) throw Error('Selected boss body missing');
    if (bodies.some((key) => !key.startsWith(`art:boss/${planned[0]}@`))) throw Error('Unselected boss body loaded');
    return { planned, spawned, bodies };
  });
  await page.evaluate(() => {
    window.game.scene.stop('Hud');
    window.game.scene.getScene('Game').scene.start('Menu');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Game'));
  await page.evaluate(() => new Promise((resolve) => window.game.events.once('poststep', () => resolve())));
  await page.evaluate(() => {
    const textures = window.game.textures;
    const remaining = textures
      .getTextureKeys()
      .filter(
        (key) =>
          key.startsWith('art:boss/') ||
          key.startsWith('art:enemy/') ||
          (key.startsWith('combat:') && key.includes('/forms/')) ||
          textures.get(key).customData.illustratedProjectile,
      );
    if (remaining.length) throw Error(`Boss wave resources retained: ${remaining.join(',')}`);
  });
  await page.evaluate(async () => {
    const { queueProjectileArt } = await import('/src/systems/ProjectileArtRegistry.ts');
    const game = window.game;
    for (const key of ['ArtLeaseA', 'ArtLeaseB']) {
      game.scene.add(
        key,
        {
          preload() {
            queueProjectileArt(this, new Set(['player_pea_shooter']));
          },
          create() {
            this.add.image(20, 20, 'proj_pea_shooter');
            window[key] = true;
          },
        },
        true,
      );
      await new Promise((resolve) => {
        const check = () => {
          if (window[key]) resolve();
          else window.requestAnimationFrame(check);
        };
        check();
      });
    }
    const texture = game.textures.get('proj_pea_shooter');
    window.__leaseTexture = texture;
    window.__leaseGL = texture.source[0].glTexture?.webGLTexture;
    game.scene.stop('ArtLeaseA');
    await new Promise((resolve) => game.events.once('poststep', () => resolve()));
    if (!game.textures.exists('proj_pea_shooter') || game.textures.get('proj_pea_shooter') !== texture)
      throw Error('Shared texture released while scene B still uses it');
    game.scene.stop('ArtLeaseB');
    await new Promise((resolve) => game.events.once('poststep', () => resolve()));
    if (game.textures.exists('proj_pea_shooter')) throw Error('Final owner did not release texture');
    if (!game.renderer.gl || !window.__leaseGL) throw Error('WebGL texture probe unavailable');
    if (game.renderer.gl.isTexture(window.__leaseGL)) throw Error('WebGL texture still allocated after release');
    window.__leaseTexture = null;
    window.__leaseGL = null;
  });
  const weaponLease = await page.evaluate(async () => {
    const { queueWeaponArt, requestWeaponArt } = await import('/src/systems/WeaponArtRegistry.ts');
    const game = window.game;
    const id = 'pea_shooter';
    // Isolate this loader check from the still-pinned legacy boot path.
    game.registry.get('art.legacyPinnedWeapons')?.delete(id);
    for (const key of [`weapon_${id}`, `icon_weapon_${id}`]) game.textures.remove(key);
    for (const name of ['WeaponLeaseA', 'WeaponLeaseB']) {
      game.scene.add(
        name,
        {
          preload() {
            queueWeaponArt(this, new Set([id]));
          },
          create() {
            this.add.image(50, 50, `weapon_${id}`);
            window[name] = true;
          },
        },
        true,
      );
      await new Promise((resolve) => {
        const check = () => (window[name] ? resolve() : window.requestAnimationFrame(check));
        check();
      });
    }
    const texture = game.textures.get(`weapon_${id}`);
    const glTexture = texture.source[0].glTexture?.webGLTexture;
    if (texture.customData.illustratedWeapon !== id) throw Error('Scoped weapon art missing');
    if (game.textures.exists(`weapon-art-source:${id}`)) throw Error('Weapon input texture retained');
    game.scene.stop('WeaponLeaseA');
    await new Promise((resolve) => game.events.once('poststep', resolve));
    if (game.textures.get(`weapon_${id}`) !== texture) throw Error('Shared weapon released too early');
    game.scene.stop('WeaponLeaseB');
    await new Promise((resolve) => game.events.once('poststep', resolve));
    if (game.textures.get(`weapon_${id}`).customData.illustratedWeapon) throw Error('Weapon illustration retained');
    if (!game.textures.exists(`icon_weapon_${id}`)) throw Error('Weapon fallback icon missing');
    if (!glTexture || game.renderer.gl.isTexture(glTexture)) throw Error('Weapon GPU texture not released');
    game.scene.add(
      'WeaponAsyncUI',
      {
        create() {
          this.probe = this.add.image(50, 50, `weapon_${id}`).setDisplaySize(73, 29);
          for (let i = 0; i < 20; i++) requestWeaponArt(this, new Set([id]));
          const event = `filecomplete-image-weapon-art-source:${id}`;
          if (this.load.listenerCount(event) !== 1) throw Error('Duplicate UI completion listeners');
        },
      },
      true,
    );
    await new Promise((resolve, reject) => {
      const end = performance.now() + 10000;
      const check = () => {
        const ui = game.scene.getScene('WeaponAsyncUI');
        if (ui.probe?.texture.customData.illustratedWeapon === id) return resolve();
        if (performance.now() > end) return reject(Error('Async weapon image did not refresh'));
        window.requestAnimationFrame(check);
      };
      check();
    });
    const probe = game.scene.getScene('WeaponAsyncUI').probe;
    if (Math.abs(probe.displayWidth - 73) > 0.01 || Math.abs(probe.displayHeight - 29) > 0.01)
      throw Error('Async image dimensions changed');
    game.scene.stop('WeaponAsyncUI');
    await new Promise((resolve) => game.events.once('poststep', resolve));
    if (game.textures.get(`weapon_${id}`).customData.illustratedWeapon) throw Error('Async UI leaked illustration');
    return {
      id,
      sharedRetention: true,
      finalOwnerGLRelease: true,
      fallbackRestored: true,
      asyncRefresh: true,
      deduplicatedRequests: 20,
      displaySizePreserved: true,
    };
  });
  if (errors.length) throw Error(errors.join('\n'));
  mkdirSync('reports/art-pilot', { recursive: true });
  writeFileSync(
    'reports/art-pilot/scene-art-loading-native.json',
    JSON.stringify(
      {
        status: 'passed',
        menuProjectileDownloads: 0,
        wave,
        bossWave,
        weaponLease,
        released,
        sharedOwnerRetention: true,
        finalOwnerWebGLRelease: true,
        projectileRequests: requests,
      },
      null,
      2,
    ) + '\n',
  );
  console.log('Verified menu zero projectile downloads, first-wave dependencies, exit cleanup, shared owners and final WebGL deletion.');
} finally {
  await browser.close();
}

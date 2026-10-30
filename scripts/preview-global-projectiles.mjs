/* global window */
import puppeteer from 'puppeteer-core';
import { freezeArtHmr } from './art-browser.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const arts = JSON.parse(readFileSync('src/data/projectileArt.generated.json', 'utf8'));
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
mkdirSync('docs/images/art-global', { recursive: true });
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  page.setDefaultTimeout(60000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu'));
  await page.evaluate(async () => {
    const { queueProjectileArt } = await import('/src/systems/ProjectileArtRegistry.ts');
    const scene = window.game.scene.getScene('Menu');
    queueProjectileArt(scene); // 图鉴验收显式请求全量；启动场景不再预载。
    await new Promise((resolve) => {
      scene.load.once('complete', resolve);
      scene.load.start();
    });
  });
  const baked = [];
  for (let offset = 0; offset < arts.length; offset += 8) {
    const batch = await page.evaluate(
      async (arts) => {
        const { flushTex } = await import('/src/systems/TexQueue.ts');
        flushTex();
        const scene = window.game.scene.getScene('Menu');
        scene.children.removeAll(true);
        scene.cameras.main.setBackgroundColor('#211924');
        const checks = [];
        for (const [i, a] of arts.entries()) {
          if (!scene.textures.exists(a.key)) throw Error('Projectile missing ' + a.id);
          const source = scene.textures.get(a.key).getSourceImage();
          if (source.width !== a.size[0] || source.height !== a.size[1]) throw Error('Wrong baked size ' + a.id);
          const pixels = source.getContext('2d').getImageData(0, 0, source.width, source.height).data;
          let visible = 0;
          for (let p = 3; p < pixels.length; p += 4) if (pixels[p] > 64) visible++;
          if (!visible) throw Error('Empty projectile ' + a.id);
          if (scene.textures.exists(`projectile-art-source:${a.id}`)) throw Error('Large source retained ' + a.id);
          const x = 165 + (i % 4) * 305,
            y = 140 + Math.floor(i / 4) * 300;
          scene.add.image(x, y, a.key).setScale(3);
          scene.add.image(x, y + 130, a.key);
          scene.add.text(x, y + 175, a.id, { fontSize: '18px', color: '#f7ddb5' }).setOrigin(0.5);
          checks.push({ id: a.id, key: a.key, visiblePixels: visible, sourceReleased: true });
        }
        return checks;
      },
      arts.slice(offset, offset + 8),
    );
    baked.push(...batch);
    await page.screenshot({ path: `docs/images/art-global/projectiles-page${offset / 8 + 1}.png` });
    if (offset === 0) await page.screenshot({ path: 'docs/images/art-global/projectiles.png' });
  }
  await page.evaluate((arts) => {
    window.game.scene.getScene('Game').constructor.sandbox = { terrain: false, deaths: 0 };
    window.run.start('tomato', 2, false, 0);
    window.run.weapons = arts.filter((a) => a.id.startsWith('player_')).map((a) => ({ id: a.id.slice(7), tier: 0 }));
    window.game.scene.getScenes(true).forEach((s) => window.game.scene.stop(s.scene.key));
    window.game.scene.start('Game');
  }, arts);
  await page.waitForFunction(() => window.game.scene.getScene('Game')?.player?.active);
  const ownerRoutes = await page.evaluate(async (arts) => {
    const { ENEMY_MAP } = await import('/src/data/enemies.ts');
    const { BOSS_MAP } = await import('/src/data/bosses.ts');
    const g = window.game.scene.getScene('Game');
    const updateWeapons = g.weapons.update;
    g.weapons.update = () => {};
    g.iframes = 10000;
    const checks = [];
    for (const a of arts.filter((a) => a.id.startsWith('enemy_'))) {
      const id = a.id.slice(6);
      if (!ENEMY_MAP[id] && !BOSS_MAP[id]) throw Error('Unknown projectile owner ' + id);
      const e = BOSS_MAP[id] ? g.spawnBossNow(id, 900, 650, []) : g.spawnEnemyNow(id, 900, 650, []);
      e.speed = 0;
      e.actT = 9999;
      const shoot = () => {
        g.enemyBullets.forEach((b) => b.kill());
        g.enemyShoot(e, 1, 0, 220, 7, 0, 'proj_enemy');
        return g.enemyBullets.find((b) => b.alive);
      };
      const b = shoot();
      if (b.texture.key !== a.key) throw Error('Owner projectile route failed ' + id);
      const physics = (b) => ({ radius: b.radius, vx: b.vx, vy: b.vy, dmg: b.dmg, life: b.life });
      const actual = physics(b);
      window.__art.procedural(true);
      const expected = physics(shoot());
      window.__art.procedural(false);
      if (JSON.stringify(actual) !== JSON.stringify(expected)) throw Error('Owner physics changed ' + id);
      checks.push({ id, key: a.key, actual, expected });
      g.enemyBullets.forEach((b) => b.kill());
      e.kill(g, false);
    }
    g.weapons.update = updateWeapons;
    return checks;
  }, arts);
  const enemy = await page.evaluate(async () => {
    const g = window.game.scene.getScene('Game');
    g.iframes = 10000;
    g.player.setPosition(650, 650);
    const e = g.spawnEnemyNow('thorn_weed', 800, 650, []);
    e.speed = 0;
    e.hp = e.maxHp = 100000;
    e.actT = 999;
    const shot = () => {
      g.enemyShoot(e, 1, 0, 220, 7, 0, 'proj_enemy');
      return g.enemyBullets.find((b) => b.alive);
    };
    const b = shot();
    if (b.texture.key !== 'proj_enemy_thorn_weed') throw Error('Enemy live route missing');
    const actual = { radius: b.radius, vx: b.vx, vy: b.vy, dmg: b.dmg, life: b.life };
    b.kill();
    window.__art.procedural(true);
    const baseline = shot();
    const expected = { radius: baseline.radius, vx: baseline.vx, vy: baseline.vy, dmg: baseline.dmg, life: baseline.life };
    if (JSON.stringify(actual) !== JSON.stringify(expected)) throw Error('Enemy projectile physics changed');
    baseline.kill();
    window.__art.procedural(false);
    return { key: 'proj_enemy_thorn_weed', actual, expected };
  });
  await page.waitForFunction(() =>
    window.game.scene.getScene('Game').bullets.some((b) => b.alive && b.src === 'pea_shooter' && b.texture.key === 'proj_pea_shooter'),
  );
  const player = await page.evaluate(() => {
    const g = window.game.scene.getScene('Game');
    const b = g.bullets.find((b) => b.alive && b.src === 'pea_shooter');
    return { key: b.texture.key, radius: b.radius, dmg: b.dmg, pierce: b.pierce };
  });
  const playerRoutes = await page.evaluate(() => {
    const g = window.game.scene.getScene('Game');
    const target = g.enemies.find((e) => e.alive);
    if (!target) throw Error('Missing live projectile target');
    return g.weapons.list.map((w) => {
      g.bullets.forEach((b) => b.kill());
      w.animAngle = 0;
      w.mods = null;
      w.shot = null;
      g.weapons.fire(w, 650, 650, target, 600);
      const b = g.bullets.find((b) => b.alive && b.src === w.def.id);
      if (!b || b.texture.key !== `proj_${w.def.id}`) throw Error('Player projectile route failed ' + w.def.id);
      const radius = w.def.kind === 'flame' ? 12 : 9;
      const speed = w.def.projSpeed ?? 600;
      if (b.radius !== radius || Math.abs(Math.hypot(b.vx, b.vy) - speed) > 0.001)
        throw Error('Player projectile physics changed ' + w.def.id);
      if (b.tintTopLeft !== 0xffffff) throw Error('Authored projectile tinted ' + w.def.id);
      return { id: w.def.id, key: b.texture.key, kind: b.kind, radius: b.radius, speed, life: b.life };
    });
  });
  if (errors.length) throw Error(errors.join('\n'));
  writeFileSync(
    'reports/art-pilot/global-projectiles-verification.json',
    JSON.stringify({ baked, ownerRoutes, playerRoutes, enemy, player, errors }, null, 2) + '\n',
  );
  console.log(`Verified ${arts.length} baked textures, enemy owner route, player weapon route and unchanged enemy projectile physics.`);
} finally {
  await browser.close();
}

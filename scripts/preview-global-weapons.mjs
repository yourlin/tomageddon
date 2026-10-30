/* global window */
import puppeteer from 'puppeteer-core';
import { freezeArtHmr } from './art-browser.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const arts = JSON.parse(readFileSync('src/data/weaponArt.generated.json', 'utf8'));
mkdirSync('docs/images/art-global', { recursive: true });
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
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
    const { queueProjectileArt, PROJECTILE_ART } = await import('/src/systems/ProjectileArtRegistry.ts');
    const scene = window.game.scene.getScene('Menu');
    queueProjectileArt(scene, new Set(PROJECTILE_ART.filter((a) => a.id.startsWith('mine_')).map((a) => a.id)));
    await new Promise((resolve) => {
      scene.load.once('complete', resolve);
      scene.load.start();
    });
  });
  const checks = [];
  for (let offset = 0; offset < arts.length; offset += 8) {
    const batch = await page.evaluate(
      async (arts) => {
        const { flushTex } = await import('/src/systems/TexQueue.ts');
        flushTex();
        const { WEAPON_MAP } = await import('/src/data/weapons.ts');
        const scene = window.game.scene.getScene('Menu');
        const result = [];
        scene.children.removeAll(true);
        scene.cameras.main.setBackgroundColor('#211924');
        for (const [i, a] of arts.entries()) {
          const body = scene.textures.get(`weapon_${a.id}`),
            icon = scene.textures.get(`icon_weapon_${a.id}`);
          if (body.getSourceImage().width !== 256 || icon.getSourceImage().width !== 256) throw Error('Baked art missing: ' + a.id);
          const source = body.getSourceImage();
          const pixels = source.getContext('2d').getImageData(0, 0, source.width, source.height).data;
          let visiblePixels = 0;
          for (let pixel = 3; pixel < pixels.length; pixel += 4) if (pixels[pixel] > 64) visiblePixels++;
          if (visiblePixels < 50) throw Error('Empty weapon after runtime compilation: ' + a.id);
          if (scene.textures.exists(`weapon-art-source:${a.id}`)) throw Error('Original large texture retained: ' + a.id);
          const x = 170 + (i % 4) * 305,
            y = 140 + Math.floor(i / 4) * 330;
          scene.add.image(x, y, `icon_weapon_${a.id}`).setDisplaySize(150, 150);
          scene.add.image(x, y + 115, `weapon_${a.id}`).setDisplaySize(116, 58);
          scene.add.text(x, y + 160, WEAPON_MAP[a.id].name, { fontSize: '20px', color: '#f6d6a5' }).setOrigin(0.5);
          scene.add.text(x, y + 188, a.id, { fontSize: '12px', color: '#b59c88' }).setOrigin(0.5);
          if (
            WEAPON_MAP[a.id].kind === 'mine' &&
            (scene.textures.get(`mine_${a.id}`).customData.illustratedProjectile !== `mine_${a.id}` ||
              scene.textures.get(`mine_${a.id}`).getSourceImage().width !== 48)
          )
            throw Error('Mine art missing ' + a.id);
          result.push({
            id: a.id,
            body: [body.getSourceImage().width, body.getSourceImage().height],
            icon: [icon.getSourceImage().width, icon.getSourceImage().height],
            sourceReleased: true,
            visiblePixels,
          });
        }
        return result;
      },
      arts.slice(offset, offset + 8),
    );
    checks.push(...batch);
    await page.screenshot({ path: `docs/images/art-global/weapons-page${offset / 8 + 1}.png` });
    if (offset === 0) await page.screenshot({ path: 'docs/images/art-global/weapons.png' });
  }

  // 用实际 WeaponSystem 构造与武器环绕显示验证手持纹理，覆盖近战和远程。
  const live = await page.evaluate(
    async (ids) => {
      window.game.scene.getScene('Game').constructor.sandbox = { terrain: false, deaths: 0 };
      window.run.start('tomato', 1, false, 0);
      window.run.weapons = ids.map((id) => ({ id, tier: 0 }));
      window.game.scene.getScenes(true).forEach((s) => window.game.scene.stop(s.scene.key));
      window.game.scene.start('Game');
      return true;
    },
    arts.map((a) => a.id),
  );
  await page.waitForFunction(() => window.game.scene.getScene('Game')?.weapons?.list?.length > 0);
  const equipped = await page.evaluate(() =>
    window.game.scene
      .getScene('Game')
      .weapons.list.map((w) => ({ id: w.def.id, key: w.sprite.texture.key, width: w.sprite.width, displayWidth: w.sprite.displayWidth })),
  );
  if (equipped.some((w) => w.width !== 256)) throw Error('Gameplay still using fallback weapon');
  const deployedMines = await page.evaluate(() => {
    const g = window.game.scene.getScene('Game');
    return g.weapons.list
      .filter((w) => w.def.kind === 'mine')
      .map((w) => {
        g.weapons.placeMine(w, 160);
        const mine = w.mines.find((m) => m.alive);
        if (!mine || mine.img.texture.key !== `mine_${w.def.id}` || mine.img.width !== 48)
          throw Error('Deployed mine art missing ' + w.def.id);
        return { id: w.def.id, key: mine.img.texture.key, arm: mine.arm, width: mine.img.width };
      });
  });
  writeFileSync(
    'reports/art-pilot/global-weapons-verification.json',
    JSON.stringify({ checks, equipped, deployedMines, live, errors }, null, 2) + '\n',
  );
  if (errors.length) throw Error(errors.join('\n'));
  console.log(`Verified ${checks.length} baked weapons, icons, released sources and actual equipped sprites.`);
} finally {
  await browser.close();
}

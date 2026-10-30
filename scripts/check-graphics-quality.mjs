/* global window */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser, closeArtContext } from './art-browser.mjs';

const actor = process.argv[2] ?? 'tomato';
const kind = [
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
  ? 'boss'
  : 'char';
const phases = process.argv.includes('--boss-phases');
if (phases && kind !== 'boss') throw Error('Phase checks require a Boss');
if (
  ![
    'tomato',
    'carrot',
    'chili',
    'corn',
    'watermelon',
    'lemon',
    'eggplant',
    'garlic',
    'blueberry',
    'pineapple',
    'pumpkin',
    'strawberry',
    'ginger',
    'avocado',
    'onion',
    'mushroom',
    'coconut',
    'grape',
    'cherry',
    'pea',
    'peach',
    'dragonfruit',
    'beet',
    'asparagus',
    'sweetpotato',
    'kiwi',
    'lychee',
    'durian',
    'bellpepper',
    'wintermelon',
    'bittermelon',
    'sprout',
    'wasabi',
    'soybean',
    'jackfruit',
    'pomegranate',
    'taro',
    'cabbage',
    'blackberry',
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
  throw Error('Unsupported actor');
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const cases = [
  {
    name: 'phone-low',
    tier: 'low',
    frame: 96,
    viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  },
  {
    name: 'phone-standard',
    tier: 'standard',
    frame: 128,
    viewport: { width: 932, height: 430, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  },
  {
    name: 'desktop-high',
    tier: 'high',
    frame: actor === 'rot_king' ? 320 : 256,
    viewport: { width: 2560, height: 1440, deviceScaleFactor: 1 },
  },
  {
    name: 'ultrawide-high',
    tier: 'high',
    frame: actor === 'rot_king' ? 320 : 256,
    viewport: { width: 3440, height: 1440, deviceScaleFactor: 1 },
  },
];
const results = [];
try {
  for (const test of cases) {
    const context = await browser.createBrowserContext();
    try {
      const page = await context.newPage();
      await freezeArtHmr(page);
      await page.setViewport(test.viewport);
      const imageRequests = [];
      page.on('request', (request) => {
        if (['image', 'xhr', 'fetch'].includes(request.resourceType()) && /\/motion(?:-low|-standard)?\.webp/.test(request.url()))
          imageRequests.push(request.url());
      });
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.evaluateOnNewDocument((tier) => {
        if (window.location.origin !== 'http://127.0.0.1:4183') return;
        window.localStorage.setItem(
          'tomato_sister_save_v1',
          JSON.stringify({ settings: { graphicsQuality: tier, hiDpi: true }, saveVersion: 2 }),
        );
      }, test.tier);
      await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
      await page.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 60000 });
      await page.waitForFunction(
        () => {
          const loader = window.document.getElementById('boot-loader');
          return !loader || window.getComputedStyle(loader).opacity === '0' || window.getComputedStyle(loader).display === 'none';
        },
        { timeout: 60000 },
      );
      const result = await page.evaluate(
        async ({ actor, kind, phases }) => {
          const { readyArt, loadArt } = await import('/src/systems/ArtRegistry.ts');
          const game = window.game;
          // Read the running game's allocation, not a second Vite module instance.
          const renderScale = game.config.height / 720;
          const scene = game.scene.getScene('Menu');
          await loadArt(scene, { bodies: [{ kind, id: actor }] }, 'quality-check');
          const art = readyArt(scene, { kind, id: actor });
          const image = game.textures.get(art.texKey).getSourceImage();
          const phaseChecks = [];
          if (phases) {
            const { queueCombatArt, bossForm } = await import('/src/systems/CombatArt.ts');
            await new Promise((resolve) => {
              scene.load.once('complete', resolve);
              queueCombatArt(scene, 1, new Set([actor]));
              scene.load.start();
            });
            for (const phase of actor === 'rot_king' ? [1, 2, 3] : [1, 2]) {
              const form = bossForm(scene, actor, phase);
              if (!form?.animation) throw Error('Phase has no authored animation');
              const texture = game.textures.get(form.key),
                frame = texture.get(form.animation.baseFrame),
                im = texture.getSourceImage();
              phaseChecks.push({
                phase,
                key: form.key,
                frameWidth: frame.realWidth,
                textureSize: [im.width, im.height],
                rgbaBytes: im.width * im.height * 4,
              });
            }
          }
          const rect = game.canvas.getBoundingClientRect();
          scene.input.once('pointerdown', (pointer) => {
            window.__qualityPointer = { x: pointer.x, y: pointer.y };
          });
          return {
            canvas: [game.canvas.width, game.canvas.height],
            frameWidth: art.frameW,
            textureSize: [image.width, image.height],
            rgbaBytes: image.width * image.height * 4,
            res: renderScale,
            click: [rect.left + rect.width / 2, rect.top + rect.height / 2],
            expectedPointer: [game.scale.width / renderScale / 2, game.scale.height / renderScale / 2],
            phaseChecks,
          };
        },
        { actor, kind, phases },
      );
      if (result.frameWidth !== test.frame) throw Error(test.name + ': wrong loaded sprite tier');
      if ([...result.textureSize, ...result.phaseChecks.flatMap((p) => p.textureSize)].some((size) => size > 2048))
        throw Error(test.name + ': atlas exceeds 2048 texture budget');
      if (result.canvas[0] > 2560 || result.canvas[1] > 1440) throw Error(test.name + ': QHD canvas budget exceeded');
      if (imageRequests.filter((url) => url.includes(`/${kind}/${actor}/`)).length !== (phases ? (actor === 'rot_king' ? 4 : 3) : 1))
        throw Error(test.name + ': unused animation tiers downloaded: ' + imageRequests.join(','));
      if (phases && result.phaseChecks.some((p) => p.frameWidth !== test.frame)) throw Error('Wrong phase tier');
      if (test.viewport.hasTouch) await page.touchscreen.tap(...result.click);
      else await page.mouse.click(...result.click);
      await page.waitForFunction(() => window.__qualityPointer, { timeout: 5000 });
      const pointer = await page.evaluate(() => window.__qualityPointer);
      if (Math.abs(pointer.x - result.expectedPointer[0]) > 1 || Math.abs(pointer.y - result.expectedPointer[1]) > 1)
        throw Error(test.name + ': pointer mapping changed ' + JSON.stringify({ pointer, result }));
      if (errors.length) throw Error(errors.join('\n'));
      results.push({ name: test.name, ...result, imageRequests, pointer });
      console.log('Verified', test.name, result.canvas, result.textureSize, 'one tier download and correct pointer');
    } finally {
      await closeArtContext(context);
    }
  }
  mkdirSync('reports/art-pilot', { recursive: true });
  writeFileSync(
    phases
      ? `reports/art-pilot/${actor}-phase-graphics-quality-native.json`
      : actor === 'tomato'
        ? 'reports/art-pilot/graphics-quality-native.json'
        : `reports/art-pilot/${actor}-graphics-quality-native.json`,
    JSON.stringify({ status: 'passed', results }, null, 2) + '\n',
  );
} finally {
  await closeArtBrowser(browser);
}

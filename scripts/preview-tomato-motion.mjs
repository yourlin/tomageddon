/* global window */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

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
  throw Error('Unsupported motion pilot actor');
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 60000 });
  await page.waitForFunction(
    () => {
      const loader = window.document.getElementById('boot-loader');
      return !loader || window.getComputedStyle(loader).opacity === '0' || window.getComputedStyle(loader).display === 'none';
    },
    { timeout: 60000 },
  );
  const policy = JSON.parse(readFileSync('docs/design/ART_PLAYER_ACTION_POLICY.json', 'utf8'));
  const required =
    kind === 'boss'
      ? JSON.parse(readFileSync(`docs/design/ART_${actor.toUpperCase()}_ANIMATION_PILOT.json`, 'utf8')).actions.map((a) => a.name)
      : policy.newActorActions[actor] || ['idle', 'move', 'attack', 'hurt', 'windup', 'charge', 'stun', 'die', 'spawn', 'cast', 'victory'];
  const report = await page.evaluate(
    async ({ actor, required, kind }) => {
      const { createEntityVisual } = await import('/src/objects/visualFactory.ts');
      const { loadArt } = await import('/src/systems/ArtRegistry.ts');
      await loadArt(window.game.scene.getScene('Menu'), { bodies: [{ kind, id: actor }] }, 'motion-preview');
      const { TIMED } = await import('/src/objects/EntityVisual.ts');
      const scene = window.game.scene.getScene('Menu');
      scene.add.rectangle(640, 360, 1280, 720, 0x211924).setDepth(1000);
      const states = required;
      const checks = [];
      const textureKeys = new Set();
      for (const [index, state] of states.entries()) {
        const visual = createEntityVisual(scene, { kind, id: actor }, 48);
        if (visual.mode !== 'spritesheet') throw Error('Motion sprite sheet not actually loaded');
        scene.add.existing(visual);
        visual.setPosition(160 + (index % 4) * 320, 130 + Math.floor(index / 4) * 215).setDepth(1001);
        const anim = visual.art.choice.entry.anims[state];
        if (!anim) throw Error('Missing authored action: ' + state);
        textureKeys.add(visual.art.texKey);
        visual.play(state, true);
        const seen = new Set([String(visual.img.frame.name)]);
        const duration = TIMED[state] ?? anim.frames.length / (anim.fps || 10);
        for (let step = 1; step < 200; step++) {
          visual.tick(duration / 200, state === 'move' || state === 'charge' ? 1 : 0, 1);
          seen.add(String(visual.img.frame.name));
        }
        const expected = new Set(anim.frames.map(String));
        if ([...expected].some((frame) => !seen.has(frame))) throw Error('Authored frame never displayed: ' + state);
        visual.play('idle', true);
        visual.tick(0.01, 0, 1);
        const before = { frame: visual.img.frame.name, clock: visual.t };
        visual.play('frozen', true);
        visual.tick(10, 0, 1);
        if (visual.img.frame.name !== before.frame || visual.t !== before.clock) throw Error('Frozen visual advanced: ' + state);
        visual.play(state, true);
        visual.tick(duration * 0.45, state === 'move' || state === 'charge' ? 1 : 0, 1);
        scene.add
          .text(visual.x, visual.y + 77, state, { fontSize: '20px', color: '#f6d6a5' })
          .setOrigin(0.5)
          .setDepth(1002);
        checks.push({ state, authoredFrames: expected.size, displayed: [...seen], frozenClockHeld: true });
      }
      if (textureKeys.size !== 1) throw Error('Actor instances must share one texture');
      return {
        status: 'native-frame-playback-passed; cross-scene/mobile/visual-calibration pending',
        checks,
        sharedTextures: [...textureKeys],
      };
    },
    { actor, required, kind },
  );
  await page.screenshot({ path: `docs/images/art-global/${actor}-motion-native.png` });
  if (pageErrors.length) throw Error(pageErrors.join('\n'));
  mkdirSync('reports/art-pilot', { recursive: true });
  writeFileSync(`reports/art-pilot/${actor}-motion-native.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(
    `Verified ${actor}: ${report.checks.length} authored actions, ${report.checks.reduce((n, c) => n + c.authoredFrames, 0)} unique frames, frozen clock and shared texture.`,
  );
} finally {
  await closeArtBrowser(browser);
}

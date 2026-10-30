/* global window */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const actors = process.argv.slice(2);
if (!actors.length)
  actors.push(
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
  );
if (actors.some((id) => !/^[a-z_]+$/.test(id))) throw Error('Invalid actor');
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
const results = [];
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  for (const actor of actors) {
    await page.evaluate((id) => {
      window.run.start(id, 1, false, 0);
      // Garlic starts with a passive aura; equip an active weapon in this isolated
      // browser fixture to exercise authored attack frames without changing aura rules.
      if (id === 'garlic' || id === 'durian') window.run.weapons = [{ uid: 900001, id: 'pea_shooter', tier: 0 }];
      window.game.scene.getScene('Menu').scene.start('Game');
    }, actor);
    await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
    await page.evaluate(() => {
      const g = window.game.scene.getScene('Game');
      const p = g.player;
      if (p.mode !== 'spritesheet') throw Error('Player not animated');
      const priorityStates = ['cast', 'charge', 'hurt', 'frozen', 'stun', 'die'];
      for (const state of priorityStates) {
        p.play(state, true);
        p.tryAttackAnimation();
        if (p.state !== state) throw Error('Normal attack interrupted ' + state);
      }
      p.play('idle', true);
      g.skill.cd = 1000;
      g.iframes = 100;
      const target = g.spawnEnemyNow('mold', p.x + 85, p.y);
      if (!target) throw Error('Target spawn failed');
      target.hp = target.maxHp = 1e8;
      for (const w of g.weapons.list) {
        w.cd = 0;
        w.target = target;
        w.retarget = 10;
      }
      const frames = new Set();
      const deadline = g.time.now + 2200;
      window.__attackProbe = {
        frames,
        priorityStates,
        done: false,
        authoredAttack: p.hasAuthoredAnimation('attack'),
        target,
        initialHp: target.hp,
      };
      const watch = () => {
        if (p.state === 'attack') frames.add(String(p.img.frame.name));
        if (g.time.now >= deadline) {
          window.__attackProbe.done = true;
          g.events.off('postupdate', watch);
        }
      };
      g.events.on('postupdate', watch);
    });
    await page.waitForFunction(() => window.__attackProbe.done, { timeout: 10000 });
    const result = await page.evaluate(() => ({
      frames: [...window.__attackProbe.frames],
      priorityStates: window.__attackProbe.priorityStates,
      authoredAttack: window.__attackProbe.authoredAttack,
      damage: window.__attackProbe.initialHp - window.__attackProbe.target.hp,
    }));
    if (result.frames.length !== (result.authoredAttack ? 4 : 0) || result.damage <= 0)
      throw Error(actor + ': automatic weapon fire did not display all attack frames: ' + JSON.stringify(result));
    results.push({ actor, ...result });
    console.log(
      'Verified automatic weapon damage, ' + (result.authoredAttack ? 'authored attack' : 'weapon-only attack') + ' and state priority:',
      actor,
    );
    await page.evaluate(() => {
      window.game.scene.stop('Hud');
      window.game.scene.getScene('Game').scene.start('Menu');
    });
    await page.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Game'));
  }
  if (errors.length) throw Error(errors.join('\n'));
  mkdirSync('reports/art-pilot', { recursive: true });
  writeFileSync('reports/art-pilot/player-attack-motion-native.json', JSON.stringify({ status: 'passed', results }, null, 2) + '\n');
} finally {
  await closeArtBrowser(browser);
}

/* global window */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const [actor, skinId] = process.argv.slice(2);
const readable = process.argv.includes('--readable');
if (!/^[a-z]+$/.test(actor ?? '') || !/^skin_[a-z0-9_]+$/.test(skinId ?? '')) throw Error('Pass actor and skin id');
const folder = resolve('../tomato-sister-art-source/qa/limb-occlusion/runtime', skinId, readable ? 'readable' : '.');
mkdirSync(folder, { recursive: true });
const report = { actor, skinId, at: new Date().toISOString(), status: 'pending', scope: 'Actual GameScene damagePlayer and skill.use action keyframes, high tier/both directions; postrender loop freeze preserves exact screenshot frame. Fixture suppresses unrelated damage/weapons. Not continuous playback, mobile/performance or final art acceptance.', cases: [], errors: [] };
report.readableFixture = readable;
if (readable) report.scope += ' Readable fixture clears sprite tint/alpha and camera effects, hides higher-depth non-player objects; original production-effects capture remains separate.';
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal'] });
let page;
try {
  page = await browser.newPage();
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  page.on('pageerror', e => report.errors.push(e.stack || e.message));
  await page.evaluateOnNewDocument(({ actor, skinId }) => localStorage.setItem('tomato_sister_save_v1', JSON.stringify({ saveVersion: 2, settings: { autoSkill: false, graphicsQuality: 'high' }, meta: { skins: [skinId], skinOf: { [actor]: skinId } } })), { actor, skinId });
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1&skins=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate(actor => { window.run.start(actor, 1, false, 0); window.game.scene.getScene('Menu').scene.start('Game'); }, actor);
  await page.waitForFunction(() => window.game.scene.isActive('Hud') && window.game.scene.getScene('Game')?.player?.active, { timeout: 60000 });
  await page.evaluate(({ skinId, readable }) => {
    const g = window.game.scene.getScene('Game');
    if (g.player.art?.choice.entry.skinId !== skinId) throw Error('Skin fallback');
    g.weapons.update = () => {};
    g.stats.speed = 0; g.stats.dodge = 0; g.skill.cd = 1000; g.timeLeft = 999;
    const originalDamage = g.damagePlayer.bind(g);
    g.damagePlayer = (...args) => { if (window.__intentionalActionDamage) originalDamage(...args); };
    g.cameras.main.setZoom(3);
    if (readable) g.events.on('postupdate', () => {
      g.cameras.main.resetFX();
      g.player.img.clearTint().setAlpha(1);
      const keep = new Set();
      for (let object = g.player.img; object; object = object.parentContainer) {
        keep.add(object);
        object.setVisible(true);
        object.setAlpha(1);
      }
      for (const child of g.children.list) {
        if (!keep.has(child) && child.depth >= g.player.img.depth) child.setVisible(false);
      }
    });
  }, { skinId, readable });
  for (const direction of [1, -1]) for (const action of ['hurt', 'cast']) {
    const frames = await page.evaluate(action => window.game.scene.getScene('Game').player.art.choice.entry.anims[action]?.frames, action);
    if (!frames?.length) throw Error(`Missing authored ${action}`);
    for (const frame of frames) {
      await page.evaluate(() => window.game.loop.wake());
      await page.waitForFunction(() => window.game.scene.getScene('Game').player.state === 'idle', { timeout: 10000 });
      const sample = await page.evaluate(({ direction, action, frame }) => new Promise((resolve, reject) => {
        const game = window.game, g = game.scene.getScene('Game'), p = g.player;
        g.facing = direction; g.moveX = 0; g.moveY = 0; p.tick(0, 0, direction);
        const timeout = setTimeout(() => { game.events.off('postrender', observe); reject(Error(`Never rendered ${action}:${frame}`)); }, 6000);
        function observe() {
          if (p.state !== action || Number(p.img.frame.name) !== frame) return;
          game.events.off('postrender', observe); clearTimeout(timeout);
          const c = g.cameras.main, rect = game.canvas.getBoundingClientRect();
          const point = c.matrix.transformPoint(p.x - c.scrollX, p.y - c.scrollY);
          const result = { action, frame, direction, state: p.state, flipX: p.img.flipX, skinId: p.art.choice.entry.skinId, time: g.time.now, screenX: rect.x + point.x * rect.width / game.scale.width, screenY: rect.y + point.y * rect.height / game.scale.height };
          game.loop.sleep(); resolve(result);
        }
        game.events.on('postrender', observe);
        if (action === 'hurt') {
          window.run.hp = 999; g.iframes = 0; g.shieldUp = false;
          window.__intentionalActionDamage = true;
          try { g.damagePlayer(1); } finally { window.__intentionalActionDamage = false; }
          // Keep the real hurt state while removing the brief camera flash for readable anatomy.
          g.cameras.main.resetFX();
        } else { g.skill.cd = 0; g.skill.use(); }
      }), { direction, action, frame });
      const file = resolve(folder, `${direction > 0 ? 'right' : 'left'}-${action}-${frame}.png`);
      const clip = { x: Math.max(0, Math.min(896, sample.screenX - 192)), y: Math.max(0, Math.min(336, sample.screenY - 240)), width: 384, height: 384 };
      await page.screenshot({ path: file, clip });
      const held = await page.evaluate(() => {
        const p = window.game.scene.getScene('Game').player;
        let ancestorsVisible = true;
        for (let object = p.img; object; object = object.parentContainer) ancestorsVisible &&= object.visible && object.alpha > 0;
        return { state: p.state, frame: Number(p.img.frame.name), flipX: p.img.flipX, ancestorsVisible };
      });
      if (held.state !== action || held.frame !== frame || held.flipX !== (direction < 0) || !held.ancestorsVisible) throw Error(`Screenshot frame drift or hidden sprite: ${JSON.stringify({ sample, held })}`);
      report.cases.push({ ...sample, file, held, exactFrameHeld: true });
      await page.evaluate(() => window.game.loop.wake());
    }
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'captured-exact-action-frames; manual visual review required';
} catch (e) { report.status = 'failed'; report.errors.push(e.stack || String(e)); process.exitCode = 1; }
finally {
  if (page && !page.isClosed()) await page.evaluate(() => window.game?.loop.wake()).catch(() => {});
  writeFileSync(resolve(folder, 'capture.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(`reports/art-pilot/${skinId}-action-keyframes${readable ? '-readable' : ''}.json`, JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

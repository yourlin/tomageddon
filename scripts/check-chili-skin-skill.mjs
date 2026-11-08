/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_chili(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass chili skin id');
const report = { skinId, status: 'pending', cases: [], errors: [], scope: 'Actual flameWave: equipped cast, expanding fire ring, ordered single hits at90/180, outside600 unaffected, burn3stacks and expiry cleanup;three tiers/both directions;final visual separate.' };
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal'] });
try {
  for (const tier of ['low', 'standard', 'high']) for (const direction of [1, -1]) {
    const page = await browser.newPage();
    await freezeArtHmr(page);
    page.on('pageerror', e => report.errors.push(e.stack || e.message));
    await page.evaluateOnNewDocument(({ skinId, tier }) => localStorage.setItem('tomato_sister_save_v1', JSON.stringify({ saveVersion: 2, settings: { autoSkill: false, graphicsQuality: tier }, meta: { skins: [skinId], skinOf: { chili: skinId } } })), { skinId, tier });
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1', { timeout: 90000 });
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => { window.run.start('chili', 1, false, 0); window.game.scene.getScene('Menu').scene.start('Game'); });
    await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game')?.player?.active, { timeout: 60000 });
    await page.evaluate(async ({ skinId, direction }) => {
      const g = window.game.scene.getScene('Game'), p = g.player;
      if (p.art?.choice.entry.skinId !== skinId || !p.hasAuthoredAnimation('cast')) throw Error('Skin fallback or missing cast');
      g.timeLeft = 999; g.iframes = 0; g.damagePlayer = () => {}; g.weapons.update = () => {}; g.stats.speed = 0;
      const { controls } = await import('/src/systems/Controls.ts');
      controls.joyX = 0; controls.joyY = 0; g.moveX = 0; g.moveY = 0; g.facing = direction; p.tick(0, 0, direction);
      const x = p.x, y = p.y;
      const targets = [90, 180, 600].map(dx => g.spawnEnemyNow('mold', x + dx, y));
      for (const e of targets) { e.speed = 0; e.hp = e.maxHp = 1e8; }
      await new Promise(resolve => g.time.delayedCall(600, resolve));
      const start = g.time.now, effects = g.skill.effects.length, originalHit = g.weaponHit, originalGraphics = g.add.graphics;
      const q = { frames: new Set(), requiredFrames: p.art.choice.entry.anims.cast.frames, wrongFlip: false, hits: [[], [], []], sawBurn: [false, false], radii: [], done: false };
      const graphics = [];
      g.weaponHit = function(e, ...args) { const i = targets.indexOf(e); if (i >= 0) q.hits[i].push(g.time.now - start); return originalHit.call(this, e, ...args); };
      g.add.graphics = function(...args) { const gr = originalGraphics.apply(this, args), stroke = gr.strokeCircle; gr.strokeCircle = function(...coords) { if (this.depth === 10400) q.radii.push(coords[2]); return stroke.apply(this, coords); }; graphics.push(gr); return gr; };
      const sample = () => {
        const t = g.time.now - start;
        if (p.state === 'cast') { q.frames.add(Number(p.img.frame.name)); q.wrongFlip ||= p.img.flipX !== (direction < 0); }
        p.x = x; p.y = y;
        targets.forEach((e,i) => { e.x = x + [90,180,600][i]; e.y = y; e.kvx = e.kvy = 0; });
        for (let i = 0; i < 2; i++) q.sawBurn[i] ||= (targets[i].status.get('burn')?.stacks ?? 0) >= 3;
        if (t > 6200) {
          const rings = graphics.filter(v => v.depth === 10400);
          Object.assign(q, { done: true, damaged: targets.slice(0,2).every(e => e.hp < 1e8), outsideUnaffected: targets[2].hp === 1e8 && !targets[2].status.has('burn'), ringCount: rings.length, ringsDestroyed: rings.every(v => !v.scene), effectsCleared: g.skill.effects.length <= effects, burnExpired: targets.every(e => !e.status.has('burn')) });
          g.weaponHit = originalHit; g.add.graphics = originalGraphics; g.events.off('postupdate', sample);
        }
      };
      window.__chiliSkinProbe = q; g.events.on('postupdate', sample); g.skill.cd = 0; g.skill.use(); sample();
    }, { skinId, direction });
    await page.waitForFunction(() => window.__chiliSkinProbe.done, { timeout: 20000 });
    const result = await page.evaluate(() => { const q = window.__chiliSkinProbe; return { ...q, frames: [...q.frames] }; });
    if (result.requiredFrames.length !== 4 || result.requiredFrames.some(f => !result.frames.includes(f)) || result.wrongFlip || !result.damaged || !result.outsideUnaffected || result.hits[0].length !== 1 || result.hits[1].length !== 1 || result.hits[2].length || result.hits[1][0] <= result.hits[0][0] || !result.sawBurn.every(Boolean) || result.radii.length < 20 || Math.max(...result.radii) < 260 || result.ringCount !== 1 || !result.ringsDestroyed || !result.effectsCleared || !result.burnExpired) throw Error(JSON.stringify({ tier, direction, ...result }));
    report.cases.push({ tier, direction, ...result });
    await page.close();
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) { report.status = 'failed'; report.errors.push(e.stack || String(e)); process.exitCode = 1; }
finally { writeFileSync(`reports/art-pilot/${skinId}-skill-motion-native.json`, JSON.stringify(report, null, 2) + '\n'); await closeArtBrowser(browser); }

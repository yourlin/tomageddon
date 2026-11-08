/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_tomato(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass tomato skin id');
const report = { skinId, status: 'pending', cases: [], errors: [], scope: 'Actual ketchupBurst: equipped skin cast, damage, ten sauce pools, delayed entrant slow and expiry cleanup; three tiers and both directions. Final visual acceptance separate.' };
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal'] });
try {
  for (const tier of ['low', 'standard', 'high']) for (const direction of [1, -1]) {
    const page = await browser.newPage();
    await freezeArtHmr(page);
    page.on('pageerror', e => report.errors.push(e.stack || e.message));
    await page.evaluateOnNewDocument(({ skinId, tier }) => localStorage.setItem('tomato_sister_save_v1', JSON.stringify({ saveVersion: 2, settings: { autoSkill: false, graphicsQuality: tier }, meta: { skins: [skinId], skinOf: { tomato: skinId } } })), { skinId, tier });
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1', { timeout: 90000 });
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => { window.run.start('tomato', 1, false, 0); window.game.scene.getScene('Menu').scene.start('Game'); });
    await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game')?.player?.active, { timeout: 60000 });
    await page.evaluate(async ({ skinId, direction }) => {
      const g = window.game.scene.getScene('Game'), p = g.player;
      if (p.art?.choice.entry.skinId !== skinId || !p.hasAuthoredAnimation('cast')) throw Error('Skin fallback or missing cast');
      g.timeLeft = 999; g.iframes = 0; g.damagePlayer = () => {}; g.weapons.update = () => {}; g.stats.speed = 0;
      const { controls } = await import('/src/systems/Controls.ts');
      controls.joyX = 0; controls.joyY = 0; g.moveX = 0; g.moveY = 0; g.facing = direction; p.tick(0, 0, direction);
      const x = p.x, y = p.y;
      const a = g.spawnEnemyNow('mold', x + 30, y), b = g.spawnEnemyNow('mold', x + 600, y);
      for (const e of [a, b]) { e.speed = 0; e.hp = e.maxHp = 1e8; }
      await new Promise(resolve => g.time.delayedCall(600, resolve));
      const start = g.time.now, effects = g.skill.effects.length;
      const q = { frames: new Set(), requiredFrames: p.art.choice.entry.anims.cast.frames, wrongFlip: false, lateSlow: false, outsideInitiallyUnaffected: false, pools: [], done: false };
      const sample = () => {
        const t = g.time.now - start;
        if (p.state === 'cast') { q.frames.add(Number(p.img.frame.name)); q.wrongFlip ||= p.img.flipX !== (direction < 0); }
        p.x = x; p.y = y; a.x = x + 30; a.y = y; a.kvx = a.kvy = 0;
        b.x = t > 1400 ? x : x + 600; b.y = y; b.kvx = b.kvy = 0;
        if (t > 2500) q.lateSlow ||= b.status.has('slow');
        if (t > 7800) {
          Object.assign(q, { done: true, damaged: a.hp < 1e8, outsideNotDamaged: b.hp === 1e8, poolCount: q.pools.length, poolsDestroyed: q.pools.every(v => !v.scene), effectsCleared: g.skill.effects.length <= effects, slowExpired: !b.status.has('slow') });
          g.events.off('postupdate', sample);
        }
      };
      window.__tomatoSkinProbe = q; g.events.on('postupdate', sample); g.skill.cd = 0; g.skill.use();
      q.outsideInitiallyUnaffected = !b.status.has('slow') && b.hp === 1e8;
      q.initialSlow = a.status.has('slow');
      q.pools = g.children.list.filter(v => v.name === 'sauce-pool');
      q.poolRadii = q.pools.map(pool => pool.getData('radius'));
      sample();
    }, { skinId, direction });
    await page.waitForFunction(() => window.__tomatoSkinProbe.done, { timeout: 20000 });
    const result = await page.evaluate(() => { const q = window.__tomatoSkinProbe; const { pools, ...rest } = q; void pools; return { ...rest, frames: [...q.frames] }; });
    if (result.requiredFrames.length !== 4 || result.requiredFrames.some(f => !result.frames.includes(f)) || result.wrongFlip || !result.damaged || !result.outsideInitiallyUnaffected || !result.initialSlow || !result.lateSlow || !result.outsideNotDamaged || result.poolCount !== 10 || !result.poolsDestroyed || !result.effectsCleared || !result.slowExpired) throw Error(JSON.stringify({ tier, direction, ...result }));
    report.cases.push({ tier, direction, ...result });
    await page.close();
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) { report.status = 'failed'; report.errors.push(e.stack || String(e)); process.exitCode = 1; }
finally { writeFileSync(`reports/art-pilot/${skinId}-skill-motion-native.json`, JSON.stringify(report, null, 2) + '\n'); await closeArtBrowser(browser); }

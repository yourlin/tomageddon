/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const skinId = process.argv[2];
if (!/^skin_watermelon(?:_[234])?$/.test(skinId ?? '')) throw Error('Pass a watermelon skin id');
const report = { skinId, status: 'pending', cases: [], errors: [], scope: 'Equipped skin real roll: all authored charge frames visible, both initial directions and three tiers, actual dash displacement/rules/end and scale restoration. Does not prove wall collision or visual anatomy.' };
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--use-angle=metal'] });
try {
  for (const tier of ['low', 'standard', 'high']) for (const direction of [1, -1]) {
    const page = await browser.newPage();
    await freezeArtHmr(page);
    page.on('pageerror', e => report.errors.push(e.stack || e.message));
    await page.evaluateOnNewDocument(({ skinId, tier }) => localStorage.setItem('tomato_sister_save_v1', JSON.stringify({ saveVersion: 2, settings: { autoSkill: false, graphicsQuality: tier }, meta: { skins: [skinId], skinOf: { watermelon: skinId } } })), { skinId, tier });
    await page.goto('http://127.0.0.1:4183/?art=1&skins=1', { timeout: 90000 });
    await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
    await page.evaluate(() => { window.run.start('watermelon', 1, false, 0); window.game.scene.getScene('Menu').scene.start('Game'); });
    await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game')?.player?.active, { timeout: 60000 });
    await page.evaluate(async ({ skinId, direction }) => {
      const g = window.game.scene.getScene('Game'), p = g.player;
      if (p.art?.choice.entry.skinId !== skinId || !p.hasAuthoredAnimation('charge')) throw Error('Wrong equipped skin or missing roll');
      const { controls } = await import('/src/systems/Controls.ts');
      g.timeLeft = 999; g.damagePlayer = () => {}; g.weapons.update = () => {};
      controls.joyX = direction; controls.joyY = 0; g.moveX = direction; g.moveY = 0; g.facing = direction;
      p.tick(0, 0, direction);
      const start = g.time.now, x = p.x, scale = p.scale;
      const q = { frames: new Set(), requiredFrames: p.art.choice.entry.anims.charge.frames, wrongFlip: false, hidden: false, displacement: 0, sawDash: false, done: false };
      const sample = () => {
        if (p.state === 'charge') {
          q.frames.add(Number(p.img.frame.name)); q.wrongFlip ||= p.img.flipX !== (direction < 0);
          q.hidden ||= p.alpha <= 0 || p.img.alpha <= 0 || !p.visible || !p.img.visible;
        }
        q.sawDash ||= !!g.skill.dash;
        q.displacement = Math.max(q.displacement, (p.x - x) * direction);
        if (g.time.now - start > 1400) {
          Object.assign(q, { done: true, dashEnded: !g.skill.dash, finalAlpha: p.alpha, scaleRestored: Math.abs(p.scale - scale) < 0.001, finalState: p.state });
          controls.joyX = 0; g.events.off('postupdate', sample);
        }
      };
      window.__watermelonSkinProbe = q; g.events.on('postupdate', sample); g.skill.cd = 0; g.skill.use();
      const dash = g.skill.dash;
      if (!dash) throw Error('Actual roll did not start');
      q.rules = { hitR: dash.hitR, rehit: dash.rehit, bounce: dash.bounce, knock: dash.knock, initialDirection: Math.sign(dash.vx), duration: dash.t };
      sample();
    }, { skinId, direction });
    await page.waitForFunction(() => window.__watermelonSkinProbe.done, { timeout: 15000 });
    const result = await page.evaluate(() => { const q = window.__watermelonSkinProbe; return { ...q, frames: [...q.frames] }; });
    const rules = result.rules;
    if (result.requiredFrames.length !== 4 || result.requiredFrames.some(f => !result.frames.includes(f)) || result.wrongFlip || result.hidden || !result.sawDash || !result.dashEnded || !result.scaleRestored || result.finalAlpha !== 1 || result.displacement < 100 || rules.hitR !== 62 || rules.rehit !== 0.3 || !rules.bounce || rules.knock !== 160 || rules.initialDirection !== direction || Math.abs(rules.duration - 0.9) > 0.02) throw Error(JSON.stringify({ tier, direction, ...result }));
    report.cases.push({ tier, direction, ...result });
    await page.close();
  }
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) { report.status = 'failed'; report.errors.push(e.stack || String(e)); process.exitCode = 1; }
finally { writeFileSync(`reports/art-pilot/${skinId}-skill-motion-native.json`, JSON.stringify(report, null, 2) + '\n'); await closeArtBrowser(browser); }

/* global window */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { freezeArtHmr } from './art-browser.mjs';
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
  for (const [actor, procedural] of [
    ['carrot', false],
    ['watermelon', false],
    ['watermelon', true],
  ]) {
    await page.evaluate((actor) => {
      window.run.start(actor, 1, false, 0);
      window.game.scene.getScene('Menu').scene.start('Game');
    }, actor);
    await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
    await page.evaluate(
      async ({ actor, procedural }) => {
        const g = window.game.scene.getScene('Game');
        if (procedural) {
          const { createEntityVisual } = await import('/src/objects/visualFactory.ts');
          const old = g.player;
          const replacement = createEntityVisual(g, { kind: 'char', id: actor }, old.radius, { procedural: true });
          g.add.existing(replacement);
          replacement.setPosition(old.x, old.y);
          g.player = replacement;
          old.destroy();
        }
        const p = g.player;
        const probe = {
          actor,
          procedural,
          states: new Set(),
          frames: new Set(),
          minChargeAlpha: 1,
          sawHiddenFallback: false,
          dash: null,
          done: false,
        };
        const deadline = g.time.now + 1400;
        const watch = () => {
          probe.states.add(p.state);
          if (p.state === 'charge' && p.mode === 'spritesheet') {
            probe.frames.add(String(p.img.frame.name));
            probe.minChargeAlpha = Math.min(probe.minChargeAlpha, p.alpha);
          }
          if (g.skill.dash) {
            const d = g.skill.dash;
            probe.dash ??= { hitR: d.hitR, bounce: !!d.bounce, rehit: d.rehit ?? null, knock: d.knock };
            if (p.alpha === 0) probe.sawHiddenFallback = true;
          }
          if (g.time.now >= deadline) {
            probe.done = true;
            g.events.off('postupdate', watch);
          }
        };
        g.events.on('postupdate', watch);
        window.__skillProbe = probe;
        g.skill.cd = 0;
        g.skill.use();
        watch();
      },
      { actor, procedural },
    );
    await page.waitForFunction(() => window.__skillProbe.done, { timeout: 10000 });
    const result = await page.evaluate(() => {
      const p = window.__skillProbe;
      return { ...p, states: [...p.states], frames: [...p.frames] };
    });
    if (!result.dash) throw Error(actor + ': real skill never dashed');
    if (!procedural && (result.frames.length !== 4 || result.minChargeAlpha <= 0))
      throw Error(actor + ': authored charge frames missing or hidden ' + JSON.stringify(result));
    if (actor === 'carrot' && !procedural && !result.states.includes('windup')) throw Error('Carrot windup missing');
    if (
      actor === 'watermelon' &&
      (result.dash.hitR !== 62 || !result.dash.bounce || result.dash.rehit !== 0.3 || result.dash.knock !== 160)
    )
      throw Error('Watermelon skill rules changed');
    if (procedural && !result.sawHiddenFallback) throw Error('Procedural roll fallback lost');
    results.push(result);
    console.log('Verified actual skill frames and fallback:', actor, procedural, result.frames.length);
    await page.evaluate(() => {
      window.game.scene.stop('Hud');
      window.game.scene.getScene('Game').scene.start('Menu');
    });
    await page.waitForFunction(() => window.game.scene.isActive('Menu') && !window.game.scene.isActive('Game'));
  }
  await page.evaluate(() => {
    window.run.start('lemon', 1, false, 0);
    window.game.scene.getScene('Menu').scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.isActive('Game'), { timeout: 60000 });
  await page.evaluate(() => {
    const g = window.game.scene.getScene('Game');
    const p = g.player;
    const target = g.spawnEnemyNow('mold', p.x + 180, p.y);
    if (!target) throw Error('Stealth test target missing');
    target.speed = 0;
    target.hp = target.maxHp = 1e8;
    const probe = { actor: 'lemon', frames: new Set(), minAlpha: 1, sawDecoy: false, done: false };
    const deadline = g.time.now + 3400;
    const watch = () => {
      if (p.state === 'cast') probe.frames.add(String(p.img.frame.name));
      if (g.skill.ghostT > 0) probe.minAlpha = Math.min(probe.minAlpha, p.alpha);
      probe.sawDecoy ||= !!g.decoy;
      if (g.time.now >= deadline) {
        probe.finalGhost = g.skill.ghostT;
        probe.finalDecoy = !!g.decoy;
        probe.ambushDamagedTarget = target.hp < 1e8;
        probe.done = true;
        g.events.off('postupdate', watch);
      }
    };
    g.events.on('postupdate', watch);
    window.__lemonProbe = probe;
    g.skill.cd = 0;
    g.skill.use();
    probe.ghostDuration = g.skill.ghostT;
    probe.initiallyInvulnerable = g.skill.invulnerable;
    watch();
  });
  await page.waitForFunction(() => window.__lemonProbe.done, { timeout: 10000 });
  const stealth = await page.evaluate(() => ({ ...window.__lemonProbe, frames: [...window.__lemonProbe.frames] }));
  if (
    stealth.frames.length !== 4 ||
    !stealth.sawDecoy ||
    !stealth.initiallyInvulnerable ||
    stealth.finalGhost > 0 ||
    stealth.finalDecoy ||
    !stealth.ambushDamagedTarget ||
    stealth.minAlpha <= 0 ||
    stealth.minAlpha >= 0.5 ||
    Math.abs(stealth.ghostDuration - 2.5) > 0.01
  )
    throw Error('Lemon stealth animation/rules failed: ' + JSON.stringify(stealth));
  results.push(stealth);
  console.log('Verified lemon cast frames, translucent stealth, decoy and reveal ambush.');
  if (errors.length) throw Error(errors.join('\n'));
  mkdirSync('reports/art-pilot', { recursive: true });
  writeFileSync('reports/art-pilot/player-skill-motion-native.json', JSON.stringify({ status: 'passed', results }, null, 2) + '\n');
} finally {
  await browser.close();
}

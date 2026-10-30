// 全 Boss 真正扣血触发的阶段验收；未制作完成的 Boss 必须列为 skipped，--complete 禁止跳过。
/* global window */
import puppeteer from 'puppeteer-core';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
import { BOSS_MOTION_FORMS } from '../src/data/bossMotionForms.ts';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { BOSSES } from '../src/data/bosses.ts';
import { CH1_BOSS_FORMS } from '../src/data/combatArt.ts';
const forms = JSON.parse(readFileSync('src/data/bossFormArt.generated.json', 'utf8'));
const expected = (id, phase) => {
  const motion = BOSS_MOTION_FORMS.find((f) => f.id === id && f.phase === phase);
  if (motion) return `boss-motion:${id}:${phase}@${motion.entry.version}:`;
  const f = forms.find((f) => f.id === id && f.phase === phase);
  return f ? `combat:global/${f.file}` : CH1_BOSS_FORMS[id]?.[phase] ? `combat:ch1/${CH1_BOSS_FORMS[id][phase].file}` : null;
};
const selected = process.argv.find((a) => a.startsWith('--boss='))?.slice(7);
const bosses = BOSSES.filter((b) => b.phases?.length && (!selected || b.id === selected));
const ready = bosses.filter((b) => b.phases.every((_, i) => i === 0 || expected(b.id, i)));
const report = { checked: [], skipped: bosses.filter((b) => !ready.includes(b)).map((b) => b.id), errors: [] };
if (process.argv.includes('--complete') && report.skipped.length) throw Error('Missing Boss phase art: ' + report.skipped.join(', '));
const out = 'docs/images/art-global/boss-phases';
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--disable-background-timer-throttling'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  page.setDefaultTimeout(120000);
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu'));
  await page.evaluate(async () => {
    const { flushTex } = await import('/src/systems/TexQueue.ts');
    flushTex();
    const { save } = await import('/src/systems/Save.ts');
    save.settings.autoSkill = false;
    save.settings.shake = false;
    save.settings.showDmg = false;
    window.game.scene.getScene('Game').constructor.sandbox = { terrain: false, deaths: 0 };
  });
  for (const def of ready) {
    await page.evaluate((chapter) => {
      window.run.start('tomato', chapter, false, 0);
      window.game.scene.getScenes(true).forEach((s) => window.game.scene.stop(s.scene.key));
      window.game.scene.start('Game');
    }, def.chapter);
    await page.waitForFunction(() => window.game.scene.getScene('Game')?.player?.active);
    await page.evaluate((id) => {
      const g = window.game.scene.getScene('Game');
      g.weapons.update = () => {};
      g.iframes = 10000;
      g.player.setPosition(500, 650);
      const e = g.spawnBossNow(id, 820, 650, []);
      if (!['static', 'spritesheet', 'atlas'].includes(e.rig.mode)) throw Error('Boss body fallback ' + id);
      e.hp = e.maxHp = 100000;
      e.speed = 0;
      e.actT = 9999;
      window.__phaseBoss = e;
    }, def.id);
    const checks = [];
    for (let phase = 1; phase < def.phases.length; phase++) {
      const before = await page.evaluate(async () => {
        const g = window.game.scene.getScene('Game'),
          e = window.__phaseBoss;
        const { BALANCE } = await import('/src/data/balance.ts');
        e.phaseT = 0;
        g.damageEnemy(e, e.maxHp);
        if (e.phaseTrans > 0) throw Error('Minimum time bypassed');
        e.phaseT = (e.boss.phases[e.phaseIdx].minTime ?? BALANCE.bossPhase.minTime) + 0.1;
        const radius = e.radius;
        g.damageEnemy(e, e.maxHp);
        if (e.phaseTrans !== BALANCE.bossPhase.transTime) throw Error('Transition length changed');
        return { radius, hp: e.hp };
      });
      await page.waitForFunction((phase) => window.__phaseBoss.rig.bossFormPhase === phase, {}, phase);
      const pause = await page.evaluate(() => {
        const g = window.game.scene.getScene('Game'),
          e = window.__phaseBoss;
        g.scene.pause();
        window.game.scene.pause('Hud');
        return { age: e.rig.blendAge, trans: e.phaseTrans };
      });
      await new Promise((r) => setTimeout(r, 150));
      await page.evaluate((p) => {
        const g = window.game.scene.getScene('Game'),
          e = window.__phaseBoss;
        if (e.rig.blendAge !== p.age || e.phaseTrans !== p.trans) throw Error('Paused transition advanced');
        g.scene.resume();
        window.game.scene.resume('Hud');
      }, pause);
      await page.waitForFunction((phase) => window.__phaseBoss.phaseIdx === phase && window.__phaseBoss.phaseTrans === 0, {}, phase);
      const after = await page.evaluate(() => {
        const g = window.game.scene.getScene('Game'),
          e = window.__phaseBoss;
        g.cameras.main.stopFollow().centerOn(e.x, e.y);
        return {
          radius: e.radius,
          phase: e.phaseIdx,
          form: e.rig.bossFormPhase,
          key: e.rig.img.texture.key,
          ghost: !!e.rig.formGhost,
          tint: e.phaseTint,
        };
      });
      const wanted = expected(def.id, phase);
      if (
        after.radius !== before.radius ||
        (wanted.startsWith('boss-motion:') ? !after.key.startsWith(wanted) : after.key !== wanted) ||
        after.ghost ||
        after.tint !== -1
      )
        throw Error(`Wrong phase state ${def.id}:${phase}`);
      checks.push({ phase, before, after, paused: true });
      await page.screenshot({ path: `${out}/${def.id}-${phase}.png` });
    }
    const reset = await page.evaluate(() => {
      const g = window.game.scene.getScene('Game'),
        e = window.__phaseBoss,
        old = e.rig;
      const probe = new old.constructor(g, old.art, 70);
      const form = {
        key: old.img.texture.key,
        phase: old.bossFormPhase,
        anchor: { x: old.img.originX, y: old.img.originY },
        refRadius: old.ref / old.formScale,
      };
      probe.setBossForm(form, 0.45);
      probe.tick(0.1, 0, 1);
      const age = probe.blendAge;
      probe.play('frozen', true);
      probe.tick(0.5, 0, 1);
      if (probe.blendAge !== age) throw Error('Frozen blend advanced');
      probe.play('idle', true);
      probe.tick(0.1, 0, 1);
      if (probe.blendAge <= age) throw Error('Thawed blend did not resume');
      probe.resetVisual();
      const count = probe.list.length;
      for (let i = 0; i < 20; i++) {
        probe.setBossForm(form, 0.45);
        probe.tick(0.1, 0, 1);
        probe.resetVisual();
        if (probe.formGhost || probe.bossFormPhase !== 0 || probe.list.length !== count) throw Error('Reset leaked phase image');
      }
      probe.destroy();
      return { frozenResume: true, midBlendResets: 20 };
    });
    report.checked.push({ id: def.id, checks, reset });
    console.log(`Verified ${def.id}: ${checks.length} actual gated transitions, pause/freeze/reset.`);
  }
  if (report.errors.length) throw Error(report.errors.join('\n'));
  writeFileSync('reports/art-pilot/global-boss-phases-verification.json', JSON.stringify(report, null, 2) + '\n');
  console.log({
    bosses: report.checked.length,
    phases: report.checked.reduce((n, b) => n + b.checks.length, 0),
    skipped: report.skipped.length,
  });
} finally {
  await closeArtBrowser(browser);
}

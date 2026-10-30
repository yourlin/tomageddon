/* global window */
// Exercise real Enemy.firePattern callbacks while Phaser renders each frame.
// Phase presets isolate action routing; damage-gated transitions have a separate verifier.
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { BOSSES } from '../src/data/bosses.ts';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';

const selected = process.argv.find((a) => a.startsWith('--boss='))?.slice(7);
const natural = process.argv.includes('--natural');
const elite = process.argv.includes('--elite');
if (elite && !selected) throw Error('Select one elite explicitly');
const reportPath = `reports/art-pilot/${elite ? `elite-${selected}` : 'boss'}-combat-motion-${natural ? 'natural' : 'native'}.json`;
const bosses = BOSSES.filter((b) => Boolean(b.elite) === elite && (!selected || b.id === selected));
if (!bosses.length) throw Error('No selected Boss');
const report = {
  scope: natural
    ? 'Rendered native GameScene with normal Boss AI cooldowns and movement; invulnerable stationary player, isolated phase presets. Not HP-gate, Steam release, performance or full visual acceptance.'
    : 'Rendered native GameScene, actual Boss attack/skill callbacks and update loop; isolated phase/pattern presets. Not natural timing, HP-gate, Steam release or performance acceptance.',
  checked: [],
  errors: [],
};
mkdirSync('reports/art-pilot', { recursive: true });
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--disable-background-timer-throttling'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  await page.setViewport({ width: 1280, height: 720 });
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.goto('http://127.0.0.1:4183/?lang=zh&art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 60000 });
  await page.evaluate(async () => {
    const { flushTex } = await import('/src/systems/TexQueue.ts');
    flushTex();
    const { save } = await import('/src/systems/Save.ts');
    save.settings.autoSkill = false;
    save.settings.shake = false;
    save.settings.showDmg = false;
    window.game.scene.getScene('Game').constructor.sandbox = { terrain: false, deaths: 0 };
  });
  for (const def of bosses) {
    await page.evaluate((chapter) => {
      window.run.start('tomato', chapter, false, 0);
      window.game.scene.getScenes(true).forEach((s) => window.game.scene.stop(s.scene.key));
      window.game.scene.start('Game');
    }, def.chapter);
    await page.waitForFunction(() => window.game.scene.isActive('Game') && window.game.scene.getScene('Game')?.player?.active, {
      timeout: 60000,
    });
    const result = await page.evaluate(
      async ({ id, natural }) => {
        const g = window.game.scene.getScene('Game');
        const { bossForm } = await import('/src/systems/CombatArt.ts');
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        g.weapons.update = () => {};
        g.iframes = 100000;
        g.player.setPosition(450, 400);
        const e = g.spawnBossNow(id, 850, 400, []);
        e.hp = e.maxHp = 100000000;
        e.speed = 0;
        const forms = [];
        const phases = e.boss.phases ?? [{ patterns: e.boss.patterns }];
        for (let phase = 0; phase < phases.length; phase++) {
          e.phaseIdx = phase;
          e.phaseTrans = 0;
          e.setPhasePatterns(phases[phase], true);
          if (!natural) {
            e.speed = 0;
            e.patternT.fill(100000);
          }
          if (phase && !e.rig.setBossForm(bossForm(g, id, phase), 0.12)) throw Error('Missing phase form');
          if (natural) {
            e.status.clear();
            for (const buff of phases[phase].buff ?? []) e.status.apply(buff);
            e.state = 'move';
            e.spiral = null;
            e.x = 850;
            e.y = 400;
            e.rig.play('idle', true);
            const calls = [],
              frames = {},
              wrong = [],
              started = performance.now();
            const anims = phase ? e.rig.formAnimation.anims : e.rig.art.choice.entry.anims;
            const key = e.rig.img.texture.key;
            const original = e.firePattern;
            e.firePattern = function (scene, pattern, nx, ny) {
              const previousState = this.rig.state;
              const action =
                pattern.type === 'charge' ? 'windup' : pattern.type === 'summon' || pattern.type === 'buff' ? 'cast' : 'attack';
              const protectedAction = action === 'attack' && previousState !== 'idle' && previousState !== 'move';
              const result = original.call(this, scene, pattern, nx, ny);
              calls.push({
                index: this.patterns.indexOf(pattern),
                pattern: pattern.type,
                at: (performance.now() - started) / 1000,
                previousState,
                visualAfter: this.rig.state,
                protectedAction,
              });
              if (protectedAction && this.rig.state !== previousState) throw Error(`Ordinary attack interrupted ${previousState}`);
              return result;
            };
            const observe = () => {
              const state = e.rig.state,
                frame = String(e.rig.img.frame.name);
              (frames[state] ??= new Set()).add(frame);
              if (e.rig.img.texture.key !== key || (anims[state] && !anims[state].frames.map(String).includes(frame)))
                wrong.push({ state, frame });
            };
            const seconds =
              Math.max(...e.patternT) + 3 + e.patterns.filter((p) => p.type === 'charge').reduce((n, p) => n + (p.windup ?? 0.8) + 0.7, 0);
            g.events.on('postupdate', observe);
            try {
              await sleep(seconds * 1000);
            } finally {
              g.events.off('postupdate', observe);
              e.firePattern = original;
            }
            const absent = e.patterns.map((_, i) => i).filter((i) => !calls.some((c) => c.index === i));
            if (absent.length || wrong.length) throw Error(`Natural AI coverage ${id}:${phase}: ${JSON.stringify({ absent, wrong })}`);
            for (const state of new Set(
              calls
                .filter((c) => !c.protectedAction)
                .flatMap((c) =>
                  c.pattern === 'charge' ? ['windup', 'charge'] : [c.pattern === 'summon' || c.pattern === 'buff' ? 'cast' : 'attack'],
                ),
            )) {
              if (!anims[state] || (frames[state]?.size ?? 0) < Math.min(2, new Set(anims[state].frames).size))
                throw Error(
                  `Natural AI action did not animate ${id}:${phase}:${state}: ${JSON.stringify({ seconds, calls, states: Object.fromEntries(Object.entries(frames).map(([s, f]) => [s, [...f]])) })}`,
                );
            }
            // This phase schedules buff→teleport about50ms apart. Both complete
            // authored sequences must survive while their gameplay stays concurrent.
            if (id === 'freezer_heart' && phase === 1) {
              for (const state of ['cast', 'spawn']) {
                if (anims[state].frames.some((f) => !frames[state]?.has(String(f)))) throw Error(`Interrupted freezer animation ${state}`);
              }
            }
            if (calls.some((c) => c.pattern === 'charge') && anims.charge.frames.some((f) => !frames.charge?.has(String(f)))) {
              throw Error(`Contact interrupted charge frames ${id}:${phase}`);
            }
            forms.push({ phase, seconds, calls, states: Object.fromEntries(Object.entries(frames).map(([s, f]) => [s, [...f]])), key });
            continue;
          }
          await sleep(500);
          const checks = [];
          for (const pattern of phases[phase].patterns) {
            e.patternT.fill(100000);
            e.state = 'move';
            e.spiral = null;
            e.x = 850;
            e.y = 400;
            e.rig.setPosition(850, 400);
            const states =
              pattern.type === 'charge'
                ? ['windup', 'charge']
                : pattern.type === 'teleport'
                  ? ['attack', 'spawn']
                  : [pattern.type === 'summon' || pattern.type === 'buff' ? 'cast' : 'attack'];
            const anims = phase ? e.rig.formAnimation.anims : e.rig.art.choice.entry.anims;
            for (const state of states) if (!anims[state]?.frames.length) throw Error(`Missing gameplay animation ${id}:${phase}:${state}`);
            const frames = Object.fromEntries(states.map((s) => [s, new Set()]));
            const wrong = [];
            const key = e.rig.img.texture.key;
            const observe = () => {
              const state = e.rig.state;
              if (!frames[state]) return;
              const frame = String(e.rig.img.frame.name);
              if (e.rig.img.texture.key !== key || !anims[state].frames.map(String).includes(frame))
                wrong.push({ state, frame, key: e.rig.img.texture.key });
              frames[state].add(frame);
            };
            g.events.on('postupdate', observe);
            try {
              e.firePattern(g, pattern, -1, 0);
              await sleep(pattern.type === 'charge' ? ((pattern.windup ?? 0.8) + 0.95) * 1000 : pattern.type === 'teleport' ? 1000 : 600);
            } finally {
              g.events.off('postupdate', observe);
            }
            if (wrong.length) throw Error('Wrong phase/state frame ' + JSON.stringify(wrong));
            for (const state of states)
              if (frames[state].size < Math.min(2, new Set(anims[state].frames).size))
                throw Error(`Action did not animate ${id}:${phase}:${pattern.type}:${state}`);
            checks.push({ pattern: pattern.type, states: Object.fromEntries(states.map((s) => [s, [...frames[s]]])), key });
            await sleep(150);
          }
          forms.push({ phase, checks });
        }
        return { id, forms };
      },
      { id: def.id, natural },
    );
    report.checked.push(result);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log('Verified real attack/skill routing:', def.id, result.forms.length, 'forms');
  }
  if (report.errors.length) throw Error(JSON.stringify(report.errors));
} catch (error) {
  report.errors.push(String(error));
  throw error;
} finally {
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  await closeArtBrowser(browser);
}

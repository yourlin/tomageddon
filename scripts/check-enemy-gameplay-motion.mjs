/* global window */
import puppeteer from 'puppeteer-core';
import { writeFileSync } from 'node:fs';
import { freezeArtHmr, closeArtBrowser } from './art-browser.mjs';
const ids = process.argv.slice(2);
if (!ids.length || ids.some((id) => !/^[a-z_]+$/.test(id))) throw Error('Select enemy ids');
const report = {
  scope:
    'Actual GameScene enemy AI with stationary invulnerable player and disabled player weapons; isolated enemies. Healers start500px away to observe travel before their keep-distance idle band. Player moves once after a splitter death to give every child a clear chase path. Not full wave, mobile performance or final visual acceptance.',
  checked: [],
  errors: [],
};
const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal'],
});
try {
  const page = await browser.newPage();
  await freezeArtHmr(page);
  page.on('pageerror', (e) => report.errors.push(e.message));
  await page.goto('http://127.0.0.1:4183/?art=1');
  await page.waitForFunction(() => window.game?.scene.isActive('Menu') && !window.game.scene.isActive('Boot'), { timeout: 60000 });
  await page.evaluate(async () => {
    (await import('/src/systems/TexQueue.ts')).flushTex();
    window.game.scene.getScene('Game').constructor.sandbox = { terrain: false, deaths: 0 };
    window.run.start('tomato', 1, false, 0);
    window.game.scene.getScenes(true).forEach((s) => window.game.scene.stop(s.scene.key));
    window.game.scene.start('Game');
  });
  await page.waitForFunction(() => window.game.scene.getScene('Game')?.player?.active, { timeout: 60000 });
  for (const id of ids)
    report.checked.push(
      await page.evaluate(async (id) => {
        const g = window.game.scene.getScene('Game'),
          sleep = (ms) => new Promise((r) => setTimeout(r, ms));
        g.weapons.update = () => {};
        g.iframes = 100000;
        g.player.setPosition(600, 600);
        const { loadArt } = await import('/src/systems/ArtRegistry.ts');
        const { ENEMY_MAP } = await import('/src/data/enemies.ts');
        const related = [
          id,
          ENEMY_MAP[id].summon,
          ENEMY_MAP[id].splitInto,
          ...(ENEMY_MAP[id].behavior === 'healer' ? ['mold'] : []),
        ].filter(Boolean);
        await loadArt(g, { bodies: [...new Set(related)].map((id) => ({ kind: 'enemy', id })) }, 'enemy-gameplay-probe');
        const e = g.spawnEnemyNow(id, id === 'mushroom' || ENEMY_MAP[id].behavior === 'healer' ? 1100 : 900, 600, []);
        if (!e?.rig?.img) throw Error('Missing actual enemy art ' + id);
        e.hp = e.maxHp = 100000;
        e.actT = 0.1;
        const behavior = e.def.behavior;
        const initialPosition = { x: e.x, y: e.y };
        const originalHeal = g.healEnemiesAround;
        let healCalls = 0,
          healedAmount = 0,
          ally = null;
        if (behavior === 'healer') {
          ally = g.spawnEnemyNow('mold', e.x + 35, e.y + 20, []);
          ally.maxHp = 100;
          ally.hp = 10;
          g.healEnemiesAround = function (target, ...args) {
            const before = ally.hp;
            const result = originalHeal.call(this, target, ...args);
            if (target === e) {
              healCalls++;
              healedAmount += ally.hp - before;
            }
            return result;
          };
        }
        const originalShoot = g.enemyShoot,
          volleys = [];
        if (behavior === 'shooter') {
          g.enemyShoot = function (target, n, spread, ...args) {
            const before = new Set(g.enemyBullets.filter((b) => b.alive));
            const result = originalShoot.call(this, target, n, spread, ...args);
            if (target === e) {
              const born = g.enemyBullets.filter((b) => b.alive && !before.has(b) && b.owner === e);
              volleys.push({
                requested: n,
                spread,
                spawned: born.length,
                angles: born.map((b) => (Math.atan2(b.vy, b.vx) + Math.PI * 2) % (Math.PI * 2)),
                slow: born.map((b) => b.slow),
              });
            }
            return result;
          };
        }
        const originalSummon = g.summonAround;
        let summons = 0;
        const summonedChildren = [],
          summonedChildFrames = new Map();
        if (behavior === 'summoner') {
          g.summonAround = function (target, childId, count) {
            if (target !== e) return originalSummon.call(this, target, childId, count);
            summons++;
            const originalSpawn = this.spawnEnemyNow;
            this.spawnEnemyNow = function (...args) {
              const child = originalSpawn.apply(this, args);
              if (args[0] === childId && child) summonedChildren.push(child);
              return child;
            };
            try {
              return originalSummon.call(this, target, childId, count);
            } finally {
              this.spawnEnemyNow = originalSpawn;
            }
          };
        }
        let trailCalls = 0;
        const originalSlime = g.addSlime;
        g.addSlime = function (...args) {
          if (e.def.behavior === 'trail') trailCalls++;
          return originalSlime.apply(this, args);
        };
        const rig = e.rig,
          key = rig.img.texture.key,
          anims = rig.art.choice.entry.anims,
          states = {};
        const observe = () => {
          for (const child of summonedChildren) {
            const cr = child.rig;
            if (!cr?.img || cr.state !== 'move') continue;
            if (cr.art.choice.entry.source.type !== 'spritesheet') throw Error('Summoned child is not authored animation');
            const valid = cr.art.choice.entry.anims.move.frames.map(String),
              frame = String(cr.img.frame.name);
            if (!valid.includes(frame)) throw Error('Wrong summoned child movement frame');
            const frames = summonedChildFrames.get(child) ?? new Set();
            frames.add(frame);
            summonedChildFrames.set(child, frames);
          }
          const s = rig.state;
          if (!anims[s]) return;
          if (rig.img.texture.key !== key || !anims[s].frames.map(String).includes(String(rig.img.frame.name)))
            throw Error('Wrong gameplay frame');
          (states[s] ??= new Set()).add(String(rig.img.frame.name));
        };
        g.events.on('postupdate', observe);
        try {
          await sleep(2400);
          if (behavior === 'summoner') {
            if (
              summons !== 1 ||
              summonedChildren.length !== e.def.summonCount ||
              summonedChildren.some((c) => !c.rig?.img) ||
              (states.cast?.size ?? 0) < 4
            )
              throw Error('Summoner cast/children incomplete');
            if (summonedChildren.some((c) => (summonedChildFrames.get(c)?.size ?? 0) < 4))
              throw Error('Summoned child movement frames incomplete');
            for (const child of summonedChildren) if (child.alive) child.kill(g, false);
          }
          if (behavior === 'healer') {
            if (healCalls < 1 || healedAmount <= 0 || (states.cast?.size ?? 0) < 4)
              throw Error('Healer cast or real ally HP recovery missing');
            if (ally.alive) ally.kill(g, false);
          }
          if (e.def.behavior === 'trail' && trailCalls < 2) throw Error('Trail did not spawn slime');
          if (behavior === 'shooter') {
            if ((states.attack?.size ?? 0) < 4 || !volleys.length || volleys.some((v) => v.spawned !== v.requested))
              throw Error('Shooter animation/projectile count incomplete');
            for (const v of volleys)
              if (v.spread >= 360) {
                const angles = [...v.angles].sort((a, b) => a - b),
                  gap = (Math.PI * 2) / v.requested;
                for (let i = 0; i < angles.length; i++)
                  if (Math.abs(((angles[(i + 1) % angles.length] - angles[i] + Math.PI * 2) % (Math.PI * 2)) - gap) > 0.001)
                    throw Error('Radial bullet gaps incorrect');
              }
            if (e.def.projSlow && volleys.some((v) => v.slow.some((s) => s !== e.def.projSlow))) throw Error('Projectile slow missing');
          }
          if (e.def.speed > 0 && !states.move?.size) throw Error('AI did not move ' + id);
          if (e.def.speed === 0 && Math.hypot(e.x - initialPosition.x, e.y - initialPosition.y) > 0.1)
            throw Error('Stationary enemy unexpectedly moved ' + id);
          if (e.def.behavior === 'charger')
            for (const s of ['windup', 'charge']) if ((states[s]?.size ?? 0) < 2) throw Error('AI did not animate ' + s);
          g.damageEnemy(e, 1, {});
          await sleep(500);
          if (!states.hurt?.size) throw Error('No actual hurt frames');
          let splitChildren = 0,
            splitAnimationFrames = [];
          if (e.def.splitInto) {
            const target = e.def.splitInto,
              expected = e.def.splitCount,
              originalSpawn = g.spawnEnemyNow,
              children = [];
            g.spawnEnemyNow = function (...args) {
              const child = originalSpawn.apply(this, args);
              if (args[0] === target && child) children.push(child);
              return child;
            };
            const childFrames = new Map(),
              watchChildren = () => {
                for (const child of children) {
                  const cr = child.rig;
                  if (!cr?.img || cr.state !== 'move') continue;
                  if (cr.art.choice.entry.source.type !== 'spritesheet') throw Error('Split child is not authored animation');
                  const frames = childFrames.get(child) ?? new Set();
                  frames.add(String(cr.img.frame.name));
                  childFrames.set(child, frames);
                }
              };
            g.events.on('postupdate', watchChildren);
            try {
              g.damageEnemy(e, e.hp + 1000, {});
              g.player.setPosition(300, 600);
              await sleep(700);
              if (children.length !== expected || children.some((child) => !child.rig?.img)) throw Error('Wrong split child count/art');
              splitAnimationFrames = children.map((child) => [...(childFrames.get(child) ?? [])]);
              if (splitAnimationFrames.some((frames) => frames.length < 4))
                throw Error(
                  'Split child movement frames incomplete ' +
                    JSON.stringify(
                      children.map((child, i) => ({
                        id: child.def.id,
                        alive: child.alive,
                        state: child.rig?.state,
                        frames: splitAnimationFrames[i],
                        x: child.x,
                        y: child.y,
                        source: child.rig?.art.choice.entry.source,
                      })),
                    ),
                );
              splitChildren = children.length;
            } finally {
              g.events.off('postupdate', watchChildren);
              g.spawnEnemyNow = originalSpawn;
              for (const child of children) if (child.alive) child.kill(g, false);
            }
          } else {
            e.kill(g, true);
            await sleep(700);
          }
          if ((states.die?.size ?? 0) < 4) throw Error('Death frames interrupted');
          let fuse = null;
          if (e.def.behavior === 'bomber') {
            g.events.off('postupdate', observe);
            const bomb = g.spawnEnemyNow(id, g.player.x + 50, g.player.y, []),
              br = bomb.rig,
              frames = new Set(),
              origin = g.enemyExplode;
            let explosions = 0;
            const watch = () => {
              if (br.state === 'windup') frames.add(String(br.img.frame.name));
            };
            g.enemyExplode = function (target, radius) {
              if (target === bomb) explosions++;
              return origin.call(this, target, radius);
            };
            g.events.on('postupdate', watch);
            try {
              await sleep(100);
              if (bomb.state !== 'fuse') throw Error('Bomber failed to enter fuse');
              const duration = bomb.stateT;
              await sleep(duration * 1000 + 400);
              if (explosions !== 1 || bomb.alive || frames.size < 4) throw Error('Incomplete fuse animation/explosion');
              fuse = { duration, frames: [...frames], explosions };
            } finally {
              g.enemyExplode = origin;
              g.events.off('postupdate', watch);
              if (bomb.alive) bomb.kill(g, false);
            }
          }
          return {
            id,
            stationary: e.def.speed === 0,
            displacement: Math.hypot(e.x - initialPosition.x, e.y - initialPosition.y),
            splitChildren,
            splitAnimationFrames,
            behavior,
            volleys,
            summons,
            summonedChildren: summonedChildren.length,
            summonedAnimationFrames: summonedChildren.map((c) => [...(summonedChildFrames.get(c) ?? [])]),
            healCalls,
            healedAmount,
            trailCalls,
            fuse,
            states: Object.fromEntries(Object.entries(states).map(([s, v]) => [s, [...v]])),
          };
        } finally {
          g.enemyShoot = originalShoot;
          g.summonAround = originalSummon;
          for (const child of summonedChildren) if (child.alive) child.kill(g, false);
          g.healEnemiesAround = originalHeal;
          if (ally?.alive) ally.kill(g, false);
          g.addSlime = originalSlime;
          g.events.off('postupdate', observe);
          if (e.alive) e.kill(g, false);
        }
      }, id),
    );
  if (report.errors.length) throw Error(report.errors.join(';'));
  report.status = 'passed';
} catch (e) {
  report.status = 'failed';
  report.errors.push(String(e));
  throw e;
} finally {
  if (report.status === 'passed')
    for (const row of report.checked)
      writeFileSync(
        `reports/art-pilot/enemy-${row.id}-gameplay-native.json`,
        JSON.stringify({ scope: report.scope, status: 'passed', checked: [row], errors: [] }, null, 2) + '\n',
      );
  writeFileSync('reports/art-pilot/enemy-gameplay-motion-native.json', JSON.stringify(report, null, 2) + '\n');
  await closeArtBrowser(browser);
}

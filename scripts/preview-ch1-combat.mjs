// 第一关战斗美术验收：实际发射入口、锁血触发转阶段、暂停、回池复用；另保存三个动画 WebM。
// 用法：先启动本地 dev，再 node --import tsx scripts/preview-ch1-combat.mjs [http://127.0.0.1:4183/]
/* global window, document, MediaRecorder, FileReader */
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { CH1_PROJECTILES, CH1_BOSS_FORMS } from '../src/data/combatArt.ts';
const base = process.argv[2] || 'http://127.0.0.1:4183/';
const out = 'docs/images/art-ch1/combat';
mkdirSync(out, { recursive: true });
mkdirSync('reports/art-pilot', { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--use-angle=metal', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
});
const report = { errors: [], projectiles: [], phases: [], resets: [] };
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => report.errors.push(e.message));
  const cards = Object.entries(CH1_PROJECTILES)
    .map(
      ([id, art]) =>
        `<article><img src="${base}src/assets/combat/ch1/${art.file}"><b>${id}</b><div class="tiny"><img src="${base}src/assets/combat/ch1/${art.file}" style="width:24px;height:24px"></div></article>`,
    )
    .join('');
  const forms = Object.entries(CH1_BOSS_FORMS)
    .map(
      ([id, phases]) =>
        `<section><h2>${id}</h2><div class="forms"><article><img src="${base}src/assets/entities/boss/${id}/body.png"><b>Ⅰ</b></article>${Object.entries(
          phases,
        )
          .map(
            ([phase, a]) =>
              `<article><img src="${base}src/assets/combat/ch1/${a.file}"><b>${Number(phase) + 1 === 2 ? 'Ⅱ' : 'Ⅲ'}</b></article>`,
          )
          .join('')}</div></section>`,
    )
    .join('');
  await page.setContent(
    `<html><head><meta charset="utf-8"><style>body{background:#15131c;color:#fff0d1;font:18px system-ui;margin:24px}h1{font-size:26px}.bullets{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}article{background:#2c2935;border:1px solid #514555;border-radius:12px;padding:10px;text-align:center}img{width:100%;height:150px;object-fit:contain}b{display:block;margin:8px}.tiny{height:44px;background:#262626;display:grid;place-items:center}.forms{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.forms img{height:260px}h2{font-size:19px;margin:30px 0 10px}</style></head><body><h1>第一关 · 敌方弹体与 Boss 形态</h1><p>弹体下排为小尺寸预览；Ⅰ / Ⅱ / Ⅲ 为各 Boss 持续形态。</p><div class="bullets">${cards}</div>${forms}</body></html>`,
  );
  await page.waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0));
  await page.screenshot({ path: `${out}/overview.png`, fullPage: true });
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto(`${base}?lang=zh&art=1`);
  await page.waitForFunction(() => window.game?.scene.isActive('Menu'));
  await page.evaluate(async () => {
    const { flushTex } = await import('/src/systems/TexQueue.ts');
    flushTex();
    const { save } = await import('/src/systems/Save.ts');
    save.settings.autoSkill = false;
    save.settings.showDmg = false;
    save.settings.shake = false;
    // 使用正在运行的构造器，避免 Vite HMR 查询参数产生另一份模块实例。
    window.game.scene.getScene('Game').constructor.sandbox = { terrain: false, deaths: 0 };
  });
  async function start(id) {
    await page.evaluate((id) => {
      window.run.start('tomato', 1, false, 0);
      window.game.scene.getScenes(true).forEach((s) => window.game.scene.stop(s.scene.key));
      window.game.scene.start('Game');
      window.__combatBossId = id;
    }, id);
    await page.waitForFunction(() => window.game.scene.getScene('Game')?.player?.active);
    await page.evaluate(() => {
      const g = window.game.scene.getScene('Game');
      g.weapons.update = () => {};
      g.iframes = 10000;
      g.player.setPosition(500, 650);
      g.timeLeft = 45;
      const e = g.spawnBossNow(window.__combatBossId, 820, 650, []);
      e.hp = e.maxHp = 100000;
      e.speed = 0;
      window.__combatBoss = e;
    });
    await page.waitForFunction(() => window.__combatBoss?.rig?.mode === 'static');
    await new Promise((r) => setTimeout(r, 500));
  }
  await start('mold_king');
  report.projectiles = await page.evaluate(async () => {
    const g = window.game.scene.getScene('Game');
    const cases = [
      ['rotten_apple', 0],
      ['sour_milk', 0],
      ['gopher', 0],
      ['mold_king', 0],
      ['mold_elder', 0],
      ['greasy_pan', 0],
      ['roach_general', 0],
      ['cockroach_emperor', 2],
      ['fork_knight', 0],
      ['rotten_onion', 0],
      ['fly_swarm_king', 0],
      ['grease_chef', 0],
      ['grease_chef', 1],
      ['grease_chef', 2],
    ];
    return cases.map(([id, phase]) => {
      const e = { def: { id }, boss: null, phaseIdx: phase, phaseTrans: 0 };
      const sample = (force) => {
        window.__art.procedural(force);
        g.enemyBullet('proj_enemy', 100, 100, 0.3, 200, 3, 0, 1, undefined, e, 120);
        const b = g.enemyBullets.find((b) => b.alive && b.owner === e);
        const result = { radius: b.radius, vx: b.vx, vy: b.vy, life: b.life, dmg: b.dmg, key: b.texture.key };
        if (force && result.key !== 'proj_enemy') throw Error('Procedural baseline was not active');
        b.kill();
        return result;
      };
      const legacy = sample(true),
        art = sample(false);
      for (const key of ['radius', 'vx', 'vy', 'life', 'dmg']) if (legacy[key] !== art[key]) throw Error(`Physics changed ${id}:${key}`);
      if (!art.key.startsWith('combat:')) throw Error(`Projectile fallback ${id}:${phase}`);
      // 同一 Bullet 重用为旧弹时，锚点、脉动、自旋不能遗留。
      g.enemyBullet('proj_ice', 100, 100, 0, 200, 3, 10, 1, undefined, e, 120);
      const reused = g.enemyBullets.find((b) => b.alive && b.owner === e);
      if (reused.originX !== 0.5 || reused.originY !== 0.5 || reused.enemyVisualPulse !== 0 || reused.enemyVisualSpin !== 6)
        throw Error('Bullet reuse contaminated');
      reused.kill();
      return { id, phase, ...art };
    });
  });

  for (const id of Object.keys(CH1_BOSS_FORMS)) {
    await start(id);
    await page.evaluate(() => {
      const canvas = window.game.canvas;
      const stream = canvas.captureStream(30),
        chunks = [];
      const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2400000 });
      window.__combatRecording = { recorder, chunks, stream };
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      recorder.start();
    });
    await page.screenshot({ path: `${out}/${id}-1.png` });
    for (const phase of [1, 2]) {
      const before = await page.evaluate(() => {
        const g = window.game.scene.getScene('Game'),
          e = window.__combatBoss;
        e.phaseT = 0;
        g.damageEnemy(e, e.maxHp);
        if (e.phaseTrans > 0) throw Error('Minimum phase time bypassed');
        e.phaseT = 6;
        const radius = e.radius;
        g.damageEnemy(e, e.maxHp);
        if (e.phaseTrans !== 3) throw Error('Transition length changed');
        return { radius, hp: e.hp };
      });
      await page.waitForFunction((phase) => window.__combatBoss.rig.bossFormPhase === phase, {}, phase);
      if (phase === 1) {
        const paused = await page.evaluate(() => {
          const g = window.game.scene.getScene('Game'),
            e = window.__combatBoss;
          g.scene.pause();
          window.game.scene.pause('Hud');
          return { blend: e.rig.blendAge, phase: e.phaseTrans };
        });
        await new Promise((r) => setTimeout(r, 200));
        await page.evaluate((p) => {
          const g = window.game.scene.getScene('Game'),
            e = window.__combatBoss;
          if (e.rig.blendAge !== p.blend || e.phaseTrans !== p.phase) throw Error('Pause advanced form animation');
          g.scene.resume();
          window.game.scene.resume('Hud');
        }, paused);
      }
      await page.waitForFunction((phase) => window.__combatBoss.phaseIdx === phase && window.__combatBoss.phaseTrans === 0, {}, phase);
      const after = await page.evaluate(() => {
        const e = window.__combatBoss;
        return {
          radius: e.radius,
          phase: e.phaseIdx,
          form: e.rig.bossFormPhase,
          ghost: e.rig.formGhost !== null,
          texture: e.rig.img.texture.key,
          tint: e.phaseTint,
        };
      });
      if (after.radius !== before.radius || after.form !== phase || after.ghost || after.tint !== -1)
        throw Error(`Form mismatch ${id}:${phase}`);
      report.phases.push({ id, before, after });
      await page.screenshot({ path: `${out}/${id}-${phase + 1}.png` });
      await new Promise((r) => setTimeout(r, 650));
    }
    const video = await page.evaluate(async () => {
      const { recorder, chunks, stream } = window.__combatRecording;
      await new Promise((resolve) => {
        recorder.onstop = resolve;
        recorder.stop();
      });
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: 'video/webm' });
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    });
    writeFileSync(`${out}/${id}.webm`, Buffer.from(video.split(',')[1], 'base64'));
    report.resets.push(
      await page.evaluate(() => {
        const g = window.game.scene.getScene('Game'),
          e = window.__combatBoss,
          old = e.rig,
          ident = old.ident;
        // 独立、未加入显示列表的实例检查冻结与交叠中途回池，避免只测稳定末态。
        const probe = new old.constructor(g, old.art, 70);
        const form = {
          key: old.img.texture.key,
          phase: 2,
          anchor: { x: old.img.originX, y: old.img.originY },
          refRadius: old.ref / old.formScale,
        };
        probe.setBossForm(form, 0.45);
        probe.tick(0.1, 0, 1);
        const age = probe.blendAge;
        probe.play('frozen', true);
        probe.tick(0.5, 0, 1);
        if (probe.blendAge !== age) throw Error('Frozen form animation advanced');
        probe.play('idle', true);
        probe.tick(0.1, 0, 1);
        if (probe.blendAge <= age) throw Error('Thawed form did not resume');
        probe.resetVisual();
        const count = probe.list.length;
        for (let i = 0; i < 30; i++) {
          probe.setBossForm(form, 0.45);
          probe.tick(0.1, 0, 1);
          probe.resetVisual();
          if (probe.formGhost || probe.bossFormPhase !== 0 || probe.list.length !== count) throw Error('Mid-blend reset leaked children');
        }
        probe.destroy();
        e.alive = false;
        e.rig = null;
        g.rigs.release(old);
        const vis = g.rigs.acquire(ident, 70);
        if (vis !== old || vis.bossFormPhase !== 0 || vis.formGhost || vis.alpha !== 1 || !vis.img.texture.key.startsWith('art:'))
          throw Error('Boss pool reuse contaminated');
        g.rigs.release(vis);
        return {
          id: ident.id,
          phase: vis.bossFormPhase,
          ghost: vis.formGhost !== null,
          texture: vis.img.texture.key,
          frozenResume: true,
          midBlendResets: 30,
        };
      }),
    );
    console.log(`Verified ${id}: two transitions, pause, pool reset, video saved`);
  }
  report.videos = [];
  for (const id of Object.keys(CH1_BOSS_FORMS)) {
    report.videos.push(
      await page.evaluate(async (url) => {
        const v = document.createElement('video');
        v.muted = true;
        v.src = url;
        await new Promise((resolve, reject) => {
          v.onloadeddata = resolve;
          v.onerror = () => reject(Error('Video decode failed'));
        });
        await v.play();
        await new Promise((resolve) => setTimeout(resolve, 400));
        const result = { width: v.videoWidth, height: v.videoHeight, frames: v.getVideoPlaybackQuality().totalVideoFrames };
        v.pause();
        v.removeAttribute('src');
        v.load();
        if (result.width !== 1280 || result.height !== 720 || result.frames < 2) throw Error('Invalid animation video');
        return result;
      }, `${base}${out}/${id}.webm`),
    );
  }
  if (report.errors.length) throw Error(report.errors.join('\n'));
  writeFileSync('reports/art-pilot/combat-verification.json', JSON.stringify(report, null, 2));
  console.log(`Verified ${report.projectiles.length} projectile cases and ${report.phases.length} transformations.`);
} finally {
  await browser.close();
}

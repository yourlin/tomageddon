// 技能演出冒烟测试：在同一局里逐个切换角色技能并释放，记录页面报错，并在释放后 0.45 秒截图。
// 用法：node .kiro/smoke_skills.mjs <输出目录> <日志文件> <角色id,角色id,...>
// 预览服务器在本进程内启动，不产生子进程；每步进度立即写入日志；55 秒硬超时
import puppeteer from 'puppeteer-core';
import { preview } from 'vite';
import { appendFileSync, writeFileSync, mkdirSync } from 'node:fs';

const [, , OUT, LOG, IDS] = process.argv;
const ids = IDS.split(',');
mkdirSync(OUT, { recursive: true });
writeFileSync(LOG, '');
const T0 = Date.now();
const TOTAL = ids.length + 2;
const log = (n, msg) => {
  const line = `[${n}/${TOTAL}] ${((Date.now() - T0) / 1000).toFixed(1)}s ${msg}`;
  console.log(line);
  appendFileSync(LOG, line + '\n');
};
let server = null;
let browser = null;
const finish = async (code) => {
  await browser?.close().catch(() => {});
  await server?.close().catch(() => {});
  process.exit(code);
};
setTimeout(() => {
  log('!', '超时 55 秒，强制退出');
  void finish(2);
}, 55000).unref();

try {
  server = await preview({ root: 'D:/playground/tomageddon', preview: { port: 4191, strictPort: false, open: false }, logLevel: 'silent' });
  browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(server.resolvedUrls.local[0] + '?lang=zh');
  await page.waitForFunction(() => window.game?.scene?.isActive('Menu'), { timeout: 30000 });
  await page.evaluate((first) => {
    game.scene.getScenes(true).forEach((s) => s.scene.stop());
    setTimeout(() => {
      run.start(first, 1);
      run.wave = 6;
      game.scene.start('Game');
    }, 150);
  }, ids[0]);
  await page.waitForFunction(() => game.scene.isActive('Game') && game.scene.getScene('Game').skill, { timeout: 10000 });
  await new Promise((r) => setTimeout(r, 900));
  log(1, '对局已开始，逐个释放技能…');
  let n = 1;
  for (const id of ids) {
    n++;
    const before = errors.length;
    const info = await page.evaluate((cid) => {
      const g = game.scene.getScene('Game');
      // 清场后在玩家周围摆一圈敌人
      for (const e of g.enemies) if (e.alive) e.kill(g);
      run.charId = cid;
      g.skill.destroy();
      g.skill.skill = run.char.skill;
      g.skill.cd = 0;
      run.hp = 9999;
      g.timeLeft = 999;
      const p = g.player;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g.spawnEnemyNow('mold', p.x + Math.cos(a) * (140 + (i % 3) * 60), p.y + Math.sin(a) * (110 + (i % 3) * 40));
      }
      g.moveX = 1;
      g.moveY = 0;
      g.skill.use();
      return { type: run.char.skill.type, name: run.char.skill.name };
    }, id);
    await new Promise((r) => setTimeout(r, 450));
    await page.screenshot({ path: `${OUT}/${String(n - 1).padStart(2, '0')}_${id}.png` });
    await new Promise((r) => setTimeout(r, 700));
    const errs = errors.slice(before);
    log(n, `${id} ${info.type}「${info.name}」${errs.length ? '报错：' + errs.join(' | ') : 'OK'}`);
  }
  log(TOTAL, `完成；页面报错共 ${errors.length} 条`);
  await finish(0);
} catch (e) {
  log('!', '出错：' + (e?.message ?? e));
  await finish(1);
}

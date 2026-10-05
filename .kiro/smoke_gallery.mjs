// 开发者「阵列预览」冒烟：?dev 打开 → 沙盒页 → 依次点「全部小怪 / 全部精英 Boss / 精英词缀」截图，
// 再录一段只含 3 个角色的技能动画墙并截图。进程内预览服务器，不产生子进程；每步写日志；55 秒硬超时
import puppeteer from 'puppeteer-core';
import { preview } from 'vite';
import { appendFileSync, writeFileSync, mkdirSync } from 'node:fs';

const [, , OUT, LOG] = process.argv;
mkdirSync(OUT, { recursive: true });
writeFileSync(LOG, '');
const T0 = Date.now();
const TOTAL = 6;
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

const clickText = (page, text) =>
  page.evaluate((t) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t);
    b?.click();
    return !!b;
  }, text);

try {
  server = await preview({ root: 'D:/playground/tomageddon', preview: { port: 4192, strictPort: false, open: false }, logLevel: 'silent' });
  browser = await puppeteer.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => (m.type().startsWith('warn') || m.type() === 'error') && !m.text().includes('AudioContext') && errors.push('warn: ' + m.text()));
  await page.goto(server.resolvedUrls.local[0] + '?dev&lang=zh');
  await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => b.textContent.trim() === '沙盒'), { timeout: 30000 });
  await page.waitForFunction(() => window.game?.scene?.isActive('Game'), { timeout: 15000 });
  log(1, '开发者模式就绪，切到沙盒页…');
  await clickText(page, '沙盒');
  await new Promise((r) => setTimeout(r, 2000));
  let n = 1;
  for (const [btn, name] of [
    ['精英 / Boss 阵列', 'bosses'],
    ['小怪阵列', 'minions'],
    ['词缀阵列', 'affixes'],
  ]) {
    n++;
    const ok = await clickText(page, btn);
    await new Promise((r) => setTimeout(r, 1500));
    await page.screenshot({ path: `${OUT}/${name}.png` });
    const cnt = await page.evaluate(() => game.scene.getScene('Game').enemies.filter((e) => e.alive).length);
    log(n, `${btn}：按钮${ok ? '已点' : '未找到'}，场上 ${cnt} 只；报错 ${errors.length}`);
  }
  // 技能动画墙：只录 3 个（筛选 dash）
  await page.evaluate(() => {
    const i = [...document.querySelectorAll('input')].find((x) => x.placeholder?.startsWith('筛选'));
    i.value = 'dash';
  });
  await clickText(page, '技能动画墙');
  log(5, '已开始录制技能动画墙（冲刺类 4 个，约 10 秒）…');
  await page.waitForFunction(() => document.getElementById('dev-gallery')?.textContent.includes('完成'), { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: `${OUT}/wall.png` });
  log(6, `动画墙完成；页面报错共 ${errors.length} 条 ${errors.slice(0, 3).join(' | ')}`);
  await finish(0);
} catch (e) {
  log('!', '出错：' + (e?.message ?? e));
  await finish(1);
}

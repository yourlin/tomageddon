// 导出文档用图片：在无头 Chrome 中运行游戏的程序化绘制代码，把角色/武器/道具/怪物/精英/Boss 图标导出为 PNG
// 输出：docs/images/{char,weapon,item,enemy,boss}/<id>.png
// 用法：npm run docs:images（需要本机安装 Google Chrome）
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const PORT = 4176;
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = new URL('../docs/images/', import.meta.url);

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
const URL_ = `http://localhost:${PORT}/?lang=zh`;
for (let i = 0; ; i++) {
  try {
    if ((await fetch(URL_)).ok) break;
  } catch {
    /* 服务未就绪 */
  }
  if (i > 100) throw new Error('开发服务器启动失败');
  await new Promise((r) => setTimeout(r, 200));
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[页面错误]', e.message));
  await page.goto(URL_);
  await page.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 60000 });
  const images = await page.evaluate(async () => {
    const { portraitKey } = await import('/src/ui/Portrait.ts');
    const { itemIconKey } = await import('/src/art/ItemArt.ts');
    const { CHARACTERS } = await import('/src/data/characters.ts');
    const { WEAPONS } = await import('/src/data/weapons.ts');
    const { ALL_ITEMS } = await import('/src/data/items.ts');
    const { ENEMIES } = await import('/src/data/enemies.ts');
    const { BOSSES } = await import('/src/data/bosses.ts');
    const scene = window.game.scene.getScene('Menu');
    // 把纹理缩放到 size×size 画布中央并截图（兼容 WebGL RenderTexture）
    const snap = (key, size) =>
      new Promise((resolve) => {
        const rt = scene.make.renderTexture({ width: size, height: size }, false);
        const img = scene.make.image({ key }, false);
        img.setScale(Math.min(size / img.width, size / img.height) * 0.94);
        rt.draw(img, size / 2, size / 2);
        rt.snapshot((el) => {
          resolve(el.src);
          rt.destroy();
          img.destroy();
        });
      });
    const out = [];
    for (const c of CHARACTERS) out.push(['char', c.id, await snap(portraitKey(scene, 'char', c.id), 128)]);
    for (const e of ENEMIES) out.push(['enemy', e.id, await snap(portraitKey(scene, 'enemy', e.id), 128)]);
    for (const b of BOSSES) out.push(['boss', b.id, await snap(portraitKey(scene, 'boss', b.id), 128)]);
    for (const w of WEAPONS) out.push(['weapon', w.id, await snap(`icon_weapon_${w.id}`, 96)]);
    for (const it of ALL_ITEMS) out.push(['item', it.id, await snap(itemIconKey(scene, it), 64)]);
    return out;
  });
  const count = {};
  for (const [kind, id, url] of images) {
    const dir = new URL(`${kind}/`, OUT);
    mkdirSync(dir, { recursive: true });
    writeFileSync(new URL(`${id}.png`, dir), Buffer.from(url.split(',')[1], 'base64'));
    count[kind] = (count[kind] ?? 0) + 1;
  }
  console.log('导出图片：', count);
} finally {
  await browser.close();
  server.kill();
}

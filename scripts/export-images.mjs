// 导出文档用图片：在无头 Chrome 中运行游戏，把角色/武器/道具/怪物/精英/Boss 图标导出为 PNG。
// 角色、怪物、Boss、武器先加载高清插画（可爱风 + 高画质），与游戏内看到的一致；没有插画的退回程序化绘制
// 输出：docs/images/{char,weapon,item,enemy,boss}/<id>.png
// 用法：npm run docs:images（需要本机安装 Google Chrome）
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { useDocArtSettings } from './art-browser.mjs';

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
  await useDocArtSettings(page);
  await page.goto(URL_);
  await page.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 60000 });
  const images = await page.evaluate(async () => {
    const { portraitKey } = await import('/src/ui/Portrait.ts');
    const { itemIconKey } = await import('/src/art/ItemArt.ts');
    const { CHARACTERS } = await import('/src/data/characters.ts');
    const { WEAPONS } = await import('/src/data/weapons.ts');
    const { EVOLVED_WEAPONS } = await import('/src/data/evolutions.ts');
    const { ALL_ITEMS } = await import('/src/data/items.ts');
    const { ENEMIES } = await import('/src/data/enemies.ts');
    const { BOSSES } = await import('/src/data/bosses.ts');
    const { loadDocArt } = await import('/src/dev/docArt.ts');
    const { readyArt } = await import('/src/systems/ArtRegistry.ts');
    const scene = window.game.scene.getScene('Menu');
    await loadDocArt(scene, { weapons: true });
    // 把纹理缩放到 size×size 画布中央并截图。高清插画（图片 / 画布纹理）用 2D 画布高质量缩小，避免 WebGL 直接缩小的锯齿；
    // 程序化纹理（WebGL RenderTexture）只能用 snapshot 读回
    const snap = (key, size, frameName, trim = false) => {
      const frame = scene.textures.getFrame(key, frameName);
      const src = frame?.source.image;
      if (src instanceof HTMLImageElement || src instanceof HTMLCanvasElement || src instanceof ImageBitmap) {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const ctx = c.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        let [sx, sy, sw, sh] = [frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight];
        if (trim) [sx, sy, sw, sh] = opaqueBox(src, sx, sy, sw, sh);
        const k = Math.min(size / sw, size / sh) * 0.94;
        const w = sw * k,
          h = sh * k;
        ctx.drawImage(src, sx, sy, sw, sh, (size - w) / 2, (size - h) / 2, w, h);
        return Promise.resolve(c.toDataURL('image/png'));
      }
      return new Promise((resolve) => {
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
    };
    // 插画（或动画图集的待机首帧）四周的透明边裁掉，让图标撑满格子
    const opaqueBox = (src, sx, sy, sw, sh) => {
      const c = document.createElement('canvas');
      c.width = sw;
      c.height = sh;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(src, sx, sy, sw, sh, 0, 0, sw, sh);
      const d = ctx.getImageData(0, 0, sw, sh).data;
      let x0 = sw,
        y0 = sh,
        x1 = -1,
        y1 = -1;
      for (let y = 0; y < sh; y++)
        for (let x = 0; x < sw; x++)
          if (d[(y * sw + x) * 4 + 3] > 8) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
      if (x1 < 0) return [sx, sy, sw, sh];
      const side = Math.max(x1 - x0, y1 - y0) + 1;
      return [sx + (x0 + x1 + 1) / 2 - side / 2, sy + (y0 + y1 + 1) / 2 - side / 2, side, side];
    };
    // 逐个加载：一次加载全部会超出贴图内存预算，先加载的会被自动卸载
    const entity = async (kind, id) => {
      await loadDocArt(scene, { bodies: [{ kind, id }] });
      const art = readyArt(scene, { kind, id });
      return art ? snap(art.texKey, 128, art.baseFrame, true) : snap(portraitKey(scene, kind, id), 128);
    };
    const out = [];
    for (const c of CHARACTERS) out.push(['char', c.id, await entity('char', c.id)]);
    for (const e of ENEMIES) out.push(['enemy', e.id, await entity('enemy', e.id)]);
    for (const b of BOSSES) out.push(['boss', b.id, await entity('boss', b.id)]);
    for (const w of [...WEAPONS, ...EVOLVED_WEAPONS])
      out.push(['weapon', w.id, await snap(scene.textures.exists(`icon_weapon_${w.id}`) ? `icon_weapon_${w.id}` : `weapon_${w.id}`, 96)]);
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

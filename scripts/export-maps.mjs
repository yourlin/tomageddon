// 导出文档用的章节地图预览：在无头 Chrome 中按战斗场景的画法合成高清地图（地面 + 前景；没有时退回 src/art/ArenaMaps.ts 的程序地图），
// 每章导出一张俯瞰图 → docs/images/map/ch<章节>.webp（CHAPTERS.md）
// 用法：npm run docs:maps（需要本机安装 Google Chrome）
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { useDocArtSettings } from './art-browser.mjs';

const PORT = 4177;
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT = new URL('../docs/images/map/', import.meta.url);
/** 预览图最长边（像素） */
const MAX = 720;

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

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('[页面错误]', e.message));
  await useDocArtSettings(page);
  await page.goto(URL_);
  await page.waitForFunction(() => window.game?.scene.isActive('Menu'), { timeout: 60000 });
  const maps = await page.evaluate(async (MAX) => {
    const { paintArenaMap } = await import('/src/art/ArenaMaps.ts');
    const { Arena } = await import('/src/systems/Arena.ts');
    const { arenaDefFor } = await import('/src/data/arenas.ts');
    const { loadDocArt } = await import('/src/dev/docArt.ts');
    const { readyMap } = await import('/src/systems/ArtRegistry.ts');
    const { mapArtFor } = await import('/src/systems/ArtResolve.ts');
    const scene = window.game.scene.getScene('Menu');
    const out = [];
    for (const ch of [1, 2, 3, 4, 5, 6, 7]) {
      // 与战斗场景一致：有高清地图时画「地面 + 前景」两层，否则退回程序地图
      await loadDocArt(scene, { maps: [ch] });
      const ground = readyMap(scene, ch, 'ground');
      const fg = ground && readyMap(scene, ch, 'foreground');
      const key = `doc_map_${ch}`;
      if (!ground) paintArenaMap(scene, ch, new Arena(arenaDefFor(ch)), key);
      const src = scene.textures.get(ground ?? key).getSourceImage();
      const k = Math.min(1, MAX / Math.max(src.width, src.height));
      const c = document.createElement('canvas');
      c.width = Math.round(src.width * k);
      c.height = Math.round(src.height * k);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(src, 0, 0, c.width, c.height);
      const fgDef = mapArtFor(ch)?.foreground;
      if (fg && fgDef) {
        ctx.globalAlpha = fgDef.alpha ?? 1;
        ctx.drawImage(scene.textures.get(fg).getSourceImage(), 0, 0, c.width, c.height);
        ctx.globalAlpha = 1;
      }
      out.push([ch, !!ground, c.toDataURL('image/webp', 0.8)]);
      if (!ground) scene.textures.remove(key);
    }
    return out;
  }, MAX);
  mkdirSync(OUT, { recursive: true });
  for (const [ch, , url] of maps) writeFileSync(new URL(`ch${ch}.webp`, OUT), Buffer.from(url.split(',')[1], 'base64'));
  console.log(`导出地图预览：${maps.length} 张（高清地图 ${maps.filter((m) => m[1]).length} 张）→ docs/images/map/`);
} finally {
  await browser.close();
  server.kill();
}

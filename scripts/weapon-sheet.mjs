// 武器造型预览拼图：在真实游戏里渲染指定武器的手持图（放大 2 倍）与商店图标，拼成一张带名字的 PNG，用来检查造型
// 用法：先 npm run dev（或 npx vite --port 5173），再
//   node scripts/weapon-sheet.mjs <输出.png> <id1,id2,... | 批次 JSON 文件（[{ id }, ...]）> [--url http://127.0.0.1:5173/?dev]
// 需要本机安装 Google Chrome。
import puppeteer from 'puppeteer-core';
import { readFileSync, writeFileSync } from 'node:fs';

const [out, list] = process.argv.slice(2);
if (!out || !list) {
  console.error('用法：node scripts/weapon-sheet.mjs <输出.png> <id1,id2,... | 批次.json>');
  process.exit(1);
}
const urlArg = process.argv.indexOf('--url');
// ?dev：开发者模式启动时一次性生成全部贴图（普通模式是按需分批生成，进菜单时还没齐）
const URL = urlArg > 0 ? process.argv[urlArg + 1] : 'http://127.0.0.1:5173/?dev';
const ids = list.endsWith('.json') ? JSON.parse(readFileSync(list, 'utf8')).map((x) => x.id) : list.split(',').filter(Boolean);

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'new',
  args: ['--lang=zh-CN'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(URL, { waitUntil: 'load', timeout: 90000 });
  await page.waitForFunction(() => window.__devPanel || window.game?.scene?.isActive('Menu'), { timeout: 90000 });
  const res = await page.evaluate(async (ids) => {
    const g = window.game;
    const W = window.__dev.WEAPON_MAP;
    const COLS = 5,
      CW = 300,
      CH = 200;
    const c = document.createElement('canvas');
    c.width = COLS * CW;
    c.height = Math.ceil(ids.length / COLS) * CH;
    const x = c.getContext('2d');
    x.fillStyle = '#1a0a0c';
    x.fillRect(0, 0, c.width, c.height);
    const missing = [];
    ids.forEach((id, i) => {
      const cx = (i % COLS) * CW,
        cy = Math.floor(i / COLS) * CH;
      x.fillStyle = i % 2 ? '#2b1418' : '#3d1d22';
      x.fillRect(cx + 2, cy + 2, CW - 4, CH - 4);
      const hand = g.textures.exists(`weapon_${id}`) ? g.textures.get(`weapon_${id}`).getSourceImage() : null;
      const icon = g.textures.exists(`icon_weapon_${id}`) ? g.textures.get(`icon_weapon_${id}`).getSourceImage() : null;
      if (!hand) missing.push(id);
      // 手持图 128×64 → 256×128；图标 128 → 64
      if (hand) x.drawImage(hand, cx + 8, cy + 8, 256, 128);
      if (icon) x.drawImage(icon, cx + CW - 70, cy + 120, 64, 64);
      x.fillStyle = '#ffd166';
      x.font = 'bold 20px sans-serif';
      x.fillText(W[id]?.name ?? '?', cx + 10, cy + 160);
      x.fillStyle = '#9d8f85';
      x.font = '13px monospace';
      x.fillText(id, cx + 10, cy + 182);
    });
    return { url: c.toDataURL('image/png'), missing };
  }, ids);
  writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
  console.log(`已生成 ${out}（${ids.length} 把）`);
  if (res.missing.length) console.log('没有贴图：', res.missing.join(','));
  if (errors.length) console.log('页面报错：', errors.join(' | '));
} finally {
  await browser.close();
}

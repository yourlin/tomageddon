// build:steam 的后处理：删掉 Steam 包里用不到的大文件（宣传视频约 23 MB、PWA 清单），并复制窗口图标
import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve('dist-steam');
if (!fs.existsSync(out)) {
  console.error('steam-prune: 找不到 dist-steam，请先 vite build --mode steam');
  process.exit(1);
}
let freed = 0;
const rm = (p) => {
  if (!fs.existsSync(p)) return;
  const st = fs.statSync(p);
  freed += st.isDirectory() ? fs.readdirSync(p).reduce((a, f) => a + fs.statSync(path.join(p, f)).size, 0) : st.size;
  fs.rmSync(p, { recursive: true, force: true });
};
rm(path.join(out, 'promo'));
rm(path.join(out, 'manifest.webmanifest'));
// 窗口 / 任务栏图标
fs.copyFileSync(path.resolve('public/icons/icon-512.png'), path.resolve('electron/icon.png'));
// index.html 里的 PWA 清单引用在桌面版里没有意义
const html = path.join(out, 'index.html');
fs.writeFileSync(html, fs.readFileSync(html, 'utf8').replace(/<link[^>]+manifest[^>]*>\s*/g, ''));
console.log(`steam-prune: 已移除 ${(freed / 1024 / 1024).toFixed(1)} MB（宣传视频、PWA 清单）`);

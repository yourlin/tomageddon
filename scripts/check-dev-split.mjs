// L2：确认开发者界面（src/dev）没有混进玩家首屏包。
// 首屏包 = index.html 直接引用的入口 JS；开发者界面只能出现在按需加载的 DevPanel-*.js 分包里。
import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const entries = [...html.matchAll(/<script[^>]+src="\.?\/?([^"]+\.js)"/g)].map((m) => m[1]);
if (!entries.length) {
  console.error('check:split: index.html 里找不到入口脚本');
  process.exit(1);
}
// 只在开发者界面代码里出现的标记
const MARKERS = ['dev-panel', 'tomageddon_dev_', '开发者界面', 'dev-modal-mask'];
let bad = false;
for (const e of entries) {
  const code = fs.readFileSync(path.join(dist, e), 'utf8');
  for (const m of MARKERS)
    if (code.includes(m)) {
      console.error(`check:split: 首屏包 ${e} 含有开发者代码标记「${m}」`);
      bad = true;
    }
  console.log(`check:split: ${e} ${(code.length / 1024).toFixed(0)} KB`);
}
const devChunks = fs.readdirSync(path.join(dist, 'assets')).filter((f) => /^DevPanel-.*\.js$/.test(f));
const disabled = process.env.VITE_DISABLE_DEV === '1';
if (disabled && devChunks.length) {
  console.error(`check:split: 已设置 VITE_DISABLE_DEV=1，但仍生成了 ${devChunks.join(', ')}`);
  bad = true;
}
console.log(`check:split: 开发者分包 ${devChunks.length ? devChunks.join(', ') : '（无）'}`);
process.exit(bad ? 1 : 0);

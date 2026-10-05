// 启动 / 贴图加载页（DOM，定义在 index.html）：番茄沿进度条蹦跳，进度只增不减
import { tx } from '../i18n';

const TIPS: [string, string][] = [
  ['小提示：技能冷却好了就放，别攒着', 'Tip: use your skill whenever it is ready'],
  ['小提示：商店里锁定的商品会留到下一波', 'Tip: locked shop items stay for the next wave'],
  ['小提示：危机等级越高，奖励越多', 'Tip: higher Danger levels pay more rewards'],
  ['小提示：两件特定道具同时持有会触发组合效果', 'Tip: some item pairs trigger combo bonuses'],
  ['小提示：精英怪头上的装饰代表它的词缀', 'Tip: an elite’s decorations show its affixes'],
  ['正在给番茄浇水……', 'Watering the tomatoes…'],
  ['正在磨亮叉子……', 'Polishing the forks…'],
];

let shown = 0;
let tipTimer = 0;

const root = () => document.getElementById('boot-loader');

function nextTip(el: HTMLElement): void {
  const tip = el.querySelector<HTMLElement>('.bl-tip');
  if (!tip) return;
  const [zh, en] = TIPS[Math.floor(Math.random() * TIPS.length)];
  tip.textContent = tx(zh, en);
}

function startTips(el: HTMLElement): void {
  nextTip(el);
  window.clearInterval(tipTimer);
  tipTimer = window.setInterval(() => nextTip(el), 2600);
}

/** 更新进度（0-1）与文字；进度不会倒退 */
export function setLoader(p: number, label?: string): void {
  const el = root();
  if (!el) return;
  shown = Math.max(shown, Math.min(1, Math.max(0, p)));
  el.style.setProperty('--p', shown.toFixed(4));
  const pct = Math.floor(shown * 100);
  el.setAttribute('aria-valuenow', String(pct));
  const pe = el.querySelector('.bl-pct');
  if (pe) pe.textContent = `${pct}%`;
  if (label !== undefined) {
    const le = el.querySelector('.bl-label');
    if (le) le.textContent = label;
  }
}

/** 启动脚本接管加载页：换成当前语言的文字并开始轮播小提示 */
export function initLoader(label: string): void {
  const el = root();
  if (!el) return;
  el.setAttribute('aria-label', tx('加载进度', 'Loading progress'));
  setLoader(shown, label);
  startTips(el);
}

/** 重新显示加载页（半透明盖在当前画面上），进度从 0 开始 */
export function showLoader(label: string): void {
  const el = root();
  if (!el) return;
  shown = 0;
  el.classList.add('bl-dim');
  el.classList.remove('bl-gone');
  // 先移除 display:none 再在下一帧去掉透明，才有淡入
  requestAnimationFrame(() => el.classList.remove('bl-hide'));
  setLoader(0, label);
  startTips(el);
}

export function hideLoader(): void {
  const el = root();
  if (!el || el.classList.contains('bl-hide')) return;
  window.clearInterval(tipTimer);
  el.classList.add('bl-hide');
  window.setTimeout(() => {
    if (el.classList.contains('bl-hide')) el.classList.add('bl-gone');
  }, 400);
}

/** 测试 / 开发用：立即移除，不做动画 */
export function removeLoaderNow(): void {
  window.clearInterval(tipTimer);
  root()?.classList.add('bl-hide', 'bl-gone');
}

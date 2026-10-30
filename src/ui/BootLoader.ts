// 厨房插画加载页（首屏 DOM 定义在 index.html），实时进度只增不减。
import { tx, lang } from '../i18n';

const TIPS: [string, string][] = [
  ['小提示：武器会自动攻击，专心走位就好', 'Tip: weapons attack automatically — focus on dodging'],
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
let hideTimer = 0;
let visibilityEpoch = 0;

const root = () => document.getElementById('boot-loader');

function syncLanguage(el: HTMLElement): void {
  el.classList.toggle('bl-en', lang === 'en');
  el.setAttribute('aria-label', tx('加载进度', 'Loading progress'));
  const title = el.querySelector('.bl-brand');
  const subtitle = el.querySelector('.bl-title small');
  if (title) title.textContent = tx('番茄酱', 'TOMAGEDDON');
  if (subtitle) subtitle.textContent = tx('TOMAGEDDON', 'FRESH · FIERCE · FEARLESS');
}

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
  if (Number.isFinite(p)) shown = Math.max(shown, Math.min(1, Math.max(0, p)));
  el.style.setProperty('--p', shown.toFixed(4));
  // Completion must paint a full bar before the overlay begins fading out.
  el.classList.toggle('bl-complete', shown === 1);
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
  syncLanguage(el);
  setLoader(shown, label);
  startTips(el);
}

/** 重新显示插画加载页，进度从 0 开始；无需等待任何 Phaser 贴图。 */
export function showLoader(label: string): void {
  const el = root();
  if (!el) return;
  const epoch = ++visibilityEpoch;
  window.clearTimeout(hideTimer);
  syncLanguage(el);
  shown = 0;
  el.classList.add('bl-dim');
  el.classList.remove('bl-gone');
  // 先移除 display:none 再在下一帧去掉透明，才有淡入
  requestAnimationFrame(() => {
    if (epoch === visibilityEpoch) el.classList.remove('bl-hide');
  });
  setLoader(0, label);
  startTips(el);
}

export function hideLoader(): void {
  const el = root();
  if (!el) return;
  const epoch = ++visibilityEpoch;
  window.clearInterval(tipTimer);
  window.clearTimeout(hideTimer);
  el.classList.add('bl-hide');
  hideTimer = window.setTimeout(() => {
    if (epoch === visibilityEpoch && el.classList.contains('bl-hide')) el.classList.add('bl-gone');
  }, 400);
}

/** 测试 / 开发用：立即移除，不做动画 */
export function removeLoaderNow(): void {
  visibilityEpoch++;
  window.clearTimeout(hideTimer);
  window.clearInterval(tipTimer);
  root()?.classList.add('bl-hide', 'bl-gone');
}

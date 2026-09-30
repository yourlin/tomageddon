// 多语言：中文 / English。语言在启动时确定，切换语言后重新加载页面。
// 优先级：URL ?lang=zh|en > 存档设置 > 浏览器语言；测试模式（?headless）固定中文。
export type Lang = 'zh' | 'en';

const SAVE_KEY = 'tomato_sister_save_v1';

function detect(): Lang {
  if (typeof location === 'undefined') return 'zh';
  const q = new URLSearchParams(location.search);
  const forced = q.get('lang');
  if (forced === 'zh' || forced === 'en') return forced;
  if (q.has('headless')) return 'zh';
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) ?? '{}')?.settings?.lang;
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {}
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export let lang: Lang = detect();

/** 仅供文档生成等离线场景切换语言 */
export function setLang(l: Lang): void {
  lang = l;
}

/** 双语文本：tx('开始游戏', 'Start') */
export const tx = (zh: string, en: string): string => (lang === 'en' ? en : zh);

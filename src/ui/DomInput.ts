// 通用文字输入框（DOM 覆盖层）：Electron 不支持 window.prompt，所以自己画一个。
// 用于输入挑战种子（D6）、构筑分享码（J2）等。返回 null 表示取消。
import { tx } from '../i18n';

export function promptText(title: string, placeholder = '', initial = ''): Promise<string | null> {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.style.cssText =
      'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);font-family:inherit';
    const box = document.createElement('div');
    box.style.cssText =
      'background:#3d1d22;border:3px solid #ffd166;border-radius:14px;padding:20px;min-width:min(420px,90vw);color:#fff4ea;display:flex;flex-direction:column;gap:12px';
    const h = document.createElement('div');
    h.textContent = title;
    h.style.cssText = 'font-size:20px;color:#ffd166';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = initial;
    input.placeholder = placeholder;
    input.setAttribute('aria-label', title);
    input.style.cssText = 'font-size:18px;padding:8px 10px;border-radius:8px;border:2px solid #7a2e35;background:#1a0a0c;color:#fff4ea';
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:10px;justify-content:flex-end';
    const mk = (label: string, bg: string) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = label;
      b.style.cssText = `font-size:16px;padding:8px 18px;border-radius:8px;border:none;background:${bg};color:#fff;cursor:pointer`;
      return b;
    };
    const cancel = mk(tx('取消', 'Cancel'), '#555');
    const ok = mk(tx('确定', 'OK'), '#52b788');
    const done = (v: string | null) => {
      wrap.remove();
      resolve(v);
    };
    cancel.onclick = () => done(null);
    ok.onclick = () => done(input.value.trim() || null);
    input.onkeydown = (e) => {
      e.stopPropagation(); // 不让游戏键盘响应
      if (e.key === 'Enter') ok.click();
      if (e.key === 'Escape') cancel.click();
    };
    row.append(cancel, ok);
    box.append(h, input, row);
    wrap.append(box);
    wrap.onclick = (e) => e.target === wrap && done(null);
    document.body.append(wrap);
    input.focus();
  });
}

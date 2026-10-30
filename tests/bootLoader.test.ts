import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { initLoader, setLoader, showLoader, hideLoader, removeLoaderNow } from '../src/ui/BootLoader';
import { setLang } from '../src/i18n';

function loader() {
  const names = new Set<string>();
  const attributes = new Map<string, string>();
  const properties = new Map<string, string>();
  const children = Object.fromEntries(
    ['.bl-brand', '.bl-title small', '.bl-label', '.bl-pct', '.bl-tip'].map((k) => [k, { textContent: '' }]),
  );
  return {
    classList: {
      add: (...ks: string[]) => ks.forEach((k) => names.add(k)),
      remove: (...ks: string[]) => ks.forEach((k) => names.delete(k)),
      contains: (k: string) => names.has(k),
      toggle: (k: string, on: boolean) => (on ? names.add(k) : names.delete(k)),
    },
    setAttribute: (k: string, v: string) => attributes.set(k, v),
    style: { setProperty: (k: string, v: string) => properties.set(k, v) },
    querySelector: (k: string) => children[k],
    children,
    attributes,
    properties,
  };
}

let el: ReturnType<typeof loader>;
let frames: FrameRequestCallback[];
beforeEach(() => {
  vi.useFakeTimers();
  el = loader();
  frames = [];
  vi.stubGlobal('document', { getElementById: () => el });
  vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
    frames.push(fn);
    return frames.length;
  });
  setLang('zh');
  removeLoaderNow();
  showLoader('加载资源…');
  frames.splice(0).forEach((f) => f(0));
});
afterEach(() => {
  removeLoaderNow();
  setLang('zh');
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('illustrated loading screen', () => {
  it('keeps actual progress monotonic and clamped, including the accessible value', () => {
    setLoader(0.68, '准备画面…');
    setLoader(0.2);
    setLoader(Number.NaN);
    expect(el.children['.bl-pct'].textContent).toBe('68%');
    expect(el.attributes.get('aria-valuenow')).toBe('68');
    expect(el.children['.bl-label'].textContent).toBe('准备画面…');
    setLoader(5);
    expect(el.properties.get('--p')).toBe('1.0000');
    expect(el.children['.bl-pct'].textContent).toBe('100%');
    expect(el.classList.contains('bl-complete')).toBe(true);
  });

  it('starts each new resource wait at zero', () => {
    setLoader(1);
    hideLoader();
    showLoader('加载角色…');
    expect(el.properties.get('--p')).toBe('0.0000');
    expect(el.classList.contains('bl-complete')).toBe(false);
    expect(el.children['.bl-pct'].textContent).toBe('0%');
    expect(el.classList.contains('bl-gone')).toBe(false);
    expect(el.classList.contains('bl-dim')).toBe(true);
  });

  it('does not let a queued fade-in resurrect a fast completed load', () => {
    hideLoader();
    showLoader('准备画面…');
    hideLoader();
    frames.splice(0).forEach((f) => f(0));
    vi.advanceTimersByTime(400);
    expect(el.classList.contains('bl-hide')).toBe(true);
    expect(el.classList.contains('bl-gone')).toBe(true);
  });

  it('does not let an earlier fade-out hide a new resource wait', () => {
    hideLoader();
    vi.advanceTimersByTime(200);
    showLoader('加载角色…');
    frames.splice(0).forEach((f) => f(0));
    vi.advanceTimersByTime(500);
    expect(el.classList.contains('bl-hide')).toBe(false);
    expect(el.classList.contains('bl-gone')).toBe(false);
  });

  it('localizes the live title, loading label and tips', () => {
    setLang('en');
    initLoader('Preparing…');
    expect(el.classList.contains('bl-en')).toBe(true);
    expect(el.children['.bl-brand'].textContent).toBe('TOMAGEDDON');
    expect(el.attributes.get('aria-label')).toBe('Loading progress');
    expect(el.children['.bl-label'].textContent).toBe('Preparing…');
    expect(el.children['.bl-tip'].textContent).toMatch(/^(Tip:|Watering|Polishing)/);
  });
});

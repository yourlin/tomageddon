// 单元测试环境：Phaser 依赖浏览器（window / canvas），在 Node 下用一个「万能代理」替身顶上，
// 只让纯逻辑模块（数据表、RunState、商店计价、开发者构筑）能被导入。
import { vi } from 'vitest';

type AnyFn = ((...a: unknown[]) => unknown) & Record<string | symbol, unknown>;

/** 既能 new、能调用、能取任意属性、能被 extends 的替身 */
function stub(): AnyFn {
  const target = function () {} as unknown as AnyFn;
  return new Proxy(target, {
    get(t, k) {
      if (k === 'prototype') return t.prototype;
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'then') return undefined;
      if (!(k in t)) t[k] = stub();
      return t[k];
    },
    apply: () => stub(),
    construct: () => stub() as object,
  });
}

vi.mock('phaser', () => {
  const P = stub();
  return { default: P, ...Object.fromEntries(['Scene', 'Math', 'GameObjects', 'Scenes', 'Input', 'Display', 'Geom', 'Scale', 'AUTO', 'Game'].map((k) => [k, P[k]])) };
});

// localStorage 替身（存档 / 开发者预设会读写）
const mem = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => void mem.set(k, String(v)),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  },
});
if (!('location' in globalThis)) Object.assign(globalThis, { location: { search: '', pathname: '/', href: 'http://localhost/' } });
if (!('navigator' in globalThis)) Object.assign(globalThis, { navigator: { language: 'zh-CN', userAgent: 'node' } });
if (!('window' in globalThis)) Object.assign(globalThis, { window: globalThis });
// 只需要能挂监听、建元素不报错（音频 / 输入初始化会碰到）
if (!('document' in globalThis))
  Object.assign(globalThis, {
    document: {
      addEventListener() {},
      removeEventListener() {},
      createElement: () => stub(),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      body: stub(),
      head: stub(),
      documentElement: stub(),
      visibilityState: 'visible',
    },
  });
for (const k of ['addEventListener', 'removeEventListener'])
  if (typeof (globalThis as Record<string, unknown>)[k] !== 'function') (globalThis as Record<string, unknown>)[k] = () => {};

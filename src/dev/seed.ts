// F4：固定随机种子。临时用 mulberry32 替换 Math.random，让暴击、闪避、掉落、AI 抉择可重复；
// restoreRandom() 换回浏览器原生实现。只在开发者界面里使用。
const nativeRandom = Math.random;
let current: number | null = null;

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedRandom(seed: number): void {
  current = seed;
  Math.random = mulberry32(seed);
}

export function restoreRandom(): void {
  current = null;
  Math.random = nativeRandom;
}

export const currentSeed = (): number | null => current;

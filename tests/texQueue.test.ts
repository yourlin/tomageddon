import { describe, expect, it } from 'vitest';
import { enqueueTex, flushTex, onTexReady, pumpTex, texProgress, texReady, texWeight } from '../src/systems/TexQueue';

const tasks = (n: number, w = 1, log: number[] = []) => Array.from({ length: n }, (_, i) => ({ run: () => log.push(i), w, k: `t${i}` }));

describe('TexQueue 分帧生成队列', () => {
  it('按顺序执行，进度单调递增，全部完成后回调等待者', () => {
    const log: number[] = [];
    enqueueTex(tasks(10, 1, log));
    let ready = 0;
    onTexReady(() => ready++);
    expect(texReady()).toBe(false);
    let last = texProgress();
    while (!pumpTex(1000, 3)) {
      expect(texProgress()).toBeGreaterThanOrEqual(last);
      last = texProgress();
    }
    expect(log).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(texProgress()).toBe(1);
    expect(ready).toBe(1);
  });

  it('maxWeight 限制单帧的贴图量，但每帧至少做一个', () => {
    const log: number[] = [];
    enqueueTex(tasks(5, 4, log));
    pumpTex(1000, 10); // 4 + 4 = 8，再加一个就超过 10
    expect(log.length).toBe(2);
    pumpTex(1000, 1); // 权重超上限也要至少做一个，避免卡死
    expect(log.length).toBe(3);
    flushTex();
    expect(texReady()).toBe(true);
  });

  it('单个任务出错不会卡住队列；已就绪时立即回调', () => {
    const log: number[] = [];
    enqueueTex([
      {
        run: () => {
          throw new Error('坏贴图');
        },
        w: 1,
      },
      ...tasks(2, 1, log),
    ]);
    const err = console.error;
    console.error = () => {};
    flushTex();
    console.error = err;
    expect(log).toEqual([0, 1]);
    let called = false;
    onTexReady(() => (called = true));
    expect(called).toBe(true);
  });

  it('权重随像素增长', () => {
    expect(texWeight(1, 1)).toBeCloseTo(1, 3);
    expect(texWeight(1000, 1000)).toBeGreaterThan(texWeight(100, 100));
  });
});

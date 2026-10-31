// 外部美术框架：外观选择与回退、动作时序、章节依赖、清单校验
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { EntityArtEntry, MapArtEntry } from '../src/data/artManifest';
import {
  chooseArt,
  chapterArtDeps,
  entryTexKey,
  frameIndexAt,
  sheetFrameCount,
  validateArt,
  TERRAIN_SPAWN_IDS,
  chapterCoverage,
  type ArtFileInfo,
} from '../src/systems/ArtResolve';
import { VisualState } from '../src/objects/VisualState';
import { identKey, TIMED } from '../src/objects/visualTypes';
import { SHADOWS } from '../src/data/bossPhases';
import { BOSS_MAP } from '../src/data/bosses';

const tomato: EntityArtEntry = {
  kind: 'char',
  id: 'tomato',
  version: 1,
  source: { type: 'spritesheet', file: 'motion.png', frameWidth: 64, frameHeight: 64, spacing: 2 },
  anims: { idle: { frames: [0, 1] }, attack: { frames: [2, 3, 4] } },
  reuse: { skins: { skin_tomato_2: { tint: 0xffd6e0 } } },
};
const maggot: EntityArtEntry = {
  kind: 'enemy',
  id: 'maggot',
  version: 1,
  source: { type: 'static', file: 'body.png' },
  reuse: { champ: 'goldAura' },
};
const mold: EntityArtEntry = { kind: 'enemy', id: 'mold', version: 1, source: { type: 'static', file: 'body.png' } };

describe('外观选择与回退', () => {
  const E = [tomato, maggot, mold];
  it('精确匹配基础外观', () => {
    expect(chooseArt({ kind: 'char', id: 'tomato' }, 'body', E)).toMatchObject({ entry: tomato, via: 'exact' });
  });
  it('皮肤：显式声明可复用时带调色，未声明的皮肤回退 Rig', () => {
    expect(chooseArt({ kind: 'char', id: 'tomato', skinId: 'skin_tomato_2' }, 'body', E)).toMatchObject({ via: 'reuse', tint: 0xffd6e0 });
    expect(chooseArt({ kind: 'char', id: 'tomato', skinId: 'skin_tomato' }, 'body', E)).toBeNull();
  });
  it('皮肤精确素材优先于复用', () => {
    const s: EntityArtEntry = {
      kind: 'char',
      id: 'tomato',
      skinId: 'skin_tomato_2',
      version: 1,
      source: { type: 'static', file: 'body.png' },
    };
    expect(chooseArt({ kind: 'char', id: 'tomato', skinId: 'skin_tomato_2' }, 'body', [...E, s])).toMatchObject({ entry: s, via: 'exact' });
  });
  it("reuse.skins = 'all' 时全部皮肤复用", () => {
    const all = { ...tomato, reuse: { skins: 'all' as const } };
    expect(chooseArt({ kind: 'char', id: 'tomato', skinId: 'skin_tomato_3' }, 'body', [all])).toMatchObject({ via: 'reuse' });
  });
  it('词缀精英：没有专门素材时都复用基础插画并加金色光环（不退回另一种画风，也不会显示成普通怪）', () => {
    expect(chooseArt({ kind: 'enemy', id: 'maggot', variant: 'champ' }, 'body', E)).toMatchObject({ via: 'reuse', aura: 'gold' });
    expect(chooseArt({ kind: 'enemy', id: 'mold', variant: 'champ' }, 'body', E)).toMatchObject({
      entry: mold,
      via: 'reuse',
      aura: 'gold',
    });
    expect(chooseArt({ kind: 'enemy', id: 'nobody', variant: 'champ' }, 'body', E)).toBeNull();
  });
  it('没有素材的实体回退 Rig', () => {
    expect(chooseArt({ kind: 'boss', id: 'mold_king' }, 'body', E)).toBeNull();
  });
  it('头像：显式声明或目录里有 portrait.png', () => {
    const files = new Set(['entities/enemy/mold/portrait.png']);
    expect(chooseArt({ kind: 'enemy', id: 'mold' }, 'portrait', E, files)).toMatchObject({ entry: mold });
    expect(chooseArt({ kind: 'enemy', id: 'maggot' }, 'portrait', E, files)).toBeNull();
    const onlyPortrait: EntityArtEntry = { kind: 'boss', id: 'mold_king', version: 1, portrait: 'p.png' };
    expect(chooseArt({ kind: 'boss', id: 'mold_king' }, 'portrait', [onlyPortrait])).not.toBeNull();
    expect(chooseArt({ kind: 'boss', id: 'mold_king' }, 'body', [onlyPortrait])).toBeNull();
  });
  it('纹理 key 带命名空间与版本：同名 body.png 不冲突，换版本缓存失效', () => {
    expect(entryTexKey(maggot, 'body')).not.toBe(entryTexKey(mold, 'body'));
    expect(entryTexKey({ ...mold, version: 2 }, 'body')).not.toBe(entryTexKey(mold, 'body'));
    expect(identKey({ kind: 'enemy', id: 'mold', variant: 'champ' })).toBe('enemy_mold_champ');
  });
});

describe('动作帧时序', () => {
  it('一次性动作按玩法时长拉伸（fit），不延长玩法', () => {
    const a = { frames: [0, 1, 2, 3], fps: 2 }; // 按 fps 要 2 秒
    const T = TIMED.attack!;
    expect(frameIndexAt(a, 'attack', 0, T)).toBe(0);
    expect(frameIndexAt(a, 'attack', T * 0.6, T)).toBe(2);
    expect(frameIndexAt(a, 'attack', T * 2, T)).toBe(3);
  });
  it('hold 模式按 fps 播放并停在末帧', () => {
    const a = { frames: [0, 1, 2], fps: 10, fit: 'hold' as const };
    expect(frameIndexAt(a, 'cast', 0.15, TIMED.cast)).toBe(1);
    expect(frameIndexAt(a, 'cast', 5, TIMED.cast)).toBe(2);
  });
  it('idle / move 循环，windup 默认停在末帧', () => {
    const a = { frames: [0, 1, 2], fps: 10 };
    expect(frameIndexAt(a, 'idle', 0.35)).toBe(0);
    expect(frameIndexAt(a, 'windup', 0.35)).toBe(2);
    expect(frameIndexAt({ ...a, loop: true }, 'windup', 0.35)).toBe(0);
  });
});

describe('动作状态机（与 Rig 同语义）', () => {
  it('一次性动作结束后回到基础状态，按移动强度切换 idle / move', () => {
    const s = new VisualState();
    s.play('attack');
    s.tick(TIMED.attack! + 0.01, 1);
    expect(s.state).toBe('move');
    s.tick(0.1, 0);
    expect(s.state).toBe('idle');
  });
  it('同一循环状态重复调用不重启，force 重播', () => {
    const s = new VisualState();
    s.tick(0.5, 0);
    expect(s.play('idle')).toBe(false);
    expect(s.elapsed).toBeCloseTo(0.5);
    expect(s.play('idle', true)).toBe(true);
    expect(s.elapsed).toBe(0);
  });
  it('冻结时不推进、只接受死亡或强制切换', () => {
    const s = new VisualState();
    s.play('frozen');
    expect(s.play('attack')).toBe(false);
    s.tick(5, 1);
    expect(s.state).toBe('frozen');
    s.play('idle', true);
    expect(s.state).toBe('idle');
  });
  it('死亡回调只执行一次，死亡期间普通动作无效', () => {
    const s = new VisualState();
    let n = 0;
    s.die(() => n++);
    expect(s.play('hurt')).toBe(false);
    expect(s.tick(TIMED.die! + 0.01, 0)).toBe('died');
    s.tick(1, 0);
    expect(n).toBe(1);
    expect(s.onDieDone).toBeNull();
  });
  it('冻结中死亡也会完成回收', () => {
    const s = new VisualState();
    let n = 0;
    s.play('frozen');
    s.die(() => n++);
    s.tick(1, 0);
    expect(n).toBe(1);
  });
  it('reset 清掉死亡回调（回池后下一只怪不会继承上一只的死亡）', () => {
    const s = new VisualState();
    let n = 0;
    s.die(() => n++);
    s.reset();
    s.tick(1, 0);
    expect(n).toBe(0);
    expect(s.state).toBe('idle');
  });
});

describe('章节依赖', () => {
  it('包含角色皮肤、怪物池、召唤物、精英 / Boss 池与精英变体', () => {
    const deps = chapterArtDeps(1, 'tomato', 'skin_tomato_2').map(identKey);
    expect(deps).toContain('char_tomato_skin_tomato_2');
    expect(deps).toContain('enemy_mold');
    expect(deps).toContain('enemy_mold_champ');
    expect(deps).toContain('boss_mold_king');
    // 每种普通怪都带精英变体
    for (const k of deps.filter((d) => d.startsWith('enemy_') && !d.endsWith('_champ'))) expect(deps).toContain(`${k}_champ`);
  });
  it('腐烂之王的前代残影计入依赖', () => {
    const ch = BOSS_MAP[SHADOWS.boss].chapter;
    const deps = chapterArtDeps(ch).map(identKey);
    for (const id of SHADOWS.ids) expect(deps).toContain(`boss_${id}`);
  });
  it('地形机关刷出的怪都登记在 TERRAIN_SPAWN_IDS', () => {
    const src = readFileSync('src/systems/Terrain.ts', 'utf8');
    const ids = new Set([...src.matchAll(/spawnEnemyNow\(([^,]+),/g)].flatMap((m) => [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1])));
    expect(ids.size).toBeGreaterThan(0);
    for (const id of ids) expect(TERRAIN_SPAWN_IDS).toContain(id);
  });
  it('没有素材时覆盖报告全部为程序化', () => {
    expect(chapterCoverage(1, []).every((r) => r.body === 'rig' && r.portrait === 'rig')).toBe(true);
  });
});

describe('清单校验', () => {
  const files = (o: Record<string, ArtFileInfo>) => new Map(Object.entries(o));
  const msgs = (d: ReturnType<typeof validateArt>, level = 'error') => d.filter((x) => x.level === level).map((x) => `${x.where} ${x.msg}`);

  it('合法清单没有错误', () => {
    const d = validateArt(files({ 'entities/char/tomato/motion.png': { width: 64 * 3 + 4, height: 64 * 2 + 2 } }), [tomato], []);
    expect(msgs(d)).toEqual([]);
  });
  it('未知实体、不属于该角色的皮肤、错误变体、重复条目', () => {
    const bad: EntityArtEntry[] = [
      { kind: 'enemy', id: 'nope', version: 1, portrait: 'p.png' },
      { kind: 'char', id: 'tomato', skinId: 'skin_carrot', version: 1, portrait: 'p.png' },
      { kind: 'boss', id: 'mold_king', variant: 'champ', version: 1, portrait: 'p.png' },
      mold,
      { ...mold },
    ];
    const m = msgs(validateArt(files({}), bad, [])).join('\n');
    expect(m).toMatch(/未知实体 id「nope」/);
    expect(m).toMatch(/皮肤「skin_carrot」不属于/);
    expect(m).toMatch(/变体「champ」只适用于/);
    expect(m).toMatch(/重复条目/);
    expect(m).toMatch(/缺少文件 entities\/enemy\/mold\/body\.png/);
  });
  it('精灵表帧号越界', () => {
    const e = { ...tomato, anims: { idle: { frames: [0, 9] } } };
    const m = msgs(validateArt(files({ 'entities/char/tomato/motion.png': { width: 130, height: 64 } }), [e], [])).join('\n');
    expect(sheetFrameCount(130, 64, 64, 64, 0, 2)).toBe(2);
    expect(m).toMatch(/动作 idle 的帧不存在：9/);
  });
  it('图集：旋转打包与不存在的帧名', () => {
    const e: EntityArtEntry = {
      kind: 'enemy',
      id: 'fly',
      version: 1,
      source: { type: 'atlas', file: 'a.png', data: 'a.json' },
      anims: { move: { frames: ['f0', 'f9'] } },
    };
    const json = { frames: { f0: { frame: { x: 0, y: 0, w: 8, h: 8 } }, f1: { rotated: true, frame: { x: 8, y: 0, w: 8, h: 8 } } } };
    const m = msgs(
      validateArt(files({ 'entities/enemy/fly/a.png': { width: 16, height: 8 }, 'entities/enemy/fly/a.json': { json } }), [e], []),
    ).join('\n');
    expect(m).toMatch(/旋转打包/);
    expect(m).toMatch(/动作 move 的帧不存在：f9/);
  });
  it('未登记的文件给出警告；地图校验章节与文件', () => {
    const maps: MapArtEntry[] = [{ ch: 99, version: 1, ground: 'ground.webp' }];
    const d = validateArt(files({ 'entities/enemy/rat/body.png': {}, 'maps/ch99/ground.webp': {} }), [], maps);
    expect(msgs(d, 'warn').join('\n')).toMatch(/entities\/enemy\/rat\/body\.png 文件没有被清单引用/);
    expect(msgs(d).join('\n')).toMatch(/未知章节 99/);
  });
});

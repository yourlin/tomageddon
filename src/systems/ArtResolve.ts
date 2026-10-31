// 外部美术的纯逻辑部分（不依赖 Phaser，可单测）：外观选择与回退、贴图命名空间、章节依赖、清单校验与覆盖报告。
// 资源加载 / 引用 / 卸载见 ArtRegistry.ts，视觉对象见 objects/visualFactory.ts。
import { ENTITY_ART, MAP_ART, type EntityArtEntry, type MapArtEntry, type ArtAnim } from '../data/artManifest';
import { RIG_STATES, identKey, type RigState, type VisualIdent, type VisualKind } from '../objects/visualTypes';
import { CHARACTER_MAP } from '../data/characters';
import { ENEMY_MAP } from '../data/enemies';
import { BOSS_MAP, bossPool, elitePool, type BossDef, type Pattern } from '../data/bosses';
import { CHAPTERS } from '../data/chapters';
import { SKINS_OF } from '../data/skins';
import { SHADOWS } from '../data/bossPhases';
import { TRUE_FINAL_BOSS_ID } from '../data/chaptersExtra';

export const KINDS: readonly VisualKind[] = ['char', 'enemy', 'boss'];

/** 条目目录（相对 src/assets/entities） */
export function entryDir(e: Pick<EntityArtEntry, 'kind' | 'id' | 'skinId' | 'variant' | 'dir'>): string {
  if (e.dir) return e.dir.replace(/^\/+|\/+$/g, '');
  return `${e.kind}/${e.id}${e.skinId ? `/${e.skinId}` : e.variant ? `/${e.variant}` : ''}`;
}

export function mapDir(m: Pick<MapArtEntry, 'ch' | 'dir'>): string {
  return m.dir ? m.dir.replace(/^\/+|\/+$/g, '') : `ch${m.ch}`;
}

/** 条目内文件的路径（相对 src/assets） */
export const entryFile = (e: EntityArtEntry, file: string): string => `entities/${entryDir(e)}/${file}`;
export const mapFile = (m: MapArtEntry, file: string): string => `maps/${mapDir(m)}/${file}`;

/** 带命名空间的贴图 key：不同目录的同名 body.png 不会互相覆盖；带资源版本，换图后缓存自然失效 */
export const entryTexKey = (e: EntityArtEntry, part: 'body' | 'portrait' | 'blink'): string => `art:${entryDir(e)}@${e.version}:${part}`;
export const mapTexKey = (m: MapArtEntry, part: 'ground' | 'foreground' | 'thumb' | `object:${string}`): string =>
  `art:maps/${mapDir(m)}@${m.version}:${part}`;

/** 外观解析结果：用哪条素材、是否复用（附带调色 / 金色光环） */
export interface ArtChoice {
  entry: EntityArtEntry;
  via: 'exact' | 'reuse';
  tint?: number;
  aura?: 'gold';
}

const sameIdent = (e: EntityArtEntry, v: VisualIdent): boolean =>
  e.kind === v.kind && e.id === v.id && (e.skinId ?? '') === (v.skinId ?? '') && (e.variant ?? '') === (v.variant ?? '');

/**
 * 外观选择（part = body 战斗形象 / portrait 头像）：
 * 1. 精确匹配实体 + 皮肤 + 变体的条目；
 * 2. 基础条目显式声明可复用到该皮肤（可调色）；怪物的词缀精英默认复用基础外观并加金色光环；
 * 3. 返回 null → 调用方使用对应皮肤 / 变体的程序化 Rig。
 */
export function chooseArt(
  v: VisualIdent,
  part: 'body' | 'portrait' | 'blink' = 'body',
  entries: EntityArtEntry[] = ENTITY_ART,
  files?: ReadonlySet<string>,
): ArtChoice | null {
  const has = (e: EntityArtEntry): boolean => (part === 'body' ? !!e.source : !!portraitFile(e, files));
  const exact = entries.find((e) => sameIdent(e, v) && has(e));
  if (exact) return { entry: exact, via: 'exact' };
  if (!v.skinId && !v.variant) return null;
  const base = entries.find((e) => e.kind === v.kind && e.id === v.id && !e.skinId && !e.variant && has(e));
  if (!base) return null;
  if (v.skinId) {
    const s = base.reuse?.skins;
    if (s === 'all') return { entry: base, via: 'reuse' };
    const r = s?.[v.skinId];
    return r ? { entry: base, via: 'reuse', tint: r.tint } : null;
  }
  // 词缀精英：没有专门的精英素材时复用基础插画并加金色光环，不能退回另一种画风的 Rig
  if (v.variant === 'champ' && base.kind === 'enemy') return { entry: base, via: 'reuse', aura: 'gold' };
  return null;
}

/** 条目的头像文件（显式声明，或目录里存在 portrait.png / portrait.webp） */
export function portraitFile(e: EntityArtEntry, files?: ReadonlySet<string>): string | null {
  if (e.portrait) return e.portrait;
  if (!files) return null;
  for (const f of ['portrait.png', 'portrait.webp']) if (files.has(entryFile(e, f))) return f;
  return null;
}

export const mapArtFor = (ch: number, maps: MapArtEntry[] = MAP_ART): MapArtEntry | undefined => maps.find((m) => m.ch === ch);

/** 动作是否循环（未声明时按状态默认） */
export const animLoops = (state: RigState, a: ArtAnim): boolean =>
  a.loop ?? (state === 'idle' || state === 'move' || state === 'stun' || state === 'victory' || state === 'frozen');

/**
 * 动作在 elapsed 秒时显示第几帧（返回 frames 的下标）。
 * timed = 一次性动作的玩法时长；fit 模式把整段动画压缩 / 拉伸到这个时长，hold 模式按 fps 播放、停在末帧。
 * 游戏暂停时 elapsed 不推进，动画也就停住；动画长度永远不会反过来影响玩法时长。
 */
export function frameIndexAt(a: ArtAnim, state: RigState, elapsed: number, timed?: number): number {
  const n = a.frames.length;
  if (n <= 1) return 0;
  const fps = a.fps && a.fps > 0 ? a.fps : 10;
  if (timed && (a.fit ?? 'fit') === 'fit' && !animLoops(state, a)) return Math.min(n - 1, Math.floor((elapsed / timed) * n));
  const i = Math.floor(elapsed * fps);
  return animLoops(state, a) ? i % n : Math.min(n - 1, i);
}

// ---------------------------------------------------------------- 章节依赖

/** 地形机关会刷出的怪（Terrain.ts 里 spawnEnemyNow 的固定 id，测试会核对） */
export const TERRAIN_SPAWN_IDS = ['mold', 'cockroach', 'rabbit', 'gopher', 'blight_sprout'];

function bossPatterns(b: BossDef): Pattern[] {
  return [...b.patterns, ...(b.phase2?.add ?? []), ...(b.phases ?? []).flatMap((p) => [...p.patterns, ...(p.transition ?? [])])];
}

/** 一局需要的实体外观：角色（含皮肤，分身 / 技能共用）、章节怪物池及其召唤 / 分裂物、精英与 Boss 池、残影、词缀精英变体 */
export function chapterArtDeps(
  chId: number,
  charId?: string,
  skinId?: string,
  scope?: { wave: number; bossIds: readonly string[] },
): VisualIdent[] {
  const out = new Map<string, VisualIdent>();
  const add = (v: VisualIdent): void => void out.set(identKey(v), v);
  if (charId) add({ kind: 'char', id: charId, ...(skinId ? { skinId } : {}) });
  const enemies = new Set<string>();
  const addEnemy = (id: string | undefined): void => {
    if (!id || enemies.has(id) || !ENEMY_MAP[id]) return;
    enemies.add(id);
    const d = ENEMY_MAP[id];
    addEnemy(d.summon);
    addEnemy(d.splitInto);
  };
  const ch = CHAPTERS.find((c) => c.id === chId);
  for (const p of ch?.pool ?? []) if (!scope || (scope.wave >= p.from && (p.to === undefined || scope.wave <= p.to))) addEnemy(p.enemy);
  for (const id of TERRAIN_SPAWN_IDS) addEnemy(id);
  const bosses = new Set<string>();
  const addBoss = (b: BossDef | undefined): void => {
    if (!b || bosses.has(b.id)) return;
    bosses.add(b.id);
    for (const p of bossPatterns(b)) addEnemy(p.enemy);
    if (b.id === SHADOWS.boss) for (const id of SHADOWS.ids) addBoss(BOSS_MAP[id]);
  };
  if (scope) for (const id of scope.bossIds) addBoss(BOSS_MAP[id]);
  else {
    for (const b of [...elitePool(chId), ...bossPool(chId)]) addBoss(b);
    if (BOSS_MAP[TRUE_FINAL_BOSS_ID]?.chapter === chId) addBoss(BOSS_MAP[TRUE_FINAL_BOSS_ID]);
  }
  for (const id of enemies) {
    add({ kind: 'enemy', id });
    add({ kind: 'enemy', id, variant: 'champ' });
  }
  for (const id of bosses) add({ kind: 'boss', id });
  return [...out.values()];
}

// ---------------------------------------------------------------- 清单校验

export interface ArtDiag {
  level: 'error' | 'warn';
  where: string;
  msg: string;
}

/** 校验用的文件信息（路径相对 src/assets；图片尺寸与图集 JSON 由调用方读取） */
export interface ArtFileInfo {
  width?: number;
  height?: number;
  json?: unknown;
}

interface AtlasFrame {
  rotated?: boolean;
}

/** 从 TexturePacker JSON（Hash / Array）里取帧表 */
export function atlasFrames(json: unknown): Map<string, AtlasFrame> | null {
  const fr = (json as { frames?: unknown } | null)?.frames;
  if (Array.isArray(fr)) return new Map(fr.map((f: { filename: string } & AtlasFrame) => [f.filename, f]));
  if (fr && typeof fr === 'object') return new Map(Object.entries(fr as Record<string, AtlasFrame>));
  return null;
}

/** 规则精灵表的帧数（Phaser 的切分规则：margin 外边距、spacing 帧间距） */
export function sheetFrameCount(w: number, h: number, fw: number, fh: number, margin = 0, spacing = 0): number {
  const cols = Math.floor((w - margin * 2 + spacing) / (fw + spacing));
  const rows = Math.floor((h - margin * 2 + spacing) / (fh + spacing));
  return Math.max(0, cols) * Math.max(0, rows);
}

const ENTITY_DEFS: Record<VisualKind, Record<string, unknown>> = { char: CHARACTER_MAP, enemy: ENEMY_MAP, boss: BOSS_MAP };

export function validateArt(
  files: ReadonlyMap<string, ArtFileInfo>,
  entries: EntityArtEntry[] = ENTITY_ART,
  maps: MapArtEntry[] = MAP_ART,
): ArtDiag[] {
  const out: ArtDiag[] = [];
  const used = new Set<string>();
  const seen = new Map<string, string>();
  const err = (where: string, msg: string): void => void out.push({ level: 'error', where, msg });
  const warn = (where: string, msg: string): void => void out.push({ level: 'warn', where, msg });
  const need = (where: string, path: string): ArtFileInfo | null => {
    used.add(path);
    const f = files.get(path);
    if (!f) err(where, `缺少文件 ${path}`);
    return f ?? null;
  };

  for (const e of entries) {
    const where = `${e.kind}:${e.id}${e.skinId ? `:${e.skinId}` : ''}${e.variant ? `:${e.variant}` : ''}`;
    if (!KINDS.includes(e.kind)) {
      err(where, `未知 kind「${e.kind}」`);
      continue;
    }
    if (!ENTITY_DEFS[e.kind][e.id]) err(where, `未知实体 id「${e.id}」`);
    if (e.skinId && (e.kind !== 'char' || !SKINS_OF[e.id]?.some((s) => s.id === e.skinId))) err(where, `皮肤「${e.skinId}」不属于该实体`);
    if (e.variant && (e.variant !== 'champ' || e.kind !== 'enemy')) err(where, `变体「${e.variant}」只适用于普通怪物的 champ`);
    if (!Number.isInteger(e.version) || e.version < 1) err(where, 'version 必须是正整数');
    const k = identKey(e);
    if (seen.has(k)) err(where, `重复条目（与 ${seen.get(k)} 相同身份）`);
    seen.set(k, where);
    if (e.anchor && (e.anchor.x < 0 || e.anchor.x > 1 || e.anchor.y < 0 || e.anchor.y > 1)) err(where, 'anchor 必须在 0~1 之间');
    if (e.refRadius !== undefined && !(e.refRadius > 0)) err(where, 'refRadius 必须 > 0');
    if (e.reuse && (e.skinId || e.variant)) warn(where, 'reuse 只在基础条目上生效');
    if (e.reuse?.skins && e.reuse.skins !== 'all')
      for (const s of Object.keys(e.reuse.skins))
        if (!SKINS_OF[e.id]?.some((x) => x.id === s)) err(where, `reuse.skins 里的「${s}」不是该角色的皮肤`);
    if (e.reuse?.champ && e.kind !== 'enemy') err(where, 'reuse.champ 只适用于普通怪物');
    if (e.blink) {
      const closed = need(where, entryFile(e, e.blink));
      if (e.source?.type !== 'static') err(where, 'blink 只适用于静态形象');
      const open = e.source && files.get(entryFile(e, e.source.file));
      if (closed?.width && open?.width && (closed.width !== open.width || closed.height !== open.height))
        err(where, '闭眼帧与原图画布尺寸必须一致');
    }
    const pf = e.portrait ?? null;
    if (pf) need(where, entryFile(e, pf));
    for (const f of ['portrait.png', 'portrait.webp']) if (files.has(entryFile(e, f))) used.add(entryFile(e, f));
    if (!e.source) {
      if (!pf && !['portrait.png', 'portrait.webp'].some((f) => files.has(entryFile(e, f)))) err(where, '既没有 source 也没有头像');
      if (e.anims) warn(where, '没有 source 时 anims 不生效');
      continue;
    }
    const s = e.source;
    const img = need(where, entryFile(e, s.file));
    // 每个动作的合法帧
    let valid: (f: number | string) => boolean = () => true;
    let total = 1;
    if (s.type === 'static') {
      valid = (f) => f === 0;
      if (e.anims && Object.values(e.anims).some((a) => a && a.frames.length > 1)) warn(where, '静态图只有一帧，多帧动作无效');
    } else if (s.type === 'spritesheet') {
      if (!(s.frameWidth > 0 && s.frameHeight > 0)) err(where, 'frameWidth / frameHeight 必须 > 0');
      if (img?.width && img.height) {
        total = sheetFrameCount(img.width, img.height, s.frameWidth, s.frameHeight, s.margin, s.spacing);
        if (!total) err(where, `图片 ${img.width}×${img.height} 切不出 ${s.frameWidth}×${s.frameHeight} 的帧`);
        const m = s.margin ?? 0,
          sp = s.spacing ?? 0;
        const cols = Math.floor((img.width - m * 2 + sp) / (s.frameWidth + sp));
        const usedW = m * 2 + cols * s.frameWidth + (cols - 1) * sp;
        if (total && usedW !== img.width)
          warn(where, `图片宽 ${img.width} 不是整数帧（多出 ${img.width - usedW}px），检查 frameWidth / spacing / margin`);
        valid = (f) => typeof f === 'number' && Number.isInteger(f) && f >= 0 && f < total;
      } else valid = (f) => typeof f === 'number' && Number.isInteger(f) && f >= 0;
      if (!s.spacing) warn(where, '精灵表没有帧间距（spacing），缩放采样可能串色');
    } else if (s.type === 'atlas') {
      const data = need(where, entryFile(e, s.data));
      // 运行期拿不到 JSON 内容（只有 URL），帧名检查留给 check:art 与加载后的 sanitize
      const frames = data?.json !== undefined ? atlasFrames(data.json) : null;
      if (data && data.json !== undefined && !frames) err(where, `图集 ${s.data} 不是 TexturePacker JSON（Hash / Array）`);
      if (frames) {
        total = frames.size;
        for (const [name, f] of frames) if (f.rotated) err(where, `图集帧「${name}」使用了旋转打包（不支持，会导致锚点漂移）`);
        valid = (f) => typeof f === 'string' && frames.has(f);
      } else valid = (f) => typeof f === 'string';
    } else err(where, `未知 source.type「${(s as { type: string }).type}」`);
    if (e.baseFrame !== undefined && !valid(e.baseFrame)) err(where, `baseFrame「${e.baseFrame}」不存在`);
    for (const [st, a] of Object.entries(e.anims ?? {})) {
      if (!RIG_STATES.includes(st as RigState)) {
        err(where, `未知动作「${st}」`);
        continue;
      }
      if (!a?.frames.length) {
        err(where, `动作 ${st} 没有帧`);
        continue;
      }
      if (a.fps !== undefined && !(a.fps > 0)) err(where, `动作 ${st} 的 fps 必须 > 0`);
      const bad = a.frames.filter((f) => !valid(f));
      if (bad.length) err(where, `动作 ${st} 的帧不存在：${bad.slice(0, 5).join(', ')}${total > 1 ? `（共 ${total} 帧）` : ''}`);
    }
    if (s.type !== 'static' && !e.anims?.idle && e.baseFrame === undefined) warn(where, '没有 idle 动作也没有 baseFrame，将使用第一帧');
  }

  const chs = new Set(CHAPTERS.map((c) => c.id));
  const mapSeen = new Set<number>();
  for (const m of maps) {
    const where = `map:ch${m.ch}`;
    if (!chs.has(m.ch)) err(where, `未知章节 ${m.ch}`);
    if (mapSeen.has(m.ch)) err(where, '重复的地图条目');
    mapSeen.add(m.ch);
    if (!Number.isInteger(m.version) || m.version < 1) err(where, 'version 必须是正整数');
    need(where, mapFile(m, m.ground));
    if (m.thumb) need(where, mapFile(m, m.thumb));
    if (m.foreground) need(where, mapFile(m, m.foreground.file));
    for (const [name, object] of Object.entries(m.objects ?? {})) {
      need(`${where}:${name}`, mapFile(m, object.file));
      if (!(object.width > 0 && object.height > 0)) err(`${where}:${name}`, '环境机关显示宽高必须 > 0');
      if (object.fromWave !== undefined && (!Number.isInteger(object.fromWave) || object.fromWave < 1))
        err(`${where}:${name}`, '环境机关起始波次必须是正整数');
    }
    if (m.world && !(m.world.w > 0 && m.world.h > 0)) err(where, 'world 的宽高必须 > 0');
  }

  for (const p of files.keys())
    if ((p.startsWith('entities/') || p.startsWith('maps/')) && !used.has(p) && !/(^|\/)(README|readme)[^/]*$|\.(md|txt)$/.test(p))
      warn(p, '文件没有被清单引用（不会加载）');
  return out;
}

// ---------------------------------------------------------------- 覆盖报告

export interface CoverageRow {
  ident: VisualIdent;
  body: 'exact' | 'reuse' | 'rig';
  portrait: 'exact' | 'reuse' | 'rig';
  anims: RigState[];
}

/** 每章依赖的实体用了哪种外观（rig = 程序化回退） */
export function chapterCoverage(chId: number, entries: EntityArtEntry[] = ENTITY_ART, files?: ReadonlySet<string>): CoverageRow[] {
  const ids = chapterArtDeps(chId).filter((v) => v.kind !== 'char');
  return ids.map((ident) => {
    const b = chooseArt(ident, 'body', entries, files);
    const p = chooseArt(ident, 'portrait', entries, files);
    return {
      ident,
      body: b?.via ?? 'rig',
      portrait: p?.via ?? 'rig',
      anims: b ? (Object.keys(b.entry.anims ?? {}) as RigState[]) : [],
    };
  });
}

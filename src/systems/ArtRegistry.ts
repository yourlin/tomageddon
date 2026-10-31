// 外部美术资源管理：按清单加载（单图 / 规则精灵表 / 图集各走一个入口）、加载状态与诊断、失败重试、
// 引用计数与卸载。纹理和实体生命周期分开：实体回池 / 销毁不卸载纹理；卸载前检查持有者（场景 / 头像缓存）与存活的外观对象。
import Phaser from 'phaser';
import { ENTITY_ART, MAP_ART, type EntityArtEntry, type MapArtEntry, type ArtAnim } from '../data/artManifest';
import {
  chooseArt,
  entryFile,
  entryTexKey,
  mapFile,
  mapTexKey,
  portraitFile,
  validateArt,
  type ArtChoice,
  type ArtDiag,
} from './ArtResolve';
import { identKey, type RigState, type VisualIdent } from '../objects/EntityVisual';
import type { ReadyArt } from '../objects/SpriteVisual';
import { RUNTIME_ART_URLS, runtimeArtScale } from './RuntimeArt';
import { isForceProcedural } from './ArtStyle';

/** 构建时收集的素材 URL（路径相对 src/assets）；这些目录不进 Assets.ts 的全目录扫描 */
const URLS: Record<string, string> = Object.fromEntries(
  Object.entries(RUNTIME_ART_URLS).filter(([p]) => p.startsWith('entities/') || p.startsWith('maps/')),
);
export const ART_FILES: ReadonlySet<string> = new Set(Object.keys(URLS));

type Status = 'loading' | 'ready' | 'failed';
const status = new Map<string, Status>();
const diags: ArtDiag[] = [];
/** 每张纹理的持有者（场景 key / 'portrait' 等） */
const owners = new Map<string, Set<string>>();
/** 每张纹理正在使用它的外观对象数量 */
const live = new Map<string, number>();
/** 每张纹理整理后的条目（剔除了不存在的帧） */
const sanitized = new Map<string, EntityArtEntry>();
const listeners = new Set<(key: string) => void>();
/** 正在加载的纹理属于哪个场景的加载器（多个场景可能同时在加载） */
const loaderOf = new Map<string, Phaser.Loader.LoaderPlugin>();

function diag(level: ArtDiag['level'], where: string, msg: string): void {
  if (diags.some((d) => d.where === where && d.msg === msg)) return;
  diags.push({ level, where, msg });
  if (import.meta.env?.DEV) console.warn(`[art] ${where}: ${msg}`);
}

// 启动时做一次运行期能做的校验（缺文件、未知实体、重复条目、未登记文件；图片尺寸类检查见 npm run check:art）
for (const d of validateArt(new Map([...ART_FILES].map((p) => [p, {}])))) diag(d.level, d.where, d.msg);

/** 当前全部诊断（缺图、坏图集、缺帧、重复、未知实体、下载失败） */
export const artDiagnostics = (): readonly ArtDiag[] => diags;

/** 资源加载完成时通知（头像缓存、展示外观据此刷新） */
export function onArtLoaded(fn: (key: string) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const artStatus = (key: string): Status | undefined => status.get(key);

function queueKey(scene: Phaser.Scene, key: string, file: () => void): boolean {
  if (scene.textures.exists(key)) {
    status.set(key, 'ready');
    return false;
  }
  const st = status.get(key);
  if (st === 'loading' || st === 'failed') return false;
  status.set(key, 'loading');
  loaderOf.set(key, scene.load);
  file();
  return true;
}

function queueEntryBody(scene: Phaser.Scene, e: EntityArtEntry): boolean {
  const s = e.source;
  if (!s) return false;
  const key = entryTexKey(e, 'body');
  const url = URLS[entryFile(e, s.file)];
  if (!url) {
    status.set(key, 'failed');
    return false;
  }
  return queueKey(scene, key, () => {
    if (s.type === 'static') scene.load.image(key, url);
    else if (s.type === 'spritesheet')
      scene.load.spritesheet(key, url, { frameWidth: s.frameWidth, frameHeight: s.frameHeight, spacing: s.spacing, margin: s.margin });
    else {
      const data = URLS[entryFile(e, s.data)];
      if (data) scene.load.atlas(key, url, data);
      else status.set(key, 'failed');
    }
  });
}

function queueEntryPortrait(scene: Phaser.Scene, e: EntityArtEntry): boolean {
  const f = portraitFile(e, ART_FILES);
  const url = f && URLS[entryFile(e, f)];
  if (!url) return false;
  const key = entryTexKey(e, 'portrait');
  return queueKey(scene, key, () => scene.load.image(key, url));
}

const mapObjectsAt = (m: MapArtEntry, wave = Infinity) =>
  Object.entries(m.objects ?? {}).filter(([, object]) => (object.fromWave ?? 1) <= wave);

function queueMap(scene: Phaser.Scene, m: MapArtEntry, parts: ('ground' | 'foreground' | 'thumb')[], wave?: number): boolean {
  let any = false;
  for (const part of parts) {
    const file = part === 'ground' ? m.ground : part === 'thumb' ? m.thumb : m.foreground?.file;
    const url = file && URLS[mapFile(m, file)];
    if (!url) continue;
    const key = mapTexKey(m, part);
    any = queueKey(scene, key, () => scene.load.image(key, url)) || any;
  }
  if (parts.includes('ground'))
    for (const [name, object] of mapObjectsAt(m, wave)) {
      const url = URLS[mapFile(m, object.file)];
      if (url) any = queueKey(scene, mapTexKey(m, `object:${name}`), () => scene.load.image(mapTexKey(m, `object:${name}`), url)) || any;
    }
  return any;
}

export interface ArtRequest {
  /** 战斗 / 展示形象 */
  bodies?: VisualIdent[];
  /** 头像 */
  portraits?: VisualIdent[];
  /** 复古风下也加载（画风选择界面的缩略图） */
  raw?: boolean;
  /** 章节地图 */
  maps?: { ch: number; parts: ('ground' | 'foreground' | 'thumb')[]; wave?: number }[];
}

/** 把请求的素材排进场景的加载队列（在 preload 里调用会随场景加载；否则用 loadArt）。返回是否有新文件 */
export function queueArt(scene: Phaser.Scene, req: ArtRequest, owner?: string, pendingLoaders?: Set<Phaser.Loader.LoaderPlugin>): boolean {
  if (isForceProcedural() && !req.raw) return false;
  let any = false;
  const keys: string[] = [];
  for (const v of req.bodies ?? []) {
    const c = chooseArt(v, 'body', ENTITY_ART, ART_FILES);
    if (!c) continue;
    any = queueEntryBody(scene, c.entry) || any;
    keys.push(entryTexKey(c.entry, 'body'));
    if (c.entry.blink && c.entry.source?.type === 'static') {
      const key = entryTexKey(c.entry, 'blink');
      const url = URLS[entryFile(c.entry, c.entry.blink)];
      if (url) any = queueKey(scene, key, () => scene.load.image(key, url)) || any;
      keys.push(key);
    }
  }
  for (const v of req.portraits ?? []) {
    const c = chooseArt(v, 'portrait', ENTITY_ART, ART_FILES);
    if (!c) continue;
    any = queueEntryPortrait(scene, c.entry) || any;
    keys.push(entryTexKey(c.entry, 'portrait'));
  }
  for (const r of req.maps ?? []) {
    const m = MAP_ART.find((x) => x.ch === r.ch);
    if (!m) continue;
    any = queueMap(scene, m, r.parts, r.wave) || any;
    for (const p of r.parts) keys.push(mapTexKey(m, p));
    if (r.parts.includes('ground')) for (const [name] of mapObjectsAt(m, r.wave)) keys.push(mapTexKey(m, `object:${name}`));
  }
  for (const key of keys) {
    const loader = loaderOf.get(key);
    if (status.get(key) === 'loading' && loader) pendingLoaders?.add(loader);
  }
  if (owner) retainArt(owner, keys);
  if (any) watchLoader(scene);
  return any;
}

/**
 * 首屏：全部清单头像；没有封面时再加上主菜单的番茄妹（有封面时主角已画在封面里）。
 * 选关缩略图由用到它的场景加载（queueThumbArt），动画大图进章节前再按需加载。
 */
export function queueBootArt(scene: Phaser.Scene): void {
  if (isForceProcedural()) return;
  let any = false;
  for (const e of ENTITY_ART) any = queueEntryPortrait(scene, e) || any;
  if (any) watchLoader(scene);
  if (!RUNTIME_ART_URLS['cover/cover_kitchen.png']) queueArt(scene, { bodies: [{ kind: 'char', id: 'tomato' }] }, 'boot');
  scene.events.once('shutdown', () => {
    releaseArt('boot');
    scene.game.events.once('poststep', () => unloadUnusedArt(scene.textures));
  });
}

/** 选关缩略图（在场景 preload 里调用）；加载过的常驻缓存，不随场景卸载。不传章节时排全部章节 */
export function queueThumbArt(scene: Phaser.Scene, chapters?: number[]): void {
  if (isForceProcedural()) return;
  let any = false;
  for (const m of MAP_ART) if (!chapters || chapters.includes(m.ch)) any = queueMap(scene, m, ['thumb']) || any;
  if (any) watchLoader(scene);
}

const watched = new WeakSet<Phaser.Loader.LoaderPlugin>();

/** 加载结束时按纹理是否真的存在决定状态（不依赖每种文件类型各自的事件） */
function watchLoader(scene: Phaser.Scene): void {
  const ld = scene.load;
  if (watched.has(ld)) return;
  watched.add(ld);
  // Phaser clears loader listeners on scene shutdown; the same loader is reused on restart.
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    watched.delete(ld);
    // Loader aborts unfinished requests on shutdown; cancellation must remain retryable.
    for (const [key, loader] of loaderOf) {
      if (loader !== ld) continue;
      loaderOf.delete(key);
      if (status.get(key) !== 'loading') continue;
      if (scene.textures.exists(key)) status.set(key, 'ready');
      else status.delete(key);
    }
  });
  ld.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
    if (status.get(file.key) === 'loading') diag('error', file.key, `下载失败：${file.src}`);
  });
  ld.on(Phaser.Loader.Events.COMPLETE, () => {
    // 只结算本加载器负责的纹理（别的场景可能还在加载）
    for (const [key, l] of loaderOf) {
      if (l !== ld) continue;
      loaderOf.delete(key);
      if (status.get(key) !== 'loading') continue;
      if (scene.textures.exists(key)) {
        status.set(key, 'ready');
        listeners.forEach((fn) => fn(key));
      } else {
        status.set(key, 'failed');
        diag('error', key, '加载失败，已回退到程序化外观');
      }
    }
  });
}

/** 按需加载（不在 preload 里）：加载结束（无论成败）后 resolve，不会阻塞开局 */
export function loadArt(scene: Phaser.Scene, req: ArtRequest, owner?: string): Promise<void> {
  const pending = new Set<Phaser.Loader.LoaderPlugin>();
  queueArt(scene, req, owner, pending);
  if (!pending.size) return Promise.resolve();
  // Repeated UI refreshes must await an already queued file, not only newly queued files.
  const done = Promise.all(
    [...pending].map(
      (loader) =>
        new Promise<void>((resolve) => {
          const finish = () => {
            loader.off(Phaser.Loader.Events.COMPLETE, finish);
            scene.events.off(Phaser.Scenes.Events.SHUTDOWN, finish);
            loader.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, finish);
            resolve();
          };
          loader.once(Phaser.Loader.Events.COMPLETE, finish);
          scene.events.once(Phaser.Scenes.Events.SHUTDOWN, finish);
          if (loader.scene !== scene) loader.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, finish);
        }),
    ),
  );
  if (pending.has(scene.load) && !scene.load.isLoading()) scene.load.start();
  return done.then(() => undefined);
}

/** 清掉失败状态，下次请求会重新下载（网络恢复 / 修好文件后重试） */
export function retryFailedArt(): number {
  let n = 0;
  for (const [k, st] of status)
    if (st === 'failed') {
      status.delete(k);
      n++;
    }
  for (let i = diags.length - 1; i >= 0; i--)
    if (diags[i].msg.startsWith('加载失败') || diags[i].msg.startsWith('下载失败')) diags.splice(i, 1);
  return n;
}

// ---------------------------------------------------------------- 引用与卸载

/** 以 owner 身份持有这些纹理（同一 owner 再次调用会合并） */
export function retainArt(owner: string, keys: string[]): void {
  for (const k of keys) {
    let s = owners.get(k);
    if (!s) owners.set(k, (s = new Set()));
    s.add(owner);
  }
}

/** 释放 owner 持有的全部纹理（不立即卸载，见 unloadUnusedArt） */
export function releaseArt(owner: string): void {
  for (const s of owners.values()) s.delete(owner);
}

export function trackLive(key: string, d: 1 | -1): void {
  live.set(key, Math.max(0, (live.get(key) ?? 0) + d));
}

/** 卸载没有持有者、也没有存活外观对象引用的外部纹理；返回卸载数量 */
export function unloadUnusedArt(textures: Phaser.Textures.TextureManager): number {
  let n = 0;
  for (const [key, st] of status) {
    if (st !== 'ready' || (owners.get(key)?.size ?? 0) > 0 || (live.get(key) ?? 0) > 0) continue;
    if (key.endsWith(':portrait') || key.endsWith(':thumb')) continue; // 界面缩略图缓存；身体仍按引用回收
    if (textures.exists(key)) textures.remove(key);
    status.delete(key);
    sanitized.delete(key);
    n++;
  }
  return n;
}

// ---------------------------------------------------------------- 取用

/** 外观已加载可用时返回素材信息，否则 null（调用方回退到 Rig） */
export function readyArt(scene: Phaser.Scene, v: VisualIdent, raw = false): ReadyArt | null {
  if (isForceProcedural() && !raw) return null;
  const choice = chooseArt(v, 'body', ENTITY_ART, ART_FILES);
  if (!choice?.entry.source) return null;
  const key = entryTexKey(choice.entry, 'body');
  if (!scene.textures.exists(key)) return null;
  status.set(key, 'ready');
  const sanitizedEntry = sanitize(scene.textures.get(key), choice.entry, key);
  const scale = sanitizedEntry.source?.type === 'static' ? runtimeArtScale(entryFile(sanitizedEntry, sanitizedEntry.source.file)) : 1;
  const entry =
    scale !== 1 && sanitizedEntry.refRadius !== undefined
      ? { ...sanitizedEntry, refRadius: sanitizedEntry.refRadius * scale }
      : sanitizedEntry;
  const tex = scene.textures.get(key);
  const mode = entry.source!.type;
  const base = mode === 'static' ? undefined : (entry.baseFrame ?? entry.anims?.idle?.frames[0] ?? firstFrame(tex));
  const fr = tex.get(base);
  return {
    choice: { ...choice, entry } as ArtChoice,
    texKey: key,
    blinkKey: entry.blink && scene.textures.exists(entryTexKey(entry, 'blink')) ? entryTexKey(entry, 'blink') : undefined,
    mode,
    baseFrame: base,
    frameW: fr.realWidth,
    frameH: fr.realHeight,
  };
}

/** 头像纹理（已加载时），并返回是否需要调色 */
export function readyPortrait(scene: Phaser.Scene, v: VisualIdent, raw = false): { key: string; tint?: number } | null {
  if (isForceProcedural() && !raw) return null;
  const c = chooseArt(v, 'portrait', ENTITY_ART, ART_FILES);
  if (!c) return null;
  const key = entryTexKey(c.entry, 'portrait');
  return scene.textures.exists(key) ? { key, tint: c.tint } : null;
}

export function readyMap(scene: Phaser.Scene, ch: number, part: 'ground' | 'foreground' | 'thumb'): string | null {
  if (isForceProcedural()) return null;
  const m = MAP_ART.find((x) => x.ch === ch);
  if (!m) return null;
  const key = mapTexKey(m, part);
  return scene.textures.exists(key) ? key : null;
}

export function readyMapObject(scene: Phaser.Scene, ch: number, name: string): { key: string; width: number; height: number } | null {
  if (isForceProcedural()) return null;
  const m = MAP_ART.find((x) => x.ch === ch);
  const object = m?.objects?.[name];
  if (!m || !object) return null;
  const key = mapTexKey(m, `object:${name}`);
  return scene.textures.exists(key) ? { key, width: object.width, height: object.height } : null;
}

function firstFrame(tex: Phaser.Textures.Texture): string | number {
  const names = tex.getFrameNames();
  return names.length ? (/^\d+$/.test(names[0]) ? Number(names[0]) : names[0]) : '__BASE';
}

/** 剔除不存在的帧（坏图集 / 帧号越界），并记录诊断；整个动作都不可用时删掉该动作（走缺动作回退） */
function sanitize(tex: Phaser.Textures.Texture, e: EntityArtEntry, key: string): EntityArtEntry {
  const hit = sanitized.get(key);
  if (hit) return hit;
  const where = identKey(e);
  if (e.source?.type === 'atlas')
    for (const n of tex.getFrameNames())
      if ((tex.get(n) as unknown as { rotated?: boolean }).rotated) diag('error', where, `图集帧「${n}」是旋转打包，锚点会漂移`);
  const has = (f: number | string): boolean => e.source?.type !== 'static' && tex.has(String(f));
  const anims: Partial<Record<RigState, ArtAnim>> = {};
  for (const [st, a] of Object.entries(e.anims ?? {}) as [RigState, ArtAnim][]) {
    const ok = a.frames.filter(has);
    if (ok.length < a.frames.length) diag('error', where, `动作 ${st} 有 ${a.frames.length - ok.length} 帧不存在`);
    if (ok.length) anims[st] = { ...a, frames: ok };
  }
  let baseFrame = e.baseFrame;
  if (baseFrame !== undefined && !has(baseFrame)) {
    diag('error', where, `baseFrame「${baseFrame}」不存在，改用第一帧`);
    baseFrame = undefined;
  }
  const out: EntityArtEntry = { ...e, anims, baseFrame };
  sanitized.set(key, out);
  return out;
}

/** 调试：各纹理状态（开发者面板 / 控制台 window.__art） */
export function artDebugInfo(): { key: string; status: Status; owners: string[]; live: number }[] {
  return [...status].map(([key, st]) => ({ key, status: st, owners: [...(owners.get(key) ?? [])], live: live.get(key) ?? 0 }));
}

// 怪物子弹红色描边：每种子弹贴图预先生成一张描边版并缓存，发射时换上（不用逐发子弹的着色器，几百发同屏也不加开销）。
import Phaser from 'phaser';

const SUFFIX = '#outline';
const COLOR = [255, 36, 36, 240] as const;
/** 描边厚度占贴图长边的比例；大小子弹在屏幕上粗细接近 */
const THICKNESS = 0.08;
/** 只描实心部分的轮廓，外圈半透明光晕不算 */
const ALPHA_EDGE = 96;

/** 描边贴图 key → 四周加宽的像素 */
const pads = new Map<string, number>();
const watched = new WeakSet<Phaser.Textures.TextureManager>();
/** 原贴图被移除（离开场景卸载、切换画风重建）时一并删掉描边版，下次按新贴图重新生成 */
function watch(textures: Phaser.Textures.TextureManager): void {
  if (watched.has(textures)) return;
  watched.add(textures);
  textures.on(Phaser.Textures.Events.REMOVE, (key: string) => {
    if (key.endsWith(SUFFIX)) pads.delete(key);
    else if (textures.exists(key + SUFFIX)) textures.remove(key + SUFFIX);
  });
}

/** 返回 key 对应的描边贴图（不存在则生成）；无法读取像素时原样返回 key */
export function outlinedTexture(scene: Phaser.Scene, key: string): { key: string; pad: number } {
  watch(scene.textures);
  const out = key + SUFFIX;
  if (key.endsWith(SUFFIX)) return { key, pad: 0 };
  if (scene.textures.exists(out) && pads.has(out)) return { key: out, pad: pads.get(out)! };
  const frame = scene.textures.getFrame(key);
  const src = frame?.source.image as CanvasImageSource | undefined;
  if (!frame || !src || !(src instanceof HTMLCanvasElement || src instanceof HTMLImageElement)) return { key, pad: 0 };
  const w = frame.cutWidth,
    h = frame.cutHeight,
    pad = Math.max(2, Math.round(Math.max(w, h) * THICKNESS)),
    W = w + pad * 2,
    H = h + pad * 2;
  if (scene.textures.exists(out)) scene.textures.remove(out);
  const tex = scene.textures.createCanvas(out, W, H);
  if (!tex) return { key, pad: 0 };
  const ctx = tex.getContext();
  ctx.drawImage(src, frame.cutX, frame.cutY, w, h, pad, pad, w, h);
  let px: ImageData;
  try {
    px = ctx.getImageData(0, 0, W, H);
  } catch {
    scene.textures.remove(out);
    return { key, pad: 0 };
  }
  const solid = new Uint8Array(W * H);
  for (let i = 0; i < solid.length; i++) solid[i] = px.data[i * 4 + 3] >= ALPHA_EDGE ? 1 : 0;
  // 圆形膨胀：实心像素周围 pad 半径内都涂成描边色
  const ring = ctx.createImageData(W, H);
  const r2 = pad * pad;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      if (!solid[y * W + x]) continue;
      for (let dy = -pad; dy <= pad; dy++) {
        const yy = y + dy;
        if (yy < 0 || yy >= H) continue;
        for (let dx = -pad; dx <= pad; dx++) {
          const xx = x + dx;
          if (xx < 0 || xx >= W || dx * dx + dy * dy > r2) continue;
          const o = (yy * W + xx) * 4;
          ring.data[o] = COLOR[0];
          ring.data[o + 1] = COLOR[1];
          ring.data[o + 2] = COLOR[2];
          ring.data[o + 3] = COLOR[3];
        }
      }
    }
  ctx.putImageData(ring, 0, 0);
  ctx.drawImage(src, frame.cutX, frame.cutY, w, h, pad, pad, w, h);
  tex.refresh();
  pads.set(out, pad);
  return { key: out, pad };
}

/** 给已经设好贴图、原点与缩放的子弹换上描边版，原点按加宽的画布换算，位置和大小不变 */
export function outlineBullet(b: Phaser.GameObjects.Image): void {
  const w = b.frame.cutWidth,
    h = b.frame.cutHeight,
    ox = b.originX,
    oy = b.originY;
  const { key, pad } = outlinedTexture(b.scene, b.texture.key);
  if (!pad) return;
  b.setTexture(key).setOrigin((ox * w + pad) / (w + pad * 2), (oy * h + pad) / (h + pad * 2));
}

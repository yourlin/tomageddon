// 高清渲染：画布按屏幕物理像素分配（逻辑 720p × RES），所有游戏代码仍然使用 720p 的逻辑坐标。
//
// 原来游戏固定按 720 像素高渲染，再由浏览器把画布拉伸到屏幕物理像素，高分屏 / 全屏时会发虚。
// 现在：
//  · 游戏尺寸（Phaser 的 scale.width/height）= 逻辑尺寸 × RES；布局代码改用 VW() / VH() 取逻辑尺寸；
//  · 每个场景的全屏相机放大 RES 倍、原点放在左上角（逻辑 (x, y) 正好画在物理 (x·RES, y·RES)），
//    并补上跟随、边界、视野（worldView）在「左上角原点」下的计算；
//  · 指针在进入 Phaser 时就换算成逻辑坐标，游戏里所有 pointer.x / pointer.y 不用改；
//    Phaser 内部拿指针做命中检测的两处（getWorldPoint、找指针下的相机）再换算回物理坐标。
// RES = 1 时不安装任何补丁，行为与原来完全一致（设置里可以关掉「高清渲染」）。
import Phaser from 'phaser';

/** 渲染倍率：画布物理像素 / 逻辑像素 */
export let RES = 1;

/** 逻辑宽高（720p 坐标系），布局代码用它代替 scene.scale.width / height */
export const VW = (s: Phaser.Scene | Phaser.Game): number => s.scale.width / RES;
export const VH = (s: Phaser.Scene | Phaser.Game): number => s.scale.height / RES;
/** 相机的逻辑缩放（去掉渲染倍率后的缩放，1 = 不缩放） */
export const viewZoom = (cam: Phaser.Cameras.Scene2D.Camera): number => cam.zoom / RES;

/** 最大渲染倍率：4K 屏全屏约 2.5，再高 GPU 负担太大，收益也看不出来 */
const MAX_RES = 2.5;

/**
 * 按「屏幕物理高度 / 720」算渲染倍率（向下取 0.25 的整数倍，避免奇怪的小数缩放和超采样）。
 * 必须在创建 Phaser.Game 之前调用。enabled = false 时 RES = 1（等同原来的渲染）。
 */
export function initRes(enabled: boolean, logicalH = 720): number {
  if (!enabled || typeof window === 'undefined') return (RES = 1);
  // 游戏按高度铺满（EXPAND 固定 720 高），所以看屏幕短边的物理像素；竖屏手机会被强制横屏，短边正好是横屏后的高度。
  // 向下取到 0.25 的整数倍：宁可略低于屏幕像素，也不要超采样白白多算
  const physicalH = Math.min(window.innerHeight, window.innerWidth) * (window.devicePixelRatio || 1);
  RES = Math.min(MAX_RES, Math.max(1, Math.floor((physicalH / logicalH) * 4) / 4));
  return RES;
}

type Cam = Phaser.Cameras.Scene2D.Camera & {
  __hidpi?: boolean;
  __followBase?: { x: number; y: number };
};

let installed = false;

/** 安装补丁（RES > 1 时）；需在创建 Phaser.Game 之前调用 */
export function installHiDpi(): void {
  if (RES === 1 || installed) return;
  installed = true;
  const P = Phaser as unknown as {
    Cameras: { Scene2D: { Camera: { prototype: Record<string, unknown> }; CameraManager: { prototype: Record<string, unknown> } } };
    Input: { InputManager: { prototype: Record<string, unknown> } };
  };
  const CamP = P.Cameras.Scene2D.Camera.prototype as unknown as Record<string, (...a: never[]) => unknown>;
  const ManP = P.Cameras.Scene2D.CameraManager.prototype as unknown as Record<string, (...a: never[]) => unknown>;
  const InP = P.Input.InputManager.prototype as unknown as Record<string, (...a: never[]) => unknown>;

  // ---------- 文字：内部画布按 原分辨率 × RES 生成，否则放大后照样发虚 ----------
  const F = Phaser.GameObjects.GameObjectFactory.prototype as unknown as Record<string, (...a: unknown[]) => unknown>;
  const addText = F.text;
  F.text = function (this: unknown, x: unknown, y: unknown, str: unknown, style?: unknown) {
    const st = (style ?? {}) as Phaser.Types.GameObjects.Text.TextStyle;
    return addText.call(this, x, y, str, { ...st, resolution: (st.resolution || 1) * RES });
  };

  // ---------- 指针：进入 Phaser 时换算成逻辑坐标 ----------
  const transformPointer = InP.transformPointer as (this: unknown, p: Phaser.Input.Pointer, x: number, y: number, m: boolean) => void;
  InP.transformPointer = function (this: unknown, pointer: Phaser.Input.Pointer, pageX: number, pageY: number, wasMove: boolean) {
    transformPointer.call(this, pointer, pageX, pageY, wasMove);
    pointer.position.x /= RES;
    pointer.position.y /= RES;
  } as never;

  // 命中检测：传进来的是逻辑屏幕坐标，相机按物理像素工作，换算回去
  const getWorldPoint = CamP.getWorldPoint as (this: Cam, x: number, y: number, out?: Phaser.Math.Vector2) => Phaser.Math.Vector2;
  CamP.getWorldPoint = function (this: Cam, x: number, y: number, out?: Phaser.Math.Vector2) {
    return getWorldPoint.call(this, x * RES, y * RES, out);
  } as never;
  ManP.getCamerasBelowPointer = function (this: Phaser.Cameras.Scene2D.CameraManager, pointer: Phaser.Input.Pointer) {
    const x = pointer.x * RES,
      y = pointer.y * RES;
    const out: Phaser.Cameras.Scene2D.Camera[] = [];
    for (const c of this.cameras) if (c.visible && c.inputEnabled && Phaser.Geom.Rectangle.Contains(c as never, x, y)) out.unshift(c);
    return out;
  } as never;

  // ---------- 全屏相机：放大 RES 倍、原点在左上角 ----------
  const setup = (c: Cam, mgr: Phaser.Cameras.Scene2D.CameraManager) => {
    const s = mgr.scene.scale;
    if (c.__hidpi || c.x !== 0 || c.y !== 0 || c.width !== s.width || c.height !== s.height) return;
    c.__hidpi = true;
    c.setOrigin(0, 0);
    c.setZoom(RES);
  };
  const add = ManP.add as (this: Phaser.Cameras.Scene2D.CameraManager, ...a: unknown[]) => Cam;
  ManP.add = function (this: Phaser.Cameras.Scene2D.CameraManager, ...a: unknown[]) {
    const c = add.apply(this, a);
    setup(c, this);
    return c;
  } as never;
  // 场景启动 / 重启时 CameraManager 都经由 add() 重建主相机，所以只需补 add

  // 跟随：Phaser 按「原点在中心」算跟随位置；原点在左上角时用 followOffset 把目标放回视野中心
  const startFollow = CamP.startFollow as (this: Cam, ...a: unknown[]) => Cam;
  CamP.startFollow = function (this: Cam, target: { x: number; y: number }, round?: boolean, lx?: number, ly?: number, ox = 0, oy = 0) {
    const r = startFollow.call(this, target, round, lx, ly, ox, oy);
    if (this.__hidpi) {
      this.__followBase = { x: ox, y: oy };
      // 开始跟随时直接对准目标（Phaser 原本按物理半宽对准，会先跳一下）
      this.setScroll(target.x - ox - this.displayWidth / 2, target.y - oy - this.displayHeight / 2);
      if (this.useBounds) this.setScroll(this.clampX(this.scrollX), this.clampY(this.scrollY));
    }
    return r;
  } as never;
  const preRender = CamP.preRender as (this: Cam) => void;
  CamP.preRender = function (this: Cam) {
    if (this.__hidpi) {
      const b = this.__followBase ?? { x: 0, y: 0 };
      // 按当前缩放实时计算（技能的镜头冲击会临时改 zoom，目标仍保持在正中）
      this.followOffset.set(b.x + this.width / this.zoomX / 2, b.y + this.height / this.zoomY / 2);
    }
    preRender.call(this);
    if (this.__hidpi) {
      // Phaser 按中心原点算 worldView / midPoint，这里改成左上角原点下的实际可见范围
      const dw = this.width / this.zoomX,
        dh = this.height / this.zoomY;
      this.midPoint.set(this.scrollX + dw / 2, this.scrollY + dh / 2);
      this.worldView.setTo(this.scrollX, this.scrollY, dw, dh);
    }
  } as never;
  // 边界：左上角原点下，滚动范围是 [bounds.x, bounds.right − 可见宽度]
  const clamp = (orig: (this: Cam, v: number) => number, axis: 'x' | 'y') =>
    function (this: Cam, v: number) {
      if (!this.__hidpi) return orig.call(this, v);
      const b = (this as unknown as { _bounds: Phaser.Geom.Rectangle })._bounds;
      const lo = axis === 'x' ? b.x : b.y;
      const span = axis === 'x' ? b.width - this.displayWidth : b.height - this.displayHeight;
      return Phaser.Math.Clamp(v, lo, Math.max(lo, lo + span));
    };
  CamP.clampX = clamp(CamP.clampX as never, 'x') as never;
  CamP.clampY = clamp(CamP.clampY as never, 'y') as never;
  // 居中：左上角原点下，scroll = 目标 − 可见宽度 / 2
  const centerOnX = CamP.centerOnX as (this: Cam, x: number) => Cam;
  CamP.centerOnX = function (this: Cam, x: number) {
    if (!this.__hidpi) return centerOnX.call(this, x);
    this.scrollX = this.useBounds ? this.clampX(x - this.displayWidth / 2) : x - this.displayWidth / 2;
    this.midPoint.x = x;
    return this;
  } as never;
  const centerOnY = CamP.centerOnY as (this: Cam, y: number) => Cam;
  CamP.centerOnY = function (this: Cam, y: number) {
    if (!this.__hidpi) return centerOnY.call(this, y);
    this.scrollY = this.useBounds ? this.clampY(y - this.displayHeight / 2) : y - this.displayHeight / 2;
    this.midPoint.y = y;
    return this;
  } as never;
}

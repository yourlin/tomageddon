// 启动：加载资源，再分帧生成程序化贴图（首屏需要的先做，其余在主菜单期间后台继续）
import Phaser from 'phaser';
import { queueAssets } from '../systems/Assets';
import { textureTasks } from '../systems/Textures';
import { enqueueTex, flushTex, onTexReady, pumpTex, texProgress, texReady, texUrgent, TEX_SLOW, type TexTask } from '../systems/TexQueue';
import { paintArena } from '../art/ArenaArt';
import { portraitKey } from '../ui/Portrait';
import { CHARACTERS } from '../data/characters';
import { initLoader, setLoader, showLoader, hideLoader, removeLoaderNow } from '../ui/BootLoader';
import { tx } from '../i18n';
import { DEV_MODE, devHooks } from '../dev/flag';

/** 资源下载占进度条的前 20%，首屏贴图占后 80% */
const ASSET_SHARE = 0.2;
/** 每帧生成贴图的时间预算（毫秒）：首屏阶段只有加载页，可以多做；后台阶段不能拖慢主菜单 */
const BUDGET_BOOT = 28;
const BUDGET_IDLE = 5;
const BUDGET_URGENT = 30;
/** 后台阶段每帧最多生成的贴图量（约 20 万像素），避免显卡上传积压造成主菜单卡顿 */
const WEIGHT_IDLE = 12;
/** 主菜单飘落的角色头像数量（只预先生成这些，其余后台生成） */
export const MENU_PORTRAITS = 10;
/** 主菜单直接用到的启动贴图（角色 Rig 的脚下阴影），必须在主菜单出现前生成 */
const MENU_TEX = new Set(['fx_shadow']);
/** 后台阶段单帧生成贴图的最长耗时（性能测试用：window.__texPump） */
const TEX_PUMP = { max: 0 };

type Phase = 'assets' | 'boot' | 'background' | 'idle';

export class BootScene extends Phaser.Scene {
  private phase: Phase = 'assets';
  private bootReady = false;

  constructor() {
    super('Boot');
  }

  preload(): void {
    initLoader(tx('加载资源…', 'Loading assets…'));
    this.load.on('progress', (v: number) => setLoader(v * ASSET_SHARE));
    this.load.on('loaderror', () => {
      /* 缺失的资源使用占位图 */
    });
    queueAssets(this);
  }

  create(): void {
    this.phase = 'boot';
    Object.assign(window, { __texSlow: TEX_SLOW, __texPump: TEX_PUMP });
    const portraits = (ids: string[]): TexTask[] =>
      ids.map((id) => ({ run: () => portraitKey(this, 'char', id), w: 8, k: `portrait_${id}` }));
    const ids = Phaser.Utils.Array.Shuffle(CHARACTERS.map((c) => c.id));
    const menuIds = ids.slice(0, MENU_PORTRAITS);
    const crit: TexTask[] = [...portraits(menuIds)];
    if (!this.textures.exists('bg_menu')) crit.unshift({ run: () => paintArena(this, 1), w: 40, k: 'arena_1' });
    const rest: TexTask[] = [];
    const first: TexTask[] = [];
    for (const t of textureTasks(this)) (MENU_TEX.has(t.k ?? '') ? first : rest).push(t);
    // 头像会把 Rig（含阴影）烘焙进贴图，所以 fx_shadow 必须排在所有头像之前
    crit.unshift(...first);
    rest.push(...portraits(ids.slice(MENU_PORTRAITS)));

    // 无渲染测试模式：同步做完，不进入菜单，由测试脚本直接启动对局
    if (new URLSearchParams(location.search).has('headless')) {
      enqueueTex([...crit, ...rest]);
      flushTex();
      removeLoaderNow();
      (window as unknown as { __ready: boolean }).__ready = true;
      this.phase = 'idle';
      return;
    }
    // 开发者界面要求所有贴图就绪后才接管，所以全部算作首屏
    enqueueTex(DEV_MODE ? [...crit, ...rest] : crit);
    if (!DEV_MODE) onTexReady(() => (this.bootReady = true), false);
    setLoader(ASSET_SHARE, tx('准备画面…', 'Preparing…'));
    // 首帧先把加载页画出来，下一帧开始生成
    this.time.delayedCall(0, () => {
      if (DEV_MODE) onTexReady(() => this.finishDev(), false);
      else this.pendingRest = rest;
    });
  }

  private pendingRest: TexTask[] | null = null;

  update(): void {
    if (this.phase === 'boot') {
      pumpTex(BUDGET_BOOT);
      setLoader(ASSET_SHARE + (0.95 - ASSET_SHARE) * texProgress());
      if (this.bootReady && this.pendingRest) {
        // 首屏贴图就绪：进入主菜单，其余贴图后台继续。
        // 主菜单的 create 本身也要花一点时间，等它真正画出第一帧再收起加载页，避免中间露出黑屏
        enqueueTex(this.pendingRest);
        this.pendingRest = null;
        this.phase = 'background';
        setLoader(0.95, tx('马上就好…', 'Almost there…'));
        const menu = this.scene.get('Menu');
        menu.events.once(Phaser.Scenes.Events.CREATE, () => {
          this.game.events.once(Phaser.Core.Events.POST_RENDER, () => {
            setLoader(1);
            hideLoader();
          });
        });
        this.scene.launch('Menu');
      }
      return;
    }
    if (this.phase === 'background') {
      const urgent = texUrgent();
      const t0 = performance.now();
      pumpTex(urgent ? BUDGET_URGENT : BUDGET_IDLE, urgent ? Infinity : WEIGHT_IDLE);
      TEX_PUMP.max = Math.max(TEX_PUMP.max, performance.now() - t0);
      if (urgent) setLoader(texProgress());
      if (texReady()) {
        this.phase = 'idle';
        this.scene.stop();
      }
    }
  }

  private finishDev(): void {
    removeLoaderNow();
    this.phase = 'idle';
    // 开发者界面：贴图就绪后由 src/dev 接管，不进入主菜单
    devHooks.onBootReady?.(this.game);
    devHooks.booted = true;
  }
}

/**
 * 主菜单离开前的「贴图就绪」闸门：后台贴图还没生成完时，先显示加载页，生成完再切换场景。
 * 只包装该场景自己的 scene.start，重复调用无副作用。
 */
export function gateSceneStart(scene: Phaser.Scene): void {
  const sp = scene.scene as Phaser.Scenes.ScenePlugin & { __texGated?: boolean };
  if (sp.__texGated) return;
  sp.__texGated = true;
  const orig = sp.start.bind(sp);
  let waiting = false;
  sp.start = ((key?: string | Phaser.Scene, data?: object) => {
    if (texReady()) return orig(key, data);
    if (waiting) return sp;
    waiting = true;
    scene.input.enabled = false;
    showLoader(tx('准备战场…', 'Getting the garden ready…'));
    onTexReady(() => {
      waiting = false;
      setLoader(1);
      hideLoader();
      scene.input.enabled = true;
      orig(key, data);
    });
    return sp;
  }) as typeof sp.start;
}

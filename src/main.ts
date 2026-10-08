import Phaser from 'phaser';
import { TALENT_NODES } from './data/talentTree';
import { setTalents, talentPointsTotal } from './systems/TalentTree';
import { EVOLUTIONS } from './data/evolutions';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { CharSelectScene } from './scenes/CharSelectScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { ShopScene } from './scenes/ShopScene';
import { PauseScene } from './scenes/PauseScene';
import { ResultScene } from './scenes/ResultScene';
import { SettingsScene } from './scenes/SettingsScene';
import { ChallengeScene } from './scenes/ChallengeScene';
import { lazyScene } from './scenes/LazyScene';
import { installErrorLog } from './systems/ErrorLog';
import { onShouldPause, IS_DESKTOP_APP, IS_STEAM } from './platform';
import { syncPlatformAchievements } from './systems/Achievements';
import { portraitKey } from './ui/Portrait';
import { run } from './systems/RunState';
import { controls } from './systems/Controls';
import { CHARACTERS, CHARACTER_MAP } from './data/characters';
import { WEAPON_MAP, TIER_PRICE_MULT } from './data/weapons';
import { ITEM_MAP, LEVELUP_OPTIONS } from './data/items';
import { BALANCE, rerollPrice, sellPrice, priceInflation } from './data/balance';
import { isFavoredWeapon } from './data/affinity';
import { RECIPES, missingItems } from './data/recipes';
import { save, disablePersist } from './systems/Save';
import { applyPerfSettings } from './systems/Perf';
import { applyLanguage } from './i18n/apply';
import { lang, tx } from './i18n';
import { autoFullscreenOnFirstTouch } from './systems/Fullscreen';
import { installForceLandscape } from './systems/ForceLandscape';
import { pointsEarned, achValue, setInRun } from './systems/Achievements';
import { ACHIEVEMENTS } from './data/achievements';
import { DEV_MODE, DEV_DISABLED } from './dev/flag';
import { RES, initRes, installHiDpi } from './systems/HiDpi';
import { setCharPortraitProvider } from './systems/Achievements';

// 开发者界面：整页生命周期内不写存档（必须在任何场景运行前生效）
if (DEV_MODE) disablePersist();

// 按语言写入数据文本，必须在创建游戏前执行
applyLanguage();
document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
document.title = tx('番茄酱 Tomageddon｜肉鸽割草，一局就上头', 'Tomageddon | Roguelike survivor — just one more run');

// ?headless=1：测试模式（隐藏战斗画面、不进菜单），仅用于自动化平衡测试；关闭开发者模式的构建（Steam 桌面版）里不可用
export const HEADLESS = !DEV_DISABLED && new URLSearchParams(location.search).has('headless');

// 高清渲染：画布按屏幕物理像素分配（逻辑仍是 720p），设置里可关闭；必须在创建 Game 之前确定
initRes(!HEADLESS && save.settings.hiDpi !== false);
installHiDpi();

const game = new Phaser.Game({
  type: HEADLESS ? Phaser.CANVAS : Phaser.AUTO, // 测试模式不绘制，用 Canvas 避免占用 WebGL 上下文
  parent: 'game',
  backgroundColor: '#1a0a0c',
  scale: {
    mode: Phaser.Scale.EXPAND,
    width: 1280 * RES,
    height: 720 * RES,
    // EXPAND 模式画布始终铺满容器，无需居中（居中计算会被强制横屏的旋转干扰）
    autoCenter: Phaser.Scale.NO_CENTER,
    // 全屏外层容器，内部 #game 可在竖屏时旋转为横屏
    fullscreenTarget: 'stage',
  },
  render: { antialias: true, powerPreference: 'high-performance', roundPixels: false },
  input: { activePointers: 3 },
  // 测试模式：用 setTimeout 驱动循环，不受显示器刷新率限制
  fps: HEADLESS
    ? { target: 250, smoothStep: false, forceSetTimeOut: true }
    : { target: 60, smoothStep: true, limit: save.settings.fpsLimit },
  disableContextMenu: true,
  scene: [
    BootScene,
    MenuScene,
    CharSelectScene,
    GameScene,
    HudScene,
    LevelUpScene,
    ShopScene,
    PauseScene,
    ResultScene,
    // K8：图鉴 / 成就 / 更新日志 / 天赋树 / 局后数据 / 战绩按需加载，不进首屏包
    lazyScene('Craft', () => import('./scenes/CraftScene').then((m) => m.CraftScene)),
    lazyScene('Title', () => import('./scenes/TitleScene').then((m) => m.TitleScene)),
    lazyScene('Codex', () => import('./scenes/CodexScene').then((m) => m.CodexScene)),
    SettingsScene,
    lazyScene('Achievements', () => import('./scenes/AchievementScene').then((m) => m.AchievementScene)),
    lazyScene('Changelog', () => import('./scenes/ChangelogScene').then((m) => m.ChangelogScene)),
    lazyScene('Ending', () => import('./scenes/EndingScene').then((m) => m.EndingScene)),
    lazyScene('TalentTree', () => import('./scenes/TalentTreeScene').then((m) => m.TalentTreeScene)),
    lazyScene('RunStats', () => import('./scenes/RunStatsScene').then((m) => m.RunStatsScene)),
    lazyScene('History', () => import('./scenes/HistoryScene').then((m) => m.HistoryScene)),
    lazyScene('CustomChallenge', () => import('./scenes/CustomChallengeScene').then((m) => m.CustomChallengeScene)),
    lazyScene('Collection', () => import('./scenes/CollectionScene').then((m) => m.CollectionScene)),
    ChallengeScene,
  ],
});

if (HEADLESS) {
  // 测试模式不渲染：主循环只更新不绘制（loop.start 绑定的是 this.step，启动前覆盖即可）
  game.step = game.headlessStep;
} else if (DEV_MODE && import.meta.env.VITE_DISABLE_DEV !== '1') {
  // 开发者界面：桌面端使用，不强制横屏 / 全屏；本体动态加载，不进玩家首屏包
  applyPerfSettings(game);
  void import('./dev/DevPanel').then((m) => m.installDevPanel(game));
} else {
  applyPerfSettings(game);
  // Steam（桌面窗口）版不需要首次触摸自动全屏与「请旋转屏幕」
  if (!IS_DESKTOP_APP) {
    autoFullscreenOnFirstTouch(game);
    installForceLandscape(game);
  }
}
// 解锁角色提示条里的形象：从任一活动场景生成形象贴图，再导出成图片（同一角色只导出一次）
const portraitCache = new Map<string, string>();
setCharPortraitProvider(async (id) => {
  const hit = portraitCache.get(id);
  if (hit) return hit;
  const scene = game.scene.getScenes(true)[0];
  if (!scene) return null;
  const tex = game.textures.get(portraitKey(scene, 'char', id)).getSourceImage();
  // portraitKey 可能刚刚新建这张贴图，等两帧让 GPU 真正画完，否则截图是空的。
  // 页面在后台时 requestAnimationFrame 不会触发，所以用 setTimeout 兜底，不能无限等
  const frame = () => new Promise((r) => requestAnimationFrame(r));
  await Promise.race([frame().then(frame), new Promise((r) => setTimeout(r, 120))]);
  const snap = new Promise<string | null>((resolve) => {
    if (tex instanceof Phaser.Textures.DynamicTexture) tex.snapshot((img) => resolve(img instanceof HTMLImageElement ? img.src : null));
    else if (tex instanceof HTMLCanvasElement) resolve(tex.toDataURL());
    else resolve(null);
  });
  const src = await Promise.race([snap, new Promise<null>((r) => setTimeout(() => r(null), 600))]);
  // 只缓存成功的结果：贴图可能还没生成完（启动时分帧生成），失败下次再试
  if (src) portraitCache.set(id, src);
  return src;
});

// 窗口失焦、最小化、Steam 浮层打开时自动暂停战斗
if (IS_STEAM) syncPlatformAchievements();
onShouldPause(() => {
  if (game.scene.isActive('Game') && !game.scene.isPaused('Game')) controls.pausePressed = true;
});

// 切到后台时自动暂停战斗
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.scene.isActive('Game')) {
    game.scene.pause('Game');
    game.scene.pause('Hud');
    if (!game.scene.isActive('Pause')) game.scene.start('Pause');
  }
});

installErrorLog(() =>
  game.scene
    .getScenes(true)
    .map((s) => s.sys.settings.key)
    .join(','),
);
// 测试机器人 / 宣传片录制 / 控制台调试用的全局入口。关闭开发者模式的构建（Steam 桌面版）里不暴露，
// 否则玩家可以在控制台直接改存档和数值
if (!DEV_DISABLED) {
  Object.assign(window, { portraitKey });
  Object.assign(window, {
    game,
    run,
    controls,
    GameScene,
    __dev: {
      EVOLUTIONS,
      TALENT_NODES,
      setTalents,
      CHARACTERS,
      CHARACTER_MAP,
      WEAPON_MAP,
      ITEM_MAP,
      LEVELUP_OPTIONS,
      BALANCE,
      rerollPrice,
      priceInflation,
      TIER_PRICE_MULT,
      sellPrice,
      pointsEarned,
      talentPointsTotal,
      isFavoredWeapon,
      RECIPES,
      missingItems,
      ACHIEVEMENTS,
      achValue,
      setInRun,
    },
  });
}

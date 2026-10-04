import Phaser from 'phaser';
import { TALENT_NODES } from './data/talentTree';
import { setTalents } from './systems/TalentTree';
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
import { rerollPrice, sellPrice } from './data/balance';
import { save, disablePersist } from './systems/Save';
import { applyPerfSettings } from './systems/Perf';
import { applyLanguage } from './i18n/apply';
import { lang, tx } from './i18n';
import { autoFullscreenOnFirstTouch } from './systems/Fullscreen';
import { installForceLandscape } from './systems/ForceLandscape';
import { pointsEarned, charCost } from './systems/Achievements';
import { DEV_MODE } from './dev/flag';

// 开发者界面：整页生命周期内不写存档（必须在任何场景运行前生效）
if (DEV_MODE) disablePersist();

// 按语言写入数据文本，必须在创建游戏前执行
applyLanguage();
document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
document.title = tx('番茄酱 Tomageddon｜肉鸽割草，一局就上头', 'Tomageddon | Roguelike survivor — just one more run');

// ?headless=1：测试模式（隐藏战斗画面、不进菜单），仅用于自动化平衡测试
export const HEADLESS = new URLSearchParams(location.search).has('headless');

const game = new Phaser.Game({
  type: HEADLESS ? Phaser.CANVAS : Phaser.AUTO, // 测试模式不绘制，用 Canvas 避免占用 WebGL 上下文
  parent: 'game',
  backgroundColor: '#1a0a0c',
  scale: {
    mode: Phaser.Scale.EXPAND,
    width: 1280,
    height: 720,
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

// 调试用
Object.assign(window, { portraitKey });
installErrorLog(() =>
  game.scene
    .getScenes(true)
    .map((s) => s.sys.settings.key)
    .join(','),
);
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
    rerollPrice,
    TIER_PRICE_MULT,
    sellPrice,
    pointsEarned,
    charCost,
  },
});

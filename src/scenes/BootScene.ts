// 启动：加载资源、生成占位贴图
import Phaser from 'phaser';
import { queueAssets } from '../systems/Assets';
import { generateTextures, FONT } from '../systems/Textures';
import { DEV_MODE, devHooks } from '../dev/flag';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const W = this.scale.width,
      H = this.scale.height;
    const title = this.add
      .text(W / 2, H / 2 - 60, '番茄酱', { fontFamily: FONT, fontSize: '64px', color: '#ff4b3e', fontStyle: 'bold' })
      .setOrigin(0.5);
    title.setStroke('#1a0a0c', 8);
    const bar = this.add.graphics();
    this.load.on('progress', (v: number) => {
      bar.clear();
      bar.fillStyle(0x3d1d22, 1).fillRoundedRect(W / 2 - 200, H / 2 + 20, 400, 20, 10);
      bar.fillStyle(0xff4b3e, 1).fillRoundedRect(W / 2 - 200, H / 2 + 20, 400 * v, 20, 10);
    });
    this.load.on('loaderror', () => {
      /* 缺失的资源使用占位图 */
    });
    queueAssets(this);
  }

  create(): void {
    generateTextures(this);
    // 开发者界面：贴图就绪后由 src/dev 接管，不进入主菜单
    if (DEV_MODE) {
      devHooks.onBootReady?.(this.game);
      devHooks.booted = true;
      return;
    }
    // 无渲染测试模式：不进入菜单，由测试脚本直接启动对局
    if (new URLSearchParams(location.search).has('headless')) {
      (window as unknown as { __ready: boolean }).__ready = true;
      return;
    }
    this.scene.start('Menu');
  }
}

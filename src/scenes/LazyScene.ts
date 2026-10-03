// K8：非首屏场景按需加载。先注册一个同名的轻量占位场景，第一次进入时动态 import 真正的场景模块，
// 用同一个 key 替换掉占位场景并带着原参数启动。之后再进入就直接是真场景。
import Phaser from 'phaser';
import { tx } from '../i18n';

type SceneClass = new () => Phaser.Scene;

export function lazyScene(key: string, load: () => Promise<SceneClass>): SceneClass {
  return class LazyScene extends Phaser.Scene {
    constructor() {
      super(key);
    }
    create(data?: object): void {
      const W = this.scale.width;
      const H = this.scale.height;
      this.cameras.main.setBackgroundColor('#1a0a0c');
      const t = this.add.text(W / 2, H / 2, tx('加载中…', 'Loading…'), { fontFamily: 'system-ui', fontSize: '28px', color: '#f3e6e0' }).setOrigin(0.5);
      load()
        .then((Cls) => {
          const mgr = this.game.scene;
          // 不能先 this.scene.stop()：stop 是排队到下一帧执行的，会按 key 把刚注册的真场景关掉。
          // setTimeout 回调不会落在场景管理器的处理过程中，remove / add 会立即生效
          setTimeout(() => {
            mgr.remove(key);
            mgr.add(key, Cls, true, data);
          }, 0);
        })
        .catch(() => t.setText(tx('加载失败，请检查网络后重试', 'Failed to load, please retry')));
    }
  };
}

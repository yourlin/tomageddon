// 场景共享纹理引用；等场景对象完成销毁后才回收，暂停场景继续持有。
import type Phaser from 'phaser';

type Release = (scene: Phaser.Scene, key: string) => void;
interface State {
  resources: Map<string, { owners: Set<Phaser.Scene>; release: Release }>;
  scenes: WeakMap<Phaser.Scene, Set<string>>;
}
const REGISTRY_KEY = 'art.sceneTextureLeases';
function state(scene: Phaser.Scene): State {
  let value = scene.game.registry.get(REGISTRY_KEY) as State | undefined;
  if (!value) {
    value = { resources: new Map(), scenes: new WeakMap() };
    scene.game.registry.set(REGISTRY_KEY, value);
  }
  return value;
}

export function sceneTextureRetained(scene: Phaser.Scene, key: string): boolean {
  return (state(scene).resources.get(key)?.owners.size ?? 0) > 0;
}

export function retainSceneTexture(scene: Phaser.Scene, key: string, release: Release): void {
  const shared = state(scene);
  let entry = shared.resources.get(key);
  if (!entry) shared.resources.set(key, (entry = { owners: new Set(), release }));
  entry.owners.add(scene);
  let keys = shared.scenes.get(scene);
  if (!keys) {
    shared.scenes.set(scene, (keys = new Set()));
    const game = scene.game;
    scene.events.once('shutdown', () => {
      for (const used of keys!) shared.resources.get(used)?.owners.delete(scene);
      shared.scenes.delete(scene);
      game.events.once('poststep', () => {
        const active = game.scene.getScenes(true)[0] ?? scene;
        for (const [unused, resource] of shared.resources) {
          if (resource.owners.size) continue;
          resource.release(active, unused);
          shared.resources.delete(unused);
        }
      });
    });
  }
  keys.add(key);
}

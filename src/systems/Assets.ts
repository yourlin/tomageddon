// 美术/音频资源加载：自动扫描 src/assets 下的文件，文件名（不含扩展名）即为资源 key。
// 缺失的图片由 Textures.ts 程序化生成占位图，因此美术资源可以逐步替换。
import Phaser from 'phaser';

const images = import.meta.glob('../assets/**/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const audios = import.meta.glob('../assets/**/*.{mp3,ogg,wav,m4a}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

function keyOf(path: string): string {
  const name = path.split('/').pop()!;
  return name.replace(/\.[^.]+$/, '');
}

export const AVAILABLE_AUDIO = new Set(Object.keys(audios).map(keyOf));

export function queueAssets(scene: Phaser.Scene): void {
  for (const [path, url] of Object.entries(images)) scene.load.image(keyOf(path), url);
  // 同名多格式时只加载一个
  const seen = new Set<string>();
  for (const [path, url] of Object.entries(audios)) {
    const k = keyOf(path);
    if (seen.has(k)) continue;
    seen.add(k);
    scene.load.audio(k, url);
  }
}

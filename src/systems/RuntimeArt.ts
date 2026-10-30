// 原画用于制作与校准；游戏只下载编译后的透明 WebP。
import index from '../data/artRuntime.generated.json';
import { currentGraphicsProfile } from './GraphicsQuality';
interface DeliveryGeometry {
  file: string;
  width: number;
  height: number;
}
interface RuntimeRow extends DeliveryGeometry {
  sourceWidth: number;
  sourceHeight: number;
  variants?: Partial<Record<'low' | 'standard', DeliveryGeometry>>;
}
const tier = currentGraphicsProfile().tier;
const rows = index.files as Record<string, RuntimeRow>;
const delivery = (row: RuntimeRow): DeliveryGeometry => (tier === 'high' ? row : (row.variants?.[tier] ?? row));
const urls = import.meta.glob('../assets/runtime/**/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
export const RUNTIME_ART_URLS: Record<string, string> = Object.fromEntries(
  Object.entries(rows).flatMap(([source, row]) => {
    const url = urls[`../assets/runtime/${delivery(row).file}`];
    return url ? [[source, url]] : [];
  }),
);
/** 编译副本保持完整画布比例；把原画校准边界映射到实际下载图。 */
export function runtimeArtBounds(source: string, bounds: [number, number, number, number]): [number, number, number, number] {
  const row = rows[source];
  if (!row) return bounds;
  const selected = delivery(row);
  const sx = selected.width / row.sourceWidth,
    sy = selected.height / row.sourceHeight;
  return [bounds[0] * sx, bounds[1] * sy, bounds[2] * sx, bounds[3] * sy];
}

/** Original-pixel calibration to the selected static delivery canvas. */
export function runtimeArtScale(source: string): number {
  const row = rows[source];
  return row ? delivery(row).width / row.sourceWidth : 1;
}

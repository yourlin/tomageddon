import { save } from './Save';
import { IS_WECHAT } from './Device';

export type GraphicsQuality = 'auto' | 'low' | 'standard' | 'high';
export type GraphicsTier = Exclude<GraphicsQuality, 'auto'>;
const PROFILES = {
  low: { frameSize: 96, maxRenderScale: 1 },
  standard: { frameSize: 128, maxRenderScale: 1.5 },
  high: { frameSize: 256, maxRenderScale: 2 },
} as const;

/** 自动档：默认高画质（手机屏幕像素密度高，低档会明显发糊）；只有内存受限的环境降一档到标准 */
export function resolveGraphicsTier(setting: GraphicsQuality | undefined, constrained: boolean): GraphicsTier {
  if (setting === 'low' || setting === 'standard' || setting === 'high') return setting;
  return constrained ? 'standard' : 'high';
}

export function currentGraphicsProfile() {
  // deviceMemory 只有 Chromium 内核会报告（安卓）；微信内置浏览器的内存限制最严
  const memory = typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const tier = resolveGraphicsTier(save.settings.graphicsQuality, IS_WECHAT || (memory !== undefined && memory <= 4));
  return { tier, ...PROFILES[tier] };
}

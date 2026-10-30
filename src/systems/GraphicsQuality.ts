import { save } from './Save';
import { LOW_MEM } from './Device';

export type GraphicsQuality = 'auto' | 'low' | 'standard' | 'high';
export type GraphicsTier = Exclude<GraphicsQuality, 'auto'>;
const PROFILES = {
  low: { frameSize: 96, maxRenderScale: 1 },
  standard: { frameSize: 128, maxRenderScale: 1.5 },
  high: { frameSize: 256, maxRenderScale: 2 },
} as const;

export function resolveGraphicsTier(setting: GraphicsQuality | undefined, lowMemory: boolean, touch: boolean): GraphicsTier {
  if (setting === 'low' || setting === 'standard' || setting === 'high') return setting;
  return lowMemory ? 'low' : touch ? 'standard' : 'high';
}

export function currentGraphicsProfile() {
  const touch = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)').matches;
  const memory = typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  const tier = resolveGraphicsTier(save.settings.graphicsQuality, LOW_MEM || (memory !== undefined && memory <= 4), touch);
  return { tier, ...PROFILES[tier] };
}

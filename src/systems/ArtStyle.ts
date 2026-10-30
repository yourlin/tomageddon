// 画风：可爱风（插画贴图）/ 复古风（不带贴图，全部程序绘制）。
// 战斗外观、头像、地图、武器、弹体、开场封面都读这里的开关；切换在设置里即时生效（见 ArtStyleSwitch.ts）。
import { save } from './Save';

export type ArtStyle = 'cute' | 'retro';

let retro =
  save.settings.artStyle === 'retro' || (typeof location !== 'undefined' && new URLSearchParams(location.search).get('art') === '0');

export const currentArtStyle = (): ArtStyle => (retro ? 'retro' : 'cute');
/** 复古风（或 ?art=0 / 开发者面板强制）：不使用任何插画贴图 */
export const isForceProcedural = (): boolean => retro;
export const setForceProcedural = (v: boolean): void => void (retro = v);

// 武器专属造型汇总：id → 绘制函数（drawWeapon 优先使用；没有的武器沿用旧的模板换色）
import type { Ctx } from '../Painter';
import { ART as B1 } from './batch1';
import { ART as B2 } from './batch2';
import { ART as B3 } from './batch3';
import { ART as B4 } from './batch4';
import { ART as B5 } from './batch5';
import { ART as B6 } from './batch6';

export const UNIQUE_WEAPON_ART: Record<string, (ctx: Ctx) => void> = { ...B1, ...B2, ...B3, ...B4, ...B5, ...B6 };

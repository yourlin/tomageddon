// 全章节补完素材的校准记录；只有制作、检查过的文件才登记。
import rows from './artGlobal.generated.json';
import type { EntityArtEntry } from './artManifest';
export const GLOBAL_ENTITY_ART: EntityArtEntry[] = rows.map(
  (r: { kind: string; id: string; anchor: { x: number; y: number }; version?: number; refRadius: number }) => ({
    kind: r.kind as 'enemy' | 'boss',
    id: r.id,
    version: r.version ?? 1,
    source: { type: 'static', file: 'body.png' },
    anchor: r.anchor,
    refRadius: r.refRadius,
    ...(r.kind === 'enemy' ? { reuse: { champ: 'goldAura' as const } } : {}),
    credit: 'Built-in image_gen; global cute kitchen art. Prompts: docs/design/ART_GLOBAL_GENERATION.json',
  }),
);

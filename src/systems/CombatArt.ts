// 战斗附加美术按章加载：第一章已有弹体与形态、全章节 Boss 阶段插画。
import type Phaser from 'phaser';
import globalForms from '../data/bossFormArt.generated.json';
import { BOSS_MAP } from '../data/bosses';
import type { BossFormArt } from '../data/combatArt';
import { CH1_PROJECTILES, CH1_BOSS_FORMS, enemyProjectileArt } from '../data/combatArt';
import type { VisualForm } from '../objects/visualTypes';
import type { Bullet } from '../objects/Bullet';
import { enemyProjectileEntry, isIllustratedProjectile } from './ProjectileArtRegistry';
import { isForceProcedural } from '../objects/visualFactory';
import { RUNTIME_ART_URLS } from './RuntimeArt';
import { retainSceneTexture } from './SceneArtLease';
import { BOSS_MOTION_FORMS, type BossMotionForm } from '../data/bossMotionForms';
import { entryFile } from './ArtResolve';

const GLOBAL_FORMS = globalForms as (BossFormArt & { id: string; phase: number })[];
export const combatArtKey = (file: string): string => `combat:ch1/${file}`;
const motionKey = (f: BossMotionForm): string => `boss-motion:${f.id}:${f.phase}@${f.entry.version}:${f.entry.source?.file}`;
const availableMotion = (id: string, phase: number): BossMotionForm | undefined =>
  BOSS_MOTION_FORMS.find(
    (f) =>
      f.id === id &&
      f.phase === phase &&
      f.entry.source?.type === 'spritesheet' &&
      !!RUNTIME_ART_URLS[entryFile(f.entry, f.entry.source.file)],
  );

export function queueCombatArt(scene: Phaser.Scene, chapter: number, bossIds?: ReadonlySet<string>): void {
  if (isForceProcedural()) return;
  // 正常战斗使用小尺寸专属弹体；旧的大图只供显式全量图鉴/验收请求使用。
  const files = chapter === 1 && bossIds === undefined ? Object.values(CH1_PROJECTILES).map((a) => a.file) : [];
  for (const [id, forms] of Object.entries(CH1_BOSS_FORMS))
    if (bossIds ? bossIds.has(id) : chapter === 1)
      files.push(
        ...Object.entries(forms)
          .filter(([phase]) => !availableMotion(id, Number(phase)))
          .map(([, a]) => a.file),
      );
  const retain = (key: string) =>
    retainSceneTexture(scene, key, (active, unused) => {
      if (active.textures.exists(unused)) active.textures.remove(unused);
    });
  for (const file of files) {
    const key = combatArtKey(file),
      url = RUNTIME_ART_URLS[`combat/ch1/${file}`];
    if (url) {
      retain(key);
      if (!scene.textures.exists(key)) scene.load.image(key, url);
    }
  }
  for (const form of GLOBAL_FORMS.filter((f) => (bossIds ? bossIds.has(f.id) : BOSS_MAP[f.id]?.chapter === chapter))) {
    if (availableMotion(form.id, form.phase)) continue;
    const key = `combat:global/${form.file}`,
      url = RUNTIME_ART_URLS[`combat/global/${form.file}`];
    if (url) {
      retain(key);
      if (!scene.textures.exists(key)) scene.load.image(key, url);
    }
  }
  for (const form of BOSS_MOTION_FORMS.filter((f) => (bossIds ? bossIds.has(f.id) : BOSS_MAP[f.id]?.chapter === chapter))) {
    const s = form.entry.source;
    if (s?.type !== 'spritesheet') continue;
    const key = motionKey(form),
      url = RUNTIME_ART_URLS[entryFile(form.entry, s.file)];
    if (!url) continue;
    retain(key);
    if (!scene.textures.exists(key))
      scene.load.spritesheet(key, url, { frameWidth: s.frameWidth, frameHeight: s.frameHeight, margin: s.margin, spacing: s.spacing });
  }
}

export function bossForm(scene: Phaser.Scene, id: string, phase: number): VisualForm | undefined {
  if (!isForceProcedural()) {
    const motion = availableMotion(id, phase);
    if (motion && scene.textures.exists(motionKey(motion))) {
      const e = motion.entry;
      return {
        key: motionKey(motion),
        phase,
        anchor: e.anchor ?? { x: 0.5, y: 0.9 },
        refRadius: e.refRadius ?? 80,
        animation: { baseFrame: e.baseFrame ?? 0, anims: e.anims ?? {}, mirror: e.mirror, facing: e.facing },
      };
    }
    const own = GLOBAL_FORMS.find((f) => f.id === id && f.phase === phase);
    if (own) {
      const key = `combat:global/${own.file}`;
      if (scene.textures.exists(key)) return { ...own, key };
    }
  }
  const form = CH1_BOSS_FORMS[id]?.[phase];
  if (!form || isForceProcedural()) return undefined;
  const key = combatArtKey(form.file);
  return scene.textures.exists(key) ? { ...form, key, phase } : undefined;
}

export function applyEnemyProjectileArt(b: Bullet, chapter: number, id: string, phase: number, legacyKey: string): boolean {
  if (isForceProcedural()) return false;
  const own = enemyProjectileEntry(id);
  if (own && isIllustratedProjectile(own.key, b.scene.textures)) {
    b.setTexture(own.key)
      .clearTint()
      .setOrigin(0.5)
      .setScale(b.radius / 26);
    b.enemyVisualSpin = own.spin;
    b.enemyVisualPulse = 0.025;
    b.enemyVisualScale = b.scaleX;
    b.impactColor = own.color;
    return true;
  }
  const selected = enemyProjectileArt(chapter, id, phase, legacyKey);
  if (!selected) return false;
  const art = CH1_PROJECTILES[selected],
    key = combatArtKey(art.file);
  if (!b.scene.textures.exists(key)) return false;
  b.setTexture(key).clearTint().setOrigin(art.anchor.x, art.anchor.y);
  b.setScale(b.radius / art.refRadius);
  b.enemyVisualSpin = art.spin;
  b.enemyVisualPulse = art.pulse;
  b.enemyVisualScale = b.scaleX;
  b.impactColor = art.color;
  return true;
}

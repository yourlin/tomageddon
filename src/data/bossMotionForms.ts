import type { EntityArtEntry } from './artManifest';
import { MOLD_KING_MOTION_ART } from './moldKingMotion';
import { GREASE_CHEF_MOTION_ART } from './greaseChefMotion';
import { COCKROACH_EMPEROR_MOTION_ART } from './cockroachEmperorMotion';
import { LOCUST_QUEEN_MOTION_ART } from './locustQueenMotion';
import { ROTTEN_PUMPKIN_MOTION_ART } from './rottenPumpkinMotion';
import { MOLE_GENERAL_MOTION_ART } from './moleGeneralMotion';
import { FROST_RAT_KING_MOTION_ART } from './frostRatKingMotion';
import { ICE_CREAM_TYRANT_MOTION_ART } from './iceCreamTyrantMotion';
import { FREEZER_HEART_MOTION_ART } from './freezerHeartMotion';
import { TRASH_GOLEM_MOTION_ART } from './trashGolemMotion';
import { TOXIC_BARREL_MOTION_ART } from './toxicBarrelMotion';
import { SCRAP_DRAGON_MOTION_ART } from './scrapDragonMotion';
import { ROTTEN_CHEF_MOTION_ART } from './rottenChefMotion';
import { FACTORY_CORE_MOTION_ART } from './factoryCoreMotion';
import { KETCHUP_LEVIATHAN_MOTION_ART } from './ketchupLeviathanMotion';
import { BLIGHT_GARDENER_MOTION_ART } from './blightGardenerMotion';
import { ROT_MOTHER_MOTION_ART } from './rotMotherMotion';
import { ROT_KING_MOTION_ART } from './rotKingMotion';

/** Phase atlases are registered only after generation and packing, never inferred from static art. */
export interface BossMotionForm {
  id: string;
  phase: number;
  entry: EntityArtEntry;
}
export const BOSS_MOTION_FORMS: BossMotionForm[] = [
  ...[1, 2].map((phase) => ({
    id: 'mold_king',
    phase,
    entry: {
      ...MOLD_KING_MOTION_ART,
      dir: `boss/mold_king/phases/${phase}`,
      credit: `Built-in image_gen; 32 independently drawn phase frames; ART_MOLD_KING_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'grease_chef',
    phase,
    entry: {
      ...GREASE_CHEF_MOTION_ART,
      dir: `boss/grease_chef/phases/${phase}`,
      credit: `Built-in image_gen; 28 independently drawn phase frames; ART_GREASE_CHEF_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'cockroach_emperor',
    phase,
    entry: {
      ...COCKROACH_EMPEROR_MOTION_ART,
      dir: `boss/cockroach_emperor/phases/${phase}`,
      anims: {
        ...COCKROACH_EMPEROR_MOTION_ART.anims,
        ...(phase === 2 ? { attack: { frames: [36, 37, 38, 39] } } : {}),
      },
      credit: `Built-in image_gen; ${phase === 1 ? 36 : 40} independently drawn phase frames; ART_COCKROACH_EMPEROR_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'locust_queen',
    phase,
    entry: {
      ...LOCUST_QUEEN_MOTION_ART,
      dir: `boss/locust_queen/phases/${phase}`,
      anims: {
        ...LOCUST_QUEEN_MOTION_ART.anims,
        windup: { frames: [32, 33, 34, 35] },
        charge: { frames: [36, 37, 38, 39] },
      },
      credit: `Built-in image_gen; 40 independently drawn phase frames; ART_LOCUST_QUEEN_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'rotten_pumpkin',
    phase,
    entry: {
      ...ROTTEN_PUMPKIN_MOTION_ART,
      dir: `boss/rotten_pumpkin/phases/${phase}`,
      anims: {
        ...ROTTEN_PUMPKIN_MOTION_ART.anims,
        cast: { frames: [28, 29, 30, 31] },
        ...(phase === 1
          ? {
              windup: { frames: [32, 33, 34, 35] },
              charge: { frames: [36, 37, 38, 39] },
            }
          : {}),
      },
      credit: `Built-in image_gen; ${phase === 1 ? 40 : 32} independently drawn phase frames; ART_ROTTEN_PUMPKIN_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'mole_general',
    phase,
    entry: {
      ...MOLE_GENERAL_MOTION_ART,
      dir: `boss/mole_general/phases/${phase}`,
      anims: {
        ...MOLE_GENERAL_MOTION_ART.anims,
        ...(phase === 1 ? { cast: { frames: [28, 29, 30, 31] } } : {}),
      },
      credit: `Built-in image_gen; ${phase === 1 ? 32 : 28} independently drawn phase frames; ART_MOLE_GENERAL_PHASE_${phase}_ANIMATION_PILOT.json. Opaque sunglasses retained. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'frost_rat_king',
    phase,
    entry: {
      ...FROST_RAT_KING_MOTION_ART,
      dir: `boss/frost_rat_king/phases/${phase}`,
      anims: {
        ...FROST_RAT_KING_MOTION_ART.anims,
        ...(phase === 1 ? { cast: { frames: [36, 37, 38, 39] } } : {}),
      },
      credit: `Built-in image_gen; ${phase === 1 ? 40 : 36} independently drawn phase frames; ART_FROST_RAT_KING_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'ice_cream_tyrant',
    phase,
    entry: {
      ...ICE_CREAM_TYRANT_MOTION_ART,
      dir: `boss/ice_cream_tyrant/phases/${phase}`,
      anims: Object.fromEntries(
        Object.entries(ICE_CREAM_TYRANT_MOTION_ART.anims ?? {}).filter(([state]) => phase === 1 || state !== 'cast'),
      ),
      credit: `Built-in image_gen; ${phase === 1 ? 32 : 28} independently drawn phase frames; ART_ICE_CREAM_TYRANT_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'freezer_heart',
    phase,
    entry: {
      ...FREEZER_HEART_MOTION_ART,
      dir: `boss/freezer_heart/phases/${phase}`,
      anims: {
        ...FREEZER_HEART_MOTION_ART.anims,
        ...(phase === 1 ? { cast: { frames: [28, 29, 30, 31] } } : {}),
      },
      credit: `Built-in image_gen; ${phase === 1 ? 32 : 28} independently drawn phase frames; ART_FREEZER_HEART_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'trash_golem',
    phase,
    entry: {
      ...TRASH_GOLEM_MOTION_ART,
      dir: `boss/trash_golem/phases/${phase}`,
      anims: {
        ...TRASH_GOLEM_MOTION_ART.anims,
        cast: { frames: [28, 29, 30, 31] },
      },
      credit: `Built-in image_gen; 32 independently drawn phase frames; ART_TRASH_GOLEM_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'toxic_barrel',
    phase,
    entry: {
      ...TOXIC_BARREL_MOTION_ART,
      dir: `boss/toxic_barrel/phases/${phase}`,
      anims: {
        ...TOXIC_BARREL_MOTION_ART.anims,
        ...(phase === 1 ? { cast: { frames: [28, 29, 30, 31] } } : {}),
      },
      credit: `Built-in image_gen; ${phase === 1 ? 32 : 28} independently drawn phase frames; ART_TOXIC_BARREL_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'scrap_dragon',
    phase,
    entry: {
      ...SCRAP_DRAGON_MOTION_ART,
      dir: `boss/scrap_dragon/phases/${phase}`,
      anims: {
        ...SCRAP_DRAGON_MOTION_ART.anims,
        ...(phase === 1
          ? {
              cast: { frames: [28, 29, 30, 31] },
              windup: { frames: [32, 33, 34, 35] },
              charge: { frames: [36, 37, 38, 39] },
            }
          : {
              windup: { frames: [28, 29, 30, 31] },
              charge: { frames: [32, 33, 34, 35] },
            }),
      },
      credit: `Built-in image_gen; ${phase === 1 ? 40 : 36} independently drawn phase frames; ART_SCRAP_DRAGON_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'rotten_chef',
    phase,
    entry: {
      ...ROTTEN_CHEF_MOTION_ART,
      dir: `boss/rotten_chef/phases/${phase}`,
      anims:
        phase === 1
          ? {
              ...Object.fromEntries(
                Object.entries(ROTTEN_CHEF_MOTION_ART.anims ?? {}).filter(([state]) => state !== 'windup' && state !== 'charge'),
              ),
              cast: { frames: [28, 29, 30, 31] },
            }
          : ROTTEN_CHEF_MOTION_ART.anims,
      credit: `Built-in image_gen; ${phase === 1 ? 32 : 36} independently drawn phase frames; ART_ROTTEN_CHEF_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'factory_core',
    phase,
    entry: {
      ...FACTORY_CORE_MOTION_ART,
      dir: `boss/factory_core/phases/${phase}`,
      credit: `Built-in image_gen; 32 independently drawn phase frames; ART_FACTORY_CORE_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'ketchup_leviathan',
    phase,
    entry: {
      ...KETCHUP_LEVIATHAN_MOTION_ART,
      dir: `boss/ketchup_leviathan/phases/${phase}`,
      anims: {
        ...KETCHUP_LEVIATHAN_MOTION_ART.anims,
        ...(phase === 1 ? { cast: { frames: [28, 29, 30, 31] } } : {}),
      },
      credit: `Built-in image_gen; ${phase === 1 ? 32 : 28} independently drawn phase frames; ART_KETCHUP_LEVIATHAN_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'blight_gardener',
    phase,
    entry: {
      ...BLIGHT_GARDENER_MOTION_ART,
      dir: `boss/blight_gardener/phases/${phase}`,
      anims: {
        ...Object.fromEntries(
          Object.entries(BLIGHT_GARDENER_MOTION_ART.anims ?? {}).filter(([state]) => state !== 'windup' && state !== 'charge'),
        ),
        cast: { frames: [28, 29, 30, 31] },
        ...(phase === 2
          ? {
              windup: { frames: [32, 33, 34, 35] },
              charge: { frames: [36, 37, 38, 39] },
            }
          : {}),
      },
      credit: `Built-in image_gen; ${phase === 1 ? 32 : 40} independently drawn phase frames; ART_BLIGHT_GARDENER_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2].map((phase) => ({
    id: 'rot_mother',
    phase,
    entry: {
      ...ROT_MOTHER_MOTION_ART,
      dir: `boss/rot_mother/phases/${phase}`,
      anims: {
        ...ROT_MOTHER_MOTION_ART.anims,
        cast: { frames: [28, 29, 30, 31] },
      },
      credit: `Built-in image_gen; 32 independently drawn phase frames; ART_ROT_MOTHER_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
  ...[1, 2, 3].map((phase) => ({
    id: 'rot_king',
    phase,
    entry: {
      ...ROT_KING_MOTION_ART,
      dir: `boss/rot_king/phases/${phase}`,
      anims: {
        ...Object.fromEntries(Object.entries(ROT_KING_MOTION_ART.anims ?? {}).filter(([state]) => state !== 'cast')),
        ...(phase !== 2
          ? {
              windup: { frames: [28, 29, 30, 31] },
              charge: { frames: [32, 33, 34, 35] },
            }
          : {}),
      },
      credit: `Built-in image_gen; ${phase === 2 ? 28 : 36} independently drawn phase frames; ART_ROT_KING_PHASE_${phase}_ANIMATION_PILOT.json. Final visual/performance acceptance pending.`,
    },
  })),
];

// I3：收藏度总览——角色、武器、道具、遗物、成就、外观、角色任务的完成百分比
import Phaser from 'phaser';
import { text, button, COLORS, autoRelayout } from '../ui/UI';
import { tx } from '../i18n';
import { save, unlockedCount } from '../systems/Save';
import { CHARACTERS } from '../data/characters';
import { WEAPONS } from '../data/weapons';
import { EVOLVED_WEAPONS } from '../data/evolutions';
import { ITEMS } from '../data/items';
import { RELICS } from '../data/relics';
import { ACHIEVEMENTS } from '../data/achievements';
import { ENEMIES } from '../data/enemies';
import { BOSSES } from '../data/bosses';
import { SKINS } from '../data/skins';
import { QUESTS } from '../data/quests';
import { skinOwned, questDone } from '../systems/Progress';
import { achTier } from '../systems/Achievements';
import { unlockedTitles } from '../data/titles';

export interface CollectionRow {
  name: [string, string];
  have: number;
  total: number;
}

/** 收藏度各项（纯数据，测试可直接调用） */
export function collectionRows(): CollectionRow[] {
  const seen = save.seen;
  const has = (list: string[], ids: { id: string }[]): number => ids.filter((x) => list.includes(x.id)).length;
  return [
    { name: ['角色', 'Characters'], have: unlockedCount(), total: CHARACTERS.length },
    { name: ['武器', 'Weapons'], have: has(seen.weapons, WEAPONS), total: WEAPONS.length },
    { name: ['超武', 'Evolved weapons'], have: has(seen.weapons, EVOLVED_WEAPONS), total: EVOLVED_WEAPONS.length },
    { name: ['道具', 'Items'], have: has(seen.items, ITEMS), total: ITEMS.length },
    { name: ['遗物', 'Relics'], have: RELICS.filter((r) => save.meta.relics.includes(r.id)).length, total: RELICS.length },
    { name: ['敌人', 'Enemies'], have: has(seen.enemies, ENEMIES), total: ENEMIES.length },
    { name: ['首领', 'Bosses'], have: has(seen.bosses, BOSSES), total: BOSSES.length },
    {
      name: ['成就等级', 'Achievement tiers'],
      have: ACHIEVEMENTS.reduce((s, a) => s + Math.min(achTier(a.id), a.tiers.length), 0),
      total: ACHIEVEMENTS.reduce((s, a) => s + a.tiers.length, 0),
    },
    { name: ['称号', 'Titles'], have: unlockedTitles(save.achievements).length, total: ACHIEVEMENTS.length },
    { name: ['角色任务', 'Character quests'], have: QUESTS.filter((q) => questDone(q)).length, total: QUESTS.length },
    { name: ['皮肤', 'Skins'], have: SKINS.filter((s) => skinOwned(s.charId)).length, total: SKINS.length },
  ];
}

export function collectionPercent(rows = collectionRows()): number {
  const p = rows.reduce((s, r) => s + (r.total ? r.have / r.total : 1), 0) / rows.length;
  return Math.round(p * 1000) / 10;
}

export class CollectionScene extends Phaser.Scene {
  constructor() {
    super('Collection');
  }

  create(): void {
    autoRelayout(this);
    const W = this.scale.width;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    const rows = collectionRows();
    text(this, 24, 18, tx('收藏度', 'Collection'), 36);
    text(this, 220, 32, tx(`总完成度 ${collectionPercent(rows)}%`, `Overall ${collectionPercent(rows)}%`), 22, '#ffd166');
    button(this, W - 90, 44, 140, 52, tx('返回', 'Back'), () => this.scene.start('Menu'), 0x555555, 22);
    const x0 = 80,
      bw = W - 360;
    rows.forEach((r, i) => {
      const y = 120 + i * 50;
      const p = r.total ? r.have / r.total : 1;
      text(this, x0, y, tx(r.name[0], r.name[1]), 20).setOrigin(0, 0.5);
      this.add
        .rectangle(x0 + 200, y, bw, 22, 0x000000, 0.4)
        .setOrigin(0, 0.5)
        .setStrokeStyle(1, 0xffffff, 0.2);
      if (p > 0) this.add.rectangle(x0 + 200, y, bw * p, 22, p >= 1 ? 0xffd166 : 0x52b788).setOrigin(0, 0.5);
      text(this, x0 + 210 + bw, y, `${r.have}/${r.total}  ${Math.floor(p * 100)}%`, 18, p >= 1 ? '#ffd166' : COLORS.textDim).setOrigin(
        0,
        0.5,
      );
    });
  }
}

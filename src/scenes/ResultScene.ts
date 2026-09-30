// 结算
import Phaser from 'phaser';
import { showcaseRig } from '../ui/Portrait';
import { text, button, panel, COLORS, autoRelayout } from '../ui/UI';
import { run, clearRun } from '../systems/RunState';
import { save, persist, isUnlocked } from '../systems/Save';
import { CHARACTERS } from '../data/characters';
import { CHAPTERS } from '../data/chapters';
import { audio } from '../systems/Audio';
import { tx } from '../i18n';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  create(data: { win: boolean; counted?: boolean }): void {
    autoRelayout(this, data);
    const W = this.scale.width,
      H = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    audio.stopMusic();
    clearRun();
    const before = new Set(CHARACTERS.filter(isUnlocked).map((c) => c.id));
    if (data.win && !data.counted) {
      data.counted = true;
      save.wins++;
      save.charWins[run.charId] = (save.charWins[run.charId] ?? 0) + 1;
      save.clearedChapters = Math.max(save.clearedChapters, run.chapterId);
      persist();
      audio.play(this, 'levelup');
    }
    const newly = CHARACTERS.filter((c) => isUnlocked(c) && !before.has(c.id));

    panel(this, W / 2 - 400, 40, 800, H - 80);
    text(
      this,
      W / 2,
      90,
      data.win ? tx('通关成功！', 'Chapter Cleared!') : tx('你被打败了……', 'You were defeated...'),
      52,
      data.win ? '#ffd166' : '#ff6b6b',
    ).setOrigin(0.5);
    text(this, W / 2, 145, run.chapter.name, 22, COLORS.textDim).setOrigin(0.5);
    const hero = showcaseRig(this, 'char', run.charId, W / 2 - 250, 290, 70);
    if (data.win) hero.play('victory', true);
    text(
      this,
      W / 2 - 120,
      200,
      [
        tx(`角色：${run.char.name}`, `Character: ${run.char.name}`),
        tx(`到达波次：${run.wave} / 15`, `Wave reached: ${run.wave} / 15`),
        tx(`等级：${run.level}`, `Level: ${run.level}`),
        tx(`击杀：${run.kills}`, `Kills: ${run.kills}`),
        tx(
          `武器：${run.weapons.length} 把 · 道具：${Object.values(run.items).reduce((a, b) => a + b, 0)} 个`,
          `Weapons: ${run.weapons.length} · Items: ${Object.values(run.items).reduce((a, b) => a + b, 0)}`,
        ),
      ].join('\n'),
      22,
      '#fff4ea',
      { lineSpacing: 10 },
    );
    let y = 400;
    if (data.win && run.chapterId < CHAPTERS.length) {
      text(
        this,
        W / 2,
        y,
        tx(`解锁新章节：${CHAPTERS[run.chapterId].name}`, `New chapter unlocked: ${CHAPTERS[run.chapterId].name}`),
        22,
        '#52ff8a',
      ).setOrigin(0.5);
      y += 34;
    }
    // 一次解锁多名角色时合并成一行名单，避免遮挡按钮
    if (newly.length === 1) {
      const c = newly[0];
      text(
        this,
        W / 2,
        y,
        tx(`解锁新角色：${c.name}（${c.title}）`, `New character unlocked: ${c.name} (${c.title})`),
        22,
        '#52ff8a',
      ).setOrigin(0.5);
    } else if (newly.length > 1) {
      const names = newly.map((c) => c.name).join(tx('、', ', '));
      text(
        this,
        W / 2,
        y,
        tx(`解锁${newly.length}名新角色：${names}`, `${newly.length} new characters unlocked: ${names}`),
        20,
        '#52ff8a',
        {
          wordWrap: { width: 720, useAdvancedWrap: true },
          align: 'center',
        },
      ).setOrigin(0.5, 0);
    }

    button(
      this,
      W / 2 - 150,
      H - 110,
      260,
      68,
      tx('再来一局', 'Play Again'),
      () => {
        run.start(run.charId, run.chapterId);
        this.scene.start('Game');
      },
      COLORS.primary,
      26,
    );
    button(this, W / 2 + 150, H - 110, 260, 68, tx('返回菜单', 'Main Menu'), () => this.scene.start('Menu'), 0x555555, 26);
  }
}

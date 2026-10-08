// 结算
import { tip } from '../systems/Tutorial';
import { challengeKindName } from '../data/challenges';
import { takeStreakReward } from '../systems/RunState';
import { bump, bumpMax, counter } from '../systems/Counters';
import { WEAPON_MAP } from '../data/weapons';
import Phaser from 'phaser';
import { showcaseRig } from '../ui/Portrait';
import { text, button, panel, COLORS, autoRelayout, fitImage } from '../ui/UI';
import { portraitKey } from '../ui/Portrait';
import { run, clearRun, recordHistory } from '../systems/RunState';
import { save, persist, type RunRecord } from '../systems/Save';
import { CHARACTER_MAP } from '../data/characters';
import { CHAPTERS, BASE_CHAPTERS } from '../data/chapters';
import { audio } from '../systems/Audio';
import { tx } from '../i18n';
import { checkAchievements, setInRun } from '../systems/Achievements';
import { showSharePoster } from '../systems/SharePoster';
import { settleDanger, type DangerResult } from '../systems/Danger';
import { settleProgress, type ProgressResult } from '../systems/Progress';
import { VW, VH } from '../systems/HiDpi';
import { titleBadge } from '../ui/TitleBadge';

export class ResultScene extends Phaser.Scene {
  private record!: RunRecord;

  constructor() {
    super('Result');
  }

  create(data: { win: boolean; counted?: boolean; recorded?: boolean; danger?: DangerResult; progress?: ProgressResult }): void {
    autoRelayout(this, data);
    const W = VW(this),
      H = VH(this);
    this.cameras.main.setBackgroundColor(COLORS.bg);
    audio.stopMusic();
    clearRun();
    if (data.win && !data.counted) {
      data.counted = true;
      save.wins++;
      save.charWins[run.charId] = (save.charWins[run.charId] ?? 0) + 1;
      if (run.chapterId <= BASE_CHAPTERS) save.clearedChapters = Math.max(save.clearedChapters, run.chapterId);
      // 成就计数：角色 × 章节通关、挑战条件
      bump(`charClear:${run.charId}:${run.chapterId}`);
      if (run.weapons.length === 1) bump('winSolo');
      if (run.hp <= run.stats.maxHp * 0.1) bump('winLowHp');
      const classes = new Set(run.weapons.map((w) => WEAPON_MAP[w.id].cls));
      if (run.weapons.length >= 4 && classes.size === 1) bump(`winPure:${[...classes][0]}`);
      if (run.holdsAllT4()) bump('winAllT4');
      if (Object.values(run.items).reduce((x, y) => x + y, 0) >= 60) bump('winHoarder');
      persist();
      audio.play(this, 'levelup');
      if (!run.endless && !run.challenge) tip('endless', this);
    }
    if (!data.win && !data.counted) {
      data.counted = true;
      if (run.endless) bumpMax('endlessRunKills', run.kills);
      bump('deaths');
      if (run.wave === 1) bump('deathW1');
      persist();
    }
    if (!data.recorded) {
      data.recorded = true;
      this.record = recordHistory(!!data.win);
      data.danger = settleDanger(!!data.win, this.record.sec);
      data.progress = settleProgress(!!data.win);
      persist();
    } else this.record = save.history[0];
    const dr = data.danger;
    checkAchievements();
    setInRun(false);
    const newChars = run.newChars.map((id) => CHARACTER_MAP[id]).filter(Boolean);

    panel(this, W / 2 - 400, 40, 800, H - 80);
    text(
      this,
      W / 2,
      90,
      data.win
        ? tx('通关成功！', 'Chapter Cleared!')
        : run.endless
          ? tx(`无尽模式 · 坚持到第 ${run.wave} 波`, `Endless · survived to wave ${run.wave}`)
          : tx('你被打败了……', 'You were defeated...'),
      52,
      data.win ? '#ffd166' : '#ff6b6b',
    ).setOrigin(0.5);
    text(
      this,
      W / 2,
      145,
      run.chapter.name +
        (run.endless ? tx(' · 无尽模式', ' · Endless') : '') +
        (run.danger > 0 && !run.challenge ? tx(` · 危机 ${run.danger}`, ` · Danger ${run.danger}`) : ''),
      22,
      COLORS.textDim,
    ).setOrigin(0.5);
    const hero = showcaseRig(this, 'char', run.charId, W / 2 - 250, 290, 70);
    // 佩戴中的称号：显示在主角形象下方
    if (save.meta.title) titleBadge(this, W / 2 - 250, 400, save.meta.title, 15);
    if (data.win) hero.play('victory', true);
    text(
      this,
      W / 2 - 120,
      200,
      [
        tx(`角色：${run.char.name}`, `Character: ${run.char.name}`),
        run.endless
          ? tx(`到达波次：${run.wave}（最佳 ${counter('endlessBest')}）`, `Wave reached: ${run.wave} (best ${counter('endlessBest')})`)
          : tx(`到达波次：${run.wave} / ${run.waveCount}`, `Wave reached: ${run.wave} / ${run.waveCount}`),
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
    const ch = this.record.challenge;
    if (ch) {
      const best = save.challenges[`${ch.kind}:${ch.key}`]?.best ?? ch.score;
      text(
        this,
        W / 2,
        y,
        tx(
          `${challengeKindName(ch.kind)[0]}挑战得分 ${ch.score}${ch.score >= best ? '（新纪录！）' : `（个人最佳 ${best}）`}`,
          `${challengeKindName(ch.kind)[1]} score ${ch.score}${ch.score >= best ? ' (new best!)' : ` (best ${best})`}`,
        ),
        24,
        '#e0aaff',
      ).setOrigin(0.5);
      y += 36;
      const sr = takeStreakReward();
      if (sr) {
        text(
          this,
          W / 2,
          y,
          tx(
            `连续挑战 ${sr.days} 天奖励：🥇${sr.gold}${sr.tp ? ` · 天赋点 +${sr.tp}` : ''}`,
            `${sr.days}-day streak reward: 🥇${sr.gold}${sr.tp ? ` · +${sr.tp} talent point(s)` : ''}`,
          ),
          20,
          '#ffd166',
        ).setOrigin(0.5);
        y += 30;
      }
    }
    if (data.win && run.chapterId < BASE_CHAPTERS && run.danger === 0) {
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
    // 番茄危机：第几次通关、新解锁的等级、金番茄与天赋点（A7 / A10）
    if (dr) {
      const parts: string[] = [];
      if (data.win && dr.clearNo)
        parts.push(
          run.danger > 0
            ? tx(
                `第 ${dr.clearNo} 次在危机 ${run.danger} 通关本章`,
                `Cleared this chapter at Danger ${run.danger} for the ${dr.clearNo}× time`,
              )
            : tx(`第 ${dr.clearNo} 次通关本章`, `Cleared this chapter ${dr.clearNo}×`),
        );
      if (dr.unlocked) parts.push(tx(`解锁危机 ${dr.unlocked}`, `Danger ${dr.unlocked} unlocked`));
      if (dr.fastest) parts.push(tx('最快纪录！', 'Fastest clear!'));
      if (dr.gold) parts.push(tx(`金番茄 +${dr.gold}`, `Golden Tomatoes +${dr.gold}`));
      if (dr.tp) parts.push(tx(`天赋点 +${dr.tp}`, `Talent points +${dr.tp}`));
      if (parts.length) {
        text(this, W / 2, y, parts.join(' · '), 21, '#ff9f1c').setOrigin(0.5);
        y += 34;
      }
    }
    // F1–F3：完成的角色任务、觉醒、熟练度
    const pr = data.progress;
    if (pr) {
      const parts: string[] = [];
      for (const q of pr.quests) parts.push(tx(`✔ 任务「${q.name[0]}」`, `✔ Quest "${q.name[1]}"`));
      if (pr.awakened) parts.push(tx(`✨ ${run.char.name} 觉醒了！`, `✨ ${run.char.name} awakened!`));
      parts.push(
        pr.masteryAfter > pr.masteryBefore
          ? tx(`熟练度升到 ${pr.masteryAfter} 级`, `Mastery up to Lv ${pr.masteryAfter}`)
          : tx(`熟练度经验 +${pr.masteryXp}`, `Mastery XP +${pr.masteryXp}`),
      );
      text(this, W / 2, y, parts.join(' · '), 18, '#9bf6ff', {
        wordWrap: { width: 740, useAdvancedWrap: true },
        align: 'center',
      }).setOrigin(0.5, 0);
      y += 30;
    }
    // 本局获得的成就点（累计成绩），以及本局达成成就新解锁的角色
    // 顶部对齐（与上面熟练度那行一致；原来按中线对齐会和它叠在一起）
    text(this, W / 2, y, tx(`本局获得成就点 +${run.achPoints}`, `Achievement points this run +${run.achPoints}`), 22, '#ffd166').setOrigin(
      0.5,
      0,
    );
    // 新解锁的角色：放在面板右侧（属性文字旁的空白处）展示形象 + 名字，2 列网格，最多 4 名，形象 76px
    if (newChars.length) {
      const shown = newChars.slice(0, 4);
      const colX = W / 2 + 275,
        cell = 112,
        size = 76;
      const rows = Math.ceil(shown.length / 2);
      const top = 290 - (rows * 118) / 2 + 10; // 与左侧主角形象（y = 290）竖向居中
      text(
        this,
        colX,
        top - 30,
        tx('🎉 新角色解锁', '🎉 New characters') +
          (newChars.length > shown.length ? tx(`（共 ${newChars.length} 名）`, ` (${newChars.length})`) : ''),
        18,
        '#52ff8a',
      ).setOrigin(0.5, 0);
      shown.forEach((c, i) => {
        const inRow = Math.min(2, shown.length - Math.floor(i / 2) * 2);
        const cx = colX + ((i % 2) - (inRow - 1) / 2) * cell;
        const cy = top + Math.floor(i / 2) * 118 + size / 2;
        // 先缩放到位、记下目标缩放，再从 0 弹出来引起注意
        const img = fitImage(this.add.image(cx, cy, portraitKey(this, 'char', c.id)), size);
        const k = img.scaleX;
        img.setScale(0);
        this.tweens.add({ targets: img, scale: k, duration: 380, delay: 200 + i * 120, ease: 'Back.Out' });
        text(this, cx, cy + size / 2 + 2, c.name, 16, '#fff4ea').setOrigin(0.5, 0);
      });
    }

    button(
      this,
      W / 2 - 260,
      H - 110,
      230,
      68,
      tx('再来一局', 'Play Again'),
      () => {
        save.charRuns[run.charId] = (save.charRuns[run.charId] ?? 0) + 1;
        persist();
        if (run.challenge) run.startChallenge(run.challenge);
        else run.start(run.charId, run.chapterId, run.endless);
        this.scene.start('Game');
      },
      COLORS.primary,
      26,
    );
    button(this, W / 2, H - 110, 230, 68, tx('分享战绩', 'Share'), () => void showSharePoster(this, data.win), 0xb07d2b, 26);
    button(
      this,
      W / 2 + 290,
      90,
      150,
      48,
      tx('📊 本局数据', '📊 Run stats'),
      () => this.scene.launch('RunStats', { record: this.record }),
      0x4a6fa5,
      18,
    );
    button(this, W / 2 + 260, H - 110, 230, 68, tx('返回菜单', 'Main Menu'), () => this.scene.start('Menu'), 0x555555, 26);
  }
}

// 每日 / 每周挑战：由日期种子决定角色、章节与规则修饰；单机记录个人最佳
import Phaser from 'phaser';
import { text, button, panel, COLORS, fitImage, autoRelayout } from '../ui/UI';
import { portraitKey } from '../ui/Portrait';
import { CHARACTER_MAP } from '../data/characters';
import { CHAPTERS } from '../data/chapters';
import { makeChallenge, MODIFIER_MAP, STREAK_REWARDS, challengeCode, parseChallengeCode, type ChallengeDef } from '../data/challenges';
import { promptText } from '../ui/DomInput';
import { run, clearRun } from '../systems/RunState';
import { save, persist } from '../systems/Save';
import { counter } from '../systems/Counters';
import { checkAchievements } from '../systems/Achievements';
import { dayKey } from '../systems/Rng';
import { tx, lang } from '../i18n';
import { toast } from '../ui/UI';
import { tip } from '../systems/Tutorial';
import { decodeBuild } from '../systems/BuildCode';
import { startPractice } from '../systems/Practice';

const pick = (t: [string, string]): string => (lang === 'en' ? t[1] : t[0]);

/** 距离下次刷新的剩余时间文字 */
function resetIn(kind: ChallengeDef['kind']): string {
  const now = new Date();
  // 每日：明天 0 点；每周：下周一 0 点
  const days = kind === 'daily' ? 1 : (8 - (now.getDay() || 7)) % 7 || 7;
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + days);
  const ms = next.getTime() - now.getTime();
  const h = Math.floor(ms / 3600000),
    m = Math.floor((ms % 3600000) / 60000);
  return h >= 24
    ? tx(`${Math.floor(h / 24)} 天 ${h % 24} 小时后刷新`, `resets in ${Math.floor(h / 24)}d ${h % 24}h`)
    : tx(`${h} 小时 ${m} 分后刷新`, `resets in ${h}h ${m}m`);
}

export class ChallengeScene extends Phaser.Scene {
  constructor() {
    super('Challenge');
  }

  create(): void {
    autoRelayout(this);
    const W = this.scale.width,
      H = this.scale.height;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    text(this, 24, 18, tx('每日 / 每周挑战', 'Daily / Weekly Challenges'), 36);
    text(
      this,
      24,
      66,
      tx(
        '同一天（同一周）所有玩家抽到的角色、章节、规则和商店都一样——比一比谁打得更好。挑战会临时借用角色，不需要先解锁。',
        'Everyone gets the same character, chapter, rules and shops on the same day (week). Characters are lent for the challenge — no unlock needed.',
      ),
      16,
      COLORS.textDim,
      { wordWrap: { width: W - 220, useAdvancedWrap: true } },
    );
    button(this, W - 90, 44, 140, 52, tx('返回', 'Back'), () => this.scene.start('Menu'), 0x555555, 22);
    // D6：输入别人分享的种子（或任意文字）打同一局
    button(
      this,
      W - 250,
      44,
      160,
      52,
      tx('输入种子', 'Enter Seed'),
      () => {
        void promptText(tx('输入挑战种子或分享码', 'Enter a seed or share code'), 'daily:2026-10-04').then((code) => {
          const c = code ? parseChallengeCode(code) : null;
          if (c) this.begin(c);
        });
      },
      0x2a6f97,
      20,
    );
    // J4：自定义挑战；J3：练习模式（导入构筑码，默认最近一局）
    button(this, W - 430, 44, 180, 52, tx('🛠️ 自定义挑战', '🛠️ Custom'), () => this.scene.start('CustomChallenge'), 0x7b2cbf, 19);
    button(this, W - 630, 44, 180, 52, tx('🎯 练习模式', '🎯 Practice'), () => this.practice(), 0x2d6a4f, 19);
    tip('practice', this);
    const cw = (W - 72) / 2;
    this.card(makeChallenge('daily'), 24, 116, cw, 440);
    this.card(makeChallenge('weekly'), 48 + cw, 116, cw, 440);
    // 最近 7 天每日挑战
    const y = 572;
    text(this, 24, y, tx('最近 7 天每日挑战', 'Last 7 daily challenges'), 18, '#ffd166');
    const streak = counter('dailyLastDay') ? counter('dailyStreak') : 0;
    text(
      this,
      W - 24,
      y,
      (() => {
        const nx = STREAK_REWARDS.find((r) => streak < r.days);
        const base = tx(
          `连续挑战 ${streak} 天 · 最长 ${counter('dailyStreakBest')} 天`,
          `Streak ${streak} day(s) · best ${counter('dailyStreakBest')}`,
        );
        return nx
          ? base +
              tx(
                ` · 连续 ${nx.days} 天奖励 🥇${nx.gold}${nx.tp ? ` +${nx.tp} 天赋点` : ''}`,
                ` · ${nx.days}-day reward 🥇${nx.gold}${nx.tp ? ` +${nx.tp} TP` : ''}`,
              )
          : base;
      })(),
      16,
      COLORS.textDim,
    ).setOrigin(1, 0);
    const bw = (W - 48 - 6 * 10) / 7;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      const rec = save.challenges[`daily:${k}`];
      const x = 24 + (6 - i) * (bw + 10);
      panel(this, x, y + 30, bw, 86, rec ? COLORS.panel : 0x1f0d10, rec?.won ? COLORS.gold : rec ? 0x9d4edd : 0x3d1d22);
      text(this, x + bw / 2, y + 44, i === 0 ? tx('今天', 'Today') : `${d.getMonth() + 1}/${d.getDate()}`, 14, COLORS.textDim).setOrigin(
        0.5,
        0,
      );
      const c = makeChallenge('daily', k);
      fitImage(this.add.image(x + 26, y + 88, portraitKey(this, 'char', c.charId)), 34).setAlpha(rec ? 1 : 0.4);
      text(
        this,
        x + bw - 12,
        y + 88,
        rec ? `${rec.won ? '✓ ' : ''}${rec.best}` : '—',
        17,
        rec?.won ? '#ffd166' : rec ? '#e0aaff' : COLORS.textDim,
      ).setOrigin(1, 0.5);
    }
    void H;
  }

  private practice(): void {
    const last = save.history.find((r) => r.build)?.build ?? '';
    void promptText(tx('粘贴构筑分享码（默认是最近一局）', 'Paste a build code (defaults to your last run)'), 'TMG1-…', last).then(
      (code) => {
        if (!code) return;
        const b = decodeBuild(code);
        if (!b) return toast(this, tx('构筑码无效', 'Invalid build code'), '#ff6b6b');
        startPractice(this, b);
      },
    );
  }

  private begin(c: ChallengeDef): void {
    clearRun();
    save.charRuns[c.charId] = (save.charRuns[c.charId] ?? 0) + 1;
    persist();
    checkAchievements();
    run.startChallenge(c);
    this.scene.start('Game');
  }

  private card(c: ChallengeDef, x: number, y: number, w: number, h: number): void {
    const daily = c.kind === 'daily';
    panel(this, x, y, w, h, COLORS.panel, daily ? 0xc1121f : 0x9d4edd);
    text(this, x + 20, y + 16, daily ? tx('🗓️ 每日挑战', '🗓️ Daily') : tx('♾️ 每周挑战', '♾️ Weekly'), 26, daily ? '#ff6b5e' : '#e0aaff', {
      fontStyle: 'bold',
    });
    text(this, x + w - 20, y + 24, `${c.key} · ${resetIn(c.kind)}`, 14, COLORS.textDim).setOrigin(1, 0);
    // D5：分享码，点击复制
    const code = challengeCode(c);
    const ct = text(this, x + w - 20, y + 44, tx(`分享码 ${code} 📋`, `Share code ${code} 📋`), 13, '#9bf6ff')
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });
    ct.on('pointerup', () => {
      void navigator.clipboard?.writeText(code).then(() => ct.setText(tx('已复制 ✓', 'Copied ✓')));
    });
    const ch = CHARACTER_MAP[c.charId];
    fitImage(this.add.image(x + 70, y + 120, portraitKey(this, 'char', c.charId)), 100);
    text(this, x + 140, y + 74, ch.name, 24, '#fff4ea', { fontStyle: 'bold' });
    text(
      this,
      x + 140,
      y + 108,
      `${CHAPTERS[c.chapterId - 1].name} · ${c.endless ? tx('无尽模式（比坚持的波数）', 'Endless (how far can you go)') : tx('15 波', '15 waves')}`,
      16,
      COLORS.text,
    );
    text(this, x + 140, y + 134, tx(`技能：${ch.skill.name}`, `Skill: ${ch.skill.name}`), 15, COLORS.textDim);
    let my = y + 168;
    text(this, x + 20, my, tx('今日规则', 'Rules'), 17, '#ffd166');
    my += 28;
    for (const id of c.modifiers) {
      const m = MODIFIER_MAP[id];
      text(this, x + 24, my, m.icon, 26);
      text(this, x + 64, my - 2, pick(m.name), 18, '#fff4ea', { fontStyle: 'bold' });
      text(this, x + 64, my + 22, pick(m.desc), 14, COLORS.textDim);
      my += 46;
    }
    const rec = save.challenges[`${c.kind}:${c.key}`];
    text(
      this,
      x + 20,
      y + h - 88,
      rec
        ? tx(
            `个人最佳 ${rec.best} 分 · 最远第 ${rec.bestWave} 波 · 已挑战 ${rec.attempts} 次${rec.won ? ' · 已通关' : ''}`,
            `Best ${rec.best} pts · wave ${rec.bestWave} · ${rec.attempts} attempt(s)${rec.won ? ' · cleared' : ''}`,
          )
        : tx('还没有挑战过', 'Not attempted yet'),
      16,
      rec ? '#e0aaff' : COLORS.textDim,
    );
    button(
      this,
      x + w / 2,
      y + h - 38,
      w - 40,
      56,
      rec ? tx('再次挑战', 'Try again') : tx('开始挑战', 'Start'),
      () => this.begin(c),
      daily ? 0xc1121f : 0x7b2cbf,
      24,
    );
  }
}

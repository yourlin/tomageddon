// 局后数据（弹窗）：伤害来源排行 + 每波收入；从结算页或战绩页打开
import Phaser from 'phaser';
import { challengeKindName } from '../data/challenges';
import { text, button, panel, COLORS, fitImage } from '../ui/UI';
import { WEAPON_MAP, TIER_NAMES } from '../data/weapons';
import { CHARACTER_MAP } from '../data/characters';
import { CHAPTERS } from '../data/chapters';
import type { RunRecord } from '../systems/Save';
import { decodeBuild } from '../systems/BuildCode';
import { startPractice } from '../systems/Practice';
import { tx } from '../i18n';

/** 伤害来源的显示名与图标 */
export function sourceLabel(src: string): { name: string; icon?: string } {
  const w = WEAPON_MAP[src];
  if (w) return { name: w.name, icon: `weapon_${src}` };
  const names: Record<string, string> = {
    skill: tx('技能', 'Skill'),
    dot: tx('持续伤害（灼烧 / 中毒 / 流血）', 'Damage over time'),
    explosion: tx('爆炸', 'Explosions'),
    knives: tx('袖里飞刀（天赋）', 'Hidden Knives (talent)'),
    other: tx('其他（闪电 / 荆棘等）', 'Other (lightning, thorns…)'),
  };
  return { name: names[src] ?? src };
}

const fmt = (n: number): string => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${(n / 1e3).toFixed(1)}k` : String(Math.round(n)));

export class RunStatsScene extends Phaser.Scene {
  constructor() {
    super('RunStats');
  }

  create(data: { record: RunRecord }): void {
    const r = data.record;
    const W = this.scale.width,
      H = this.scale.height;
    this.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0).setInteractive();
    const px = 60,
      py = 40,
      pw = W - 120,
      ph = H - 80;
    panel(this, px, py, pw, ph);
    const c = CHARACTER_MAP[r.charId];
    const mode = r.challenge
      ? tx(`${challengeKindName(r.challenge.kind)[0]}挑战`, `${challengeKindName(r.challenge.kind)[1]} Challenge`)
      : r.endless
        ? tx('无尽模式', 'Endless')
        : r.win
          ? tx('通关', 'Cleared')
          : tx('阵亡', 'Defeated');
    text(this, px + 24, py + 18, tx('本局数据', 'Run Stats'), 30);
    const min = Math.floor(r.sec / 60),
      sec = r.sec % 60;
    text(
      this,
      px + 190,
      py + 28,
      `${c?.name ?? r.charId} · ${CHAPTERS[r.chapterId - 1]?.name ?? ''} · ${mode} · ${tx(`第 ${r.wave} 波`, `wave ${r.wave}`)} · Lv.${r.level} · ${tx(`击杀 ${r.kills}`, `${r.kills} kills`)} · ${min}:${String(sec).padStart(2, '0')}`,
      17,
      COLORS.textDim,
    );
    button(this, px + pw - 70, py + 34, 110, 46, tx('关闭', 'Close'), () => this.scene.stop(), 0x555555, 20);

    // ---- 伤害来源（横向条形图） ----
    const lx = px + 24,
      ly = py + 84,
      lw = pw * 0.56;
    text(this, lx, ly, tx('伤害来源', 'Damage by source'), 20, '#ffd166');
    const total = r.dmg.reduce((a, b) => a + b[1], 0) || 1;
    const max = r.dmg[0]?.[1] || 1;
    const rowH = 40;
    r.dmg.slice(0, 10).forEach(([src, v], i) => {
      const y = ly + 38 + i * rowH;
      const lab = sourceLabel(src);
      if (lab.icon && this.textures.exists(lab.icon)) fitImage(this.add.image(lx + 16, y + 14, lab.icon), 30);
      else
        text(
          this,
          lx + 16,
          y + 14,
          src === 'skill' ? '🌟' : src === 'dot' ? '🔥' : src === 'explosion' ? '💥' : src === 'knives' ? '🔪' : '✨',
          20,
        ).setOrigin(0.5);
      const tier = r.weapons.find((w) => w.id === src);
      text(
        this,
        lx + 40,
        y + 2,
        lab.name + (tier ? ` ${TIER_NAMES[tier.tier]}${tier.forge ? ` +${tier.forge}` : ''}` : ''),
        15,
        COLORS.text,
      );
      const bx = lx + 40,
        bw = lw - 150;
      const g = this.add.graphics();
      g.fillStyle(0x1a0a0c, 1).fillRoundedRect(bx, y + 22, bw, 10, 4);
      g.fillStyle(i === 0 ? 0xffd166 : 0x4aa3ff, 1).fillRoundedRect(bx, y + 22, Math.max(6, (bw * v) / max), 10, {
        tl: 0,
        bl: 0,
        tr: 4,
        br: 4,
      });
      text(this, lx + lw - 100, y + 10, `${fmt(v)}  ${Math.round((v / total) * 100)}%`, 15, COLORS.textDim).setOrigin(0, 0.5);
    });
    if (!r.dmg.length) text(this, lx, ly + 40, tx('没有记录到伤害', 'No damage recorded'), 16, COLORS.textDim);

    // ---- J2 构筑分享码 / J3 用此构筑练习 ----
    if (r.build) {
      const code = r.build;
      const cb = text(this, lx, py + ph - 30, tx('📋 复制构筑分享码', '📋 Copy build code'), 16, '#9bf6ff').setInteractive({
        useHandCursor: true,
      });
      cb.on('pointerup', () => void navigator.clipboard?.writeText(code).then(() => cb.setText(tx('已复制 ✓', 'Copied ✓'))));
      const pr = text(this, lx + 200, py + ph - 30, tx('🎯 用此构筑练习', '🎯 Practice this build'), 16, '#9be564').setInteractive({
        useHandCursor: true,
      });
      pr.on('pointerup', () => {
        const b = decodeBuild(code);
        if (!b) return;
        this.scene.stop('History');
        this.scene.stop('Result');
        startPractice(this, b);
        this.scene.stop();
      });
    }

    // ---- 每波收入（纵向柱状图） ----
    const rx = px + pw * 0.6,
      ry = py + 84,
      rw = pw * 0.38,
      rh = ph - 150;
    text(this, rx, ry, tx('每波收入（番茄籽）', 'Seeds earned per wave'), 20, '#ffd166');
    const inc = r.income;
    if (!inc.length) return;
    const top = Math.max(1, ...inc);
    const chartY = ry + 40,
      chartH = rh - 70;
    const g = this.add.graphics();
    g.lineStyle(1, 0x5a4a4a, 0.6);
    for (let k = 0; k <= 4; k++) g.lineBetween(rx, chartY + (chartH * k) / 4, rx + rw, chartY + (chartH * k) / 4);
    const bw = Math.min(26, rw / inc.length - 3);
    inc.forEach((v, i) => {
      const h = (chartH * v) / top;
      const x = rx + i * (rw / inc.length) + 1;
      g.fillStyle(0x52b788, 1).fillRoundedRect(x, chartY + chartH - h, bw, Math.max(1, h), { tl: 3, tr: 3, bl: 0, br: 0 });
      if (inc.length <= 20 || i % 5 === 4) text(this, x + bw / 2, chartY + chartH + 6, String(i + 1), 12, COLORS.textDim).setOrigin(0.5, 0);
    });
    text(this, rx, chartY - 4, fmt(top), 12, COLORS.textDim).setOrigin(0, 1);
    // J1：每波 DPS 折线（橙色，右侧刻度），1.4.0 之前的记录没有这项
    const dps = r.dps ?? [];
    if (dps.some((v) => v > 0)) {
      const dTop = Math.max(1, ...dps);
      const pts = dps.map(
        (v, i) => new Phaser.Math.Vector2(rx + i * (rw / inc.length) + 1 + bw / 2, chartY + chartH - (chartH * v) / dTop),
      );
      g.lineStyle(3, 0xff9f1c, 1).strokePoints(pts, false);
      for (const p of pts) g.fillStyle(0xff9f1c, 1).fillCircle(p.x, p.y, 3);
      text(this, rx + rw, chartY - 4, `DPS ${fmt(dTop)}`, 12, '#ff9f1c').setOrigin(1, 1);
      text(this, rx + rw, ry, tx('— 每波 DPS', '— DPS per wave'), 14, '#ff9f1c').setOrigin(1, 0);
    }
    const sum = inc.reduce((a, b) => a + b, 0);
    text(
      this,
      rx,
      chartY + chartH + 30,
      tx(
        `合计 ${fmt(sum)} · 平均每波 ${fmt(sum / inc.length)} · 道具 ${r.items} 件`,
        `Total ${fmt(sum)} · avg ${fmt(sum / inc.length)}/wave · ${r.items} items`,
      ),
      15,
      COLORS.text,
    );
  }
}

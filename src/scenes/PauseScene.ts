// 暂停菜单（覆盖在战斗之上）
import Phaser from 'phaser';
import { text, button, panel, COLORS, autoRelayout, fitImage, statLines, tu, NEG_COLOR } from '../ui/UI';
import { charTraitLines, describeWeaponSets, weaponDmgType, armorText, speedText } from '../data/describe';
import { run, clearRun, restoreFreeSnapshot, type OwnedWeapon } from '../systems/RunState';
import { inPractice, exitPractice } from '../systems/Practice';
import { STAT_ORDER, STAT_INFO } from '../data/stats';
import { WEAPON_MAP, TIER_NAMES } from '../data/weapons';
import { audio } from '../systems/Audio';
import { tx, lang } from '../i18n';
import { toggleFullscreen } from '../systems/Fullscreen';
import { save, persist } from '../systems/Save';
import { regenPerSecond, lifeStealMaxPerSecond, RARITY } from '../data/balance';
import { portraitKey } from '../ui/Portrait';
import { weaponDamage, weaponCooldown, weaponRange } from '../systems/WeaponSystem';
import { affixText, AFFIX_TIER_COLOR } from '../systems/WeaponMods';
import { weaponTags } from '../data/weaponTags';
import { tagName } from '../i18n/apply';
import { superBuffText } from '../systems/SuperBuffs';
import { VW, VH } from '../systems/HiDpi';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  private tip: Phaser.GameObjects.Container | null = null;

  create(): void {
    autoRelayout(this);
    // 战斗界面（HUD）每波会被置顶，暂停界面需盖在它之上
    this.scene.bringToTop();
    this.scene.setVisible(false, 'Hud'); // 暂停时隐藏战斗界面（技能按钮、血条等）
    const W = VW(this),
      H = VH(this);
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.6).setInteractive();
    // 面板：左栏属性、右栏角色 / 武器 / 天赋，底部一排按钮都在面板内
    const PW = Math.min(980, W - 40),
      px = W / 2 - PW / 2,
      top = 30,
      PH = H - 60;
    panel(this, px, top, PW, PH);
    text(this, W / 2, top + 40, tx('暂停', 'Paused'), 40).setOrigin(0.5);
    // 左栏：角色 / 武器 / 天赋；右栏：属性
    const leftW = Math.round(PW * 0.46);
    const bodyTop = top + 84,
      btnH = tu(56),
      btnY = top + PH - 24 - btnH / 2,
      bodyBottom = btnY - btnH / 2 - 16;
    this.drawRight(px + 24, bodyTop, leftW - 36, bodyBottom);
    this.drawStats(px + leftW + 8, bodyTop, PW - leftW - 32, bodyBottom);

    // 按钮：在面板内侧均分宽度，和边框留出间距
    const defs: [string, () => void, number][] = [
      [tx('继续', 'Resume'), () => this.resume(), COLORS.green],
      [
        tx('设置', 'Settings'),
        () => {
          this.scene.launch('Settings', { from: 'pause' });
          this.scene.bringToTop('Settings');
          this.scene.sleep();
        },
        0x4a6fa5,
      ],
      [tx('全屏', 'Fullscreen'), () => toggleFullscreen(this), 0x3a7d44],
    ];
    // J3：练习模式只有「退出练习」，不保存、不清除存档里的进行中对局
    if (inPractice()) defs.push([tx('退出练习', 'Quit practice'), () => exitPractice(this), 0x7a2e35]);
    else
      defs.push(
        [tx('保存退出', 'Save & Quit'), () => this.saveAndQuit(), 0xb07d2b],
        [
          tx('放弃本局', 'Abandon Run'),
          () => {
            clearRun();
            restoreFreeSnapshot();
            audio.stopMusic();
            this.scene.stop('Hud');
            this.scene.stop('Game');
            this.scene.start('Menu');
          },
          0x7a2e35,
        ],
      );
    const gap = 14,
      inner = PW - 48;
    const bw = (inner - gap * (defs.length - 1)) / defs.length;
    defs.forEach(([label, fn, color], i) => button(this, px + 24 + bw / 2 + i * (bw + gap), btnY, bw, btnH, label, fn, color, tu(22)));
    this.input.keyboard?.once('keydown-ESC', () => this.resume());
  }

  /** 右栏：属性两列，「图标 名称 …… 数值」，放不下时等比缩小（原来长说明会和右列叠在一起） */
  private drawStats(x: number, y: number, w: number, bottom: number): void {
    const s = run.stats;
    const cols = 2,
      gapX = 16;
    const colW = (w - gapX) / cols;
    const rows = Math.ceil(STAT_ORDER.length / cols);
    const lineH = Math.min(tu(30), (bottom - y) / rows);
    const fs = Math.max(13, Math.min(tu(16), Math.floor(lineH * 0.62)));
    const iconS = Math.min(20, lineH - 6);
    STAT_ORDER.forEach((k, i) => {
      const cx = x + (i % cols) * (colW + gapX),
        cy = y + Math.floor(i / cols) * lineH + lineH / 2;
      const info = STAT_INFO[k];
      const cap = run.statCap(k);
      const v = Math.min(s[k], cap);
      const extra =
        k === 'regen'
          ? tx(`(${regenPerSecond(v).toFixed(2)}/秒)`, ` (${regenPerSecond(v).toFixed(2)}/s)`)
          : k === 'lifeSteal' && v > 0
            ? tx(`(≤${lifeStealMaxPerSecond(s.maxHp)}/秒)`, ` (≤${lifeStealMaxPerSecond(s.maxHp)}/s)`)
            : k === 'armor' && v > 0
              ? armorText(v)
              : k === 'speed' && v !== 0
                ? speedText(v)
                : '';
      if (this.textures.exists(`stat_${k}`)) fitImage(this.add.image(cx + iconS / 2, cy, `stat_${k}`), iconS);
      const name = text(this, cx + iconS + 6, cy, info.name, fs, info.color).setOrigin(0, 0.5);
      const col = v > 0 ? '#52ff8a' : v < 0 ? NEG_COLOR : '#fff4ea';
      const val = text(
        this,
        cx + colW,
        cy,
        `${Math.round(v * 10) / 10}${info.pct ? '%' : ''}${extra}${s[k] >= cap ? tx('(上限)', ' cap') : ''}`,
        fs,
        col,
      ).setOrigin(1, 0.5);
      const room = colW - iconS - 6 - 8;
      if (name.width + val.width > room) {
        const k2 = Math.max(0.6, room / (name.width + val.width));
        name.setScale(k2);
        val.setScale(k2);
      }
    });
    // 两栏之间的分隔线
    this.add
      .graphics()
      .lineStyle(1, 0x5a4a4a, 1)
      .lineBetween(x - 14, y, x - 14, bottom);
  }

  /** 左栏：角色、武器格子（悬停 / 点击看属性）、本局数据、天赋与特性 */
  private drawRight(x: number, y: number, w: number, bottom: number): void {
    const c = run.char;
    const ps = 64;
    fitImage(this.add.image(x + ps / 2, y + ps / 2, portraitKey(this, 'char', run.charId)), ps);
    text(this, x + ps + 12, y + 8, `${c.name} · ${c.title}`, 19, '#ffd166');
    text(
      this,
      x + ps + 12,
      y + 36,
      tx(
        `${run.chapter.name} · 第 ${run.wave} 波 · 等级 ${run.level} · 击杀 ${run.kills}`,
        `${run.chapter.name} · Wave ${run.wave} · Lv ${run.level} · ${run.kills} kills`,
      ),
      14,
      COLORS.textDim,
      { wordWrap: { width: w - ps - 12, useAdvancedWrap: true } },
    );
    let ty = y + ps + 14;
    text(this, x, ty, tx('武器 · 悬停或点击查看属性', 'Weapons · hover or tap for stats'), 16, '#ffb347');
    ty += 26;
    const ws = tu(56),
      gap = 8;
    const perRow = Math.max(1, Math.floor((w + gap) / (ws + gap)));
    run.weapons.forEach((wpn, i) => {
      const d = WEAPON_MAP[wpn.id];
      const sx = x + (i % perRow) * (ws + gap),
        sy = ty + Math.floor(i / perRow) * (ws + gap);
      const rc = RARITY[wpn.tier];
      panel(this, sx, sy, ws, ws, COLORS.panel, d.evolvedFrom ? COLORS.gold : rc.color);
      fitImage(
        this.add.image(sx + ws / 2, sy + ws / 2, this.textures.exists(`icon_weapon_${d.id}`) ? `icon_weapon_${d.id}` : `weapon_${d.id}`),
        ws - 12,
      );
      text(this, sx + ws - 4, sy + ws - 3, TIER_NAMES[wpn.tier], 12, rc.css).setOrigin(1, 1);
      fitImage(this.add.image(sx + 11, sy + ws - 11, weaponDmgType(d).icon), 16);
      const zone = this.add.zone(sx, sy, ws, ws).setOrigin(0).setInteractive({ useHandCursor: true });
      const show = () => this.showWeaponTip(wpn, sx, sy, ws);
      zone.on('pointerover', show);
      zone.on('pointerout', () => this.hideTip());
      // 触屏没有悬停：点一下显示，再点一下收起
      zone.on('pointerup', () => (this.tip && this.tip.getData('uid') === wpn.uid ? this.hideTip() : show()));
    });
    ty += Math.ceil(run.weapons.length / perRow) * (ws + gap) + 10;
    // 天赋与特性
    const wrap = { wordWrap: { width: w, useAdvancedWrap: true } };
    if (ty < bottom - 40) ty += text(this, x, ty, tx(`天赋 · ${c.talent.name}`, `Talent · ${c.talent.name}`), 17, '#ffd166').height + 4;
    if (ty < bottom - 30) ty += text(this, x, ty, c.talent.desc, 14, '#fff4ea', wrap).height + 8;
    const traits = charTraitLines(c);
    if (traits.length && ty < bottom - 20) {
      text(this, x, ty, tx('属性与特性', 'Stats & traits'), 15, '#ffb347');
      ty += 22;
      const lines = statLines(
        this,
        x,
        ty,
        traits.map((t) => `· ${t}`),
        14,
        COLORS.textDim,
        w,
      );
      if (ty + lines.height > bottom) lines.box.setScale(Math.max(0.7, (bottom - ty) / lines.height));
    }
  }

  /** 武器属性卡：显示在格子旁边，夹在屏幕内 */
  private showWeaponTip(w: OwnedWeapon, sx: number, sy: number, ws: number): void {
    this.hideTip();
    const d = WEAPON_MAP[w.id];
    const s = run.stats;
    const TW = 330;
    const dt = weaponDmgType(d);
    const lines: [string, number, string][] = [
      [`${d.name} ${TIER_NAMES[w.tier]}${w.forge ? ` +${w.forge}` : ''}`, 19, RARITY[w.tier].css],
      [`${tx(`${dt.name}武器`, `${dt.name} weapon`)} · ${weaponTags(d).map(tagName).join(' / ')}`, 13, dt.color],
      [
        tx(
          `伤害 ${Math.round(weaponDamage(d, w.tier, s, w))} · 冷却 ${weaponCooldown(d, w.tier, s, w).toFixed(2)}s · 射程 ${Math.round(weaponRange(d, s, w))}`,
          `DMG ${Math.round(weaponDamage(d, w.tier, s, w))} · CD ${weaponCooldown(d, w.tier, s, w).toFixed(2)}s · Range ${Math.round(weaponRange(d, s, w))}`,
        ),
        15,
        '#fff4ea',
      ],
      ...(w.affixes ?? []).map((a): [string, number, string] => [`◆ ${affixText(a)}`, 14, AFFIX_TIER_COLOR[a.tier - 1]]),
      [d.desc, 13, COLORS.textDim],
    ];
    if (d.superBuff) lines.push([`⚡ ${superBuffText(d.superBuff)[lang === 'en' ? 1 : 0]}`, 12, '#ffd166']);
    for (const sl of describeWeaponSets(d, run.setCounts(), false, tagName)) lines.push([sl, 12, '#9be564']);
    const c = this.add.container(0, 0).setDepth(50);
    const g = this.add.graphics();
    c.add(g);
    let y = 12;
    for (const [str, size, color] of lines) {
      const t = text(this, 14, y, str, size, color, { wordWrap: { width: TW - 28, useAdvancedWrap: true } });
      c.add(t);
      y += t.height + 6;
    }
    const TH = y + 6;
    g.fillStyle(COLORS.panelLight, 0.98)
      .fillRoundedRect(0, 0, TW, TH, 12)
      .lineStyle(3, RARITY[w.tier].color, 1)
      .strokeRoundedRect(0, 0, TW, TH, 12);
    // 放在格子下方（不挡同一排的其他武器，方便挨个悬停对比）；下方放不下就放上方；横向夹在屏幕内
    const W = VW(this),
      H = VH(this);
    const below = sy + ws + 8;
    const ty0 = below + TH <= H - 10 ? below : Math.max(10, sy - TH - 8);
    c.setPosition(Phaser.Math.Clamp(sx, 10, W - TW - 10), ty0);
    c.setData('uid', w.uid);
    this.tip = c;
  }

  private hideTip(): void {
    this.tip?.destroy();
    this.tip = null;
  }

  private resume(): void {
    this.scene.resume('Game');
    this.scene.resume('Hud');
    this.scene.setVisible(true, 'Hud');
    this.scene.stop();
  }

  /** 保存并退出：对局已在本波开始时自动保存，下次从本波开始继续 */
  private saveAndQuit(): void {
    const g = this.scene.get('Game') as unknown as { killCounter: number };
    save.totalKills += g.killCounter ?? 0;
    g.killCounter = 0;
    persist();
    audio.stopMusic();
    this.scene.stop('Hud');
    this.scene.stop('Game');
    this.scene.start('Menu');
  }
}

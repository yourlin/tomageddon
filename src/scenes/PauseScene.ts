import { queueWeaponArt } from '../systems/WeaponArtRegistry';
// 暂停菜单（覆盖在战斗之上）
import Phaser from 'phaser';
import { text, panel, COLORS, autoRelayout, fitImage, statLines, tu, NEG_COLOR, fs } from '../ui/UI';
import { charTraitLines, describeWeaponSets, weaponDmgType, armorText, speedText, archetypeText, SET_ROW_COLOR } from '../data/describe';
import { run, clearRun, restoreFreeSnapshot, type OwnedWeapon } from '../systems/RunState';
import { inPractice, exitPractice } from '../systems/Practice';
import { STAT_ORDER, STAT_INFO } from '../data/stats';
import { WEAPON_MAP, TIER_NAMES } from '../data/weapons';
import { audio } from '../systems/Audio';
import { padConnected } from '../systems/Controls';
import { tx, lang } from '../i18n';
import { toggleFullscreen } from '../systems/Fullscreen';
import { save, persist } from '../systems/Save';
import { regenPerSecond, lifeStealMaxPerSecond, RARITY } from '../data/balance';
import { portraitKey } from '../ui/Portrait';
import { activeSkin } from '../systems/Progress';
import { weaponDamage, weaponCooldown, weaponRange } from '../systems/WeaponSystem';
import { affixText, AFFIX_TIER_COLOR } from '../systems/WeaponMods';
import { weaponTags } from '../data/weaponTags';
import { tagName } from '../i18n/apply';
import { isDoubleFavored } from '../data/affinity';
import { synergyLines } from '../data/synergy';
import { superBuffText } from '../systems/SuperBuffs';
import { VW, VH } from '../systems/HiDpi';
import { MENU, menuButton, menuPanel, menuHeading, menuRule, preloadGameMenu } from '../ui/GameMenuUI';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  private tip: Phaser.GameObjects.Container | null = null;

  private tab: 'loadout' | 'stats' = 'loadout';
  private body?: Phaser.GameObjects.Container;
  private tabs?: Phaser.GameObjects.Container;
  private abandonDialog?: Phaser.GameObjects.Container;

  preload(): void {
    preloadGameMenu(this);
    queueWeaponArt(this, new Set(run.weapons.map((w) => w.id)));
  }

  create(data?: { tab?: 'loadout' | 'stats' }): void {
    this.tab = data?.tab ?? 'loadout';
    const layoutData = { tab: this.tab };
    this.registry.set('pauseLayoutData', layoutData);
    autoRelayout(this, layoutData);
    this.tip = null;
    this.body = undefined;
    this.tabs = undefined;
    this.abandonDialog = undefined;
    this.scene.bringToTop();
    this.scene.setVisible(false, 'Hud');
    const W = VW(this),
      H = VH(this);
    this.add.rectangle(W / 2, H / 2, W, H, 0x140d12, 0.58).setInteractive();
    const PW = Math.min(1080, W - 96),
      px = (W - PW) / 2;
    menuPanel(this, px, 48, PW, H - 96);
    if (padConnected())
      text(
        this,
        W / 2,
        H - 62,
        tx(
          '手柄：左摇杆移动 · A / X / RB 释放技能 · Start 暂停 · 方向键选择 · A 确认 · B 返回',
          'Gamepad: left stick move · A / X / RB skill · Start pause · D-pad select · A confirm · B back',
        ),
        fs(14),
        MENU.dim,
      ).setOrigin(0.5);
    fitImage(this.add.image(px + 86, 126, portraitKey(this, 'char', run.charId, activeSkin(run.charId)?.id)), 108);
    menuHeading(this, px + 160, 82, tx('暂停', 'Paused'), 42);
    text(this, px + 164, 145, tx(`${run.char.name} · 第 ${run.wave} 波`, `${run.char.name} · Wave ${run.wave}`), 20, MENU.cream);
    text(
      this,
      px + 38,
      190,
      tx(`${run.chapter.name} · 等级 ${run.level} · 击杀 ${run.kills}`, `${run.chapter.name} · Lv ${run.level} · ${run.kills} kills`),
      fs(14),
      MENU.dim,
    );
    menuButton(this, px + PW - 42, 88, 44, 42, '', () => toggleFullscreen(this), false, 18, 'fullscreen').setName('pause:fullscreen');
    this.drawBody();
    const fy = H - 115;
    menuRule(this, px + 34, fy - 42, PW - 68);
    menuButton(this, px + PW * 0.18, fy, PW * 0.27, 58, tx('继续游戏', 'Resume'), () => this.resume(), true, tu(24), 'play-fill');
    menuButton(
      this,
      px + PW * 0.41,
      fy,
      PW * 0.15,
      46,
      tx('设置', 'Settings'),
      () => {
        this.hideTip();
        this.scene.launch('Settings', { from: 'pause' });
        this.scene.bringToTop('Settings');
        this.scene.sleep();
      },
      false,
      20,
      'gear-fill',
    );
    if (inPractice()) {
      menuButton(
        this,
        px + PW * 0.73,
        fy,
        PW * 0.25,
        46,
        tx('退出练习', 'Quit practice'),
        () => exitPractice(this),
        false,
        20,
        'box-arrow-right',
      );
    } else {
      menuButton(
        this,
        px + PW * 0.61,
        fy,
        PW * 0.21,
        46,
        tx('保存退出', 'Save & Quit'),
        () => this.saveAndQuit(),
        false,
        20,
        'archive-fill',
      );
      const quit = menuButton(
        this,
        px + PW * 0.86,
        fy,
        PW * 0.19,
        46,
        tx('放弃本局', 'Abandon Run'),
        () => this.confirmAbandon(),
        false,
        19,
        'trash3-fill',
      );
      quit.list.forEach((o) => {
        if (o instanceof Phaser.GameObjects.Text) o.setColor('#f59b86');
      });
      text(this, px + PW * 0.61, fy + 34, tx('保存后从本波开始继续', 'Resume from the start of this wave'), fs(13), MENU.dim).setOrigin(
        0.5,
      );
    }
    const escape = () => {
      if (this.abandonDialog) {
        this.abandonDialog.destroy();
        this.abandonDialog = undefined;
      } else this.resume();
    };
    this.input.keyboard?.on('keydown-ESC', escape);
    this.events.once('shutdown', () => this.input.keyboard?.off('keydown-ESC', escape));
  }

  private drawBody(): void {
    this.hideTip();
    this.body?.destroy();
    this.tabs?.destroy();
    const W = VW(this),
      H = VH(this),
      PW = Math.min(1080, W - 96),
      px = (W - PW) / 2;
    const before = new Set(this.children.list);
    const tw = Math.min(188, PW * 0.18);
    const tx0 = px + PW - tw * 2 - 88;
    (['loadout', 'stats'] as const).forEach((id, i) => {
      menuButton(
        this,
        tx0 + tw * (i + 0.5),
        138,
        tw - 6,
        46,
        id === 'loadout' ? tx('配装', 'Loadout') : tx('属性', 'Attributes'),
        () => {
          this.tab = id;
          (this.registry.get('pauseLayoutData') as { tab: string }).tab = id;
          this.drawBody();
        },
        this.tab === id,
        21,
        id === 'loadout' ? 'lightning-charge-fill' : 'bar-chart-fill',
      ).setName(`pause-tab:${id}`);
    });
    this.tabs = this.add.container(
      0,
      0,
      this.children.list.filter((o) => !before.has(o)),
    );
    const start = new Set(this.children.list);
    if (this.tab === 'loadout') this.drawLoadout(px + 38, 225, PW - 76, H - 180);
    else this.drawStats(px + 42, 225, PW - 84, H - 180);
    this.body = this.add.container(
      0,
      0,
      this.children.list.filter((o) => !start.has(o)),
    );
  }

  private confirmAbandon(): void {
    if (this.abandonDialog) return;
    this.hideTip();
    const W = VW(this),
      H = VH(this),
      c = this.add.container(0, 0).setDepth(1500);
    this.abandonDialog = c;
    const before = new Set(this.children.list);
    const close = () => {
      c.destroy();
      this.abandonDialog = undefined;
    };
    const mask = this.add.rectangle(W / 2, H / 2, W, H, 0x100910, 0.8).setInteractive();
    mask.on('pointerup', close);
    this.add.zone(W / 2, H / 2, 580, 270).setInteractive();
    menuPanel(this, W / 2 - 290, H / 2 - 135, 580, 270);
    menuHeading(this, W / 2, H / 2 - 83, tx('放弃本局？', 'Abandon this run?'), 30).setOrigin(0.5);
    text(
      this,
      W / 2,
      H / 2 - 18,
      tx('将结束当前对局，无法继续本局。', 'This ends your current run. You cannot resume it.'),
      fs(18),
      MENU.dim,
      {
        wordWrap: { width: 510 },
        align: 'center',
      },
    ).setOrigin(0.5);
    menuButton(this, W / 2 - 132, H / 2 + 72, 220, 48, tx('返回游戏', 'Keep playing'), close, false, 20);
    menuButton(
      this,
      W / 2 + 132,
      H / 2 + 72,
      220,
      48,
      tx('放弃本局', 'Abandon Run'),
      () => {
        clearRun();
        restoreFreeSnapshot();
        audio.stopMusic();
        this.scene.stop('Hud');
        this.scene.stop('Game');
        this.scene.start('Menu');
      },
      true,
      20,
    );
    c.add(this.children.list.filter((o) => !before.has(o)));
  }

  /** 右栏：属性两列，「图标 名称 …… 数值」，放不下时等比缩小（原来长说明会和右列叠在一起） */
  private drawStats(x: number, y: number, w: number, bottom: number): void {
    const s = run.stats;
    const cols = 3,
      gapX = 32;
    const colW = (w - gapX) / cols;
    const rows = Math.ceil(STAT_ORDER.length / cols);
    const lineH = Math.min(tu(32), (bottom - y) / rows);
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
      .lineStyle(1, MENU.gold, 0.3)
      .lineBetween(x, y - 10, x + w, y - 10);
  }

  /** 配装采用整行武器槽，角色特性独立展示；所有武器仍可悬停或点按查看详情。 */
  private drawLoadout(x: number, y: number, w: number, bottom: number): void {
    const count = Math.max(run.maxWeapons, run.weapons.length),
      cols = Math.min(6, count),
      gap = 12;
    const rows = Math.ceil(count / cols);
    const ws = Math.min(154, (w - gap * (cols - 1)) / cols, (bottom - y - 102) / rows - gap);
    const slotsW = cols * ws + (cols - 1) * gap;
    const sx0 = x + (w - slotsW) / 2;
    for (let i = 0; i < count; i++) {
      const sx = sx0 + (i % cols) * (ws + gap),
        sy = y + Math.floor(i / cols) * (ws + gap);
      const wpn = run.weapons[i];
      const d = wpn && WEAPON_MAP[wpn.id];
      const rc = wpn && RARITY[wpn.tier];
      panel(this, sx, sy, ws, ws, MENU.panel, d?.evolvedFrom ? COLORS.gold : (rc?.color ?? 0x705347));
      if (!wpn || !d || !rc) {
        text(this, sx + ws / 2, sy + ws / 2, tx('空槽', 'Empty'), fs(16), '#947d6b').setOrigin(0.5);
        continue;
      }
      fitImage(
        this.add.image(sx + ws / 2, sy + ws * 0.39, this.textures.exists(`icon_weapon_${d.id}`) ? `icon_weapon_${d.id}` : `weapon_${d.id}`),
        ws * 0.66,
      );
      const title = text(this, sx + ws / 2, sy + ws - 28, d.name, fs(17), MENU.cream).setOrigin(0.5);
      if (title.width > ws - 12) title.setScale((ws - 12) / title.width);
      text(this, sx + ws - 8, sy + 9, TIER_NAMES[wpn.tier], fs(12), rc.css).setOrigin(1, 0);
      fitImage(this.add.image(sx + 13, sy + 14, weaponDmgType(d).icon), 18);
      const zone = this.add.zone(sx, sy, ws, ws).setOrigin(0).setInteractive({ useHandCursor: true });
      const show = () => this.showWeaponTip(wpn, sx, sy, ws);
      zone.on('pointerover', show);
      zone.on('pointerout', () => this.hideTip());
      zone.on('pointerup', () => (this.tip && this.tip.getData('uid') === wpn.uid ? this.hideTip() : show()));
    }
    const ty = y + rows * (ws + gap) + 6;
    const talent = run.char.talent;
    text(this, x + 10, ty, tx(`天赋 · ${talent.name}`, `Talent · ${talent.name}`), fs(19), '#f4d48f');
    const lines = statLines(this, x + 10, ty + 30, [talent.desc, ...charTraitLines(run.char)], fs(15), MENU.dim, w - 20, 3);
    const room = bottom - ty - 30;
    // Long character descriptions stay readable: scroll the text inside its own
    // clipped region without moving the fixed footer or weapon slots.
    if (lines.height > room) {
      const maskShape = this.make.graphics({ x: 0, y: 0 }, false).fillRect(x, ty + 30, w, room);
      const mask = maskShape.createGeometryMask();
      lines.box.setMask(mask);
      let offset = 0;
      const scroll = (pointer: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
        if (pointer.x < x || pointer.x > x + w || pointer.y < ty + 30 || pointer.y > bottom) return;
        offset = Phaser.Math.Clamp(offset + dy * 0.4, 0, lines.height - room);
        lines.box.y = ty + 30 - offset;
      };
      this.input.on('wheel', scroll);
      const drag = this.add
        .zone(x, ty + 30, w, room)
        .setOrigin(0)
        .setInteractive();
      this.input.setDraggable(drag);
      let lastY = 0;
      drag.on('dragstart', (p: Phaser.Input.Pointer) => {
        lastY = p.y;
      });
      drag.on('drag', (p: Phaser.Input.Pointer) => {
        scroll(p, null, 0, (lastY - p.y) / 0.4);
        lastY = p.y;
      });
      lines.box.once('destroy', () => {
        this.input.off('wheel', scroll);
        mask.destroy();
        maskShape.destroy();
      });
      text(this, x + w, ty, tx('滚动查看特性', 'Scroll for traits'), fs(12), MENU.dim).setOrigin(1, 0);
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
    const at = archetypeText(d, w.tier);
    if (at) lines.push([at, 12, '#8ecae6']);
    if (d.superBuff) lines.push([`⚡ ${superBuffText(d.superBuff)[lang === 'en' ? 1 : 0]}`, 12, '#ffd166']);
    if (isDoubleFavored(run.char.favored, d)) for (const l of synergyLines(d, run.char.favored, tagName)) lines.push([l, 12, '#ffd166']);
    for (const r of describeWeaponSets(
      d,
      run.setCounts(),
      false,
      run.weapons.map((x) => x.id),
    ))
      lines.push([r.text, 12, SET_ROW_COLOR[r.kind]]);
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
    const W = VW(this),
      H = VH(this);
    // Detail cards live beside the weapon, above the fixed action bar. Very
    // long affix/set descriptions scroll instead of covering Resume/Save.
    const visibleH = Math.min(TH, H - 290);
    const tx0 = Phaser.Math.Clamp(sx + ws + 12 + TW < W - 40 ? sx + ws + 12 : sx - TW - 12, 24, W - TW - 24);
    const ty0 = Phaser.Math.Clamp(sy, 110, H - 180 - visibleH);
    g.fillStyle(COLORS.panelLight, 0.98)
      .fillRoundedRect(0, 0, TW, visibleH, 12)
      .lineStyle(2, RARITY[w.tier].color, 1)
      .strokeRoundedRect(0, 0, TW, visibleH, 12);
    c.setPosition(tx0, ty0);
    if (TH > visibleH) {
      const content = this.add.container(0, 0, c.list.slice(1));
      c.add(content);
      const shape = this.make.graphics({}, false).fillRect(tx0 + 4, ty0 + 4, TW - 8, visibleH - 26);
      const mask = shape.createGeometryMask();
      content.setMask(mask);
      let offset = 0;
      const scroll = (p: Phaser.Input.Pointer, _over: unknown, _dx: number, dy: number) => {
        if (p.x < tx0 || p.x > tx0 + TW || p.y < ty0 || p.y > ty0 + visibleH) return;
        offset = Phaser.Math.Clamp(offset + dy * 0.4, 0, TH - visibleH + 26);
        content.y = -offset;
      };
      this.input.on('wheel', scroll);
      const drag = this.add.zone(TW / 2, visibleH / 2, TW, visibleH).setInteractive();
      c.add(drag);
      this.input.setDraggable(drag);
      let lastY = 0;
      drag.on('dragstart', (p: Phaser.Input.Pointer) => {
        lastY = p.y;
      });
      drag.on('drag', (p: Phaser.Input.Pointer) => {
        scroll(p, null, 0, (lastY - p.y) / 0.4);
        lastY = p.y;
      });
      c.add(text(this, TW / 2, visibleH - 14, tx('滚动查看详情', 'Scroll for details'), fs(12), MENU.dim).setOrigin(0.5));
      c.once('destroy', () => {
        this.input.off('wheel', scroll);
        mask.destroy();
        shape.destroy();
      });
    }
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

// J4：自定义挑战——自选角色（临时借用，不需要解锁）、章节、模式与任意修饰规则组合。不计成就、不计连续天数。
import Phaser from 'phaser';
import { text, button, panel, COLORS, fitImage, autoRelayout, toast } from '../ui/UI';
import { portraitKey } from '../ui/Portrait';
import { CHARACTERS } from '../data/characters';
import { CHAPTERS, BASE_CHAPTERS } from '../data/chapters';
import { MODIFIERS, makeFreeChallenge, challengeCode, type FreeOpts } from '../data/challenges';
import { run, clearRun } from '../systems/RunState';
import { tx, lang } from '../i18n';

const pick = (t: [string, string]): string => (lang === 'en' ? t[1] : t[0]);

export class CustomChallengeScene extends Phaser.Scene {
  private o: FreeOpts = { charId: CHARACTERS[0].id, chapterId: 1, endless: false, modifiers: [] };
  private layer!: Phaser.GameObjects.Container;

  constructor() {
    super('CustomChallenge');
  }

  create(): void {
    autoRelayout(this);
    const W = this.scale.width;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    text(this, 24, 18, tx('🛠️ 自定义挑战', '🛠️ Custom Challenge'), 36);
    text(
      this,
      24,
      66,
      tx(
        '自由组合角色、章节与规则。角色临时借用；本模式不计成就与连续天数，战绩里会单独标记。',
        'Mix any character, chapter and rules. Characters are lent; no achievements or streaks, and runs are marked in History.',
      ),
      16,
      COLORS.textDim,
      { wordWrap: { width: W - 220, useAdvancedWrap: true } },
    );
    button(this, W - 90, 44, 140, 52, tx('返回', 'Back'), () => this.scene.start('Challenge'), 0x555555, 22);
    this.layer = this.add.container(0, 0);
    this.draw();
  }

  private draw(): void {
    this.layer.removeAll(true);
    const L = this.layer;
    const W = this.scale.width,
      H = this.scale.height;
    const o = this.o;
    // 角色
    const ci = CHARACTERS.findIndex((c) => c.id === o.charId);
    const c = CHARACTERS[ci];
    L.add(panel(this, 24, 110, 420, 150));
    L.add(fitImage(this.add.image(100, 185, portraitKey(this, 'char', c.id)), 110));
    L.add(text(this, 170, 140, c.name, 24, '#fff4ea', { fontStyle: 'bold' }));
    L.add(text(this, 170, 172, `${ci + 1} / ${CHARACTERS.length}`, 15, COLORS.textDim));
    const step = (d: number) => () => {
      o.charId = CHARACTERS[(ci + d + CHARACTERS.length) % CHARACTERS.length].id;
      this.draw();
    };
    L.add(button(this, 210, 230, 70, 40, '◀', step(-1), 0x3a2a2c, 20));
    L.add(button(this, 290, 230, 70, 40, '▶', step(1), 0x3a2a2c, 20));
    L.add(
      button(
        this,
        380,
        230,
        80,
        40,
        tx('随机', 'Random'),
        () => ((o.charId = Phaser.Utils.Array.GetRandom(CHARACTERS).id), this.draw()),
        0x3a2a2c,
        16,
      ),
    );
    // 章节与模式
    L.add(text(this, 470, 116, tx('章节', 'Chapter'), 18, '#ffd166'));
    for (let i = 1; i <= BASE_CHAPTERS; i++)
      L.add(
        button(
          this,
          470 + 70 + (i - 1) * 96,
          160,
          90,
          44,
          CHAPTERS[i - 1].name.slice(0, 5),
          () => ((o.chapterId = i), this.draw()),
          o.chapterId === i ? 0xe09f3e : 0x3a2a2c,
          15,
        ),
      );
    L.add(text(this, 470, 196, tx('模式', 'Mode'), 18, '#ffd166'));
    L.add(
      button(
        this,
        540,
        240,
        130,
        44,
        tx('15 波', '15 waves'),
        () => ((o.endless = false), this.draw()),
        !o.endless ? 0xe09f3e : 0x3a2a2c,
        16,
      ),
    );
    L.add(
      button(this, 680, 240, 130, 44, tx('无尽', 'Endless'), () => ((o.endless = true), this.draw()), o.endless ? 0xe09f3e : 0x3a2a2c, 16),
    );
    // 修饰规则（多选）
    L.add(text(this, 24, 280, tx(`修饰规则（已选 ${o.modifiers.length}）`, `Rules (${o.modifiers.length} selected)`), 18, '#ffd166'));
    const cols = 3,
      cw = (W - 48 - (cols - 1) * 10) / cols,
      ch = 58;
    MODIFIERS.forEach((m, i) => {
      const x = 24 + (i % cols) * (cw + 10),
        y = 310 + Math.floor(i / cols) * (ch + 8);
      const on = o.modifiers.includes(m.id);
      // 互斥组：同组只能选一个
      const blocked = !on && !!m.group && o.modifiers.some((id) => MODIFIERS.find((x) => x.id === id)?.group === m.group);
      L.add(panel(this, x, y, cw, ch, on ? 0x5a3d10 : COLORS.panel, on ? COLORS.gold : COLORS.border));
      L.add(text(this, x + 12, y + ch / 2, m.icon, 24).setOrigin(0, 0.5));
      L.add(text(this, x + 50, y + 8, pick(m.name), 16, blocked ? '#777777' : '#fff4ea', { fontStyle: 'bold' }));
      L.add(text(this, x + 50, y + 30, pick(m.desc), 12, COLORS.textDim, { wordWrap: { width: cw - 60, useAdvancedWrap: true } }));
      const hit = this.add.zone(x, y, cw, ch).setOrigin(0).setInteractive({ useHandCursor: true });
      hit.on('pointerup', () => {
        if (blocked) return toast(this, tx('同类规则只能选一个', 'Only one rule from this group'), '#ff6b6b');
        o.modifiers = on ? o.modifiers.filter((id) => id !== m.id) : [...o.modifiers, m.id];
        this.draw();
      });
      L.add(hit);
    });
    const def = makeFreeChallenge(o);
    const code = challengeCode(def);
    const ct = text(this, 24, H - 40, tx(`分享码 ${code} 📋`, `Share code ${code} 📋`), 14, '#9bf6ff')
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    ct.on('pointerup', () => void navigator.clipboard?.writeText(code).then(() => ct.setText(tx('已复制 ✓', 'Copied ✓'))));
    L.add(ct);
    L.add(
      button(
        this,
        W - 140,
        H - 44,
        240,
        60,
        tx('开始挑战', 'Start'),
        () => {
          clearRun();
          run.startChallenge(makeFreeChallenge(o));
          this.scene.start('Game');
        },
        0xc1121f,
        24,
      ),
    );
  }
}

// 战绩页：最近 30 局的记录与汇总；点击一局查看局后数据
import Phaser from 'phaser';
import { text, button, panel, COLORS, fitImage, autoRelayout, hitArea } from '../ui/UI';
import { portraitKey } from '../ui/Portrait';
import { CHARACTER_MAP } from '../data/characters';
import { CHAPTERS } from '../data/chapters';
import { save } from '../systems/Save';
import { counter } from '../systems/Counters';
import { sourceLabel } from './RunStatsScene';
import { tx } from '../i18n';

const PER_PAGE = 8;

export class HistoryScene extends Phaser.Scene {
  private page = 0;
  private layer!: Phaser.GameObjects.Container;

  constructor() {
    super('History');
  }

  create(): void {
    autoRelayout(this);
    const W = this.scale.width;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    text(this, 24, 18, tx('战绩', 'History'), 36);
    button(this, W - 90, 44, 140, 52, tx('返回', 'Back'), () => this.scene.start('Menu'), 0x555555, 22);
    // 汇总
    const h = save.history;
    const fav = Object.entries(save.charRuns).sort((a, b) => b[1] - a[1])[0];
    const tiles: [string, string][] = [
      [tx('通关次数', 'Clears'), String(save.wins)],
      [tx('累计击杀', 'Total kills'), save.totalKills.toLocaleString()],
      [
        tx('无尽最佳', 'Endless best'),
        counter('endlessBest') ? tx(`第 ${counter('endlessBest')} 波`, `wave ${counter('endlessBest')}`) : '—',
      ],
      [tx('最常用角色', 'Most played'), fav ? `${CHARACTER_MAP[fav[0]]?.name ?? fav[0]} ×${fav[1]}` : '—'],
      [tx('单次最高伤害', 'Biggest hit'), counter('maxHit').toLocaleString()],
    ];
    const tw = (W - 48 - 12 * (tiles.length - 1)) / tiles.length;
    tiles.forEach(([k, v], i) => {
      const x = 24 + i * (tw + 12);
      panel(this, x, 84, tw, 70);
      text(this, x + 14, 92, k, 14, COLORS.textDim);
      text(this, x + 14, 114, v, 22, '#ffd166', { fontStyle: 'bold' });
    });
    this.layer = this.add.container(0, 0);
    if (!h.length)
      text(this, W / 2, 360, tx('还没有对局记录，去打一局吧！', 'No runs yet — go play one!'), 22, COLORS.textDim).setOrigin(0.5);
    else this.draw();
  }

  private draw(): void {
    this.layer.removeAll(true);
    const W = this.scale.width,
      H = this.scale.height;
    const list = save.history;
    const pages = Math.ceil(list.length / PER_PAGE);
    const rowH = 58,
      y0 = 170;
    list.slice(this.page * PER_PAGE, (this.page + 1) * PER_PAGE).forEach((r, i) => {
      const y = y0 + i * (rowH + 6);
      const c = CHARACTER_MAP[r.charId];
      const L = this.layer;
      L.add(panel(this, 24, y, W - 48, rowH, COLORS.panel, r.win ? COLORS.gold : r.endless || r.challenge ? 0x9d4edd : COLORS.border));
      if (c) L.add(fitImage(this.add.image(54, y + rowH / 2, portraitKey(this, 'char', c.id)), 46));
      const d = new Date(r.t);
      const when = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const mode = r.challenge
        ? r.challenge.kind === 'daily'
          ? tx(`每日挑战 · ${r.challenge.score} 分`, `Daily · ${r.challenge.score} pts`)
          : tx(`每周挑战 · ${r.challenge.score} 分`, `Weekly · ${r.challenge.score} pts`)
        : r.endless
          ? tx('无尽', 'Endless')
          : r.win
            ? tx('✓ 通关', '✓ Cleared')
            : tx('✗ 阵亡', '✗ Defeated');
      L.add(
        text(this, 88, y + 8, `${c?.name ?? r.charId} · ${CHAPTERS[r.chapterId - 1]?.name ?? ''}`, 18, '#fff4ea', { fontStyle: 'bold' }),
      );
      L.add(text(this, 88, y + 33, when, 13, COLORS.textDim));
      L.add(
        text(this, 420, y + rowH / 2, mode, 17, r.win ? '#ffd166' : r.challenge || r.endless ? '#e0aaff' : '#ff8f8f').setOrigin(0, 0.5),
      );
      L.add(
        text(
          this,
          620,
          y + rowH / 2,
          tx(
            `第 ${r.wave} 波 · Lv.${r.level} · 击杀 ${r.kills} · ${Math.floor(r.sec / 60)} 分钟`,
            `Wave ${r.wave} · Lv.${r.level} · ${r.kills} kills · ${Math.floor(r.sec / 60)} min`,
          ),
          15,
          COLORS.text,
        ).setOrigin(0, 0.5),
      );
      const top = r.dmg[0];
      if (top)
        L.add(text(this, W - 60, y + rowH / 2, `${tx('主力', 'Top')}：${sourceLabel(top[0]).name}`, 14, COLORS.textDim).setOrigin(1, 0.5));
      L.add(hitArea(this, 24, y, W - 48, rowH, () => this.scene.launch('RunStats', { record: r })));
    });
    if (pages > 1) {
      const py = H - 34;
      if (this.page > 0)
        this.layer.add(
          button(
            this,
            W / 2 - 130,
            py,
            140,
            46,
            tx('上一页', 'Prev'),
            () => {
              this.page--;
              this.draw();
            },
            0x7a2e35,
            20,
          ),
        );
      this.layer.add(text(this, W / 2, py, `${this.page + 1} / ${pages}`, 20).setOrigin(0.5));
      if (this.page < pages - 1)
        this.layer.add(
          button(
            this,
            W / 2 + 130,
            py,
            140,
            46,
            tx('下一页', 'Next'),
            () => {
              this.page++;
              this.draw();
            },
            0x7a2e35,
            20,
          ),
        );
    }
  }
}

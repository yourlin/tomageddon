// 战绩页：最近 30 局的记录与汇总；点击一局查看局后数据
import Phaser from 'phaser';
import { challengeKindName } from '../data/challenges';
import { text, button, panel, COLORS, fitImage, autoRelayout, hitArea } from '../ui/UI';
import { portraitKey } from '../ui/Portrait';
import { CHARACTER_MAP } from '../data/characters';
import { CHAPTERS } from '../data/chapters';
import { save } from '../systems/Save';
import { counter } from '../systems/Counters';
import { sourceLabel } from './RunStatsScene';
import { tx } from '../i18n';
import type { RunRecord } from '../systems/Save';

const PER_PAGE = 7;

// J5：战绩筛选与排序
export type HistFilter = 'all' | 'win' | 'lose' | 'endless' | 'challenge';
export type HistSort = 'time' | 'wave' | 'kills' | 'sec';
export const FILTERS: [HistFilter, string, string][] = [
  ['all', '全部', 'All'],
  ['win', '通关', 'Cleared'],
  ['lose', '阵亡', 'Defeated'],
  ['endless', '无尽', 'Endless'],
  ['challenge', '挑战', 'Challenge'],
];
export const SORTS: [HistSort, string, string][] = [
  ['time', '最近', 'Recent'],
  ['wave', '波次', 'Wave'],
  ['kills', '击杀', 'Kills'],
  ['sec', '时长', 'Time'],
];
export function filterHistory(list: RunRecord[], f: HistFilter, sort: HistSort): RunRecord[] {
  const ok = (r: RunRecord): boolean =>
    f === 'all'
      ? true
      : f === 'win'
        ? r.win && !r.endless && !r.challenge
        : f === 'lose'
          ? !r.win && !r.endless && !r.challenge
          : f === 'endless'
            ? !!r.endless
            : !!r.challenge;
  const key = (r: RunRecord): number => (sort === 'time' ? r.t : sort === 'wave' ? r.wave : sort === 'kills' ? r.kills : r.sec);
  return list.filter(ok).sort((a, b) => key(b) - key(a));
}

/** D8：个人最佳——无尽最高波数（角色 × 章节）与各危机等级最快通关（章节 × 等级） */
export function personalBests(): { endless: [string, number][]; fastest: [string, number][] } {
  const endless = Object.entries(save.meta.endlessBest)
    .filter(([, w]) => w > 0)
    .sort((a, b) => b[1] - a[1]);
  const fastest = Object.entries(save.meta.fastest).sort((a, b) => {
    const [ca, la] = a[0].split('_').map(Number);
    const [cb, lb] = b[0].split('_').map(Number);
    return ca - cb || lb - la;
  });
  return { endless, fastest };
}
const mmss = (sec: number): string => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export class HistoryScene extends Phaser.Scene {
  private page = 0;
  private layer!: Phaser.GameObjects.Container;
  private filter: HistFilter = 'all';
  private sort: HistSort = 'time';
  private best = false;

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
    this.page = 0;
    this.best = false;
    if (!h.length && !Object.keys(save.meta.endlessBest).length && !Object.keys(save.meta.fastest).length)
      text(this, W / 2, 360, tx('还没有对局记录，去打一局吧！', 'No runs yet — go play one!'), 22, COLORS.textDim).setOrigin(0.5);
    else this.draw();
  }

  /** 筛选 / 排序 / 个人最佳 切换按钮 */
  private drawBar(): void {
    const W = this.scale.width;
    const y = 180;
    const chip = (x: number, w: number, label: string, on: boolean, cb: () => void): void => {
      const b = button(this, x + w / 2, y, w, 34, label, cb, on ? 0xe09f3e : 0x3a2a2c, 15);
      this.layer.add(b);
    };
    let x = 24;
    if (!this.best) {
      for (const [id, zh, en] of FILTERS) {
        chip(x, 74, tx(zh, en), this.filter === id, () => {
          this.filter = id;
          this.page = 0;
          this.draw();
        });
        x += 80;
      }
      x += 16;
      for (const [id, zh, en] of SORTS) {
        chip(x, 74, tx(`↓${zh}`, `↓${en}`), this.sort === id, () => {
          this.sort = id;
          this.page = 0;
          this.draw();
        });
        x += 80;
      }
    }
    chip(W - 24 - 150, 150, this.best ? tx('← 对局记录', '← Run list') : tx('🏆 个人最佳', '🏆 Personal bests'), this.best, () => {
      this.best = !this.best;
      this.page = 0;
      this.draw();
    });
  }

  private drawBests(): void {
    const W = this.scale.width;
    const { endless, fastest } = personalBests();
    const L = this.layer;
    const col = (x: number, title: string, rows: string[]): void => {
      L.add(text(this, x, 216, title, 20, '#ffd166', { fontStyle: 'bold' }));
      if (!rows.length) L.add(text(this, x, 250, tx('暂无记录', 'No records yet'), 16, COLORS.textDim));
      rows.slice(0, 16).forEach((r, i) => L.add(text(this, x, 250 + i * 28, r, 16, COLORS.text)));
    };
    const chName = (id: string): string => CHAPTERS[Number(id) - 1]?.name ?? id;
    col(
      40,
      tx('无尽最高波数', 'Endless best wave'),
      endless.map(([k, w], i) => {
        const cut = k.lastIndexOf('_');
        return `${i + 1}. ${CHARACTER_MAP[k.slice(0, cut)]?.name ?? k.slice(0, cut)} · ${chName(k.slice(cut + 1))} — ${tx(`第 ${w} 波`, `wave ${w}`)}`;
      }),
    );
    col(
      W / 2 + 20,
      tx('危机等级最快通关', 'Fastest Danger clears'),
      fastest.map(([k, sec]) => {
        const [ch, lv] = k.split('_');
        return `${chName(ch)} · ${tx(`危机 ${lv}`, `Danger ${lv}`)} — ${mmss(sec)}`;
      }),
    );
  }

  private draw(): void {
    this.layer.removeAll(true);
    this.drawBar();
    if (this.best) return this.drawBests();
    const W = this.scale.width,
      H = this.scale.height;
    const list = filterHistory(save.history, this.filter, this.sort);
    const pages = Math.ceil(list.length / PER_PAGE);
    const rowH = 58,
      y0 = 210;
    if (!list.length)
      this.layer.add(text(this, W / 2, 360, tx('没有符合条件的对局', 'No matching runs'), 20, COLORS.textDim).setOrigin(0.5));
    list.slice(this.page * PER_PAGE, (this.page + 1) * PER_PAGE).forEach((r, i) => {
      const y = y0 + i * (rowH + 6);
      const c = CHARACTER_MAP[r.charId];
      const L = this.layer;
      L.add(panel(this, 24, y, W - 48, rowH, COLORS.panel, r.win ? COLORS.gold : r.endless || r.challenge ? 0x9d4edd : COLORS.border));
      if (c) L.add(fitImage(this.add.image(54, y + rowH / 2, portraitKey(this, 'char', c.id)), 46));
      const d = new Date(r.t);
      const when = `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      const mode = r.challenge
        ? tx(
            `${challengeKindName(r.challenge.kind)[0]}挑战 · ${r.challenge.score} 分`,
            `${challengeKindName(r.challenge.kind)[1]} · ${r.challenge.score} pts`,
          )
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

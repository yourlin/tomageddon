import { journalNav } from '../ui/JournalNav';
import { catalogButton as button } from '../ui/CatalogUI';
import { preloadWorkbench, workbenchBackground, workbenchPanel as panel } from '../ui/WorkbenchUI';
import { promptText } from '../ui/DomInput';
import { filterCodexEntries } from '../systems/CodexBrowser';
import { loadArt, releaseArt, unloadUnusedArt } from '../systems/ArtRegistry';
import type { EntityVisual, VisualIdent } from '../objects/EntityVisual';
import { createEntityVisual } from '../objects/visualFactory';
import { requestWeaponArt } from '../systems/WeaponArtRegistry';
// 图鉴：角色 / 武器 / 道具 / 怪物 / 精英 / Boss
import { EVOLVED_WEAPONS, EVOLUTION_OF } from '../data/evolutions';
import Phaser from 'phaser';
import { text, COLORS, fitImage, hitArea, autoRelayout, statLines, TOUCH, tu } from '../ui/UI';
import { CHARACTERS } from '../data/characters';
import { WEAPONS, WEAPON_MAP, TIER_NAMES, type WeaponDef } from '../data/weapons';
import { RECIPES, RECIPE_BY_TO, slotLabel, type Recipe } from '../data/recipes';
import { affinityText } from '../data/affinity';
import { ALL_ITEMS, ITEM_MAP, baseItemCap } from '../data/items';
import { charTraitLines, describeItem, weaponDmgType } from '../data/describe';
import { itemIconKey } from '../art/ItemArt';
import { portraitKey } from '../ui/Portrait';
import { AFFIXES } from '../data/bosses';
import { ENEMIES } from '../data/enemies';
import { BOSSES } from '../data/bosses';
import { STATUSES } from '../data/statuses';
import { RARITY } from '../data/balance';
import { isUnlocked, isSeen } from '../systems/Save';
import { unlockHint } from '../systems/Achievements';
import { tx, lang } from '../i18n';
import { save } from '../systems/Save';
import { RELICS, RELIC_MAP, RELIC_KIND_INFO, RELIC_SET_MAP, describeRelic, describeRelicSet } from '../data/relics';
import { FONT } from '../systems/Textures';
import { ITEM_COMBOS, describeCombo } from '../data/gearExtra';
import { weaponTags, TAGS } from '../data/weaponTags';
import { tagName } from '../i18n/apply';
import { VW, VH } from '../systems/HiDpi';

const JOURNAL_FONT = '"Journal Serif","Noto Serif SC","Songti SC","SimSun",serif';

const PATTERN_NAME: Record<string, string> = {
  ring: tx('环形弹', 'Ring'),
  spiral: tx('螺旋弹幕', 'Spiral'),
  aimed: tx('扇形射击', 'Aimed Fan'),
  charge: tx('冲锋', 'Charge'),
  summon: tx('召唤', 'Summon'),
  slam: tx('砸地', 'Slam'),
  hazard: tx('危险区', 'Hazard'),
  laser: tx('激光', 'Laser'),
  teleport: tx('瞬移', 'Teleport'),
  buff: tx('强化', 'Empower'),
  scatter: tx('乱射', 'Scatter'),
};

/** 配方是不是「把自己升到 T4」（两把材料都是它自己） */
const selfUp = (r: Recipe): boolean => r.from.every(([id]) => id === r.to);

/** 武器的合成说明：怎么做出它（T4 / 超武），或者它能合成出什么 */
function recipeLine(w: WeaponDef): string {
  const made = RECIPE_BY_TO[w.id];
  const mats = (r: Recipe) =>
    r.from.map(([id, t]) => `${WEAPON_MAP[id]?.name ?? id} ${TIER_NAMES[t]}`).join(' + ') +
    ' + ' +
    r.items.map(slotLabel).join(tx('、', ', '));
  if (made && !selfUp(made)) return tx(`✨ 合成：${mats(made)}`, `✨ Recipe: ${mats(made)}`);
  const into = RECIPES.filter((r) => !selfUp(r) && r.from.some(([id]) => id === w.id)).map((r) => WEAPON_MAP[r.to]?.name ?? r.to);
  if (into.length) return tx(`✨ 可合成：${into.join('、')}`, `✨ Crafts into: ${into.join(', ')}`);
  return made
    ? tx(`升到 ${TIER_NAMES[3]}：${mats(made)}`, `Upgrade to ${TIER_NAMES[3]}: ${mats(made)}`)
    : tx(`基础价格 ${w.price}`, `Base price ${w.price}`);
}

/** 武器按合成链排序：每把基础武器后面紧跟由它合成出来的 T4 武器与超武 */
function weaponsByRecipeChain(): WeaponDef[] {
  const out: WeaponDef[] = [];
  const done = new Set<string>();
  const push = (w: WeaponDef | undefined) => {
    if (w && !done.has(w.id)) {
      done.add(w.id);
      out.push(w);
    }
  };
  for (const w of WEAPONS) {
    if (w.minTier) continue; // 只能合成的 T4 武器跟在它的材料后面
    push(w);
    // 由它参与合成的产物（其他 T4 / 超武）
    for (const r of RECIPES) if (!selfUp(r) && r.from.some(([id]) => id === w.id)) push(WEAPON_MAP[r.to]);
  }
  for (const w of [...WEAPONS, ...EVOLVED_WEAPONS]) push(w); // 兜底：没进链的也要能查到
  return out;
}

type Tab = 'char' | 'weapon' | 'item' | 'relic' | 'enemy' | 'elite' | 'boss';
interface Entry {
  key: string;
  name: string;
  color: string;
  lines: string[];
  /** 武器条目：用来画合成树 */
  weaponId?: string;
  visual?: VisualIdent;
}

export class CodexScene extends Phaser.Scene {
  private tab: Tab = 'char';
  private layer!: Phaser.GameObjects.Container;
  private detail!: Phaser.GameObjects.Container;
  private page = 0; // first visible row, not a limit on the catalog
  private query = '';
  private selectedTags: string[] = [];
  private selectedKey = '';
  private tier = 0;
  private popup: Phaser.GameObjects.Container | null = null;
  private listRect = new Phaser.Geom.Rectangle();
  private detailRect = new Phaser.Geom.Rectangle();
  private detailBody: Phaser.GameObjects.Container | null = null;
  private detailMask: Phaser.Display.Masks.GeometryMask | null = null;
  private detailShape: Phaser.GameObjects.Graphics | null = null;
  private detailOffset = 0;
  private detailMax = 0;
  private detailNavUp: ReturnType<typeof journalNav> | null = null;
  private detailNavDown: ReturnType<typeof journalNav> | null = null;
  private dragY = 0;
  private dragArea: 'list' | 'detail' | null = null;
  private dragged = false;
  private artRequests = new Set<string>();
  private detailVisual: EntityVisual | null = null;

  constructor() {
    super('Codex');
  }

  preload(): void {
    preloadWorkbench(this);
    if (!this.textures.exists('codex:journal')) this.load.image('codex:journal', `${import.meta.env.BASE_URL}assets/ui/codex-journal.webp`);
  }
  create(): void {
    autoRelayout(this);
    this.artRequests.clear();
    void document.fonts.load('600 30px "Journal Serif"').then(() => {
      if (this.scene.isActive()) this.draw();
    });
    this.layer = this.add.container(0, 0);
    this.detail = this.add.container(0, 0);
    const wheel = (pointer: Phaser.Input.Pointer, _objects: unknown, _dx: number, dy: number) => {
      if (this.popup) return;
      if (this.listRect.contains(pointer.x, pointer.y)) {
        this.page += dy > 0 ? 1 : -1;
        this.draw();
      } else if (this.detailRect.contains(pointer.x, pointer.y)) this.scrollDetail(dy);
    };
    const down = (pointer: Phaser.Input.Pointer) => {
      this.dragged = false;
      this.dragY = pointer.y;
      this.dragArea = this.popup
        ? null
        : this.listRect.contains(pointer.x, pointer.y)
          ? 'list'
          : this.detailRect.contains(pointer.x, pointer.y)
            ? 'detail'
            : null;
    };
    const move = (pointer: Phaser.Input.Pointer) => {
      if (!pointer.isDown || !this.dragArea) return;
      const delta = this.dragY - pointer.y;
      if (Math.abs(delta) > 12) this.dragged = true;
      if (Math.abs(delta) < (TOUCH ? 64 : 22)) return;
      this.dragY = pointer.y;
      if (this.dragArea === 'list') {
        this.page += delta > 0 ? 1 : -1;
        this.draw();
      } else this.scrollDetail(delta);
    };
    const up = () => {
      this.dragArea = null;
    };
    this.input.on('wheel', wheel);
    this.input.on('pointerdown', down);
    this.input.on('pointermove', move);
    this.input.on('pointerup', up);
    this.events.once('shutdown', () => {
      this.input.off('wheel', wheel);
      this.input.off('pointerdown', down);
      this.input.off('pointermove', move);
      this.input.off('pointerup', up);
      this.clearDetail();
      for (const key of this.artRequests) releaseArt(`codex:${key}`);
      this.artRequests.clear();
      this.game.events.once('poststep', () => unloadUnusedArt(this.textures));
      this.popup?.destroy();
      this.popup = null;
    });
    this.draw();
  }
  update(_time: number, delta: number): void {
    this.detailVisual?.tick(delta / 1000, 0, 1);
  }

  private clearDetail(): void {
    this.detailVisual = null;
    this.detailBody?.clearMask();
    this.detailMask?.destroy();
    this.detailShape?.destroy();
    this.detailMask = null;
    this.detailShape = null;
    this.detailBody = null;
    this.detailNavUp = null;
    this.detailNavDown = null;
    this.detail?.removeAll(true);
  }
  private scrollDetail(delta: number): void {
    this.detailOffset = Phaser.Math.Clamp(this.detailOffset + delta, 0, this.detailMax);
    this.detailBody?.setY(-this.detailOffset);
    this.detailNavUp?.setEnabled(this.detailOffset > 0);
    this.detailNavDown?.setEnabled(this.detailOffset < this.detailMax);
  }
  private resetResults(): void {
    this.page = 0;
    this.selectedKey = '';
    this.tier = 0;
    this.detailOffset = 0;
    this.draw();
  }
  private async search(): Promise<void> {
    const answer = await promptText(
      tx('搜索武器名称', 'Search weapon names'),
      tx('输入名称，例如：番茄', 'Enter a name, e.g. fork'),
      this.query,
      true,
    );
    if (answer !== null && this.scene.isActive()) {
      this.query = answer;
      this.resetResults();
    }
  }
  private tags(): void {
    this.popup?.destroy();
    const W = VW(this),
      H = VH(this),
      p = this.add.container(0, 0).setDepth(100);
    this.popup = p;
    const draft = new Set(this.selectedTags);
    let group = 'theme';
    const ph = TOUCH ? 660 : 620;
    const w = Math.min(1040, W - 40),
      x = (W - w) / 2,
      y = Math.max(12, (H - ph) / 2);
    const paint = () => {
      p.removeAll(true);
      p.add(this.add.rectangle(W / 2, H / 2, W, H, 0x100910, 0.88).setInteractive());
      p.add(panel(this, x, y, w, ph));
      p.add(
        text(this, x + 26, y + 20, tx('武器标签 · 同时匹配所选标签', 'Weapon tags · match all selected'), TOUCH ? 26 : tu(23), '#fff0ce'),
      );
      const columns = 6,
        gap = 10,
        bw = (w - 52 - gap * (columns - 1)) / columns;
      let ty = y + 72;
      const groups = [
        ['theme', tx('主题', 'Theme')],
        ['element', tx('元素', 'Element')],
        ['mechanic', tx('机制', 'Mechanics')],
        ['type', tx('类型', 'Type')],
      ] as const;
      if (TOUCH)
        groups.forEach(([kind, name], i) =>
          p.add(
            button(
              this,
              x + 28 + ((i + 0.5) * (w - 56)) / 4,
              y + 114,
              (w - 72) / 4,
              60,
              name,
              () => {
                group = kind;
                paint();
              },
              group === kind ? COLORS.primary : COLORS.gray,
              26,
            ),
          ),
        );
      if (TOUCH) ty = y + 210;
      for (const [kind, name] of groups) {
        if (TOUCH && kind !== group) continue;
        p.add(text(this, x + 26, ty, name, TOUCH ? 26 : tu(16), '#d8b87e'));
        ty += 29;
        const tags = TAGS.filter((t) => t.kind === kind);
        tags.forEach((tag, i) =>
          p.add(
            button(
              this,
              x + 26 + bw / 2 + (i % columns) * (bw + gap),
              ty + (TOUCH ? 44 : 22) + Math.floor(i / columns) * (TOUCH ? 96 : 50),
              bw,
              42,
              tagName(tag.id),
              () => {
                if (draft.has(tag.id)) draft.delete(tag.id);
                else draft.add(tag.id);
                paint();
              },
              draft.has(tag.id) ? COLORS.primary : COLORS.gray,
              TOUCH ? 26 : tu(14),
            ),
          ),
        );
        ty += Math.ceil(tags.length / columns) * 50 + 8;
      }
      p.add(
        button(
          this,
          x + 100,
          y + ph - 56,
          148,
          44,
          tx('清空', 'Clear'),
          () => {
            draft.clear();
            paint();
          },
          COLORS.gray,
          18,
        ),
      );
      p.add(
        button(
          this,
          x + w - 280,
          y + ph - 56,
          148,
          44,
          tx('取消', 'Cancel'),
          () => {
            p.destroy();
            this.popup = null;
          },
          COLORS.gray,
          18,
        ),
      );
      p.add(
        button(
          this,
          x + w - 110,
          y + ph - 56,
          170,
          44,
          tx(`应用 (${draft.size})`, `Apply (${draft.size})`),
          () => {
            this.selectedTags = [...draft];
            p.destroy();
            this.popup = null;
            this.resetResults();
          },
          COLORS.primary,
          18,
        ),
      );
    };
    paint();
  }

  /** 未发现的条目只显示剪影与提示 */
  private lock(e: Entry, seen: boolean, hint: string): Entry {
    // 未发现：只隐藏名字与数值，仍保留 weaponId，让合成树能画出灰色轮廓的节点
    return seen
      ? e
      : {
          key: e.key,
          visual: e.visual,
          name: '？？？',
          color: '#888888',
          lines: [tx('尚未发现', 'Not discovered yet'), hint],
          weaponId: e.weaponId,
        };
  }

  private entries(): Entry[] {
    const L = (kind: 'items' | 'weapons' | 'enemies' | 'bosses', id: string, e: Entry, hint: string) =>
      this.lock(e, isSeen(kind, id), hint);
    switch (this.tab) {
      case 'char':
        return CHARACTERS.map((c) =>
          isUnlocked(c)
            ? {
                visual: { kind: 'char', id: c.id },
                key: portraitKey(this, 'char', c.id),
                name: c.name,
                color: '#ffd166',
                lines: [
                  c.title,
                  c.desc,
                  tx(`天赋【${c.talent.name}】${c.talent.desc}`, `Talent [${c.talent.name}] ${c.talent.desc}`),
                  tx('契合标签：', 'Synergy tags: ') + c.favored.map(tagName).join(tx('、', ', ')),
                  tx('契合特效（伤害 +10%）：', 'Synergy effect (+10% dmg): ') + affinityText(c.id),
                  ...charTraitLines(c),
                  tx(`技能【${c.skill.name}】${c.skill.desc}`, `Skill [${c.skill.name}] ${c.skill.desc}`),
                ],
              }
            : {
                visual: { kind: 'char', id: c.id },
                key: portraitKey(this, 'char', c.id),
                name: '？？？',
                color: '#888888',
                lines: [unlockHint(c)],
              },
        );
      case 'weapon':
        return weaponsByRecipeChain().map((w) =>
          L(
            'weapons',
            w.id,
            {
              key: `icon_weapon_${w.id}`,
              name: w.name,
              color: w.minTier ? (EVOLUTION_OF[w.evolvedFrom ?? ''] || w.evolvedFrom ? '#ffd166' : '#6ec6ff') : '#9be564',
              weaponId: w.id,
              lines: [
                `[${weaponTags(w).map(tagName).join('/')}] ${w.desc}`,
                tx(`伤害 ${w.damage.join('/')}`, `Damage ${w.damage.join('/')}`),
                tx(`冷却 ${w.cooldown.join('/')} 秒`, `Cooldown ${w.cooldown.join('/')}s`),
                tx(`射程 ${w.range} · 暴击倍率 x${w.critMult}`, `Range ${w.range} · Crit multiplier x${w.critMult}`),
                recipeLine(w),
              ],
            },
            w.minTier
              ? tx('按配方合成后解锁', 'Unlocked after crafting it')
              : tx('在商店中出现或获得后解锁', 'Unlocked after it appears in the shop or is obtained'),
          ),
        );
      case 'item':
        return ALL_ITEMS.map((it) =>
          L(
            'items',
            it.id,
            {
              key: `@item:${it.id}`,
              name: it.name,
              color: RARITY[it.rarity].css,
              lines: [
                `${RARITY[it.rarity].name}${it.series ? ' · ' + tx(it.series + '系列', it.series + ' series') : ''}`,
                ...describeItem(it),
                ...ITEM_COMBOS.filter((x) => x.item === it.id || x.needs === it.id).map((c) => {
                  const [zh, en] = describeCombo(c, (id) => ITEM_MAP[id]?.name ?? id);
                  return '⚭ ' + tx(zh, en);
                }),
                tx(
                  `价格 ${it.price}${baseItemCap(it) ? ` · 上限 ${baseItemCap(it)}` : ''}`,
                  `Price ${it.price}${baseItemCap(it) ? ` · max ${baseItemCap(it)}` : ''}`,
                ),
              ],
            },
            tx('在商店中出现或获得后解锁', 'Unlocked after it appears in the shop or is obtained'),
          ),
        );
      case 'relic': {
        const zh = lang === 'zh';
        return RELICS.map((r) => {
          const k = RELIC_KIND_INFO[r.kind];
          const e: Entry = {
            key: `@relic:${r.id}`,
            name: r.name[zh ? 0 : 1],
            color: k.css,
            lines: [
              k.name[zh ? 0 : 1] + (r.set ? ` · ${tx('套装', 'Set')} ${RELIC_SET_MAP[r.set].name[zh ? 0 : 1]}` : ''),
              ...describeRelic(r, (id) => WEAPON_MAP[id]?.name ?? id),
              ...(r.set ? [describeRelicSet(r)!] : []),
            ],
          };
          return this.lock(e, save.meta.relics.includes(r.id), tx('在一局中获得后解锁', 'Unlocked after obtaining it in a run'));
        });
      }
      case 'enemy':
        return ENEMIES.map((e) =>
          L(
            'enemies',
            e.id,
            {
              key: `@enemy:${e.id}`,
              name: e.name,
              color: '#ff9f9f',
              lines: [
                e.desc,
                ...(e.onHit ? [tx('攻击附带：', 'Attacks inflict: ') + e.onHit.map((s) => STATUSES[s.id].name).join(tx('、', ', '))] : []),
                tx(`生命 ${e.hp}（每波 +${Math.round(e.hpGrowth * 100)}%）`, `HP ${e.hp} (+${Math.round(e.hpGrowth * 100)}% per wave)`),
                tx(`伤害 ${e.dmg}（每波 +${e.dmgGrowth}）`, `Damage ${e.dmg} (+${e.dmgGrowth} per wave)`),
                tx(`速度 ${e.speed}`, `Speed ${e.speed}`),
                tx(`掉落番茄籽 ${e.seeds}`, `Drops ${e.seeds} Seeds`),
              ],
            },
            tx('在战斗中遭遇后解锁', 'Unlocked after encountering it in battle'),
          ),
        );
      case 'elite':
      case 'boss':
        return BOSSES.filter((b) => Boolean(b.elite) === (this.tab === 'elite')).map((b) =>
          L(
            'bosses',
            b.id,
            {
              key: `@boss:${b.id}`,
              name: b.name,
              color: b.elite ? '#c0c0c0' : '#ff5a4f',
              lines: [
                tx(`${b.title} · 第 ${b.chapter} 章`, `${b.title} · Chapter ${b.chapter}`),
                b.desc,
                ...(b.affixes ? [tx('固定词缀：', 'Fixed affixes: ') + b.affixes.map((a) => AFFIXES[a].name).join(tx('、', ', '))] : []),
                tx(`生命 ${b.hp} · 伤害 ${b.dmg}`, `HP ${b.hp} · Damage ${b.dmg}`),
                tx('招式：', 'Attacks: ') +
                  b.patterns
                    .map(
                      (p) =>
                        PATTERN_NAME[p.type] +
                        (p.debuff
                          ? tx(
                              `（${p.debuff.map((d) => STATUSES[d.id].name).join('/')}）`,
                              ` (${p.debuff.map((d) => STATUSES[d.id].name).join('/')})`,
                            )
                          : ''),
                    )
                    .join(tx('、', ', ')),
                b.phase2 ? tx(`血量 ${b.phase2.at * 100}% 进入第二阶段`, `Enters phase two at ${b.phase2.at * 100}% HP`) : '',
              ],
            },
            tx(`在第 ${b.chapter} 章遭遇后解锁`, `Unlocked after encountering it in Chapter ${b.chapter}`),
          ),
        );
    }
  }

  private draw(): void {
    const W = VW(this),
      H = VH(this),
      L = this.layer;
    L.removeAll(true);
    workbenchBackground(this, L, W, H);
    L.add(button(this, 80, 40, 112, 48, tx('返回', 'Back'), () => this.scene.start('Menu'), COLORS.gray, 19));
    L.add(text(this, 184, 18, tx('图鉴', 'Codex'), 34, '#fff0ce', { fontStyle: 'bold' }));
    const tabs: [Tab, string][] = [
      ['char', tx('角色', 'Characters')],
      ['weapon', tx('武器', 'Weapons')],
      ['item', tx('道具', 'Items')],
      ['relic', tx('遗物', 'Relics')],
      ['enemy', tx('怪物', 'Monsters')],
      ['elite', tx('精英', 'Elites')],
      ['boss', 'Boss'],
    ];
    const tabW = Math.min(132, (W - 360) / 7);
    tabs.forEach(([id, label], i) =>
      L.add(
        button(
          this,
          340 + tabW / 2 + i * tabW,
          40,
          tabW - 8,
          46,
          label,
          () => {
            this.tab = id;
            this.resetResults();
          },
          this.tab === id ? COLORS.primary : COLORS.gray,
          TOUCH ? 26 : tu(15),
        ),
      ),
    );
    const weapon = this.tab === 'weapon';
    if (weapon) {
      const chipW = Math.min(112, (W - 570) / 5);
      ['厨具', '蔬果', '枪械', '火焰'].forEach((tag, i) =>
        L.add(
          button(
            this,
            24 + chipW / 2 + i * (chipW + 8),
            TOUCH ? 132 : 100,
            chipW,
            44,
            tagName(tag) + (this.selectedTags.includes(tag) ? ' ×' : ''),
            () => {
              this.selectedTags = this.selectedTags.includes(tag)
                ? this.selectedTags.filter((t) => t !== tag)
                : [...this.selectedTags, tag];
              this.resetResults();
            },
            this.selectedTags.includes(tag) ? COLORS.primary : COLORS.gray,
            TOUCH ? 26 : tu(15),
          ),
        ),
      );
      const moreX = 24 + 4 * (chipW + 8);
      L.add(
        button(
          this,
          moreX + 85,
          TOUCH ? 132 : 100,
          162,
          44,
          tx(`更多标签 (${this.selectedTags.length})`, `More tags (${this.selectedTags.length})`),
          () => this.tags(),
          COLORS.gray,
          TOUCH ? 26 : tu(14),
        ),
      );
      const searchX = moreX + 178,
        searchW = W - searchX - 144;
      L.add(
        button(
          this,
          searchX + searchW / 2,
          TOUCH ? 132 : 100,
          searchW,
          44,
          this.query ? tx(`搜索：${this.query}`, `Search: ${this.query}`) : tx('搜索武器名称', 'Search weapon names'),
          () => void this.search(),
          COLORS.gray,
          TOUCH ? 26 : tu(14),
        ),
      );
      L.add(
        button(
          this,
          W - 76,
          TOUCH ? 132 : 100,
          104,
          44,
          tx('清空', 'Clear'),
          () => {
            this.selectedTags = [];
            this.query = '';
            this.resetResults();
          },
          COLORS.gray,
          TOUCH ? 26 : tu(15),
        ),
      );
    }
    const all = this.entries();
    const list = weapon
      ? filterCodexEntries(
          all.map((e) => ({ ...e, tags: e.weaponId ? weaponTags(WEAPON_MAP[e.weaponId]) : [] })),
          this.query,
          this.selectedTags,
        )
      : all;
    const top = weapon ? (TOUCH ? 198 : 160) : 108,
      bottom = H - 30,
      left = TOUCH ? 140 : 116,
      split = W * 0.49;
    if (this.textures.exists('codex:journal'))
      L.add(
        this.add
          .image(W / 2, (top + (TOUCH ? 20 : 0) + bottom) / 2, 'codex:journal')
          .setDisplaySize(W - 24, bottom - top + 34 - (TOUCH ? 20 : 0)),
      );
    else L.add(panel(this, 16, top - 12, W - 32, bottom - top + 24));
    const width = split - left - 28,
      cols = TOUCH ? 3 : 4,
      gap = 10;
    const cw = (width - (cols - 1) * gap) / cols,
      ch = TOUCH ? 158 : weapon ? 116 : 132;
    const rows = Math.max(1, Math.floor((bottom - top - (TOUCH ? 102 : 72) - 40) / (ch + gap)));
    const totalRows = Math.ceil(list.length / cols);
    this.page = Phaser.Math.Clamp(this.page, 0, Math.max(0, totalRows - rows));
    const gridOffset = TOUCH ? (weapon ? 62 : 102) : 72;
    this.listRect.setTo(left, top + gridOffset, width, rows * (ch + gap));
    const start = this.page * cols,
      visible = list.slice(start, start + rows * cols);
    const selected = list.find((e) => e.key === this.selectedKey);
    const entityEntries = selected ? [...visible, selected] : visible;
    const wantedArt = new Set<string>();
    for (const e of entityEntries) {
      let visual = e.visual;
      if (!visual && /^@(enemy|boss):/.test(e.key)) {
        const [kind, id] = e.key.slice(1).split(':');
        visual = { kind: kind as 'enemy' | 'boss', id };
      }
      if (!visual) continue;
      const key = `${visual.kind}:${visual.id}`;
      wantedArt.add(key);
      if (this.artRequests.has(key)) continue;
      this.artRequests.add(key);
      void loadArt(this, { portraits: [visual], bodies: [visual] }, `codex:${key}`).then(() => {
        if (this.scene.isActive() && this.artRequests.has(key)) this.draw();
        else this.game.events.once('poststep', () => unloadUnusedArt(this.textures));
      });
    }

    for (const key of this.artRequests)
      if (!wantedArt.has(key)) {
        releaseArt(`codex:${key}`);
        this.artRequests.delete(key);
      }
    this.game.events.once('poststep', () => unloadUnusedArt(this.textures));
    requestWeaponArt(this, new Set(visible.flatMap((e) => (e.weaponId ? [e.weaponId] : []))));
    L.add(this.add.rectangle(left + width / 2, top - 10, width, TOUCH ? 36 : 28, 0x21151c, 0.93));
    L.add(
      text(
        this,
        left + 8,
        top - 24,
        weapon
          ? tx(
              `匹配 ${list.length} / ${all.length} · 已发现 ${list.filter((e) => e.name !== '？？？').length}`,
              `Matches ${list.length}/${all.length} · found ${list.filter((e) => e.name !== '？？？').length}`,
            )
          : tx(
              `已发现 ${all.filter((e) => e.name !== '？？？').length} / ${all.length}`,
              `Discovered ${all.filter((e) => e.name !== '？？？').length}/${all.length}`,
            ),
        TOUCH ? 26 : 18,
        '#fff0ce',
      ),
    );
    if (!list.some((e) => e.key === this.selectedKey)) {
      this.selectedKey = list[0]?.key ?? '';
      this.detailOffset = 0;
    }
    visible.forEach((e, i) => {
      const x = left + (i % cols) * (cw + gap),
        y = top + gridOffset + Math.floor(i / cols) * (ch + gap);
      if (weapon) {
        if (this.selectedKey === e.key)
          L.add(
            this.add
              .graphics()
              .lineStyle(1.5, 0xe6bd73, 0.9)
              .strokeRoundedRect(x - 3, y - 2, cw + 6, ch + 4, 8),
          );
      } else L.add(panel(this, x, y, cw, ch, COLORS.panel, this.selectedKey === e.key ? COLORS.gold : 0x795b3f));
      L.add(
        this.icon(
          x + cw / 2,
          y + (this.tab === 'char' ? (TOUCH ? 54 : 48) : ch * (TOUCH ? 0.32 : 0.35)),
          e,
          e.weaponId
            ? TOUCH
              ? Math.min(140, cw - 16)
              : cw - 16
            : this.tab === 'char'
              ? Math.min(cw - 28, TOUCH ? 96 : 76)
              : Math.min(cw - 18, ch - 64),
        ),
      );
      const name = text(
        this,
        x + cw / 2,
        y + ch - (TOUCH ? 64 : 46),
        e.name,
        TOUCH ? 26 : 18,
        e.name === '？？？' ? '#c6b49d' : '#fff0ce',
        {
          align: 'center',
          wordWrap: { width: cw - 8, useAdvancedWrap: true },
          ...(this.tab === 'char' ? { fontFamily: JOURNAL_FONT, fontStyle: '600' } : {}),
          stroke: '#160d13',
          strokeThickness: 4,
        },
      ).setOrigin(0.5, 0);
      let label = e.name;
      while (label.length > 1 && name.height > (TOUCH ? 64 : 44)) {
        label = label.slice(0, -1);
        name.setText(label + '…');
      }
      L.add(name);
      L.add(
        hitArea(this, x, y, cw, ch, () => {
          if (this.dragged) return;
          this.selectedKey = e.key;
          this.detailOffset = 0;
          this.tier = e.weaponId ? (WEAPON_MAP[e.weaponId].minTier ?? 0) : 0;
          this.draw();
        }),
      );
    });
    if (!list.length) {
      const emptyX = left + width / 2,
        emptyY = top + (TOUCH ? 124 : 112);
      L.add(
        text(this, emptyX, emptyY, tx('没有匹配的条目', 'No matches'), TOUCH ? 36 : tu(28), '#fff0ce', {
          fontStyle: 'bold',
          stroke: '#28151b',
          strokeThickness: 2,
          align: 'center',
          wordWrap: { width: width - 28, useAdvancedWrap: true },
        }).setOrigin(0.5, 0),
      );
      L.add(
        text(
          this,
          emptyX,
          emptyY + (TOUCH ? 66 : 56),
          tx('试试清空搜索或标签', 'Clear the search or tags'),
          TOUCH ? 28 : tu(20),
          '#e9c991',
          {
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: width - 28, useAdvancedWrap: true },
          },
        ).setOrigin(0.5, 0),
      );
    }
    const fy = H - 88;
    L.add(
      journalNav(
        this,
        left + 28,
        fy,
        'left',
        () => {
          this.page -= rows;
          this.draw();
        },
        this.page > 0,
      ),
    );
    L.add(
      journalNav(
        this,
        split - 46,
        fy,
        'right',
        () => {
          this.page += rows;
          this.draw();
        },
        this.page < totalRows - rows,
      ),
    );
    L.add(
      text(
        this,
        (left + split - 18) / 2,
        fy,
        list.length ? `${start + 1}–${Math.min(list.length, start + rows * cols)} / ${list.length}` : '0 / 0',
        TOUCH ? 26 : 18,
        '#e1c9a5',
      ).setOrigin(0.5),
    );
    this.show(list.find((e) => e.key === this.selectedKey));
  }

  /** 条目图标：遗物用 emoji 文字，其余用贴图；未发现时显示剪影 */
  private icon(x: number, y: number, e: Entry, size: number): Phaser.GameObjects.GameObject {
    if (e.key.startsWith('@relic:')) {
      const r = RELIC_MAP[e.key.slice(7)];
      const t = this.add
        .text(x, y, e.name === '？？？' ? '❔' : r.icon, { fontFamily: FONT, fontSize: `${Math.round(size * 0.62)}px` })
        .setOrigin(0.5);
      if (e.name === '？？？') t.setAlpha(0.4);
      return t;
    }
    const key = e.weaponId ? `weapon_${e.weaponId}` : this.resolve(e.key);
    const img = fitImage(this.add.image(x, y, key), size);
    if (e.name === '？？？') img.setTintFill(0x100b12).setAlpha(0.8); // 未解锁：灰色轮廓
    return img;
  }

  private resolve(key: string): string {
    if (!key.startsWith('@')) return key;
    const [kind, id] = key.slice(1).split(':');
    if (kind === 'item')
      return itemIconKey(
        this,
        ALL_ITEMS.find((i) => i.id === id)!,
      );
    return portraitKey(this, kind as 'enemy', id);
  }

  private show(e: Entry | undefined): void {
    this.clearDetail();
    if (!e) return;
    const W = VW(this),
      H = VH(this),
      x = W * 0.51,
      w = W - x - 44,
      top = this.tab === 'weapon' ? (TOUCH ? 208 : 170) : 118;
    this.detailRect.setTo(x, top, w, H - top - 32);
    if (e.weaponId) requestWeaponArt(this, new Set([e.weaponId]));
    const artX = x + w * 0.24,
      artY = top + (e.weaponId ? 82 : 142),
      artSize = e.weaponId ? Math.min(220, w * 0.46) : Math.min(190, w * 0.4);
    let visual = e.visual;
    if (!visual && /^@(enemy|boss):/.test(e.key)) {
      const [kind, id] = e.key.slice(1).split(':');
      visual = { kind: kind as 'enemy' | 'boss', id };
    }
    if (visual && e.name !== '？？？') {
      // Only the selected detail is alive; gallery thumbnails remain static portraits.
      const rig = createEntityVisual(this, visual, 60);
      rig.play('idle', true);
      rig.tick(0, 0, 1);
      const bounds = rig.getBounds();
      const scale = (artSize * 0.92) / Math.max(bounds.width, bounds.height, 1);
      const frame = this.add.container(artX, artY).setScale(scale);
      rig.setPosition(-bounds.centerX, -bounds.centerY);
      frame.add(rig);
      this.detail.add(frame);
      this.detailVisual = rig;
    } else this.detail.add(this.icon(artX, artY, e, artSize));
    const name = text(
      this,
      x + w * 0.49,
      top + (e.weaponId ? 16 : 64),
      e.name,
      TOUCH ? 32 : 30,
      e.name === '？？？' ? '#b49c83' : '#fff0ce',
      { fontFamily: this.tab === 'char' ? JOURNAL_FONT : FONT, fontStyle: '600', stroke: '#28151b', strokeThickness: 1, letterSpacing: 1 },
    );
    if (name.width > w * 0.5) name.setScale((w * 0.5) / name.width);
    this.detail.add(name);
    const known = e.name !== '？？？';
    if (e.weaponId && known) {
      const d = WEAPON_MAP[e.weaponId];
      this.tier = Phaser.Math.Clamp(this.tier, d.minTier ?? 0, 3);
      const bx = x + w * 0.49,
        bw = (w * 0.51 - 18) / 4;
      TIER_NAMES.forEach((tier, i) =>
        this.detail.add(
          button(
            this,
            bx + bw / 2 + i * (bw + 4),
            top + 106,
            bw,
            44,
            tier,
            () => {
              this.tier = i;
              this.detailOffset = 0;
              this.show(e);
            },
            this.tier === i ? COLORS.primary : COLORS.gray,
            TOUCH ? 26 : tu(17),
          ).setEnabled(i >= (d.minTier ?? 0)),
        ),
      );

      const tags = [weaponDmgType(d).name, ...weaponTags(d).map(tagName)].join(' · ');
      this.detail.add(
        text(this, x + 14, top + 148, tags, TOUCH ? 26 : tu(14), '#e9c991', { wordWrap: { width: w - 28, useAdvancedWrap: true } }),
      );
      this.detail.add(
        text(
          this,
          x + 14,
          top + 190,
          tx(
            `伤害 ${d.damage[this.tier]}   冷却 ${d.cooldown[this.tier].toFixed(2)}s   射程 ${d.range}`,
            `DMG ${d.damage[this.tier]}   CD ${d.cooldown[this.tier].toFixed(2)}s   Range ${d.range}`,
          ),
          TOUCH ? 26 : tu(17),
          '#fff0ce',
        ),
      );
    }
    const bodyY = top + (e.weaponId ? (known ? 236 : 190) : 250),
      room = H - bodyY - 132;
    const content = this.add.container(0, 0);
    this.detail.add(content);
    this.detailBody = content;
    const old = this.detail;
    this.detail = content;
    const lines =
      e.weaponId && known
        ? [
            WEAPON_MAP[e.weaponId].desc,
            tx(`暴击倍率 ×${WEAPON_MAP[e.weaponId].critMult}`, `Critical multiplier ×${WEAPON_MAP[e.weaponId].critMult}`),
          ]
        : e.lines.filter(Boolean);
    const body = statLines(this, x + 14, bodyY, lines, TOUCH ? 26 : tu(16), '#fff0ce', w - 28, 8);
    content.add(body.box);
    if (e.weaponId && known) this.recipeTree(e.weaponId, x + 14, bodyY + body.height + 20, w - 28);
    this.detail = old;
    const bounds = content.getBounds();
    let clipRoom = room;
    // At rest, end on a complete body line rather than leaving sliced glyphs
    // along the page footer. The full content remains reachable by scrolling.
    for (const child of body.box.list)
      if (child instanceof Phaser.GameObjects.Text && child.y < room && child.y + child.height > room) {
        const lineHeight = child.height / Math.max(1, child.getWrappedText().length);
        clipRoom = Math.max(40, child.y + Math.floor((room - child.y) / lineHeight) * lineHeight);
        break;
      }
    this.detailMax = Math.max(0, bounds.bottom - bodyY - clipRoom);
    this.detailOffset = Phaser.Math.Clamp(this.detailOffset, 0, this.detailMax);
    content.setY(-this.detailOffset);
    const shape = this.make.graphics({ x: 0, y: 0 }, false).fillRect(x, bodyY - 2, w, clipRoom);
    this.detailShape = shape;
    this.detailMask = shape.createGeometryMask();
    content.setMask(this.detailMask);
    if (this.detailMax > 0) {
      const fy = H - 88;
      this.detailNavUp = journalNav(this, x + 32, fy, 'up', () => this.scrollDetail(-room * 0.7), this.detailOffset > 0);
      this.detail.add(this.detailNavUp);
      this.detail.add(text(this, x + w / 2, fy, tx('详情 · 可滚动', 'Details · scroll'), TOUCH ? 26 : 16, '#d8bca0').setOrigin(0.5));
      this.detailNavDown = journalNav(
        this,
        x + w - 100,
        fy,
        'down',
        () => this.scrollDetail(room * 0.7),
        this.detailOffset < this.detailMax,
      );
      this.detail.add(this.detailNavDown);
    }
  }

  /** 合成树：产出它的配方（材料 → 它）与它能合成出的东西，未解锁的节点灰色轮廓 */
  private recipeTree(id: string, x: number, y: number, w: number): void {
    const made = RECIPE_BY_TO[id];
    const into = RECIPES.filter((r) => !selfUp(r) && r.from.some(([m]) => m === id));
    if (!made && !into.length) return;
    let ty = y;
    const node = (nx: number, ny: number, wid: string, label: string) => {
      const seen = isSeen('weapons', wid);
      requestWeaponArt(this, new Set([wid]));
      const img = fitImage(this.add.image(nx + 18, ny + (TOUCH ? 28 : 18), `icon_weapon_${wid}`), TOUCH ? 56 : 36);
      if (!seen) img.setTintFill(0x100b12).setAlpha(0.8);
      this.detail.add(img);
      this.detail.add(text(this, nx + (TOUCH ? 64 : 40), ny + 9, seen ? label : '？？？', TOUCH ? 26 : 16, seen ? '#fff4ea' : '#888888'));
    };
    const row = (r: Recipe, title: string) => {
      this.detail.add(text(this, x, ty, title, TOUCH ? 26 : 17, '#e6c58f'));
      ty += TOUCH ? 40 : 26;
      r.from.forEach(([mid, t]) => {
        node(x + 8, ty, mid, `${WEAPON_MAP[mid]?.name ?? mid} ${TIER_NAMES[t]}`);
        ty += TOUCH ? 74 : 44;
      });
      this.detail.add(
        text(this, x + 8, ty, `＋ ${r.items.map(slotLabel).join(tx('、', ', '))}`, TOUCH ? 26 : 16, COLORS.textDim, {
          wordWrap: { width: w - 16 },
        }),
      );
      ty += 26;
    };
    if (made && !selfUp(made)) row(made, tx('合成需要', 'Crafted from'));
    else if (made) row(made, tx(`升到 ${TIER_NAMES[3]} 需要`, `Upgrade to ${TIER_NAMES[3]}`));
    if (into.length) {
      this.detail.add(text(this, x, ty, tx('可合成为', 'Crafts into'), TOUCH ? 26 : 17, '#e6c58f'));
      ty += TOUCH ? 40 : 26;
      for (const r of into) {
        node(x + 8, ty, r.to, WEAPON_MAP[r.to]?.name ?? r.to);
        ty += TOUCH ? 74 : 44;
      }
    }
  }
}

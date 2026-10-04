// 图鉴：角色 / 武器 / 道具 / 怪物 / Boss
import { EVOLVED_WEAPONS, EVOLUTION_OF } from '../data/evolutions';
import Phaser from 'phaser';
import { text, button, panel, COLORS, fitImage, hitArea, autoRelayout } from '../ui/UI';
import { CHARACTERS } from '../data/characters';
import { WEAPONS, WEAPON_MAP } from '../data/weapons';
import { ALL_ITEMS, ITEM_MAP, baseItemCap } from '../data/items';
import { describeItem } from '../data/describe';
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
import { RELICS, RELIC_MAP, RELIC_KIND_INFO, RELIC_SET_MAP, describeRelic } from '../data/relics';
import { FONT } from '../systems/Textures';
import { ITEM_COMBOS, describeCombo } from '../data/gearExtra';

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

type Tab = 'char' | 'weapon' | 'item' | 'relic' | 'enemy' | 'boss';
interface Entry {
  key: string;
  name: string;
  color: string;
  lines: string[];
}

export class CodexScene extends Phaser.Scene {
  private tab: Tab = 'char';
  private layer!: Phaser.GameObjects.Container;
  private detail!: Phaser.GameObjects.Container;
  private page = 0;

  constructor() {
    super('Codex');
  }

  create(): void {
    autoRelayout(this);
    const W = this.scale.width;
    this.cameras.main.setBackgroundColor(COLORS.bg);
    text(this, 24, 18, tx('图鉴', 'Codex'), 36);
    button(this, W - 90, 44, 140, 52, tx('返回', 'Back'), () => this.scene.start('Menu'), 0x555555, 22);
    const tabs: [Tab, string][] = [
      ['char', tx('角色', 'Characters')],
      ['weapon', tx('武器', 'Weapons')],
      ['item', tx('道具', 'Items')],
      ['relic', tx('遗物', 'Relics')],
      ['enemy', tx('怪物', 'Monsters')],
      ['boss', 'Boss'],
    ];
    tabs.forEach(([t, n], i) =>
      button(
        this,
        205 + i * 118,
        44,
        110,
        48,
        n,
        () => {
          this.tab = t;
          this.page = 0;
          this.draw();
        },
        0x7a2e35,
        20,
      ),
    );
    this.layer = this.add.container(0, 0);
    this.detail = this.add.container(0, 0);
    this.draw();
  }

  /** 未发现的条目只显示剪影与提示 */
  private lock(e: Entry, seen: boolean, hint: string): Entry {
    return seen ? e : { key: e.key, name: '？？？', color: '#888888', lines: [tx('尚未发现', 'Not discovered yet'), hint] };
  }

  private entries(): Entry[] {
    const L = (kind: 'items' | 'weapons' | 'enemies' | 'bosses', id: string, e: Entry, hint: string) =>
      this.lock(e, isSeen(kind, id), hint);
    switch (this.tab) {
      case 'char':
        return CHARACTERS.map((c) =>
          isUnlocked(c)
            ? {
                key: portraitKey(this, 'char', c.id),
                name: c.name,
                color: '#ffd166',
                lines: [
                  c.title,
                  c.desc,
                  tx(`天赋【${c.talent.name}】${c.talent.desc}`, `Talent [${c.talent.name}] ${c.talent.desc}`),
                  tx('契合武器：', 'Synergy weapons: ') + c.favored.map((w) => WEAPON_MAP[w].name).join(tx('、', ', ')),
                  ...c.traits,
                  tx(`技能【${c.skill.name}】${c.skill.desc}`, `Skill [${c.skill.name}] ${c.skill.desc}`),
                ],
              }
            : { key: portraitKey(this, 'char', c.id), name: '？？？', color: '#888888', lines: [unlockHint(c)] },
        );
      case 'weapon':
        return [...WEAPONS, ...EVOLVED_WEAPONS].map((w) =>
          L(
            'weapons',
            w.id,
            {
              key: `icon_weapon_${w.id}`,
              name: w.name,
              color: '#9be564',
              lines: [
                `[${w.tags.join('/')}] ${w.desc}`,
                tx(`伤害 ${w.damage.join('/')}`, `Damage ${w.damage.join('/')}`),
                tx(`冷却 ${w.cooldown.join('/')} 秒`, `Cooldown ${w.cooldown.join('/')}s`),
                tx(`射程 ${w.range} · 暴击倍率 x${w.critMult}`, `Range ${w.range} · Crit multiplier x${w.critMult}`),
                w.evolvedFrom
                  ? tx(
                      `✨ 进化：${WEAPON_MAP[w.evolvedFrom].name} T4 + ${ITEM_MAP[EVOLUTION_OF[w.evolvedFrom].item].name}`,
                      `✨ Evolution: ${WEAPON_MAP[w.evolvedFrom].name} T4 + ${ITEM_MAP[EVOLUTION_OF[w.evolvedFrom].item].name}`,
                    )
                  : EVOLUTION_OF[w.id]
                    ? tx(
                        `T4 + ${ITEM_MAP[EVOLUTION_OF[w.id].item].name} 可进化为「${EVOLUTION_OF[w.id].to.name}」`,
                        `T4 + ${ITEM_MAP[EVOLUTION_OF[w.id].item].name} evolves into ${EVOLUTION_OF[w.id].to.name}`,
                      )
                    : tx(`基础价格 ${w.price}`, `Base price ${w.price}`),
              ],
            },
            w.evolvedFrom
              ? tx(
                  `进化获得：${WEAPON_MAP[w.evolvedFrom].name} T4 + ${ITEM_MAP[EVOLUTION_OF[w.evolvedFrom].item].name}`,
                  `Obtained by evolving ${WEAPON_MAP[w.evolvedFrom].name} T4 + ${ITEM_MAP[EVOLUTION_OF[w.evolvedFrom].item].name}`,
                )
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
              ...(r.set
                ? [tx('集齐 3 件套装效果：', '3-piece set bonus: ') + describeRelic(RELIC_SET_MAP[r.set]).join(tx('，', ', '))]
                : []),
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
      case 'boss':
        return BOSSES.map((b) =>
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
    const W = this.scale.width,
      H = this.scale.height;
    this.layer.removeAll(true);
    const list = this.entries();
    const found = list.filter((e) => e.name !== '？？？').length;
    this.layer.add(
      text(this, W - 180, 44, tx(`已发现 ${found} / ${list.length}`, `Discovered ${found} / ${list.length}`), 20, '#ffd166').setOrigin(
        1,
        0.5,
      ),
    );
    const s = 84,
      cols = Math.floor((W * 0.55) / (s + 10)),
      rows = Math.floor((H - 120) / (s + 10));
    const per = cols * rows;
    const pages = Math.ceil(list.length / per);
    this.page = Phaser.Math.Clamp(this.page, 0, pages - 1);
    list.slice(this.page * per, (this.page + 1) * per).forEach((e, i) => {
      const x = 24 + (i % cols) * (s + 10),
        y = 90 + Math.floor(i / cols) * (s + 10);
      this.layer.add(panel(this, x, y, s, s, COLORS.panel, COLORS.border));
      this.layer.add(this.icon(x + s / 2, y + s / 2, e, s - 14));
      this.layer.add(hitArea(this, x, y, s, s, () => this.show(e)));
    });
    if (pages > 1) {
      this.layer.add(
        button(
          this,
          80,
          H - 30,
          100,
          44,
          tx('上一页', 'Prev'),
          () => {
            this.page--;
            this.draw();
          },
          0x555555,
          18,
        ),
      );
      this.layer.add(
        button(
          this,
          200,
          H - 30,
          100,
          44,
          tx('下一页', 'Next'),
          () => {
            this.page++;
            this.draw();
          },
          0x555555,
          18,
        ),
      );
    }
    this.show(list[this.page * per]);
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
    const img = fitImage(this.add.image(x, y, this.resolve(e.key)), size);
    if (e.name === '？？？') img.setTint(0x000000);
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
    const W = this.scale.width,
      H = this.scale.height;
    this.detail.removeAll(true);
    if (!e) return;
    const x = W * 0.58,
      w = W - x - 24;
    this.detail.add(panel(this, x, 90, w, H - 120));
    this.detail.add(this.icon(x + w / 2, 190, e, 150));
    this.detail.add(text(this, x + w / 2, 290, e.name, 30, e.color).setOrigin(0.5));
    this.detail.add(
      text(this, x + 24, 330, e.lines.filter(Boolean).join('\n'), 17, '#fff4ea', { wordWrap: { width: w - 48 }, lineSpacing: 6 }),
    );
  }
}

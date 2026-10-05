// 构筑页：角色 / 章节 / 波次 / 等级 / 资金 → 模拟商店购买与升级加点 → 保存为预设
import { h, btn, check, select, num, table, fmt } from '../dom';
import type { DevCtx } from '../ctx';
import { switchChar } from '../quick';
import { CHARACTERS, CHARACTER_MAP } from '../../data/characters';
import { CHAPTERS } from '../../data/chapters';
import { WEAPONS, WEAPON_MAP, TIER_NAMES } from '../../data/weapons';
import { ALL_ITEMS, ITEM_MAP, LEVELUP_OPTIONS } from '../../data/items';
import { EVOLUTION_OF } from '../../data/evolutions';
import { STAT_INFO, STAT_ORDER, formatMod, type StatKey } from '../../data/stats';
import { RARITY, sellPrice } from '../../data/balance';
import { WEAPON_AFFIXES, FORGE, type AffixKind } from '../../data/weaponAffixes';
import { describeItem } from '../../data/describe';
import { itemIconKey } from '../../art/ItemArt';
import { run } from '../../systems/RunState';
import { affixSlots, forgeCost, forgeChance } from '../../systems/WeaponMods';
import { weaponDamage, weaponCooldown, weaponRange } from '../../systems/WeaponSystem';
import {
  money,
  spent,
  buyWeapon,
  buyItem,
  sellWeapon,
  combineWeapon,
  evolveWeapon,
  forgeWeapon,
  canCombine,
  undo,
  weaponPrice,
  itemPrice,
  canAfford,
  rollShelf,
  rerollShelf,
  shelfRerollCost,
  levelPool,
  autoLevelPicks,
  expectedBudget,
  loadPresets,
  savePresets,
  newBuild,
  sanitize,
  savedTalents,
  type DevBuild,
} from '../build';
import { renderBuildTools } from './buildTools';
import { DANGER_LEVELS, MAX_DANGER } from '../../data/danger';

const META_KEY = 'tomageddon_dev_preset_meta';
let presetSearch = '';
let presetSort: 'name' | 'time' = 'name';
const loadMeta = (): Record<string, number> => {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
};

export function renderBuild(ctx: DevCtx): HTMLElement {
  const b = ctx.build;
  const ui = ctx.ui;
  const root = h('div');
  const err = (e: string | null) => {
    if (e) ctx.toast(e, true);
    else ctx.changed();
  };

  // ---------------- 基础 ----------------
  const m = money(b);
  root.append(
    h('h3', null, '基础设定'),
    h(
      'div',
      { class: 'row' },
      '角色',
      select(
        CHARACTERS.map((c) => [c.id, `${c.name}（${c.title}）`]),
        b.charId,
        (v) => switchChar(ctx, v),
      ),
      '章节',
      select(
        CHAPTERS.map((c) => [c.id, c.name]),
        b.chapterId,
        (v) => {
          b.chapterId = Number(v);
          ctx.changed();
        },
      ),
    ),
    h(
      'div',
      { class: 'row' },
      '当前波次',
      num(b.wave, (v) => ((b.wave = v), ctx.changed()), { min: 1, max: 80, width: 52 }),
      'H1 危机',
      select(
        Array.from({ length: MAX_DANGER + 1 }, (_, i): [number, string] => [i, i ? `${i} ${DANGER_LEVELS[i - 1].name[0]}` : '0 普通']),
        b.danger ?? 0,
        (v) => ((b.danger = Number(v)), ctx.changed()),
      ),
      '等级',
      num(b.level, (v) => ((b.level = v), ctx.changed()), { min: 0, max: 80, width: 52 }),
      '天赋',
      select(
        [
          ['save', '存档天赋'],
          ['none', '无天赋'],
          ['max', '全部满级'],
          ['custom', '自定义（见下方 C7）'],
        ],
        b.talents,
        (v) => {
          b.talents = v as DevBuild['talents'];
          if (v === 'custom') b.talentMap ??= savedTalents();
          ctx.changed();
        },
      ),
    ),
    h(
      'div',
      { class: 'row' },
      '初始资金 🌱',
      num(b.budget, (v) => ((b.budget = v), ctx.changed(false)), { min: 0, max: 999999, width: 80 }),
      btn(
        '按期望收入估算',
        () => {
          b.budget = expectedBudget(b);
          ctx.changed(false);
        },
        '',
        '前 (波次-1) 波的收入目标曲线 × 章节掉落倍率 + 天赋开局资金',
      ),
      check('允许超支', b.ignoreBudget, (v) => ((b.ignoreBudget = v), ctx.changed(false))),
    ),
    h(
      'div',
      { class: 'row' },
      `已花费 ${spent(b)} · 剩余 `,
      h('b', { class: m < 0 ? 'bad' : 'good' }, String(m)),
      h('span', { class: 'muted' }, `（商店价格按「打完第 ${Math.max(0, b.wave - 1)} 波后的商店」计算）`),
    ),
  );

  // ---------------- 持有武器 ----------------
  root.append(h('h3', null, `持有武器（${b.weapons.length}/${run.maxWeapons}）`));
  const s = run.stats;
  const wrows = b.weapons.map((w, i) => {
    const d = WEAPON_MAP[w.id];
    const evo = EVOLUTION_OF[w.id];
    const sp = sellPrice(weaponPrice(b, w.id, w.tier));
    const owned = run.weapons[i];
    const affixCells = h('div');
    const slots = affixSlots(w.tier);
    for (let k = 0; k < slots; k++) {
      const a = w.affixes?.[k];
      affixCells.append(
        h(
          'div',
          null,
          select(
            [['', '（空）'], ...WEAPON_AFFIXES.map((x): [string, string] => [x.id, x.name[0].replace('{v}', 'x')])],
            a?.id ?? '',
            (v) => {
              w.affixes ??= [];
              if (!v) w.affixes.splice(k, 1);
              else w.affixes[k] = { id: v as AffixKind, tier: a?.tier ?? 1 };
              ctx.changed();
            },
          ),
          select(
            [1, 2, 3, 4].map((t) => [t, ['I', 'II', 'III', 'IV'][t - 1]]),
            a?.tier ?? 1,
            (v) => {
              if (!a) return;
              a.tier = Number(v);
              ctx.changed();
            },
          ),
        ),
      );
    }
    const fc = w.tier >= 3 && (w.forge ?? 0) < FORGE.maxLevel && owned ? Math.round(forgeCost(owned) / forgeChance(owned)) : 0;
    return [
      h('span', null, (d.evolvedFrom ? '✨' : '') + d.name),
      select(
        TIER_NAMES.map((t, k) => [k, `T${k + 1} ${t}`]),
        w.tier,
        (v) => {
          w.tier = Number(v);
          w.affixes = w.affixes?.slice(0, affixSlots(w.tier));
          if (w.tier < 3) w.forge = undefined;
          ctx.changed();
        },
      ),
      owned
        ? `${Math.round(weaponDamage(d, w.tier, s, owned))} / ${weaponCooldown(d, w.tier, s, owned).toFixed(2)}s / ${Math.round(weaponRange(d, s, owned))}`
        : '',
      slots ? affixCells : h('span', { class: 'muted' }, '—'),
      w.tier >= 3 ? num(w.forge ?? 0, (v) => ((w.forge = v || undefined), ctx.changed()), { min: 0, max: FORGE.maxLevel, width: 44 }) : '',
      h(
        'span',
        null,
        mkBtn(
          '↑',
          i === 0,
          () => (b.weapons.splice(i - 1, 0, ...b.weapons.splice(i, 1)), ctx.changed()),
          '上移（影响叠加层颜色与武器栏顺序）',
        ),
        mkBtn('↓', i === b.weapons.length - 1, () => (b.weapons.splice(i + 1, 0, ...b.weapons.splice(i, 1)), ctx.changed()), '下移'),
        mkBtn('合成', !canCombine(b, i), () => (combineWeapon(b, i) ? ctx.changed() : ctx.toast('需要另一把同名同品质', true))),
        evo
          ? mkBtn(
              '进化',
              !(owned && run.canEvolve(owned)),
              () => (evolveWeapon(b, i) ? ctx.changed() : ctx.toast('需要 T4 + 对应道具', true)),
              `需要 T4 + ${ITEM_MAP[evo.item].name}`,
            )
          : '',
        fc ? mkBtn(`打造 ${fc}`, !canAfford(b, fc), () => err(forgeWeapon(b, i)), '沙盒内必定成功，按期望花费（费用 ÷ 成功率）记账') : '',
        mkBtn(`卖 +${sp}`, b.weapons.length <= 1, () => (sellWeapon(b, i), ctx.changed())),
        mkBtn('删', false, () => (b.weapons.splice(i, 1), ctx.changed()), '直接删除，不退款'),
      ),
    ];
  });
  root.append(table(['武器', '品质', '伤害/冷却/射程', '词条', '打造', '操作'], wrows));

  // ---------------- 持有道具 ----------------
  const owned = Object.entries(b.items);
  root.append(h('h3', null, `持有道具（${owned.reduce((a, [, n]) => a + n, 0)}）`));
  if (!owned.length) root.append(h('div', { class: 'muted' }, '无'));
  else
    root.append(
      h(
        'div',
        null,
        ...owned.map(([id, n]) => {
          const it = ITEM_MAP[id];
          return h(
            'span',
            { class: 'tag', title: describeItem(it).join('，') },
            h('span', { style: `color:${RARITY[it.rarity].css}` }, it.name),
            n > 1 ? ` ×${n}` : '',
            ' ',
            h(
              'a',
              {
                title: '移除 1 个（不退款）',
                onclick: () => {
                  if (--b.items[id] <= 0) delete b.items[id];
                  ctx.changed();
                },
              },
              '×',
            ),
          );
        }),
      ),
    );

  // ---------------- 商店 ----------------
  root.append(
    h('h3', null, '商店模拟'),
    h(
      'div',
      { class: 'row' },
      select(
        [
          ['catalog', '目录（任意购买）'],
          ['shelf', '随机货架（仿真商店）'],
        ],
        ui.shopMode,
        (v) => ((ui.shopMode = v as typeof ui.shopMode), ctx.rerender()),
      ),
      ui.shopMode === 'catalog'
        ? select(
            [
              ['weapon', '武器'],
              ['item', '道具'],
            ],
            ui.shopKind,
            (v) => ((ui.shopKind = v as typeof ui.shopKind), ctx.rerender()),
          )
        : '',
    ),
  );
  root.append(ui.shopMode === 'catalog' ? catalog(ctx) : shelf(ctx));

  // ---------------- 账本 ----------------
  root.append(
    h('h3', null, `购买记录（${b.ledger.length}）`),
    h(
      'div',
      { class: 'row' },
      mkBtn('撤销上一步', !b.ledger.length, () => (undo(b), ctx.changed())),
      mkBtn('重置购买（恢复初始武器）', false, () => {
        const nb = newBuild(b.charId);
        b.weapons = nb.weapons;
        b.items = {};
        b.ledger = [];
        ui.shelf = null;
        ctx.changed();
      }),
    ),
  );
  if (b.ledger.length)
    root.append(
      h(
        'div',
        { class: 'box', style: 'max-height:140px;overflow:auto' },
        ...b.ledger.map((e, i) =>
          h(
            'div',
            null,
            `${i + 1}. ${e.label} `,
            h('span', { class: e.cost > 0 ? 'bad' : 'good' }, e.cost > 0 ? `-${e.cost}` : `+${-e.cost}`),
          ),
        ),
      ),
    );

  // ---------------- 升级加点 ----------------
  const picks = b.levelPicks;
  const pool = levelPool();
  if (!pool.some((o) => o.key === ui.pickKey)) ui.pickKey = pool[0].key;
  root.append(
    h('h3', null, `升级加点（${Math.min(picks.length, b.level)} / ${b.level}）`),
    h(
      'div',
      { class: 'row' },
      select(
        pool.map((o) => [o.key, STAT_INFO[o.key as StatKey].name]),
        ui.pickKey,
        (v) => ((ui.pickKey = v), ctx.rerender()),
      ),
      select(
        RARITY.map((r, i) => [i, `${r.name} ${fmt(LEVELUP_OPTIONS.find((o) => o.key === ui.pickKey)!.values[i])}`]),
        ui.pickRarity,
        (v) => ((ui.pickRarity = Number(v)), ctx.rerender()),
      ),
      mkBtn('添加', picks.length >= b.level, () => {
        picks.push({ key: ui.pickKey as StatKey, rarity: ui.pickRarity });
        ctx.changed();
      }),
      mkBtn(
        '随机补齐',
        picks.length >= b.level,
        () => (autoLevelPicks(b), ctx.changed()),
        '模拟每次从升级选项里随手挑一个，稀有度按游戏曲线随机',
      ),
      mkBtn('清空', !picks.length, () => ((b.levelPicks = []), ctx.changed())),
    ),
  );
  if (picks.length)
    root.append(
      h(
        'div',
        null,
        ...picks.map((p, i) => {
          const o = LEVELUP_OPTIONS.find((x) => x.key === p.key)!;
          return h(
            'span',
            {
              class: 'tag',
              style: `${i >= b.level ? 'opacity:.4' : ''};border:1px solid ${RARITY[p.rarity].css}`,
              title: i >= b.level ? '超出当前等级，不生效' : '',
            },
            formatMod(p.key, o.values[p.rarity]),
            ' ',
            h('a', { onclick: () => (picks.splice(i, 1), ctx.changed()) }, '×'),
          );
        }),
      ),
    );

  // ---------------- 额外属性 ----------------
  root.append(h('h3', null, '开发者额外属性（直接叠加，不计花费）'));
  root.append(
    h(
      'div',
      { class: 'grid' },
      ...STAT_ORDER.map((k) =>
        h(
          'label',
          null,
          h('span', { style: `color:${STAT_INFO[k].color}` }, STAT_INFO[k].name),
          num(
            b.extraMods[k] ?? 0,
            (v) => {
              if (v) b.extraMods[k] = v;
              else delete b.extraMods[k];
              ctx.changed();
            },
            { width: 58, step: 1 },
          ),
        ),
      ),
    ),
  );

  // ---------------- 最终属性 ----------------
  root.append(h('h3', null, '最终属性（进入沙盒时的面板）'));
  root.append(
    h(
      'div',
      { class: 'grid' },
      ...STAT_ORDER.map((k) => {
        const v = k === 'dodge' ? Math.min(s[k], run.dodgeCap) : s[k];
        return h(
          'label',
          null,
          h('span', { style: `color:${STAT_INFO[k].color}` }, STAT_INFO[k].name),
          h('b', { class: v > 0 ? 'good' : v < 0 ? 'bad' : '' }, `${fmt(v)}${STAT_INFO[k].pct ? '%' : ''}`),
        );
      }),
    ),
    h(
      'div',
      { class: 'muted' },
      `武器栏 ${run.maxWeapons} · 闪避上限 ${run.dodgeCap}% · 暴伤 +${run.specials.critDmg}% · 折扣 ${run.specials.shopDiscount}% · 复活 ${run.specials.revive}`,
    ),
  );

  // ---------------- 预设 ----------------
  root.append(presets(ctx));
  root.append(renderBuildTools(ctx));
  return root;
}

function mkBtn(label: string, disabled: boolean, onClick: () => void, title = ''): HTMLButtonElement {
  const b = btn(label, onClick, '', title);
  b.disabled = disabled;
  return b;
}

// ---------------- 商店卡片辅助 ----------------
/** 卡片式商店样式（只注入一次；放在本文件里，避免改动面板公共样式） */
function ensureShopCss(): void {
  if (document.getElementById('dev-shop-css')) return;
  const st = document.createElement('style');
  st.id = 'dev-shop-css';
  st.textContent = `
#dev-panel .shop-bar{display:flex;align-items:baseline;gap:4px;padding:6px 10px;margin:6px 0;border-radius:6px;background:var(--sf2)}
#dev-panel .shop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px;margin:6px 0}
#dev-panel .shop-card{display:flex;flex-direction:column;gap:6px;justify-content:space-between;border:2px solid var(--ln);border-radius:8px;padding:8px;background:var(--sf)}
#dev-panel .shop-card.sold{opacity:.45;align-items:center;justify-content:center;min-height:120px}
#dev-panel .shop-head{display:flex;gap:8px;align-items:center}
#dev-panel .shop-desc{font-size:11px;line-height:1.45}
#dev-panel .shop-card button{flex:1}`;
  document.head.append(st);
}

const texCache = new Map<string, string>();
/** 把 Phaser 贴图转成 DOM <img>（失败时返回空占位） */
function texImg(ctx: DevCtx, key: string, size = 40): HTMLElement {
  let url = texCache.get(key);
  if (url === undefined) {
    try {
      url = ctx.sb.game.textures.exists(key) ? ctx.sb.game.textures.getBase64(key) : '';
    } catch {
      url = '';
    }
    texCache.set(key, url);
  }
  return url
    ? h('img', { src: url, width: size, height: size, alt: '', style: 'object-fit:contain;flex:none' })
    : h('span', { style: `display:inline-block;width:${size}px;flex:none` });
}

const weaponTexKey = (ctx: DevCtx, id: string): string =>
  ctx.sb.game.textures.exists(`icon_weapon_${id}`) ? `icon_weapon_${id}` : `weapon_${id}`;

/** 武器属性：按当前构筑属性算出的伤害 / 冷却 / 射程 / DPS，以及基础值和属性加成系数 */
function weaponStatBox(id: string, tier: number): HTMLElement {
  const d = WEAPON_MAP[id];
  const s = run.stats;
  const dmg = weaponDamage(d, tier, s);
  const cd = weaponCooldown(d, tier, s);
  const rng = weaponRange(d, s);
  const scal = Object.entries(d.scaling)
    .filter(([, v]) => v)
    .map(([k, v]) => `${STAT_INFO[k as StatKey]?.name ?? k} ×${fmt(v as number)}`)
    .join('，');
  return h(
    'div',
    { class: 'shop-desc' },
    h('div', null, `伤害 `, h('b', null, String(Math.round(dmg))), ` · 冷却 ${cd.toFixed(2)}s · 射程 ${Math.round(rng)}`),
    h('div', null, `单发 DPS ≈ `, h('b', null, (dmg / cd).toFixed(1)), h('span', { class: 'muted' }, ` · 基础伤害 ${d.damage[tier]}`)),
    scal ? h('div', { class: 'muted' }, `加成：${scal}`) : '',
    d.desc ? h('div', { class: 'muted' }, d.desc) : '',
  );
}

function catalog(ctx: DevCtx): HTMLElement {
  const b = ctx.build;
  const ui = ctx.ui;
  const wrap = h('div');
  const list = h('div');
  const q = () => ui.shopSearch.trim().toLowerCase();
  const draw = () => {
    if (ui.shopKind === 'weapon') {
      const rows = WEAPONS.filter((d) => !q() || d.name.toLowerCase().includes(q()) || d.id.includes(q())).map((d) => {
        const tier = Math.max(ui.shopTier, d.minTier ?? 0);
        const p = weaponPrice(b, d.id, tier);
        const can = canAfford(b, p) && run.canAddWeapon(d.id, tier);
        const dmg = weaponDamage(d, tier, run.stats);
        const cd = weaponCooldown(d, tier, run.stats);
        return [
          h('span', { style: `color:${RARITY[tier].css}` }, `${d.name} T${tier + 1}`),
          d.tags.join('/'),
          String(Math.round(dmg)),
          cd.toFixed(2),
          String(Math.round(weaponRange(d, run.stats))),
          (dmg / cd).toFixed(1),
          String(p),
          mkBtn('买', !can, () => {
            const e = buyWeapon(b, d.id, tier);
            if (e) ctx.toast(e, true);
            else ctx.changed();
          }),
        ];
      });
      list.replaceChildren(table(['武器', '标签', '伤害', '冷却s', '射程', 'DPS', '价格', ''], rows, { numeric: [2, 3, 4, 5, 6] }));
    } else {
      const rows = ALL_ITEMS.filter(
        (it) => (ui.shopRarity < 0 || it.rarity === ui.shopRarity) && (!q() || it.name.toLowerCase().includes(q()) || it.id.includes(q())),
      ).map((it) => {
        const p = itemPrice(b, it);
        const full = !run.canTakeItem(it.id);
        const cap = run.itemCap(it.id);
        return [
          h(
            'span',
            { style: `color:${RARITY[it.rarity].css}` },
            it.name + (b.items[it.id] ? ` (${b.items[it.id]}${cap < Infinity ? `/${cap}` : ''})` : ''),
          ),
          h('span', { class: 'muted' }, describeItem(it).join('，')),
          String(p),
          mkBtn(full ? '满' : '买', full || !canAfford(b, p), () => {
            const e = buyItem(b, it.id);
            if (e) ctx.toast(e, true);
            else ctx.changed();
          }),
        ];
      });
      list.replaceChildren(table(['道具', '效果', '价格', ''], rows, { numeric: [2] }));
    }
  };
  const search = h('input', {
    placeholder: '搜索名称 / id',
    value: ui.shopSearch,
    oninput: () => {
      ui.shopSearch = search.value;
      draw();
    },
  });
  wrap.append(
    h(
      'div',
      { class: 'row' },
      search,
      ui.shopKind === 'weapon'
        ? select(
            TIER_NAMES.map((t, k) => [k, `品质 T${k + 1}`]),
            ui.shopTier,
            (v) => ((ui.shopTier = Number(v)), draw()),
          )
        : select(
            [[-1, '全部稀有度'], ...RARITY.map((r, i): [number, string] => [i, r.name])],
            ui.shopRarity,
            (v) => ((ui.shopRarity = Number(v)), draw()),
          ),
    ),
    h('div', { style: 'max-height:280px;overflow:auto' }, list),
  );
  draw();
  return wrap;
}

function shelf(ctx: DevCtx): HTMLElement {
  const b = ctx.build;
  const ui = ctx.ui;
  ensureShopCss();
  ui.shelf ??= rollShelf(b);
  const sh = ui.shelf;
  const cost = shelfRerollCost(b, sh);
  const m = money(b);
  const cards = sh.offers.map((o) => {
    if (o.sold) return h('div', { class: 'shop-card sold' }, h('div', { class: 'muted' }, '（已售）'));
    const isW = o.kind === 'weapon';
    const it = isW ? null : ITEM_MAP[o.id];
    const name = isW ? `${WEAPON_MAP[o.id].name} T${o.tier + 1}` : it!.name;
    const own = isW ? run.weapons.filter((w) => w.id === o.id).length : (run.items[o.id] ?? 0);
    const cap = isW ? Infinity : run.itemCap(o.id);
    const full = !isW && !run.canTakeItem(o.id);
    const slotFull = isW && !run.canAddWeapon(o.id, o.tier);
    const afford = canAfford(b, o.price);
    const reason = full ? `已达上限 ${cap}` : slotFull ? '武器栏已满' : !afford ? '资金不足' : '';
    return h(
      'div',
      { class: 'shop-card', style: `border-color:${RARITY[o.tier].css}` },
      h(
        'div',
        { class: 'shop-head' },
        texImg(ctx, isW ? weaponTexKey(ctx, o.id) : itemIconKey(ctx.sb.g, it!)),
        h(
          'div',
          null,
          h('b', { style: `color:${RARITY[o.tier].css}` }, name),
          h(
            'div',
            { class: 'muted' },
            `${isW ? WEAPON_MAP[o.id].tags.join('/') : RARITY[it!.rarity].name}${own ? ` · 已有 ${own}${cap < Infinity ? `/${cap}` : ''}` : ''}`,
          ),
        ),
      ),
      isW ? weaponStatBox(o.id, o.tier) : h('div', { class: 'shop-desc' }, describeItem(it!).join('，')),
      h(
        'div',
        { class: 'row' },
        h('b', { class: afford ? 'good' : 'bad' }, `🌱 ${o.price}`),
        mkBtn(reason || '购买', !!reason, () => {
          const e = isW ? buyWeapon(b, o.id, o.tier) : buyItem(b, o.id);
          if (e) return ctx.toast(e, true);
          o.sold = true;
          // 全部买光：免费补货（同 ShopScene）
          if (sh.offers.every((x) => x.sold)) ui.shelf = { ...rollShelf(b), rerolls: sh.rerolls };
          ctx.changed();
        }),
      ),
    );
  });
  return h(
    'div',
    null,
    h(
      'div',
      { class: 'shop-bar' },
      h('span', null, `第 ${b.wave - 1} 波后的商店 · 持有 `),
      h('b', { class: m < 0 ? 'bad' : 'good', style: 'font-size:1.25em' }, `🌱 ${m}`),
      h('span', { class: 'muted' }, ` · 武器 ${b.weapons.length}/${run.maxWeapons}`),
    ),
    h('div', { class: 'shop-grid' }, ...cards),
    h(
      'div',
      { class: 'row' },
      mkBtn(`刷新 🌱${cost}（已刷 ${sh.rerolls}/${run.maxRerolls}）`, sh.rerolls >= run.maxRerolls || !canAfford(b, cost), () => {
        const r = rerollShelf(b, sh);
        if (r.err) return ctx.toast(r.err, true);
        ui.shelf = r.shelf;
        ctx.changed(false);
      }),
      btn(
        '下一家商店（波次 +1，免费换货）',
        () => {
          b.wave++;
          ui.shelf = null;
          ctx.changed();
        },
        '',
        '模拟打完一波进入下一个商店：波次 +1，货架重新生成，刷新次数清零',
      ),
      btn('同波重新生成（不计费）', () => {
        ui.shelf = rollShelf(b);
        ctx.rerender();
      }),
    ),
  );
}

function presets(ctx: DevCtx): HTMLElement {
  const ui = ctx.ui;
  const all = loadPresets();
  const name = h('input', {
    placeholder: '预设名，如「番茄妹 W10 Lv12 800籽」',
    value: ui.presetName,
    style: 'flex:1',
    oninput: () => (ui.presetName = name.value),
  });
  const io = h('textarea', { placeholder: '导出 / 导入 JSON' });
  const summary = (p: DevBuild) =>
    `${CHARACTER_MAP[p.charId]?.name} · 第${p.chapterId}章 W${p.wave} Lv${p.level} · 资金 ${p.budget}（剩 ${money(p)}）· ${p.weapons.map((w) => `${WEAPON_MAP[w.id]?.name}T${w.tier + 1}`).join('/')} · 道具 ${Object.values(p.items).reduce((a, n) => a + n, 0)}`;
  return h(
    'div',
    null,
    h('h3', null, '预设'),
    h(
      'div',
      { class: 'row' },
      name,
      btn(
        '保存当前构筑',
        () => {
          const n = ui.presetName.trim() || `${CHARACTER_MAP[ctx.build.charId].name} W${ctx.build.wave} Lv${ctx.build.level}`;
          all[n] = JSON.parse(JSON.stringify(ctx.build));
          savePresets(all);
          const meta = loadMeta();
          meta[n] = Date.now();
          localStorage.setItem(META_KEY, JSON.stringify(meta));
          ctx.toast(`已保存预设「${n}」`);
          ctx.rerender();
        },
        'pri',
      ),
      btn('新建空白', () => ctx.setBuild(newBuild(ctx.build.charId))),
    ),
    Object.keys(all).length ? presetTable(ctx, all, summary) : h('div', { class: 'muted' }, '还没有预设'),
    h(
      'div',
      { class: 'row' },
      btn('导出当前', () => {
        io.value = JSON.stringify(ctx.build, null, 1);
        io.select();
        void navigator.clipboard?.writeText(io.value).catch(() => {});
      }),
      btn('导出全部预设', () => {
        io.value = JSON.stringify(all, null, 1);
        io.select();
      }),
      btn('从文本导入为当前构筑', () => {
        try {
          ctx.setBuild(sanitize(JSON.parse(io.value)));
        } catch {
          ctx.toast('JSON 解析失败', true);
        }
      }),
    ),
    io,
  );
}

/** C5：预设按「分组/名称」分组，可搜索、按名称或保存时间排序，并显示同一构筑最近一次的测试结果 */
function presetTable(ctx: DevCtx, all: Record<string, DevBuild>, summary: (p: DevBuild) => string): HTMLElement {
  const meta = loadMeta();
  const q = presetSearch.trim().toLowerCase();
  const label = (p: DevBuild) =>
    `${CHARACTER_MAP[p.charId]?.name} 第${p.chapterId}章W${p.wave} Lv${p.level} · ${p.weapons.map((w) => `${WEAPON_MAP[w.id]?.name}T${w.tier + 1}`).join('/')}`;
  const entries = Object.entries(all)
    .filter(([k, p]) => !q || `${k} ${summary(p)}`.toLowerCase().includes(q))
    .sort((a, b) => (presetSort === 'time' ? (meta[b[0]] ?? 0) - (meta[a[0]] ?? 0) : a[0].localeCompare(b[0])));
  const groups = new Map<string, [string, DevBuild][]>();
  for (const e of entries) {
    const g = e[0].includes('/') ? e[0].slice(0, e[0].indexOf('/')) : '未分组';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(e);
  }
  const search = h('input', {
    placeholder: '搜索预设',
    value: presetSearch,
    onchange: () => ((presetSearch = search.value), ctx.rerender()),
  });
  const out = h(
    'div',
    null,
    h(
      'div',
      { class: 'row' },
      search,
      select(
        [
          ['name', '按名称'],
          ['time', '按保存时间'],
        ],
        presetSort,
        (v) => ((presetSort = v as typeof presetSort), ctx.rerender()),
      ),
      h('span', { class: 'muted' }, '名称写成「分组/名称」即可分组'),
    ),
  );
  for (const [g, list] of groups) {
    out.append(
      h('div', { class: 'muted', style: 'margin-top:4px' }, `▸ ${g}（${list.length}）`),
      table(
        ['名称', '摘要', '最近测试', ''],
        list.map(([k, p]) => {
          const t = ctx.sb.tests.find((r) => r.build === label(p) && r.ttk !== null);
          return [
            k.includes('/') ? k.slice(k.indexOf('/') + 1) : k,
            h('span', { class: 'muted' }, summary(p)),
            t ? h('span', { title: t.label }, `TTK ${t.ttk!.toFixed(2)}s`) : '',
            h(
              'span',
              { class: 'nw' },
              btn('载入', () => ctx.setBuild(sanitize(JSON.parse(JSON.stringify(p))))),
              btn('删', () => {
                delete all[k];
                savePresets(all);
                ctx.rerender();
              }),
            ),
          ];
        }),
      ),
    );
  }
  return out;
}

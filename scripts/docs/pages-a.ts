// 文档页：角色、技能与状态、武器
import { tx } from '../../src/i18n';
import { CHARACTERS } from '../../src/data/characters';
import { WEAPONS, TIER_PRICE_MULT, isShopWeapon } from '../../src/data/weapons';
import { STATUSES } from '../../src/data/statuses';
import { STAT_INFO, type StatKey } from '../../src/data/stats';
import { SKILL_TYPE_NAME, skillHealPct, DRAIN_PER_HIT, DRAIN_MAX_PCT } from '../../src/data/skills';
import { tagName } from '../../src/i18n/apply';
import { Doc, lnk, stApply, mods, sep, img, unlockText, CLS_NAME, KIND_NAME } from './common';
import { charTraitLines } from '../../src/data/describe';
import { favoredWeapons, affinityText } from '../../src/data/affinity';
import { WEAPON_AFFIXES, FORGE } from '../../src/data/weaponAffixes';
import { pick } from '../../src/systems/Achievements';
import { EVOLUTIONS } from '../../src/data/evolutions';
import { ITEM_MAP } from '../../src/data/items';
import { RECIPES } from '../../src/data/recipes';

/** 契合标签（带契合武器数量） */
const favTags = (c: (typeof CHARACTERS)[number]) =>
  `${c.favored.map(tagName).join(tx('、', ', '))}${tx(`（${favoredWeapons(c).filter(isShopWeapon).length} 把）`, ` (${favoredWeapons(c).filter(isShopWeapon).length})`)}`;

/** 角色详情的契合武器：标签 + 数量 + 契合特效 + 最多 6 把代表武器（初始武器在前） */
function favLine(c: (typeof CHARACTERS)[number]): string {
  const all = favoredWeapons(c).filter(isShopWeapon);
  const ids = [...new Set([...c.startWeapons, ...all.map((w) => w.id)])].slice(0, 6);
  return [
    `${tx('契合标签', 'Tags')}：${favTags(c)}`,
    `${tx('契合特效（伤害 +10%）', 'Synergy effect (+10% dmg)')}：${affinityText(c.id)}`,
    `${tx('代表', 'e.g.')}：${ids.map((id) => `${img('weapon', id, 24)} ${lnk.weapon(id)}`).join(sep())}`,
  ].join('<br>');
}

export function charactersDoc(): void {
  const d = new Doc('CHARACTERS.md', tx(`角色（${CHARACTERS.length} 名）`, `Characters (${CHARACTERS.length})`), [
    tx(
      '每名角色 = 属性与特性 + 初始武器 + 专属天赋 + 主动技能 + 独特外观。默认解锁 4 名，其余每名都绑定一项[成就](ACHIEVEMENTS.md)，达成后自动解锁。',
      'Each character = stats & traits + starting weapons + a unique talent + an active skill + a unique look. 4 are unlocked by default; each of the rest is tied to one [achievement](ACHIEVEMENTS.md) and unlocks automatically once it is reached.',
    ),
    '',
    tx('技能详情见 [技能](SKILLS.md)，武器详情见 [武器](WEAPONS.md)。', 'See [Skills](SKILLS.md) and [Weapons](WEAPONS.md) for details.'),
  ]);
  const unlock = (c: (typeof CHARACTERS)[number]) => unlockText(c);
  d.h2(tx('角色一览', 'Overview'), 'overview');
  d.table(
    ['#', tx('角色', 'Character'), tx('定位', 'Role'), tx('天赋', 'Talent'), tx('契合武器', 'Synergy weapons'), tx('技能', 'Skill'), tx('解锁条件', 'Unlock')],
    CHARACTERS.map((c, i) => [
      i + 1,
      `${img('char', c.id, 32, 'webp')} ${lnk.char(c, '')}`,
      c.title,
      c.talent.name,
      favTags(c),
      `${lnk.skill(c)} ${tx(`（${SKILL_TYPE_NAME[c.skill.type]}）`, `(${SKILL_TYPE_NAME[c.skill.type]})`)}`,
      unlock(c),
    ]),
  );
  d.h2(tx('角色详情', 'Details'), 'details');
  for (const c of CHARACTERS) {
    d.card(
      `char-${c.id}`,
      `${c.name} · ${c.title}`,
      img('char', c.id, 128, 'webp'),
      `${c.name} · ${c.title}`,
      c.desc,
      [
        [tx('专属天赋', 'Talent'), `**${c.talent.name}**：${c.talent.desc}`],
        [tx('属性与特性', 'Stats & traits'), charTraitLines(c).join(tx('；', '; ')) || tx('无', 'None')],
        [tx('契合武器', 'Synergy weapons'), favLine(c)],
        [
          tx('主动技能', 'Active skill'),
          tx(
            `${lnk.skill(c)}【${SKILL_TYPE_NAME[c.skill.type]}】冷却 ${c.skill.cd}s — ${c.skill.desc}`,
            `${lnk.skill(c)} [${SKILL_TYPE_NAME[c.skill.type]}] cooldown ${c.skill.cd}s — ${c.skill.desc}`,
          ),
        ],
        [tx('解锁条件', 'Unlock'), unlock(c)],
      ],
    );
  }
  d.write();
}

export function skillsDoc(): void {
  const d = new Doc('SKILLS.md', tx('技能与状态效果', 'Skills & Status Effects'), [
    tx(
      '每名[角色](CHARACTERS.md)拥有一个主动技能（PC 空格 / 移动端右下按钮）。技能分 13 种形态，冷却按威力自动计算。',
      'Every [character](CHARACTERS.md) has one active skill (Space on PC / bottom-right button on mobile). Skills come in 13 forms; cooldowns are computed automatically from their power.',
    ),
    '',
    tx(
      '怪物攻击、道具和武器施加的 Buff / Debuff 与技能共用同一套[状态效果](#statuses)。',
      'Buffs and debuffs from monsters, items and weapons share the same [status effects](#statuses) as skills.',
    ),
  ]);
  d.h2(tx('技能规则', 'Rules'), 'rules');
  d.p(
    tx('- 伤害 = 当前所有武器平均单次伤害 × 招式系数 × (1 + 技能伤害%)', '- Damage = average hit damage of all current weapons × skill multiplier × (1 + Skill Damage%)'),
    tx('- 范围 = 基础半径 × (1 + 射程/600，限制 0.8~1.4) × (1 + 技能范围%)', '- Area = base radius × (1 + Range/600, clamped 0.8–1.4) × (1 + Skill Area%)'),
    tx(
      '- 持续时间（领域/增益/无敌/分身/施加的状态）× (1 + 技能持续%)',
      '- Durations (fields, buffs, invulnerability, clones, applied statuses) × (1 + Skill Duration%)',
    ),
    tx(
      '- 冷却 × (1 − 技能冷却缩减%，最多 −70%)；每波开始时冷却重置，技能立即可用',
      '- Cooldown × (1 − Skill Cooldown%, at most −70%); cooldowns reset at the start of every wave',
    ),
    tx(
      '- 冷却按威力自动计算：`冷却 = (8 + 0.9×伤害分 + 控制分 + 增益分) × 0.65`，限制 8~30 秒（`src/data/skills.ts`）',
      '- Cooldown is computed from power: `cooldown = (8 + 0.9×damage score + control score + buff score) × 0.65`, clamped to 8–30s (`src/data/skills.ts`)',
    ),
    tx(
      '- 默认自动释放：按技能形态判断时机（范围伤害等敌人扎堆、回复等掉血、保命技能等危险时）；可在设置中切换为手动，自动模式下也能手动释放',
      '- Skills auto-cast by default, timed by form (area skills when enemies cluster, heals when hurt, defensive skills in danger); switch to manual in Settings — you can still cast manually in auto mode',
    ),
    tx(
      '- 技能强化属性「技能伤害 / 技能范围 / 技能持续 / 技能冷却缩减」来自[道具](ITEMS.md)（技能秘籍、技能法器系列）与升级选项',
      '- Skill stats (Skill Damage / Area / Duration / Cooldown) come from [items](ITEMS.md) (the skill book and skill talisman series) and level-up choices',
    ),
  );
  d.h2(tx('技能形态', 'Skill Forms'), 'forms');
  d.table(
    [tx('形态', 'Form'), tx('角色', 'Characters')],
    Object.entries(SKILL_TYPE_NAME).map(([t, n]) => [
      `${n} \`${t}\``,
      CHARACTERS.filter((c) => c.skill.type === t)
        .map((c) => lnk.skill(c, ''))
        .join(sep()) || '-',
    ]),
  );
  d.h2(tx('角色技能', 'Character Skills'), 'skills');
  for (const c of CHARACTERS) {
    const s = c.skill;
    const title = tx(`${s.name}（${c.name}）`, `${s.name} (${c.name})`);
    const rows: [string, string | number][] = [
      [tx('角色', 'Character'), lnk.char(c)],
      [tx('形态', 'Form'), SKILL_TYPE_NAME[s.type]],
      [tx('冷却', 'Cooldown'), `${s.cd}s`],
    ];
    if (s.mult) rows.push([tx('伤害系数', 'Damage multiplier'), `×${s.mult}`]);
    if (s.radius) rows.push([tx('半径', 'Radius'), s.radius]);
    if (s.count) rows.push([tx('数量', 'Count'), s.count]);
    if (s.distance) rows.push([tx('冲刺距离', 'Dash distance'), s.distance]);
    if (s.duration) rows.push([tx('持续', 'Duration'), `${s.duration}s`]);
    if (s.status?.length) rows.push([tx('对敌施加', 'Inflicts'), stApply(s.status, '')]);
    if (s.selfStatus?.length) rows.push([tx('自身获得', 'Self gains'), stApply(s.selfStatus, '')]);
    if (s.mods) rows.push([tx('属性增益', 'Stat boost'), mods(s.mods)]);
    if (s.heal)
      rows.push([tx('回复', 'Heal'), tx(`${skillHealPct(s.heal)}% 最大生命`, `${skillHealPct(s.heal)}% Max HP`)]);
    if (s.type === 'heal')
      rows.push([
        tx('吸取', 'Drain'),
        tx(
          `每命中 1 个敌人 +${DRAIN_PER_HIT} 生命（最多 ${DRAIN_MAX_PCT * 100}% 最大生命）`,
          `+${DRAIN_PER_HIT} HP per enemy hit (max ${DRAIN_MAX_PCT * 100}% Max HP)`,
        ),
      ]);
    if (s.xp) rows.push([tx('经验', 'XP'), `+${s.xp}`]);
    d.card(`skill-${c.id}`, title, img('skill', c.id, 128, 'webp'), title, s.desc, rows);
  }
  d.h2(tx(`状态效果（${Object.keys(STATUSES).length} 种）`, `Status Effects (${Object.keys(STATUSES).length})`), 'statuses');
  d.p(
    tx(
      '玩家与敌人共用。Boss 对控制类减益有 75% 抗性（精英 50%）；玩家受到的眩晕/冰冻最长 0.8 秒，之后 1.5 秒免疫。',
      'Shared by players and enemies. Bosses resist crowd-control debuffs by 75% (elites 50%); Stun/Freeze on the player lasts at most 0.8s, followed by 1.5s of immunity.',
    ),
  );
  for (const kind of ['debuff', 'buff'] as const) {
    d.h3(kind === 'debuff' ? tx('减益', 'Debuffs') : tx('增益', 'Buffs'), `statuses-${kind}`);
    d.table(
      [tx('状态', 'Status'), tx('最大层数', 'Max stacks'), tx('效果', 'Effect')],
      Object.values(STATUSES)
        .filter((s) => s.kind === kind)
        .map((s) => [`<a id="status-${s.id}"></a>${s.name}`, s.maxStacks, s.desc]),
    );
  }
  d.write();
}

/** 武器图标的绝对地址：GitHub 渲染 Mermaid 时在沙箱里，相对路径的图片加载不到 */
const RAW = 'https://raw.githubusercontent.com/yourlin/tomageddon/main/docs/images/';

/** 合成关系图（Mermaid）：按成品类别分三张，T3 材料 → T4 → 超武，节点带武器图标 */
function craftGraph(d: Doc): void {
  const CLS = CLS_NAME();
  const ALL = new Map([...WEAPONS, ...EVOLUTIONS.map((e) => e.to)].map((w) => [w.id, w]));
  const node = (id: string, tier: number) => `${id.replace(/[^a-zA-Z0-9_]/g, '_')}_${tier}`;
  const label = (id: string, tier: number) =>
    `${node(id, tier)}["<img src='${RAW}weapon/${id}.png' width='28' height='28'/><br/>${ALL.get(id)?.name ?? id} ${tier === 4 ? tx('超武', 'Super') : `T${tier + 1}`}"]:::t${tier}`;
  d.h2(tx('合成关系图', 'Crafting Graph'), 'craft-graph');
  d.p(
    tx(
      '箭头从材料指向成品：两把 T3 武器 → T4，两把 T4 武器 → 超武（各配方还需要指定道具，见商店合成表）。T1~T3 同名两把可直接合成升一级，图中省略。',
      'Arrows point from materials to results: two T3 weapons → T4, two T4 weapons → super weapon (each recipe also needs specific items; see the crafting table in the shop). Same-name pairs combine one tier up for T1–T3 and are omitted here.',
    ),
  );
  for (const cls of ['melee', 'ranged', 'elemental'] as const) {
    const rs = RECIPES.filter((r) => ALL.get(r.to)?.cls === cls);
    const nodes = new Set<string>();
    const edges: string[] = [];
    for (const r of rs) {
      const toTier = r.kind === 'super' ? 4 : 3;
      nodes.add(label(r.to, toTier));
      for (const [id, t] of r.from) {
        nodes.add(label(id, t));
        edges.push(`  ${node(id, t)} --> ${node(r.to, toTier)}`);
      }
    }
    d.h3(tx(`${CLS[cls]}（${rs.length} 条配方）`, `${CLS[cls]} (${rs.length} recipes)`), `craft-graph-${cls}`);
    d.p(
      '```mermaid',
      'flowchart LR',
      '  classDef t2 fill:#f3e8ff,stroke:#8a4fd0',
      '  classDef t3 fill:#fff3d6,stroke:#d09a1f',
      '  classDef t4 fill:#ffe1e1,stroke:#d04a4a,stroke-width:2px',
      ...[...nodes].map((n) => `  ${n}`),
      ...[...new Set(edges)],
      '```',
    );
  }
}

export function weaponsDoc(): void {
  const CLS = CLS_NAME(),
    KIND = KIND_NAME();
  const d = new Doc('WEAPONS.md', tx(`武器（${WEAPONS.length} 把）`, `Weapons (${WEAPONS.length})`), [
    tx(
      '武器自动索敌、自动攻击，每名角色最多携带 6 把（部分[角色](CHARACTERS.md)例外）。每把武器有 T1~T4 四个品质，两把同名同品质可在商店合成升一级。',
      'Weapons aim and attack automatically; each character carries up to 6 (some [characters](CHARACTERS.md) differ). Every weapon has tiers T1–T4; two identical weapons of the same tier combine into the next tier in the shop.',
    ),
    '',
    tx(
      `价格：T1 基础价 × [${TIER_PRICE_MULT.join(', ')}]，再随波次上涨。伤害 = (基础 + Σ属性×系数) × (1+伤害%) × 类别倍率。`,
      `Price: T1 base price × [${TIER_PRICE_MULT.join(', ')}], rising with waves. Damage = (base + Σ stat × scaling) × (1 + Damage%) × class multiplier.`,
    ),
  ]);
  d.h2(tx('武器一览', 'Overview'), 'overview');
  d.table(
    [
      tx('武器', 'Weapon'),
      tx('类别', 'Class'),
      tx('攻击方式', 'Attack'),
      tx('标签', 'Tags'),
      tx('伤害 T1~T4', 'Damage T1–T4'),
      tx('冷却 T1~T4', 'Cooldown T1–T4'),
      tx('射程', 'Range'),
      tx('价格', 'Price'),
    ],
    WEAPONS.map((w) => [
      `${img('weapon', w.id)} [${w.name}](#weapon-${w.id})`,
      CLS[w.cls],
      KIND[w.kind] ?? w.kind,
      w.tags.map(tagName).join('/'),
      w.damage.join(' / '),
      w.cooldown.join(' / '),
      w.range,
      w.price,
    ]),
  );
  d.h2(tx('随机词条与打造', 'Affixes & Forging'), 'affixes');
  d.p(
    tx(
      '- T3 武器随机 1 条词条、T4 武器 2 条；词条分 I~IV 级（I 常见、IV 稀有，幸运越高越容易出高等级）',
      '- T3 weapons roll 1 random affix and T4 weapons roll 2; affixes have tiers I–IV (I common, IV rare; higher Luck favours higher tiers)',
    ),
    tx(
      `- 商店中可花番茄籽洗练：全部重洗 \`8 + 2×波次\`，单条重洗为其 2.5 倍`,
      `- Reroll affixes in the shop: all at once costs \`8 + 2×wave\`, a single affix costs 2.5× that`,
    ),
    tx(
      `- T4 武器可打造，每级伤害 +${FORGE.dmgPerLevel * 100}%，最高 +${FORGE.maxLevel}；费用随等级 ×1.45 递增，失败只扣费用不降级`,
      `- T4 weapons can be forged for +${FORGE.dmgPerLevel * 100}% damage per level, up to +${FORGE.maxLevel}; each level costs 1.45× more, and a failed forge only costs the fee`,
    ),
  );
  d.table(
    [tx('词条', 'Affix'), 'I', 'II', 'III', 'IV'],
    WEAPON_AFFIXES.map((a) => [pick(a.name).replace('{v}', 'N'), ...a.values.map(String)]),
  );
  d.table(
    [tx('打造等级', 'Forge level'), ...FORGE.chance.map((_, i) => `+${i + 1}`)],
    [[tx('成功率', 'Success'), ...FORGE.chance.map((c) => `${Math.round(c * 100)}%`)]],
  );
  for (const cls of ['melee', 'ranged', 'elemental'] as const) {
    d.h2(tx(`${CLS[cls]}武器`, `${CLS[cls]} Weapons`), `class-${cls}`);
    for (const w of WEAPONS.filter((x) => x.cls === cls)) {
      const e = w.effect ?? {};
      const effects = [
        e.burn ? tx(`灼烧 ${e.burn.dps}/秒 ${e.burn.dur}s`, `Burn ${e.burn.dps}/s for ${e.burn.dur}s`) : '',
        e.slow ? tx(`减速 ${e.slow.pct}% ${e.slow.dur}s`, `Slow ${e.slow.pct}% for ${e.slow.dur}s`) : '',
        e.stun ? tx(`眩晕 ${e.stun}s`, `Stun ${e.stun}s`) : '',
        e.explode ? tx(`爆炸半径 ${e.explode}`, `Explosion radius ${e.explode}`) : '',
        e.chain ? tx(`连锁 ${e.chain.join('/')} 次`, `Chains ${e.chain.join('/')} times`) : '',
        e.lifeSteal ? tx(`额外吸血概率 ${e.lifeSteal}%`, `+${e.lifeSteal}% Life Steal Chance`) : '',
        w.pierce ? tx(`穿透 ${w.pierce.join('/')}`, `Pierce ${w.pierce.join('/')}`) : '',
        w.bounce ? tx(`弹射 ${w.bounce.join('/')}`, `Bounce ${w.bounce.join('/')}`) : '',
        w.count ? tx(`弹丸 ${w.count.join('/')}`, `Projectiles ${w.count.join('/')}`) : '',
        w.knockback ? tx(`击退 ${w.knockback}`, `Knockback ${w.knockback}`) : '',
        w.critBonus ? tx(`额外暴击 ${w.critBonus}%`, `+${w.critBonus}% Crit Chance`) : '',
      ].filter(Boolean);
      const users = CHARACTERS.filter((c) => c.startWeapons.includes(w.id));
      d.card(`weapon-${w.id}`, w.name, img('weapon', w.id, 128, 'webp'), w.name, w.desc, [
          [tx('类别 / 方式', 'Class / attack'), `${CLS[w.cls]} / ${KIND[w.kind] ?? w.kind}`],
          [tx('标签', 'Tags'), w.tags.map(tagName).join(sep())],
          [tx('伤害 T1~T4', 'Damage T1–T4'), w.damage.join(' / ')],
          [tx('冷却 T1~T4', 'Cooldown T1–T4'), w.cooldown.map((c) => c + 's').join(' / ')],
          [tx('射程', 'Range'), w.range],
          [
            tx('属性加成', 'Scaling'),
            Object.entries(w.scaling)
              .map(([k, v]) => `${STAT_INFO[k as StatKey]?.name ?? k} ×${v}`)
              .join(tx('，', ', ')) || '-',
          ],
          [tx('暴击倍率', 'Crit multiplier'), `×${w.critMult}`],
          [tx('特效', 'Effects'), effects.join(tx('，', ', ')) || '-'],
          [tx('T1 价格', 'T1 price'), w.price],
          [tx('初始携带', 'Starting weapon of'), users.map((c) => lnk.char(c)).join(sep()) || '-'],
      ]);
    }
  }
  craftGraph(d);
  d.h2(tx(`超武（${EVOLUTIONS.length} 把）`, `Super Weapons (${EVOLUTIONS.length})`), 'evolution');
  d.p(
    tx(
      '超武只能合成：两把指定的 T4 武器 + 原催化道具 + 1 件指定的 T4（传说）道具，在商店的合成表里合成。超武伤害、冷却、射程整体强化并获得专属效果，不进商店池。',
      'Super weapons can only be crafted: two specific T4 weapons + the original catalyst item + 1 specific T4 (Legendary) item, via the crafting table in the shop. They improve damage, cooldown and range, gain a signature effect, and never appear in the shop.',
    ),
  );
  d.table(
    [tx('原武器', 'Base'), tx('催化道具', 'Catalyst'), tx('超武', 'Super weapon'), tx('T4 伤害 / 冷却 / 射程', 'T4 dmg / cd / range'), tx('说明', 'Description')],
    EVOLUTIONS.map((e) => {
      const b = WEAPONS.find((w) => w.id === e.from)!;
      const t = e.to;
      return [
        `${img('weapon', b.id)} ${lnk.weapon(b.id, '')}`,
        `${img('item', e.item)} ${ITEM_MAP[e.item].name}`,
        `${img('weapon', t.id)} **${t.name}**`,
        `${b.damage[3]}→**${t.damage[3]}** / ${b.cooldown[3]}s→**${t.cooldown[3]}s** / ${b.range}→**${t.range}**`,
        t.desc,
      ];
    }),
  );
  d.write();
}

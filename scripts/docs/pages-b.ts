// 文档页：道具、怪物、关卡
import { tx } from '../../src/i18n';
import { ALL_ITEMS, ITEMS, LEVELUP_OPTIONS, type ItemDef } from '../../src/data/items';
import { ENEMIES } from '../../src/data/enemies';
import { AFFIXES, type BossDef } from '../../src/data/bosses';
import { CHAPTERS, TERRAIN_INFO } from '../../src/data/chapters';
import { STAT_INFO, type StatKey } from '../../src/data/stats';
import { describeItem } from '../../src/data/describe';
import { BALANCE, RARITY, waveDuration, xpToNext, spawnInterval, spawnBatch } from '../../src/data/balance';
import { RARITY_BUDGET } from '../../src/data/itemGen';
import { MODIFIERS } from '../../src/data/challenges';
import { pick } from '../../src/systems/Achievements';
import { Doc, lnk, stApply, sep, img, ELITES, BOSS_ONLY, BEHAVIOR_NAME, describePattern, enemyAppear, waveRange } from './common';

export function itemsDoc(): void {
  const series = [...new Set(ALL_ITEMS.map((i) => i.series).filter(Boolean))] as string[];
  const sid = (name: string) => `series-${series.indexOf(name) + 1}`;
  const head = [tx('道具', 'Item'), tx('稀有度', 'Rarity'), tx('效果', 'Effect'), tx('价格', 'Price'), tx('上限', 'Max')];
  const itemRows = (l: ItemDef[]) => l.map((i) => [`${img('item', i.id)} ${i.name}`, RARITY[i.rarity].name, describeItem(i).join(tx('，', ', ')), i.price, i.max ?? '∞']);
  const d = new Doc('ITEMS.md', tx(`道具（${ALL_ITEMS.length} 件）`, `Items (${ALL_ITEMS.length})`), [
    tx(
      `道具是在商店购买或从宝箱获得的被动物品，可叠加。共 ${ITEMS.length} 件经典道具 + ${series.length} 个主题系列 × 10 件。`,
      `Items are stackable passives bought in the shop or found in crates: ${ITEMS.length} classic items + ${series.length} themed series × 10.`,
    ),
    '',
    tx(
      '效果中的 Buff / Debuff 见[状态效果](SKILLS.md#statuses)，属性说明见[设计文档](GDD.md)。',
      'See [status effects](SKILLS.md#statuses) for buffs/debuffs and the [design doc](GDD.md) for stats.',
    ),
  ]);
  d.h2(tx('稀有度与强度预算', 'Rarity & Power Budget'), 'rarity');
  d.p(
    tx(
      '同稀有度道具按“强度预算”生成，每点属性有单价，保证强度一致、价格合理；稀有以上带系列专属特效，史诗/传说部分带代价属性换取更高预算。传说道具从第 7 波起出现，幸运越高稀有度越高。',
      'Items of the same rarity are built from a fixed power budget with a cost per stat point, keeping power and price consistent. Rare and above carry a series-specific effect; some epics/legendaries trade a drawback stat for extra budget. Legendaries appear from wave 7; higher Luck means rarer items.',
    ),
  );
  d.table(
    [tx('稀有度', 'Rarity'), tx('数量', 'Count'), tx('强度预算', 'Budget')],
    RARITY.map((r, i) => [r.name, ALL_ITEMS.filter((x) => x.rarity === i).length, RARITY_BUDGET[i]]),
  );
  d.h2(tx('升级属性选项', 'Level-up Choices'), 'levelup');
  d.p(tx('每次升级从随机属性中选一项，数值随稀有度提高：', 'Each level-up offers random stats; values scale with rarity:'));
  d.table(
    [tx('属性', 'Stat'), tx('普通 / 稀有 / 史诗 / 传说', 'Common / Rare / Epic / Legendary')],
    LEVELUP_OPTIONS.map((o) => [STAT_INFO[o.key as StatKey]?.name ?? o.key, o.values.join(' / ')]),
  );
  d.h2(tx(`经典道具（${ITEMS.length}）`, `Classic Items (${ITEMS.length})`), 'classic');
  d.table(head, itemRows([...ITEMS].sort((a, b) => a.rarity - b.rarity)));
  d.h2(tx(`系列道具（${series.length} 个系列）`, `Item Series (${series.length})`), 'series');
  d.table(
    [tx('系列', 'Series'), tx('道具（普通→传说）', 'Items (common → legendary)')],
    series.map((s) => [
      `[${s}](#${sid(s)})`,
      ALL_ITEMS.filter((i) => i.series === s)
        .map((i) => i.name)
        .join(sep()),
    ]),
  );
  for (const s of series) {
    d.h3(s, sid(s), false);
    d.table(head, itemRows(ALL_ITEMS.filter((i) => i.series === s)));
  }
  d.write();
}

export function monstersDoc(): void {
  const BEH = BEHAVIOR_NAME();
  const regular = ENEMIES.filter((e) => !e.critter),
    critters = ENEMIES.filter((e) => e.critter);
  const d = new Doc('MONSTERS.md', tx('怪物', 'Monsters'), [
    tx(
      `小怪 ${regular.length} 种 · 地形生物 ${critters.length} 种 · 精英 ${ELITES.length} 名 · Boss ${BOSS_ONLY.length} 名 · 精英词缀 ${Object.keys(AFFIXES).length} 种。`,
      `${regular.length} monsters · ${critters.length} terrain critters · ${ELITES.length} elites · ${BOSS_ONLY.length} bosses · ${Object.keys(AFFIXES).length} elite affixes.`,
    ),
    '',
    tx(
      '每章第 5、10 波出现精英，第 15 波为 Boss，均从该章的池子中随机抽取。各章出现哪些怪物见[关卡](CHAPTERS.md)。',
      'Elites appear on waves 5 and 10 and the boss on wave 15, drawn at random from the chapter pool. See [Chapters](CHAPTERS.md) for which monsters appear where.',
    ),
    '',
    tx(
      '敌人生命与伤害随波次成长并乘以章节倍率；攻击附带的状态见[状态效果](SKILLS.md#statuses)。',
      'Enemy HP and damage grow per wave and are multiplied by the chapter multiplier; see [status effects](SKILLS.md#statuses) for inflicted statuses.',
    ),
  ]);
  const growHp = (v: number) => tx(`（每波 +${Math.round(v * 100)}%）`, ` (+${Math.round(v * 100)}%/wave)`);
  const growDmg = (v: number) => tx(`（每波 +${v}）`, ` (+${v}/wave)`);
  d.h2(tx('小怪', 'Monsters'), 'enemies');
  d.table(
    [tx('小怪', 'Monster'), tx('行为', 'Behavior'), tx('生命', 'HP'), tx('伤害', 'Damage'), tx('速度', 'Speed'), tx('掉落', 'Seeds'), tx('攻击附带', 'Inflicts')],
    regular.map((e) => [`${img('enemy', e.id)} [${e.name}](#enemy-${e.id})`, BEH[e.behavior] ?? e.behavior, `${e.hp}${growHp(e.hpGrowth)}`, `${e.dmg}${growDmg(e.dmgGrowth)}`, e.speed, e.seeds, stApply(e.onHit) || '-']),
  );
  for (const e of [...regular, ...critters]) {
    d.h3(`${e.name}${e.critter ? tx('（地形生物）', ' (terrain critter)') : ''}`, `enemy-${e.id}`, false);
    d.p(img('enemy', e.id, 96), '', `> ${e.desc}`);
    const special = [
      e.splitInto ? tx(`死亡分裂为 ${e.splitCount ?? 2} 只${lnk.enemy(e.splitInto, '')}`, `Splits into ${e.splitCount ?? 2}× ${lnk.enemy(e.splitInto, '')} on death`) : '',
      e.summon ? tx(`召唤 ${e.summonCount ?? 1} 只${lnk.enemy(e.summon, '')}`, `Summons ${e.summonCount ?? 1}× ${lnk.enemy(e.summon, '')}`) : '',
      e.healAmount ? tx(`治疗半径 ${e.healRadius} 内同伴 ${e.healAmount}`, `Heals allies within ${e.healRadius} for ${e.healAmount}`) : '',
      e.blastRadius ? tx(`自爆半径 ${e.blastRadius}`, `Blast radius ${e.blastRadius}`) : '',
      e.shootCd ? tx(`每 ${e.shootCd}s 射击${e.shots && e.shots > 1 ? ` ${e.shots} 发` : ''}`, `Shoots${e.shots && e.shots > 1 ? ` ${e.shots}×` : ''} every ${e.shootCd}s`) : '',
      e.chargeCd ? tx(`每 ${e.chargeCd}s 冲撞`, `Charges every ${e.chargeCd}s`) : '',
    ]
      .filter(Boolean)
      .join(tx('，', ', '));
    const rows: [string, string | number][] = [
      [tx('行为', 'Behavior'), BEH[e.behavior] ?? e.behavior],
      [tx('生命', 'HP'), `${e.hp}${growHp(e.hpGrowth)}`],
      [tx('伤害', 'Damage'), `${e.dmg}${growDmg(e.dmgGrowth)}`],
      [tx('速度', 'Speed'), e.speed],
      [tx('掉落番茄籽', 'Seeds dropped'), e.seeds],
    ];
    if (e.onHit) rows.push([tx('攻击附带', 'Inflicts'), stApply(e.onHit)]);
    if (special) rows.push([tx('特殊', 'Special'), special]);
    rows.push([tx('出现', 'Appears in'), enemyAppear(e.id).join(tx('；', '; ')) || tx('由其他怪物召唤/分裂', 'Summoned or split from other monsters')]);
    d.table([tx('项目', 'Field'), tx('数值', 'Value')], rows);
  }
  const bossSection = (b: BossDef) => {
    d.h3(`${b.name}${b.elite ? '' : ` · ${b.title}`}`, `boss-${b.id}`, false);
    d.p(img('boss', b.id, 96), '', `> ${b.desc}`);
    const rows: [string, string | number][] = [
      [tx('章节', 'Chapter'), lnk.chapter(b.chapter)],
      [tx('基础生命', 'Base HP'), b.hp],
      [tx('伤害', 'Damage'), b.dmg],
      [tx('速度', 'Speed'), b.speed],
      [tx('掉落番茄籽', 'Seeds dropped'), b.seeds],
      [tx('招式', 'Attacks'), b.patterns.map(describePattern).join('<br>')],
    ];
    if (b.contact) rows.push([tx('接触附带', 'Contact inflicts'), stApply(b.contact)]);
    if (b.affixes?.length) rows.push([tx('固定词缀', 'Fixed affixes'), b.affixes.map((a) => `[${AFFIXES[a].name}](#affixes)`).join(sep())]);
    if (b.phase2) {
      const p2 = b.phase2;
      const add = p2.add.map(describePattern).join(sep());
      const buff = p2.buff ? tx(`；获得 ${stApply(p2.buff)}`, `; gains ${stApply(p2.buff)}`) : '';
      rows.push([
        tx('二阶段', 'Phase two'),
        tx(
          `生命 ≤ ${p2.at * 100}%：移速 ×${p2.speedMult}，冷却 ×${p2.cdMult}；新增 ${add}${buff}`,
          `At ≤ ${p2.at * 100}% HP: speed ×${p2.speedMult}, cooldowns ×${p2.cdMult}; adds ${add}${buff}`,
        ),
      ]);
    }
    d.table([tx('项目', 'Field'), tx('数值', 'Value')], rows);
  };
  const pool = (elite: boolean) =>
    CHAPTERS.map((c) => [
      lnk.chapter(c.id),
      (elite ? ELITES : BOSS_ONLY)
        .filter((b) => b.chapter === c.id)
        .map((b) => `${img('boss', b.id)} [${b.name}](#boss-${b.id})`)
        .join(sep()),
    ]);
  d.h2(tx('精英', 'Elites'), 'elites');
  d.p(
    tx(
      '第 5、10 波出现。第 10 波起额外 +1 个随机[词缀](#affixes)，第 3 章起 +1，第 5 章起再 +1。',
      'Appear on waves 5 and 10. +1 random [affix](#affixes) from wave 10, +1 from chapter 3, and +1 more from chapter 5.',
    ),
  );
  d.table([tx('章节', 'Chapter'), tx('精英', 'Elites')], pool(true));
  ELITES.forEach(bossSection);
  d.h2('Boss', 'bosses');
  d.p(
    tx(
      '第 15 波出现，生命降到一半进入第二阶段。波次持续 90 秒，超时后 Boss 狂暴：此后每 10 秒 Boss 伤害 ×1.25，并叠加一层狂暴威压（每秒扣除玩家 3% 最大生命 × 1.25^层数，无视闪避、护甲与无敌帧，不设上限），保证战斗一定会结束。',
      'Appear on wave 15 and enter phase two at half HP. The wave lasts 90 seconds; after that the boss enrages: every 10 seconds its damage ×1.25 and one stack of enrage pressure is added (the player loses 3% Max HP × 1.25^stacks per second, ignoring dodge, armor and invulnerability, uncapped), so the fight always ends.',
    ),
  );
  d.table([tx('章节', 'Chapter'), 'Boss'], pool(false));
  BOSS_ONLY.forEach(bossSection);
  d.h2(tx('精英词缀', 'Elite Affixes'), 'affixes');
  d.p(
    tx(
      '精英随机获得词缀；第 7 波起小怪有概率以“词缀精英”形态出现（生命 ×3.5、掉落 ×4、必掉宝箱）。',
      'Elites roll random affixes; from wave 7, regular monsters may spawn as affixed champions (HP ×3.5, drops ×4, guaranteed crate).',
    ),
  );
  d.table([tx('词缀', 'Affix'), tx('效果', 'Effect')], Object.values(AFFIXES).map((a) => [a.name, a.desc]));
  d.write();
}

export function chaptersDoc(): void {
  const W = BALANCE.waves;
  const d = new Doc('CHAPTERS.md', tx(`关卡（${CHAPTERS.length} 章 × ${W.count} 波）`, `Chapters (${CHAPTERS.length} × ${W.count} waves)`), [
    tx(
      `每章 ${W.count} 波：第 ${W.eliteWaves.join('、')} 波出现[精英](MONSTERS.md#elites)，第 ${W.bossWave} 波为 [Boss](MONSTERS.md#bosses)。通关解锁下一章与新[角色](CHARACTERS.md)。`,
      `Each chapter has ${W.count} waves: [elites](MONSTERS.md#elites) on waves ${W.eliteWaves.join(' and ')}, the [boss](MONSTERS.md#bosses) on wave ${W.bossWave}. Clearing a chapter unlocks the next one and new [characters](CHARACTERS.md).`,
    ),
  ]);
  d.h2(tx('波次规则', 'Wave Rules'), 'waves');
  d.p(
    tx(
      '- 小怪生命 `基础 × (1 + 成长 × w^0.9) × 章节系数`（w = 波次−1），随波次先快后慢，与玩家成长节奏匹配；精英 / Boss 使用单独的章节倍率',
      '- 每章都从 0 级开局，章节倍率渐进生效：`1 + (倍率−1) × (0.1 + 0.9 × (波次−1)/14)`',
      '- Monster HP `base × (1 + growth × w^0.9) × chapter factor` (w = wave−1) grows fast early and slower later, matching player growth; elites/bosses use their own chapter multiplier',
      '- Every chapter starts at level 0, so chapter multipliers ramp in: `1 + (mult−1) × (0.1 + 0.9 × (wave−1)/14)`',
    ),
    tx(
      '- 波次时长 `min(20 + 5×(波次−1), 60)` 秒，Boss 波 90 秒；每波开始生命回满',
      '- Wave length `min(20 + 5×(wave−1), 60)` seconds, boss wave 90 seconds; HP refills at the start of each wave',
    ),
    tx(
      '- 波次结束：结算收获与利息 → 升级选属性 → 开宝箱 → 商店（买卖、合成、刷新、锁定）',
      '- After each wave: harvest & interest → level-up choices → open crates → shop (buy, sell, combine, reroll, lock)',
    ),
  );
  d.table(
    [tx('波次', 'Wave'), tx('时长(s)', 'Length (s)'), tx('刷怪间隔(s)', 'Spawn interval (s)'), tx('每批数量', 'Batch size'), tx('升级所需经验', 'XP to level')],
    Array.from({ length: W.count }, (_, i) => i + 1).map((w) => [w, waveDuration(w), spawnInterval(w).toFixed(2), spawnBatch(w), xpToNext(w)]),
  );
  d.h2(tx('章节', 'Chapters'), 'chapters');
  for (const c of CHAPTERS) {
    d.h3(tx(`${c.name}（${c.subtitle}）`, c.name), `chapter-${c.id}`);
    d.p(`> ${c.desc}`);
    d.table(
      [tx('项目', 'Field'), tx('内容', 'Value')],
      [
        [tx('难度倍率', 'Difficulty'), tx(`生命 ×${c.hpMult} · 伤害 ×${c.dmgMult} · 速度 ×${c.speedMult}`, `HP ×${c.hpMult} · damage ×${c.dmgMult} · speed ×${c.speedMult}`)],
        [tx('地形机关', 'Terrain'), (TERRAIN_INFO[c.id] ?? []).join('<br>')],
        [tx('精英池', 'Elite pool'), ELITES.filter((b) => b.chapter === c.id).map((b) => `${img('boss', b.id, 24)} ${lnk.boss(b)}`).join(sep())],
        [tx('Boss 池', 'Boss pool'), BOSS_ONLY.filter((b) => b.chapter === c.id).map((b) => `${img('boss', b.id, 24)} ${lnk.boss(b)}`).join(sep())],
      ],
    );
    const w = c.pool.reduce((a, p) => a + p.weight, 0);
    d.p(tx('**怪物池**', '**Monster pool**'));
    d.table(
      [tx('小怪', 'Monster'), tx('出现波次', 'Waves'), tx('权重', 'Weight')],
      c.pool.map((p) => [`${img('enemy', p.enemy)} ${lnk.enemy(p.enemy)}`, waveRange(p.from, p.to), `${p.weight} (${Math.round((p.weight / w) * 100)}%)`]),
    );
  }
  d.h2(tx('无尽模式', 'Endless Mode'), 'endless');
  d.p(
    tx(
      `通关某章后，可在选角界面开启该章的无尽模式：不限波数，每 ${W.bossWave} 波一轮（第 5 / 10 波精英、第 15 波 Boss），精英与 Boss 每轮重新抽取，第 30 波起 Boss 来自全部章节。第 ${W.count} 波之后怪物生命每波 ×${BALANCE.endless.hp}、伤害每波 ×${BALANCE.endless.dmg}（复利），收入随商店涨价同步增长，倒下为止。`,
      `After clearing a chapter, its Endless mode can be turned on from the character screen: no wave limit, ${W.bossWave}-wave cycles (elites on waves 5/10, a boss on 15), elites and bosses rerolled every cycle, bosses from every chapter from wave 30. After wave ${W.count}, monster HP ×${BALANCE.endless.hp} and damage ×${BALANCE.endless.dmg} per wave (compounding); income keeps pace with shop prices. It ends when you fall.`,
    ),
  );
  d.h2(tx('每日 / 每周挑战', 'Daily / Weekly Challenges'), 'challenges');
  d.p(
    tx(
      '由日期种子决定角色、章节与规则修饰，商店、升级选项、宝箱、精英与 Boss 也由种子决定——同一天（同一周）所有玩家面对同一套随机结果。挑战会临时借用角色，不需要解锁；成绩记录为个人最佳。',
      'A date seed decides the character, chapter and rule modifiers, and also the shops, level-up choices, crates, elites and bosses — everyone faces the same rolls on the same day (week). Characters are lent for the challenge; your personal best is recorded.',
    ),
    '',
    tx(
      '- **每日挑战**：第 1~3 章随机一章 · 15 波 · 2 个修饰；得分 = 波次×200 + 击杀 + 等级×20，通关再加 3000 + 剩余时间奖励',
      '- **Daily**: a random chapter 1–3 · 15 waves · 2 modifiers; score = wave×200 + kills + level×20, plus 3000 and a time bonus on a clear',
    ),
    tx('- **每周挑战**：第 2~5 章随机一章 · 无尽模式 · 3 个修饰；得分 = 波次×500 + 击杀', '- **Weekly**: a random chapter 2–5 · Endless · 3 modifiers; score = wave×500 + kills'),
  );
  d.table(
    [tx('规则修饰', 'Modifier'), tx('效果', 'Effect')],
    MODIFIERS.map((m) => [`${m.icon} ${pick(m.name)}`, pick(m.desc)]),
  );
  d.write();
}

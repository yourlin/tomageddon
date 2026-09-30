// 文档页：全部数值总表 DATA_TABLES.md
import { tx } from '../../src/i18n';
import { CHARACTERS } from '../../src/data/characters';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES, AFFIXES } from '../../src/data/bosses';
import { WEAPONS, TIER_PRICE_MULT } from '../../src/data/weapons';
import { ALL_ITEMS } from '../../src/data/items';
import { CHAPTERS } from '../../src/data/chapters';
import { STATUSES } from '../../src/data/statuses';
import { describeMods } from '../../src/data/stats';
import { describeItem } from '../../src/data/describe';
import { SKILL_TYPE_NAME } from '../../src/data/skills';
import { RARITY, waveDuration, xpToNext, enemyHp, enemyDamage, spawnInterval, spawnBatch } from '../../src/data/balance';
import { Doc, ELITES, BOSS_ONLY, CLS_NAME, KIND_NAME, BEHAVIOR_NAME, sep, waveRange, unlockText } from './common';

export function tablesDoc(): void {
  const CLS = CLS_NAME(),
    KIND = KIND_NAME(),
    BEH = BEHAVIOR_NAME();
  const stName = (l?: { id: keyof typeof STATUSES }[]) => (l ?? []).map((s) => STATUSES[s.id].name).join(sep());
  const d = new Doc('DATA_TABLES.md', tx('番茄酱 Tomageddon · 数值表', 'Tomageddon · Data Tables'), [
    tx(
      `内容总量：角色 ${CHARACTERS.length} · 武器 ${WEAPONS.length} · 道具 ${ALL_ITEMS.length} · 小怪 ${ENEMIES.length} · 精英 ${ELITES.length} · Boss ${BOSS_ONLY.length} · 词缀 ${Object.keys(AFFIXES).length} · 状态 ${Object.keys(STATUSES).length} · 章节 ${CHAPTERS.length}`,
      `Content: ${CHARACTERS.length} characters · ${WEAPONS.length} weapons · ${ALL_ITEMS.length} items · ${ENEMIES.length} monsters · ${ELITES.length} elites · ${BOSS_ONLY.length} bosses · ${Object.keys(AFFIXES).length} affixes · ${Object.keys(STATUSES).length} statuses · ${CHAPTERS.length} chapters`,
    ),
  ]);
  d.h2(tx('角色', 'Characters'), 'characters');
  d.table(
    [tx('角色', 'Character'), tx('定位', 'Role'), tx('属性修正', 'Modifiers'), tx('被动', 'Traits'), tx('技能', 'Skill'), tx('冷却', 'Cooldown'), tx('解锁', 'Unlock')],
    CHARACTERS.map((c) => [
      c.name,
      c.title,
      describeMods(c.mods).join(tx('，', ', ')),
      c.traits.join(tx('；', '; ')),
      `${c.skill.name} [${SKILL_TYPE_NAME[c.skill.type]}] ${c.skill.desc}`,
      `${c.skill.cd}s`,
      unlockText(c),
    ]),
  );
  d.h2('Buff / Debuff', 'statuses');
  d.table(
    [tx('状态', 'Status'), tx('类型', 'Type'), tx('最大层数', 'Max stacks'), tx('效果', 'Effect')],
    Object.values(STATUSES).map((s) => [s.name, s.kind === 'buff' ? tx('增益', 'Buff') : tx('减益', 'Debuff'), s.maxStacks, s.desc]),
  );
  d.h2(tx('精英词缀', 'Elite Affixes'), 'affixes');
  d.table([tx('词缀', 'Affix'), tx('效果', 'Effect')], Object.values(AFFIXES).map((a) => [a.name, a.desc]));
  d.h2(tx('武器', 'Weapons'), 'weapons');
  d.p(tx(`价格：T1 基础价 × [${TIER_PRICE_MULT.join(', ')}]，再按波次上涨。`, `Price: T1 base × [${TIER_PRICE_MULT.join(', ')}], rising with waves.`));
  d.table(
    [tx('武器', 'Weapon'), tx('类型', 'Type'), tx('伤害 T1~T4', 'Damage T1–T4'), tx('冷却 T1~T4', 'Cooldown T1–T4'), tx('射程', 'Range'), tx('暴击倍率', 'Crit mult'), tx('价格', 'Price')],
    WEAPONS.map((w) => [w.name, `${CLS[w.cls]}/${KIND[w.kind] ?? w.kind}`, w.damage.join(' / '), w.cooldown.join(' / '), w.range, `x${w.critMult}`, w.price]),
  );
  d.h2(tx('小怪', 'Monsters'), 'monsters');
  d.table(
    [tx('怪物', 'Monster'), tx('生命', 'HP'), tx('成长', 'Growth'), tx('伤害', 'Damage'), tx('成长', 'Growth'), tx('速度', 'Speed'), tx('掉落', 'Seeds'), tx('行为', 'Behavior'), tx('附带减益', 'Inflicts')],
    ENEMIES.map((e) => [e.name, e.hp, `+${Math.round(e.hpGrowth * 100)}%`, e.dmg, `+${e.dmgGrowth}`, e.speed, e.seeds, BEH[e.behavior] ?? e.behavior, stName(e.onHit) || '-']),
  );
  d.h2(tx('精英与 Boss', 'Elites & Bosses'), 'bosses');
  d.table(
    [tx('名称', 'Name'), tx('类型', 'Type'), tx('章节', 'Chapter'), tx('基础生命', 'Base HP'), tx('伤害', 'Damage'), tx('速度', 'Speed'), tx('固定词缀', 'Fixed affixes'), tx('二阶段', 'Phase two')],
    BOSSES.map((b) => [
      b.name,
      b.elite ? tx('精英', 'Elite') : 'Boss',
      b.chapter,
      b.hp,
      b.dmg,
      b.speed,
      (b.affixes ?? []).map((a) => AFFIXES[a].name).join(sep()) || '-',
      b.phase2 ? `${b.phase2.at * 100}% HP` : '-',
    ]),
  );
  d.h2(tx('章节', 'Chapters'), 'chapters');
  d.table(
    [tx('章节', 'Chapter'), tx('生命倍率', 'HP mult'), tx('伤害倍率', 'Damage mult'), tx('速度倍率', 'Speed mult'), tx('怪物池（出现波次）', 'Monster pool (waves)')],
    CHAPTERS.map((c) => [
      c.name,
      c.hpMult,
      c.dmgMult,
      c.speedMult,
      c.pool.map((p) => `${ENEMIES.find((e) => e.id === p.enemy)?.name ?? p.enemy}(${waveRange(p.from, p.to)})`).join(' '),
    ]),
  );
  d.h2(tx('波次成长（第一章 霉菌团为例）', 'Wave Scaling (Chapter 1, Mold Blob)'), 'waves');
  d.table(
    [tx('波次', 'Wave'), tx('时长(s)', 'Length (s)'), tx('刷怪间隔(s)', 'Spawn interval (s)'), tx('每批数量', 'Batch'), tx('生命', 'HP'), tx('伤害', 'Damage'), tx('升级经验', 'XP to level')],
    Array.from({ length: 15 }, (_, i) => i + 1).map((w) => [w, waveDuration(w), spawnInterval(w).toFixed(2), spawnBatch(w), enemyHp(5, 0.55, w, 1), enemyDamage(1, 0.6, w, 1), xpToNext(w)]),
  );
  d.h2(tx(`道具（共 ${ALL_ITEMS.length} 件）`, `Items (${ALL_ITEMS.length})`), 'items');
  for (let r = 0; r < 4; r++) {
    const list = ALL_ITEMS.filter((i) => i.rarity === r);
    d.h3(`${RARITY[r].name} (${list.length})`, `items-${r}`);
    d.table(
      [tx('道具', 'Item'), tx('系列', 'Series'), tx('效果', 'Effect'), tx('价格', 'Price'), tx('上限', 'Max')],
      list.map((i) => [i.name, i.series ?? tx('经典', 'Classic'), describeItem(i).join(tx('，', ', ')), i.price, i.max ?? '∞']),
    );
  }
  d.write();
}

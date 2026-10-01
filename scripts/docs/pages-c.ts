// 文档页：成就与角色购买、更新日志
import { tx } from '../../src/i18n';
import { CHARACTERS } from '../../src/data/characters';
import { ACHIEVEMENTS, ACH_CATEGORY_NAME, TIER_MEDALS, type AchCategory, type AchievementDef } from '../../src/data/achievements';
import { achText, tierGoal, pick, pointsTotal } from '../../src/systems/Achievements';
import { Doc, lnk, img, unlockText } from './common';
import { BOSS_MAP } from '../../src/data/bosses';
import { CHANGELOG } from '../../src/data/changelog';

/** 条件文字：多级成就把目标值换成 N */
const condText = (a: AchievementDef): string =>
  a.tiers.length > 1 ? achText(a, 'desc', 0).replace(tierGoal(a, 0).toLocaleString(), 'N') : achText(a, 'desc', 0);

/** 各等级：🥉 100（+10 点） */
function tiersText(a: AchievementDef): string {
  return a.tiers
    .map((t, i) => {
      const medal = a.tiers.length === 1 ? TIER_MEDALS[2] : TIER_MEDALS[i];
      return `${medal} ${tierGoal(a, i).toLocaleString()}${tx(`（+${t.points} 点）`, ` (+${t.points} pts)`)}`;
    })
    .join('<br>');
}

export function achievementsDoc(): void {
  const global = ACHIEVEMENTS.filter((a) => a.category !== 'character');
  void global;
  const d = new Doc('ACHIEVEMENTS.md', tx(`成就（${ACHIEVEMENTS.length} 项）`, `Achievements (${ACHIEVEMENTS.length})`), [
    tx(
      `成就分为多个等级（🥉 铜 → 🥈 银 → 🥇 金 → 💎 钻石，单级成就直接为金牌），每达成一级获得成就点，全部成就点共 ${pointsTotal()} 点。`,
      `Achievements have several tiers (🥉 Bronze → 🥈 Silver → 🥇 Gold → 💎 Diamond; single-tier ones award Gold). Every tier grants achievement points — ${pointsTotal()} in total.`,
    ),
    '',
    tx(
      '成就点用于在选角界面购买[角色](CHARACTERS.md)；部分角色需要先达成指定成就才能购买。解锁时屏幕顶部会弹出提示，主菜单「成就」可查看全部进度。',
      'Points buy [characters](CHARACTERS.md) on the character select screen; some characters also require a specific achievement. Unlocks pop up at the top of the screen, and the main menu "Awards" screen shows all progress.',
    ),
  ]);
  d.h2(tx('角色价格', 'Character Prices'), 'prices');
  d.table(
    [tx('角色', 'Character'), tx('解锁方式', 'How to unlock')],
    [...CHARACTERS].sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0)).map((c) => [`${img('char', c.id)} ${lnk.char(c)}`, unlockText(c, '')]),
  );
  for (const cat of Object.keys(ACH_CATEGORY_NAME) as AchCategory[]) {
    if (cat === 'character' || cat === 'slayer') continue;
    // 怪物 / 武器 / 收藏 / 技能这类按对象生成的成就，附上对应图片
    d.h2(pick(ACH_CATEGORY_NAME[cat]), `cat-${cat}`);
    d.table(
      [tx('成就', 'Achievement'), tx('条件', 'Condition'), tx('等级目标与奖励', 'Tier goals & points')],
      ACHIEVEMENTS.filter((a) => a.category === cat && !a.bossId)
        .map((a) => [`<a id="ach-${a.id}"></a>${a.icon} ${achText(a, 'name', 0)}`, condText(a), tiersText(a)]),
    );
  }
  d.h2(pick(ACH_CATEGORY_NAME.slayer), 'cat-slayer');
  d.p(
    tx(
      '每名精英与 Boss 各一项成就，按击败次数分级：精英 1 / 5 / 20 次（+8 / +15 / +40 点），Boss 1 / 5 / 15 次（+20 / +40 / +80 点）。',
      'One achievement per elite and boss, tiered by kills: elites 1 / 5 / 20 (+8 / +15 / +40 pts), bosses 1 / 5 / 15 (+20 / +40 / +80 pts).',
    ),
  );
  d.table(
    [tx('精英 / Boss', 'Elite / Boss'), tx('章节', 'Chapter'), tx('成就', 'Achievement'), tx('等级目标与奖励', 'Tier goals & points')],
    ACHIEVEMENTS.filter((a) => a.category === 'slayer' && a.bossId).map((a) => {
      const b = BOSS_MAP[a.bossId!];
      return [`${img('boss', b.id)} ${lnk.boss(b)}<a id="ach-${a.id}"></a>`, lnk.chapter(b.chapter), achText(a, 'name', 0), tiersText(a)];
    }),
  );
  d.h2(pick(ACH_CATEGORY_NAME.character), 'cat-character');
  const fams = ['runs', 'wins', 'wave', 'level', 'kills', 'elite', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5'];
  const sample = fams.map((f) => ACHIEVEMENTS.find((a) => a.id === `char_${f}_${CHARACTERS[0].id}`)!);
  d.p(
    tx(`每名角色 ${fams.length} 项成就（以${CHARACTERS[0].name}为例）：`, `${fams.length} achievements per character (${CHARACTERS[0].name} shown):`),
    '',
  );
  d.table(
    [tx('成就', 'Achievement'), tx('条件', 'Condition'), tx('等级目标与奖励', 'Tier goals & points')],
    sample.map((a) => [`${a.icon} ${achText(a, 'name', 0)}`, condText(a), tiersText(a)]),
  );
  d.write();
}

/** 更新日志：与游戏内「更新日志」同一份数据 */
export function changelogDoc(): void {
  const d = new Doc('CHANGELOG.md', tx('更新日志', 'Changelog'), [
    tx(
      '面向玩家的版本变化，与游戏内主菜单「更新日志」同一份数据（`src/data/changelog.ts`）。逐条代码改动见 [提交历史](../../commits/main)。',
      'Player-facing release notes, from the same data as the in-game "What\'s New" screen (`src/data/changelog.ts`). For change-by-change detail see the [commit history](../../commits/main).',
    ),
  ]);
  for (const e of CHANGELOG) {
    d.h2(`v${e.version} · ${e.date}`, `v${e.version.replace(/\./g, '-')}`);
    d.p(`**${pick(e.highlight)}**`, '');
    d.p(...e.items.map((it) => `- ${pick(it)}`));
  }
  d.write();
}

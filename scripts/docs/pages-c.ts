// 文档页：成就与角色购买、更新日志
import { tx } from '../../src/i18n';
import { CHARACTERS } from '../../src/data/characters';
import { ACHIEVEMENTS, ACH_CATEGORY_NAME, TIER_MEDALS, type AchCategory, type AchievementDef } from '../../src/data/achievements';
import { achText, tierGoal, pick, pointsTotal } from '../../src/systems/Achievements';
import { Doc, lnk, img, unlockText } from './common';
import { BOSS_MAP } from '../../src/data/bosses';
import { CHANGELOG } from '../../src/data/changelog';

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
  const perChar = CHARACTERS.map((c) => [ACHIEVEMENTS.find((a) => a.id === `char_runs_${c.id}`)!, ACHIEVEMENTS.find((a) => a.id === `char_wins_${c.id}`)!] as const);
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
    d.h2(pick(ACH_CATEGORY_NAME[cat]), `cat-${cat}`);
    d.table(
      [tx('成就', 'Achievement'), tx('条件', 'Condition'), tx('等级目标与奖励', 'Tier goals & points')],
      global
        .filter((a) => a.category === cat)
        .map((a) => [`<a id="ach-${a.id}"></a>${a.icon} ${achText(a, 'name', 0)}`, achText(a, 'desc', 0).replace(/[\d,]+/, 'N'), tiersText(a)]),
    );
  }
  d.h2(pick(ACH_CATEGORY_NAME.slayer), 'cat-slayer');
  d.p(tx('每名精英与 Boss 首次击败时解锁，精英 +10 点，Boss +20 点。', 'Unlocked the first time you defeat each elite and boss: +10 pts per elite, +20 per boss.'));
  d.table(
    [tx('精英 / Boss', 'Elite / Boss'), tx('章节', 'Chapter'), tx('成就', 'Achievement'), tx('奖励', 'Reward')],
    ACHIEVEMENTS.filter((a) => a.category === 'slayer').map((a) => {
      const b = BOSS_MAP[a.bossId!];
      return [`${img('boss', b.id)} ${lnk.boss(b)}<a id="ach-${a.id}"></a>`, lnk.chapter(b.chapter), achText(a, 'name', 0), `+${a.tiers[0].points}`];
    }),
  );
  d.h2(pick(ACH_CATEGORY_NAME.character), 'cat-character');
  const [r0, w0] = perChar[0];
  d.p(
    tx(
      `每名角色两项成就：「${achText(r0, 'name').replace(CHARACTERS[0].name, 'X')}」使用该角色开局，「${achText(w0, 'name').replace(CHARACTERS[0].name, 'X')}」使用该角色通关。`,
      `Two achievements per character: "${achText(r0, 'name').replace(CHARACTERS[0].name, 'X')}" for starting runs as them and "${achText(w0, 'name').replace(CHARACTERS[0].name, 'X')}" for clearing runs as them.`,
    ),
  );
  d.table(
    [tx('角色', 'Character'), tx('开局次数', 'Runs started'), tx('通关次数', 'Runs cleared')],
    perChar.map(([r, w], i) => [
      `${img('char', CHARACTERS[i].id)} ${lnk.char(CHARACTERS[i])}<a id="ach-${r.id}"></a><a id="ach-${w.id}"></a>`,
      tiersText(r),
      tiersText(w),
    ]),
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

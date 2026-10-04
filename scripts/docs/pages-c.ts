// 文档页：成就与角色购买、更新日志
import { tx } from '../../src/i18n';
import { CHARACTERS } from '../../src/data/characters';
import { ACHIEVEMENTS, ACH_CATEGORY_NAME, TIER_MEDALS, type AchCategory, type AchievementDef } from '../../src/data/achievements';
import { achText, tierGoal, pick, pointsTotal } from '../../src/systems/Achievements';
import { Doc, lnk, img, unlockText } from './common';
import { BOSS_MAP } from '../../src/data/bosses';
import { CHANGELOG } from '../../src/data/changelog';
import { BRANCHES, TALENT_NODES, branchCost, type NodeKind } from '../../src/data/talentTree';
import { nodeText, talentPointsTotal } from '../../src/systems/TalentTree';
import { ACH_MAP } from '../../src/data/achievements';

/** 条件文字：多级成就把目标值换成 N */
const condText = (a: AchievementDef): string =>
  a.tiers.length > 1 ? achText(a, 'desc', 0).replace(tierGoal(a, 0).toLocaleString(), 'N') : achText(a, 'desc', 0);

/** 各等级：🥉 100（+10 点） */
function tiersText(a: AchievementDef): string {
  return a.tiers
    .map((t, i) => {
      const medal = a.tiers.length === 1 ? TIER_MEDALS[2] : TIER_MEDALS[i];
      const tp = a.tp?.[i] ? tx(` · 天赋点 +${a.tp[i]}`, ` · +${a.tp[i]} talent`) : '';
      return `${medal} ${tierGoal(a, i).toLocaleString()}${tx(`（+${t.points} 点${tp}）`, ` (+${t.points} pts${tp})`)}`;
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
      '除默认的 4 名外，每名[角色](CHARACTERS.md)都绑定一项成就，达成该成就的指定等级后自动解锁；成就点只作为累计成绩展示。解锁时屏幕顶部会弹出提示，主菜单「成就」可查看全部进度，可解锁角色的成就会标出 🔓。',
      'Apart from the 4 starters, every [character](CHARACTERS.md) is tied to one achievement and unlocks automatically once that achievement reaches the required tier; points are only a running score. Unlocks pop up at the top of the screen, and the main menu "Awards" screen shows all progress, marking achievements that unlock a character with 🔓.',
    ),
  ]);
  d.h2(tx('角色价格', 'Character Prices'), 'prices');
  d.table(
    [tx('角色', 'Character'), tx('解锁方式', 'How to unlock')],
    [...CHARACTERS].sort((a, b) => Number(!!a.unlock) - Number(!!b.unlock)).map((c) => [`${img('char', c.id)} ${lnk.char(c)}`, unlockText(c, '')]),
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

/** 天赋树：方向、节点、天赋点来源 */
export function talentsDoc(): void {
  const total = talentPointsTotal();
  const avg = BRANCHES.reduce((a, b) => a + branchCost(b.id), 0) / BRANCHES.length;
  const kind: Record<NodeKind, string> = {
    core: tx('核心', 'Core'),
    minor: tx('属性', 'Attribute'),
    notable: tx('特殊能力', 'Ability'),
    star: tx('明星（5 级）', 'Star (5 ranks)'),
    keystone: tx('终极', 'Keystone'),
  };
  const d = new Doc('TALENTS.md', tx('天赋树', 'Talent Tree'), [
    tx(
      `天赋树是跨局成长：完成里程碑[成就](ACHIEVEMENTS.md)获得天赋点，在主菜单「天赋」里加点，下一局开局生效，可随时免费重置。共 ${BRANCHES.length} 个专精方向、${TALENT_NODES.length} 个天赋；全部 ${total} 个天赋点大约够精通 ${(total / avg).toFixed(1)} 个方向（每个方向点满约 ${Math.round(avg)} 点）。`,
      `The talent tree is cross-run progression: milestone [achievements](ACHIEVEMENTS.md) grant talent points, which you spend under "Talents" on the main menu; they apply from your next run and can be reset for free at any time. ${BRANCHES.length} branches, ${TALENT_NODES.length} talents; all ${total} points master about ${(total / avg).toFixed(1)} branches (~${Math.round(avg)} points each).`,
    ),
    '',
    tx(
      '每个方向是一张地图：核心天赋在中心，道路向外延展，要先点亮相连的上一个天赋才能继续；大多数天赋只加一种属性，攻击与防御数值克制；道路尽头是特殊能力，少数明星天赋可以点 5 级；终极天赋需要在该方向投入足够点数。',
      'Each branch is a map: the core talent sits in the middle and roads lead outward — you must unlock the connected talent before moving on. Most talents add a single stat, with attack and defense kept small; roads end in special abilities, a few star talents go up to 5 ranks, and keystones need enough points spent in the branch.',
    ),
  ]);
  d.h2(tx('天赋点来源', 'Talent Point Sources'), 'sources');
  d.table(
    [tx('成就', 'Achievement'), tx('各等级天赋点', 'Points per tier')],
    Object.values(ACH_MAP)
      .filter((a) => a.tp)
      .map((a) => [`[${a.icon} ${achText(a, 'name', 0)}](ACHIEVEMENTS.md#ach-${a.id})`, a.tp!.map((x, i) => `${TIER_MEDALS[a.tiers.length === 1 ? 2 : i]} +${x}`).join(' · ')]),
  );
  for (const b of BRANCHES) {
    d.h2(`${pick(b.name)} · ${pick(b.land)}（${branchCost(b.id)} ${tx('点', 'pts')}）`, `branch-${b.id}`);
    d.p(pick(b.desc));
    d.table(
      [tx('天赋', 'Talent'), tx('类型', 'Type'), tx('前置', 'Requires'), tx('效果（满级）', 'Effect (max rank)')],
      TALENT_NODES.filter((n) => n.branch === b.id).map((n) => [
        `${n.icon} ${nodeText(n, 'name')}`,
        `${kind[n.kind]}${n.max > 1 ? ` · ${n.max} ${tx('级', 'ranks')}` : ''}`,
        [n.parent ? nodeText(TALENT_NODES.find((x) => x.id === n.parent)!, 'name') : '—', n.needPoints ? tx(`本方向 ${n.needPoints} 点`, `${n.needPoints} pts in branch`) : '']
          .filter(Boolean)
          .join(' · '),
        nodeText(n, 'desc', n.max),
      ]),
    );
  }
  d.write();
}

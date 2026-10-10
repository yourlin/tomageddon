// 0.5.0 新系统文档（M1）：RELICS 遗物 · DANGER 番茄危机 · QUESTS 角色任务、觉醒与熟练度
import { tx, lang } from '../../src/i18n';
import { Doc } from './common';
import { RELICS, RELIC_SETS, RELIC_KIND_INFO, RELIC_SET_SIZE, describeRelic, type RelicKind } from '../../src/data/relics';
import { DANGER_LEVELS } from '../../src/data/danger';
import { dangerMult } from '../../src/data/balance';
import { CHARACTERS } from '../../src/data/characters';
import { questsOf } from '../../src/data/quests';
import { AWAKENINGS } from '../../src/data/awakenings';
import { MASTERY_MAX, MASTERY_REWARDS, masteryNeed } from '../../src/systems/Progress';
import { WEAPONS } from '../../src/data/weapons';

const pick = (t: [string, string]) => (lang === 'en' ? t[1] : t[0]);
const weaponName = (id: string) => WEAPONS.find((w) => w.id === id)?.name ?? id;
const join = (l: string[]) => l.join(tx('；', '; ')) || '—';

export function relicsDoc(): void {
  const d = new Doc('RELICS.md', tx('遗物', 'Relics'), [
    tx(
      `遗物是 0.5.0 新增的局内收藏：每件都会改变规则，而不只是加属性。共 ${RELICS.length} 件、${RELIC_SETS.length} 个套装。获取途径：第 5、10 波精英被击败后三选一，无尽模式每 10 波一次，神秘商人偶尔出售。集齐同套装 ${RELIC_SET_SIZE} 件触发额外效果。所有效果文字都由数据生成。`,
      `Relics are new in 0.5.0: each one bends the rules instead of just adding stats. ${RELICS.length} relics and ${RELIC_SETS.length} sets. Sources: a pick-of-3 after the wave 5 and wave 10 elites, one every 10 waves in Endless, and occasionally from the Mysterious Merchant. Collecting ${RELIC_SET_SIZE} relics of the same set triggers a bonus. All effect text is generated from data.`,
    ),
  ]);
  for (const k of ['boon', 'trade', 'curse'] as RelicKind[]) {
    const list = RELICS.filter((r) => r.kind === k);
    d.h2(`${pick(RELIC_KIND_INFO[k].name)}${tx(`（${list.length}）`, ` (${list.length})`)}`, `kind-${k}`);
    d.table(
      [tx('遗物', 'Relic'), tx('套装', 'Set'), tx('效果', 'Effect')],
      list.map((r) => [
        `${r.icon} ${pick(r.name)}`,
        r.set ? pick(RELIC_SETS.find((s) => s.id === r.set)?.name ?? [r.set, r.set]) : '—',
        join(describeRelic(r, weaponName)),
      ]),
    );
  }
  d.h2(tx('套装', 'Sets'), 'sets');
  d.table(
    [tx('套装', 'Set'), tx('成员', 'Members'), tx(`集齐 ${RELIC_SET_SIZE} 件`, `${RELIC_SET_SIZE}-piece bonus`)],
    RELIC_SETS.map((s) => [
      pick(s.name),
      RELICS.filter((r) => r.set === s.id)
        .map((r) => `${r.icon} ${pick(r.name)}`)
        .join(tx('、', ', ')),
      join(describeRelic(s, weaponName)),
    ]),
  );
  d.write();
}

export function dangerDoc(): void {
  const d = new Doc('DANGER.md', tx('番茄危机', 'Tomato Danger'), [
    tx(
      `番茄危机是通关后的难度阶梯，共 ${DANGER_LEVELS.length} 级：通关某章的第 N 级后解锁该章第 N+1 级，每级在之前所有规则的基础上再叠加一条。危机越高，局后的天赋点、番茄籽与金番茄越多。危机 10 / 15 / 20 时 Boss 会多出招式；任意章节通关危机 20 的角色头像加金框。`,
      `Tomato Danger is the post-clear difficulty ladder with ${DANGER_LEVELS.length} levels: clearing level N of a chapter unlocks level N+1 for that chapter, and each level stacks one more rule on top of all previous ones. Higher Danger gives more talent points, seeds and Golden Tomatoes after the run. Bosses gain extra moves at Danger 10 / 15 / 20; a character who clears Danger 20 in any chapter gets a gold portrait frame.`,
    ),
  ]);
  d.h2(tx('等级一览', 'Levels'), 'levels');
  d.table(
    [tx('等级', 'Level'), tx('新增规则', 'New rule'), tx('敌人生命（累计）', 'Enemy HP (total)'), tx('敌人伤害（累计）', 'Enemy damage (total)'), tx('奖励倍率', 'Reward')],
    DANGER_LEVELS.map((l) => {
      const m = dangerMult(l.level);
      return [l.level, `${l.icon} ${pick(l.name)}${tx('：', ': ')}${pick(l.desc)}`, `×${m.hp.toFixed(2)}`, `×${m.dmg.toFixed(2)}`, `×${m.reward}`];
    }),
  );
  d.write();
}

export function questsDoc(): void {
  const d = new Doc('QUESTS.md', tx('角色任务与熟练度', 'Character Quests & Mastery'), [
    tx(
      `每名角色有 3 个专属任务，全部完成后解锁「觉醒」——一个改变玩法的被动，可以在选角界面随时开关。用某名角色打局会积累该角色的熟练度（1–${MASTERY_MAX} 级）。`,
      `Each character has 3 personal quests; completing all of them unlocks an Awakening — a play-changing passive you can toggle on the character select screen. Playing a character builds that character's Mastery (levels 1–${MASTERY_MAX}).`,
    ),
  ]);
  d.h2(tx('熟练度', 'Mastery'), 'mastery');
  d.table(
    [tx('等级', 'Level'), tx('累计经验', 'Total XP')],
    Array.from({ length: MASTERY_MAX }, (_, i) => [i + 1, masteryNeed(i + 1)]),
  );
  d.table(
    [tx('等级', 'Level'), tx('奖励', 'Reward')],
    MASTERY_REWARDS.map((r) => [r.lv, pick(r.desc)]),
  );
  d.h2(tx('各角色任务与觉醒', 'Quests & Awakenings'), 'chars');
  d.table(
    [tx('角色', 'Character'), tx('任务', 'Quests'), tx('觉醒', 'Awakening')],
    CHARACTERS.map((c) => {
      const aw = AWAKENINGS[c.id];
      return [
        c.name,
        questsOf(c.id)
          .map((q) => `${pick(q.name)}${tx('：', ': ')}${pick(q.desc)}`)
          .join('\n'),
        aw ? `**${pick(aw.name)}**${tx('：', ': ')}${pick(aw.desc)}` : '—',
      ];
    }),
  );
  d.write();
}

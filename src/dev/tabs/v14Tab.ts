// 「新系统」页（H3–H8）：遗物、真实对局（无尽跳波 / 事件波 / 危险路线）、每日挑战预览、角色任务与熟练度、内存存档编辑器。
// 开发者模式下存档不写盘（Save.disablePersist），这里的所有改动只留在内存里。
import { h, btn, select, num, check, table } from '../dom';
import type { DevCtx } from '../ctx';
import { GameScene } from '../../scenes/GameScene';
import { applyBuild } from '../build';
import { run } from '../../systems/RunState';
import { save, normalize } from '../../systems/Save';
import { CHARACTERS } from '../../data/characters';
import { CHAPTERS } from '../../data/chapters';
import { RELICS, RELIC_MAP, RELIC_KIND_INFO, RELIC_SET_MAP, RELIC_SET_SIZE, relicSetCounts, describeRelic } from '../../data/relics';
import { RUN_EVENTS, RUN_EVENT_MAP, isSuperBossWave, mutations, describeEvent, type EventId } from '../../systems/RunEvents';
import { makeChallenge, MODIFIER_MAP, type ChallengeKind } from '../../data/challenges';
import { dayKey, weekKey } from '../../systems/Rng';
import { questsOf } from '../../data/quests';
import { questDone, questProgress, masteryLevel, masteryNeed, MASTERY_MAX, awakenUnlocked, awakeningOf } from '../../systems/Progress';
import { ACHIEVEMENTS } from '../../data/achievements';
import { AFFIXES } from '../../data/bosses';

// 页内参数（模块级，不进 UiState）
let relicPick = RELICS[0].id;
let jumpWave = 30;
let jumpEndless = true;
let jumpEvent: '' | EventId = '';
let jumpHard = false;
let chKind: ChallengeKind = 'daily';
let chKey = dayKey();
let qChar = '';
let saveText = '';

const SCENES = ['Hud', 'Pause', 'LevelUp', 'Shop', 'Result', 'Menu', 'CharSelect', 'Challenge'];
const charName = (id: string): string => CHARACTERS.find((c) => c.id === id)?.name ?? id;
const affixName = (id: string): string => (AFFIXES as Record<string, { name?: string }>)[id]?.name ?? id;

/** 退出沙盒，用当前构筑开一局真实对局（会刷怪、出事件、走正常波次结算） */
function startReal(ctx: DevCtx, setup: () => void): void {
  applyBuild(ctx.build);
  setup();
  run.dirty();
  run.hp = run.stats.maxHp;
  GameScene.sandbox = null;
  const game = ctx.sb.game;
  for (const k of SCENES) if (game.scene.isActive(k) || game.scene.isPaused(k)) game.scene.stop(k);
  ctx.sb.tracked = [];
  game.scene.start('Game');
  ctx.toast('已开真实对局（退出沙盒）；点「回到沙盒」恢复');
}

// ---------------- H3 遗物 ----------------
function relicSection(ctx: DevCtx): HTMLElement {
  const owned = ctx.build.relics ?? [];
  const setRelics = (ids: string[]) => {
    ctx.build.relics = ids;
    ctx.changed(true);
  };
  const box = h('div', { class: 'box' }, h('h3', null, `H3 遗物（构筑中 ${owned.length} 件）`));
  const opts: [string, string][] = RELICS.map((r) => [r.id, `${r.icon} ${r.name[0]}（${RELIC_KIND_INFO[r.kind].name[0]}）`]);
  box.append(
    h(
      'div',
      { class: 'row' },
      select(opts, relicPick, (v) => (relicPick = v)),
      btn('添加', () => !owned.includes(relicPick) && setRelics([...owned, relicPick]), 'pri'),
      btn('随机 3 件', () => {
        const pool = RELICS.filter((r) => !owned.includes(r.id));
        const add: string[] = [];
        while (add.length < 3 && pool.length) add.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0].id);
        setRelics([...owned, ...add]);
      }),
      btn('清空', () => setRelics([])),
      h('span', { class: 'muted' }, `共 ${RELICS.length} 件`),
    ),
  );
  const rows = owned.map((id) => {
    const r = RELIC_MAP[id];
    if (!r) return [id, '', '（未知遗物）', btn('移除', () => setRelics(owned.filter((x) => x !== id)))];
    return [
      `${r.icon} ${r.name[0]}`,
      h('span', { style: `color:${RELIC_KIND_INFO[r.kind].css}` }, RELIC_KIND_INFO[r.kind].name[0]),
      describeRelic(r).join('；') || '—',
      btn('移除', () => setRelics(owned.filter((x) => x !== id))),
    ];
  });
  if (rows.length) box.append(table(['遗物', '类型', '效果（数据生成）', ''], rows));
  const sets = Object.entries(relicSetCounts(owned));
  if (sets.length)
    box.append(
      h(
        'div',
        { class: 'small' },
        '套装：',
        ...sets.map(([s, n]) =>
          h(
            'span',
            { class: 'tag ' + (n >= RELIC_SET_SIZE ? 'good' : 'muted') },
            `${RELIC_SET_MAP[s]?.name[0] ?? s} ${n}/${RELIC_SET_SIZE}`,
          ),
        ),
      ),
    );
  // 生效情况：沙盒里 run.relics 与构筑一致，属性由 RunState 汇总，这里给出实际生效后的关键属性
  if (ctx.sb.running) {
    const s = run.stats;
    box.append(
      h(
        'div',
        { class: 'small muted' },
        `当前生效：最大生命 ${Math.round(s.maxHp)} · 伤害 ${Math.round(s.damage)}% · 攻速 ${Math.round(s.attackSpeed)}% · 护甲 ${Math.round(s.armor)}`,
      ),
    );
  }
  return box;
}

// ---------------- H4 / H5 真实对局：无尽跳波、事件波、危险路线 ----------------
function realRunSection(ctx: DevCtx): HTMLElement {
  const box = h('div', { class: 'box' }, h('h3', null, 'H4 / H5 真实对局（跳波、超级 Boss、变异、事件）'));
  box.append(
    h(
      'div',
      { class: 'row' },
      '波次',
      num(jumpWave, (v) => ((jumpWave = v), ctx.rerender()), { min: 1, max: 200 }),
      ...[15, 30, 45, 60].map((w) => btn(String(w), () => ((jumpWave = w), ctx.rerender()), jumpWave === w ? 'pri' : '')),
      check('无尽', jumpEndless, (v) => ((jumpEndless = v), ctx.rerender())),
      check('危险路线', jumpHard, (v) => (jumpHard = v)),
    ),
    h(
      'div',
      { class: 'row' },
      '强制事件',
      select([['', '（按种子，不强制）'], ...RUN_EVENTS.map((e): [string, string] => [e.id, `${e.icon} ${e.name[0]}`])], jumpEvent, (v) => {
        jumpEvent = v as '' | EventId;
        ctx.rerender();
      }),
    ),
  );
  if (jumpEvent) box.append(h('div', { class: 'small muted' }, describeEvent(RUN_EVENT_MAP[jumpEvent])));
  // 预览：变异词缀依赖局内种子与 endless，开局前先在临时状态里算一遍
  const prevEndless = run.endless;
  run.endless = jumpEndless;
  const mut = mutations(jumpWave);
  const sup = isSuperBossWave(jumpWave);
  run.endless = prevEndless;
  box.append(
    h(
      'div',
      { class: 'small' },
      sup ? h('span', { class: 'warn' }, '★ 超级 Boss 波（两只 Boss） ') : '',
      mut.length ? `变异词缀 ${mut.length} 个：${mut.map(affixName).join('、')}` : h('span', { class: 'muted' }, '无变异'),
      h('span', { class: 'muted' }, '（变异按开局种子，实际以开局后为准）'),
    ),
    h(
      'div',
      { class: 'row' },
      btn(
        `用当前构筑开第 ${jumpWave} 波`,
        () =>
          startReal(ctx, () => {
            run.endless = jumpEndless;
            run.wave = jumpWave;
            run.hardRoute = jumpHard;
            if (jumpEvent) run.events[jumpWave] = jumpEvent;
          }),
        'pri',
      ),
      btn('回到沙盒', () => ctx.sb.restart()),
      h('span', { class: 'muted small' }, GameScene.sandbox ? '当前：沙盒' : '当前：真实对局'),
    ),
  );
  return box;
}

// ---------------- H6 每日挑战预览 ----------------
function challengeSection(ctx: DevCtx): HTMLElement {
  const box = h('div', { class: 'box' }, h('h3', null, 'H6 每日 / 每周挑战预览'));
  const keyIn = h('input', {
    value: chKey,
    style: 'width:120px',
    onchange: () => {
      chKey = keyIn.value.trim();
      ctx.rerender();
    },
  });
  box.append(
    h(
      'div',
      { class: 'row' },
      select(
        [
          ['daily', '每日'],
          ['weekly', '每周'],
        ],
        chKind,
        (v) => {
          chKind = v as ChallengeKind;
          chKey = chKind === 'daily' ? dayKey() : weekKey();
          ctx.rerender();
        },
      ),
      '日期 / 键',
      keyIn,
      btn('今天', () => {
        chKey = chKind === 'daily' ? dayKey() : weekKey();
        ctx.rerender();
      }),
      btn('前一天', () => {
        const d = new Date(chKey);
        if (!Number.isNaN(d.getTime())) {
          d.setDate(d.getDate() - (chKind === 'daily' ? 1 : 7));
          chKey = chKind === 'daily' ? dayKey(d) : weekKey(d);
          ctx.rerender();
        }
      }),
      btn('后一天', () => {
        const d = new Date(chKey);
        if (!Number.isNaN(d.getTime())) {
          d.setDate(d.getDate() + (chKind === 'daily' ? 1 : 7));
          chKey = chKind === 'daily' ? dayKey(d) : weekKey(d);
          ctx.rerender();
        }
      }),
    ),
  );
  const c = makeChallenge(chKind, chKey);
  box.append(
    table(
      ['项', '值'],
      [
        ['种子', String(c.seed)],
        ['角色', charName(c.charId)],
        ['章节', `第 ${c.chapterId} 章 ${CHAPTERS[c.chapterId - 1]?.name ?? ''}`],
        ['模式', c.endless ? '无尽' : '普通'],
        ['规则', c.modifiers.map((m) => `${MODIFIER_MAP[m].icon} ${MODIFIER_MAP[m].name[0]}：${MODIFIER_MAP[m].desc[0]}`).join('\n')],
      ],
    ),
    h(
      'div',
      { class: 'row' },
      btn(
        '按此挑战开局（看商店与刷怪）',
        () => {
          GameScene.sandbox = null;
          const game = ctx.sb.game;
          for (const k of SCENES) if (game.scene.isActive(k) || game.scene.isPaused(k)) game.scene.stop(k);
          run.startChallenge(c);
          game.scene.start('Game');
          ctx.toast('已按挑战开局；点「回到沙盒」恢复');
        },
        'pri',
      ),
    ),
  );
  return box;
}

// ---------------- H7 角色任务与熟练度 ----------------
function questSection(ctx: DevCtx): HTMLElement {
  if (!qChar) qChar = ctx.build.charId;
  const box = h('div', { class: 'box' }, h('h3', null, 'H7 角色任务与熟练度（只改内存）'));
  const lv = masteryLevel(qChar);
  box.append(
    h(
      'div',
      { class: 'row' },
      select(
        CHARACTERS.map((c): [string, string] => [c.id, c.name]),
        qChar,
        (v) => ((qChar = v), ctx.rerender()),
      ),
      btn('用构筑角色', () => ((qChar = ctx.build.charId), ctx.rerender())),
      `熟练度 ${lv} 级（经验 ${save.meta.mastery[qChar] ?? 0}）`,
      '设为',
      num(
        lv,
        (v) => {
          save.meta.mastery[qChar] = masteryNeed(v);
          ctx.rerender();
        },
        { min: 1, max: MASTERY_MAX },
      ),
      '级',
    ),
  );
  const qs = questsOf(qChar);
  box.append(
    table(
      ['完成', '任务', '条件', '进度'],
      qs.map((q) => [
        h('input', {
          type: 'checkbox',
          checked: questDone(q),
          onchange: (e: Event) => {
            if ((e.target as HTMLInputElement).checked) save.meta.quests[q.id] = Date.now();
            else delete save.meta.quests[q.id];
            ctx.rerender();
          },
        }),
        q.name[0],
        q.desc[0],
        q.kind === 'counter' ? `${questProgress(q)}/${q.target}` : '局末判定',
      ]),
    ),
  );
  const aw = awakeningOf(qChar);
  if (aw)
    box.append(
      h(
        'div',
        { class: 'small' },
        awakenUnlocked(qChar) ? h('span', { class: 'good' }, '觉醒已解锁 ') : h('span', { class: 'muted' }, '觉醒未解锁 '),
        `【${aw.name[0]}】${aw.desc[0]}`,
      ),
    );
  box.append(
    h(
      'div',
      { class: 'row' },
      btn('完成全部任务', () => {
        for (const q of qs) save.meta.quests[q.id] = Date.now();
        ctx.rerender();
      }),
      btn('清除全部任务', () => {
        for (const q of qs) delete save.meta.quests[q.id];
        ctx.rerender();
      }),
      btn('应用到沙盒（重开）', () => ctx.changed(true)),
    ),
  );
  return box;
}

// ---------------- H8 存档编辑器 ----------------
function saveSection(ctx: DevCtx): HTMLElement {
  const box = h('div', { class: 'box' }, h('h3', null, 'H8 存档编辑器（只改内存，不写盘）'));
  const field = (label: string, get: () => number, set: (v: number) => void, max = 1e9) =>
    h(
      'label',
      null,
      label,
      num(get(), (v) => (set(v), ctx.rerender()), { min: 0, max, width: 80 }),
    );
  box.append(
    h(
      'div',
      { class: 'grid' },
      field(
        '通关章节',
        () => save.clearedChapters,
        (v) => (save.clearedChapters = v),
        CHAPTERS.length,
      ),
      field(
        '通关次数',
        () => save.wins,
        (v) => (save.wins = v),
      ),
      field(
        '总击杀',
        () => save.totalKills,
        (v) => (save.totalKills = v),
      ),
      field(
        '金番茄',
        () => save.meta.gold,
        (v) => (save.meta.gold = v),
      ),
      field(
        '大师层',
        () => save.meta.master,
        (v) => (save.meta.master = v),
      ),
      field(
        '额外天赋点',
        () => save.meta.bonusTp,
        (v) => (save.meta.bonusTp = v),
      ),
    ),
    h(
      'div',
      { class: 'row' },
      btn('解锁全部角色', () => {
        save.ownedChars = CHARACTERS.map((c) => c.id);
        ctx.toast('已解锁 ' + CHARACTERS.length + ' 名角色');
      }),
      btn('全部成就满级', () => {
        for (const a of ACHIEVEMENTS) save.achievements[a.id] = { tier: a.tiers.length, t: Date.now() };
        ctx.toast(`已点满 ${ACHIEVEMENTS.length} 项成就`);
      }),
      btn('全部章节危机 20', () => {
        for (const ch of CHAPTERS) save.meta.dangerUnlocked[ch.id] = 20;
        save.clearedChapters = CHAPTERS.length;
        ctx.rerender();
      }),
      btn('清空成就', () => {
        save.achievements = {};
        ctx.toast('已清空成就（内存）');
      }),
    ),
  );
  const ta = h('textarea', { spellcheck: false, style: 'min-height:160px' });
  ta.value = saveText;
  box.append(
    h(
      'div',
      { class: 'row' },
      btn('读出当前存档 JSON', () => {
        saveText = JSON.stringify(save, null, 1);
        ctx.rerender();
      }),
      btn(
        '写回内存',
        () => {
          try {
            const parsed = normalize(JSON.parse(ta.value));
            for (const k of Object.keys(save) as (keyof typeof save)[]) delete save[k];
            Object.assign(save, parsed);
            saveText = ta.value;
            ctx.toast('已写回内存存档（未写盘）');
          } catch (e) {
            ctx.toast('JSON 无效：' + (e as Error).message, true);
          }
        },
        'pri',
      ),
    ),
    ta,
    h('div', { class: 'small muted' }, '写回会经过 normalize（补齐缺省字段、修正类型）；刷新页面即恢复磁盘上的真实存档。'),
  );
  return box;
}

export function renderV14(ctx: DevCtx): HTMLElement {
  return h('div', null, relicSection(ctx), realRunSection(ctx), challengeSection(ctx), questSection(ctx), saveSection(ctx));
}

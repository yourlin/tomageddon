// 怪物页：小怪 / 精英 / Boss 在指定章节 + 波次下的强度；生成到沙盒（木桩 / 手动招式）观察攻击方式；各章各波强度矩阵
import { h, btn, check, select, num, table, fmt, hex } from '../dom';
import type { DevCtx } from '../ctx';
import { CHAPTERS } from '../../data/chapters';
import { ENEMIES, ENEMY_MAP, type EnemyDef } from '../../data/enemies';
import { BOSS_MAP, AFFIXES, AFFIX_IDS, elitePool, bossPool, type BossDef, type AffixId } from '../../data/bosses';
import { minionStats, bossStats } from '../../systems/EnemyScaling';
import { minionTraits, patternText, afterArmor, bossSummary, BEHAVIOR_NAME, PATTERN_NAME } from '../info';
import type { AttackMode, Tracked } from '../sandbox';
import { allFilters, allMonsters, liveEditor, affixPresets, poolChart, heatToggle, heatColor, heatMode, buildDps } from './monsterTools';

const MATRIX_WAVES = [1, 3, 5, 7, 10, 12, 15, 20, 25];

export function renderMonsters(ctx: DevCtx): HTMLElement {
  const ui = ctx.ui;
  const sb = ctx.sb;
  const root = h('div');
  const ch = CHAPTERS[ui.mChapter - 1];
  const sp = ui.spawn;
  sp.chapterId = ui.mChapter;
  sp.wave = ui.mWave;

  // ---------------- 缩放与生成选项 ----------------
  root.append(
    h(
      'div',
      { class: 'row' },
      '章节',
      select(
        CHAPTERS.map((c) => [c.id, c.name]),
        ui.mChapter,
        (v) => ((ui.mChapter = Number(v)), (ui.mSel = ''), ctx.rerender()),
      ),
      '波次',
      num(ui.mWave, (v) => ((ui.mWave = v), ctx.rerender()), { min: 1, max: 40, width: 50 }),
      ...[1, 5, 10, 15, 20].map((w) => btn(`W${w}`, () => ((ui.mWave = w), ctx.rerender()))),
      btn(
        '同步构筑',
        () => ((ui.mChapter = ctx.build.chapterId), (ui.mWave = ctx.build.wave), ctx.rerender()),
        '',
        '使用构筑页的章节与波次',
      ),
    ),
    h(
      'div',
      { class: 'row' },
      '列表',
      select(
        [
          ['pool', '本章刷怪池'],
          ['minion', '全部小怪'],
          ['elite', '本章精英'],
          ['boss', '本章 Boss'],
          ['all', '全类别（所有章节）'],
        ],
        ui.mCat,
        (v) => ((ui.mCat = v as typeof ui.mCat), ctx.rerender()),
      ),
      searchBox(ctx),
    ),
    ui.mCat === 'all' ? allFilters(ctx) : '',
    h(
      'div',
      { class: 'box' },
      h(
        'div',
        { class: 'row' },
        '生成数量',
        num(sp.count, (v) => (sp.count = v), { min: 1, max: 80, width: 50 }),
        '攻击',
        select(
          [
            ['ai', '正常 AI'],
            ['none', '禁止攻击（木桩）'],
            ['manual', '仅手动触发招式'],
          ],
          sp.attack,
          (v) => ((sp.attack = v as AttackMode), ctx.rerender()),
        ),
        check('锁定位置', sp.lock, (v) => (sp.lock = v)),
        check('锁血', sp.immortal, (v) => (sp.immortal = v), '每步回满生命，用于长时间观察特效'),
        check('计时测试', sp.test, (v) => (sp.test = v), '全部击杀后记录击杀用时（TTK）与承伤，见「测试记录」'),
      ),
      h(
        'div',
        { class: 'row' },
        '词缀',
        select(
          [
            ['rule', '按游戏规则（精英随机 / 小怪无）'],
            ['none', '无词缀'],
            ['pick', '指定词缀'],
          ],
          ui.affixMode,
          (v) => ((ui.affixMode = v as typeof ui.affixMode), syncAffix(ctx), ctx.rerender()),
        ),
        ui.affixMode === 'pick'
          ? h(
              'span',
              null,
              ...AFFIX_IDS.map((a) =>
                check(
                  AFFIXES[a].name,
                  !!sp.affixes?.includes(a),
                  (v) => {
                    const list = new Set(sp.affixes ?? []);
                    if (v) list.add(a);
                    else list.delete(a);
                    sp.affixes = [...list] as AffixId[];
                  },
                  AFFIXES[a].desc,
                ),
              ),
            )
          : '',
      ),
      h(
        'div',
        { class: 'row' },
        btn('重复上次生成', () => toastErr(ctx, sb.respawnLast())),
        btn('清场', () => sb.clear()),
        h('span', { class: 'muted' }, '词缀小怪：生命 ×3.5、伤害 ×1.3；Boss 召唤物按构筑波次缩放'),
      ),
      affixPresets(ctx),
      h(
        'div',
        { class: 'row' },
        check('AI 状态叠加层（D6）', sb.overlay.ai, (v) => (sb.overlay.ai = v), '移动方向箭头、行为状态与招式冷却'),
        heatToggle(ctx),
      ),
    ),
  );

  // ---------------- 列表 ----------------
  const q = ui.mSearch.trim().toLowerCase();
  const match = (name: string, id: string) => !q || name.toLowerCase().includes(q) || id.includes(q);
  if (ui.mCat === 'all') {
    const rows = allMonsters(q).map((r) => {
      const c = CHAPTERS[(r.chapter || ui.mChapter) - 1];
      const st = r.boss ? bossStats(BOSS_MAP[r.id], ui.mWave, c) : minionStats(ENEMY_MAP[r.id], ui.mWave, c);
      const color = r.boss ? BOSS_MAP[r.id].color : ENEMY_MAP[r.id].color;
      const info = r.boss ? BOSS_MAP[r.id].patterns.map((p) => PATTERN_NAME[p.type]).join('/') : BEHAVIOR_NAME[ENEMY_MAP[r.id].behavior];
      return [
        link(ctx, r.sel, r.name, color),
        `${r.chapter ? `第${r.chapter}章` : '—'} ${r.kind === 'minion' ? '小怪' : r.kind === 'elite' ? '精英' : 'Boss'}`,
        h('span', { class: 'muted' }, info),
        String(st.hp),
        String(st.dmg),
        spawnBtns(ctx, r.id, r.boss),
      ];
    });
    root.append(
      h('div', { class: 'muted' }, `${rows.length} 个；数值按各自首次出现的章节 + 上方波次 W${ui.mWave} 缩放`),
      table(['名称', '章节 / 类型', '行为 / 招式', '生命', '伤害', ''], rows, { numeric: [3, 4] }),
    );
  } else if (ui.mCat === 'pool' || ui.mCat === 'minion') {
    const entries: { d: EnemyDef; note: string }[] =
      ui.mCat === 'pool'
        ? ch.pool.map((p) => ({ d: ENEMY_MAP[p.enemy], note: `W${p.from}${p.to ? `~${p.to}` : '+'} 权重${p.weight}` }))
        : ENEMIES.map((d) => ({ d, note: '' }));
    const rows = entries
      .filter((x) => x.d && match(x.d.name, x.d.id))
      .map(({ d, note }) => {
        const st = minionStats(d, ui.mWave, ch);
        return [
          link(ctx, d.id, d.name, d.color),
          h('span', { class: 'muted' }, [BEHAVIOR_NAME[d.behavior], note].filter(Boolean).join(' · ')),
          String(st.hp),
          `${st.dmg} → ${afterArmor(st.dmg)}`,
          String(Math.round(d.speed * st.speedMult)),
          spawnBtns(ctx, d.id, false),
        ];
      });
    root.append(table(['小怪', '行为 / 出现', '生命', '伤害→实受', '速度', ''], rows, { numeric: [2, 3, 4] }));
    if (ui.mCat === 'pool') root.append(poolChart(ui.mChapter));
  } else {
    const list = (ui.mCat === 'elite' ? elitePool(ui.mChapter) : bossPool(ui.mChapter)).filter((b) => match(b.name, b.id));
    const rows = list.map((b) => {
      const st = bossStats(b, ui.mWave, ch);
      return [
        link(ctx, 'b:' + b.id, b.name, b.color),
        h('span', { class: 'muted' }, b.patterns.map((p) => PATTERN_NAME[p.type]).join('/') + (b.phase2 ? ' · 二阶段' : '')),
        String(st.hp),
        `${st.dmg} → ${afterArmor(st.dmg)}`,
        String(b.speed),
        spawnBtns(ctx, b.id, true),
      ];
    });
    root.append(table([ui.mCat === 'elite' ? '精英' : 'Boss', '招式', '生命', '接触伤害→实受', '速度', ''], rows, { numeric: [2, 3, 4] }));
    root.append(
      h(
        'div',
        { class: 'muted' },
        ui.mCat === 'elite'
          ? '正常流程：第 5 / 10 波出场，生命 × (0.8 + (波次-5)×0.12)；第 10 波起及第 3 / 5 章附带随机词缀'
          : '正常流程：第 15 波出场，生命 ×3、伤害 ×1.2；倒计时结束后狂暴（伤害 ×1.3、冷却减半）',
      ),
    );
  }

  // ---------------- 详情 ----------------
  if (ui.mSel) root.append(detail(ctx));
  return root;
}

function syncAffix(ctx: DevCtx): void {
  const sp = ctx.ui.spawn;
  sp.affixes = ctx.ui.affixMode === 'rule' ? null : ctx.ui.affixMode === 'none' ? [] : (sp.affixes ?? []);
}

function link(ctx: DevCtx, sel: string, name: string, color: number): HTMLElement {
  return h(
    'a',
    {
      style: `color:${hex(color)}`,
      onclick: () => {
        ctx.ui.mSel = ctx.ui.mSel === sel ? '' : sel;
        ctx.rerender();
      },
    },
    (ctx.ui.mSel === sel ? '▾ ' : '') + name,
  );
}

function spawnBtns(ctx: DevCtx, id: string, boss: boolean): HTMLElement {
  const sb = ctx.sb;
  return h(
    'span',
    null,
    btn('生成', () => {
      syncAffix(ctx);
      toastErr(ctx, sb.spawn(id, boss, { ...ctx.ui.spawn }));
    }),
    btn(
      '木桩',
      () => {
        syncAffix(ctx);
        toastErr(ctx, sb.spawn(id, boss, { ...ctx.ui.spawn, attack: 'none', lock: true }));
      },
      '',
      '锁定位置 + 禁止攻击（保留当前锁血 / 计时设置）',
    ),
    boss
      ? btn(
          '看招',
          () => {
            syncAffix(ctx);
            toastErr(ctx, sb.spawn(id, boss, { ...ctx.ui.spawn, count: 1, attack: 'manual', lock: true, immortal: true, test: false }));
            ctx.ui.mSel = 'b:' + id;
            ctx.rerender();
          },
          '',
          '锁血、锁定位置、仅手动触发：在下方详情里逐个触发招式',
        )
      : '',
  );
}

function detail(ctx: DevCtx): HTMLElement {
  const ui = ctx.ui;
  const sb = ctx.sb;
  const isBoss = ui.mSel.startsWith('b:');
  const id = isBoss ? ui.mSel.slice(2) : ui.mSel;
  const ch = CHAPTERS[ui.mChapter - 1];
  const box = h('div', { class: 'box' });
  if (isBoss) {
    const b: BossDef = BOSS_MAP[id];
    const st = bossStats(b, ui.mWave, ch);
    const live = sb.liveBoss(id);
    box.append(
      h('h3', null, `${b.name}（${b.elite ? '精英' : 'Boss'} · 第${b.chapter}章）`),
      h('div', { class: 'muted' }, b.desc),
      h('div', null, `第${ui.mChapter}章 W${ui.mWave}：生命 ${st.hp} · 基础伤害 ${st.dmg} · 半径 ${b.radius} · 速度 ${b.speed}`),
      h('div', { class: 'muted' }, bossSummary(b) || '—'),
      h(
        'div',
        { class: 'row' },
        live
          ? h('span', { class: 'good' }, `沙盒中：${Math.ceil(live.e.hp)}/${live.e.maxHp}${live.e.phase2 ? ' · 二阶段' : ''}`)
          : h('span', { class: 'muted' }, '沙盒中没有存活的该目标（点「看招」生成）'),
        live && b.phase2 ? btn('进入二阶段', () => (sb.phase2(live), ctx.rerender())) : '',
        live ? attackModeSel(ctx, live) : '',
      ),
    );
    if (live) box.append(liveEditor(ctx, live));
    const pats = [...b.patterns.map((p) => ({ p, phase2: false })), ...(b.phase2?.add ?? []).map((p) => ({ p, phase2: true }))];
    box.append(
      table(
        ['招式', '伤害→实受', '参数', ''],
        pats.map(({ p, phase2 }, i) => {
          const t = patternText(p, st.dmg);
          // 二阶段招式在进入二阶段后才追加到 patterns 数组
          const idx = live ? live.e.patterns.indexOf(p) : -1;
          return [
            (phase2 ? '② ' : '') + t.name,
            t.dmg !== null ? `${t.dmg} → ${afterArmor(t.dmg)}` : '—',
            h('span', { class: 'muted' }, t.detail),
            idx >= 0
              ? btn('触发', () => sb.trigger(live!, idx))
              : h('span', { class: 'muted', title: phase2 ? '进入二阶段后可触发' : '' }, phase2 && live ? '未进入' : `#${i + 1}`),
          ];
        }),
      ),
    );
    box.append(matrix((c, w) => bossStats(b, w, c)));
  } else {
    const d = ENEMY_MAP[id];
    const st = minionStats(d, ui.mWave, ch);
    const live = [...sb.tracked].reverse().find((t: Tracked) => !t.boss && t.e.def?.id === id && sb.isAlive(t));
    box.append(
      h('h3', null, d.name),
      h('div', { class: 'muted' }, d.desc),
      h(
        'div',
        null,
        `第${ui.mChapter}章 W${ui.mWave}：生命 ${st.hp} · 接触伤害 ${st.dmg} · 半径 ${d.radius} · 速度 ${Math.round(d.speed * st.speedMult)} · 掉落 ${d.seeds}`,
      ),
      h('div', null, minionTraits(d).join(' · ')),
      h(
        'div',
        { class: 'muted' },
        `成长：生命 ${d.hp} × (1 + ${d.hpGrowth}·w^0.9) · 伤害 ${d.dmg} × (1 + ${d.dmgGrowth}·w^0.9)，再乘章节倍率（随波次渐进生效）`,
      ),
      live
        ? h(
            'div',
            { class: 'row' },
            h('span', { class: 'good' }, '沙盒中有存活目标'),
            attackModeSel(ctx, live),
            btn('立即行动', () => sb.trigger(live, -1), '', '射击 / 冲撞 / 召唤 / 治疗立刻触发一次'),
          )
        : '',
    );
    if (live) box.append(liveEditor(ctx, live));
    box.append(matrix((c, w) => minionStats(d, w, c)));
  }
  return box;
}

function attackModeSel(ctx: DevCtx, t: Tracked): HTMLElement {
  return h(
    'span',
    null,
    '攻击 ',
    select(
      [
        ['ai', '正常 AI'],
        ['none', '禁止'],
        ['manual', '手动'],
      ],
      t.opts.attack,
      (v) => ((t.opts.attack = v as AttackMode), ctx.rerender()),
    ),
    ' ',
    check('锁定', t.opts.lock, (v) => {
      t.opts.lock = v;
      t.anchor = { x: t.e.x, y: t.e.y };
    }),
    check('锁血', t.opts.immortal, (v) => (t.opts.immortal = v)),
  );
}

/** 各章 × 各波 的生命 / 伤害；热力图模式下底色 = 生命 ÷ 构筑 DPS（击杀秒数） */
function matrix(fn: (ch: (typeof CHAPTERS)[number], wave: number) => { hp: number; dmg: number }): HTMLElement {
  const dps = Math.max(1, buildDps());
  const heat = heatMode === 'ttk';
  return h(
    'div',
    null,
    h('h3', null, heat ? `强度热力图（生命 / 伤害；底色 = 以构筑 DPS ${Math.round(dps)} 击杀所需秒数）` : '强度矩阵（生命 / 伤害）'),
    h(
      'div',
      { class: heat ? 'heat' : '' },
      table(
        ['章节', ...MATRIX_WAVES.map((w) => `W${w}`)],
        CHAPTERS.map((c) => [
          `第${c.id}章`,
          ...MATRIX_WAVES.map((w) => {
            const s = fn(c, w);
            const sec = s.hp / dps;
            const cell = h(
              'span',
              { title: `击杀约 ${fmt(sec, 2)} 秒` },
              fmtK(s.hp),
              h('span', { class: heat ? '' : 'muted' }, ` / ${fmt(s.dmg)}`),
            );
            if (heat) cell.style.cssText = `background:${heatColor(sec)};display:block;padding:0 3px;border-radius:2px`;
            return cell;
          }),
        ]),
        { numeric: MATRIX_WAVES.map((_, i) => i + 1) },
      ),
    ),
    h(
      'div',
      { class: 'muted' },
      'W16+ 为无尽模式的分段复利成长（16–30 波每波生命 ×1.12、伤害 ×1.09，31–45 波 ×1.08/×1.06，46 波起 ×1.05/×1.04）。热力图：绿 <1 秒，黄约 3 秒，红 >10 秒。',
    ),
  );
}

const fmtK = (v: number): string => (v >= 10000 ? `${(v / 1000).toFixed(1)}k` : String(v));

function searchBox(ctx: DevCtx): HTMLInputElement {
  const i = h('input', {
    placeholder: '搜索',
    value: ctx.ui.mSearch,
    onchange: () => {
      ctx.ui.mSearch = i.value;
      ctx.rerender();
    },
  });
  return i;
}

function toastErr(ctx: DevCtx, err: string | null): void {
  if (err) ctx.toast(err, true);
}

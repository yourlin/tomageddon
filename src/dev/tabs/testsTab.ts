// 测试记录页：强度测试（TTK / 承伤）、伤害来源排行、最近受到的伤害、叠加层图例
import { h, btn, table, fmt, hex } from '../dom';
import type { DevCtx } from '../ctx';
import { WEAPON_MAP } from '../../data/weapons';
import { run } from '../../systems/RunState';
import { weaponRange } from '../../systems/WeaponSystem';
import { OVERLAY_COLORS, type TestResult } from '../sandbox';

const SRC_NAME: Record<string, string> = {
  skill: '技能',
  dot: '持续伤害',
  explosion: '爆炸',
  knives: '飞刀',
  other: '其他（落雷 / 反伤等）',
};
export const srcName = (k: string): string => SRC_NAME[k] ?? WEAPON_MAP[k]?.name ?? k;

const ttkText = (r: TestResult): string => (r.aborted ? '中断' : r.ttk === null ? '进行中' : `${r.ttk.toFixed(2)}s`);

export function renderTests(ctx: DevCtx): HTMLElement {
  const sb = ctx.sb;
  const root = h('div');

  // ---------------- 叠加层图例 ----------------
  root.append(h('h3', null, '射程叠加层图例'));
  const s = sb.running ? sb.g.stats : run.stats;
  const mult = sb.running ? sb.g.rangeMult : 1;
  root.append(
    h(
      'div',
      null,
      ...run.weapons.map((w, i) => {
        const d = WEAPON_MAP[w.id];
        return h(
          'span',
          { class: 'tag', style: `border:1px solid ${hex(OVERLAY_COLORS[i % OVERLAY_COLORS.length])}` },
          h('span', { style: `color:${hex(OVERLAY_COLORS[i % OVERLAY_COLORS.length])}` }, '●'),
          ` ${d.name} T${w.tier + 1} ${d.kind === 'aura' ? '光环半径' : '射程'} ${Math.round(weaponRange(d, s, w) * mult)}`,
        );
      }),
    ),
    h('div', { class: 'muted' }, '黄圈 = 爆炸实际半径（已乘爆炸范围属性）；彩色粗圈为技能范围；白细圈为目标碰撞半径。'),
  );

  // ---------------- 强度测试 ----------------
  root.append(
    h('h3', null, `强度测试（${sb.tests.length}）`),
    h(
      'div',
      { class: 'row' },
      btn('复制为表格文本', () => {
        const head = ['#', '目标', '章节', '波次', '数量', '总生命', 'TTK(s)', '平均DPS', '承伤', '最大单次', '阵亡', '构筑'];
        const lines = sb.tests.map((r) =>
          [
            r.id,
            r.label,
            r.chapterId,
            r.wave,
            r.count,
            r.totalHp,
            r.ttk?.toFixed(2) ?? ttkText(r),
            r.ttk ? Math.round(r.totalHp / r.ttk) : '',
            Math.round(r.taken),
            r.takenMax,
            r.deaths,
            r.build,
          ].join('\t'),
        );
        void navigator.clipboard?.writeText([head.join('\t'), ...lines].join('\n')).then(
          () => ctx.toast('已复制（可直接粘贴到表格）'),
          () => ctx.toast('剪贴板不可用', true),
        );
      }),
      btn('清空记录', () => {
        sb.tests = [];
        ctx.rerender();
      }),
      btn('重复上次生成', () => {
        const e = sb.respawnLast();
        if (e) ctx.toast(e, true);
      }),
    ),
  );
  if (!sb.tests.length) root.append(h('div', { class: 'muted' }, '在「怪物」页勾选「计时测试」后生成目标，全部击杀即记录击杀用时。'));
  else {
    root.append(
      table(
        ['#', '目标', '章/波', '总生命', 'TTK', '平均DPS', '承伤', '最大单次', '阵亡', '构筑'],
        sb.tests.map((r) => [
          String(r.id),
          r.label,
          `${r.chapterId}/${r.wave}`,
          String(r.totalHp),
          h('b', { class: r.aborted ? 'muted' : r.ttk === null ? 'warn' : 'good' }, ttkText(r)),
          r.ttk ? String(Math.round(r.totalHp / r.ttk)) : '',
          String(Math.round(r.taken)),
          String(r.takenMax),
          r.deaths ? h('span', { class: 'bad' }, String(r.deaths)) : '0',
          h('span', { class: 'muted' }, r.build),
        ]),
        { numeric: [3, 4, 5, 6, 7, 8] },
      ),
    );
  }

  // ---------------- 伤害来源 ----------------
  const total = Math.max(1, sb.dmgTotal);
  root.append(h('h3', null, `伤害来源（自上次「重置统计」起，共 ${Math.round(sb.dmgTotal)}）`));
  root.append(
    table(
      ['来源', '伤害', '占比'],
      Object.entries(sb.dmgBySrc)
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => [srcName(k), String(Math.round(v)), `${fmt((v / total) * 100)}%`]),
      { numeric: [1, 2] },
    ),
  );

  // ---------------- 最近受到的伤害 ----------------
  root.append(h('h3', null, '最近受到的伤害（已计护甲，闪避的不计）'));
  const recent = sb.taken.slice(-20).reverse();
  root.append(
    recent.length
      ? table(
          ['来源', '伤害'],
          recent.map((x) => [x.src, String(x.dmg)]),
          { numeric: [1] },
        )
      : h('div', { class: 'muted' }, '暂无'),
  );
  root.append(
    h(
      'div',
      { class: 'row' },
      btn('刷新本页', () => ctx.rerender()),
    ),
  );
  return root;
}

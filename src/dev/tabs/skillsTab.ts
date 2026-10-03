// 技能页：所有角色的主动技能（形态、冷却、伤害、范围、状态），当前角色可直接释放观察特效
import { h, btn, check, num, table, fmt, hex } from '../dom';
import type { DevCtx } from '../ctx';
import { CHARACTERS, CHARACTER_MAP } from '../../data/characters';
import { SKILL_TYPE_NAME, skillPower } from '../../data/skills';
import { save } from '../../systems/Save';
import { run } from '../../systems/RunState';
import { WEAPON_MAP } from '../../data/weapons';
import { skillCalc, statusText } from '../info';
import { numericFields, getAt, setOverride, findOverride } from '../overrides';

const SKILL_FIELD: Record<string, string> = {
  cd: '冷却',
  mult: '伤害系数',
  radius: '半径',
  distance: '距离',
  count: '数量',
  duration: '持续',
  heal: '回复',
  xp: '经验',
};

export function renderSkills(ctx: DevCtx): HTMLElement {
  const sb = ctx.sb;
  const root = h('div');
  const c = run.char;
  const sk = c.skill;
  const k = skillCalc(sk);
  const pw = skillPower(sk);
  root.append(
    h('h3', null, `当前角色：${c.name}（${c.title}）`),
    h(
      'div',
      { class: 'box' },
      h('div', null, h('b', { style: `color:${hex(sk.color)}` }, `【${sk.name}】`), ` ${SKILL_TYPE_NAME[sk.type] ?? sk.type} · ${sk.desc}`),
      h(
        'div',
        null,
        `冷却 ${fmt(k.cd)}s（基础 ${sk.cd}s）· 伤害 ${sk.mult ? Math.round(k.dmg) : '—'}（武器均伤 × 系数 × 技能伤害%）`,
        k.radius ? ` · ${sk.type === 'dash' ? '冲刺距离' : '半径'} ${Math.round(k.radius)}` : '',
        k.dur ? ` · 持续 ${fmt(k.dur)}s` : '',
      ),
      h('div', { class: 'muted' }, k.lines.join(' · ')),
      h('div', { class: 'muted' }, `威力分：伤害 ${fmt(pw.dmg)} · 控制 ${fmt(pw.ctrl)} · 增益 ${fmt(pw.buff)}（决定基础冷却）`),
      h('div', null, `天赋【${c.talent.name}】${c.talent.desc}`),
      h(
        'div',
        { class: 'muted' },
        `特性：${c.traits.join('、')} · 契合武器：${c.favored.map((id) => WEAPON_MAP[id]?.name ?? id).join('、')}`,
      ),
      h(
        'div',
        { class: 'row' },
        btn('释放技能', () => sb.castSkill(), 'pri'),
        check('技能无CD', sb.noSkillCd, (v) => ((sb.noSkillCd = v), ctx.rerender())),
        check('自动释放', save.settings.autoSkill, (v) => ((save.settings.autoSkill = v), ctx.rerender())),
        btn('生成木桩群看范围', () => {
          const e = sb.spawn('mold', false, {
            chapterId: ctx.build.chapterId,
            wave: ctx.build.wave,
            count: 16,
            affixes: null,
            lock: true,
            attack: 'none',
            immortal: true,
            test: false,
          });
          if (e) ctx.toast(e, true);
        }),
      ),
      h('div', { class: 'muted' }, '提示：冲刺 / 环形弹幕等方向类技能朝移动方向释放，可先用 WASD 移动再按空格或「释放技能」。'),
    ),
    h('h3', null, 'E5 技能参数实时编辑（写入数值覆盖层，可在「数值」页还原 / 导出）'),
    h(
      'div',
      { class: 'grid' },
      ...numericFields(sk, 1)
        .filter((p) => p[0] !== 'color')
        .map((p) => {
          const ov = findOverride('chars', c.id, ['skill', ...p]);
          const v = getAt(sk, p) as number;
          return h(
            'label',
            { class: ov ? 'warn' : '', title: ov ? `原值 ${ov.orig}` : '' },
            SKILL_FIELD[p.join('.')] ?? p.join('.'),
            num(
              v,
              (nv) => {
                const e = setOverride('chars', c.id, ['skill', ...p], nv);
                if (e) ctx.toast(e, true);
                ctx.changed();
              },
              { width: 60, step: Number.isInteger(v) ? 1 : 0.05 },
            ),
          );
        }),
    ),
  );

  root.append(h('h3', null, '全部角色技能'));
  root.append(
    table(
      ['角色', '技能', '形态', '基础CD', '参数', '状态', ''],
      CHARACTERS.map((ch) => {
        const s = ch.skill;
        const params = [
          s.mult ? `×${s.mult}` : '',
          s.radius ? `r${s.radius}` : '',
          s.distance ? `距${s.distance}` : '',
          s.count ? `${s.count}发` : '',
          s.duration ? `${s.duration}s` : '',
        ]
          .filter(Boolean)
          .join(' ');
        const cur = ch.id === run.charId;
        return [
          h(
            'span',
            {
              style: `color:${hex(ch.color)}`,
              title: `${ch.desc}\n天赋：${ch.talent.name} — ${ch.talent.desc}\n特性：${ch.traits.join('、')}`,
            },
            ch.name + (cur ? ' ●' : ''),
          ),
          h('span', { title: s.desc, style: `color:${hex(s.color)}` }, s.name),
          SKILL_TYPE_NAME[s.type] ?? s.type,
          String(s.cd),
          params,
          h(
            'span',
            { class: 'muted' },
            [statusText(s.status), s.selfStatus ? '自身 ' + statusText(s.selfStatus) : ''].filter(Boolean).join(' / '),
          ),
          cur
            ? btn('释放', () => sb.castSkill())
            : btn('切换试用', () => {
                // 构筑里的武器还是旧角色的初始武器时，换成新角色的初始武器
                const b = ctx.build;
                const old = CHARACTER_MAP[b.charId].startWeapons;
                if (b.weapons.length === old.length && b.weapons.every((w, i) => w.id === old[i] && w.tier === 0))
                  b.weapons = ch.startWeapons.map((id) => ({ id, tier: 0 }));
                b.charId = ch.id;
                ctx.changed();
              }),
        ];
      }),
      { numeric: [3] },
    ),
  );
  return root;
}

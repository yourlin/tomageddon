// 自动化平衡测试机器人 v2（开发用）
// 用法：await import('/scripts/bot2.js'); runBatch(['tomato','carrot'], 2, 16)
// 按角色流派：近战贴近敌人、远程保持距离；按流派评估道具/升级/武器价值
const { CHARACTER_MAP, CHARACTERS, WEAPON_MAP, ITEM_MAP, LEVELUP_OPTIONS, TIER_PRICE_MULT, sellPrice, EVOLUTIONS } = window.__dev;

function profile(charId) {
  const c = CHARACTER_MAP[charId];
  const cls = {};
  for (const w of c.startWeapons) {
    const d = WEAPON_MAP[w];
    cls[d.cls] = (cls[d.cls] ?? 0) + 1;
  }
  const main = Object.entries(cls).sort((a, b) => b[1] - a[1])[0][0];
  const hasAura = c.startWeapons.some((w) => WEAPON_MAP[w].kind === 'aura');
  const statOf = { melee: 'melee', ranged: 'ranged', elemental: 'elemental' };
  const W = {
    maxHp: 1,
    regen: 1.1,
    lifeSteal: 1.2,
    damage: 1.6,
    meleePct: main === 'melee' ? 1.4 : 0.15,
    rangedPct: main === 'ranged' ? 1.4 : 0.15,
    elementalPct: main === 'elemental' ? 1.4 : 0.15,
    auraPct: hasAura ? 1.2 : 0.05,
    auraSize: hasAura ? 0.5 : 0,
    melee: 0,
    ranged: 0,
    elemental: 0,
    attackSpeed: 1.3,
    crit: 0.9,
    range: main === 'melee' ? 0.02 : 0.06,
    armor: 1.3,
    dodge: 1,
    speed: 0.7,
    luck: 0.25,
    harvest: 0.35,
    pickup: 0.05,
    xpGain: 0.3,
    skillCd: 0.4,
  };
  W[statOf[main]] = 3.2;
  for (const k of Object.keys(cls)) if (k !== main) W[statOf[k]] = 1.5;
  // 角色类别惩罚
  for (const [k, m] of Object.entries(c.classMult ?? {})) if (m < 1) W[statOf[k]] *= m;
  return { main, W, melee: main === 'melee' };
}

function modsValue(mods, W) {
  let v = 0;
  for (const [k, x] of Object.entries(mods))
    v +=
      (W[k] ?? 0) *
      x *
      (k === 'maxHp' ? 0.4 : k === 'range' ? 1 : k === 'luck' || k === 'harvest' || k === 'xpGain' || k === 'pickup' ? 0.4 : 1);
  return v;
}

function itemValue(it, P) {
  let v = modsValue(it.mods, P.W);
  // 进化催化剂：持有对应的 T3+ 武器且还没有这件道具时价值很高
  if (!run.items[it.id] && EVOLUTIONS.some((e) => e.item === it.id && run.weapons.some((w) => w.id === e.from && w.tier >= 2))) v += 25;
  if (it.special) v += [2, 5, 9, 16][it.rarity];
  return v;
}

function weaponValue(o, P) {
  const d = WEAPON_MAP[o.id];
  let v = (d.cls === P.main ? 10 : 4) * [1, 2.1, 4, 8][o.tier]; // 高品质按实际战力估值，不因单价高而被忽略
  if (run.weapons.some((w) => w.id === o.id && w.tier === o.tier)) v *= 1.4; // 可合成
  if (run.char.favored.includes(o.id)) v *= 1.5; // 契合武器
  return v;
}

function levelValue(opt, P) {
  const base = LEVELUP_OPTIONS.find((x) => x.key === opt.key).values[0];
  return (P.W[opt.key] ?? 0) * (opt.value / base);
}

export function startBot2(charId, ch, speed = 16) {
  clearInterval(window.__bot);
  window.__log = [];
  window.__dmg = [];
  const P = profile(charId);
  // speed：每帧模拟步数；'max' = 每帧在 10ms 预算内尽可能多跑（极速）
  GameScene.simSpeed = speed === 'max' ? Infinity : speed;
  GameScene.simBudgetMs = speed === 'max' ? 10 : 0;
  // 战斗走位按模拟时间决策：每 6 步（0.1 秒游戏时间）一次，与倍速、帧率无关
  let k = 0;
  GameScene.onStep = () => {
    if (k++ % 6 === 0) move(P);
  };
  run.start(charId, ch);
  game.scene.getScenes(true).forEach((s) => s.scene.stop());
  game.scene.start('Game');
  window.__botState = { done: false, win: false, charId, ch, t0: performance.now() };
  window.__log = [];
  window.__econ = { spent: 0, reroll: 0, rerolls: 0, t4Seen: 0, t4Bought: 0, seen: new WeakSet() };
  let lastFrame = -1;
  // scene.stop 要到下一帧才生效：先确认新的一局开始了，再认结算画面（否则会误读上一局的结算）
  let sawGame = false;
  window.__bot = setInterval(() => {
    // 每个渲染帧最多操作一次（高倍速时一帧可能超过 30ms，避免重复点击）
    if (game.loop.frame === lastFrame) return;
    lastFrame = game.loop.frame;
    const act = game.scene.getScenes(true).map((s) => s.scene.key);
    if (act.includes('Game')) sawGame = true;
    if (act.includes('LevelUp')) {
      const s = game.scene.getScene('LevelUp');
      if (s.relicChoices?.length) {
        // 遗物三选一：增益 > 交易 > 诅咒
        const rank = { boon: 0, trade: 1, curse: 2 };
        const best = [...s.relicChoices].sort((a, b) => rank[a.kind] - rank[b.kind])[0];
        s.options.find((o) => o.key === `relic:${best.id}`)?.pick();
      } else if (s.options.length) {
        const best = [...s.options].sort((a, b) => levelValue(b, P) - levelValue(a, P))[0];
        best.pick();
      } else if (s.crateItem) {
        const btns = [...s.children.list, ...s.layer.list].filter((o) => o.type === 'Container' && o.label);
        const take = itemValue(s.crateItem, P) >= 0;
        const b = btns.find((o) => o.label.text.includes(take ? '拿走' : '回收'));
        if (b) b.emit('pointerup');
      }
    } else if (act.includes('Shop')) shop(P);
    else if (sawGame && act.includes('Result')) {
      const r = game.scene.getScene('Result');
      const win = r.children.list.some((o) => o.type === 'Text' && o.text.includes('通关'));
      clearInterval(window.__bot);
      GameScene.onStep = null;
      window.__botState = {
        ...window.__botState,
        done: true,
        win,
        wave: run.wave,
        kills: run.kills,
        level: run.level,
        items: Object.values(run.items).reduce((a, b) => a + b, 0),
        weapons: run.weapons.map((w) => w.id + w.tier).join(','),
        sec: Math.round((performance.now() - window.__botState.t0) / 1000),
        final: snapshot(),
        waves: window.__log,
      };
    }
  }, 4);
}

function move(P) {
  const g = game.scene.getScene('Game');
  const p = g.player;
  if (!p || g.dead) return;
  let near = 0,
    nearest = 1e9;
  for (const e of g.enemies)
    if (e.alive) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < 260) near++;
      if (d < nearest) nearest = d;
    }
  const dangerR = P.melee ? 70 : 150;
  const wantD = P.melee ? 95 : 230;
  let best = [0, 0],
    bestScore = -1e9;
  for (let i = 0; i <= 16; i++) {
    const a = (i / 16) * Math.PI * 2,
      still = i === 16;
    const dx = still ? 0 : Math.cos(a),
      dy = still ? 0 : Math.sin(a);
    const x = p.x + dx * 80,
      y = p.y + dy * 80;
    let score = 0,
      nd = 1e9;
    for (const e of g.enemies)
      if (e.alive) {
        const ex = e.x + (e.state === 'charge' ? e.dirX * e.stateSpeed * 0.35 : 0),
          ey = e.y + (e.state === 'charge' ? e.dirY * e.stateSpeed * 0.35 : 0);
        const d = Math.hypot(x - ex, y - ey) - e.radius;
        nd = Math.min(nd, d);
        const r = e.isBoss || e.state === 'windup' || e.state === 'charge' || e.state === 'fuse' ? 170 : dangerR;
        if (d < r) score -= (r - d) * (d < 30 ? 8 : 1) * (e.isBoss ? 2 : 1);
      }
    for (const b of g.enemyBullets)
      if (b.alive) {
        const d = Math.min(
          Math.hypot(x - b.x - b.vx * 0.35, y - b.y - b.vy * 0.35),
          Math.hypot(x - b.x - b.vx * 0.15, y - b.y - b.vy * 0.15),
        );
        if (d < 70) score -= (70 - d) * 12;
      }
    for (const h of g.hazards) {
      const d = Math.hypot(x - h.x, y - h.y) - h.r;
      if (d < 25) score -= (25 - d) * 6;
    }
    if (nd < 1e8) score -= Math.abs(nd - wantD) * (P.melee ? 0.6 : 0.2);
    score -= Math.hypot(x - 960, y - 600) * 0.12;
    if (x < 80 || x > 1840 || y < 80 || y > 1120) score -= 400;
    // 捡番茄籽
    for (const pk of g.pickups)
      if (pk.alive && pk.kind !== 'crate') {
        const d = Math.hypot(x - pk.img.x, y - pk.img.y);
        if (d < 120) score += (120 - d) * 0.05;
      }
    if (score > bestScore) {
      bestScore = score;
      best = [dx, dy];
    }
  }
  controls.joyX = best[0];
  controls.joyY = best[1];
  const hpPct = run.hp / g.stats.maxHp;
  const sk = g.skill.skill.type;
  if (
    g.skill.ready &&
    ((near >= 6 && sk !== 'heal') ||
      (sk === 'heal' && hpPct < 0.6) ||
      ((sk === 'ghost' || sk === 'dash') && hpPct < 0.5 && nearest < 120) ||
      (sk === 'buff' && near >= 4) ||
      (sk === 'clone' && near >= 3))
  )
    controls.skillPressed = true;
}

function shop(P) {
  const s = game.scene.getScene('Shop');
  // 1.4.0 弹窗：神秘商人（钱够多才买）与路线选择（默认普通路线）
  if (s.modalChoices?.length) {
    const m = s.modalChoices;
    const buy = m.find((c) => c.label.startsWith('买下'));
    const price = Number(buy?.label.match(/\d+/)?.[0] ?? Infinity);
    const pick = buy && buy.enabled && run.seeds > price * 3 ? buy : (m.find((c) => c.label === '普通路线') ?? m[m.length - 1]);
    pick.pick();
    return;
  }
  const evo = run.weapons.find((w) => run.canEvolve(w));
  if (evo) {
    run.evolve(evo.uid);
    s.draw();
    return;
  }
  for (const o of run.shop)
    if (o.kind === 'weapon' && o.tier === 3 && !window.__econ.seen.has(o)) {
      window.__econ.seen.add(o);
      window.__econ.t4Seen++;
    }
  const cand = run.shop
    .filter((o) => !o.sold && o.price <= run.seeds && (o.kind === 'item' || run.canAddWeapon(o.id, o.tier)))
    .map((o) => ({
      o,
      v:
        (o.kind === 'item' ? itemValue(ITEM_MAP[o.id], P) : run.weapons.length < 4 ? weaponValue(o, P) * 2 : weaponValue(o, P)) /
        Math.max(1, o.price),
    }))
    .filter((x) => x.v > 0.04)
    .sort((a, b) => b.v - a.v);
  // 满栏时：卖掉最弱的低品质武器，给买得起的 T3+ 主流派 / 契合武器腾位置（真人玩家的常见操作）
  const worth = (w) => weaponValue(w, P) + (run.weapons.some((b) => b.uid !== w.uid && b.id === w.id && b.tier === w.tier) ? 5 : 0);
  const weakest = (o) => run.weapons.filter((w) => w.tier < o.tier && worth(w) < weaponValue(o, P)).sort((a, b) => worth(a) - worth(b))[0];
  const sellOf = (w) => sellPrice(s.price(WEAPON_MAP[w.id].price * TIER_PRICE_MULT[w.tier]));
  const want = (o) => !o.sold && o.kind === 'weapon' && o.tier >= 2 && (WEAPON_MAP[o.id].cls === P.main || run.char.favored.includes(o.id));
  const swap = run.shop.find((o) => want(o) && !run.canAddWeapon(o.id, o.tier) && weakest(o) && o.price <= run.seeds + sellOf(weakest(o)));
  if (swap) {
    const w = weakest(swap);
    run.seeds += sellOf(w);
    run.removeWeapon(w.uid);
    s.draw();
    return;
  }
  // 攒钱：主流派 / 契合的 T3+ 武器暂时买不起、但下一波收入后买得起 → 锁定并留钱
  const lastInc = Object.values(run.income[run.wave] ?? {}).reduce((a, b) => a + b, 0);
  const goal = run.shop.find(
    (o) =>
      !o.sold &&
      o.kind === 'weapon' &&
      o.tier >= 2 &&
      o.price > run.seeds &&
      o.price <= run.seeds + lastInc * 1.1 &&
      (WEAPON_MAP[o.id].cls === P.main || run.char.favored.includes(o.id)) &&
      (run.canAddWeapon(o.id, o.tier) || weakest(o)),
  );
  if (goal) {
    goal.locked = true;
    window.__log.push(snapshot());
    s.nextWave();
    return;
  }
  if (cand.length) {
    window.__econ.spent += cand[0].o.price;
    if (cand[0].o.kind === 'weapon' && cand[0].o.tier === 3) window.__econ.t4Bought++;
    s.buy(cand[0].o);
    return;
  }
  const dup = run.weapons.find((a) => a.tier < 3 && run.weapons.some((b) => b.uid !== a.uid && b.id === a.id && b.tier === a.tier));
  if (dup) {
    run.combine(dup.uid);
    s.draw();
    return;
  }
  // 满栏时卖掉非主流派的最低品质武器，给主流派腾位置
  const rp = s.rerollCost();
  if (run.rerolls < run.maxRerolls && run.seeds > rp * 3) {
    run.seeds -= rp;
    window.__econ.reroll += rp;
    window.__econ.rerolls++;
    run.rerolls++;
    s.rollShop(true);
    s.draw();
    return;
  }
  window.__log.push(snapshot());
  s.nextWave();
}
const STAT_KEYS = [
  'maxHp',
  'damage',
  'meleePct',
  'rangedPct',
  'elementalPct',
  'auraPct',
  'attackSpeed',
  'crit',
  'armor',
  'dodge',
  'speed',
  'luck',
  'harvest',
  'pickup',
  'regen',
  'lifeSteal',
  'range',
];
/** 当前构筑快照：经济、属性、道具、武器品质（每次离开商店与结算时记录） */
function snapshot() {
  const st = run.stats;
  const earned = Object.values(run.income).reduce((a, w) => a + Object.values(w).reduce((x, y) => x + Math.max(0, y), 0), 0);
  const wt = [0, 0, 0, 0];
  for (const w of run.weapons) wt[w.tier]++;
  const ir = [0, 0, 0, 0];
  for (const [id, n] of Object.entries(run.items)) ir[ITEM_MAP[id]?.rarity ?? 0] += n;
  return {
    wave: run.wave,
    lvl: run.level,
    kills: run.kills,
    seeds: run.seeds,
    earned: Math.round(earned),
    inc: Object.fromEntries(Object.entries(run.income[run.wave] ?? {}).map(([k, v]) => [k, Math.round(v)])),
    spent: window.__econ.spent,
    reroll: window.__econ.reroll,
    rerolls: window.__econ.rerolls,
    t4Seen: window.__econ.t4Seen,
    t4Bought: window.__econ.t4Bought,
    items: ir.reduce((a, b) => a + b, 0),
    itemRarity: ir,
    weapons: run.weapons.length,
    wTier: wt,
    forge: Math.max(0, ...run.weapons.map((w) => w.forge ?? 0)),
    evolved: run.weapons.filter((w) => WEAPON_MAP[w.id].evolvedFrom).length,
    stats: Object.fromEntries(STAT_KEYS.map((k) => [k, Math.round(st[k] ?? 0)])),
  };
}

/** 依次测试多个角色，结果写入 window.__results 与 localStorage */
export async function runBatch(ids, ch, speed = 16) {
  window.__results = JSON.parse(localStorage.getItem('botResults') || '[]');
  for (const id of ids) {
    startBot2(id, ch, speed);
    while (!window.__botState.done) await new Promise((r) => setTimeout(r, 500));
    const r = { ...window.__botState };
    const agg = {};
    for (const [, , src, d] of window.__dmg) agg[src] = (agg[src] || 0) + d;
    r.topDmg = Object.entries(agg)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${k}:${Math.round(v)}`)
      .join(' ');
    window.__results.push(r);
    localStorage.setItem('botResults', JSON.stringify(window.__results));
  }
  return window.__results;
}

/**
 * 按角色主流派自动加天赋（平衡测试用）：近战 力量→守护→迅捷，远程 力量→迅捷→守护，元素 炼金→奥术→力量。
 * 每个方向按道路顺序加点，遵守前置与终极天赋的投入要求。
 */
export function botTalents(charId, budget, exclude = []) {
  const { TALENT_NODES, setTalents } = window.__dev;
  const P = profile(charId);
  const order =
    P.main === 'melee'
      ? ['might', 'guard', 'agility']
      : P.main === 'ranged'
        ? ['might', 'agility', 'guard']
        : ['alchemy', 'arcane', 'might'];
  const t = {};
  for (const b of order) {
    const nodes = TALENT_NODES.filter((n) => n.branch === b);
    const spent = () => nodes.reduce((s, n) => s + (t[n.id] ?? 0), 0);
    let progress = true;
    while (budget > 0 && progress) {
      progress = false;
      for (const n of nodes) {
        if (budget <= 0) break;
        if ((t[n.id] ?? 0) >= n.max || exclude.includes(n.id)) continue;
        if (n.parent && !t[n.parent]) continue;
        if (n.needPoints && spent() < n.needPoints) continue;
        t[n.id] = (t[n.id] ?? 0) + 1;
        budget--;
        progress = true;
      }
    }
  }
  setTalents(t);
  return t;
}
window.botTalents = botTalents;
window.startBot2 = startBot2;
/** 只接管战斗走位与技能（录制宣传视频用，不处理菜单） */
window.botAutopilot = (charId) => {
  const P = profile(charId);
  let k = 0;
  GameScene.onStep = () => {
    if (k++ % 6 === 0) move(P);
  };
};
window.runBatch = runBatch;
window.ALL_CHARS = CHARACTERS.map((c) => c.id);

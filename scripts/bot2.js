// 自动化平衡测试机器人 v2（开发用）
// 用法：await import('/scripts/bot2.js'); runBatch(['tomato','carrot'], 2, 16)
// 按角色流派：近战贴近敌人、远程保持距离；按流派评估道具/升级/武器价值
const { CHARACTER_MAP, CHARACTERS, WEAPON_MAP, ITEM_MAP, LEVELUP_OPTIONS } = window.__dev;

function profile(charId) {
  const c = CHARACTER_MAP[charId];
  const cls = {};
  for (const w of c.startWeapons) {
    const d = WEAPON_MAP[w];
    cls[d.cls] = (cls[d.cls] ?? 0) + 1;
  }
  const main = Object.entries(cls).sort((a, b) => b[1] - a[1])[0][0];
  const statOf = { melee: 'melee', ranged: 'ranged', elemental: 'elemental' };
  const W = {
    maxHp: 1,
    regen: 1.1,
    lifeSteal: 1.2,
    damage: 1.6,
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
  if (it.special) v += [2, 5, 9, 16][it.rarity];
  return v;
}

function weaponValue(o, P) {
  const d = WEAPON_MAP[o.id];
  let v = (d.cls === P.main ? 10 : 4) * (1 + o.tier);
  if (run.weapons.some((w) => w.id === o.id && w.tier === o.tier)) v *= 1.4; // 可合成
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
  let lastFrame = -1;
  window.__bot = setInterval(() => {
    // 每个渲染帧最多操作一次（高倍速时一帧可能超过 30ms，避免重复点击）
    if (game.loop.frame === lastFrame) return;
    lastFrame = game.loop.frame;
    const act = game.scene.getScenes(true).map((s) => s.scene.key);
    if (act.includes('LevelUp')) {
      const s = game.scene.getScene('LevelUp');
      if (s.options.length) {
        const best = [...s.options].sort((a, b) => levelValue(b, P) - levelValue(a, P))[0];
        best.pick();
      } else if (s.crateItem) {
        const btns = [...s.children.list, ...s.layer.list].filter((o) => o.type === 'Container' && o.label);
        const take = itemValue(s.crateItem, P) >= 0;
        const b = btns.find((o) => o.label.text.includes(take ? '拿走' : '回收'));
        if (b) b.emit('pointerup');
      }
    } else if (act.includes('Shop')) shop(P);
    else if (act.includes('Result')) {
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
  if (cand.length) {
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
  if (run.rerolls < 5 && run.seeds > rp * 3) {
    run.seeds -= rp;
    run.rerolls++;
    s.rollShop(true);
    s.draw();
    return;
  }
  window.__log.push({
    wave: run.wave,
    lvl: run.level,
    seeds: run.seeds,
    hp: g2().maxHp,
    w: run.weapons.length,
    items: Object.values(run.items).reduce((a, b) => a + b, 0),
  });
  s.nextWave();
}
const g2 = () => run.stats;

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

window.startBot2 = startBot2;
window.runBatch = runBatch;
window.ALL_CHARS = CHARACTERS.map((c) => c.id);

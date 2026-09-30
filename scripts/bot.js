// 自动化平衡测试机器人（开发用）：在浏览器控制台执行 `await import('/scripts/bot.js'); startBot('corn', 1)`
window.startBot = (charId, ch, speed = 4, wave = 1) => {
  clearInterval(window.__bot);
  clearInterval(window.__tr);
  window.__log = [];
  window.__hpTrace = [];
  GameScene.simSpeed = speed;
  run.start(charId, ch);
  run.wave = wave;
  game.scene.getScenes(true).forEach((s) => s.scene.stop());
  game.scene.start('Game');
  const all = (scene) => [...scene.children.list, ...(scene.layer ? scene.layer.list : [])];
  const press = (scene, label) => all(scene).filter((o) => o.type === 'Container' && o.label && o.label.text.includes(label));
  window.__tr = setInterval(() => {
    const g = game.scene.getScene('Game');
    if (game.scene.isActive('Game'))
      window.__hpTrace.push([run.wave, Math.round(g.timeLeft), Math.round(run.hp), g.enemies.filter((e) => e.alive).length]);
  }, 1000);
  window.__bot = setInterval(() => {
    const act = game.scene.getScenes(true).map((s) => s.scene.key);
    if (act.includes('Game') && !act.includes('Pause')) {
      const g = game.scene.getScene('Game');
      const p = g.player;
      // 采样 16 个方向，评估 0.35 秒后位置的危险度（敌人、子弹、危险区、边界），选最安全方向
      let best = null,
        bestScore = -1e9;
      for (let i = 0; i <= 16; i++) {
        const a = (i / 16) * Math.PI * 2,
          still = i === 16;
        const dx = still ? 0 : Math.cos(a),
          dy = still ? 0 : Math.sin(a);
        const sp = 230 * 0.35;
        const x = p.x + dx * sp,
          y = p.y + dy * sp;
        let score = 0;
        for (const e of g.enemies)
          if (e.alive) {
            const ex = e.x + (e.state === 'charge' ? e.dirX * e.stateSpeed * 0.35 : 0),
              ey = e.y + (e.state === 'charge' ? e.dirY * e.stateSpeed * 0.35 : 0);
            const d = Math.hypot(x - ex, y - ey) - e.radius;
            if (d < 160) score -= (160 - d) * (d < 40 ? 8 : 1) * (e.isBoss ? 2 : 1);
          }
        for (const b of g.enemyBullets)
          if (b.alive) {
            const bx = b.x + b.vx * 0.35,
              by = b.y + b.vy * 0.35;
            const d = Math.min(Math.hypot(x - bx, y - by), Math.hypot(x - b.x - b.vx * 0.15, y - b.y - b.vy * 0.15));
            if (d < 70) score -= (70 - d) * 12;
          }
        for (const h of g.hazards) {
          const d = Math.hypot(x - h.x, y - h.y) - h.r;
          if (d < 20) score -= (20 - d) * 6;
        }
        const cx = 960,
          cy = 600;
        score -= Math.hypot(x - cx, y - cy) * 0.15;
        if (x < 80 || x > 1840 || y < 80 || y > 1120) score -= 400;
        if (score > bestScore) {
          bestScore = score;
          best = [dx, dy];
        }
      }
      controls.joyX = best[0];
      controls.joyY = best[1];
      if (g.skill.ready && g.enemies.filter((e) => e.alive).length > 8) controls.skillPressed = true;
    } else if (act.includes('LevelUp')) {
      const s = game.scene.getScene('LevelUp');
      const b = press(s, '选择')[0] || press(s, '拿走')[0];
      if (b) b.emit('pointerup');
    } else if (act.includes('Shop')) {
      const s = game.scene.getScene('Shop');
      // 购买策略：武器少于 5 把时优先武器（同名可合成），其次最贵的可买道具
      const offers = run.shop.filter((o) => !o.sold && o.price <= run.seeds && (o.kind === 'item' || run.canAddWeapon(o.id, o.tier)));
      const w = offers.filter((o) => o.kind === 'weapon');
      const pick = (run.weapons.length < 5 && w.length ? w : offers).sort((a, b) => b.price - a.price)[0];
      if (pick) {
        s.buy(pick);
        return;
      }
      // 合成
      const dup = run.weapons.find((a) => a.tier < 3 && run.weapons.some((b) => b.uid !== a.uid && b.id === a.id && b.tier === a.tier));
      if (dup) {
        run.combine(dup.uid);
        s.draw();
        return;
      }
      const rr = all(s).find((o) => o.type === 'Container' && o.label && o.label.text.startsWith('刷新') && o.label.alpha === 1);
      if (rr && run.rerolls < 4 && run.seeds > 60) {
        rr.emit('pointerup');
        return;
      }
      window.__log.push({
        wave: run.wave,
        lvl: run.level,
        seeds: run.seeds,
        hp: run.stats.maxHp,
        w: run.weapons.map((w) => w.id + w.tier).join(','),
        items: Object.keys(run.items).length,
        kills: run.kills,
      });
      press(s, '下一波')[0].emit('pointerup');
    } else if (act.includes('Result')) {
      window.__log.push({
        result: game.scene
          .getScene('Result')
          .children.list.filter((o) => o.type === 'Text')
          .map((t) => t.text)[0],
        wave: run.wave,
        kills: run.kills,
      });
      clearInterval(window.__bot);
      clearInterval(window.__tr);
    }
  }, 50);
};

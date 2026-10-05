// J3：练习模式——导入构筑（分享码或某局记录），在空场地里打不会动、不会还手、不会死的木桩，实时显示 DPS。
// 复用开发者沙盒的「不刷怪、不计时、不掉落、不结算、阵亡原地复活」开关；不写存档、不记战绩、不计成就。
import type Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import type { Enemy } from '../objects/Enemy';
import { run } from './RunState';
import { applySnapshot, type BuildSnapshot } from './BuildCode';
import { CHAPTERS } from '../data/chapters';
import { tx } from '../i18n';
import { audio } from './Audio';

interface Dummy {
  e: Enemy;
  uid: number;
  x: number;
  y: number;
}

/** 当前练习状态；null = 不在练习模式 */
export let practice: {
  dummies: Dummy[];
  t: number;
  dmg0: number;
  window: [number, number][];
  label: Phaser.GameObjects.Text | null;
} | null = null;
export const inPractice = (): boolean => practice !== null;

const totalDmg = (): number => Object.values(run.dmgBy).reduce((a, b) => a + b, 0);

export function startPractice(scene: Phaser.Scene, b: BuildSnapshot): void {
  applySnapshot(run, b);
  practice = { dummies: [], t: 0, dmg0: 0, window: [], label: null };
  GameScene.sandbox = { terrain: false, deaths: 0 };
  GameScene.onStep = step;
  for (const k of ['Hud', 'Pause', 'Game']) if (scene.scene.isActive(k) || scene.scene.isPaused(k)) scene.scene.stop(k);
  scene.scene.start('Game');
}

/** 退出练习：清掉沙盒开关，回到挑战页（存档里的进行中对局不受影响） */
export function exitPractice(scene: Phaser.Scene): void {
  practice = null;
  GameScene.sandbox = null;
  GameScene.onStep = null;
  audio.stopMusic();
  scene.scene.stop('Hud');
  scene.scene.stop('Game');
  scene.scene.stop('Pause');
  scene.scene.start('Challenge');
}

function spawnDummies(g: GameScene): void {
  const p = g.player;
  const id = CHAPTERS[run.chapterId - 1]?.pool[0]?.enemy ?? 'mold';
  const spots: [number, number][] = [
    [0, -170],
    [-200, 90],
    [200, 90],
  ];
  for (const [dx, dy] of spots) {
    const e = g.spawnEnemyNow(id, p.x + dx, p.y + dy);
    if (e) practice!.dummies.push({ e, uid: e.uid, x: e.x, y: e.y });
  }
  practice!.label = g.add
    .text(p.x, p.y - 120, '', {
      fontFamily: 'system-ui',
      fontSize: '20px',
      color: '#ffd166',
      stroke: '#000000',
      strokeThickness: 5,
      align: 'center',
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(20000);
  practice!.label.setPosition(g.scale.width / 2, 96);
  practice!.dmg0 = totalDmg();
}

function step(g: GameScene): void {
  const s = practice;
  if (!s) return;
  if (!s.dummies.length) spawnDummies(g);
  // 木桩：原地不动、满血、不攻击
  for (const d of s.dummies) {
    const e = d.e;
    if (!e.alive || e.uid !== d.uid) continue;
    e.x = d.x;
    e.y = d.y;
    e.kvx = e.kvy = 0;
    e.hp = e.maxHp;
    e.contactCd = Math.max(e.contactCd, 1);
    if (e.state !== 'move') e.state = 'move';
  }
  // 玩家不会死
  run.hp = Math.max(run.hp, 1);
  s.t += 1 / 60;
  const dealt = totalDmg() - s.dmg0;
  s.window.push([s.t, dealt]);
  while (s.window.length > 2 && s.t - s.window[0][0] > 5) s.window.shift();
  if (s.label && Math.round(s.t * 60) % 15 === 0) {
    const [t0, d0] = s.window[0];
    const dps5 = (dealt - d0) / Math.max(0.5, s.t - t0);
    s.label.setText(
      tx(
        `练习模式 · 5 秒 DPS ${Math.round(dps5).toLocaleString()} · 平均 ${Math.round(dealt / Math.max(1, s.t)).toLocaleString()} · 总伤害 ${Math.round(dealt).toLocaleString()}\nEsc 暂停 → 退出练习`,
        `Practice · 5s DPS ${Math.round(dps5).toLocaleString()} · avg ${Math.round(dealt / Math.max(1, s.t)).toLocaleString()} · total ${Math.round(dealt).toLocaleString()}\nEsc → Quit practice`,
      ),
    );
  }
}

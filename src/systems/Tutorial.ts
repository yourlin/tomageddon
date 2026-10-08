// 新手引导：每条提示只在第一次遇到时弹出一次（记在 save.tutorial），战斗中弹出会暂停游戏。
// 自动化测试（?headless 或 navigator.webdriver）不显示；?tutorial 强制显示（截图用）。
import type Phaser from 'phaser';
import { save, persist } from './Save';
import { overlayRoot } from './OverlayRoot';
import { tx } from '../i18n';

const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
const DISABLED =
  !params.has('tutorial') &&
  (params.has('headless') || (typeof navigator !== 'undefined' && (navigator as Navigator & { webdriver?: boolean }).webdriver));

export type TipKey =
  | 'move'
  | 'seeds'
  | 'skill'
  | 'levelup'
  | 'shop'
  | 'combine'
  | 'affix'
  | 'evolve'
  | 'elite'
  | 'boss'
  | 'talents'
  | 'buyChar'
  | 'endless'
  | 'challenge'
  | 'danger'
  | 'relic'
  | 'merchant'
  | 'quests'
  | 'practice';

/** 提示内容：[标题, 正文]，中英 */
const TIPS: Record<TipKey, () => [string, string]> = {
  move: () => [
    tx('移动与攻击', 'Move & attack'),
    tx(
      '用 WASD / 方向键移动（手机：按住屏幕左侧拖动）。武器会自动瞄准、自动攻击——你只需要走位，躲开敌人和红色预警。',
      'Move with WASD / arrow keys (mobile: drag on the left side). Weapons aim and fire on their own — just keep moving and dodge enemies and red warnings.',
    ),
  ],
  seeds: () => [
    tx('番茄籽', 'Seeds'),
    tx(
      '击败怪物掉落番茄籽：既是经验也是货币。靠近就能吸取；波次结束时没捡的会进入加成池，下一波捡到时双倍。',
      'Monsters drop Seeds — both XP and currency. Walk close to collect them; any left at wave end go into a bonus pool and pay double next wave.',
    ),
  ],
  skill: () => [
    tx('技能就绪', 'Skill ready'),
    tx(
      '右下角的技能已经充能完毕！按空格（手机点技能按钮）释放。默认自动释放，可以在设置里改成手动。',
      'Your skill (bottom right) is charged! Press Space (or tap the button) to cast. It auto-casts by default — switch to manual in Settings.',
    ),
  ],
  levelup: () => [
    tx('升级', 'Level up'),
    tx(
      '每升一级选一项属性。卡片边框颜色代表稀有度，越稀有数值越高；优先选和你武器流派相符的伤害。',
      'Pick one stat per level. Border color shows rarity — rarer is stronger. Favor damage that matches your weapons.',
    ),
  ],
  shop: () => [
    tx('商店', 'Shop'),
    tx(
      '用番茄籽购买武器和道具。🔓 锁定的商品会保留到下一波；刷新有次数上限，越往后越贵；把商品买光会免费补货。准备好了点「下一波」。',
      'Spend Seeds on weapons and items. 🔓 Lock an offer to keep it for next wave; rerolls are limited and get pricier; buying everything restocks for free. Hit "Next Wave" when ready.',
    ),
  ],
  combine: () => [
    tx('武器合成', 'Combining weapons'),
    tx(
      '两把同名同品质的武器可以合成为更高一级（I → II → III → IV）。点击下方武器栏里的武器即可合成或出售。',
      'Two identical weapons of the same tier combine into the next tier (I → II → III → IV). Tap a weapon in your slots to combine or sell it.',
    ),
  ],
  affix: () => [
    tx('词条与打造', 'Affixes & forging'),
    tx(
      'III / IV 级武器会带随机词条，点开武器可以花番茄籽洗练；IV 级武器还能打造升级到 +10，等级越高越贵、成功率越低。',
      'Tier III / IV weapons roll random affixes you can reroll for Seeds; tier IV weapons can also be forged up to +10 — pricier and riskier each level.',
    ),
  ],
  evolve: () => [
    tx('可以合成超武了！', 'Super weapon ready!'),
    tx(
      '超武配方的两把 T4 和道具都齐了：点开带 ✨ 的武器，按配方合成超武（会消耗两把材料武器和道具）。',
      'You have both T4s and the items for a super weapon recipe: tap the ✨ weapon to craft it (uses up both weapons and the items).',
    ),
  ],
  elite: () => [
    tx('精英来袭', 'Elite incoming'),
    tx(
      '第 5、10 波会出现精英：血厚、招式多，倒计时结束前打不死会狂暴并持续造成伤害。留意它的预警动作。',
      'Elites appear on waves 5 and 10: tanky with special attacks. If the timer runs out they enrage and deal steady damage. Watch their wind-ups.',
    ),
  ],
  boss: () => [
    tx('Boss 战', 'Boss fight'),
    tx(
      '每章最后一波是 Boss 战（第 1–4 章第 15 波，之后的章节更长），击败它就能通关本章。Boss 有二阶段，90 秒后狂暴，伤害会不断叠加——尽快输出！',
      'The last wave of each chapter is the boss (wave 15 in chapters 1–4; later chapters are longer) — beat it to clear the chapter. Bosses have a second phase and enrage after 90s, stacking damage over time. Burst it down!',
    ),
  ],
  talents: () => [
    tx('获得天赋点', 'Talent points earned'),
    tx(
      '里程碑成就奖励了天赋点！到主菜单「天赋」里加点，强化开局属性或解锁特殊能力，随时可以免费重置。',
      'Milestone achievements gave you talent points! Spend them under "Talents" on the main menu to boost starting stats or unlock abilities — free to reset.',
    ),
  ],
  buyChar: () => [
    tx('解锁新角色', 'Unlock characters'),
    tx(
      '你达成了成就，解锁了新角色！每名未解锁的角色都对应一项成就，在选角界面选中带 🔒 的角色可以看到条件和进度。每名角色都有不同的技能和天赋。',
      'An achievement unlocked a new character! Every locked character is tied to one achievement: select a 🔒 character on the character screen to see its requirement and progress. Each has a unique skill and talent.',
    ),
  ],
  endless: () => [
    tx('无尽模式已解锁', 'Endless unlocked'),
    tx(
      '通关后可以在选角界面打开这一章的「无尽模式」：不限波数，怪物越来越强，看你能坚持到第几波。',
      'Cleared chapters can be played in Endless from the character screen: no wave limit, ever-stronger monsters — how far can you go?',
    ),
  ],
  challenge: () => [
    tx('每日 / 每周挑战', 'Daily / Weekly'),
    tx(
      '每天和每周都会换一套固定的角色、章节和规则，商店也一样。挑战会临时借用角色，记录你的个人最佳。',
      'A fixed character, chapter, ruleset and shop every day and every week. Characters are lent for the challenge, and your personal best is recorded.',
    ),
  ],
  // L5：1.4.0 新系统
  danger: () => [
    tx('番茄危机', 'Tomato Danger'),
    tx(
      '这一章已开放危机等级：在选角界面右侧调高等级，敌人更强、规则更苛刻，但金番茄奖励更多。每在一个等级通关，就解锁下一级（最高 20）。',
      'Danger levels are open for this chapter: raise it on the right of the character screen. Tougher foes and harsher rules, but more Golden Tomatoes. Clear a level to unlock the next (up to 20).',
    ),
  ],
  relic: () => [
    tx('遗物', 'Relics'),
    tx(
      '击败精英后三选一遗物：遗物整局生效、不占道具栏。收集同一套装的遗物会激活额外的套装效果；有些遗物带代价，看清楚再拿。',
      'Beat an elite to pick 1 of 3 relics. Relics last the whole run and take no item slot. Collect a full set for a bonus; some relics have a cost — read before you take.',
    ),
  ],
  merchant: () => [
    tx('神秘商人', 'Mysterious Merchant'),
    tx(
      '商店里偶尔会出现神秘商人，出售交易或诅咒型遗物：效果强，但会带来代价。每次只卖一件，错过就没了。',
      'A merchant sometimes appears in the shop, selling a trade or cursed relic: powerful, with a price. One offer only — miss it and it is gone.',
    ),
  ],
  quests: () => [
    tx('角色任务与熟练度', 'Character quests & Mastery'),
    tx(
      '每名角色都有 3 个专属任务，全部完成后可开启「觉醒」被动。用某个角色游玩还会积累熟练度，升级后有开局奖励，满 10 级免费解锁皮肤。',
      'Each character has 3 quests; finish them all to toggle their Awakening passive. Playing a character also builds Mastery, with starting bonuses and a free skin at level 10.',
    ),
  ],
  practice: () => [
    tx('练习与自定义挑战', 'Practice & Custom challenges'),
    tx(
      '「练习模式」可以导入任意一局的构筑分享码，对着木桩测试 DPS；「自定义挑战」可以自由组合角色、章节和规则。两者都不计成就。',
      'Practice mode loads any run’s build code and lets you test DPS on dummies; Custom challenges let you mix any character, chapter and rules. Neither counts toward achievements.',
    ),
  ],
};

interface TipItem {
  key: TipKey;
  /** 触发提示的场景：它关闭或休眠时，提示随之收起，不会带进下一个场景 */
  owner?: Phaser.Scene;
  /** 显示期间是否暂停 owner（战斗场景用） */
  pause: boolean;
}

const queue: TipItem[] = [];
let showing = false;
/** 当前正在显示的提示，以及收起它的函数 */
let current: { item: TipItem; close: () => void } | null = null;
/** 已挂过离场监听的场景，避免重复挂 */
const watched = new WeakSet<Phaser.Scene>();

export const seenTip = (key: TipKey): boolean => !!save.tutorial[key];

/**
 * 显示一次提示。owner 为触发它的场景：该场景 shutdown / sleep 时提示自动收起，
 * 还没轮到显示的排队提示也一并丢弃（不记为已读，下次进入该场景会再弹）。
 * pause 为 true 时显示期间暂停 owner，直到点「知道了」。
 */
export function tip(key: TipKey, owner?: Phaser.Scene, pause = false): void {
  if (DISABLED || save.tutorial[key] || queue.some((q) => q.key === key) || current?.item.key === key) return;
  if (typeof document === 'undefined') return;
  if (owner) watchOwner(owner);
  queue.push({ key, owner, pause });
  if (!showing) next();
}

/** 场景离开时收起它的提示 */
function watchOwner(scene: Phaser.Scene): void {
  if (watched.has(scene)) return;
  watched.add(scene);
  const leave = () => {
    // autoRelayout（旋转屏幕 / 缩放窗口）会 restart 同一个场景，也会触发 shutdown。
    // 稍等一下再判断：场景已重新运行说明只是重排布局，提示保留；否则才是真正离开
    setTimeout(() => {
      const s = scene.sys;
      if (!s || (!s.isActive() && !s.isPaused())) dismissFor(scene);
    }, 200);
  };
  // 场景实例会被 Phaser 复用，所以用 on 而不是 once，每次离开都要清理
  scene.events.on('shutdown', leave);
  scene.events.on('sleep', leave);
}

/** 收起 scene 触发的提示：丢弃其排队项，正在显示的立即关闭 */
export function dismissFor(scene: Phaser.Scene): void {
  for (let i = queue.length - 1; i >= 0; i--) if (queue[i].owner === scene) queue.splice(i, 1);
  if (current?.item.owner === scene) current.close();
}

export function resetTutorial(): void {
  save.tutorial = {};
  persist();
}

function next(): void {
  const item = queue.shift();
  showing = !!item;
  if (!item) return;
  // 真正显示出来才记为已读：排队中被场景切换丢弃的提示以后还会出现
  save.tutorial[item.key] = true;
  persist();
  const [title, body] = TIPS[item.key]();
  if (item.pause && item.owner?.scene.isActive()) item.owner.scene.pause();
  const el = document.createElement('div');
  el.style.cssText =
    'position:fixed;left:50%;bottom:9%;transform:translate(-50%,30px);opacity:0;z-index:40;max-width:min(560px,86vw);' +
    'padding:16px 20px 14px;border-radius:14px;background:rgba(36,14,18,0.96);border:2px solid #ffd166;color:#fff4ea;' +
    'font:15px/1.55 "PingFang SC","Microsoft YaHei",sans-serif;box-shadow:0 10px 30px rgba(0,0,0,0.5);transition:all .25s ease;';
  el.innerHTML =
    `<div style="font-size:12px;color:#ffd166;letter-spacing:1px">💡 ${tx('新手提示', 'TIP')}</div>` +
    `<div style="font-size:19px;font-weight:bold;margin:2px 0 6px">${title}</div><div style="opacity:.9">${body}</div>`;
  const btn = document.createElement('button');
  btn.textContent = tx('知道了', 'Got it');
  btn.style.cssText =
    'margin-top:12px;float:right;padding:7px 22px;border:none;border-radius:9px;background:#ff4b3e;color:#fff;font:bold 15px sans-serif;cursor:pointer;';
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    current = null;
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
    if (item.pause && item.owner?.scene.isPaused()) item.owner.scene.resume();
    setTimeout(next, 300);
  };
  current = { item, close };
  btn.onclick = close;
  el.appendChild(btn);
  overlayRoot().appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%,0)';
  });
}

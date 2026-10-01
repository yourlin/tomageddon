// 新手引导：每条提示只在第一次遇到时弹出一次（记在 save.tutorial），战斗中弹出会暂停游戏。
// 自动化测试（?headless 或 navigator.webdriver）不显示；?tutorial 强制显示（截图用）。
import type Phaser from 'phaser';
import { save, persist } from './Save';
import { overlayRoot } from './ForceLandscape';
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
  | 'challenge';

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
    tx('武器进化！', 'Weapon evolution!'),
    tx(
      '你的 IV 级武器已经集齐进化道具了：点开带 ✨ 的武器，把它进化成超武。进化保留原来的词条和打造等级。',
      'Your tier IV weapon has its evolution item: tap the ✨ weapon to evolve it into a super weapon. Affixes and forge level are kept.',
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
      '第 15 波是 Boss 战，击败它就能通关本章。Boss 有二阶段，90 秒后狂暴，伤害会不断叠加——尽快输出！',
      'Wave 15 is the boss — beat it to clear the chapter. Bosses have a second phase and enrage after 90s, stacking damage over time. Burst it down!',
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
      '成就点已经够买新角色了！在选角界面选中带价格的角色，点「购买」即可。每名角色都有不同的技能和天赋。',
      'You have enough achievement points for a new character! Select a priced character on the character screen and hit "Buy". Each has a unique skill and talent.',
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
};

const queue: { key: TipKey; pause?: Phaser.Scene }[] = [];
let showing = false;

export const seenTip = (key: TipKey): boolean => !!save.tutorial[key];

/** 显示一次提示；pause 传入战斗场景时暂停直到点「知道了」 */
export function tip(key: TipKey, pause?: Phaser.Scene): void {
  if (DISABLED || save.tutorial[key] || queue.some((q) => q.key === key) || typeof document === 'undefined') return;
  save.tutorial[key] = true;
  persist();
  queue.push({ key, pause });
  if (!showing) next();
}

export function resetTutorial(): void {
  save.tutorial = {};
  persist();
}

function next(): void {
  const item = queue.shift();
  showing = !!item;
  if (!item) return;
  const [title, body] = TIPS[item.key]();
  if (item.pause?.scene.isActive()) item.pause.scene.pause();
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
  const close = () => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
    if (item.pause?.scene.isPaused()) item.pause.scene.resume();
    setTimeout(next, 300);
  };
  btn.onclick = close;
  el.appendChild(btn);
  overlayRoot().appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%,0)';
  });
}

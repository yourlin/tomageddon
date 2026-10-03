// K4 音效 / 音乐试听。开发者界面默认静音（save.settings.sfx / music 被设为 0），
// 试听时临时写入试听音量，播放调用结束后立即还原设置；音乐引擎的音量在停止时还原。
import Phaser from 'phaser';
import { h, btn, num } from '../dom';
import type { DevCtx } from '../ctx';
import { audio, type Sfx } from '../../systems/Audio';
import { TRACKS } from '../../systems/Music';
import { AVAILABLE_AUDIO } from '../../systems/Assets';
import { save } from '../../systems/Save';
import { CHAPTERS } from '../../data/chapters';

/** 全部音效（与 systems/Audio.ts 的 Sfx 一致；Record 保证新增音效时这里会报类型错误） */
const SFX_NAME: Record<Sfx, string> = {
  hit: '命中',
  crit: '暴击',
  shoot: '射击',
  pickup: '拾取',
  levelup: '升级',
  hurt: '受伤',
  explode: '爆炸',
  buy: '购买',
  click: '点击',
  boss: 'Boss 登场',
  skill: '技能',
  die: '死亡',
  wave: '波次',
};

const MUSIC_NAME: Record<string, string> = {
  bgm_menu: '主菜单',
  bgm_shop: '商店',
  bgm_boss: 'Boss 战',
};

let vol = 0.6;
let playing = '';

/** 播放音频需要一个场景（文件音频走场景的 sound / cache）：优先沙盒，其次任意活动场景 */
function anyScene(ctx: DevCtx): Phaser.Scene | null {
  if (ctx.sb.running) return ctx.sb.g;
  return ctx.sb.game.scene.getScenes(true)[0] ?? null;
}

function stopMusic(): void {
  audio.stopMusic();
  audio.setMusicVolume(save.settings.music);
  playing = '';
}

export function renderAudio(ctx: DevCtx): HTMLElement {
  const root = h('div');
  const now = h('span', { class: 'muted' });
  const showNow = () => (now.textContent = playing ? `正在试听：${playing}` : '');

  const playSfx = (name: Sfx) => {
    const s = anyScene(ctx);
    if (!s) return ctx.toast('没有可用的场景', true);
    const prev = save.settings.sfx;
    save.settings.sfx = vol;
    try {
      audio.unlock();
      audio.play(s, name, 0);
    } finally {
      save.settings.sfx = prev;
    }
  };
  const playMusic = (key: string) => {
    const s = anyScene(ctx);
    if (!s) return ctx.toast('没有可用的场景', true);
    const prev = save.settings.music;
    save.settings.music = vol;
    try {
      audio.unlock();
      audio.stopMusic(); // playMusic 遇到同名曲目会直接返回，先停掉才能按试听音量重新开始
      audio.playMusic(s, key);
      audio.setMusicVolume(vol); // 程序化音乐引擎只在首次创建时读取音量
    } finally {
      save.settings.music = prev;
    }
    playing = key;
    showNow();
    // 沙盒重启 / 场景切换时 Game 会关闭：把音乐引擎音量还原，避免之后的战斗音乐以试听音量响起
    if (s === ctx.sb.g)
      s.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        if (playing === key) {
          audio.setMusicVolume(save.settings.music);
          playing = '';
        }
      });
  };

  const fileTag = (key: string) =>
    AVAILABLE_AUDIO.has(key) ? h('span', { class: 'tag good' }, '文件') : h('span', { class: 'tag muted' }, '合成');
  const trackKeys = [...new Set([...Object.keys(TRACKS), ...[...AVAILABLE_AUDIO].filter((k) => k.startsWith('bgm_'))])].sort();
  const extraAudio = [...AVAILABLE_AUDIO].filter((k) => !k.startsWith('bgm_') && !k.startsWith('sfx_')).sort();

  root.append(
    h(
      'div',
      { class: 'row' },
      h('span', null, '试听音量'),
      num(vol, (v) => (vol = v), { min: 0.05, max: 1, step: 0.05, width: 60 }),
      h(
        'span',
        { class: 'muted small' },
        `当前设置：音效 ${save.settings.sfx} · 音乐 ${save.settings.music}（开发者界面默认静音，试听不改设置）`,
      ),
    ),
    h('div', { class: 'muted' }, `音效（${Object.keys(SFX_NAME).length}，src/assets/audio 有 sfx_xxx 文件时播放文件，否则 WebAudio 合成）`),
    h(
      'div',
      { class: 'row' },
      ...(Object.keys(SFX_NAME) as Sfx[]).map((k) =>
        h(
          'span',
          { class: 'nw' },
          btn(`${SFX_NAME[k]}（${k}）`, () => playSfx(k)),
          fileTag(`sfx_${k}`),
        ),
      ),
    ),
    h('div', { class: 'muted' }, `音乐（${trackKeys.length}，有 bgm 文件时播放文件，否则程序化电子乐 Music.ts）`),
    h(
      'div',
      { class: 'row' },
      ...trackKeys.map((k) => {
        const ch = CHAPTERS.find((c) => c.music === k);
        const name = MUSIC_NAME[k] ?? (ch ? `第 ${ch.id} 章 ${ch.name}` : '');
        return h(
          'span',
          { class: 'nw' },
          btn(`▶ ${name ? `${name}（${k}）` : k}`, () => playMusic(k)),
          fileTag(k),
        );
      }),
      btn(
        '■ 停止音乐',
        () => {
          stopMusic();
          showNow();
        },
        'pri',
      ),
      now,
    ),
    extraAudio.length ? h('div', { class: 'muted small' }, `其他音频文件（未被音效 / 音乐引用）：${extraAudio.join('、')}`) : '',
    h('div', { class: 'muted small' }, '停止后不会自动恢复战斗音乐；重启沙盒即可恢复。'),
  );
  showNow();
  return root;
}

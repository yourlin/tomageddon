// 音效与音乐：优先播放 src/assets/audio 中的文件；缺失时音效用 WebAudio 合成，音乐用程序化电子乐（Music.ts）。
import Phaser from 'phaser';
import { AVAILABLE_AUDIO } from './Assets';
import { save } from './Save';
import { playProceduralMusic, stopProceduralMusic, setProceduralVolume } from './Music';

/** 测试模式（自动化平衡测试）不发声，节省 CPU */
const MUTED = new URLSearchParams(location.search).has('headless');

export type Sfx =
  'hit' | 'shoot' | 'pickup' | 'levelup' | 'hurt' | 'explode' | 'buy' | 'click' | 'boss' | 'skill' | 'die' | 'wave' | 'crit';

const SYNTH: Record<Sfx, { type: OscillatorType; f0: number; f1: number; dur: number; vol: number; noise?: boolean }> = {
  hit: { type: 'square', f0: 320, f1: 120, dur: 0.06, vol: 0.12 },
  crit: { type: 'square', f0: 700, f1: 200, dur: 0.1, vol: 0.16 },
  shoot: { type: 'triangle', f0: 900, f1: 400, dur: 0.05, vol: 0.06 },
  pickup: { type: 'sine', f0: 900, f1: 1400, dur: 0.06, vol: 0.08 },
  levelup: { type: 'triangle', f0: 400, f1: 1200, dur: 0.35, vol: 0.2 },
  hurt: { type: 'sawtooth', f0: 220, f1: 60, dur: 0.18, vol: 0.2 },
  explode: { type: 'sawtooth', f0: 120, f1: 30, dur: 0.3, vol: 0.2, noise: true },
  buy: { type: 'sine', f0: 600, f1: 1200, dur: 0.15, vol: 0.18 },
  click: { type: 'sine', f0: 700, f1: 700, dur: 0.04, vol: 0.12 },
  boss: { type: 'sawtooth', f0: 80, f1: 40, dur: 1.0, vol: 0.25 },
  skill: { type: 'triangle', f0: 300, f1: 900, dur: 0.25, vol: 0.2 },
  die: { type: 'sawtooth', f0: 400, f1: 40, dur: 0.9, vol: 0.25 },
  wave: { type: 'triangle', f0: 500, f1: 1000, dur: 0.4, vol: 0.18 },
};

class AudioManager {
  private ctx: AudioContext | null = null;
  private last: Partial<Record<Sfx, number>> = {};
  private music: Phaser.Sound.BaseSound | null = null;
  private musicKey = '';

  private getCtx(): AudioContext | null {
    if (MUTED) return null;
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AC();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  play(scene: Phaser.Scene, name: Sfx, minGap = 0.04): void {
    const vol = save.settings.sfx;
    if (vol <= 0) return;
    const now = performance.now() / 1000;
    if ((this.last[name] ?? 0) + minGap > now) return;
    this.last[name] = now;
    const key = `sfx_${name}`;
    if (AVAILABLE_AUDIO.has(key) && scene.cache.audio.exists(key)) {
      scene.sound.play(key, { volume: vol });
      return;
    }
    const ctx = this.getCtx();
    if (!ctx) return;
    const s = SYNTH[name];
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(s.vol * vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + s.dur);
    gain.connect(ctx.destination);
    if (s.noise) {
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * s.dur), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(gain);
      src.start(t);
    }
    const osc = ctx.createOscillator();
    osc.type = s.type;
    osc.frequency.setValueAtTime(s.f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, s.f1), t + s.dur);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + s.dur + 0.02);
  }

  playMusic(scene: Phaser.Scene, key: string): void {
    if (this.musicKey === key) return;
    this.stopMusic();
    this.musicKey = key;
    if (AVAILABLE_AUDIO.has(key) && scene.cache.audio.exists(key)) {
      this.music = scene.sound.add(key, { loop: true, volume: save.settings.music });
      this.music.play();
      return;
    }
    const ctx = this.getCtx();
    if (ctx) playProceduralMusic(ctx, key, save.settings.music);
  }

  setMusicVolume(v: number): void {
    if (this.music) (this.music as Phaser.Sound.WebAudioSound).setVolume?.(v);
    setProceduralVolume(v);
  }

  stopMusic(): void {
    this.music?.stop();
    this.music?.destroy();
    this.music = null;
    this.musicKey = '';
    stopProceduralMusic();
  }

  unlock(): void {
    this.getCtx();
  }

  /** 浏览器要求用户交互后才能出声：任意点击/按键/触摸即解锁；切到后台时暂停 */
  install(): void {
    if (MUTED) return;
    const unlock = () => this.unlock();
    // iPhone 微信：需在 WeixinJSBridgeReady 回调中恢复音频
    document.addEventListener('WeixinJSBridgeReady', unlock, false);
    for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, unlock, { capture: true, passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }
}

export const audio = new AudioManager();
audio.install();

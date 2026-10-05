// 程序化背景音乐：WebAudio 实时合成的电子风格循环音乐（无需音频文件）
// 每首曲子 = 速度 + 调式 + 和弦进行 + 鼓/贝斯/琶音 16 步型 + 固定种子生成的旋律。
// 16 小节一个循环：前 8 小节铺底（鼓、贝斯、琶音、Pad），后 8 小节加入主旋律；每 8 小节末尾加鼓花。
import { rng } from '../art/Painter';

type Wave = OscillatorType;

export interface TrackSpec {
  bpm: number;
  root: number; // 贝斯根音（MIDI）
  scale: number[];
  prog: number[]; // 每小节的和弦级数（0 起）
  swing?: number; // 反拍延后比例
  kick: string;
  snare?: string;
  clap?: string;
  hat: string;
  open?: string; // 16 步：x 击打 X 重音 . 休止
  bass: string; // 0~3 和弦音（3 = 七音），7 = 高八度根音
  bassWave: Wave;
  bassCut: number;
  dist?: boolean;
  arp?: string;
  arpWave?: Wave;
  arpOct?: number;
  pad?: boolean;
  lead?: { wave: Wave; oct: number; density: number; bell?: boolean };
  vol?: number;
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11],
  MINOR = [0, 2, 3, 5, 7, 8, 10],
  DORIAN = [0, 2, 3, 5, 7, 9, 10];
const PHRYGIAN = [0, 1, 3, 5, 7, 8, 10];
const LYDIAN = [0, 2, 4, 6, 7, 9, 11],
  LOCRIAN = [0, 1, 3, 5, 6, 8, 10],
  HARMONIC_MINOR = [0, 2, 3, 5, 7, 8, 11];
const FOUR = 'x...x...x...x...',
  BACK = '....x.......x...',
  OFF8 = '..x...x...x...x.';

export const TRACKS: Record<string, TrackSpec> = {
  // 主菜单：明快电子流行
  bgm_menu: {
    bpm: 112,
    root: 41,
    scale: MAJOR,
    prog: [0, 5, 3, 4],
    kick: FOUR,
    snare: BACK,
    hat: OFF8,
    bass: '0..0..0.0..0.2..',
    bassWave: 'sawtooth',
    bassCut: 900,
    arp: '0123012301230123',
    arpWave: 'square',
    arpOct: 2,
    pad: true,
    lead: { wave: 'square', oct: 2, density: 0.45 },
  },
  // 商店：慵懒 Lo-fi House
  bgm_shop: {
    bpm: 96,
    root: 39,
    scale: MAJOR,
    prog: [0, 3, 1, 4],
    swing: 0.14,
    kick: 'x......x..x.....',
    snare: BACK,
    hat: 'x.x.x.x.x.x.x.x.',
    bass: '0...2...1..0....',
    bassWave: 'triangle',
    bassCut: 700,
    arp: '0.2.1.3.0.2.1.3.',
    arpWave: 'triangle',
    arpOct: 2,
    pad: true,
    lead: { wave: 'sine', oct: 2, density: 0.3, bell: true },
    vol: 0.9,
  },
  // 第一章 深夜厨房：电子放克
  bgm_kitchen: {
    bpm: 120,
    root: 45,
    scale: MINOR,
    prog: [0, 5, 2, 6],
    kick: 'x...x...x...x..x',
    snare: BACK,
    hat: 'x.xxx.x.x.xxx.x.',
    open: '..............x.',
    bass: '0.07.0.70.0.3.7.',
    bassWave: 'square',
    bassCut: 1100,
    pad: true,
    lead: { wave: 'square', oct: 2, density: 0.5 },
  },
  // 第二章 荒芜菜园：弹跳 Dorian
  bgm_garden: {
    bpm: 116,
    root: 38,
    scale: DORIAN,
    prog: [0, 3, 0, 4],
    kick: FOUR,
    clap: BACK,
    hat: OFF8,
    bass: '0.0..2.0.0..3.0.',
    bassWave: 'sawtooth',
    bassCut: 800,
    arp: '0.1.2.1.0.1.2.1.',
    arpWave: 'triangle',
    arpOct: 2,
    pad: true,
    lead: { wave: 'triangle', oct: 2, density: 0.5 },
  },
  // 第三章 冰封冰箱：冰冷 Trance 琶音 + 铃音
  bgm_fridge: {
    bpm: 124,
    root: 40,
    scale: MINOR,
    prog: [0, 5, 3, 4],
    kick: FOUR,
    snare: BACK,
    hat: OFF8,
    open: '..x...x...x...x.',
    bass: '..0...0...0...0.',
    bassWave: 'sawtooth',
    bassCut: 1000,
    arp: '0120120120120120',
    arpWave: 'square',
    arpOct: 2,
    pad: true,
    lead: { wave: 'sine', oct: 2, density: 0.4, bell: true },
  },
  // 第四章 城市垃圾场：失真碎拍工业
  bgm_junkyard: {
    bpm: 128,
    root: 43,
    scale: PHRYGIAN,
    prog: [0, 1, 0, 6],
    kick: 'x..x..x...x..x..',
    snare: '....x..x....x...',
    hat: 'xXxxxXxxxXxxxXxx',
    bass: '0.00.0..0.00.1..',
    bassWave: 'sawtooth',
    bassCut: 1400,
    dist: true,
    lead: { wave: 'square', oct: 2, density: 0.35 },
  },
  // 第五章 番茄酱工厂：驱动 Techno
  bgm_factory: {
    bpm: 132,
    root: 41,
    scale: MINOR,
    prog: [0, 0, 5, 6],
    kick: FOUR,
    clap: BACK,
    hat: 'xxXxxxXxxxXxxxXx',
    open: OFF8,
    bass: '.000.000.000.000',
    bassWave: 'sawtooth',
    bassCut: 900,
    arp: '0.0.3.0.2.0.3.0.',
    arpWave: 'sawtooth',
    arpOct: 2,
    lead: { wave: 'square', oct: 2, density: 0.3 },
  },
  // Boss 战：紧张和声小调
  // Boss 战：168 BPM 弗里几亚小调，碎拍底鼓 + 滚动失真贝斯 + 军鼓加花 + 高速琶音与密集主旋律，热血激烈
  bgm_boss: {
    bpm: 168,
    root: 33,
    scale: PHRYGIAN,
    prog: [0, 0, 5, 6, 0, 1, 5, 4],
    kick: 'x..x..x.x..x..xx',
    snare: '....x.......x.xx',
    clap: '....x.......x...',
    hat: 'xXxXxXxXxXxXxXxX',
    open: '..x...x...x...x.',
    bass: '0070007000700777',
    bassWave: 'sawtooth',
    bassCut: 1700,
    dist: true,
    arp: '0123012301230123',
    arpWave: 'square',
    arpOct: 3,
    pad: true,
    lead: { wave: 'sawtooth', oct: 2, density: 0.78 },
    vol: 1.05,
  },
  // 第六章 温室：明亮但诡异——Lydian 升四级的 II 大三和弦，三连感铃音琶音 + 轻摇摆，像阳光下过于鲜艳的植物
  bgm_greenhouse: {
    bpm: 108,
    root: 40,
    scale: LYDIAN,
    prog: [0, 1, 5, 1, 0, 1, 3, 4],
    swing: 0.08,
    kick: 'x.....x...x.....',
    snare: '........x.......',
    clap: '............x...',
    hat: '..x...x...x...xx',
    bass: '0..0..2.0..7..1.',
    bassWave: 'triangle',
    bassCut: 750,
    arp: '012.120.201.0123',
    arpWave: 'sine',
    arpOct: 3,
    pad: true,
    lead: { wave: 'sine', oct: 2, density: 0.38, bell: true },
    vol: 0.92,
  },
  // 第七章 / 真结局 腐烂花园：84 BPM 半拍 Doom，Locrian 减五度低音 + 失真锯齿贝斯，稀疏鼓点与厚重 Pad，阴暗压抑
  bgm_rotgarden: {
    bpm: 84,
    root: 31,
    scale: LOCRIAN,
    prog: [0, 0, 1, 4, 0, 5, 1, 6],
    kick: 'x.......x.x.....',
    snare: '........x.......',
    hat: 'x...x...x...x...',
    open: '..............x.',
    bass: '0...0..00...1.0.',
    bassWave: 'sawtooth',
    bassCut: 520,
    dist: true,
    arp: '0...2...1...3...',
    arpWave: 'triangle',
    arpOct: 2,
    pad: true,
    lead: { wave: 'sawtooth', oct: 2, density: 0.28 },
    vol: 1,
  },
  // 无尽高波数：176 BPM 和声小调 Drum & Bass 式碎拍，十六分滚动失真贝斯 + 三度跳进高速琶音，紧张急促
  bgm_endless_deep: {
    bpm: 176,
    root: 36,
    scale: HARMONIC_MINOR,
    prog: [0, 5, 3, 4, 0, 5, 1, 4],
    kick: 'x.x.......x..x..',
    snare: '....x..x....x...',
    clap: '....x.......x...',
    hat: 'xxXxxxXxxxXxxXxX',
    open: '......x.......x.',
    bass: '0707.0700707.373',
    bassWave: 'square',
    bassCut: 1500,
    dist: true,
    arp: '0213021302130213',
    arpWave: 'square',
    arpOct: 3,
    lead: { wave: 'square', oct: 2, density: 0.65 },
    vol: 1.05,
  },
};

/** 无尽模式从该波次起换成高波数曲目 */
export const ENDLESS_DEEP_WAVE = 30;

/** 战斗场景的常规（非 Boss）曲目：无尽模式高波数改为 bgm_endless_deep，否则用章节音乐 */
export function stageMusic(chapterMusic: string, wave: number, endless: boolean): string {
  return endless && wave >= ENDLESS_DEEP_WAVE ? 'bgm_endless_deep' : chapterMusic;
}

/** Boss 登场曲目：真结局 Boss 用腐烂花园主题，其余用通用 Boss 战音乐 */
export function bossMusic(isTrueFinal: boolean): string {
  return isTrueFinal ? 'bgm_rotgarden' : 'bgm_boss';
}

const mtof = (m: number) => 440 * 2 ** ((m - 69) / 12);

interface LeadNote {
  step: number;
  midi: number;
  len: number;
}

/** 由种子生成 8 小节旋律：2 小节动机 A，A 变奏，A，结尾 B 落回主音 */
function makeMelody(key: string, t: TrackSpec): LeadNote[] {
  if (!t.lead) return [];
  let seed = 0;
  for (const c of key) seed = (seed * 31 + c.charCodeAt(0)) >>> 0;
  const r = rng(seed);
  const base = t.root + 12 * t.lead.oct;
  const deg = (d: number) => t.scale[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7);
  const phrase = (bar0: number, endOnRoot: boolean): LeadNote[] => {
    const out: LeadNote[] = [];
    let d = t.prog[bar0 % t.prog.length] + 2 * Math.floor(r() * 3);
    for (let s = 0; s < 32; s++) {
      const strong = s % 4 === 0;
      if (r() > (strong ? t.lead!.density + 0.3 : t.lead!.density * 0.6)) continue;
      const chord = t.prog[(bar0 + (s >> 4)) % t.prog.length];
      d = strong ? chord + 2 * Math.floor(r() * 3) : d + (r() < 0.5 ? -1 : 1) * (r() < 0.8 ? 1 : 2);
      d = Math.max(-2, Math.min(10, d));
      out.push({ step: s, midi: base + deg(d), len: 1 });
    }
    if (endOnRoot) out.push({ step: 28, midi: base + deg(t.prog[(bar0 + 1) % t.prog.length]), len: 4 });
    out.sort((a, b) => a.step - b.step);
    for (let i = 0; i < out.length; i++) out[i].len = Math.min(4, (out[i + 1]?.step ?? 32) - out[i].step);
    return out.filter((n, i) => out.findIndex((m) => m.step === n.step) === i);
  };
  const A = phrase(0, false),
    A2 = phrase(2, false),
    B = phrase(6, true);
  const varied = [...A.filter((n) => n.step < 24), ...A2.filter((n) => n.step >= 24)];
  return [
    ...A.map((n) => ({ ...n })),
    ...varied.map((n) => ({ ...n, step: n.step + 32 })),
    ...A.map((n) => ({ ...n, step: n.step + 64 })),
    ...B.map((n) => ({ ...n, step: n.step + 96 })),
  ];
}

class Playing {
  readonly bus: GainNode;
  private timer = 0;
  private step = 0;
  private loops = 0;
  private next: number;
  private readonly melody: LeadNote[];
  private readonly stepDur: number;

  constructor(
    private eng: MusicEngine,
    readonly key: string,
    private t: TrackSpec,
  ) {
    const ctx = eng.ctx;
    this.bus = ctx.createGain();
    this.bus.gain.setValueAtTime(0, ctx.currentTime);
    this.bus.gain.linearRampToValueAtTime(t.vol ?? 1, ctx.currentTime + 1.2);
    this.bus.connect(eng.master);
    this.melody = makeMelody(key, t);
    this.stepDur = 60 / t.bpm / 4;
    this.next = ctx.currentTime + 0.08;
    this.timer = window.setInterval(() => this.tick(), 25);
    this.tick();
  }

  stop(): void {
    clearInterval(this.timer);
    const ctx = this.eng.ctx,
      g = this.bus.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
    window.setTimeout(() => this.bus.disconnect(), 800);
  }

  private tick(): void {
    const ctx = this.eng.ctx;
    // 标签页切回时追上当前时间，避免一次性堆积大量音符
    if (this.next < ctx.currentTime - 0.3) this.next = ctx.currentTime + 0.05;
    while (this.next < ctx.currentTime + 0.2) {
      const swing = this.step % 2 === 1 ? (this.t.swing ?? 0) * this.stepDur : 0;
      this.play(this.step, this.next + swing);
      this.next += this.stepDur;
      if (++this.step >= 256) {
        this.step = 0;
        this.loops++;
      }
    }
  }

  private chordTones(bar: number): number[] {
    const { scale, prog } = this.t;
    const d = prog[bar % prog.length];
    return [0, 2, 4, 6].map((k) => scale[(d + k) % 7] + 12 * Math.floor((d + k) / 7));
  }

  private play(step: number, at: number): void {
    const t = this.t,
      e = this.eng,
      s = step % 16,
      bar = step >> 4,
      sd = this.stepDur;
    const hit = (p: string | undefined) => (p ? p[s] : '.');
    const intro = this.loops === 0 && bar < 2;
    const fill = bar % 8 === 7 && s >= 12;
    const chord = this.chordTones(bar);
    // 鼓
    if (!intro && hit(t.kick) !== '.') e.kick(this.bus, at);
    if (fill) e.snare(this.bus, at, 0.3 + (s - 12) * 0.08);
    else {
      if (hit(t.snare) !== '.') e.snare(this.bus, at, 0.45);
      if (hit(t.clap) !== '.') e.clap(this.bus, at);
    }
    const h = hit(t.hat);
    if (h !== '.') e.hat(this.bus, at, h === 'X' ? 0.16 : 0.09, 0.04);
    if (hit(t.open) !== '.') e.hat(this.bus, at, 0.08, 0.22);
    // 贝斯
    const b = t.bass[s];
    if (b !== '.' && !(intro && bar === 0)) {
      const m = t.root + (b === '7' ? 12 : chord[Number(b)]);
      e.bass(this.bus, at, mtof(m), sd * 0.9, t);
    }
    // Pad：每小节第一拍铺和弦
    if (t.pad && s === 0)
      e.pad(
        this.bus,
        at,
        chord.slice(0, 3).map((c) => mtof(t.root + 24 + c)),
        sd * 16,
      );
    // 琶音
    const a = t.arp?.[s];
    if (a && a !== '.') e.arp(this.bus, at, mtof(t.root + 12 * (t.arpOct ?? 2) + chord[Number(a)]), sd * 0.8, t.arpWave ?? 'square');
    // 主旋律：循环后 8 小节
    if (t.lead && bar >= 8) {
      const idx = step - 128;
      for (const n of this.melody) if (n.step === idx) e.lead(this.bus, at, mtof(n.midi), n.len * sd * 0.95, t.lead.wave, !!t.lead.bell);
    }
  }
}

class MusicEngine {
  master!: GainNode;
  private echo!: DelayNode;
  private echoIn!: GainNode;
  private noise!: AudioBuffer;
  private shaper!: WaveShaperNode;
  private current: Playing | null = null;

  constructor(
    readonly ctx: AudioContext,
    volume: number,
  ) {
    this.master = ctx.createGain();
    this.master.gain.value = volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 4;
    this.master.connect(comp).connect(ctx.destination);
    // 附点八分回声（琶音 / 主旋律用）
    this.echoIn = ctx.createGain();
    this.echoIn.gain.value = 0.28;
    this.echo = ctx.createDelay(1);
    const fb = ctx.createGain();
    fb.gain.value = 0.35;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2600;
    this.echoIn.connect(this.echo).connect(lp).connect(fb).connect(this.echo);
    lp.connect(this.master);
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.shaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * 2 - 1;
      curve[i] = Math.tanh(x * 3);
    }
    this.shaper.curve = curve;
  }

  play(key: string): boolean {
    const t = TRACKS[key];
    if (!t) return false;
    if (this.current?.key === key) return true;
    this.stop();
    this.echo.delayTime.value = (60 / t.bpm) * 0.75;
    this.current = new Playing(this, key, t);
    return true;
  }

  stop(): void {
    this.current?.stop();
    this.current = null;
  }
  setVolume(v: number): void {
    this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05);
  }

  // ---------------- 乐器 ----------------
  private env(at: number, peak: number, attack: number, decay: number, out: AudioNode): GainNode {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, at + attack + decay);
    g.connect(out);
    return g;
  }
  private osc(type: Wave, f: number, at: number, dur: number, out: AudioNode, detune = 0): OscillatorNode {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f, at);
    o.detune.value = detune;
    o.connect(out);
    o.start(at);
    o.stop(at + dur + 0.05);
    return o;
  }
  private noiseSrc(at: number, dur: number, out: AudioNode): void {
    const n = this.ctx.createBufferSource();
    n.buffer = this.noise;
    n.connect(out);
    n.start(at, Math.random() * 0.5);
    n.stop(at + dur + 0.02);
  }
  private filter(type: BiquadFilterType, f: number, q: number, out: AudioNode): BiquadFilterNode {
    const b = this.ctx.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    b.Q.value = q;
    b.connect(out);
    return b;
  }

  kick(bus: AudioNode, at: number): void {
    const o = this.osc('sine', 150, at, 0.35, this.env(at, 0.9, 0.003, 0.3, bus));
    o.frequency.exponentialRampToValueAtTime(42, at + 0.12);
  }
  snare(bus: AudioNode, at: number, vol: number): void {
    this.noiseSrc(at, 0.18, this.filter('bandpass', 1800, 0.8, this.env(at, vol, 0.002, 0.16, bus)));
    this.osc('triangle', 190, at, 0.1, this.env(at, vol * 0.6, 0.002, 0.08, bus));
  }
  clap(bus: AudioNode, at: number): void {
    const f = this.filter('bandpass', 1300, 1.2, bus);
    for (let i = 0; i < 3; i++) this.noiseSrc(at + i * 0.012, 0.05, this.env(at + i * 0.012, 0.35, 0.001, i === 2 ? 0.14 : 0.02, f));
  }
  hat(bus: AudioNode, at: number, vol: number, decay: number): void {
    this.noiseSrc(at, decay + 0.02, this.filter('highpass', 7200, 0.7, this.env(at, vol, 0.001, decay, bus)));
  }
  bass(bus: AudioNode, at: number, f: number, dur: number, t: TrackSpec): void {
    const g = this.env(at, 0.32, 0.005, dur, bus);
    const lp = this.filter('lowpass', t.bassCut * 2, 7, g);
    lp.frequency.setValueAtTime(t.bassCut * 2, at);
    lp.frequency.exponentialRampToValueAtTime(t.bassCut * 0.35, at + dur);
    if (t.dist) {
      const pre = this.ctx.createGain();
      pre.gain.value = 0.8;
      const sh = this.ctx.createWaveShaper();
      sh.curve = this.shaper.curve;
      pre.connect(sh).connect(lp);
      this.osc(t.bassWave, f, at, dur, pre);
    } else this.osc(t.bassWave, f, at, dur, lp);
    this.osc('sine', f / 2, at, dur, this.env(at, 0.18, 0.005, dur, bus));
  }
  pad(bus: AudioNode, at: number, fs: number[], dur: number): void {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(0.045, at + dur * 0.25);
    g.gain.linearRampToValueAtTime(0.0001, at + dur * 1.05);
    g.connect(bus);
    const lp = this.filter('lowpass', 1400, 0.5, g);
    for (const f of fs) for (const dt of [-9, 9]) this.osc('sawtooth', f, at, dur * 1.05, lp, dt);
  }
  arp(bus: AudioNode, at: number, f: number, dur: number, wave: Wave): void {
    const g = this.env(at, 0.06, 0.003, dur, bus);
    g.connect(this.echoIn);
    this.osc(wave, f, at, dur, this.filter('lowpass', 3200, 1, g));
  }
  lead(bus: AudioNode, at: number, f: number, dur: number, wave: Wave, bell: boolean): void {
    if (bell) {
      // 铃音：两个正弦的简单 FM 叠加，长衰减
      const g = this.env(at, 0.12, 0.002, Math.max(0.6, dur), bus);
      g.connect(this.echoIn);
      this.osc('sine', f, at, Math.max(0.6, dur), g);
      this.osc('sine', f * 3.01, at, 0.3, this.env(at, 0.04, 0.002, 0.25, g));
      return;
    }
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.09, at + 0.01);
    g.gain.setValueAtTime(0.09, at + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    g.connect(bus);
    g.connect(this.echoIn);
    const lp = this.filter('lowpass', 2800, 2, g);
    const o = this.osc(wave, f, at, dur, lp);
    // 轻微颤音
    const lfo = this.ctx.createOscillator(),
      lg = this.ctx.createGain();
    lfo.frequency.value = 5.5;
    lg.gain.value = f * 0.006;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(at);
    lfo.stop(at + dur + 0.05);
    this.osc(wave, f, at, dur, lp, 7);
  }
}

let engine: MusicEngine | null = null;

/** 播放程序化曲目；返回 false 表示没有该曲目 */
export function playProceduralMusic(ctx: AudioContext, key: string, volume: number): boolean {
  if (!TRACKS[key]) return false;
  engine ??= new MusicEngine(ctx, volume);
  return engine.play(key);
}
export function stopProceduralMusic(): void {
  engine?.stop();
}
export function setProceduralVolume(v: number): void {
  engine?.setVolume(v);
}

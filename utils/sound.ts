import { Platform } from 'react-native';

// Web Audio API sound engine - only works on web platform
// On native, haptics are used instead (no sound)

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (Platform.OS !== 'web') return null;
  if (audioContext) return audioContext;
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioContext;
  } catch {
    return null;
  }
}

/** Ensure AudioContext is resumed (must be called from user gesture on web) */
export function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

// ---- Volume control ----
let seVolume = 0.8;
let seEnabled = true;

export function setSEVolume(vol: number) {
  seVolume = Math.max(0, Math.min(1, vol));
}

export function setSEEnabled(enabled: boolean) {
  seEnabled = enabled;
}

// ---- Sound generation helpers ----

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volumeMultiplier: number = 1,
  frequencyEnd?: number,
) {
  if (!seEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  if (frequencyEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(frequencyEnd, ctx.currentTime + duration / 1000);
  }

  const vol = seVolume * volumeMultiplier * 0.3; // keep overall volume modest
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration / 1000);
}

function playNote(freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') {
  if (!seEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  const vol = seVolume * 0.25;
  gain.gain.setValueAtTime(vol, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
}

// ---- Public sound functions ----

/** Clear sound: short high "ping" */
export function playClearSound() {
  playTone(800, 100, 'sine', 1);
}

/** Combo sound: rising pitch, combo count increases base pitch */
export function playComboSound(comboCount: number) {
  const basePitch = 800 + (comboCount - 1) * 80; // pitch goes up with combo
  const endPitch = basePitch + 400;
  playTone(basePitch, 150, 'sine', 1, endPitch);
}

/** Fever start: C-E-G fanfare (3 ascending notes) */
export function playFeverSound() {
  if (!seEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // C5=523, E5=659, G5=784
  playNote(523, now, 0.12, 'triangle');
  playNote(659, now + 0.1, 0.12, 'triangle');
  playNote(784, now + 0.2, 0.2, 'triangle');
}

/** Game over: descending tone */
export function playGameOverSound() {
  playTone(600, 300, 'sawtooth', 0.6, 200);
}

/** Special block activation: short burst */
export function playSpecialBlockSound() {
  playTone(1000, 80, 'square', 0.5, 600);
}

// ---- BGM control ----
let bgmIntervalId: ReturnType<typeof setInterval> | null = null;
let bgmGainNode: GainNode | null = null;
let bgmEnabled = true;
let bgmVolume = 0.3;

// Am-G-F-E コード進行（Aマイナースケール）
// メロディー: 8音×2小節ループ
const MELODY_NOTES = [440, 494, 523, 494, 440, 392, 349, 392]; // A4-B4-C5-B4-A4-G4-F4-G4
// ベース: Am-G-F-E ルート音（1小節=2拍）
const BASS_NOTES   = [110, 98, 87.3, 82.4]; // A2-G2-F2-E2
// コードパッド: Am-G-F-E ボイシング（3声）
const CHORD_VOICINGS: [number, number, number][] = [
  [220, 262, 330], // Am: A3-C4-E4
  [196, 247, 294], // G:  G3-B3-D4
  [175, 220, 262], // F:  F3-A3-C4
  [165, 208, 247], // E:  E3-G#3-B3
];

function scheduleVoice(
  ctx: AudioContext,
  masterGain: GainNode,
  freq: number,
  startTime: number,
  duration: number,
  type: OscillatorType,
  vol: number,
) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  g.gain.setValueAtTime(vol, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

export function playBGM(bpm: number = 104): void {
  const ctx = getAudioContext();
  if (!ctx || !bgmEnabled) return;
  stopBGM();

  const gain = ctx.createGain();
  gain.gain.value = bgmVolume;
  gain.connect(ctx.destination);
  bgmGainNode = gain;

  const beatSec = 60 / bpm;        // 1拍の秒数
  const chordBeats = 2;             // 1コードあたり2拍
  const melodyBeats = 1;            // メロディーは1拍毎
  let step = 0;

  const tickBGM = () => {
    if (!ctx || !bgmGainNode) return;
    const now = ctx.currentTime;
    const melodyIdx = step % MELODY_NOTES.length;
    const chordIdx  = Math.floor(step / chordBeats) % CHORD_VOICINGS.length;
    const bassIdx   = Math.floor(step / chordBeats) % BASS_NOTES.length;

    // メロディー声部（triangle・中音量）
    scheduleVoice(ctx, bgmGainNode, MELODY_NOTES[melodyIdx], now, beatSec * 0.85, 'triangle', bgmVolume * 0.4);

    // コードパッド声部（sine・小音量・和音の変わり目のみ）
    if (step % chordBeats === 0) {
      const voicing = CHORD_VOICINGS[chordIdx];
      for (const f of voicing) {
        scheduleVoice(ctx, bgmGainNode, f, now, beatSec * chordBeats * 0.9, 'sine', bgmVolume * 0.15);
      }
      // ベース声部（sawtooth・低音）
      scheduleVoice(ctx, bgmGainNode, BASS_NOTES[bassIdx], now, beatSec * chordBeats * 0.8, 'sawtooth', bgmVolume * 0.25);
    }

    // パーカッション声部（noise風: short square burst）
    if (step % 2 === 0) {
      // キック代わりの低音バースト
      scheduleVoice(ctx, bgmGainNode, 60, now, 0.06, 'square', bgmVolume * 0.3);
    } else {
      // スネア代わりの高音バースト
      scheduleVoice(ctx, bgmGainNode, 220, now, 0.04, 'square', bgmVolume * 0.1);
    }

    step++;
  };

  tickBGM();
  bgmIntervalId = setInterval(tickBGM, (60 / bpm) * 1000);
}

export function stopBGM(): void {
  if (bgmIntervalId !== null) {
    clearInterval(bgmIntervalId);
    bgmIntervalId = null;
  }
  if (bgmGainNode) {
    bgmGainNode.gain.value = 0;
    bgmGainNode = null;
  }
}

export function setBGMEnabled(enabled: boolean): void {
  bgmEnabled = enabled;
  if (!enabled) stopBGM();
}

export function setBGMVolume(vol: number): void {
  bgmVolume = vol;
  if (bgmGainNode) bgmGainNode.gain.value = vol;
}

/** Chain sound: pitch rises with chain level. C4→E4→G4→C5, 5+ = arpeggio fanfare */
export function playChainSound(chainLevel: number) {
  if (!seEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (chainLevel >= 5) {
    // Fanfare arpeggio: C-E-G-C
    playNote(523, now, 0.1, 'triangle');       // C4
    playNote(659, now + 0.08, 0.1, 'triangle'); // E4
    playNote(784, now + 0.16, 0.1, 'triangle'); // G4
    playNote(1047, now + 0.24, 0.2, 'triangle'); // C5
  } else {
    // Single note with pitch based on chain level
    const pitches = [523, 523, 659, 784, 1047]; // 1=C4, 2=E4, 3=G4, 4=C5
    const freq = pitches[Math.min(chainLevel, 4)] || 523;
    playNote(freq, now, 0.15, 'triangle');
  }
}

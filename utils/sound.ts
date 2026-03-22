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

export function playBGM(mode: 'normal' | 'fever' = 'normal'): void {
  const ctx = getAudioContext();
  if (!ctx || !bgmEnabled) return;
  stopBGM();

  const gain = ctx.createGain();
  gain.gain.value = bgmVolume;
  gain.connect(ctx.destination);
  bgmGainNode = gain;

  // アルペジオ音列（Cメジャー: C4-E4-G4-A4-G4-E4）
  const notes = mode === 'fever'
    ? [523, 659, 784, 1047, 784, 659] // 高BPM
    : [262, 330, 392, 523, 392, 330]; // 通常BPM
  const bpm = mode === 'fever' ? 180 : 120;
  const beatMs = 60000 / bpm;
  let step = 0;

  const playBGMNote = () => {
    if (!ctx || !bgmGainNode) return;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = notes[step % notes.length];
    osc.connect(bgmGainNode);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
    step++;
  };

  playBGMNote();
  bgmIntervalId = setInterval(playBGMNote, beatMs);
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

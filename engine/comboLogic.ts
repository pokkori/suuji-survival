import { ComboState, FeverState } from '../types';

export const COMBO_WINDOW_MS = 2000;

const COMBO_MULTIPLIERS: Record<number, number> = {
  0: 1.0, 1: 1.0, 2: 1.5, 3: 2.0, 4: 2.5,
  5: 3.0, 6: 3.5, 7: 4.0, 8: 4.5, 9: 5.0,
};

export function getComboMultiplier(comboCount: number): number {
  if (comboCount <= 9) return COMBO_MULTIPLIERS[comboCount] ?? 1.0;
  return Math.min(5.0 + (comboCount - 9) * 0.5, 10.0);
}

export function updateCombo(
  state: ComboState,
  deltaMs: number,
  didClear: boolean,
): ComboState {
  if (didClear) {
    const newCount = state.count + 1;
    return {
      count: newCount,
      multiplier: getComboMultiplier(newCount),
      timer: COMBO_WINDOW_MS,
      maxCombo: Math.max(state.maxCombo, newCount),
    };
  }

  const newTimer = state.timer - deltaMs;
  if (newTimer <= 0) {
    return { count: 0, multiplier: 1.0, timer: 0, maxCombo: state.maxCombo };
  }

  return { ...state, timer: newTimer };
}

export function getComboText(combo: number, isFever?: boolean, chainLevel?: number): string | null {
  if (isFever && chainLevel && chainLevel >= 3) return '🔥 PERFECT CHAIN!!';
  if (combo >= 10) return 'GODLIKE!';
  if (combo >= 7) return 'INCREDIBLE!';
  if (combo >= 5) return 'AMAZING!';
  if (combo >= 3) return 'GREAT!';
  if (combo >= 2) return 'NICE!';
  return null;
}

export function getComboColor(combo: number): string {
  if (combo >= 10) return '#FF00FF';
  if (combo >= 7) return '#FF0000';
  if (combo >= 5) return '#FF4500';
  if (combo >= 3) return '#FF8C00';
  return '#FFD700';
}

// Fever
const FEVER_GAUGE_PER_CLEAR = 8;
const FEVER_GAUGE_PER_COMBO = 15;
const FEVER_GAUGE_DECAY_PER_SEC = 2;
export const FEVER_DURATION_MS = 10000;
export const FEVER_SCORE_MULTIPLIER = 2.0;

export function updateFeverGauge(
  state: FeverState,
  clearedCount: number,
  isCombo: boolean,
  deltaMs: number,
): FeverState {
  if (state.isActive) {
    const remaining = state.remainingMs - deltaMs;
    if (remaining <= 0) {
      return { gauge: 0, isActive: false, remainingMs: 0, level: 0 };
    }
    return { ...state, remainingMs: remaining };
  }

  let newGauge = state.gauge
    + clearedCount * FEVER_GAUGE_PER_CLEAR
    + (isCombo ? FEVER_GAUGE_PER_COMBO : 0)
    - (FEVER_GAUGE_DECAY_PER_SEC * deltaMs / 1000);

  newGauge = Math.max(0, Math.min(100, newGauge));

  if (newGauge >= 100) {
    return { gauge: 100, isActive: true, remainingMs: FEVER_DURATION_MS, level: 1 };
  }

  return { ...state, gauge: newGauge };
}

export const initialComboState: ComboState = {
  count: 0, multiplier: 1.0, timer: 0, maxCombo: 0,
};

export const initialFeverState: FeverState = {
  gauge: 0, isActive: false, remainingMs: 0, level: 0,
};

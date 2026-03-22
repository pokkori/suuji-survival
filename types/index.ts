// ============================================
// グリッド・セル
// ============================================

/** 数字ブロックの値（1〜9） */
export type NumberValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** 特殊ブロック種別 */
export type SpecialBlockType = 'bomb' | 'freeze' | 'double' | 'wild';

/** セルの中身 */
export type CellContent =
  | { type: 'number'; value: NumberValue }
  | { type: 'special'; special: SpecialBlockType }
  | { type: 'empty' };

/** グリッド上の位置（row=0が最上段） */
export interface Position {
  row: number;
  col: number;
}

/** 1つのセル（位置+中身+状態） */
export interface Cell {
  id: string;
  position: Position;
  content: CellContent;
  isSelected: boolean;
  isDropping: boolean;
  isDestroying: boolean;
}

/** グリッド全体（6列×10行） */
export type Grid = Cell[][];

// ============================================
// スワイプ
// ============================================

export interface SwipePath {
  cells: Position[];
  currentSum: number;
  isValid: boolean;
  isComplete: boolean;
}

// ============================================
// コンボ・フィーバー
// ============================================

export interface ComboState {
  count: number;
  multiplier: number;
  timer: number;
  maxCombo: number;
}

export interface FeverState {
  gauge: number;
  isActive: boolean;
  remainingMs: number;
  level: FeverLevel;
}

export type FeverLevel = 0 | 1 | 2 | 3;

// ============================================
// 難易度
// ============================================

export interface DifficultyParams {
  dropIntervalMs: number;
  numberDistribution: Record<NumberValue, number>;
  specialBlockChance: number;
  rowsPerDrop: number;
  warningRowThreshold: number;
}

export interface DifficultyEntry {
  fromScore: number;
  params: DifficultyParams;
}

// ============================================
// スコア
// ============================================

export interface ScoreState {
  current: number;
  best: number;
  blocksCleared: number;
  maxChain: number;
  totalCombos: number;
  perfectClears: number;
}

export interface ScoreEvent {
  clearedCells: Position[];
  basePoints: number;
  comboMultiplier: number;
  feverMultiplier: number;
  specialBonus: number;
  totalPoints: number;
}

// ============================================
// ゲーム状態
// ============================================

export type GamePhase =
  | 'idle'
  | 'dropping'
  | 'playing'
  | 'clearing'
  | 'cascading'
  | 'fever'
  | 'gameover';

/** Positions that were cleared in a single clear event */
export interface ClearEvent {
  positions: Position[];
  comboCount: number;
  hadSpecialBlock: boolean;
}

export interface GameState {
  phase: GamePhase;
  grid: Grid;
  score: ScoreState;
  combo: ComboState;
  fever: FeverState;
  difficulty: DifficultyParams;
  elapsedMs: number;
  nextRows: CellContent[][];
  swipePath: SwipePath | null;
  isPaused: boolean;
  freezeRemainingMs: number;
  /** History of all cleared cell positions for Wordle share grid */
  clearedCellHistory: boolean[][];
  /** Latest clear event for particle/shake effects */
  lastClearEvent: ClearEvent | null;
  /** Current cascade chain level (1=manual, 2+=auto chain) */
  chainLevel: number;
  /** Max chain level achieved in current cascade */
  maxChainLevel: number;
  /** Chain score popup event: { level, score } */
  lastChainEvent: ChainEvent | null;
}

export interface ChainEvent {
  level: number;
  score: number;
  totalScore: number;
}

// ============================================
// 特殊ブロック
// ============================================

export interface SpecialBlockResult {
  clearedPositions: Position[];
  scoreBonus: number;
  freezeDurationMs?: number;
  scoreMultiplier?: number;
}

// ============================================
// テーマ
// ============================================

export interface ThemeSkin {
  id: ThemeId;
  name: string;
  price: number;
  colors: ThemeColors;
  unlocked: boolean;
}

export type ThemeId = 'default' | 'ocean' | 'sunset' | 'neon' | 'sakura';

export interface ThemeColors {
  background: string;
  gridBackground: string;
  gridLine: string;
  cellColors: Record<NumberValue, string>;
  cellTextColor: string;
  swipePathColor: string;
  comboTextColor: string;
  feverOverlay: string;
  accentColor: string;
}

// ============================================
// 実績
// ============================================

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: AchievementCondition;
  reward: AchievementReward;
  unlockedAt: string | null;
}

export type AchievementCondition =
  | { type: 'score'; threshold: number }
  | { type: 'combo'; threshold: number }
  | { type: 'blocks_cleared'; threshold: number }
  | { type: 'games_played'; threshold: number }
  | { type: 'perfect_clear'; count: number }
  | { type: 'fever_count'; count: number }
  | { type: 'daily_streak'; days: number }
  | { type: 'special_block_used'; blockType: SpecialBlockType; count: number }
  | { type: 'theme_purchased'; count: number }
  | { type: 'total_score'; threshold: number };

export interface AchievementReward {
  coins: number;
}

// ============================================
// デイリーチャレンジ
// ============================================

export interface DailyChallenge {
  dateKey: string;
  targetScore: number;
  seed: number;
  completed: boolean;
  bestScore: number;
  attempts: number;
}

// ============================================
// ストレージ
// ============================================

export interface UserSettings {
  bgmEnabled: boolean;
  seEnabled: boolean;
  hapticsEnabled: boolean;
  bgmVolume: number;
  seVolume: number;
}

export interface GameStats {
  highestCombo: number;
  totalPlayTimeMs: number;
  perfectClears: number;
  feverActivations: number;
  specialBlocksUsed: number;
}

export interface RankingEntry {
  rank: number;
  score: number;
  date: string;
  maxCombo: number;
  maxChainLevel?: number;
}

export interface ScoreHistoryEntry {
  score: number;
  date: string;
  maxCombo: number;
  blocksCleared: number;
  playTimeMs: number;
}

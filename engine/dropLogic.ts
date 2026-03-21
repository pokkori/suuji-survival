import { COLS, ROWS } from '../constants/grid';
import { Grid, CellContent, NumberValue, DifficultyParams, SpecialBlockType } from '../types';
import { createEmptyGrid } from './gridLogic';
import { SeededRNG } from './rng';

export function dropNewRows(grid: Grid, newRows: CellContent[][]): Grid | null {
  const rowCount = newRows.length;

  // Game over check: would pushed rows overflow bottom?
  for (let row = ROWS - rowCount; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col].content.type !== 'empty') {
        return null; // Game over
      }
    }
  }

  const newGrid = createEmptyGrid();

  // Push existing blocks down
  for (let row = ROWS - 1; row >= rowCount; row--) {
    for (let col = 0; col < COLS; col++) {
      newGrid[row][col] = {
        id: `${row}-${col}`,
        position: { row, col },
        content: { ...grid[row - rowCount][col].content } as CellContent,
        isSelected: false,
        isDropping: true,
        isDestroying: false,
      };
    }
  }

  // Place new rows at top
  for (let r = 0; r < rowCount; r++) {
    for (let col = 0; col < COLS; col++) {
      newGrid[r][col] = {
        id: `${r}-${col}`,
        position: { row: r, col },
        content: newRows[r][col],
        isSelected: false,
        isDropping: true,
        isDestroying: false,
      };
    }
  }

  return newGrid;
}

export function applyGravity(grid: Grid): Grid {
  const newGrid = createEmptyGrid();

  for (let col = 0; col < COLS; col++) {
    const nonEmpty: CellContent[] = [];
    for (let row = 0; row < ROWS; row++) {
      if (grid[row][col].content.type !== 'empty') {
        nonEmpty.push({ ...grid[row][col].content } as CellContent);
      }
    }

    const startRow = ROWS - nonEmpty.length;
    for (let i = 0; i < nonEmpty.length; i++) {
      const row = startRow + i;
      newGrid[row][col] = {
        ...newGrid[row][col],
        content: nonEmpty[i],
        isDropping: true,
      };
    }
  }

  return newGrid;
}

function pickNumber(distribution: Record<NumberValue, number>, rand: () => number): NumberValue {
  const r = rand();
  let cumulative = 0;
  for (let n = 1; n <= 9; n++) {
    cumulative += distribution[n as NumberValue];
    if (r < cumulative) return n as NumberValue;
  }
  return 9;
}

function pickSpecialType(rand: () => number): SpecialBlockType {
  const r = rand();
  if (r < 0.40) return 'bomb';
  if (r < 0.65) return 'freeze';
  if (r < 0.85) return 'double';
  return 'wild';
}

// Complement pairs: two numbers that sum to 10
const COMPLEMENT_PAIRS: [NumberValue, NumberValue][] = [[1,9],[2,8],[3,7],[4,6],[5,5]];
const COMPLEMENT_PAIR_CHANCE = 0.25; // 25% chance to insert a complement pair

export function generateNewRows(
  rowCount: number,
  distribution: Record<NumberValue, number>,
  specialChance: number,
  rng?: SeededRNG,
): CellContent[][] {
  const rand = rng ? () => rng.next() : () => Math.random();
  const rows: CellContent[][] = [];

  for (let r = 0; r < rowCount; r++) {
    const row: CellContent[] = [];
    for (let c = 0; c < COLS; c++) {
      if (rand() < specialChance) {
        row.push({ type: 'special', special: pickSpecialType(rand) });
      } else {
        row.push({ type: 'number', value: pickNumber(distribution, rand) });
      }
    }

    // Insert complement pairs: 25% chance per row, pick a random adjacent pair of columns
    if (rand() < COMPLEMENT_PAIR_CHANCE && COLS >= 2) {
      const startCol = Math.floor(rand() * (COLS - 1));
      // Only replace if both cells are number type (not special)
      if (row[startCol].type !== 'special' && row[startCol + 1].type !== 'special') {
        const pairIndex = Math.floor(rand() * COMPLEMENT_PAIRS.length);
        const [a, b] = COMPLEMENT_PAIRS[pairIndex];
        row[startCol] = { type: 'number', value: a };
        row[startCol + 1] = { type: 'number', value: b };
      }
    }

    rows.push(row);
  }
  return rows;
}

export function generatePreviewRows(count: number, params: DifficultyParams): CellContent[][] {
  return generateNewRows(count, params.numberDistribution, params.specialBlockChance);
}

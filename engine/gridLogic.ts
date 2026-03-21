import { COLS, ROWS } from '../constants/grid';
import { Grid, Cell, CellContent, NumberValue, Position } from '../types';

export function createEmptyGrid(): Grid {
  const grid: Grid = [];
  for (let row = 0; row < ROWS; row++) {
    grid[row] = [];
    for (let col = 0; col < COLS; col++) {
      grid[row][col] = {
        id: `${row}-${col}`,
        position: { row, col },
        content: { type: 'empty' },
        isSelected: false,
        isDropping: false,
        isDestroying: false,
      };
    }
  }
  return grid;
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map(row =>
    row.map(cell => ({
      ...cell,
      position: { ...cell.position },
      content: { ...cell.content } as CellContent,
    }))
  );
}

export function isGridEmpty(grid: Grid): boolean {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col].content.type !== 'empty') return false;
    }
  }
  return true;
}

export function countNonEmpty(grid: Grid): number {
  let count = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (grid[row][col].content.type !== 'empty') count++;
    }
  }
  return count;
}

export function markCellsSelected(grid: Grid, positions: Position[]): Grid {
  const newGrid = cloneGrid(grid);
  // Clear all selections first
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      newGrid[row][col].isSelected = false;
    }
  }
  for (const pos of positions) {
    if (pos.row >= 0 && pos.row < ROWS && pos.col >= 0 && pos.col < COLS) {
      newGrid[pos.row][pos.col].isSelected = true;
    }
  }
  return newGrid;
}

export function clearCells(grid: Grid, positions: Position[]): Grid {
  const newGrid = cloneGrid(grid);
  for (const pos of positions) {
    if (pos.row >= 0 && pos.row < ROWS && pos.col >= 0 && pos.col < COLS) {
      newGrid[pos.row][pos.col].content = { type: 'empty' };
      newGrid[pos.row][pos.col].isSelected = false;
      newGrid[pos.row][pos.col].isDestroying = false;
    }
  }
  return newGrid;
}

export function clearTopRows(grid: Grid, rowCount: number): Grid {
  const newGrid = cloneGrid(grid);
  for (let row = 0; row < rowCount && row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      newGrid[row][col].content = { type: 'empty' };
    }
  }
  return newGrid;
}

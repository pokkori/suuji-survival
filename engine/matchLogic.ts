import { COLS, ROWS } from '../constants/grid';
import { Grid, Position } from '../types';

const ADJACENT_OFFSETS: Position[] = [
  { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
  { row: 0, col: -1 },                        { row: 0, col: 1 },
  { row: 1, col: -1 },  { row: 1, col: 0 },  { row: 1, col: 1 },
];

export { ADJACENT_OFFSETS };

export function isAdjacent(a: Position, b: Position): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
}

export function isInBounds(pos: Position): boolean {
  return pos.row >= 0 && pos.row < ROWS && pos.col >= 0 && pos.col < COLS;
}

export function getCellValue(grid: Grid, pos: Position): number {
  const content = grid[pos.row][pos.col].content;
  if (content.type === 'number') return content.value;
  if (content.type === 'special' && content.special === 'wild') return 0;
  if (content.type === 'special') return 0; // bomb, freeze, double = 0
  return 0;
}

export function getAdjacentPositions(pos: Position): Position[] {
  return ADJACENT_OFFSETS
    .map(offset => ({ row: pos.row + offset.row, col: pos.col + offset.col }))
    .filter(isInBounds);
}

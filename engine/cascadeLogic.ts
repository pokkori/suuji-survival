import { Grid, Position, NumberValue } from '../types';
import { COLS, ROWS } from '../constants/grid';
import { getCellValue, isInBounds } from './matchLogic';

/** A match group: adjacent cells whose values sum to 10 */
export interface Match {
  positions: Position[];
  sum: number;
}

/**
 * findAutoMatches(grid): BFS-based detection of adjacent cell groups summing to 10.
 * Prioritizes groups with more cells (3+ cell matches preferred).
 * Returns non-overlapping matches.
 */
export function findAutoMatches(grid: Grid): Match[] {
  const allMatches: Match[] = [];

  // For each cell, try to find groups of adjacent cells summing to 10
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const startPos: Position = { row, col };
      const startValue = getCellValue(grid, startPos);
      if (startValue === 0) continue; // empty or special block with 0 value
      if (grid[row][col].content.type === 'empty') continue;

      // BFS/DFS to find adjacent groups summing to 10
      findGroupsFromCell(grid, startPos, startValue, [startPos], allMatches);
    }
  }

  // Deduplicate matches (same set of positions in different order)
  const uniqueMatches = deduplicateMatches(allMatches);

  // Sort by cell count descending (prioritize larger groups)
  uniqueMatches.sort((a, b) => b.positions.length - a.positions.length);

  // Select non-overlapping matches (greedy: largest first)
  const usedPositions = new Set<string>();
  const selectedMatches: Match[] = [];

  for (const match of uniqueMatches) {
    const posKeys = match.positions.map(p => `${p.row},${p.col}`);
    if (posKeys.some(k => usedPositions.has(k))) continue;

    selectedMatches.push(match);
    posKeys.forEach(k => usedPositions.add(k));
  }

  return selectedMatches;
}

function findGroupsFromCell(
  grid: Grid,
  current: Position,
  currentSum: number,
  path: Position[],
  results: Match[],
): void {
  if (currentSum === 10 && path.length >= 2) {
    results.push({ positions: [...path], sum: 10 });
    return; // Don't extend beyond sum=10
  }

  if (currentSum > 10) return;
  if (path.length >= 10) return; // Limit search depth for performance

  // Get adjacent positions
  const adjacentOffsets = [
    { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
    { row: 0, col: -1 },                        { row: 0, col: 1 },
    { row: 1, col: -1 },  { row: 1, col: 0 },  { row: 1, col: 1 },
  ];

  for (const offset of adjacentOffsets) {
    const nextPos: Position = {
      row: current.row + offset.row,
      col: current.col + offset.col,
    };

    if (!isInBounds(nextPos)) continue;
    if (grid[nextPos.row][nextPos.col].content.type === 'empty') continue;

    // Check adjacency to ANY cell in path (not just current) - connected component
    const isAdjacentToPath = path.some(
      p => Math.abs(p.row - nextPos.row) <= 1 && Math.abs(p.col - nextPos.col) <= 1
        && !(p.row === nextPos.row && p.col === nextPos.col)
    );
    if (!isAdjacentToPath) continue;

    // Already in path?
    if (path.some(p => p.row === nextPos.row && p.col === nextPos.col)) continue;

    const nextValue = getCellValue(grid, nextPos);
    if (nextValue === 0) continue;

    const newSum = currentSum + nextValue;
    if (newSum > 10) continue;

    path.push(nextPos);
    findGroupsFromCell(grid, nextPos, newSum, path, results);
    path.pop();
  }
}

function deduplicateMatches(matches: Match[]): Match[] {
  const seen = new Set<string>();
  const unique: Match[] = [];

  for (const match of matches) {
    const key = match.positions
      .map(p => `${p.row},${p.col}`)
      .sort()
      .join('|');

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(match);
    }
  }

  return unique;
}

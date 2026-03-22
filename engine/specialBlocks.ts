import { Grid, Position, SpecialBlockResult, SpecialBlockType } from '../types';
import { ADJACENT_OFFSETS, isInBounds } from './matchLogic';
import { COLS } from '../constants/grid';

export function executeBomb(grid: Grid, position: Position): SpecialBlockResult {
  const cleared: Position[] = [];
  for (const offset of ADJACENT_OFFSETS) {
    const target = { row: position.row + offset.row, col: position.col + offset.col };
    if (isInBounds(target) && grid[target.row][target.col].content.type !== 'empty') {
      cleared.push(target);
    }
  }
  return { clearedPositions: cleared, scoreBonus: cleared.length * 5 };
}

export function executeFreeze(): SpecialBlockResult {
  return { clearedPositions: [], scoreBonus: 0, freezeDurationMs: 10000 };
}

export function executeDouble(): SpecialBlockResult {
  return { clearedPositions: [], scoreBonus: 0, scoreMultiplier: 2.0 };
}

export function executeSpecialBlock(
  grid: Grid,
  position: Position,
  blockType: SpecialBlockType,
): SpecialBlockResult {
  switch (blockType) {
    case 'bomb': return executeBomb(grid, position);
    case 'freeze': return executeFreeze();
    case 'double': return executeDouble();
    case 'wild': {
      // ワイルドブロックが含まれる行を全消し
      const clearedPositions: Position[] = Array.from({ length: COLS }, (_, col) => ({ row: position.row, col }))
        .filter(pos => isInBounds(pos) && grid[pos.row][pos.col].content.type !== 'empty');
      return { clearedPositions, scoreBonus: 30 };
    }
  }
}

export const SPECIAL_BLOCK_ICONS: Record<SpecialBlockType, string> = {
  bomb: '💣',
  freeze: '❄️',
  double: '×2',
  wild: '⭐',
};

export const SPECIAL_BLOCK_COLORS: Record<SpecialBlockType, string> = {
  bomb: '#FF4444',
  freeze: '#44CCFF',
  double: '#FFD700',
  wild: '#FF69B4',
};

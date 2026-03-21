export interface ClearEvent {
  cellValues: number[];
  comboMultiplier: number;
  isFeverActive: boolean;
  hasDoubleBlock: boolean;
  bombBonusPoints: number;
  isAllClear: boolean;
}

function getCellCountBonus(count: number): number {
  switch (count) {
    case 2: return 1.0;
    case 3: return 1.5;
    case 4: return 2.0;
    default: return count >= 5 ? 2.5 : 1.0;
  }
}

export function calculateScore(event: ClearEvent): number {
  const basePoints = 10;
  const cellCountBonus = getCellCountBonus(event.cellValues.length);
  const feverMul = event.isFeverActive ? 2.0 : 1.0;
  const doubleMul = event.hasDoubleBlock ? 2.0 : 1.0;

  let score = Math.floor(
    basePoints * cellCountBonus * event.comboMultiplier * feverMul * doubleMul
  );

  score += event.bombBonusPoints;

  if (event.isAllClear) {
    score += 500;
  }

  return score;
}

/**
 * calculateChainScore: Apply chain multiplier to base score.
 * Chain multiplier: 1段目=x1, 2段目=x1.5, 3段目=x2.5, 4段目=x4, 5段目以上=x6
 */
export function calculateChainScore(chainLevel: number, baseScore: number): number {
  let multiplier: number;
  switch (chainLevel) {
    case 1: multiplier = 1; break;
    case 2: multiplier = 1.5; break;
    case 3: multiplier = 2.5; break;
    case 4: multiplier = 4; break;
    default: multiplier = chainLevel >= 5 ? 6 : 1; break;
  }
  return Math.floor(baseScore * multiplier);
}

export function scoreToCoins(score: number): number {
  return Math.floor(score / 100);
}

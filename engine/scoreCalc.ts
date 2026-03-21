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

export function scoreToCoins(score: number): number {
  return Math.floor(score / 100);
}

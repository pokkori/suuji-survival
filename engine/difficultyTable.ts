import { DifficultyEntry, DifficultyParams } from '../types';

export const DIFFICULTY_TABLE: DifficultyEntry[] = [
  {
    fromScore: 0,
    params: {
      dropIntervalMs: 8000,
      numberDistribution: { 1: 0.18, 2: 0.16, 3: 0.14, 4: 0.12, 5: 0.10, 6: 0.10, 7: 0.08, 8: 0.07, 9: 0.05 },
      specialBlockChance: 0.05, rowsPerDrop: 1, warningRowThreshold: 3,
    },
  },
  {
    fromScore: 1000,
    params: {
      dropIntervalMs: 6500,
      numberDistribution: { 1: 0.16, 2: 0.14, 3: 0.13, 4: 0.12, 5: 0.11, 6: 0.10, 7: 0.09, 8: 0.08, 9: 0.07 },
      specialBlockChance: 0.07, rowsPerDrop: 1, warningRowThreshold: 3,
    },
  },
  {
    fromScore: 3000,
    params: {
      dropIntervalMs: 5000,
      numberDistribution: { 1: 0.14, 2: 0.13, 3: 0.12, 4: 0.12, 5: 0.11, 6: 0.11, 7: 0.10, 8: 0.09, 9: 0.08 },
      specialBlockChance: 0.08, rowsPerDrop: 1, warningRowThreshold: 4,
    },
  },
  {
    fromScore: 6000,
    params: {
      dropIntervalMs: 4000,
      numberDistribution: { 1: 0.12, 2: 0.12, 3: 0.11, 4: 0.11, 5: 0.11, 6: 0.11, 7: 0.11, 8: 0.11, 9: 0.10 },
      specialBlockChance: 0.10, rowsPerDrop: 1, warningRowThreshold: 4,
    },
  },
  {
    fromScore: 10000,
    params: {
      dropIntervalMs: 3500,
      numberDistribution: { 1: 0.11, 2: 0.11, 3: 0.11, 4: 0.11, 5: 0.11, 6: 0.11, 7: 0.12, 8: 0.11, 9: 0.11 },
      specialBlockChance: 0.12, rowsPerDrop: 1, warningRowThreshold: 4,
    },
  },
  {
    fromScore: 15000,
    params: {
      dropIntervalMs: 3000,
      numberDistribution: { 1: 0.10, 2: 0.10, 3: 0.11, 4: 0.11, 5: 0.12, 6: 0.12, 7: 0.12, 8: 0.11, 9: 0.11 },
      specialBlockChance: 0.13, rowsPerDrop: 2, warningRowThreshold: 5,
    },
  },
  {
    fromScore: 25000,
    params: {
      dropIntervalMs: 2500,
      numberDistribution: { 1: 0.08, 2: 0.09, 3: 0.10, 4: 0.11, 5: 0.13, 6: 0.13, 7: 0.13, 8: 0.12, 9: 0.11 },
      specialBlockChance: 0.15, rowsPerDrop: 2, warningRowThreshold: 5,
    },
  },
  {
    fromScore: 40000,
    params: {
      dropIntervalMs: 2000,
      numberDistribution: { 1: 0.06, 2: 0.08, 3: 0.09, 4: 0.11, 5: 0.14, 6: 0.14, 7: 0.14, 8: 0.13, 9: 0.11 },
      specialBlockChance: 0.15, rowsPerDrop: 2, warningRowThreshold: 6,
    },
  },
];

export function getDifficulty(score: number): DifficultyParams {
  let result = DIFFICULTY_TABLE[0].params;
  for (const entry of DIFFICULTY_TABLE) {
    if (score >= entry.fromScore) {
      result = entry.params;
    }
  }
  return result;
}

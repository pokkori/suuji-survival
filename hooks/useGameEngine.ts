import { useState, useRef, useEffect, useCallback } from 'react';
import { GameState, GamePhase, SwipePath, Position, CellContent, Grid, DifficultyParams, ClearEvent, ChainEvent } from '../types';
import { createEmptyGrid, cloneGrid, clearCells, isGridEmpty, markCellsSelected, clearTopRows } from '../engine/gridLogic';
import { dropNewRows, applyGravity, generateNewRows, generatePreviewRows } from '../engine/dropLogic';
import { getCellValue, isAdjacent, isInBounds } from '../engine/matchLogic';
import { updateCombo, updateFeverGauge, initialComboState, initialFeverState, getComboMultiplier } from '../engine/comboLogic';
import { getDifficulty, DIFFICULTY_TABLE } from '../engine/difficultyTable';
import { executeSpecialBlock } from '../engine/specialBlocks';
import { calculateScore, calculateChainScore } from '../engine/scoreCalc';
import { findAutoMatches } from '../engine/cascadeLogic';
import { STORAGE_KEYS } from '../constants/storage';
import { useStorage } from './useStorage';
import { SeededRNG } from '../engine/rng';
import { COLS, ROWS } from '../constants/grid';

const TICK_INTERVAL_MS = 100; // 100ms tick for game loop (not 16ms to reduce CPU)

function createEmptyClearedHistory(): boolean[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(false));
}

function createInitialState(): GameState {
  const diff = DIFFICULTY_TABLE[0].params;
  return {
    phase: 'idle',
    grid: createEmptyGrid(),
    score: { current: 0, best: 0, blocksCleared: 0, maxChain: 0, totalCombos: 0, perfectClears: 0 },
    combo: initialComboState,
    fever: initialFeverState,
    difficulty: diff,
    elapsedMs: 0,
    nextRows: generatePreviewRows(2, diff),
    swipePath: null,
    isPaused: false,
    freezeRemainingMs: 0,
    clearedCellHistory: createEmptyClearedHistory(),
    lastClearEvent: null,
    chainLevel: 0,
    maxChainLevel: 0,
    lastChainEvent: null,
  };
}

export function useGameEngine(dailySeed?: number) {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const lastTickRef = useRef(Date.now());
  const dropTimerRef = useRef(0);
  const storage = useStorage();
  const rngRef = useRef<SeededRNG | undefined>(dailySeed ? new SeededRNG(dailySeed) : undefined);
  const revivalUsedRef = useRef(false);

  // Load best score on mount
  useEffect(() => {
    (async () => {
      const best = await storage.getNumber(STORAGE_KEYS.BEST_SCORE, 0);
      setGameState(prev => ({ ...prev, score: { ...prev.score, best } }));
    })();
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState.phase !== 'playing' && gameState.phase !== 'fever' && gameState.phase !== 'cascading') return;
    if (gameState.isPaused) return;
    if (gameState.phase === 'cascading') return; // Don't drop new rows during cascade

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaMs = now - lastTickRef.current;
      lastTickRef.current = now;

      setGameState(prev => {
        if (prev.phase === 'gameover' || prev.isPaused) return prev;

        const difficulty = getDifficulty(prev.score.current);
        const combo = updateCombo(prev.combo, deltaMs, false);
        const fever = updateFeverGauge(prev.fever, 0, false, deltaMs);

        // Freeze logic
        let freezeRemainingMs = prev.freezeRemainingMs > 0
          ? Math.max(0, prev.freezeRemainingMs - deltaMs)
          : 0;

        // Don't drop if frozen
        if (freezeRemainingMs > 0) {
          return {
            ...prev,
            combo,
            fever,
            difficulty,
            freezeRemainingMs,
            elapsedMs: prev.elapsedMs + deltaMs,
            phase: fever.isActive ? 'fever' : 'playing',
          };
        }

        dropTimerRef.current += deltaMs;
        const effectiveInterval = fever.isActive
          ? difficulty.dropIntervalMs * 2
          : difficulty.dropIntervalMs;

        if (dropTimerRef.current >= effectiveInterval) {
          dropTimerRef.current = 0;

          const newRows = generateNewRows(
            difficulty.rowsPerDrop,
            difficulty.numberDistribution,
            difficulty.specialBlockChance,
            rngRef.current,
          );

          const newGrid = dropNewRows(prev.grid, newRows);
          if (newGrid === null) {
            return { ...prev, phase: 'gameover' as GamePhase };
          }

          const nextRows = generatePreviewRows(2, difficulty);

          return {
            ...prev,
            grid: newGrid,
            combo,
            fever,
            difficulty,
            elapsedMs: prev.elapsedMs + deltaMs,
            nextRows,
            freezeRemainingMs,
            phase: fever.isActive ? 'fever' as GamePhase : 'playing' as GamePhase,
          };
        }

        return {
          ...prev,
          combo,
          fever,
          difficulty,
          elapsedMs: prev.elapsedMs + deltaMs,
          freezeRemainingMs,
          phase: fever.isActive ? 'fever' as GamePhase : 'playing' as GamePhase,
        };
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [gameState.phase, gameState.isPaused]);

  const startGame = useCallback(() => {
    const diff = DIFFICULTY_TABLE[0].params;
    rngRef.current = dailySeed ? new SeededRNG(dailySeed) : undefined;
    revivalUsedRef.current = false;
    dropTimerRef.current = 0;
    lastTickRef.current = Date.now();

    // Generate initial rows (3 rows to start)
    const initialRows = generateNewRows(3, diff.numberDistribution, diff.specialBlockChance, rngRef.current);
    let grid = createEmptyGrid();
    for (let r = 0; r < initialRows.length; r++) {
      for (let c = 0; c < 6; c++) {
        const row = 10 - initialRows.length + r;
        grid[row][c] = {
          ...grid[row][c],
          content: initialRows[r][c],
        };
      }
    }

    storage.getNumber(STORAGE_KEYS.BEST_SCORE, 0).then(best => {
      setGameState({
        phase: 'playing',
        grid,
        score: { current: 0, best, blocksCleared: 0, maxChain: 0, totalCombos: 0, perfectClears: 0 },
        combo: initialComboState,
        fever: initialFeverState,
        difficulty: diff,
        elapsedMs: 0,
        nextRows: generatePreviewRows(2, diff),
        swipePath: null,
        isPaused: false,
        freezeRemainingMs: 0,
        clearedCellHistory: createEmptyClearedHistory(),
        lastClearEvent: null,
        chainLevel: 0,
        maxChainLevel: 0,
        lastChainEvent: null,
      });
    });
  }, [dailySeed, storage]);

  const togglePause = useCallback(() => {
    setGameState(prev => {
      if (prev.phase === 'gameover' || prev.phase === 'idle') return prev;
      const newPaused = !prev.isPaused;
      if (!newPaused) lastTickRef.current = Date.now();
      return { ...prev, isPaused: newPaused };
    });
  }, []);

  const handleSwipeStart = useCallback((pos: Position) => {
    setGameState(prev => {
      if (prev.phase !== 'playing' && prev.phase !== 'fever') return prev;
      if (prev.phase === 'cascading' as GamePhase) return prev;
      const cell = prev.grid[pos.row]?.[pos.col];
      if (!cell || cell.content.type === 'empty') return prev;

      const value = getCellValue(prev.grid, pos);
      const path: SwipePath = {
        cells: [pos],
        currentSum: value,
        isValid: true,
        isComplete: value === 10,
      };
      const grid = markCellsSelected(prev.grid, [pos]);
      return { ...prev, swipePath: path, grid };
    });
  }, []);

  const handleSwipeMove = useCallback((pos: Position) => {
    setGameState(prev => {
      if (!prev.swipePath || prev.swipePath.cells.length === 0) return prev;
      if (!isInBounds(pos)) return prev;

      const cell = prev.grid[pos.row]?.[pos.col];
      if (!cell || cell.content.type === 'empty') return prev;

      const path = prev.swipePath;

      // Check for backtrack
      if (path.cells.length >= 2) {
        const prevCell = path.cells[path.cells.length - 2];
        if (prevCell.row === pos.row && prevCell.col === pos.col) {
          const removed = path.cells[path.cells.length - 1];
          const removedValue = getCellValue(prev.grid, removed);
          const newCells = path.cells.slice(0, -1);
          const newSum = path.currentSum - removedValue;
          const newPath: SwipePath = {
            cells: newCells,
            currentSum: newSum,
            isValid: true,
            isComplete: newSum === 10,
          };
          const grid = markCellsSelected(prev.grid, newCells);
          return { ...prev, swipePath: newPath, grid };
        }
      }

      // Already in path?
      if (path.cells.some(c => c.row === pos.row && c.col === pos.col)) return prev;

      // Adjacent check
      const lastCell = path.cells[path.cells.length - 1];
      if (!isAdjacent(lastCell, pos)) return prev;

      // Sum check
      const cellValue = getCellValue(prev.grid, pos);
      const newSum = path.currentSum + cellValue;
      if (newSum > 10) return prev;

      const newCells = [...path.cells, pos];
      const newPath: SwipePath = {
        cells: newCells,
        currentSum: newSum,
        isValid: true,
        isComplete: newSum === 10,
      };
      const grid = markCellsSelected(prev.grid, newCells);
      return { ...prev, swipePath: newPath, grid };
    });
  }, []);

  const runCascade = useCallback((grid: Grid, chainLevel: number, accumulatedScore: number, accumulatedCleared: number) => {
    // 最大3回のカスケードループ（無限ループ防止）
    const cascadeCount = chainLevel - 1; // chainLevel 2 = cascadeCount 1
    if (cascadeCount >= 3) {
      // 上限到達 - カスケード終了
      setGameState(prev => {
        if (prev.phase !== 'cascading') return prev;
        const restorePhase: GamePhase = prev.fever.isActive ? 'fever' : 'playing';
        return {
          ...prev,
          phase: restorePhase,
          chainLevel: 0,
        };
      });
      return;
    }

    const autoMatches = findAutoMatches(grid);
    if (autoMatches.length === 0) {
      // Cascade finished - restore to playing phase
      setGameState(prev => {
        if (prev.phase !== 'cascading') return prev;
        const restorePhase: GamePhase = prev.fever.isActive ? 'fever' : 'playing';
        return {
          ...prev,
          phase: restorePhase,
          chainLevel: 0,
        };
      });
      return;
    }

    // 300ms delay for visual cascade effect
    const delay = 300;

    setTimeout(() => {
      setGameState(prev => {
        if (prev.phase !== 'cascading') return prev;

        // Collect all auto-matched positions
        const autoClearedPositions: Position[] = [];
        for (const match of autoMatches) {
          for (const pos of match.positions) {
            if (!autoClearedPositions.some(p => p.row === pos.row && p.col === pos.col)) {
              autoClearedPositions.push(pos);
            }
          }
        }

        // Calculate chain score for this cascade level
        const baseScore = autoClearedPositions.length * 10;
        const chainScore = calculateChainScore(chainLevel, baseScore);
        const newAccumulatedScore = accumulatedScore + chainScore;
        const newAccumulatedCleared = accumulatedCleared + autoClearedPositions.length;

        // Clear the auto-matched cells
        let newGrid = clearCells(prev.grid, autoClearedPositions);
        newGrid = applyGravity(newGrid);

        // Record cleared cells in history
        const clearedCellHistory = prev.clearedCellHistory.map(row => [...row]);
        for (const pos of autoClearedPositions) {
          if (pos.row >= 0 && pos.row < ROWS && pos.col >= 0 && pos.col < COLS) {
            clearedCellHistory[pos.row][pos.col] = true;
          }
        }

        // Create clear event for particle/shake effects
        const lastClearEvent: ClearEvent = {
          positions: autoClearedPositions,
          comboCount: prev.combo.count,
          hadSpecialBlock: false,
        };

        // Chain event for popup display (連鎖カウンター表示)
        const lastChainEvent: ChainEvent = {
          level: chainLevel,
          score: chainScore,
          totalScore: newAccumulatedScore,
        };

        const newScore = prev.score.current + chainScore;
        const newBest = Math.max(prev.score.best, newScore);
        const maxChainLevel = Math.max(prev.maxChainLevel, chainLevel);

        // 次のカスケードを新しいgridで実行
        setTimeout(() => {
          runCascade(newGrid, chainLevel + 1, newAccumulatedScore, newAccumulatedCleared);
        }, 50);

        return {
          ...prev,
          grid: newGrid,
          score: {
            ...prev.score,
            current: newScore,
            best: newBest,
            blocksCleared: prev.score.blocksCleared + autoClearedPositions.length,
            maxChain: Math.max(prev.score.maxChain, chainLevel),
          },
          clearedCellHistory,
          lastClearEvent,
          lastChainEvent,
          chainLevel,
          maxChainLevel,
        };
      });
    }, delay);
  }, []);

  const handleSwipeEnd = useCallback(() => {
    setGameState(prev => {
      if (!prev.swipePath) return prev;
      if (prev.phase === 'cascading' as GamePhase) return prev;

      const path = prev.swipePath;
      if (!path.isComplete || path.cells.length < 2) {
        // Cancel - deselect
        const grid = markCellsSelected(prev.grid, []);
        return { ...prev, swipePath: null, grid };
      }

      // Execute clear
      let allClearedPositions = [...path.cells];
      let bombBonus = 0;
      let hasDouble = false;
      let freezeMs = 0;

      // Check for special blocks
      let hadSpecialBlock = false;
      for (const pos of path.cells) {
        const content = prev.grid[pos.row][pos.col].content;
        if (content.type === 'special') {
          hadSpecialBlock = true;
          const result = executeSpecialBlock(prev.grid, pos, content.special);
          if (content.special === 'bomb') {
            for (const cp of result.clearedPositions) {
              if (!allClearedPositions.some(p => p.row === cp.row && p.col === cp.col)) {
                allClearedPositions.push(cp);
              }
            }
            bombBonus += result.scoreBonus;
          }
          if (content.special === 'double') hasDouble = true;
          if (content.special === 'freeze' && result.freezeDurationMs) {
            freezeMs = result.freezeDurationMs;
          }
        }
      }

      // Clear cells
      let grid = clearCells(prev.grid, allClearedPositions);

      // Apply gravity
      grid = applyGravity(grid);

      // Update combo
      const combo = updateCombo(prev.combo, 0, true);

      // Check for all clear
      const allClear = isGridEmpty(grid);

      // Calculate score (chain level 1 = manual clear)
      const cellValues = path.cells.map(p => getCellValue(prev.grid, p));
      const basePoints = calculateScore({
        cellValues,
        comboMultiplier: combo.multiplier,
        isFeverActive: prev.fever.isActive,
        hasDoubleBlock: hasDouble,
        bombBonusPoints: bombBonus,
        isAllClear: allClear,
      });
      const points = calculateChainScore(1, basePoints);

      const newScore = prev.score.current + points;
      const newBest = Math.max(prev.score.best, newScore);
      const newBlocksCleared = prev.score.blocksCleared + allClearedPositions.length;

      // Update fever
      const fever = updateFeverGauge(prev.fever, allClearedPositions.length, combo.count > 1, 0);

      // Record cleared cells in history
      const clearedCellHistory = prev.clearedCellHistory.map(row => [...row]);
      for (const pos of allClearedPositions) {
        if (pos.row >= 0 && pos.row < ROWS && pos.col >= 0 && pos.col < COLS) {
          clearedCellHistory[pos.row][pos.col] = true;
        }
      }

      // Create clear event for effects
      const lastClearEvent: ClearEvent = {
        positions: allClearedPositions,
        comboCount: combo.count,
        hadSpecialBlock,
      };

      // Check for auto matches after gravity (cascade check)
      const autoMatches = findAutoMatches(grid);
      const willCascade = autoMatches.length > 0;

      // Set phase to cascading if auto matches found
      const newPhase: GamePhase = willCascade
        ? 'cascading'
        : (fever.isActive ? 'fever' : prev.phase);

      return {
        ...prev,
        grid,
        swipePath: null,
        combo,
        fever,
        score: {
          current: newScore,
          best: newBest,
          blocksCleared: newBlocksCleared,
          maxChain: Math.max(prev.score.maxChain, combo.count),
          totalCombos: combo.count > 1 ? prev.score.totalCombos + 1 : prev.score.totalCombos,
          perfectClears: allClear ? prev.score.perfectClears + 1 : prev.score.perfectClears,
        },
        freezeRemainingMs: prev.freezeRemainingMs + freezeMs,
        phase: newPhase,
        clearedCellHistory,
        lastClearEvent,
        chainLevel: willCascade ? 1 : 0,
        maxChainLevel: 1,
        lastChainEvent: null,
      };
    });
  }, []);

  // Cascade loop effect - runs when phase first becomes 'cascading' (chainLevel === 0 -> 1)
  useEffect(() => {
    if (gameState.phase !== 'cascading') return;
    // Only trigger the initial cascade when chainLevel is set to 1 by handleSwipeEnd
    if (gameState.chainLevel !== 1) return;

    const autoMatches = findAutoMatches(gameState.grid);
    if (autoMatches.length > 0) {
      runCascade(gameState.grid, gameState.chainLevel + 1, 0, 0);
    } else {
      // No more matches, end cascade
      setGameState(prev => ({
        ...prev,
        phase: prev.fever.isActive ? 'fever' as GamePhase : 'playing' as GamePhase,
        chainLevel: 0,
      }));
    }
  }, [gameState.phase, gameState.chainLevel]);

  const revive = useCallback(() => {
    if (revivalUsedRef.current) return false;
    revivalUsedRef.current = true;

    setGameState(prev => {
      if (prev.phase !== 'gameover') return prev;
      // Clear top 2 rows
      let grid = clearTopRows(prev.grid, 2);
      grid = applyGravity(grid);
      lastTickRef.current = Date.now();
      dropTimerRef.current = 0;
      return { ...prev, grid, phase: 'playing' as GamePhase };
    });
    return true;
  }, []);

  const saveGameResult = useCallback(async () => {
    const state = gameState;
    if (state.phase !== 'gameover') return;

    const score = state.score;

    // Update best score
    if (score.current > score.best) {
      await storage.setNumber(STORAGE_KEYS.BEST_SCORE, score.current);
    }

    // Increment game count
    const gameCount = await storage.getNumber(STORAGE_KEYS.GAME_COUNT, 0);
    await storage.setNumber(STORAGE_KEYS.GAME_COUNT, gameCount + 1);

    // Update total games
    const totalGames = await storage.getNumber(STORAGE_KEYS.TOTAL_GAMES, 0);
    await storage.setNumber(STORAGE_KEYS.TOTAL_GAMES, totalGames + 1);

    // Update total blocks
    const totalBlocks = await storage.getNumber(STORAGE_KEYS.TOTAL_BLOCKS_CLEARED, 0);
    await storage.setNumber(STORAGE_KEYS.TOTAL_BLOCKS_CLEARED, totalBlocks + score.blocksCleared);

    // Update highest combo
    const highestCombo = await storage.getNumber(STORAGE_KEYS.HIGHEST_COMBO, 0);
    if (score.maxChain > highestCombo) {
      await storage.setNumber(STORAGE_KEYS.HIGHEST_COMBO, score.maxChain);
    }

    // Update total play time
    const totalTime = await storage.getNumber(STORAGE_KEYS.TOTAL_PLAYTIME_MS, 0);
    await storage.setNumber(STORAGE_KEYS.TOTAL_PLAYTIME_MS, totalTime + state.elapsedMs);

    // Add coins
    const earnedCoins = Math.floor(score.current / 100);
    const coins = await storage.getNumber(STORAGE_KEYS.COINS, 0);
    await storage.setNumber(STORAGE_KEYS.COINS, coins + earnedCoins);

    // Update total score
    const totalScore = await storage.getNumber(STORAGE_KEYS.TOTAL_SCORE, 0);
    await storage.setNumber(STORAGE_KEYS.TOTAL_SCORE, totalScore + score.current);

    // Update ranking
    const ranking = await storage.getItem<Array<{ score: number; date: string; maxCombo: number }>>(
      STORAGE_KEYS.RANKING_ALL, []
    );
    ranking.push({
      score: score.current,
      date: new Date().toISOString(),
      maxCombo: score.maxChain,
    });
    ranking.sort((a, b) => b.score - a.score);
    await storage.setItem(STORAGE_KEYS.RANKING_ALL, ranking.slice(0, 20));

    // Daily streak: 今日初プレイなら加算
    const todayKey = new Date().toISOString().split('T')[0]; // 例: "2026-03-21"
    const lastPlayedDay = await storage.getString('@ns:last_played_day', '');
    if (lastPlayedDay !== todayKey) {
      const prevStreak = await storage.getNumber(STORAGE_KEYS.DAILY_STREAK, 0);
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const newStreak = lastPlayedDay === yesterday ? prevStreak + 1 : 1;
      await storage.setNumber(STORAGE_KEYS.DAILY_STREAK, newStreak);
      await storage.setString('@ns:last_played_day', todayKey);
    }
  }, [gameState, storage]);

  return {
    gameState,
    startGame,
    togglePause,
    handleSwipeStart,
    handleSwipeMove,
    handleSwipeEnd,
    revive,
    revivalUsed: revivalUsedRef.current,
    saveGameResult,
  };
}

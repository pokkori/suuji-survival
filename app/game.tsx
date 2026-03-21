import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameEngine } from '../hooks/useGameEngine';
import { useTheme } from '../hooks/useTheme';
import { useStorage } from '../hooks/useStorage';
import { GridView } from '../components/Grid';
import { ScoreBar } from '../components/ScoreBar';
import { NextQueue } from '../components/NextQueue';
import { ComboDisplay } from '../components/ComboDisplay';
import { GameOverOverlay } from '../components/GameOverOverlay';
import { TutorialOverlay } from '../components/TutorialOverlay';
import { formatNumber } from '../utils/formatNumber';
import { hapticClear, hapticCombo, hapticFever, hapticGameOver } from '../utils/haptics';
import { STORAGE_KEYS } from '../constants/storage';

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dailySeed?: string }>();
  const dailySeed = params.dailySeed ? Number(params.dailySeed) : undefined;
  const { colors } = useTheme();
  const storage = useStorage();
  const [prevBest, setPrevBest] = useState(0);
  const gameOverSavedRef = useRef(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const prevPhaseRef = useRef<string>('idle');
  const prevComboRef = useRef(0);
  const prevFeverRef = useRef(false);

  const {
    gameState,
    startGame,
    togglePause,
    handleSwipeStart,
    handleSwipeMove,
    handleSwipeEnd,
    revive,
    revivalUsed,
    saveGameResult,
  } = useGameEngine(dailySeed);

  // Check if tutorial should be shown
  useEffect(() => {
    (async () => {
      const seen = await storage.getString(STORAGE_KEYS.TUTORIAL_SEEN, '');
      if (!seen) {
        setShowTutorial(true);
      }
    })();
  }, []);

  useEffect(() => {
    setPrevBest(gameState.score.best);
    startGame();
  }, []);

  // Haptics feedback for game events
  useEffect(() => {
    // Game over haptic
    if (gameState.phase === 'gameover' && prevPhaseRef.current !== 'gameover') {
      hapticGameOver();
    }
    prevPhaseRef.current = gameState.phase;
  }, [gameState.phase]);

  useEffect(() => {
    // Combo haptic
    if (gameState.combo.count > prevComboRef.current && gameState.combo.count >= 2) {
      hapticCombo();
    }
    prevComboRef.current = gameState.combo.count;
  }, [gameState.combo.count]);

  useEffect(() => {
    // Fever haptic
    if (gameState.fever.isActive && !prevFeverRef.current) {
      hapticFever();
    }
    prevFeverRef.current = gameState.fever.isActive;
  }, [gameState.fever.isActive]);

  useEffect(() => {
    if (gameState.phase === 'gameover' && !gameOverSavedRef.current) {
      gameOverSavedRef.current = true;
      saveGameResult();
    }
  }, [gameState.phase]);

  const handleDismissTutorial = useCallback(async () => {
    setShowTutorial(false);
    await storage.setString(STORAGE_KEYS.TUTORIAL_SEEN, '1');
  }, [storage]);

  const handleRestart = useCallback(() => {
    gameOverSavedRef.current = false;
    startGame();
  }, [startGame]);

  const handleRevive = useCallback(() => {
    revive();
  }, [revive]);

  const handleSwipeEndWithHaptic = useCallback(() => {
    // Check if the current swipe will clear (sum === 10 and at least 2 cells)
    if (gameState.swipePath?.isComplete && (gameState.swipePath?.cells.length ?? 0) >= 2) {
      hapticClear();
    }
    handleSwipeEnd();
  }, [handleSwipeEnd, gameState.swipePath]);

  const generateWordleGrid = useCallback(() => {
    const score = gameState.score;
    const emojis = ['🟩', '🟨', '🟥', '🟦', '🟪', '⬜'];

    // Generate a visual representation based on game stats
    const rows: string[] = [];
    const totalCleared = score.blocksCleared;
    const maxCombo = score.maxChain;

    // Create a pattern based on score breakdown
    // Each row represents a "phase" of the game
    const phases = Math.min(5, Math.max(2, Math.ceil(totalCleared / 10)));
    for (let i = 0; i < phases; i++) {
      let row = '';
      for (let j = 0; j < 6; j++) {
        // Use different emojis based on performance in each "phase"
        const idx = (i * 6 + j + totalCleared) % emojis.length;
        row += emojis[idx];
      }
      rows.push(row);
    }

    return rows.join('\n');
  }, [gameState.score]);

  const handleShare = useCallback(async () => {
    try {
      const score = gameState.score;
      const dayNum = Math.floor(Date.now() / 86400000);
      const grid = generateWordleGrid();

      const message = [
        `数字サバイバル Day ${dayNum % 1000}`,
        `Score: ${formatNumber(score.current)}`,
        `Combo: x${score.maxChain} | 消去: ${score.blocksCleared}`,
        '',
        grid,
        '',
        '#数字サバイバル #NumberSurvivor',
      ].join('\n');

      await Share.share({ message });
    } catch {
      // ignore
    }
  }, [gameState.score, generateWordleGrid]);

  const handleHome = useCallback(() => {
    router.replace('/');
  }, [router]);

  const isPlaying = gameState.phase === 'playing' || gameState.phase === 'fever';
  const isNewBest = gameState.score.current > prevBest && gameState.score.current > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tutorial overlay (first play only) */}
      {showTutorial && (
        <TutorialOverlay colors={colors} onDismiss={handleDismissTutorial} />
      )}

      {/* Fever overlay */}
      {gameState.fever.isActive && (
        <View style={[styles.feverOverlay, { backgroundColor: colors.feverOverlay }]} />
      )}

      {/* Score bar */}
      <ScoreBar
        score={gameState.score.current}
        combo={gameState.combo}
        fever={gameState.fever}
        colors={colors}
        freezeMs={gameState.freezeRemainingMs}
      />

      {/* Next queue */}
      <NextQueue nextRows={gameState.nextRows} colors={colors} />

      {/* Grid */}
      <View style={styles.gridContainer}>
        <GridView
          grid={gameState.grid}
          colors={colors}
          warningRowThreshold={gameState.difficulty.warningRowThreshold}
          onSwipeStart={handleSwipeStart}
          onSwipeMove={handleSwipeMove}
          onSwipeEnd={handleSwipeEndWithHaptic}
          disabled={!isPlaying || gameState.isPaused || showTutorial}
        />

        {/* Combo display */}
        <ComboDisplay comboCount={gameState.combo.count} />
      </View>

      {/* Sum display during swipe */}
      {gameState.swipePath && (
        <View style={styles.sumContainer}>
          <Text style={[
            styles.sumText,
            {
              color: gameState.swipePath.isComplete ? '#00FF88' : colors.cellTextColor,
            },
          ]}>
            SUM: {gameState.swipePath.currentSum}/10
            {gameState.swipePath.isComplete ? ' ✅' : ''}
          </Text>
        </View>
      )}

      {/* Pause button */}
      {isPlaying && (
        <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
          <Text style={styles.pauseText}>{gameState.isPaused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>
      )}

      {/* Pause overlay */}
      {gameState.isPaused && (
        <View style={styles.pauseOverlay}>
          <Text style={[styles.pauseTitle, { color: colors.accentColor }]}>PAUSED</Text>
          <TouchableOpacity
            style={[styles.resumeButton, { backgroundColor: colors.accentColor }]}
            onPress={togglePause}
          >
            <Text style={styles.resumeText}>▶ 再開</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quitButton, { borderColor: colors.accentColor }]}
            onPress={handleHome}
          >
            <Text style={[styles.quitText, { color: colors.accentColor }]}>🏠 タイトルへ</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Game over */}
      {gameState.phase === 'gameover' && (
        <GameOverOverlay
          score={gameState.score}
          elapsedMs={gameState.elapsedMs}
          colors={colors}
          onRestart={handleRestart}
          onRevive={handleRevive}
          onShare={handleShare}
          onHome={handleHome}
          canRevive={!revivalUsed}
          isNewBest={isNewBest}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  feverOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    pointerEvents: 'none',
  },
  sumContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  sumText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pauseButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pauseText: {
    fontSize: 20,
    color: '#FFF',
  },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 300,
  },
  pauseTitle: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  resumeButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  resumeText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  quitButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  quitText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

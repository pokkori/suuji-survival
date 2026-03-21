import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
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
import { ClearParticleEffect, styles as particleStyles } from '../components/ClearParticle';
import { formatNumber } from '../utils/formatNumber';
import { hapticClear, hapticCombo, hapticComboHeavy, hapticFever, hapticSpecialBlock, hapticGameOver } from '../utils/haptics';
import { STORAGE_KEYS } from '../constants/storage';
import { ClearEvent, Position } from '../types';
import { COLS, ROWS } from '../constants/grid';

// Unique ID counter for particle effects
let particleIdCounter = 0;

interface ParticleInstance {
  id: number;
  row: number;
  col: number;
  count: number;
}

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
  const prevClearEventRef = useRef<ClearEvent | null>(null);
  const [particles, setParticles] = useState<ParticleInstance[]>([]);

  // Screen shake shared value
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);

  // Fever background pulse
  const feverHue = useSharedValue(0);

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

  // Enhanced combo haptics + screen shake
  useEffect(() => {
    const comboCount = gameState.combo.count;
    if (comboCount > prevComboRef.current && comboCount >= 2) {
      if (comboCount >= 5) {
        hapticComboHeavy();
      } else {
        hapticCombo();
      }

      // Screen shake based on combo
      const intensity = comboCount >= 10 ? 15 : comboCount >= 5 ? 8 : 3;
      const duration = 40;
      shakeX.value = withSequence(
        withTiming(intensity, { duration }),
        withTiming(-intensity, { duration }),
        withTiming(intensity * 0.6, { duration }),
        withTiming(-intensity * 0.6, { duration }),
        withTiming(0, { duration }),
      );
      shakeY.value = withSequence(
        withTiming(-intensity * 0.5, { duration }),
        withTiming(intensity * 0.5, { duration }),
        withTiming(-intensity * 0.3, { duration }),
        withTiming(0, { duration }),
      );
    }
    prevComboRef.current = comboCount;
  }, [gameState.combo.count]);

  // Fever haptic + background animation
  useEffect(() => {
    if (gameState.fever.isActive && !prevFeverRef.current) {
      hapticFever();
      // Start fever hue rotation
      feverHue.value = 0;
      feverHue.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1, // infinite
        false,
      );
    } else if (!gameState.fever.isActive && prevFeverRef.current) {
      cancelAnimation(feverHue);
      feverHue.value = 0;
    }
    prevFeverRef.current = gameState.fever.isActive;
  }, [gameState.fever.isActive]);

  // Clear event: particles + special block haptic
  useEffect(() => {
    const clearEvent = gameState.lastClearEvent;
    if (clearEvent && clearEvent !== prevClearEventRef.current) {
      prevClearEventRef.current = clearEvent;

      // Special block haptic
      if (clearEvent.hadSpecialBlock) {
        hapticSpecialBlock();
      }

      // Spawn particles at cleared positions
      const particleCount = clearEvent.comboCount >= 3 ? 12 : 7;
      const newParticles: ParticleInstance[] = clearEvent.positions.map(pos => ({
        id: particleIdCounter++,
        row: pos.row,
        col: pos.col,
        count: particleCount,
      }));
      setParticles(prev => [...prev, ...newParticles]);
    }
  }, [gameState.lastClearEvent]);

  const removeParticle = useCallback((id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: shakeX.value },
      { translateY: shakeY.value },
    ],
  }));

  const feverBgStyle = useAnimatedStyle(() => {
    if (!gameState.fever.isActive) {
      return { backgroundColor: 'transparent' };
    }
    // Pulsating rainbow overlay
    const hue = feverHue.value;
    return {
      backgroundColor: `hsla(${hue}, 80%, 50%, 0.12)`,
    };
  });

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
    const history = gameState.clearedCellHistory;
    const score = gameState.score;

    // Map the 10x6 grid to a 10x6 emoji representation
    // Cleared cells get colored emojis, uncleared get white
    const colorEmojis = ['🟩', '🟨', '🟥', '🟦', '🟪', '🟧'];
    const rows: string[] = [];

    for (let r = 0; r < ROWS; r++) {
      let row = '';
      for (let c = 0; c < COLS; c++) {
        if (history[r][c]) {
          // Use different colors based on position for visual variety
          row += colorEmojis[(r + c) % colorEmojis.length];
        } else {
          row += '\u2B1C'; // white square
        }
      }
      rows.push(row);
    }

    return rows.join('\n');
  }, [gameState.clearedCellHistory, gameState.score]);

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

  useEffect(() => {
    if (gameState.phase === 'gameover' && !gameOverSavedRef.current) {
      gameOverSavedRef.current = true;
      saveGameResult();
    }
  }, [gameState.phase]);

  const isPlaying = gameState.phase === 'playing' || gameState.phase === 'fever';
  const isNewBest = gameState.score.current > prevBest && gameState.score.current > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Tutorial overlay (first play only) */}
      {showTutorial && (
        <TutorialOverlay colors={colors} onDismiss={handleDismissTutorial} />
      )}

      {/* Fever pulsating background overlay */}
      {gameState.fever.isActive && (
        <Animated.View style={[styles.feverOverlay, feverBgStyle]} />
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

      {/* Grid with screen shake */}
      <Animated.View style={[styles.gridContainer, shakeStyle]}>
        <GridView
          grid={gameState.grid}
          colors={colors}
          warningRowThreshold={gameState.difficulty.warningRowThreshold}
          onSwipeStart={handleSwipeStart}
          onSwipeMove={handleSwipeMove}
          onSwipeEnd={handleSwipeEndWithHaptic}
          disabled={!isPlaying || gameState.isPaused || showTutorial}
        />

        {/* Particles overlay */}
        <View style={particleStyles.particleContainer}>
          {particles.map(p => (
            <ClearParticleEffect
              key={p.id}
              row={p.row}
              col={p.col}
              count={p.count}
              onComplete={() => removeParticle(p.id)}
            />
          ))}
        </View>

        {/* Combo display */}
        <ComboDisplay comboCount={gameState.combo.count} />
      </Animated.View>

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
            {gameState.swipePath.isComplete ? ' \u2705' : ''}
          </Text>
        </View>
      )}

      {/* Pause button */}
      {isPlaying && (
        <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
          <Text style={styles.pauseText}>{gameState.isPaused ? '\u25B6' : '\u23F8'}</Text>
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
            <Text style={styles.resumeText}>{'\u25B6'} 再開</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quitButton, { borderColor: colors.accentColor }]}
            onPress={handleHome}
          >
            <Text style={[styles.quitText, { color: colors.accentColor }]}>{'\uD83C\uDFE0'} タイトルへ</Text>
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

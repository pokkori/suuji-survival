import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  withDelay,
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
import { ShockwaveEffect } from '../components/ShockwaveEffect';
import { ChainDisplay } from '../components/ChainDisplay';
import { formatNumber } from '../utils/formatNumber';
import { hapticClear, hapticCombo, hapticComboHeavy, hapticFever, hapticSpecialBlock, hapticGameOver, setHapticsEnabled } from '../utils/haptics';
import { playClearSound, playComboSound, playFeverSound, playGameOverSound, playSpecialBlockSound, playChainSound, resumeAudioContext, setSEEnabled, setSEVolume } from '../utils/sound';
import { STORAGE_KEYS } from '../constants/storage';
import { ClearEvent, ChainEvent, Position, UserSettings } from '../types';
import { COLS, ROWS } from '../constants/grid';

// Unique ID counter for particle effects
let particleIdCounter = 0;
// Unique ID counter for shockwave effects
let shockwaveIdCounter = 0;

interface ParticleInstance {
  id: number;
  row: number;
  col: number;
  count: number;
}

interface ShockwaveInstance {
  id: number;
  row: number;
  col: number;
  comboCount: number;
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
  const [shockwaves, setShockwaves] = useState<ShockwaveInstance[]>([]);
  const prevChainEventRef = useRef<ChainEvent | null>(null);

  // Spotlight overlay for 3+ chain cascade
  const spotlightOpacity = useSharedValue(0);

  // 5+ combo fullscreen flash
  const flashOpacity = useSharedValue(0);

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

  // Load settings and apply to sound/haptics modules
  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<UserSettings>(STORAGE_KEYS.SETTINGS, {
        bgmEnabled: true,
        seEnabled: true,
        hapticsEnabled: true,
        bgmVolume: 0.7,
        seVolume: 0.8,
      });
      setSEEnabled(saved.seEnabled);
      setSEVolume(saved.seVolume);
      setHapticsEnabled(saved.hapticsEnabled);
    })();
  }, []);

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

  // Haptics + sound feedback for game events
  useEffect(() => {
    // Game over haptic + sound
    if (gameState.phase === 'gameover' && prevPhaseRef.current !== 'gameover') {
      hapticGameOver();
      playGameOverSound();
    }
    prevPhaseRef.current = gameState.phase;
  }, [gameState.phase]);

  // Enhanced combo haptics + screen shake + combo sound
  useEffect(() => {
    const comboCount = gameState.combo.count;
    if (comboCount > prevComboRef.current && comboCount >= 2) {
      if (comboCount >= 5) {
        hapticComboHeavy();
      } else {
        hapticCombo();
      }

      // Combo sound with rising pitch
      playComboSound(comboCount);

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

      // 5+ combo: fullscreen white flash
      if (comboCount >= 5) {
        flashOpacity.value = withSequence(
          withTiming(0.5, { duration: 50 }),
          withTiming(0, { duration: 50 }),
        );
      }
    }
    prevComboRef.current = comboCount;
  }, [gameState.combo.count]);

  // Fever haptic + sound + background animation
  useEffect(() => {
    if (gameState.fever.isActive && !prevFeverRef.current) {
      hapticFever();
      playFeverSound();
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

  // Chain event: chain SE + spotlight effect
  useEffect(() => {
    const chainEvent = gameState.lastChainEvent;
    if (chainEvent && chainEvent !== prevChainEventRef.current && chainEvent.level >= 2) {
      prevChainEventRef.current = chainEvent;

      // Play chain sound with rising pitch
      playChainSound(chainEvent.level);

      // 3+ chain: spotlight effect (darken background, cells glow)
      if (chainEvent.level >= 3) {
        spotlightOpacity.value = withSequence(
          withTiming(0.5, { duration: 150 }),
          withDelay(400, withTiming(0, { duration: 300 })),
        );
      }

      // Screen shake for chain
      const intensity = chainEvent.level >= 4 ? 12 : chainEvent.level >= 3 ? 8 : 4;
      const duration = 40;
      shakeX.value = withSequence(
        withTiming(intensity, { duration }),
        withTiming(-intensity, { duration }),
        withTiming(intensity * 0.5, { duration }),
        withTiming(0, { duration }),
      );
      shakeY.value = withSequence(
        withTiming(-intensity * 0.5, { duration }),
        withTiming(intensity * 0.5, { duration }),
        withTiming(0, { duration }),
      );
    }
  }, [gameState.lastChainEvent]);

  // Clear event: particles + shockwave + special block haptic + sound
  useEffect(() => {
    const clearEvent = gameState.lastClearEvent;
    if (clearEvent && clearEvent !== prevClearEventRef.current) {
      prevClearEventRef.current = clearEvent;

      // Special block haptic + sound
      if (clearEvent.hadSpecialBlock) {
        hapticSpecialBlock();
        playSpecialBlockSound();
      }

      // Clear sound
      playClearSound();

      // Spawn particles at cleared positions
      const particleCount = clearEvent.comboCount >= 3 ? 12 : 7;
      const newParticles: ParticleInstance[] = clearEvent.positions.map(pos => ({
        id: particleIdCounter++,
        row: pos.row,
        col: pos.col,
        count: particleCount,
      }));
      setParticles(prev => [...prev, ...newParticles]);

      // Spawn shockwave at the center of cleared cells
      // Use the first cleared position as the shockwave origin
      if (clearEvent.positions.length > 0) {
        const centerPos = clearEvent.positions[Math.floor(clearEvent.positions.length / 2)];
        const newShockwave: ShockwaveInstance = {
          id: shockwaveIdCounter++,
          row: centerPos.row,
          col: centerPos.col,
          comboCount: clearEvent.comboCount,
        };
        setShockwaves(prev => [...prev, newShockwave]);
      }
    }
  }, [gameState.lastClearEvent]);

  const removeParticle = useCallback((id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  const removeShockwave = useCallback((id: number) => {
    setShockwaves(prev => prev.filter(s => s.id !== id));
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

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const spotlightStyle = useAnimatedStyle(() => ({
    opacity: spotlightOpacity.value,
  }));

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
    // Resume AudioContext on first user gesture (required by browsers)
    resumeAudioContext();

    // Check if the current swipe will clear (sum === 10 and at least 2 cells)
    if (gameState.swipePath?.isComplete && (gameState.swipePath?.cells.length ?? 0) >= 2) {
      hapticClear();
    }
    handleSwipeEnd();
  }, [handleSwipeEnd, gameState.swipePath]);

  // Also resume audio context on swipe start (user gesture)
  const handleSwipeStartWithAudio = useCallback((pos: Position) => {
    resumeAudioContext();
    handleSwipeStart(pos);
  }, [handleSwipeStart]);

  const generateWordleGrid = useCallback(() => {
    const history = gameState.clearedCellHistory;

    // Compress 10 rows -> 5 rows (2 rows merged into 1)
    // If either row in a pair has a cleared cell at that column, it's colored
    const colorEmojis = ['🟩', '🟨', '🟥', '🟦', '🟪', '🟧'];
    const rows: string[] = [];

    for (let r = 0; r < ROWS; r += 2) {
      let row = '';
      for (let c = 0; c < COLS; c++) {
        const cleared1 = history[r]?.[c] ?? false;
        const cleared2 = history[r + 1]?.[c] ?? false;
        if (cleared1 || cleared2) {
          row += colorEmojis[(r + c) % colorEmojis.length];
        } else {
          row += '\u2B1C'; // white square
        }
      }
      rows.push(row);
    }

    return rows.join('\n');
  }, [gameState.clearedCellHistory]);

  const handleShare = useCallback(async () => {
    try {
      const score = gameState.score;
      const dayNum = Math.floor(Date.now() / 86400000);
      const grid = generateWordleGrid();

      const maxChain = gameState.maxChainLevel > 1 ? gameState.maxChainLevel : score.maxChain;
      const message = [
        `数字サバイバル #${dayNum % 1000}`,
        `\uD83D\uDD25 ${formatNumber(score.current)}pts | 最大${maxChain}連鎖`,
        grid,
        '#数字サバイバル',
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

  const isPlaying = gameState.phase === 'playing' || gameState.phase === 'fever' || gameState.phase === 'cascading';
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

      {/* 5+ combo fullscreen white flash */}
      <Animated.View style={[styles.flashOverlay, flashStyle]} pointerEvents="none" />

      {/* Spotlight overlay for 3+ chain cascade */}
      <Animated.View style={[styles.spotlightOverlay, spotlightStyle]} pointerEvents="none" />

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
          onSwipeStart={handleSwipeStartWithAudio}
          onSwipeMove={handleSwipeMove}
          onSwipeEnd={handleSwipeEndWithHaptic}
          disabled={!isPlaying || gameState.isPaused || showTutorial || gameState.phase === 'cascading'}
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

        {/* Shockwave overlay */}
        <View style={styles.shockwaveContainer}>
          {shockwaves.map(s => (
            <ShockwaveEffect
              key={s.id}
              row={s.row}
              col={s.col}
              comboCount={s.comboCount}
              onComplete={() => removeShockwave(s.id)}
            />
          ))}
        </View>

        {/* Combo display */}
        <ComboDisplay comboCount={gameState.combo.count} />

        {/* Chain display */}
        <ChainDisplay chainEvent={gameState.lastChainEvent} />
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
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 200,
    pointerEvents: 'none',
  },
  spotlightOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 50,
    pointerEvents: 'none',
  },
  shockwaveContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    zIndex: 60,
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

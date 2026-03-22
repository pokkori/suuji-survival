import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Share, Platform, Animated as RNAnimated } from 'react-native';
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
import { generateScoreCard } from '../utils/shareImage';
import { hapticClear, hapticCombo, hapticComboHeavy, hapticFever, hapticSpecialBlock, hapticGameOver, setHapticsEnabled } from '../utils/haptics';
import { playClearSound, playComboSound, playFeverSound, playGameOverSound, playSpecialBlockSound, playChainSound, resumeAudioContext, setSEEnabled, setSEVolume, playBGM, stopBGM, unloadBGMAsync, setBGMEnabled, setBGMVolume, loadBGMAsync } from '../utils/sound';
import { STORAGE_KEYS } from '../constants/storage';
import { ClearEvent, ChainEvent, Position, UserSettings } from '../types';
import { COLS, ROWS, CELL_SIZE, GRID_PADDING } from '../constants/grid';
import { AdBanner } from '../components/AdBanner';
import { ScorePopup } from '../components/ScorePopup';

// Unique ID counter for particle effects
let particleIdCounter = 0;
// Unique ID counter for shockwave effects
let shockwaveIdCounter = 0;
// Unique ID counter for score popups
let scorePopupIdCounter = 0;

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

interface ScorePopupInstance {
  id: number;
  value: number;
  x: number;
  y: number;
}

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dailySeed?: string; mode?: string }>();
  const isTimeAttack = params.mode === 'timeattack';
  const dailySeed = params.dailySeed ? Number(params.dailySeed) : undefined;
  const { colors } = useTheme();
  const storage = useStorage();
  const [prevBest, setPrevBest] = useState(0);
  const [currentCoins, setCurrentCoins] = useState(0);
  const gameOverSavedRef = useRef(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const prevPhaseRef = useRef<string>('idle');
  const prevComboRef = useRef(0);
  const dailyStreakRef = useRef(0);
  useEffect(() => {
    storage.getNumber(STORAGE_KEYS.DAILY_STREAK, 0).then(v => { dailyStreakRef.current = v; });
  }, []);
  const prevFeverRef = useRef(false);
  const prevClearEventRef = useRef<ClearEvent | null>(null);
  const [particles, setParticles] = useState<ParticleInstance[]>([]);
  const [shockwaves, setShockwaves] = useState<ShockwaveInstance[]>([]);
  const [scorePopups, setScorePopups] = useState<ScorePopupInstance[]>([]);
  const prevChainEventRef = useRef<ChainEvent | null>(null);

  const [showMidShareHint, setShowMidShareHint] = useState(false);
  const hasShownMidHint = useRef(false);

  const [showEndlessBanner, setShowEndlessBanner] = useState(false);

  // Spotlight overlay for 3+ chain cascade
  const spotlightOpacity = useSharedValue(0);

  // 5+ combo fullscreen flash
  const flashOpacity = useSharedValue(0);

  // Screen shake shared value
  const shakeX = useSharedValue(0);
  const shakeY = useSharedValue(0);

  // Fever background pulse
  const feverHue = useSharedValue(0);

  // Fever start white flash (React Native Animated, separate from Reanimated flashOpacity)
  const feverFlashAnim = useRef(new RNAnimated.Value(0)).current;
  // Fever grid scale pulse (React Native Animated)
  const feverGridScale = useRef(new RNAnimated.Value(1)).current;
  const feverGridLoopRef = useRef<RNAnimated.CompositeAnimation | null>(null);

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
  } = useGameEngine(dailySeed, isTimeAttack ? 60000 : undefined);

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
      setBGMEnabled(saved.bgmEnabled);
      setBGMVolume(saved.bgmVolume);
      await loadBGMAsync();
    })();
    return () => { unloadBGMAsync(); };
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
    storage.getNumber(STORAGE_KEYS.COINS, 0).then(c => setCurrentCoins(c));
    // 常に即時開始（チュートリアルは上にオーバーレイ表示）
    startGame();
  }, []);

  // Haptics + sound feedback for game events
  useEffect(() => {
    // Start BGM when playing begins
    if (gameState.phase === 'playing' && prevPhaseRef.current !== 'playing' && prevPhaseRef.current !== 'fever' && prevPhaseRef.current !== 'cascading') {
      playBGM(104);
    }
    // Game over haptic + sound
    if (gameState.phase === 'gameover' && prevPhaseRef.current !== 'gameover') {
      stopBGM();
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
      playBGM(148);
      // White flash on fever start
      RNAnimated.sequence([
        RNAnimated.timing(feverFlashAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        RNAnimated.timing(feverFlashAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
      // Grid scale pulse loop
      feverGridScale.setValue(1);
      const loop = RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(feverGridScale, { toValue: 1.02, duration: 250, useNativeDriver: true }),
          RNAnimated.timing(feverGridScale, { toValue: 1, duration: 250, useNativeDriver: true }),
        ])
      );
      feverGridLoopRef.current = loop;
      loop.start();
      // Start fever hue rotation
      feverHue.value = 0;
      feverHue.value = withRepeat(
        withTiming(360, { duration: 3000, easing: Easing.linear }),
        -1, // infinite
        false,
      );
    } else if (!gameState.fever.isActive && prevFeverRef.current) {
      playBGM(104);
      cancelAnimation(feverHue);
      feverHue.value = 0;
      // Stop grid scale pulse
      if (feverGridLoopRef.current) {
        feverGridLoopRef.current.stop();
        feverGridLoopRef.current = null;
      }
      feverGridScale.setValue(1);
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

  // Mid-game share hint for maxChainLevel >= 3
  useEffect(() => {
    if (gameState.maxChainLevel >= 3 && !hasShownMidHint.current) {
      hasShownMidHint.current = true;
      setShowMidShareHint(true);
      setTimeout(() => setShowMidShareHint(false), 3000);
    }
  }, [gameState.maxChainLevel]);

  // Endless mode unlock banner when maxChainLevel reaches 8
  useEffect(() => {
    if (gameState.maxChainLevel >= 8) {
      storage.setString(STORAGE_KEYS.ENDLESS_UNLOCKED, 'true').catch(() => {});
      setShowEndlessBanner(true);
      const t = setTimeout(() => setShowEndlessBanner(false), 2000);
      return () => clearTimeout(t);
    }
  }, [gameState.maxChainLevel]);

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

        // Score popup at center of cleared area
        const popupX = GRID_PADDING + centerPos.col * CELL_SIZE + CELL_SIZE / 2 - 20;
        const popupY = centerPos.row * CELL_SIZE + CELL_SIZE / 2 - 12;
        const popupValue = clearEvent.comboCount >= 2
          ? clearEvent.comboCount * 10
          : 10;
        const newPopup: ScorePopupInstance = {
          id: scorePopupIdCounter++,
          value: popupValue,
          x: popupX,
          y: popupY,
        };
        setScorePopups(prev => [...prev, newPopup]);
      }
    }
  }, [gameState.lastClearEvent]);

  const removeParticle = useCallback((id: number) => {
    setParticles(prev => prev.filter(p => p.id !== id));
  }, []);

  const removeShockwave = useCallback((id: number) => {
    setShockwaves(prev => prev.filter(s => s.id !== id));
  }, []);

  const removeScorePopup = useCallback((id: number) => {
    setScorePopups(prev => prev.filter(p => p.id !== id));
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
    startGame(); // チュートリアル完了後にゲーム開始
  }, [storage, startGame]);

  const handleRestart = useCallback(() => {
    gameOverSavedRef.current = false;
    startGame();
  }, [startGame]);

  const handleRevive = useCallback(() => {
    revive();
  }, [revive]);

  const handleCoinRevive = useCallback(async () => {
    const coins = await storage.getNumber(STORAGE_KEYS.COINS, 0);
    if (coins < 500) return;
    await storage.setNumber(STORAGE_KEYS.COINS, coins - 500);
    setCurrentCoins(coins - 500);
    revive();
  }, [revive, storage]);

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

  function getSharePercentile(score: number): string {
    if (score >= 20000) return '上位1%相当';
    if (score >= 15000) return '上位3%相当';
    if (score >= 10000) return '上位8%相当';
    if (score >= 7000)  return '上位15%相当';
    if (score >= 4000)  return '上位30%相当';
    if (score >= 2000)  return '上位50%相当';
    if (score >= 800)   return '上位70%相当';
    return '上位90%相当';
  }

  const generateShareText = useCallback((
    score: number,
    maxChain: number,
    maxChainLevel: number,
    isNewRecord: boolean,
    wordleGrid: string,
    rankLabel: string,
  ): string => {
    const recordMark = isNewRecord ? 'NEW RECORD! ' : '';
    const percentile = getSharePercentile(score);
    let challengeComment: string;
    if (isNewRecord) {
      challengeComment = `これは俺の新記録！${percentile}に到達！あなたも挑戦して！`;
    } else if (score > 5000) {
      challengeComment = `${percentile}に到達！ベスト超えを目指せ！あなたは？`;
    } else {
      challengeComment = `隣の数字をなぞって合計10！簡単そうで難しい あなたは${percentile}を超えられる？`;
    }
    return [
      `${recordMark}数字サバイバル`,
      `スコア: ${score.toLocaleString()} [${rankLabel}ランク] ${percentile}`,
      `最大チェーン: ${maxChain}連鎖（${maxChainLevel}段階カスケード）`,
      challengeComment,
      '',
      wordleGrid,
      '#数字サバイバル #NumberSurvivor',
      'https://suuji-survival.vercel.app',
    ].join('\n');
  }, []);

  const handleShare = useCallback(async () => {
    try {
      const score = gameState.score;
      const maxChainLevel = gameState.maxChainLevel > 1 ? gameState.maxChainLevel : 1;
      const isNewRecord = score.current > 0 && score.current >= score.best;
      const s = score.current;
      const rankLabelShare = s >= 20000 ? 'S+' : s >= 15000 ? 'S' : s >= 10000 ? 'A+' : s >= 7000 ? 'A' : s >= 4000 ? 'B+' : s >= 2000 ? 'B' : s >= 800 ? 'C' : 'D';
      const wordleGrid = generateWordleGrid();
      const baseText = generateShareText(score.current, score.maxChain, maxChainLevel, isNewRecord, wordleGrid, rankLabelShare);
      const message = wordleGrid ? `${baseText}` : baseText;
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
        const dailyStreak = await storage.getNumber(STORAGE_KEYS.DAILY_STREAK, 0);
        const streakSuffix = dailyStreak >= 2 ? ` ${dailyStreak}日連続` : '';
        const enhancedMessage = `数字サバイバル スコア: ${score.current.toLocaleString()}${streakSuffix}\n最大チェーン: ${score.maxChain} #数字サバイバル #数字ゲーム\nhttps://suuji-survival.vercel.app`;
        const blob = await generateScoreCard({
          score: score.current,
          maxChain: score.maxChain,
          blocksCleared: score.blocksCleared ?? 0,
          isNewRecord,
          wordleGrid: wordleGrid || '',
          themeColors: { background: '#0a0a1a', accentColor: '#00FFAA', cellColors: {} },
          dailyStreak,
          personalBest: prevBest,
        });
        if (
          blob &&
          navigator.canShare &&
          navigator.canShare({ files: [new File([blob], 'score.png', { type: 'image/png' })] })
        ) {
          const file = new File([blob], 'score.png', { type: 'image/png' });
          await navigator.share({ files: [file], text: enhancedMessage });
        } else {
          await navigator.share({ text: enhancedMessage });
        }
      } else {
        await Share.share({ message });
      }
    } catch { /* ignore */ }
  }, [gameState.score, gameState.maxChainLevel, generateShareText, generateWordleGrid]);

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

      {/* Fever start white flash overlay */}
      <RNAnimated.View
        style={[styles.feverFlashOverlay, { opacity: feverFlashAnim }]}
        pointerEvents="none"
      />

      {/* 5+ combo fullscreen white flash */}
      <Animated.View style={[styles.flashOverlay, flashStyle]} pointerEvents="none" />

      {/* Spotlight overlay for 3+ chain cascade */}
      <Animated.View style={[styles.spotlightOverlay, spotlightStyle]} pointerEvents="none" />

      {/* Time attack countdown */}
      {isTimeAttack && gameState.phase !== 'gameover' && (
        <View style={styles.timeAttackBar}>
          <Text style={[
            styles.timeAttackText,
            { color: gameState.elapsedMs > 45000 ? '#FF2244' : '#FF4500' }
          ]}>
            TIME {Math.max(0, Math.ceil((60000 - (gameState.elapsedMs ?? 0)) / 1000))}
          </Text>
        </View>
      )}

      {/* Score bar */}
      <ScoreBar
        score={gameState.score.current}
        combo={gameState.combo}
        fever={gameState.fever}
        colors={colors}
        freezeMs={gameState.freezeRemainingMs}
        dangerLevel={(() => {
          let filledRows = 0;
          for (let r = 0; r < ROWS; r++) {
            if (gameState.grid[r].some(cell => cell.content.type !== 'empty')) {
              filledRows = ROWS - r;
              break;
            }
          }
          if (filledRows >= gameState.difficulty.warningRowThreshold + 1) return 2;
          if (filledRows >= gameState.difficulty.warningRowThreshold) return 1;
          return 0;
        })()}
      />

      {/* Next queue */}
      <NextQueue nextRows={gameState.nextRows} colors={colors} />

      {/* Grid with screen shake */}
      <Animated.View style={[styles.gridContainer, shakeStyle]}>
        <RNAnimated.View style={[styles.gridInner, { transform: [{ scale: feverGridScale }] }]}>
        <GridView
          grid={gameState.grid}
          colors={colors}
          warningRowThreshold={gameState.difficulty.warningRowThreshold}
          onSwipeStart={handleSwipeStartWithAudio}
          onSwipeMove={handleSwipeMove}
          onSwipeEnd={handleSwipeEndWithHaptic}
          disabled={!isPlaying || gameState.isPaused || showTutorial || gameState.phase === 'cascading'}
        />
        </RNAnimated.View>

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

        {/* Score popups */}
        {scorePopups.map(p => (
          <ScorePopup
            key={p.id}
            value={p.value}
            x={p.x}
            y={p.y}
            onDone={() => removeScorePopup(p.id)}
          />
        ))}
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
            {gameState.swipePath.isComplete ? <Text style={{ color: '#4CAF50' }}> CLEAR!</Text> : ''}
          </Text>
        </View>
      )}

      {/* Pause button */}
      {isPlaying && (
        <TouchableOpacity
          style={styles.pauseButton}
          onPress={togglePause}
          accessibilityLabel="一時停止"
          accessibilityRole="button"
        >
          <Text style={styles.pauseText}>{gameState.isPaused ? '\u25B6' : '\u23F8'}</Text>
        </TouchableOpacity>
      )}

      {/* Pause overlay */}
      {gameState.isPaused && (
        <View style={styles.pauseOverlay}>
          <Text style={[styles.pauseTitle, { color: colors.accentColor }]}>PAUSED</Text>
          <TouchableOpacity
            style={[styles.resumeButton, { backgroundColor: colors.accentColor, minHeight: 44 }]}
            onPress={togglePause}
            accessibilityLabel="ゲームを再開する"
            accessibilityRole="button"
          >
            <Text style={styles.resumeText}>{'\u25B6'} 再開</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quitButton, { borderColor: colors.accentColor, minHeight: 44 }]}
            onPress={handleHome}
            accessibilityLabel="タイトル画面へ戻る"
            accessibilityRole="button"
          >
            <Text style={[styles.quitText, { color: colors.accentColor }]}>HOME タイトルへ</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Mid-game share hint */}
      {showMidShareHint && (
        <Pressable
          style={{
            position: "absolute", bottom: 80, alignSelf: "center",
            backgroundColor: "#FF6B35", borderRadius: 20,
            paddingHorizontal: 20, paddingVertical: 10, zIndex: 100
          }}
          onPress={() => { handleShare(); setShowMidShareHint(false); }}
        >
          <Text style={{ color: "#FFF", fontWeight: "bold" }}>
            チェーン×{gameState.maxChainLevel}！シェアする？
          </Text>
        </Pressable>
      )}

      {/* Endless mode unlock banner */}
      {showEndlessBanner && (
        <View style={{ position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: '#FF6B35', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12, zIndex: 100 }}>
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>エンドレスモード解放！</Text>
        </View>
      )}

      {/* Game over */}
      <AdBanner />
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
          dailyStreak={dailyStreakRef.current}
          currentCoins={currentCoins}
          onCoinRevive={handleCoinRevive}
          personalBest={prevBest}
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
  gridInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  feverFlashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
    zIndex: 150,
    pointerEvents: 'none',
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
    top: 16,
    right: 16,
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
  timeAttackBar: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  timeAttackText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

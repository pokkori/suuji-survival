import React, { useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGameEngine } from '../hooks/useGameEngine';
import { useTheme } from '../hooks/useTheme';
import { GridView } from '../components/Grid';
import { ScoreBar } from '../components/ScoreBar';
import { NextQueue } from '../components/NextQueue';
import { ComboDisplay } from '../components/ComboDisplay';
import { GameOverOverlay } from '../components/GameOverOverlay';
import { formatNumber } from '../utils/formatNumber';

export default function GameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dailySeed?: string }>();
  const dailySeed = params.dailySeed ? Number(params.dailySeed) : undefined;
  const { colors } = useTheme();
  const [prevBest, setPrevBest] = useState(0);
  const gameOverSavedRef = useRef(false);

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

  useEffect(() => {
    setPrevBest(gameState.score.best);
    startGame();
  }, []);

  useEffect(() => {
    if (gameState.phase === 'gameover' && !gameOverSavedRef.current) {
      gameOverSavedRef.current = true;
      saveGameResult();
    }
  }, [gameState.phase]);

  const handleRestart = useCallback(() => {
    gameOverSavedRef.current = false;
    startGame();
  }, [startGame]);

  const handleRevive = useCallback(() => {
    revive();
  }, [revive]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `数字サバイバルで${formatNumber(gameState.score.current)}点を記録しました！最大コンボx${gameState.score.maxChain} #数字サバイバル #NumberSurvivor`,
      });
    } catch {
      // ignore
    }
  }, [gameState.score]);

  const handleHome = useCallback(() => {
    router.replace('/');
  }, [router]);

  const isPlaying = gameState.phase === 'playing' || gameState.phase === 'fever';
  const isNewBest = gameState.score.current > prevBest && gameState.score.current > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
          onSwipeEnd={handleSwipeEnd}
          disabled={!isPlaying || gameState.isPaused}
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

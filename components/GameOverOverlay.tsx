import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScoreState, ThemeColors } from '../types';
import { formatNumber, formatTime } from '../utils/formatNumber';
import { scoreToCoins } from '../engine/scoreCalc';

interface Props {
  score: ScoreState;
  elapsedMs: number;
  colors: ThemeColors;
  onRestart: () => void;
  onRevive: () => void;
  onShare: () => void;
  onHome: () => void;
  canRevive: boolean;
  isNewBest: boolean;
}

export const GameOverOverlay: React.FC<Props> = ({
  score, elapsedMs, colors, onRestart, onRevive, onShare, onHome, canRevive, isNewBest,
}) => {
  const earnedCoins = scoreToCoins(score.current);

  return (
    <View style={styles.overlay}>
      <View style={[styles.card, { backgroundColor: colors.gridBackground }]}>
        <Text style={[styles.title, { color: colors.accentColor }]}>GAME OVER</Text>

        <Text style={[styles.scoreLabel, { color: colors.cellTextColor }]}>SCORE</Text>
        <Text style={[styles.scoreValue, { color: colors.accentColor }]}>
          {formatNumber(score.current)}
        </Text>
        {isNewBest && (
          <Text style={styles.newBest}>🏆 NEW BEST!</Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.cellTextColor }]}>消去</Text>
            <Text style={[styles.statValue, { color: colors.accentColor }]}>
              {score.blocksCleared}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.cellTextColor }]}>最大コンボ</Text>
            <Text style={[styles.statValue, { color: colors.accentColor }]}>
              x{score.maxChain}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={[styles.statLabel, { color: colors.cellTextColor }]}>時間</Text>
            <Text style={[styles.statValue, { color: colors.accentColor }]}>
              {formatTime(elapsedMs)}
            </Text>
          </View>
        </View>

        <Text style={[styles.coinsEarned, { color: '#FFD700' }]}>
          +{earnedCoins} 💰
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accentColor }]}
          onPress={onRestart}
        >
          <Text style={styles.buttonText}>▶ もう1回</Text>
        </TouchableOpacity>

        {canRevive && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#44CCFF' }]}
            onPress={onRevive}
          >
            <Text style={styles.buttonText}>📺 広告で復活</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#666' }]}
          onPress={onShare}
        >
          <Text style={styles.buttonText}>📤 シェア</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonOutline, { borderColor: colors.accentColor }]}
          onPress={onHome}
        >
          <Text style={[styles.buttonOutlineText, { color: colors.accentColor }]}>
            🏠 タイトルへ
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  card: {
    width: '85%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  newBest: {
    fontSize: 18,
    color: '#FFD700',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  coinsEarned: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonOutline: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 8,
  },
  buttonOutlineText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

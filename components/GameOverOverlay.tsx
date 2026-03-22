import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScoreState, ThemeColors } from '../types';
import { formatNumber, formatTime } from '../utils/formatNumber';
import { scoreToCoins } from '../engine/scoreCalc';
import { STORAGE_KEYS } from '../constants/storage';

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
  dailyStreak?: number;
}

export const GameOverOverlay: React.FC<Props> = ({
  score, elapsedMs, colors, onRestart, onRevive, onShare, onHome, canRevive, isNewBest, dailyStreak,
}) => {
  const earnedCoins = scoreToCoins(score.current);
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        // 統一形式: DAILY_STREAK = 数値文字列 (String(count))
        // DAILY_STREAK_DATE = "YYYY-MM-DD" 文字列
        const STREAK_DATE_KEY = STORAGE_KEYS.DAILY_STREAK + '_date'; // "@ns:daily_streak_date"
        const countRaw = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_STREAK);
        const dateRaw = await AsyncStorage.getItem(STREAK_DATE_KEY);
        const today = new Date().toISOString().slice(0, 10);
        const count = countRaw !== null ? Number(countRaw) : 0;
        const lastDate = dateRaw ?? '';
        const diffDays = lastDate
          ? Math.round((new Date(today).getTime() - new Date(lastDate).getTime()) / 86400000)
          : -1;
        let newCount: number;
        if (diffDays === 0) {
          newCount = count;
        } else if (diffDays === 1) {
          newCount = count + 1;
        } else {
          newCount = 1;
        }
        await AsyncStorage.setItem(STORAGE_KEYS.DAILY_STREAK, String(newCount));
        await AsyncStorage.setItem(STREAK_DATE_KEY, today);
        setStreakDays(newCount);
      } catch {
        // silently fail
      }
    })();
  }, []);

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

        {streakDays >= 2 && (
          <Text style={styles.streakBadge}>🔥 {streakDays}日連続プレイ！</Text>
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
          style={[styles.button, {
            backgroundColor: streakDays >= 2 ? '#FF6B35' : '#4A90E2',
          }]}
          onPress={onShare}
        >
          <Text style={styles.buttonText}>
            {streakDays >= 2
              ? `📤 ${streakDays}日連続をシェア！`
              : '📤 結果をシェア（友達を招待）'}
          </Text>
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
  streakBadge: {
    fontSize: 16,
    color: '#FF8C00',
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

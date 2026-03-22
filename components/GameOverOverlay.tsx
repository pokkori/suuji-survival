import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScoreState, ThemeColors } from '../types';
import { formatNumber, formatTime } from '../utils/formatNumber';
import { scoreToCoins } from '../engine/scoreCalc';
import { STORAGE_KEYS } from '../constants/storage';
import { RankBadgeSVG } from './RankBadgeSVG';

function getWeeklyKey(): string {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

function getSharePercentile(score: number): string {
  if (score >= 20000) return "上位1%相当";
  if (score >= 15000) return "上位3%相当";
  if (score >= 10000) return "上位8%相当";
  if (score >= 7000) return "上位15%相当";
  if (score >= 4000) return "上位30%相当";
  if (score >= 2000) return "上位50%相当";
  if (score >= 800) return "上位70%相当";
  return "上位90%相当";
}

const COIN_REVIVE_COST = 500;

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
  currentCoins: number;
  onCoinRevive: () => void;
  personalBest: number;
  bestMaxChain?: number;
}

export const GameOverOverlay: React.FC<Props> = ({
  score, elapsedMs, colors, onRestart, onRevive, onShare, onHome, canRevive, isNewBest, dailyStreak,
  currentCoins, onCoinRevive, personalBest, bestMaxChain,
}) => {
  const earnedCoins = scoreToCoins(score.current);
  const rankLabel: string = (() => {
    const s = score.current;
    if (s >= 20000) return 'S+';
    if (s >= 15000) return 'S';
    if (s >= 10000) return 'A+';
    if (s >= 7000)  return 'A';
    if (s >= 4000)  return 'B+';
    if (s >= 2000)  return 'B';
    if (s >= 800)   return 'C';
    return 'D';
  })();
  const nextThresholds: Record<string, number> = {
    'D': 800, 'C': 2000, 'B': 4000, 'B+': 7000, 'A': 10000, 'A+': 15000, 'S': 20000, 'S+': Infinity,
  };
  const nextTarget = nextThresholds[rankLabel];
  const toNext = nextTarget === Infinity ? null : nextTarget - score.current;
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

      // 週次チャレンジ進捗更新
      (async () => {
        const weekKey = getWeeklyKey();
        const storageKey = `@ns:weekly_challenge_${weekKey}`;
        const raw = await AsyncStorage.getItem(storageKey);
        const weekly = raw ? JSON.parse(raw) : { totalScore: 0, gameCount: 0 };
        weekly.totalScore += (score.current ?? 0);
        weekly.gameCount += 1;
        await AsyncStorage.setItem(storageKey, JSON.stringify(weekly));
      })();
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
          <Text style={styles.newBest}>NEW BEST!</Text>
        )}

        {/* ▶ もう1回 — スコア直下のファーストCTA（スクロール不要） */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accentColor, minHeight: 44, marginBottom: 4 }]}
          onPress={onRestart}
          accessibilityLabel="もう一度プレイする"
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>▶ もう1回</Text>
        </TouchableOpacity>
        {!isNewBest && personalBest > 0 && (
          <View style={styles.bestCompareRow}>
            <Text style={[styles.bestCompareLabel, { color: colors.cellTextColor }]}>
              ベスト比
            </Text>
            <View style={styles.bestBarTrack}>
              <View
                style={[
                  styles.bestBarFill,
                  {
                    width: `${Math.min(100, Math.round((score.current / personalBest) * 100))}%`,
                    backgroundColor: score.current >= personalBest * 0.9 ? '#00FF88' : colors.accentColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.bestComparePercent, { color: colors.cellTextColor }]}>
              {Math.round((score.current / personalBest) * 100)}%
            </Text>
          </View>
        )}
        <View style={{ alignItems: "center", marginVertical: 8 }}>
          <RankBadgeSVG rank={rankLabel} size={72} />
        </View>
        <Text style={{ color: "#FFD700", fontSize: 14, fontWeight: "bold", textAlign: "center", marginTop: 4 }}>
          {getSharePercentile(score.current)}
        </Text>
        <TouchableOpacity
          style={{ marginTop: 8, padding: 10, backgroundColor: "rgba(255,107,53,0.2)", borderRadius: 10 }}
          onPress={onShare}
          accessibilityLabel="この結果をシェアする"
          accessibilityRole="button"
        >
          <Text style={{ color: "#FF6B35", fontWeight: "bold", textAlign: "center" }}>
            この結果をシェアする
          </Text>
        </TouchableOpacity>
        {toNext !== null && (
          <View style={{
            backgroundColor: 'rgba(0,255,170,0.12)',
            borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
            marginBottom: 12, width: '100%', alignItems: 'center',
          }}>
            <Text style={{ color: colors.accentColor, fontSize: 13, fontWeight: 'bold' }}>
              次の目標
            </Text>
            <Text style={{ color: colors.cellTextColor, fontSize: 14, marginTop: 2 }}>
              あと{toNext.toLocaleString()}点で{
                (() => {
                  const order = ['D','C','B','B+','A','A+','S','S+'];
                  const next = ['C','B','B+','A','A+','S','S+','S+'];
                  const idx = order.indexOf(rankLabel);
                  return idx >= 0 ? next[idx] : 'S+';
                })()
              }ランク昇格！
            </Text>
            {(score.maxChain ?? 0) < 5 && (
              <Text style={{ color: colors.cellTextColor, fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                5コンボを繋げるとスコアが跳ね上がります
              </Text>
            )}
          </View>
        )}

        {bestMaxChain !== undefined && bestMaxChain > 0 && (score.maxChain ?? 0) > bestMaxChain && (
          <View style={{ backgroundColor: 'rgba(255,215,0,0.18)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginTop: 6, width: '100%', alignItems: 'center', borderWidth: 2, borderColor: '#FFD700' }}>
            <Text style={{ color: '#FFD700', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 }}>
              NEW COMBO RECORD!
            </Text>
            <Text style={{ color: '#FFD700', fontSize: 14, fontWeight: 'bold', marginTop: 2 }}>
              MAX x{score.maxChain} 達成！
            </Text>
          </View>
        )}
        {bestMaxChain !== undefined && bestMaxChain > 0 && (score.maxChain ?? 0) >= bestMaxChain * 0.9 && (score.maxChain ?? 0) < bestMaxChain && (
          <View style={{ backgroundColor: 'rgba(255,107,0,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, marginTop: 6, width: '100%', alignItems: 'center' }}>
            <Text style={{ color: '#FF8C00', fontSize: 13, fontWeight: 'bold' }}>
              コンボ記録まであと{bestMaxChain - (score.maxChain ?? 0)}！
            </Text>
          </View>
        )}

        {streakDays >= 2 && (
          <Text style={styles.streakBadge}>連続 {streakDays}日目!</Text>
        )}

        {streakDays > 0 && streakDays % 7 === 0 && (
          <View style={{ backgroundColor: '#FFD700', borderRadius: 8, padding: 12, marginTop: 8, alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1a1a3e' }}>7日連続！ストリーク達成！</Text>
          </View>
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
          +{earnedCoins} COIN
        </Text>

        {canRevive && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: currentCoins >= COIN_REVIVE_COST ? '#FFD700' : 'rgba(255,215,0,0.4)', minHeight: 44 }]}
            onPress={() => {
              if (currentCoins >= COIN_REVIVE_COST) {
                onCoinRevive();
              } else {
                Alert.alert('コインが足りません', `復活には${COIN_REVIVE_COST}コイン必要です。\n現在: ${currentCoins}コイン`);
              }
            }}
            accessibilityLabel="コインで復活する"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{COIN_REVIVE_COST}コインで復活！</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, {
            backgroundColor: streakDays >= 2 ? '#FF6B35' : '#4A90E2',
          }]}
          onPress={onShare}
          accessibilityLabel={streakDays >= 2 ? `${streakDays}日連続をシェアする` : '結果をシェアして友達を招待する'}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            {streakDays >= 2
              ? `${streakDays}日連続をシェア！`
              : '結果をシェア（友達を招待）'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.buttonOutline, { borderColor: colors.accentColor }]}
          onPress={onHome}
        >
          <Text style={[styles.buttonOutlineText, { color: colors.accentColor }]}>
            タイトルへ
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
  rankRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4,
  },
  rankLabelText: {
    fontSize: 14, opacity: 0.7, fontWeight: 'bold',
  },
  rankValue: {
    fontSize: 36, fontWeight: 'bold',
  },
  toNextText: {
    fontSize: 13, opacity: 0.8, marginBottom: 8, textAlign: 'center',
  },
  bestCompareRow: {
    flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 8, gap: 8,
  },
  bestCompareLabel: {
    fontSize: 12, opacity: 0.7, width: 44,
  },
  bestBarTrack: {
    flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 3, overflow: 'hidden',
  },
  bestBarFill: {
    height: 6, borderRadius: 3,
  },
  bestComparePercent: {
    fontSize: 12, width: 36, textAlign: 'right', opacity: 0.8,
  },
});

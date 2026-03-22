import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useStorage } from '../hooks/useStorage';
import { STORAGE_KEYS } from '../constants/storage';
import { DailyChallenge } from '../types';
import { getDateKey } from '../utils/dateKey';
import { getDailyTargetScore, dateToSeed } from '../engine/rng';
import { formatNumber } from '../utils/formatNumber';
import { generateScoreCard } from '../utils/shareImage';
import AsyncStorage from '@react-native-async-storage/async-storage';

function getWeeklyKey(): string {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

export default function DailyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const storage = useStorage();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [streak, setStreak] = useState(0);

  const today = getDateKey();

  useEffect(() => {
    (async () => {
      const challenges = await storage.getItem<Record<string, DailyChallenge>>(
        STORAGE_KEYS.DAILY_CHALLENGES, {}
      );
      const s = await storage.getNumber(STORAGE_KEYS.DAILY_STREAK, 0);
      setStreak(s);

      if (challenges[today]) {
        setChallenge(challenges[today]);
      } else {
        const newChallenge: DailyChallenge = {
          dateKey: today,
          targetScore: getDailyTargetScore(today),
          seed: dateToSeed(today),
          completed: false,
          bestScore: 0,
          attempts: 0,
        };
        challenges[today] = newChallenge;
        await storage.setItem(STORAGE_KEYS.DAILY_CHALLENGES, challenges);
        setChallenge(newChallenge);
      }
    })();
  }, []);

  const handleDailyShare = async () => {
    if (!challenge) return;
    const blob = await generateScoreCard({
      score: challenge.bestScore ?? 0,
      maxChain: 0,
      blocksCleared: 0,
      isNewRecord: false,
      wordleGrid: '',
      themeColors: { background: colors.background, accentColor: colors.accentColor, cellColors: {} },
      dailyStreak: streak,
    });
    const text = `数字サバイバル デイリー達成🏆 スコア: ${(challenge.bestScore ?? 0).toLocaleString()} ${streak}日連続🔥 #数字サバイバル\nhttps://suuji-survival.vercel.app`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share && blob) {
      const file = new File([blob], 'number-survivor-daily.png', { type: 'image/png' });
      await navigator.share({ text, files: [file] });
    } else if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({ text });
    }
  };

  const handleStart = useCallback(() => {
    if (!challenge) return;
    router.push({
      pathname: '/game',
      params: { dailySeed: String(challenge.seed) },
    });
  }, [challenge, router]);

  const progress = challenge ? Math.min(100, (challenge.bestScore / challenge.targetScore) * 100) : 0;

  // 過去30日分のチャレンジ一覧
  const allChallenges = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().split("T")[0];
  });

  const [calendarStatuses, setCalendarStatuses] = useState<Record<string, string>>({});
  const [weeklyProgress, setWeeklyProgress] = useState<{ totalScore: number; gameCount: number } | null>(null);
  const [past7DayResults, setPast7DayResults] = useState<{ date: string; result: 'CLEAR' | 'FAIL' | '--' }[]>([]);
  const WEEKLY_TARGET_SCORE = 50000;
  const WEEKLY_GAME_TARGET = 7;

  useEffect(() => {
    (async () => {
      // Load past 7 days from daily_results AsyncStorage key
      const raw = await AsyncStorage.getItem('daily_results');
      const allResults: { date: string; result: 'CLEAR' | 'FAIL' }[] = raw ? JSON.parse(raw) : [];
      const resultMap: Record<string, 'CLEAR' | 'FAIL'> = {};
      for (const entry of allResults) {
        resultMap[entry.date] = entry.result;
      }
      const past7: { date: string; result: 'CLEAR' | 'FAIL' | '--' }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        past7.push({ date: dateStr, result: resultMap[dateStr] ?? '--' });
      }
      setPast7DayResults(past7);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const statuses: Record<string, string> = {};
      const todayStr = new Date().toISOString().split("T")[0];
      const challenges = await storage.getItem<Record<string, DailyChallenge>>(STORAGE_KEYS.DAILY_CHALLENGES, {});
      for (const dateStr of allChallenges.slice(-14)) {
        if (dateStr === todayStr) {
          statuses[dateStr] = "today";
        } else {
          const result = challenges[dateStr];
          if (!result) {
            statuses[dateStr] = "missed";
          } else {
            statuses[dateStr] = result.completed ? "cleared" : "failed";
          }
        }
      }
      setCalendarStatuses(statuses);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const weekKey = getWeeklyKey();
      const raw = await AsyncStorage.getItem(`@ns:weekly_challenge_${weekKey}`);
      if (raw) setWeeklyProgress(JSON.parse(raw));
      else setWeeklyProgress({ totalScore: 0, gameCount: 0 });
    })();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.accentColor }]}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.cellTextColor }]}>デイリーチャレンジ</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.dateText, { color: colors.cellTextColor }]}>
          {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Text>

        {challenge && (
          <View style={[styles.challengeCard, { backgroundColor: colors.gridBackground }]}>
            <Text style={[styles.targetLabel, { color: colors.cellTextColor }]}>
              目標スコア: {formatNumber(challenge.targetScore)}
            </Text>

            <Text style={[styles.bestLabel, { color: colors.cellTextColor }]}>
              あなたのベスト: {formatNumber(challenge.bestScore)}
            </Text>

            <View style={[styles.progressBar, { backgroundColor: colors.gridLine }]}>
              <View style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: challenge.completed ? '#00FF88' : colors.accentColor,
                },
              ]} />
            </View>
            <Text style={[styles.progressText, { color: colors.cellTextColor }]}>
              {progress.toFixed(1)}% {challenge.completed ? 'クリア!' : ''}
            </Text>

            <Text style={[styles.attemptsText, { color: colors.cellTextColor }]}>
              挑戦回数: {challenge.attempts}
            </Text>

            {challenge.completed ? (
              <View style={styles.completedBanner}>
                <Text style={styles.completedTitle}>本日のチャレンジ達成！</Text>
                <Text style={styles.completedScore}>スコア: {challenge.bestScore?.toLocaleString()}</Text>
                <TouchableOpacity style={styles.shareBtn} onPress={handleDailyShare}>
                  <Text style={styles.shareBtnText}>達成をシェア</Text>
                </TouchableOpacity>
              </View>
            ) : challenge.bestScore > 0 ? (
              <View style={[styles.completedBanner, { borderColor: 'rgba(0,255,170,0.2)', backgroundColor: 'rgba(0,255,170,0.05)' }]}>
                <Text style={[styles.completedTitle, { color: colors.accentColor, fontSize: 16 }]}>
                  挑戦中 — ベスト: {challenge.bestScore.toLocaleString()}
                </Text>
                <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.accentColor + '99' }]} onPress={handleDailyShare}>
                  <Text style={styles.shareBtnText}>途中経過をシェア</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}

        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: colors.accentColor }]}
          onPress={handleStart}
        >
          <Text style={styles.startButtonText}>▶ チャレンジ開始</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.cellTextColor }]}>
          ── 過去7日間の結果 ──
        </Text>
        <View style={styles.past7Row}>
          {past7DayResults.map(item => {
            const labelColor = item.result === 'CLEAR' ? '#00FF88' : item.result === 'FAIL' ? '#FF4444' : '#555';
            const dayLabel = item.date.slice(5); // MM-DD
            return (
              <View key={item.date} style={styles.past7Col}>
                <Text style={[styles.past7Day, { color: '#aaa' }]}>{dayLabel}</Text>
                <Text style={[styles.past7Result, { color: labelColor }]}>{item.result}</Text>
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.cellTextColor }]}>
          ── 連続達成 ──
        </Text>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={[styles.streakText, { color: colors.accentColor }]}>
            {streak}日連続
          </Text>
          {streak === 30 && (
            <View style={{ backgroundColor: '#ef4444', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginTop: 6, borderWidth: 2, borderColor: '#fca5a5' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
                1ヶ月連続！チャンピオン！
              </Text>
            </View>
          )}
          {streak === 14 && (
            <View style={{ backgroundColor: '#a855f7', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginTop: 6, borderWidth: 2, borderColor: '#d8b4fe' }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
                2週間連続！すごい！
              </Text>
            </View>
          )}
          {streak === 7 && (
            <View style={{ backgroundColor: '#FFD700', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, marginTop: 6 }}>
              <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
                7日達成！ウィークリーマスター！
              </Text>
            </View>
          )}
          {streak > 0 && streak < 7 && (
            <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
              あと{7 - streak}日で7日達成！
            </Text>
          )}
          {streak > 7 && streak < 14 && (
            <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
              あと{14 - streak}日で2週間達成！
            </Text>
          )}
          {streak > 14 && streak < 30 && (
            <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
              あと{30 - streak}日で1ヶ月達成！
            </Text>
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.cellTextColor }]}>
          ── 過去14日間 ──
        </Text>
        <View style={styles.weekRow}>
          {allChallenges.slice(-14).map(dateStr => {
            const status = calendarStatuses[dateStr];
            const emoji = status === "today" ? "TODAY" : status === "cleared" ? "OK" : status === "failed" ? "NG" : "--";
            return (
              <Text key={dateStr} style={[styles.dayStatus, { fontSize: 10, color: status === "cleared" ? "#00FF88" : status === "failed" ? "#FF4444" : status === "today" ? "#FFD700" : "#555" }]}>{emoji}</Text>
            );
          })}
        </View>

        {weeklyProgress !== null && (
          <View style={{ marginTop: 20, padding: 16, backgroundColor: "rgba(0,255,170,0.05)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(0,255,170,0.2)" }}>
            <Text style={{ color: "#00FFAA", fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
              週次チャレンジ
            </Text>
            <Text style={{ color: "#aaa", fontSize: 13, marginBottom: 12 }}>
              今週のミッション（月曜リセット）
            </Text>

            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: "#fff", fontSize: 13 }}>今週7回プレイ</Text>
              <View style={{ flexDirection: "row", gap: 4, marginTop: 6 }}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <View key={i} style={{
                    width: 28, height: 28, borderRadius: 6,
                    backgroundColor: i < weeklyProgress.gameCount ? "#00FFAA" : "rgba(255,255,255,0.1)",
                  }} />
                ))}
              </View>
              <Text style={{ color: "#aaa", fontSize: 11, marginTop: 3 }}>
                {weeklyProgress.gameCount}/7回 (完了で 500コイン)
              </Text>
            </View>

            <View>
              <Text style={{ color: "#fff", fontSize: 13 }}>今週合計50000点獲得</Text>
              <View style={{ height: 6, backgroundColor: "#333", borderRadius: 3, marginTop: 6 }}>
                <View style={{
                  width: `${Math.min((weeklyProgress.totalScore / WEEKLY_TARGET_SCORE) * 100, 100)}%` as any,
                  height: 6, backgroundColor: "#00FFAA", borderRadius: 3
                }} />
              </View>
              <Text style={{ color: "#aaa", fontSize: 11, marginTop: 3 }}>
                {weeklyProgress.totalScore.toLocaleString()}/{WEEKLY_TARGET_SCORE.toLocaleString()}点 (完了で 800コイン)
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backText: { fontSize: 16, fontWeight: 'bold' },
  title: { fontSize: 18, fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 24 },
  dateText: { fontSize: 18, textAlign: 'center', marginVertical: 16 },
  challengeCard: {
    padding: 20, borderRadius: 16, marginBottom: 20,
  },
  targetLabel: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  bestLabel: { fontSize: 16, marginBottom: 12 },
  progressBar: { height: 16, borderRadius: 8, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', borderRadius: 8 },
  progressText: { fontSize: 14, textAlign: 'right', marginBottom: 8 },
  attemptsText: { fontSize: 14, opacity: 0.7 },
  startButton: {
    paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 24,
  },
  startButtonText: { color: '#000', fontSize: 20, fontWeight: 'bold' },
  sectionTitle: {
    fontSize: 14, fontWeight: 'bold', textAlign: 'center',
    marginBottom: 8, opacity: 0.7,
  },
  streakText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  weekRow: {
    flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20,
  },
  dayCol: { alignItems: 'center' },
  dayName: { fontSize: 14, marginBottom: 4 },
  dayStatus: { fontSize: 18 },
  past7Row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  past7Col: { alignItems: 'center', flex: 1 },
  past7Day: { fontSize: 10, marginBottom: 4 },
  past7Result: { fontSize: 11, fontWeight: 'bold' },
  completedBanner: { backgroundColor: 'rgba(0,255,170,0.15)', borderRadius: 12, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(0,255,170,0.4)', marginTop: 12 },
  completedTitle: { color: '#00FFAA', fontSize: 20, fontWeight: 'bold' },
  completedScore: { color: '#FFFFFF', fontSize: 16 },
  shareBtn: { backgroundColor: '#00FFAA', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  shareBtnText: { color: '#000000', fontWeight: 'bold', fontSize: 14 },
});

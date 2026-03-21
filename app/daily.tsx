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
    const text = `数字サバイバル デイリー達成🏆 スコア: ${(challenge.bestScore ?? 0).toLocaleString()} ${streak}日連続🔥 #数字サバイバル`;
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
          📅 {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
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
              {progress.toFixed(1)}% {challenge.completed ? '✅ クリア!' : ''}
            </Text>

            <Text style={[styles.attemptsText, { color: colors.cellTextColor }]}>
              挑戦回数: {challenge.attempts}
            </Text>

            {challenge.completed ? (
              <View style={styles.completedBanner}>
                <Text style={styles.completedTitle}>🎉 本日のチャレンジ達成！</Text>
                <Text style={styles.completedScore}>スコア: {challenge.bestScore?.toLocaleString()}</Text>
                <TouchableOpacity style={styles.shareBtn} onPress={handleDailyShare}>
                  <Text style={styles.shareBtnText}>📸 達成をシェア🔥</Text>
                </TouchableOpacity>
              </View>
            ) : challenge.bestScore > 0 ? (
              <View style={[styles.completedBanner, { borderColor: 'rgba(0,255,170,0.2)', backgroundColor: 'rgba(0,255,170,0.05)' }]}>
                <Text style={[styles.completedTitle, { color: colors.accentColor, fontSize: 16 }]}>
                  挑戦中 — ベスト: {challenge.bestScore.toLocaleString()}
                </Text>
                <TouchableOpacity style={[styles.shareBtn, { backgroundColor: colors.accentColor + '99' }]} onPress={handleDailyShare}>
                  <Text style={styles.shareBtnText}>📤 途中経過をシェア</Text>
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
          ── 連続達成 ──
        </Text>
        <Text style={[styles.streakText, { color: colors.accentColor }]}>
          🔥 {streak}日連続
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.cellTextColor }]}>
          ── 過去14日間 ──
        </Text>
        <View style={styles.weekRow}>
          {allChallenges.slice(-14).map(dateStr => {
            const status = calendarStatuses[dateStr];
            const emoji = status === "today" ? "📍" : status === "cleared" ? "✅" : status === "failed" ? "🔴" : "⬜";
            return (
              <Text key={dateStr} style={styles.dayStatus}>{emoji}</Text>
            );
          })}
        </View>
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
  completedBanner: { backgroundColor: 'rgba(0,255,170,0.15)', borderRadius: 12, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: 'rgba(0,255,170,0.4)', marginTop: 12 },
  completedTitle: { color: '#00FFAA', fontSize: 20, fontWeight: 'bold' },
  completedScore: { color: '#FFFFFF', fontSize: 16 },
  shareBtn: { backgroundColor: '#00FFAA', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
  shareBtnText: { color: '#000000', fontWeight: 'bold', fontSize: 14 },
});

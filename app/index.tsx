import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useStorage } from '../hooks/useStorage';
import { STORAGE_KEYS } from '../constants/storage';
import { formatNumber } from '../utils/formatNumber';
import { AdBanner } from '../components/AdBanner';
import { IconSVG } from '../components/IconButtonSVG';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TitleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const storage = useStorage();
  const [bestScore, setBestScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [topScores, setTopScores] = useState<Array<{ score: number }>>([]);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const best = await storage.getNumber(STORAGE_KEYS.BEST_SCORE, 0);
      setBestScore(best);
      const c = await storage.getNumber(STORAGE_KEYS.COINS, 0);
      setCoins(c);
      const rankData = await storage.getItem<Array<{ score: number; date: string }>>(STORAGE_KEYS.RANKING_ALL, []);
      setTopScores(rankData.slice(0, 3));
    })();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.titleJP, { color: colors.accentColor }]}>数字サバイバル</Text>
          <Text style={[styles.titleEN, { color: colors.cellTextColor }]}>NUMBER SURVIVOR</Text>
          <Text style={[styles.ruleHint, { color: colors.cellTextColor }]}>
            隣接セルをスワイプして合計10を作ろう！
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Text style={{
              color: '#FF4500', fontSize: 11, fontWeight: 'bold',
              backgroundColor: 'rgba(255,69,0,0.15)',
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
            }}>60秒モード</Text>
            <Text style={{
              color: '#00FFAA', fontSize: 11, fontWeight: 'bold',
              backgroundColor: 'rgba(0,255,170,0.15)',
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
            }}>デイリー</Text>
            <Text style={{
              color: '#FFD700', fontSize: 11, fontWeight: 'bold',
              backgroundColor: 'rgba(255,215,0,0.15)',
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
            }}>8段カスケード</Text>
          </View>
        </View>

        {/* Decorative numbers */}
        <View style={styles.decoContainer}>
          {[1, 3, 7, 2, 5, 9, 4, 8, 6].map((n, i) => (
            <Text
              key={i}
              style={[
                styles.decoNumber,
                {
                  color: colors.cellColors[n as 1|2|3|4|5|6|7|8|9],
                  left: (i % 3) * (SCREEN_WIDTH / 3) + 20,
                  top: Math.floor(i / 3) * 40,
                  opacity: 0.2,
                },
              ]}
            >
              {n}
            </Text>
          ))}
        </View>

        {/* Main buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: colors.accentColor }]}
            onPress={() => router.push('/game')}
          >
            <Text style={styles.mainButtonText}>▶ スタート</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainButton, { backgroundColor: '#FF4500', marginTop: 12 }]}
            onPress={() => router.push('/game?mode=timeattack' as any)}
          >
            <Text style={styles.mainButtonText}>タイムアタック 60秒</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.accentColor }]}
            onPress={() => router.push('/daily')}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.accentColor }]}>
              デイリー
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.accentColor }]}
            onPress={() => router.push('/ranking')}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.accentColor }]}>
              ランキング
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.1)', marginTop: 8 }]}
            activeOpacity={0.7}
            onPress={async () => {
              const text = `【数字サバイバル】合計10を目指してスワイプするパズルゲーム！\nあなたのスコアは？チェーンでコンボを狙え🔥\nhttps://suuji-survival.vercel.app #数字サバイバル`;
              if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({ text });
              }
            }}
          >
            <Text style={[styles.secondaryButtonText, { color: '#FF6B35' }]}>
              友達に挑戦する
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom icons */}
        <View style={styles.iconRow}>
          <TouchableOpacity style={[styles.iconButton, { opacity: 0.55 }]} onPress={() => router.push('/shop')}>
            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
              <IconSVG type="shop" size={28} color={colors.accentColor} />
            </Animated.View>
            <Text style={[styles.iconLabel, { color: colors.cellTextColor }]}>ショップ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')}>
            <IconSVG type="settings" size={28} color={colors.cellTextColor} />
            <Text style={[styles.iconLabel, { color: colors.cellTextColor }]}>設定</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/achievements')}>
            <IconSVG type="achievements" size={28} color={colors.cellTextColor} />
            <Text style={[styles.iconLabel, { color: colors.cellTextColor }]}>実績</Text>
          </TouchableOpacity>
        </View>

        {/* MY TOP 3 */}
        {topScores.length > 0 && (
          <View style={styles.topScoresRow}>
            {topScores.map((entry, i) => {
              const medals = ['1位', '2位', '3位'];
              return (
                <View key={i} style={styles.topScoreItem}>
                  <Text style={[styles.topScoreMedal]}>{medals[i]}</Text>
                  <Text style={[styles.topScoreValue, { color: colors.cellTextColor }]}>
                    {formatNumber(entry.score)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Best score and coins */}
        <View style={styles.infoRow}>
          <Text style={[styles.bestScore, { color: colors.cellTextColor }]}>
            BEST: {formatNumber(bestScore)}
          </Text>
          <Text style={[styles.coinText, { color: '#FFD700' }]}>
            COIN {formatNumber(coins)}
          </Text>
        </View>
        <AdBanner />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  titleJP: {
    fontSize: 36,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  titleEN: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 6,
    marginTop: 4,
    opacity: 0.7,
  },
  decoContainer: {
    height: 120,
    position: 'relative',
    marginBottom: 20,
  },
  decoNumber: {
    position: 'absolute',
    fontSize: 48,
    fontWeight: 'bold',
  },
  buttons: {
    gap: 12,
    marginBottom: 32,
  },
  mainButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  mainButtonText: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 24,
  },
  iconButton: {
    alignItems: 'center',
  },
  iconEmoji: {
    fontSize: 28,
  },
  iconLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  topScoresRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  topScoreItem: {
    alignItems: 'center',
  },
  topScoreMedal: {
    fontSize: 20,
  },
  topScoreValue: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bestScore: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  coinText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  ruleHint: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 12,
    opacity: 0.85,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});

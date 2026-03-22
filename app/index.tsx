import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useStorage } from '../hooks/useStorage';
import { STORAGE_KEYS } from '../constants/storage';
import { formatNumber } from '../utils/formatNumber';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TitleScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const storage = useStorage();
  const [bestScore, setBestScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const best = await storage.getNumber(STORAGE_KEYS.BEST_SCORE, 0);
      setBestScore(best);
      const c = await storage.getNumber(STORAGE_KEYS.COINS, 0);
      setCoins(c);
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
            style={[styles.secondaryButton, { borderColor: colors.accentColor }]}
            onPress={() => router.push('/daily')}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.accentColor }]}>
              📅 デイリー
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.accentColor }]}
            onPress={() => router.push('/ranking')}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.accentColor }]}>
              🏆 ランキング
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
              🔥 友達に挑戦する
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom icons */}
        <View style={styles.iconRow}>
          <TouchableOpacity style={[styles.iconButton, { opacity: 0.55 }]} onPress={() => router.push('/shop')}>
            <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
              <Text style={styles.iconEmoji}>🎨</Text>
            </Animated.View>
            <Text style={[styles.iconLabel, { color: colors.cellTextColor }]}>ショップ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/settings')}>
            <Text style={styles.iconEmoji}>⚙️</Text>
            <Text style={[styles.iconLabel, { color: colors.cellTextColor }]}>設定</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/achievements')}>
            <Text style={styles.iconEmoji}>🏅</Text>
            <Text style={[styles.iconLabel, { color: colors.cellTextColor }]}>実績</Text>
          </TouchableOpacity>
        </View>

        {/* Best score and coins */}
        <View style={styles.infoRow}>
          <Text style={[styles.bestScore, { color: colors.cellTextColor }]}>
            BEST: {formatNumber(bestScore)}
          </Text>
          <Text style={[styles.coinText, { color: '#FFD700' }]}>
            💰 {formatNumber(coins)}
          </Text>
        </View>
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
});

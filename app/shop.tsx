import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useStorage } from '../hooks/useStorage';
import { STORAGE_KEYS } from '../constants/storage';
import { formatNumber } from '../utils/formatNumber';
import { ThemeId } from '../types';

export default function ShopScreen() {
  const router = useRouter();
  const { colors, themes, unlockedThemes, purchaseTheme, selectTheme, currentThemeId } = useTheme();
  const storage = useStorage();
  const [coins, setCoins] = useState(0);

  useEffect(() => {
    (async () => {
      const c = await storage.getNumber(STORAGE_KEYS.COINS, 0);
      setCoins(c);
    })();
  }, []);

  const handlePurchaseTheme = useCallback(async (id: ThemeId) => {
    const theme = themes.find(t => t.id === id);
    if (!theme) return;

    if (unlockedThemes.includes(id)) {
      await selectTheme(id);
      Alert.alert('テーマ変更', `${theme.name}に変更しました`);
      return;
    }

    if (coins < theme.price) {
      Alert.alert('コイン不足', `${theme.price}コインが必要です（現在: ${coins}コイン）`);
      return;
    }

    Alert.alert(
      'テーマ購入',
      `${theme.name}を${theme.price}コインで購入しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '購入',
          onPress: async () => {
            const success = await purchaseTheme(id);
            if (success) {
              setCoins(prev => prev - theme.price);
              await selectTheme(id);
              Alert.alert('購入完了', `${theme.name}を購入しました！`);
            }
          },
        },
      ]
    );
  }, [coins, themes, unlockedThemes, purchaseTheme, selectTheme]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.accentColor }]}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.cellTextColor }]}>ショップ</Text>
        <Text style={[styles.coins, { color: '#FFD700' }]}>💰 {formatNumber(coins)}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={[styles.sectionTitle, { color: colors.cellTextColor }]}>── テーマスキン ──</Text>

        <View style={styles.themesGrid}>
          {themes.map(theme => {
            const isUnlocked = unlockedThemes.includes(theme.id);
            const isCurrent = currentThemeId === theme.id;
            return (
              <TouchableOpacity
                key={theme.id}
                style={[
                  styles.themeCard,
                  { backgroundColor: theme.colors.gridBackground, borderColor: isCurrent ? colors.accentColor : 'transparent' },
                ]}
                onPress={() => handlePurchaseTheme(theme.id)}
              >
                <View style={styles.themePreview}>
                  {[1, 3, 5, 7].map(n => (
                    <View
                      key={n}
                      style={[styles.previewDot, { backgroundColor: theme.colors.cellColors[n as 1|3|5|7] }]}
                    />
                  ))}
                </View>
                <Text style={[styles.themeName, { color: theme.colors.cellTextColor }]}>{theme.name}</Text>
                <Text style={[styles.themePrice, { color: theme.colors.cellTextColor }]}>
                  {isCurrent ? '✅ 使用中' : isUnlocked ? '選択' : `${theme.price}💰`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.cellTextColor, marginTop: 24 }]}>
          ── プレミアム ──
        </Text>

        <TouchableOpacity
          style={[styles.premiumCard, styles.premiumDisabled, { backgroundColor: colors.gridBackground }]}
          activeOpacity={0.7}
          onPress={() => Alert.alert('準備中', 'ストアリリース後に購入できるようになります')}
        >
          <View>
            <Text style={[styles.premiumText, { color: colors.cellTextColor }]}>🚫 広告除去</Text>
            <Text style={styles.comingSoon}>ストアリリース後に有効になります</Text>
          </View>
          <Text style={[styles.premiumPrice, { color: colors.accentColor, opacity: 0.5 }]}>¥480</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.premiumCard, styles.premiumDisabled, { backgroundColor: colors.gridBackground }]}
          activeOpacity={0.7}
          onPress={() => Alert.alert('準備中', 'ストアリリース後に購入できるようになります')}
        >
          <View>
            <Text style={[styles.premiumText, { color: colors.cellTextColor }]}>🪙 500コイン</Text>
            <Text style={styles.comingSoon}>ストアリリース後に有効になります</Text>
          </View>
          <Text style={[styles.premiumPrice, { color: colors.accentColor, opacity: 0.5 }]}>¥160</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.premiumCard, styles.premiumDisabled, { backgroundColor: colors.gridBackground }]}
          activeOpacity={0.7}
          onPress={() => Alert.alert('準備中', 'ストアリリース後に購入できるようになります')}
        >
          <View>
            <Text style={[styles.premiumText, { color: colors.cellTextColor }]}>🪙 1500コイン</Text>
            <Text style={styles.comingSoon}>ストアリリース後に有効になります</Text>
          </View>
          <Text style={[styles.premiumPrice, { color: colors.accentColor, opacity: 0.5 }]}>¥400</Text>
        </TouchableOpacity>
      </ScrollView>
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
  title: { fontSize: 20, fontWeight: 'bold' },
  coins: { fontSize: 16, fontWeight: 'bold' },
  content: { flex: 1 },
  contentInner: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  themesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center',
  },
  themeCard: {
    width: '30%', padding: 12, borderRadius: 12, alignItems: 'center', borderWidth: 2,
  },
  themePreview: {
    flexDirection: 'row', gap: 4, marginBottom: 8,
  },
  previewDot: {
    width: 16, height: 16, borderRadius: 4,
  },
  themeName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  themePrice: { fontSize: 12, opacity: 0.8 },
  premiumCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 12, marginBottom: 8,
  },
  premiumText: { fontSize: 16, fontWeight: 'bold' },
  premiumPrice: { fontSize: 16, fontWeight: 'bold' },
  premiumDisabled: { opacity: 0.7 },
  comingSoon: { fontSize: 11, color: '#999', marginTop: 2 },
});

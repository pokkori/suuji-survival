import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useStorage } from '../hooks/useStorage';
import { STORAGE_KEYS } from '../constants/storage';
import { ACHIEVEMENTS } from '../constants/achievements';

export default function AchievementsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const storage = useStorage();
  const [unlockedMap, setUnlockedMap] = useState<Record<string, string | null>>({});

  useEffect(() => {
    (async () => {
      const data = await storage.getItem<Record<string, string | null>>(STORAGE_KEYS.ACHIEVEMENTS, {});
      setUnlockedMap(data);
    })();
  }, []);

  const unlockedCount = Object.values(unlockedMap).filter(Boolean).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.accentColor }]}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.cellTextColor }]}>実績</Text>
        <Text style={[styles.count, { color: colors.accentColor }]}>
          {unlockedCount}/{ACHIEVEMENTS.length}
        </Text>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {ACHIEVEMENTS.map(achievement => {
          const isUnlocked = !!unlockedMap[achievement.id];
          return (
            <View
              key={achievement.id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.gridBackground,
                  opacity: isUnlocked ? 1 : 0.6,
                },
              ]}
            >
              <Text style={styles.icon}>
                {isUnlocked ? achievement.icon : '🔒'}
              </Text>
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, { color: colors.cellTextColor }]}>
                  {isUnlocked ? '✅' : ''} {achievement.title}
                </Text>
                <Text style={[styles.cardDesc, { color: colors.cellTextColor }]}>
                  {achievement.description}
                </Text>
                <Text style={[styles.cardReward, { color: '#FFD700' }]}>
                  報酬: {achievement.reward.coins}💰
                  {isUnlocked ? ' 達成済み' : ''}
                </Text>
              </View>
            </View>
          );
        })}
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
  count: { fontSize: 16, fontWeight: 'bold' },
  list: { flex: 1, paddingHorizontal: 16 },
  listContent: { gap: 8, paddingBottom: 16 },
  card: {
    flexDirection: 'row', padding: 16, borderRadius: 12, alignItems: 'center',
  },
  icon: { fontSize: 32, marginRight: 12 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  cardDesc: { fontSize: 13, opacity: 0.7, marginBottom: 4 },
  cardReward: { fontSize: 12 },
});

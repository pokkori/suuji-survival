import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useStorage } from '../hooks/useStorage';
import { STORAGE_KEYS } from '../constants/storage';
import { RankingEntry } from '../types';
import { formatNumber } from '../utils/formatNumber';

type Tab = 'all' | 'weekly' | 'daily';

export default function RankingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const storage = useStorage();
  const [tab, setTab] = useState<Tab>('all');
  const [rankings, setRankings] = useState<Array<{ score: number; date: string; maxCombo: number }>>([]);

  useEffect(() => {
    (async () => {
      const data = await storage.getItem<Array<{ score: number; date: string; maxCombo: number }>>(
        STORAGE_KEYS.RANKING_ALL, []
      );
      setRankings(data);
    })();
  }, []);

  const filteredRankings = rankings.filter(entry => {
    if (tab === 'all') return true;
    const entryDate = new Date(entry.date);
    const now = new Date();
    if (tab === 'daily') {
      return entryDate.toDateString() === now.toDateString();
    }
    if (tab === 'weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return entryDate >= weekAgo;
    }
    return true;
  });

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.accentColor }]}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.cellTextColor }]}>ランキング</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.tabs}>
        {(['all', 'weekly', 'daily'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && { backgroundColor: colors.accentColor }]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, { color: tab === t ? '#000' : colors.cellTextColor }]}>
              {t === 'all' ? '全期間' : t === 'weekly' ? '今週' : '今日'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {filteredRankings.length === 0 && (
          <Text style={[styles.emptyText, { color: colors.cellTextColor }]}>
            まだ記録がありません
          </Text>
        )}
        {filteredRankings.map((entry, idx) => (
          <View key={idx} style={[styles.entry, { backgroundColor: colors.gridBackground }]}>
            <Text style={[styles.rank, { color: colors.accentColor }]}>
              {idx < 3 ? medals[idx] : `${idx + 1}.`}
            </Text>
            <View style={styles.entryInfo}>
              <Text style={[styles.entryScore, { color: colors.cellTextColor }]}>
                {formatNumber(entry.score)}
              </Text>
              <Text style={[styles.entryDate, { color: colors.cellTextColor }]}>
                x{entry.maxCombo} combo | {new Date(entry.date).toLocaleDateString('ja-JP')}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <Text style={[styles.note, { color: colors.cellTextColor }]}>
        ※ ローカルランキング（上位20件保持）
      </Text>
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
  tabs: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    paddingHorizontal: 16, marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#555',
  },
  tabText: { fontSize: 14, fontWeight: 'bold' },
  list: { flex: 1, paddingHorizontal: 16 },
  listContent: { gap: 8, paddingBottom: 16 },
  emptyText: { textAlign: 'center', fontSize: 16, marginTop: 40, opacity: 0.5 },
  entry: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 12,
  },
  rank: { fontSize: 24, fontWeight: 'bold', width: 50, textAlign: 'center' },
  entryInfo: { flex: 1, marginLeft: 8 },
  entryScore: { fontSize: 20, fontWeight: 'bold' },
  entryDate: { fontSize: 12, opacity: 0.6, marginTop: 2 },
  note: { textAlign: 'center', fontSize: 12, opacity: 0.5, paddingVertical: 8 },
});

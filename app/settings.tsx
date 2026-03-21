import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import { useStorage } from '../hooks/useStorage';
import { STORAGE_KEYS } from '../constants/storage';
import { UserSettings } from '../types';

const DEFAULT_SETTINGS: UserSettings = {
  bgmEnabled: true,
  seEnabled: true,
  hapticsEnabled: true,
  bgmVolume: 0.7,
  seVolume: 0.8,
};

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const storage = useStorage();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<UserSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
      setSettings(saved);
    })();
  }, []);

  const updateSetting = useCallback(async <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await storage.setItem(STORAGE_KEYS.SETTINGS, newSettings);
  }, [settings, storage]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'データリセット',
      '全てのゲームデータを削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            Alert.alert('完了', 'データをリセットしました');
          },
        },
      ]
    );
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.accentColor }]}>← 戻る</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.cellTextColor }]}>設定</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.cellTextColor }]}>── サウンド ──</Text>

        <View style={[styles.row, { backgroundColor: colors.gridBackground }]}>
          <Text style={[styles.rowLabel, { color: colors.cellTextColor }]}>BGM</Text>
          <Switch
            value={settings.bgmEnabled}
            onValueChange={(v) => updateSetting('bgmEnabled', v)}
            trackColor={{ true: colors.accentColor }}
          />
        </View>

        <View style={[styles.row, { backgroundColor: colors.gridBackground }]}>
          <Text style={[styles.rowLabel, { color: colors.cellTextColor }]}>効果音</Text>
          <Switch
            value={settings.seEnabled}
            onValueChange={(v) => updateSetting('seEnabled', v)}
            trackColor={{ true: colors.accentColor }}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.cellTextColor }]}>── 振動 ──</Text>

        <View style={[styles.row, { backgroundColor: colors.gridBackground }]}>
          <Text style={[styles.rowLabel, { color: colors.cellTextColor }]}>ハプティクス</Text>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={(v) => updateSetting('hapticsEnabled', v)}
            trackColor={{ true: colors.accentColor }}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.cellTextColor }]}>── データ ──</Text>

        <TouchableOpacity
          style={[styles.dangerButton, { backgroundColor: colors.gridBackground }]}
          onPress={handleReset}
        >
          <Text style={styles.dangerText}>データリセット</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: colors.cellTextColor }]}>── 情報 ──</Text>

        <View style={[styles.row, { backgroundColor: colors.gridBackground }]}>
          <Text style={[styles.rowLabel, { color: colors.cellTextColor }]}>バージョン</Text>
          <Text style={[styles.rowValue, { color: colors.cellTextColor }]}>1.0.0</Text>
        </View>
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
  content: { flex: 1, paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 14, fontWeight: 'bold', textAlign: 'center',
    marginTop: 20, marginBottom: 8, opacity: 0.7,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, borderRadius: 12, marginBottom: 8,
  },
  rowLabel: { fontSize: 16 },
  rowValue: { fontSize: 16, opacity: 0.7 },
  dangerButton: {
    padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 8,
  },
  dangerText: { color: '#FF4444', fontSize: 16, fontWeight: 'bold' },
});

import React from 'react';
import { Platform, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

export const AdBanner: React.FC = () => {
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.webBanner}
      onPress={() => Linking.openURL('https://suuji-survival.vercel.app')}
      activeOpacity={0.8}
    >
      <Text style={styles.webBannerText}>
        数字サバイバル — 友達に紹介してスコアを競おう！
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  webBanner: {
    backgroundColor: 'rgba(0,255,170,0.08)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,255,170,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  webBannerText: {
    color: 'rgba(0,255,170,0.75)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

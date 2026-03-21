import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemeColors } from '../types';

interface Props {
  colors: ThemeColors;
  onDismiss: () => void;
}

const STEPS = [
  {
    icon: '👆',
    title: '数字をスワイプして合計10を作ろう！',
    desc: '隣り合った数字をなぞって、合計が10になるように選ぼう',
  },
  {
    icon: '🔥',
    title: '連続で消すとコンボ！フィーバーを目指せ！',
    desc: 'コンボを繋げるとフィーバーゲージが溜まり、スコアが倍増！',
  },
  {
    icon: '💀',
    title: '上まで埋まったらゲームオーバー',
    desc: 'ブロックがどんどん下から湧いてくる。上端に達する前に消そう！',
  },
];

export const TutorialOverlay: React.FC<Props> = ({ colors, onDismiss }) => {
  return (
    <View style={styles.overlay}>
      <View style={[styles.card, { backgroundColor: colors.gridBackground }]}>
        <Text style={[styles.title, { color: colors.accentColor }]}>遊び方</Text>

        {STEPS.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={styles.stepIcon}>{step.icon}</Text>
            <View style={styles.stepText}>
              <Text style={[styles.stepTitle, { color: colors.cellTextColor }]}>
                {step.title}
              </Text>
              <Text style={[styles.stepDesc, { color: colors.cellTextColor }]}>
                {step.desc}
              </Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accentColor }]}
          onPress={onDismiss}
        >
          <Text style={styles.buttonText}>OK！始める</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 500,
  },
  card: {
    width: '88%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    width: '100%',
  },
  stepIcon: {
    fontSize: 32,
    marginRight: 12,
    width: 40,
    textAlign: 'center',
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

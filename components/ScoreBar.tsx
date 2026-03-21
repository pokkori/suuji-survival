import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemeColors, ComboState, FeverState } from '../types';
import { formatNumber } from '../utils/formatNumber';

interface Props {
  score: number;
  combo: ComboState;
  fever: FeverState;
  colors: ThemeColors;
  freezeMs: number;
}

export const ScoreBar: React.FC<Props> = ({ score, combo, fever, colors, freezeMs }) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Text style={[styles.scoreText, { color: colors.accentColor }]}>
          SCORE: {formatNumber(score)}
        </Text>
        {combo.count >= 2 && (
          <Text style={[styles.comboText, { color: colors.comboTextColor }]}>
            COMBO: x{combo.count}
          </Text>
        )}
      </View>
      <View style={styles.feverRow}>
        <View style={[styles.feverBarBg, { backgroundColor: colors.gridLine }]}>
          <View
            style={[
              styles.feverBarFill,
              {
                width: `${fever.gauge}%`,
                backgroundColor: fever.isActive ? '#FFD700' : colors.accentColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.feverText, { color: colors.cellTextColor }]}>
          {fever.isActive
            ? `FEVER! ${(fever.remainingMs / 1000).toFixed(1)}s`
            : `${Math.floor(fever.gauge)}%`}
        </Text>
      </View>
      {freezeMs > 0 && (
        <Text style={styles.freezeText}>
          ❄️ FREEZE: {(freezeMs / 1000).toFixed(1)}s
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  comboText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  feverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  feverBarBg: {
    flex: 1,
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 8,
  },
  feverBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  feverText: {
    fontSize: 12,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'right',
  },
  freezeText: {
    color: '#44CCFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
});

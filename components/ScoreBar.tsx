import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { ThemeColors, ComboState, FeverState } from '../types';
import { formatNumber } from '../utils/formatNumber';

interface Props {
  score: number;
  combo: ComboState;
  fever: FeverState;
  colors: ThemeColors;
  freezeMs: number;
  dangerLevel: number; // 0=safe, 1=warning, 2=critical
}

export const ScoreBar: React.FC<Props> = ({ score, combo, fever, colors, freezeMs, dangerLevel }) => {
  const dangerPulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (dangerLevel >= 2) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dangerPulseAnim, { toValue: 1, duration: 500, useNativeDriver: false }),
          Animated.timing(dangerPulseAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
        ])
      ).start();
    } else {
      dangerPulseAnim.setValue(0);
    }
  }, [dangerLevel]);

  return (
    <View style={styles.container}>
      {dangerLevel >= 2 && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: dangerPulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(255,34,68,0)', 'rgba(255,34,68,0.12)'],
            }),
            borderRadius: 0,
            zIndex: 0,
          }}
        />
      )}
      <View style={styles.topRow}>
        <Text style={[styles.scoreText, { color: colors.accentColor }]}>
          SCORE: {formatNumber(score)}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {fever.isActive && (
            <View style={{ backgroundColor: '#FFD700', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, borderWidth: 1, borderColor: '#FF8C00' }}>
              <Text style={{ color: '#1a1a1a', fontSize: 13, fontWeight: 'bold' }}>x3</Text>
            </View>
          )}
          {!fever.isActive && combo.count >= 10 && (
            <View style={{ backgroundColor: '#FF6B00', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>x3</Text>
            </View>
          )}
          {combo.count >= 5 && combo.count < 10 && (
            <View style={{ backgroundColor: '#CC8800', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: 'bold' }}>x2</Text>
            </View>
          )}
          {combo.count >= 2 && (
            <Text style={[styles.comboText, { color: colors.comboTextColor }]}>
              COMBO: {combo.count}
            </Text>
          )}
          {combo.count === 4 && (
            <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: 'bold' }}>あと1でx2!</Text>
          )}
          {combo.count === 9 && (
            <Text style={{ color: '#FF6B00', fontSize: 10, fontWeight: 'bold' }}>あと1でx3!</Text>
          )}
        </View>
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
          ICE FREEZE: {(freezeMs / 1000).toFixed(1)}s
        </Text>
      )}
      {dangerLevel >= 2 && (
        <Text style={styles.criticalText}>
          x あと少し！ブロックを消せ！
        </Text>
      )}
      {dangerLevel === 1 && (
        <Text style={styles.warningText}>
          LV DANGER — ブロックが迫っている！
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
  warningText: {
    color: '#FF8C00',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  criticalText: {
    color: '#FF2244',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
});

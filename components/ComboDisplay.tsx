import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getComboText, getComboColor } from '../engine/comboLogic';

interface Props {
  comboCount: number;
}

export const ComboDisplay: React.FC<Props> = ({ comboCount }) => {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState('');
  const [color, setColor] = useState('#FFD700');

  useEffect(() => {
    const comboText = getComboText(comboCount);
    if (comboText) {
      setText(comboText);
      setColor(getComboColor(comboCount));
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [comboCount]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={[styles.text, { color }]}>{text}</Text>
      <Text style={[styles.multiplier, { color }]}>x{comboCount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  text: {
    fontSize: 36,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  multiplier: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});

import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { getComboText, getComboColor } from '../engine/comboLogic';

interface Props {
  comboCount: number;
}

export const ComboDisplay: React.FC<Props> = ({ comboCount }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);
  const translateY = useSharedValue(0);

  const comboText = getComboText(comboCount);
  const color = getComboColor(comboCount);

  useEffect(() => {
    if (comboText) {
      // Reset
      opacity.value = 0;
      scale.value = 0.5;
      translateY.value = 0;

      // Animate in: scale up + fade in
      opacity.value = withSequence(
        withTiming(1, { duration: 150 }),
        withDelay(600, withTiming(0, { duration: 300 })),
      );
      scale.value = withSequence(
        withTiming(1.3, { duration: 200 }),
        withTiming(1.0, { duration: 150 }),
      );
      translateY.value = withSequence(
        withTiming(0, { duration: 200 }),
        withDelay(400, withTiming(-30, { duration: 400 })),
      );
    }
  }, [comboCount]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  if (!comboText) return null;

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <Animated.Text style={[styles.text, { color }]}>{comboText}</Animated.Text>
      <Animated.Text style={[styles.multiplier, { color }]}>x{comboCount}</Animated.Text>
    </Animated.View>
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

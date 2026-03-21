import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { CELL_SIZE } from '../constants/grid';

interface Props {
  /** Grid row of the center cell */
  row: number;
  /** Grid col of the center cell */
  col: number;
  /** Current combo count - affects ring max size */
  comboCount: number;
  /** Called when animation completes */
  onComplete: () => void;
}

export const ShockwaveEffect: React.FC<Props> = React.memo(({
  row,
  col,
  comboCount,
  onComplete,
}) => {
  const scale = useSharedValue(0.2);
  const opacity = useSharedValue(0.8);

  // Determine max scale based on combo count
  const maxScale = comboCount >= 10 ? 6 : comboCount >= 5 ? 4 : comboCount >= 3 ? 3 : 2;

  const centerX = col * CELL_SIZE + CELL_SIZE / 2;
  const centerY = row * CELL_SIZE + CELL_SIZE / 2;

  // Ring size (base diameter)
  const ringSize = 40;

  useEffect(() => {
    scale.value = withTiming(maxScale, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
    opacity.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });

    const timer = setTimeout(onComplete, 550);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: centerX - ringSize / 2 },
      { translateY: centerY - ringSize / 2 },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          borderWidth: 2.5,
          borderColor: 'rgba(255, 255, 255, 0.9)',
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
});

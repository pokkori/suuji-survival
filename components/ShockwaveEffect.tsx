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

const RingWave: React.FC<{
  centerX: number; centerY: number; maxScale: number;
  delay: number; color: string; ringSize: number;
}> = ({ centerX, centerY, maxScale, delay, color, ringSize }) => {
  const scale = useSharedValue(0.2);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withTiming(0.85, { duration: 60 });
      scale.value = withTiming(maxScale, { duration: 480, easing: Easing.out(Easing.cubic) });
      opacity.value = withTiming(0, { duration: 540, easing: Easing.out(Easing.cubic) });
    }, delay);
    return () => clearTimeout(t);
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
        { position: 'absolute', width: ringSize, height: ringSize, borderRadius: ringSize / 2, borderWidth: 2.5, borderColor: color },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
};

export const ShockwaveEffect: React.FC<Props> = React.memo(({
  row,
  col,
  comboCount,
  onComplete,
}) => {
  // Determine max scale based on combo count
  const maxScale = comboCount >= 10 ? 6 : comboCount >= 5 ? 4 : comboCount >= 3 ? 3 : 2;
  const ringCount = comboCount >= 5 ? 3 : comboCount >= 3 ? 2 : 1;

  const centerX = col * CELL_SIZE + CELL_SIZE / 2;
  const centerY = row * CELL_SIZE + CELL_SIZE / 2;
  const ringSize = 40;

  useEffect(() => {
    const timer = setTimeout(onComplete, 700);
    return () => clearTimeout(timer);
  }, []);

  const ringColors = ['rgba(255, 255, 255, 0.9)', 'rgba(255, 215, 0, 0.7)', 'rgba(255, 140, 0, 0.5)'];

  return (
    <>
      {Array.from({ length: ringCount }).map((_, i) => (
        <RingWave
          key={i}
          centerX={centerX}
          centerY={centerY}
          maxScale={maxScale * (1 - i * 0.15)}
          delay={i * 110}
          color={ringColors[i] ?? ringColors[0]}
          ringSize={ringSize}
        />
      ))}
    </>
  );
});

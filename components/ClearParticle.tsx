import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { CELL_SIZE } from '../constants/grid';

interface ParticleData {
  angle: number;
  distance: number;
  color: string;
  size: number;
}

interface Props {
  /** Grid position (row, col) where the clear happened */
  row: number;
  col: number;
  /** Number of particles (scales with combo) */
  count: number;
  /** Called when animation completes so parent can remove */
  onComplete: () => void;
}

const PARTICLE_COLORS = [
  '#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF',
  '#FF6BFF', '#6BFFF0', '#FFB86B', '#B76BFF',
];

function generateParticles(count: number): ParticleData[] {
  const particles: ParticleData[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = 30 + Math.random() * 40;
    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
    const size = 4 + Math.random() * 4;
    particles.push({ angle, distance, color, size });
  }
  return particles;
}

const SingleParticle: React.FC<{
  data: ParticleData;
  centerX: number;
  centerY: number;
}> = ({ data, centerX, centerY }) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
  }, []);

  const dx = Math.cos(data.angle) * data.distance;
  const dy = Math.sin(data.angle) * data.distance;

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: centerX + dx * progress.value },
      { translateY: centerY + dy * progress.value },
      { scale: 1 - progress.value * 0.5 },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: data.size,
          height: data.size,
          borderRadius: data.size / 2,
          backgroundColor: data.color,
        },
        style,
      ]}
    />
  );
};

export const ClearParticleEffect: React.FC<Props> = React.memo(({
  row,
  col,
  count,
  onComplete,
}) => {
  const particles = React.useMemo(() => generateParticles(count), [count]);

  // Center of the cell
  const centerX = col * CELL_SIZE + CELL_SIZE / 2;
  const centerY = row * CELL_SIZE + CELL_SIZE / 2;

  useEffect(() => {
    const timer = setTimeout(onComplete, 350);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <>
      {particles.map((p, i) => (
        <SingleParticle key={i} data={p} centerX={centerX} centerY={centerY} />
      ))}
    </>
  );
});

export const styles = StyleSheet.create({
  particleContainer: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    zIndex: 50,
  },
});

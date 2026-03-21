import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { ChainEvent } from '../types';

interface Props {
  chainEvent: ChainEvent | null;
}

function getChainColor(level: number): string {
  switch (level) {
    case 2: return '#FF8800'; // orange
    case 3: return '#FF2222'; // red
    case 4: return '#AA00FF'; // purple
    default: return level >= 5 ? '#FF00FF' : '#FF8800'; // rainbow-ish for 5+
  }
}

function getChainFontSize(level: number): number {
  switch (level) {
    case 2: return 32;
    case 3: return 40;
    default: return level >= 4 ? 48 : 32;
  }
}

export const ChainDisplay: React.FC<Props> = ({ chainEvent }) => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);
  const prevEventRef = useRef<ChainEvent | null>(null);

  useEffect(() => {
    if (!chainEvent || chainEvent === prevEventRef.current) return;
    if (chainEvent.level < 2) return; // Only show for 2+ chains
    prevEventRef.current = chainEvent;

    // Reset
    opacity.value = 0;
    scale.value = 0;

    // Bounce in: scale 0 -> 1.2 -> 1.0
    scale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withTiming(1.0, { duration: 100 }),
    );

    // Fade in then fade out after 300ms
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withDelay(300, withTiming(0, { duration: 300 })),
    );
  }, [chainEvent]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!chainEvent || chainEvent.level < 2) return null;

  const color = getChainColor(chainEvent.level);
  const fontSize = getChainFontSize(chainEvent.level);

  // For 5+ chains, apply a rainbow-like effect via multiple text shadow colors
  const textShadowColor = chainEvent.level >= 5 ? '#FFD700' : 'rgba(0,0,0,0.5)';

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <Animated.Text style={[styles.chainText, { color, fontSize, textShadowColor }]}>
        {chainEvent.level}連鎖{'!'.repeat(Math.min(chainEvent.level, 5))}
      </Animated.Text>
      <Animated.Text style={[styles.scoreText, { color }]}>
        +{chainEvent.score}
      </Animated.Text>
      {chainEvent.totalScore > chainEvent.score && (
        <Animated.Text style={[styles.totalText, { color }]}>
          TOTAL: +{chainEvent.totalScore}
        </Animated.Text>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 150,
  },
  chainText: {
    fontWeight: 'bold',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 6,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  totalText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});

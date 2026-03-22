import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, {
  Rect,
  Circle,
  Line,
  Path,
} from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';

// -------------------------------------------------------
// LED カラー定義（コンボ段階ごと）
// -------------------------------------------------------
const LED_IDLE   = '#6B7280'; // コンボ0
const LED_GREEN  = '#00FF88'; // コンボ3+
const LED_ORANGE = '#FF6B35'; // コンボ8+
const LED_RED    = '#FF2020'; // コンボ12+

function getLedColor(combo: number): string {
  if (combo >= 12) return LED_RED;
  if (combo >= 8)  return LED_ORANGE;
  if (combo >= 3)  return LED_GREEN;
  return LED_IDLE;
}

// -------------------------------------------------------
// コンボ段階を 0〜3 の数値にマップ（補間用）
// -------------------------------------------------------
function comboStage(combo: number): number {
  if (combo >= 12) return 3;
  if (combo >= 8)  return 2;
  if (combo >= 3)  return 1;
  return 0;
}

// -------------------------------------------------------
// Props
// -------------------------------------------------------
interface DigiTronProps {
  combo: number;
}

// -------------------------------------------------------
// DigiTron コンポーネント
// 48×48px ロボット顔 SVG
// LED 色だけ Reanimated Animated.View で補間し
// 残りは React 側 state で切り替え
// -------------------------------------------------------
export const DigiTron: React.FC<DigiTronProps> = ({ combo }) => {
  // LED 色アニメーション用 sharedValue（0〜3 ステージ）
  const ledStage = useSharedValue(comboStage(combo));
  // 口の笑顔度：0=直線, 1=最大弧（combo 12+）
  const smileProgress = useSharedValue(combo >= 12 ? 1 : combo >= 3 ? 0.5 : 0);

  useEffect(() => {
    ledStage.value = withTiming(comboStage(combo), {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
    smileProgress.value = withTiming(
      combo >= 12 ? 1 : combo >= 8 ? 0.75 : combo >= 3 ? 0.4 : 0,
      { duration: 300, easing: Easing.out(Easing.quad) },
    );
  }, [combo]);

  // LED 色は Animated.View の borderColor / backgroundColor で表現
  const ledColorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      ledStage.value,
      [0, 1, 2, 3],
      [LED_IDLE, LED_GREEN, LED_ORANGE, LED_RED],
    );
    return { borderColor: color };
  });

  const antennaLedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      ledStage.value,
      [0, 1, 2, 3],
      [LED_IDLE, LED_GREEN, LED_ORANGE, LED_RED],
    );
    return { backgroundColor: color };
  });

  const eyeStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      ledStage.value,
      [0, 1, 2, 3],
      [LED_IDLE, LED_GREEN, LED_ORANGE, LED_RED],
    );
    return { backgroundColor: color, shadowColor: color };
  });

  // 笑顔アニメーション：Path d 属性を JS 側で更新（SVG は Reanimated 非対応なので
  // Animated.View の scaleY で口の "笑い度" を演出する代替）
  const mouthScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: 1 + smileProgress.value * 0.6 }],
  }));

  // コンボ 3+ で目が光るグロー効果（shadowRadius）
  const glowRadius = combo >= 3 ? 6 : 0;

  return (
    <View style={styles.wrapper}>
      {/* ---- ボディ外枠（角丸四角形）---- */}
      <Animated.View style={[styles.faceFrame, ledColorStyle]}>
        {/* アンテナ */}
        <View style={styles.antennaContainer}>
          <View style={styles.antennaStick} />
          <Animated.View style={[styles.antennaLed, antennaLedStyle]} />
        </View>

        {/* 顔 SVG 内部パーツ */}
        <View style={styles.faceInner}>
          {/* 目 × 2 */}
          <View style={styles.eyeRow}>
            <Animated.View
              style={[
                styles.eye,
                eyeStyle,
                { shadowRadius: glowRadius, elevation: combo >= 3 ? 4 : 0 },
              ]}
            />
            <Animated.View
              style={[
                styles.eye,
                eyeStyle,
                { shadowRadius: glowRadius, elevation: combo >= 3 ? 4 : 0 },
              ]}
            />
          </View>

          {/* 口（水平バーをアニメーションで弧っぽく演出） */}
          <View style={styles.mouthContainer}>
            <Animated.View style={[styles.mouthBase, mouthScaleStyle, ledColorStyle]} />
          </View>
        </View>
      </Animated.View>

      {/* ---- コンボ段階ラベル（小文字）---- */}
    </View>
  );
};

const FACE_SIZE = 44;
const EYE_SIZE = 8;
const ANTENNA_WIDTH = 3;
const ANTENNA_HEIGHT = 8;
const ANTENNA_LED_SIZE = 6;

const styles = StyleSheet.create({
  wrapper: {
    width: 48,
    height: 60,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  antennaContainer: {
    position: 'absolute',
    top: -ANTENNA_HEIGHT - ANTENNA_LED_SIZE / 2,
    left: FACE_SIZE / 2 - ANTENNA_WIDTH / 2,
    alignItems: 'center',
  },
  antennaStick: {
    width: ANTENNA_WIDTH,
    height: ANTENNA_HEIGHT,
    backgroundColor: '#9CA3AF',
    borderRadius: 1,
  },
  antennaLed: {
    width: ANTENNA_LED_SIZE,
    height: ANTENNA_LED_SIZE,
    borderRadius: ANTENNA_LED_SIZE / 2,
    marginTop: -1,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
  },
  faceFrame: {
    width: FACE_SIZE,
    height: FACE_SIZE,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  faceInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  eyeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 6,
  },
  eye: {
    width: EYE_SIZE,
    height: EYE_SIZE,
    borderRadius: EYE_SIZE / 2,
    shadowOpacity: 0.9,
    shadowOffset: { width: 0, height: 0 },
  },
  mouthContainer: {
    width: '72%',
    height: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mouthBase: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    borderWidth: 0,
    // borderColor は ledColorStyle から
    backgroundColor: 'transparent',
    borderBottomWidth: 3,
  },
});

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { ThemeColors } from '../types';

interface Props {
  colors: ThemeColors;
  onDismiss: () => void;
}

const TUTORIAL_PAGES = [
  {
    title: '基本操作',
    steps: [
      {
        icon: 'TAP',
        title: '数字をスワイプして合計10を作ろう！',
        desc: '隣り合った数字をなぞって、合計が10になるように選ぼう',
      },
      {
        icon: 'COMBO',
        title: '連続で消すとコンボ！フィーバーを目指せ！',
        desc: 'コンボを繋げるとフィーバーゲージが溜まり、スコアが倍増！',
      },
      {
        icon: 'OVER',
        title: '上まで埋まったらゲームオーバー',
        desc: 'ブロックがどんどん下から湧いてくる。上端に達する前に消そう！',
      },
    ],
  },
  {
    title: 'スペシャルブロック',
    steps: [
      {
        icon: 'WILD',
        title: 'ワイルド：行を丸ごと消去！',
        desc: 'ワイルドブロックをスワイプに含めると、その行全体を一気に消せる！',
      },
      {
        icon: 'BOM',
        title: 'ボム：周囲を爆破！',
        desc: 'ボムブロックを含めると、周囲8マスのブロックをまとめて消去！',
      },
      {
        icon: '×2',
        title: 'ダブル：スコア2倍！',
        desc: 'ダブルブロックを含めると、そのクリアで得るスコアが2倍になる！',
      },
    ],
  },
  {
    title: 'ゲームモード',
    steps: [
      {
        icon: 'TIME',
        title: 'タイムアタック：60秒で高スコアを狙え！',
        desc: '制限時間60秒以内にできるだけ多くのブロックを消して高スコアを目指そう！',
      },
      {
        icon: 'DAY',
        title: 'デイリーチャレンジ：毎日目標スコアを達成！',
        desc: '全プレイヤー共通の同じ配列で目標スコア達成を目指す。連続達成でストリーク更新！',
      },
      {
        icon: 'RANK',
        title: 'ランキング：自分の記録を確認しよう！',
        desc: '全期間・今週・今日の自分のベストスコアを記録。上位何%相当か確認できる！',
      },
    ],
  },
];

// Mini grid demo: 3x3 cells with values [3,4,3, 1,2,7, 5,6,2]
// The demo highlights cells 0,1,2 (3+4+3=10) in sequence then fades out
const DEMO_VALUES = [3, 4, 3, 1, 2, 7, 5, 6, 2];
const DEMO_PATH = [0, 1, 2]; // indices of cells that sum to 10

function AnimatedDemo({ colors }: { colors: ThemeColors }) {
  const [activeStep, setActiveStep] = useState(-1);
  const [cleared, setCleared] = useState(false);
  const labelOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let step = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const runDemo = () => {
      setCleared(false);
      labelOpacity.setValue(0);
      setActiveStep(-1);

      const highlightNext = () => {
        if (step < DEMO_PATH.length) {
          setActiveStep(DEMO_PATH[step]);
          step++;
          timeoutId = setTimeout(highlightNext, 500);
        } else {
          // All 3 cells highlighted - show cleared state + label
          setCleared(true);
          Animated.timing(labelOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
          timeoutId = setTimeout(() => {
            // Reset and loop
            step = 0;
            setActiveStep(-1);
            setCleared(false);
            labelOpacity.setValue(0);
            timeoutId = setTimeout(runDemo, 500);
          }, 1500);
        }
      };

      timeoutId = setTimeout(highlightNext, 400);
    };

    runDemo();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <View style={demoStyles.container}>
      <View style={demoStyles.grid}>
        {DEMO_VALUES.map((val, i) => {
          const isActive = DEMO_PATH.includes(i) && DEMO_PATH.indexOf(i) <= DEMO_PATH.indexOf(activeStep);
          const isCleared = cleared && DEMO_PATH.includes(i);
          return (
            <View
              key={i}
              style={[
                demoStyles.cell,
                isActive && !isCleared && { backgroundColor: colors.accentColor, borderColor: colors.accentColor },
                isCleared && { backgroundColor: 'transparent', borderColor: 'transparent' },
                !isActive && !isCleared && { backgroundColor: colors.gridBackground, borderColor: colors.accentColor + '55' },
              ]}
            >
              {!isCleared && (
                <Text style={[demoStyles.cellText, { color: isActive ? '#000' : colors.cellTextColor }]}>
                  {val}
                </Text>
              )}
            </View>
          );
        })}
      </View>
      <Animated.Text style={[demoStyles.label, { opacity: labelOpacity, color: colors.accentColor }]}>
        3+4+3=10 OK
      </Animated.Text>
    </View>
  );
}

export const TutorialOverlay: React.FC<Props> = ({ colors, onDismiss }) => {
  const [pageIndex, setPageIndex] = useState(0);
  const currentPage = TUTORIAL_PAGES[pageIndex];
  const isLastPage = pageIndex === TUTORIAL_PAGES.length - 1;

  return (
    <View style={styles.overlay}>
      <View style={[styles.card, { backgroundColor: colors.gridBackground }]}>
        <Text style={[styles.title, { color: colors.accentColor }]}>{currentPage.title}</Text>

        {pageIndex === 0 && <AnimatedDemo colors={colors} />}

        {currentPage.steps.map((step, i) => (
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

        {/* Page indicator */}
        <View style={styles.pageIndicator}>
          {TUTORIAL_PAGES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === pageIndex ? colors.accentColor : 'rgba(255,255,255,0.3)' },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.accentColor }]}
          onPress={isLastPage ? onDismiss : () => setPageIndex(pageIndex + 1)}
        >
          <Text style={styles.buttonText}>{isLastPage ? 'OK！始める' : '次へ →'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const demoStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 126,
    height: 126,
    gap: 3,
  },
  cell: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  label: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

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
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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

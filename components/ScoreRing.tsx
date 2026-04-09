import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ScoreRingProps {
  score: number; // 1.0 - 5.0
  size?: number;
  strokeWidth?: number;
  delay?: number;
}

export function ScoreRing({
  score,
  size = 180,
  strokeWidth = 10,
  delay = 300,
}: ScoreRingProps) {
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(score / 5, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [score, delay]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const scoreDisplay = score.toFixed(1);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        {/* Animated progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.teal}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {/* Center label */}
      <Animated.View
        entering={FadeIn.delay(delay + 600).duration(400)}
        style={styles.labelContainer}
      >
        <Animated.Text style={styles.scoreValue}>{scoreDisplay}</Animated.Text>
        <Animated.Text style={styles.scoreLabel}>SCORE</Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreValue: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize['3xl'],
    color: colors.teal,
  },
  scoreLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 2,
    marginTop: 2,
  },
});

import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../../theme/colors';

interface ProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
  style?: object;
}

export function ProgressBar({
  value,
  max,
  color = colors.teal,
  height = 4,
  style,
}: ProgressBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(pct, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [pct]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height }, style]}>
      <Animated.View
        style={[
          {
            height: '100%',
            borderRadius: height,
            backgroundColor: color,
          },
          fillStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
});

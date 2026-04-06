import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Line } from 'react-native-svg';
import { colors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

const MOODS = [
  { value: 0 as const, label: 'Rough' },
  { value: 1 as const, label: 'Meh' },
  { value: 2 as const, label: 'Okay' },
  { value: 3 as const, label: 'Good' },
  { value: 4 as const, label: 'Great' },
];

interface MoodFaceProps {
  mood: 0 | 1 | 2 | 3 | 4;
  size?: number;
  color: string;
}

function MoodFace({ mood, size = 28, color }: MoodFaceProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Circle cx={14} cy={14} r={12} stroke={color} strokeWidth={1.5} />
      {/* Eyes */}
      <Circle cx={10} cy={11} r={1.5} fill={color} />
      <Circle cx={18} cy={11} r={1.5} fill={color} />
      {/* Mouth varies by mood */}
      {mood === 0 && (
        <Path d="M9 20c1.5-2 4-3 5-3s3.5 1 5 3" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      )}
      {mood === 1 && (
        <Path d="M9 19c1.5-1 4-1.5 5-1.5s3.5.5 5 1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      )}
      {mood === 2 && (
        <Line x1={9} y1={18} x2={19} y2={18} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      )}
      {mood === 3 && (
        <Path d="M9 17c1.5 1.5 4 2.5 5 2.5s3.5-1 5-2.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      )}
      {mood === 4 && (
        <Path d="M9 16c1.5 2.5 4 4 5 4s3.5-1.5 5-4" stroke={color} strokeWidth={1.5} strokeLinecap="round" fill="none" />
      )}
    </Svg>
  );
}

interface MoodPickerProps {
  value: 0 | 1 | 2 | 3 | 4;
  onChange: (value: 0 | 1 | 2 | 3 | 4) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>MOOD</Text>
      <View style={styles.row}>
        {MOODS.map((mood) => {
          const selected = mood.value === value;
          const faceColor = selected ? colors.teal : colors.textDim;
          return (
            <Pressable
              key={mood.value}
              onPress={() => onChange(mood.value)}
              style={[styles.button, selected && styles.buttonSelected]}
            >
              <MoodFace mood={mood.value} color={faceColor} />
              <Text style={[styles.buttonLabel, selected && styles.labelSelected]}>
                {mood.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  buttonSelected: {
    backgroundColor: colors.tealGlow2,
    borderColor: colors.teal,
  },
  buttonLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
  },
  labelSelected: {
    color: colors.tealBright,
  },
});

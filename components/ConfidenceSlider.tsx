import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

const LEVELS = [
  { value: 1 as const, label: 'Lost' },
  { value: 2 as const, label: 'Shaky' },
  { value: 3 as const, label: 'Okay' },
  { value: 4 as const, label: 'Solid' },
  { value: 5 as const, label: 'Nailed it' },
];

interface ConfidenceSliderProps {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (value: 1 | 2 | 3 | 4 | 5) => void;
}

export function ConfidenceSlider({ value, onChange }: ConfidenceSliderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>CONFIDENCE</Text>
      <View style={styles.row}>
        {LEVELS.map((level) => {
          const selected = level.value === value;
          return (
            <Pressable
              key={level.value}
              onPress={() => onChange(level.value)}
              style={[styles.button, selected && styles.buttonSelected]}
            >
              <Text style={[styles.number, selected && styles.numberSelected]}>
                {level.value}
              </Text>
              <Text style={[styles.buttonLabel, selected && styles.labelSelected]}>
                {level.label}
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
    gap: 2,
  },
  buttonSelected: {
    backgroundColor: colors.tealGlow2,
    borderColor: colors.teal,
  },
  number: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize.lg,
    color: colors.textDim,
  },
  numberSelected: {
    color: colors.teal,
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

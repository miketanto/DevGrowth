import { ScrollView, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamily, fontSize, letterSpacing } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

export type FilterValue = 'all' | 'high-score' | string; // string = skill name

interface FilterChip {
  label: string;
  value: FilterValue;
}

interface JourneyFiltersProps {
  skillNames: string[];
  activeFilter: FilterValue;
  onFilterChange: (value: FilterValue) => void;
}

export function JourneyFilters({
  skillNames,
  activeFilter,
  onFilterChange,
}: JourneyFiltersProps) {
  const chips: FilterChip[] = [
    { label: 'All', value: 'all' },
    { label: 'High Score', value: 'high-score' },
    ...skillNames.map((name) => ({ label: name, value: name })),
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {chips.map((chip) => {
        const active = chip.value === activeFilter;
        return (
          <Pressable
            key={chip.value}
            onPress={() => onFilterChange(chip.value)}
            style={[styles.chip, active && styles.chipActive]}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.teal,
    backgroundColor: colors.tealGlow,
  },
  chipText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: fontSize.xs * letterSpacing.wide,
    textTransform: 'uppercase',
  },
  chipTextActive: {
    color: colors.teal,
  },
});

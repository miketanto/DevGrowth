import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Card } from './ui/Card';
import { FireIcon } from './icons';
import type { FireTier } from '../lib/streak';

interface StreakCardProps {
  currentStreak: number;
  fireTier: FireTier;
  /** 7-element array: true = entry logged that day, null = future day. Mon–Sun order. */
  weekDots: (boolean | null)[];
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const TIER_COLORS: Record<FireTier, string> = {
  none: colors.textDim,
  ember: colors.amber,
  flame: colors.amber,
  blaze: '#FF8C00',
  inferno: colors.rose,
};

export function StreakCard({ currentStreak, fireTier, weekDots }: StreakCardProps) {
  const tierColor = TIER_COLORS[fireTier];
  const glowColor = fireTier !== 'none' ? colors.amberGlow : undefined;

  return (
    <Card glow={glowColor}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={styles.streakInfo}>
          <FireIcon
            size={fireTier === 'none' ? 20 : fireTier === 'inferno' ? 28 : 24}
            color={tierColor}
          />
          <Text style={[styles.streakCount, { color: tierColor }]}>
            {currentStreak}
          </Text>
          <Text style={styles.streakLabel}>day streak</Text>
        </View>
        {fireTier !== 'none' && (
          <View style={[styles.tierBadge, { borderColor: tierColor }]}>
            <Text style={[styles.tierText, { color: tierColor }]}>
              {fireTier.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Week dots */}
      <View style={styles.weekRow}>
        {weekDots.map((filled, i) => (
          <View key={i} style={styles.dayColumn}>
            <View
              style={[
                styles.dot,
                filled === true && [styles.dotFilled, { backgroundColor: colors.teal }],
                filled === null && styles.dotFuture,
              ]}
            />
            <Text style={styles.dayLabel}>{DAY_LABELS[i]}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  streakCount: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize['3xl'],
  },
  streakLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 4,
  },
  tierBadge: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tierText: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  dotFilled: {
    backgroundColor: colors.teal,
  },
  dotFuture: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  dayLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
  },
});

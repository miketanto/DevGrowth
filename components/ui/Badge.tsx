import { Text, View, ViewStyle, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize, letterSpacing } from '../../theme/typography';
import { radius } from '../../theme/spacing';

type BadgeVariant = 'primary' | 'ai' | 'purple' | 'amber' | 'rose' | 'muted';

const variantColors: Record<BadgeVariant, string> = {
  primary: colors.teal,
  ai: colors.blue,
  purple: colors.purple,
  amber: colors.amber,
  rose: colors.rose,
  muted: colors.textMuted,
};

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  color?: string;
  style?: ViewStyle;
}

export function Badge({ text, variant = 'primary', color, style }: BadgeProps) {
  const badgeColor = color ?? variantColors[variant];

  return (
    <View style={[styles.badge, { backgroundColor: badgeColor + '18' }, style]}>
      <Text style={[styles.text, { color: badgeColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
  },
  text: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    fontWeight: '600',
    letterSpacing: fontSize.xs * letterSpacing.wide,
    textTransform: 'uppercase',
  },
});

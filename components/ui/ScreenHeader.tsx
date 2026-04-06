import { View, Text, Pressable, ViewStyle, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize, letterSpacing, lineHeight } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
  style?: ViewStyle;
}

export function ScreenHeader({
  title,
  subtitle,
  right,
  onBack,
  backLabel = 'Back',
  style,
}: ScreenHeaderProps) {
  return (
    <View style={style}>
      {onBack && (
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>{`← ${backLabel}`}</Text>
        </Pressable>
      )}
      <View style={styles.row}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.sm,
  },
  backText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm + 1,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.xs,
    paddingBottom: spacing.lg,
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '700',
    color: colors.text,
    letterSpacing: fontSize['2xl'] * letterSpacing.tight,
    lineHeight: fontSize['2xl'] * lineHeight.tight,
  },
  subtitle: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
});

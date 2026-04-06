import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize, letterSpacing } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { LogoIcon, ArrowUpIcon } from '../../components/icons';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing['4xl'] }]}>
      {/* Logo */}
      <View style={styles.logoWrap}>
        <View style={styles.logoBox}>
          <LogoIcon size={40} color={colors.teal} />
          <View style={styles.logoBadge}>
            <ArrowUpIcon size={10} color={colors.bg} />
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>DevGrowth</Text>
      <Text style={styles.tagline}>JOURNAL. REFLECT. GROW.</Text>

      {/* Description */}
      <Text style={styles.description}>
        A growth journal for your coding day. Log what you built, reflect with
        AI-guided prompts, and watch your skills level up.
      </Text>

      {/* CTA */}
      <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title="Start journaling →"
          onPress={() => router.push('/onboarding/how-it-works')}
          style={styles.ctaButton}
          textStyle={styles.ctaText}
        />
        <Text style={styles.trialNote}>
          14-day full access · no card required
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    marginBottom: spacing['2xl'],
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamily.sansBold,
    fontSize: 36,
    color: colors.text,
    letterSpacing: -1.4,
    lineHeight: 40,
    marginBottom: spacing.sm,
  },
  tagline: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing['4xl'],
  },
  description: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.lg,
    color: colors.textSoft,
    lineHeight: 26,
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing['4xl'],
  },
  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: spacing['3xl'],
    right: spacing['3xl'],
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  ctaText: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  trialNote: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: spacing.md,
  },
});

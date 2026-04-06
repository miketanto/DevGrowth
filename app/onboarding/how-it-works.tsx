import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import {
  PencilIcon,
  ChatIcon,
  ZapIcon,
  BookIcon,
} from '../../components/icons';

const STEPS = [
  {
    icon: PencilIcon,
    iconColor: colors.text,
    label: 'Log your day',
    desc: '2 min structured entry',
    labelColor: colors.text,
  },
  {
    icon: ChatIcon,
    iconColor: colors.blue,
    label: 'AI reviews your moves',
    desc: 'Contextual follow-up questions',
    labelColor: colors.blue,
  },
  {
    icon: ZapIcon,
    iconColor: colors.teal,
    label: 'Skills level up',
    desc: 'XP based on reflection depth',
    labelColor: colors.teal,
  },
  {
    icon: BookIcon,
    iconColor: colors.purple,
    label: 'Study recommendations',
    desc: 'Curated resources for your gaps',
    labelColor: colors.purple,
  },
];

export default function HowItWorksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.container, { paddingTop: insets.top + spacing.xl }]}
    >
      {/* Header */}
      <Text style={styles.label}>HOW IT WORKS</Text>
      <Text style={styles.title}>
        Your daily game review,{'\n'}
        <Text style={styles.titleAccent}>in 5 minutes</Text>
      </Text>

      {/* Steps */}
      <View style={styles.steps}>
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <View key={i} style={styles.stepRow}>
              <View style={styles.iconBox}>
                <Icon size={22} color={step.iconColor} />
              </View>
              <View style={styles.stepText}>
                <Text style={[styles.stepLabel, { color: step.labelColor }]}>
                  {step.label}
                </Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title="Next →"
          onPress={() => router.push('/onboarding/pick-skills')}
          style={styles.ctaButton}
          textStyle={styles.ctaText}
        />

        {/* Page dots */}
        <View style={styles.dots}>
          <View style={styles.dotInactive} />
          <View style={styles.dotActive} />
          <View style={styles.dotInactive} />
        </View>

        {/* Back */}
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing['3xl'],
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: 11,
    color: colors.teal,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.sansBold,
    fontSize: 28,
    color: colors.text,
    letterSpacing: -0.8,
    lineHeight: 34,
    marginBottom: spacing['4xl'],
  },
  titleAccent: {
    color: colors.teal,
  },
  steps: {
    gap: spacing.xl,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.lg,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    paddingTop: 2,
  },
  stepLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  stepDesc: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  bottom: {
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
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.xl,
  },
  dotInactive: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textDim,
  },
  dotActive: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.teal,
  },
  backText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: spacing.md,
  },
});

import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ScoreRing } from '../../components/ScoreRing';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { ReviewScore, SkillBranch } from '../../types';

const branchColors: Record<SkillBranch, string> = {
  languages: colors.teal,
  frameworks: colors.blue,
  devops: colors.amber,
  databases: colors.purple,
  architecture: colors.rose,
  soft_skills: colors.textSoft,
};

const dimensionLabels: { key: keyof ReviewScore; label: string }[] = [
  { key: 'depth', label: 'Depth' },
  { key: 'self_awareness', label: 'Self-Awareness' },
  { key: 'actionability', label: 'Actionability' },
];

export default function ScoreScreen() {
  const params = useLocalSearchParams<{ data: string }>();

  const data = params.data ? JSON.parse(params.data) : null;

  if (!data) {
    return (
      <View style={styles.screen}>
        <Text style={styles.errorText}>No score data available.</Text>
        <Button title="Go Back" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  const { scores, xp_breakdown, extracted_skills, summary } = data as {
    scores: ReviewScore;
    xp_breakdown: { base: number; followups: number; depth_bonus: number };
    extracted_skills: { name: string; branch: SkillBranch }[];
    summary: string;
  };

  const totalXP = xp_breakdown.base + xp_breakdown.followups + xp_breakdown.depth_bonus;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Animated.Text
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.header}
      >
        Reflection Score
      </Animated.Text>

      {/* Score Ring */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(400)}
        style={styles.ringContainer}
      >
        <ScoreRing score={scores.composite} />
      </Animated.View>

      {/* Dimension Breakdown */}
      <Animated.View entering={FadeInDown.delay(500).duration(400)}>
        <Text style={styles.sectionLabel}>DIMENSIONS</Text>
        <Card style={styles.dimensionCard}>
          {dimensionLabels.map(({ key, label }) => (
            <View key={key} style={styles.dimensionRow}>
              <Text style={styles.dimensionLabel}>{label}</Text>
              <View style={styles.dimensionScoreContainer}>
                <View style={styles.dimensionBar}>
                  <View
                    style={[
                      styles.dimensionFill,
                      { width: `${(scores[key] / 5) * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.dimensionValue}>{scores[key].toFixed(1)}</Text>
              </View>
            </View>
          ))}
        </Card>
      </Animated.View>

      {/* XP Breakdown */}
      <Animated.View entering={FadeInDown.delay(700).duration(400)}>
        <Text style={styles.sectionLabel}>XP EARNED</Text>
        <Card style={styles.xpCard}>
          <XPRow label="Base" value={xp_breakdown.base} />
          <XPRow label="Follow-ups" value={xp_breakdown.followups} />
          <XPRow label="Depth bonus" value={xp_breakdown.depth_bonus} />
          <View style={styles.xpDivider} />
          <XPRow label="Total" value={totalXP} highlight />
        </Card>
      </Animated.View>

      {/* Skill Badges */}
      {extracted_skills.length > 0 && (
        <Animated.View entering={FadeInDown.delay(900).duration(400)}>
          <Text style={styles.sectionLabel}>SKILLS DETECTED</Text>
          <View style={styles.badgeRow}>
            {extracted_skills.map((skill) => (
              <Badge
                key={skill.name}
                text={skill.name}
                color={branchColors[skill.branch]}
              />
            ))}
          </View>
        </Animated.View>
      )}

      {/* Summary */}
      {summary && (
        <Animated.View entering={FadeInDown.delay(1100).duration(400)}>
          <Text style={styles.sectionLabel}>AI SUMMARY</Text>
          <Card>
            <Text style={styles.summaryText}>{summary}</Text>
          </Card>
        </Animated.View>
      )}

      {/* Done Button */}
      <Animated.View
        entering={FadeInDown.delay(1300).duration(400)}
        style={styles.buttonContainer}
      >
        <Button
          title="Done"
          onPress={() => router.replace('/(tabs)')}
          style={styles.doneButton}
        />
      </Animated.View>
    </ScrollView>
  );
}

function XPRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <View style={styles.xpRow}>
      <Text style={[styles.xpLabel, highlight && styles.xpHighlight]}>{label}</Text>
      <Text style={[styles.xpValue, highlight && styles.xpHighlight]}>
        +{value} XP
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['4xl'],
    paddingBottom: spacing['4xl'],
  },
  header: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize['2xl'],
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  ringContainer: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  sectionLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  dimensionCard: {
    gap: spacing.md,
  },
  dimensionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dimensionLabel: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.md,
    color: colors.textSoft,
    flex: 1,
  },
  dimensionScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.5,
    gap: spacing.sm,
  },
  dimensionBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  dimensionFill: {
    height: '100%',
    backgroundColor: colors.teal,
    borderRadius: 3,
  },
  dimensionValue: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.teal,
    width: 32,
    textAlign: 'right',
  },
  xpCard: {
    gap: spacing.xs,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  xpLabel: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    color: colors.textSoft,
  },
  xpValue: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.md,
    color: colors.tealBright,
  },
  xpHighlight: {
    color: colors.teal,
    fontFamily: fontFamily.monoBold,
  },
  xpDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  summaryText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    color: colors.textSoft,
    lineHeight: fontSize.md * 1.6,
  },
  buttonContainer: {
    marginTop: spacing['3xl'],
  },
  doneButton: {
    width: '100%',
  },
  errorText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.lg,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing['4xl'],
  },
});

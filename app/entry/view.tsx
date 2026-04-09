import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScoreRing } from '../../components/ScoreRing';
import { useEntryStore } from '../../store/useEntryStore';
import { getEntry, getEntrySkills } from '../../lib/database';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { Entry, Skill, SkillBranch } from '../../types';

const MOOD_LABELS = ['Rough', 'Meh', 'Okay', 'Good', 'Flow'];
const CONFIDENCE_LABELS = ['1 — Lost', '2 — Shaky', '3 — Steady', '4 — Strong', '5 — Nailed it'];

const branchColors: Record<SkillBranch, string> = {
  languages: colors.teal,
  frameworks: colors.blue,
  devops: colors.amber,
  databases: colors.purple,
  architecture: colors.rose,
  soft_skills: colors.textSoft,
};

export default function EntryViewScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const router = useRouter();
  const db = useSQLiteContext();

  const [entry, setEntry] = useState<Entry | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    if (!entryId) return;
    (async () => {
      const e = await getEntry(db, entryId);
      setEntry(e);
      if (e) {
        const s = await getEntrySkills(db, entryId);
        setSkills(s);
      }
    })();
  }, [db, entryId]);

  if (!entry) return null;

  const hasReview = entry.review_score != null && entry.review_score.composite > 0;

  const handleStartReview = async () => {
    const { setActiveEntry } = useEntryStore.getState();
    await setActiveEntry(db, entry.id);
    router.push('/entry/review');
  };

  const handleEditEntry = () => {
    const { updateDraft } = useEntryStore.getState();
    updateDraft({
      date: entry.date,
      worked_on: entry.worked_on,
      hardest_problem: entry.hardest_problem,
      how_solved: entry.how_solved,
      confidence: entry.confidence,
      mood: entry.mood,
    });
    router.push({ pathname: '/entry/new', params: { editId: entry.id } });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Today's Entry"
        subtitle={entry.date}
        onBack={() => router.back()}
      />

      {/* Entry content */}
      <View style={styles.section}>
        <Text style={styles.label}>WHAT I WORKED ON</Text>
        <Card>
          <Text style={styles.bodyText}>{entry.worked_on}</Text>
        </Card>
      </View>

      {entry.hardest_problem && (
        <View style={styles.section}>
          <Text style={styles.label}>HARDEST PROBLEM</Text>
          <Card>
            <Text style={styles.bodyText}>{entry.hardest_problem}</Text>
          </Card>
        </View>
      )}

      {entry.how_solved && (
        <View style={styles.section}>
          <Text style={styles.label}>HOW I SOLVED IT</Text>
          <Card>
            <Text style={styles.bodyText}>{entry.how_solved}</Text>
          </Card>
        </View>
      )}

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>CONFIDENCE</Text>
          <Text style={styles.metaValue}>{CONFIDENCE_LABELS[entry.confidence - 1]}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>MOOD</Text>
          <Text style={styles.metaValue}>{MOOD_LABELS[entry.mood]}</Text>
        </View>
      </View>

      {/* Edit button (only before review) */}
      {!hasReview && (
        <View style={styles.section}>
          <Button
            title="Edit Entry"
            onPress={handleEditEntry}
            variant="secondary"
          />
        </View>
      )}

      {/* Review section */}
      {hasReview ? (
        <>
          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.label}>AI REVIEW</Text>

            <View style={styles.scoreRow}>
              <ScoreRing score={entry.review_score!.composite} size={100} strokeWidth={7} delay={0} />
              <View style={styles.scoreMeta}>
                <ScoreDim label="Depth" value={entry.review_score!.depth} />
                <ScoreDim label="Awareness" value={entry.review_score!.self_awareness} />
                <ScoreDim label="Actionability" value={entry.review_score!.actionability} />
              </View>
            </View>
          </View>

          {entry.ai_summary && (
            <View style={styles.section}>
              <Card>
                <Text style={styles.bodyText}>{entry.ai_summary}</Text>
              </Card>
            </View>
          )}

          {skills.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>SKILLS DETECTED</Text>
              <View style={styles.badgeRow}>
                {skills.map((s) => (
                  <Badge key={s.id} text={s.name} color={branchColors[s.branch]} />
                ))}
              </View>
            </View>
          )}

          {entry.xp_earned > 0 && (
            <View style={styles.section}>
              <Badge text={`+${entry.xp_earned} XP`} variant="primary" />
            </View>
          )}
        </>
      ) : (
        <>
          <View style={styles.divider} />
          <View style={styles.section}>
            <Card style={styles.reviewCta}>
              <Text style={styles.reviewCtaTitle}>Ready for AI review?</Text>
              <Text style={styles.reviewCtaBody}>
                Get personalized follow-up questions and a reflection score.
              </Text>
              <Button
                title="Start AI Review"
                onPress={handleStartReview}
                style={styles.reviewButton}
              />
            </Card>
          </View>
        </>
      )}
    </ScrollView>
  );
}

function ScoreDim({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.dimRow}>
      <Text style={styles.dimLabel}>{label}</Text>
      <Text style={styles.dimValue}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingTop: spacing['4xl'],
    paddingBottom: spacing['4xl'],
  },
  section: {
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  bodyText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    color: colors.textSoft,
    lineHeight: fontSize.md * 1.6,
  },
  metaRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  metaValue: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.teal,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
  },
  scoreMeta: {
    flex: 1,
    gap: spacing.sm,
  },
  dimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dimLabel: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  dimValue: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.teal,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  reviewCta: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
  },
  reviewCtaTitle: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.lg,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  reviewCtaBody: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  reviewButton: {
    paddingHorizontal: spacing['3xl'],
  },
});

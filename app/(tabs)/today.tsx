import { useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { StreakCard } from '../../components/StreakCard';
import { PlusIcon, ZapIcon, TrophyIcon, TargetIcon } from '../../components/icons';
import { useUserStore } from '../../store/useUserStore';
import { useEntryStore } from '../../store/useEntryStore';
import { useSkillStore } from '../../store/useSkillStore';

/** Get Monday-to-Sunday date strings for the week containing `today`. */
function getWeekDates(today: string): string[] {
  const [y, m, d] = today.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const dow = date.getUTCDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date.getTime() + mondayOffset * 86_400_000);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getTime() + i * 86_400_000);
    const yy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  });
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[date.getUTCDay()]}, ${months[date.getUTCMonth()]} ${d}`;
}

export default function TodayScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();

  const profile = useUserStore((s) => s.profile);
  const fireTier = useUserStore((s) => s.fireTier);
  const title = useUserStore((s) => s.title);
  const levelProgress = useUserStore((s) => s.levelProgress);
  const hydrateUser = useUserStore((s) => s.hydrate);

  const entries = useEntryStore((s) => s.entries);
  const hydrateEntries = useEntryStore((s) => s.hydrate);

  const skills = useSkillStore((s) => s.skills);
  const hydrateSkills = useSkillStore((s) => s.hydrate);

  useEffect(() => {
    hydrateUser(db);
    hydrateEntries(db);
    hydrateSkills(db);
  }, [db]);

  const today = new Date().toISOString().split('T')[0];
  const displayDate = formatDisplayDate(today);

  // Compute week dots
  const weekDots = useMemo(() => {
    const weekDates = getWeekDates(today);
    const entryDates = new Set(entries.map((e) => e.date));
    return weekDates.map((d) => {
      if (d > today) return null; // future
      return entryDates.has(d);
    });
  }, [entries, today]);

  // Check if user already logged today
  const loggedToday = useMemo(
    () => entries.some((e) => e.date === today),
    [entries, today],
  );

  // Yesterday's entry
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yd = d.toISOString().split('T')[0];
    return entries.find((e) => e.date === yd) ?? null;
  }, [entries]);

  const totalEntries = entries.length;
  const hasEntries = totalEntries > 0;

  // Today's entry (if exists)
  const todayEntry = useMemo(
    () => entries.find((e) => e.date === today) ?? null,
    [entries, today],
  );

  const handleLogToday = useCallback(async () => {
    if (loggedToday && todayEntry) {
      // Show results for existing entry
      if (todayEntry.review_score_composite) {
        // Review already completed — show score screen
        const data = JSON.stringify({
          scores: {
            depth: todayEntry.review_score_depth ?? 0,
            self_awareness: todayEntry.review_score_awareness ?? 0,
            actionability: todayEntry.review_score_actionability ?? 0,
            composite: todayEntry.review_score_composite ?? 0,
          },
          xp_breakdown: { base: 10, followups: 0, depth_bonus: 0 },
          extracted_skills: [],
          summary: todayEntry.ai_summary ?? '',
        });
        router.push({ pathname: '/entry/score', params: { data } });
      } else {
        // Entry exists but no review yet — set active and go to review
        const { setActiveEntry } = useEntryStore.getState();
        await setActiveEntry(db, todayEntry.id);
        router.push('/entry/review');
      }
    } else {
      router.push('/entry/new');
    }
  }, [router, loggedToday, todayEntry]);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenHeader
        title="Today"
        subtitle={displayDate}
        right={
          profile ? (
            <Badge text={`LV ${profile.overall_level}`} variant="purple" />
          ) : undefined
        }
      />

      {/* Streak Card */}
      <View style={styles.section}>
        <StreakCard
          currentStreak={profile?.current_streak ?? 0}
          fireTier={fireTier}
          weekDots={weekDots}
        />
      </View>

      {/* CTA */}
      <View style={styles.section}>
        <Button
          title={loggedToday ? 'Review Today\'s Entry' : 'Log Today'}
          onPress={handleLogToday}
          icon={<PlusIcon size={16} />}
          style={styles.ctaButton}
        />
      </View>

      {/* Stats */}
      {hasEntries ? (
        <View style={styles.statsRow}>
          <StatCard
            icon={<ZapIcon size={18} color={colors.teal} />}
            value={profile?.overall_xp?.toLocaleString() ?? '0'}
            label="Total XP"
          />
          <StatCard
            icon={<TrophyIcon size={18} color={colors.amber} />}
            value={String(totalEntries)}
            label="Entries"
          />
          <StatCard
            icon={<TargetIcon size={18} color={colors.blue} />}
            value={String(skills.length)}
            label="Skills"
          />
        </View>
      ) : (
        /* Empty state */
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No entries yet</Text>
          <Text style={styles.emptyBody}>
            Log your first dev session to start tracking your growth.
          </Text>
        </Card>
      )}

      {/* Yesterday's summary */}
      {yesterday?.ai_summary && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YESTERDAY</Text>
          <Card>
            <Text style={styles.summaryText} numberOfLines={4}>
              {yesterday.ai_summary}
            </Text>
            <View style={styles.summaryMeta}>
              <Badge
                text={`+${yesterday.xp_earned} XP`}
                variant="primary"
              />
            </View>
          </Card>
        </View>
      )}
    </ScrollView>
  );
}

// ─── Stat Card ───

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Card style={styles.statCard}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingBottom: spacing['4xl'],
  },
  section: {
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  ctaButton: {
    paddingVertical: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing['2xl'],
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  statValue: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize.xl,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  emptyCard: {
    marginHorizontal: spacing['2xl'],
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.lg,
    color: colors.textSoft,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: fontSize.md * 1.5,
  },
  summaryText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    color: colors.textSoft,
    lineHeight: fontSize.md * 1.5,
  },
  summaryMeta: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
});

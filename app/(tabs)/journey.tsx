import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize, letterSpacing } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { EntryCard } from '../../components/EntryCard';
import { JourneyFilters, type FilterValue } from '../../components/JourneyFilters';
import { useSkillStore } from '../../store/useSkillStore';
import type { Entry, Skill } from '../../types';
import { getRecentEntries, getEntrySkills } from '../../lib/database';
import { getSkillLevel } from '../../lib/gamification';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LevelUp {
  skillName: string;
  newLevel: number;
}

interface EntryWithSkills {
  entry: Entry;
  skills: Skill[];
  levelUps: LevelUp[];
}

interface WeekGroup {
  weekLabel: string;
  weekStart: string; // YYYY-MM-DD (Monday)
  dots: DotInfo[];
  entries: EntryWithSkills[];
}

interface MonthSection {
  monthKey: string; // "2026-04"
  monthLabel: string; // "April 2026"
  entryCount: number;
  totalXp: number;
  weeks: WeekGroup[];
}

type DotColor = 'green' | 'blue' | 'amber' | 'gray' | 'dashed';

interface DotInfo {
  date: string;
  color: DotColor;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getDotColor(entry: Entry | undefined): DotColor {
  if (!entry) return 'dashed';
  if (!entry.review_score) return 'gray';
  const c = entry.review_score.composite;
  if (c >= 4.0) return 'green';
  if (c >= 3.0) return 'blue';
  return 'amber';
}

const DOT_COLORS: Record<DotColor, string> = {
  green: colors.teal,
  blue: colors.blue,
  amber: colors.amber,
  gray: colors.textDim,
  dashed: colors.border,
};

function groupByMonthAndWeek(items: EntryWithSkills[]): MonthSection[] {
  if (items.length === 0) return [];

  // Build a map of date -> entries
  const byDate = new Map<string, EntryWithSkills[]>();
  for (const item of items) {
    const list = byDate.get(item.entry.date) ?? [];
    list.push(item);
    byDate.set(item.entry.date, list);
  }

  // Get date range
  const allDates = items.map((i) => i.entry.date).sort();
  const earliest = new Date(allDates[0] + 'T00:00:00');
  const latest = new Date(allDates[allDates.length - 1] + 'T00:00:00');

  // Walk from latest week back to earliest
  const months = new Map<string, MonthSection>();

  let weekMonday = getMonday(latest);
  const stopMonday = getMonday(earliest);

  while (weekMonday >= stopMonday) {
    const weekEntries: EntryWithSkills[] = [];
    const dots: DotInfo[] = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const d = new Date(weekMonday);
      d.setDate(d.getDate() + dayOffset);
      const key = formatDateKey(d);
      const dayEntries = byDate.get(key);

      if (dayEntries && dayEntries.length > 0) {
        dots.push({ date: key, color: getDotColor(dayEntries[0].entry) });
        weekEntries.push(...dayEntries);
      } else {
        // Only show missed days within the range of entries
        if (d >= earliest && d <= latest) {
          dots.push({ date: key, color: 'dashed' });
        }
      }
    }

    if (dots.length > 0) {
      // Determine which month this week belongs to (use Thursday rule — ISO week)
      const thursday = new Date(weekMonday);
      thursday.setDate(thursday.getDate() + 3);
      const monthKey = formatDateKey(thursday).slice(0, 7);
      const monthLabel = `${MONTH_NAMES[thursday.getMonth()]} ${thursday.getFullYear()}`;

      if (!months.has(monthKey)) {
        months.set(monthKey, {
          monthKey,
          monthLabel,
          entryCount: 0,
          totalXp: 0,
          weeks: [],
        });
      }

      const month = months.get(monthKey)!;
      const weekLabel = `${formatDateKey(weekMonday).slice(5)} — ${formatDateKey(
        new Date(weekMonday.getTime() + 6 * 86400000)
      ).slice(5)}`;

      month.weeks.push({
        weekLabel,
        weekStart: formatDateKey(weekMonday),
        dots,
        entries: weekEntries,
      });
      month.entryCount += weekEntries.length;
      month.totalXp += weekEntries.reduce((s, e) => s + e.entry.xp_earned, 0);
    }

    // Move to previous week
    weekMonday = new Date(weekMonday.getTime() - 7 * 86400000);
  }

  // Sort months newest first
  return Array.from(months.values()).sort((a, b) =>
    b.monthKey.localeCompare(a.monthKey)
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;

export default function JourneyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const db = useSQLiteContext();
  const skills = useSkillStore((s) => s.skills);

  const [allItems, setAllItems] = useState<EntryWithSkills[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(PAGE_SIZE);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterValue>('all');
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());

  // Load entries with skills
  const loadEntries = useCallback(
    async (limit: number) => {
      setLoading(true);
      try {
        const entries = await getRecentEntries(db, limit);
        const items: EntryWithSkills[] = await Promise.all(
          entries.map(async (entry) => {
            const entrySkills = await getEntrySkills(db, entry.id);

            // Detect level-ups: check if xp_awarded on this entry crossed a level boundary
            const levelUps: LevelUp[] = [];
            for (const skill of entrySkills) {
              const row = await db.getFirstAsync<{ xp_awarded: number }>(
                'SELECT xp_awarded FROM entry_skills WHERE entry_id = ? AND skill_id = ?',
                entry.id,
                skill.id
              );
              if (row && row.xp_awarded > 0) {
                const currentLevel = getSkillLevel(skill.total_xp);
                const prevLevel = getSkillLevel(skill.total_xp - row.xp_awarded);
                if (currentLevel > prevLevel) {
                  levelUps.push({ skillName: skill.name, newLevel: currentLevel });
                }
              }
            }

            return { entry, skills: entrySkills, levelUps };
          })
        );
        setAllItems(items);
        setHasMore(entries.length === limit);
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  useEffect(() => {
    loadEntries(PAGE_SIZE);
  }, [loadEntries]);

  // Auto-expand latest month and week on first load
  useEffect(() => {
    if (allItems.length > 0 && expandedMonths.size === 0) {
      const sections = groupByMonthAndWeek(allItems);
      if (sections.length > 0) {
        const latestMonth = sections[0];
        const newMonths = new Set([latestMonth.monthKey]);
        const newWeeks = new Set<string>();
        if (latestMonth.weeks.length > 0) {
          newWeeks.add(latestMonth.weeks[0].weekStart);
        }
        setExpandedMonths(newMonths);
        setExpandedWeeks(newWeeks);
      }
    }
  }, [allItems]);

  // Filter entries
  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return allItems;
    if (activeFilter === 'high-score') {
      return allItems.filter(
        (i) => i.entry.review_score && i.entry.review_score.composite >= 4.0
      );
    }
    // Skill filter
    return allItems.filter((i) =>
      i.skills.some((s) => s.name === activeFilter)
    );
  }, [allItems, activeFilter]);

  // Group into sections
  const sections = useMemo(() => groupByMonthAndWeek(filteredItems), [filteredItems]);

  // Skill names for filter chips
  const skillNames = useMemo(() => {
    const nameSet = new Set<string>();
    for (const item of allItems) {
      for (const s of item.skills) nameSet.add(s.name);
    }
    return Array.from(nameSet).sort();
  }, [allItems]);

  // Toggle handlers
  const toggleMonth = useCallback((key: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleWeek = useCallback((key: string) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // Load more for infinite scroll
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    const nextCount = loadedCount + PAGE_SIZE;
    setLoadedCount(nextCount);
    loadEntries(nextCount);
  }, [hasMore, loading, loadedCount, loadEntries]);

  // Build SectionList data: one section per month
  const sectionData = useMemo(
    () =>
      sections.map((month) => ({
        monthKey: month.monthKey,
        monthLabel: month.monthLabel,
        entryCount: month.entryCount,
        totalXp: month.totalXp,
        data: expandedMonths.has(month.monthKey) ? month.weeks : [],
      })),
    [sections, expandedMonths]
  );

  const renderMonthHeader = useCallback(
    ({ section }: { section: (typeof sectionData)[number] }) => {
      const expanded = expandedMonths.has(section.monthKey);
      return (
        <Pressable
          onPress={() => toggleMonth(section.monthKey)}
          style={styles.monthHeader}
        >
          <Text style={styles.monthChevron}>{expanded ? '▾' : '▸'}</Text>
          <Text style={styles.monthLabel}>{section.monthLabel}</Text>
          <Text style={styles.monthMeta}>
            {section.entryCount} entries · {section.totalXp} XP
          </Text>
        </Pressable>
      );
    },
    [expandedMonths, toggleMonth]
  );

  const renderWeekItem = useCallback(
    ({ item: week }: { item: WeekGroup }) => {
      const expanded = expandedWeeks.has(week.weekStart);
      return (
        <View style={styles.weekContainer}>
          {/* Week header with dots */}
          <Pressable
            onPress={() => toggleWeek(week.weekStart)}
            style={styles.weekHeader}
          >
            <Text style={styles.weekChevron}>{expanded ? '▾' : '▸'}</Text>
            <Text style={styles.weekLabel}>{week.weekLabel}</Text>
            <View style={styles.weekDots}>
              {week.dots.slice(0, 7).map((dot, i) => (
                <View
                  key={i}
                  style={[
                    styles.weekDot,
                    { backgroundColor: DOT_COLORS[dot.color] },
                    dot.color === 'dashed' && styles.weekDotDashed,
                  ]}
                />
              ))}
            </View>
          </Pressable>

          {/* Expanded entries with trail */}
          {expanded && (
            <View style={styles.entriesContainer}>
              {week.entries.map((item, idx) => (
                <View key={item.entry.id} style={styles.entryRow}>
                  {/* Trail line + dot */}
                  <View style={styles.trailColumn}>
                    <View
                      style={[
                        styles.trailDot,
                        {
                          backgroundColor:
                            DOT_COLORS[getDotColor(item.entry)],
                        },
                        item.levelUps.length > 0 && {
                          backgroundColor: colors.purple,
                          shadowColor: colors.purple,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.8,
                          shadowRadius: 6,
                          elevation: 6,
                        },
                      ]}
                    />
                    {idx < week.entries.length - 1 && (
                      <View style={styles.trailLine} />
                    )}
                  </View>

                  {/* Entry card + level-up marker */}
                  <View style={styles.entryCardWrapper}>
                    {item.levelUps.length > 0 && (
                      <View style={styles.levelUpMarker}>
                        {item.levelUps.map((lu) => (
                          <Text key={lu.skillName} style={styles.levelUpText}>
                            ▲ {lu.skillName} → Lv.{lu.newLevel}
                          </Text>
                        ))}
                      </View>
                    )}
                    <EntryCard
                      entry={item.entry}
                      skills={item.skills}
                      onPress={() =>
                        router.push(`/entry/view?id=${item.entry.id}`)
                      }
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      );
    },
    [expandedWeeks, toggleWeek, router]
  );

  const renderEmpty = useCallback(
    () =>
      !loading ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No entries yet</Text>
          <Text style={styles.emptySubtext}>
            Start journaling to see your growth trail
          </Text>
        </View>
      ) : null,
    [loading]
  );

  const renderFooter = useCallback(
    () =>
      loading ? (
        <ActivityIndicator
          color={colors.teal}
          style={styles.loader}
        />
      ) : null,
    [loading]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader title="Journey" subtitle="Your growth timeline" />

      <JourneyFilters
        skillNames={skillNames}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <SectionList
        sections={sectionData}
        keyExtractor={(item) => item.weekStart}
        renderSectionHeader={renderMonthHeader}
        renderItem={renderWeekItem}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  listContent: {
    paddingBottom: 100,
  },

  // Month header
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  monthChevron: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.textMuted,
    width: 16,
  },
  monthLabel: {
    fontFamily: fontFamily.monoMedium,
    fontSize: fontSize.md,
    color: colors.text,
    flex: 1,
  },
  monthMeta: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: fontSize.xs * letterSpacing.wide,
  },

  // Week
  weekContainer: {
    marginHorizontal: spacing['2xl'],
    marginTop: spacing.md,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  weekChevron: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    width: 14,
  },
  weekLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    color: colors.textSoft,
  },
  weekDots: {
    flexDirection: 'row',
    gap: 4,
    marginLeft: 'auto',
  },
  weekDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekDotDashed: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
    borderStyle: 'dashed',
  },

  // Entries trail
  entriesContainer: {
    marginTop: spacing.sm,
  },
  entryRow: {
    flexDirection: 'row',
  },
  trailColumn: {
    width: 24,
    alignItems: 'center',
  },
  trailDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: spacing.lg,
  },
  trailLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  entryCardWrapper: {
    flex: 1,
    marginBottom: spacing.sm,
  },

  // Level-up marker
  levelUpMarker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
    paddingLeft: spacing.xs,
  },
  levelUpText: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize.xs,
    color: colors.purple,
    backgroundColor: colors.purpleGlow,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontFamily: fontFamily.monoMedium,
    fontSize: fontSize.lg,
    color: colors.textSoft,
  },
  emptySubtext: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },

  // Loader
  loader: {
    paddingVertical: spacing['3xl'],
  },
});

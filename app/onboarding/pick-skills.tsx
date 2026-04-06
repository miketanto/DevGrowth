import { useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { Button } from '../../components/ui/Button';
import { useSkillStore } from '../../store/useSkillStore';
import type { SkillBranch } from '../../types';

interface SkillOption {
  name: string;
  branch: SkillBranch;
}

const SKILL_OPTIONS: { label: string; branch: SkillBranch; color: string; skills: string[] }[] = [
  {
    label: 'Languages',
    branch: 'languages',
    color: colors.blue,
    skills: ['JavaScript', 'TypeScript', 'Python', 'Go', 'Rust', 'Java', 'C#', 'Ruby', 'Swift', 'Kotlin'],
  },
  {
    label: 'Frameworks',
    branch: 'frameworks',
    color: colors.purple,
    skills: ['React', 'Next.js', 'Vue', 'Angular', 'Node.js', 'Django', 'Rails', 'Spring', 'Flutter', 'React Native'],
  },
  {
    label: 'DevOps',
    branch: 'devops',
    color: colors.teal,
    skills: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'CI/CD', 'Terraform', 'Linux', 'Git'],
  },
  {
    label: 'Databases',
    branch: 'databases',
    color: colors.amber,
    skills: ['SQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'DynamoDB'],
  },
  {
    label: 'Architecture',
    branch: 'architecture',
    color: colors.text,
    skills: ['System Design', 'APIs', 'Microservices', 'Testing', 'Performance'],
  },
  {
    label: 'Soft Skills',
    branch: 'soft_skills',
    color: colors.textSoft,
    skills: ['Code Review', 'Documentation', 'Mentoring', 'Communication'],
  },
];

export default function PickSkillsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const ensureSkill = useSkillStore((s) => s.ensureSkill);
  const [selected, setSelected] = useState<SkillOption[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = useCallback((name: string, branch: SkillBranch) => {
    setSelected((prev) => {
      const exists = prev.some((s) => s.name === name);
      if (exists) return prev.filter((s) => s.name !== name);
      return [...prev, { name, branch }];
    });
  }, []);

  const isSelected = useCallback(
    (name: string) => selected.some((s) => s.name === name),
    [selected]
  );

  const handleFinish = useCallback(async () => {
    if (selected.length === 0 || saving) return;
    setSaving(true);

    // Save each selected skill
    for (const skill of selected) {
      await ensureSkill(db, { name: skill.name, branch: skill.branch });
    }

    // Set onboarding_complete flag
    await db.runAsync(
      'UPDATE user_profile SET onboarding_complete = 1 WHERE id = 1'
    );

    // Navigate to main app
    router.replace('/(tabs)/today');
  }, [selected, saving, db, ensureSkill, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      {/* Header */}
      <Text style={styles.label}>PERSONALIZE</Text>
      <Text style={styles.title}>
        What are you{'\n'}
        <Text style={styles.titleAccent}>working with?</Text>
      </Text>
      <Text style={styles.subtitle}>
        Pick a few. We'll track these from day one.
      </Text>

      {/* Skill chips */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SKILL_OPTIONS.map((group) => (
          <View key={group.branch} style={styles.group}>
            <Text style={[styles.groupLabel, { color: group.color }]}>
              {group.label}
            </Text>
            <View style={styles.chips}>
              {group.skills.map((name) => {
                const active = isSelected(name);
                return (
                  <Pressable
                    key={name}
                    onPress={() => toggle(name, group.branch)}
                    style={[
                      styles.chip,
                      active && styles.chipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        active && styles.chipTextActive,
                      ]}
                    >
                      {name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          title={
            selected.length > 0
              ? `Let's go (${selected.length} skills) →`
              : 'Select at least one'
          }
          onPress={handleFinish}
          disabled={selected.length === 0 || saving}
          style={{
            ...styles.ctaButton,
            ...(selected.length === 0 ? styles.ctaDisabled : {}),
          }}
          textStyle={styles.ctaText}
        />

        {/* Page dots */}
        <View style={styles.dots}>
          <View style={styles.dotInactive} />
          <View style={styles.dotInactive} />
          <View style={styles.dotActive} />
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
    marginBottom: spacing.sm,
  },
  titleAccent: {
    color: colors.purple,
  },
  subtitle: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginBottom: spacing['2xl'],
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 200,
  },
  group: {
    marginBottom: spacing.xl,
  },
  groupLabel: {
    fontFamily: fontFamily.monoMedium,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: 9,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  chipText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.textSoft,
  },
  chipTextActive: {
    color: colors.bg,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: spacing['3xl'],
    right: spacing['3xl'],
    alignItems: 'center',
    backgroundColor: colors.bg,
    paddingTop: spacing.lg,
  },
  ctaButton: {
    width: '100%',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
  },
  ctaDisabled: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
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

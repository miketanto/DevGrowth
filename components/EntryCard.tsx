import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { fontFamily, fontSize, letterSpacing } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { Badge } from './ui/Badge';
import type { Entry, Skill } from '../types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function getScoreColor(composite: number): string {
  if (composite >= 4.0) return colors.teal;
  if (composite >= 3.0) return colors.blue;
  return colors.amber;
}

function getScoreLabel(composite: number): string {
  return composite.toFixed(1);
}

interface EntryCardProps {
  entry: Entry;
  skills: Skill[];
  onPress: () => void;
}

export function EntryCard({ entry, skills, onPress }: EntryCardProps) {
  const dateObj = new Date(entry.date + 'T00:00:00');
  const day = DAYS[dateObj.getDay()];
  const dateNum = dateObj.getDate();
  const score = entry.review_score?.composite ?? null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {/* Left: date block */}
      <View style={styles.dateBlock}>
        <Text style={styles.dateDay}>{day}</Text>
        <Text style={styles.dateNum}>{dateNum}</Text>
      </View>

      {/* Right: content */}
      <View style={styles.content}>
        <Text style={styles.workedOn} numberOfLines={2}>
          {entry.worked_on}
        </Text>

        {/* Meta row: score, XP, confidence */}
        <View style={styles.metaRow}>
          {score !== null ? (
            <Badge
              text={getScoreLabel(score)}
              color={getScoreColor(score)}
            />
          ) : (
            <Badge text="--" variant="muted" />
          )}

          {entry.xp_earned > 0 && (
            <Text style={styles.xpText}>+{entry.xp_earned} XP</Text>
          )}

          <View style={styles.confidenceDots}>
            {[1, 2, 3, 4, 5].map((level) => (
              <View
                key={level}
                style={[
                  styles.dot,
                  level <= entry.confidence
                    ? styles.dotFilled
                    : styles.dotEmpty,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Skill tags */}
        {skills.length > 0 && (
          <View style={styles.skillRow}>
            {skills.slice(0, 4).map((skill) => (
              <Text key={skill.id} style={styles.skillTag}>
                {skill.name}
              </Text>
            ))}
            {skills.length > 4 && (
              <Text style={styles.skillTag}>+{skills.length - 4}</Text>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardPressed: {
    backgroundColor: colors.surfaceHover,
  },
  dateBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
  },
  dateDay: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: fontSize.xs * letterSpacing.wide,
  },
  dateNum: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize.xl,
    color: colors.text,
    lineHeight: fontSize.xl * 1.3,
  },
  content: {
    flex: 1,
    gap: spacing.sm,
  },
  workedOn: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: fontSize.md * 1.4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  xpText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.teal,
    letterSpacing: fontSize.xs * letterSpacing.wide,
  },
  confidenceDots: {
    flexDirection: 'row',
    gap: 3,
    marginLeft: 'auto',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotFilled: {
    backgroundColor: colors.amber,
  },
  dotEmpty: {
    backgroundColor: colors.border,
  },
  skillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  skillTag: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs - 1,
    color: colors.purple,
    backgroundColor: colors.purpleGlow,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
});

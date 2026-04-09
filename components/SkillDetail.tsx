/**
 * SkillDetail — bottom panel showing skill stats and knowledge graph connections.
 * Slides up when a constellation node is tapped.
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import type { SkillNode, SkillEdge } from '../lib/skill-graph';
import { BRANCH_COLORS } from '../lib/skill-graph';
import { colors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  node: SkillNode;
  edges: SkillEdge[];
  allNodes: SkillNode[];
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Connection {
  id: string;
  name: string;
  branch: string;
  weight: number;
  /** 0–1 normalized strength */
  strength: number;
}

function getConnections(
  node: SkillNode,
  edges: SkillEdge[],
  allNodes: SkillNode[]
): Connection[] {
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const relevant = edges.filter(
    (e) => e.source === node.id || e.target === node.id
  );
  if (relevant.length === 0) return [];

  const maxWeight = Math.max(...relevant.map((e) => e.weight));

  return relevant
    .map((e) => {
      const otherId = e.source === node.id ? e.target : e.source;
      const other = nodeMap.get(otherId);
      if (!other) return null;
      return {
        id: other.id,
        name: other.name,
        branch: other.branch,
        weight: e.weight,
        strength: maxWeight > 0 ? e.weight / maxWeight : 0,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b!.weight - a!.weight) as Connection[];
}

function branchLabel(branch: string): string {
  return branch.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SkillDetail({ node, edges, allNodes, onClose }: Props) {
  const branchColor = BRANCH_COLORS[node.branch];
  const connections = useMemo(
    () => getConnections(node, edges, allNodes),
    [node, edges, allNodes]
  );

  // XP bar
  const xpPercent = Math.round(node.xpProgress * 100);

  return (
    <View style={styles.container}>
      {/* Handle bar */}
      <View style={styles.handleRow}>
        <View style={styles.handle} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name}>{node.name}</Text>
          <View style={[styles.branchBadge, { backgroundColor: branchColor + '20' }]}>
            <View style={[styles.branchDot, { backgroundColor: branchColor }]} />
            <Text style={[styles.branchText, { color: branchColor }]}>
              {branchLabel(node.branch)}
            </Text>
          </View>
        </View>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      {/* Level + XP bar */}
      <View style={styles.levelRow}>
        <Text style={styles.levelLabel}>LVL {node.level}</Text>
        <View style={styles.xpBarTrack}>
          <View
            style={[
              styles.xpBarFill,
              { width: `${xpPercent}%`, backgroundColor: branchColor },
            ]}
          />
        </View>
        <Text style={styles.xpText}>{xpPercent}%</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatItem label="ENTRIES" value={String(node.entryCount)} />
        <StatItem
          label="AVG SCORE"
          value={node.avgScore != null ? node.avgScore.toFixed(1) : '—'}
        />
        <StatItem label="TOTAL XP" value={String(node.totalXp)} />
      </View>

      {/* Connections */}
      {connections.length > 0 && (
        <View style={styles.connectionsSection}>
          <Text style={styles.sectionLabel}>KNOWLEDGE GRAPH</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {connections.map((conn) => {
              const connColor =
                BRANCH_COLORS[conn.branch as keyof typeof BRANCH_COLORS] ??
                colors.textDim;
              // Opacity based on strength: 0.4–1.0
              const chipOpacity = 0.4 + conn.strength * 0.6;
              return (
                <View
                  key={conn.id}
                  style={[
                    styles.chip,
                    { borderColor: connColor, opacity: chipOpacity },
                  ]}
                >
                  <View
                    style={[styles.chipDot, { backgroundColor: connColor }]}
                  />
                  <Text style={styles.chipName}>{conn.name}</Text>
                  <Text style={[styles.chipCount, { color: connColor }]}>
                    {conn.weight}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stat item
// ---------------------------------------------------------------------------

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  name: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.xl,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  branchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  branchDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  branchText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
  },
  closeText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.lg,
    color: colors.textMuted,
    paddingLeft: spacing.md,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  levelLabel: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize.sm,
    color: colors.textSoft,
    width: 44,
  },
  xpBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  xpText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    width: 32,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize.lg,
    color: colors.text,
  },
  statLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginTop: 2,
  },
  connectionsSection: {
    marginTop: spacing.xs,
  },
  sectionLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textDim,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  chipsContainer: {
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  chipDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  chipName: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.sm,
    color: colors.textSoft,
  },
  chipCount: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize.xs,
  },
});

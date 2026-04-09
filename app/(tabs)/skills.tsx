import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SkillConstellation } from '../../components/SkillConstellation';
import { SkillDetail } from '../../components/SkillDetail';
import { useSkillStore } from '../../store/useSkillStore';
import {
  buildGraphData,
  runForceSimulation,
  BRANCH_COLORS,
  type GraphData,
  type SkillNode,
} from '../../lib/skill-graph';

// ---------------------------------------------------------------------------
// View modes
// ---------------------------------------------------------------------------

type ViewMode = 'constellation' | 'list';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SkillsScreen() {
  const insets = useSafeAreaInsets();
  const db = useSQLiteContext();
  const { skills, hydrate, loading } = useSkillStore();

  const [viewMode, setViewMode] = useState<ViewMode>('constellation');
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [graphSize, setGraphSize] = useState({ width: 0, height: 0 });

  // Hydrate skills on mount
  useEffect(() => {
    hydrate(db);
  }, [db, hydrate]);

  // Build graph data when skills change
  useEffect(() => {
    if (skills.length === 0) {
      setGraphData(null);
      return;
    }
    let cancelled = false;
    buildGraphData(db, skills).then((data) => {
      if (!cancelled) setGraphData(data);
    });
    return () => {
      cancelled = true;
    };
  }, [db, skills]);

  // Run force simulation when graph data or size is available
  const simulatedNodes = useMemo(() => {
    if (!graphData || graphSize.width === 0 || graphSize.height === 0) {
      return null;
    }
    // Clone nodes so simulation doesn't mutate source
    const cloned: SkillNode[] = graphData.nodes.map((n) => ({ ...n }));
    runForceSimulation(cloned, graphData.edges, graphData.centralNodeId, {
      width: graphSize.width,
      height: graphSize.height,
    });
    return cloned;
  }, [graphData, graphSize.width, graphSize.height]);

  const selectedNode = useMemo(
    () => simulatedNodes?.find((n) => n.id === selectedNodeId) ?? null,
    [simulatedNodes, selectedNodeId]
  );

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setGraphSize({ width, height });
  }, []);

  const handleSelectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
  }, []);

  // ---- Toggle button ----
  const toggleButton = (
    <View style={styles.toggleGroup}>
      <Pressable
        style={[
          styles.toggleBtn,
          viewMode === 'constellation' && styles.toggleBtnActive,
        ]}
        onPress={() => setViewMode('constellation')}
      >
        <Text
          style={[
            styles.toggleText,
            viewMode === 'constellation' && styles.toggleTextActive,
          ]}
        >
          ◉
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.toggleBtn,
          viewMode === 'list' && styles.toggleBtnActive,
        ]}
        onPress={() => setViewMode('list')}
      >
        <Text
          style={[
            styles.toggleText,
            viewMode === 'list' && styles.toggleTextActive,
          ]}
        >
          ☰
        </Text>
      </Pressable>
    </View>
  );

  // ---- Empty state ----
  if (!loading && skills.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScreenHeader
          title="Skills"
          subtitle="Your skill constellation"
          right={toggleButton}
        />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>◇</Text>
          <Text style={styles.emptyTitle}>No skills yet</Text>
          <Text style={styles.emptyBody}>
            Complete journal entries with AI review to discover and grow your
            skills.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Skills"
        subtitle={`${skills.length} skill${skills.length !== 1 ? 's' : ''} tracked`}
        right={toggleButton}
      />

      {viewMode === 'constellation' ? (
        <View style={styles.graphArea} onLayout={handleLayout}>
          {simulatedNodes && graphData && graphSize.width > 0 && (
            <SkillConstellation
              nodes={simulatedNodes}
              edges={graphData.edges}
              centralNodeId={graphData.centralNodeId}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              width={graphSize.width}
              height={graphSize.height}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={skills}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const branchColor =
              BRANCH_COLORS[item.branch] ?? colors.textDim;
            const progress = Math.round(item.levelProgress.progress * 100);
            return (
              <View style={styles.listItem}>
                <View
                  style={[styles.listDot, { backgroundColor: branchColor }]}
                />
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>{item.name}</Text>
                  <Text style={[styles.listBranch, { color: branchColor }]}>
                    {item.branch.replace('_', ' ')}
                  </Text>
                </View>
                <View style={styles.listRight}>
                  <Text style={styles.listLevel}>LVL {item.level}</Text>
                  <View style={styles.listBarTrack}>
                    <View
                      style={[
                        styles.listBarFill,
                        {
                          width: `${progress}%`,
                          backgroundColor: branchColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Detail panel */}
      {selectedNode && graphData && viewMode === 'constellation' && (
        <SkillDetail
          node={selectedNode}
          edges={graphData.edges}
          allNodes={simulatedNodes ?? []}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
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
  graphArea: {
    flex: 1,
  },
  // Toggle
  toggleGroup: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  toggleBtnActive: {
    backgroundColor: colors.surfaceHover,
  },
  toggleText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.md,
    color: colors.textDim,
  },
  toggleTextActive: {
    color: colors.teal,
  },
  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing['3xl'],
  },
  emptyIcon: {
    fontSize: 40,
    color: colors.textDim,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontFamily: fontFamily.sansBold,
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
  // List
  listContent: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  listDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontFamily: fontFamily.sansMedium,
    fontSize: fontSize.md,
    color: colors.text,
  },
  listBranch: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  listRight: {
    alignItems: 'flex-end',
    width: 80,
  },
  listLevel: {
    fontFamily: fontFamily.monoBold,
    fontSize: fontSize.xs,
    color: colors.textSoft,
    marginBottom: 4,
  },
  listBarTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  listBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});

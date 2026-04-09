/**
 * SkillConstellation — force-directed graph rendered with react-native-svg.
 * Supports pinch-to-zoom, pan, tap-to-select, and distance-based fade.
 */

import React, { useMemo, useRef, useCallback } from 'react';
import { View, StyleSheet, Dimensions, LayoutChangeEvent } from 'react-native';
import Svg, {
  Circle,
  Line,
  Text as SvgText,
  Defs,
  RadialGradient,
  Stop,
  G,
} from 'react-native-svg';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import type { SkillNode, SkillEdge } from '../lib/skill-graph';
import { BRANCH_COLORS, normalizeEdgeWeights } from '../lib/skill-graph';
import { colors } from '../theme/colors';
import { fontFamily } from '../theme/typography';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  nodes: SkillNode[];
  edges: SkillEdge[];
  centralNodeId: string | null;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  width: number;
  height: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAR_COUNT = 60;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SkillConstellation({
  nodes,
  edges,
  centralNodeId,
  selectedNodeId,
  onSelectNode,
  width,
  height,
}: Props) {
  // ---- Gesture state (shared values for reanimated) ----
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // ---- Normalized edges with weight ----
  const normalizedEdges = useMemo(() => normalizeEdgeWeights(edges), [edges]);

  // ---- Ambient stars (stable between renders) ----
  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.5 + Math.random() * 1.2,
        opacity: 0.15 + Math.random() * 0.25,
      })),
    [width, height]
  );

  // ---- Node lookup ----
  const nodeMap = useMemo(() => {
    const m = new Map<string, SkillNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  // ---- Gestures ----
  const pinch = Gesture.Pinch()
    .onStart(() => {
      savedScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, savedScale.value * e.scale)
      );
    });

  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .onStart(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    });

  const tap = Gesture.Tap()
    .onEnd((e) => {
      const svgX = (e.x - translateX.value) / scale.value;
      const svgY = (e.y - translateY.value) / scale.value;

      let closest: SkillNode | null = null;
      let closestDist = Infinity;
      for (const node of nodes) {
        const dx = node.x - svgX;
        const dy = node.y - svgY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < node.radius + 16 && dist < closestDist) {
          closest = node;
          closestDist = dist;
        }
      }
      onSelectNode(closest?.id ?? null);
    });

  const composed = Gesture.Race(tap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // ---- Distance-based opacity (fade nodes far from center) ----
  const getNodeOpacity = useCallback(
    (node: SkillNode) => {
      const cx = width / 2;
      const cy = height / 2;
      const dx = node.x - cx;
      const dy = node.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = Math.sqrt(cx * cx + cy * cy);
      // Full opacity within 40% of max distance, fade to 0.3 at edges
      const fadeStart = maxDist * 0.4;
      if (dist <= fadeStart) return 1;
      const fadeRange = maxDist - fadeStart;
      return Math.max(0.3, 1 - ((dist - fadeStart) / fadeRange) * 0.7);
    },
    [width, height]
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[{ width, height }, animatedStyle]}
        >
          <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Ambient stars */}
            {stars.map((star, i) => (
              <Circle
                key={`star-${i}`}
                cx={star.x}
                cy={star.y}
                r={star.r}
                fill={colors.textDim}
                opacity={star.opacity}
              />
            ))}

            {/* Edges */}
            {normalizedEdges.map((edge) => {
              const a = nodeMap.get(edge.source);
              const b = nodeMap.get(edge.target);
              if (!a || !b) return null;
              const opacity = 0.15 + edge.normalized * 0.45;
              const strokeWidth = 0.5 + edge.normalized * 2;
              const isHighlighted =
                selectedNodeId === edge.source ||
                selectedNodeId === edge.target;
              return (
                <Line
                  key={`edge-${edge.source}-${edge.target}`}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={isHighlighted ? colors.teal : colors.textDim}
                  strokeWidth={isHighlighted ? strokeWidth + 0.5 : strokeWidth}
                  opacity={isHighlighted ? opacity + 0.2 : opacity}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const branchColor = BRANCH_COLORS[node.branch];
              const isSelected = selectedNodeId === node.id;
              const isCentral = centralNodeId === node.id;
              const opacity = getNodeOpacity(node);
              const r = node.radius;

              // XP ring: arc based on xpProgress
              const ringRadius = r + 3;
              const circumference = 2 * Math.PI * ringRadius;
              const progressOffset =
                circumference - node.xpProgress * circumference;

              return (
                <G key={node.id} opacity={opacity}>
                  {/* Glow for central/selected node */}
                  {(isCentral || isSelected) && (
                    <Circle
                      cx={node.x}
                      cy={node.y}
                      r={r + 10}
                      fill={branchColor}
                      opacity={0.08}
                    />
                  )}

                  {/* XP progress ring */}
                  <Circle
                    cx={node.x}
                    cy={node.y}
                    r={ringRadius}
                    fill="none"
                    stroke={colors.border}
                    strokeWidth={2}
                  />
                  <Circle
                    cx={node.x}
                    cy={node.y}
                    r={ringRadius}
                    fill="none"
                    stroke={branchColor}
                    strokeWidth={2}
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    rotation={-90}
                    origin={`${node.x}, ${node.y}`}
                  />

                  {/* Node body */}
                  <Circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={colors.surface}
                    stroke={isSelected ? colors.teal : branchColor}
                    strokeWidth={isSelected ? 2 : 1}
                  />

                  {/* Inner color dot */}
                  <Circle
                    cx={node.x}
                    cy={node.y}
                    r={r * 0.4}
                    fill={branchColor}
                    opacity={0.6}
                  />

                  {/* Label */}
                  <SvgText
                    x={node.x}
                    y={node.y + r + 14}
                    textAnchor="middle"
                    fontSize={9}
                    fontFamily={fontFamily.mono ?? 'monospace'}
                    fill={colors.textSoft}
                    opacity={opacity}
                  >
                    {node.name.length > 12
                      ? node.name.slice(0, 11) + '...'
                      : node.name}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

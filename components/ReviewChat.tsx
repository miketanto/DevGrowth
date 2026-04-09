import { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Animated,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReviewMessage } from '../types';
import { colors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReviewChatProps {
  messages: ReviewMessage[];
  isTyping: boolean;
  currentQuestion: number;
  totalQuestions: number;
  inputValue: string;
  onChangeInput: (text: string) => void;
  onSend: () => void;
  /** When true, input is disabled (review complete or AI is typing) */
  inputDisabled: boolean;
  /** When review is complete, show "View Results" CTA */
  reviewComplete: boolean;
  onViewResults?: () => void;
}

// ---------------------------------------------------------------------------
// Typing Indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);
    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
  });

  return (
    <View style={styles.typingRow}>
      <View style={styles.aiBubble}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, dotStyle(dot1)]} />
          <Animated.View style={[styles.dot, dotStyle(dot2)]} />
          <Animated.View style={[styles.dot, dotStyle(dot3)]} />
        </View>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Message Bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message }: { message: ReviewMessage }) {
  const isAI = message.role === 'ai';

  return (
    <View style={[styles.messageRow, isAI ? styles.aiRow : styles.userRow]}>
      <View style={[isAI ? styles.aiBubble : styles.userBubble]}>
        <Text style={[styles.messageText, isAI && styles.aiText]}>
          {message.content}
        </Text>
        {isAI && message.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {message.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------

function ProgressBar({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const progress = total > 0 ? Math.min(current / total, 1) : 0;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.progressLabel}>
        {current}/{total}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ReviewChat({
  messages,
  isTyping,
  currentQuestion,
  totalQuestions,
  inputValue,
  onChangeInput,
  onSend,
  inputDisabled,
  reviewComplete,
  onViewResults,
}: ReviewChatProps) {
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Auto-scroll to bottom when messages change or typing starts
    const timer = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length, isTyping]);

  return (
    <View style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI REVIEW</Text>
        <ProgressBar current={currentQuestion} total={totalQuestions} />
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
      </ScrollView>

      {/* Input area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 60 : 0}
      >
        {!reviewComplete ? (
          <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <TextInput
              style={styles.textInput}
              value={inputValue}
              onChangeText={onChangeInput}
              placeholder={
                inputDisabled
                  ? 'Waiting for AI...'
                  : 'Type your response...'
              }
              placeholderTextColor={colors.textDim}
              multiline
              editable={!inputDisabled}
              textAlignVertical="top"
            />
            <Pressable
              style={[
                styles.sendButton,
                (!inputValue.trim() || inputDisabled) && styles.sendButtonDisabled,
              ]}
              onPress={onSend}
              disabled={!inputValue.trim() || inputDisabled}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </Pressable>
          </View>
        ) : (
          <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Pressable style={styles.viewResultsButton} onPress={onViewResults}>
              <Text style={styles.viewResultsText}>View Results</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  // Header
  header: {
    paddingTop: spacing['4xl'],
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.blue,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 3,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.blue,
    borderRadius: radius.full,
  },
  progressLabel: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },

  // Messages
  messagesContent: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },

  // Message rows
  messageRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  aiRow: {
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },

  // Bubbles
  aiBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.blueDim,
    borderRadius: radius.md,
    borderTopLeftRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: '85%',
  },
  userBubble: {
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderTopRightRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: '85%',
  },

  // Text
  messageText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: fontSize.md * 1.5,
  },
  aiText: {
    color: colors.text,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tag: {
    backgroundColor: colors.blueGlow,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.blue,
  },

  // Typing indicator
  typingRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: spacing.xs,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    height: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.blue,
  },

  // Input area
  inputArea: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: colors.blue,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  sendButtonDisabled: {
    backgroundColor: colors.blueDim,
    opacity: 0.5,
  },
  sendButtonText: {
    fontFamily: fontFamily.monoMedium,
    fontSize: fontSize.sm,
    color: colors.bg,
  },

  // View Results
  viewResultsButton: {
    flex: 1,
    backgroundColor: colors.teal,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  viewResultsText: {
    fontFamily: fontFamily.monoMedium,
    fontSize: fontSize.md,
    color: colors.bg,
  },
});

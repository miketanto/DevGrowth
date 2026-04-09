import { View, Text, StyleSheet } from 'react-native';
import type { ReviewMessage } from '../types';
import { colors } from '../theme/colors';
import { fontFamily, fontSize } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';

interface ReviewConversationProps {
  messages: ReviewMessage[];
}

function MessageBubble({ message }: { message: ReviewMessage }) {
  const isAI = message.role === 'ai';

  return (
    <View style={[styles.messageRow, isAI ? styles.aiRow : styles.userRow]}>
      <View style={isAI ? styles.aiBubble : styles.userBubble}>
        <Text style={styles.messageText}>{message.content}</Text>
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

export function ReviewConversation({ messages }: ReviewConversationProps) {
  if (messages.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>CONVERSATION</Text>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  messageText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    color: colors.text,
    lineHeight: fontSize.md * 1.5,
  },
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
});

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  InputAccessoryView,
  KeyboardAvoidingView,
  Pressable,
  Keyboard,
  Platform,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Button } from '../../components/ui/Button';
import { ConfidenceSlider } from '../../components/ConfidenceSlider';
import { MoodPicker } from '../../components/MoodPicker';
import { useEntryStore } from '../../store/useEntryStore';
import { useUserStore } from '../../store/useUserStore';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

export default function NewEntryScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft, submitEntry, loading } = useEntryStore();
  const recordEntry = useUserStore((s) => s.recordEntry);
  const [submitted, setSubmitted] = useState(false);

  const isEditing = !!editId;
  const today = new Date().toISOString().split('T')[0];

  const canSubmit = draft.worked_on.trim().length > 0;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitted(true);

    try {
      if (isEditing) {
        // Update existing entry
        const { updateEntryContent } = await import('../../lib/database');
        await updateEntryContent(db, editId!, {
          worked_on: draft.worked_on,
          hardest_problem: draft.hardest_problem,
          how_solved: draft.how_solved,
          confidence: draft.confidence,
          mood: draft.mood,
        });
        router.back();
      } else {
        // Create new entry
        updateDraft({ date: today });
        await submitEntry(db);
        await recordEntry(db, today);
        router.replace('/entry/review');
      }
    } catch (e) {
      setSubmitted(false);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
          <ScreenHeader
            title={isEditing ? 'Edit Entry' : 'New Entry'}
            subtitle={today}
            onBack={() => router.back()}
          />

          {/* Worked On — required */}
          <View style={styles.field}>
            <Text style={styles.label}>WHAT DID YOU WORK ON? *</Text>
            <TextInput
              style={styles.input}
              value={draft.worked_on}
              onChangeText={(t) => updateDraft({ worked_on: t })}
              placeholder="Built the auth flow, debugged CI pipeline…"
              placeholderTextColor={colors.textDim}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Hardest Problem — optional */}
          <View style={styles.field}>
            <Text style={styles.label}>HARDEST PROBLEM</Text>
            <TextInput
              style={styles.input}
              value={draft.hardest_problem ?? ''}
              onChangeText={(t) =>
                updateDraft({ hardest_problem: t || null })
              }
              placeholder="The trickiest thing you hit today…"
              placeholderTextColor={colors.textDim}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* How Solved — optional */}
          <View style={styles.field}>
            <Text style={styles.label}>HOW DID YOU SOLVE IT?</Text>
            <TextInput
              style={styles.input}
              value={draft.how_solved ?? ''}
              onChangeText={(t) => updateDraft({ how_solved: t || null })}
              placeholder="Stack Overflow, pair programming, brute force…"
              placeholderTextColor={colors.textDim}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Confidence */}
          <View style={styles.field}>
            <ConfidenceSlider
              value={draft.confidence}
              onChange={(v) => updateDraft({ confidence: v })}
            />
          </View>

          {/* Mood */}
          <View style={styles.field}>
            <MoodPicker
              value={draft.mood}
              onChange={(v) => updateDraft({ mood: v })}
            />
          </View>

          {/* Submit */}
          <View style={styles.submitArea}>
            <Button
              title={loading || submitted ? 'Saving…' : isEditing ? 'Save Changes' : 'Submit for Review'}
              onPress={handleSubmit}
              disabled={!canSubmit || loading || submitted}
            />
          </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingTop: spacing['4xl'],
    paddingBottom: 120,
  },
  field: {
    paddingHorizontal: spacing['2xl'],
    marginBottom: spacing.xl,
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontFamily: fontFamily.sans,
    fontSize: fontSize.md,
    minHeight: 80,
  },
  submitArea: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
  },
});

import { useState, useEffect, useCallback } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { ReviewChat } from '../../components/ReviewChat';
import { useEntryStore } from '../../store/useEntryStore';
import { callClaude } from '../../lib/ai/client';
import { buildFollowUpPrompt } from '../../lib/ai/prompts';
import { scoreReflection } from '../../lib/ai/score-reflection';
import { extractSkills } from '../../lib/ai/extract-skills';
import { calculateXP } from '../../lib/gamification';
import {
  upsertSkill,
  addSkillXP,
  linkEntrySkill,
  addOverallXP,
  setOverallLevel,
  setSkillLevel,
} from '../../lib/database';
import { getOverallLevel, getSkillLevel, getSkillLevelProgress } from '../../lib/gamification';
import type { ReviewMessage } from '../../types';
import { colors } from '../../theme/colors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface FollowUpQuestion {
  question: string;
  tags: string[];
}

function parseFollowUpQuestions(text: string): FollowUpQuestion[] {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  try {
    const raw: unknown[] = JSON.parse(jsonMatch[0]);
    return raw
      .filter(
        (item): item is { question: string; tags: string[] } =>
          typeof item === 'object' &&
          item !== null &&
          typeof (item as Record<string, unknown>).question === 'string'
      )
      .map((item) => ({
        question: item.question,
        tags: Array.isArray(item.tags)
          ? item.tags.filter((t): t is string => typeof t === 'string')
          : [],
      }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

type ReviewPhase = 'loading' | 'conversation' | 'scoring' | 'complete' | 'error';

export default function ReviewScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { activeEntry, addMessage, saveReview } = useEntryStore();

  const [phase, setPhase] = useState<ReviewPhase>('loading');
  const [messages, setMessages] = useState<ReviewMessage[]>([]);
  const [questions, setQuestions] = useState<FollowUpQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sequence, setSequence] = useState(0);
  const [scoreData, setScoreData] = useState<string | null>(null);

  const entryId = activeEntry?.id ?? '';

  // -- Add a message to local state + SQLite --
  const pushMessage = useCallback(
    async (role: 'ai' | 'user', content: string, tags: string[], seq: number) => {
      const msg: ReviewMessage = {
        id: `local-${seq}`,
        entry_id: entryId,
        role,
        content,
        tags,
        sequence: seq,
      };
      setMessages((prev) => [...prev, msg]);
      await addMessage(db, {
        entry_id: entryId,
        role,
        content,
        tags,
        sequence: seq,
      });
      return msg;
    },
    [db, entryId, addMessage]
  );

  // -- Step 1: Generate follow-up questions on mount --
  useEffect(() => {
    if (!activeEntry) return;

    let cancelled = false;

    async function generateQuestions() {
      setIsTyping(true);
      try {
        const { system, user } = buildFollowUpPrompt({
          entry: activeEntry!,
        });
        const result = await callClaude('followup_generation', system, [
          { role: 'user', content: user },
        ]);
        if (cancelled) return;

        const parsed = parseFollowUpQuestions(result.text);
        if (parsed.length === 0) {
          throw new Error('AI returned no follow-up questions');
        }

        setQuestions(parsed);

        // Show first AI question
        await pushMessage('ai', parsed[0].question, parsed[0].tags, 0);
        setSequence(1);
        setCurrentQIndex(0);
        setPhase('conversation');
      } catch (e) {
        if (cancelled) return;
        setPhase('error');
        Alert.alert(
          'Review Error',
          'Failed to generate review questions. Please try again.',
          [{ text: 'Go Back', onPress: () => router.back() }]
        );
      } finally {
        if (!cancelled) setIsTyping(false);
      }
    }

    generateQuestions();
    return () => {
      cancelled = true;
    };
  }, [activeEntry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Handle user sending a response --
  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || !activeEntry || phase !== 'conversation') return;

    const text = inputValue.trim();
    setInputValue('');

    const nextSeq = sequence;
    setSequence((s) => s + 1);

    // Save user message
    await pushMessage('user', text, [], nextSeq);

    const nextQIdx = currentQIndex + 1;

    if (nextQIdx < questions.length) {
      // Show next AI question
      setIsTyping(true);
      // Brief delay for natural feel
      await new Promise((r) => setTimeout(r, 800));
      const q = questions[nextQIdx];
      await pushMessage('ai', q.question, q.tags, nextSeq + 1);
      setSequence((s) => s + 1);
      setCurrentQIndex(nextQIdx);
      setIsTyping(false);
    } else {
      // All questions answered — run scoring pipeline
      await runScoringPipeline(nextSeq + 1);
    }
  }, [inputValue, activeEntry, phase, sequence, currentQIndex, questions]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Scoring pipeline: score + extract skills + calc XP --
  async function runScoringPipeline(nextSeq: number) {
    if (!activeEntry) return;

    setPhase('scoring');
    setIsTyping(true);

    try {
      // Build conversation for scoring/extraction
      const allMessages = [...messages];
      // Include the last user message that was just added
      const conversation = allMessages
        .filter((m) => m.role === 'ai' || m.role === 'user')
        .map((m) => ({ role: m.role, content: m.content }));

      // Run scoring and skill extraction in parallel
      const [scoreResult, skills] = await Promise.all([
        scoreReflection({
          entry: activeEntry,
          conversation,
        }),
        extractSkills({
          entry: activeEntry,
          conversation,
        }),
      ]);

      // Calculate XP
      const xpBreakdown = calculateXP({
        hasFollowups: true,
        followupCount: questions.length,
        reviewScore: scoreResult.scores,
        isPatternEntry: false,
      });

      // Save AI summary message
      await pushMessage('ai', scoreResult.summary, [], nextSeq);

      // Save review to entry
      await saveReview(db, entryId, {
        ai_summary: scoreResult.summary,
        review_score: scoreResult.scores,
        xp_earned: xpBreakdown.total,
      });

      // Upsert skills and award XP
      const xpPerSkill =
        skills.length > 0
          ? Math.floor(xpBreakdown.total / skills.length)
          : 0;

      for (const skill of skills) {
        const skillId = await upsertSkill(db, {
          name: skill.name,
          branch: skill.branch,
        });
        await addSkillXP(db, skillId, xpPerSkill);
        await linkEntrySkill(db, entryId, skillId, xpPerSkill);

        // Update skill level if needed
        const skillRow = await db.getFirstAsync<{ total_xp: number }>(
          'SELECT total_xp FROM skills WHERE id = ?',
          skillId
        );
        if (skillRow) {
          const newLevel = getSkillLevel(skillRow.total_xp);
          const progress = getSkillLevelProgress(skillRow.total_xp);
          await setSkillLevel(db, skillId, newLevel, progress.current);
        }
      }

      // Update overall XP and level
      await addOverallXP(db, xpBreakdown.total);
      const profileRow = await db.getFirstAsync<{ overall_xp: number }>(
        'SELECT overall_xp FROM user_profile WHERE id = 1'
      );
      if (profileRow) {
        const newLevel = getOverallLevel(profileRow.overall_xp);
        await setOverallLevel(db, newLevel);
      }

      setScoreData(JSON.stringify({
        scores: scoreResult.scores,
        xp_breakdown: xpBreakdown,
        extracted_skills: skills,
        summary: scoreResult.summary,
      }));
      setPhase('complete');
    } catch (e) {
      setPhase('error');
      Alert.alert(
        'Scoring Error',
        'Failed to complete review scoring. Your responses have been saved.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTyping(false);
    }
  }

  // -- Navigate to score screen --
  const handleViewResults = useCallback(() => {
    router.replace({ pathname: '/entry/score', params: { data: scoreData ?? '' } });
  }, [router, scoreData]);

  // Guard: no active entry
  if (!activeEntry) {
    return null;
  }

  const answeredCount =
    phase === 'complete'
      ? questions.length
      : messages.filter((m) => m.role === 'user').length;

  return (
    <View style={styles.container}>
      <ReviewChat
        messages={messages}
        isTyping={isTyping}
        currentQuestion={answeredCount}
        totalQuestions={questions.length}
        inputValue={inputValue}
        onChangeInput={setInputValue}
        onSend={handleSend}
        inputDisabled={phase !== 'conversation' || isTyping}
        reviewComplete={phase === 'complete'}
        onViewResults={handleViewResults}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});

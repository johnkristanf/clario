import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Sparkles, RefreshCw, Flame, ArrowRight, Target, Clock } from 'lucide-react-native';
import { Colors, Spacing, Typography, MinTouchTarget } from '@/constants/theme';
import { topicsService, sessionsService } from '@/services/api';
import { Topic, TopicCategory, UserHistory } from '@/types';
import { getOrCreateUserId } from '@/services/supabase';

export default function DailyChallengeScreen() {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [weaknessTopic, setWeaknessTopic] = useState<Topic | null>(null);
  const [history, setHistory] = useState<UserHistory | null>(null);
  const [categories, setCategories] = useState<TopicCategory[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Intermediate');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string>('');

  const loadData = useCallback(async (difficulty = selectedDifficulty) => {
    try {
      setLoading(true);
      const uid = await getOrCreateUserId();
      setUserId(uid);

      // Fetch daily topic, weakness topic, history, categories in parallel
      const [dailyRes, catsRes] = await Promise.all([
        topicsService.getDailyTopic(uid, difficulty),
        topicsService.getCategories().catch(() => []),
      ]);

      setTopic(dailyRes);
      setCategories(catsRes);

      // Fetch history & weakness topic
      try {
        const histRes = await sessionsService.getUserHistory(uid);
        setHistory(histRes);
        if (histRes.total_sessions > 0) {
          const weakRes = await topicsService.getWeaknessFocusedTopic(uid);
          setWeaknessTopic(weakRes);
        }
      } catch {
        // history optional for new users
      }
    } catch (err) {
      console.error('Failed to load challenge:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDifficulty]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDifficultyChange = (diff: string) => {
    setSelectedDifficulty(diff);
    loadData(diff);
  };

  const startChallenge = (selectedTopic: Topic) => {
    router.push({
      pathname: '/session/[topicId]',
      params: {
        topicId: selectedTopic.id.toString(),
        title: selectedTopic.title,
        prompt: selectedTopic.prompt,
        category: selectedTopic.category,
        difficulty: selectedTopic.difficulty,
        prepSeconds: selectedTopic.prep_time_seconds.toString(),
        speakingSeconds: selectedTopic.speaking_time_seconds.toString(),
        framework: selectedTopic.suggested_framework || 'PREP Framework',
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.dark.text} />
        }
      >
        {/* Header Bar */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.appTitle}>CLARIO</Text>
            <Text style={styles.headerSubtitle}>Daily Articulation Practice</Text>
          </View>
          <View style={styles.streakBadge}>
            <Flame color="#f59e0b" size={18} />
            <Text style={styles.streakText}>
              {history?.streak_days ? `${history.streak_days} Day Streak` : '1 Day Streak'}
            </Text>
          </View>
        </View>

        {/* Difficulty Selector */}
        <View style={styles.difficultyContainer}>
          {['Beginner', 'Intermediate', 'Advanced'].map((diff) => {
            const isSelected = selectedDifficulty === diff;
            return (
              <TouchableOpacity
                key={diff}
                onPress={() => handleDifficultyChange(diff)}
                style={[styles.difficultyChip, isSelected && styles.difficultyChipSelected]}
              >
                <Text
                  style={[
                    styles.difficultyChipText,
                    isSelected && styles.difficultyChipTextSelected,
                  ]}
                >
                  {diff}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.dark.text} />
            <Text style={styles.loadingText}>Fetching today's challenge...</Text>
          </View>
        ) : topic ? (
          <>
            {/* Primary Daily Challenge Card */}
            <View style={styles.mainChallengeCard}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{topic.category.toUpperCase()}</Text>
                </View>
                <View style={styles.timeTag}>
                  <Clock size={13} color={Colors.dark.textSecondary} />
                  <Text style={styles.timeTagText}>30s Prep • 2m Speak</Text>
                </View>
              </View>

              <Text style={styles.topicTitle}>{topic.title}</Text>
              <Text style={styles.topicPrompt}>"{topic.prompt}"</Text>

              {topic.suggested_framework && (
                <View style={styles.frameworkPill}>
                  <Sparkles size={14} color={Colors.dark.accent} />
                  <Text style={styles.frameworkText}>
                    Suggested: {topic.suggested_framework}
                  </Text>
                </View>
              )}

              {/* Start Button */}
              <TouchableOpacity
                style={styles.startButton}
                activeOpacity={0.8}
                onPress={() => startChallenge(topic)}
              >
                <Text style={styles.startButtonText}>Start Challenge</Text>
                <ArrowRight size={18} color={Colors.dark.primaryInverse} />
              </TouchableOpacity>

              {/* Refresh Random Topic */}
              <TouchableOpacity
                style={styles.refreshButton}
                activeOpacity={0.7}
                onPress={() => loadData()}
              >
                <RefreshCw size={14} color={Colors.dark.textSecondary} />
                <Text style={styles.refreshButtonText}>Shuffle another prompt</Text>
              </TouchableOpacity>
            </View>

            {/* Personalized Weakness Recommendation */}
            {weaknessTopic && (
              <View style={styles.weaknessCard}>
                <View style={styles.weaknessHeader}>
                  <Target size={16} color={Colors.dark.warning} />
                  <Text style={styles.weaknessTag}>TARGETED DRILL BASED ON PREVIOUS SESSIONS</Text>
                </View>
                <Text style={styles.weaknessTitle}>{weaknessTopic.title}</Text>
                <Text style={styles.weaknessPrompt}>{weaknessTopic.prompt}</Text>
                <TouchableOpacity
                  style={styles.weaknessActionButton}
                  onPress={() => startChallenge(weaknessTopic)}
                >
                  <Text style={styles.weaknessActionText}>Practice Weakness Drill</Text>
                  <ArrowRight size={14} color={Colors.dark.warning} />
                </TouchableOpacity>
              </View>
            )}

            {/* Categories Explorer */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Topic Categories</Text>
              <Text style={styles.sectionSub}>8 core dimensions of speaking mastery</Text>
            </View>

            <View style={styles.categoriesGrid}>
              {categories.map((cat, idx) => (
                <View key={idx} style={styles.categoryItem}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catDesc}>{cat.description}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.ten,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.five,
  },
  appTitle: {
    ...Typography.titleLarge,
    color: Colors.dark.text,
    letterSpacing: 2,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  streakText: {
    ...Typography.bodySmall,
    fontWeight: '700',
    color: '#f59e0b',
  },
  difficultyContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    padding: 4,
    borderRadius: 12,
    marginBottom: Spacing.five,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  difficultyChip: {
    flex: 1,
    height: MinTouchTarget - 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  difficultyChipSelected: {
    backgroundColor: Colors.dark.surfaceElevated,
  },
  difficultyChipText: {
    ...Typography.labelSmall,
    color: Colors.dark.textMuted,
    fontWeight: '600',
  },
  difficultyChipTextSelected: {
    color: Colors.dark.text,
  },
  loaderContainer: {
    padding: Spacing.eight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.three,
  },
  mainChallengeCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: Spacing.five,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.five,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  categoryBadge: {
    backgroundColor: Colors.dark.surfaceHighlight,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    ...Typography.labelSmall,
    color: Colors.dark.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeTagText: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  topicTitle: {
    ...Typography.titleLarge,
    color: Colors.dark.text,
    marginBottom: Spacing.two,
  },
  topicPrompt: {
    ...Typography.bodyLarge,
    color: Colors.dark.textSecondary,
    lineHeight: 26,
    marginBottom: Spacing.four,
    fontStyle: 'italic',
  },
  frameworkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: Spacing.five,
  },
  frameworkText: {
    ...Typography.bodySmall,
    color: Colors.dark.accent,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: Colors.dark.text,
    height: MinTouchTarget + 4,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  startButtonText: {
    ...Typography.titleSmall,
    color: Colors.dark.background,
    fontWeight: '700',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: MinTouchTarget - 10,
    gap: 6,
  },
  refreshButtonText: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
  },
  weaknessCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 16,
    padding: Spacing.four,
    marginBottom: Spacing.five,
  },
  weaknessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.two,
  },
  weaknessTag: {
    ...Typography.labelSmall,
    color: Colors.dark.warning,
    fontSize: 10,
  },
  weaknessTitle: {
    ...Typography.titleSmall,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  weaknessPrompt: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
  weaknessActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  weaknessActionText: {
    ...Typography.bodySmall,
    color: Colors.dark.warning,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.dark.text,
  },
  sectionSub: {
    ...Typography.bodySmall,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  categoriesGrid: {
    gap: Spacing.three,
  },
  categoryItem: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.four,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  catName: {
    ...Typography.titleSmall,
    color: Colors.dark.text,
    marginBottom: 4,
  },
  catDesc: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
});

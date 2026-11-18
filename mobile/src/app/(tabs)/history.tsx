import React, { useState, useEffect } from 'react';
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
import { TrendingUp, Flame, Calendar, Award, ChevronRight, AlertCircle, Play } from 'lucide-react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { sessionsService } from '@/services/api';
import { UserHistory, PracticeSession } from '@/types';
import { getOrCreateUserId } from '@/services/supabase';

export default function HistoryScreen() {
  const [history, setHistory] = useState<UserHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const uid = await getOrCreateUserId();
      const res = await sessionsService.getUserHistory(uid);
      setHistory(res);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.dark.success;
    if (score >= 65) return Colors.dark.warning;
    return Colors.dark.danger;
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
        {/* Screen Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progression</Text>
          <Text style={styles.headerSubtitle}>Longitudinal speech growth across practice sessions</Text>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.dark.text} />
            <Text style={styles.loaderText}>Analyzing your communication history...</Text>
          </View>
        ) : history ? (
          <>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Award size={18} color={Colors.dark.accent} />
                <Text style={styles.statNumber}>{history.total_sessions}</Text>
                <Text style={styles.statLabel}>Total Sessions</Text>
              </View>

              <View style={styles.statCard}>
                <Flame size={18} color="#f59e0b" />
                <Text style={styles.statNumber}>{history.streak_days}d</Text>
                <Text style={styles.statLabel}>Active Streak</Text>
              </View>

              <View style={styles.statCard}>
                <TrendingUp size={18} color={Colors.dark.success} />
                <Text style={styles.statNumber}>
                  {history.dimension_progression.length > 0
                    ? `+${Math.max(...history.dimension_progression.map((d) => d.change), 0)}%`
                    : '0%'}
                </Text>
                <Text style={styles.statLabel}>Best Gain</Text>
              </View>
            </View>

            {/* SECTION D: Personalized Longitudinal Progression */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Dimension Growth Tracker</Text>
              <Text style={styles.sectionDesc}>Initial baseline vs current performance</Text>

              {history.dimension_progression.length === 0 ? (
                <Text style={styles.emptyNote}>
                  Complete at least two speaking sessions to track growth trends over time.
                </Text>
              ) : (
                <View style={styles.dimensionList}>
                  {history.dimension_progression.map((dim, idx) => {
                    const isPositive = dim.change >= 0;
                    return (
                      <View key={idx} style={styles.dimensionRow}>
                        <View style={styles.dimInfo}>
                          <Text style={styles.dimName}>{dim.dimension}</Text>
                          <Text style={styles.dimDetail}>
                            Started {dim.initial_average}% → Current {dim.current_average}%
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.changeBadge,
                            isPositive ? styles.changeBadgePositive : styles.changeBadgeNegative,
                          ]}
                        >
                          <Text
                            style={[
                              styles.changeText,
                              isPositive ? styles.changeTextPositive : styles.changeTextNegative,
                            ]}
                          >
                            {isPositive ? `+${dim.change}%` : `${dim.change}%`}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Persistent Weaknesses Card */}
            <View style={styles.weaknessSummaryCard}>
              <View style={styles.weaknessHeader}>
                <AlertCircle size={16} color={Colors.dark.warning} />
                <Text style={styles.weaknessCardTitle}>Persistent Communication Patterns</Text>
              </View>
              <View style={styles.weaknessList}>
                {history.persistent_weaknesses.map((item, idx) => (
                  <View key={idx} style={styles.weaknessBullet}>
                    <Text style={styles.weaknessDot}>•</Text>
                    <Text style={styles.weaknessText}>{item}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* SECTION E: Past Recordings History */}
            <View style={styles.historySection}>
              <Text style={styles.sectionTitle}>Session Replay & History</Text>
              <Text style={styles.sectionDesc}>Revisit audio recordings and generated transcripts</Text>

              {history.recent_sessions.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyCardText}>No completed sessions yet.</Text>
                </View>
              ) : (
                <View style={styles.sessionList}>
                  {history.recent_sessions.map((sess) => {
                    const score = sess.evaluation?.overall_score || 0;
                    const dateFormatted = new Date(sess.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <TouchableOpacity
                        key={sess.id}
                        style={styles.sessionItem}
                        activeOpacity={0.7}
                        onPress={() =>
                          router.push({
                            pathname: '/evaluation/[sessionId]',
                            params: { sessionId: sess.id },
                          })
                        }
                      >
                        <View style={styles.sessionLeft}>
                          <View style={styles.sessionHeaderRow}>
                            <Text style={styles.sessionCategory}>
                              {(sess.topic?.category || 'Practice').toUpperCase()}
                            </Text>
                            <Text style={styles.sessionDate}>{dateFormatted}</Text>
                          </View>
                          <Text style={styles.sessionTitle}>
                            {sess.topic?.title || 'Daily Articulation Session'}
                          </Text>
                          <Text style={styles.sessionMeta}>
                            {sess.duration_seconds.toFixed(0)}s recording • {sess.evaluation?.filler_words_count || 0} fillers
                          </Text>
                        </View>

                        <View style={styles.sessionRight}>
                          {score > 0 && (
                            <View style={[styles.scorePill, { borderColor: getScoreColor(score) }]}>
                              <Text style={[styles.scorePillText, { color: getScoreColor(score) }]}>
                                {score}
                              </Text>
                            </View>
                          )}
                          <ChevronRight size={18} color={Colors.dark.textSecondary} />
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
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
  header: {
    marginBottom: Spacing.four,
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: Colors.dark.text,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  loaderContainer: {
    padding: Spacing.eight,
    alignItems: 'center',
  },
  loaderText: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.three,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.four,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: Spacing.three + 2,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    ...Typography.titleLarge,
    color: Colors.dark.text,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...Typography.labelSmall,
    color: Colors.dark.textSecondary,
    fontSize: 9,
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 18,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    ...Typography.titleSmall,
    color: Colors.dark.text,
  },
  sectionDesc: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.three,
  },
  emptyNote: {
    ...Typography.bodyMedium,
    color: Colors.dark.textMuted,
    fontStyle: 'italic',
    paddingVertical: Spacing.two,
  },
  dimensionList: {
    gap: Spacing.three,
  },
  dimensionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dimInfo: {
    flex: 1,
  },
  dimName: {
    ...Typography.bodyMedium,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  dimDetail: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginTop: 1,
  },
  changeBadge: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  changeBadgePositive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: Colors.dark.success,
  },
  changeBadgeNegative: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderColor: Colors.dark.danger,
  },
  changeText: {
    ...Typography.labelSmall,
    fontWeight: '700',
  },
  changeTextPositive: {
    color: Colors.dark.success,
  },
  changeTextNegative: {
    color: Colors.dark.danger,
  },
  weaknessSummaryCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginBottom: Spacing.four,
  },
  weaknessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.two,
  },
  weaknessCardTitle: {
    ...Typography.titleSmall,
    color: Colors.dark.text,
  },
  weaknessList: {
    gap: 6,
  },
  weaknessBullet: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  weaknessDot: {
    color: Colors.dark.warning,
    fontWeight: '700',
  },
  weaknessText: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  historySection: {
    marginTop: Spacing.two,
  },
  emptyCard: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.five,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyCardText: {
    ...Typography.bodyMedium,
    color: Colors.dark.textMuted,
  },
  sessionList: {
    gap: Spacing.three,
  },
  sessionItem: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionLeft: {
    flex: 1,
    paddingRight: Spacing.three,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
    marginBottom: 4,
  },
  sessionCategory: {
    ...Typography.labelSmall,
    color: Colors.dark.accent,
    fontSize: 9,
    fontWeight: '700',
  },
  sessionDate: {
    ...Typography.bodySmall,
    color: Colors.dark.textMuted,
    fontSize: 11,
  },
  sessionTitle: {
    ...Typography.titleSmall,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  sessionMeta: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
  },
  sessionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  scorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  scorePillText: {
    ...Typography.bodySmall,
    fontWeight: '700',
  },
});

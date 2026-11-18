import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { SpeechEvaluation } from '@/types';

interface DimensionScoreCardProps {
  evaluation: SpeechEvaluation;
}

export function DimensionScoreCard({ evaluation }: DimensionScoreCardProps) {
  const dimensions = [
    {
      name: 'Clarity of Thought',
      score: evaluation.clarity_score,
      source: 'Transcript Analysis',
      desc: 'Clarity of core idea delivery',
    },
    {
      name: 'Structure',
      score: evaluation.structure_score,
      source: 'Transcript Analysis',
      desc: 'Beginning, middle, and conclusion logic',
    },
    {
      name: 'Fluency',
      score: evaluation.fluency_score,
      source: 'Audio & Transcript',
      desc: 'Seamless speech flow and minimal fillers',
    },
    {
      name: 'Vocabulary',
      score: evaluation.vocabulary_score,
      source: 'Transcript Analysis',
      desc: 'Precision and diversity of word choice',
    },
    {
      name: 'Grammar',
      score: evaluation.grammar_score,
      source: 'Transcript Analysis',
      desc: 'Syntactic consistency and construction',
    },
    {
      name: 'Relevance',
      score: evaluation.relevance_score,
      source: 'Transcript Analysis',
      desc: 'Direct alignment to prompt topic',
    },
    {
      name: 'Confidence & Delivery',
      score: evaluation.confidence_score,
      source: 'Audio Acoustic Analysis',
      desc: 'Pacing, vocal steadiness, and dynamics',
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.dark.success;
    if (score >= 65) return Colors.dark.warning;
    return Colors.dark.danger;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Communication Dimensions</Text>
        <Text style={styles.subtitle}>7 measurable facets of spoken articulation</Text>
      </View>

      <View style={styles.list}>
        {dimensions.map((dim, i) => {
          const color = getScoreColor(dim.score);
          return (
            <View key={i} style={styles.dimRow}>
              <View style={styles.dimTopRow}>
                <View style={styles.dimLeft}>
                  <Text style={styles.dimName}>{dim.name}</Text>
                  <Text style={styles.dimSource}>{dim.source}</Text>
                </View>
                <View style={[styles.scoreBadge, { borderColor: color }]}>
                  <Text style={[styles.scoreValue, { color }]}>{dim.score}</Text>
                </View>
              </View>

              {/* Progress track */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(dim.score, 100)}%`,
                      backgroundColor: color,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginVertical: Spacing.three,
  },
  header: {
    marginBottom: Spacing.four,
  },
  title: {
    ...Typography.titleMedium,
    color: Colors.dark.text,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  list: {
    gap: Spacing.four,
  },
  dimRow: {
    gap: Spacing.two,
  },
  dimTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dimLeft: {
    flex: 1,
  },
  dimName: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  dimSource: {
    ...Typography.labelSmall,
    color: Colors.dark.textMuted,
    marginTop: 1,
  },
  scoreBadge: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  scoreValue: {
    ...Typography.bodyMedium,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
});

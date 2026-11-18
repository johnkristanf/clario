import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface FeedbackCardProps {
  strengths: string[];
  improvements: string[];
  suggestedFramework?: string | null;
  frameworkAdvice?: string | null;
  comparisonToPrevious?: string | null;
}

export function FeedbackCard({
  strengths,
  improvements,
  suggestedFramework,
  frameworkAdvice,
  comparisonToPrevious,
}: FeedbackCardProps) {
  return (
    <View style={styles.container}>
      {/* Longitudinal Comparison Banner (if available) */}
      {comparisonToPrevious && (
        <View style={styles.comparisonBanner}>
          <Text style={styles.comparisonIcon}>📈</Text>
          <Text style={styles.comparisonText}>{comparisonToPrevious}</Text>
        </View>
      )}

      {/* What You Did Well */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.indicatorDot, { backgroundColor: Colors.dark.success }]} />
          <Text style={styles.sectionTitle}>What You Did Well</Text>
        </View>
        <View style={styles.bulletList}>
          {strengths.map((item, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Areas to Improve */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={[styles.indicatorDot, { backgroundColor: Colors.dark.warning }]} />
          <Text style={styles.sectionTitle}>Areas to Improve</Text>
        </View>
        <View style={styles.bulletList}>
          {improvements.map((item, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <Text style={styles.warnIcon}>•</Text>
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Suggested Framework & Actionable Drill */}
      {suggestedFramework && (
        <View style={styles.frameworkCard}>
          <View style={styles.frameworkTag}>
            <Text style={styles.frameworkTagText}>COACHING FRAMEWORK</Text>
          </View>
          <Text style={styles.frameworkTitle}>{suggestedFramework}</Text>
          {frameworkAdvice ? (
            <Text style={styles.frameworkAdvice}>{frameworkAdvice}</Text>
          ) : (
            <Text style={styles.frameworkAdvice}>
              Structure ideas systematically: Lead with your core point, support with rationale and concrete examples, then reiterate firmly.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
    marginVertical: Spacing.three,
  },
  comparisonBanner: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: Colors.dark.accent,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  comparisonIcon: {
    fontSize: 20,
  },
  comparisonText: {
    ...Typography.bodyMedium,
    color: Colors.dark.text,
    flex: 1,
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    ...Typography.titleSmall,
    color: Colors.dark.text,
  },
  bulletList: {
    gap: Spacing.two,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  checkIcon: {
    color: Colors.dark.success,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  warnIcon: {
    color: Colors.dark.warning,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  bulletText: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    flex: 1,
    lineHeight: 22,
  },
  frameworkCard: {
    backgroundColor: Colors.dark.surfaceElevated,
    borderRadius: 16,
    padding: Spacing.five,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
  },
  frameworkTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.dark.surfaceHighlight,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: Spacing.two,
  },
  frameworkTagText: {
    ...Typography.labelSmall,
    color: Colors.dark.accent,
    fontSize: 10,
  },
  frameworkTitle: {
    ...Typography.titleMedium,
    color: Colors.dark.text,
    marginBottom: Spacing.two,
  },
  frameworkAdvice: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
});

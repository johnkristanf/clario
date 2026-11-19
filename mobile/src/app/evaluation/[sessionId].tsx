import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Play, Pause, Share2, Home, Sparkles, Activity, MessageSquare } from 'lucide-react-native';
import { Colors, Spacing, Typography, MinTouchTarget } from '@/constants/theme';
import { sessionsService } from '@/services/api';
import { PracticeSession, SpeechEvaluation } from '@/types';
import { audioService } from '@/services/audio';
import { AudioWaveform } from '@/components/AudioWaveform';
import { SynchronizedTranscript } from '@/components/SynchronizedTranscript';
import { DimensionScoreCard } from '@/components/DimensionScoreCard';
import { FeedbackCard } from '@/components/FeedbackCard';

export default function EvaluationScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [evaluation, setEvaluation] = useState<SpeechEvaluation | null>(null);
  const [loading, setLoading] = useState(true);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPositionSec, setAudioPositionSec] = useState(0);
  const [audioDurationSec, setAudioDurationSec] = useState(1);

  useEffect(() => {
    async function loadData() {
      if (!sessionId) return;
      try {
        setLoading(true);
        const data = await sessionsService.getSessionDetails(sessionId);
        setSession(data);
        if (data.evaluation) {
          setEvaluation(data.evaluation);
          setAudioDurationSec(Math.max(data.duration_seconds || 1, 1));
        }
      } catch (err) {
        console.error('Failed to load evaluation:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    return () => {
      audioService.stopSound();
    };
  }, [sessionId]);

  const togglePlayback = async () => {
    if (!session?.audio_url) return;

    if (isPlaying) {
      await audioService.pauseSound();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      // Resolve audio URI: handle local endpoint or remote Supabase URL
      const fullUrl = session.audio_url.startsWith('http')
        ? session.audio_url
        : `http://localhost:8000${session.audio_url}`;

      await audioService.playSound(fullUrl, (status) => {
        setAudioPositionSec(status.positionMillis / 1000);
        setAudioDurationSec(status.durationMillis / 1000);
        if (status.didJustFinish) {
          setIsPlaying(false);
          setAudioPositionSec(0);
        }
      });
    }
  };

  const handleSeek = async (targetSec: number) => {
    setAudioPositionSec(targetSec);
    await audioService.seekSound(targetSec * 1000);
  };

  const handleWordClick = async (timestampSec: number) => {
    if (!isPlaying) {
      await togglePlayback();
    }
    await handleSeek(timestampSec);
  };

  const handleShare = async () => {
    if (!evaluation) return;
    try {
      await Share.share({
        message: `I just practiced my speech articulation on Clario and scored ${evaluation.overall_score}/100! Clarity: ${evaluation.clarity_score}%, Structure: ${evaluation.structure_score}%.`,
      });
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.dark.text} />
        <Text style={styles.loadingText}>Loading speech evaluation...</Text>
      </View>
    );
  }

  if (!evaluation) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorTitle}>Evaluation Not Found</Text>
        <TouchableOpacity style={styles.homeButton} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.homeButtonText}>Back to Daily Challenge</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return Colors.dark.success;
    if (score >= 65) return Colors.dark.warning;
    return Colors.dark.danger;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Summary Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Text style={styles.overallScoreLabel}>OVERALL ARTICULATION</Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.overallScoreValue, { color: getScoreColor(evaluation.overall_score) }]}>
                {evaluation.overall_score}
              </Text>
              <Text style={styles.scoreMax}>/100</Text>
            </View>
            <Text style={styles.heroSummary}>
              {evaluation.overall_score >= 80
                ? 'Excellent articulate delivery with high structural clarity.'
                : evaluation.overall_score >= 65
                ? 'Solid foundational communication with targeted areas for refinement.'
                : 'Good practice round; focus on transition structure and pacing.'}
            </Text>
          </View>

          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
              <Share2 size={18} color={Colors.dark.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.replace('/(tabs)')}>
              <Home size={18} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Acoustic Summary Bar */}
        <View style={styles.acousticRow}>
          <View style={styles.acousticItem}>
            <Activity size={16} color={Colors.dark.accent} />
            <Text style={styles.acousticValue}>{evaluation.speaking_rate_wpm} WPM</Text>
            <Text style={styles.acousticLabel}>Speaking Pace</Text>
          </View>
          <View style={styles.acousticDivider} />
          <View style={styles.acousticItem}>
            <MessageSquare size={16} color={Colors.dark.warning} />
            <Text style={styles.acousticValue}>{evaluation.filler_words_count}</Text>
            <Text style={styles.acousticLabel}>Filler Words</Text>
          </View>
          <View style={styles.acousticDivider} />
          <View style={styles.acousticItem}>
            <Sparkles size={16} color={Colors.dark.success} />
            <Text style={styles.acousticValue}>{evaluation.pause_count}</Text>
            <Text style={styles.acousticLabel}>Pauses Detected</Text>
          </View>
        </View>

        {/* SECTION E: Audio Playback & Synchronized Transcript */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Recording Playback & Transcript</Text>
            <TouchableOpacity style={styles.playInlineButton} onPress={togglePlayback}>
              {isPlaying ? (
                <Pause size={16} color={Colors.dark.background} />
              ) : (
                <Play size={16} color={Colors.dark.background} />
              )}
              <Text style={styles.playInlineText}>{isPlaying ? 'Pause' : 'Play Speech'}</Text>
            </TouchableOpacity>
          </View>

          {/* Interactive Audio Waveform Scrubber */}
          <AudioWaveform
            currentPositionSec={audioPositionSec}
            totalDurationSec={audioDurationSec}
            isPlaying={isPlaying}
            onSeek={handleSeek}
          />

          {/* Synchronized Transcript with word highlighting & click-to-seek */}
          <SynchronizedTranscript
            transcript={evaluation.transcript}
            wordTimings={evaluation.word_timings}
            pauses={evaluation.pauses}
            currentAudioPositionSec={audioPositionSec}
            onWordClick={handleWordClick}
          />
        </View>

        {/* SECTION C: 7 Communication Dimensions Breakdown */}
        <DimensionScoreCard evaluation={evaluation} />

        {/* Structured AI Feedback & Coaching */}
        <FeedbackCard
          strengths={evaluation.strengths}
          improvements={evaluation.improvements}
          suggestedFramework={evaluation.suggested_framework}
          frameworkAdvice={evaluation.framework_advice}
          comparisonToPrevious={evaluation.comparison_to_previous}
        />

        {/* Return Button */}
        <TouchableOpacity
          style={styles.doneButton}
          activeOpacity={0.8}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.doneButtonText}>Finish Review</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.ten,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  loadingText: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.three,
  },
  errorTitle: {
    ...Typography.titleMedium,
    color: Colors.dark.text,
    marginBottom: Spacing.four,
  },
  homeButton: {
    backgroundColor: Colors.dark.text,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 2,
    borderRadius: 12,
  },
  homeButtonText: {
    ...Typography.bodyMedium,
    color: Colors.dark.background,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: Spacing.five,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  heroLeft: {
    flex: 1,
    paddingRight: Spacing.three,
  },
  overallScoreLabel: {
    ...Typography.labelSmall,
    color: Colors.dark.accent,
    letterSpacing: 1,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  overallScoreValue: {
    fontSize: 52,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  scoreMax: {
    fontSize: 20,
    color: Colors.dark.textMuted,
    marginLeft: 4,
    fontWeight: '600',
  },
  heroSummary: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
    lineHeight: 18,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acousticRow: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  acousticItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  acousticDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.dark.surfaceHighlight,
  },
  acousticValue: {
    ...Typography.titleSmall,
    color: Colors.dark.text,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
  acousticLabel: {
    ...Typography.labelSmall,
    color: Colors.dark.textSecondary,
    fontSize: 10,
  },
  sectionContainer: {
    marginVertical: Spacing.two,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  sectionTitle: {
    ...Typography.titleMedium,
    color: Colors.dark.text,
  },
  playInlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.dark.text,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 16,
  },
  playInlineText: {
    ...Typography.labelSmall,
    color: Colors.dark.background,
    fontWeight: '700',
  },
  doneButton: {
    backgroundColor: Colors.dark.text,
    height: MinTouchTarget + 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.five,
  },
  doneButtonText: {
    ...Typography.titleSmall,
    color: Colors.dark.background,
    fontWeight: '700',
  },
});

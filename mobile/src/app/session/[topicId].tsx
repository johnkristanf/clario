import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Mic, Square, Play, Pause, RotateCcw, ArrowRight, Sparkles, CheckCircle } from 'lucide-react-native';
import { Colors, Spacing, Typography, MinTouchTarget } from '@/constants/theme';
import { audioService } from '@/services/audio';
import { sessionsService, evaluationsService } from '@/services/api';
import { getOrCreateUserId } from '@/services/supabase';
import { LiveWaveform } from '@/components/LiveWaveform';
import { AudioWaveform } from '@/components/AudioWaveform';

type Stage = 'prep' | 'speaking' | 'review' | 'processing';

export default function SessionScreen() {
  const params = useLocalSearchParams<{
    topicId: string;
    title: string;
    prompt: string;
    category: string;
    difficulty: string;
    prepSeconds?: string;
    speakingSeconds?: string;
    framework?: string;
  }>();

  const prepLimit = parseInt(params.prepSeconds || '30', 10);
  const speakingLimit = parseInt(params.speakingSeconds || '120', 10);

  const [stage, setStage] = useState<Stage>('prep');
  const [prepTimeLeft, setPrepTimeLeft] = useState(prepLimit);
  const [speakingTimeLeft, setSpeakingTimeLeft] = useState(speakingLimit);
  const [meteringLevels, setMeteringLevels] = useState<number[]>([]);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);

  // Playback state during review
  const [isPlayingReview, setIsPlayingReview] = useState(false);
  const [reviewPositionSec, setReviewPositionSec] = useState(0);
  const [reviewDurationSec, setReviewDurationSec] = useState(1);

  // Processing state
  const [processStageMessage, setProcessStageMessage] = useState('Uploading recording...');
  const [processProgress, setProcessProgress] = useState(10);

  const prepIntervalRef = useRef<any>(null);
  const speakingIntervalRef = useRef<any>(null);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
      if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
      audioService.stopRecording().catch(() => {});
      audioService.stopSound();
    };
  }, []);

  // 1. Preparation Countdown
  useEffect(() => {
    if (stage === 'prep') {
      prepIntervalRef.current = setInterval(() => {
        setPrepTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(prepIntervalRef.current);
            startSpeakingSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
      };
    }
  }, [stage]);

  // Transition from Prep to Speaking
  const startSpeakingSession = async () => {
    if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);

    const hasPermission = await audioService.requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Microphone Permission Required',
        'Clario needs microphone access to record and analyze your articulation practice.'
      );
      router.back();
      return;
    }

    setStage('speaking');
    setSpeakingTimeLeft(speakingLimit);

    try {
      await audioService.startRecording((state) => {
        setMeteringLevels(state.meteringLevels);
      });

      // 2-minute timer
      speakingIntervalRef.current = setInterval(() => {
        setSpeakingTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(speakingIntervalRef.current);
            finishSpeakingSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Recording Error', 'Unable to initialize microphone. Please check settings.');
      router.back();
    }
  };

  // Finish speaking early or on timer end
  const finishSpeakingSession = async () => {
    if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);

    try {
      const uri = await audioService.stopRecording();
      if (uri) {
        setRecordedUri(uri);
        const recordedDur = speakingLimit - speakingTimeLeft;
        setReviewDurationSec(Math.max(recordedDur, 1));
        setStage('review');
      } else {
        Alert.alert('Error', 'No recording data captured. Try again.');
        router.back();
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
      Alert.alert('Error', 'Failed to save recording.');
      router.back();
    }
  };

  // Play / Pause Review Audio
  const togglePlayReview = async () => {
    if (!recordedUri) return;

    if (isPlayingReview) {
      await audioService.pauseSound();
      setIsPlayingReview(false);
    } else {
      setIsPlayingReview(true);
      await audioService.playSound(recordedUri, (status) => {
        setReviewPositionSec(status.positionMillis / 1000);
        setReviewDurationSec(status.durationMillis / 1000);
        if (status.didJustFinish) {
          setIsPlayingReview(false);
          setReviewPositionSec(0);
        }
      });
    }
  };

  const handleReviewSeek = async (targetSec: number) => {
    setReviewPositionSec(targetSec);
    await audioService.seekSound(targetSec * 1000);
  };

  // Re-record
  const handleReRecord = async () => {
    await audioService.stopSound();
    setIsPlayingReview(false);
    setRecordedUri(null);
    setPrepTimeLeft(prepLimit);
    setStage('prep');
  };

  // Submit recording for AI evaluation
  const handleSubmitEvaluation = async () => {
    if (!recordedUri) return;
    await audioService.stopSound();
    setStage('processing');

    try {
      const userId = await getOrCreateUserId();
      const topicId = params.topicId ? parseInt(params.topicId, 10) : undefined;

      setProcessStageMessage('Uploading audio to Clario server...');
      setProcessProgress(20);

      const uploadRes = await sessionsService.uploadSpeechSession(recordedUri, userId, topicId);
      const sessionId = uploadRes.session_id;

      // Poll asynchronous evaluation status
      await evaluationsService.pollEvaluationStatus(sessionId, (status) => {
        if (status.stage === 'transcribing') {
          setProcessStageMessage('Transcribing speech and detecting filler words with Deepgram...');
          setProcessProgress(50);
        } else if (status.stage === 'analyzing_acoustics') {
          setProcessStageMessage('Analyzing acoustic properties, pauses, and volume with Librosa...');
          setProcessProgress(70);
        } else if (status.stage === 'evaluating') {
          setProcessStageMessage('Scoring 7 articulation dimensions and coaching tips with AI...');
          setProcessProgress(90);
        }
      });

      setProcessStageMessage('Evaluation complete!');
      setProcessProgress(100);

      // Navigate to evaluation screen
      router.replace({
        pathname: '/evaluation/[sessionId]',
        params: { sessionId },
      });
    } catch (err: any) {
      console.error('Evaluation pipeline failed:', err);
      Alert.alert(
        'Evaluation Error',
        err.message || 'Something went wrong during speech analysis. Please try again.',
        [{ text: 'OK', onPress: () => setStage('review') }]
      );
    }
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Topic Context Card */}
        <View style={styles.topicCard}>
          <View style={styles.badgeRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{(params.category || 'Challenge').toUpperCase()}</Text>
            </View>
            <Text style={styles.difficultyText}>{params.difficulty || 'Intermediate'}</Text>
          </View>
          <Text style={styles.topicTitle}>{params.title}</Text>
          <Text style={styles.topicPrompt}>"{params.prompt}"</Text>

          {params.framework && (
            <View style={styles.frameworkBar}>
              <Sparkles size={14} color={Colors.dark.accent} />
              <Text style={styles.frameworkText}>Framework: {params.framework}</Text>
            </View>
          )}
        </View>

        {/* STAGE 1: PREPARATION COUNTDOWN */}
        {stage === 'prep' && (
          <View style={styles.stageContainer}>
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownNumber}>{prepTimeLeft}</Text>
              <Text style={styles.countdownLabel}>SECONDS TO PREPARE</Text>
            </View>

            <Text style={styles.stageInstruction}>
              Structure your main point, reason, and supporting example before you speak.
            </Text>

            <TouchableOpacity
              style={styles.primaryActionButton}
              activeOpacity={0.8}
              onPress={startSpeakingSession}
            >
              <Mic size={20} color={Colors.dark.background} />
              <Text style={styles.primaryActionText}>Start Speaking Now</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STAGE 2: LIVE SPEAKING SESSION */}
        {stage === 'speaking' && (
          <View style={styles.stageContainer}>
            <View style={styles.recordingBanner}>
              <View style={styles.pulsingDot} />
              <Text style={styles.recordingBannerText}>RECORDING ACTIVE</Text>
            </View>

            <Text style={styles.speakingTimerText}>{formatTimer(speakingTimeLeft)}</Text>
            <Text style={styles.speakingTimerSub}>TIME REMAINING</Text>

            {/* Live Audio Amplitude Waveform */}
            <LiveWaveform meteringLevels={meteringLevels} isRecording={true} />

            <TouchableOpacity
              style={[styles.primaryActionButton, styles.stopButton]}
              activeOpacity={0.8}
              onPress={finishSpeakingSession}
            >
              <Square size={18} color="#ffffff" fill="#ffffff" />
              <Text style={[styles.primaryActionText, { color: '#ffffff' }]}>Finish Early</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STAGE 3: REVIEW RECORDING */}
        {stage === 'review' && (
          <View style={styles.stageContainer}>
            <View style={styles.reviewHeader}>
              <CheckCircle size={22} color={Colors.dark.success} />
              <Text style={styles.reviewTitle}>Session Completed!</Text>
            </View>

            <Text style={styles.reviewSubtitle}>
              Listen to your response or submit for detailed 7-dimension AI evaluation.
            </Text>

            {/* Waveform Player */}
            <AudioWaveform
              currentPositionSec={reviewPositionSec}
              totalDurationSec={reviewDurationSec}
              isPlaying={isPlayingReview}
              onSeek={handleReviewSeek}
            />

            {/* Play/Pause Button */}
            <TouchableOpacity style={styles.playButton} onPress={togglePlayReview}>
              {isPlayingReview ? (
                <Pause size={24} color={Colors.dark.background} />
              ) : (
                <Play size={24} color={Colors.dark.background} />
              )}
            </TouchableOpacity>

            <View style={styles.reviewActionsRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleReRecord}>
                <RotateCcw size={16} color={Colors.dark.textSecondary} />
                <Text style={styles.secondaryButtonText}>Re-record</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitButton} onPress={handleSubmitEvaluation}>
                <Text style={styles.submitButtonText}>Submit for Evaluation</Text>
                <ArrowRight size={16} color={Colors.dark.background} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STAGE 4: PROCESSING OVERLAY */}
        {stage === 'processing' && (
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={Colors.dark.text} />
            <Text style={styles.processingTitle}>Evaluating Articulation</Text>
            <Text style={styles.processingStage}>{processStageMessage}</Text>

            <View style={styles.processingTrack}>
              <View style={[styles.processingFill, { width: `${processProgress}%` }]} />
            </View>
            <Text style={styles.processingNote}>
              Deepgram STT • Librosa Acoustics • OpenAI Dimensions
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: Spacing.eight,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  topicCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 18,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.five,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  categoryBadge: {
    backgroundColor: Colors.dark.surfaceHighlight,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    ...Typography.labelSmall,
    color: Colors.dark.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  difficultyText: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
  },
  topicTitle: {
    ...Typography.titleLarge,
    color: Colors.dark.text,
    marginBottom: 6,
  },
  topicPrompt: {
    ...Typography.bodyLarge,
    color: Colors.dark.textSecondary,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: Spacing.three,
  },
  frameworkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 8,
  },
  frameworkText: {
    ...Typography.bodySmall,
    color: Colors.dark.accent,
    fontWeight: '600',
  },
  stageContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
  },
  countdownCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: Colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surface,
    marginVertical: Spacing.four,
  },
  countdownNumber: {
    fontSize: 54,
    fontWeight: '800',
    color: Colors.dark.text,
    fontVariant: ['tabular-nums'],
  },
  countdownLabel: {
    ...Typography.labelSmall,
    color: Colors.dark.textSecondary,
    fontSize: 9,
  },
  stageInstruction: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.six,
    paddingHorizontal: Spacing.four,
    lineHeight: 22,
  },
  primaryActionButton: {
    backgroundColor: Colors.dark.text,
    height: MinTouchTarget + 6,
    paddingHorizontal: Spacing.six,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    width: '100%',
  },
  primaryActionText: {
    ...Typography.titleSmall,
    color: Colors.dark.background,
    fontWeight: '700',
  },
  recordingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.recording,
    marginBottom: Spacing.four,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.recording,
  },
  recordingBannerText: {
    ...Typography.labelSmall,
    color: Colors.dark.recording,
    fontWeight: '700',
  },
  speakingTimerText: {
    fontSize: 64,
    fontWeight: '800',
    color: Colors.dark.text,
    fontVariant: ['tabular-nums'],
  },
  speakingTimerSub: {
    ...Typography.labelSmall,
    color: Colors.dark.textSecondary,
    marginTop: -4,
    marginBottom: Spacing.two,
  },
  stopButton: {
    backgroundColor: Colors.dark.recording,
    marginTop: Spacing.four,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  reviewTitle: {
    ...Typography.titleLarge,
    color: Colors.dark.text,
  },
  reviewSubtitle: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.text,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: Spacing.three,
  },
  reviewActionsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    width: '100%',
    marginTop: Spacing.three,
  },
  secondaryButton: {
    flex: 1,
    height: MinTouchTarget + 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    backgroundColor: Colors.dark.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryButtonText: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    height: MinTouchTarget + 4,
    borderRadius: 14,
    backgroundColor: Colors.dark.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonText: {
    ...Typography.bodyMedium,
    color: Colors.dark.background,
    fontWeight: '700',
  },
  processingCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: Spacing.six,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    marginVertical: Spacing.four,
  },
  processingTitle: {
    ...Typography.titleMedium,
    color: Colors.dark.text,
    marginTop: Spacing.four,
    marginBottom: 4,
  },
  processingStage: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.five,
  },
  processingTrack: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.dark.surfaceHighlight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  processingFill: {
    height: '100%',
    backgroundColor: Colors.dark.accent,
    borderRadius: 4,
  },
  processingNote: {
    ...Typography.labelSmall,
    color: Colors.dark.textMuted,
    fontSize: 10,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { WordTiming, PauseInterval } from '@/types';

interface SynchronizedTranscriptProps {
  transcript: string;
  wordTimings: WordTiming[];
  pauses?: PauseInterval[];
  currentAudioPositionSec: number;
  onWordClick: (timestampSec: number) => void;
}

export function SynchronizedTranscript({
  transcript,
  wordTimings,
  pauses = [],
  currentAudioPositionSec,
  onWordClick,
}: SynchronizedTranscriptProps) {
  const [highlightFillers, setHighlightFillers] = useState(true);
  const [highlightPauses, setHighlightPauses] = useState(true);
  const [highlightRepeated, setHighlightRepeated] = useState(true);

  // Group items by timestamps (words and pauses)
  const combinedItems = React.useMemo(() => {
    type TimelineItem =
      | { type: 'word'; data: WordTiming; start: number }
      | { type: 'pause'; data: PauseInterval; start: number };

    const items: TimelineItem[] = [];

    wordTimings.forEach((w) => {
      items.push({ type: 'word', data: w, start: w.start });
    });

    if (highlightPauses) {
      pauses.forEach((p) => {
        if (p.duration >= 0.8) {
          items.push({ type: 'pause', data: p, start: p.start });
        }
      });
    }

    items.sort((a, b) => a.start - b.start);
    return items;
  }, [wordTimings, pauses, highlightPauses]);

  return (
    <View style={styles.container}>
      {/* Filter / Toggle Chips */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          onPress={() => setHighlightFillers(!highlightFillers)}
          style={[styles.filterChip, highlightFillers && styles.filterChipActiveWarning]}
        >
          <Text
            style={[
              styles.filterChipText,
              highlightFillers ? styles.filterChipTextWarning : styles.filterChipTextInactive,
            ]}
          >
            Filler Words
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setHighlightPauses(!highlightPauses)}
          style={[styles.filterChip, highlightPauses && styles.filterChipActiveSecondary]}
        >
          <Text
            style={[
              styles.filterChipText,
              highlightPauses ? styles.filterChipTextSecondary : styles.filterChipTextInactive,
            ]}
          >
            Pauses & Silences
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setHighlightRepeated(!highlightRepeated)}
          style={[styles.filterChip, highlightRepeated && styles.filterChipActiveRose]}
        >
          <Text
            style={[
              styles.filterChipText,
              highlightRepeated ? styles.filterChipTextRose : styles.filterChipTextInactive,
            ]}
          >
            Repetitions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Synchronized Word Stream */}
      <View style={styles.transcriptCard}>
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.textContainer}>
          {combinedItems.length === 0 ? (
            <Text style={styles.plainText}>{transcript || 'No transcript generated.'}</Text>
          ) : (
            combinedItems.map((item, idx) => {
              if (item.type === 'pause') {
                return (
                  <View key={`pause-${idx}`} style={styles.pausePill}>
                    <Text style={styles.pauseText}>⏸ {item.data.duration.toFixed(1)}s pause</Text>
                  </View>
                );
              }

              const w = item.data;
              const isCurrentlyPlaying =
                currentAudioPositionSec >= w.start && currentAudioPositionSec <= w.end + 0.15;
              const isFiller = highlightFillers && w.is_filler;
              const isRepeated = highlightRepeated && w.is_repeated;

              return (
                <TouchableOpacity
                  key={`w-${idx}`}
                  activeOpacity={0.6}
                  onPress={() => onWordClick(w.start)}
                  style={[
                    styles.wordTouchable,
                    isCurrentlyPlaying && styles.wordPlaying,
                    isFiller && styles.wordFiller,
                    isRepeated && styles.wordRepeated,
                  ]}
                >
                  <Text
                    style={[
                      styles.wordText,
                      isCurrentlyPlaying && styles.wordTextPlaying,
                      isFiller && styles.wordTextFiller,
                      isRepeated && styles.wordTextRepeated,
                    ]}
                  >
                    {w.punctuated_word}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
      <Text style={styles.hintText}>Tap any word to jump audio playback to that moment</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.four,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    backgroundColor: Colors.dark.surface,
  },
  filterChipActiveWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: Colors.dark.warning,
  },
  filterChipActiveSecondary: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: Colors.dark.accent,
  },
  filterChipActiveRose: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderColor: Colors.dark.danger,
  },
  filterChipText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  filterChipTextInactive: {
    color: Colors.dark.textMuted,
  },
  filterChipTextWarning: {
    color: Colors.dark.warning,
  },
  filterChipTextSecondary: {
    color: Colors.dark.accent,
  },
  filterChipTextRose: {
    color: Colors.dark.danger,
  },
  transcriptCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    padding: Spacing.four,
    minHeight: 180,
    maxHeight: 280,
  },
  scrollArea: {
    flex: 1,
  },
  textContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  plainText: {
    ...Typography.bodyLarge,
    color: Colors.dark.text,
    lineHeight: 26,
  },
  wordTouchable: {
    paddingHorizontal: 3,
    paddingVertical: 2,
    borderRadius: 4,
  },
  wordPlaying: {
    backgroundColor: Colors.dark.text,
  },
  wordFiller: {
    backgroundColor: 'rgba(245, 158, 11, 0.25)',
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.dark.warning,
  },
  wordRepeated: {
    backgroundColor: 'rgba(244, 63, 94, 0.2)',
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.dark.danger,
  },
  wordText: {
    ...Typography.bodyLarge,
    color: Colors.dark.text,
  },
  wordTextPlaying: {
    color: Colors.dark.background,
    fontWeight: '700',
  },
  wordTextFiller: {
    color: '#fcd34d',
  },
  wordTextRepeated: {
    color: '#fda4af',
  },
  pausePill: {
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginHorizontal: 3,
  },
  pauseText: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
    fontSize: 11,
  },
  hintText: {
    ...Typography.bodySmall,
    color: Colors.dark.textMuted,
    marginTop: Spacing.two,
    textAlign: 'center',
  },
});

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface AudioWaveformProps {
  currentPositionSec: number;
  totalDurationSec: number;
  isPlaying: boolean;
  onSeek: (positionSec: number) => void;
  waveformData?: number[];
}

export function AudioWaveform({
  currentPositionSec,
  totalDurationSec,
  isPlaying,
  onSeek,
  waveformData,
}: AudioWaveformProps) {
  // Generate 36 realistic waveform heights if not provided
  const bars = React.useMemo(() => {
    if (waveformData && waveformData.length > 0) return waveformData;
    const defaultBars = [
      0.3, 0.45, 0.2, 0.6, 0.85, 0.7, 0.4, 0.9, 0.95, 0.65,
      0.3, 0.5, 0.75, 0.8, 0.4, 0.25, 0.7, 0.85, 0.9, 0.6,
      0.45, 0.35, 0.7, 0.8, 0.95, 0.5, 0.4, 0.65, 0.8, 0.6,
      0.4, 0.3, 0.5, 0.7, 0.4, 0.25
    ];
    return defaultBars;
  }, [waveformData]);

  const progressRatio = totalDurationSec > 0 ? Math.min(Math.max(currentPositionSec / totalDurationSec, 0), 1) : 0;
  const activeBarIndex = Math.floor(progressRatio * bars.length);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={styles.container}>
      {/* Bars visualization */}
      <View style={styles.barsContainer}>
        {bars.map((heightFactor, index) => {
          const isPassed = index <= activeBarIndex;
          const barHeight = Math.max(heightFactor * 42, 6);
          return (
            <TouchableOpacity
              key={index}
              activeOpacity={0.7}
              onPress={() => {
                const targetSec = (index / bars.length) * totalDurationSec;
                onSeek(targetSec);
              }}
              style={styles.barTouchArea}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: isPassed ? Colors.dark.accent : Colors.dark.surfaceHighlight,
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Time indicators */}
      <View style={styles.timeRow}>
        <Text style={styles.timeText}>{formatTime(currentPositionSec)}</Text>
        <Text style={styles.timeText}>{formatTime(totalDurationSec)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.surface,
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginVertical: Spacing.three,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: Spacing.one,
  },
  barTouchArea: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
  timeText: {
    ...Typography.labelSmall,
    color: Colors.dark.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});

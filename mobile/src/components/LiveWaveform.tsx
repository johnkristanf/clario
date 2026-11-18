import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface LiveWaveformProps {
  meteringLevels: number[];
  isRecording: boolean;
}

export function LiveWaveform({ meteringLevels, isRecording }: LiveWaveformProps) {
  // Take the most recent 28 levels or fallback
  const bars = React.useMemo(() => {
    if (!isRecording) {
      return Array(28).fill(0.1);
    }
    const recent = meteringLevels.slice(-28);
    while (recent.length < 28) {
      recent.unshift(0.08);
    }
    return recent;
  }, [meteringLevels, isRecording]);

  return (
    <View style={styles.container}>
      {bars.map((level, i) => {
        const height = Math.max(level * 64, 6);
        return (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height,
                backgroundColor: isRecording ? Colors.dark.accent : Colors.dark.surfaceHighlight,
                opacity: isRecording ? 0.4 + level * 0.6 : 0.2,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 72,
    gap: 4,
    marginVertical: 16,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});

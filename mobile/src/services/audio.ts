import { Audio } from 'expo-av';

export interface RecordingState {
  isRecording: boolean;
  durationMillis: number;
  meteringLevels: number[]; // Normalized 0-1 values for live waveform visualization
}

class AudioService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private meteringHistory: number[] = [];

  async requestPermissions(): Promise<boolean> {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      return granted;
    } catch {
      return false;
    }
  }

  async startRecording(onUpdate?: (state: RecordingState) => void): Promise<void> {
    await this.stopRecording();

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    this.meteringHistory = [];
    const recording = new Audio.Recording();

    await recording.prepareToRecordAsync({
      ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    });

    recording.setOnRecordingStatusUpdate((status) => {
      if (status.isRecording) {
        // Metering in dBFS (-160 to 0). Normalize to 0.05 - 1.0 for visual bars
        const meter = status.metering ?? -60;
        const normalized = Math.min(Math.max((meter + 60) / 60, 0.05), 1.0);
        this.meteringHistory.push(normalized);
        if (this.meteringHistory.length > 50) {
          this.meteringHistory.shift();
        }

        if (onUpdate) {
          onUpdate({
            isRecording: true,
            durationMillis: status.durationMillis,
            meteringLevels: [...this.meteringHistory],
          });
        }
      }
    });

    this.recording = recording;
    await recording.startAsync();
  }

  async stopRecording(): Promise<string | null> {
    if (!this.recording) return null;

    try {
      const status = await this.recording.getStatusAsync();
      if (status.isRecording) {
        await this.recording.stopAndUnloadAsync();
      }
      const uri = this.recording.getURI();
      this.recording = null;
      return uri;
    } catch (e) {
      console.warn('Error stopping recording:', e);
      this.recording = null;
      return null;
    }
  }

  async playSound(
    uri: string,
    onStatusUpdate?: (status: {
      positionMillis: number;
      durationMillis: number;
      isPlaying: boolean;
      didJustFinish: boolean;
    }) => void
  ): Promise<Audio.Sound> {
    await this.stopSound();

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri },
      { shouldPlay: true, progressUpdateIntervalMillis: 100 },
      (status) => {
        if (status.isLoaded && onStatusUpdate) {
          onStatusUpdate({
            positionMillis: status.positionMillis,
            durationMillis: status.durationMillis || 1,
            isPlaying: status.isPlaying,
            didJustFinish: status.didJustFinish,
          });
        }
      }
    );

    this.sound = sound;
    return sound;
  }

  async pauseSound(): Promise<void> {
    if (this.sound) {
      await this.sound.pauseAsync();
    }
  }

  async resumeSound(): Promise<void> {
    if (this.sound) {
      await this.sound.playAsync();
    }
  }

  async seekSound(positionMillis: number): Promise<void> {
    if (this.sound) {
      await this.sound.setPositionAsync(positionMillis);
    }
  }

  async stopSound(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch {
        // ignore
      }
      this.sound = null;
    }
  }
}

export const audioService = new AudioService();

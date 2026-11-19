import {
  createAudioPlayer,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  RecordingPresets,
} from 'expo-audio';
import AudioModule from 'expo-audio/build/AudioModule';
import type { AudioPlayer, AudioRecorder } from 'expo-audio/build/AudioModule.types';

export interface RecordingState {
  isRecording: boolean;
  durationMillis: number;
  meteringLevels: number[]; // Normalized 0-1 values for live waveform visualization
}

class AudioService {
  private recorder: AudioRecorder | null = null;
  private player: AudioPlayer | null = null;
  private meteringHistory: number[] = [];
  private meteringInterval: ReturnType<typeof setInterval> | null = null;
  private recordingSubscription: { remove(): void } | null = null;
  private playerSubscription: { remove(): void } | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      return granted;
    } catch {
      return false;
    }
  }

  async startRecording(onUpdate?: (state: RecordingState) => void): Promise<void> {
    await this.stopRecording();

    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

    this.meteringHistory = [];
    const recorder = new AudioModule.AudioRecorder({
      ...RecordingPresets.HIGH_QUALITY,
      isMeteringEnabled: true,
    });

    await recorder.prepareToRecordAsync();

    if (onUpdate) {
      // Poll getStatus() for live metering — recordingStatusUpdate only fires on finish/error
      this.meteringInterval = setInterval(() => {
        const state = recorder.getStatus();
        if (state.isRecording) {
          const meter = state.metering ?? -60;
          const normalized = Math.min(Math.max((meter + 60) / 60, 0.05), 1.0);
          this.meteringHistory.push(normalized);
          if (this.meteringHistory.length > 50) this.meteringHistory.shift();
          onUpdate({
            isRecording: true,
            durationMillis: state.durationMillis,
            meteringLevels: [...this.meteringHistory],
          });
        }
      }, 100);
    }

    this.recorder = recorder;
    recorder.record();
  }

  async stopRecording(): Promise<string | null> {
    if (this.meteringInterval) {
      clearInterval(this.meteringInterval);
      this.meteringInterval = null;
    }
    this.recordingSubscription?.remove();
    this.recordingSubscription = null;

    if (!this.recorder) return null;

    try {
      await this.recorder.stop();
      const uri = this.recorder.uri;
      this.recorder = null;
      return uri;
    } catch (e) {
      console.warn('Error stopping recording:', e);
      this.recorder = null;
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
  ): Promise<AudioPlayer> {
    await this.stopSound();

    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });

    const player = createAudioPlayer({ uri }, { updateInterval: 100 });

    if (onStatusUpdate) {
      this.playerSubscription = player.addListener('playbackStatusUpdate', (status) => {
        onStatusUpdate({
          positionMillis: status.currentTime * 1000,
          durationMillis: (status.duration || 0) * 1000 || 1,
          isPlaying: status.playing,
          didJustFinish: status.didJustFinish,
        });
      });
    }

    player.play();
    this.player = player;
    return player;
  }

  pauseSound(): void {
    this.player?.pause();
  }

  resumeSound(): void {
    this.player?.play();
  }

  async seekSound(positionMillis: number): Promise<void> {
    await this.player?.seekTo(positionMillis / 1000);
  }

  stopSound(): void {
    this.playerSubscription?.remove();
    this.playerSubscription = null;
    if (this.player) {
      this.player.pause();
      this.player.release();
      this.player = null;
    }
  }
}

export const audioService = new AudioService();

import { Topic } from './topics';
import { SpeechEvaluation } from './evaluations';

export interface PracticeSession {
  id: string;
  user_id: string;
  topic_id: number | null;
  audio_url: string;
  duration_seconds: number;
  status: 'processing' | 'completed' | 'failed';
  error_message: string | null;
  created_at: string;
  topic?: Topic | null;
  evaluation?: SpeechEvaluation | null;
}

export interface UserProgressionDimension {
  dimension: string;
  current_average: number;
  initial_average: number;
  change: number;
}

export interface UserHistory {
  user_id: string;
  total_sessions: number;
  streak_days: number;
  dimension_progression: UserProgressionDimension[];
  persistent_weaknesses: string[];
  recent_sessions: PracticeSession[];
}

export interface UploadSpeechSessionResponse {
  session_id: string;
  status: string;
  audio_url: string;
}

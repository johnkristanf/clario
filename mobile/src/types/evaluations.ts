export interface WordTiming {
  word: string;
  punctuated_word: string;
  start: number;
  end: number;
  is_filler: boolean;
  is_repeated: boolean;
}

export interface PauseInterval {
  start: number;
  end: number;
  duration: number;
}

export interface FillerWordStat {
  word: string;
  count: number;
  timestamps: number[];
}

export interface SpeechEvaluation {
  id: string;
  session_id: string;
  overall_score: number;
  clarity_score: number;
  structure_score: number;
  fluency_score: number;
  vocabulary_score: number;
  grammar_score: number;
  relevance_score: number;
  confidence_score: number;
  speaking_rate_wpm: number;
  pause_count: number;
  long_pauses_duration: number;
  filler_words_count: number;
  filler_words_list: FillerWordStat[];
  vocal_steadiness_score: number;
  volume_variation_score: number;
  transcript: string;
  word_timings: WordTiming[];
  pauses: PauseInterval[];
  strengths: string[];
  improvements: string[];
  suggested_framework: string | null;
  framework_advice: string | null;
  comparison_to_previous: string | null;
}

export interface EvaluationJobStatus {
  session_id: string;
  status: 'processing' | 'completed' | 'failed';
  stage: string | null;
  progress: number;
  error_message: string | null;
  evaluation: SpeechEvaluation | null;
}

export interface PollEvaluationOptions {
  onProgress?: (status: EvaluationJobStatus) => void;
  maxAttempts?: number;
  intervalMs?: number;
}

export type TopicDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Topic {
  id: number;
  category: string;
  title: string;
  prompt: string;
  difficulty: TopicDifficulty;
  prep_time_seconds: number;
  speaking_time_seconds: number;
  suggested_framework: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TopicCategory {
  name: string;
  description: string;
}

export interface DailyTopicParams {
  userId?: string;
  difficulty?: TopicDifficulty | string;
}

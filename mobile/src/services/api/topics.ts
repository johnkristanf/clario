import { BaseApiService } from './base';
import { Topic, TopicCategory, TopicDifficulty } from '@/types/topics';

export class TopicsService extends BaseApiService {
  async getDailyTopic(userId?: string, difficulty?: TopicDifficulty | string): Promise<Topic> {
    return this.get<Topic>('/topics/daily', {
      user_id: userId,
      difficulty,
    });
  }

  async getWeaknessFocusedTopic(userId: string): Promise<Topic> {
    return this.get<Topic>('/topics/weakness-focused', {
      user_id: userId,
    });
  }

  async getCategories(): Promise<TopicCategory[]> {
    return this.get<TopicCategory[]>('/topics/categories');
  }

  async getTopicById(topicId: number): Promise<Topic> {
    return this.get<Topic>(`/topics/${topicId}`);
  }
}

export const topicsService = new TopicsService();

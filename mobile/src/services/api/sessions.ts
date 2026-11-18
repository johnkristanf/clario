import { BaseApiService } from './base';
import {
  PracticeSession,
  UserHistory,
  UploadSpeechSessionResponse,
} from '@/types/sessions';

export class SessionsService extends BaseApiService {
  async uploadSpeechSession(
    audioUri: string,
    userId: string,
    topicId?: number
  ): Promise<UploadSpeechSessionResponse> {
    const formData = new FormData();
    const filename = audioUri.split('/').pop() || 'recording.m4a';

    formData.append('audio', {
      uri: audioUri,
      name: filename,
      type: 'audio/m4a',
    } as any);

    formData.append('user_id', userId);
    if (topicId !== undefined && topicId !== null) {
      formData.append('topic_id', topicId.toString());
    }

    return this.post<UploadSpeechSessionResponse>('/sessions/upload', formData);
  }

  async getSessionDetails(sessionId: string): Promise<PracticeSession> {
    return this.get<PracticeSession>(`/sessions/${encodeURIComponent(sessionId)}`);
  }

  async getUserHistory(userId: string): Promise<UserHistory> {
    return this.get<UserHistory>(`/sessions/user/${encodeURIComponent(userId)}/history`);
  }
}

export const sessionsService = new SessionsService();

import { BaseApiService, API_BASE } from './base';
import { AuthService, authService } from './auth';
import { TopicsService, topicsService } from './topics';
import { SessionsService, sessionsService } from './sessions';
import { EvaluationsService, evaluationsService } from './evaluations';

export * from './base';
export * from './auth';
export * from './topics';
export * from './sessions';
export * from './evaluations';
export * from '@/types';

export class ApiClient {
  public readonly auth: AuthService;
  public readonly topics: TopicsService;
  public readonly sessions: SessionsService;
  public readonly evaluations: EvaluationsService;

  constructor(baseUrl?: string) {
    this.auth = new AuthService(baseUrl);
    this.topics = new TopicsService(baseUrl);
    this.sessions = new SessionsService(baseUrl);
    this.evaluations = new EvaluationsService(baseUrl);
  }
}

export const api = new ApiClient();

/**
 * Backward-compatible Api facade object delegating to class-based service singletons.
 */
export const Api = {
  auth: authService,
  topics: topicsService,
  sessions: sessionsService,
  evaluations: evaluationsService,

  // Topics domain
  getDailyTopic: topicsService.getDailyTopic.bind(topicsService),
  getWeaknessFocusedTopic: topicsService.getWeaknessFocusedTopic.bind(topicsService),
  getCategories: topicsService.getCategories.bind(topicsService),

  // Sessions domain
  uploadSpeechSession: sessionsService.uploadSpeechSession.bind(sessionsService),
  getSessionDetails: sessionsService.getSessionDetails.bind(sessionsService),
  getUserHistory: sessionsService.getUserHistory.bind(sessionsService),

  // Evaluations domain
  pollEvaluationStatus: evaluationsService.pollEvaluationStatus.bind(evaluationsService),

  // Auth domain
  syncGoogleUser: authService.syncGoogleUser.bind(authService),
};

export default Api;

import { BaseApiService } from './base';
import {
  SpeechEvaluation,
  EvaluationJobStatus,
  PollEvaluationOptions,
} from '@/types/evaluations';

export class EvaluationsService extends BaseApiService {
  async getEvaluationStatus(sessionId: string): Promise<EvaluationJobStatus> {
    return this.get<EvaluationJobStatus>(`/evaluations/status/${encodeURIComponent(sessionId)}`);
  }

  async getEvaluation(sessionId: string): Promise<SpeechEvaluation> {
    return this.get<SpeechEvaluation>(`/evaluations/${encodeURIComponent(sessionId)}`);
  }

  async pollEvaluationStatus(
    sessionId: string,
    onProgressOrOptions?: ((status: EvaluationJobStatus) => void) | PollEvaluationOptions,
    maxAttempts = 40,
    intervalMs = 1500
  ): Promise<SpeechEvaluation> {
    const onProgress =
      typeof onProgressOrOptions === 'function'
        ? onProgressOrOptions
        : onProgressOrOptions?.onProgress;
    const resolvedAttempts =
      typeof onProgressOrOptions === 'object' && onProgressOrOptions?.maxAttempts !== undefined
        ? onProgressOrOptions.maxAttempts
        : maxAttempts;
    const resolvedInterval =
      typeof onProgressOrOptions === 'object' && onProgressOrOptions?.intervalMs !== undefined
        ? onProgressOrOptions.intervalMs
        : intervalMs;

    for (let i = 0; i < resolvedAttempts; i++) {
      try {
        const data = await this.getEvaluationStatus(sessionId);
        if (onProgress) {
          onProgress(data);
        }

        if (data.status === 'completed' && data.evaluation) {
          return data.evaluation;
        }
        if (data.status === 'failed') {
          throw new Error(data.error_message || 'Evaluation pipeline failed');
        }
      } catch (err: any) {
        if (err.message && !err.message.includes('Failed to fetch from /evaluations/status')) {
          throw err;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, resolvedInterval));
    }

    throw new Error('Timed out waiting for evaluation to finish');
  }
}

export const evaluationsService = new EvaluationsService();

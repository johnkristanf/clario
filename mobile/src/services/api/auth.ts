import { BaseApiService } from './base';
import { GoogleUserProfile, UserResponse } from '@/types/auth';

export class AuthService extends BaseApiService {
  async syncGoogleUser(profile: GoogleUserProfile): Promise<UserResponse | void> {
    return this.post<UserResponse>('/auth/google', profile);
  }

  async getMe(userId: string): Promise<UserResponse> {
    return this.get<UserResponse>(`/auth/me/${encodeURIComponent(userId)}`);
  }
}

export const authService = new AuthService();

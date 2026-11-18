export interface GoogleUserProfile {
  user_id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  access_token?: string;
}

export interface UserResponse {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  auth_provider: string;
  created_at?: string;
}

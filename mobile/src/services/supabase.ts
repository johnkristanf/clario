import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase URL & Publishable Key (safe for mobile/frontend clients)
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://clario-demo.supabase.co';

const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'public-anon-key-development';

// Security check: NEVER allow secret keys on client
if (
  __DEV__ &&
  (SUPABASE_PUBLISHABLE_KEY.startsWith('sbs_') ||
    SUPABASE_PUBLISHABLE_KEY.startsWith('sb_secret_'))
) {
  console.error(
    'CRITICAL SECURITY WARNING: Supabase Secret Key detected in mobile client bundle. Only Publishable Keys (sbp_...) are allowed on client.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

const GUEST_USER_KEY = '@clario_guest_user_id';

/**
 * Validates authenticated user via Supabase Auth server (best practice over unvalidated getSession).
 * Falls back to local session if offline, or guest device UUID if unauthenticated.
 */
export async function getOrCreateUserId(): Promise<string> {
  try {
    // 1. Authenticated check via getUser() (validates JWT with Supabase Auth server)
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (!userError && userData.user?.id) {
      return userData.user.id;
    }

    // 2. Offline fallback: check local session cache
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session?.user?.id) {
      return sessionData.session.user.id;
    }

    // 3. Unauthenticated guest: persistent device UUID
    const stored = await AsyncStorage.getItem(GUEST_USER_KEY);
    if (stored) {
      return stored;
    }

    const newId = 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    await AsyncStorage.setItem(GUEST_USER_KEY, newId);
    return newId;
  } catch {
    return 'usr_guest_default';
  }
}

/**
 * Returns active session access token for authenticated API requests.
 */
export async function getSupabaseAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

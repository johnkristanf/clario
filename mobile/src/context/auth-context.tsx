import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { Session, User } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from '@/services/supabase';
import { authService } from '@/services/api';

// Ensures any in-app browser auth session completes smoothly
WebBrowser.maybeCompleteAuthSession();

interface AuthState {
  user: User | null;
  session: Session | null;
  /** true while the initial session check is in-flight */
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync the authenticated user to the backend
  const syncUser = useCallback(async (s: Session) => {
    try {
      await authService.syncGoogleUser({
        user_id: s.user.id,
        email: s.user.email ?? undefined,
        full_name: s.user.user_metadata?.full_name ?? undefined,
        avatar_url: s.user.user_metadata?.avatar_url ?? undefined,
        access_token: s.access_token,
      });
    } catch {
      // non-fatal — backend may be unreachable in dev
    }
  }, []);

  useEffect(() => {
    // Configure Google Sign-In with Web Client ID if available
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    try {
      GoogleSignin.configure({
        scopes: ['email', 'profile'],
        webClientId: webClientId || undefined,
        iosClientId: iosClientId || undefined,
      });
    } catch (err) {
      console.warn('GoogleSignin.configure error:', err);
    }

    // Restore persisted session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsLoading(false);
    });

    // Subscribe to future auth changes (OAuth callback, sign-out, token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
      if (s) syncUser(s);
    });

    return () => sub.subscription.unsubscribe();
  }, [syncUser]);

  const signInWithGoogle = useCallback(async (): Promise<{ success: boolean; error: string | null }> => {
    try {
      // 1. Primary: Native Google Account Picker inside the app (Google Play Services / One Tap)
      try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const signinResult = await GoogleSignin.signIn();

        if (signinResult.data?.idToken) {
          const { data, error: idTokenError } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: signinResult.data.idToken,
          });

          if (idTokenError) throw idTokenError;

          if (data.session) {
            setSession(data.session);
            setUser(data.session.user);
            await syncUser(data.session);
            return { success: true, error: null };
          }
        }
      } catch (nativeErr: any) {
        if (nativeErr?.code === statusCodes.SIGN_IN_CANCELLED) {
          return { success: false, error: null };
        }
        if (nativeErr?.code === statusCodes.IN_PROGRESS) {
          return { success: false, error: 'Sign in is already in progress' };
        }
        console.warn('Native Google Sign-In bypassed or unavailable, trying In-App Session fallback:', nativeErr);
      }

      // 2. In-App Sheet Fallback: Uses an in-app overlay (not an external browser application)
      const redirectUrl = Linking.createURL('auth/callback');
      const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) return { success: false, error: oauthError.message };
      if (!oauthData?.url) return { success: false, error: 'Failed to retrieve authentication session URL' };

      // Open inside the app via system Custom Tab / ASWebAuthenticationSession
      const result = await WebBrowser.openAuthSessionAsync(oauthData.url, redirectUrl);

      if (result.type === 'success' && result.url) {
        // Parse token hash or search params from the redirect URL
        const parsedUrl = new URL(result.url);
        const params = new URLSearchParams(
          parsedUrl.hash ? parsedUrl.hash.replace(/^#/, '') : parsedUrl.search
        );
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) return { success: false, error: sessionError.message };

          if (sessionData.session) {
            setSession(sessionData.session);
            setUser(sessionData.session.user);
            await syncUser(sessionData.session);
            return { success: true, error: null };
          }
        }
      }

      return { success: false, error: null };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Google Sign-In failed' };
    }
  }, [syncUser]);

  const signOut = useCallback(async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // ignore
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

import { DarkTheme, ThemeProvider, Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { hasCompletedOnboarding } from '@/services/onboarding';

// Inner layout that has access to AuthContext
function RootNavigator() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function evaluateNavigation() {
      if (isLoading) return;

      const currentSegment = segments[0] as string | undefined;
      const inLogin = currentSegment === 'login';
      const inOnboarding = currentSegment === 'onboarding';

      if (!isAuthenticated) {
        if (!inLogin) {
          router.replace('/login');
        }
        if (isMounted) setIsReady(true);
      } else {
        // Authenticated: check if user has already completed welcome onboarding
        const completed = await hasCompletedOnboarding(user?.id);
        if (!isMounted) return;

        if (!completed) {
          if (!inOnboarding) {
            router.replace('/onboarding');
          }
        } else {
          // Already logged in before or onboarding finished: allow access to app tabs
          if (inLogin || inOnboarding) {
            router.replace('/(tabs)');
          }
        }
        setIsReady(true);
      }
    }

    evaluateNavigation();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isLoading, user?.id, segments]);

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: Colors.dark.background,
      card: Colors.dark.surface,
      text: Colors.dark.text,
      border: Colors.dark.border,
      primary: Colors.dark.accent,
    },
  };

  return (
    <ThemeProvider value={customDarkTheme}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.dark.background,
          },
          headerTintColor: Colors.dark.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: Colors.dark.background,
          },
        }}
      >
        {/* Auth gate */}
        <Stack.Screen name="login" options={{ headerShown: false }} />

        {/* First-time onboarding welcome walkthrough */}
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />

        {/* Main app */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="session/[topicId]"
          options={{
            title: 'Speaking Session',
            headerBackTitle: 'Cancel',
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="evaluation/[sessionId]"
          options={{
            title: 'Speech Evaluation',
            headerBackTitle: 'Home',
            presentation: 'card',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

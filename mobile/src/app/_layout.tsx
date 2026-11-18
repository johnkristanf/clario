import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
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

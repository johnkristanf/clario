import { Platform } from 'react-native';

export const Colors = {
  // Primary dark theme based on slate-950 and white
  dark: {
    background: '#020617', // slate-950
    surface: '#0f172a', // slate-900
    surfaceElevated: '#1e293b', // slate-800
    surfaceHighlight: '#334155', // slate-700
    backgroundElement: '#0f172a',
    border: '#1e293b',
    borderLight: '#334155',
    text: '#ffffff',
    textSecondary: '#94a3b8', // slate-400
    textMuted: '#64748b', // slate-500
    primary: '#ffffff',
    primaryInverse: '#020617',
    accent: '#38bdf8', // sky-400
    success: '#10b981', // emerald-500
    warning: '#f59e0b', // amber-500
    danger: '#f43f5e', // rose-500
    recording: '#ef4444', // red-500
    card: '#0f172a',
    tabBar: '#020617',
  },
  light: {
    background: '#ffffff',
    surface: '#f8fafc', // slate-50
    surfaceElevated: '#f1f5f9', // slate-100
    surfaceHighlight: '#e2e8f0', // slate-200
    backgroundElement: '#f8fafc',
    border: '#e2e8f0',
    borderLight: '#cbd5e1',
    text: '#020617', // slate-950
    textSecondary: '#475569', // slate-600
    textMuted: '#94a3b8', // slate-400
    primary: '#020617',
    primaryInverse: '#ffffff',
    accent: '#0284c7', // sky-600
    success: '#059669', // emerald-600
    warning: '#d97706', // amber-600
    danger: '#e11d48', // rose-600
    recording: '#dc2626', // red-600
    card: '#ffffff',
    tabBar: '#ffffff',
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;

export const Palette = Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
  nine: 48,
  ten: 64,
} as const;

export const Typography = {
  display: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  titleLarge: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  titleMedium: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600' as const,
  },
  titleSmall: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
};

export const MinTouchTarget = 48; // Android Material 48x48dp minimum
export const BottomTabInset = Platform.select({ ios: 60, android: 80 }) ?? 70;
export const MaxContentWidth = 640;

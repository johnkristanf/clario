import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Svg, { Path, G } from 'react-native-svg';
import { Colors, Spacing, Typography, MinTouchTarget } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COMPACT = SCREEN_HEIGHT < 700;

// ─── Official Google "G" mark in full brand colours ───────────────────────────
function GoogleIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G>
        {/* Blue — top of G */}
        <Path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        {/* Green — bottom */}
        <Path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        {/* Yellow — left */}
        <Path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        />
        {/* Red — top-left */}
        <Path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </G>
    </Svg>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  // Two-stage entrance: hero then CTA
  const heroAnim = useRef(new Animated.Value(0)).current;
  const heroY = useRef(new Animated.Value(12)).current;
  const ctaAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(heroY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.timing(ctaAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        Alert.alert('Sign-In Error', error);
      }
    } catch (err: any) {
      Alert.alert('Sign-In Error', err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <Animated.View
          style={[styles.hero, { opacity: heroAnim, transform: [{ translateY: heroY }] }]}
        >
          <View style={styles.iconWrapper}>
            <Image
              source={require('../../assets/images/clario-icon.png')}
              style={styles.icon}
              contentFit="contain"
              accessibilityLabel="Clario app icon"
            />
            <View style={styles.iconGlow} />
          </View>

          <Text style={styles.wordmark}>CLARIO</Text>
          <Text style={styles.tagline}>
            Speak with clarity and confidence{'\n'}through daily articulation practice.
          </Text>
        </Animated.View>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.cta, { opacity: ctaAnim }]}>
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.googleButtonBusy]}
            activeOpacity={0.82}
            onPress={handleGoogleSignIn}
            disabled={loading}
            accessibilityLabel="Continue with Google"
            accessibilityRole="button"
          >
            {loading ? (
              <ActivityIndicator color={Colors.dark.background} size="small" />
            ) : (
              <>
                <GoogleIcon size={20} />
                <Text style={styles.googleButtonLabel}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.legal}>
            By continuing you agree to our{' '}
            <Text style={styles.legalAccent}>Terms</Text>
            {' & '}
            <Text style={styles.legalAccent}>Privacy Policy</Text>.
            {' '}Voice data processed securely, never sold.
          </Text>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  root: {
    flex: 1,
    paddingHorizontal: Spacing.six,
    paddingTop: COMPACT ? Spacing.seven : Spacing.ten,
    paddingBottom: Spacing.seven,
    justifyContent: 'space-between',
  },

  // ── Hero ──
  hero: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  icon: {
    width: COMPACT ? 100 : 128,
    height: COMPACT ? 100 : 128,
    borderRadius: COMPACT ? 24 : 30,
  },
  iconGlow: {
    position: 'absolute',
    width: COMPACT ? 100 : 128,
    height: COMPACT ? 100 : 128,
    borderRadius: 64,
    zIndex: -1,
    shadowColor: Colors.dark.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 36,
    elevation: 0,
  },
  wordmark: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.dark.text,
    letterSpacing: 8,
    includeFontPadding: false,
  },
  tagline: {
    ...Typography.bodyLarge,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
  },

  // ── CTA ──
  cta: {
    gap: Spacing.three,
  },
  googleButton: {
    backgroundColor: Colors.dark.text,
    height: MinTouchTarget + 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.five,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  googleButtonBusy: {
    opacity: 0.65,
  },
  googleButtonLabel: {
    ...Typography.titleSmall,
    color: Colors.dark.background,
    fontWeight: '700',
  },
  legal: {
    ...Typography.bodySmall,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalAccent: {
    color: Colors.dark.accent,
    fontWeight: '600',
  },
});

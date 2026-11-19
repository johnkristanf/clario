import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Sparkles, Activity, Target, TrendingUp, ArrowRight } from 'lucide-react-native';
import { Colors, Spacing, Typography, MinTouchTarget } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { markOnboardingCompleted } from '@/services/onboarding';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Core Product Features ────────────────────────────────────────────────────
const SLIDES = [
  {
    Icon: Sparkles,
    color: '#38bdf8', // sky-400
    bg: 'rgba(56, 189, 248, 0.12)',
    badgeText: 'DIMENSION SCORING',
    title: 'AI Speech\nEvaluation',
    description:
      'Instant feedback across 7 core dimensions — clarity, structure, fluency, vocabulary, grammar, relevance, and vocal confidence.',
  },
  {
    Icon: Activity,
    color: '#10b981', // emerald-500
    bg: 'rgba(16, 185, 129, 0.12)',
    badgeText: 'ACOUSTIC ENGINE',
    title: 'Real-Time\nAcoustic Analysis',
    description:
      'Librosa and Deepgram measure your vocal pace, pauses, cadence, and filler words to transform rambling into crisp articulation.',
  },
  {
    Icon: Target,
    color: '#f59e0b', // amber-500
    bg: 'rgba(245, 158, 11, 0.12)',
    badgeText: 'STRUCTURED PRACTICE',
    title: 'Daily Speaking\nChallenges',
    description:
      'Bite-sized daily prompts with 30s prep and 2m speaking rounds, anchored in executive frameworks like PREP and STAR.',
  },
  {
    Icon: TrendingUp,
    color: '#a78bfa', // violet-400
    bg: 'rgba(167, 139, 250, 0.12)',
    badgeText: 'ADAPTIVE MASTERY',
    title: 'Track Growth &\nTarget Weaknesses',
    description:
      'Intelligent weakness detection pinpoints where you struggle and personalises your next challenge drills automatically.',
  },
] as const;

// ─── Progress dots ────────────────────────────────────────────────────────────
function Dots({ total, active }: { total: number; active: number }) {
  return (
    <View style={dotStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dotStyles.dot,
            i === active && dotStyles.dotActive,
            { backgroundColor: i === active ? SLIDES[active].color : Colors.dark.surfaceHighlight },
          ]}
        />
      ))}
    </View>
  );
}

const dotStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { width: 22, height: 6, borderRadius: 3 },
});

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);

  // Transitions & springs
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const iconScale = useRef(new Animated.Value(0.6)).current;
  const haloOpacity = useRef(new Animated.Value(0.3)).current;

  const animateIn = () => {
    opacity.setValue(0);
    translateY.setValue(20);
    iconScale.setValue(0.6);
    haloOpacity.setValue(0.2);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 360,
        useNativeDriver: true,
      }),
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 160,
        friction: 9,
        useNativeDriver: true,
      }),
      Animated.timing(haloOpacity, {
        toValue: 0.6,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    animateIn();
  }, [index]);

  const advance = () => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -14, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      if (index < SLIDES.length - 1) {
        setIndex((i) => i + 1);
      }
    });
  };

  const finish = async () => {
    await markOnboardingCompleted(user?.id);
    router.replace('/(tabs)');
  };

  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];
  const { Icon } = slide;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>

        {/* ── Top bar: Skip ─────────────────────────────────────────── */}
        <View style={styles.topBar}>
          <Text style={styles.stepCounter}>
            {index + 1} of {SLIDES.length}
          </Text>
          {!isLast ? (
            <TouchableOpacity
              onPress={finish}
              hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
              accessibilityLabel="Skip onboarding"
              accessibilityRole="button"
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* ── Slide content ─────────────────────────────────────────── */}
        <Animated.View
          style={[styles.slide, { opacity, transform: [{ translateY }] }]}
        >
          {/* Animated Halo + Icon badge */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.glowHalo,
                {
                  backgroundColor: slide.color,
                  opacity: haloOpacity,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.iconBadge,
                { backgroundColor: slide.bg, transform: [{ scale: iconScale }] },
              ]}
            >
              <Icon size={56} color={slide.color} strokeWidth={1.75} />
            </Animated.View>
          </View>

          {/* Dimension / Engine badge */}
          <View style={[styles.pillBadge, { borderColor: slide.color + '40' }]}>
            <Text style={[styles.pillText, { color: slide.color }]}>
              {slide.badgeText}
            </Text>
          </View>

          {/* Heading and details */}
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideDesc}>{slide.description}</Text>
        </Animated.View>

        {/* ── Bottom: progress dots + action ────────────────────────── */}
        <View style={styles.bottom}>
          <Dots total={SLIDES.length} active={index} />

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: slide.color }]}
            activeOpacity={0.85}
            onPress={isLast ? finish : advance}
            accessibilityLabel={isLast ? 'Get Started' : 'Next feature'}
            accessibilityRole="button"
          >
            <Text style={styles.btnLabel}>
              {isLast ? 'Start Daily Practice' : 'Continue'}
            </Text>
            <ArrowRight size={18} color={Colors.dark.background} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>

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
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    justifyContent: 'space-between',
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
  },
  stepCounter: {
    ...Typography.labelSmall,
    color: Colors.dark.textMuted,
    letterSpacing: 1,
  },
  skipText: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    fontWeight: '500',
  },

  // Slide
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    gap: Spacing.four,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  glowHalo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    filter: 'blur(20px)',
  },
  iconBadge: {
    width: 128,
    height: 128,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: Colors.dark.surfaceElevated,
  },
  pillText: {
    ...Typography.labelSmall,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  slideTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.dark.text,
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: -0.4,
    includeFontPadding: false,
  },
  slideDesc: {
    ...Typography.bodyMedium,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: SCREEN_WIDTH * 0.82,
  },

  // Bottom
  bottom: {
    gap: Spacing.five,
    alignItems: 'center',
    width: '100%',
  },
  btn: {
    width: '100%',
    height: MinTouchTarget + 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  btnLabel: {
    ...Typography.titleSmall,
    color: Colors.dark.background,
    fontWeight: '700',
  },
});

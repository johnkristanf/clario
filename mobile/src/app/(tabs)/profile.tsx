import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, LogOut, CheckCircle, Shield } from 'lucide-react-native';
import { Colors, Spacing, Typography, MinTouchTarget } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

export default function ProfileScreen() {
  const { user, isAuthenticated, signOut } = useAuth();

  const userName = user?.user_metadata?.full_name ?? 'Clario Speaker';
  const userEmail = user?.email ?? null;

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account & Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your articulation identity and sync settings</Text>
        </View>

        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={32} color={Colors.dark.text} />
          </View>
          <Text style={styles.profileName}>{userName || 'Clario Speaker'}</Text>
          <Text style={styles.profileEmail}>{userEmail ?? 'No email'}</Text>

          <View style={styles.verifiedBadge}>
            <CheckCircle size={14} color={Colors.dark.success} />
            <Text style={styles.verifiedText}>Google Account Synced</Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} activeOpacity={0.8} onPress={handleSignOut}>
          <LogOut size={18} color={Colors.dark.danger} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* System Settings & Engine Status */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Shield size={18} color={Colors.dark.accent} />
            <Text style={styles.sectionTitle}>Connected Services</Text>
          </View>

          <View style={styles.serviceRow}>
            <Text style={styles.serviceName}>Supabase</Text>
            <Text style={styles.serviceStatus}>Database & Storage</Text>
          </View>
          <View style={styles.serviceRow}>
            <Text style={styles.serviceName}>Deepgram Nova-3</Text>
            <Text style={styles.serviceStatus}>Speech-to-Text & Word Timings</Text>
          </View>
          <View style={styles.serviceRow}>
            <Text style={styles.serviceName}>Librosa</Text>
            <Text style={styles.serviceStatus}>Acoustic Analysis & Pacing</Text>
          </View>
          <View style={styles.serviceRow}>
            <Text style={styles.serviceName}>OpenAI GPT-4o</Text>
            <Text style={styles.serviceStatus}>7 Dimensions & Coaching</Text>
          </View>
        </View>

        <Text style={styles.footerNote}>Clario • Version 1.0.0 (Slate-950 & White)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.ten,
    maxWidth: 680,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: Spacing.four,
  },
  headerTitle: {
    ...Typography.titleLarge,
    color: Colors.dark.text,
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  profileCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 20,
    padding: Spacing.six,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: 'center',
    marginBottom: Spacing.four,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.dark.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.dark.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  profileName: {
    ...Typography.titleMedium,
    color: Colors.dark.text,
    marginBottom: 2,
  },
  profileEmail: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.three,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.success,
  },
  verifiedText: {
    ...Typography.labelSmall,
    color: Colors.dark.success,
    fontSize: 10,
  },
  guestBadge: {
    backgroundColor: Colors.dark.surfaceElevated,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: 12,
  },
  guestBadgeText: {
    ...Typography.labelSmall,
    color: Colors.dark.textMuted,
    fontSize: 10,
  },
  googleButton: {
    backgroundColor: Colors.dark.text,
    height: MinTouchTarget + 4,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
  googleButtonText: {
    ...Typography.titleSmall,
    color: Colors.dark.background,
    fontWeight: '700',
  },
  signOutButton: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.danger,
    height: MinTouchTarget + 4,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.five,
  },
  signOutText: {
    ...Typography.bodyMedium,
    color: Colors.dark.danger,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: Spacing.four,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: Spacing.four,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    ...Typography.titleSmall,
    color: Colors.dark.text,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.surfaceElevated,
  },
  serviceName: {
    ...Typography.bodyMedium,
    color: Colors.dark.text,
    fontWeight: '600',
  },
  serviceStatus: {
    ...Typography.bodySmall,
    color: Colors.dark.textSecondary,
  },
  footerNote: {
    ...Typography.labelSmall,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: Spacing.four,
    fontSize: 10,
  },
});

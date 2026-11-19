import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_STORAGE_KEY_PREFIX = '@clario_has_logged_in_before_';
export const GLOBAL_ONBOARDING_KEY = '@clario_onboarding_completed';

/**
 * Checks whether the user has already logged in and seen the welcome onboarding before.
 */
export async function hasCompletedOnboarding(userId?: string): Promise<boolean> {
  try {
    if (userId) {
      const userStatus = await AsyncStorage.getItem(`${ONBOARDING_STORAGE_KEY_PREFIX}${userId}`);
      if (userStatus === 'true') {
        return true;
      }
    }
    const globalStatus = await AsyncStorage.getItem(GLOBAL_ONBOARDING_KEY);
    return globalStatus === 'true';
  } catch (err) {
    console.warn('Failed to check onboarding status:', err);
    return false;
  }
}

/**
 * Marks onboarding as completed for this user/device so it is never shown again.
 */
export async function markOnboardingCompleted(userId?: string): Promise<void> {
  try {
    await AsyncStorage.setItem(GLOBAL_ONBOARDING_KEY, 'true');
    if (userId) {
      await AsyncStorage.setItem(`${ONBOARDING_STORAGE_KEY_PREFIX}${userId}`, 'true');
    }
  } catch (err) {
    console.warn('Failed to persist onboarding completion:', err);
  }
}

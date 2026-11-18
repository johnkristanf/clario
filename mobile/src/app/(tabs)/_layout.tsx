import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Mic, TrendingUp, User } from 'lucide-react-native';
import { Colors, Typography, BottomTabInset } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.dark.surface,
          borderTopColor: Colors.dark.border,
          borderTopWidth: 1,
          height: BottomTabInset,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.dark.text,
        tabBarInactiveTintColor: Colors.dark.textMuted,
        tabBarLabelStyle: {
          ...Typography.labelSmall,
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Daily Challenge',
          tabBarIcon: ({ color, size }) => <Mic color={color} size={size || 22} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Progression',
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size || 22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size || 22} />,
        }}
      />
    </Tabs>
  );
}

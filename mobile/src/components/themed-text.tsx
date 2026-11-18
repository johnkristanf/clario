import { Text, type TextProps, StyleSheet } from 'react-native';
import { Colors, ThemeColor, Typography } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'small' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({
  style,
  type = 'default',
  themeColor = 'text',
  ...rest
}: ThemedTextProps) {
  const color = Colors.dark[themeColor] || Colors.dark.text;

  return <Text style={[{ color }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: Typography.bodyMedium,
  defaultSemiBold: { ...Typography.bodyMedium, fontWeight: '600' },
  title: Typography.titleLarge,
  subtitle: Typography.titleMedium,
  link: { ...Typography.bodyMedium, color: Colors.dark.accent },
  small: Typography.bodySmall,
  code: { ...Typography.bodySmall, fontFamily: 'monospace' },
});

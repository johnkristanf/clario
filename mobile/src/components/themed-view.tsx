import { View, type ViewProps } from 'react-native';
import { Colors } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  type?: 'background' | 'surface' | 'surfaceElevated' | 'surfaceHighlight' | 'backgroundElement';
};

export function ThemedView({ style, type = 'background', ...otherProps }: ThemedViewProps) {
  const backgroundColor = Colors.dark[type] || Colors.dark.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}

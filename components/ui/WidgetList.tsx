import React from 'react';
import { TouchableOpacity, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { Colors, Radius, Shadow } from '../../constants/theme';

interface WidgetListProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function WidgetList({ children, style, onPress }: WidgetListProps) {
  return (
    <TouchableOpacity
      style={[styles.widgetList, style]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  widgetList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: 12,
    margin: 4,
    ...Shadow.card,
  },
});

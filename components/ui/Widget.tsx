import React from 'react';
import { View, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { Colors, Radius, Shadow } from '../../constants/theme';

interface WidgetProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Widget({ children, style }: WidgetProps) {
  return (
    <View 
      style={[styles.widget, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  widget: {
    backgroundColor: Colors.widget,
    borderRadius: Radius.md,
    padding: 15,
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 12,
    marginRight: 12
  },
});

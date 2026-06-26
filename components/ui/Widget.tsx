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
    padding: 15,
    marginBottom: 12,
    marginLeft: 12,
    marginRight: 12
  },
});

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md', 
  style, 
  textStyle 
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant], styles[size], style]}>
      <Text style={[styles.text, styles[`${size}Text`], styles[`${variant}Text`], textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  default: {
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
  },
  success: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  warning: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  error: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  info: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  text: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  smText: {
    fontSize: 10,
  },
  mdText: {
    fontSize: 12,
  },
  defaultText: {
    color: '#94a3b8',
  },
  successText: {
    color: '#10b981',
  },
  warningText: {
    color: '#f59e0b',
  },
  errorText: {
    color: '#ef4444',
  },
  infoText: {
    color: '#3b82f6',
  },
});

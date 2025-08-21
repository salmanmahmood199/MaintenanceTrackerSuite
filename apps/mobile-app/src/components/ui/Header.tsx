import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  leftAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  variant?: 'default' | 'gradient';
}

export function Header({ 
  title, 
  subtitle, 
  showBack = false, 
  onBack, 
  rightAction,
  leftAction,
  variant = 'default'
}: HeaderProps) {
  const content = (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        {/* Left Action */}
        {leftAction && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={leftAction.onPress}
            activeOpacity={0.7}
          >
            <Ionicons name={leftAction.icon} size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
        {showBack && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
        
        {/* Centered Title Section */}
        <View style={styles.centerSection}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        
        {/* Right Action */}
        {rightAction && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={rightAction.onPress}
            activeOpacity={0.7}
          >
            <Ionicons name={rightAction.icon} size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={['#1e293b', '#0f172a']}
        style={styles.gradientContainer}
      >
        <SafeAreaView edges={['top']}>
          {content}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.defaultContainer}>
      <SafeAreaView edges={['top']}>
        {content}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    paddingBottom: 16,
  },
  defaultContainer: {
    backgroundColor: '#0f172a',
    paddingBottom: 16,
  },
  container: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    position: 'relative',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  centerSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 2,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});

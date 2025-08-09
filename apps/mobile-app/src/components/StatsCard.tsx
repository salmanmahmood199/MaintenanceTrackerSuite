import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from './ui/Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  colors?: [string, string];
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  trend,
  colors = ['#3b82f6', '#1d4ed8']
}: StatsCardProps) {
  return (
    <Card variant="elevated" style={styles.card}>
      <LinearGradient
        colors={colors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name={icon} size={24} color="#ffffff" />
            </View>
            {trend && (
              <View style={styles.trendContainer}>
                <Ionicons 
                  name={trend.isPositive ? "trending-up" : "trending-down"} 
                  size={16} 
                  color={trend.isPositive ? "#10b981" : "#ef4444"} 
                />
                <Text style={[
                  styles.trendText,
                  { color: trend.isPositive ? "#10b981" : "#ef4444" }
                ]}>
                  {Math.abs(trend.value)}%
                </Text>
              </View>
            )}
          </View>
          
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.title}>{title}</Text>
        </View>
      </LinearGradient>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  gradient: {
    padding: 16,
  },
  content: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  title: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
});

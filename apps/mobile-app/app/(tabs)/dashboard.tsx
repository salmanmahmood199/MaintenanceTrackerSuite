import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiRequest } from '../../src/services/api';

export default function DashboardScreen() {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch tickets data
  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/tickets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tickets');
      return response.json();
    },
    enabled: !!user,
  });

  // Fetch organizations data (for root users)
  const { data: organizations = [] } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/organizations');
      return response.json();
    },
    enabled: !!user && user.role === 'root',
  });

  // Fetch maintenance vendors data (for root users)
  const { data: vendors = [] } = useQuery({
    queryKey: ['/api/maintenance-vendors'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/maintenance-vendors');
      return response.json();
    },
    enabled: !!user && user.role === 'root',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getTicketStats = () => {
    const stats = {
      total: tickets.length,
      pending: tickets.filter((t: any) => t.status === 'pending').length,
      accepted: tickets.filter((t: any) => t.status === 'accepted').length,
      completed: tickets.filter((t: any) => t.status === 'completed').length,
      high: tickets.filter((t: any) => t.priority === 'high').length,
    };
    return stats;
  };

  const stats = getTicketStats();

  const getUserRoleDisplay = () => {
    switch (user?.role) {
      case 'root':
        return 'System Administrator';
      case 'org_admin':
        return 'Organization Administrator';
      case 'org_subadmin':
        return 'Organization Sub-Administrator';
      case 'maintenance_admin':
        return 'Maintenance Vendor Administrator';
      case 'technician':
        return 'Technician';
      case 'residential':
        return 'Residential User';
      default:
        return 'User';
    }
  };

  const StatCard = ({ title, value, icon, color, onPress }: any) => (
    <TouchableOpacity style={styles.statCard} onPress={onPress}>
      <LinearGradient colors={color} style={styles.statGradient}>
        <View style={styles.statContent}>
          <View style={styles.statIconContainer}>
            <Ionicons name={icon} size={24} color="#ffffff" />
          </View>
          <View style={styles.statText}>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1e293b', '#7c3aed', '#1e293b']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
            <Text style={styles.userRole}>{getUserRoleDisplay()}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/create-ticket')}
              >
                <LinearGradient colors={['#06b6d4', '#3b82f6']} style={styles.actionGradient}>
                  <Ionicons name="add" size={24} color="#ffffff" />
                  <Text style={styles.actionText}>Create Ticket</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/tickets')}
              >
                <LinearGradient colors={['#8b5cf6', '#6366f1']} style={styles.actionGradient}>
                  <Ionicons name="list" size={24} color="#ffffff" />
                  <Text style={styles.actionText}>View Tickets</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push('/(tabs)/calendar')}
              >
                <LinearGradient colors={['#10b981', '#059669']} style={styles.actionGradient}>
                  <Ionicons name="calendar" size={24} color="#ffffff" />
                  <Text style={styles.actionText}>Calendar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats Grid */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dashboard Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="Total Tickets"
                value={stats.total}
                icon="ticket"
                color={['#3b82f6', '#1d4ed8']}
                onPress={() => router.push('/(tabs)/tickets')}
              />
              <StatCard
                title="Pending"
                value={stats.pending}
                icon="time"
                color={['#f59e0b', '#d97706']}
                onPress={() => router.push('/(tabs)/tickets')}
              />
              <StatCard
                title="In Progress"
                value={stats.accepted}
                icon="construct"
                color={['#8b5cf6', '#7c3aed']}
                onPress={() => router.push('/(tabs)/tickets')}
              />
              <StatCard
                title="Completed"
                value={stats.completed}
                icon="checkmark-circle"
                color={['#10b981', '#059669']}
                onPress={() => router.push('/(tabs)/tickets')}
              />
              <StatCard
                title="High Priority"
                value={stats.high}
                icon="alert-circle"
                color={['#ef4444', '#dc2626']}
                onPress={() => router.push('/(tabs)/tickets')}
              />
              {user?.role === 'root' && (
                <StatCard
                  title="Organizations"
                  value={organizations.length}
                  icon="business"
                  color={['#06b6d4', '#0891b2']}
                />
              )}
            </View>
          </View>

          {/* Recent Tickets */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Tickets</Text>
            {tickets.slice(0, 5).map((ticket: any) => (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketCard}
                onPress={() => router.push(`/ticket/${ticket.id}`)}
              >
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketTitle} numberOfLines={1}>
                    {ticket.title}
                  </Text>
                  <View style={[styles.priorityBadge, 
                    ticket.priority === 'high' && styles.highPriority,
                    ticket.priority === 'medium' && styles.mediumPriority,
                    ticket.priority === 'low' && styles.lowPriority
                  ]}>
                    <Text style={styles.priorityText}>{ticket.priority}</Text>
                  </View>
                </View>
                <Text style={styles.ticketDescription} numberOfLines={2}>
                  {ticket.description}
                </Text>
                <View style={styles.ticketFooter}>
                  <View style={[styles.statusBadge,
                    ticket.status === 'pending' && styles.pendingStatus,
                    ticket.status === 'accepted' && styles.acceptedStatus,
                    ticket.status === 'completed' && styles.completedStatus
                  ]}>
                    <Text style={styles.statusText}>{ticket.status}</Text>
                  </View>
                  <Text style={styles.ticketDate}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#94a3b8',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#06b6d4',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 16,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    marginRight: 12,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  statTitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  ticketCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  highPriority: {
    backgroundColor: '#ef4444',
  },
  mediumPriority: {
    backgroundColor: '#f59e0b',
  },
  lowPriority: {
    backgroundColor: '#10b981',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  ticketDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 18,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingStatus: {
    backgroundColor: '#f59e0b',
  },
  acceptedStatus: {
    backgroundColor: '#8b5cf6',
  },
  completedStatus: {
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  ticketDate: {
    fontSize: 12,
    color: '#64748b',
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiRequest } from '../../src/services/api';

export default function TicketsScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/tickets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tickets');
      return response.json();
    },
    enabled: !!user,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredTickets = tickets.filter((ticket: any) => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const StatusButton = ({ status, active, onPress }: any) => (
    <TouchableOpacity
      style={[styles.statusButton, active && styles.activeStatusButton]}
      onPress={onPress}
    >
      <Text style={[styles.statusButtonText, active && styles.activeStatusButtonText]}>
        {status}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1e293b', '#7c3aed', '#1e293b']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Tickets</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/create-ticket')}
          >
            <Ionicons name="add" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tickets..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusFilters}>
            <StatusButton
              status="All"
              active={statusFilter === 'all'}
              onPress={() => setStatusFilter('all')}
            />
            <StatusButton
              status="Pending"
              active={statusFilter === 'pending'}
              onPress={() => setStatusFilter('pending')}
            />
            <StatusButton
              status="Accepted"
              active={statusFilter === 'accepted'}
              onPress={() => setStatusFilter('accepted')}
            />
            <StatusButton
              status="In Progress"
              active={statusFilter === 'in_progress'}
              onPress={() => setStatusFilter('in_progress')}
            />
            <StatusButton
              status="Completed"
              active={statusFilter === 'completed'}
              onPress={() => setStatusFilter('completed')}
            />
          </ScrollView>
        </View>

        {/* Tickets List */}
        <ScrollView
          style={styles.ticketsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredTickets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="ticket-outline" size={64} color="#64748b" />
              <Text style={styles.emptyTitle}>No tickets found</Text>
              <Text style={styles.emptyDescription}>
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Create your first ticket to get started'}
              </Text>
              {!searchQuery && statusFilter === 'all' && (
                <TouchableOpacity
                  style={styles.createTicketButton}
                  onPress={() => router.push('/create-ticket')}
                >
                  <LinearGradient colors={['#06b6d4', '#3b82f6']} style={styles.createTicketGradient}>
                    <Text style={styles.createTicketText}>Create First Ticket</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredTickets.map((ticket: any) => (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketCard}
                onPress={() => router.push(`/ticket/${ticket.id}`)}
              >
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketInfo}>
                    <Text style={styles.ticketTitle} numberOfLines={1}>
                      {ticket.title}
                    </Text>
                    <Text style={styles.ticketId}>#{ticket.id}</Text>
                  </View>
                  <View style={styles.ticketBadges}>
                    <View style={[styles.priorityBadge, 
                      ticket.priority === 'high' && styles.highPriority,
                      ticket.priority === 'medium' && styles.mediumPriority,
                      ticket.priority === 'low' && styles.lowPriority
                    ]}>
                      <Text style={styles.priorityText}>{ticket.priority}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.ticketDescription} numberOfLines={2}>
                  {ticket.description}
                </Text>

                <View style={styles.ticketFooter}>
                  <View style={[styles.statusBadge,
                    ticket.status === 'pending' && styles.pendingStatus,
                    ticket.status === 'accepted' && styles.acceptedStatus,
                    ticket.status === 'in_progress' && styles.inProgressStatus,
                    ticket.status === 'completed' && styles.completedStatus
                  ]}>
                    <Text style={styles.statusText}>{ticket.status}</Text>
                  </View>
                  <Text style={styles.ticketDate}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </Text>
                </View>

                {ticket.assignedTo && (
                  <View style={styles.assignedContainer}>
                    <Ionicons name="person" size={16} color="#64748b" />
                    <Text style={styles.assignedText}>
                      Assigned to {ticket.assignedTo}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  statusFilters: {
    flexDirection: 'row',
  },
  statusButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  activeStatusButton: {
    backgroundColor: '#3b82f6',
  },
  statusButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  activeStatusButtonText: {
    color: '#ffffff',
  },
  ticketsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 40,
  },
  createTicketButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  createTicketGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createTicketText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketInfo: {
    flex: 1,
    marginRight: 12,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  ticketId: {
    fontSize: 12,
    color: '#64748b',
  },
  ticketBadges: {
    flexDirection: 'row',
    gap: 8,
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
    marginBottom: 8,
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
  inProgressStatus: {
    backgroundColor: '#06b6d4',
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
  assignedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  assignedText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
  },
});
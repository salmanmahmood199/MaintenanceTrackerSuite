import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiRequest } from "../../src/services/api";
import { Header } from "../../src/components/ui/Header";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { TicketCard } from "../../src/components/TicketCard";
import type { Ticket } from "../../src/types/index";

export default function DashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch tickets
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useQuery<Ticket[]>({
    queryKey: ["dashboard-tickets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tickets");
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      return response.json();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchTickets();
    setRefreshing(false);
  };

  // Enhanced filtering with search
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Get priority counts and recent activity
  const getNewTicketsCount = () => {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return tickets.filter(t => new Date(t.createdAt) > oneDayAgo).length;
  };

  const getPriorityCount = (priority: string) => 
    tickets.filter(t => t.priority === priority).length;

  const getStatusCount = (status: string) => 
    tickets.filter(t => t.status === status).length;

  return (
    <View style={styles.container}>
      <Header 
        title="Dashboard" 
        subtitle={`Welcome back, ${user?.firstName || 'User'}`}
        variant="gradient"
        rightAction={{
          icon: "notifications-outline",
          onPress: () => router.push("/notifications")
        }}
      />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search and Priority Overview */}
        <Card style={styles.searchCard}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tickets by title, number, or description..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          {/* Priority and Status Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={styles.priorityIndicator}>
                  <Ionicons name="alert-circle" size={16} color="#ef4444" />
                  <Text style={styles.summaryLabel}>High Priority</Text>
                </View>
                <Text style={styles.summaryCount}>{getPriorityCount('high')}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <View style={styles.priorityIndicator}>
                  <Ionicons name="time" size={16} color="#f59e0b" />
                  <Text style={styles.summaryLabel}>New Today</Text>
                </View>
                <Text style={styles.summaryCount}>{getNewTicketsCount()}</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <View style={styles.priorityIndicator}>
                  <Ionicons name="construct" size={16} color="#3b82f6" />
                  <Text style={styles.summaryLabel}>In Progress</Text>
                </View>
                <Text style={styles.summaryCount}>{getStatusCount('in_progress')}</Text>
              </View>
              
              <View style={styles.summaryItem}>
                <View style={styles.priorityIndicator}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.summaryLabel}>Completed</Text>
                </View>
                <Text style={styles.summaryCount}>{getStatusCount('completed')}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button
              variant="primary"
              size="sm"
              title="New Ticket"
              onPress={() => router.push("/create-ticket")}
              style={styles.actionButton}
            />
            <Button
              variant="secondary"
              size="sm"
              title="Calendar"
              onPress={() => router.push("/calendar")}
              style={styles.actionButton}
            />
          </View>
        </Card>

        {/* Enhanced Filter Tabs */}
        <Card style={styles.filterCard}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Search Results (${filteredTickets.length})` : 'Filter Tickets'}
          </Text>
          <View style={styles.filterTabs}>
            {[
              { key: 'all', label: 'All', count: tickets.length, icon: 'list-outline' },
              { key: 'pending', label: 'Pending', count: getStatusCount('pending'), icon: 'time-outline' },
              { key: 'in_progress', label: 'Active', count: getStatusCount('in_progress'), icon: 'construct-outline' },
              { key: 'completed', label: 'Done', count: getStatusCount('completed'), icon: 'checkmark-circle-outline' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  filterStatus === filter.key && styles.filterTabActive
                ]}
                onPress={() => setFilterStatus(filter.key)}
              >
                <Ionicons 
                  name={filter.icon as any} 
                  size={18} 
                  color={filterStatus === filter.key ? '#ffffff' : '#64748b'} 
                />
                <Text style={[
                  styles.filterTabLabel,
                  filterStatus === filter.key && styles.filterTabLabelActive
                ]}>
                  {filter.label}
                </Text>
                <Text style={[
                  styles.filterTabCount,
                  filterStatus === filter.key && styles.filterTabCountActive
                ]}>
                  {filter.count}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Tickets List */}
        <View style={styles.ticketsContainer}>
          {ticketsLoading ? (
            <Card>
              <Text style={styles.loadingText}>Loading tickets...</Text>
            </Card>
          ) : filteredTickets.length > 0 ? (
            filteredTickets.slice(0, 5).map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onPress={() => router.push(`/ticket/${ticket.id}`)}
              />
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No tickets found</Text>
              <Text style={styles.emptyDescription}>
                {filterStatus === 'all' 
                  ? "Create your first ticket to get started"
                  : `No ${filterStatus.replace('_', ' ')} tickets at the moment`
                }
              </Text>
              {filterStatus === 'all' && (
                <Button
                  variant="primary"
                  title="Create Ticket"
                  onPress={() => router.push("/create-ticket")}
                  style={styles.emptyButton}
                />
              )}
            </Card>
          )}
        </View>

        {filteredTickets.length > 5 && (
          <Card style={styles.viewAllCard}>
            <Button
              variant="secondary"
              title="View All Tickets"
              onPress={() => router.push("/tickets")}
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchCard: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  clearButton: {
    marginLeft: 8,
  },
  summaryContainer: {
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  summaryCount: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
  quickActionsCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  filterCard: {
    marginBottom: 20,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    minHeight: 50,
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
  },
  filterTabLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  filterTabLabelActive: {
    color: '#ffffff',
  },
  filterTabCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    textAlign: 'center',
  },
  filterTabCountActive: {
    color: '#3b82f6',
    backgroundColor: '#ffffff',
  },
  ticketsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  ticketCard: {
    marginBottom: 0,
  },
  loadingText: {
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    minWidth: 140,
  },
  viewAllCard: {
    marginBottom: 20,
  },
});

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiRequest } from "../../src/services/api";
import { Header } from "../../src/components/ui/Header";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { StatsCard } from "../../src/components/StatsCard";
import { TicketCard } from "../../src/components/TicketCard";
import type {
  Ticket,
  Organization,
  MaintenanceVendor,
  User,
  Location,
} from "../../src/types/index";

export default function DashboardScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch tickets
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets,
  } = useQuery({
    queryKey: ["tickets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tickets");
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      return response.json();
    },
  });

  // Fetch organizations (for admin users)
  const {
    data: organizations = [],
    isLoading: organizationsLoading,
  } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/organizations");
      if (!response.ok) {
        throw new Error("Failed to fetch organizations");
      }
      return response.json();
    },
    enabled: user?.role === "admin",
  });

  // Calculate stats
  const stats = useMemo(() => {
    const totalTickets = tickets.length;
    const pendingTickets = tickets.filter((t: Ticket) => t.status === 'pending').length;
    const inProgressTickets = tickets.filter((t: Ticket) => t.status === 'in_progress').length;
    const completedTickets = tickets.filter((t: Ticket) => t.status === 'completed').length;

    return {
      total: totalTickets,
      pending: pendingTickets,
      inProgress: inProgressTickets,
      completed: completedTickets,
    };
  }, [tickets]);

  // Filter tickets based on status
  const filteredTickets = useMemo(() => {
    if (filterStatus === 'all') return tickets;
    return tickets.filter((ticket: Ticket) => ticket.status === filterStatus);
  }, [tickets, filterStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchTickets();
    setRefreshing(false);
  };

  const handleTicketPress = (ticket: Ticket) => {
    router.push(`/ticket-details/${ticket.id}`);
  };

  const renderTicketItem = ({ item }: { item: Ticket }) => (
    <TicketCard
      ticket={item}
      onPress={() => handleTicketPress(item)}
      onMenuPress={() => {
        // Handle menu actions
      }}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Header
        title={`Welcome back, ${user?.firstName || 'User'}`}
        subtitle="Here's what's happening today"
        variant="gradient"
        rightAction={{
          icon: "notifications-outline",
          onPress: () => router.push("/notifications"),
        }}
      />

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
      >
        <StatsCard
          title="Total Tickets"
          value={stats.total}
          icon="receipt-outline"
          colors={['#3b82f6', '#1d4ed8']}
        />
        <StatsCard
          title="Pending"
          value={stats.pending}
          icon="time-outline"
          colors={['#f59e0b', '#d97706']}
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgress}
          icon="construct-outline"
          colors={['#06b6d4', '#0891b2']}
        />
        <StatsCard
          title="Completed"
          value={stats.completed}
          icon="checkmark-circle-outline"
          colors={['#10b981', '#059669']}
        />
      </ScrollView>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <Button
            variant="primary"
            size="sm"
            icon="add"
            onPress={() => router.push("/create-ticket")}
            style={styles.actionButton}
          >
            New Ticket
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon="calendar-outline"
            onPress={() => router.push("/calendar")}
            style={styles.actionButton}
          >
            Calendar
          </Button>
        </View>
      </Card>

      {/* Filter Tabs */}
      <Card style={styles.filterCard}>
        <Text style={styles.sectionTitle}>Recent Tickets</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterTabs}
        >
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: 'Pending' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'completed', label: 'Completed' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                filterStatus === filter.key && styles.activeFilterTab,
              ]}
              onPress={() => setFilterStatus(filter.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  filterStatus === filter.key && styles.activeFilterTabText,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>
    </View>
  );

  if (ticketsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Header title="Dashboard" variant="gradient" />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTickets}
        renderItem={renderTicketItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <View style={styles.emptyContent}>
              <Ionicons name="receipt-outline" size={48} color="#64748b" />
              <Text style={styles.emptyTitle}>No tickets found</Text>
              <Text style={styles.emptyDescription}>
                {filterStatus === 'all'
                  ? "Create your first ticket to get started"
                  : `No ${filterStatus.replace('_', ' ')} tickets at the moment`}
              </Text>
              {filterStatus === 'all' && (
                <Button
                  variant="primary"
                  icon="add"
                  onPress={() => router.push("/create-ticket")}
                  style={styles.emptyButton}
                >
                  Create Ticket
                </Button>
              )}
            </View>
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    marginBottom: 20,
  },
  statsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  statsContent: {
    paddingRight: 20,
    gap: 16,
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
    marginTop: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilterTab: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: '#ffffff',
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 16,
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
});

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiRequest } from "../../src/services/api";
import { Header } from "../../src/components/ui/Header";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { StatsCard } from "../../src/components/StatsCard";
import { TicketCard } from "../../src/components/TicketCard";
import type { Ticket } from "../../src/types/index";

export default function DashboardScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  const filteredTickets = tickets.filter(ticket => 
    filterStatus === 'all' || ticket.status === filterStatus
  );

  const stats = {
    total: tickets.length,
    pending: tickets.filter(t => t.status === 'pending').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    completed: tickets.filter(t => t.status === 'completed').length,
  };

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
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatsCard
            title="Total Tickets"
            value={stats.total}
            icon="receipt-outline"
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Pending"
            value={stats.pending}
            icon="time-outline"
            trend={{ value: 3, isPositive: false }}
          />
          <StatsCard
            title="In Progress"
            value={stats.inProgress}
            icon="construct-outline"
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Completed"
            value={stats.completed}
            icon="checkmark-circle-outline"
            trend={{ value: 15, isPositive: true }}
          />
        </View>

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

        {/* Filter Tabs */}
        <Card style={styles.filterCard}>
          <Text style={styles.sectionTitle}>Recent Tickets</Text>
          <View style={styles.filterTabs}>
            {[
              { key: 'all', label: 'All' },
              { key: 'pending', label: 'Pending' },
              { key: 'in_progress', label: 'In Progress' },
              { key: 'completed', label: 'Completed' },
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={filterStatus === filter.key ? 'primary' : 'secondary'}
                size="sm"
                title={filter.label}
                onPress={() => setFilterStatus(filter.key)}
                style={styles.filterButton}
              />
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
                onPress={() => router.push(`/tickets/${ticket.id}`)}
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
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
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
  filterButton: {
    minWidth: 80,
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

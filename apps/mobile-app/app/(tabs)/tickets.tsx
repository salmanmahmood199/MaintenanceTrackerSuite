import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiRequest } from "../../src/services/api";
import { Header } from "../../src/components/ui/Header";
import { Card } from "../../src/components/ui/Card";
import { Button } from "../../src/components/ui/Button";
import { TicketCard } from "../../src/components/TicketCard";
import type { Ticket } from "../../src/types/index";

export default function TicketsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch tickets
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    refetch: refetchTickets,
    error: ticketsError,
  } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: async () => {
      console.log("Fetching tickets from /api/tickets");
      const response = await apiRequest("GET", "/api/tickets");
      console.log("Tickets response status:", response.status);
      if (!response.ok) {
        console.error("Failed to fetch tickets:", response.status, response.statusText);
        throw new Error("Failed to fetch tickets");
      }
      const data = await response.json();
      console.log("Tickets data received:", data);
      return data;
    },
  });

  // Filter tickets
  const filteredTickets = useMemo(() => {
    let filtered = tickets;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.title?.toLowerCase().includes(query) ||
          ticket.description?.toLowerCase().includes(query) ||
          ticket.id.toString().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    return filtered;
  }, [tickets, searchQuery, statusFilter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchTickets();
    setRefreshing(false);
  };

  const handleTicketPress = (ticket: Ticket) => {
    router.push(`/ticket/${ticket.id}`);
  };

  const renderTicketItem = ({ item }: { item: Ticket }) => (
    <TicketCard
      ticket={item}
      onPress={() => handleTicketPress(item)}
      onMenuPress={() => {
        // Handle menu actions based on user role and ticket status
      }}
      showActions={user?.role === "maintenance_admin" && item.status === "pending"}
    />
  );

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {/* Search */}
      <Card style={styles.searchCard}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tickets..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </Card>

      {/* Filter Tabs */}
      <Card style={styles.filterCard}>
        <Text style={styles.filterTitle}>Filter by Status</Text>
        <View style={styles.filterTabs}>
          {[
            { key: "all", label: "All", count: tickets.length },
            { key: "pending", label: "Pending", count: tickets.filter(t => t.status === "pending").length },
            { key: "accepted", label: "Accepted", count: tickets.filter(t => t.status === "accepted").length },
            { key: "in_progress", label: "In Progress", count: tickets.filter(t => t.status === "in_progress").length },
            { key: "completed", label: "Completed", count: tickets.filter(t => t.status === "completed").length },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterTab,
                statusFilter === filter.key && styles.activeFilterTab,
              ]}
              onPress={() => setStatusFilter(filter.key)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  statusFilter === filter.key && styles.activeFilterTabText,
                ]}
              >
                {filter.label}
              </Text>
              <View style={[
                styles.filterCount,
                statusFilter === filter.key && styles.activeFilterCount,
              ]}>
                <Text style={[
                  styles.filterCountText,
                  statusFilter === filter.key && styles.activeFilterCountText,
                ]}>
                  {filter.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Summary */}
      <Card style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{filteredTickets.length}</Text>
            <Text style={styles.summaryLabel}>
              {statusFilter === "all" ? "Total Tickets" : `${statusFilter.replace('_', ' ')} Tickets`}
            </Text>
          </View>
          <Button
            variant="primary"
            size="sm"
            icon="add"
            onPress={() => router.push("/create-ticket")}
          >
            New Ticket
          </Button>
        </View>
      </Card>
    </View>
  );

  if (ticketsLoading) {
    return (
      <View style={styles.container}>
        <Header title="Tickets" variant="gradient" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tickets...</Text>
        </View>
      </View>
    );
  }

  if (ticketsError) {
    return (
      <View style={styles.container}>
        <Header title="Tickets" variant="gradient" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Error loading tickets:</Text>
          <Text style={styles.loadingText}>{ticketsError.message}</Text>
          <Button
            variant="primary"
            title="Retry"
            onPress={() => refetchTickets()}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Tickets" 
        subtitle={`${filteredTickets.length} tickets found`}
        variant="gradient"
      />
      
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
                {searchQuery
                  ? `No tickets match "${searchQuery}"`
                  : statusFilter === "all"
                  ? "Create your first ticket to get started"
                  : `No ${statusFilter.replace('_', ' ')} tickets at the moment`}
              </Text>
              {!searchQuery && statusFilter === "all" && (
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
  searchCard: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 4,
  },
  filterCard: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  filterTabs: {
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilterTab: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#94a3b8',
    textTransform: 'capitalize',
  },
  activeFilterTabText: {
    color: '#ffffff',
  },
  filterCount: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  activeFilterCount: {
    backgroundColor: '#3b82f6',
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activeFilterCountText: {
    color: '#ffffff',
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#94a3b8',
    textTransform: 'capitalize',
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

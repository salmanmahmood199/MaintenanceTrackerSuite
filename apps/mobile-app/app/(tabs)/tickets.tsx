import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiRequest } from "../../src/services/api";
import type { Ticket, WorkOrder } from "../../src/types";

export default function TicketsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<
    "all" | "last30" | "last7" | "today"
  >("last30");

  // Fetch tickets
  const {
    data: tickets = [],
    isLoading: ticketsLoading,
    refetch: refetchTickets,
  } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tickets");
      return (await response.json()) as Ticket[];
    },
  });

  // Fetch work orders for all tickets
  const { data: allTicketsWorkOrders = {} } = useQuery<
    Record<number, WorkOrder[]>
  >({
    queryKey: ["/api/tickets/work-orders/all"],
    queryFn: async () => {
      const workOrdersMap: Record<number, WorkOrder[]> = {};
      for (const ticket of tickets) {
        try {
          const response = await apiRequest(
            "GET",
            `/api/tickets/${ticket.id}/work-orders`,
          );
          if (response.ok) {
            workOrdersMap[ticket.id] = await response.json();
          }
        } catch (error) {
          workOrdersMap[ticket.id] = [];
        }
      }
      return workOrdersMap;
    },
    enabled: tickets.length > 0,
  });

  // Ticket action mutations
  const acceptTicketMutation = useMutation({
    mutationFn: async ({
      ticketId,
      technicianId,
      scheduledDate,
      scheduledTime,
    }: {
      ticketId: number;
      technicianId?: number;
      scheduledDate?: string;
      scheduledTime?: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/tickets/${ticketId}/accept`,
        {
          technicianId,
          scheduledDate,
          scheduledTime,
        },
      );
      if (!response.ok) {
        throw new Error("Failed to accept ticket");
      }
      return response.json();
    },
    onSuccess: () => {
      refetchTickets();
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
    },
  });

  const rejectTicketMutation = useMutation({
    mutationFn: async ({
      ticketId,
      reason,
    }: {
      ticketId: number;
      reason: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/tickets/${ticketId}/reject`,
        {
          rejectionReason: reason,
        },
      );
      if (!response.ok) {
        throw new Error("Failed to reject ticket");
      }
      return response.json();
    },
    onSuccess: () => {
      refetchTickets();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchTickets();
    setRefreshing(false);
  };

  // Filter tickets based on search and filters
  const getFilteredTickets = () => {
    let filtered = tickets;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ticket) =>
          ticket.title?.toLowerCase().includes(query) ||
          ticket.description?.toLowerCase().includes(query) ||
          ticket.id.toString().includes(query),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (ticket) => ticket.priority === priorityFilter,
      );
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter((ticket) => {
            const ticketDate = new Date(ticket.createdAt || 0);
            return ticketDate >= filterDate;
          });
          break;
        case "last7":
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter((ticket) => {
            const ticketDate = new Date(ticket.createdAt || 0);
            return ticketDate >= filterDate;
          });
          break;
        case "last30":
          filterDate.setDate(now.getDate() - 30);
          filtered = filtered.filter((ticket) => {
            const ticketDate = new Date(ticket.createdAt || 0);
            return ticketDate >= filterDate;
          });
          break;
      }
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const filteredTickets = getFilteredTickets();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#94a3b8";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "open":
        return "#06b6d4";
      case "accepted":
        return "#8b5cf6";
      case "in_progress":
        return "#3b82f6";
      case "completed":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      case "confirmed":
        return "#059669";
      case "ready_for_billing":
        return "#7c3aed";
      case "billed":
        return "#1f2937";
      default:
        return "#94a3b8";
    }
  };

  const hasReturnNeededWorkOrder = (
    ticket: Ticket,
    workOrders: WorkOrder[] = [],
  ) => {
    return workOrders.some((wo) => wo.completionStatus === "return_needed");
  };

  const handleTicketAction = (ticket: Ticket, action: "accept" | "reject") => {
    if (action === "accept") {
      Alert.alert(
        "Accept Ticket",
        "Are you sure you want to accept this ticket?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Accept",
            onPress: () => {
              acceptTicketMutation.mutate({ ticketId: ticket.id });
            },
          },
        ],
      );
    } else {
      Alert.prompt(
        "Reject Ticket",
        "Please provide a reason for rejection:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Reject",
            onPress: (reason) => {
              if (reason?.trim()) {
                rejectTicketMutation.mutate({ ticketId: ticket.id, reason });
              }
            },
          },
        ],
        "plain-text",
        "",
        "default",
      );
    }
  };

  const handleViewTicketDetails = (ticket: Ticket) => {
    router.push({
      pathname: `/ticket/${ticket.id}`,
      params: { ticket: JSON.stringify(ticket) },
    });
  };

  const handleCreateWorkOrder = (ticket: Ticket) => {
    router.push({
      pathname: `/ticket/${ticket.id}?action=work-order`,
      params: { ticket: JSON.stringify(ticket) },
    });
  };

  const getTicketActions = (ticket: Ticket) => {
    const actions = [
      {
        text: "View Details",
        icon: "eye",
        onPress: () => handleViewTicketDetails(ticket),
      },
    ];

    // Organization admin actions
    if (
      user?.role === "org_admin" ||
      (user?.role === "org_subadmin" &&
        user.permissions?.includes("accept_ticket"))
    ) {
      if (ticket.status === "open" || ticket.status === "pending") {
        actions.push(
          {
            text: "Accept Ticket",
            icon: "checkmark-circle",
            onPress: () => handleTicketAction(ticket, "accept"),
          },
          {
            text: "Reject Ticket",
            icon: "close-circle",
            onPress: () => handleTicketAction(ticket, "reject"),
          },
        );
      }
    }

    // Maintenance admin actions
    if (user?.role === "maintenance_admin") {
      if (
        ticket.maintenanceVendorId === user.maintenanceVendorId &&
        ticket.status === "accepted" &&
        !ticket.assigneeId
      ) {
        actions.push({
          text: "Accept & Assign Technician",
          icon: "person-add",
          onPress: () => handleTicketAction(ticket, "accept"),
        });
      }
      if (
        ticket.maintenanceVendorId === user.maintenanceVendorId &&
        ticket.status === "accepted"
      ) {
        actions.push({
          text: "Reject Assignment",
          icon: "close-circle",
          onPress: () => handleTicketAction(ticket, "reject"),
        });
      }
      if (
        (ticket.status === "open" || ticket.status === "pending") &&
        !ticket.maintenanceVendorId
      ) {
        actions.push(
          {
            text: "Accept Ticket",
            icon: "checkmark-circle",
            onPress: () => handleTicketAction(ticket, "accept"),
          },
          {
            text: "Reject Ticket",
            icon: "close-circle",
            onPress: () => handleTicketAction(ticket, "reject"),
          },
        );
      }
    }

    // Technician actions
    if (user?.role === "technician" && ticket.assigneeId === user.id) {
      if (ticket.status === "accepted") {
        actions.push({
          text: "Start Work",
          icon: "construct",
          onPress: () => handleCreateWorkOrder(ticket),
        });
      }
      if (ticket.status === "in-progress") {
        actions.push({
          text: "Complete Work",
          icon: "checkmark-circle",
          onPress: () => handleCreateWorkOrder(ticket),
        });
      }
      if (
        hasReturnNeededWorkOrder(ticket, allTicketsWorkOrders[ticket.id]) &&
        ![
          "pending_confirmation",
          "confirmed",
          "ready_for_billing",
          "billed",
        ].includes(ticket.status)
      ) {
        actions.push({
          text: "Create Another Work Order",
          icon: "construct",
          onPress: () => handleCreateWorkOrder(ticket),
        });
      }
    }

    return actions;
  };

  const FilterButton = ({
    title,
    value,
    activeValue,
    onPress,
  }: {
    title: string;
    value: string;
    activeValue: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        activeValue === value && styles.activeFilterButton,
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterButtonText,
          activeValue === value && styles.activeFilterButtonText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (ticketsLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#1e293b", "#7c3aed", "#1e293b"]}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#06b6d4" />
            <Text style={styles.loadingText}>Loading tickets...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#1e293b", "#7c3aed", "#1e293b"]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tickets</Text>
          <Text style={styles.headerSubtitle}>
            {filteredTickets.length} of {tickets.length} tickets
          </Text>
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersContainer}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={16}
              color="#94a3b8"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tickets..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterTabs}
          >
            <View style={styles.filterTabsContent}>
              <Text style={styles.filterLabel}>Status:</Text>
              <View style={styles.filterGroup}>
                <FilterButton
                  title="All"
                  value="all"
                  activeValue={statusFilter}
                  onPress={() => setStatusFilter("all")}
                />
                <FilterButton
                  title="Open"
                  value="open"
                  activeValue={statusFilter}
                  onPress={() => setStatusFilter("open")}
                />
                <FilterButton
                  title="Pending"
                  value="pending"
                  activeValue={statusFilter}
                  onPress={() => setStatusFilter("pending")}
                />
                <FilterButton
                  title="Accepted"
                  value="accepted"
                  activeValue={statusFilter}
                  onPress={() => setStatusFilter("accepted")}
                />
                <FilterButton
                  title="In Progress"
                  value="in_progress"
                  activeValue={statusFilter}
                  onPress={() => setStatusFilter("in_progress")}
                />
                <FilterButton
                  title="Completed"
                  value="completed"
                  activeValue={statusFilter}
                  onPress={() => setStatusFilter("completed")}
                />
              </View>
            </View>
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterTabs}
          >
            <View style={styles.filterTabsContent}>
              <Text style={styles.filterLabel}>Priority:</Text>
              <View style={styles.filterGroup}>
                <FilterButton
                  title="All"
                  value="all"
                  activeValue={priorityFilter}
                  onPress={() => setPriorityFilter("all")}
                />
                <FilterButton
                  title="High"
                  value="high"
                  activeValue={priorityFilter}
                  onPress={() => setPriorityFilter("high")}
                />
                <FilterButton
                  title="Medium"
                  value="medium"
                  activeValue={priorityFilter}
                  onPress={() => setPriorityFilter("medium")}
                />
                <FilterButton
                  title="Low"
                  value="low"
                  activeValue={priorityFilter}
                  onPress={() => setPriorityFilter("low")}
                />
              </View>
            </View>
          </ScrollView>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterTabs}
          >
            <View style={styles.filterTabsContent}>
              <Text style={styles.filterLabel}>Date:</Text>
              <View style={styles.filterGroup}>
                <FilterButton
                  title="All"
                  value="all"
                  activeValue={dateFilter}
                  onPress={() => setDateFilter("all")}
                />
                <FilterButton
                  title="Today"
                  value="today"
                  activeValue={dateFilter}
                  onPress={() => setDateFilter("today")}
                />
                <FilterButton
                  title="Last 7 days"
                  value="last7"
                  activeValue={dateFilter}
                  onPress={() => setDateFilter("last7")}
                />
                <FilterButton
                  title="Last 30 days"
                  value="last30"
                  activeValue={dateFilter}
                  onPress={() => setDateFilter("last30")}
                />
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Tickets List */}
        <ScrollView
          style={styles.ticketsList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#06b6d4"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.ticketsContainer}>
            {filteredTickets.map((ticket) => (
              <TouchableOpacity
                key={ticket.id}
                style={styles.ticketCard}
                onPress={() => handleViewTicketDetails(ticket)}
              >
                <View style={styles.ticketHeader}>
                  <View style={styles.ticketTitleContainer}>
                    <Text style={styles.ticketTitle}>
                      {ticket.title || "Untitled Ticket"}
                    </Text>
                    <Text style={styles.ticketNumber}>#{ticket.id}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.ticketMenuButton}
                    onPress={() => {
                      const actions = getTicketActions(ticket);
                      Alert.alert(
                        "Ticket Actions",
                        "What would you like to do?",
                        [
                          ...actions.map((action) => ({
                            text: action.text,
                            onPress: action.onPress,
                          })),
                          { text: "Cancel", style: "cancel" as const },
                        ],
                      );
                    }}
                  >
                    <Ionicons
                      name="ellipsis-vertical"
                      size={16}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.ticketBadges}>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: getStatusColor(ticket.status) },
                    ]}
                  >
                    <Text style={styles.badgeText}>
                      {ticket.status?.replace("_", " ").replace("-", " ")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: getPriorityColor(ticket.priority),
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.3)",
                      },
                    ]}
                  >
                    <Text style={styles.badgeText}>{ticket.priority}</Text>
                  </View>
                  {ticket.assignedToMarketplace && (
                    <View
                      style={[styles.badge, { backgroundColor: "#7c3aed" }]}
                    >
                      <Text style={styles.badgeText}>Marketplace</Text>
                    </View>
                  )}
                </View>

                {ticket.description && (
                  <Text style={styles.ticketDescription} numberOfLines={2}>
                    {ticket.description}
                  </Text>
                )}

                <View style={styles.ticketMeta}>
                  {ticket.reporterName && (
                    <View style={styles.metaItem}>
                      <Ionicons name="person" size={12} color="#64748b" />
                      <Text style={styles.metaText}>
                        By {ticket.reporterName}
                      </Text>
                    </View>
                  )}
                  {ticket.assignedTo && (
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="checkmark-circle"
                        size={12}
                        color="#10b981"
                      />
                      <Text style={styles.metaText}>
                        Assigned to {ticket.assignedTo}
                      </Text>
                    </View>
                  )}
                  {ticket.locationName && (
                    <View style={styles.metaItem}>
                      <Ionicons name="location" size={12} color="#64748b" />
                      <Text style={styles.metaText}>{ticket.locationName}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.ticketFooter}>
                  <Text style={styles.ticketDate}>
                    {ticket.createdAt &&
                      new Date(ticket.createdAt).toLocaleDateString()}
                  </Text>
                  <View style={styles.ticketIndicators}>
                    {ticket.images && ticket.images.length > 0 && (
                      <View style={styles.indicator}>
                        <Ionicons name="image" size={12} color="#94a3b8" />
                        <Text style={styles.indicatorText}>
                          {ticket.images.length}
                        </Text>
                      </View>
                    )}
                    {allTicketsWorkOrders[ticket.id]?.length > 0 && (
                      <View style={styles.indicator}>
                        <Ionicons name="construct" size={12} color="#94a3b8" />
                        <Text style={styles.indicatorText}>
                          {allTicketsWorkOrders[ticket.id].length}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {filteredTickets.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="ticket-outline" size={48} color="#64748b" />
                <Text style={styles.emptyTitle}>No Tickets Found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery.trim() ||
                  statusFilter !== "all" ||
                  priorityFilter !== "all" ||
                  dateFilter !== "all"
                    ? "No tickets match your current filters"
                    : "No tickets have been created yet"}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Floating Action Button */}
        {user &&
          (user.role === "org_admin" ||
            user.role === "org_subadmin" ||
            user.role === "residential") && (
            <TouchableOpacity
              style={styles.fab}
              onPress={() => router.push("/create-ticket")}
            >
              <LinearGradient
                colors={["#06b6d4", "#3b82f6"]}
                style={styles.fabGradient}
              >
                <Ionicons name="add" size={24} color="#ffffff" />
              </LinearGradient>
            </TouchableOpacity>
          )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1e293b",
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 16,
  },
  filterTabs: {
    marginBottom: 8,
  },
  filterTabsContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterLabel: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
  filterGroup: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  activeFilterButton: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  filterButtonText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "500",
  },
  activeFilterButtonText: {
    color: "#ffffff",
  },
  ticketsList: {
    flex: 1,
  },
  ticketsContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  ticketCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ticketTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 2,
  },
  ticketNumber: {
    fontSize: 12,
    color: "#94a3b8",
  },
  ticketMenuButton: {
    padding: 4,
  },
  ticketBadges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
    textTransform: "uppercase",
  },
  ticketDescription: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 12,
    lineHeight: 18,
  },
  ticketMeta: {
    marginBottom: 12,
    gap: 6,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: "#64748b",
  },
  ticketFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  ticketDate: {
    fontSize: 12,
    color: "#64748b",
  },
  ticketIndicators: {
    flexDirection: "row",
    gap: 12,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  indicatorText: {
    fontSize: 10,
    color: "#94a3b8",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});

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
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [organizationFilter, setOrganizationFilter] = useState<string>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

  // Fetch organizations (for filtering)
  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/organizations");
      if (!response.ok) return [];
      return response.json();
    },
  });

  // Fetch vendors (for filtering)
  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/maintenance-vendors");
      if (!response.ok) return [];
      return response.json();
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchTickets();
    setRefreshing(false);
  };

  // Enhanced filtering with search, date, org, and vendor
  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      ticket.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.ticketNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Date filtering
    const matchesDate = (() => {
      if (dateFilter === 'all') return true;
      const ticketDate = new Date(ticket.createdAt);
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          return ticketDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return ticketDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return ticketDate >= monthAgo;
        default:
          return true;
      }
    })();

    // Organization filtering
    const matchesOrganization = organizationFilter === 'all' || 
      ticket.organizationId?.toString() === organizationFilter;

    // Vendor filtering  
    const matchesVendor = vendorFilter === 'all' || 
      ticket.maintenanceVendorId?.toString() === vendorFilter;

    return matchesStatus && matchesSearch && matchesDate && matchesOrganization && matchesVendor;
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
        {/* Search and Filtering */}
        <Card style={styles.searchCard}>
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={22} color="#94a3b8" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tickets..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={22} color="#94a3b8" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              onPress={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={styles.filterToggle}
            >
              <Ionicons 
                name={showAdvancedFilters ? "options" : "filter-outline"} 
                size={22} 
                color="#3b82f6" 
              />
            </TouchableOpacity>
          </View>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <View style={styles.advancedFilters}>
              {/* Date Filter */}
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Date Range</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'all', label: 'All Time' },
                    { key: 'today', label: 'Today' },
                    { key: 'week', label: 'This Week' },
                    { key: 'month', label: 'This Month' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        dateFilter === option.key && styles.filterOptionActive
                      ]}
                      onPress={() => setDateFilter(option.key)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        dateFilter === option.key && styles.filterOptionTextActive
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Organization Filter (for vendor users) */}
              {user?.role === 'maintenance_admin' && organizations.length > 0 && (
                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Organization</Text>
                  <View style={styles.filterOptions}>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        organizationFilter === 'all' && styles.filterOptionActive
                      ]}
                      onPress={() => setOrganizationFilter('all')}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        organizationFilter === 'all' && styles.filterOptionTextActive
                      ]}>
                        All Orgs
                      </Text>
                    </TouchableOpacity>
                    {organizations.slice(0, 3).map((org: any) => (
                      <TouchableOpacity
                        key={org.id}
                        style={[
                          styles.filterOption,
                          organizationFilter === org.id.toString() && styles.filterOptionActive
                        ]}
                        onPress={() => setOrganizationFilter(org.id.toString())}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          organizationFilter === org.id.toString() && styles.filterOptionTextActive
                        ]}>
                          {org.name.substring(0, 12)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Vendor Filter (for organization users) */}
              {user?.role === 'org_admin' && vendors.length > 0 && (
                <View style={styles.filterRow}>
                  <Text style={styles.filterLabel}>Vendor</Text>
                  <View style={styles.filterOptions}>
                    <TouchableOpacity
                      style={[
                        styles.filterOption,
                        vendorFilter === 'all' && styles.filterOptionActive
                      ]}
                      onPress={() => setVendorFilter('all')}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        vendorFilter === 'all' && styles.filterOptionTextActive
                      ]}>
                        All Vendors
                      </Text>
                    </TouchableOpacity>
                    {vendors.slice(0, 3).map((vendor: any) => (
                      <TouchableOpacity
                        key={vendor.id}
                        style={[
                          styles.filterOption,
                          vendorFilter === vendor.id.toString() && styles.filterOptionActive
                        ]}
                        onPress={() => setVendorFilter(vendor.id.toString())}
                      >
                        <Text style={[
                          styles.filterOptionText,
                          vendorFilter === vendor.id.toString() && styles.filterOptionTextActive
                        ]}>
                          {vendor.name.substring(0, 12)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Quick Stats with Better Visibility */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="alert-circle" size={18} color="#ffffff" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{getPriorityCount('high')}</Text>
                <Text style={styles.statLabel}>High Priority</Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="time" size={18} color="#ffffff" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{getNewTicketsCount()}</Text>
                <Text style={styles.statLabel}>New Today</Text>
              </View>
            </View>
            
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Ionicons name="construct" size={18} color="#ffffff" />
              </View>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{getStatusCount('in_progress')}</Text>
                <Text style={styles.statLabel}>Active</Text>
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

        {/* Status Filter Tabs - More Visible */}
        <Card style={styles.filterCard}>
          <Text style={styles.sectionTitle}>
            {filteredTickets.length < tickets.length ? 
              `Filtered Results (${filteredTickets.length} of ${tickets.length})` : 
              'Ticket Status'}
          </Text>
          <View style={styles.statusTabs}>
            {[
              { key: 'all', label: 'All', count: filteredTickets.length, icon: 'list-outline', color: '#64748b' },
              { key: 'pending', label: 'Pending', count: filteredTickets.filter(t => t.status === 'pending').length, icon: 'hourglass-outline', color: '#f59e0b' },
              { key: 'in_progress', label: 'Active', count: filteredTickets.filter(t => t.status === 'in_progress').length, icon: 'hammer-outline', color: '#3b82f6' },
              { key: 'completed', label: 'Done', count: filteredTickets.filter(t => t.status === 'completed').length, icon: 'checkmark-circle-outline', color: '#10b981' },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.statusTab,
                  filterStatus === filter.key && styles.statusTabActive
                ]}
                onPress={() => setFilterStatus(filter.key)}
              >
                <View style={styles.statusTabContent}>
                  <Ionicons 
                    name={filter.icon as any} 
                    size={24} 
                    color={filterStatus === filter.key ? '#ffffff' : filter.color} 
                  />
                  <Text style={[
                    styles.statusTabCount,
                    filterStatus === filter.key && styles.statusTabCountActive
                  ]}>
                    {filter.count}
                  </Text>
                  <Text style={[
                    styles.statusTabLabel,
                    filterStatus === filter.key && styles.statusTabLabelActive
                  ]}>
                    {filter.label}
                  </Text>
                </View>
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
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  filterToggle: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#1e293b',
  },
  advancedFilters: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 16,
  },
  filterRow: {
    gap: 12,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#475569',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#64748b',
  },
  filterOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#475569',
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  statIcon: {
    width: 36,
    height: 36,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 20,
  },
  statLabel: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '500',
    marginTop: 2,
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
  statusTabs: {
    flexDirection: 'row',
    gap: 10,
  },
  statusTab: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 85,
  },
  statusTabActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
    transform: [{ scale: 1.02 }],
    elevation: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statusTabContent: {
    alignItems: 'center',
    gap: 6,
  },
  statusTabCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e2e8f0',
    lineHeight: 22,
  },
  statusTabCountActive: {
    color: '#ffffff',
  },
  statusTabLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    textAlign: 'center',
  },
  statusTabLabelActive: {
    color: '#ffffff',
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

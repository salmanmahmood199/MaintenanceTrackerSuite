import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiRequest } from '../../src/services/api';
import type { 
  Ticket,
  Organization, 
  MaintenanceVendor, 
  User,
  Location 
} from '../../src/types';

interface VendorTier {
  vendor: MaintenanceVendor;
  tier: string;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<MaintenanceVendor | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'organization' | 'vendor'>('dashboard');
  const [ticketDateFilter, setTicketDateFilter] = useState<'all' | 'last30' | 'last7' | 'today'>('last30');

  // Fetch tickets
  const { data: tickets = [], isLoading: ticketsLoading, refetch: refetchTickets } = useQuery<Ticket[]>({
    queryKey: ['/api/tickets'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/tickets');
      return await response.json() as Ticket[];
    },
  });

  // Fetch organizations (for root admin)
  const { data: organizations = [] } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/organizations');
      return await response.json() as Organization[];
    },
    enabled: user?.role === 'root',
  });

  // Fetch vendor tiers (for root admin)
  const { data: vendorTiers = [] } = useQuery<VendorTier[]>({
    queryKey: ['/api/vendor-tiers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/vendor-tiers');
      return await response.json() as VendorTier[];
    },
    enabled: user?.role === 'root',
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchTickets(),
      queryClient.invalidateQueries({ queryKey: ['/api/organizations'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-tiers'] }),
    ]);
    setRefreshing(false);
  };

  // Filter tickets based on date range
  const getFilteredTickets = () => {
    const now = new Date();
    const filterDate = new Date();

    switch (ticketDateFilter) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0);
        return tickets.filter(ticket => {
          const ticketDate = new Date(ticket.createdAt || 0);
          return ticketDate >= filterDate;
        });
      case 'last7':
        filterDate.setDate(now.getDate() - 7);
        return tickets.filter(ticket => {
          const ticketDate = new Date(ticket.createdAt || 0);
          return ticketDate >= filterDate;
        });
      case 'last30':
        filterDate.setDate(now.getDate() - 30);
        return tickets.filter(ticket => {
          const ticketDate = new Date(ticket.createdAt || 0);
          return ticketDate >= filterDate;
        });
      case 'all':
      default:
        return tickets;
    }
  };

  const filteredTickets = getFilteredTickets();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#94a3b8';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#8b5cf6';
      case 'in_progress': return '#06b6d4';
      case 'completed': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const handleCreateTicket = () => {
    router.push('/create-ticket');
  };

  const handleViewTicketDetails = (ticket: Ticket) => {
    router.push(`/ticket/${ticket.id}`);
  };

  const handleTicketAction = (ticket: Ticket, action: 'accept' | 'reject') => {
    // Navigate to ticket details with action parameter
    router.push(`/ticket/${ticket.id}?action=${action}`);
  };

  if (ticketsLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1e293b', '#7c3aed', '#1e293b']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#06b6d4" />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const renderRootDashboard = () => (
    <View style={styles.content}>
      {/* Statistics Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View>
              <Text style={styles.statLabel}>Organizations</Text>
              <Text style={styles.statValue}>{organizations.length}</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="business" size={20} color="#3b82f6" />
            </View>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View>
              <Text style={styles.statLabel}>Vendors</Text>
              <Text style={styles.statValue}>{vendorTiers.length}</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="construct" size={20} color="#10b981" />
            </View>
          </View>
        </View>
      </View>

      {/* Organizations List */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="business" size={20} color="#ffffff" />
          <Text style={styles.sectionTitle}>Organizations</Text>
        </View>
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {organizations.map((org) => (
            <TouchableOpacity
              key={org.id}
              style={styles.listItem}
              onPress={() => {
                setSelectedOrganization(org);
                setCurrentView('organization');
              }}
            >
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{org.name}</Text>
                <Text style={styles.listItemSubtitle}>{org.email}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Vendors List */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="construct" size={20} color="#ffffff" />
          <Text style={styles.sectionTitle}>Maintenance Vendors</Text>
        </View>
        <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
          {vendorTiers.map((vendorTier) => (
            <TouchableOpacity
              key={vendorTier.vendor.id}
              style={styles.listItem}
              onPress={() => {
                setSelectedVendor(vendorTier.vendor);
                setCurrentView('vendor');
              }}
            >
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{vendorTier.vendor.name}</Text>
                <Text style={styles.listItemSubtitle}>{vendorTier.vendor.email}</Text>
                <Text style={styles.listItemTier}>Tier: {vendorTier.tier}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderTicketDashboard = () => (
    <View style={styles.content}>
      {/* Statistics Cards */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View>
              <Text style={styles.statLabel}>Total Tickets</Text>
              <Text style={styles.statValue}>{tickets.length}</Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="ticket" size={20} color="#3b82f6" />
            </View>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View>
              <Text style={styles.statLabel}>Open</Text>
              <Text style={styles.statValue}>
                {tickets.filter((t: any) => t.status === 'open' || t.status === 'pending').length}
              </Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
              <Ionicons name="alert-circle" size={20} color="#f59e0b" />
            </View>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      {user && (user.role === 'org_admin' || user.role === 'org_subadmin' || user.role === 'residential') && (
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={handleCreateTicket}>
            <LinearGradient colors={['#06b6d4', '#3b82f6']} style={styles.quickActionGradient}>
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.quickActionText}>New Ticket</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Date Filter */}
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>
          Showing {filteredTickets.length} of {tickets.length} tickets
        </Text>
        <View style={styles.filterButtons}>
          {['today', 'last7', 'last30', 'all'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                ticketDateFilter === filter && styles.activeFilterButton
              ]}
              onPress={() => setTicketDateFilter(filter as any)}
            >
              <Text style={[
                styles.filterButtonText,
                ticketDateFilter === filter && styles.activeFilterButtonText
              ]}>
                {filter === 'last7' ? 'Last 7 days' : 
                 filter === 'last30' ? 'Last 30 days' : 
                 filter === 'today' ? 'Today' : 'All tickets'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Tickets */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="list" size={20} color="#ffffff" />
          <Text style={styles.sectionTitle}>Recent Tickets</Text>
        </View>
        <ScrollView style={styles.ticketsContainer} showsVerticalScrollIndicator={false}>
          {filteredTickets.slice(0, 20).map((ticket: any) => (
            <TouchableOpacity
              key={ticket.id}
              style={styles.ticketCard}
              onPress={() => handleViewTicketDetails(ticket)}
            >
              <View style={styles.ticketHeader}>
                <View style={styles.ticketTitleContainer}>
                  <Text style={styles.ticketTitle}>{ticket.title || 'Untitled Ticket'}</Text>
                  <Text style={styles.ticketNumber}>{ticket.ticketNumber || `#${ticket.id}`}</Text>
                </View>
                <TouchableOpacity
                  style={styles.ticketMenuButton}
                  onPress={() => {
                    Alert.alert(
                      'Ticket Actions',
                      'What would you like to do?',
                      [
                        { text: 'View Details', onPress: () => handleViewTicketDetails(ticket) },
                        ...(user?.role === 'org_admin' && (ticket.status === 'open' || ticket.status === 'pending') ? [
                          { text: 'Accept Ticket', onPress: () => handleTicketAction(ticket, 'accept') },
                          { text: 'Reject Ticket', onPress: () => handleTicketAction(ticket, 'reject') },
                        ] : []),
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.ticketBadges}>
                <View style={[styles.badge, { backgroundColor: getStatusColor(ticket.status) }]}>
                  <Text style={styles.badgeText}>{ticket.status?.replace('_', ' ').replace('-', ' ')}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: getPriorityColor(ticket.priority), borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }]}>
                  <Text style={styles.badgeText}>{ticket.priority}</Text>
                </View>
              </View>

              {ticket.description && (
                <Text style={styles.ticketDescription} numberOfLines={2}>
                  {ticket.description}
                </Text>
              )}

              <View style={styles.ticketFooter}>
                <Text style={styles.ticketDate}>
                  {ticket.createdAt && new Date(ticket.createdAt).toLocaleDateString()}
                </Text>
                {ticket.images && ticket.images.length > 0 && (
                  <View style={styles.imageIndicator}>
                    <Ionicons name="image" size={12} color="#94a3b8" />
                    <Text style={styles.imageCount}>{ticket.images.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderOrganizationView = () => (
    <View style={styles.content}>
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentView('dashboard')}
        >
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.viewTitle}>{selectedOrganization?.name}</Text>
          <Text style={styles.viewSubtitle}>Organization Dashboard</Text>
        </View>
      </View>

      {/* Organization stats would go here */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View>
              <Text style={styles.statLabel}>Active Tickets</Text>
              <Text style={styles.statValue}>
                {tickets.filter(t => t.organizationId === selectedOrganization?.id).length}
              </Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="ticket" size={20} color="#3b82f6" />
            </View>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statValue}>
                {tickets.filter(t => t.organizationId === selectedOrganization?.id && t.status === 'completed').length}
              </Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderVendorView = () => (
    <View style={styles.content}>
      <View style={styles.backButtonContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setCurrentView('dashboard')}
        >
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.viewTitle}>{selectedVendor?.name}</Text>
          <Text style={styles.viewSubtitle}>Vendor Dashboard</Text>
        </View>
      </View>

      {/* Vendor stats would go here */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View>
              <Text style={styles.statLabel}>Assigned Tickets</Text>
              <Text style={styles.statValue}>
                {tickets.filter(t => t.maintenanceVendorId === selectedVendor?.id).length}
              </Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="ticket" size={20} color="#3b82f6" />
            </View>
          </View>
        </View>
        <View style={styles.statCard}>
          <View style={styles.statContent}>
            <View>
              <Text style={styles.statLabel}>Completed</Text>
              <Text style={styles.statValue}>
                {tickets.filter(t => t.maintenanceVendorId === selectedVendor?.id && t.status === 'completed').length}
              </Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1e293b', '#7c3aed', '#1e293b']} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#06b6d4" />
          }
          showsVerticalScrollIndicator={false}
        >
          {currentView === 'dashboard' && user?.role === 'root' ? renderRootDashboard() :
           currentView === 'organization' ? renderOrganizationView() :
           currentView === 'vendor' ? renderVendorView() :
           renderTicketDashboard()}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActions: {
    marginBottom: 24,
  },
  quickActionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  quickActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterContainer: {
    marginBottom: 24,
  },
  filterLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeFilterButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#ffffff',
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  listContainer: {
    maxHeight: 200,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  listItemSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  listItemTier: {
    fontSize: 10,
    color: '#06b6d4',
    marginTop: 2,
  },
  ticketsContainer: {
    maxHeight: 400,
  },
  ticketCard: {
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  ticketTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  ticketNumber: {
    fontSize: 12,
    color: '#94a3b8',
  },
  ticketMenuButton: {
    padding: 4,
  },
  ticketBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  ticketDescription: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
    lineHeight: 16,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDate: {
    fontSize: 10,
    color: '#64748b',
  },
  imageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageCount: {
    fontSize: 10,
    color: '#94a3b8',
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  viewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  viewSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
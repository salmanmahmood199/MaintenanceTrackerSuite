import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Modal,
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
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  
  // For scrollable date picker
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth());
  const [tempDay, setTempDay] = useState(new Date().getDate());

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
        case 'custom':
          if (!customStartDate) return true;
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          const end = customEndDate ? new Date(customEndDate) : new Date();
          end.setHours(23, 59, 59, 999);
          return ticketDate >= start && ticketDate <= end;
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
        leftAction={{
          icon: "menu",
          onPress: () => setShowMenu(true)
        }}
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
                    { key: 'custom', label: 'Custom' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.filterOption,
                        dateFilter === option.key && styles.filterOptionActive
                      ]}
                      onPress={() => {
                        setDateFilter(option.key);
                        if (option.key === 'custom') {
                          // Initialize temp values with current date
                          const now = new Date();
                          setTempYear(now.getFullYear());
                          setTempMonth(now.getMonth());
                          setTempDay(now.getDate());
                          setShowDatePicker('start');
                        }
                      }}
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
                
                {/* Custom Date Range Selection */}
                {dateFilter === 'custom' && (
                  <View style={styles.customDateRange}>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => {
                        // Initialize temp values with current start date or today
                        const initDate = customStartDate || new Date();
                        setTempYear(initDate.getFullYear());
                        setTempMonth(initDate.getMonth());
                        setTempDay(initDate.getDate());
                        setShowDatePicker('start');
                      }}
                    >
                      <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
                      <Text style={styles.datePickerButtonText}>
                        Start: {customStartDate ? customStartDate.toLocaleDateString() : 'Select Date'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => {
                        // Initialize temp values with current end date or today
                        const initDate = customEndDate || new Date();
                        setTempYear(initDate.getFullYear());
                        setTempMonth(initDate.getMonth());
                        setTempDay(initDate.getDate());
                        setShowDatePicker('end');
                      }}
                    >
                      <Ionicons name="calendar-outline" size={16} color="#3b82f6" />
                      <Text style={styles.datePickerButtonText}>
                        End: {customEndDate ? customEndDate.toLocaleDateString() : 'Select Date'}
                      </Text>
                    </TouchableOpacity>
                    
                    {(customStartDate || customEndDate) && (
                      <TouchableOpacity
                        style={styles.clearDateButton}
                        onPress={() => {
                          setCustomStartDate(null);
                          setCustomEndDate(null);
                        }}
                      >
                        <Text style={styles.clearDateButtonText}>Clear</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
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

        {/* Tickets List - Cleaner Layout */}
        {ticketsLoading ? (
          <Card style={styles.loadingCard}>
            <View style={styles.loadingContent}>
              <Text style={styles.loadingText}>Loading tickets...</Text>
            </View>
          </Card>
        ) : filteredTickets.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Ionicons name="ticket-outline" size={48} color="#64748b" />
            <Text style={styles.emptyTitle}>No Tickets Found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery || filterStatus !== 'all' || dateFilter !== 'all' || organizationFilter !== 'all' || vendorFilter !== 'all'
                ? 'No tickets match your current filters. Try adjusting your search criteria.'
                : user?.role === 'maintenance_admin'
                ? 'No tickets assigned to your vendor yet. Check back later for new work assignments.'
                : 'You haven\'t created any tickets yet. Tap "New Ticket" to get started.'}
            </Text>
            {user?.role !== 'maintenance_admin' && (
              <Button
                variant="primary"
                size="sm"
                title="Create First Ticket"
                onPress={() => router.push("/create-ticket")}
                style={styles.emptyButton}
              />
            )}
          </Card>
        ) : (
          <>
            {/* Tickets List Header */}
            <View style={styles.ticketsHeader}>
              <Text style={styles.ticketsHeaderText}>
                Recent Tickets ({Math.min(filteredTickets.length, 8)})
              </Text>
              {filteredTickets.length > 8 && (
                <TouchableOpacity onPress={() => router.push("/tickets")}>
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Clean Tickets List */}
            <View style={styles.ticketsList}>
              {filteredTickets.slice(0, 8).map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() => router.push(`/ticket/${ticket.id}`)}
                  style={styles.ticketCard}
                />
              ))}
            </View>
            
            {/* Footer Spacing */}
            <View style={styles.footerSpacing} />
          </>
        )}

        {/* Scrollable Date Picker Modal */}
        {showDatePicker && (
          <Modal transparent animationType="fade" visible={true}>
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerContainer}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.datePickerTitle}>
                    Select {showDatePicker === 'start' ? 'Start' : 'End'} Date
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(null)}
                    style={styles.datePickerClose}
                  >
                    <Ionicons name="close" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.scrollablePicker}>
                  {/* Month Picker */}
                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerLabel}>Month</Text>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                      {Array.from({ length: 12 }, (_, i) => (
                        <TouchableOpacity
                          key={i}
                          style={[
                            styles.pickerItem,
                            tempMonth === i && styles.pickerItemActive
                          ]}
                          onPress={() => setTempMonth(i)}
                        >
                          <Text style={[
                            styles.pickerText,
                            tempMonth === i && styles.pickerTextActive
                          ]}>
                            {new Date(0, i).toLocaleDateString('en', { month: 'short' })}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  
                  {/* Day Picker */}
                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerLabel}>Day</Text>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                      {Array.from({ length: new Date(tempYear, tempMonth + 1, 0).getDate() }, (_, i) => (
                        <TouchableOpacity
                          key={i + 1}
                          style={[
                            styles.pickerItem,
                            tempDay === i + 1 && styles.pickerItemActive
                          ]}
                          onPress={() => setTempDay(i + 1)}
                        >
                          <Text style={[
                            styles.pickerText,
                            tempDay === i + 1 && styles.pickerTextActive
                          ]}>
                            {i + 1}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                  
                  {/* Year Picker */}
                  <View style={styles.pickerColumn}>
                    <Text style={styles.pickerLabel}>Year</Text>
                    <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - 5 + i;
                        return (
                          <TouchableOpacity
                            key={year}
                            style={[
                              styles.pickerItem,
                              tempYear === year && styles.pickerItemActive
                            ]}
                            onPress={() => setTempYear(year)}
                          >
                            <Text style={[
                              styles.pickerText,
                              tempYear === year && styles.pickerTextActive
                            ]}>
                              {year}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>
                
                <View style={styles.datePickerActions}>
                  <Button
                    variant="secondary"
                    size="sm"
                    title="Cancel"
                    onPress={() => setShowDatePicker(null)}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    title="Select"
                    onPress={() => {
                      const selectedDate = new Date(tempYear, tempMonth, tempDay);
                      if (showDatePicker === 'start') {
                        setCustomStartDate(selectedDate);
                      } else {
                        setCustomEndDate(selectedDate);
                      }
                      setShowDatePicker(null);
                    }}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Hamburger Menu Modal */}
        {showMenu && (
          <Modal transparent animationType="slide" visible={true}>
            <View style={styles.menuOverlay}>
              <View style={styles.menuContainer}>
                <View style={styles.menuHeader}>
                  <Text style={styles.menuTitle}>Menu</Text>
                  <TouchableOpacity
                    onPress={() => setShowMenu(false)}
                    style={styles.menuClose}
                  >
                    <Ionicons name="close" size={24} color="#ffffff" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.menuItems}>
                  {/* Conditional menu items based on user role */}
                  {user?.role !== 'maintenance_admin' && (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setShowMenu(false);
                        router.push("/create-ticket");
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={24} color="#3b82f6" />
                      <Text style={styles.menuItemText}>New Ticket</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowMenu(false);
                      router.push("/tickets");
                    }}
                  >
                    <Ionicons name="list-outline" size={24} color="#3b82f6" />
                    <Text style={styles.menuItemText}>All Tickets</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowMenu(false);
                      router.push("/calendar");
                    }}
                  >
                    <Ionicons name="calendar-outline" size={24} color="#3b82f6" />
                    <Text style={styles.menuItemText}>Calendar</Text>
                  </TouchableOpacity>
                  
                  {user?.role !== 'maintenance_admin' && (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={() => {
                        setShowMenu(false);
                        router.push("/marketplace");
                      }}
                    >
                      <Ionicons name="storefront-outline" size={24} color="#3b82f6" />
                      <Text style={styles.menuItemText}>Marketplace</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowMenu(false);
                      router.push("/invoices");
                    }}
                  >
                    <Ionicons name="receipt-outline" size={24} color="#3b82f6" />
                    <Text style={styles.menuItemText}>Invoices</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
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
  customDateRange: {
    marginTop: 16,
    gap: 12,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  datePickerButtonText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '500',
  },
  clearDateButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearDateButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    minWidth: 300,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  datePickerClose: {
    padding: 4,
  },
  dateInputContainer: {
    gap: 16,
  },
  dateInputLabel: {
    fontSize: 14,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  dateInput: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  dateQuickPicks: {
    gap: 8,
  },
  quickPickLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  quickPickButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickPickButton: {
    backgroundColor: '#475569',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickPickText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingCard: {
    marginBottom: 20,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  ticketsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  ticketsHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '600',
  },
  ticketsList: {
    gap: 12,
  },
  footerSpacing: {
    height: 40,
  },

  scrollablePicker: {
    flexDirection: 'row',
    height: 200,
    gap: 12,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  pickerScroll: {
    flex: 1,
    width: '100%',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemActive: {
    backgroundColor: '#3b82f6',
  },
  pickerText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '500',
  },
  pickerTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 300,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ffffff',
  },
  menuClose: {
    padding: 4,
  },
  menuItems: {
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#334155',
    borderRadius: 12,
    gap: 12,
  },
  menuItemText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
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

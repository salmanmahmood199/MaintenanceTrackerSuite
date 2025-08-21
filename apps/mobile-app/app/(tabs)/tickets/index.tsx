import React, { useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { apiRequest } from "../../../src/services/api";
import { Header } from "../../../src/components/ui/Header";

export default function TicketsScreen() {
  const router = useRouter();

  const { data: tickets = [], isLoading, isRefetching, refetch, isError, error } = useQuery({
    queryKey: ["tickets"], // Simple key to avoid over-caching
    staleTime: 0, // Always refetch when navigating back to this screen
    cacheTime: 0, // Don't cache at all to prevent stale data
    refetchOnMount: "always",
    refetchOnFocus: true,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      try {
        console.log('Fetching tickets - Cache busted with fresh query');
        const response = await apiRequest('GET', "/api/tickets");
        const data = await response.json();
        console.log('Tickets API response count:', data?.length || 0);
        console.log('First few tickets:', data?.slice(0, 3)?.map((t: any) => ({
          id: t.id,
          number: t.ticketNumber,
          vendorId: t.maintenanceVendorId
        })));
        
        // Handle different response formats from the API
        const ticketsData = data?.tickets ?? data ?? [];
        // Ensure we always return an array
        const finalTickets = Array.isArray(ticketsData) ? ticketsData : [];
        console.log('Final tickets being returned to UI:', finalTickets.length);
        return finalTickets;
      } catch (err) {
        console.error('Error fetching tickets:', err);
        throw err;
      }
    },
  });

  // Refresh tickets when screen comes into focus with cache busting
  useFocusEffect(
    React.useCallback(() => {
      console.log('Screen focused - forcing fresh ticket fetch');
      refetch();
    }, [refetch])
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#94a3b8', marginTop: 16, fontSize: 16 }}>Loading tickets...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
          Failed to load tickets
        </Text>
        <Text style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center' }}>
          {(error as any)?.message ?? "Unknown error"}
        </Text>
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'accepted': return '#3b82f6';
      case 'in_progress': return '#8b5cf6';
      case 'completed': return '#10b981';
      case 'confirmed': return '#059669';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'urgent': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      <Header 
        title="All Tickets" 
        subtitle={`${tickets.length} total tickets`}
        variant="gradient"
        showBack={true}
        onBack={() => router.back()}
      />

      <FlatList
        data={tickets}
        keyExtractor={(item) => String(item.id ?? item._id)}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.ticketCard}
            onPress={() => {
              const ticketId = item.id ?? item._id;
              console.log('Navigating to ticket:', ticketId);
              // Use the simpler route structure
              router.push(`/ticket/${ticketId}`);
            }}
          >
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketNumber}>
                {item.ticketNumber ?? `#${item.id ?? item._id}`}
              </Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status ?? "open"}</Text>
              </View>
            </View>
            
            <Text style={styles.ticketTitle} numberOfLines={2}>
              {item.title ?? "No title"}
            </Text>
            
            {item.description && (
              <Text style={styles.ticketDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            
            <View style={styles.ticketFooter}>
              <View style={styles.ticketMeta}>
                {item.priority && (
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
                    <Text style={styles.priorityText}>{item.priority}</Text>
                  </View>
                )}
                {item.createdAt && (
                  <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
              {item.location?.name && (
                <Text style={styles.locationText}>{item.location.name}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tickets found</Text>
            <Text style={styles.emptySubtext}>New tickets will appear here</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tickets.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  ticketCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 6,
  },
  ticketDescription: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  locationText: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
    maxWidth: 120,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Chip, FAB, Appbar } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

// Import shared types
import type { Ticket } from '@maintenance/shared';

const DashboardScreen = ({ navigation }: any) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      // TODO: Implement API call to fetch tickets
      // For now, using mock data
      setTickets([
        {
          id: 1,
          title: 'Broken Air Conditioning',
          description: 'AC unit not working in conference room',
          priority: 'high',
          status: 'open',
          createdAt: new Date().toISOString(),
          // ... other required fields
        } as Ticket,
      ]);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#3b82f6';
      case 'in-progress': return '#f59e0b';
      case 'completed': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderTicket = ({ item }: { item: Ticket }) => (
    <Card 
      style={styles.ticketCard}
      onPress={() => navigation.navigate('TicketDetails', { ticket: item })}
    >
      <Card.Content>
        <View style={styles.ticketHeader}>
          <Title style={styles.ticketTitle}>{item.title}</Title>
          <View style={styles.chips}>
            <Chip 
              mode="flat" 
              textStyle={{ color: 'white' }}
              style={[styles.chip, { backgroundColor: getPriorityColor(item.priority) }]}
            >
              {item.priority?.toUpperCase()}
            </Chip>
            <Chip 
              mode="flat" 
              textStyle={{ color: 'white' }}
              style={[styles.chip, { backgroundColor: getStatusColor(item.status) }]}
            >
              {item.status?.toUpperCase()}
            </Chip>
          </View>
        </View>
        <Paragraph style={styles.description} numberOfLines={2}>
          {item.description}
        </Paragraph>
        <Paragraph style={styles.date}>
          Created: {new Date(item.createdAt).toLocaleDateString()}
        </Paragraph>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Dashboard" />
        <Appbar.Action icon="logout" onPress={logout} />
      </Appbar.Header>
      
      <FlatList
        data={tickets}
        renderItem={renderTicket}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Title>No Tickets</Title>
              <Paragraph>You don't have any tickets yet.</Paragraph>
            </Card.Content>
          </Card>
        }
      />
      
      {user?.role === 'org_admin' || user?.role === 'org_subadmin' ? (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('CreateTicket')}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 16,
  },
  ticketCard: {
    marginBottom: 12,
    elevation: 2,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketTitle: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
  },
  chips: {
    flexDirection: 'row',
    gap: 4,
  },
  chip: {
    height: 24,
  },
  description: {
    marginBottom: 8,
    opacity: 0.7,
  },
  date: {
    fontSize: 12,
    opacity: 0.5,
  },
  emptyCard: {
    marginTop: 50,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3b82f6',
  },
});

export default DashboardScreen;
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Chip, FAB, Appbar, Text, Menu, IconButton } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

// Define Ticket type locally since shared import path isn't available
interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  createdAt: string;
  organizationId?: number;
  maintenanceVendorId?: number;
  assigneeId?: number;
  reporterId: number;
  locationId?: number;
  images?: string[];
}

const DashboardScreen = ({ navigation }: any) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tickets', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      } else {
        console.error('Failed to fetch tickets:', response.status);
        setTickets([]);
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      setTickets([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  const toggleMenu = (ticketId: number) => {
    setMenuVisible(prev => ({
      ...prev,
      [ticketId]: !prev[ticketId]
    }));
  };

  const closeMenu = (ticketId: number) => {
    setMenuVisible(prev => ({
      ...prev,
      [ticketId]: false
    }));
  };

  const handleVerifyJobCompleted = async (ticket: Ticket) => {
    closeMenu(ticket.id);
    
    Alert.alert(
      'Verify Job Completed',
      'Are you satisfied with the completed work? This will mark the ticket as ready for billing.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Verify & Send to Billing',
          style: 'default',
          onPress: async () => {
            try {
              const response = await fetch(`http://localhost:5000/api/tickets/${ticket.id}/confirm`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  confirmed: true,
                  feedback: 'Verified via mobile app',
                }),
              });

              if (response.ok) {
                Alert.alert('Success', 'Job verified and sent to billing successfully');
                fetchTickets(); // Refresh the ticket list
              } else {
                const errorData = await response.json();
                Alert.alert('Error', errorData.message || 'Failed to verify job completion');
              }
            } catch (error) {
              console.error('Verify job completion error:', error);
              Alert.alert('Error', 'Failed to verify job completion. Please try again.');
            }
          },
        },
      ],
    );
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
      case 'assigned': return '#8b5cf6';
      case 'in_progress': return '#f59e0b';
      case 'pending_confirmation': return '#f97316';
      case 'confirmed': return '#06b6d4';
      case 'ready_for_billing': return '#10b981';
      case 'billed': return '#22c55e';
      case 'marketplace': return '#ec4899';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Open';
      case 'assigned': return 'Assigned';
      case 'in_progress': return 'In Progress';
      case 'pending_confirmation': return 'Pending Confirmation';
      case 'confirmed': return 'Confirmed';
      case 'ready_for_billing': return 'Ready for Billing';
      case 'billed': return 'Billed';
      case 'marketplace': return 'Marketplace';
      default: return status;
    }
  };

  const renderTicket = ({ item }: { item: Ticket }) => (
    <Card 
      style={styles.ticketCard}
      onPress={() => navigation.navigate('TicketDetails', { ticket: item })}
    >
      <Card.Content>
        <View style={styles.ticketHeader}>
          <Title style={styles.ticketTitle} numberOfLines={2}>{item.title}</Title>
          <View style={styles.headerRight}>
            <View style={styles.chips}>
              <Chip 
                mode="flat" 
                textStyle={{ color: 'white', fontSize: 10 }}
                style={[styles.chip, { backgroundColor: getPriorityColor(item.priority) }]}
              >
                {item.priority?.toUpperCase()}
              </Chip>
              <Chip 
                mode="flat" 
                textStyle={{ color: 'white', fontSize: 10 }}
                style={[styles.chip, { backgroundColor: getStatusColor(item.status) }]}
              >
                {getStatusLabel(item.status)}
              </Chip>
            </View>
            <Menu
              visible={menuVisible[item.id] || false}
              onDismiss={() => closeMenu(item.id)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  size={20}
                  onPress={() => toggleMenu(item.id)}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  closeMenu(item.id);
                  navigation.navigate('TicketDetails', { ticket: item });
                }}
                title="View Details"
                leadingIcon="eye"
              />
              <Menu.Item
                onPress={() => {
                  closeMenu(item.id);
                  navigation.navigate('TicketDetails', { ticket: item, scrollToComments: true });
                }}
                title="Comments"
                leadingIcon="comment"
              />
              <Menu.Item
                onPress={() => {
                  closeMenu(item.id);
                  navigation.navigate('TicketDetails', { ticket: item, showProgress: true });
                }}
                title="Progress"
                leadingIcon="progress-check"
              />
              <Menu.Item
                onPress={() => {
                  closeMenu(item.id);
                  navigation.navigate('TicketDetails', { ticket: item, showWorkOrders: true });
                }}
                title="Work Orders"
                leadingIcon="clipboard-text"
              />
              {item.status === 'pending_confirmation' && (
                <Menu.Item
                  onPress={() => handleVerifyJobCompleted(item)}
                  title="Verify Job Completed"
                  leadingIcon="check-circle"
                />
              )}
            </Menu>
          </View>
        </View>
        <Paragraph style={styles.description} numberOfLines={3}>
          {item.description}
        </Paragraph>
        
        {item.images && item.images.length > 0 && (
          <Text style={styles.imageCount}>
            📷 {item.images.length} image{item.images.length > 1 ? 's' : ''}
          </Text>
        )}
        
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
        {(user?.role === 'maintenance_admin' || user?.role === 'technician') && 
          user?.vendorTiers?.includes('marketplace') && (
          <Appbar.Action 
            icon="store" 
            onPress={() => navigation.navigate('Marketplace')} 
          />
        )}
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
      
      {(user?.role === 'org_admin' || user?.role === 'org_subadmin' || user?.role === 'residential') ? (
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketTitle: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
  },
  chips: {
    flexDirection: 'row',
    gap: 4,
    marginRight: 4,
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
  imageCount: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
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
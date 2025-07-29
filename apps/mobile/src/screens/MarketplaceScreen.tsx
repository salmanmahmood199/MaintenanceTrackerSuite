import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { Card, Title, Paragraph, Chip, FAB, Appbar, Text, Button, Modal, Portal, TextInput } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

interface MarketplaceTicket {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: string;
  createdAt: string;
  images?: string[];
  serviceCity?: string;
  serviceState?: string;
  serviceZipCode?: string;
}

interface Bid {
  id: number;
  ticketId: number;
  hourlyRate: number;
  responseTime: string;
  notes?: string;
  status: string;
  createdAt: string;
}

const MarketplaceScreen = ({ navigation }: any) => {
  const [tickets, setTickets] = useState<MarketplaceTicket[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MarketplaceTicket | null>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [hourlyRate, setHourlyRate] = useState('');
  const [responseTime, setResponseTime] = useState('');
  const [bidNotes, setBidNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'marketplace' | 'mybids'>('marketplace');
  
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const fetchMarketplaceData = async () => {
    try {
      // Fetch marketplace tickets
      const ticketsResponse = await fetch('http://0.0.0.0:5000/api/marketplace/tickets', {
        credentials: 'include',
      });
      
      if (ticketsResponse.ok) {
        const ticketsData = await ticketsResponse.json();
        setTickets(ticketsData.tickets || []);
      }

      // Fetch vendor's bids
      const bidsResponse = await fetch('http://0.0.0.0:5000/api/marketplace/my-bids', {
        credentials: 'include',
      });
      
      if (bidsResponse.ok) {
        const bidsData = await bidsResponse.json();
        setBids(bidsData.bids || []);
      }
    } catch (error) {
      console.error('Failed to fetch marketplace data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMarketplaceData();
    setRefreshing(false);
  };

  const handleSubmitBid = async () => {
    if (!selectedTicket || !hourlyRate || !responseTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://0.0.0.0:5000/api/marketplace/${selectedTicket.id}/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          hourlyRate: parseFloat(hourlyRate),
          responseTime,
          notes: bidNotes,
        }),
      });

      if (response.ok) {
        Alert.alert('Success', 'Bid submitted successfully');
        setShowBidModal(false);
        resetBidForm();
        fetchMarketplaceData();
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to submit bid');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit bid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetBidForm = () => {
    setHourlyRate('');
    setResponseTime('');
    setBidNotes('');
    setSelectedTicket(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderMarketplaceTicket = ({ item }: { item: MarketplaceTicket }) => (
    <Card style={styles.ticketCard}>
      <Card.Content>
        <View style={styles.ticketHeader}>
          <Title style={styles.ticketTitle} numberOfLines={2}>{item.title}</Title>
          <Chip 
            style={[styles.priorityChip, { backgroundColor: getPriorityColor(item.priority) }]}
            textStyle={{ color: 'white', fontSize: 10 }}
          >
            {item.priority.toUpperCase()}
          </Chip>
        </View>
        
        <Paragraph style={styles.ticketDescription} numberOfLines={3}>
          {item.description}
        </Paragraph>
        
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            📍 {item.serviceCity}, {item.serviceState} {item.serviceZipCode}
          </Text>
        </View>

        {item.images && item.images.length > 0 && (
          <Text style={styles.imageCount}>
            📷 {item.images.length} image{item.images.length > 1 ? 's' : ''}
          </Text>
        )}
        
        <View style={styles.ticketFooter}>
          <Paragraph style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Paragraph>
          <Button
            mode="contained"
            onPress={() => {
              setSelectedTicket(item);
              setShowBidModal(true);
            }}
            style={styles.bidButton}
          >
            Place Bid
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderMyBid = ({ item }: { item: Bid }) => {
    const ticket = tickets.find(t => t.id === item.ticketId);
    return (
      <Card style={styles.bidCard}>
        <Card.Content>
          <Title style={styles.bidTitle}>Bid #{item.id}</Title>
          <Paragraph>Hourly Rate: ${item.hourlyRate}</Paragraph>
          <Paragraph>Response Time: {item.responseTime}</Paragraph>
          <Paragraph>Status: {item.status}</Paragraph>
          <Paragraph>Submitted: {new Date(item.createdAt).toLocaleDateString()}</Paragraph>
          {item.notes && <Paragraph>Notes: {item.notes}</Paragraph>}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Marketplace" />
        <Appbar.Action icon="logout" onPress={logout} />
      </Appbar.Header>
      
      <View style={styles.tabContainer}>
        <Button
          mode={activeTab === 'marketplace' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('marketplace')}
          style={styles.tabButton}
        >
          Available Jobs
        </Button>
        <Button
          mode={activeTab === 'mybids' ? 'contained' : 'outlined'}
          onPress={() => setActiveTab('mybids')}
          style={styles.tabButton}
        >
          My Bids
        </Button>
      </View>

      {activeTab === 'marketplace' ? (
        <FlatList
          data={tickets}
          renderItem={renderMarketplaceTicket}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Title>No Marketplace Tickets</Title>
                <Paragraph>No tickets available for bidding right now.</Paragraph>
              </Card.Content>
            </Card>
          }
        />
      ) : (
        <FlatList
          data={bids}
          renderItem={renderMyBid}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Title>No Bids Yet</Title>
                <Paragraph>You haven't placed any bids yet.</Paragraph>
              </Card.Content>
            </Card>
          }
        />
      )}

      <Portal>
        <Modal
          visible={showBidModal}
          onDismiss={() => {
            setShowBidModal(false);
            resetBidForm();
          }}
          contentContainerStyle={styles.modal}
        >
          <Card>
            <Card.Content>
              <Title>Place Bid</Title>
              
              {selectedTicket && (
                <View style={styles.selectedTicketInfo}>
                  <Paragraph style={styles.selectedTicketTitle}>{selectedTicket.title}</Paragraph>
                  <Paragraph>{selectedTicket.description}</Paragraph>
                </View>
              )}

              <TextInput
                label="Hourly Rate ($) *"
                value={hourlyRate}
                onChangeText={setHourlyRate}
                mode="outlined"
                style={styles.input}
                keyboardType="numeric"
              />

              <TextInput
                label="Response Time *"
                value={responseTime}
                onChangeText={setResponseTime}
                mode="outlined"
                style={styles.input}
                placeholder="e.g., Within 2 hours, Same day, Next day"
              />

              <TextInput
                label="Additional Notes"
                value={bidNotes}
                onChangeText={setBidNotes}
                mode="outlined"
                style={styles.input}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <Button
                  mode="outlined"
                  onPress={() => {
                    setShowBidModal(false);
                    resetBidForm();
                  }}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmitBid}
                  loading={loading}
                  disabled={loading}
                  style={styles.modalButton}
                >
                  Submit Bid
                </Button>
              </View>
            </Card.Content>
          </Card>
        </Modal>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  tabButton: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  ticketCard: {
    marginBottom: 12,
    elevation: 2,
  },
  bidCard: {
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
  bidTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  priorityChip: {
    height: 24,
  },
  ticketDescription: {
    marginBottom: 8,
    opacity: 0.7,
  },
  locationInfo: {
    marginBottom: 8,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  imageCount: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    opacity: 0.5,
  },
  bidButton: {
    backgroundColor: '#ec4899',
  },
  emptyCard: {
    marginTop: 50,
    alignItems: 'center',
  },
  modal: {
    margin: 20,
  },
  selectedTicketInfo: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectedTicketTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  input: {
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  modalButton: {
    flex: 1,
  },
});

export default MarketplaceScreen;
import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Title, Paragraph, Chip, Button, Divider } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

// Import shared types
import type { Ticket } from '@maintenance/shared';

const TicketDetailsScreen = ({ route, navigation }: any) => {
  const { ticket }: { ticket: Ticket } = route.params;
  const { user } = useAuth();

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

  const handleAcceptTicket = () => {
    // TODO: Implement accept ticket functionality
    console.log('Accept ticket:', ticket.id);
  };

  const handleCompleteTicket = () => {
    // TODO: Implement complete ticket functionality
    console.log('Complete ticket:', ticket.id);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Title style={styles.title}>{ticket.title}</Title>
            <View style={styles.chips}>
              <Chip 
                mode="flat" 
                textStyle={{ color: 'white' }}
                style={[styles.chip, { backgroundColor: getPriorityColor(ticket.priority) }]}
              >
                {ticket.priority?.toUpperCase()}
              </Chip>
              <Chip 
                mode="flat" 
                textStyle={{ color: 'white' }}
                style={[styles.chip, { backgroundColor: getStatusColor(ticket.status) }]}
              >
                {ticket.status?.toUpperCase()}
              </Chip>
            </View>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Description</Title>
            <Paragraph>{ticket.description}</Paragraph>
          </View>
          
          <Divider style={styles.divider} />
          
          <View style={styles.section}>
            <Title style={styles.sectionTitle}>Details</Title>
            <View style={styles.detailRow}>
              <Paragraph style={styles.detailLabel}>Created:</Paragraph>
              <Paragraph>{new Date(ticket.createdAt).toLocaleDateString()}</Paragraph>
            </View>
            {ticket.ticketNumber && (
              <View style={styles.detailRow}>
                <Paragraph style={styles.detailLabel}>Ticket Number:</Paragraph>
                <Paragraph>{ticket.ticketNumber}</Paragraph>
              </View>
            )}
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actions}>
            {user?.role === 'maintenance_admin' && ticket.status === 'open' && (
              <Button
                mode="contained"
                onPress={handleAcceptTicket}
                style={styles.actionButton}
              >
                Accept Ticket
              </Button>
            )}
            
            {user?.role === 'technician' && ticket.status === 'in-progress' && (
              <Button
                mode="contained"
                onPress={handleCompleteTicket}
                style={styles.actionButton}
              >
                Complete Work
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    flex: 1,
    marginRight: 16,
  },
  chips: {
    flexDirection: 'row',
    gap: 4,
  },
  chip: {
    height: 24,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  detailLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 80,
  },
  actions: {
    marginTop: 16,
  },
  actionButton: {
    marginBottom: 8,
  },
});

export default TicketDetailsScreen;
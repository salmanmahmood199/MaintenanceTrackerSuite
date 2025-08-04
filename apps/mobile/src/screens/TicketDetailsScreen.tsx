import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Title, Paragraph, Chip, Button, Divider } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import WorkOrderModal from '../components/WorkOrderModal';

// Define Ticket interface
interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'completed';
  createdAt: string;
  ticketNumber?: string;
}

const TicketDetailsScreen = ({ route, navigation }: any) => {
  const { ticket }: { ticket: Ticket } = route.params;
  const { user } = useAuth();
  const [workOrderModalVisible, setWorkOrderModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleAcceptTicket = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://0.0.0.0:5000/api/tickets/${ticket.id}/accept`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        Alert.alert('Success', 'Ticket accepted successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to accept ticket');
      }
    } catch (error) {
      console.error('Accept ticket error:', error);
      Alert.alert('Error', 'Failed to accept ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTicket = () => {
    setWorkOrderModalVisible(true);
  };

  const handleWorkOrderSubmit = async (ticketId: string, workOrderData: any, images: string[]) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Add work order data
      Object.keys(workOrderData).forEach(key => {
        if (key === 'parts') {
          formData.append('parts', JSON.stringify(workOrderData.parts));
        } else {
          formData.append(key, workOrderData[key]);
        }
      });

      // Add work images
      images.forEach((imageUri, index) => {
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formData.append('workImages', {
          uri: imageUri,
          name: `work_image_${index}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      });

      const response = await fetch(`http://0.0.0.0:5000/api/tickets/${ticketId}/complete`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        credentials: 'include',
      });

      if (response.ok) {
        setWorkOrderModalVisible(false);
        Alert.alert('Success', 'Work order completed successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to complete work order');
      }
    } catch (error) {
      console.error('Complete work order error:', error);
      Alert.alert('Error', 'Failed to complete work order. Please try again.');
    } finally {
      setLoading(false);
    }
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
                loading={loading}
                disabled={loading}
              >
                Complete Work
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
      
      <WorkOrderModal
        visible={workOrderModalVisible}
        onDismiss={() => setWorkOrderModalVisible(false)}
        ticket={ticket}
        onSubmit={handleWorkOrderSubmit}
        isLoading={loading}
      />
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
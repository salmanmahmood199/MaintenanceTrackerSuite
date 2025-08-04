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
      const response = await fetch(`http://localhost:5000/api/tickets/${ticket.id}/accept`, {
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
    console.log('Mobile: Starting work order submission for ticket:', ticketId);
    console.log('Mobile: Work order data:', workOrderData);
    console.log('Mobile: Images count:', images.length);
    console.log('Mobile: Current user:', user);
    
    setLoading(true);
    try {
      // First check if user is still authenticated
      const authCheck = await fetch('http://localhost:5000/api/auth/user', {
        credentials: 'include',
      });
      console.log('Mobile: Auth check status:', authCheck.status);
      
      if (!authCheck.ok) {
        Alert.alert('Session Expired', 'Please log in again to submit work orders.');
        return;
      }
      const formData = new FormData();
      
      // Add work order data as JSON string (matching server expectations)
      formData.append('workOrder', JSON.stringify(workOrderData));

      // Add work images if any
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const imageUri = images[i];
          console.log('Mobile: Processing image:', imageUri);
          
          try {
            // For mobile web, images are base64 data URLs
            if (imageUri.startsWith('data:')) {
              // Convert base64 to blob
              const response = await fetch(imageUri);
              const blob = await response.blob();
              
              formData.append('images', blob, `work_image_${i}.jpg`);
              console.log('Mobile: Added image blob to FormData');
            } else {
              console.log('Mobile: Skipping non-base64 image:', imageUri);
            }
          } catch (imageError) {
            console.error('Mobile: Error processing image:', imageError);
            // Continue with other images
          }
        }
      }

      console.log('Mobile: Sending request to server...', `http://localhost:5000/api/tickets/${ticketId}/complete`);
      console.log('Mobile: FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(`Mobile: ${key}:`, typeof value === 'string' ? value.substring(0, 100) + '...' : value);
      }
      
      const response = await fetch(`http://localhost:5000/api/tickets/${ticketId}/complete`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        // Let browser set the Content-Type for multipart/form-data
      });

      console.log('Mobile: Response status:', response.status);
      console.log('Mobile: Response ok:', response.ok);
      
      // Log response headers for debugging
      console.log('Mobile: Response headers:', Array.from(response.headers.entries()));

      if (response.ok) {
        const responseData = await response.json();
        console.log('Mobile: Success response:', responseData);
        
        setWorkOrderModalVisible(false);
        Alert.alert('Success', 'Work order submitted properly', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Try to get error response
        let errorData;
        try {
          errorData = await response.json();
          console.error('Mobile: Error response JSON:', errorData);
        } catch (jsonError) {
          const textResponse = await response.text();
          console.error('Mobile: Error response text:', textResponse);
          errorData = { message: textResponse || `HTTP ${response.status}` };
        }
        Alert.alert('Error', errorData.message || 'Failed to complete work order');
      }
    } catch (error) {
      console.error('Mobile: Complete work order error:', error);
      console.error('Mobile: Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      Alert.alert('Error', `Network error: ${error.message}. Please check your connection and try again.`);
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
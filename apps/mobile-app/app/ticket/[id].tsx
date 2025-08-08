import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiRequest } from '../../src/services/api';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  reporterName?: string;
  assignedTo?: string;
  organizationName?: string;
  locationName?: string;
  locationAddress?: string;
  images?: string[];
  rejectionReason?: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    role: string;
  };
  images?: string[];
}

interface WorkOrder {
  id: number;
  description: string;
  completionStatus: string;
  technicianName: string;
  timeIn?: string;
  timeOut?: string;
  createdAt: string;
  parts?: any[];
  otherCharges?: any[];
  images?: string[];
}

export default function TicketDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'workorders'>('details');

  // Fetch ticket details
  const { data: ticket, isLoading: ticketLoading } = useQuery<Ticket>({
    queryKey: ['/api/tickets', id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tickets/${id}`);
      return await response.json() as Ticket;
    },
    enabled: !!id,
  });

  // Fetch ticket comments
  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['/api/tickets', id, 'comments'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tickets/${id}/comments`);
      return await response.json() as Comment[];
    },
    enabled: !!id,
  });

  // Fetch work orders
  const { data: workOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ['/api/tickets', id, 'work-orders'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tickets/${id}/work-orders`);
      return await response.json() as WorkOrder[];
    },
    enabled: !!id,
  });

  if (ticketLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1e293b', '#7c3aed', '#1e293b']} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#06b6d4" />
            <Text style={styles.loadingText}>Loading ticket details...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1e293b', '#7c3aed', '#1e293b']} style={styles.gradient}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#ef4444" />
            <Text style={styles.errorTitle}>Ticket Not Found</Text>
            <Text style={styles.errorText}>The requested ticket could not be found.</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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

  const TabButton = ({ tab, title, active, onPress }: any) => (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, active && styles.activeTabButtonText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1e293b', '#7c3aed', '#1e293b']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Ticket #{ticket.id}</Text>
            <Text style={styles.headerSubtitle}>{ticket.status}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TabButton
            tab="details"
            title="Details"
            active={activeTab === 'details'}
            onPress={() => setActiveTab('details')}
          />
          <TabButton
            tab="comments"
            title={`Comments (${comments.length})`}
            active={activeTab === 'comments'}
            onPress={() => setActiveTab('comments')}
          />
          <TabButton
            tab="workorders"
            title={`Work Orders (${workOrders.length})`}
            active={activeTab === 'workorders'}
            onPress={() => setActiveTab('workorders')}
          />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'details' && (
            <View>
              {/* Ticket Header Card */}
              <View style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketTitle}>{ticket.title}</Text>
                  <View style={styles.ticketBadges}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
                      <Text style={styles.badgeText}>{ticket.priority}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                      <Text style={styles.badgeText}>{ticket.status}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.ticketDescription}>{ticket.description}</Text>
                
                <View style={styles.ticketMeta}>
                  <View style={styles.metaRow}>
                    <Ionicons name="person" size={16} color="#64748b" />
                    <Text style={styles.metaText}>Reported by {ticket.reporterName || 'Unknown'}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar" size={16} color="#64748b" />
                    <Text style={styles.metaText}>
                      {new Date(ticket.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  {ticket.organizationName && (
                    <View style={styles.metaRow}>
                      <Ionicons name="business" size={16} color="#64748b" />
                      <Text style={styles.metaText}>{ticket.organizationName}</Text>
                    </View>
                  )}
                  {ticket.locationName && (
                    <View style={styles.metaRow}>
                      <Ionicons name="location" size={16} color="#64748b" />
                      <Text style={styles.metaText}>
                        {ticket.locationName}
                        {ticket.locationAddress && ` - ${ticket.locationAddress}`}
                      </Text>
                    </View>
                  )}
                  {ticket.assignedTo && (
                    <View style={styles.metaRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                      <Text style={styles.metaText}>Assigned to {ticket.assignedTo}</Text>
                    </View>
                  )}
                </View>

                {ticket.rejectionReason && (
                  <View style={styles.rejectionCard}>
                    <View style={styles.rejectionHeader}>
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                      <Text style={styles.rejectionTitle}>Rejection Reason</Text>
                    </View>
                    <Text style={styles.rejectionText}>{ticket.rejectionReason}</Text>
                  </View>
                )}
              </View>

              {/* Images */}
              {ticket.images && ticket.images.length > 0 && (
                <View style={styles.imagesCard}>
                  <Text style={styles.cardTitle}>Attachments</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.imagesList}>
                      {ticket.images.map((imageUrl, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.imageContainer}
                          onPress={() => setSelectedImageIndex(index)}
                        >
                          <Image source={{ uri: imageUrl }} style={styles.ticketImage} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}
            </View>
          )}

          {activeTab === 'comments' && (
            <View>
              {comments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubble-outline" size={48} color="#64748b" />
                  <Text style={styles.emptyTitle}>No Comments</Text>
                  <Text style={styles.emptyText}>No comments have been added to this ticket yet.</Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <View>
                        <Text style={styles.commentAuthor}>
                          {comment.user.firstName} {comment.user.lastName}
                        </Text>
                        <Text style={styles.commentRole}>{comment.user.role}</Text>
                      </View>
                      <Text style={styles.commentDate}>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                    {comment.images && comment.images.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.commentImages}>
                        {comment.images.map((imageUrl, index) => (
                          <Image key={index} source={{ uri: imageUrl }} style={styles.commentImage} />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === 'workorders' && (
            <View>
              {workOrders.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="construct-outline" size={48} color="#64748b" />
                  <Text style={styles.emptyTitle}>No Work Orders</Text>
                  <Text style={styles.emptyText}>No work orders have been created for this ticket yet.</Text>
                </View>
              ) : (
                workOrders.map((workOrder) => (
                  <View key={workOrder.id} style={styles.workOrderCard}>
                    <View style={styles.workOrderHeader}>
                      <Text style={styles.workOrderTitle}>Work Order #{workOrder.id}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(workOrder.completionStatus) }]}>
                        <Text style={styles.badgeText}>{workOrder.completionStatus}</Text>
                      </View>
                    </View>
                    <Text style={styles.workOrderDescription}>{workOrder.description}</Text>
                    <View style={styles.workOrderMeta}>
                      <View style={styles.metaRow}>
                        <Ionicons name="person" size={16} color="#64748b" />
                        <Text style={styles.metaText}>Technician: {workOrder.technicianName}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Ionicons name="calendar" size={16} color="#64748b" />
                        <Text style={styles.metaText}>
                          {new Date(workOrder.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                      {workOrder.timeIn && workOrder.timeOut && (
                        <View style={styles.metaRow}>
                          <Ionicons name="time" size={16} color="#64748b" />
                          <Text style={styles.metaText}>
                            {workOrder.timeIn} - {workOrder.timeOut}
                          </Text>
                        </View>
                      )}
                    </View>
                    {workOrder.images && workOrder.images.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.workOrderImages}>
                        {workOrder.images.map((imageUrl, index) => (
                          <Image key={index} source={{ uri: imageUrl }} style={styles.workOrderImage} />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerBackButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTabButton: {
    backgroundColor: '#3b82f6',
  },
  tabButtonText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  activeTabButtonText: {
    color: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ticketCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    marginRight: 12,
  },
  ticketBadges: {
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  ticketDescription: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 16,
    lineHeight: 22,
  },
  ticketMeta: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#64748b',
  },
  rejectionCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
    marginLeft: 8,
  },
  rejectionText: {
    fontSize: 14,
    color: '#fca5a5',
  },
  imagesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  imagesList: {
    flexDirection: 'row',
    gap: 12,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  ticketImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  commentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  commentRole: {
    fontSize: 12,
    color: '#06b6d4',
    textTransform: 'capitalize',
  },
  commentDate: {
    fontSize: 12,
    color: '#64748b',
  },
  commentContent: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 18,
  },
  commentImages: {
    marginTop: 12,
    flexDirection: 'row',
  },
  commentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  workOrderCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  workOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workOrderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  workOrderDescription: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 18,
  },
  workOrderMeta: {
    gap: 6,
  },
  workOrderImages: {
    marginTop: 12,
    flexDirection: 'row',
  },
  workOrderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
});
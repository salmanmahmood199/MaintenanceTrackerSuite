import React, { useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Image, TextInput, Modal, Dimensions, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

type Location = { name?: string; address?: string; city?: string; state?: string; zip?: string };

function normalizeTicket(raw: any) {
  if (!raw) return null;
  
  const location: Location | null = raw.location ? {
    name: raw.location.name || raw.location.locationName,
    address: raw.location.address || raw.location.streetAddress,
    city: raw.location.city,
    state: raw.location.state,
    zip: raw.location.zip || raw.location.zipCode,
  } : null;

  return {
    id: raw.id,
    ticketNumber: raw.ticketNumber,
    title: raw.title,
    description: raw.description,
    status: raw.status,
    priority: raw.priority,
    createdAt: raw.createdAt,
    location,
    reporter: raw.reporter || raw.createdBy,
    createdBy: raw.createdBy,
  };
}

export default function TicketDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'progress' | 'workorders'>('details');
  const [newComment, setNewComment] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Fetch ticket details
  const { data: ticket, isLoading: ticketLoading, refetch: refetchTicket, isError: ticketError, error: ticketErrorMsg } = useQuery({
    queryKey: ["ticket", id],
    enabled: !!id,
    queryFn: async () => {
      try {
        console.log('Fetching ticket details for ID:', id);
        const response = await api.get(`/api/tickets/${id}`);
        console.log('Ticket API response:', response.data);
        const raw = response.data?.ticket ?? response.data;
        return normalizeTicket(raw);
      } catch (error) {
        console.error('Error fetching ticket details:', error);
        throw error;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch ticket comments
  const { data: comments = [], isLoading: commentsLoading, refetch: refetchComments } = useQuery({
    queryKey: ["ticket-comments", id],
    enabled: !!id,
    queryFn: async () => {
      const response = await api.get(`/api/tickets/${id}/comments`);
      return response.data ?? [];
    },
  });

  // Fetch work orders
  const { data: workOrders = [], isLoading: workOrdersLoading, refetch: refetchWorkOrders } = useQuery({
    queryKey: ["ticket-workorders", id],
    enabled: !!id,
    queryFn: async () => {
      const response = await api.get(`/api/tickets/${id}/work-orders`);
      return response.data ?? [];
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await api.post(`/api/tickets/${id}/comments`, { text });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      setNewComment('');
      Alert.alert('Success', 'Comment added successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to add comment');
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }
    addCommentMutation.mutate(newComment.trim());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchTicket(), refetchComments(), refetchWorkOrders()]);
    setRefreshing(false);
  };

  // Basic states
  if (!id) return <View style={styles.errorContainer}><Text style={styles.errorText}>Invalid route: no id.</Text></View>;
  if (ticketLoading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  if (ticketError) {
    const errorMessage = (ticketErrorMsg as any)?.message ?? "Unknown error";
    const isNetworkError = errorMessage.includes('Network Error') || (ticketErrorMsg as any)?.code === 'NETWORK_ERROR';
    
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="warning-outline" size={48} color="#ef4444" />
        <Text style={styles.errorTitle}>
          {isNetworkError ? "Connection Error" : "Failed to Load"}
        </Text>
        <Text style={styles.errorText}>
          {isNetworkError 
            ? "Cannot connect to server. Make sure the backend is running on http://192.168.1.153:5000"
            : errorMessage
          }
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetchTicket()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (!ticket) return <View style={styles.errorContainer}><Text style={styles.errorText}>Ticket not found.</Text></View>;

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

  const getProgressPercentage = () => {
    switch (ticket?.status?.toLowerCase()) {
      case 'pending': return 10;
      case 'accepted': return 25;
      case 'in_progress': return 60;
      case 'completed': return 85;
      case 'confirmed': return 100;
      default: return 0;
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <View style={styles.tabContent}>
            {/* Basic Information */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ticket Number</Text>
                <Text style={styles.infoValue}>{ticket.ticketNumber ?? `#${ticket.id}`}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Title</Text>
                <Text style={styles.infoValue}>{ticket.title ?? "No title"}</Text>
              </View>
              
              {ticket.description && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Description</Text>
                  <Text style={styles.infoDescription}>{ticket.description}</Text>
                </View>
              )}
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Status</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
                  <Text style={styles.statusText}>{ticket.status ?? "Unknown"}</Text>
                </View>
              </View>
              
              {ticket.priority && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Priority</Text>
                  <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
                    <Text style={styles.priorityText}>{ticket.priority}</Text>
                  </View>
                </View>
              )}
              
              {ticket.createdAt && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Created</Text>
                  <Text style={styles.infoValue}>{new Date(ticket.createdAt).toLocaleDateString()}</Text>
                </View>
              )}
            </View>

            {/* Location Information */}
            {ticket.location && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Location</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{ticket.location.name ?? "—"}</Text>
                </View>
                {ticket.location.address && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Address</Text>
                    <Text style={styles.infoValue}>
                      {ticket.location.address}
                      {ticket.location.city ? `, ${ticket.location.city}` : ""}
                      {ticket.location.state ? `, ${ticket.location.state}` : ""}
                      {ticket.location.zip ? ` ${ticket.location.zip}` : ""}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Reporter Information */}
            {(ticket.reporter?.name || ticket.createdBy?.name) && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Reporter</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue}>{ticket.reporter?.name ?? ticket.createdBy?.name ?? "Unknown"}</Text>
                </View>
                {(ticket.reporter?.email || ticket.createdBy?.email) && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{ticket.reporter?.email ?? ticket.createdBy?.email}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Images Section */}
            {ticket.images && ticket.images.length > 0 && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Attached Images</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                  {ticket.images.map((imageUrl: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        setSelectedImage(imageUrl);
                        setImageModalVisible(true);
                      }}
                      style={styles.imageWrapper}
                    >
                      <Image
                        source={{ uri: imageUrl }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        );
        
      case 'comments':
        return (
          <View style={styles.tabContent}>
            {/* Add Comment Section */}
            <View style={styles.addCommentSection}>
              <Text style={styles.sectionTitle}>Add Comment</Text>
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Enter your comment..."
                  multiline
                  numberOfLines={3}
                  value={newComment}
                  onChangeText={setNewComment}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[
                    styles.addCommentButton,
                    { opacity: addCommentMutation.isPending || !newComment.trim() ? 0.5 : 1 }
                  ]}
                  onPress={handleAddComment}
                  disabled={addCommentMutation.isPending || !newComment.trim()}
                >
                  {addCommentMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="send" size={16} color="white" />
                      <Text style={styles.addCommentButtonText}>Add Comment</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments List */}
            <View style={styles.commentsSection}>
              <Text style={styles.sectionTitle}>
                Comments {comments.length > 0 && `(${comments.length})`}
              </Text>
              {commentsLoading ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : comments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubble-outline" size={48} color="#94a3b8" />
                  <Text style={styles.emptyText}>No comments yet</Text>
                  <Text style={styles.emptySubtext}>Be the first to add a comment</Text>
                </View>
              ) : (
                comments.map((comment: any, index: number) => (
                  <View key={comment.id || index} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentAuthorInfo}>
                        <Text style={styles.commentAuthor}>
                          {comment.user?.firstName} {comment.user?.lastName} {comment.user?.name}
                        </Text>
                        <Text style={styles.commentRole}>{comment.user?.role}</Text>
                      </View>
                      <Text style={styles.commentDate}>
                        {new Date(comment.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                    <Text style={styles.commentText}>{comment.text}</Text>
                  </View>
                ))
              )}
            </View>
          </View>
        );
        
      case 'progress':
        return (
          <View style={styles.tabContent}>
            <View style={styles.progressSection}>
              <Text style={styles.sectionTitle}>Progress Tracker</Text>
              
              {/* Progress Bar */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { 
                  width: `${getProgressPercentage()}%` 
                }]} />
              </View>
              <Text style={styles.progressPercentage}>{getProgressPercentage()}% Complete</Text>
              
              {/* Progress Steps */}
              <View style={styles.progressSteps}>
                <View style={styles.progressStep}>
                  <View style={[styles.progressDot, { backgroundColor: '#10b981' }]} />
                  <View style={styles.progressLine} />
                  <View style={styles.progressContent}>
                    <Text style={styles.progressTitle}>Ticket Created</Text>
                    <Text style={styles.progressDate}>
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'Unknown'}
                    </Text>
                  </View>
                </View>
                
                {ticket.status !== 'pending' && (
                  <View style={styles.progressStep}>
                    <View style={[styles.progressDot, { backgroundColor: '#3b82f6' }]} />
                    <View style={styles.progressLine} />
                    <View style={styles.progressContent}>
                      <Text style={styles.progressTitle}>Ticket Accepted</Text>
                      <Text style={styles.progressDate}>Status: {ticket.status}</Text>
                    </View>
                  </View>
                )}
                
                {(['in_progress', 'completed', 'confirmed'].includes(ticket.status)) && (
                  <View style={styles.progressStep}>
                    <View style={[styles.progressDot, { backgroundColor: '#8b5cf6' }]} />
                    <View style={styles.progressLine} />
                    <View style={styles.progressContent}>
                      <Text style={styles.progressTitle}>Work In Progress</Text>
                      <Text style={styles.progressDate}>Active</Text>
                    </View>
                  </View>
                )}
                
                {(['completed', 'confirmed'].includes(ticket.status)) && (
                  <View style={styles.progressStep}>
                    <View style={[styles.progressDot, { backgroundColor: '#10b981' }]} />
                    <View style={styles.progressLine} />
                    <View style={styles.progressContent}>
                      <Text style={styles.progressTitle}>Work Completed</Text>
                      <Text style={styles.progressDate}>Finished</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </View>
        );
        
      case 'workorders':
        return (
          <View style={styles.tabContent}>
            {workOrdersLoading ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : workOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="construct-outline" size={48} color="#94a3b8" />
                <Text style={styles.emptyText}>No work orders yet</Text>
                <Text style={styles.emptySubtext}>Work orders will appear here</Text>
              </View>
            ) : (
              workOrders.map((workOrder: any, index: number) => (
                <View key={index} style={styles.workOrderCard}>
                  <View style={styles.workOrderHeader}>
                    <Text style={styles.workOrderTitle}>Work Order #{workOrder.id}</Text>
                    <Text style={styles.workOrderStatus}>{workOrder.status}</Text>
                  </View>
                  {workOrder.description && (
                    <Text style={styles.workOrderDescription}>{workOrder.description}</Text>
                  )}
                  <Text style={styles.workOrderDate}>
                    Created: {new Date(workOrder.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            )}
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{ticket.title ?? `Ticket #${ticket.id}`}</Text>
          <Text style={styles.headerSubtitle}>{ticket.ticketNumber ?? `#${ticket.id}`}</Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'comments' && styles.activeTab]}
          onPress={() => setActiveTab('comments')}
        >
          <Text style={[styles.tabText, activeTab === 'comments' && styles.activeTabText]}>
            Comments {comments.length > 0 && `(${comments.length})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'progress' && styles.activeTab]}
          onPress={() => setActiveTab('progress')}
        >
          <Text style={[styles.tabText, activeTab === 'progress' && styles.activeTabText]}>Progress</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'workorders' && styles.activeTab]}
          onPress={() => setActiveTab('workorders')}
        >
          <Text style={[styles.tabText, activeTab === 'workorders' && styles.activeTabText]}>
            Work Orders {workOrders.length > 0 && `(${workOrders.length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {renderTabContent()}
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    flex: 1,
    marginRight: 12,
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    flex: 2,
    textAlign: 'right',
  },
  infoDescription: {
    fontSize: 14,
    color: '#1e293b',
    flex: 2,
    textAlign: 'right',
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  commentCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
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
    color: '#1e293b',
  },
  commentDate: {
    fontSize: 12,
    color: '#64748b',
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  progressSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  progressContent: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  progressDate: {
    fontSize: 12,
    color: '#64748b',
  },
  workOrderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  workOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workOrderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  workOrderStatus: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  workOrderDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  workOrderDate: {
    fontSize: 12,
    color: '#64748b',
  },
  // New styles for enhanced functionality
  imagesContainer: {
    paddingVertical: 8,
  },
  imageWrapper: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  fullScreenImage: {
    width: screenWidth,
    height: '80%',
  },
  addCommentSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  commentInputContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    minHeight: 80,
  },
  addCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  addCommentButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  commentsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  commentAuthorInfo: {
    flex: 1,
  },
  commentRole: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'capitalize',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressSteps: {
    marginTop: 16,
  },
  progressLine: {
    position: 'absolute',
    left: 6,
    top: 12,
    bottom: -16,
    width: 1,
    backgroundColor: '#e2e8f0',
    zIndex: -1,
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ticketsApi } from '../../src/services/api';
import { Header } from '../../src/components/ui/Header';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';

interface TicketDetails {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location: {
    name: string;
    address: string;
  };
  reporter: {
    name: string;
    email: string;
  };
  assignedTo?: {
    name: string;
    email: string;
  };
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  id: string;
  content: string;
  author: {
    name: string;
    email: string;
  };
  images: string[];
  createdAt: string;
}

interface WorkOrder {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  technician?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

type TabType = 'details' | 'comments' | 'progress' | 'workOrders';

const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'error';
    case 'high':
      return 'warning';
    case 'medium':
      return 'info';
    case 'low':
    default:
      return 'default';
  }
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'info';
    case 'pending':
      return 'warning';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

export default function TicketDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('details');

  // Fetch ticket details
  const {
    data: ticket,
    isLoading: ticketLoading,
    error: ticketError,
    refetch: refetchTicket,
  } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketsApi.getTicketDetails(id!),
    enabled: !!id,
  });

  // Fetch comments
  const {
    data: comments = [],
    isLoading: commentsLoading,
  } = useQuery({
    queryKey: ['ticket-comments', id],
    queryFn: () => ticketsApi.getTicketComments(id!),
    enabled: !!id && activeTab === 'comments',
  });

  // Fetch work orders
  const {
    data: workOrders = [],
    isLoading: workOrdersLoading,
  } = useQuery({
    queryKey: ['ticket-work-orders', id],
    queryFn: () => ticketsApi.getTicketWorkOrders(id!),
    enabled: !!id && activeTab === 'workOrders',
  });

  const handleAccept = () => {
    Alert.alert('Accept Ticket', 'Are you sure you want to accept this ticket?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => console.log('Ticket accepted') },
    ]);
  };

  const handleReject = () => {
    Alert.alert('Reject Ticket', 'Are you sure you want to reject this ticket?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: () => console.log('Ticket rejected') },
    ]);
  };

  const handleAssignVendor = () => {
    Alert.alert('Assign Vendor', 'Vendor assignment functionality coming soon!');
  };

  if (ticketLoading) {
    return (
      <View style={styles.container}>
        <Header
          title="Ticket Details"
          showBack
          onBack={() => router.back()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading ticket details...</Text>
        </View>
      </View>
    );
  }

  if (ticketError || !ticket) {
    return (
      <View style={styles.container}>
        <Header
          title="Ticket Details"
          showBack
          onBack={() => router.back()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {ticketError?.message || 'Failed to load ticket details'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetchTicket()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'details':
        return (
          <ScrollView style={styles.tabContent}>
            {/* Status and Priority Badges */}
            <View style={styles.badgeContainer}>
              <Badge variant={getStatusVariant(ticket.status)}>
                {ticket.status.toUpperCase()}
              </Badge>
              <Badge variant={getPriorityVariant(ticket.priority)}>
                {ticket.priority.toUpperCase()}
              </Badge>
            </View>

            {/* Description */}
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{ticket.description}</Text>
            </Card>

            {/* Location */}
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.locationName}>{ticket.location.name}</Text>
              {ticket.location.address && (
                <Text style={styles.locationAddress}>{ticket.location.address}</Text>
              )}
            </Card>

            {/* Reporter */}
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Reported By</Text>
              <Text style={styles.description}>{ticket.reporter.name}</Text>
              <Text style={styles.locationAddress}>{ticket.reporter.email}</Text>
            </Card>

            {/* Created Date */}
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Created</Text>
              <Text style={styles.dateText}>
                {new Date(ticket.createdAt).toLocaleDateString()}
              </Text>
            </Card>
          </ScrollView>
        );

      case 'comments':
        return (
          <ScrollView style={styles.tabContent}>
            {commentsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading comments...</Text>
              </View>
            ) : comments.length > 0 ? (
              comments.map((comment: Comment) => (
                <Card key={comment.id} style={styles.card}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{comment.author.name}</Text>
                    <Text style={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                </Card>
              ))
            ) : (
              <Text style={styles.emptyState}>No comments yet</Text>
            )}
          </ScrollView>
        );

      case 'progress':
        return (
          <ScrollView style={styles.tabContent}>
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Progress Tracking</Text>
              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Status:</Text>
                <Text style={styles.progressValue}>{ticket.status}</Text>
              </View>
              <View style={styles.progressContainer}>
                <Text style={styles.progressLabel}>Last Updated:</Text>
                <Text style={styles.progressValue}>
                  {new Date(ticket.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </Card>
          </ScrollView>
        );

      case 'workOrders':
        return (
          <ScrollView style={styles.tabContent}>
            {workOrdersLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading work orders...</Text>
              </View>
            ) : workOrders.length > 0 ? (
              workOrders.map((workOrder: WorkOrder) => (
                <Card key={workOrder.id} style={styles.card}>
                  <Text style={styles.sectionTitle}>{workOrder.title}</Text>
                  <View style={styles.workOrderMeta}>
                    <Text style={styles.workOrderLabel}>Status:</Text>
                    <Text style={styles.workOrderValue}>{workOrder.status}</Text>
                  </View>
                  {workOrder.technician && (
                    <View style={styles.workOrderMeta}>
                      <Text style={styles.workOrderLabel}>Technician:</Text>
                      <Text style={styles.workOrderValue}>{workOrder.technician.name}</Text>
                    </View>
                  )}
                  <View style={styles.workOrderMeta}>
                    <Text style={styles.workOrderLabel}>Created:</Text>
                    <Text style={styles.workOrderValue}>
                      {new Date(workOrder.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </Card>
              ))
            ) : (
              <Text style={styles.emptyState}>No work orders yet</Text>
            )}
          </ScrollView>
        );

      default:
        return null;
    }
  };

  const showActionButtons = ticket.status === 'pending';

  return (
    <View style={styles.container}>
      <Header
        title={ticket.title}
        showBack
        onBack={() => router.back()}
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'details', label: 'Details' },
          { key: 'comments', label: 'Comments' },
          { key: 'progress', label: 'Progress' },
          { key: 'workOrders', label: 'Work Orders' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as TabType)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>

      {/* Action Buttons */}
      {showActionButtons && (
        <View style={styles.actionButtons}>
          <Button
            variant="primary"
            style={StyleSheet.flatten([styles.actionButton, styles.acceptButton])}
            onPress={handleAccept}
          >
            <Text style={styles.actionButtonText}>Accept</Text>
          </Button>
          <Button
            variant="secondary"
            style={StyleSheet.flatten([styles.actionButton, styles.rejectButton])}
            onPress={handleReject}
          >
            <Text style={styles.actionButtonText}>Reject</Text>
          </Button>
          <Button
            variant="outline"
            style={StyleSheet.flatten([styles.actionButton, styles.assignButton])}
            onPress={handleAssignVendor}
          >
            <Text style={styles.actionButtonText}>Assign Vendor</Text>
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f8f9fa',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  // Content
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  // Cards and sections
  card: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  // Location
  locationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  // Date
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  // Comments
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  // Progress
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  progressValue: {
    fontSize: 14,
    color: '#666',
  },
  // Work Orders
  workOrderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  workOrderLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  workOrderValue: {
    fontSize: 13,
    color: '#333',
  },
  // Empty state
  emptyState: {
    textAlign: 'center',
    fontSize: 16,
    color: '#999',
    marginTop: 32,
  },
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  assignButton: {
    backgroundColor: '#007bff',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

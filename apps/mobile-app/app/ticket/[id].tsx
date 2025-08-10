import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl, Image, TextInput, Modal, Dimensions, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../src/services/api";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '../../src/contexts/AuthContext';

const { width: screenWidth } = Dimensions.get('window');

type Location = { name?: string; address?: string; city?: string; state?: string; zip?: string };

function normalizeTicket(raw: any) {
  if (!raw) return null;
  
  // Handle location data - tickets from the API have locationId, locationName, and locationAddress
  const location: Location | null = raw.locationId ? {
    name: raw.locationName || raw.location?.name,
    address: raw.locationAddress || raw.location?.address || raw.location?.streetAddress,
    city: raw.locationCity || raw.location?.city,
    state: raw.locationState || raw.location?.state,
    zip: raw.locationZip || raw.location?.zip || raw.location?.zipCode,
  } : null;

  return {
    id: raw.id,
    ticketNumber: raw.ticketNumber,
    title: raw.title,
    description: raw.description,
    status: raw.status,
    priority: raw.priority,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    location,
    locationId: raw.locationId,
    reporter: raw.reporter || raw.createdBy,
    createdBy: raw.createdBy,
    images: raw.images || [],
    organizationId: raw.organizationId,
    reporterId: raw.reporterId,
  };
}

// Helper functions for permissions and actions
function hasActionsPermission(user: any, ticket: any): boolean {
  if (!user || !ticket) return false;
  
  // Root admin can perform all actions
  if (user.role === 'root') return true;
  
  // Org admin can perform actions on their organization tickets
  if (user.role === 'org_admin' && ticket.organizationId === user.organizationId) return true;
  
  // Maintenance admin can perform actions on assigned tickets
  if (user.role === 'maintenance_admin' && ticket.maintenanceVendorId === user.maintenanceVendorId) return true;
  
  // Sub admin with accept permissions or marketplace users
  if (user.role === 'org_subadmin' && ticket.organizationId === user.organizationId) {
    // Check for accept_ticket permission or marketplace user
    if (user.permissions?.includes('accept_ticket')) return true;
    if (user.email && user.email.includes('marketplace')) return true;
  }
  
  // Technician can perform actions on their assigned tickets
  if (user.role === 'technician' && ticket.assigneeId === user.id) return true;
  
  // Original ticket requester can confirm completion
  if (ticket.reporterId === user.id && ticket.status === 'pending_confirmation') return true;
  
  return false;
}

// Helper function moved outside component for performance

export default function TicketDetailsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'progress' | 'workorders' | 'actions'>('details');
  const [newComment, setNewComment] = useState('');
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [imagePreviewModalVisible, setImagePreviewModalVisible] = useState(false);

  // Fetch ticket details
  const { data: ticket, isLoading: ticketLoading, refetch: refetchTicket, isError: ticketError, error: ticketErrorMsg } = useQuery({
    queryKey: ["ticket", id],
    enabled: !!id,
    queryFn: async () => {
      try {
        console.log('Fetching ticket details for ID:', id);
        const response = await apiRequest('GET', `/api/tickets/${id}`);
        const data = await response.json();
        console.log('Ticket API response:', data);
        const raw = data?.ticket ?? data;
        return normalizeTicket(raw);
      } catch (error) {
        console.error('Error fetching ticket:', error);
        throw error;
      }
    },
  });

  // Fetch comments
  const { data: comments = [], isLoading: commentsLoading, refetch: refetchComments } = useQuery({
    queryKey: ["comments", id],
    enabled: !!id,
    queryFn: async () => {
      console.log('Fetching comments for ticket:', id);
      const response = await apiRequest('GET', `/api/tickets/${id}/comments`);
      const data = await response.json();
      console.log('Comments API response:', data);
      return data ?? [];
    },
  });

  // Fetch work orders
  const { data: workOrders = [], isLoading: workOrdersLoading, refetch: refetchWorkOrders } = useQuery({
    queryKey: ["workorders", id],
    enabled: !!id,
    queryFn: async () => {
      console.log('Fetching work orders for ticket:', id);
      const response = await apiRequest('GET', `/api/tickets/${id}/work-orders`);
      const data = await response.json();
      console.log('Work Orders API response:', data);
      return data ?? [];
    },
  });

  // Add comment mutation with image support
  const addCommentMutation = useMutation({
    mutationFn: async (data: { content: string; images?: any[] }) => {
      const formData = new FormData();
      formData.append('content', data.content);
      
      // Add images if present
      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append('images', {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.name || 'image.jpg',
          } as any);
        });
      }
      
      const response = await apiRequest('POST', `/api/tickets/${id}/comments`, formData);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
      setNewComment('');
      setSelectedImages([]);
      Alert.alert('Success', 'Comment added successfully');
    },
    onError: (error: any) => {
      console.error('Comment error:', error);
      Alert.alert('Error', error.message || 'Failed to add comment');
    },
  });

  const handleAddComment = () => {
    if (!newComment.trim() && selectedImages.length === 0) {
      Alert.alert('Error', 'Please enter a comment or select an image');
      return;
    }
    addCommentMutation.mutate({ 
      content: newComment.trim() || 'Image attachment', 
      images: selectedImages 
    });
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets) {
        setSelectedImages([...selectedImages, ...result.assets]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchTicket(), refetchComments(), refetchWorkOrders()]);
    setRefreshing(false);
  };

  // Action functions
  const acceptTicket = async () => {
    try {
      // Fetch available vendors first
      console.log('Fetching vendors for user:', user?.role, user?.organizationId);
      
      // Use the same endpoint as web interface for vendor tiers
      const vendorsResponse = await apiRequest('GET', `/api/organizations/${user?.organizationId}/vendor-tiers`);
      if (!vendorsResponse.ok) {
        throw new Error(`Failed to fetch vendors: ${vendorsResponse.status}`);
      }

      const vendorsData = await vendorsResponse.json();
      console.log('Vendor tiers API response:', vendorsData);
      
      // Handle the vendor-tiers response format
      const vendorsList = Array.isArray(vendorsData) ? vendorsData : [];
      
      const availableVendors = vendorsList.filter((v: any) => {
        const vendor = v.vendor;
        const tier = v.tier;
        
        // Check if vendor is active (note: API uses isActive but DB uses is_active)
        if (!vendor || (vendor.isActive === false || vendor.is_active === false)) return false;
        
        // Root and org admins can see all active vendors
        if (user?.role === "root" || user?.role === "org_admin") return true;
        
        // Sub-admins with accept_ticket permission can see vendors based on their tier permissions  
        if (user?.role === "org_subadmin" && user?.permissions?.includes("accept_ticket")) {
          // marketplace@nsrpetro.com should have access to all tiers
          return true;
        }
        
        // Maintenance admins can see all vendors assigned to their organization
        if (user?.role === "maintenance_admin") return true;
        
        return false;
      });

      console.log('Available vendors after filtering:', availableVendors);
      console.log('User details:', { role: user?.role, permissions: user?.permissions, organizationId: user?.organizationId });
      console.log('Raw vendors list:', vendorsList);
      
      if (availableVendors.length === 0) {
        console.log('Detailed vendor analysis:');
        vendorsList.forEach((v, index) => {
          const vendor = v.vendor;
          const tier = v.tier;
          console.log(`Vendor ${index}:`, {
            vendor: vendor,
            tier: tier,
            isActive: vendor?.isActive,
            is_active: vendor?.is_active,
            hasVendor: !!vendor,
            userRole: user?.role,
            userPermissions: user?.permissions,
            passesActiveCheck: !(!vendor || (vendor.isActive === false || vendor.is_active === false)),
            passesRoleCheck: user?.role === "org_subadmin" && user?.permissions?.includes("accept_ticket")
          });
        });
        Alert.alert('Debug Info', `Found ${vendorsList.length} vendors but 0 after filtering. User: ${user?.role}, Permissions: ${user?.permissions?.join(',') || 'none'}`);
        return;
      }

      // Create vendor selection options
      const vendorOptions = [
        { label: 'Assign to Marketplace', value: 'marketplace' },
        ...availableVendors.map((v: any) => {
          const vendor = v.vendor;
          const tier = v.tier;
          return {
            label: `${vendor.name || vendor.companyName || 'Unnamed Vendor'} (${tier.replace('tier_', 'TIER ').toUpperCase()})`,
            value: vendor.id.toString()
          };
        })
      ];

      // Show vendor selection picker
      Alert.alert(
        'Select Vendor Assignment',
        'Choose how to assign this ticket:',
        [
          { text: 'Cancel', style: 'cancel' },
          ...vendorOptions.map(option => ({
            text: option.label,
            onPress: async () => {
              try {
                const acceptData: any = {};
                
                if (option.value === 'marketplace') {
                  acceptData.marketplace = true;
                } else {
                  acceptData.maintenanceVendorId = parseInt(option.value);
                }

                const response = await apiRequest('POST', `/api/tickets/${id}/accept`, acceptData);
                if (response.ok) {
                  const data = await response.json();
                  queryClient.invalidateQueries({ queryKey: ["ticket", id] });
                  queryClient.invalidateQueries({ queryKey: ["tickets"] });
                  Alert.alert('Success', `Ticket accepted and assigned to ${option.label}`);
                }
              } catch (error: any) {
                Alert.alert('Error', error.response?.data?.message || 'Failed to accept ticket');
              }
            }
          }))
        ]
      );

    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch vendors');
    }
  };

  const rejectTicket = async () => {
    Alert.prompt(
      'Reject Ticket',
      'Please provide a reason for rejecting this ticket:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason?.trim()) {
              Alert.alert('Error', 'Rejection reason is required');
              return;
            }
            try {
              const response = await apiRequest('POST', `/api/tickets/${id}/reject`, {
                rejectionReason: reason.trim()
              });
              if (response.ok) {
                const data = await response.json();
                queryClient.invalidateQueries({ queryKey: ["ticket", id] });
                queryClient.invalidateQueries({ queryKey: ["tickets"] });
                Alert.alert('Success', 'Ticket rejected successfully');
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject ticket');
            }
          }
        }
      ],
      'plain-text'
    );
  };



  const startWork = async () => {
    try {
      const response = await apiRequest('POST', `/api/tickets/${id}/start`, {});
      if (response.status === 200) {
        queryClient.invalidateQueries({ queryKey: ["ticket", id] });
        Alert.alert('Success', 'Work started successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to start work');
    }
  };

  const completeWork = async () => {
    Alert.alert(
      'Complete Work',
      'Are you sure you want to mark this work as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              const response = await apiRequest('POST', `/api/tickets/${id}/complete`, {
                workOrder: {
                  workDescription: 'Mobile app completion',
                  completionStatus: 'complete',
                  completionNotes: 'Work completed via mobile app'
                }
              });
              if (response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ["ticket", id] });
                Alert.alert('Success', 'Work completed successfully');
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to complete work');
            }
          }
        }
      ]
    );
  };

  const confirmCompletion = async () => {
    Alert.alert(
      'Confirm Completion',
      'Are you satisfied with the completed work?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const response = await apiRequest('POST', `/api/tickets/${id}/confirm`, {
                confirmed: true,
                feedback: 'Confirmed via mobile app'
              });
              if (response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ["ticket", id] });
                Alert.alert('Success', 'Work completion confirmed');
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to confirm completion');
            }
          }
        }
      ]
    );
  };

  const rejectCompletion = async () => {
    Alert.prompt(
      'Reject Completion',
      'Please provide feedback on what needs to be fixed:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async (feedback) => {
            try {
              const response = await apiRequest('POST', `/api/tickets/${id}/confirm`, {
                confirmed: false,
                feedback: feedback || 'Work needs to be redone'
              });
              if (response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ["ticket", id] });
                Alert.alert('Success', 'Completion rejected - work returned to technician');
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to reject completion');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const forceCloseTicket = async () => {
    Alert.prompt(
      'Force Close Ticket',
      'Please provide a reason for force closing this ticket:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Force Close',
          style: 'destructive',
          onPress: async (reason) => {
            if (!reason?.trim()) {
              Alert.alert('Error', 'Reason is required for force closing');
              return;
            }
            try {
              const response = await apiRequest('POST', `/api/tickets/${id}/force-close`, {
                reason: reason.trim()
              });
              if (response.status === 200) {
                queryClient.invalidateQueries({ queryKey: ["ticket", id] });
                Alert.alert('Success', 'Ticket force closed successfully');
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to force close ticket');
            }
          }
        }
      ],
      'plain-text'
    );
  };



  const getAvailableActions = (user: any, ticket: any) => {
    const actions: any[] = [];
    
    if (!user || !ticket) return actions;
    
    // Accept ticket actions (org_admin, maintenance_admin, org_subadmin with permissions, marketplace users)
    if (ticket.status === 'pending' && 
        (['org_admin', 'maintenance_admin'].includes(user.role) || 
         (user.role === 'org_subadmin' && (user.permissions?.includes('accept_ticket') || (user.email && user.email.includes('marketplace')))))) {
      actions.push({
        id: 'accept',
        label: 'Accept & Assign Ticket',
        icon: 'checkmark-circle',
        style: { backgroundColor: '#10b981' },
        action: () => acceptTicket()
      });
      
      actions.push({
        id: 'reject',
        label: 'Reject Ticket',
        icon: 'close-circle',
        style: { backgroundColor: '#ef4444' },
        action: () => rejectTicket()
      });
    }
    
    // Vendor can accept assigned tickets
    if (ticket.status === 'accepted' && user.role === 'maintenance_admin' && ticket.maintenanceVendorId === user.maintenanceVendorId) {
      actions.push({
        id: 'accept_vendor',
        label: 'Accept & Assign',
        icon: 'checkmark-circle',
        style: { backgroundColor: '#10b981' },
        action: () => acceptTicket()
      });
    }
    
    // Technician actions
    if (user.role === 'technician' && ticket.assigneeId === user.id) {
      if (ticket.status === 'accepted' || ticket.status === 'in-progress') {
        actions.push({
          id: 'start_work',
          label: 'Start Work',
          icon: 'play-circle',
          style: { backgroundColor: '#3b82f6' },
          action: () => startWork()
        });
      }
      
      if (ticket.status === 'in-progress') {
        actions.push({
          id: 'complete_work',
          label: 'Complete Work',
          icon: 'checkmark-done-circle',
          style: { backgroundColor: '#10b981' },
          action: () => completeWork()
        });
      }
    }
    
    // Confirmation actions (original requester or admins)
    if (ticket.status === 'pending_confirmation' && 
        (ticket.reporterId === user.id || 
         ['root', 'org_admin'].includes(user.role) ||
         (user.role === 'org_subadmin' && user.permissions?.includes('accept_ticket')))) {
      actions.push({
        id: 'confirm_completion',
        label: 'Confirm Completion',
        icon: 'thumbs-up',
        style: { backgroundColor: '#3b82f6' },
        action: () => confirmCompletion()
      });
      
      actions.push({
        id: 'reject_completion',
        label: 'Reject Completion',
        icon: 'thumbs-down',
        style: { backgroundColor: '#f59e0b' },
        action: () => rejectCompletion()
      });
    }
    

    
    // Force close (admins only)
    if (['root', 'org_admin', 'maintenance_admin'].includes(user.role) ||
        (user.role === 'org_subadmin' && (user.permissions?.includes('accept_ticket') || (user.email && user.email.includes('marketplace'))))) {
      actions.push({
        id: 'force_close',
        label: 'Force Close',
        icon: 'close-circle',
        style: { backgroundColor: '#ef4444' },
        action: () => forceCloseTicket()
      });
    }
    
    return actions;
  };

  const renderActions = (user: any, ticket: any) => {
    const availableActions = getAvailableActions(user, ticket);
    
    if (availableActions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="information-circle-outline" size={48} color="#9ca3af" />
          <Text style={styles.emptyStateTitle}>No Actions Available</Text>
          <Text style={styles.emptyStateText}>
            You don't have any actions available for this ticket based on your role and the ticket's current status.
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.actionsList}>
        {availableActions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionButton, action.style]}
            onPress={action.action}
            disabled={action.disabled}
          >
            <Ionicons name={action.icon as any} size={20} color="white" />
            <Text style={styles.actionButtonText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
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
            ? "Cannot connect to server. Make sure the backend is running"
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
      case 'in_progress': case 'in-progress': return '#8b5cf6';
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
      case 'in_progress': case 'in-progress': return 60;
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
            {/* Header Section with Status & Priority - Web Style */}
            <View style={styles.headerSection}>
              <View style={styles.titleSection}>
                <Text style={styles.ticketTitle}>{ticket.title || "Untitled Ticket"}</Text>
                <View style={styles.badgeContainer}>
                  <View style={[styles.badge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
                    <Text style={styles.badgeText}>{ticket.priority?.toUpperCase() || "NORMAL"} PRIORITY</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: getStatusColor(ticket.status) }]}>
                    <Text style={styles.badgeText}>{ticket.status?.replace('_', ' ').replace('-', ' ').toUpperCase() || "UNKNOWN"}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Details Grid - Web Style */}
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <View style={styles.detailHeader}>
                    <Ionicons name="bookmark-outline" size={18} color="#64748b" />
                    <Text style={styles.detailLabel}>Ticket Number</Text>
                  </View>
                  <Text style={styles.detailValue}>{ticket.ticketNumber || `#${ticket.id}`}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <View style={styles.detailHeader}>
                    <Ionicons name="calendar-outline" size={18} color="#64748b" />
                    <Text style={styles.detailLabel}>Created</Text>
                  </View>
                  <Text style={styles.detailValue}>
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Description Section - Web Style */}
            {ticket.description && (
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionTitle}>Description</Text>
                <View style={styles.descriptionContent}>
                  <Text style={styles.descriptionText}>{ticket.description}</Text>
                </View>
              </View>
            )}

            {/* Images Section - Web Style */}
            {ticket.images && ticket.images.length > 0 && (
              <View style={styles.imageSection}>
                <Text style={styles.sectionTitle}>Attached Images ({ticket.images.length})</Text>
                <View style={styles.imageGrid}>
                  {ticket.images.map((imageUrl: string, index: number) => {
                    // Handle both relative and absolute URLs for ticket images
                    const fullImageUrl = imageUrl.startsWith('http') 
                      ? imageUrl 
                      : `https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev${imageUrl}`;
                    
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setSelectedImage(fullImageUrl);
                          setImageModalVisible(true);
                        }}
                        style={styles.imageCard}
                      >
                        <Image
                          source={{ uri: fullImageUrl }}
                          style={styles.imagePreview}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Location Section - Web Style */}
            {ticket.location && (
              <View style={styles.locationSection}>
                <Text style={styles.sectionTitle}>Location</Text>
                <View style={styles.locationContent}>
                  <Text style={styles.locationName}>{ticket.location.name || "—"}</Text>
                  {ticket.location.address && (
                    <Text style={styles.locationAddress}>
                      {ticket.location.address}
                      {ticket.location.city ? `, ${ticket.location.city}` : ""}
                      {ticket.location.state ? `, ${ticket.location.state}` : ""}
                      {ticket.location.zip ? ` ${ticket.location.zip}` : ""}
                    </Text>
                  )}
                </View>
              </View>
            )}
          </View>
        );
        
      case 'comments':
        return (
          <View style={styles.tabContent}>
            {/* Add Comment Section - Web Style */}
            <View style={styles.addCommentCard}>
              <Text style={styles.sectionTitle}>Add Comment</Text>
              <View style={styles.commentForm}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Enter your comment..."
                  multiline
                  numberOfLines={4}
                  value={newComment}
                  onChangeText={setNewComment}
                  textAlignVertical="top"
                />
                
                {/* Image Preview */}
                {selectedImages.length > 0 && (
                  <View style={styles.imagePreviewContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {selectedImages.map((image, index) => (
                        <View key={index} style={styles.imagePreviewWrapper}>
                          <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                          <TouchableOpacity
                            style={styles.removeImageButton}
                            onPress={() => removeImage(index)}
                          >
                            <Ionicons name="close-circle" size={20} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
                
                {/* Buttons Row */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.imagePickerButton}
                    onPress={pickImages}
                  >
                    <Ionicons name="camera" size={16} color="#3b82f6" />
                    <Text style={styles.imagePickerText}>Add Images</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { opacity: addCommentMutation.isPending || (!newComment.trim() && selectedImages.length === 0) ? 0.5 : 1 }
                    ]}
                    onPress={handleAddComment}
                    disabled={addCommentMutation.isPending || (!newComment.trim() && selectedImages.length === 0)}
                  >
                    {addCommentMutation.isPending ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <View style={styles.buttonContent}>
                        <Ionicons name="send" size={16} color="white" />
                        <Text style={styles.buttonText}>Add Comment</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Comments List - Web Style */}
            <View style={styles.commentsCard}>
              <Text style={styles.sectionTitle}>
                Comments {comments.length > 0 && `(${comments.length})`}
              </Text>
              {commentsLoading ? (
                <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} />
              ) : comments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubble-outline" size={48} color="#94a3b8" />
                  <Text style={styles.emptyText}>No comments yet</Text>
                  <Text style={styles.emptySubtext}>Be the first to add a comment</Text>
                </View>
              ) : (
                <View style={styles.commentsList}>
                  {comments.map((comment: any, index: number) => (
                    <View key={comment.id || index} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <View style={styles.commentAuthorSection}>
                          <Text style={styles.commentAuthor}>
                            {comment.user?.firstName} {comment.user?.lastName} {comment.user?.name}
                          </Text>
                          {comment.user?.role && (
                            <Text style={styles.commentRole}>{comment.user.role.replace('_', ' ')}</Text>
                          )}
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
                      <Text style={styles.commentContent}>{comment.content || comment.text}</Text>
                      
                      {/* Comment Images */}
                      {comment.images && comment.images.length > 0 && (
                        <View style={styles.commentImagesContainer}>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {comment.images.map((imageUrl: string, imageIndex: number) => {
                              // Handle both relative and absolute URLs
                              const fullImageUrl = imageUrl.startsWith('http') 
                                ? imageUrl 
                                : `https://1527dda9-8c70-4330-bd5b-ff8271c57e0a-00-39f9hruuvsyju.picard.replit.dev${imageUrl}`;
                              
                              return (
                                <TouchableOpacity
                                  key={imageIndex}
                                  onPress={() => {
                                    setSelectedImage(fullImageUrl);
                                    setImageModalVisible(true);
                                  }}
                                  style={styles.commentImageWrapper}
                                >
                                  <Image
                                    source={{ uri: fullImageUrl }}
                                    style={styles.commentImage}
                                    resizeMode="cover"
                                  />
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        );
        
      case 'progress':
        return (
          <View style={styles.tabContent}>
            <View style={styles.progressCard}>
              <Text style={styles.sectionTitle}>Progress Tracker</Text>
              
              {/* Progress Bar - Web Style */}
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { 
                    width: `${getProgressPercentage()}%` 
                  }]} />
                </View>
                <Text style={styles.progressText}>{getProgressPercentage()}% Complete</Text>
              </View>
              
              {/* Detailed Progress Timeline - Matching Web Version */}
              <View style={styles.detailedTimeline}>
                {/* Step 1: Ticket Submitted */}
                <View style={styles.stepContainer}>
                  <View style={[styles.stepIcon, { backgroundColor: '#10b981' }]}>
                    <Ionicons name="document-text" size={16} color="white" />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Ticket Submitted</Text>
                    <Text style={styles.stepDescription}>Initial ticket creation and submission</Text>
                    <Text style={styles.stepDate}>
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      }) : 'Unknown'}
                    </Text>
                  </View>
                  <View style={[styles.stepStatus, { backgroundColor: '#10b981' }]}>
                    <Ionicons name="checkmark" size={12} color="white" />
                  </View>
                </View>
                
                <View style={[styles.connectionLine, { backgroundColor: '#10b981' }]} />
                
                {/* Step 2: Under Review */}
                <View style={styles.stepContainer}>
                  <View style={[styles.stepIcon, { 
                    backgroundColor: ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#f59e0b' : '#6b7280'
                  }]}>
                    <Ionicons name="time" size={16} color="white" />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { 
                      color: ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#f3f4f6' : '#9ca3af'
                    }]}>Under Review</Text>
                    <Text style={[styles.stepDescription, { 
                      color: ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#d1d5db' : '#6b7280'
                    }]}>Organization reviewing ticket details</Text>
                    <Text style={[styles.stepDate, { 
                      color: ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#9ca3af' : '#6b7280'
                    }]}>
                      {['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? 'Completed' : 'Current'}
                    </Text>
                  </View>
                  <View style={[styles.stepStatus, { 
                    backgroundColor: ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#374151'
                  }]}>
                    {['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? (
                      <Ionicons name="checkmark" size={12} color="white" />
                    ) : (
                      <View style={[styles.pendingDot, { backgroundColor: '#6b7280' }]} />
                    )}
                  </View>
                </View>
                
                <View style={[styles.connectionLine, { 
                  backgroundColor: ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#374151'
                }]} />
                
                {/* Step 3: Accepted by Office */}
                <View style={styles.stepContainer}>
                  <View style={[styles.stepIcon, { 
                    backgroundColor: ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#6b7280'
                  }]}>
                    <Ionicons name="checkmark-circle" size={16} color="white" />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { 
                      color: ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#f3f4f6' : '#9ca3af'
                    }]}>Accepted by Office</Text>
                    <Text style={[styles.stepDescription, { 
                      color: ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#d1d5db' : '#6b7280'
                    }]}>Ticket approved and ready for vendor assignment</Text>
                    <Text style={[styles.stepDate, { 
                      color: ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#9ca3af' : '#6b7280'
                    }]}>
                      {['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? 'Completed' : 'Pending'}
                    </Text>
                  </View>
                  <View style={[styles.stepStatus, { 
                    backgroundColor: ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#374151'
                  }]}>
                    {['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? (
                      <Ionicons name="checkmark" size={12} color="white" />
                    ) : (
                      <View style={[styles.pendingDot, { backgroundColor: '#6b7280' }]} />
                    )}
                  </View>
                </View>
                
                <View style={[styles.connectionLine, { 
                  backgroundColor: ticket.maintenanceVendorId && ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#374151'
                }]} />
                
                {/* Step 4: Vendor Assigned */}
                <View style={styles.stepContainer}>
                  <View style={[styles.stepIcon, { 
                    backgroundColor: ticket.maintenanceVendorId && ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#8b5cf6' : '#6b7280'
                  }]}>
                    <Ionicons name="business" size={16} color="white" />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { 
                      color: ticket.maintenanceVendorId && ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#f3f4f6' : '#9ca3af'
                    }]}>Vendor Assigned</Text>
                    <Text style={[styles.stepDescription, { 
                      color: ticket.maintenanceVendorId && ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#d1d5db' : '#6b7280'
                    }]}>Maintenance vendor selected and assigned</Text>
                    <Text style={[styles.stepDate, { 
                      color: ticket.maintenanceVendorId && ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#9ca3af' : '#6b7280'
                    }]}>
                      {ticket.maintenanceVendorId && ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? 'Assigned' : 'Pending'}
                    </Text>
                  </View>
                  <View style={[styles.stepStatus, { 
                    backgroundColor: ticket.maintenanceVendorId && ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#374151'
                  }]}>
                    {ticket.maintenanceVendorId && ['accepted', 'in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? (
                      <Ionicons name="checkmark" size={12} color="white" />
                    ) : (
                      <View style={[styles.pendingDot, { backgroundColor: '#6b7280' }]} />
                    )}
                  </View>
                </View>
                
                <View style={[styles.connectionLine, { 
                  backgroundColor: ticket.assigneeId && ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#374151'
                }]} />
                
                {/* Step 5: Technician Assigned */}
                <View style={styles.stepContainer}>
                  <View style={[styles.stepIcon, { 
                    backgroundColor: ticket.assigneeId && ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#06b6d4' : '#6b7280'
                  }]}>
                    <Ionicons name="person" size={16} color="white" />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { 
                      color: ticket.assigneeId && ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#f3f4f6' : '#9ca3af'
                    }]}>Technician Assigned</Text>
                    <Text style={[styles.stepDescription, { 
                      color: ticket.assigneeId && ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#d1d5db' : '#6b7280'
                    }]}>Specific technician assigned to the job</Text>
                    <Text style={[styles.stepDate, { 
                      color: ticket.assigneeId && ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#9ca3af' : '#6b7280'
                    }]}>
                      {ticket.assigneeId && ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? 'Assigned' : 'Pending'}
                    </Text>
                  </View>
                  <View style={[styles.stepStatus, { 
                    backgroundColor: ticket.assigneeId && ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#374151'
                  }]}>
                    {ticket.assigneeId && ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? (
                      <Ionicons name="checkmark" size={12} color="white" />
                    ) : (
                      <View style={[styles.pendingDot, { backgroundColor: '#6b7280' }]} />
                    )}
                  </View>
                </View>
                
                <View style={[styles.connectionLine, { 
                  backgroundColor: ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#374151'
                }]} />
                
                {/* Step 6: Work In Progress */}
                <View style={styles.stepContainer}>
                  <View style={[styles.stepIcon, { 
                    backgroundColor: ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#f59e0b' : '#6b7280'
                  }]}>
                    <Ionicons name="construct" size={16} color="white" />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { 
                      color: ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#f3f4f6' : '#9ca3af'
                    }]}>Work In Progress</Text>
                    <Text style={[styles.stepDescription, { 
                      color: ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#d1d5db' : '#6b7280'
                    }]}>Active repair/maintenance work ongoing</Text>
                    <Text style={[styles.stepDate, { 
                      color: ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#9ca3af' : '#6b7280'
                    }]}>
                      {['in-progress', 'in_progress'].includes(ticket.status) ? 'Active' : ['completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? 'Completed' : 'Pending'}
                    </Text>
                  </View>
                  <View style={[styles.stepStatus, { 
                    backgroundColor: ['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#374151'
                  }]}>
                    {['in-progress', 'in_progress', 'completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? (
                      <Ionicons name="checkmark" size={12} color="white" />
                    ) : (
                      <View style={[styles.pendingDot, { backgroundColor: '#6b7280' }]} />
                    )}
                  </View>
                </View>
                
                <View style={[styles.connectionLine, { 
                  backgroundColor: ['completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#374151'
                }]} />
                
                {/* Step 7: Work Completed */}
                <View style={styles.stepContainer}>
                  <View style={[styles.stepIcon, { 
                    backgroundColor: ['completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#6b7280'
                  }]}>
                    <Ionicons name="checkmark-done" size={16} color="white" />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { 
                      color: ['completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#f3f4f6' : '#9ca3af'
                    }]}>Work Completed</Text>
                    <Text style={[styles.stepDescription, { 
                      color: ['completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#d1d5db' : '#6b7280'
                    }]}>Technician completed the work</Text>
                    <Text style={[styles.stepDate, { 
                      color: ['completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#9ca3af' : '#6b7280'
                    }]}>
                      {['completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? 'Completed' : 'Pending'}
                    </Text>
                  </View>
                  <View style={[styles.stepStatus, { 
                    backgroundColor: ['completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#374151'
                  }]}>
                    {['completed', 'pending_confirmation', 'confirmed', 'billed'].includes(ticket.status) ? (
                      <Ionicons name="checkmark" size={12} color="white" />
                    ) : (
                      <View style={[styles.pendingDot, { backgroundColor: '#6b7280' }]} />
                    )}
                  </View>
                </View>
                
                <View style={[styles.connectionLine, { 
                  backgroundColor: ['confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#374151'
                }]} />
                
                {/* Step 8: Confirmed */}
                <View style={styles.stepContainer}>
                  <View style={[styles.stepIcon, { 
                    backgroundColor: ['confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#6b7280'
                  }]}>
                    <Ionicons name="thumbs-up" size={16} color="white" />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { 
                      color: ['confirmed', 'billed'].includes(ticket.status) ? '#f3f4f6' : '#9ca3af'
                    }]}>Confirmed</Text>
                    <Text style={[styles.stepDescription, { 
                      color: ['confirmed', 'billed'].includes(ticket.status) ? '#d1d5db' : '#6b7280'
                    }]}>Work confirmed and approved by requester</Text>
                    <Text style={[styles.stepDate, { 
                      color: ['confirmed', 'billed'].includes(ticket.status) ? '#9ca3af' : '#6b7280'
                    }]}>
                      {['confirmed', 'billed'].includes(ticket.status) ? 'Confirmed' : 'Pending'}
                    </Text>
                  </View>
                  <View style={[styles.stepStatus, { 
                    backgroundColor: ['confirmed', 'billed'].includes(ticket.status) ? '#10b981' : '#374151'
                  }]}>
                    {['confirmed', 'billed'].includes(ticket.status) ? (
                      <Ionicons name="checkmark" size={12} color="white" />
                    ) : (
                      <View style={[styles.pendingDot, { backgroundColor: '#6b7280' }]} />
                    )}
                  </View>
                </View>
                
                <View style={[styles.connectionLine, { 
                  backgroundColor: ticket.status === 'billed' ? '#10b981' : '#374151'
                }]} />
                
                {/* Step 9: Billed */}
                <View style={styles.stepContainer}>
                  <View style={[styles.stepIcon, { 
                    backgroundColor: ticket.status === 'billed' ? '#10b981' : '#6b7280'
                  }]}>
                    <Ionicons name="receipt" size={16} color="white" />
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepTitle, { 
                      color: ticket.status === 'billed' ? '#f3f4f6' : '#9ca3af'
                    }]}>Billed</Text>
                    <Text style={[styles.stepDescription, { 
                      color: ticket.status === 'billed' ? '#d1d5db' : '#6b7280'
                    }]}>Invoice generated and sent</Text>
                    <Text style={[styles.stepDate, { 
                      color: ticket.status === 'billed' ? '#9ca3af' : '#6b7280'
                    }]}>
                      {ticket.status === 'billed' ? 'Complete' : 'Pending'}
                    </Text>
                  </View>
                  <View style={[styles.stepStatus, { 
                    backgroundColor: ticket.status === 'billed' ? '#10b981' : '#374151'
                  }]}>
                    {ticket.status === 'billed' ? (
                      <Ionicons name="checkmark" size={12} color="white" />
                    ) : (
                      <View style={[styles.pendingDot, { backgroundColor: '#6b7280' }]} />
                    )}
                  </View>
                </View>
              </View>
            </View>
          </View>
        );
        
      case 'workorders':
        return (
          <View style={styles.tabContent}>
            <View style={styles.workOrdersCard}>
              <Text style={styles.sectionTitle}>
                Work Orders {workOrders.length > 0 && `(${workOrders.length})`}
              </Text>
              {workOrdersLoading ? (
                <ActivityIndicator size="small" color="#3b82f6" style={styles.loader} />
              ) : workOrders.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="construct-outline" size={48} color="#94a3b8" />
                  <Text style={styles.emptyText}>No work orders yet</Text>
                  <Text style={styles.emptySubtext}>Work orders will appear here</Text>
                </View>
              ) : (
                <View style={styles.workOrdersList}>
                  {workOrders.map((workOrder: any, index: number) => (
                    <View key={workOrder.id || index} style={styles.workOrderItem}>
                      <View style={styles.workOrderHeader}>
                        <Text style={styles.workOrderTitle}>Work Order #{workOrder.id}</Text>
                        <View style={[styles.workOrderStatus, { backgroundColor: getStatusColor(workOrder.status) }]}>
                          <Text style={styles.workOrderStatusText}>{workOrder.status}</Text>
                        </View>
                      </View>
                      {workOrder.description && (
                        <Text style={styles.workOrderDescription}>{workOrder.description}</Text>
                      )}
                      <Text style={styles.workOrderDate}>
                        Created: {new Date(workOrder.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        );

      case 'actions':
        return (
          <View style={styles.tabContent}>
            <View style={styles.actionsCard}>
              <Text style={styles.sectionTitle}>Available Actions</Text>
              {renderActions(user, ticket)}
            </View>
          </View>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header - Web Style */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#f3f4f6" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {ticket.title || 'Ticket Details'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {ticket.ticketNumber || `#${ticket.id}`}
          </Text>
        </View>
      </View>

      {/* Tab Navigation - Web Style */}
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
        
        {/* Actions Tab - Only show for users with permissions */}
        {user && hasActionsPermission(user, ticket) && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'actions' && styles.activeTab]}
            onPress={() => setActiveTab('actions')}
          >
            <Text style={[styles.tabText, activeTab === 'actions' && styles.activeTabText]}>
              Actions
            </Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: '#111827',
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
    backgroundColor: '#1f2937',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    color: '#f3f4f6',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
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
  
  // Web-style Details Tab - Dark Theme
  headerSection: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#374151',
  },
  titleSection: {
    marginBottom: 8,
  },
  ticketTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 12,
    lineHeight: 32,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  
  detailsGrid: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#374151',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  detailValue: {
    fontSize: 16,
    color: '#f3f4f6',
    fontWeight: '500',
  },
  
  descriptionSection: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f3f4f6',
    marginBottom: 12,
  },
  descriptionContent: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 16,
  },
  descriptionText: {
    fontSize: 16,
    color: '#1e293b',
    lineHeight: 24,
  },
  
  imageSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageCard: {
    width: (screenWidth - 80) / 2,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  
  locationSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationContent: {
    gap: 4,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  locationAddress: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  
  // Web-style Comments Tab
  addCommentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commentForm: {
    gap: 12,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  
  commentsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  commentsList: {
    gap: 16,
  },
  commentItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentAuthorSection: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  commentRole: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'capitalize',
    marginTop: 2,
  },
  commentDate: {
    fontSize: 12,
    color: '#64748b',
  },
  commentContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  
  // Web-style Progress Tab
  progressCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#374151',
  },
  progressBarContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressTimeline: {
    gap: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  timelineDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  
  // Detailed Progress Timeline Styles
  detailedTimeline: {
    marginTop: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepContent: {
    flex: 1,
    paddingRight: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 2,
  },
  stepDate: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  stepStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connectionLine: {
    width: 2,
    height: 20,
    marginLeft: 19,
    marginVertical: -2,
  },
  
  // Web-style Work Orders Tab
  workOrdersCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  workOrdersList: {
    gap: 12,
  },
  workOrderItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#1e293b',
  },
  workOrderStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workOrderStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  workOrderDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 8,
    lineHeight: 20,
  },
  workOrderDate: {
    fontSize: 12,
    color: '#94a3b8',
  },
  
  // Comment Image Styles
  imagePreviewContainer: {
    marginVertical: 8,
  },
  imagePreviewWrapper: {
    marginRight: 8,
    position: 'relative',
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    backgroundColor: 'white',
  },
  imagePickerText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
  },
  commentImagesContainer: {
    marginTop: 8,
  },
  commentImageWrapper: {
    marginRight: 8,
  },
  commentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  
  // Shared styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  loader: {
    marginVertical: 20,
  },
  
  // Image Modal
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

  // Actions Tab Styles
  actionsCard: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },

  actionsList: {
    marginTop: 16,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },

  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },

  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },

  emptyStateText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
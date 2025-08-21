import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  Platform,
} from "react-native";
// Note: Using a simple manual date selection for now since date picker dependencies have conflicts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from "../../src/components/ui/Header";
import { useRouter } from "expo-router";

type MarketplaceTicket = {
  id: number;
  ticketNumber: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
  images?: string[];
  residentialCity?: string;
  residentialState?: string;
  residentialZip?: string;
};

type VendorBid = {
  id: number;
  ticketId: number;
  vendorId: number;
  hourlyRate: string;
  estimatedHours: string;
  responseTime: string;
  parts: any[];
  totalAmount: string;
  additionalNotes: string;
  status: string;
  rejectionReason?: string;
  counterOffer?: string;
  counterNotes?: string;
  createdAt: string;
  updatedAt: string;
  ticket: {
    id: number;
    ticketNumber: string;
    title: string;
    priority: string;
  };
};

interface BidModalProps {
  visible: boolean;
  onClose: () => void;
  ticket: MarketplaceTicket | null;
  existingBid?: VendorBid;
  onSubmit: (bidData: any) => void;
  isLoading: boolean;
}

function BidModal({ visible, onClose, ticket, existingBid, onSubmit, isLoading }: BidModalProps) {
  const [hourlyRate, setHourlyRate] = useState(existingBid?.hourlyRate || "");
  const [responseTimeValue, setResponseTimeValue] = useState("");
  const [responseTimeUnit, setResponseTimeUnit] = useState("hours");
  const [additionalNotes, setAdditionalNotes] = useState(existingBid?.additionalNotes || "");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Parse existing response time if available
  React.useEffect(() => {
    if (existingBid?.responseTime) {
      const responseTimeStr = existingBid.responseTime.toLowerCase();
      if (responseTimeStr.includes("day")) {
        setResponseTimeUnit("days");
        const match = responseTimeStr.match(/(\d+)/);
        setResponseTimeValue(match ? match[1] : "");
      } else {
        setResponseTimeUnit("hours");
        const match = responseTimeStr.match(/(\d+)/);
        setResponseTimeValue(match ? match[1] : "");
      }
    }
  }, [existingBid]);

  const handleSubmit = () => {
    let responseTime = "";
    
    if (responseTimeUnit === "hours") {
      if (!responseTimeValue) {
        Alert.alert("Error", "Please enter response time in hours");
        return;
      }
      responseTime = `${responseTimeValue} ${responseTimeUnit}`;
    } else {
      // For days, format the selected date
      const today = new Date();
      const daysDiff = Math.ceil((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      responseTime = selectedDate.toLocaleDateString();
    }

    if (!hourlyRate) {
      Alert.alert("Error", "Please enter hourly rate");
      return;
    }
    
    const bidData = {
      ticketId: ticket?.id,
      hourlyRate,
      responseTime,
      additionalNotes,
    };

    onSubmit(bidData);
  };

  const resetForm = () => {
    setHourlyRate("");
    setResponseTimeValue("");
    setResponseTimeUnit("hours");
    setAdditionalNotes("");
    setSelectedDate(new Date());
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(Platform.OS === 'ios');
    setSelectedDate(currentDate);
  };

  const formatSelectedDate = () => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>
            {existingBid ? "Update Bid" : "Place Bid"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {ticket && (
          <View style={styles.ticketInfo}>
            <Text style={styles.ticketTitle}>{ticket.title}</Text>
            <Text style={styles.ticketNumber}>#{ticket.ticketNumber}</Text>
            <Text style={styles.ticketDescription} numberOfLines={3}>
              {ticket.description}
            </Text>
            <View style={styles.priorityContainer}>
              <View style={[styles.priorityBadge, ticket.priority === "high" ? styles.highPriority : styles.normalPriority]}>
                <Text style={[styles.priorityText, ticket.priority === "high" ? styles.highPriorityText : styles.normalPriorityText]}>
                  {ticket.priority} priority
                </Text>
              </View>
            </View>
          </View>
        )}

        <ScrollView style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Hourly Rate ($) *</Text>
            <TextInput
              style={styles.input}
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder="Enter hourly rate"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Response Time *</Text>
            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  responseTimeUnit === "hours" && styles.unitButtonActive
                ]}
                onPress={() => setResponseTimeUnit("hours")}
              >
                <Text style={[
                  styles.unitButtonText,
                  responseTimeUnit === "hours" && styles.unitButtonTextActive
                ]}>
                  Hours
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitButton,
                  responseTimeUnit === "days" && styles.unitButtonActive
                ]}
                onPress={() => setResponseTimeUnit("days")}
              >
                <Text style={[
                  styles.unitButtonText,
                  responseTimeUnit === "days" && styles.unitButtonTextActive
                ]}>
                  Days
                </Text>
              </TouchableOpacity>
            </View>
            
            {responseTimeUnit === "hours" ? (
              <TextInput
                style={styles.input}
                value={responseTimeValue}
                onChangeText={setResponseTimeValue}
                placeholder="Enter hours (e.g., 24)"
                keyboardType="numeric"
              />
            ) : (
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {formatSelectedDate()}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
            
            {showDatePicker && (
              <Modal visible={showDatePicker} transparent={true} animationType="slide">
                <View style={styles.datePickerModal}>
                  <View style={styles.datePickerContainer}>
                    <Text style={styles.datePickerTitle}>Select Response Date</Text>
                    <ScrollView style={styles.dateOptions}>
                      {Array.from({ length: 30 }, (_, i) => {
                        const date = new Date();
                        date.setDate(date.getDate() + i + 1);
                        return (
                          <TouchableOpacity
                            key={i}
                            style={styles.dateOption}
                            onPress={() => {
                              setSelectedDate(date);
                              setShowDatePicker(false);
                            }}
                          >
                            <Text style={styles.dateOptionText}>
                              {date.toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                    <TouchableOpacity
                      style={styles.cancelDateButton}
                      onPress={() => setShowDatePicker(false)}
                    >
                      <Text style={styles.cancelDateButtonText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={additionalNotes}
              onChangeText={setAdditionalNotes}
              placeholder="Add any additional notes..."
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>
                {existingBid ? "Update Bid" : "Place Bid"}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function MarketplaceScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"available" | "my-bids">("available");
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<MarketplaceTicket | null>(null);
  const [selectedBid, setSelectedBid] = useState<VendorBid | null>(null);
  const [ticketDetailsVisible, setTicketDetailsVisible] = useState(false);
  const [viewingTicket, setViewingTicket] = useState<MarketplaceTicket | null>(null);

  // Fetch marketplace tickets
  const { data: marketplaceTickets = [], isLoading: ticketsLoading, refetch: refetchTickets } = useQuery({
    queryKey: ["/api/marketplace/tickets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/marketplace/tickets");
      if (!response.ok) {
        throw new Error("Failed to fetch marketplace tickets");
      }
      return response.json();
    },
    enabled: user?.role === "maintenance_admin" || user?.role === "technician",
  });

  // Fetch vendor bids
  const { data: vendorBids = [], isLoading: bidsLoading, refetch: refetchBids } = useQuery({
    queryKey: ["/api/marketplace/vendor-bids"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/marketplace/vendor-bids");
      if (!response.ok) {
        throw new Error("Failed to fetch vendor bids");
      }
      return response.json();
    },
    enabled: user?.role === "maintenance_admin" || user?.role === "technician",
  });

  // Create bid mutation
  const createBidMutation = useMutation({
    mutationFn: async (bidData: any) => {
      const response = await apiRequest("POST", "/api/marketplace/bids", bidData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create bid");
      }
      return response.json();
    },
    onSuccess: () => {
      Alert.alert("Success", "Bid placed successfully!");
      setBidModalVisible(false);
      setSelectedTicket(null);
      setSelectedBid(null);
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/vendor-bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/tickets"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to place bid");
    },
  });

  // Update bid mutation
  const updateBidMutation = useMutation({
    mutationFn: async (bidData: any) => {
      const response = await apiRequest("PUT", `/api/marketplace/bids/${selectedBid?.id}`, bidData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update bid");
      }
      return response.json();
    },
    onSuccess: () => {
      Alert.alert("Success", "Bid updated successfully!");
      setBidModalVisible(false);
      setSelectedTicket(null);
      setSelectedBid(null);
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/vendor-bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/tickets"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to update bid");
    },
  });

  const acceptCounterOfferMutation = useMutation({
    mutationFn: async (bidId: number) => {
      const response = await apiRequest("POST", `/api/marketplace/bids/${bidId}/accept-counter`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to accept counter offer");
      }
      return response.json();
    },
    onSuccess: () => {
      Alert.alert("Success", "Counter offer accepted! The ticket has been assigned to you.");
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/vendor-bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to accept counter offer");
    },
  });

  const rejectCounterOfferMutation = useMutation({
    mutationFn: async (bidId: number) => {
      const response = await apiRequest("POST", `/api/marketplace/bids/${bidId}/reject-counter`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to reject counter offer");
      }
      return response.json();
    },
    onSuccess: () => {
      Alert.alert("Success", "Counter offer rejected.");
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/vendor-bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/tickets"] });
    },
    onError: (error: any) => {
      Alert.alert("Error", error.message || "Failed to reject counter offer");
    },
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchTickets(), refetchBids()]);
    setRefreshing(false);
  };

  const handlePlaceBid = (ticket: MarketplaceTicket) => {
    const existingBid = vendorBids.find((bid: VendorBid) => bid.ticketId === ticket.id);
    setSelectedTicket(ticket);
    setSelectedBid(existingBid || null);
    setBidModalVisible(true);
  };

  const handleSubmitBid = (bidData: any) => {
    if (selectedBid) {
      updateBidMutation.mutate(bidData);
    } else {
      createBidMutation.mutate(bidData);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "accepted":
        return "#10B981";
      case "rejected":
        return "#EF4444";
      case "counter":
        return "#8B5CF6";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "counter":
        return "Counter Offer";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (!user || (user.role !== "maintenance_admin" && user.role !== "technician")) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="business-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>Access Restricted</Text>
          <Text style={styles.emptySubtitle}>
            You need to be a maintenance vendor to access the marketplace
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Marketplace" 
        subtitle="Available tickets for bidding"
        variant="gradient"
        showBack={true}
        onBack={() => router.back()}
      />
      
      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { marginTop: 20 }]}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "available" && styles.activeTab]}
          onPress={() => setSelectedTab("available")}
        >
          <Text style={[styles.tabText, selectedTab === "available" && styles.activeTabText]}>
            Available Tickets
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === "my-bids" && styles.activeTab]}
          onPress={() => setSelectedTab("my-bids")}
        >
          <Text style={[styles.tabText, selectedTab === "my-bids" && styles.activeTabText]}>
            My Bids
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {selectedTab === "available" && (
          <View style={styles.section}>
            {ticketsLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading tickets...</Text>
              </View>
            ) : marketplaceTickets.length === 0 ? (
              <View style={styles.centerContent}>
                <Ionicons name="ticket-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Tickets Available</Text>
                <Text style={styles.emptySubtitle}>
                  There are no marketplace tickets available for bidding right now
                </Text>
              </View>
            ) : (
              marketplaceTickets.map((ticket: MarketplaceTicket) => {
                const existingBid = vendorBids.find((bid: VendorBid) => bid.ticketId === ticket.id);
                return (
                  <TouchableOpacity
                    key={ticket.id} 
                    style={styles.ticketCard}
                    onPress={() => {
                      console.log('Opening ticket details modal for:', ticket.id);
                      setViewingTicket(ticket);
                      setTicketDetailsVisible(true);
                    }}
                  >
                    <View style={styles.ticketHeader}>
                      <Text style={styles.ticketTitle}>{ticket.title}</Text>
                      <Text style={styles.ticketNumber}>#{ticket.ticketNumber}</Text>
                    </View>
                    <Text style={styles.ticketDescription} numberOfLines={2}>
                      {ticket.description}
                    </Text>
                    <View style={styles.ticketMeta}>
                      <View style={[styles.priorityBadge, ticket.priority === "high" ? styles.highPriority : styles.normalPriority]}>
                        <Text style={[styles.priorityText, ticket.priority === "high" ? styles.highPriorityText : styles.normalPriorityText]}>
                          {ticket.priority} priority
                        </Text>
                      </View>
                      {(ticket.residentialCity || ticket.residentialState) && (
                        <Text style={styles.locationText}>
                          {ticket.residentialCity}, {ticket.residentialState} {ticket.residentialZip}
                        </Text>
                      )}
                    </View>
                    <View style={styles.ticketActions}>
                      <TouchableOpacity
                        style={[styles.bidButton, existingBid?.status === "accepted" && styles.bidButtonDisabled]}
                        onPress={() => handlePlaceBid(ticket)}
                        disabled={existingBid?.status === "accepted"}
                      >
                        <Ionicons name="pricetag" size={16} color="#fff" />
                        <Text style={styles.bidButtonText}>
                          {existingBid ? "Update Bid" : "Place Bid"}
                        </Text>
                      </TouchableOpacity>
                      {existingBid && (
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(existingBid.status) }]}>
                          <Text style={styles.statusText}>{getStatusText(existingBid.status)}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {selectedTab === "my-bids" && (
          <View style={styles.section}>
            {bidsLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Loading bids...</Text>
              </View>
            ) : vendorBids.length === 0 ? (
              <View style={styles.centerContent}>
                <Ionicons name="document-text-outline" size={64} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No Bids Yet</Text>
                <Text style={styles.emptySubtitle}>
                  You haven't submitted any marketplace bids yet. Browse available tickets to get started.
                </Text>
              </View>
            ) : (
              vendorBids.map((bid: VendorBid) => (
                <View key={bid.id} style={styles.bidCard}>
                  {/* Superseded Bid Warning */}
                  {bid.isSuperseded && (
                    <View style={styles.supersededBanner}>
                      <View style={styles.supersededHeader}>
                        <Ionicons name="warning" size={16} color="#dc2626" />
                        <Text style={styles.supersededTitle}>This bid has been updated</Text>
                      </View>
                      <Text style={styles.supersededMessage}>
                        This is an older version (v{bid.version || 1}) of the bid. A newer version has been submitted.
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.bidHeader}>
                    <View>
                      <Text style={styles.bidTitle}>{bid.ticket.title}</Text>
                      <Text style={styles.bidTicketNumber}>#{bid.ticket.ticketNumber}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bid.status) }]}>
                      <Text style={styles.statusText}>{getStatusText(bid.status)}</Text>
                    </View>
                  </View>
                  <View style={styles.bidDetails}>
                    <View style={styles.bidDetailItem}>
                      <Text style={styles.bidDetailLabel}>Hourly Rate</Text>
                      <Text style={styles.bidDetailValue}>${bid.hourlyRate}/hr</Text>
                    </View>
                    <View style={styles.bidDetailItem}>
                      <Text style={styles.bidDetailLabel}>Total Amount</Text>
                      <Text style={styles.bidDetailValue}>${bid.totalAmount}</Text>
                    </View>
                    <View style={styles.bidDetailItem}>
                      <Text style={styles.bidDetailLabel}>Response Time</Text>
                      <Text style={styles.bidDetailValue}>{bid.responseTime}</Text>
                    </View>
                  </View>
                  {bid.status === "counter" && bid.counterOffer && (
                    <View style={styles.counterOfferSection}>
                      <Text style={styles.counterOfferTitle}>Counter Offer: ${bid.counterOffer}/hr</Text>
                      {bid.counterNotes && (
                        <Text style={styles.counterOfferNotes}>{bid.counterNotes}</Text>
                      )}
                      <View style={styles.counterOfferActions}>
                        <TouchableOpacity
                          style={[styles.counterOfferButton, styles.acceptCounterButton]}
                          onPress={() => acceptCounterOfferMutation.mutate(bid.id)}
                          disabled={acceptCounterOfferMutation.isPending || rejectCounterOfferMutation.isPending}
                        >
                          {acceptCounterOfferMutation.isPending ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <>
                              <Ionicons name="checkmark-circle" size={16} color="#fff" />
                              <Text style={styles.counterOfferButtonText}>Accept</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.counterOfferButton, styles.rejectCounterButton]}
                          onPress={() => rejectCounterOfferMutation.mutate(bid.id)}
                          disabled={acceptCounterOfferMutation.isPending || rejectCounterOfferMutation.isPending}
                        >
                          {rejectCounterOfferMutation.isPending ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <>
                              <Ionicons name="close-circle" size={16} color="#fff" />
                              <Text style={styles.counterOfferButtonText}>Reject</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                  {bid.additionalNotes && (
                    <Text style={styles.bidNotes}>{bid.additionalNotes}</Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <BidModal
        visible={bidModalVisible}
        onClose={() => {
          setBidModalVisible(false);
          setSelectedTicket(null);
          setSelectedBid(null);
        }}
        ticket={selectedTicket}
        existingBid={selectedBid || undefined}
        onSubmit={handleSubmitBid}
        isLoading={createBidMutation.isPending || updateBidMutation.isPending}
      />

      {/* Ticket Details Modal */}
      <Modal visible={ticketDetailsVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ticket Details</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setTicketDetailsVisible(false);
                setViewingTicket(null);
              }}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          
          {viewingTicket && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.ticketDetailSection}>
                <Text style={styles.ticketDetailTitle}>{viewingTicket.title}</Text>
                <Text style={styles.ticketDetailNumber}>#{viewingTicket.ticketNumber}</Text>
                
                <View style={styles.ticketDetailMeta}>
                  <View style={[styles.priorityBadge, viewingTicket.priority === "high" ? styles.highPriority : styles.normalPriority]}>
                    <Text style={[styles.priorityText, viewingTicket.priority === "high" ? styles.highPriorityText : styles.normalPriorityText]}>
                      {viewingTicket.priority} priority
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: '#3B82F6' }]}>
                    <Text style={styles.statusText}>{viewingTicket.status}</Text>
                  </View>
                </View>
                
                <Text style={styles.sectionLabel}>Description</Text>
                <Text style={styles.ticketDetailDescription}>{viewingTicket.description}</Text>
                
                {(viewingTicket.residentialCity || viewingTicket.residentialState) && (
                  <>
                    <Text style={styles.sectionLabel}>Location</Text>
                    <Text style={styles.locationDetail}>
                      {viewingTicket.residentialCity}, {viewingTicket.residentialState} {viewingTicket.residentialZip}
                    </Text>
                  </>
                )}
                
                {viewingTicket.images && viewingTicket.images.length > 0 && (
                  <>
                    <Text style={styles.sectionLabel}>Images</Text>
                    <ScrollView horizontal style={styles.imagesContainer}>
                      {viewingTicket.images.map((image: string, index: number) => (
                        <Image
                          key={index}
                          source={{ uri: image }}
                          style={styles.ticketImage}
                          resizeMode="cover"
                        />
                      ))}
                    </ScrollView>
                  </>
                )}
                
                <Text style={styles.sectionLabel}>Created</Text>
                <Text style={styles.dateDetail}>
                  {new Date(viewingTicket.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                
                <TouchableOpacity
                  style={styles.placesBidButton}
                  onPress={() => {
                    setTicketDetailsVisible(false);
                    setViewingTicket(null);
                    handlePlaceBid(viewingTicket);
                  }}
                >
                  <Ionicons name="pricetag" size={18} color="#fff" />
                  <Text style={styles.bidButtonText}>Place Bid</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#111827",
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    minHeight: 54,
  },
  activeTab: {
    backgroundColor: "#3B82F6",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9ca3af",
  },
  activeTabText: {
    color: "#ffffff",
  },
  content: {
    flex: 1,
    backgroundColor: "#111827",
  },
  section: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9ca3af",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#f3f4f6",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
  ticketCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    flex: 1,
    marginRight: 8,
  },
  ticketNumber: {
    fontSize: 14,
    color: "#d1d5db",
    backgroundColor: "#374151",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ticketDescription: {
    fontSize: 14,
    color: "#d1d5db",
    lineHeight: 20,
    marginBottom: 12,
  },
  ticketMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  highPriority: {
    backgroundColor: "#fee2e2",
  },
  normalPriority: {
    backgroundColor: "#e5e7eb",
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "500",
  },
  highPriorityText: {
    color: "#dc2626",
  },
  normalPriorityText: {
    color: "#4b5563",
  },
  locationText: {
    fontSize: 12,
    color: "#6b7280",
    flex: 1,
    textAlign: "right",
  },
  ticketActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bidButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  bidButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  bidButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  bidCard: {
    backgroundColor: "#1f2937",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#374151",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bidHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bidTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#f9fafb",
  },
  bidTicketNumber: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  bidDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  bidDetailItem: {
    flex: 1,
  },
  bidDetailLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 2,
  },
  bidDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#f9fafb",
  },
  counterOfferSection: {
    backgroundColor: "#fef3c7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  counterOfferTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#d97706",
  },
  counterOfferNotes: {
    fontSize: 12,
    color: "#92400e",
    marginTop: 4,
  },
  counterOfferActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  counterOfferButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  acceptCounterButton: {
    backgroundColor: "#10b981",
  },
  rejectCounterButton: {
    backgroundColor: "#ef4444",
  },
  counterOfferButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  bidNotes: {
    fontSize: 12,
    color: "#d1d5db",
    fontStyle: "italic",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  modalContent: {
    flex: 1,
  },
  ticketDetailSection: {
    padding: 20,
  },
  ticketDetailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  ticketDetailNumber: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  ticketDetailMeta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  ticketDetailDescription: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 8,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  locationDetail: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 16,
  },
  dateDetail: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 20,
  },
  imagesContainer: {
    marginBottom: 20,
  },
  ticketImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
  },
  placesBidButton: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
    marginTop: 20,
  },
  ticketInfo: {
    padding: 16,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  priorityContainer: {
    marginTop: 8,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  responseTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  responseTimeInput: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 2,
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: "#3B82F6",
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  unitButtonTextActive: {
    color: "#fff",
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#374151",
  },
  datePickerModal: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  datePickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxHeight: "70%",
    width: "90%",
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
    textAlign: "center",
  },
  dateOptions: {
    maxHeight: 300,
  },
  dateOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dateOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  cancelDateButton: {
    backgroundColor: "#6b7280",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  cancelDateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  supersededBanner: {
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  supersededHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  supersededTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#dc2626",
    marginLeft: 6,
  },
  supersededMessage: {
    fontSize: 12,
    color: "#991b1b",
    lineHeight: 16,
  },
});
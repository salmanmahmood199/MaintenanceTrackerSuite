import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiRequest } from "../../src/services/api";
import type {
  Ticket,
  TicketComment,
  WorkOrder,
  Location,
} from "../../src/types";

interface Part {
  name: string;
  customName?: string;
  quantity: number;
  cost: number;
}

interface OtherCharge {
  description: string;
  cost: number;
}

export default function TicketDetailsScreen() {
  const ticketData = useLocalSearchParams<{ ticket: Ticket }>();
  const ticket = JSON.parse(ticketData.ticket);
  const { id, action } = useLocalSearchParams<{
    id: string;
    action?: string;
  }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<
    "details" | "comments" | "workorders" | "progress"
  >("details");
  const [showActionModal, setShowActionModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Work order form state
  const [workDescription, setWorkDescription] = useState("");
  const [timeIn, setTimeIn] = useState("");
  const [timeOut, setTimeOut] = useState("");
  const [completionStatus, setCompletionStatus] = useState<
    "completed" | "return_needed"
  >("completed");
  const [parts, setParts] = useState<Part[]>([
    { name: "", quantity: 1, cost: 0 },
  ]);
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>([
    { description: "", cost: 0 },
  ]);

  // Comment form state
  const [commentText, setCommentText] = useState("");

  // Action modal state
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (action === "accept" || action === "reject" || action === "work-order") {
      if (action === "work-order") {
        setShowWorkOrderModal(true);
      } else {
        setShowActionModal(true);
      }
    }
  }, [action]);

  // Fetch ticket details
  // const { data: ticket, isLoading: ticketLoading } = useQuery<Ticket>({
  //   queryKey: ['/api/tickets', id],
  //   queryFn: async () => {
  //     const response = await apiRequest('GET', `/api/tickets/${id}`);
  //     return await response.json() as Ticket;
  //   },
  //   enabled: !!id,
  // });

  // Fetch ticket comments
  const { data: comments = [], refetch: refetchComments } = useQuery<
    TicketComment[]
  >({
    queryKey: ["/api/tickets", id, "comments"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/tickets/${id}/comments`);
      return (await response.json()) as TicketComment[];
    },
    enabled: !!id,
  });

  // Fetch tickets (for refetch after actions)
  const { refetch: refetchTickets } = useQuery({
    queryKey: ["/api/tickets"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/tickets");
      return await response.json();
    },
    enabled: false,
  });

  // Fetch work orders
  const { data: workOrders = [], refetch: refetchWorkOrders } = useQuery<
    WorkOrder[]
  >({
    queryKey: ["/api/tickets", id, "work-orders"],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/tickets/${id}/work-orders`,
      );
      return (await response.json()) as WorkOrder[];
    },
    enabled: !!id,
  });

  // Fetch location details
  const { data: ticketLocation } = useQuery<Location>({
    queryKey: ["/api/locations", ticket?.locationId],
    queryFn: async () => {
      const response = await apiRequest(
        "GET",
        `/api/locations/${ticket?.locationId}`,
      );
      return (await response.json()) as Location;
    },
    enabled: !!ticket?.locationId,
  });

  // Ticket action mutations
  const acceptTicketMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/tickets/${id}/accept`);
      if (!response.ok) throw new Error("Failed to accept ticket");
      return response.json();
    },
    onSuccess: () => {
      refetchTickets();
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      setShowActionModal(false);
      Alert.alert("Success", "Ticket accepted successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to accept ticket");
    },
  });

  const rejectTicketMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/tickets/${id}/reject`, {
        rejectionReason,
      });
      if (!response.ok) throw new Error("Failed to reject ticket");
      return response.json();
    },
    onSuccess: () => {
      refetchTickets();
      setShowActionModal(false);
      setRejectionReason("");
      Alert.alert("Success", "Ticket rejected successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to reject ticket");
    },
  });

  const submitWorkOrderMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();

      const workOrder = {
        workDescription,
        parts: parts.filter((p) => p.name),
        otherCharges: otherCharges.filter((c) => c.description),
        timeIn,
        timeOut,
        completionStatus,
        completionNotes:
          completionStatus === "return_needed"
            ? "Return visit needed"
            : "Work completed",
        managerName: "",
        managerSignature: "",
      };

      formData.append("workOrder", JSON.stringify(workOrder));

      const response = await apiRequest(
        "POST",
        `/api/tickets/${id}/complete`,
        formData,
      );
      if (!response.ok) throw new Error("Failed to submit work order");
      return response.json();
    },
    onSuccess: () => {
      refetchTickets();
      refetchWorkOrders();
      setShowWorkOrderModal(false);
      // Reset form
      setWorkDescription("");
      setTimeIn("");
      setTimeOut("");
      setCompletionStatus("completed");
      setParts([{ name: "", quantity: 1, cost: 0 }]);
      setOtherCharges([{ description: "", cost: 0 }]);
      Alert.alert("Success", "Work order submitted successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to submit work order");
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/tickets/${id}/comments`, {
        content: commentText,
      });
      if (!response.ok) throw new Error("Failed to add comment");
      return response.json();
    },
    onSuccess: () => {
      refetchComments();
      setShowCommentModal(false);
      setCommentText("");
      Alert.alert("Success", "Comment added successfully");
    },
    onError: () => {
      Alert.alert("Error", "Failed to add comment");
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchTickets(),
      refetchComments(),
      refetchWorkOrders(),
    ]);
    setRefreshing(false);
  };

  const calculateHours = (timeIn: string, timeOut: string) => {
    if (!timeIn || !timeOut) return 0;

    const [inHour, inMinute] = timeIn.split(":").map(Number);
    const [outHour, outMinute] = timeOut.split(":").map(Number);

    const inTime = inHour * 60 + inMinute;
    const outTime = outHour * 60 + outMinute;

    const diffMinutes = outTime - inTime;
    return Math.max(0, diffMinutes / 60);
  };
  console.log(ticket);
  const calculateTotalCost = () => {
    const partsCost = parts.reduce(
      (sum, part) => sum + part.quantity * part.cost,
      0,
    );
    const chargesCost = otherCharges.reduce(
      (sum, charge) => sum + charge.cost,
      0,
    );
    return partsCost + chargesCost;
  };

  // if (ticketLoading) {
  //   return (
  //     <SafeAreaView style={styles.container}>
  //       <LinearGradient colors={['#1e293b', '#7c3aed', '#1e293b']} style={styles.gradient}>
  //         <View style={styles.loadingContainer}>
  //           <ActivityIndicator size="large" color="#06b6d4" />
  //           <Text style={styles.loadingText}>Loading ticket details...</Text>
  //         </View>
  //       </LinearGradient>
  //     </SafeAreaView>
  //   );
  // }

  if (!ticket) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={["#1e293b", "#7c3aed", "#1e293b"]}
          style={styles.gradient}
        >
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={64} color="#ef4444" />
            <Text style={styles.errorTitle}>Ticket Not Found</Text>
            <Text style={styles.errorText}>
              The requested ticket could not be found.
            </Text>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#94a3b8";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#f59e0b";
      case "accepted":
        return "#8b5cf6";
      case "in_progress":
        return "#06b6d4";
      case "completed":
        return "#10b981";
      case "rejected":
        return "#ef4444";
      default:
        return "#94a3b8";
    }
  };

  const TabButton = ({ tab, title, active, onPress }: any) => (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.activeTabButton]}
      onPress={onPress}
    >
      <Text
        style={[styles.tabButtonText, active && styles.activeTabButtonText]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#1e293b", "#7c3aed", "#1e293b"]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
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
            active={activeTab === "details"}
            onPress={() => setActiveTab("details")}
          />
          <TabButton
            tab="comments"
            title={`Comments (${comments.length})`}
            active={activeTab === "comments"}
            onPress={() => setActiveTab("comments")}
          />
          <TabButton
            tab="workorders"
            title={`Work Orders (${workOrders.length})`}
            active={activeTab === "workorders"}
            onPress={() => setActiveTab("workorders")}
          />
          <TabButton
            tab="progress"
            title="Progress"
            active={activeTab === "progress"}
            onPress={() => setActiveTab("progress")}
          />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#06b6d4"
            />
          }
        >
          {activeTab === "details" && (
            <View>
              {/* Ticket Header Card */}
              <View style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketTitle}>{ticket.title}</Text>
                  <View style={styles.ticketBadges}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: getPriorityColor(ticket.priority) },
                      ]}
                    >
                      <Text style={styles.badgeText}>{ticket.priority}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(ticket.status) },
                      ]}
                    >
                      <Text style={styles.badgeText}>{ticket.status}</Text>
                    </View>
                    {ticket.assignedToMarketplace && (
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: "#7c3aed" },
                        ]}
                      >
                        <Text style={styles.badgeText}>marketplace</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.ticketDescription}>
                  {ticket.description}
                </Text>

                <View style={styles.ticketMeta}>
                  <View style={styles.metaRow}>
                    <Ionicons name="person" size={16} color="#64748b" />
                    <Text style={styles.metaText}>
                      Reported by {ticket.reporterName || "Unknown"}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar" size={16} color="#64748b" />
                    <Text style={styles.metaText}>
                      {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  {ticket.organizationName && (
                    <View style={styles.metaRow}>
                      <Ionicons name="business" size={16} color="#64748b" />
                      <Text style={styles.metaText}>
                        {ticket.organizationName}
                      </Text>
                    </View>
                  )}
                  {(ticket.locationName || ticketLocation) && (
                    <View style={styles.metaRow}>
                      <Ionicons name="location" size={16} color="#64748b" />
                      <Text style={styles.metaText}>
                        {ticket.locationName || ticketLocation?.name}
                        {(ticket.locationAddress || ticketLocation?.address) &&
                          ` - ${ticket.locationAddress || ticketLocation?.address}`}
                      </Text>
                    </View>
                  )}
                  {ticket.assignedTo && (
                    <View style={styles.metaRow}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#10b981"
                      />
                      <Text style={styles.metaText}>
                        Assigned to {ticket.assignedTo}
                      </Text>
                    </View>
                  )}
                </View>

                {ticket.rejectionReason && (
                  <View style={styles.rejectionCard}>
                    <View style={styles.rejectionHeader}>
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                      <Text style={styles.rejectionTitle}>
                        Rejection Reason
                      </Text>
                    </View>
                    <Text style={styles.rejectionText}>
                      {ticket.rejectionReason}
                    </Text>
                  </View>
                )}
              </View>

              {/* Images */}
              {ticket.images && ticket.images.length > 0 && (
                <View style={styles.imagesCard}>
                  <Text style={styles.cardTitle}>
                    Attachments ({ticket.images.length})
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.imagesList}>
                      {ticket.images.map((imageUrl, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.imageContainer}
                          onPress={() => setSelectedImageIndex(index)}
                        >
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.ticketImage}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {/* Quick Actions */}
              <View style={styles.quickActionsCard}>
                <Text style={styles.cardTitle}>Actions</Text>
                <View style={styles.actionButtons}>
                  {/* Accept/Reject for org admins */}
                  {(user?.role === "org_admin" ||
                    (user?.role === "org_subadmin" &&
                      user.permissions?.includes("accept_ticket"))) &&
                    (ticket.status === "open" ||
                      ticket.status === "pending") && (
                      <>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            { backgroundColor: "#10b981" },
                          ]}
                          onPress={() => setShowActionModal(true)}
                        >
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#ffffff"
                          />
                          <Text style={styles.actionButtonText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.actionButton,
                            { backgroundColor: "#ef4444" },
                          ]}
                          onPress={() => setShowActionModal(true)}
                        >
                          <Ionicons
                            name="close-circle"
                            size={20}
                            color="#ffffff"
                          />
                          <Text style={styles.actionButtonText}>Reject</Text>
                        </TouchableOpacity>
                      </>
                    )}

                  {/* Technician actions */}
                  {user?.role === "technician" &&
                    ticket.assigneeId === user.id && (
                      <>
                        {(ticket.status === "accepted" ||
                          ticket.status === "in_progress") && (
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              { backgroundColor: "#3b82f6" },
                            ]}
                            onPress={() => setShowWorkOrderModal(true)}
                          >
                            <Ionicons
                              name="construct"
                              size={20}
                              color="#ffffff"
                            />
                            <Text style={styles.actionButtonText}>
                              {ticket.status === "accepted"
                                ? "Start Work"
                                : "Complete Work"}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </>
                    )}

                  {/* Add comment button */}
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: "#8b5cf6" },
                    ]}
                    onPress={() => setShowCommentModal(true)}
                  >
                    <Ionicons name="chatbubble" size={20} color="#ffffff" />
                    <Text style={styles.actionButtonText}>Add Comment</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {activeTab === "comments" && (
            <View>
              <View style={styles.tabHeader}>
                <Text style={styles.tabHeaderTitle}>Comments & Updates</Text>
                <TouchableOpacity
                  style={styles.addCommentButton}
                  onPress={() => setShowCommentModal(true)}
                >
                  <Ionicons name="add" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {comments.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={48}
                    color="#64748b"
                  />
                  <Text style={styles.emptyTitle}>No Comments</Text>
                  <Text style={styles.emptyText}>
                    No comments have been added to this ticket yet.
                  </Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <View>
                        <Text style={styles.commentAuthor}>
                          {comment.user.firstName} {comment.user.lastName}
                        </Text>
                        <Text style={styles.commentRole}>
                          {comment.user.role}
                        </Text>
                      </View>
                      <Text style={styles.commentDate}>
                        {new Date(comment.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </Text>
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                    {comment.images && comment.images.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.commentImages}
                      >
                        {comment.images.map((imageUrl, index) => (
                          <Image
                            key={index}
                            source={{ uri: imageUrl }}
                            style={styles.commentImage}
                          />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === "workorders" && (
            <View>
              <View style={styles.tabHeader}>
                <Text style={styles.tabHeaderTitle}>Work Orders</Text>
                {user?.role === "technician" &&
                  ticket.assigneeId === user.id &&
                  (ticket.status === "accepted" ||
                    ticket.status === "in_progress") && (
                    <TouchableOpacity
                      style={styles.addCommentButton}
                      onPress={() => setShowWorkOrderModal(true)}
                    >
                      <Ionicons name="add" size={20} color="#ffffff" />
                    </TouchableOpacity>
                  )}
              </View>

              {workOrders.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="construct-outline"
                    size={48}
                    color="#64748b"
                  />
                  <Text style={styles.emptyTitle}>No Work Orders</Text>
                  <Text style={styles.emptyText}>
                    No work orders have been created for this ticket yet.
                  </Text>
                </View>
              ) : (
                workOrders.map((workOrder) => (
                  <View key={workOrder.id} style={styles.workOrderCard}>
                    <View style={styles.workOrderHeader}>
                      <Text style={styles.workOrderTitle}>
                        Work Order #{workOrder.id}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: getStatusColor(
                              workOrder.completionStatus,
                            ),
                          },
                        ]}
                      >
                        <Text style={styles.badgeText}>
                          {workOrder.completionStatus.replace("_", " ")}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.workOrderDescription}>
                      {workOrder.description}
                    </Text>
                    <View style={styles.workOrderMeta}>
                      <View style={styles.metaRow}>
                        <Ionicons name="person" size={16} color="#64748b" />
                        <Text style={styles.metaText}>
                          Technician: {workOrder.technicianName}
                        </Text>
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
                      {workOrder.parts && workOrder.parts.length > 0 && (
                        <View style={styles.metaRow}>
                          <Ionicons name="build" size={16} color="#64748b" />
                          <Text style={styles.metaText}>
                            {workOrder.parts.length} parts used
                          </Text>
                        </View>
                      )}
                    </View>
                    {workOrder.images && workOrder.images.length > 0 && (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.workOrderImages}
                      >
                        {workOrder.images.map((imageUrl, index) => (
                          <Image
                            key={index}
                            source={{ uri: imageUrl }}
                            style={styles.workOrderImage}
                          />
                        ))}
                      </ScrollView>
                    )}
                  </View>
                ))
              )}
            </View>
          )}

          {activeTab === "progress" && (
            <View>
              <Text style={styles.tabHeaderTitle}>Progress Tracker</Text>
              <View style={styles.progressCard}>
                <View style={styles.progressStep}>
                  <View
                    style={[styles.progressDot, { backgroundColor: "#10b981" }]}
                  />
                  <View style={styles.progressContent}>
                    <Text style={styles.progressTitle}>Created</Text>
                    <Text style={styles.progressDate}>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.progressDesc}>
                      Ticket submitted by {ticket.reporterName}
                    </Text>
                  </View>
                </View>

                {ticket.status !== "pending" && ticket.status !== "open" && (
                  <View style={styles.progressStep}>
                    <View
                      style={[
                        styles.progressDot,
                        { backgroundColor: "#3b82f6" },
                      ]}
                    />
                    <View style={styles.progressContent}>
                      <Text style={styles.progressTitle}>Accepted</Text>
                      <Text style={styles.progressDate}>
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </Text>
                      <Text style={styles.progressDesc}>
                        Ticket accepted and assigned
                      </Text>
                    </View>
                  </View>
                )}

                {workOrders.length > 0 && (
                  <View style={styles.progressStep}>
                    <View
                      style={[
                        styles.progressDot,
                        { backgroundColor: "#f59e0b" },
                      ]}
                    />
                    <View style={styles.progressContent}>
                      <Text style={styles.progressTitle}>Work Started</Text>
                      <Text style={styles.progressDate}>
                        {new Date(workOrders[0].createdAt).toLocaleDateString()}
                      </Text>
                      <Text style={styles.progressDesc}>
                        Technician began work
                      </Text>
                    </View>
                  </View>
                )}

                {(ticket.status === "completed" ||
                  ticket.status === "confirmed") && (
                  <View style={styles.progressStep}>
                    <View
                      style={[
                        styles.progressDot,
                        { backgroundColor: "#10b981" },
                      ]}
                    />
                    <View style={styles.progressContent}>
                      <Text style={styles.progressTitle}>Completed</Text>
                      <Text style={styles.progressDate}>
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </Text>
                      <Text style={styles.progressDesc}>
                        Work completed successfully
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Action Modal */}
        <Modal
          visible={showActionModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowActionModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ticket Action</Text>
                <TouchableOpacity onPress={() => setShowActionModal(false)}>
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                {action === "reject" && (
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Rejection Reason *</Text>
                    <TextInput
                      style={[styles.textInput, styles.textArea]}
                      placeholder="Please provide a reason for rejection..."
                      placeholderTextColor="#94a3b8"
                      value={rejectionReason}
                      onChangeText={setRejectionReason}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                )}

                <Text style={styles.confirmText}>
                  Are you sure you want to {action} this ticket?
                </Text>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowActionModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    action === "reject" && { backgroundColor: "#ef4444" },
                  ]}
                  onPress={() => {
                    if (action === "accept") {
                      acceptTicketMutation.mutate();
                    } else if (action === "reject") {
                      if (!rejectionReason.trim()) {
                        Alert.alert(
                          "Error",
                          "Please provide a rejection reason",
                        );
                        return;
                      }
                      rejectTicketMutation.mutate();
                    }
                  }}
                  disabled={
                    acceptTicketMutation.isPending ||
                    rejectTicketMutation.isPending
                  }
                >
                  <LinearGradient
                    colors={
                      action === "reject"
                        ? ["#ef4444", "#dc2626"]
                        : ["#06b6d4", "#3b82f6"]
                    }
                    style={styles.submitButtonGradient}
                  >
                    {acceptTicketMutation.isPending ||
                    rejectTicketMutation.isPending ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {action === "accept"
                          ? "Accept Ticket"
                          : "Reject Ticket"}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Work Order Modal */}
        <Modal
          visible={showWorkOrderModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowWorkOrderModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Work Order</Text>
                <TouchableOpacity onPress={() => setShowWorkOrderModal(false)}>
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Work Description *</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Describe the work performed in detail..."
                    placeholderTextColor="#94a3b8"
                    value={workDescription}
                    onChangeText={setWorkDescription}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.formRow}>
                  <View style={[styles.formField, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.fieldLabel}>Time In *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="09:00"
                      placeholderTextColor="#94a3b8"
                      value={timeIn}
                      onChangeText={setTimeIn}
                    />
                  </View>
                  <View style={[styles.formField, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.fieldLabel}>Time Out *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="17:00"
                      placeholderTextColor="#94a3b8"
                      value={timeOut}
                      onChangeText={setTimeOut}
                    />
                  </View>
                </View>

                {timeIn && timeOut && calculateHours(timeIn, timeOut) > 0 && (
                  <View style={styles.hoursDisplay}>
                    <Text style={styles.hoursText}>
                      Total Hours: {calculateHours(timeIn, timeOut).toFixed(1)}{" "}
                      hours
                    </Text>
                  </View>
                )}

                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Completion Status</Text>
                  <View style={styles.statusButtons}>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        completionStatus === "completed" &&
                          styles.activeStatusButton,
                      ]}
                      onPress={() => setCompletionStatus("completed")}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          completionStatus === "completed" &&
                            styles.activeStatusButtonText,
                        ]}
                      >
                        Completed
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        completionStatus === "return_needed" &&
                          styles.activeStatusButton,
                      ]}
                      onPress={() => setCompletionStatus("return_needed")}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          completionStatus === "return_needed" &&
                            styles.activeStatusButtonText,
                        ]}
                      >
                        Return Needed
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.totalCostDisplay}>
                  <Text style={styles.totalCostText}>
                    Total Cost: ${calculateTotalCost().toFixed(2)}
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowWorkOrderModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => {
                    if (!workDescription.trim() || !timeIn || !timeOut) {
                      Alert.alert(
                        "Error",
                        "Please fill in all required fields",
                      );
                      return;
                    }
                    submitWorkOrderMutation.mutate();
                  }}
                  disabled={submitWorkOrderMutation.isPending}
                >
                  <LinearGradient
                    colors={["#06b6d4", "#3b82f6"]}
                    style={styles.submitButtonGradient}
                  >
                    {submitWorkOrderMutation.isPending ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        Submit Work Order
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Comment Modal */}
        <Modal
          visible={showCommentModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowCommentModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Comment</Text>
                <TouchableOpacity onPress={() => setShowCommentModal(false)}>
                  <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalContent}>
                <View style={styles.formField}>
                  <Text style={styles.fieldLabel}>Comment *</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder="Add your comment or update..."
                    placeholderTextColor="#94a3b8"
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCommentModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => {
                    if (!commentText.trim()) {
                      Alert.alert("Error", "Please enter a comment");
                      return;
                    }
                    addCommentMutation.mutate();
                  }}
                  disabled={addCommentMutation.isPending}
                >
                  <LinearGradient
                    colors={["#06b6d4", "#3b82f6"]}
                    style={styles.submitButtonGradient}
                  >
                    {addCommentMutation.isPending ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.submitButtonText}>Add Comment</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#94a3b8",
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerBackButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 2,
    textTransform: "capitalize",
  },
  headerSpacer: {
    width: 40,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#3b82f6",
  },
  tabButtonText: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
  },
  activeTabButtonText: {
    color: "#ffffff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  ticketCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
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
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#ffffff",
    textTransform: "uppercase",
  },
  ticketDescription: {
    fontSize: 16,
    color: "#94a3b8",
    marginBottom: 16,
    lineHeight: 22,
  },
  ticketMeta: {
    gap: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: "#64748b",
  },
  rejectionCard: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  rejectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rejectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ef4444",
    marginLeft: 8,
  },
  rejectionText: {
    fontSize: 14,
    color: "#fca5a5",
  },
  imagesCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 12,
  },
  imagesList: {
    flexDirection: "row",
    gap: 12,
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: "hidden",
  },
  ticketImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    paddingHorizontal: 40,
  },
  commentCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  commentRole: {
    fontSize: 12,
    color: "#06b6d4",
    textTransform: "capitalize",
  },
  commentDate: {
    fontSize: 12,
    color: "#64748b",
  },
  commentContent: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 18,
  },
  commentImages: {
    marginTop: 12,
    flexDirection: "row",
  },
  commentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  workOrderCard: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  workOrderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  workOrderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  workOrderDescription: {
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 12,
    lineHeight: 18,
  },
  workOrderMeta: {
    gap: 6,
  },
  workOrderImages: {
    marginTop: 12,
    flexDirection: "row",
  },
  workOrderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
});

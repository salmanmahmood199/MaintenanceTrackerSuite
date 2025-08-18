import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface BidDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  bid: any;
  isOrganization?: boolean;
  onAcceptBid?: (bidId: number) => void;
  onRejectBid?: (bidId: number, reason: string) => void;
  onCounterBid?: (bidId: number, counterOffer: string, counterNotes?: string) => void;
  onUpdateBid?: (bidId: number, bidData: any) => void;
  isLoading?: boolean;
}

export default function BidDetailsModal({
  visible,
  onClose,
  bid,
  isOrganization,
  onAcceptBid,
  onRejectBid,
  onCounterBid,
  onUpdateBid,
  isLoading,
}: BidDetailsModalProps) {
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [showCounterInput, setShowCounterInput] = useState(false);
  const [showUpdateInput, setShowUpdateInput] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [counterOffer, setCounterOffer] = useState("");
  const [counterNotes, setCounterNotes] = useState("");
  const [updateHourlyRate, setUpdateHourlyRate] = useState("");
  const [updateResponseTime, setUpdateResponseTime] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");

  const resetInputs = () => {
    setShowRejectInput(false);
    setShowCounterInput(false);
    setShowUpdateInput(false);
    setRejectionReason("");
    setCounterOffer("");
    setCounterNotes("");
    setUpdateHourlyRate("");
    setUpdateResponseTime("");
    setUpdateNotes("");
  };

  const handleAccept = () => {
    Alert.alert(
      "Accept Bid",
      "Are you sure you want to accept this bid? This will assign the ticket to this vendor.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: () => onAcceptBid?.(bid.id),
        },
      ]
    );
  };

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      Alert.alert("Error", "Please provide a reason for rejecting this bid");
      return;
    }
    onRejectBid?.(bid.id, rejectionReason.trim());
    resetInputs();
  };

  const handleCounter = () => {
    if (!counterOffer.trim()) {
      Alert.alert("Error", "Please provide a counter offer amount");
      return;
    }
    onCounterBid?.(bid.id, counterOffer.trim(), counterNotes.trim() || undefined);
    resetInputs();
  };

  const handleUpdate = () => {
    if (!updateHourlyRate.trim() || !updateResponseTime.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    
    const bidData = {
      hourlyRate: updateHourlyRate.trim(),
      responseTime: updateResponseTime.trim(),
      additionalNotes: updateNotes.trim()
    };
    
    onUpdateBid?.(bid.id, bidData);
    resetInputs();
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

  if (!bid) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Bid Details</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          {/* Ticket Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ticket Information</Text>
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketTitle}>{bid.ticket?.title || 'Untitled Ticket'}</Text>
              <Text style={styles.ticketNumber}>#{bid.ticket?.ticketNumber || bid.ticketNumber || 'N/A'}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bid.status) }]}>
                <Text style={styles.statusText}>{getStatusText(bid.status)}</Text>
              </View>
            </View>
          </View>

          {/* Bid Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bid Details</Text>
            <View style={styles.bidDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Vendor</Text>
                <Text style={styles.detailValue}>{bid.vendor?.companyName || bid.vendor?.name || bid.vendorName || 'Unknown Vendor'}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Hourly Rate</Text>
                <Text style={styles.detailValue}>${bid.hourlyRate}/hr</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Response Time</Text>
                <Text style={styles.detailValue}>{bid.responseTime}</Text>
              </View>
              {bid.createdAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Submitted</Text>
                  <Text style={styles.detailValue}>
                    {new Date(bid.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              )}
              {bid.updatedAt && bid.updatedAt !== bid.createdAt && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Updated</Text>
                  <Text style={styles.detailValue}>
                    {new Date(bid.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Additional Notes */}
          {bid.additionalNotes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Notes</Text>
              <Text style={styles.notesText}>{bid.additionalNotes}</Text>
            </View>
          )}

          {/* Counter Offer Info */}
          {bid.status === "counter" && bid.counterOffer && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Counter Offer</Text>
              <View style={styles.counterOfferContainer}>
                <Text style={styles.counterOfferAmount}>${bid.counterOffer}</Text>
                {bid.counterNotes && (
                  <Text style={styles.counterNotes}>{bid.counterNotes}</Text>
                )}
              </View>
            </View>
          )}

          {/* Organization Actions */}
          {isOrganization && bid.status === "pending" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Actions</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.acceptButton]}
                  onPress={handleAccept}
                  disabled={isLoading}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Accept Bid</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => setShowRejectInput(true)}
                  disabled={isLoading}
                >
                  <Ionicons name="close-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Reject</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.counterButton]}
                  onPress={() => setShowCounterInput(true)}
                  disabled={isLoading}
                >
                  <Ionicons name="swap-horizontal" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Counter Offer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Vendor Actions - Update Own Bid */}
          {!isOrganization && bid.status === "pending" && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Update Your Bid</Text>
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.updateButton]}
                  onPress={() => {
                    setUpdateHourlyRate(bid.hourlyRate || "");
                    setUpdateResponseTime(bid.responseTime || "");
                    setUpdateNotes(bid.additionalNotes || "");
                    setShowUpdateInput(true);
                  }}
                  disabled={isLoading}
                >
                  <Ionicons name="create-outline" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Update Bid</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Reject Input */}
          {showRejectInput && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rejection Reason</Text>
              <TextInput
                style={styles.textInput}
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Please provide a reason for rejecting this bid"
                multiline
                numberOfLines={3}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={[styles.inputActionButton, styles.cancelButton]}
                  onPress={() => setShowRejectInput(false)}
                >
                  <Text style={styles.inputActionButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputActionButton, styles.submitButton]}
                  onPress={handleReject}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.inputActionButtonText}>Reject Bid</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Counter Offer Input */}
          {showCounterInput && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Counter Offer</Text>
              <TextInput
                style={styles.textInput}
                value={counterOffer}
                onChangeText={setCounterOffer}
                placeholder="Enter counter offer amount (e.g., 150.00)"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={counterNotes}
                onChangeText={setCounterNotes}
                placeholder="Optional notes about the counter offer"
                multiline
                numberOfLines={3}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={[styles.inputActionButton, styles.cancelButton]}
                  onPress={() => setShowCounterInput(false)}
                >
                  <Text style={styles.inputActionButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputActionButton, styles.submitButton]}
                  onPress={handleCounter}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.inputActionButtonText}>Send Counter</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Update Bid Input */}
          {showUpdateInput && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Update Your Bid</Text>
              <TextInput
                style={styles.textInput}
                value={updateHourlyRate}
                onChangeText={setUpdateHourlyRate}
                placeholder={`Current: $${bid.hourlyRate}/hr`}
                keyboardType="numeric"
              />
              <TextInput
                style={styles.textInput}
                value={updateResponseTime}
                onChangeText={setUpdateResponseTime}
                placeholder={`Current: ${bid.responseTime}`}
              />
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={updateNotes}
                onChangeText={setUpdateNotes}
                placeholder="Updated additional notes (optional)"
                multiline
                numberOfLines={3}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  style={[styles.inputActionButton, styles.cancelButton]}
                  onPress={() => setShowUpdateInput(false)}
                >
                  <Text style={styles.inputActionButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputActionButton, styles.submitButton]}
                  onPress={handleUpdate}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.inputActionButtonText}>Update Bid</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111827",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 12,
  },
  ticketInfo: {
    backgroundColor: "#1f2937",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#374151",
  },
  ticketTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  ticketNumber: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  bidDetails: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  notesText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  counterOfferContainer: {
    backgroundColor: "#fef3c7",
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#f59e0b",
  },
  counterOfferAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#92400e",
    marginBottom: 8,
  },
  counterNotes: {
    fontSize: 14,
    color: "#78350f",
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#10b981",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },
  counterButton: {
    backgroundColor: "#8b5cf6",
  },
  updateButton: {
    backgroundColor: "#f59e0b",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#4b5563",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#374151",
    color: "#ffffff",
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  inputActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  inputActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6b7280",
  },
  submitButton: {
    backgroundColor: "#3b82f6",
  },
  inputActionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import type { Ticket } from "../types";

interface TicketCardProps {
  ticket: Ticket;
  onPress?: () => void;
  onMenuPress?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

export function TicketCard({
  ticket,
  onPress,
  onMenuPress,
  showActions = false,
  compact = false,
}: TicketCardProps) {
  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "warning";
      case "accepted":
        return "info";
      case "in_progress":
        return "info";
      case "completed":
        return "success";
      case "rejected":
        return "error";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string | number) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {ticket.title}
            </Text>
            <Text style={styles.ticketNumber}>#{ticket.ticketNumber}</Text>
          </View>

          {onMenuPress && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={onMenuPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.badges}>
          <Badge variant={getPriorityVariant(ticket.priority)} size="sm">
            {ticket.priority}
          </Badge>
          <Badge variant={getStatusVariant(ticket.status)} size="sm">
            {ticket.status.replace("_", " ")}
          </Badge>
        </View>

        {!compact && ticket.description && (
          <Text style={styles.description} numberOfLines={3}>
            {ticket.description}
          </Text>
        )}

        <View style={styles.footer}>
          <View style={styles.locationInfo}>
            <Ionicons name="location-outline" size={14} color="#94a3b8" />
            <Text style={styles.location}>
              {ticket.locationName || "No location"}
            </Text>
          </View>

          <View style={styles.rightInfo}>
            {ticket.images && ticket.images.length > 0 && (
              <View style={styles.imageIndicator}>
                <Ionicons name="image-outline" size={14} color="#94a3b8" />
                <Text style={styles.imageCount}>{ticket.images.length}</Text>
              </View>
            )}
            <Text style={styles.date}>
              {formatDate(ticket.createdAt || Date.now())}
            </Text>
          </View>
        </View>

        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
            >
              <Ionicons name="checkmark" size={16} color="#ffffff" />
              <Text style={styles.actionText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
            >
              <Ionicons name="close" size={16} color="#ffffff" />
              <Text style={styles.actionText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 4,
    lineHeight: 20,
  },
  ticketNumber: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "500",
  },
  menuButton: {
    padding: 4,
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: "#cbd5e1",
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  location: {
    fontSize: 12,
    color: "#94a3b8",
    flex: 1,
  },
  rightInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  imageIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  imageCount: {
    fontSize: 12,
    color: "#94a3b8",
  },
  date: {
    fontSize: 12,
    color: "#64748b",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  acceptButton: {
    backgroundColor: "#10b981",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },
  actionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});

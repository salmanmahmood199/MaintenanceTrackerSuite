import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WorkOrderDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  workOrder: any;
}

const WorkOrderDetailsModal: React.FC<WorkOrderDetailsModalProps> = ({
  visible,
  onClose,
  workOrder,
}) => {
  if (!workOrder) return null;

  const formatCurrency = (amount: string | number) => {
    return `$${parseFloat(amount.toString()).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'in-progress': case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Work Order Details</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Work Order Header */}
          <View style={styles.workOrderHeader}>
            <View style={styles.headerInfo}>
              <Text style={styles.workOrderNumber}>Work Order #{workOrder.id}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(workOrder.status) }]}>
                <Text style={styles.statusText}>{workOrder.status}</Text>
              </View>
            </View>
            <Text style={styles.workOrderNumber}>#{workOrder.workOrderNumber}</Text>
          </View>

          {/* Description */}
          {workOrder.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{workOrder.description}</Text>
            </View>
          )}

          {/* Work Details */}
          {workOrder.workDescription && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Work Performed</Text>
              <Text style={styles.description}>{workOrder.workDescription}</Text>
            </View>
          )}

          {/* Time Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Information</Text>
            <View style={styles.timeGrid}>
              <View style={styles.timeItem}>
                <Text style={styles.timeLabel}>Created</Text>
                <Text style={styles.timeValue}>
                  {formatDate(workOrder.createdAt)}
                </Text>
              </View>
              {workOrder.startTime && (
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Started</Text>
                  <Text style={styles.timeValue}>
                    {formatDate(workOrder.startTime)}
                  </Text>
                </View>
              )}
              {workOrder.endTime && (
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Completed</Text>
                  <Text style={styles.timeValue}>
                    {formatDate(workOrder.endTime)}
                  </Text>
                </View>
              )}
              {workOrder.hours && (
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Total Hours</Text>
                  <Text style={styles.timeValue}>{workOrder.hours} hours</Text>
                </View>
              )}
            </View>
          </View>

          {/* Cost Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cost Information</Text>
            <View style={styles.costGrid}>
              {workOrder.hourlyRate && (
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Hourly Rate</Text>
                  <Text style={styles.costValue}>{formatCurrency(workOrder.hourlyRate)}</Text>
                </View>
              )}
              {workOrder.laborCost && (
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Labor Cost</Text>
                  <Text style={styles.costValue}>{formatCurrency(workOrder.laborCost)}</Text>
                </View>
              )}
              {workOrder.partsCost && (
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Parts Cost</Text>
                  <Text style={styles.costValue}>{formatCurrency(workOrder.partsCost)}</Text>
                </View>
              )}
              {workOrder.totalCost && (
                <View style={styles.costItem}>
                  <Text style={styles.costLabel}>Total Cost</Text>
                  <Text style={[styles.costValue, styles.totalCost]}>{formatCurrency(workOrder.totalCost)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Parts Used */}
          {workOrder.parts && workOrder.parts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Parts Used</Text>
              {workOrder.parts.map((part: any, index: number) => (
                <View key={index} style={styles.partItem}>
                  <View style={styles.partInfo}>
                    <Text style={styles.partName}>{part.name}</Text>
                    <Text style={styles.partDetails}>
                      Qty: {part.quantity} • {formatCurrency(part.cost)} each
                    </Text>
                  </View>
                  <Text style={styles.partTotal}>
                    {formatCurrency(part.quantity * part.cost)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Other Charges */}
          {workOrder.otherCharges && workOrder.otherCharges.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Other Charges</Text>
              {workOrder.otherCharges.map((charge: any, index: number) => (
                <View key={index} style={styles.chargeItem}>
                  <Text style={styles.chargeName}>{charge.description}</Text>
                  <Text style={styles.chargeAmount}>{formatCurrency(charge.amount)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Notes */}
          {workOrder.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.description}>{workOrder.notes}</Text>
            </View>
          )}

          {/* Completion Notes */}
          {workOrder.completionNotes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Completion Notes</Text>
              <Text style={styles.description}>{workOrder.completionNotes}</Text>
            </View>
          )}

          {/* Technician Information */}
          {workOrder.technicianId && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Technician</Text>
              <Text style={styles.description}>
                Technician ID: {workOrder.technicianId}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  workOrderHeader: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  workOrderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timeGrid: {
    gap: 12,
  },
  timeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  timeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 14,
    color: '#333',
  },
  costGrid: {
    gap: 12,
  },
  costItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  costValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalCost: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  partItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  partInfo: {
    flex: 1,
  },
  partName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  partDetails: {
    fontSize: 12,
    color: '#666',
  },
  partTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  chargeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  chargeName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  chargeAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default WorkOrderDetailsModal;
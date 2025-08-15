import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

interface WorkOrderDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  workOrder: any;
}

interface ImageModalState {
  visible: boolean;
  imageUri: string | null;
}

const WorkOrderDetailsModal: React.FC<WorkOrderDetailsModalProps> = ({
  visible,
  onClose,
  workOrder,
}) => {
  const [imageModal, setImageModal] = useState<ImageModalState>({
    visible: false,
    imageUri: null,
  });

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
              {workOrder.workDate && (
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Work Date</Text>
                  <Text style={styles.timeValue}>
                    {new Date(workOrder.workDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              )}
              {workOrder.timeIn && (
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Time In</Text>
                  <Text style={styles.timeValue}>{workOrder.timeIn}</Text>
                </View>
              )}
              {workOrder.timeOut && (
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Time Out</Text>
                  <Text style={styles.timeValue}>{workOrder.timeOut}</Text>
                </View>
              )}
              {workOrder.totalHours && (
                <View style={styles.timeItem}>
                  <Text style={styles.timeLabel}>Total Hours</Text>
                  <Text style={styles.timeValue}>{workOrder.totalHours} hours</Text>
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
          {workOrder.technicianName && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Technician</Text>
              <Text style={styles.description}>
                {workOrder.technicianName}
              </Text>
            </View>
          )}

          {/* Photos */}
          {workOrder.images && workOrder.images.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <View style={styles.photosGrid}>
                {workOrder.images.map((imageUri: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.photoItem}
                    onPress={() => setImageModal({ visible: true, imageUri })}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.photoThumbnail}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Image Modal */}
      <Modal
        visible={imageModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModal({ visible: false, imageUri: null })}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setImageModal({ visible: false, imageUri: null })}
          >
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
          {imageModal.imageUri && (
            <Image
              source={{ uri: imageModal.imageUri }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  workOrderHeader: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#374151',
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
    color: '#f3f4f6',
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
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#374151',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#d1d5db',
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
    color: '#9ca3af',
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 14,
    color: '#f3f4f6',
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
    color: '#9ca3af',
    fontWeight: '500',
  },
  costValue: {
    fontSize: 14,
    color: '#f3f4f6',
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
    borderBottomColor: '#374151',
  },
  partInfo: {
    flex: 1,
  },
  partName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f3f4f6',
    marginBottom: 2,
  },
  partDetails: {
    fontSize: 12,
    color: '#9ca3af',
  },
  partTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f3f4f6',
  },
  chargeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  // Photos styles
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: (screenWidth - 80) / 3,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: '#111827',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
  },
  // Image Modal styles
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
  chargeName: {
    fontSize: 14,
    color: '#f3f4f6',
    flex: 1,
  },
  chargeAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f3f4f6',
  },
});

export default WorkOrderDetailsModal;
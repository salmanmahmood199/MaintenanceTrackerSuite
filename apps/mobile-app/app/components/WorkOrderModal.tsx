import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../../src/services/api';

interface WorkOrderModalProps {
  visible: boolean;
  onClose: () => void;
  ticket: any;
  user: any;
}

interface Part {
  name: string;
  quantity: number;
  cost: number;
}

interface OtherCharge {
  description: string;
  cost: number;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  visible,
  onClose,
  ticket,
  user
}) => {
  const [workDescription, setWorkDescription] = useState('');
  const [completionStatus, setCompletionStatus] = useState<'completed' | 'return_needed' | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [parts, setParts] = useState<Part[]>([{ name: '', quantity: 1, cost: 0 }]);
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>([{ description: '', cost: 0 }]);
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [managerName, setManagerName] = useState('');
  const [workImages, setWorkImages] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);

  const queryClient = useQueryClient();

  // Calculate total cost whenever parts or other charges change
  useEffect(() => {
    const partsTotal = parts.reduce((sum, part) => sum + (part.quantity * part.cost), 0);
    const chargesTotal = otherCharges.reduce((sum, charge) => sum + charge.cost, 0);
    setTotalCost(partsTotal + chargesTotal);
  }, [parts, otherCharges]);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setWorkDescription('');
      setCompletionStatus(null);
      setCompletionNotes('');
      setParts([{ name: '', quantity: 1, cost: 0 }]);
      setOtherCharges([{ description: '', cost: 0 }]);
      setTimeIn('');
      setTimeOut('');
      setManagerName('');
      setWorkImages([]);
    }
  }, [visible]);

  const createWorkOrderMutation = useMutation({
    mutationFn: async (workOrderData: any) => {
      console.log('Creating work order with data:', workOrderData);
      
      // Validate required fields
      if (!workOrderData.workDescription?.trim()) {
        throw new Error('Work description is required');
      }
      
      if (!workOrderData.completionStatus) {
        throw new Error('Completion status is required');
      }

      const formData = new FormData();
      
      // Add work order data with proper field mapping
      Object.keys(workOrderData).forEach(key => {
        if (key !== 'images') {
          const value = workOrderData[key];
          if (value !== null && value !== undefined) {
            formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
          }
        }
      });
      
      // Add images
      workImages.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: image.name || `work_image_${index}.jpg`,
        } as any);
      });

      console.log('Sending FormData to API...');
      const response = await apiRequest('POST', `/api/tickets/${ticket.id}/work-orders`, formData);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Unknown error' };
        }
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workorders', ticket.id.toString()] });
      queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id.toString()] });
      Alert.alert('Success', 'Work order created successfully');
      onClose();
    },
    onError: (error: any) => {
      console.error('Work order creation error:', error);
      Alert.alert('Error', error.message || 'Failed to create work order');
    },
  });

  const handleSubmit = () => {
    if (!workDescription.trim()) {
      Alert.alert('Error', 'Please provide a work description');
      return;
    }

    if (!completionStatus) {
      Alert.alert('Error', 'Please select completion status');
      return;
    }

    const workOrderData = {
      workDescription,
      completionStatus,
      completionNotes,
      parts: parts.filter(p => p.name.trim() !== ''),
      otherCharges: otherCharges.filter(c => c.description.trim() !== ''),
      timeIn: timeIn || null,
      timeOut: timeOut || null,
      totalHours: timeIn && timeOut ? calculateHours(timeIn, timeOut) : null,
      managerName,
      totalCost,
      workDate: new Date().toISOString().split('T')[0]
    };

    createWorkOrderMutation.mutate(workOrderData);
  };

  const calculateHours = (timeIn: string, timeOut: string): number => {
    if (!timeIn || !timeOut) return 0;
    const inTime = new Date(`1970-01-01T${timeIn}:00`);
    const outTime = new Date(`1970-01-01T${timeOut}:00`);
    const diffMs = outTime.getTime() - inTime.getTime();
    return diffMs / (1000 * 60 * 60); // Convert to hours
  };

  const addPart = () => {
    setParts(prev => [...prev, { name: '', quantity: 1, cost: 0 }]);
  };

  const removePart = (index: number) => {
    setParts(prev => prev.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: keyof Part, value: any) => {
    setParts(prev => prev.map((part, i) => 
      i === index ? { ...part, [field]: value } : part
    ));
  };

  const addOtherCharge = () => {
    setOtherCharges(prev => [...prev, { description: '', cost: 0 }]);
  };

  const removeOtherCharge = (index: number) => {
    setOtherCharges(prev => prev.filter((_, i) => i !== index));
  };

  const updateOtherCharge = (index: number, field: keyof OtherCharge, value: any) => {
    setOtherCharges(prev => prev.map((charge, i) => 
      i === index ? { ...charge, [field]: value } : charge
    ));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setWorkImages(prev => [...prev, result.assets[0]]);
    }
  };

  const removeImage = (index: number) => {
    setWorkImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#f3f4f6" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Work Order</Text>
          <TouchableOpacity 
            onPress={handleSubmit} 
            style={[styles.submitButton, { opacity: createWorkOrderMutation.isPending ? 0.6 : 1 }]}
            disabled={createWorkOrderMutation.isPending}
          >
            {createWorkOrderMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Ticket Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ticket Information</Text>
            <Text style={styles.ticketInfo}>#{ticket.ticketNumber} - {ticket.title}</Text>
          </View>

          {/* Work Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Work Description *</Text>
            <TextInput
              style={styles.textArea}
              value={workDescription}
              onChangeText={setWorkDescription}
              placeholder="Describe the work performed..."
              multiline
              numberOfLines={4}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Completion Status */}
          <View style={styles.section}>
            <Text style={styles.label}>Completion Status *</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  completionStatus === 'completed' && styles.statusButtonActive
                ]}
                onPress={() => setCompletionStatus('completed')}
              >
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color={completionStatus === 'completed' ? '#ffffff' : '#10b981'} 
                />
                <Text style={[
                  styles.statusButtonText,
                  completionStatus === 'completed' && styles.statusButtonTextActive
                ]}>Job Completed</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  completionStatus === 'return_needed' && styles.statusButtonActive
                ]}
                onPress={() => setCompletionStatus('return_needed')}
              >
                <Ionicons 
                  name="refresh-circle" 
                  size={20} 
                  color={completionStatus === 'return_needed' ? '#ffffff' : '#f59e0b'} 
                />
                <Text style={[
                  styles.statusButtonText,
                  completionStatus === 'return_needed' && styles.statusButtonTextActive
                ]}>Return Needed</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Completion Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Completion Notes</Text>
            <TextInput
              style={styles.textArea}
              value={completionNotes}
              onChangeText={setCompletionNotes}
              placeholder="Additional notes about the work..."
              multiline
              numberOfLines={3}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Time Tracking */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Tracking</Text>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <Text style={styles.label}>Time In</Text>
                <TextInput
                  style={styles.timeInput}
                  value={timeIn}
                  onChangeText={setTimeIn}
                  placeholder="09:00"
                  placeholderTextColor="#9ca3af"
                />
              </View>
              <View style={styles.timeField}>
                <Text style={styles.label}>Time Out</Text>
                <TextInput
                  style={styles.timeInput}
                  value={timeOut}
                  onChangeText={setTimeOut}
                  placeholder="17:00"
                  placeholderTextColor="#9ca3af"
                />
              </View>
            </View>
          </View>

          {/* Parts Used */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Parts & Equipment Used</Text>
              <TouchableOpacity onPress={addPart} style={styles.addButton}>
                <Ionicons name="add" size={20} color="#3b82f6" />
                <Text style={styles.addButtonText}>Add Part</Text>
              </TouchableOpacity>
            </View>
            {parts.map((part, index) => (
              <View key={index} style={styles.partRow}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  value={part.name}
                  onChangeText={(value) => updatePart(index, 'name', value)}
                  placeholder="Part name"
                  placeholderTextColor="#9ca3af"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={part.quantity.toString()}
                  onChangeText={(value) => updatePart(index, 'quantity', parseInt(value) || 1)}
                  placeholder="Qty"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={part.cost.toString()}
                  onChangeText={(value) => updatePart(index, 'cost', parseFloat(value) || 0)}
                  placeholder="Cost"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
                {parts.length > 1 && (
                  <TouchableOpacity onPress={() => removePart(index)} style={styles.removeButton}>
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Other Charges */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Other Charges</Text>
              <TouchableOpacity onPress={addOtherCharge} style={styles.addButton}>
                <Ionicons name="add" size={20} color="#3b82f6" />
                <Text style={styles.addButtonText}>Add Charge</Text>
              </TouchableOpacity>
            </View>
            {otherCharges.map((charge, index) => (
              <View key={index} style={styles.chargeRow}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  value={charge.description}
                  onChangeText={(value) => updateOtherCharge(index, 'description', value)}
                  placeholder="Description"
                  placeholderTextColor="#9ca3af"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={charge.cost.toString()}
                  onChangeText={(value) => updateOtherCharge(index, 'cost', parseFloat(value) || 0)}
                  placeholder="Cost"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
                {otherCharges.length > 1 && (
                  <TouchableOpacity onPress={() => removeOtherCharge(index)} style={styles.removeButton}>
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {/* Total Cost */}
          <View style={styles.section}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Cost:</Text>
              <Text style={styles.totalValue}>${totalCost.toFixed(2)}</Text>
            </View>
          </View>

          {/* Work Images */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Work Images</Text>
              <TouchableOpacity onPress={pickImage} style={styles.addButton}>
                <Ionicons name="camera" size={20} color="#3b82f6" />
                <Text style={styles.addButtonText}>Add Image</Text>
              </TouchableOpacity>
            </View>
            {workImages.length > 0 && (
              <View style={styles.imagesGrid}>
                {workImages.map((image, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri: image.uri }} style={styles.workImage} />
                    <TouchableOpacity 
                      onPress={() => removeImage(index)} 
                      style={styles.removeImageButton}
                    >
                      <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Manager Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manager Information</Text>
            <TextInput
              style={styles.input}
              value={managerName}
              onChangeText={setManagerName}
              placeholder="Manager/Supervisor name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={{ height: 50 }} />
        </ScrollView>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    backgroundColor: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ticketInfo: {
    color: '#d1d5db',
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f3f4f6',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f3f4f6',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  textArea: {
    backgroundColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f3f4f6',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#4b5563',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4b5563',
    backgroundColor: '#374151',
    gap: 8,
  },
  statusButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  statusButtonText: {
    color: '#d1d5db',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#ffffff',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  timeInput: {
    backgroundColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f3f4f6',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#4b5563',
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  removeButton: {
    padding: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#4b5563',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10b981',
  },
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  workImage: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
});
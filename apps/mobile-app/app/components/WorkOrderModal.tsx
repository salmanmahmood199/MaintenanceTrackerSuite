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
  ActivityIndicator,
  ActionSheetIOS,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '../../src/services/api';
import DrawingSignatureModal from './DrawingSignatureModal';

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

// Common parts for dropdown
// Vendor parts will be loaded from API

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  visible,
  onClose,
  ticket,
  user
}) => {
  const [workDescription, setWorkDescription] = useState('');
  const [completionStatus, setCompletionStatus] = useState<'completed' | 'return_needed' | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [parts, setParts] = useState<Part[]>([{ name: '', quantity: 1, cost: 0 }]);
  const [otherCharges, setOtherCharges] = useState<OtherCharge[]>([{ description: '', cost: 0 }]);
  
  // Time picker states
  const [timeInHour, setTimeInHour] = useState(new Date().getHours());
  const [timeInMinute, setTimeInMinute] = useState(new Date().getMinutes());
  const [timeInAmPm, setTimeInAmPm] = useState(new Date().getHours() >= 12 ? 'PM' : 'AM');
  const [timeOutHour, setTimeOutHour] = useState((new Date().getHours() + 8) % 24);
  const [timeOutMinute, setTimeOutMinute] = useState(new Date().getMinutes());
  const [timeOutAmPm, setTimeOutAmPm] = useState(((new Date().getHours() + 8) % 24) >= 12 ? 'PM' : 'AM');
  const [showTimeInPicker, setShowTimeInPicker] = useState(false);
  const [showTimeOutPicker, setShowTimeOutPicker] = useState(false);
  
  const [managerName, setManagerName] = useState('');
  const [workImages, setWorkImages] = useState<any[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [managerSignature, setManagerSignature] = useState<string | null>(null);
  const [showPartPickerIndex, setShowPartPickerIndex] = useState<number | null>(null);

  const queryClient = useQueryClient();

  // Fetch vendor parts
  const { data: vendorParts = [] } = useQuery({
    queryKey: ['vendor-parts', user?.maintenanceVendorId],
    queryFn: async () => {
      if (!user?.maintenanceVendorId) return [];
      const response = await apiRequest('GET', `/api/maintenance-vendors/${user.maintenanceVendorId}/parts`);
      return response.ok ? await response.json() : [];
    },
    enabled: !!user?.maintenanceVendorId
  });

  const PARTS_LIST = [
    'Select Part...',
    ...vendorParts.map((part: any) => part.name),
    'Custom Part...'
  ];

  // Helper functions
  const formatTime = (hour: number, minute: number, ampm: string) => {
    const displayHour = hour === 0 ? 12 : hour;
    return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const convertTo24Hour = (hour: number, minute: number, ampm: string) => {
    let hour24 = hour;
    if (ampm === 'AM' && hour === 12) hour24 = 0;
    if (ampm === 'PM' && hour !== 12) hour24 = hour + 12;
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const calculateHours = () => {
    const timeIn = convertTo24Hour(timeInHour, timeInMinute, timeInAmPm);
    const timeOut = convertTo24Hour(timeOutHour, timeOutMinute, timeOutAmPm);
    
    const inTime = new Date(`1970-01-01T${timeIn}:00`);
    const outTime = new Date(`1970-01-01T${timeOut}:00`);
    const diffMs = outTime.getTime() - inTime.getTime();
    return Math.max(0, diffMs / (1000 * 60 * 60)); // Convert to hours, minimum 0
  };

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
      setReturnReason('');
      setParts([{ name: '', quantity: 1, cost: 0 }]);
      setOtherCharges([{ description: '', cost: 0 }]);
      
      // Initialize time values
      const now = new Date();
      const endTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      
      setTimeInHour(now.getHours() > 12 ? now.getHours() - 12 : now.getHours() || 12);
      setTimeInMinute(now.getMinutes());
      setTimeInAmPm(now.getHours() >= 12 ? 'PM' : 'AM');
      
      setTimeOutHour(endTime.getHours() > 12 ? endTime.getHours() - 12 : endTime.getHours() || 12);
      setTimeOutMinute(endTime.getMinutes());
      setTimeOutAmPm(endTime.getHours() >= 12 ? 'PM' : 'AM');
      
      setManagerName('');
      setWorkImages([]);
      setManagerSignature(null);
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

      // Use JSON instead of FormData since we're not uploading files yet
      const response = await apiRequest('POST', `/api/tickets/${ticket.id}/work-orders`, workOrderData);

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
      completionNotes: completionStatus === 'return_needed' ? returnReason : completionNotes,
      parts: parts.filter(p => p.name.trim() !== ''),
      otherCharges: otherCharges.filter(c => c.description.trim() !== ''),
      timeIn: convertTo24Hour(timeInHour, timeInMinute, timeInAmPm),
      timeOut: convertTo24Hour(timeOutHour, timeOutMinute, timeOutAmPm),
      totalHours: calculateHours(),
      managerName,
      managerSignature,
      totalCost,
      workDate: new Date().toISOString().split('T')[0]
    };

    createWorkOrderMutation.mutate(workOrderData);
  };

  // Remove duplicate calculateHours function - using the one defined earlier

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

  const selectPart = (index: number, partName: string) => {
    if (partName === 'Custom Part...') {
      Alert.prompt(
        'Custom Part',
        'Enter the part name:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Add',
            onPress: (customName) => {
              if (customName?.trim()) {
                updatePart(index, 'name', customName.trim());
              }
            }
          }
        ],
        'plain-text'
      );
    } else if (partName !== 'Select Part...') {
      updatePart(index, 'name', partName);
    }
    setShowPartPickerIndex(null);
  };

  const pickImage = async () => {
    const options = [
      { text: 'Camera', onPress: () => takePhoto() },
      { text: 'Photo Library', onPress: () => selectFromLibrary() },
      { text: 'Record Video', onPress: () => recordVideo() },
      { text: 'Cancel', style: 'cancel' }
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: options.map(o => o.text),
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          if (buttonIndex < options.length - 1) {
            options[buttonIndex].onPress?.();
          }
        }
      );
    } else {
      Alert.alert('Add Media', 'Choose an option:', options);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setWorkImages(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const selectFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]) {
        setWorkImages(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const recordVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to record videos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 300, // 5 minutes max
      });

      if (!result.canceled && result.assets?.[0]) {
        setWorkImages(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video');
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

          {/* Dynamic Notes Section */}
          {completionStatus === 'return_needed' ? (
            <View style={styles.section}>
              <Text style={styles.label}>Reason for Return *</Text>
              <TextInput
                style={styles.textArea}
                value={returnReason}
                onChangeText={setReturnReason}
                placeholder="Please explain why this job needs to be returned..."
                multiline
                numberOfLines={3}
                placeholderTextColor="#9ca3af"
              />
            </View>
          ) : (
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
          )}

          {/* Time Tracking with Scroll Wheels */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Time Tracking</Text>
            <Text style={styles.sectionSubtitle}>Adjust your clock in/out times</Text>
            
            {/* Time In */}
            <View style={styles.timeSection}>
              <Text style={styles.timeLabel}>Time In</Text>
              <TouchableOpacity 
                style={styles.timeDisplayButton}
                onPress={() => setShowTimeInPicker(!showTimeInPicker)}
              >
                <Text style={styles.timeDisplayText}>
                  {formatTime(timeInHour, timeInMinute, timeInAmPm)}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#94a3b8" />
              </TouchableOpacity>
              
              {showTimeInPicker && (
                <TouchableOpacity 
                  style={styles.timePickerOverlay}
                  activeOpacity={1}
                  onPress={() => setShowTimeInPicker(false)}
                >
                  <TouchableOpacity 
                    style={styles.timePickerContainer}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                  >
                    <View style={styles.timePickerRow}>
                    <View style={styles.pickerColumn}>
                      <Text style={styles.pickerLabel}>Hour</Text>
                      <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                        {[...Array(12)].map((_, i) => {
                          const hour = i + 1;
                          return (
                            <TouchableOpacity
                              key={hour}
                              style={[styles.pickerItem, timeInHour === hour && styles.selectedPickerItem]}
                              onPress={() => setTimeInHour(hour)}
                            >
                              <Text style={[styles.pickerText, timeInHour === hour && styles.selectedPickerText]}>
                                {hour.toString().padStart(2, '0')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                    
                    <View style={styles.pickerColumn}>
                      <Text style={styles.pickerLabel}>Minute</Text>
                      <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                        {[...Array(12)].map((_, i) => {
                          const minute = i * 5;
                          return (
                            <TouchableOpacity
                              key={minute}
                              style={[styles.pickerItem, timeInMinute === minute && styles.selectedPickerItem]}
                              onPress={() => setTimeInMinute(minute)}
                            >
                              <Text style={[styles.pickerText, timeInMinute === minute && styles.selectedPickerText]}>
                                {minute.toString().padStart(2, '0')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                    
                    <View style={styles.pickerColumn}>
                      <Text style={styles.pickerLabel}>AM/PM</Text>
                      <View style={styles.picker}>
                        {['AM', 'PM'].map((period) => (
                          <TouchableOpacity
                            key={period}
                            style={[styles.pickerItem, timeInAmPm === period && styles.selectedPickerItem]}
                            onPress={() => setTimeInAmPm(period)}
                          >
                            <Text style={[styles.pickerText, timeInAmPm === period && styles.selectedPickerText]}>
                              {period}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Time Out */}
            <View style={styles.timeSection}>
              <Text style={styles.timeLabel}>Time Out</Text>
              <TouchableOpacity 
                style={styles.timeDisplayButton}
                onPress={() => setShowTimeOutPicker(!showTimeOutPicker)}
              >
                <Text style={styles.timeDisplayText}>
                  {formatTime(timeOutHour, timeOutMinute, timeOutAmPm)}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#94a3b8" />
              </TouchableOpacity>
              
              {showTimeOutPicker && (
                <TouchableOpacity 
                  style={styles.timePickerOverlay}
                  activeOpacity={1}
                  onPress={() => setShowTimeOutPicker(false)}
                >
                  <TouchableOpacity 
                    style={styles.timePickerContainer}
                    activeOpacity={1}
                    onPress={(e) => e.stopPropagation()}
                  >
                    <View style={styles.timePickerRow}>
                    <View style={styles.pickerColumn}>
                      <Text style={styles.pickerLabel}>Hour</Text>
                      <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                        {[...Array(12)].map((_, i) => {
                          const hour = i + 1;
                          return (
                            <TouchableOpacity
                              key={hour}
                              style={[styles.pickerItem, timeOutHour === hour && styles.selectedPickerItem]}
                              onPress={() => setTimeOutHour(hour)}
                            >
                              <Text style={[styles.pickerText, timeOutHour === hour && styles.selectedPickerText]}>
                                {hour.toString().padStart(2, '0')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                    
                    <View style={styles.pickerColumn}>
                      <Text style={styles.pickerLabel}>Minute</Text>
                      <ScrollView style={styles.picker} showsVerticalScrollIndicator={false}>
                        {[...Array(12)].map((_, i) => {
                          const minute = i * 5;
                          return (
                            <TouchableOpacity
                              key={minute}
                              style={[styles.pickerItem, timeOutMinute === minute && styles.selectedPickerItem]}
                              onPress={() => setTimeOutMinute(minute)}
                            >
                              <Text style={[styles.pickerText, timeOutMinute === minute && styles.selectedPickerText]}>
                                {minute.toString().padStart(2, '0')}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                    
                    <View style={styles.pickerColumn}>
                      <Text style={styles.pickerLabel}>AM/PM</Text>
                      <View style={styles.picker}>
                        {['AM', 'PM'].map((period) => (
                          <TouchableOpacity
                            key={period}
                            style={[styles.pickerItem, timeOutAmPm === period && styles.selectedPickerItem]}
                            onPress={() => setTimeOutAmPm(period)}
                          >
                            <Text style={[styles.pickerText, timeOutAmPm === period && styles.selectedPickerText]}>
                              {period}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                </TouchableOpacity>
              )}
            </View>

            {/* Total Hours Display */}
            <View style={styles.timeCalculation}>
              <Text style={styles.calculatedHours}>
                Total Hours: {calculateHours().toFixed(1)} hours
              </Text>
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
                <View style={styles.partNameContainer}>
                  <TouchableOpacity
                    style={styles.partDropdown}
                    onPress={() => setShowPartPickerIndex(index)}
                  >
                    <Text style={[styles.partDropdownText, !part.name && styles.placeholderText]}>
                      {part.name || 'Select Part...'}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                  
                  {showPartPickerIndex === index && (
                    <View style={styles.partPickerModal}>
                      <ScrollView style={styles.partPickerList} showsVerticalScrollIndicator={false}>
                        {PARTS_LIST.map((partName, i) => (
                          <TouchableOpacity
                            key={i}
                            style={[
                              styles.partPickerItem,
                              partName === part.name && styles.selectedPartPickerItem
                            ]}
                            onPress={() => selectPart(index, partName)}
                          >
                            <Text style={[
                              styles.partPickerText,
                              partName === part.name && styles.selectedPartPickerText,
                              partName === 'Select Part...' && styles.placeholderText
                            ]}>
                              {partName}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <TouchableOpacity
                        style={styles.closePartPickerButton}
                        onPress={() => setShowPartPickerIndex(null)}
                      >
                        <Text style={styles.closePartPickerText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  value={part.quantity.toString()}
                  onChangeText={(value) => updatePart(index, 'quantity', parseInt(value) || 1)}
                  placeholder="Qty"
                  keyboardType="numeric"
                  placeholderTextColor="#9ca3af"
                />
                
                <TextInput
                  style={[styles.input, styles.costInput]}
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

          {/* Manager Information & Signature */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manager Information</Text>
            <TextInput
              style={styles.input}
              value={managerName}
              onChangeText={setManagerName}
              placeholder="Manager/Supervisor name"
              placeholderTextColor="#9ca3af"
            />
            
            <TouchableOpacity 
              style={styles.signatureButton}
              onPress={() => setShowSignatureModal(true)}
            >
              <Ionicons name="create-outline" size={20} color="#3b82f6" />
              <Text style={styles.signatureButtonText}>
                {managerSignature ? 'Update Signature' : 'Add Manager Signature'}
              </Text>
            </TouchableOpacity>
            
            {managerSignature && (
              <View style={styles.signaturePreview}>
                <Text style={styles.signaturePreviewLabel}>Signature Added</Text>
                <View style={styles.signatureImage}>
                  <Text style={styles.signatureText}>
                    {managerSignature.includes('data:application/json;base64,') 
                      ? 'Digital Signature Captured' 
                      : atob(managerSignature.replace('data:text/plain;base64,', ''))}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Signature Modal */}
          <DrawingSignatureModal
            visible={showSignatureModal}
            onClose={() => setShowSignatureModal(false)}
            onSave={(signature) => setManagerSignature(signature)}
            title="Manager Signature"
          />

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
  sectionSubtitle: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 12,
    lineHeight: 18,
  },
  helperText: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  timeCalculation: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  calculatedHours: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    textAlign: 'center',
  },
  // Time picker styles
  timeSection: {
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f3f4f6',
    marginBottom: 6,
  },
  timeDisplayButton: {
    backgroundColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  timeDisplayText: {
    color: '#f3f4f6',
    fontSize: 14,
    fontWeight: '500',
  },
  timePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  timePickerContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginTop: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: 16,
  },
  pickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  picker: {
    height: 120,
    width: '100%',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderRadius: 6,
    marginVertical: 2,
  },
  selectedPickerItem: {
    backgroundColor: '#3b82f6',
  },
  pickerText: {
    fontSize: 16,
    color: '#f3f4f6',
    fontWeight: '500',
  },
  selectedPickerText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  // Parts dropdown styles
  partNameContainer: {
    flex: 2,
    position: 'relative',
  },
  partDropdown: {
    backgroundColor: '#374151',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  partDropdownText: {
    color: '#f3f4f6',
    fontSize: 14,
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  partPickerModal: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#374151',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  partPickerList: {
    maxHeight: 200,
  },
  partPickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  selectedPartPickerItem: {
    backgroundColor: '#3b82f6',
  },
  partPickerText: {
    fontSize: 14,
    color: '#f3f4f6',
  },
  selectedPartPickerText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  closePartPickerButton: {
    backgroundColor: '#374151',
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
    borderRadius: 6,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  closePartPickerText: {
    color: '#f3f4f6',
    fontSize: 14,
    fontWeight: '500',
  },
  quantityInput: {
    flex: 0.7,
    textAlign: 'center',
  },
  costInput: {
    flex: 1,
    textAlign: 'right',
  },
  // Signature styles
  signatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  signatureButtonText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '500',
  },
  signaturePreview: {
    marginTop: 12,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  signaturePreviewLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 8,
    textAlign: 'center',
  },
  signatureImage: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  signatureText: {
    fontSize: 14,
    color: '#374151',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
});

export default WorkOrderModal;
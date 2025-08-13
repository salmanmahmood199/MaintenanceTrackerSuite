import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  ActionSheetIOS,
  Modal,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DrawingSignatureModal from './DrawingSignatureModal';

interface WorkOrderModalProps {
  visible: boolean;
  onClose: () => void;
  ticket: any;
  onSubmit: (workOrder: any) => void;
}

export const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  visible,
  onClose,
  ticket,
  onSubmit,
}) => {
  const [status, setStatus] = useState('in_progress');
  const [description, setDescription] = useState('');
  const [workImages, setWorkImages] = useState<any[]>([]);
  const [signature, setSignature] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  
  // Time tracking
  const [timeInHour, setTimeInHour] = useState(9);
  const [timeInMinute, setTimeInMinute] = useState(0);
  const [timeInAmPm, setTimeInAmPm] = useState('AM');
  const [timeOutHour, setTimeOutHour] = useState(5);
  const [timeOutMinute, setTimeOutMinute] = useState(0);
  const [timeOutAmPm, setTimeOutAmPm] = useState('PM');
  const [showTimeInPicker, setShowTimeInPicker] = useState(false);
  const [showTimeOutPicker, setShowTimeOutPicker] = useState(false);

  // Parts and charges
  const [parts, setParts] = useState([{ name: '', quantity: 1, cost: 0 }]);
  const [otherCharges, setOtherCharges] = useState([{ description: '', amount: 0 }]);
  const [showPartPickerIndex, setShowPartPickerIndex] = useState<number | null>(null);
  const [PARTS_LIST, setPARTS_LIST] = useState<string[]>(['Select Part...']);

  // Labor calculation
  const [laborRate, setLaborRate] = useState(75);

  useEffect(() => {
    if (visible) {
      fetchVendorParts();
    }
  }, [visible]);

  const fetchVendorParts = async () => {
    try {
      // Get current user's vendor ID first - use relative URL for mobile
      const userResponse = await fetch('/api/auth/user', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!userResponse.ok) {
        console.error('Failed to get user info:', userResponse.status);
        return;
      }
      
      const user = await userResponse.json();
      console.log('User data:', user);
      
      if (!user.maintenanceVendorId) {
        console.error('User has no vendor ID');
        return;
      }

      // Fetch parts for the vendor - use relative URL for mobile
      const response = await fetch(`/api/maintenance-vendors/${user.maintenanceVendorId}/parts`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const vendorParts = await response.json();
        console.log('Raw vendor parts:', vendorParts);
        if (vendorParts && vendorParts.length > 0) {
          const partNames = vendorParts.map((part: any) => part.name);
          setPARTS_LIST(['Select Part...', ...partNames]);
          console.log('Loaded parts list:', partNames);
        } else {
          console.log('No parts found for vendor');
          // Set default parts if vendor has no parts
          setPARTS_LIST([
            'Select Part...',
            'Air Filter',
            'Oil Filter',
            'Spark Plug',
            'Belt',
            'Gasket',
            'Valve',
            'Bearing',
            'Seal',
            'O-Ring',
            'Pipe Fitting',
            'Electrical Wire',
            'Circuit Breaker',
            'Motor',
            'Pump',
            'Other'
          ]);
        }
      } else {
        console.error('Failed to fetch vendor parts:', response.status, await response.text());
        // Set default parts on error
        setPARTS_LIST([
          'Select Part...',
          'Air Filter',
          'Oil Filter',
          'Spark Plug',
          'Belt',
          'Gasket',
          'Valve',
          'Bearing',
          'Seal',
          'O-Ring',
          'Pipe Fitting',
          'Electrical Wire',
          'Circuit Breaker',
          'Motor',
          'Pump',
          'Other'
        ]);
      }
    } catch (error) {
      console.error('Error fetching vendor parts:', error);
      // Set default parts on error
      setPARTS_LIST([
        'Select Part...',
        'Air Filter',
        'Oil Filter',
        'Spark Plug',
        'Belt',
        'Gasket',
        'Valve',
        'Bearing',
        'Seal',
        'O-Ring',
        'Pipe Fitting',
        'Electrical Wire',
        'Circuit Breaker',
        'Motor',
        'Pump',
        'Other'
      ]);
    }
  };

  const formatTime = (hour: number, minute: number, ampm: string) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const calculateHours = () => {
    const timeIn = timeInHour + (timeInAmPm === 'PM' && timeInHour !== 12 ? 12 : 0) + (timeInMinute / 60);
    const timeOut = timeOutHour + (timeOutAmPm === 'PM' && timeOutHour !== 12 ? 12 : 0) + (timeOutMinute / 60);
    const adjustedTimeIn = timeInAmPm === 'AM' && timeInHour === 12 ? timeInMinute / 60 : timeIn;
    const adjustedTimeOut = timeOutAmPm === 'AM' && timeOutHour === 12 ? timeOutMinute / 60 : timeOut;
    
    let duration = adjustedTimeOut - adjustedTimeIn;
    if (duration < 0) duration += 24;
    return Math.max(0, duration);
  };

  const calculateTotalCost = () => {
    const partsCost = parts.reduce((sum, part) => sum + (part.quantity * part.cost), 0);
    const chargesCost = otherCharges.reduce((sum, charge) => sum + charge.amount, 0);
    // Labor cost hidden from technicians - only parts and other charges
    return partsCost + chargesCost;
  };

  const addPart = () => {
    setParts([...parts, { name: '', quantity: 1, cost: 0 }]);
  };

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index));
  };

  const updatePart = (index: number, field: string, value: any) => {
    const updatedParts = [...parts];
    updatedParts[index] = { ...updatedParts[index], [field]: value };
    setParts(updatedParts);
  };

  const addOtherCharge = () => {
    setOtherCharges([...otherCharges, { description: '', amount: 0 }]);
  };

  const removeOtherCharge = (index: number) => {
    setOtherCharges(otherCharges.filter((_, i) => i !== index));
  };

  const updateOtherCharge = (index: number, field: string, value: any) => {
    const updatedCharges = [...otherCharges];
    updatedCharges[index] = { ...updatedCharges[index], [field]: value };
    setOtherCharges(updatedCharges);
  };

  const selectPart = (index: number, partName: string) => {
    if (partName === 'other') {
      Alert.prompt(
        'Custom Part',
        'Enter part name:',
        [
          { text: 'Cancel', style: 'cancel' as const },
          {
            text: 'OK',
            onPress: async (customPartName) => {
              if (customPartName?.trim()) {
                updatePart(index, 'name', customPartName.trim());
              }
            },
          },
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
      { text: 'Cancel', style: 'cancel' as const }
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
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const recordVideo = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to record video');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 0.5,
        videoMaxDuration: 300,
      });

      if (!result.canceled && result.assets?.[0]) {
        setWorkImages(prev => [...prev, result.assets[0]]);
      }
    } catch (error) {
      console.error('Error recording video:', error);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const handleSignatureCapture = (signatureData: string) => {
    setSignature(signatureData);
    setShowSignatureModal(false);
  };

  const handleSubmit = () => {
    const workOrder = {
      ticketId: ticket.id,
      status,
      workDescription: description, // Use workDescription instead of description
      timeIn: formatTime(timeInHour, timeInMinute, timeInAmPm),
      timeOut: formatTime(timeOutHour, timeOutMinute, timeOutAmPm),
      totalHours: calculateHours(),
      laborRate,
      totalCost: calculateTotalCost(),
      parts: parts.filter(part => part.name && part.name !== 'Select Part...'),
      otherCharges: otherCharges.filter(charge => charge.description),
      workImages,
      signature,
    };

    onSubmit(workOrder);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#f3f4f6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Work Order</Text>
        <TouchableOpacity onPress={handleSubmit} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ticket Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ticket Information</Text>
          <Text style={styles.ticketInfo}>#{ticket?.ticketNumber}</Text>
          <Text style={styles.ticketInfo}>{ticket?.title}</Text>
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Status</Text>
          <View style={styles.statusButtons}>
            <TouchableOpacity
              style={[styles.statusButton, status === 'in_progress' && styles.activeStatusButton]}
              onPress={() => setStatus('in_progress')}
            >
              <Ionicons name="time" size={16} color={status === 'in_progress' ? '#ffffff' : '#9ca3af'} />
              <Text style={[styles.statusButtonText, status === 'in_progress' && styles.activeStatusButtonText]}>
                In Progress
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.statusButton, status === 'completed' && styles.activeStatusButton]}
              onPress={() => setStatus('completed')}
            >
              <Ionicons name="checkmark-circle" size={16} color={status === 'completed' ? '#ffffff' : '#9ca3af'} />
              <Text style={[styles.statusButtonText, status === 'completed' && styles.activeStatusButtonText]}>
                Completed
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Work Description</Text>
          <TextInput
            style={styles.textArea}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the work performed..."
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>

        {/* Time Tracking */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time Tracking</Text>
          


          {/* Time In */}
          <View style={styles.timeSection}>
            <Text style={styles.timeLabel}>Time In</Text>
            <View style={styles.timePickerWrapper}>
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
                <View style={styles.timePickerDropdown}>
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
          </View>

          {/* Time Out */}
          <View style={styles.timeSection}>
            <Text style={styles.timeLabel}>Time Out</Text>
            <View style={styles.timePickerWrapper}>
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
                <View style={styles.timePickerDropdown}>
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
                </View>
              )}
            </View>
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
                value={part.cost === 0 ? '' : part.cost.toString()}
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
                value={charge.amount === 0 ? '' : charge.amount.toString()}
                onChangeText={(value) => updateOtherCharge(index, 'amount', parseFloat(value) || 0)}
                placeholder="Amount"
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
          <View style={styles.totalCostContainer}>
            <Text style={styles.totalCostLabel}>Total Work Order Cost</Text>
            <Text style={styles.totalCostAmount}>${calculateTotalCost().toFixed(2)}</Text>
          </View>
        </View>

        {/* Work Images */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Work Photos/Videos</Text>
            <TouchableOpacity onPress={pickImage} style={styles.addButton}>
              <Ionicons name="camera" size={20} color="#3b82f6" />
              <Text style={styles.addButtonText}>Add Media</Text>
            </TouchableOpacity>
          </View>
          {workImages.length > 0 && (
            <Text style={styles.mediaCount}>{workImages.length} files attached</Text>
          )}
        </View>

        {/* Signature */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Signature</Text>
          <TouchableOpacity 
            style={styles.signatureButton}
            onPress={() => setShowSignatureModal(true)}
          >
            <Ionicons name="create" size={20} color="#3b82f6" />
            <Text style={styles.signatureButtonText}>
              {signature ? 'Update Signature' : 'Capture Signature'}
            </Text>
          </TouchableOpacity>
          {signature && (
            <Text style={styles.signatureStatus}>✓ Signature captured</Text>
          )}
        </View>
      </ScrollView>

      <DrawingSignatureModal
        visible={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        onSave={handleSignatureCapture}
      />
      </SafeAreaView>
    </Modal>
  );
};

const { height: screenHeight } = Dimensions.get('window');

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
  activeStatusButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  statusButtonText: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
  },
  activeStatusButtonText: {
    color: '#ffffff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  quantityInput: {
    flex: 0.5,
    minWidth: 60,
  },
  costInput: {
    flex: 0.8,
    minWidth: 80,
  },
  totalCostContainer: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalCostLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f3f4f6',
  },
  totalCostAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  mediaCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  signatureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4b5563',
    gap: 8,
  },
  signatureButtonText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
  },
  signatureStatus: {
    fontSize: 12,
    color: '#10b981',
    marginTop: 8,
    textAlign: 'center',
  },
  timeSection: {
    marginBottom: 16,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f3f4f6',
    marginBottom: 6,
  },
  timePickerWrapper: {
    position: 'relative',
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
  timePickerDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginTop: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
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
  calculatedCost: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 4,
  },
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
    color: '#f3f4f6',
    fontSize: 14,
  },
  selectedPartPickerText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  closePartPickerButton: {
    padding: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  closePartPickerText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  laborRateDisplay: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  laborRateText: {
    color: '#f3f4f6',
    fontSize: 16,
    fontWeight: '600',
  },
  laborRateNote: {
    color: '#9ca3af',
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default WorkOrderModal;
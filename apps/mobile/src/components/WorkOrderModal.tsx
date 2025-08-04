import React, { useState } from 'react';
import { 
  View, 
  ScrollView, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  Image,
  Text
} from 'react-native';
import {
  Modal,
  Portal,
  Card,
  Title,
  TextInput,
  Button,
  Paragraph,
  Chip,
  IconButton,
  Divider
} from 'react-native-paper';
// Note: Using built-in components for now. In production, add:
// import { Picker } from '@react-native-picker/picker';
// import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import WebImagePicker from './WebImagePicker';

// Import shared types from the correct path
interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in-progress' | 'completed';
  createdAt: string;
  ticketNumber?: string;
}

interface Part {
  name: string;
  quantity: number;
  cost: number;
}

interface WorkOrderData {
  workDescription: string;
  completionStatus: 'completed' | 'return_needed' | undefined;
  completionNotes: string;
  parts: Part[];
  timeIn: string;
  timeOut: string;
  managerName: string;
}

interface WorkOrderModalProps {
  visible: boolean;
  onDismiss: () => void;
  ticket: Ticket | null;
  onSubmit: (ticketId: string, workOrder: WorkOrderData, images: string[]) => void;
  isLoading?: boolean;
}

const WorkOrderModal: React.FC<WorkOrderModalProps> = ({
  visible,
  onDismiss,
  ticket,
  onSubmit,
  isLoading = false
}) => {
  const { user } = useAuth();
  
  // Form state
  const [workDescription, setWorkDescription] = useState('');
  const [completionStatus, setCompletionStatus] = useState<'completed' | 'return_needed' | undefined>(undefined);
  const [completionNotes, setCompletionNotes] = useState('');
  const [parts, setParts] = useState<Part[]>([{ name: '', quantity: 1, cost: 0 }]);
  const [timeIn, setTimeIn] = useState('');
  const [timeOut, setTimeOut] = useState('');
  const [managerName, setManagerName] = useState('');
  const [workImages, setWorkImages] = useState<string[]>([]);

  // Error states
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Computed values
  const calculatedHours = calculateHours(timeIn, timeOut);
  const totalPartsCost = parts.reduce((total, part) => total + (part.quantity * part.cost), 0);

  if (!ticket) return null;

  const validateTimeOrder = (timeInValue: string, timeOutValue: string): boolean => {
    if (!timeInValue || !timeOutValue) return true;
    
    try {
      const [inHour, inMin] = timeInValue.split(':').map(Number);
      const [outHour, outMin] = timeOutValue.split(':').map(Number);
      
      if (isNaN(inHour) || isNaN(inMin) || isNaN(outHour) || isNaN(outMin)) return false;
      if (inHour < 0 || inHour > 23 || inMin < 0 || inMin > 59) return false;
      if (outHour < 0 || outHour > 23 || outMin < 0 || outMin > 59) return false;
      
      const inMinutes = inHour * 60 + inMin;
      const outMinutes = outHour * 60 + outMin;
      
      return outMinutes > inMinutes;
    } catch (error) {
      return false;
    }
  };

  const calculateHours = (timeInValue: string, timeOutValue: string): number => {
    if (!timeInValue || !timeOutValue) return 0;
    
    try {
      const [inHour, inMin] = timeInValue.split(':').map(Number);
      const [outHour, outMin] = timeOutValue.split(':').map(Number);
      
      if (isNaN(inHour) || isNaN(inMin) || isNaN(outHour) || isNaN(outMin)) return 0;
      
      const inMinutes = inHour * 60 + inMin;
      const outMinutes = outHour * 60 + outMin;
      
      if (outMinutes <= inMinutes) return 0;
      
      const totalMinutes = outMinutes - inMinutes;
      return Math.round((totalMinutes / 60) * 100) / 100;
    } catch (error) {
      return 0;
    }
  };

  const validateTimeOut = (value: string) => {
    const newErrors = { ...errors };
    
    if (timeIn && value && !validateTimeOrder(timeIn, value)) {
      newErrors.timeOut = 'Time Out must be after Time In (same day)';
    } else {
      delete newErrors.timeOut;
    }
    
    setErrors(newErrors);
    setTimeOut(value);
  };

  const validateTimeIn = (value: string) => {
    const newErrors = { ...errors };
    
    if (timeOut && value && !validateTimeOrder(value, timeOut)) {
      newErrors.timeOut = 'Time Out must be after Time In (same day)';
    } else {
      delete newErrors.timeOut;
    }
    
    setErrors(newErrors);
    setTimeIn(value);
  };

  const addPart = () => {
    setParts(prev => [...prev, { name: '', quantity: 1, cost: 0 }]);
  };

  const removePart = (index: number) => {
    if (parts.length > 1) {
      setParts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updatePart = (index: number, field: keyof Part, value: string | number) => {
    console.log(`Updating part ${index}, field: ${field}, value: ${value}`);
    setParts(prev => {
      const newParts = prev.map((part, i) => {
        if (i === index) {
          const updatedPart = { ...part, [field]: value };
          // Ensure quantity is always at least 1
          if (field === 'quantity' && typeof value === 'number') {
            updatedPart.quantity = Math.max(1, value);
          }
          console.log(`Updated part:`, updatedPart);
          return updatedPart;
        }
        return part;
      });
      console.log(`New parts array:`, newParts);
      return newParts;
    });
  };

  const handleImageSelected = (imageUri: string) => {
    console.log('Image selected:', imageUri);
    setWorkImages(prev => [...prev, imageUri]);
  };

  const handleImageError = (error: string) => {
    console.log('Image picker error:', error);
    Alert.alert('Error', error);
  };

  const takePhoto = async () => {
    try {
      // For mobile web, create a file input with camera capture
      if (typeof window !== 'undefined' && document) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        (input as any).capture = 'environment'; // Use rear camera
        
        input.onchange = (event: any) => {
          const file = event.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                handleImageSelected(e.target.result as string);
              }
            };
            reader.readAsDataURL(file);
          }
        };
        
        input.click();
      } else {
        // Fallback for native - show demo image
        const demoImageUri = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSI1MCIgeT0iNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjY2NjYiIGZvbnQtc2l6ZT0iMTAiPkNhbWVyYSBQaG90bzwvdGV4dD48L3N2Zz4=';
        setWorkImages(prev => [...prev, demoImageUri]);
        Alert.alert('Photo Added', 'Demo photo added! Camera functionality requires expo-image-picker for native apps.');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to access camera');
    }
  };

  const removeImage = (index: number) => {
    setWorkImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const newErrors: { [key: string]: string } = {};

    // Validation
    if (!workDescription.trim()) {
      newErrors.workDescription = 'Work description is required';
    }

    if (!completionStatus) {
      newErrors.completionStatus = 'Completion status is required';
    }

    if (!timeIn) {
      newErrors.timeIn = 'Time In is required';
    }

    if (!timeOut) {
      newErrors.timeOut = 'Time Out is required';
    } else if (timeIn && !validateTimeOrder(timeIn, timeOut)) {
      newErrors.timeOut = 'Time Out must be after Time In (same day)';
    }

    if (!managerName.trim()) {
      newErrors.managerName = 'Manager name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    const workOrderData: WorkOrderData = {
      workDescription,
      completionStatus,
      completionNotes,
      parts: parts.filter(p => p.name.trim() !== ''),
      timeIn,
      timeOut,
      managerName,
    };

    onSubmit(ticket.id, workOrderData, workImages);
  };

  const resetForm = () => {
    setWorkDescription('');
    setCompletionStatus(undefined);
    setCompletionNotes('');
    setParts([{ name: '', quantity: 1, cost: 0 }]);
    setTimeIn('');
    setTimeOut('');
    setManagerName('');
    setWorkImages([]);
    setErrors({});
  };

  const handleDismiss = () => {
    resetForm();
    onDismiss();
  };

  // Computed values are already defined above

  return (
    <Portal>
      <Modal visible={visible} onDismiss={handleDismiss} contentContainerStyle={styles.modal}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.header}>
              <Title>Work Order - {ticket.title}</Title>
              <IconButton icon="close" onPress={handleDismiss} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Work Description */}
              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Work Performed *</Title>
                <TextInput
                  label="Describe the work performed"
                  value={workDescription}
                  onChangeText={setWorkDescription}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={styles.input}
                  error={!!errors.workDescription}
                />
                {errors.workDescription && (
                  <Text style={styles.errorText}>{errors.workDescription}</Text>
                )}
              </View>

              {/* Parts Used */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Title style={styles.sectionTitle}>Parts Used</Title>
                  <Button mode="outlined" onPress={addPart} compact>
                    Add Part
                  </Button>
                </View>
                
                {parts.map((part, index) => (
                  <View key={index} style={styles.partContainer}>
                    <TextInput
                      label="Part Name"
                      value={part.name}
                      onChangeText={(value: string) => updatePart(index, 'name', value)}
                      mode="outlined"
                      style={[styles.input, styles.partInput]}
                    />
                    
                    <View style={styles.quantityContainer}>
                      <Text style={styles.quantityLabel}>Quantity</Text>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => {
                            const newQuantity = Math.max(1, part.quantity - 1);
                            console.log(`Decreasing quantity for part ${index} from ${part.quantity} to ${newQuantity}`);
                            updatePart(index, 'quantity', newQuantity);
                          }}
                        >
                          <Text style={styles.quantityButtonText}>-</Text>
                        </TouchableOpacity>
                        
                        <TextInput
                          value={part.quantity.toString()}
                          onChangeText={(value: string) => {
                            const numValue = parseInt(value) || 1;
                            console.log(`Updating quantity from ${part.quantity} to ${numValue}`);
                            updatePart(index, 'quantity', Math.max(1, numValue));
                          }}
                          mode="outlined"
                          style={styles.quantityInput}
                          keyboardType="numeric"
                          selectTextOnFocus={true}
                          onFocus={() => {
                            console.log('Quantity input focused');
                          }}
                        />
                        
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => {
                            const newQuantity = part.quantity + 1;
                            console.log(`Increasing quantity for part ${index} from ${part.quantity} to ${newQuantity}`);
                            updatePart(index, 'quantity', newQuantity);
                          }}
                        >
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <TextInput
                      label="Cost ($)"
                      value={part.cost.toString()}
                      onChangeText={(value: string) => updatePart(index, 'cost', parseFloat(value) || 0)}
                      mode="outlined"
                      style={[styles.input, styles.costInput]}
                      keyboardType="numeric"
                    />
                    
                    <View style={styles.partFooter}>
                      <Text style={styles.subtotal}>
                        Subtotal: ${(part.quantity * part.cost).toFixed(2)}
                      </Text>
                      <IconButton
                        icon="delete"
                        onPress={() => removePart(index)}
                        disabled={parts.length === 1}
                      />
                    </View>
                  </View>
                ))}
                
                {totalPartsCost > 0 && (
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>
                      Parts Total: ${totalPartsCost.toFixed(2)}
                    </Text>
                  </View>
                )}
              </View>

              {/* Time Tracking */}
              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Time Tracking *</Title>
                
                <View style={styles.timeContainer}>
                  <View style={styles.timeInput}>
                    <TextInput
                      label="Time In *"
                      value={timeIn}
                      onChangeText={validateTimeIn}
                      mode="outlined"
                      placeholder="HH:MM"
                      style={styles.input}
                      error={!!errors.timeIn}
                    />
                    {errors.timeIn && (
                      <Text style={styles.errorText}>{errors.timeIn}</Text>
                    )}
                  </View>
                  
                  <View style={styles.timeInput}>
                    <TextInput
                      label="Time Out *"
                      value={timeOut}
                      onChangeText={validateTimeOut}
                      mode="outlined"
                      placeholder="HH:MM"
                      style={styles.input}
                      error={!!errors.timeOut}
                    />
                    {errors.timeOut && (
                      <Text style={styles.errorText}>{errors.timeOut}</Text>
                    )}
                  </View>
                </View>
                
                {calculatedHours > 0 && (
                  <View style={styles.hoursContainer}>
                    <Chip mode="flat" style={styles.hoursChip}>
                      Total Hours: {calculatedHours}
                    </Chip>
                  </View>
                )}
              </View>

              {/* Completion Status */}
              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Completion Status *</Title>
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      completionStatus === 'completed' && styles.statusButtonActive
                    ]}
                    onPress={() => setCompletionStatus('completed')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      completionStatus === 'completed' && styles.statusButtonTextActive
                    ]}>
                      Work Completed
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      completionStatus === 'return_needed' && styles.statusButtonActive
                    ]}
                    onPress={() => setCompletionStatus('return_needed')}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      completionStatus === 'return_needed' && styles.statusButtonTextActive
                    ]}>
                      Need to Return
                    </Text>
                  </TouchableOpacity>
                </View>
                {errors.completionStatus && (
                  <Text style={styles.errorText}>{errors.completionStatus}</Text>
                )}
              </View>

              {/* Completion Notes */}
              <View style={styles.section}>
                <Title style={styles.sectionTitle}>
                  {completionStatus === 'return_needed' ? 'Return Details' : 'Completion Notes'}
                </Title>
                <TextInput
                  label={
                    completionStatus === 'return_needed' 
                      ? 'Explain why return is needed'
                      : 'Final notes or follow-up needed'
                  }
                  value={completionNotes}
                  onChangeText={setCompletionNotes}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                />
              </View>

              {/* Work Photos */}
              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Work Photos</Title>
                <View style={styles.photoButtons}>
                  <Button mode="outlined" onPress={takePhoto} icon="camera" style={styles.photoButton}>
                    Take Photo
                  </Button>
                  <WebImagePicker 
                    onImageSelected={handleImageSelected}
                    onError={handleImageError}
                  />
                </View>
                
                {workImages.length > 0 && (
                  <View style={styles.imageGrid}>
                    {workImages.map((imageUri, index) => (
                      <View key={index} style={styles.imageContainer}>
                        <Image source={{ uri: imageUri }} style={styles.workImage} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Text style={styles.removeImageText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Manager Verification */}
              <View style={styles.section}>
                <Title style={styles.sectionTitle}>Manager Verification *</Title>
                <TextInput
                  label="Manager Name *"
                  value={managerName}
                  onChangeText={setManagerName}
                  mode="outlined"
                  style={styles.input}
                  error={!!errors.managerName}
                />
                {errors.managerName && (
                  <Text style={styles.errorText}>{errors.managerName}</Text>
                )}
              </View>

              <Divider style={styles.divider} />

              {/* Action Buttons */}
              <View style={styles.actions}>
                <Button
                  mode="outlined"
                  onPress={handleDismiss}
                  disabled={isLoading}
                  style={styles.actionButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={styles.actionButton}
                  loading={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Complete Work Order'}
                </Button>
              </View>
            </ScrollView>
          </Card.Content>
        </Card>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    maxHeight: '90%',
  },
  card: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    marginBottom: 8,
  },
  partContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  partInput: {
    marginBottom: 12,
  },
  quantityContainer: {
    marginBottom: 12,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    backgroundColor: '#e0e0e0',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantityInput: {
    width: 80,
    marginHorizontal: 16,
    textAlign: 'center',
    fontSize: 16,
    backgroundColor: '#fff',
    height: 45,
  },
  costInput: {
    marginBottom: 12,
  },
  partFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subtotal: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalContainer: {
    backgroundColor: '#e3f2fd',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeInput: {
    flex: 0.48,
  },
  hoursContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  hoursChip: {
    backgroundColor: '#c8e6c9',
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  statusButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  photoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  photoButton: {
    flex: 0.45,
  },
  imageGrid: {
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
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  actionButton: {
    flex: 0.48,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 4,
  },
});

export default WorkOrderModal;
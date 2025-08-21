import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../src/contexts/AuthContext';
import { apiRequest, ticketsApi } from '../src/services/api';

interface Location {
  id: number;
  name: string;
  address?: string;
}

export default function CreateTicketScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Security check: Prevent vendor admins from creating tickets
  if (user?.role === 'maintenance_admin') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorText}>
            Vendor admins cannot create tickets. You can only work on tickets assigned to your vendor.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [locationId, setLocationId] = useState<number | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's assigned locations
  const { data: userLocations = [] } = useQuery<Location[]>({
    queryKey: ['/api/users', user?.id, 'locations'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${user?.id}/locations`);
      return await response.json() as Location[];
    },
    enabled: !!user?.id,
  });

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled) {
        const newImages = result.assets.map((asset, index) => ({
          id: Date.now() + index,
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || `image_${Date.now()}.jpg`,
        }));
        setImages(prev => [...prev, ...newImages]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleCameraPicker = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Sorry, we need camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImage = {
          id: Date.now(),
          uri: result.assets[0].uri,
          type: result.assets[0].type,
          name: result.assets[0].fileName || `photo_${Date.now()}.jpg`,
        };
        setImages(prev => [...prev, newImage]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removeImage = (imageId: number) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the ticket.');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description for the ticket.');
      return;
    }

    if (userLocations.length > 0 && !locationId) {
      Alert.alert('Error', 'Please select a location for this ticket.');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image or video.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('priority', priority);
      if (locationId) {
        formData.append('locationId', locationId.toString());
      }

      // Add images to form data
      images.forEach((image, index) => {
        const fileExtension = image.uri.split('.').pop() || 'jpg';
        const fileName = `image_${Date.now()}_${index}.${fileExtension}`;
        
        formData.append('images', {
          uri: image.uri,
          type: image.type === 'video' ? 'video/mp4' : 'image/jpeg',
          name: fileName,
        } as any);
      });

      const response = await ticketsApi.create(formData);

      if (response.ok) {
        const responseData = await response.json();
        Alert.alert('Success', 'Ticket created successfully!', [
          {
            text: 'OK',
            onPress: () => {
              queryClient.invalidateQueries({ queryKey: ['tickets'] });
              router.back();
            }
          }
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      Alert.alert('Error', 'Failed to create ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const PriorityButton = ({ level, active, onPress }: any) => (
    <TouchableOpacity
      style={[styles.priorityButton, active && styles.activePriorityButton]}
      onPress={onPress}
    >
      <Text style={[styles.priorityButtonText, active && styles.activePriorityButtonText]}>
        {level}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#1e293b', '#7c3aed', '#1e293b']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.headerTitleText}>Create Ticket</Text>
            <Text style={styles.headerSubtitle}>New maintenance request</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Brief description of the issue"
              placeholderTextColor="#94a3b8"
              value={title}
              onChangeText={setTitle}
              multiline={false}
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Detailed description of the maintenance issue..."
              placeholderTextColor="#94a3b8"
              value={description}
              onChangeText={setDescription}
              multiline={true}
              numberOfLines={4}
            />
          </View>

          {/* Priority Selection */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Priority Level</Text>
            <View style={styles.priorityContainer}>
              <PriorityButton
                level="Low"
                active={priority === 'low'}
                onPress={() => setPriority('low')}
              />
              <PriorityButton
                level="Medium"
                active={priority === 'medium'}
                onPress={() => setPriority('medium')}
              />
              <PriorityButton
                level="High"
                active={priority === 'high'}
                onPress={() => setPriority('high')}
              />
            </View>
          </View>

          {/* Location Selection */}
          {userLocations.length > 0 && (
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Location *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.locationContainer}>
                {userLocations.map((location) => (
                  <TouchableOpacity
                    key={location.id}
                    style={[styles.locationButton, locationId === location.id && styles.activeLocationButton]}
                    onPress={() => setLocationId(location.id)}
                  >
                    <Text style={[
                      styles.locationButtonText, 
                      locationId === location.id && styles.activeLocationButtonText
                    ]}>
                      {location.name}
                      {location.address && ` - ${location.address}`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Image Upload */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Upload Images & Videos *</Text>
            
            {/* Upload Buttons */}
            <View style={styles.uploadButtonsContainer}>
              <TouchableOpacity style={styles.uploadButton} onPress={handleCameraPicker}>
                <Ionicons name="camera" size={24} color="#06b6d4" />
                <Text style={styles.uploadButtonText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.uploadButton} onPress={handleImagePicker}>
                <Ionicons name="image" size={24} color="#06b6d4" />
                <Text style={styles.uploadButtonText}>Gallery</Text>
              </TouchableOpacity>
            </View>

            {/* Image Preview */}
            {images.length > 0 && (
              <View style={styles.imagePreviewContainer}>
                <Text style={styles.previewTitle}>{images.length} file(s) selected</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.imagePreviewList}>
                    {images.map((image) => (
                      <View key={image.id} style={styles.imagePreview}>
                        <Image source={{ uri: image.uri }} style={styles.previewImage} />
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={() => removeImage(image.id)}
                        >
                          <Ionicons name="close" size={16} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={styles.imageType}>
                          {image.type === 'video' ? 'Video' : 'Image'}
                        </Text>
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => router.back()}
            disabled={isSubmitting}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting || images.length === 0}
          >
            <LinearGradient colors={['#06b6d4', '#3b82f6']} style={styles.submitButtonGradient}>
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#ffffff" />
                  <Text style={styles.submitButtonText}>Create Ticket</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activePriorityButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  priorityButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  activePriorityButtonText: {
    color: '#ffffff',
  },
  locationContainer: {
    flexDirection: 'row',
  },
  locationButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeLocationButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  locationButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  activeLocationButtonText: {
    color: '#ffffff',
  },
  uploadButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  uploadButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(6, 182, 212, 0.5)',
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#06b6d4',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  imagePreviewContainer: {
    marginTop: 16,
  },
  previewTitle: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 12,
    fontWeight: '500',
  },
  imagePreviewList: {
    flexDirection: 'row',
    gap: 12,
  },
  imagePreview: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageType: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
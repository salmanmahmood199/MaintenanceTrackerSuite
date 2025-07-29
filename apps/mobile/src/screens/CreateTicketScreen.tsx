import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Card, Title, Paragraph, Menu, Divider } from 'react-native-paper';
import { Picker } from 'react-native';
import WebImagePicker from '../components/WebImagePicker';
import { useAuth } from '../contexts/AuthContext';

const CreateTicketScreen = ({ navigation }: any) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Address fields for residential users
  const [useHomeAddress, setUseHomeAddress] = useState(true);
  const [serviceAddress, setServiceAddress] = useState('');
  const [serviceCity, setServiceCity] = useState('');
  const [serviceState, setServiceState] = useState('');
  const [serviceZipCode, setServiceZipCode] = useState('');
  const [serviceApartment, setServiceApartment] = useState('');
  
  const { user } = useAuth();

  const handleImageSelected = (imageUri: string) => {
    setImages([...images, imageUri]);
  };

  const handleSubmit = async () => {
    if (!title || !description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Error', 'Please upload at least one image or video');
      return;
    }

    // For residential users, validate service address if not using home address
    if (user?.role === 'residential' && !useHomeAddress) {
      if (!serviceAddress || !serviceCity || !serviceState || !serviceZipCode) {
        Alert.alert('Error', 'Please fill in all service address fields');
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('priority', priority);

      // Add address fields for residential users
      if (user?.role === 'residential') {
        if (useHomeAddress) {
          formData.append('useHomeAddress', 'true');
        } else {
          formData.append('serviceAddress', serviceAddress);
          formData.append('serviceCity', serviceCity);
          formData.append('serviceState', serviceState);
          formData.append('serviceZipCode', serviceZipCode);
          if (serviceApartment) {
            formData.append('serviceApartment', serviceApartment);
          }
        }
      }

      // Add images
      images.forEach((imageUri, index) => {
        const uriParts = imageUri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        
        formData.append('files', {
          uri: imageUri,
          name: `image_${index}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      });

      const response = await fetch('http://0.0.0.0:5000/api/tickets', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        credentials: 'include',
      });

      if (response.ok) {
        Alert.alert('Success', 'Ticket created successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Create ticket error:', error);
      Alert.alert('Error', 'Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Create New Ticket</Title>
          
          <TextInput
            label="Title *"
            value={title}
            onChangeText={setTitle}
            mode="outlined"
            style={styles.input}
          />
          
          <TextInput
            label="Description *"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={4}
          />
          
          <View style={styles.pickerContainer}>
            <Paragraph>Priority</Paragraph>
            <Picker
              selectedValue={priority}
              onValueChange={setPriority}
              style={styles.picker}
            >
              <Picker.Item label="Low" value="low" />
              <Picker.Item label="Medium" value="medium" />
              <Picker.Item label="High" value="high" />
            </Picker>
          </View>
          
          {user?.role === 'residential' && (
            <View style={styles.addressSection}>
              <Title style={styles.sectionTitle}>Service Location</Title>
              
              <View style={styles.addressToggle}>
                <Button
                  mode={useHomeAddress ? 'contained' : 'outlined'}
                  onPress={() => setUseHomeAddress(true)}
                  style={styles.toggleButton}
                >
                  Use Home Address
                </Button>
                <Button
                  mode={!useHomeAddress ? 'contained' : 'outlined'}
                  onPress={() => setUseHomeAddress(false)}
                  style={styles.toggleButton}
                >
                  Different Address
                </Button>
              </View>

              {!useHomeAddress && (
                <View style={styles.customAddress}>
                  <TextInput
                    label="Street Address"
                    value={serviceAddress}
                    onChangeText={setServiceAddress}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label="Apartment/Unit (Optional)"
                    value={serviceApartment}
                    onChangeText={setServiceApartment}
                    mode="outlined"
                    style={styles.input}
                  />
                  <TextInput
                    label="City"
                    value={serviceCity}
                    onChangeText={setServiceCity}
                    mode="outlined"
                    style={styles.input}
                  />
                  <View style={styles.row}>
                    <TextInput
                      label="State"
                      value={serviceState}
                      onChangeText={setServiceState}
                      mode="outlined"
                      style={[styles.input, styles.halfWidth]}
                    />
                    <TextInput
                      label="ZIP Code"
                      value={serviceZipCode}
                      onChangeText={setServiceZipCode}
                      mode="outlined"
                      style={[styles.input, styles.halfWidth]}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          <View style={styles.imageSection}>
            <Title style={styles.sectionTitle}>Images/Videos *</Title>
            <View style={styles.imageButtons}>
              <Button
                mode="outlined"
                onPress={takePhoto}
                style={styles.imageButton}
                icon="camera"
              >
                Take Photo
              </Button>
              <Button
                mode="outlined"
                onPress={pickImage}
                style={styles.imageButton}
                icon="image"
              >
                Pick Image
              </Button>
            </View>
            <Paragraph style={styles.imageCount}>
              {images.length} image{images.length !== 1 ? 's' : ''} selected
            </Paragraph>
          </View>
          
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          >
            Create Ticket
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
  },
  input: {
    marginBottom: 16,
  },
  pickerContainer: {
    marginBottom: 16,
  },
  picker: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  imageSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  imageButton: {
    flex: 1,
  },
  imageCount: {
    fontSize: 12,
    opacity: 0.7,
  },
  submitButton: {
    marginTop: 16,
  },
  addressSection: {
    marginBottom: 16,
  },
  addressToggle: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
  },
  customAddress: {
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfWidth: {
    flex: 1,
  },
});

export default CreateTicketScreen;
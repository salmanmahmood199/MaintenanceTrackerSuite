import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  title?: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  visible,
  onClose,
  onSave,
  title = "Manager Signature"
}) => {
  const [signatureName, setSignatureName] = useState('');
  const [hasSignature, setHasSignature] = useState(false);

  const handleClearSignature = () => {
    setSignatureName('');
    setHasSignature(false);
  };

  const handleSaveSignature = () => {
    if (!signatureName.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    // Create a text signature as base64 data URL
    const textSignature = `data:text/plain;base64,${btoa(`Signed by: ${signatureName.trim()}\nDate: ${new Date().toLocaleDateString()}`)}`;
    onSave(textSignature);
    handleClearSignature();
    onClose();
  };

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      handleClearSignature();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={handleSaveSignature} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Please sign below to confirm the work order completion
          </Text>
        </View>

        <View style={styles.signatureContainer}>
          <Text style={styles.signaturePrompt}>Enter your name to create a digital signature:</Text>
          <TextInput
            style={styles.signatureInput}
            value={signatureName}
            onChangeText={(text) => {
              setSignatureName(text);
              setHasSignature(text.trim().length > 0);
            }}
            placeholder="Enter your full name"
            placeholderTextColor="#94a3b8"
            autoFocus={true}
          />
          
          <View style={styles.signaturePreviewContainer}>
            <View style={styles.signatureLine}>
              <View style={styles.line} />
              <Text style={styles.signatureLabel}>Digital Signature</Text>
            </View>
            {signatureName.trim() && (
              <View style={styles.previewSignature}>
                <Text style={styles.previewText}>Signed by: {signatureName}</Text>
                <Text style={styles.previewDate}>{new Date().toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingTop: 50, // Account for status bar
  },
  cancelButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  instructions: {
    padding: 16,
    backgroundColor: '#e0f2fe',
    borderBottomWidth: 1,
    borderBottomColor: '#bae6fd',
  },
  instructionText: {
    fontSize: 14,
    color: '#0369a1',
    textAlign: 'center',
    lineHeight: 20,
  },
  signatureContainer: {
    flex: 1,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    padding: 24,
  },
  signaturePrompt: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  signatureInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#374151',
    marginBottom: 24,
  },
  signaturePreviewContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  previewSignature: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0369a1',
    fontStyle: 'italic',
  },
  previewDate: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  signatureLine: {
    alignItems: 'center',
    gap: 8,
  },
  line: {
    height: 1,
    backgroundColor: '#94a3b8',
    width: '80%',
  },
  signatureLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
});

export default SignatureModal;
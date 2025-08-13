import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  PanResponder,
  Dimensions,
  StatusBar,
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
  const [signatureMode, setSignatureMode] = useState<'text' | 'draw'>('draw');
  const [drawingPaths, setDrawingPaths] = useState<Array<{x: number, y: number}[]>>([]);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Get screen dimensions for landscape mode
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const isLandscape = screenWidth > screenHeight;
  const canvasWidth = isLandscape ? screenWidth : screenHeight;
  const canvasHeight = isLandscape ? screenHeight : screenWidth;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => signatureMode === 'draw',
    onMoveShouldSetPanResponder: () => signatureMode === 'draw',
    
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const newPath = [{x: locationX, y: locationY}];
      setCurrentPath(newPath);
      setIsDrawing(true);
      setHasSignature(true);
    },
    
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      setCurrentPath(prev => [...prev, {x: locationX, y: locationY}]);
    },
    
    onPanResponderRelease: () => {
      setDrawingPaths(prev => [...prev, currentPath]);
      setCurrentPath([]);
      setIsDrawing(false);
    },
  });

  const handleClearSignature = () => {
    setDrawingPaths([]);
    setCurrentPath([]);
    setSignatureName('');
    setHasSignature(false);
  };

  const handleSaveSignature = () => {
    if (signatureMode === 'text') {
      if (!signatureName.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      // Create a text signature as base64 data URL
      const textSignature = `data:text/plain;base64,${btoa(`Signed by: ${signatureName.trim()}\nDate: ${new Date().toLocaleDateString()}`)}`;
      onSave(textSignature);
    } else {
      if (!hasSignature) {
        Alert.alert('Error', 'Please draw your signature');
        return;
      }
      // Create simple signature data
      const signatureData = `data:application/json;base64,${btoa(JSON.stringify({
        type: 'drawing',
        paths: drawingPaths,
        timestamp: new Date().toISOString()
      }))}`;
      onSave(signatureData);
    }
    
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
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={handleSaveSignature} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            {signatureMode === 'draw' ? 'Draw your signature below' : 'Enter your name for digital signature'}
          </Text>
          <View style={styles.modeToggle}>
            <TouchableOpacity 
              style={[styles.modeButton, signatureMode === 'draw' && styles.modeButtonActive]}
              onPress={() => setSignatureMode('draw')}
            >
              <Ionicons name="create-outline" size={16} color={signatureMode === 'draw' ? '#fff' : '#6b7280'} />
              <Text style={[styles.modeButtonText, signatureMode === 'draw' && styles.modeButtonTextActive]}>Draw</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modeButton, signatureMode === 'text' && styles.modeButtonActive]}
              onPress={() => setSignatureMode('text')}
            >
              <Ionicons name="text-outline" size={16} color={signatureMode === 'text' ? '#fff' : '#6b7280'} />
              <Text style={[styles.modeButtonText, signatureMode === 'text' && styles.modeButtonTextActive]}>Type</Text>
            </TouchableOpacity>
          </View>
        </View>

        {signatureMode === 'draw' ? (
          <View style={styles.signatureContainer} {...panResponder.panHandlers}>
            <View style={styles.drawingCanvas}>
              {drawingPaths.map((path, pathIndex) => 
                path.map((point, pointIndex) => (
                  <View 
                    key={`${pathIndex}-${pointIndex}`}
                    style={[
                      styles.drawPoint, 
                      { left: point.x - 2, top: point.y - 2 }
                    ]} 
                  />
                ))
              )}
              {currentPath.map((point, pointIndex) => (
                <View 
                  key={`current-${pointIndex}`}
                  style={[
                    styles.drawPoint, 
                    { left: point.x - 2, top: point.y - 2 }
                  ]} 
                />
              ))}
            </View>
            {!hasSignature && (
              <View style={styles.signaturePlaceholder}>
                <Ionicons name="create-outline" size={32} color="#d1d5db" />
                <Text style={styles.placeholderText}>Draw your signature here</Text>
                <Text style={styles.placeholderHint}>📱 Rotate to landscape for better experience</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.textSignatureContainer}>
            <TextInput
              style={styles.signatureInput}
              value={signatureName}
              onChangeText={(text) => {
                setSignatureName(text);
                setHasSignature(text.trim().length > 0);
              }}
              placeholder="Enter your full name"
              placeholderTextColor="#9ca3af"
              autoFocus={true}
            />
            {signatureName.trim() && (
              <View style={styles.signaturePreview}>
                <Text style={styles.previewTitle}>Signature Preview:</Text>
                <Text style={styles.previewSignature}>✍️ Signed by: {signatureName}</Text>
                <Text style={styles.previewDate}>📅 Date: {new Date().toLocaleDateString()}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleClearSignature} style={styles.clearButton}>
            <Ionicons name="refresh" size={20} color="#ef4444" />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
  },
  cancelButton: {
    padding: 8,
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#10b981',
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  instructions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  instructionText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 4,
    alignSelf: 'center',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  modeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  modeButtonTextActive: {
    color: '#ffffff',
  },
  signatureContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    position: 'relative',
    overflow: 'hidden',
  },
  drawingCanvas: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  drawPoint: {
    position: 'absolute',
    width: 4,
    height: 4,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  signaturePlaceholder: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    alignItems: 'center',
    transform: [{ translateX: -80 }, { translateY: -40 }],
    zIndex: 1,
  },
  placeholderText: {
    fontSize: 16,
    color: '#d1d5db',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  placeholderHint: {
    fontSize: 12,
    color: '#d1d5db',
    textAlign: 'center',
    marginTop: 4,
  },
  textSignatureContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    padding: 20,
  },
  signatureInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
    marginBottom: 20,
  },
  signaturePreview: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  previewSignature: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
    backgroundColor: '#000000',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#374151',
    borderRadius: 8,
    gap: 8,
  },
  clearButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SignatureModal;
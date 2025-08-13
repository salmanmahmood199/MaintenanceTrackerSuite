import React, { useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
// Using React Native views for signature drawing
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DrawingSignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  title?: string;
}

const DrawingSignatureModal: React.FC<DrawingSignatureModalProps> = ({
  visible,
  onClose,
  onSave,
  title = "Manager Signature"
}) => {
  const [paths, setPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const pathRef = useRef<string>('');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        const newPath = `M${locationX.toFixed(2)},${locationY.toFixed(2)}`;
        pathRef.current = newPath;
        setCurrentPath(newPath);
      },
      
      onPanResponderMove: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        const newPath = `${pathRef.current} L${locationX.toFixed(2)},${locationY.toFixed(2)}`;
        pathRef.current = newPath;
        setCurrentPath(newPath);
      },
      
      onPanResponderRelease: () => {
        setPaths(prev => [...prev, pathRef.current]);
        setCurrentPath('');
        pathRef.current = '';
      }
    })
  ).current;

  const clearSignature = () => {
    setPaths([]);
    setCurrentPath('');
    pathRef.current = '';
  };

  const saveSignature = () => {
    if (paths.length === 0 && !currentPath) {
      Alert.alert('Error', 'Please provide a signature before saving');
      return;
    }

    // Create a simple signature representation
    const signatureData = {
      paths: paths,
      timestamp: new Date().toISOString(),
      signatureType: 'drawn'
    };
    
    // Convert to base64
    const base64Signature = `data:application/json;base64,${btoa(JSON.stringify(signatureData))}`;
    onSave(base64Signature);
    clearSignature();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" supportedOrientations={['landscape', 'portrait']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6b7280" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{title}</Text>
          
          <TouchableOpacity onPress={saveSignature} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Rotate device to landscape for better signing experience. Use your finger to sign below.
          </Text>
        </View>

        <View style={styles.signatureContainer} {...panResponder.panHandlers}>
          <View style={styles.drawingArea}>
            {paths.map((path, index) => {
              const coords = parsePath(path);
              return coords.map((coord, i) => (
                <View
                  key={`${index}-${i}`}
                  style={[
                    styles.dot,
                    {
                      left: coord.x - 1,
                      top: coord.y - 1,
                    }
                  ]}
                />
              ));
            })}
            {currentPath && parsePath(currentPath).map((coord, i) => (
              <View
                key={`current-${i}`}
                style={[
                  styles.dot,
                  {
                    left: coord.x - 1,
                    top: coord.y - 1,
                  }
                ]}
              />
            ))}
          </View>
          
          <View style={styles.signatureLine}>
            <View style={styles.line} />
            <Text style={styles.signatureLabel}>Signature</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={clearSignature} style={styles.clearButton}>
            <Ionicons name="refresh" size={18} color="#ef4444" />
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
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  instructionContainer: {
    padding: 16,
    backgroundColor: '#f0f9ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0f2fe',
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
    overflow: 'hidden',
    position: 'relative',
    minHeight: 200,
  },
  drawingArea: {
    flex: 1,
    position: 'relative',
  },
  dot: {
    width: 2,
    height: 2,
    backgroundColor: 'black',
    borderRadius: 1,
    position: 'absolute',
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  clearButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 16,
  },
  signatureLine: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  line: {
    height: 1,
    backgroundColor: '#d1d5db',
    width: '100%',
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
});

// Helper function to parse path data into coordinates
const parsePath = (pathString: string): Array<{x: number, y: number}> => {
  if (!pathString) return [];
  
  const coords: Array<{x: number, y: number}> = [];
  const commands = pathString.split(/[ML]/);
  
  commands.forEach(command => {
    if (command.trim()) {
      const parts = command.split(',');
      if (parts.length === 2) {
        const x = parseFloat(parts[0]);
        const y = parseFloat(parts[1]);
        if (!isNaN(x) && !isNaN(y)) {
          coords.push({ x, y });
        }
      }
    }
  });
  
  return coords;
};

export default DrawingSignatureModal;
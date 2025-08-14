import React, { useState, useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SignatureCanvas from "react-native-signature-canvas";
import * as FileSystem from "expo-file-system";
import axios from "axios";

interface SignatureModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signatureUrl: string) => void;
  title?: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({
  visible,
  onClose,
  onSave,
  title = "Manager Signature",
}) => {
  const signatureRef = useRef<any>(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClearSignature = () => {
    signatureRef.current?.clearSignature();
    setHasSignature(false);
  };

  const handleBegin = () => {
    setHasSignature(true);
  };

  const handleSignatureOK = async (sig: string) => {
    if (!sig) return;
    try {
      setIsLoading(true);

      // Strip the prefix for backend
      const base64Code = sig.replace(/^data:image\/\w+;base64,/, "");
      const fileName = `signature_${Date.now()}.png`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const formData = new FormData();
      formData.append("file", {
        uri: filePath,
        name: fileName,
        type: "image/png",
      } as any);

      const response = await axios.post(
        "https://byzpal.com/api/application/uploadfile",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (response.data?.url) {
        console.log(response.data.url);
        onSave(response.data.url);
        handleClearSignature();
        onClose();
      } else {
        throw new Error("No URL returned from upload");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to save signature. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!visible) {
      handleClearSignature();
    }
  }, [visible]);

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
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity
            onPress={() => signatureRef.current?.readSignature()}
            style={[
              styles.saveButton,
              (!hasSignature || isLoading) && styles.disabledButton,
            ]}
            disabled={!hasSignature || isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Please sign below to confirm the work order completion
          </Text>
        </View>

        {/* Signature area */}
        <View style={styles.signatureContainer}>
          <View style={styles.signatureCanvasContainer}>
            <SignatureCanvas
              ref={signatureRef}
              onBegin={handleBegin}
              onOK={handleSignatureOK}
              webStyle={webStyle}
              autoClear={false}
              imageType="image/png"
            />
          </View>

          {/* Clear Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClearSignature}
            disabled={isLoading}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const webStyle = `.m-signature-pad {
  box-shadow: none;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #f9fafb;
}
.m-signature-pad--body { border: none; }
.m-signature-pad--footer { display: none; }`;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 40,
    // paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingTop: 25,
  },
  cancelButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: "600", color: "#1e293b" },
  saveButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: { opacity: 0.6 },
  saveButtonText: { color: "white", fontWeight: "600", fontSize: 16 },
  instructions: {
    padding: 16,
    backgroundColor: "#e0f2fe",
    borderBottomWidth: 1,
    borderBottomColor: "#bae6fd",
  },
  instructionText: {
    fontSize: 14,
    color: "#0369a1",
    textAlign: "center",
    lineHeight: 20,
  },
  signatureContainer: {
    flex: 1,
    backgroundColor: "white",
    margin: 0,
  },
  signaturePrompt: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  signatureCanvasContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    overflow: "hidden",
    // marginBottom: 16,
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 140,
  },
  clearButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  clearButtonText: { color: "#475569", fontWeight: "600", fontSize: 16 },
});

export default SignatureModal;

import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Image, Platform } from "react-native";
import Signature, { SignatureViewRef } from "react-native-signature-canvas";
import * as ScreenOrientation from "expo-screen-orientation";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import { StatusBar } from "expo-status-bar";

type Props = {
  onConfirmed?: (result: { base64DataUrl: string; fileUri: string }) => void;
  onCancel?: () => void;
};

export default function SignatureCaptureScreen({ onConfirmed, onCancel }: Props) {
  const sigRef = useRef<SignatureViewRef>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Lock to landscape while this screen is mounted
  useEffect(() => {
    (async () => {
      try {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      } catch {}
    })();
    return () => {
      ScreenOrientation.unlockAsync().catch(() => {});
    };
  }, []);

  // Minimal CSS to make the canvas fill the screen and hide the built-in footer
  const webStyle = `
    .m-signature-pad { box-shadow: none; border: 0; }
    .m-signature-pad--body { border: 1px solid #e5e7eb; }
    .m-signature-pad--footer { display: none; margin: 0; }
    body,html,canvas { width: 100%; height: 100%; }
  `;

  // Called when user taps our "Confirm" (we trigger readSignature() to fire onOK)
  const handleOK = async (dataUrl: string) => {
    setSaving(true);
    try {
      const base64 = dataUrl.replace(/^data:image\/\w+;base64,/, "");
      const path = `${FileSystem.cacheDirectory}signature-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(path, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Optional: compress/clean the PNG a bit to reduce size
      const { uri } = await ImageManipulator.manipulateAsync(
        path,
        [],
        { compress: 0.9, format: ImageManipulator.SaveFormat.PNG }
      );

      setPreviewUri(uri);
      onConfirmed?.({ base64DataUrl: dataUrl, fileUri: uri });
    } finally {
      setSaving(false);
    }
  };

  const triggerSave = () => sigRef.current?.readSignature();
  const triggerClear = () => {
    setPreviewUri(null);
    sigRef.current?.clearSignature();
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <View style={styles.canvasWrap}>
        <Signature
          ref={sigRef}
          onOK={handleOK}
          onEmpty={() => {}}
          onClear={() => setPreviewUri(null)}
          webStyle={webStyle}
          autoClear={false}                 // keep drawing until user clears
          penColor="#111"                   // ink color
          backgroundColor="#fff"            // canvas color (can be "transparent")
          imageType="image/png"             // output format
        />
        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Turn your phone horizontally and sign inside the box
          </Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={triggerClear}>
          <Text style={[styles.btnText, styles.secondaryText]}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.primary, saving && styles.btnDisabled]}
          onPress={triggerSave}
          disabled={saving}
        >
          <Text style={[styles.btnText, styles.primaryText]}>
            {saving ? "Saving…" : "Confirm"}
          </Text>
        </TouchableOpacity>
      </View>

      {previewUri && (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Preview</Text>
          <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  canvasWrap: { flex: 1, position: "relative" },
  hint: { position: "absolute", top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#00000055", borderRadius: 8 },
  hintText: { color: "#fff", fontSize: 14 },
  toolbar: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  btn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  primary: { backgroundColor: "#111827" },
  primaryText: { color: "#fff", fontWeight: "600" },
  secondary: { backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
  secondaryText: { color: "#111827", fontWeight: "600" },
  btnText: { fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
  preview: { paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#fff" },
  previewTitle: { fontSize: 14, color: "#374151", marginBottom: 8 },
  previewImage: { width: "100%", height: 140, backgroundColor: "#fafafa", borderRadius: 8 },
});
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { mobileTheme as styles } from '../src/mobileTheme';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualValue, setManualValue] = useState('');

  function useSerial(value: string): void {
    const serial = value.trim();
    if (!serial) return;
    setScanned(true);
    router.replace({ pathname: '/intake', params: { serial } });
  }

  function handleBarcode(result: BarcodeScanningResult): void {
    if (!scanned) useSerial(result.data);
  }

  if (!permission) {
    return (
      <View style={[styles.screen, local.center]}>
        <Text style={styles.cardCopy}>Checking camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.screen, local.center]}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Camera permission required</Text>
          <Text style={styles.cardCopy}>
            RepairFlow uses the camera only for device labels and evidence capture.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => void requestPermission()}>
            <Text style={styles.primaryButtonText}>Allow camera</Text>
          </Pressable>
        </View>
        <ManualEntry value={manualValue} onChange={setManualValue} onUse={useSerial} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'code128', 'ean13', 'ean8'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcode}
      />
      <View style={local.overlay}>
        <View style={local.guide}>
          <View style={local.guideInner} />
        </View>
        <Text style={local.instruction}>Align a QR code or serial barcode inside the frame.</Text>
        <ManualEntry value={manualValue} onChange={setManualValue} onUse={useSerial} />
      </View>
    </View>
  );
}

function ManualEntry({
  value,
  onChange,
  onUse,
}: {
  value: string;
  onChange: (value: string) => void;
  onUse: (value: string) => void;
}) {
  return (
    <View style={local.manualCard}>
      <Text style={styles.label}>MANUAL FALLBACK</Text>
      <TextInput
        testID="mobile-manual-serial"
        style={styles.input}
        value={value}
        onChangeText={onChange}
        autoCapitalize="characters"
        placeholder="Enter serial number"
        placeholderTextColor="#667084"
      />
      <Pressable
        testID="mobile-use-serial"
        style={styles.secondaryButton}
        onPress={() => onUse(value)}
      >
        <Text style={styles.secondaryButtonText}>Use serial number</Text>
      </Pressable>
    </View>
  );
}

const local = StyleSheet.create({
  center: {
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 90,
    paddingBottom: 34,
    backgroundColor: 'rgba(4, 8, 12, 0.34)',
  },
  guide: {
    alignSelf: 'center',
    width: 270,
    height: 190,
    padding: 4,
    borderWidth: 2,
    borderColor: '#91a0ff',
    borderRadius: 22,
    backgroundColor: 'rgba(9, 13, 20, 0.08)',
  },
  guideInner: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    borderRadius: 17,
  },
  instruction: {
    alignSelf: 'center',
    maxWidth: 300,
    marginTop: 'auto',
    marginBottom: 18,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: '#000000',
    textShadowRadius: 8,
  },
  manualCard: {
    gap: 9,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 18, 25, 0.94)',
  },
});

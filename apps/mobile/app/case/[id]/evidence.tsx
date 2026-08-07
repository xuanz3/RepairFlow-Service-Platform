import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { preserveEvidencePhoto } from '../../../src/evidenceFiles';
import { getLocalRepairCase, saveLocalRepairCase } from '../../../src/localWorkflowStore';
import { attachMobileEvidence } from '../../../src/workflowModel';
import { mobileTheme as styles } from '../../../src/mobileTheme';

export default function EvidenceScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const camera = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [note, setNote] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string>();

  async function capture(): Promise<void> {
    if (!id || !camera.current) return;
    setCapturing(true);
    setError(undefined);

    try {
      const photo = await camera.current.takePictureAsync({
        quality: 0.78,
        skipProcessing: false,
      });
      if (!photo?.uri) throw new Error('The camera did not return a photo.');

      const repairCase = await getLocalRepairCase(id);
      if (!repairCase) throw new Error('Repair case was not found.');

      const evidence = await preserveEvidencePhoto(id, photo.uri, 'repair', note);
      await saveLocalRepairCase(attachMobileEvidence(repairCase, evidence));
      router.back();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Evidence capture failed.');
      setCapturing(false);
    }
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
            Evidence photos are copied into RepairFlow application storage and hashed locally.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => void requestPermission()}>
            <Text style={styles.primaryButtonText}>Allow camera</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView ref={camera} style={StyleSheet.absoluteFill} facing="back" />
      <View style={local.overlay}>
        <View style={local.topCard}>
          <Text style={styles.label}>EVIDENCE NOTE</Text>
          <TextInput
            style={[styles.input, { backgroundColor: 'rgba(13, 18, 25, 0.94)' }]}
            value={note}
            onChangeText={setNote}
            placeholder="What does this photo show?"
            placeholderTextColor="#7b8494"
          />
          {error && <Text style={styles.error}>{error}</Text>}
        </View>

        <View style={local.captureRow}>
          <Pressable
            testID="capture-evidence"
            style={[local.captureButton, capturing && { opacity: 0.5 }]}
            disabled={capturing}
            onPress={() => void capture()}
          >
            <View style={local.captureInner} />
          </Pressable>
          <Text style={local.captureText}>
            {capturing ? 'Securing evidence…' : 'Capture repair evidence'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const local = StyleSheet.create({
  center: {
    padding: 22,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'rgba(4, 8, 12, 0.22)',
  },
  topCard: {
    gap: 8,
    marginTop: 18,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(13, 18, 25, 0.9)',
  },
  captureRow: {
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  captureButton: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
    borderRadius: 38,
    backgroundColor: 'rgba(13, 18, 25, 0.4)',
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#ffffff',
  },
  captureText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    textShadowColor: '#000000',
    textShadowRadius: 6,
  },
});

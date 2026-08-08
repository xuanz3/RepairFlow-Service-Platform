import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RepairCaseSummary, RepairRole } from '@repairflow/contracts';
import { getPreviewRole, setPreviewRole } from '../src/previewSession';
import { listLocalRepairCases, resetLocalRepairCases } from '../src/localWorkflowStore';
import { mobileTheme as styles } from '../src/mobileTheme';

export default function HomeScreen() {
  const [cases, setCases] = useState<RepairCaseSummary[]>([]);
  const [role, setRole] = useState<RepairRole>('technician');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [loadedCases, loadedRole] = await Promise.all([listLocalRepairCases(), getPreviewRole()]);
    setCases(loadedCases);
    setRole(loadedRole);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function cycleRole(): Promise<void> {
    const next: RepairRole =
      role === 'intake' ? 'technician' : role === 'technician' ? 'quality' : 'intake';
    await setPreviewRole(next);
    setRole(next);
  }

  return (
    <SafeAreaView testID="mobile-home" style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.rowBetween}>
          <View style={[styles.header, { flex: 1 }]}>
            <Text style={styles.eyebrow}>TODAY</Text>
            <Text style={styles.title}>Workshop intake</Text>
            <Text style={styles.subtitle}>
              Local device check-in, evidence and repair actions backed by SQLite.
            </Text>
          </View>
          <Pressable style={styles.secondaryButton} onPress={() => void cycleRole()}>
            <Text style={styles.secondaryButtonText}>{role}</Text>
          </Pressable>
        </View>

        <View style={styles.cardRaised}>
          <Text style={styles.eyebrow}>QUICK ACTION</Text>
          <Text style={styles.cardTitle}>Start device check-in</Text>
          <Text style={styles.cardCopy}>
            Capture customer, device condition, reported fault and intake evidence.
          </Text>
          <View style={styles.row}>
            <Pressable
              testID="mobile-new-intake"
              style={[styles.primaryButton, { flex: 1 }]}
              onPress={() => router.push('/intake')}
            >
              <Text style={styles.primaryButtonText}>New intake</Text>
            </Pressable>
            <Pressable
              testID="mobile-scan-qr"
              style={[styles.secondaryButton, { flex: 1 }]}
              onPress={() => router.push('/scan')}
            >
              <Text style={styles.secondaryButtonText}>Scan QR</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Local queue</Text>
          <Pressable
            onPress={() =>
              Alert.alert('Reset preview?', 'This replaces local workflow records.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => void resetLocalRepairCases().then(load),
                },
              ])
            }
          >
            <Text style={[styles.label, { color: '#aeb8ff' }]}>RESET</Text>
          </Pressable>
        </View>

        {loading && <Text style={styles.subtitle}>Loading local queue…</Text>}

        {cases.map((item) => (
          <Pressable
            testID={`mobile-case-${item.id}`}
            style={styles.card}
            key={item.id}
            onPress={() => router.push({ pathname: '/case/[id]', params: { id: item.id } })}
          >
            <View style={styles.rowBetween}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.cardTitle}>
                  {item.device.manufacturer} {item.device.model}
                </Text>
                <Text style={styles.cardCopy}>
                  {item.reference} · {item.customerDisplayName}
                </Text>
              </View>
              <Text style={styles.status}>{item.status}</Text>
            </View>
            <Text style={styles.label}>VERSION {item.version}</Text>
          </Pressable>
        ))}

        {!loading && cases.length === 0 && (
          <View style={styles.card}>
            <Text style={styles.cardCopy}>No local repair cases are available.</Text>
          </View>
        )}

        <View
          testID="mobile-local-queue-protected"
          style={[styles.card, { backgroundColor: '#16241f' }]}
        >
          <Text style={[styles.cardTitle, styles.success]}>Local queue protected</Text>
          <Text style={styles.cardCopy}>
            SQLite uses WAL mode. Evidence files are copied into application storage and hashed.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

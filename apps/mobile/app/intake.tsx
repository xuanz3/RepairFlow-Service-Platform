import { type ReactNode, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { CreateRepairCaseRequest, RepairPriority } from '@repairflow/contracts';
import { createRepairCaseSchema } from '@repairflow/validation';
import { createMobileRepairCase } from '../src/workflowModel';
import { saveLocalRepairCase } from '../src/localWorkflowStore';
import { mobileTheme as styles } from '../src/mobileTheme';

const priorities: RepairPriority[] = ['standard', 'priority', 'urgent'];

export default function IntakeScreen() {
  const params = useLocalSearchParams<{ serial?: string }>();
  const scannedSerial = useMemo(
    () => (Array.isArray(params.serial) ? params.serial[0] : params.serial) ?? '',
    [params.serial],
  );
  const [form, setForm] = useState<CreateRepairCaseRequest>({
    customerDisplayName: '',
    manufacturer: '',
    model: '',
    category: 'Laptop',
    serialNumber: scannedSerial,
    reportedFault: '',
    intakeCondition: '',
    priority: 'standard',
  });
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  function update<K extends keyof CreateRepairCaseRequest>(
    key: K,
    value: CreateRepairCaseRequest[K],
  ): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(): Promise<void> {
    const parsed = createRepairCaseSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Check the intake fields.');
      return;
    }

    setSaving(true);
    try {
      const repairCase = createMobileRepairCase(parsed.data);
      await saveLocalRepairCase(repairCase);
      router.replace({ pathname: '/case/[id]', params: { id: repairCase.id } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The intake could not be saved.');
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.eyebrow}>DEVICE CHECK-IN</Text>
          <Text style={styles.title}>New repair intake</Text>
          <Text style={styles.subtitle}>
            Required fields are validated before the record is committed to SQLite.
          </Text>
        </View>

        {scannedSerial ? (
          <View style={[styles.card, { backgroundColor: '#182740' }]}>
            <Text style={styles.label}>SCANNED LABEL</Text>
            <Text style={styles.cardTitle}>{scannedSerial}</Text>
          </View>
        ) : (
          <Pressable style={styles.secondaryButton} onPress={() => router.push('/scan')}>
            <Text style={styles.secondaryButtonText}>Scan serial or QR label</Text>
          </Pressable>
        )}

        <Field label="Customer">
          <TextInput
            testID="intake-customer"
            style={styles.input}
            value={form.customerDisplayName}
            onChangeText={(value) => update('customerDisplayName', value)}
            placeholder="Customer or organisation"
            placeholderTextColor="#667084"
          />
        </Field>

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label="Manufacturer">
              <TextInput
                testID="intake-manufacturer"
                style={styles.input}
                value={form.manufacturer}
                onChangeText={(value) => update('manufacturer', value)}
                placeholder="Manufacturer"
                placeholderTextColor="#667084"
              />
            </Field>
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Model">
              <TextInput
                testID="intake-model"
                style={styles.input}
                value={form.model}
                onChangeText={(value) => update('model', value)}
                placeholder="Model"
                placeholderTextColor="#667084"
              />
            </Field>
          </View>
        </View>

        <Field label="Category">
          <TextInput
            style={styles.input}
            value={form.category}
            onChangeText={(value) => update('category', value)}
            placeholder="Laptop, tablet, phone…"
            placeholderTextColor="#667084"
          />
        </Field>

        <Field label="Serial number">
          <TextInput
            testID="intake-serial"
            style={styles.input}
            value={form.serialNumber}
            onChangeText={(value) => update('serialNumber', value)}
            autoCapitalize="characters"
            placeholder="Serial number"
            placeholderTextColor="#667084"
          />
        </Field>

        <Field label="Priority">
          <View style={styles.row}>
            {priorities.map((priority) => (
              <Pressable
                key={priority}
                style={[
                  styles.secondaryButton,
                  { flex: 1 },
                  form.priority === priority && {
                    borderColor: '#6d7dff',
                    backgroundColor: '#252d4c',
                  },
                ]}
                onPress={() => update('priority', priority)}
              >
                <Text style={styles.secondaryButtonText}>{priority}</Text>
              </Pressable>
            ))}
          </View>
        </Field>

        <Field label="Reported fault">
          <TextInput
            testID="intake-fault"
            style={[styles.input, styles.textarea]}
            value={form.reportedFault}
            onChangeText={(value) => update('reportedFault', value)}
            multiline
            placeholder="Describe the customer-reported problem"
            placeholderTextColor="#667084"
          />
        </Field>

        <Field label="Intake condition">
          <TextInput
            testID="intake-condition"
            style={[styles.input, styles.textarea]}
            value={form.intakeCondition}
            onChangeText={(value) => update('intakeCondition', value)}
            multiline
            placeholder="Visible damage, supplied accessories and condition"
            placeholderTextColor="#667084"
          />
        </Field>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          testID="save-intake"
          style={[styles.primaryButton, saving && { opacity: 0.5 }]}
          disabled={saving}
          onPress={() => void save()}
        >
          <Text style={styles.primaryButtonText}>
            {saving ? 'Saving locally…' : 'Create repair intake'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

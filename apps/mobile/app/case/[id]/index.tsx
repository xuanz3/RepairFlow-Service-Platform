import { type ReactNode, useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import type { QualityOutcome, RepairCaseDetail } from '@repairflow/contracts';
import {
  addMobileRepairAction,
  completeMobileRepairAction,
  recordMobileDiagnosis,
  submitMobileQualityReview,
  transitionMobileRepairCase,
} from '../../../src/workflowModel';
import { getLocalRepairCase, saveLocalRepairCase } from '../../../src/localWorkflowStore';
import { mobileTheme as styles } from '../../../src/mobileTheme';

type Tab = 'overview' | 'diagnosis' | 'repair' | 'quality';

export default function RepairCaseScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [repairCase, setRepairCase] = useState<RepairCaseDetail>();
  const [tab, setTab] = useState<Tab>('overview');
  const [error, setError] = useState<string>();
  const [diagnosisSummary, setDiagnosisSummary] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [diagnosticCode, setDiagnosticCode] = useState('');
  const [actionTitle, setActionTitle] = useState('');
  const [actionDetail, setActionDetail] = useState('');
  const [qualityOutcome, setQualityOutcome] = useState<QualityOutcome>('passed');
  const [qualityNotes, setQualityNotes] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const loaded = await getLocalRepairCase(id);
    setRepairCase(loaded);
    if (loaded?.diagnosis) {
      setDiagnosisSummary(loaded.diagnosis.summary);
      setRecommendation(loaded.diagnosis.recommendation);
      setDiagnosticCode(loaded.diagnosis.diagnosticCode ?? '');
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function persist(updated: RepairCaseDetail): Promise<void> {
    try {
      const saved = await saveLocalRepairCase(updated);
      setRepairCase(saved);
      setError(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The local change could not be saved.');
    }
  }

  if (!repairCase) {
    return (
      <View style={[styles.screen, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.cardCopy}>Loading repair case…</Text>
      </View>
    );
  }

  const canSendToQuality =
    repairCase.status === 'in-repair' &&
    repairCase.repairActions.length > 0 &&
    repairCase.repairActions.every((item) => item.status === 'completed');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{repairCase.reference}</Text>
        <Text style={styles.title}>
          {repairCase.device.manufacturer} {repairCase.device.model}
        </Text>
        <View style={styles.rowBetween}>
          <Text style={styles.subtitle}>{repairCase.customerDisplayName}</Text>
          <Text style={styles.status}>{repairCase.status}</Text>
        </View>
      </View>

      <View style={styles.row}>
        {(['overview', 'diagnosis', 'repair', 'quality'] as Tab[]).map((item) => (
          <Pressable
            key={item}
            style={[
              styles.secondaryButton,
              { flex: 1, minHeight: 38, paddingHorizontal: 5 },
              tab === item && { borderColor: '#6d7dff', backgroundColor: '#252d4c' },
            ]}
            onPress={() => setTab(item)}
          >
            <Text style={[styles.secondaryButtonText, { fontSize: 10 }]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {tab === 'overview' && (
        <View style={{ gap: 12 }}>
          <InfoCard label="Reported fault" value={repairCase.reportedFault} />
          <InfoCard label="Intake condition" value={repairCase.intakeCondition} />
          <View style={styles.row}>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.label}>VERSION</Text>
              <Text style={styles.cardTitle}>{repairCase.version}</Text>
            </View>
            <View style={[styles.card, { flex: 1 }]}>
              <Text style={styles.label}>EVIDENCE</Text>
              <Text style={styles.cardTitle}>{repairCase.evidence.length}</Text>
            </View>
          </View>
          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.push({
                pathname: '/case/[id]/evidence',
                params: { id: repairCase.id },
              })
            }
          >
            <Text style={styles.primaryButtonText}>Capture evidence</Text>
          </Pressable>
          {repairCase.evidence.map((item) => (
            <View style={styles.card} key={item.id}>
              <Text style={styles.label}>{item.kind.toUpperCase()}</Text>
              <Text style={styles.cardTitle}>{item.fileName}</Text>
              <Text style={styles.cardCopy}>
                {Math.round(item.sizeBytes / 1024)} KB ·{' '}
                {item.sha256 ? `${item.sha256.slice(0, 12)}…` : 'digest pending'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {tab === 'diagnosis' && (
        <View style={{ gap: 12 }}>
          <Field label="Diagnosis summary">
            <TextInput
              testID="mobile-diagnosis-summary"
              style={[styles.input, styles.textarea]}
              value={diagnosisSummary}
              onChangeText={setDiagnosisSummary}
              multiline
              placeholder="What was reproduced and measured?"
              placeholderTextColor="#667084"
            />
          </Field>
          <Field label="Recommended repair">
            <TextInput
              testID="mobile-diagnosis-recommendation"
              style={[styles.input, styles.textarea]}
              value={recommendation}
              onChangeText={setRecommendation}
              multiline
              placeholder="Recommended repair and validation"
              placeholderTextColor="#667084"
            />
          </Field>
          <Field label="Diagnostic code">
            <TextInput
              style={styles.input}
              value={diagnosticCode}
              onChangeText={setDiagnosticCode}
              placeholder="Optional code"
              placeholderTextColor="#667084"
            />
          </Field>
          <Pressable
            testID="mobile-save-diagnosis"
            style={styles.primaryButton}
            onPress={() =>
              void persist(
                recordMobileDiagnosis(repairCase, {
                  summary: diagnosisSummary,
                  recommendation,
                  diagnosticCode: diagnosticCode || undefined,
                }),
              )
            }
          >
            <Text style={styles.primaryButtonText}>Save diagnosis</Text>
          </Pressable>
        </View>
      )}

      {tab === 'repair' && (
        <View style={{ gap: 12 }}>
          {repairCase.repairActions.map((action) => (
            <View style={styles.card} key={action.id}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle}>{action.title}</Text>
                <Text style={styles.status}>{action.status}</Text>
              </View>
              <Text style={styles.cardCopy}>{action.detail}</Text>
              {action.status !== 'completed' && (
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => void persist(completeMobileRepairAction(repairCase, action.id))}
                >
                  <Text style={styles.secondaryButtonText}>Mark complete</Text>
                </Pressable>
              )}
            </View>
          ))}

          <View style={[styles.card, { gap: 10 }]}>
            <Text style={styles.cardTitle}>Add repair action</Text>
            <TextInput
              testID="mobile-action-title"
              style={styles.input}
              value={actionTitle}
              onChangeText={setActionTitle}
              placeholder="Action title"
              placeholderTextColor="#667084"
            />
            <TextInput
              testID="mobile-action-detail"
              style={[styles.input, styles.textarea]}
              value={actionDetail}
              onChangeText={setActionDetail}
              multiline
              placeholder="Work detail"
              placeholderTextColor="#667084"
            />
            <Pressable
              testID="mobile-add-action"
              style={styles.primaryButton}
              onPress={() => {
                void persist(
                  addMobileRepairAction(repairCase, {
                    title: actionTitle,
                    detail: actionDetail,
                  }),
                );
                setActionTitle('');
                setActionDetail('');
              }}
            >
              <Text style={styles.primaryButtonText}>Add action</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.primaryButton, !canSendToQuality && { opacity: 0.4 }]}
            disabled={!canSendToQuality}
            onPress={() => void persist(transitionMobileRepairCase(repairCase, 'quality-check'))}
          >
            <Text style={styles.primaryButtonText}>Send to quality</Text>
          </Pressable>
        </View>
      )}

      {tab === 'quality' && (
        <View style={{ gap: 12 }}>
          {repairCase.status !== 'quality-check' ? (
            <View style={styles.card}>
              <Text style={styles.cardCopy}>
                Complete repair actions and send the case to quality before review.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.row}>
                {(['passed', 'returned-to-repair'] as QualityOutcome[]).map((outcome) => (
                  <Pressable
                    key={outcome}
                    style={[
                      styles.secondaryButton,
                      { flex: 1 },
                      qualityOutcome === outcome && {
                        borderColor: '#6d7dff',
                        backgroundColor: '#252d4c',
                      },
                    ]}
                    onPress={() => setQualityOutcome(outcome)}
                  >
                    <Text style={[styles.secondaryButtonText, { fontSize: 11 }]}>{outcome}</Text>
                  </Pressable>
                ))}
              </View>
              <Field label="Review notes">
                <TextInput
                  testID="mobile-quality-notes"
                  style={[styles.input, styles.textarea]}
                  value={qualityNotes}
                  onChangeText={setQualityNotes}
                  multiline
                  placeholder="Functional, cosmetic and evidence review"
                  placeholderTextColor="#667084"
                />
              </Field>
              <Pressable
                testID="mobile-submit-quality"
                style={styles.primaryButton}
                onPress={() =>
                  void persist(
                    submitMobileQualityReview(
                      repairCase,
                      qualityOutcome,
                      qualityNotes,
                      repairCase.evidence.length > 0,
                    ),
                  )
                }
              >
                <Text style={styles.primaryButtonText}>Submit quality review</Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      <Text style={styles.cardCopy}>{value}</Text>
    </View>
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

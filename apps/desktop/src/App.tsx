import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type {
  CreateRepairCaseRequest,
  QualityOutcome,
  RepairCaseDetail,
  RepairCaseStatus,
  RepairCaseSummary,
} from '@repairflow/contracts';
import { motion as motionTokens } from '@repairflow/design-tokens';
import {
  addEvidence,
  addRepairAction,
  completeRepairAction,
  countOpenCases,
  createRepairCase,
  recordDiagnosis,
  submitQualityReview,
  transitionRepairCase,
} from './workflowModel';
import { workflowRepository } from './workflowRepository';

type WorkspaceTab = 'overview' | 'diagnosis' | 'repair' | 'evidence' | 'quality';

const navigation = ['Workshop', 'Intake', 'Quality', 'Diagnostics'];
const tabs: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'diagnosis', label: 'Diagnosis' },
  { id: 'repair', label: 'Repair actions' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'quality', label: 'Quality review' },
];

export function App() {
  const [cases, setCases] = useState<RepairCaseSummary[]>([]);
  const [selected, setSelected] = useState<RepairCaseDetail>();
  const [selectedId, setSelectedId] = useState<string>();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('overview');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | RepairCaseStatus>('active');
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    void loadQueue();
  }, []);

  useEffect(() => {
    if (selectedId) void loadCase(selectedId);
  }, [selectedId]);

  const filteredCases = useMemo(() => {
    const query = search.trim().toLowerCase();
    return cases.filter((repairCase) => {
      const matchesStatus =
        statusFilter === 'active'
          ? !['delivered', 'cancelled'].includes(repairCase.status)
          : repairCase.status === statusFilter;
      const haystack = [
        repairCase.reference,
        repairCase.customerDisplayName,
        repairCase.device.manufacturer,
        repairCase.device.model,
      ]
        .join(' ')
        .toLowerCase();
      return matchesStatus && (!query || haystack.includes(query));
    });
  }, [cases, search, statusFilter]);

  const metrics = useMemo(
    () => ({
      active: countOpenCases(cases),
      diagnosing: cases.filter((item) => item.status === 'diagnosing').length,
      repair: cases.filter((item) => item.status === 'in-repair').length,
      quality: cases.filter((item) => item.status === 'quality-check').length,
    }),
    [cases],
  );

  async function loadQueue(preferredId?: string): Promise<void> {
    const loaded = await workflowRepository.list();
    setCases(loaded);
    const nextId = preferredId ?? selectedId ?? loaded[0]?.id;
    if (nextId) setSelectedId(nextId);
  }

  async function loadCase(id: string): Promise<void> {
    setError(undefined);
    const detail = await workflowRepository.get(id);
    setSelected(detail);
  }

  async function persist(updated: RepairCaseDetail, successMessage: string): Promise<void> {
    try {
      const saved = await workflowRepository.save(updated);
      setSelected(saved);
      setSelectedId(saved.id);
      await loadQueue(saved.id);
      setMessage(successMessage);
      setError(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The workflow change could not be saved.');
    }
  }

  async function resetPreview(): Promise<void> {
    await workflowRepository.reset();
    setSelected(undefined);
    setSelectedId(undefined);
    setActiveTab('overview');
    setMessage('Preview data reset.');
    await loadQueue();
  }

  return (
    <div className="application-shell">
      <aside className="sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">RF</div>
          <div>
            <strong>RepairFlow</strong>
            <span>Workshop operations</span>
          </div>
        </div>

        <nav aria-label="Primary navigation">
          {navigation.map((item, index) => (
            <button
              className={index === 0 ? 'nav-item active' : 'nav-item'}
              key={item}
              type="button"
            >
              <span>{item}</span>
              {index === 0 && <kbd>⌘1</kbd>}
            </button>
          ))}
        </nav>

        <div className="connection-card">
          <span className="connection-dot" />
          <div>
            <strong>Local workflow store ready</strong>
            <span>SQLite · Evidence vault · API boundary</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">WORKSHOP</span>
            <h1>Repair operations</h1>
            <p>{metrics.active} active cases across intake, diagnosis, repair and quality.</p>
          </div>
          <div className="header-actions">
            <button className="secondary-button" type="button" onClick={() => void resetPreview()}>
              Reset preview
            </button>
            <button
              className="primary-button"
              data-testid="new-intake"
              type="button"
              onClick={() => setIntakeOpen(true)}
            >
              New intake
            </button>
          </div>
        </header>

        {(message || error) && (
          <div className={error ? 'notice error' : 'notice success'} role="status">
            <span>{error ?? message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => {
                setError(undefined);
                setMessage(undefined);
              }}
            >
              ×
            </button>
          </div>
        )}

        <section className="summary-grid" aria-label="Workshop summary">
          <Metric label="Active cases" value={String(metrics.active)} detail="Open workflow" />
          <Metric label="Diagnosing" value={String(metrics.diagnosing)} detail="Evidence pending" />
          <Metric label="In repair" value={String(metrics.repair)} detail="Action tracking" />
          <Metric label="Quality checks" value={String(metrics.quality)} detail="Review required" />
        </section>

        <section className="content-grid">
          <div className="case-list-panel">
            <div className="panel-toolbar stacked">
              <div>
                <strong>Workshop queue</strong>
                <span>{filteredCases.length} visible cases</span>
              </div>
              <label className="search-field">
                <span className="sr-only">Search repair cases</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search reference, customer or device"
                />
              </label>
              <label className="compact-select">
                <span>Status</span>
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as 'active' | RepairCaseStatus)
                  }
                >
                  <option value="active">Active</option>
                  <option value="checked-in">Checked in</option>
                  <option value="diagnosing">Diagnosing</option>
                  <option value="in-repair">In repair</option>
                  <option value="quality-check">Quality check</option>
                  <option value="ready-for-delivery">Ready for delivery</option>
                </select>
              </label>
            </div>

            <div className="case-list" role="list">
              {filteredCases.map((repairCase) => (
                <CaseRow
                  key={repairCase.id}
                  repairCase={repairCase}
                  selected={repairCase.id === selectedId}
                  onSelect={() => {
                    setSelectedId(repairCase.id);
                    setActiveTab('overview');
                  }}
                />
              ))}
              {filteredCases.length === 0 && (
                <div className="empty-state">No repair cases match the current filter.</div>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selected ? (
              <motion.section
                className="case-workspace"
                key={selected.id}
                initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
                transition={{ duration: motionTokens.panelMs / 1000 }}
                data-testid="case-workspace"
              >
                <div className="case-workspace-header">
                  <div>
                    <span className={`status status-${selected.status}`}>{selected.status}</span>
                    <h2>
                      {selected.device.manufacturer} {selected.device.model}
                    </h2>
                    <p>
                      {selected.reference} · {selected.customerDisplayName}
                    </p>
                  </div>
                  <div className="version-chip">Version {selected.version}</div>
                </div>

                <div className="tab-list" role="tablist" aria-label="Repair case sections">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={activeTab === tab.id ? 'tab active' : 'tab'}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="tab-content">
                  {activeTab === 'overview' && <Overview repairCase={selected} />}
                  {activeTab === 'diagnosis' && (
                    <DiagnosisPanel
                      repairCase={selected}
                      onSave={(updated) => persist(updated, 'Diagnosis saved.')}
                    />
                  )}
                  {activeTab === 'repair' && (
                    <RepairPanel
                      repairCase={selected}
                      onSave={(updated, text) => persist(updated, text)}
                    />
                  )}
                  {activeTab === 'evidence' && (
                    <EvidencePanel
                      repairCase={selected}
                      onSave={(updated) => persist(updated, 'Evidence attached.')}
                    />
                  )}
                  {activeTab === 'quality' && (
                    <QualityPanel
                      repairCase={selected}
                      onSave={(updated) => persist(updated, 'Quality review saved.')}
                    />
                  )}
                </div>
              </motion.section>
            ) : (
              <div className="case-workspace empty-workspace">
                Select a repair case to open its operational workspace.
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>

      {intakeOpen && (
        <IntakeDialog
          onClose={() => setIntakeOpen(false)}
          onCreate={async (request) => {
            const created = createRepairCase(request);
            await workflowRepository.save(created);
            setIntakeOpen(false);
            await loadQueue(created.id);
            setActiveTab('overview');
            setMessage(`Created ${created.reference}.`);
          }}
        />
      )}
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function CaseRow({
  repairCase,
  selected,
  onSelect,
}: {
  repairCase: RepairCaseSummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className={selected ? 'case-row selected' : 'case-row'}
      onClick={onSelect}
      type="button"
      role="listitem"
    >
      <div className="device-icon">{repairCase.device.category.slice(0, 1)}</div>
      <div className="case-primary">
        <strong>
          {repairCase.device.manufacturer} {repairCase.device.model}
        </strong>
        <span>
          {repairCase.reference} · {repairCase.customerDisplayName}
        </span>
      </div>
      <span className={`status status-${repairCase.status}`}>{repairCase.status}</span>
      <span className="priority">{repairCase.priority}</span>
    </button>
  );
}

function Overview({ repairCase }: { repairCase: RepairCaseDetail }) {
  const nextAction =
    repairCase.status === 'checked-in'
      ? 'Record diagnosis'
      : repairCase.status === 'diagnosing'
        ? 'Plan repair actions'
        : repairCase.status === 'in-repair'
          ? 'Complete repair actions'
          : repairCase.status === 'quality-check'
            ? 'Submit quality review'
            : repairCase.status === 'ready-for-delivery'
              ? 'Prepare customer delivery'
              : 'No further action';

  return (
    <div className="overview-grid">
      <article className="detail-card span-two">
        <span className="card-kicker">REPORTED FAULT</span>
        <p>{repairCase.reportedFault}</p>
      </article>
      <article className="detail-card span-two">
        <span className="card-kicker">INTAKE CONDITION</span>
        <p>{repairCase.intakeCondition}</p>
      </article>
      <article className="detail-card">
        <span className="card-kicker">SERIAL</span>
        <strong>{repairCase.device.serialNumberMasked}</strong>
      </article>
      <article className="detail-card">
        <span className="card-kicker">PRIORITY</span>
        <strong className="capitalize">{repairCase.priority}</strong>
      </article>
      <article className="detail-card">
        <span className="card-kicker">REPAIR ACTIONS</span>
        <strong>
          {repairCase.repairActions.filter((item) => item.status === 'completed').length}/
          {repairCase.repairActions.length}
        </strong>
      </article>
      <article className="detail-card">
        <span className="card-kicker">EVIDENCE</span>
        <strong>{repairCase.evidence.length} items</strong>
      </article>
      <article className="next-action-card span-four">
        <span>Recommended next action</span>
        <strong>{nextAction}</strong>
      </article>
    </div>
  );
}

function DiagnosisPanel({
  repairCase,
  onSave,
}: {
  repairCase: RepairCaseDetail;
  onSave: (updated: RepairCaseDetail) => Promise<void>;
}) {
  const [summary, setSummary] = useState(repairCase.diagnosis?.summary ?? '');
  const [recommendation, setRecommendation] = useState(
    repairCase.diagnosis?.recommendation ?? '',
  );
  const [diagnosticCode, setDiagnosticCode] = useState(
    repairCase.diagnosis?.diagnosticCode ?? '',
  );

  return (
    <form
      className="workflow-form"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(
          recordDiagnosis(repairCase, {
            summary,
            recommendation,
            diagnosticCode: diagnosticCode || undefined,
          }),
        );
      }}
    >
      <FormField label="Diagnosis summary">
        <textarea
          data-testid="diagnosis-summary"
          value={summary}
          onChange={(event) => setSummary(event.target.value)}
          minLength={5}
          required
        />
      </FormField>
      <FormField label="Recommended repair">
        <textarea
          data-testid="diagnosis-recommendation"
          value={recommendation}
          onChange={(event) => setRecommendation(event.target.value)}
          minLength={3}
          required
        />
      </FormField>
      <FormField label="Diagnostic code">
        <input value={diagnosticCode} onChange={(event) => setDiagnosticCode(event.target.value)} />
      </FormField>
      <button className="primary-button align-start" data-testid="save-diagnosis" type="submit">
        Save diagnosis
      </button>
    </form>
  );
}

function RepairPanel({
  repairCase,
  onSave,
}: {
  repairCase: RepairCaseDetail;
  onSave: (updated: RepairCaseDetail, message: string) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [partNumber, setPartNumber] = useState('');

  const canSendToQuality =
    repairCase.repairActions.length > 0 &&
    repairCase.repairActions.every((item) => item.status === 'completed') &&
    repairCase.status === 'in-repair';

  return (
    <div className="workflow-stack">
      <div className="action-list">
        {repairCase.repairActions.map((action) => (
          <article className="action-card" key={action.id}>
            <div>
              <span className={`action-status action-${action.status}`}>{action.status}</span>
              <h3>{action.title}</h3>
              <p>{action.detail}</p>
              {action.partNumber && <small>Part: {action.partNumber}</small>}
            </div>
            {action.status !== 'completed' && (
              <button
                className="secondary-button"
                type="button"
                data-testid={`complete-action-${action.id}`}
                onClick={() =>
                  void onSave(
                    completeRepairAction(repairCase, action.id),
                    'Repair action completed.',
                  )
                }
              >
                Mark complete
              </button>
            )}
          </article>
        ))}
        {repairCase.repairActions.length === 0 && (
          <div className="empty-state">No repair actions have been planned.</div>
        )}
      </div>

      <form
        className="workflow-form compact"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(
            addRepairAction(repairCase, { title, detail, partNumber: partNumber || undefined }),
            'Repair action added.',
          );
          setTitle('');
          setDetail('');
          setPartNumber('');
        }}
      >
        <h3>Add repair action</h3>
        <FormField label="Action title">
          <input
            data-testid="repair-action-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </FormField>
        <FormField label="Work detail">
          <textarea
            data-testid="repair-action-detail"
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            required
          />
        </FormField>
        <FormField label="Part number">
          <input value={partNumber} onChange={(event) => setPartNumber(event.target.value)} />
        </FormField>
        <button className="primary-button align-start" data-testid="add-repair-action" type="submit">
          Add action
        </button>
      </form>

      <div className="quality-handoff">
        <div>
          <span>Quality handoff</span>
          <p>All planned actions must be completed before review.</p>
        </div>
        <button
          className="primary-button"
          type="button"
          data-testid="send-to-quality"
          disabled={!canSendToQuality}
          onClick={() =>
            void onSave(
              transitionRepairCase(repairCase, 'quality-check'),
              'Repair case sent to quality review.',
            )
          }
        >
          Send to quality
        </button>
      </div>
    </div>
  );
}

function EvidencePanel({
  repairCase,
  onSave,
}: {
  repairCase: RepairCaseDetail;
  onSave: (updated: RepairCaseDetail) => Promise<void>;
}) {
  return (
    <div className="workflow-stack">
      <div className="evidence-toolbar">
        <div>
          <h3>Evidence vault</h3>
          <p>Files are copied into the local application data directory and hashed.</p>
        </div>
        <button
          className="primary-button"
          data-testid="attach-evidence"
          type="button"
          onClick={async () => {
            const evidence = await workflowRepository.selectEvidence();
            if (evidence) await onSave(addEvidence(repairCase, evidence));
          }}
        >
          Attach evidence
        </button>
      </div>
      <div className="evidence-grid">
        {repairCase.evidence.map((item) => (
          <article className="evidence-card" key={item.id}>
            <span className="card-kicker">{item.kind}</span>
            <strong>{item.fileName}</strong>
            <span>{formatBytes(item.sizeBytes)}</span>
            <small>{item.sha256 ? `SHA-256 ${item.sha256.slice(0, 12)}…` : 'Digest pending'}</small>
          </article>
        ))}
        {repairCase.evidence.length === 0 && (
          <div className="empty-state">No evidence has been attached.</div>
        )}
      </div>
    </div>
  );
}

function QualityPanel({
  repairCase,
  onSave,
}: {
  repairCase: RepairCaseDetail;
  onSave: (updated: RepairCaseDetail) => Promise<void>;
}) {
  const [outcome, setOutcome] = useState<QualityOutcome>('passed');
  const [notes, setNotes] = useState('');
  const [evidenceComplete, setEvidenceComplete] = useState(repairCase.evidence.length > 0);

  if (repairCase.status !== 'quality-check') {
    return (
      <div className="empty-state large">
        Quality review becomes available when all repair actions are complete and the case enters
        quality check.
      </div>
    );
  }

  return (
    <form
      className="workflow-form"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(submitQualityReview(repairCase, outcome, notes, evidenceComplete));
      }}
    >
      <FormField label="Outcome">
        <select
          data-testid="quality-outcome"
          value={outcome}
          onChange={(event) => setOutcome(event.target.value as QualityOutcome)}
        >
          <option value="passed">Passed</option>
          <option value="returned-to-repair">Return to repair</option>
        </select>
      </FormField>
      <FormField label="Review notes">
        <textarea
          data-testid="quality-notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          required
        />
      </FormField>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={evidenceComplete}
          onChange={(event) => setEvidenceComplete(event.target.checked)}
        />
        <span>Required evidence is complete and reviewed</span>
      </label>
      <button className="primary-button align-start" data-testid="submit-quality" type="submit">
        Submit review
      </button>
    </form>
  );
}

function IntakeDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (request: CreateRepairCaseRequest) => Promise<void>;
}) {
  const [form, setForm] = useState<CreateRepairCaseRequest>({
    customerDisplayName: '',
    manufacturer: '',
    model: '',
    category: 'Laptop',
    serialNumber: '',
    reportedFault: '',
    intakeCondition: '',
    priority: 'standard',
  });

  function update<K extends keyof CreateRepairCaseRequest>(
    key: K,
    value: CreateRepairCaseRequest[K],
  ): void {
    setForm((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="intake-title"
        onSubmit={(event: FormEvent) => {
          event.preventDefault();
          void onCreate(form);
        }}
      >
        <div className="dialog-header">
          <div>
            <span className="eyebrow">DEVICE CHECK-IN</span>
            <h2 id="intake-title">New repair intake</h2>
          </div>
          <button type="button" className="icon-button" aria-label="Close intake" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="form-grid">
          <FormField label="Customer">
            <input
              data-testid="intake-customer"
              value={form.customerDisplayName}
              onChange={(event) => update('customerDisplayName', event.target.value)}
              required
            />
          </FormField>
          <FormField label="Priority">
            <select
              value={form.priority}
              onChange={(event) =>
                update('priority', event.target.value as CreateRepairCaseRequest['priority'])
              }
            >
              <option value="standard">Standard</option>
              <option value="priority">Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </FormField>
          <FormField label="Manufacturer">
            <input
              data-testid="intake-manufacturer"
              value={form.manufacturer}
              onChange={(event) => update('manufacturer', event.target.value)}
              required
            />
          </FormField>
          <FormField label="Model">
            <input
              data-testid="intake-model"
              value={form.model}
              onChange={(event) => update('model', event.target.value)}
              required
            />
          </FormField>
          <FormField label="Category">
            <input
              value={form.category}
              onChange={(event) => update('category', event.target.value)}
              required
            />
          </FormField>
          <FormField label="Serial number">
            <input
              data-testid="intake-serial"
              value={form.serialNumber}
              onChange={(event) => update('serialNumber', event.target.value)}
              required
            />
          </FormField>
          <FormField label="Reported fault" wide>
            <textarea
              data-testid="intake-fault"
              value={form.reportedFault}
              onChange={(event) => update('reportedFault', event.target.value)}
              required
            />
          </FormField>
          <FormField label="Intake condition" wide>
            <textarea
              data-testid="intake-condition"
              value={form.intakeCondition}
              onChange={(event) => update('intakeCondition', event.target.value)}
              required
            />
          </FormField>
        </div>

        <div className="dialog-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary-button" data-testid="create-intake" type="submit">
            Create intake
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={wide ? 'form-field wide' : 'form-field'}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

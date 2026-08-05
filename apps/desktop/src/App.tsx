import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useMemo, useState } from 'react';
import { motion as motionTokens } from '@repairflow/design-tokens';
import type { RepairCaseSummary } from '@repairflow/contracts';
import { countOpenCases, repairCases } from './repairCases';

const navigation = ['Workshop', 'Intake', 'Quality', 'Inventory', 'Diagnostics'];

export function App() {
  const [selectedId, setSelectedId] = useState(repairCases[0]?.id);
  const reduceMotion = useReducedMotion();
  const selected = useMemo(
    () => repairCases.find((item) => item.id === selectedId) ?? repairCases[0],
    [selectedId],
  );

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
            <button className={index === 0 ? 'nav-item active' : 'nav-item'} key={item}>
              <span>{item}</span>
              {index === 0 && <kbd>⌘1</kbd>}
            </button>
          ))}
        </nav>
        <div className="connection-card">
          <span className="connection-dot" />
          <div>
            <strong>Local services ready</strong>
            <span>PostgreSQL · API · Blob</span>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">WORKSHOP</span>
            <h1>Repair cases</h1>
            <p>{countOpenCases(repairCases)} active cases across intake, repair and quality.</p>
          </div>
          <div className="header-actions">
            <button className="secondary-button">
              Search <kbd>⌘K</kbd>
            </button>
            <button className="primary-button">New intake</button>
          </div>
        </header>

        <section className="summary-grid" aria-label="Workshop summary">
          <Metric label="Awaiting diagnosis" value="7" detail="2 priority" />
          <Metric label="In repair" value="12" detail="4 due today" />
          <Metric label="Quality checks" value="5" detail="1 returned" />
          <Metric label="Ready for delivery" value="9" detail="All evidence complete" />
        </section>

        <section className="content-grid">
          <div className="case-list-panel">
            <div className="panel-toolbar">
              <strong>Active queue</strong>
              <span>Updated just now</span>
            </div>
            <div className="case-list">
              {repairCases.map((repairCase) => (
                <CaseRow
                  key={repairCase.id}
                  repairCase={repairCase}
                  selected={repairCase.id === selected?.id}
                  onSelect={() => setSelectedId(repairCase.id)}
                />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selected && (
              <motion.aside
                className="inspector"
                key={selected.id}
                initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: -8 }}
                transition={{ duration: motionTokens.panelMs / 1000 }}
              >
                <span className={`status status-${selected.status}`}>{selected.status}</span>
                <h2>{selected.device.model}</h2>
                <p className="reference">{selected.reference}</p>
                <dl>
                  <div>
                    <dt>Customer</dt>
                    <dd>{selected.customerDisplayName}</dd>
                  </div>
                  <div>
                    <dt>Device</dt>
                    <dd>
                      {selected.device.manufacturer} {selected.device.model}
                    </dd>
                  </div>
                  <div>
                    <dt>Serial</dt>
                    <dd>{selected.device.serialNumberMasked}</dd>
                  </div>
                  <div>
                    <dt>Priority</dt>
                    <dd>{selected.priority}</dd>
                  </div>
                </dl>
                <div className="inspector-note">
                  <span>Reported fault</span>
                  <p>
                    Generated demonstration case. Diagnostic notes and evidence will be connected in
                    Phase 2.
                  </p>
                </div>
                <button className="primary-button full-width">Open repair case</button>
              </motion.aside>
            )}
          </AnimatePresence>
        </section>
      </main>
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
    <button className={selected ? 'case-row selected' : 'case-row'} onClick={onSelect}>
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

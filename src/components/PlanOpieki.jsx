import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import api from '../api/axios';
import { useNotification } from './Notification';
import { ICNP_DIAGNOZY } from './icnpTerms';

// ─── Styled components ───────────────────────────────────────────────────────

const Wrap = styled.div`
  padding: 24px;
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
`;

const PageTitle = styled.h2`
  font-size: 1.35rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
`;

const PatientName = styled.span`
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
`;

const AddBtn = styled.button`
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #1d4ed8; }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-size: 1rem;
`;

// ─── Table ────────────────────────────────────────────────────────────────────

const TableWrap = styled.div`
  overflow-x: auto;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  min-width: 700px;

  th {
    background: #f8f9fa;
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 0.82rem;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e9ecef;
    white-space: nowrap;
  }

  td {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.9rem;
    vertical-align: middle;
  }

  tbody tr:hover {
    background: #f0f7fb;
  }
`;

const IcnpBadge = styled.span`
  display: inline-block;
  margin-left: 6px;
  font-size: 0.68rem;
  padding: 1px 6px;
  border-radius: 20px;
  background: ${({ $valid }) => ($valid ? '#dcfce7' : '#fef9c3')};
  color: ${({ $valid }) => ($valid ? '#166534' : '#854d0e')};
  font-weight: 600;
  vertical-align: middle;
`;

const OcenaBadge = styled.span`
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  background: ${({ $ocena }) =>
    $ocena === 'wykonano' ? '#d1fae5' :
    $ocena === 'w trakcie' ? '#fef3c7' :
    $ocena === 'nie wykonano' ? '#fee2e2' : '#f3f4f6'};
  color: ${({ $ocena }) =>
    $ocena === 'wykonano' ? '#065f46' :
    $ocena === 'w trakcie' ? '#92400e' :
    $ocena === 'nie wykonano' ? '#991b1b' : '#374151'};
`;

const Actions = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: nowrap;
`;

const ActionBtn = styled.button`
  background: none;
  border: 1.5px solid ${({ $danger }) => ($danger ? '#fca5a5' : '#d1d5db')};
  color: ${({ $danger }) => ($danger ? '#dc2626' : '#374151')};
  border-radius: 6px;
  padding: 4px 12px;
  font-size: 0.78rem;
  cursor: pointer;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.15s;
  &:hover {
    background: ${({ $danger }) => ($danger ? '#fee2e2' : '#f3f4f6')};
    border-color: ${({ $danger }) => ($danger ? '#dc2626' : '#9ca3af')};
  }
`;

// ─── Modal ────────────────────────────────────────────────────────────────────

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const Modal = styled.div`
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 550px;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 1.4rem;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
  padding: 2px 6px;
  &:hover { color: #111; }
`;

const ModalBody = styled.div`
  padding: 20px 24px;
  display: grid;
  gap: 18px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FormLabel = styled.label`
  font-size: 0.82rem;
  font-weight: 700;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

const Required = styled.span`
  color: #ef4444;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
`;

const SaveBtn = styled.button`
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #1d4ed8; }
  &:disabled { background: #93c5fd; cursor: not-allowed; }
`;

const CancelBtn = styled.button`
  background: none;
  border: 1.5px solid #d1d5db;
  color: #374151;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #f3f4f6; }
`;

// ─── Autocomplete ─────────────────────────────────────────────────────────────

const AcWrap = styled.div`
  position: relative;
`;

const AcInput = styled.input`
  width: 100%;
  padding: 9px 12px;
  border: 2px solid ${({ $invalid }) => ($invalid ? '#fbbf24' : '#e0e0e0')};
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s;
  &:focus { border-color: ${({ $invalid }) => ($invalid ? '#f59e0b' : '#2563eb')}; }
`;

const AcDropdown = styled.ul`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 100;
  margin: 0;
  padding: 4px 0;
  list-style: none;
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
`;

const AcItem = styled.li`
  padding: 8px 14px;
  font-size: 0.88rem;
  cursor: pointer;
  color: #111827;
  &:hover, &[data-active='true'] { background: #eff6ff; color: #1d4ed8; }
`;

const AcHint = styled.div`
  margin-top: 4px;
  font-size: 0.76rem;
  color: ${({ $valid }) => ($valid ? '#16a34a' : '#d97706')};
  font-weight: 500;
`;

// ─── Autocomplete component ───────────────────────────────────────────────────

function Autocomplete({ list, value, onChange, placeholder, required }) {
  const [inputVal, setInputVal] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef(null);

  const filtered = inputVal.trim().length >= 1
    ? list.filter((t) => t.toLowerCase().includes(inputVal.toLowerCase())).slice(0, 30)
    : [];

  const isValid = list.some((t) => t.toLowerCase() === inputVal.trim().toLowerCase());

  useEffect(() => { setInputVal(value || ''); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (e) => {
    const v = e.target.value;
    setInputVal(v);
    onChange(v);
    setOpen(true);
    setActiveIdx(-1);
  };

  const handleSelect = (term) => {
    setInputVal(term);
    onChange(term);
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKey = (e) => {
    if (!open || filtered.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(filtered[activeIdx]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const showHint = inputVal.trim().length > 0;

  return (
    <AcWrap ref={wrapRef}>
      <AcInput
        value={inputVal}
        onChange={handleChange}
        onFocus={() => inputVal.length >= 1 && setOpen(true)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        required={required}
        $invalid={showHint && !isValid}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <AcDropdown>
          {filtered.map((t, i) => (
            <AcItem key={t} data-active={i === activeIdx} onMouseDown={() => handleSelect(t)}>
              {t}
            </AcItem>
          ))}
        </AcDropdown>
      )}
      {showHint && (
        <AcHint $valid={isValid}>
          {isValid ? '✓ Termin ICNP 2017' : '⚠ Termin spoza listy ICNP — sprawdź klasyfikację'}
        </AcHint>
      )}
    </AcWrap>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const EMPTY_FORM = { problem: '', diagnoza: '' };

const OCENA_LABELS = {
  'nie oceniono': 'Nie oceniono',
  'wykonano': 'Wykonano',
  'w trakcie': 'W trakcie',
  'nie wykonano': 'Nie wykonano',
};

export default function PlanOpieki({ patient }) {
  const notify = useNotification();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchEntries = useCallback(async () => {
    if (!patient?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/plan-opieki/patient/${patient.id}`);
      setEntries(res.data);
    } catch (err) {
      console.error('Błąd pobierania planu opieki:', err);
      notify('Błąd ładowania planu opieki', 'error');
    } finally {
      setLoading(false);
    }
  }, [patient?.id]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!form.problem.trim() || !form.diagnoza.trim()) {
      notify('Problem i diagnoza są wymagane', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post('/plan-opieki', { ...form, patient_id: patient.id });
      notify('Wpis dodany do planu opieki', 'success');
      closeModal();
      fetchEntries();
    } catch (err) {
      console.error('Błąd zapisu wpisu:', err);
      notify('Błąd zapisu wpisu', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/plan-opieki/${id}`);
      notify('Wpis usunięty', 'success');
      setConfirmDelete(null);
      fetchEntries();
    } catch (err) {
      console.error('Błąd usuwania wpisu:', err);
      notify('Błąd usuwania wpisu', 'error');
    }
  };

  const setField = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  if (!patient) return null;

  return (
    <Wrap>
      <PageHeader>
        <div>
          <PageTitle>Plan Opieki Pielęgniarskiej</PageTitle>
          <PatientName>{patient.imie} {patient.nazwisko}</PatientName>
        </div>
        <AddBtn onClick={openAdd}>+ Nowy wpis</AddBtn>
      </PageHeader>

      {loading ? (
        <EmptyState>Ładowanie planu opieki…</EmptyState>
      ) : entries.length === 0 ? (
        <EmptyState>
          Brak wpisów w planie opieki.<br />
          Kliknij „+ Nowy wpis" aby dodać pierwszą diagnozę pielęgniarską.
        </EmptyState>
      ) : (
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <th>Lp.</th>
                <th>Problem</th>
                <th>Diagnoza</th>
                <th>Ocena</th>
                <th>Data</th>
                <th>Autor</th>
                <th>Akcje</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const problemValid = ICNP_DIAGNOZY.some((t) => t.toLowerCase() === (entry.problem || '').toLowerCase());
                const diagnozaValid = ICNP_DIAGNOZY.some((t) => t.toLowerCase() === (entry.diagnoza || '').toLowerCase());
                return (
                  <tr key={entry.id}>
                    <td>{idx + 1}</td>
                    <td>
                      {entry.problem}
                      <IcnpBadge $valid={problemValid}>{problemValid ? 'ICNP' : '!'}</IcnpBadge>
                    </td>
                    <td>
                      {entry.diagnoza}
                      <IcnpBadge $valid={diagnozaValid}>{diagnozaValid ? 'ICNP' : '!'}</IcnpBadge>
                    </td>
                    <td>
                      <OcenaBadge $ocena={entry.ocena}>{OCENA_LABELS[entry.ocena] || entry.ocena}</OcenaBadge>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: '#6b7280' }}>
                      {entry.data_realizacji || '—'}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: '#6b7280' }}>
                      {entry.autor ? `${entry.autor.imie} ${entry.autor.nazwisko}` : '—'}
                    </td>
                    <td>
                      <Actions>
                        <ActionBtn $danger onClick={() => setConfirmDelete(entry.id)}>Usuń</ActionBtn>
                      </Actions>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        </TableWrap>
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <Overlay onClick={() => setConfirmDelete(null)}>
          <Modal style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Potwierdź usunięcie</ModalTitle>
              <CloseBtn onClick={() => setConfirmDelete(null)}>×</CloseBtn>
            </ModalHeader>
            <ModalBody>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151' }}>
                Czy na pewno chcesz usunąć ten wpis z planu opieki? Operacja jest nieodwracalna.
              </p>
            </ModalBody>
            <ModalFooter>
              <CancelBtn onClick={() => setConfirmDelete(null)}>Anuluj</CancelBtn>
              <SaveBtn style={{ background: '#dc2626' }} onClick={() => handleDelete(confirmDelete)}>
                Usuń
              </SaveBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}

      {/* Add modal — only Problem + Diagnoza */}
      {showModal && (
        <Overlay onClick={closeModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Nowy wpis planu opieki</ModalTitle>
              <CloseBtn onClick={closeModal}>×</CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>
                  Problem pielęgniarski <Required>*</Required>
                </FormLabel>
                <Autocomplete
                  list={ICNP_DIAGNOZY}
                  value={form.problem}
                  onChange={(v) => setField('problem', v)}
                  placeholder="Np. Ból ostry, Ryzyko zakażenia…"
                  required
                />
              </FormGroup>

              <FormGroup>
                <FormLabel>
                  Diagnoza pielęgniarska (ICNP) <Required>*</Required>
                </FormLabel>
                <Autocomplete
                  list={ICNP_DIAGNOZY}
                  value={form.diagnoza}
                  onChange={(v) => setField('diagnoza', v)}
                  placeholder="Np. Ból ostry, Deficyt samoopieki w zakresie higieny…"
                  required
                />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <CancelBtn onClick={closeModal}>Anuluj</CancelBtn>
              <SaveBtn onClick={handleSave} disabled={saving}>
                {saving ? 'Zapisywanie…' : 'Dodaj do planu'}
              </SaveBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}
    </Wrap>
  );
}

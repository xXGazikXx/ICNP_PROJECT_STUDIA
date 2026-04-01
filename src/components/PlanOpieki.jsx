import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import api from '../api/axios';
import { useNotification } from './Notification';
import { ICNP_DIAGNOZY, ICNP_INTERWENCJE } from './icnpTerms';

/* ═══════════════════════════════════════════════════════════════════════════
   Styled components
   ═══════════════════════════════════════════════════════════════════════════ */

const Wrap = styled.div`
  padding: 24px;
`;

const PageHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
`;

const PageTitle = styled.h2`
  font-size: 1.35rem; font-weight: 700; color: #1a1a2e; margin: 0;
`;

const PatientName = styled.span`
  font-size: 0.9rem; color: #666; font-weight: 500;
`;

const PrimaryBtn = styled.button`
  background: #2563eb; color: #fff; border: none; border-radius: 8px;
  padding: 10px 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #1d4ed8; }
  &:disabled { background: #93c5fd; cursor: not-allowed; }
`;

const EmptyState = styled.div`
  text-align: center; padding: 60px 20px; color: #9ca3af; font-size: 1rem;
`;

/* ─── Main 3-column table ──────────────────────────────────────────────── */

const TableWrap = styled.div`
  border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden; background: #fff;
`;

const MainTable = styled.table`
  width: 100%; border-collapse: collapse;

  th {
    background: #f8f9fa; padding: 14px 18px; text-align: left;
    font-weight: 700; font-size: 0.85rem; color: #555;
    text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 2px solid #e0e0e0;
  }

  td {
    padding: 0; border-bottom: 2px solid #e9ecef;
    vertical-align: top; font-size: 0.9rem;
  }
`;

const CellPad = styled.div`
  padding: 16px 18px;
`;

const IcnpBadge = styled.span`
  display: inline-block; margin-left: 6px; font-size: 0.66rem;
  padding: 1px 6px; border-radius: 20px;
  background: ${({ $valid }) => ($valid ? '#dcfce7' : '#fef9c3')};
  color: ${({ $valid }) => ($valid ? '#166534' : '#854d0e')};
  font-weight: 600; vertical-align: middle;
`;

const CellLabel = styled.div`
  font-size: 0.92rem; color: #111827; line-height: 1.5;
`;

/* ─── Interwencje subtable inside td ────────────────────────────────────── */

const IntSubTable = styled.table`
  width: 100%; border-collapse: collapse;

  th {
    background: #f0f4f8; padding: 8px 12px; text-align: left;
    font-weight: 600; font-size: 0.75rem; color: #555;
    text-transform: uppercase; letter-spacing: 0.3px;
    border-bottom: 1.5px solid #e0e0e0;
  }

  td {
    padding: 8px 12px; border-bottom: 1px solid #f0f0f0;
    font-size: 0.84rem; color: #374151; vertical-align: middle;
  }

  tbody tr:hover { background: #f8fafc; }
`;

const IntActions = styled.div`
  display: flex; gap: 4px; justify-content: center;
`;

const SmallBtn = styled.button`
  background: none; border: none; color: #9ca3af; font-size: 1rem;
  cursor: pointer; padding: 0 2px; line-height: 1;
  &:hover { color: #dc2626; }
`;

const AddRowBtn = styled.button`
  display: block; width: 100%; padding: 10px; border: 2px dashed #93c5fd;
  background: #f8faff; color: #2563eb; font-size: 0.85rem; font-weight: 600;
  border-radius: 0; cursor: pointer; transition: background 0.15s;
  &:hover { background: #eff6ff; }
`;

const DeleteEntryBtn = styled.button`
  background: none; border: 1.5px solid #fca5a5; color: #dc2626;
  border-radius: 6px; padding: 5px 14px; font-size: 0.78rem;
  cursor: pointer; font-weight: 500; white-space: nowrap; margin-top: 8px;
  transition: all 0.15s;
  &:hover { background: #fee2e2; border-color: #dc2626; }
`;

/* ─── Modal (shared) ───────────────────────────────────────────────────── */

const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
`;

const Modal = styled.div`
  background: #fff; border-radius: 16px; width: 100%;
  max-width: ${({ $wide }) => ($wide ? '750px' : '550px')};
  max-height: 92vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
`;

const ModalHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid #e5e7eb;
`;

const ModalTitle = styled.h3`
  font-size: 1.1rem; font-weight: 700; color: #1a1a2e; margin: 0;
`;

const CloseBtn = styled.button`
  background: none; border: none; font-size: 1.4rem; color: #6b7280;
  cursor: pointer; line-height: 1; padding: 2px 6px;
  &:hover { color: #111; }
`;

const ModalBody = styled.div`
  padding: 20px 24px; display: grid; gap: 18px;
`;

const ModalFooter = styled.div`
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid #e5e7eb;
`;

const CancelBtn = styled.button`
  background: none; border: 1.5px solid #d1d5db; color: #374151;
  border-radius: 8px; padding: 10px 24px; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; &:hover { background: #f3f4f6; }
`;

const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 6px;
`;

const FormLabel = styled.label`
  font-size: 0.82rem; font-weight: 700; color: #374151;
  text-transform: uppercase; letter-spacing: 0.04em;
`;

const Required = styled.span` color: #ef4444; `;

const FormInput = styled.input`
  width: 100%; padding: 9px 12px; border: 2px solid #e0e0e0;
  border-radius: 8px; font-size: 0.9rem; font-family: inherit;
  outline: none; box-sizing: border-box;
  &:focus { border-color: #2563eb; }
`;

const FormRow = styled.div`
  display: grid; grid-template-columns: ${({ $cols }) => $cols || '1fr 1fr'};
  gap: 14px;
`;

/* ─── Autocomplete ─────────────────────────────────────────────────────── */

const AcWrap = styled.div` position: relative; `;

const AcInput = styled.input`
  width: 100%; padding: 9px 12px;
  border: 2px solid ${({ $invalid }) => ($invalid ? '#fbbf24' : '#e0e0e0')};
  border-radius: 8px; font-size: 0.9rem; font-family: inherit;
  outline: none; box-sizing: border-box; transition: border-color 0.2s;
  &:focus { border-color: ${({ $invalid }) => ($invalid ? '#f59e0b' : '#2563eb')}; }
`;

const AcDropdown = styled.ul`
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: #fff; border: 1.5px solid #d1d5db; border-radius: 8px;
  max-height: 200px; overflow-y: auto; z-index: 100;
  margin: 0; padding: 4px 0; list-style: none;
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
`;

const AcItem = styled.li`
  padding: 8px 14px; font-size: 0.88rem; cursor: pointer; color: #111827;
  &:hover, &[data-active='true'] { background: #eff6ff; color: #1d4ed8; }
`;

const AcHint = styled.div`
  margin-top: 4px; font-size: 0.76rem;
  color: ${({ $valid }) => ($valid ? '#16a34a' : '#d97706')};
  font-weight: 500;
`;

/* ═══════════════════════════════════════════════════════════════════════════
   Autocomplete component
   ═══════════════════════════════════════════════════════════════════════════ */

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

  const handleChange = (e) => { setInputVal(e.target.value); onChange(e.target.value); setOpen(true); setActiveIdx(-1); };
  const handleSelect = (t) => { setInputVal(t); onChange(t); setOpen(false); setActiveIdx(-1); };
  const handleKey = (e) => {
    if (!open || !filtered.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(filtered[activeIdx]); }
    else if (e.key === 'Escape') setOpen(false);
  };

  const showHint = inputVal.trim().length > 0;

  return (
    <AcWrap ref={wrapRef}>
      <AcInput value={inputVal} onChange={handleChange}
        onFocus={() => inputVal.length >= 1 && setOpen(true)}
        onKeyDown={handleKey} placeholder={placeholder} required={required}
        $invalid={showHint && !isValid} autoComplete="off" />
      {open && filtered.length > 0 && (
        <AcDropdown>
          {filtered.map((t, i) => (
            <AcItem key={t} data-active={i === activeIdx} onMouseDown={() => handleSelect(t)}>{t}</AcItem>
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

/* ═══════════════════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════════════════ */

const EMPTY_FORM = { problem: '', diagnoza: '' };
const EMPTY_INT = { interwencja: '', data_rozpoczecia: '', godzina: '', interwal: '', ilosc_powtorzen: '' };

export default function PlanOpieki({ patient }) {
  const notify = useNotification();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // new-entry modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // interwencje modal
  const [intModalEntry, setIntModalEntry] = useState(null); // entry id
  const [intForm, setIntForm] = useState(EMPTY_INT);
  const [intSaving, setIntSaving] = useState(false);

  // confirm delete
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
    } finally { setLoading(false); }
  }, [patient?.id]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  /* ─── New entry ──────────────────────────────────────────────────────── */

  const openAdd = () => { setForm(EMPTY_FORM); setShowAddModal(true); };
  const closeAdd = () => { setShowAddModal(false); setForm(EMPTY_FORM); };

  const handleAddEntry = async () => {
    if (!form.problem.trim() || !form.diagnoza.trim()) {
      notify('Problem i diagnoza są wymagane', 'error'); return;
    }
    setSaving(true);
    try {
      await api.post('/plan-opieki', { ...form, interwencje: [], patient_id: patient.id });
      notify('Wpis dodany do planu opieki', 'success');
      closeAdd();
      fetchEntries();
    } catch (err) {
      console.error(err); notify('Błąd zapisu wpisu', 'error');
    } finally { setSaving(false); }
  };

  /* ─── Add interwencja ────────────────────────────────────────────────── */

  const openIntModal = (entryId) => { setIntModalEntry(entryId); setIntForm(EMPTY_INT); };
  const closeIntModal = () => { setIntModalEntry(null); setIntForm(EMPTY_INT); };

  const handleAddInt = async () => {
    if (!intForm.interwencja.trim()) { notify('Nazwa interwencji jest wymagana', 'error'); return; }
    setIntSaving(true);
    try {
      const entry = entries.find((e) => e.id === intModalEntry);
      const current = Array.isArray(entry.interwencje) ? entry.interwencje : [];
      const updated = [...current, { ...intForm }];
      await api.put(`/plan-opieki/${intModalEntry}`, { interwencje: updated });
      notify('Interwencja dodana', 'success');
      closeIntModal();
      fetchEntries();
    } catch (err) {
      console.error(err); notify('Błąd dodawania interwencji', 'error');
    } finally { setIntSaving(false); }
  };

  const removeInt = async (entryId, intIdx) => {
    try {
      const entry = entries.find((e) => e.id === entryId);
      const current = Array.isArray(entry.interwencje) ? [...entry.interwencje] : [];
      current.splice(intIdx, 1);
      await api.put(`/plan-opieki/${entryId}`, { interwencje: current });
      notify('Interwencja usunięta', 'success');
      fetchEntries();
    } catch (err) {
      console.error(err); notify('Błąd usuwania interwencji', 'error');
    }
  };

  /* ─── Delete entry ───────────────────────────────────────────────────── */

  const handleDeleteEntry = async (id) => {
    try {
      await api.delete(`/plan-opieki/${id}`);
      notify('Wpis usunięty', 'success');
      setConfirmDelete(null);
      fetchEntries();
    } catch (err) {
      console.error(err); notify('Błąd usuwania wpisu', 'error');
    }
  };

  const setField = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const setIntField = (f, v) => setIntForm((s) => ({ ...s, [f]: v }));

  if (!patient) return null;

  return (
    <Wrap>
      <PageHeader>
        <div>
          <PageTitle>Plan Opieki Pielęgniarskiej</PageTitle>
          <PatientName>{patient.imie} {patient.nazwisko}</PatientName>
        </div>
        <PrimaryBtn onClick={openAdd}>+ Nowy wpis</PrimaryBtn>
      </PageHeader>

      {loading ? (
        <EmptyState>Ładowanie planu opieki…</EmptyState>
      ) : entries.length === 0 ? (
        <EmptyState>Brak wpisów w planie opieki.<br />Kliknij „+ Nowy wpis" aby dodać pierwszą diagnozę.</EmptyState>
      ) : (
        <TableWrap>
          <MainTable>
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Problem</th>
                <th style={{ width: '25%' }}>Diagnoza</th>
                <th>Interwencje</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const ints = Array.isArray(entry.interwencje) ? entry.interwencje : [];
                const probValid = ICNP_DIAGNOZY.some((t) => t.toLowerCase() === (entry.problem || '').toLowerCase());
                const diagValid = ICNP_DIAGNOZY.some((t) => t.toLowerCase() === (entry.diagnoza || '').toLowerCase());

                return (
                  <tr key={entry.id}>
                    {/* Problem */}
                    <td>
                      <CellPad>
                        <CellLabel>
                          {entry.problem}
                          <IcnpBadge $valid={probValid}>{probValid ? 'ICNP' : '!'}</IcnpBadge>
                        </CellLabel>
                        <DeleteEntryBtn onClick={() => setConfirmDelete(entry.id)}>Usuń wpis</DeleteEntryBtn>
                      </CellPad>
                    </td>

                    {/* Diagnoza */}
                    <td>
                      <CellPad>
                        <CellLabel>
                          {entry.diagnoza}
                          <IcnpBadge $valid={diagValid}>{diagValid ? 'ICNP' : '!'}</IcnpBadge>
                        </CellLabel>
                      </CellPad>
                    </td>

                    {/* Interwencje */}
                    <td>
                      {ints.length > 0 && (
                        <IntSubTable>
                          <thead>
                            <tr>
                              <th>Interwencja</th>
                              <th>Data</th>
                              <th>Godzina</th>
                              <th>Interwał</th>
                              <th>Powtórzeń</th>
                              <th style={{ width: 40 }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {ints.map((int, i) => {
                              const name = typeof int === 'string' ? int : int.interwencja;
                              const intValid = ICNP_INTERWENCJE.some((t) => t.toLowerCase() === (name || '').toLowerCase());
                              return (
                                <tr key={i}>
                                  <td>
                                    {name}
                                    <IcnpBadge $valid={intValid}>{intValid ? 'ICNP' : '!'}</IcnpBadge>
                                  </td>
                                  <td>{(typeof int === 'object' && int.data_rozpoczecia) || '—'}</td>
                                  <td>{(typeof int === 'object' && int.godzina) || '—'}</td>
                                  <td>{(typeof int === 'object' && int.interwal) || '—'}</td>
                                  <td>{(typeof int === 'object' && int.ilosc_powtorzen) || '—'}</td>
                                  <td>
                                    <IntActions>
                                      <SmallBtn title="Usuń" onClick={() => removeInt(entry.id, i)}>×</SmallBtn>
                                    </IntActions>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </IntSubTable>
                      )}
                      <AddRowBtn onClick={() => openIntModal(entry.id)}>+ Dodaj interwencję</AddRowBtn>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </MainTable>
        </TableWrap>
      )}

      {/* ── Confirm delete ─────────────────────────────────────────────── */}
      {confirmDelete && (
        <Overlay onClick={() => setConfirmDelete(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
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
              <PrimaryBtn style={{ background: '#dc2626' }} onClick={() => handleDeleteEntry(confirmDelete)}>Usuń</PrimaryBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}

      {/* ── New entry modal (Problem + Diagnoza) ──────────────────────── */}
      {showAddModal && (
        <Overlay onClick={closeAdd}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Nowy wpis planu opieki</ModalTitle>
              <CloseBtn onClick={closeAdd}>×</CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>Problem pielęgniarski <Required>*</Required></FormLabel>
                <Autocomplete list={ICNP_DIAGNOZY} value={form.problem}
                  onChange={(v) => setField('problem', v)}
                  placeholder="Np. Ból ostry, Ryzyko zakażenia…" required />
              </FormGroup>
              <FormGroup>
                <FormLabel>Diagnoza pielęgniarska (ICNP) <Required>*</Required></FormLabel>
                <Autocomplete list={ICNP_DIAGNOZY} value={form.diagnoza}
                  onChange={(v) => setField('diagnoza', v)}
                  placeholder="Np. Ból ostry, Deficyt samoopieki…" required />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <CancelBtn onClick={closeAdd}>Anuluj</CancelBtn>
              <PrimaryBtn onClick={handleAddEntry} disabled={saving}>
                {saving ? 'Zapisywanie…' : 'Dodaj do planu'}
              </PrimaryBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}

      {/* ── Interwencja modal ─────────────────────────────────────────── */}
      {intModalEntry && (
        <Overlay onClick={closeIntModal}>
          <Modal $wide onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Dodaj interwencję</ModalTitle>
              <CloseBtn onClick={closeIntModal}>×</CloseBtn>
            </ModalHeader>
            <ModalBody>
              <FormGroup>
                <FormLabel>Interwencja (ICNP) <Required>*</Required></FormLabel>
                <Autocomplete list={ICNP_INTERWENCJE} value={intForm.interwencja}
                  onChange={(v) => setIntField('interwencja', v)}
                  placeholder="Np. Ocena bólu, Podawanie leków…" required />
              </FormGroup>

              <FormRow $cols="1fr 1fr">
                <FormGroup>
                  <FormLabel>Data rozpoczęcia</FormLabel>
                  <FormInput type="date" value={intForm.data_rozpoczecia}
                    onChange={(e) => setIntField('data_rozpoczecia', e.target.value)} />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Godzina rozpoczęcia</FormLabel>
                  <FormInput type="time" value={intForm.godzina}
                    onChange={(e) => setIntField('godzina', e.target.value)} />
                </FormGroup>
              </FormRow>

              <FormRow $cols="1fr 1fr">
                <FormGroup>
                  <FormLabel>Interwał</FormLabel>
                  <FormInput type="text" value={intForm.interwal}
                    onChange={(e) => setIntField('interwal', e.target.value)}
                    placeholder="Np. co 4h, co 8h, jednorazowo…" />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Ilość powtórzeń</FormLabel>
                  <FormInput type="text" value={intForm.ilosc_powtorzen}
                    onChange={(e) => setIntField('ilosc_powtorzen', e.target.value)}
                    placeholder="Np. 3, ciągle…" />
                </FormGroup>
              </FormRow>
            </ModalBody>
            <ModalFooter>
              <CancelBtn onClick={closeIntModal}>Anuluj</CancelBtn>
              <PrimaryBtn onClick={handleAddInt} disabled={intSaving}>
                {intSaving ? 'Zapisywanie…' : 'Dodaj interwencję'}
              </PrimaryBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}
    </Wrap>
  );
}

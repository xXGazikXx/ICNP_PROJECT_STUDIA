import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import api from '../api/axios';
import { useNotification } from './Notification';
import { ICNP_DIAGNOZY, ICNP_INTERWENCJE } from './icnpTerms';

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function icnpCode(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h) + name.charCodeAt(i);
    h |= 0;
  }
  return '10' + String(Math.abs(h) % 1000000).padStart(6, '0');
}

function formatWithCode(name, list) {
  const valid = list.some((t) => t.toLowerCase() === (name || '').toLowerCase());
  if (!valid) return name;
  return `${name} [${icnpCode(name)}]`;
}

function generateSlots(int) {
  if (!int.data_rozpoczecia || !int.godzina || !int.interwal || !int.ilosc_powtorzen) return [];
  const [y, m, d] = int.data_rozpoczecia.split('-').map(Number);
  const [hh, mm] = int.godzina.split(':').map(Number);
  const intervalMin = parseInt(int.interwal, 10);
  const count = parseInt(int.ilosc_powtorzen, 10);
  if (!intervalMin || !count || count < 1 || isNaN(hh)) return [];
  const slots = [];
  const start = new Date(y, m - 1, d, hh, mm);
  for (let i = 0; i < count; i++) {
    const t = new Date(start.getTime() + i * intervalMin * 60000);
    const mo = String(t.getMonth() + 1).padStart(2, '0');
    const dd = String(t.getDate()).padStart(2, '0');
    const hr = String(t.getHours()).padStart(2, '0');
    const mn = String(t.getMinutes()).padStart(2, '0');
    slots.push({ date: `${t.getFullYear()}-${mo}-${dd}`, time: `${hr}:${mn}` });
  }
  return slots;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Styled
   ═══════════════════════════════════════════════════════════════════════════ */

const Wrap = styled.div` padding: 24px; `;

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

/* ─── Main table ───────────────────────────────────────────────────────── */

const TableWrap = styled.div`
  border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden; background: #fff;
`;

const MainTable = styled.table`
  width: 100%; border-collapse: collapse;

  th {
    background: #f8f9fa; padding: 14px 18px; text-align: center;
    font-weight: 700; font-size: 0.85rem; color: #555;
    text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 2px solid #e0e0e0;
  }

  > tbody > tr > td {
    padding: 0; border-bottom: 2px solid #e9ecef;
    vertical-align: top; text-align: center;
  }
`;

const CellContent = styled.div`
  padding: 16px 18px; cursor: pointer; position: relative;
  transition: background 0.15s;
  &:hover { background: #f0f7fb; }
`;

const CellText = styled.div`
  font-size: 0.92rem; color: #111827; line-height: 1.6;
`;

const IcnpCode = styled.span`
  color: #6b7280; font-size: 0.78rem; font-weight: 500;
`;

/* ─── Action bar (edit/delete on click) ─────────────────────────────── */

const ActionBar = styled.div`
  display: flex; gap: 8px; justify-content: center; margin-top: 10px;
  animation: fadeIn 0.15s ease;
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
`;

const ActionBtn = styled.button`
  padding: 5px 14px; border-radius: 6px; font-size: 0.78rem;
  font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.15s;
  background: ${({ $danger }) => ($danger ? '#fee2e2' : '#eff6ff')};
  border: 1.5px solid ${({ $danger }) => ($danger ? '#fca5a5' : '#93c5fd')};
  color: ${({ $danger }) => ($danger ? '#dc2626' : '#2563eb')};
  &:hover {
    background: ${({ $danger }) => ($danger ? '#fecaca' : '#dbeafe')};
  }
`;

/* ─── Interwencje inside cell ──────────────────────────────────────────── */

const IntSection = styled.div`
  border-left: 2px solid #e5e7eb;
`;

const IntBlock = styled.div`
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer; transition: background 0.15s;
  &:hover { background: #f8fafc; }
  &:last-of-type { border-bottom: none; }
`;

const IntRow = styled.div`
  display: flex; align-items: stretch; min-height: 52px;
`;

const IntName = styled.div`
  min-width: 220px; max-width: 280px; padding: 10px 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.84rem; color: #111827; text-align: center;
  border-right: 1px solid #f0f0f0; flex-shrink: 0;
`;

const IntSubLabel = styled.span`
  display: block; font-size: 0.72rem; color: #9ca3af; margin-top: 2px;
`;

const SlotsWrap = styled.div`
  display: flex; flex: 1; overflow-x: auto;
`;

const SlotCol = styled.div`
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-width: 90px; padding: 6px 8px;
  border-right: 1px solid #f5f5f5;
`;

const SlotDate = styled.div`
  font-size: 0.68rem; color: #6b7280; white-space: nowrap;
`;

const SlotTime = styled.div`
  font-size: 0.72rem; color: #374151; font-weight: 600; white-space: nowrap;
`;

const SlotCheck = styled.input.attrs({ type: 'checkbox' })`
  width: 18px; height: 18px; margin-top: 3px; cursor: pointer;
  accent-color: #2563eb;
`;

const NoSlots = styled.div`
  flex: 1; display: flex; align-items: center; justify-content: center;
  padding: 10px; font-size: 0.78rem; color: #9ca3af; font-style: italic;
`;

const AddIntBtn = styled.button`
  display: block; width: 100%; padding: 12px; border: 2px dashed #93c5fd;
  background: #f8faff; color: #2563eb; font-size: 0.85rem; font-weight: 600;
  cursor: pointer; transition: background 0.15s; text-align: center;
  &:hover { background: #eff6ff; }
`;

/* ─── Modal ────────────────────────────────────────────────────────────── */

const Overlay = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
`;
const Modal = styled.div`
  background: #fff; border-radius: 16px; width: 100%;
  max-width: ${({ $wide }) => ($wide ? '700px' : '550px')};
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
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 6px; `;
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
  display: grid; grid-template-columns: ${({ $cols }) => $cols || '1fr 1fr'}; gap: 14px;
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
  color: ${({ $valid }) => ($valid ? '#16a34a' : '#d97706')}; font-weight: 500;
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
    ? list.filter((t) => t.toLowerCase().includes(inputVal.toLowerCase())).slice(0, 30) : [];
  const isValid = list.some((t) => t.toLowerCase() === inputVal.trim().toLowerCase());

  useEffect(() => { setInputVal(value || ''); }, [value]);
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
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

  return (
    <AcWrap ref={wrapRef}>
      <AcInput value={inputVal} onChange={handleChange}
        onFocus={() => inputVal.length >= 1 && setOpen(true)}
        onKeyDown={handleKey} placeholder={placeholder} required={required}
        $invalid={inputVal.trim().length > 0 && !isValid} autoComplete="off" />
      {open && filtered.length > 0 && (
        <AcDropdown>
          {filtered.map((t, i) => (
            <AcItem key={t} data-active={i === activeIdx} onMouseDown={() => handleSelect(t)}>{t}</AcItem>
          ))}
        </AcDropdown>
      )}
      {inputVal.trim().length > 0 && (
        <AcHint $valid={isValid}>
          {isValid ? `✓ ICNP [${icnpCode(inputVal.trim())}]` : '⚠ Termin spoza listy ICNP'}
        </AcHint>
      )}
    </AcWrap>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main component
   ═══════════════════════════════════════════════════════════════════════════ */

const EMPTY_FORM = { problem: '', diagnoza: '' };
const EMPTY_INT = { interwencja: '', data_rozpoczecia: '', godzina: '', interwal: '', ilosc_powtorzen: '', wykonane: [] };

export default function PlanOpieki({ patient }) {
  const notify = useNotification();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editEntryId, setEditEntryId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [intModal, setIntModal] = useState(null); // { entryId, editIdx? }
  const [intForm, setIntForm] = useState(EMPTY_INT);
  const [intSaving, setIntSaving] = useState(false);

  // selection for action bar
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [selectedInt, setSelectedInt] = useState(null); // { entryId, idx }

  // confirm delete
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteInt, setConfirmDeleteInt] = useState(null); // { entryId, idx }

  const fetchEntries = useCallback(async () => {
    if (!patient?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/plan-opieki/patient/${patient.id}`);
      setEntries(res.data);
    } catch (err) {
      console.error(err);
      notify('Błąd ładowania planu opieki', 'error');
    } finally { setLoading(false); }
  }, [patient?.id]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  // click outside closes action bars
  useEffect(() => {
    const handler = () => { setSelectedEntry(null); setSelectedInt(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ─── Entry CRUD ─────────────────────────────────────────────────────── */

  const openAddEntry = () => { setEditEntryId(null); setForm(EMPTY_FORM); setShowAddModal(true); };
  const openEditEntry = (entry) => {
    setEditEntryId(entry.id);
    setForm({ problem: entry.problem || '', diagnoza: entry.diagnoza || '' });
    setShowAddModal(true);
    setSelectedEntry(null);
  };
  const closeEntryModal = () => { setShowAddModal(false); setForm(EMPTY_FORM); setEditEntryId(null); };

  const handleSaveEntry = async () => {
    if (!form.problem.trim() || !form.diagnoza.trim()) {
      notify('Problem i diagnoza są wymagane', 'error'); return;
    }
    setSaving(true);
    try {
      if (editEntryId) {
        await api.put(`/plan-opieki/${editEntryId}`, form);
        notify('Wpis zaktualizowany', 'success');
      } else {
        await api.post('/plan-opieki', { ...form, interwencje: [], patient_id: patient.id });
        notify('Wpis dodany', 'success');
      }
      closeEntryModal(); fetchEntries();
    } catch (err) { console.error(err); notify('Błąd zapisu', 'error'); }
    finally { setSaving(false); }
  };

  const handleDeleteEntry = async (id) => {
    try {
      await api.delete(`/plan-opieki/${id}`);
      notify('Wpis usunięty', 'success');
      setConfirmDelete(null); setSelectedEntry(null); fetchEntries();
    } catch (err) { console.error(err); notify('Błąd usuwania', 'error'); }
  };

  /* ─── Interwencje CRUD ───────────────────────────────────────────────── */

  const openAddInt = (entryId) => {
    setIntModal({ entryId, editIdx: undefined });
    setIntForm(EMPTY_INT);
  };
  const openEditInt = (entryId, idx) => {
    const entry = entries.find((e) => e.id === entryId);
    const ints = Array.isArray(entry?.interwencje) ? entry.interwencje : [];
    const existing = ints[idx] || {};
    setIntModal({ entryId, editIdx: idx });
    setIntForm({
      interwencja: (typeof existing === 'string' ? existing : existing.interwencja) || '',
      data_rozpoczecia: existing.data_rozpoczecia || '',
      godzina: existing.godzina || '',
      interwal: existing.interwal || '',
      ilosc_powtorzen: existing.ilosc_powtorzen || '',
      wykonane: existing.wykonane || [],
    });
    setSelectedInt(null);
  };
  const closeIntModal = () => { setIntModal(null); setIntForm(EMPTY_INT); };

  const handleSaveInt = async () => {
    if (!intForm.interwencja.trim()) { notify('Nazwa interwencji jest wymagana', 'error'); return; }
    setIntSaving(true);
    try {
      const entry = entries.find((e) => e.id === intModal.entryId);
      const current = Array.isArray(entry?.interwencje) ? [...entry.interwencje] : [];

      // ensure wykonane array matches slot count
      const count = parseInt(intForm.ilosc_powtorzen, 10) || 0;
      const wykonane = Array.isArray(intForm.wykonane) ? intForm.wykonane : [];
      const padded = Array.from({ length: count }, (_, i) => wykonane[i] || false);
      const newInt = { ...intForm, wykonane: padded };

      if (intModal.editIdx !== undefined) {
        current[intModal.editIdx] = newInt;
      } else {
        current.push(newInt);
      }
      await api.put(`/plan-opieki/${intModal.entryId}`, { interwencje: current });
      notify(intModal.editIdx !== undefined ? 'Interwencja zaktualizowana' : 'Interwencja dodana', 'success');
      closeIntModal(); fetchEntries();
    } catch (err) { console.error(err); notify('Błąd zapisu interwencji', 'error'); }
    finally { setIntSaving(false); }
  };

  const handleDeleteInt = async (entryId, idx) => {
    try {
      const entry = entries.find((e) => e.id === entryId);
      const current = Array.isArray(entry?.interwencje) ? [...entry.interwencje] : [];
      current.splice(idx, 1);
      await api.put(`/plan-opieki/${entryId}`, { interwencje: current });
      notify('Interwencja usunięta', 'success');
      setConfirmDeleteInt(null); setSelectedInt(null); fetchEntries();
    } catch (err) { console.error(err); notify('Błąd usuwania', 'error'); }
  };

  /* ─── Toggle checkbox (wykonane) ─────────────────────────────────────── */

  const toggleSlot = async (entryId, intIdx, slotIdx) => {
    try {
      const entry = entries.find((e) => e.id === entryId);
      const current = Array.isArray(entry?.interwencje) ? [...entry.interwencje] : [];
      const int = { ...current[intIdx] };
      const wykonane = Array.isArray(int.wykonane) ? [...int.wykonane] : [];
      wykonane[slotIdx] = !wykonane[slotIdx];
      int.wykonane = wykonane;
      current[intIdx] = int;
      await api.put(`/plan-opieki/${entryId}`, { interwencje: current });
      fetchEntries();
    } catch (err) { console.error(err); }
  };

  const setField = (f, v) => setForm((s) => ({ ...s, [f]: v }));
  const setIntField = (f, v) => setIntForm((s) => ({ ...s, [f]: v }));

  if (!patient) return null;

  /* ═══════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════ */

  return (
    <Wrap>
      <PageHeader>
        <div>
          <PageTitle>Plan Opieki Pielęgniarskiej</PageTitle>
          <PatientName>{patient.imie} {patient.nazwisko}</PatientName>
        </div>
        <PrimaryBtn onClick={openAddEntry}>+ Nowy wpis</PrimaryBtn>
      </PageHeader>

      {loading ? (
        <EmptyState>Ładowanie…</EmptyState>
      ) : entries.length === 0 ? (
        <EmptyState>Brak wpisów w planie opieki.<br />Kliknij „+ Nowy wpis" aby dodać.</EmptyState>
      ) : (
        <TableWrap>
          <MainTable>
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Problem</th>
                <th style={{ width: '22%' }}>Diagnoza</th>
                <th>Interwencje</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const ints = Array.isArray(entry.interwencje) ? entry.interwencje : [];
                const isEntrySelected = selectedEntry === entry.id;

                return (
                  <tr key={entry.id}>
                    {/* Problem */}
                    <td>
                      <CellContent
                        onMouseDown={(e) => { e.stopPropagation(); setSelectedEntry(isEntrySelected ? null : entry.id); setSelectedInt(null); }}
                      >
                        <CellText>
                          {entry.problem}
                          {ICNP_DIAGNOZY.some((t) => t.toLowerCase() === (entry.problem || '').toLowerCase()) && (
                            <><br /><IcnpCode>[{icnpCode(entry.problem)}]</IcnpCode></>
                          )}
                        </CellText>
                        {isEntrySelected && (
                          <ActionBar>
                            <ActionBtn onMouseDown={(e) => { e.stopPropagation(); openEditEntry(entry); }}>Edytuj</ActionBtn>
                            <ActionBtn $danger onMouseDown={(e) => { e.stopPropagation(); setConfirmDelete(entry.id); setSelectedEntry(null); }}>Usuń</ActionBtn>
                          </ActionBar>
                        )}
                      </CellContent>
                    </td>

                    {/* Diagnoza */}
                    <td>
                      <CellContent
                        onMouseDown={(e) => { e.stopPropagation(); setSelectedEntry(isEntrySelected ? null : entry.id); setSelectedInt(null); }}
                      >
                        <CellText>
                          {entry.diagnoza}
                          {ICNP_DIAGNOZY.some((t) => t.toLowerCase() === (entry.diagnoza || '').toLowerCase()) && (
                            <><br /><IcnpCode>[{icnpCode(entry.diagnoza)}]</IcnpCode></>
                          )}
                        </CellText>
                      </CellContent>
                    </td>

                    {/* Interwencje */}
                    <td>
                      <IntSection>
                        {ints.map((int, i) => {
                          const name = typeof int === 'string' ? int : int.interwencja;
                          const intValid = ICNP_INTERWENCJE.some((t) => t.toLowerCase() === (name || '').toLowerCase());
                          const slots = typeof int === 'object' ? generateSlots(int) : [];
                          const wykonane = (typeof int === 'object' && Array.isArray(int.wykonane)) ? int.wykonane : [];
                          const isIntSelected = selectedInt?.entryId === entry.id && selectedInt?.idx === i;

                          return (
                            <IntBlock key={i}>
                              <IntRow>
                                <IntName
                                  onMouseDown={(e) => {
                                    e.stopPropagation();
                                    setSelectedInt(isIntSelected ? null : { entryId: entry.id, idx: i });
                                    setSelectedEntry(null);
                                  }}
                                >
                                  <div>
                                    {name}
                                    {intValid && <IntSubLabel>[{icnpCode(name)}]</IntSubLabel>}
                                  </div>
                                </IntName>

                                {slots.length > 0 ? (
                                  <SlotsWrap>
                                    {slots.map((slot, si) => (
                                      <SlotCol key={si}>
                                        <SlotDate>{slot.date}</SlotDate>
                                        <SlotTime>{slot.time}</SlotTime>
                                        <SlotCheck
                                          checked={!!wykonane[si]}
                                          onChange={() => toggleSlot(entry.id, i, si)}
                                          onMouseDown={(e) => e.stopPropagation()}
                                        />
                                      </SlotCol>
                                    ))}
                                  </SlotsWrap>
                                ) : (
                                  <NoSlots>brak harmonogramu</NoSlots>
                                )}
                              </IntRow>

                              {isIntSelected && (
                                <ActionBar style={{ padding: '6px 14px 10px', justifyContent: 'center' }}>
                                  <ActionBtn onMouseDown={(e) => { e.stopPropagation(); openEditInt(entry.id, i); }}>Edytuj</ActionBtn>
                                  <ActionBtn $danger onMouseDown={(e) => { e.stopPropagation(); setConfirmDeleteInt({ entryId: entry.id, idx: i }); setSelectedInt(null); }}>Usuń</ActionBtn>
                                </ActionBar>
                              )}
                            </IntBlock>
                          );
                        })}

                        <AddIntBtn onMouseDown={(e) => { e.stopPropagation(); openAddInt(entry.id); }}>
                          + Dodaj interwencję
                        </AddIntBtn>
                      </IntSection>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </MainTable>
        </TableWrap>
      )}

      {/* ── Confirm delete entry ────────────────────────────────────────── */}
      {confirmDelete && (
        <Overlay onClick={() => setConfirmDelete(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Potwierdź usunięcie wpisu</ModalTitle>
              <CloseBtn onClick={() => setConfirmDelete(null)}>×</CloseBtn>
            </ModalHeader>
            <ModalBody>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151' }}>
                Czy na pewno chcesz usunąć ten wpis (problem + diagnoza + wszystkie interwencje)?
              </p>
            </ModalBody>
            <ModalFooter>
              <CancelBtn onClick={() => setConfirmDelete(null)}>Anuluj</CancelBtn>
              <PrimaryBtn style={{ background: '#dc2626' }} onClick={() => handleDeleteEntry(confirmDelete)}>Usuń</PrimaryBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}

      {/* ── Confirm delete interwencja ───────────────────────────────────── */}
      {confirmDeleteInt && (
        <Overlay onClick={() => setConfirmDeleteInt(null)}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Potwierdź usunięcie interwencji</ModalTitle>
              <CloseBtn onClick={() => setConfirmDeleteInt(null)}>×</CloseBtn>
            </ModalHeader>
            <ModalBody>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151' }}>
                Czy na pewno chcesz usunąć tę interwencję?
              </p>
            </ModalBody>
            <ModalFooter>
              <CancelBtn onClick={() => setConfirmDeleteInt(null)}>Anuluj</CancelBtn>
              <PrimaryBtn style={{ background: '#dc2626' }}
                onClick={() => handleDeleteInt(confirmDeleteInt.entryId, confirmDeleteInt.idx)}>Usuń</PrimaryBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}

      {/* ── Entry modal (add / edit) ─────────────────────────────────────── */}
      {showAddModal && (
        <Overlay onClick={closeEntryModal}>
          <Modal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{editEntryId ? 'Edytuj wpis' : 'Nowy wpis planu opieki'}</ModalTitle>
              <CloseBtn onClick={closeEntryModal}>×</CloseBtn>
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
              <CancelBtn onClick={closeEntryModal}>Anuluj</CancelBtn>
              <PrimaryBtn onClick={handleSaveEntry} disabled={saving}>
                {saving ? 'Zapisywanie…' : editEntryId ? 'Zapisz zmiany' : 'Dodaj do planu'}
              </PrimaryBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}

      {/* ── Interwencja modal (add / edit) ────────────────────────────────── */}
      {intModal && (
        <Overlay onClick={closeIntModal}>
          <Modal $wide onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>{intModal.editIdx !== undefined ? 'Edytuj interwencję' : 'Dodaj interwencję'}</ModalTitle>
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
                  <FormLabel>Interwał (minuty)</FormLabel>
                  <FormInput type="number" min="1" value={intForm.interwal}
                    onChange={(e) => setIntField('interwal', e.target.value)}
                    placeholder="Np. 30, 60, 120…" />
                </FormGroup>
                <FormGroup>
                  <FormLabel>Ilość powtórzeń</FormLabel>
                  <FormInput type="number" min="1" value={intForm.ilosc_powtorzen}
                    onChange={(e) => setIntField('ilosc_powtorzen', e.target.value)}
                    placeholder="Np. 3, 6…" />
                </FormGroup>
              </FormRow>
            </ModalBody>
            <ModalFooter>
              <CancelBtn onClick={closeIntModal}>Anuluj</CancelBtn>
              <PrimaryBtn onClick={handleSaveInt} disabled={intSaving}>
                {intSaving ? 'Zapisywanie…' : intModal.editIdx !== undefined ? 'Zapisz zmiany' : 'Dodaj interwencję'}
              </PrimaryBtn>
            </ModalFooter>
          </Modal>
        </Overlay>
      )}
    </Wrap>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import api from '../api/axios';
import { useNotification } from './Notification';
import { useAuth } from '../context/AuthContext';
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

const Wrap = styled.div`
  padding: 24px;
  display: flex; flex-direction: column;
  height: 100%; max-height: calc(100vh - 56px);
  overflow: hidden;
`;

const PageHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
`;

const PageTitle = styled.h2`
  font-size: 1.35rem; font-weight: 700; color: var(--text-primary); margin: 0;
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
const DangerBtn = styled.button`
  background: none; border: 1.5px solid #fca5a5; color: #dc2626;
  border-radius: 8px; padding: 10px 20px; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; margin-right: auto;
  &:hover { background: #fee2e2; }
`;
const EmptyState = styled.div`
  text-align: center; padding: 60px 20px; color: #9ca3af; font-size: 1rem;
`;

/* ─── Main table ───────────────────────────────────────────────────────── */

const TableWrap = styled.div`
  border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  background: var(--bg-card); flex: 1; min-height: 0;
  overflow-y: auto; overflow-x: hidden;

  /* thin scrollbar */
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
  &::-webkit-scrollbar-thumb { background: #c4c4c4; border-radius: 3px; }
  &::-webkit-scrollbar-thumb:hover { background: #a0a0a0; }
  scrollbar-width: thin;
  scrollbar-color: #c4c4c4 #f1f1f1;
`;

const MainTable = styled.table`
  width: 100%; border-collapse: collapse; table-layout: fixed;

  th {
    background: #f8f9fa; padding: 14px 18px; text-align: center;
    font-weight: 700; font-size: 0.85rem; color: #555;
    text-transform: uppercase; letter-spacing: 0.5px;
    border-bottom: 2px solid #e0e0e0;
    position: sticky; top: 0; z-index: 2;
  }

  > tbody > tr > td {
    padding: 0; border-bottom: 2px solid #e9ecef;
    text-align: center;
  }
  > tbody > tr > td:nth-child(1) {
    vertical-align: middle;
    border-right: 1px solid #e9ecef;
  }
  > tbody > tr > td:nth-child(2) {
    vertical-align: middle;
    border-right: 1px solid #e9ecef;
  }
  > tbody > tr > td:nth-child(3) {
    vertical-align: top; overflow: hidden;
  }
`;

const CellContent = styled.div`
  padding: 16px 18px; cursor: pointer; position: relative;
  transition: background 0.15s;
  &:hover { background: var(--bg-hover); }
`;

const CellText = styled.div`
  font-size: 0.92rem; color: var(--text-primary); line-height: 1.6;
`;

const IcnpCode = styled.span`
  color: #6b7280; font-size: 0.78rem; font-weight: 500;
`;

/* ─── Interwencje inside cell ──────────────────────────────────────────── */

const IntSection = styled.div`
  border-left: 2px solid var(--border-color);
`;

const IntBlock = styled.div`
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer; transition: background 0.15s;
  &:hover { background: var(--bg-hover); }
  &:last-of-type { border-bottom: none; }
`;

const IntRow = styled.div`
  display: flex; align-items: stretch; min-height: 52px;
`;

const IntName = styled.div`
  min-width: 180px; max-width: 220px; width: 200px; padding: 10px 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.84rem; color: var(--text-primary); text-align: center;
  border-right: 1px solid #f0f0f0; flex-shrink: 0;
`;

const IntSubLabel = styled.span`
  display: block; font-size: 0.72rem; color: #9ca3af; margin-top: 2px;
`;

const SlotsWrap = styled.div`
  display: flex; flex: 1; min-width: 0; overflow-x: auto;

  /* thin scrollbar */
  &::-webkit-scrollbar { height: 6px; }
  &::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
  &::-webkit-scrollbar-thumb { background: #c4c4c4; border-radius: 3px; }
  &::-webkit-scrollbar-thumb:hover { background: #a0a0a0; }
  scrollbar-width: thin;
  scrollbar-color: #c4c4c4 #f1f1f1;
`;

const SlotCol = styled.div`
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; min-width: 90px; padding: 6px 8px;
  border-right: 1px solid #f5f5f5; flex-shrink: 0;
`;

const SlotDate = styled.div`
  font-size: 0.68rem; color: #6b7280; white-space: nowrap;
`;

const SlotTime = styled.div`
  font-size: 0.72rem; color: var(--text-label); font-weight: 600; white-space: nowrap;
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
  display: block; margin: 8px auto; padding: 6px 24px;
  border: 1.5px dashed #93c5fd; border-radius: 6px;
  background: #f8faff; color: #2563eb; font-size: 0.78rem; font-weight: 600;
  cursor: pointer; transition: background 0.15s; text-align: center;
  &:hover { background: #eff6ff; }
`;

/* ─── Modal ────────────────────────────────────────────────────────────── */

const Overlay = styled.div`
  position: fixed; inset: 0; background: var(--overlay-bg); z-index: 1000;
  display: flex; align-items: center; justify-content: center; padding: 20px;
`;
const Modal = styled.div`
  background: var(--bg-card); border-radius: 16px; width: 100%;
  max-width: ${({ $wide }) => ($wide ? '700px' : '550px')};
  max-height: 92vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
`;
const ModalHeader = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px 16px; border-bottom: 1px solid #e5e7eb;
`;
const ModalTitle = styled.h3`
  font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0;
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
  background: none; border: 1.5px solid var(--border-color); color: var(--text-label);
  border-radius: 8px; padding: 10px 24px; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; &:hover { background: #f3f4f6; }
`;
const FormGroup = styled.div` display: flex; flex-direction: column; gap: 6px; `;
const FormLabel = styled.label`
  font-size: 0.82rem; font-weight: 700; color: var(--text-label);
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
  background: var(--bg-card); border: 1.5px solid var(--border-color); border-radius: 8px;
  max-height: 200px; overflow-y: auto; z-index: 100;
  margin: 0; padding: 4px 0; list-style: none;
  box-shadow: 0 6px 20px rgba(0,0,0,0.1);
`;
const AcItem = styled.li`
  padding: 8px 14px; font-size: 0.88rem; cursor: pointer; color: var(--text-primary);
  &:hover, &[data-active='true'] { background: #eff6ff; color: #1d4ed8; }
`;
const AcHint = styled.div`
  margin-top: 4px; font-size: 0.76rem;
  color: ${({ $valid }) => ($valid ? '#16a34a' : '#d97706')}; font-weight: 500;
`;
const AcAiTag = styled.span`
  display: inline-block; background: #dbeafe; color: #1d4ed8;
  font-size: 0.65rem; font-weight: 700; border-radius: 4px;
  padding: 1px 5px; margin-right: 6px; vertical-align: middle;
`;
const AcLoading = styled.li`
  padding: 10px 14px; font-size: 0.82rem; color: #9ca3af; font-style: italic; text-align: center;
`;

/* ─── AI Suggestion panel ───────────────────────────────────────────── */

const AiPanel = styled.div`
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
  border: 1.5px solid #93c5fd; border-radius: 12px; padding: 20px;
  margin-bottom: 16px;
`;
const AiTitle = styled.div`
  display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
  font-size: 0.95rem; font-weight: 700; color: #1e40af;
`;
const AiCard = styled.div`
  background: var(--bg-card); border: 1.5px solid #e0e7ff;
  border-radius: 10px; padding: 14px 16px; margin-bottom: 10px;
  display: flex; align-items: flex-start; gap: 12px;
  transition: border-color 0.2s;
  &:last-of-type { margin-bottom: 0; }
`;
const AiCardBody = styled.div` flex: 1; min-width: 0; `;
const AiCardLabel = styled.div`
  font-size: 0.72rem; font-weight: 700; color: #6b7280;
  text-transform: uppercase; margin-bottom: 2px;
`;
const AiCardText = styled.div`
  font-size: 0.88rem; color: var(--text-primary); font-weight: 500;
`;
const AiCardInts = styled.div`
  margin-top: 4px; font-size: 0.78rem; color: var(--text-secondary);
`;
const AiActions = styled.div`
  display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; padding-top: 2px;
`;
const AiYes = styled.button`
  width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid #86efac;
  background: #f0fdf4; color: #16a34a; font-size: 1rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  &:hover { background: #dcfce7; }
`;
const AiNo = styled.button`
  width: 32px; height: 32px; border-radius: 8px; border: 1.5px solid #fca5a5;
  background: #fef2f2; color: #dc2626; font-size: 1rem; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  &:hover { background: #fee2e2; }
`;
const AiGenerateBtn = styled.button`
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff; border: none; border-radius: 8px;
  padding: 10px 20px; font-size: 0.9rem; font-weight: 600; cursor: pointer;
  transition: all 0.2s; display: flex; align-items: center; gap: 8px;
  &:hover { background: linear-gradient(135deg, #1d4ed8, #1e40af); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const AiBadge = styled.span`
  display: inline-block; background: #dbeafe; color: #1d4ed8;
  font-size: 0.65rem; font-weight: 700; border-radius: 4px;
  padding: 2px 6px; margin-top: 4px;
`;
const CellRating = styled.div`
  display: flex; gap: 4px; justify-content: center; margin-top: 6px;
`;
const RateBtn = styled.button`
  width: 24px; height: 24px; border-radius: 6px; font-size: 0.75rem;
  border: 1.5px solid ${({ $type }) => $type === 'yes' ? '#86efac' : '#fca5a5'};
  background: ${({ $type }) => $type === 'yes' ? '#f0fdf4' : '#fef2f2'};
  color: ${({ $type }) => $type === 'yes' ? '#16a34a' : '#dc2626'};
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  &:hover { opacity: 0.8; }
  &:disabled { opacity: 0.4; cursor: default; }
`;

/* ═══════════════════════════════════════════════════════════════════════════
   Fuzzy search helper
   ═══════════════════════════════════════════════════════════════════════════ */

const PL_SUFFIXES = [
  'owego','owej','owym','owych','owe','owy','owa',
  'yjnego','yjnej','yjnym','yjnych','yjne','yjny','yjna',
  'nego','nej','nym','nych','ne','ny','na',
  'eniu','eniu','ania','enie','anie',
  'iem','iem','ach','ami','om',
  'ów','ie','ej','ą','ę','i','y','a','e',
];

function polishStem(word) {
  const w = word.toLowerCase();
  if (w.length <= 3) return w;
  for (const s of PL_SUFFIXES) {
    if (w.length > s.length + 2 && w.endsWith(s)) return w.slice(0, -s.length);
  }
  return w;
}

function fuzzyMatch(query, terms) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const stem = polishStem(q);

  const exact = [], startsWith = [], stemMatch = [], includes = [];
  for (const t of terms) {
    const tl = t.toLowerCase();
    if (tl === q) { exact.push(t); continue; }
    if (tl.startsWith(q)) { startsWith.push(t); continue; }

    const words = tl.split(/\s+/);
    const hasStem = words.some((w) => polishStem(w).startsWith(stem) || stem.startsWith(polishStem(w)));
    if (hasStem) { stemMatch.push(t); continue; }

    if (tl.includes(q)) { includes.push(t); }
  }
  return [...exact, ...startsWith, ...stemMatch, ...includes].slice(0, 30);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Autocomplete component  (fuzzy search + AI suggestions)
   ═══════════════════════════════════════════════════════════════════════════ */

function Autocomplete({ list, value, onChange, placeholder, required, patientId, field }) {
  const [inputVal, setInputVal] = useState(value || '');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [aiTerms, setAiTerms] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const wrapRef = useRef(null);
  const aiRequested = useRef(false);

  const filtered = inputVal.trim().length >= 1
    ? fuzzyMatch(inputVal, list)
    : [];
  const isValid = list.some((t) => t.toLowerCase() === inputVal.trim().toLowerCase());

  const allItems = inputVal.trim().length === 0
    ? aiTerms.map((t) => ({ text: t, ai: true }))
    : [
        ...aiTerms.filter((t) => t.toLowerCase().includes(inputVal.toLowerCase())).map((t) => ({ text: t, ai: true })),
        ...filtered.map((t) => ({ text: t, ai: false })),
      ];

  useEffect(() => { setInputVal(value || ''); }, [value]);
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchAiTerms = async () => {
    if (!patientId || !field || aiRequested.current) return;
    aiRequested.current = true;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/suggest-terms', { patient_id: patientId, field });
      if (Array.isArray(res.data?.suggestions)) setAiTerms(res.data.suggestions);
    } catch (err) { console.error('AI suggest-terms error', err); }
    finally { setAiLoading(false); }
  };

  const handleFocus = () => {
    setOpen(true);
    if (inputVal.trim().length === 0 && aiTerms.length === 0) fetchAiTerms();
  };

  const handleChange = (e) => { setInputVal(e.target.value); onChange(e.target.value); setOpen(true); setActiveIdx(-1); };
  const handleSelect = (t) => { setInputVal(t); onChange(t); setOpen(false); setActiveIdx(-1); };
  const handleKey = (e) => {
    if (!open || !allItems.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, allItems.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); handleSelect(allItems[activeIdx].text); }
    else if (e.key === 'Escape') setOpen(false);
  };

  return (
    <AcWrap ref={wrapRef}>
      <AcInput value={inputVal} onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKey} placeholder={placeholder} required={required}
        $invalid={inputVal.trim().length > 0 && !isValid} autoComplete="off" />
      {open && (allItems.length > 0 || aiLoading) && (
        <AcDropdown>
          {aiLoading && <AcLoading>🤖 Ładowanie sugestii AI…</AcLoading>}
          {allItems.map((item, i) => (
            <AcItem key={`${item.ai ? 'ai-' : ''}${item.text}`} data-active={i === activeIdx}
              onMouseDown={() => handleSelect(item.text)}>
              {item.ai && <AcAiTag>🤖 AI</AcAiTag>}{item.text}
            </AcItem>
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
  const { user } = useAuth();
  const canAI = user && ['admin', 'prowadzacy'].includes(user.role);
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

  // confirm delete
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteInt, setConfirmDeleteInt] = useState(null);

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiDaneSummary, setAiDaneSummary] = useState('');
  const [aiContextData, setAiContextData] = useState('');
  const [aiRatings, setAiRatings] = useState({});  // { entryId: { problem, diagnoza, int_0, int_1... } }

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

  /* ─── Entry CRUD ─────────────────────────────────────────────────────── */

  const openAddEntry = () => { setEditEntryId(null); setForm(EMPTY_FORM); setShowAddModal(true); };
  const openEditEntry = (entry) => {
    setEditEntryId(entry.id);
    setForm({ problem: entry.problem || '', diagnoza: entry.diagnoza || '' });
    setShowAddModal(true);
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
      setConfirmDelete(null); closeEntryModal(); fetchEntries();
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
  };
  const closeIntModal = () => { setIntModal(null); setIntForm(EMPTY_INT); };

  const handleSaveInt = async () => {
    if (!intForm.interwencja.trim()) { notify('Nazwa interwencji jest wymagana', 'error'); return; }
    setIntSaving(true);
    try {
      const entry = entries.find((e) => e.id === intModal.entryId);
      const current = Array.isArray(entry?.interwencje) ? [...entry.interwencje] : [];

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
      setConfirmDeleteInt(null); closeIntModal(); fetchEntries();
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

  /* ─── AI Plan Generator ──────────────────────────────────────────────── */

  const generateAiPlan = async () => {
    if (!patient?.id) return;
    setAiLoading(true);
    setShowAiPanel(true);
    try {
      const res = await api.post('/ai/suggest-plan', { patient_id: patient.id });
      if (Array.isArray(res.data?.suggestions)) {
        setAiSuggestions(res.data.suggestions.map((s, i) => ({ ...s, _id: i })));
      }
      setAiDaneSummary(res.data?.dane_summary || '');
      setAiContextData(res.data?.ai_context || '');
    } catch (err) {
      console.error('AI suggest-plan error', err);
      notify('Błąd generowania sugestii AI', 'error');
    } finally { setAiLoading(false); }
  };

  const acceptAiSuggestion = async (sug) => {
    try {
      await api.post('/ai/accept', {
        patient_id: patient.id,
        original: { problem: sug.problem, diagnoza: sug.diagnoza, interwencje: sug.interwencje },
        dane_summary: aiDaneSummary,
        ai_context: aiContextData,
      });
      notify('Sugestia AI dodana do planu', 'success');
      setAiSuggestions((prev) => prev.filter((s) => s._id !== sug._id));
      fetchEntries();
    } catch (err) { console.error(err); notify('Błąd dodawania sugestii', 'error'); }
  };

  const rejectAiSuggestion = async (sug) => {
    try {
      await api.post('/ai/reject', {
        patient_id: patient.id,
        original: { problem: sug.problem, diagnoza: sug.diagnoza, interwencje: sug.interwencje },
        dane_summary: aiDaneSummary,
        ai_context: aiContextData,
      });
    } catch (err) { console.error(err); }
    setAiSuggestions((prev) => prev.filter((s) => s._id !== sug._id));
  };

  const rateAiElement = (entryId, key, value) => {
    setAiRatings((prev) => ({
      ...prev,
      [entryId]: { ...(prev[entryId] || {}), [key]: value },
    }));
  };

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
        <div style={{ display: 'flex', gap: 10 }}>
          {canAI && (
            <AiGenerateBtn onClick={generateAiPlan} disabled={aiLoading}>
              {aiLoading ? '⏳ Generowanie…' : '🤖 Generuj plan AI'}
            </AiGenerateBtn>
          )}
          <PrimaryBtn onClick={openAddEntry}>+ Nowy wpis</PrimaryBtn>
        </div>
      </PageHeader>

      {/* ── AI Suggestions Panel ───────────────────────────────────────── */}
      {showAiPanel && (
        <AiPanel>
          <AiTitle>
            <span>🤖</span> Sugestie AI na podstawie danych pacjenta
            <CloseBtn style={{ marginLeft: 'auto', fontSize: '1.2rem' }} onClick={() => setShowAiPanel(false)}>×</CloseBtn>
          </AiTitle>
          {aiLoading ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>⏳ Generowanie sugestii…</div>
          ) : aiSuggestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
              Brak sugestii. Kliknij „🤖 Generuj plan AI" ponownie.
            </div>
          ) : (
            aiSuggestions.map((sug) => (
              <AiCard key={sug._id}>
                <AiCardBody>
                  <AiCardLabel>Problem</AiCardLabel>
                  <AiCardText>{sug.problem}</AiCardText>
                  <AiCardLabel style={{ marginTop: 6 }}>Diagnoza</AiCardLabel>
                  <AiCardText>{sug.diagnoza}</AiCardText>
                  {sug.interwencje?.length > 0 && (
                    <>
                      <AiCardLabel style={{ marginTop: 6 }}>Interwencje</AiCardLabel>
                      <AiCardInts>{sug.interwencje.join(' • ')}</AiCardInts>
                    </>
                  )}
                </AiCardBody>
                <AiActions>
                  <AiYes title="Akceptuj — dodaj do planu" onClick={() => acceptAiSuggestion(sug)}>✓</AiYes>
                  <AiNo title="Odrzuć" onClick={() => rejectAiSuggestion(sug)}>✗</AiNo>
                </AiActions>
              </AiCard>
            ))
          )}
        </AiPanel>
      )}

      {loading ? (
        <EmptyState>Ładowanie…</EmptyState>
      ) : entries.length === 0 ? (
        <EmptyState>Brak wpisów w planie opieki.<br />Kliknij „+ Nowy wpis" aby dodać.</EmptyState>
      ) : (
        <TableWrap>
          <MainTable>
            <thead>
              <tr>
                <th style={{ width: '18%' }}>Problem</th>
                <th style={{ width: '18%' }}>Diagnoza</th>
                <th>Interwencje</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const ints = Array.isArray(entry.interwencje) ? entry.interwencje : [];

                return (
                  <tr key={entry.id}>
                    {/* Problem — click opens edit */}
                    <td>
                      <CellContent onClick={() => openEditEntry(entry)}>
                        <CellText>
                          {entry.problem}
                          {ICNP_DIAGNOZY.some((t) => t.toLowerCase() === (entry.problem || '').toLowerCase()) && (
                            <><br /><IcnpCode>[{icnpCode(entry.problem)}]</IcnpCode></>
                          )}
                          {entry.ai && <><br /><AiBadge>🤖 AI</AiBadge></>}
                        </CellText>
                        {entry.ai && (
                          <CellRating onClick={(e) => e.stopPropagation()}>
                            <RateBtn $type="yes" disabled={aiRatings[entry.id]?.problem === 'yes'}
                              onClick={() => rateAiElement(entry.id, 'problem', 'yes')}>✓</RateBtn>
                            <RateBtn $type="no" disabled={aiRatings[entry.id]?.problem === 'no'}
                              onClick={() => rateAiElement(entry.id, 'problem', 'no')}>✗</RateBtn>
                          </CellRating>
                        )}
                      </CellContent>
                    </td>

                    {/* Diagnoza — click opens edit */}
                    <td>
                      <CellContent onClick={() => openEditEntry(entry)}>
                        <CellText>
                          {entry.diagnoza}
                          {ICNP_DIAGNOZY.some((t) => t.toLowerCase() === (entry.diagnoza || '').toLowerCase()) && (
                            <><br /><IcnpCode>[{icnpCode(entry.diagnoza)}]</IcnpCode></>
                          )}
                          {entry.ai && <><br /><AiBadge>🤖 AI</AiBadge></>}
                        </CellText>
                        {entry.ai && (
                          <CellRating onClick={(e) => e.stopPropagation()}>
                            <RateBtn $type="yes" disabled={aiRatings[entry.id]?.diagnoza === 'yes'}
                              onClick={() => rateAiElement(entry.id, 'diagnoza', 'yes')}>✓</RateBtn>
                            <RateBtn $type="no" disabled={aiRatings[entry.id]?.diagnoza === 'no'}
                              onClick={() => rateAiElement(entry.id, 'diagnoza', 'no')}>✗</RateBtn>
                          </CellRating>
                        )}
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

                          return (
                            <IntBlock key={i} onClick={() => openEditInt(entry.id, i)}>
                              <IntRow>
                                <IntName>
                                  <div>
                                    {name}
                                    {intValid && <IntSubLabel>[{icnpCode(name)}]</IntSubLabel>}
                                    {entry.ai && <AiBadge style={{ fontSize: '0.58rem', marginTop: 2 }}>🤖 AI</AiBadge>}
                                    {entry.ai && (
                                      <CellRating style={{ marginTop: 4 }} onClick={(e) => e.stopPropagation()}>
                                        <RateBtn $type="yes" disabled={aiRatings[entry.id]?.[`int_${i}`] === 'yes'}
                                          onClick={() => rateAiElement(entry.id, `int_${i}`, 'yes')}>✓</RateBtn>
                                        <RateBtn $type="no" disabled={aiRatings[entry.id]?.[`int_${i}`] === 'no'}
                                          onClick={() => rateAiElement(entry.id, `int_${i}`, 'no')}>✗</RateBtn>
                                      </CellRating>
                                    )}
                                  </div>
                                </IntName>

                                {slots.length > 0 ? (
                                  <SlotsWrap
                                    onClick={(e) => e.stopPropagation()}
                                    onWheel={(e) => {
                                      if (e.deltaY !== 0) {
                                        e.currentTarget.scrollLeft += e.deltaY;
                                        e.preventDefault();
                                      }
                                    }}
                                  >
                                    {slots.map((slot, si) => (
                                      <SlotCol key={si}>
                                        <SlotDate>{slot.date}</SlotDate>
                                        <SlotTime>{slot.time}</SlotTime>
                                        <SlotCheck
                                          checked={!!wykonane[si]}
                                          onChange={() => toggleSlot(entry.id, i, si)}
                                        />
                                      </SlotCol>
                                    ))}
                                  </SlotsWrap>
                                ) : (
                                  <NoSlots>brak harmonogramu</NoSlots>
                                )}
                              </IntRow>
                            </IntBlock>
                          );
                        })}

                        <AddIntBtn onClick={(e) => { e.stopPropagation(); openAddInt(entry.id); }}>
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
                  placeholder="Np. Ból ostry, Ryzyko zakażenia…" required
                  patientId={patient?.id} field="problem" />
              </FormGroup>
              <FormGroup>
                <FormLabel>Diagnoza pielęgniarska (ICNP) <Required>*</Required></FormLabel>
                <Autocomplete list={ICNP_DIAGNOZY} value={form.diagnoza}
                  onChange={(v) => setField('diagnoza', v)}
                  placeholder="Np. Ból ostry, Deficyt samoopieki…" required
                  patientId={patient?.id} field="diagnoza" />
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              {editEntryId && (
                <DangerBtn onClick={() => setConfirmDelete(editEntryId)}>Usuń wpis</DangerBtn>
              )}
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
                  placeholder="Np. Ocena bólu, Podawanie leków…" required
                  patientId={patient?.id} field="interwencja" />
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
              {intModal.editIdx !== undefined && (
                <DangerBtn onClick={() => setConfirmDeleteInt({ entryId: intModal.entryId, idx: intModal.editIdx })}>
                  Usuń interwencję
                </DangerBtn>
              )}
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

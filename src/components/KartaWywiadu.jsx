import { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import ToggleCheckbox from './ToggleCheckbox';
import api from '../api/axios';
import { useNotification } from './Notification';

const RODZAJE_ODDECHU = ['prawidłowy', 'przyspieszony', 'zwolniony', 'Cheyne-Stokesa', 'Kussmaula', 'Biota', 'inny'];
const TYPY_KONTAKTU = ['słowny', 'pozasłowny', 'pisemny'];

/* ─── Inline AutocompleteInput for KartaWywiadu ─── */
function ACInput({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const filtered = options.filter((o) => o.toLowerCase().includes((value || '').toLowerCase()));
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <ACWrap ref={ref}>
      <input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder} autoComplete="off" />
      {open && filtered.length > 0 && (
        <ACDrop>{filtered.slice(0, 6).map((o) => (
          <ACOpt key={o} onMouseDown={() => { onChange(o); setOpen(false); }}>{o}</ACOpt>
        ))}</ACDrop>
      )}
    </ACWrap>
  );
}

const initData = (patient) => {
  const kw = patient?.karta_wywiadu || {};
  return {
    kontakt: {
      enabled: false,
      typ: kw.kontakt?.typ || '',
      logiczny: kw.kontakt?.logiczny || false,
      zachowany: kw.kontakt?.zachowany || false,
      brak_kontaktu: kw.kontakt?.brak_kontaktu || false,
    },
    choroby: {
      enabled: false,
      objawy_obecnej: kw.choroby?.objawy_obecnej || '',
      przebyte: kw.choroby?.przebyte || [{ choroba: '', od_kiedy: '', leczenie: '' }],
      zakazne: kw.choroby?.zakazne || [{ choroba: '', od_kiedy: '' }],
      zabiegi: kw.choroby?.zabiegi || [{ zabieg: '', data: '' }],
    },
    parametry: {
      enabled: false,
      wzrost: kw.parametry?.wzrost || '',
      masa: kw.parametry?.masa || '',
      bmi: kw.parametry?.bmi || '',
      obwod_glowy: kw.parametry?.obwod_glowy || '',
      obwod_klatki: kw.parametry?.obwod_klatki || '',
    },
    oznaki_zycia: {
      enabled: false,
      temperatura: kw.oznaki_zycia?.temperatura || '',
      ctk_skurczowe: kw.oznaki_zycia?.ctk_skurczowe || '',
      ctk_rozkurczowe: kw.oznaki_zycia?.ctk_rozkurczowe || '',
      tetno: kw.oznaki_zycia?.tetno || '',
      oddech: kw.oznaki_zycia?.oddech || '',
      rodzaj_oddechu: kw.oznaki_zycia?.rodzaj_oddechu || 'prawidłowy',
    },
    ocena_bolu: {
      enabled: false,
      wpisy: kw.ocena_bolu?.wpisy || [{ kategoria: '', lokalizacja: '', czestotliwosc: '', intensywnosc: '' }],
    },
    krew: {
      enabled: false,
      hbs: kw.krew?.hbs || 'nie badano',
      hiv: kw.krew?.hiv || 'nie badano',
      transfuzje: kw.krew?.transfuzje || false,
      reakcje: kw.krew?.reakcje || '',
    },
    alergie: {
      enabled: false,
      wystepuja: kw.alergie?.wystepuja || false,
      wpisy: kw.alergie?.wpisy || [{ alergia: '', opis: '' }],
    },
    styl_zycia: {
      enabled: false,
      palenie: kw.styl_zycia?.palenie || false,
      palenie_ile: kw.styl_zycia?.palenie_ile || '',
      alkohol: kw.styl_zycia?.alkohol || false,
      alkohol_ile: kw.styl_zycia?.alkohol_ile || '',
      narkotyki: kw.styl_zycia?.narkotyki || false,
      narkotyki_wpisy: kw.styl_zycia?.narkotyki_wpisy || [{ nazwa: '', czestotliwosc: '' }],
      aktywnosc: kw.styl_zycia?.aktywnosc || '',
      dieta: kw.styl_zycia?.dieta || '',
    },
  };
};

export default function KartaWywiadu({ patient }) {
  const notify = useNotification();
  const [data, setData] = useState(() => initData(patient));
  const [savingSection, setSavingSection] = useState(null);
  const [saveModal, setSaveModal] = useState(null); // { sectionKey }
  const [saveDate, setSaveDate] = useState('');
  const [saveTime, setSaveTime] = useState('');

  useEffect(() => {
    setData(initData(patient));
  }, [patient?.id]);

  const update = useCallback((section, field, value) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  }, []);

  const toggleSection = useCallback((section) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section], enabled: !prev[section].enabled },
    }));
  }, []);

  // BMI auto-calc
  useEffect(() => {
    const w = parseFloat(data.parametry.masa);
    const h = parseFloat(data.parametry.wzrost) / 100;
    if (w > 0 && h > 0) {
      update('parametry', 'bmi', (w / (h * h)).toFixed(1));
    }
  }, [data.parametry.masa, data.parametry.wzrost, update]);

  const updateTableRow = (section, field, index, key, value) => {
    setData((prev) => {
      const rows = [...prev[section][field]];
      rows[index] = { ...rows[index], [key]: value };
      return { ...prev, [section]: { ...prev[section], [field]: rows } };
    });
  };

  const addTableRow = (section, field, template) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: [...prev[section][field], { ...template }] },
    }));
  };

  const removeTableRow = (section, field, index) => {
    setData((prev) => {
      const rows = prev[section][field].filter((_, i) => i !== index);
      return { ...prev, [section]: { ...prev[section], [field]: rows.length ? rows : [{ ...prev[section][field][0] }] } };
    });
  };

  const openSaveModal = (sectionKey) => {
    const now = new Date();
    setSaveDate(now.toISOString().slice(0, 10));
    setSaveTime(now.toTimeString().slice(0, 5));
    setSaveModal({ sectionKey });
  };

  const handleConfirmSave = async () => {
    if (!saveModal) return;
    const { sectionKey } = saveModal;
    setSavingSection(sectionKey);
    setSaveModal(null);
    try {
      const merged = { ...(patient.karta_wywiadu || {}), [sectionKey]: data[sectionKey] };
      await api.put(`/patients/${patient.id}`, { karta_wywiadu: merged });
      await api.post('/wywiady', {
        patient_id: patient.id,
        content: { section: sectionKey, data: data[sectionKey] },
        date: `${saveDate} ${saveTime}`,
      });
      notify('Sekcja zapisana pomyślnie', 'success');
    } catch (err) {
      console.error(err);
      notify('Błąd zapisu sekcji', 'error');
    } finally {
      setSavingSection(null);
    }
  };

  // Brak kontaktu - reset other fields
  const handleBrakKontaktu = () => {
    if (!data.kontakt.brak_kontaktu) {
      setData((prev) => ({
        ...prev,
        kontakt: { ...prev.kontakt, brak_kontaktu: true, logiczny: false, zachowany: false, typ: '' },
      }));
    } else {
      update('kontakt', 'brak_kontaktu', false);
    }
  };

  if (!patient) return null;

  return (
    <Wrapper>
      <Title>Karta wywiadu — {patient.imie} {patient.nazwisko}</Title>

      {/* KONTAKT Z PACJENTEM */}
      <Section>
        <SectionHeader onClick={() => toggleSection('kontakt')}>
          <Chevron $open={data.kontakt.enabled}>▶</Chevron>
          <SectionName>Kontakt z pacjentem</SectionName>
        </SectionHeader>
        {data.kontakt.enabled && (
          <SectionBody>
            <Row3>
              <Field>
                <label>Typ kontaktu</label>
                <ACInput value={data.kontakt.typ} onChange={(v) => update('kontakt', 'typ', v)} options={TYPY_KONTAKTU} placeholder="Wpisz typ kontaktu..." />
              </Field>
              <Field style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10 }}>
                <ToggleCheckbox checked={data.kontakt.logiczny} onChange={() => !data.kontakt.brak_kontaktu && update('kontakt', 'logiczny', !data.kontakt.logiczny)} label="Kontakt logiczny" />
                <ToggleCheckbox checked={data.kontakt.zachowany} onChange={() => !data.kontakt.brak_kontaktu && update('kontakt', 'zachowany', !data.kontakt.zachowany)} label="Kontakt zachowany" />
              </Field>
              <Field style={{ display: 'flex', alignItems: 'center', paddingTop: 22 }}>
                <ToggleCheckbox checked={data.kontakt.brak_kontaktu} onChange={handleBrakKontaktu} label="Brak kontaktu" />
              </Field>
            </Row3>
            <SaveSectionBtn onClick={() => openSaveModal('kontakt')} disabled={savingSection === 'kontakt'}>
              {savingSection === 'kontakt' ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </SaveSectionBtn>
          </SectionBody>
        )}
      </Section>

      {/* CHOROBY */}
      <Section>
        <SectionHeader onClick={() => toggleSection('choroby')}>
          <Chevron $open={data.choroby.enabled}>▶</Chevron>
          <SectionName>Choroby i zabiegi</SectionName>
        </SectionHeader>
        {data.choroby.enabled && (
          <SectionBody>
            <Field>
              <label>Objawy choroby obecnej</label>
              <textarea rows={3} value={data.choroby.objawy_obecnej} onChange={(e) => update('choroby', 'objawy_obecnej', e.target.value)} />
            </Field>

            <SmallTitle>Choroby przebyte</SmallTitle>
            <DataTable>
              <thead>
                <tr><th>Choroba</th><th>Od kiedy</th><th>Leczenie</th><th></th></tr>
              </thead>
              <tbody>
                {data.choroby.przebyte.map((row, i) => (
                  <tr key={i}>
                    <td><input value={row.choroba} onChange={(e) => updateTableRow('choroby', 'przebyte', i, 'choroba', e.target.value)} /></td>
                    <td><input value={row.od_kiedy} onChange={(e) => updateTableRow('choroby', 'przebyte', i, 'od_kiedy', e.target.value)} placeholder="rok" /></td>
                    <td><input value={row.leczenie} onChange={(e) => updateTableRow('choroby', 'przebyte', i, 'leczenie', e.target.value)} /></td>
                    <td><RemoveBtn onClick={() => removeTableRow('choroby', 'przebyte', i)}>×</RemoveBtn></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <AddRowBtn onClick={() => addTableRow('choroby', 'przebyte', { choroba: '', od_kiedy: '', leczenie: '' })}>+ Dodaj</AddRowBtn>

            <SmallTitle>Choroby zakaźne</SmallTitle>
            <DataTable>
              <thead>
                <tr><th>Choroba</th><th>Od kiedy</th><th></th></tr>
              </thead>
              <tbody>
                {data.choroby.zakazne.map((row, i) => (
                  <tr key={i}>
                    <td><input value={row.choroba} onChange={(e) => updateTableRow('choroby', 'zakazne', i, 'choroba', e.target.value)} /></td>
                    <td><input value={row.od_kiedy} onChange={(e) => updateTableRow('choroby', 'zakazne', i, 'od_kiedy', e.target.value)} placeholder="rok" /></td>
                    <td><RemoveBtn onClick={() => removeTableRow('choroby', 'zakazne', i)}>×</RemoveBtn></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <AddRowBtn onClick={() => addTableRow('choroby', 'zakazne', { choroba: '', od_kiedy: '' })}>+ Dodaj</AddRowBtn>

            <SmallTitle>Przebyte zabiegi operacyjne</SmallTitle>
            <DataTable>
              <thead>
                <tr><th>Zabieg</th><th>Data</th><th></th></tr>
              </thead>
              <tbody>
                {data.choroby.zabiegi.map((row, i) => (
                  <tr key={i}>
                    <td><input value={row.zabieg} onChange={(e) => updateTableRow('choroby', 'zabiegi', i, 'zabieg', e.target.value)} /></td>
                    <td><input type="date" value={row.data} onChange={(e) => updateTableRow('choroby', 'zabiegi', i, 'data', e.target.value)} /></td>
                    <td><RemoveBtn onClick={() => removeTableRow('choroby', 'zabiegi', i)}>×</RemoveBtn></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <AddRowBtn onClick={() => addTableRow('choroby', 'zabiegi', { zabieg: '', data: '' })}>+ Dodaj</AddRowBtn>
            <SaveSectionBtn onClick={() => openSaveModal('choroby')} disabled={savingSection === 'choroby'}>
              {savingSection === 'choroby' ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </SaveSectionBtn>
          </SectionBody>
        )}
      </Section>

      {/* PARAMETRY */}
      <Section>
        <SectionHeader onClick={() => toggleSection('parametry')}>
          <Chevron $open={data.parametry.enabled}>▶</Chevron>
          <SectionName>Parametry</SectionName>
        </SectionHeader>
        {data.parametry.enabled && (
          <SectionBody>
            <Row3>
              <Field>
                <label>Wzrost (cm)</label>
                <input type="number" min="0" value={data.parametry.wzrost} onChange={(e) => update('parametry', 'wzrost', e.target.value)} />
              </Field>
              <Field>
                <label>Masa ciała (kg)</label>
                <input type="number" min="0" step="0.1" value={data.parametry.masa} onChange={(e) => update('parametry', 'masa', e.target.value)} />
              </Field>
              <Field>
                <label>BMI</label>
                <input value={data.parametry.bmi} readOnly style={{ background: '#f0f0f0' }} />
              </Field>
            </Row3>
            <Row2>
              <Field>
                <label>Obwód głowy (cm)</label>
                <input type="number" min="0" value={data.parametry.obwod_glowy} onChange={(e) => update('parametry', 'obwod_glowy', e.target.value)} />
              </Field>
              <Field>
                <label>Obwód klatki piersiowej (cm)</label>
                <input type="number" min="0" value={data.parametry.obwod_klatki} onChange={(e) => update('parametry', 'obwod_klatki', e.target.value)} />
              </Field>
            </Row2>
            <SaveSectionBtn onClick={() => openSaveModal('parametry')} disabled={savingSection === 'parametry'}>
              {savingSection === 'parametry' ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </SaveSectionBtn>
          </SectionBody>
        )}
      </Section>

      {/* OZNAKI ŻYCIA */}
      <Section>
        <SectionHeader onClick={() => toggleSection('oznaki_zycia')}>
          <Chevron $open={data.oznaki_zycia.enabled}>▶</Chevron>
          <SectionName>Oznaki życia</SectionName>
        </SectionHeader>
        {data.oznaki_zycia.enabled && (
          <SectionBody>
            <Row3>
              <Field>
                <label>Temperatura (°C)</label>
                <input type="number" step="0.1" min="30" max="45" value={data.oznaki_zycia.temperatura} onChange={(e) => update('oznaki_zycia', 'temperatura', e.target.value)} />
              </Field>
              <Field>
                <label>CTK skurczowe (mmHg)</label>
                <input type="number" min="0" value={data.oznaki_zycia.ctk_skurczowe} onChange={(e) => update('oznaki_zycia', 'ctk_skurczowe', e.target.value)} />
              </Field>
              <Field>
                <label>CTK rozkurczowe (mmHg)</label>
                <input type="number" min="0" value={data.oznaki_zycia.ctk_rozkurczowe} onChange={(e) => update('oznaki_zycia', 'ctk_rozkurczowe', e.target.value)} />
              </Field>
            </Row3>
            <Row3>
              <Field>
                <label>Tętno (ud./min)</label>
                <input type="number" min="0" value={data.oznaki_zycia.tetno} onChange={(e) => update('oznaki_zycia', 'tetno', e.target.value)} />
              </Field>
              <Field>
                <label>Oddech (odd./min)</label>
                <input type="number" min="0" value={data.oznaki_zycia.oddech} onChange={(e) => update('oznaki_zycia', 'oddech', e.target.value)} />
              </Field>
              <Field>
                <label>Rodzaj oddechu</label>
                <ACInput value={data.oznaki_zycia.rodzaj_oddechu} onChange={(v) => update('oznaki_zycia', 'rodzaj_oddechu', v)} options={RODZAJE_ODDECHU} placeholder="Wpisz rodzaj..." />
              </Field>
            </Row3>
            <SaveSectionBtn onClick={() => openSaveModal('oznaki_zycia')} disabled={savingSection === 'oznaki_zycia'}>
              {savingSection === 'oznaki_zycia' ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </SaveSectionBtn>
          </SectionBody>
        )}
      </Section>

      {/* OCENA BÓLU */}
      <Section>
        <SectionHeader onClick={() => toggleSection('ocena_bolu')}>
          <Chevron $open={data.ocena_bolu.enabled}>▶</Chevron>
          <SectionName>Ocena bólu</SectionName>
        </SectionHeader>
        {data.ocena_bolu.enabled && (
          <SectionBody>
            <DataTable>
              <thead>
                <tr><th>Kategoria</th><th>Lokalizacja</th><th>Częstotliwość</th><th>Intensywność (0-10)</th><th></th></tr>
              </thead>
              <tbody>
                {data.ocena_bolu.wpisy.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <select value={row.kategoria} onChange={(e) => updateTableRow('ocena_bolu', 'wpisy', i, 'kategoria', e.target.value)}>
                        <option value="">— wybierz —</option>
                        <option>ostry</option>
                        <option>przewlekły</option>
                        <option>nawracający</option>
                      </select>
                    </td>
                    <td><input value={row.lokalizacja} onChange={(e) => updateTableRow('ocena_bolu', 'wpisy', i, 'lokalizacja', e.target.value)} /></td>
                    <td>
                      <select value={row.czestotliwosc} onChange={(e) => updateTableRow('ocena_bolu', 'wpisy', i, 'czestotliwosc', e.target.value)}>
                        <option value="">— wybierz —</option>
                        <option>ciągły</option>
                        <option>okresowy</option>
                        <option>sporadyczny</option>
                      </select>
                    </td>
                    <td><input type="number" min="0" max="10" value={row.intensywnosc} onChange={(e) => updateTableRow('ocena_bolu', 'wpisy', i, 'intensywnosc', e.target.value)} /></td>
                    <td><RemoveBtn onClick={() => removeTableRow('ocena_bolu', 'wpisy', i)}>×</RemoveBtn></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <AddRowBtn onClick={() => addTableRow('ocena_bolu', 'wpisy', { kategoria: '', lokalizacja: '', czestotliwosc: '', intensywnosc: '' })}>+ Dodaj</AddRowBtn>
            <SaveSectionBtn onClick={() => openSaveModal('ocena_bolu')} disabled={savingSection === 'ocena_bolu'}>
              {savingSection === 'ocena_bolu' ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </SaveSectionBtn>
          </SectionBody>
        )}
      </Section>

      {/* KREW */}
      <Section>
        <SectionHeader onClick={() => toggleSection('krew')}>
          <Chevron $open={data.krew.enabled}>▶</Chevron>
          <SectionName>Krew</SectionName>
        </SectionHeader>
        {data.krew.enabled && (
          <SectionBody>
            <Row3>
              <Field>
                <label>HBs Ag</label>
                <select value={data.krew.hbs} onChange={(e) => update('krew', 'hbs', e.target.value)}>
                  <option>nie badano</option>
                  <option>dodatni</option>
                  <option>ujemny</option>
                </select>
              </Field>
              <Field>
                <label>HIV</label>
                <select value={data.krew.hiv} onChange={(e) => update('krew', 'hiv', e.target.value)}>
                  <option>nie badano</option>
                  <option>dodatni</option>
                  <option>ujemny</option>
                </select>
              </Field>
              <Field style={{ display: 'flex', alignItems: 'center', paddingTop: 22 }}>
                <ToggleCheckbox checked={data.krew.transfuzje} onChange={() => update('krew', 'transfuzje', !data.krew.transfuzje)} label="Transfuzje krwi" />
              </Field>
            </Row3>
            {data.krew.transfuzje && (
              <Field>
                <label>Reakcje potransfuzyjne</label>
                <textarea rows={2} value={data.krew.reakcje} onChange={(e) => update('krew', 'reakcje', e.target.value)} />
              </Field>
            )}
            <SaveSectionBtn onClick={() => openSaveModal('krew')} disabled={savingSection === 'krew'}>
              {savingSection === 'krew' ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </SaveSectionBtn>
          </SectionBody>
        )}
      </Section>

      {/* ALERGIE */}
      <Section>
        <SectionHeader onClick={() => toggleSection('alergie')}>
          <Chevron $open={data.alergie.enabled}>▶</Chevron>
          <SectionName>Alergie</SectionName>
        </SectionHeader>
        {data.alergie.enabled && (
          <SectionBody>
            <QuestionRow>
              <span>Czy występują alergie?</span>
              <ToggleCheckbox checked={data.alergie.wystepuja} onChange={() => update('alergie', 'wystepuja', !data.alergie.wystepuja)} label={data.alergie.wystepuja ? 'Tak' : 'Nie'} />
            </QuestionRow>
            {data.alergie.wystepuja && (
              <>
                <DataTable>
                  <thead>
                    <tr><th>Alergia</th><th>Opis reakcji</th><th></th></tr>
                  </thead>
                  <tbody>
                    {data.alergie.wpisy.map((row, i) => (
                      <tr key={i}>
                        <td><input value={row.alergia} onChange={(e) => updateTableRow('alergie', 'wpisy', i, 'alergia', e.target.value)} /></td>
                        <td><input value={row.opis} onChange={(e) => updateTableRow('alergie', 'wpisy', i, 'opis', e.target.value)} /></td>
                        <td><RemoveBtn onClick={() => removeTableRow('alergie', 'wpisy', i)}>×</RemoveBtn></td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
                <AddRowBtn onClick={() => addTableRow('alergie', 'wpisy', { alergia: '', opis: '' })}>+ Dodaj</AddRowBtn>
              </>
            )}
            <SaveSectionBtn onClick={() => openSaveModal('alergie')} disabled={savingSection === 'alergie'}>
              {savingSection === 'alergie' ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </SaveSectionBtn>
          </SectionBody>
        )}
      </Section>

      {/* STYL ŻYCIA */}
      <Section>
        <SectionHeader onClick={() => toggleSection('styl_zycia')}>
          <Chevron $open={data.styl_zycia.enabled}>▶</Chevron>
          <SectionName>Styl życia</SectionName>
        </SectionHeader>
        {data.styl_zycia.enabled && (
          <SectionBody>
            <QuestionRow>
              <span>Palenie tytoniu</span>
              <ToggleCheckbox checked={data.styl_zycia.palenie} onChange={() => update('styl_zycia', 'palenie', !data.styl_zycia.palenie)} label={data.styl_zycia.palenie ? 'Tak' : 'Nie'} />
            </QuestionRow>
            {data.styl_zycia.palenie && (
              <Field style={{ marginBottom: 12 }}>
                <label>Ile dziennie?</label>
                <input value={data.styl_zycia.palenie_ile} onChange={(e) => update('styl_zycia', 'palenie_ile', e.target.value)} placeholder="np. 10 sztuk" />
              </Field>
            )}

            <QuestionRow>
              <span>Alkohol</span>
              <ToggleCheckbox checked={data.styl_zycia.alkohol} onChange={() => update('styl_zycia', 'alkohol', !data.styl_zycia.alkohol)} label={data.styl_zycia.alkohol ? 'Tak' : 'Nie'} />
            </QuestionRow>
            {data.styl_zycia.alkohol && (
              <Field style={{ marginBottom: 12 }}>
                <label>Ile / jak często?</label>
                <input value={data.styl_zycia.alkohol_ile} onChange={(e) => update('styl_zycia', 'alkohol_ile', e.target.value)} placeholder="np. okazjonalnie" />
              </Field>
            )}

            <QuestionRow>
              <span>Narkotyki</span>
              <ToggleCheckbox checked={data.styl_zycia.narkotyki} onChange={() => update('styl_zycia', 'narkotyki', !data.styl_zycia.narkotyki)} label={data.styl_zycia.narkotyki ? 'Tak' : 'Nie'} />
            </QuestionRow>
            {data.styl_zycia.narkotyki && (
              <>
                <DataTable>
                  <thead>
                    <tr><th>Nazwa substancji</th><th>Częstotliwość</th><th></th></tr>
                  </thead>
                  <tbody>
                    {data.styl_zycia.narkotyki_wpisy.map((row, i) => (
                      <tr key={i}>
                        <td><input value={row.nazwa} onChange={(e) => updateTableRow('styl_zycia', 'narkotyki_wpisy', i, 'nazwa', e.target.value)} /></td>
                        <td><input value={row.czestotliwosc} onChange={(e) => updateTableRow('styl_zycia', 'narkotyki_wpisy', i, 'czestotliwosc', e.target.value)} /></td>
                        <td><RemoveBtn onClick={() => removeTableRow('styl_zycia', 'narkotyki_wpisy', i)}>×</RemoveBtn></td>
                      </tr>
                    ))}
                  </tbody>
                </DataTable>
                <AddRowBtn onClick={() => addTableRow('styl_zycia', 'narkotyki_wpisy', { nazwa: '', czestotliwosc: '' })}>+ Dodaj</AddRowBtn>
              </>
            )}

            <Row2 style={{ marginTop: 16 }}>
              <Field>
                <label>Aktywność fizyczna</label>
                <textarea rows={2} value={data.styl_zycia.aktywnosc} onChange={(e) => update('styl_zycia', 'aktywnosc', e.target.value)} />
              </Field>
              <Field>
                <label>Dieta / odżywianie</label>
                <textarea rows={2} value={data.styl_zycia.dieta} onChange={(e) => update('styl_zycia', 'dieta', e.target.value)} />
              </Field>
            </Row2>
            <SaveSectionBtn onClick={() => openSaveModal('styl_zycia')} disabled={savingSection === 'styl_zycia'}>
              {savingSection === 'styl_zycia' ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </SaveSectionBtn>
          </SectionBody>
        )}
      </Section>

      {/* MODAL DATA + GODZINA */}
      {saveModal && (
        <ModalOverlay onClick={() => setSaveModal(null)}>
          <ModalBox onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Potwierdź zapis</ModalTitle>
            <ModalField>
              <label>Data</label>
              <input type="date" value={saveDate} onChange={(e) => setSaveDate(e.target.value)} />
            </ModalField>
            <ModalField>
              <label>Godzina</label>
              <input type="time" value={saveTime} onChange={(e) => setSaveTime(e.target.value)} />
            </ModalField>
            <ModalButtons>
              <ModalCancel type="button" onClick={() => setSaveModal(null)}>Anuluj</ModalCancel>
              <ModalConfirm type="button" onClick={handleConfirmSave} disabled={!saveDate || !saveTime}>
                Potwierdź i zapisz
              </ModalConfirm>
            </ModalButtons>
          </ModalBox>
        </ModalOverlay>
      )}
    </Wrapper>
  );
}

/* ─── Styled Components ─── */

const Wrapper = styled.div`
  max-width: 960px;
  margin: 0 auto;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  color: #1a1a2e;
  margin-bottom: 1.5rem;
`;

const Section = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 1rem;
  overflow: hidden;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.2s;
  user-select: none;
  &:hover { background: #f8f9fa; }
`;

const Chevron = styled.span`
  display: inline-block;
  font-size: 0.75rem;
  color: #888;
  transition: transform 0.25s;
  transform: rotate(${(p) => (p.$open ? '90deg' : '0deg')});
`;

const SectionName = styled.span`
  font-size: 1.05rem;
  font-weight: 600;
  color: #1a1a2e;
`;

const SectionBody = styled.div`
  padding: 0 20px 20px;
  border-top: 1px solid #f0f0f0;
  padding-top: 16px;
`;

const SmallTitle = styled.h4`
  font-size: 0.9rem;
  color: #555;
  margin: 16px 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const QuestionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  span {
    font-size: 0.95rem;
    font-weight: 500;
    color: #333;
  }
`;

const Row3 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const Row2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
  @media (max-width: 768px) { grid-template-columns: 1fr; }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  input, select, textarea {
    padding: 8px 10px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.9rem;
    font-family: inherit;
    transition: border 0.2s;
    &:focus { outline: none; border-color: #2387B6; }
  }

  textarea { resize: vertical; }
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 4px;

  th {
    text-align: left;
    font-size: 0.78rem;
    color: #777;
    text-transform: uppercase;
    padding: 6px 4px;
    border-bottom: 2px solid #e9ecef;
  }

  td {
    padding: 4px;
    input, select {
      width: 100%;
      padding: 6px 8px;
      border: 1.5px solid #e0e0e0;
      border-radius: 6px;
      font-size: 0.85rem;
      font-family: inherit;
      &:focus { outline: none; border-color: #2387B6; }
    }
  }
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.3rem;
  cursor: pointer;
  padding: 0 6px;
  line-height: 1;
  &:hover { color: #dc2626; }
`;

const AddRowBtn = styled.button`
  background: none;
  border: 1px dashed #2387B6;
  color: #2387B6;
  border-radius: 6px;
  padding: 4px 14px;
  font-size: 0.82rem;
  cursor: pointer;
  margin-top: 4px;
  &:hover { background: #f0f7fb; }
`;

const SaveSectionBtn = styled.button`
  background: #2387B6;
  color: white;
  border: none;
  padding: 10px 28px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.2s;
  &:hover { background: #1b6d94; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const ACWrap = styled.div`
  position: relative;
  input {
    width: 100%;
    padding: 8px 10px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.9rem;
    font-family: inherit;
    transition: border 0.2s;
    &:focus { outline: none; border-color: #2387B6; }
  }
`;

const ACDrop = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  max-height: 180px;
  overflow-y: auto;
  z-index: 20;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const ACOpt = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.88rem;
  &:hover { background: #f0f7fb; }
`;

/* ─── Modal styled components ─── */

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalBox = styled.div`
  background: white;
  border-radius: 14px;
  padding: 28px 32px;
  min-width: 360px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.18);
`;

const ModalTitle = styled.h3`
  font-size: 1.15rem;
  color: #1a1a2e;
  margin: 0 0 20px;
`;

const ModalField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 14px;

  label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  input {
    padding: 8px 10px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.9rem;
    font-family: inherit;
    transition: border 0.2s;
    &:focus { outline: none; border-color: #2387B6; }
  }
`;

const ModalButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
`;

const ModalCancel = styled.button`
  padding: 9px 22px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  color: #555;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  &:hover { background: #f5f5f5; }
`;

const ModalConfirm = styled.button`
  padding: 9px 22px;
  border: none;
  border-radius: 8px;
  background: #2387B6;
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #1b6d94; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

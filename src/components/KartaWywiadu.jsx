import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import ToggleCheckbox from './ToggleCheckbox';
import api from '../api/axios';
import { useNotification } from './Notification';

const RODZAJE_ODDECHU = ['prawidłowy', 'przyspieszony', 'zwolniony', 'Cheyne-Stokesa', 'Kussmaula', 'Biota', 'inny'];

const initData = (patient) => {
  const kw = patient?.karta_wywiadu || {};
  return {
    dane_oddzialowe: {
      enabled: true,
      kategoria_pacjenta: kw.dane_oddzialowe?.kategoria_pacjenta || patient?.dane_dodatkowe?.kategoria_pacjenta || '',
      oddzial: kw.dane_oddzialowe?.oddzial || patient?.dane_dodatkowe?.oddzial || patient?.jednostka || '',
      nr_sali: kw.dane_oddzialowe?.nr_sali || patient?.dane_dodatkowe?.nr_sali || '',
      data_przyjecia: kw.dane_oddzialowe?.data_przyjecia || patient?.dane_dodatkowe?.data_przyjecia || '',
      godz_przyjecia: kw.dane_oddzialowe?.godz_przyjecia || patient?.dane_dodatkowe?.godz_przyjecia || '',
      tryb_przyjecia: kw.dane_oddzialowe?.tryb_przyjecia || patient?.dane_dodatkowe?.tryb_przyjecia || '',
      przeniesienie: kw.dane_oddzialowe?.przeniesienie || '',
      leczenie_jednodniowe: kw.dane_oddzialowe?.leczenie_jednodniowe || false,
      pobyt_szpital_dni: kw.dane_oddzialowe?.pobyt_szpital_dni || '',
      zakazenie: kw.dane_oddzialowe?.zakazenie || false,
      lekarz: kw.dane_oddzialowe?.lekarz || patient?.dane_dodatkowe?.lekarz || '',
      lekarz_telefon: kw.dane_oddzialowe?.lekarz_telefon || patient?.dane_dodatkowe?.lekarz_telefon || '',
      przyczyna_przyjecia: kw.dane_oddzialowe?.przyczyna_przyjecia || patient?.dane_dodatkowe?.przyczyna_przyjecia || '',
    },
    kontakt: {
      enabled: false,
      typ: kw.kontakt?.typ || 'słowny',
      logiczny: kw.kontakt?.logiczny || false,
      zachowany: kw.kontakt?.zachowany || false,
      brak_kontaktu: kw.kontakt?.brak_kontaktu || false,
      osoba_imie: kw.kontakt?.osoba_imie || patient?.dane_opiekuna?.imie || '',
      osoba_nazwisko: kw.kontakt?.osoba_nazwisko || patient?.dane_opiekuna?.nazwisko || '',
      osoba_telefon: kw.kontakt?.osoba_telefon || patient?.dane_opiekuna?.telefon || '',
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
      wpisy: kw.alergie?.wpisy || [{ alergia: '', opis: '' }],
    },
    styl_zycia: {
      enabled: false,
      palenie: kw.styl_zycia?.palenie || false,
      palenie_ile: kw.styl_zycia?.palenie_ile || '',
      alkohol: kw.styl_zycia?.alkohol || false,
      alkohol_ile: kw.styl_zycia?.alkohol_ile || '',
      narkotyki: kw.styl_zycia?.narkotyki || false,
      narkotyki_jakie: kw.styl_zycia?.narkotyki_jakie || '',
      aktywnosc: kw.styl_zycia?.aktywnosc || '',
      dieta: kw.styl_zycia?.dieta || '',
    },
  };
};

export default function KartaWywiadu({ patient }) {
  const notify = useNotification();
  const [data, setData] = useState(() => initData(patient));
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/patients/${patient.id}`, { karta_wywiadu: data });
      notify('Karta wywiadu została zapisana', 'success');
    } catch (err) {
      console.error(err);
      notify('Błąd zapisu karty wywiadu', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!patient) return null;

  return (
    <Wrapper>
      <Title>Karta wywiadu — {patient.imie} {patient.nazwisko}</Title>

      {/* DANE ODDZIAŁOWE */}
      <Section>
        <SectionHeader onClick={() => toggleSection('dane_oddzialowe')}>
          <ToggleCheckbox checked={data.dane_oddzialowe.enabled} onChange={() => toggleSection('dane_oddzialowe')} />
          <SectionName>Dane oddziałowe</SectionName>
        </SectionHeader>
        {data.dane_oddzialowe.enabled && (
          <SectionBody>
            <Row3>
              <Field>
                <label>Kategoria pacjenta</label>
                <select value={data.dane_oddzialowe.kategoria_pacjenta} onChange={(e) => update('dane_oddzialowe', 'kategoria_pacjenta', e.target.value)}>
                  <option value="">— wybierz —</option>
                  <option>Kat I</option>
                  <option>Kat II</option>
                  <option>Kat III</option>
                </select>
              </Field>
              <Field>
                <label>Oddział</label>
                <input value={data.dane_oddzialowe.oddzial} onChange={(e) => update('dane_oddzialowe', 'oddzial', e.target.value)} />
              </Field>
              <Field>
                <label>Numer sali</label>
                <input value={data.dane_oddzialowe.nr_sali} onChange={(e) => update('dane_oddzialowe', 'nr_sali', e.target.value)} />
              </Field>
            </Row3>
            <Row3>
              <Field>
                <label>Data przyjęcia</label>
                <input type="date" value={data.dane_oddzialowe.data_przyjecia} onChange={(e) => update('dane_oddzialowe', 'data_przyjecia', e.target.value)} />
              </Field>
              <Field>
                <label>Godzina przyjęcia</label>
                <input type="time" value={data.dane_oddzialowe.godz_przyjecia} onChange={(e) => update('dane_oddzialowe', 'godz_przyjecia', e.target.value)} />
              </Field>
              <Field>
                <label>Tryb przyjęcia</label>
                <select value={data.dane_oddzialowe.tryb_przyjecia} onChange={(e) => update('dane_oddzialowe', 'tryb_przyjecia', e.target.value)}>
                  <option value="">— wybierz —</option>
                  <option>nagły</option>
                  <option>planowany</option>
                </select>
              </Field>
            </Row3>
            <Row3>
              <Field>
                <label>Przeniesienie z oddziału</label>
                <input value={data.dane_oddzialowe.przeniesienie} onChange={(e) => update('dane_oddzialowe', 'przeniesienie', e.target.value)} placeholder="jeśli dotyczy" />
              </Field>
              <Field>
                <label>Liczba dni w szpitalu</label>
                <input type="number" min="0" value={data.dane_oddzialowe.pobyt_szpital_dni} onChange={(e) => update('dane_oddzialowe', 'pobyt_szpital_dni', e.target.value)} />
              </Field>
              <Field>
                <label>Lekarz prowadzący</label>
                <input value={data.dane_oddzialowe.lekarz} onChange={(e) => update('dane_oddzialowe', 'lekarz', e.target.value)} />
              </Field>
            </Row3>
            <Row3>
              <Field>
                <label>Telefon lekarza</label>
                <input value={data.dane_oddzialowe.lekarz_telefon} onChange={(e) => update('dane_oddzialowe', 'lekarz_telefon', e.target.value)} />
              </Field>
              <Field style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 22 }}>
                <ToggleCheckbox checked={data.dane_oddzialowe.leczenie_jednodniowe} onChange={() => update('dane_oddzialowe', 'leczenie_jednodniowe', !data.dane_oddzialowe.leczenie_jednodniowe)} label="Leczenie jednodniowe" />
              </Field>
              <Field style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 22 }}>
                <ToggleCheckbox checked={data.dane_oddzialowe.zakazenie} onChange={() => update('dane_oddzialowe', 'zakazenie', !data.dane_oddzialowe.zakazenie)} label="Zakażenie szpitalne" />
              </Field>
            </Row3>
            <Field>
              <label>Przyczyna przyjęcia do szpitala</label>
              <textarea rows={3} value={data.dane_oddzialowe.przyczyna_przyjecia} onChange={(e) => update('dane_oddzialowe', 'przyczyna_przyjecia', e.target.value)} />
            </Field>
          </SectionBody>
        )}
      </Section>

      {/* KONTAKT Z PACJENTEM */}
      <Section>
        <SectionHeader onClick={() => toggleSection('kontakt')}>
          <ToggleCheckbox checked={data.kontakt.enabled} onChange={() => toggleSection('kontakt')} />
          <SectionName>Kontakt z pacjentem</SectionName>
        </SectionHeader>
        {data.kontakt.enabled && (
          <SectionBody>
            <Row3>
              <Field>
                <label>Typ kontaktu</label>
                <select value={data.kontakt.typ} onChange={(e) => update('kontakt', 'typ', e.target.value)}>
                  <option>słowny</option>
                  <option>pozasłowny</option>
                  <option>pisemny</option>
                </select>
              </Field>
              <Field style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10 }}>
                <ToggleCheckbox checked={data.kontakt.logiczny} onChange={() => update('kontakt', 'logiczny', !data.kontakt.logiczny)} label="Kontakt logiczny" />
                <ToggleCheckbox checked={data.kontakt.zachowany} onChange={() => update('kontakt', 'zachowany', !data.kontakt.zachowany)} label="Kontakt zachowany" />
              </Field>
              <Field style={{ display: 'flex', alignItems: 'center', paddingTop: 22 }}>
                <ToggleCheckbox checked={data.kontakt.brak_kontaktu} onChange={() => update('kontakt', 'brak_kontaktu', !data.kontakt.brak_kontaktu)} label="Brak kontaktu" />
              </Field>
            </Row3>
            <SmallTitle>Osoba kontaktowa</SmallTitle>
            <Row3>
              <Field>
                <label>Imię</label>
                <input value={data.kontakt.osoba_imie} onChange={(e) => update('kontakt', 'osoba_imie', e.target.value)} />
              </Field>
              <Field>
                <label>Nazwisko</label>
                <input value={data.kontakt.osoba_nazwisko} onChange={(e) => update('kontakt', 'osoba_nazwisko', e.target.value)} />
              </Field>
              <Field>
                <label>Telefon</label>
                <input value={data.kontakt.osoba_telefon} onChange={(e) => update('kontakt', 'osoba_telefon', e.target.value)} />
              </Field>
            </Row3>
          </SectionBody>
        )}
      </Section>

      {/* CHOROBY */}
      <Section>
        <SectionHeader onClick={() => toggleSection('choroby')}>
          <ToggleCheckbox checked={data.choroby.enabled} onChange={() => toggleSection('choroby')} />
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
          </SectionBody>
        )}
      </Section>

      {/* PARAMETRY */}
      <Section>
        <SectionHeader onClick={() => toggleSection('parametry')}>
          <ToggleCheckbox checked={data.parametry.enabled} onChange={() => toggleSection('parametry')} />
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
          </SectionBody>
        )}
      </Section>

      {/* OZNAKI ŻYCIA */}
      <Section>
        <SectionHeader onClick={() => toggleSection('oznaki_zycia')}>
          <ToggleCheckbox checked={data.oznaki_zycia.enabled} onChange={() => toggleSection('oznaki_zycia')} />
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
                <select value={data.oznaki_zycia.rodzaj_oddechu} onChange={(e) => update('oznaki_zycia', 'rodzaj_oddechu', e.target.value)}>
                  {RODZAJE_ODDECHU.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
            </Row3>
          </SectionBody>
        )}
      </Section>

      {/* OCENA BÓLU */}
      <Section>
        <SectionHeader onClick={() => toggleSection('ocena_bolu')}>
          <ToggleCheckbox checked={data.ocena_bolu.enabled} onChange={() => toggleSection('ocena_bolu')} />
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
          </SectionBody>
        )}
      </Section>

      {/* KREW */}
      <Section>
        <SectionHeader onClick={() => toggleSection('krew')}>
          <ToggleCheckbox checked={data.krew.enabled} onChange={() => toggleSection('krew')} />
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
          </SectionBody>
        )}
      </Section>

      {/* ALERGIE */}
      <Section>
        <SectionHeader onClick={() => toggleSection('alergie')}>
          <ToggleCheckbox checked={data.alergie.enabled} onChange={() => toggleSection('alergie')} />
          <SectionName>Alergie</SectionName>
        </SectionHeader>
        {data.alergie.enabled && (
          <SectionBody>
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
          </SectionBody>
        )}
      </Section>

      {/* STYL ŻYCIA */}
      <Section>
        <SectionHeader onClick={() => toggleSection('styl_zycia')}>
          <ToggleCheckbox checked={data.styl_zycia.enabled} onChange={() => toggleSection('styl_zycia')} />
          <SectionName>Styl życia</SectionName>
        </SectionHeader>
        {data.styl_zycia.enabled && (
          <SectionBody>
            <Row3>
              <Field>
                <ToggleCheckbox checked={data.styl_zycia.palenie} onChange={() => update('styl_zycia', 'palenie', !data.styl_zycia.palenie)} label="Palenie tytoniu" />
                {data.styl_zycia.palenie && (
                  <input style={{ marginTop: 8 }} value={data.styl_zycia.palenie_ile} onChange={(e) => update('styl_zycia', 'palenie_ile', e.target.value)} placeholder="ile dziennie?" />
                )}
              </Field>
              <Field>
                <ToggleCheckbox checked={data.styl_zycia.alkohol} onChange={() => update('styl_zycia', 'alkohol', !data.styl_zycia.alkohol)} label="Alkohol" />
                {data.styl_zycia.alkohol && (
                  <input style={{ marginTop: 8 }} value={data.styl_zycia.alkohol_ile} onChange={(e) => update('styl_zycia', 'alkohol_ile', e.target.value)} placeholder="ile / jak często?" />
                )}
              </Field>
              <Field>
                <ToggleCheckbox checked={data.styl_zycia.narkotyki} onChange={() => update('styl_zycia', 'narkotyki', !data.styl_zycia.narkotyki)} label="Narkotyki" />
                {data.styl_zycia.narkotyki && (
                  <input style={{ marginTop: 8 }} value={data.styl_zycia.narkotyki_jakie} onChange={(e) => update('styl_zycia', 'narkotyki_jakie', e.target.value)} placeholder="jakie?" />
                )}
              </Field>
            </Row3>
            <Row2>
              <Field>
                <label>Aktywność fizyczna</label>
                <textarea rows={2} value={data.styl_zycia.aktywnosc} onChange={(e) => update('styl_zycia', 'aktywnosc', e.target.value)} />
              </Field>
              <Field>
                <label>Dieta / odżywianie</label>
                <textarea rows={2} value={data.styl_zycia.dieta} onChange={(e) => update('styl_zycia', 'dieta', e.target.value)} />
              </Field>
            </Row2>
          </SectionBody>
        )}
      </Section>

      <SaveBar>
        <SaveBtn onClick={handleSave} disabled={saving}>
          {saving ? 'Zapisywanie...' : 'Zapisz kartę wywiadu'}
        </SaveBtn>
      </SaveBar>
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
  &:hover { background: #f8f9fa; }
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

const SaveBar = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 1.5rem 0;
`;

const SaveBtn = styled.button`
  background: #2387B6;
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #1b6d94; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

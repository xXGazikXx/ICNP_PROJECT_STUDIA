import { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import ToggleCheckbox from './ToggleCheckbox';
import api from '../api/axios';
import { useNotification } from './Notification';

const KRAJE = [
  'Polska', 'Niemcy', 'Francja', 'Wielka Brytania', 'Włochy', 'Hiszpania',
  'Czechy', 'Słowacja', 'Ukraina', 'Białoruś', 'Litwa', 'Rosja', 'Szwecja',
  'Norwegia', 'Dania', 'Holandia', 'Belgia', 'Austria', 'Szwajcaria',
  'Stany Zjednoczone', 'Kanada', 'Inne',
];
const WOJEWODZTWA = [
  'DOLNOŚLĄSKIE', 'KUJAWSKO-POMORSKIE', 'LUBELSKIE', 'LUBUSKIE', 'ŁÓDZKIE',
  'MAŁOPOLSKIE', 'MAZOWIECKIE', 'OPOLSKIE', 'PODKARPACKIE', 'PODLASKIE',
  'POMORSKIE', 'ŚLĄSKIE', 'ŚWIĘTOKRZYSKIE', 'WARMIŃSKO-MAZURSKIE',
  'WIELKOPOLSKIE', 'ZACHODNIOPOMORSKIE',
];
const STAN_CYWILNY = ['kawaler', 'panna', 'mężatka', 'mąż', 'wdowa', 'wdowiec'];
const WYKSZTALCENIE = ['podstawowe', 'gimnazjalne', 'zasadnicze zawodowe', 'średnie', 'wyższe'];
const KATEGORIE_PACJENTA = ['Kat I', 'Kat II', 'Kat III'];
const TRYBY_PRZYJECIA = ['nagły', 'planowany'];
const RODZAJE_ODDECHU = ['prawidłowy', 'przyspieszony', 'zwolniony', 'Cheyne-Stokesa', 'Kussmaula', 'Biota', 'inny'];
const TYPY_KONTAKTU = ['słowny', 'pozasłowny', 'pisemny'];
const GRUPY_KRWI = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'];
const WYZNANIA = ['rzymskokatolickie', 'prawosławne', 'ewangelickie', 'muzułmańskie', 'judaistyczne', 'buddyjskie', 'hinduistyczne', 'ateista', 'bezwyznaniowy', 'inne'];
const SPRZET_POMOCNICZY = ['okulary', 'soczewki kontaktowe', 'aparat słuchowy', 'proteza kończyny', 'proteza zębowa', 'wózek inwalidzki', 'kule', 'balkonik', 'laska', 'inne'];

/* ─── Inline Autocomplete ─── */
function ACInput({ value, onChange, options, placeholder, name }) {
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
      <input name={name} value={value} onChange={(e) => { onChange(e); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder} autoComplete="off" />
      {open && filtered.length > 0 && (
        <ACDrop>{filtered.slice(0, 8).map((o) => (
          <ACOpt key={o} onMouseDown={() => { onChange({ target: { name, value: o } }); setOpen(false); }}>{o}</ACOpt>
        ))}</ACDrop>
      )}
    </ACWrap>
  );
}

export default function KartaWywiadu({ patient, onPatientUpdated }) {
  const notify = useNotification();
  const [saving, setSaving] = useState(false);

  const buildForm = (p) => {
    if (!p) return {};
    const dp = p.dane_personalne || {};
    const adr = p.adres || {};
    const dd = p.dane_dodatkowe || {};
    const dok = p.dane_opiekuna || {};
    return {
      imie: p.imie || '', nazwisko: p.nazwisko || '',
      pesel: p.pesel || '', plec: p.plec || '',
      data_urodzenia: p.data_urodzenia || '',
      wiek: p.wiek != null ? String(p.wiek) : '',
      numer_ksiegi_glownej: p.numer_ksiegi_glownej || '',
      nazwisko_panienskie: dp.nazwisko_panienskie || '',
      kraj_urodzenia: dp.kraj_urodzenia || '',
      miejsce_urodzenia: dp.miejsce_urodzenia || '',
      wyznanie: dp.wyznanie || '', opieka_duszpasterska: dp.opieka_duszpasterska || false,
      kraj_zamieszkania: adr.kraj || '', wojewodztwo: adr.wojewodztwo || '',
      powiat: adr.powiat || '', miejscowosc: adr.miejscowosc || '',
      kod_pocztowy: adr.kod_pocztowy || '', ulica: adr.ulica || '',
      nr_domu: adr.nr_domu || '', nr_mieszkania: adr.nr_mieszkania || '',
      stan_cywilny: dd.stan_cywilny || '', wyksztalcenie: dd.wyksztalcenie || '',
      zawod_wykonywany: dd.zawod_wykonywany || '',
      opiekun_imie: dok.imie || '', opiekun_nazwisko: dok.nazwisko || '',
      opiekun_telefon: dok.telefon || '', opiekun_pokrewienstwo: dok.pokrewienstwo || '',
      kontakt_imie: dd.kontakt_imie || '', kontakt_nazwisko: dd.kontakt_nazwisko || '',
      kontakt_telefon: dd.kontakt_telefon || '',
      kategoria_pacjenta: dd.kategoria_pacjenta || '',
      oddzial: dd.oddzial || p.jednostka || '',
      nr_sali: dd.nr_sali || '',
      data_przyjecia: dd.data_przyjecia || '',
      godz_przyjecia: dd.godz_przyjecia || '',
      tryb_przyjecia: dd.tryb_przyjecia || '',
      lekarz: dd.lekarz || '', lekarz_telefon: dd.lekarz_telefon || '',
      przyczyna_przyjecia: dd.przyczyna_przyjecia || '',
    };
  };

  const buildKW = (p) => {
    const kw = p?.karta_wywiadu || {};
    return {
      kontakt: { typ: kw.kontakt?.typ || '', logiczny: kw.kontakt?.logiczny || false, zachowany: kw.kontakt?.zachowany || false, brak_kontaktu: kw.kontakt?.brak_kontaktu || false },
      choroby: { rozpoznanie_glowne: kw.choroby?.rozpoznanie_glowne || '', przewlekle_enabled: kw.choroby?.przewlekle_enabled || false, przewlekle: kw.choroby?.przewlekle || [], przebyte_enabled: kw.choroby?.przebyte_enabled || false, przebyte: kw.choroby?.przebyte || [], zabiegi_enabled: kw.choroby?.zabiegi_enabled || false, zabiegi: kw.choroby?.zabiegi || [] },
      leki: { enabled: kw.leki?.enabled || false, wpisy: kw.leki?.wpisy || [] },
      sprzet: { enabled: kw.sprzet?.enabled || false, wpisy: kw.sprzet?.wpisy || [] },
      parametry: { wzrost: kw.parametry?.wzrost || '', masa: kw.parametry?.masa || '', bmi: kw.parametry?.bmi || '', obwod_glowy: kw.parametry?.obwod_glowy || '', obwod_klatki: kw.parametry?.obwod_klatki || '' },
      oznaki_zycia: { temperatura: kw.oznaki_zycia?.temperatura || '', ctk_skurczowe: kw.oznaki_zycia?.ctk_skurczowe || '', ctk_rozkurczowe: kw.oznaki_zycia?.ctk_rozkurczowe || '', tetno: kw.oznaki_zycia?.tetno || '', oddech: kw.oznaki_zycia?.oddech || '', rodzaj_oddechu: kw.oznaki_zycia?.rodzaj_oddechu || 'prawidłowy' },
      ocena_bolu: { wystepuje: kw.ocena_bolu?.wystepuje || false, wpisy: kw.ocena_bolu?.wpisy || [] },
      krew: { grupa_krwi: kw.krew?.grupa_krwi || '', oznaczana: kw.krew?.oznaczana || false, oznaczana_data: kw.krew?.oznaczana_data || '', hiv: kw.krew?.hiv || 'nie wiem', transfuzje: kw.krew?.transfuzje || false, transfuzje_data: kw.krew?.transfuzje_data || '', transfuzje_reakcja: kw.krew?.transfuzje_reakcja || false },
      alergie: { wystepuja: kw.alergie?.wystepuja || false, wpisy: kw.alergie?.wpisy || [{ alergia: '', opis: '' }] },
      styl_zycia: { palenie: kw.styl_zycia?.palenie || false, palenie_ile: kw.styl_zycia?.palenie_ile || '', alkohol: kw.styl_zycia?.alkohol || false, alkohol_ile: kw.styl_zycia?.alkohol_ile || '', narkotyki: kw.styl_zycia?.narkotyki || false, narkotyki_wpisy: kw.styl_zycia?.narkotyki_wpisy || [{ nazwa: '', czestotliwosc: '' }], aktywnosc: kw.styl_zycia?.aktywnosc || '', dieta: kw.styl_zycia?.dieta || '' },
    };
  };

  const [form, setForm] = useState(() => buildForm(patient));
  const [kw, setKw] = useState(() => buildKW(patient));

  useEffect(() => {
    setForm(buildForm(patient));
    setKw(buildKW(patient));
  }, [patient?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'data_urodzenia' && value) {
      const age = Math.floor((Date.now() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
      setForm((prev) => ({ ...prev, data_urodzenia: value, wiek: age >= 0 ? String(age) : '' }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const kwUpdate = useCallback((section, field, value) => {
    setKw((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  }, []);

  const kwUpdateRow = (section, field, index, key, value) => {
    setKw((prev) => {
      const rows = [...prev[section][field]];
      rows[index] = { ...rows[index], [key]: value };
      return { ...prev, [section]: { ...prev[section], [field]: rows } };
    });
  };
  const kwAddRow = (section, field, template) => {
    setKw((prev) => ({ ...prev, [section]: { ...prev[section], [field]: [...prev[section][field], { ...template }] } }));
  };
  const kwRemoveRow = (section, field, index) => {
    setKw((prev) => {
      const rows = prev[section][field].filter((_, i) => i !== index);
      return { ...prev, [section]: { ...prev[section], [field]: rows.length ? rows : [{ ...prev[section][field][0] }] } };
    });
  };

  useEffect(() => {
    const w = parseFloat(kw.parametry.masa);
    const h = parseFloat(kw.parametry.wzrost) / 100;
    if (w > 0 && h > 0) kwUpdate('parametry', 'bmi', (w / (h * h)).toFixed(1));
  }, [kw.parametry.masa, kw.parametry.wzrost, kwUpdate]);

  const handleBrakKontaktu = () => {
    if (!kw.kontakt.brak_kontaktu) {
      setKw((prev) => ({ ...prev, kontakt: { ...prev.kontakt, brak_kontaktu: true, logiczny: false, zachowany: false, typ: '' } }));
    } else {
      kwUpdate('kontakt', 'brak_kontaktu', false);
    }
  };

  useEffect(() => {
    const kod = form.kod_pocztowy;
    if (!/^\d{2}-\d{3}$/.test(kod)) return;
    const ctrl = new AbortController();
    fetch(`https://kodpocztowy.intami.pl/api/${kod}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.length > 0) {
          setForm((prev) => ({
            ...prev,
            miejscowosc: data[0].miejscowosc || prev.miejscowosc,
            wojewodztwo: (data[0].wojewodztwo || '').toUpperCase() || prev.wojewodztwo,
            powiat: data[0].powiat || prev.powiat,
          }));
        }
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [form.kod_pocztowy]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        imie: form.imie, nazwisko: form.nazwisko,
        plec: form.plec || null,
        data_urodzenia: form.data_urodzenia || null,
        wiek: form.wiek ? parseInt(form.wiek, 10) : null,
        numer_ksiegi_glownej: form.numer_ksiegi_glownej || null,
        dane_personalne: { nazwisko_panienskie: form.nazwisko_panienskie || null, kraj_urodzenia: form.kraj_urodzenia || null, miejsce_urodzenia: form.miejsce_urodzenia || null, wyznanie: form.wyznanie || null, opieka_duszpasterska: form.opieka_duszpasterska || false },
        adres: { kraj: form.kraj_zamieszkania || null, wojewodztwo: form.wojewodztwo || null, powiat: form.powiat || null, miejscowosc: form.miejscowosc || null, kod_pocztowy: form.kod_pocztowy || null, ulica: form.ulica || null, nr_domu: form.nr_domu || null, nr_mieszkania: form.nr_mieszkania || null },
        dane_dodatkowe: { stan_cywilny: form.stan_cywilny || null, wyksztalcenie: form.wyksztalcenie || null, zawod_wykonywany: form.zawod_wykonywany || null, kategoria_pacjenta: form.kategoria_pacjenta || null, oddzial: form.oddzial || null, nr_sali: form.nr_sali || null, data_przyjecia: form.data_przyjecia || null, godz_przyjecia: form.godz_przyjecia || null, tryb_przyjecia: form.tryb_przyjecia || null, lekarz: form.lekarz || null, lekarz_telefon: form.lekarz_telefon || null, przyczyna_przyjecia: form.przyczyna_przyjecia || null, kontakt_imie: form.kontakt_imie || null, kontakt_nazwisko: form.kontakt_nazwisko || null, kontakt_telefon: form.kontakt_telefon || null },
        dane_opiekuna: { imie: form.opiekun_imie || null, nazwisko: form.opiekun_nazwisko || null, telefon: form.opiekun_telefon || null, pokrewienstwo: form.opiekun_pokrewienstwo || null },
        karta_wywiadu: kw,
      };
      await api.put(`/patients/${patient.id}`, payload);
      notify('Karta wywiadu zapisana pomyślnie', 'success');
      if (onPatientUpdated) onPatientUpdated();
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

      <FormArea>
        <SectionTitle>Dane personalne</SectionTitle>
        <Row3>
          <Field><label>Imię</label><input name="imie" value={form.imie} onChange={handleChange} /></Field>
          <Field><label>Nazwisko</label><input name="nazwisko" value={form.nazwisko} onChange={handleChange} /></Field>
          <Field><label>Nazwisko panieńskie</label><input name="nazwisko_panienskie" value={form.nazwisko_panienskie} onChange={handleChange} /></Field>
        </Row3>
        <Row>
          <Field>
            <label>Płeć</label>
            <RadioGroup>
              <label><input type="radio" name="plec" value="M" checked={form.plec === 'M'} onChange={handleChange} /> Mężczyzna</label>
              <label><input type="radio" name="plec" value="K" checked={form.plec === 'K'} onChange={handleChange} /> Kobieta</label>
            </RadioGroup>
          </Field>
        </Row>
        <Row3>
          <Field><label>PESEL</label><input name="pesel" value={form.pesel} readOnly style={{ background: '#f5f5f5' }} /></Field>
          <Field><label>Data urodzenia</label><input name="data_urodzenia" type="date" value={form.data_urodzenia} onChange={handleChange} /></Field>
          <Field><label>Wiek</label><input value={form.wiek} readOnly style={{ background: '#f5f5f5' }} /></Field>
        </Row3>
        <Row3>
          <Field><label>Numer księgi głównej</label><input name="numer_ksiegi_glownej" value={form.numer_ksiegi_glownej} onChange={handleChange} /></Field>
          <Field><label>Kraj urodzenia</label><ACInput name="kraj_urodzenia" value={form.kraj_urodzenia} onChange={handleChange} options={KRAJE} placeholder="Wpisz kraj..." /></Field>
          <Field><label>Miejsce urodzenia</label><input name="miejsce_urodzenia" value={form.miejsce_urodzenia} onChange={handleChange} /></Field>
        </Row3>
        <Row3>
          <Field><label>Wyznanie</label><ACInput name="wyznanie" value={form.wyznanie || ''} onChange={handleChange} options={WYZNANIA} placeholder="Wpisz wyznanie..." /></Field>
          <Field style={{ display: 'flex', alignItems: 'center', paddingTop: 22 }}>
            <ToggleCheckbox checked={!!form.opieka_duszpasterska} onChange={() => setForm((prev) => ({ ...prev, opieka_duszpasterska: !prev.opieka_duszpasterska }))} label="Opieka duszpasterska" />
          </Field>
        </Row3>

        <SectionTitle>Adres zamieszkania</SectionTitle>
        <Row3>
          <Field><label>Kod pocztowy</label><input name="kod_pocztowy" value={form.kod_pocztowy} onChange={handleChange} placeholder="00-000" /></Field>
          <Field><label>Miejscowość</label><input name="miejscowosc" value={form.miejscowosc} onChange={handleChange} /></Field>
          <Field><label>Województwo</label><ACInput name="wojewodztwo" value={form.wojewodztwo} onChange={handleChange} options={WOJEWODZTWA} placeholder="Wpisz województwo..." /></Field>
        </Row3>
        <Row3>
          <Field><label>Powiat</label><input name="powiat" value={form.powiat} onChange={handleChange} /></Field>
          <Field><label>Kraj zamieszkania</label><ACInput name="kraj_zamieszkania" value={form.kraj_zamieszkania} onChange={handleChange} options={KRAJE} placeholder="Wpisz kraj..." /></Field>
          <Field><label>Ulica</label><input name="ulica" value={form.ulica} onChange={handleChange} /></Field>
        </Row3>
        <Row2>
          <Field><label>Nr domu</label><input name="nr_domu" value={form.nr_domu} onChange={handleChange} /></Field>
          <Field><label>Nr mieszkania</label><input name="nr_mieszkania" value={form.nr_mieszkania} onChange={handleChange} /></Field>
        </Row2>

        <SectionTitle>Status Społeczny</SectionTitle>
        <Row3>
          <Field><label>Stan cywilny</label><ACInput name="stan_cywilny" value={form.stan_cywilny} onChange={handleChange} options={STAN_CYWILNY} placeholder="Wpisz stan cywilny..." /></Field>
          <Field><label>Wykształcenie</label><ACInput name="wyksztalcenie" value={form.wyksztalcenie} onChange={handleChange} options={WYKSZTALCENIE} placeholder="Wpisz wykształcenie..." /></Field>
          <Field><label>Zawód wykonywany</label><input name="zawod_wykonywany" value={form.zawod_wykonywany} onChange={handleChange} /></Field>
        </Row3>

        <SectionTitle>Dane opiekuna</SectionTitle>
        <Row3>
          <Field><label>Imię opiekuna</label><input name="opiekun_imie" value={form.opiekun_imie} onChange={handleChange} /></Field>
          <Field><label>Nazwisko opiekuna</label><input name="opiekun_nazwisko" value={form.opiekun_nazwisko} onChange={handleChange} /></Field>
          <Field><label>Telefon opiekuna</label><input name="opiekun_telefon" value={form.opiekun_telefon} onChange={handleChange} /></Field>
        </Row3>
        <Row2>
          <Field><label>Stopień pokrewieństwa</label><input name="opiekun_pokrewienstwo" value={form.opiekun_pokrewienstwo} onChange={handleChange} placeholder="np. matka, ojciec, brat" /></Field>
        </Row2>

        <SectionTitle>Osoba kontaktowa</SectionTitle>
        <Row3>
          <Field><label>Imię</label><input name="kontakt_imie" value={form.kontakt_imie} onChange={handleChange} /></Field>
          <Field><label>Nazwisko</label><input name="kontakt_nazwisko" value={form.kontakt_nazwisko} onChange={handleChange} /></Field>
          <Field><label>Telefon</label><input name="kontakt_telefon" value={form.kontakt_telefon} onChange={handleChange} /></Field>
        </Row3>

        <SectionTitle>Dane oddziałowe</SectionTitle>
        <Row3>
          <Field><label>Kategoria pacjenta</label><ACInput name="kategoria_pacjenta" value={form.kategoria_pacjenta} onChange={handleChange} options={KATEGORIE_PACJENTA} placeholder="Wybierz kategorię..." /></Field>
          <Field><label>Oddział</label><input name="oddzial" value={form.oddzial} onChange={handleChange} /></Field>
          <Field><label>Numer sali</label><input name="nr_sali" value={form.nr_sali} onChange={handleChange} inputMode="numeric" /></Field>
        </Row3>
        <Row3>
          <Field><label>Data przyjęcia</label><input name="data_przyjecia" type="date" value={form.data_przyjecia} onChange={handleChange} /></Field>
          <Field><label>Godzina przyjęcia</label><input name="godz_przyjecia" type="time" value={form.godz_przyjecia} onChange={handleChange} /></Field>
          <Field><label>Tryb przyjęcia</label><ACInput name="tryb_przyjecia" value={form.tryb_przyjecia} onChange={handleChange} options={TRYBY_PRZYJECIA} placeholder="Wybierz tryb..." /></Field>
        </Row3>
        <Row2>
          <Field><label>Lekarz prowadzący</label><input name="lekarz" value={form.lekarz} onChange={handleChange} /></Field>
          <Field><label>Telefon lekarza</label><input name="lekarz_telefon" value={form.lekarz_telefon} onChange={handleChange} /></Field>
        </Row2>
        <Field>
          <label>Przyczyna przyjęcia do szpitala</label>
          <textarea name="przyczyna_przyjecia" value={form.przyczyna_przyjecia} onChange={handleChange} rows={3} />
        </Field>

        {/* ═══ KARTA WYWIADU ═══ */}
        <SectionTitle>Kontakt z pacjentem</SectionTitle>
        <Row3>
          <Field>
            <label>Typ kontaktu</label>
            <ACInput name="__kw_typ" value={kw.kontakt.typ} onChange={(e) => kwUpdate('kontakt', 'typ', e.target.value)} options={TYPY_KONTAKTU} placeholder="Wpisz typ kontaktu..." />
          </Field>
          <Field style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 10 }}>
            <ToggleCheckbox checked={kw.kontakt.logiczny} onChange={() => !kw.kontakt.brak_kontaktu && kwUpdate('kontakt', 'logiczny', !kw.kontakt.logiczny)} label="Kontakt logiczny" />
            <ToggleCheckbox checked={kw.kontakt.zachowany} onChange={() => !kw.kontakt.brak_kontaktu && kwUpdate('kontakt', 'zachowany', !kw.kontakt.zachowany)} label="Kontakt zachowany" />
          </Field>
          <Field style={{ display: 'flex', alignItems: 'center', paddingTop: 22 }}>
            <ToggleCheckbox checked={kw.kontakt.brak_kontaktu} onChange={handleBrakKontaktu} label="Brak kontaktu" />
          </Field>
        </Row3>

        <SectionTitle>Choroby i zabiegi</SectionTitle>
        <Field>
          <label>Rozpoznanie główne</label>
          <textarea rows={3} value={kw.choroby.rozpoznanie_glowne} onChange={(e) => kwUpdate('choroby', 'rozpoznanie_glowne', e.target.value)} />
        </Field>
        <QuestionRow>
          <span>Choroby przewlekłe</span>
          <ToggleCheckbox checked={kw.choroby.przewlekle_enabled} onChange={() => kwUpdate('choroby', 'przewlekle_enabled', !kw.choroby.przewlekle_enabled)} label={kw.choroby.przewlekle_enabled ? 'Tak' : 'Nie'} />
        </QuestionRow>
        {kw.choroby.przewlekle_enabled && (
          <>
            <DataTable>
              <thead><tr><th>Choroba</th><th>Od kiedy</th><th>Leczenie</th><th></th></tr></thead>
              <tbody>
                {kw.choroby.przewlekle.map((row, i) => (
                  <tr key={i}>
                    <td><input value={row.choroba} onChange={(e) => kwUpdateRow('choroby', 'przewlekle', i, 'choroba', e.target.value)} /></td>
                    <td><input value={row.od_kiedy} onChange={(e) => kwUpdateRow('choroby', 'przewlekle', i, 'od_kiedy', e.target.value)} placeholder="rok" /></td>
                    <td><input value={row.leczenie} onChange={(e) => kwUpdateRow('choroby', 'przewlekle', i, 'leczenie', e.target.value)} /></td>
                    <td><RemoveBtn onClick={() => kwRemoveRow('choroby', 'przewlekle', i)}>×</RemoveBtn></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <AddRowBtn onClick={() => kwAddRow('choroby', 'przewlekle', { choroba: '', od_kiedy: '', leczenie: '' })}>+ Dodaj</AddRowBtn>
          </>
        )}
        <QuestionRow>
          <span>Przebyte choroby</span>
          <ToggleCheckbox checked={kw.choroby.przebyte_enabled} onChange={() => kwUpdate('choroby', 'przebyte_enabled', !kw.choroby.przebyte_enabled)} label={kw.choroby.przebyte_enabled ? 'Tak' : 'Nie'} />
        </QuestionRow>
        {kw.choroby.przebyte_enabled && (
          <>
            <DataTable>
              <thead><tr><th>Choroba</th><th>Kiedy</th><th></th></tr></thead>
              <tbody>
                {kw.choroby.przebyte.map((row, i) => (
                  <tr key={i}>
                    <td><input value={row.choroba} onChange={(e) => kwUpdateRow('choroby', 'przebyte', i, 'choroba', e.target.value)} /></td>
                    <td><input value={row.kiedy} onChange={(e) => kwUpdateRow('choroby', 'przebyte', i, 'kiedy', e.target.value)} placeholder="rok" /></td>
                    <td><RemoveBtn onClick={() => kwRemoveRow('choroby', 'przebyte', i)}>×</RemoveBtn></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <AddRowBtn onClick={() => kwAddRow('choroby', 'przebyte', { choroba: '', kiedy: '' })}>+ Dodaj</AddRowBtn>
          </>
        )}
        <QuestionRow>
          <span>Przebyte zabiegi operacyjne</span>
          <ToggleCheckbox checked={kw.choroby.zabiegi_enabled} onChange={() => kwUpdate('choroby', 'zabiegi_enabled', !kw.choroby.zabiegi_enabled)} label={kw.choroby.zabiegi_enabled ? 'Tak' : 'Nie'} />
        </QuestionRow>
        {kw.choroby.zabiegi_enabled && (
          <>
            <DataTable>
              <thead><tr><th>Zabieg</th><th>Data</th><th></th></tr></thead>
              <tbody>
                {kw.choroby.zabiegi.map((row, i) => (
                  <tr key={i}>
                    <td><input value={row.zabieg} onChange={(e) => kwUpdateRow('choroby', 'zabiegi', i, 'zabieg', e.target.value)} /></td>
                    <td><input type="date" value={row.data} onChange={(e) => kwUpdateRow('choroby', 'zabiegi', i, 'data', e.target.value)} /></td>
                    <td><RemoveBtn onClick={() => kwRemoveRow('choroby', 'zabiegi', i)}>×</RemoveBtn></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <AddRowBtn onClick={() => kwAddRow('choroby', 'zabiegi', { zabieg: '', data: '' })}>+ Dodaj</AddRowBtn>
          </>
        )}

        <SectionTitle>Leki</SectionTitle>
        <QuestionRow>
          <span>Leki na stałe</span>
          <ToggleCheckbox checked={kw.leki.enabled} onChange={() => kwUpdate('leki', 'enabled', !kw.leki.enabled)} label={kw.leki.enabled ? 'Tak' : 'Nie'} />
        </QuestionRow>
        {kw.leki.enabled && (
          <>
            <DataTable>
              <thead><tr><th>Nazwa</th><th>Dawka</th><th>Ile razy</th><th>Doraźnie</th><th></th></tr></thead>
              <tbody>
                {kw.leki.wpisy.map((row, i) => (
                  <tr key={i}>
                    <td><input value={row.nazwa} onChange={(e) => kwUpdateRow('leki', 'wpisy', i, 'nazwa', e.target.value)} /></td>
                    <td><input value={row.dawka} onChange={(e) => kwUpdateRow('leki', 'wpisy', i, 'dawka', e.target.value)} /></td>
                    <td><input value={row.ile_razy} onChange={(e) => kwUpdateRow('leki', 'wpisy', i, 'ile_razy', e.target.value)} /></td>
                    <td style={{ textAlign: 'center' }}><input type="checkbox" checked={!!row.doraznie} onChange={(e) => kwUpdateRow('leki', 'wpisy', i, 'doraznie', e.target.checked)} style={{ width: 'auto' }} /></td>
                    <td><RemoveBtn onClick={() => kwRemoveRow('leki', 'wpisy', i)}>×</RemoveBtn></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <AddRowBtn onClick={() => kwAddRow('leki', 'wpisy', { nazwa: '', dawka: '', ile_razy: '', doraznie: false })}>+ Dodaj</AddRowBtn>
          </>
        )}

        <SectionTitle>Sprzęt</SectionTitle>
        <QuestionRow>
          <span>Czy korzysta ze sprzętu pomocniczego?</span>
          <ToggleCheckbox checked={kw.sprzet.enabled} onChange={() => kwUpdate('sprzet', 'enabled', !kw.sprzet.enabled)} label={kw.sprzet.enabled ? 'Tak' : 'Nie'} />
        </QuestionRow>
        {kw.sprzet.enabled && (
          <>
            <DataTable>
              <thead><tr><th>Sprzęt</th><th></th></tr></thead>
              <tbody>
                {kw.sprzet.wpisy.map((row, i) => (
                  <tr key={i}>
                    <td><ACInput name={`__kw_sprzet_${i}`} value={row.nazwa} onChange={(e) => kwUpdateRow('sprzet', 'wpisy', i, 'nazwa', e.target.value)} options={SPRZET_POMOCNICZY} placeholder="Wpisz sprzęt..." /></td>
                    <td><RemoveBtn onClick={() => kwRemoveRow('sprzet', 'wpisy', i)}>×</RemoveBtn></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <AddRowBtn onClick={() => kwAddRow('sprzet', 'wpisy', { nazwa: '' })}>+ Dodaj</AddRowBtn>
          </>
        )}

        <SectionTitle>Parametry</SectionTitle>
        <Row3>
          <Field><label>Wzrost (cm)</label><input type="number" min="0" value={kw.parametry.wzrost} onChange={(e) => kwUpdate('parametry', 'wzrost', e.target.value)} /></Field>
          <Field><label>Masa ciała (kg)</label><input type="number" min="0" step="0.1" value={kw.parametry.masa} onChange={(e) => kwUpdate('parametry', 'masa', e.target.value)} /></Field>
          <Field><label>BMI</label><input value={kw.parametry.bmi} readOnly style={{ background: '#f0f0f0' }} /></Field>
        </Row3>
        <Row2>
          <Field><label>Obwód głowy (cm)</label><input type="number" min="0" value={kw.parametry.obwod_glowy} onChange={(e) => kwUpdate('parametry', 'obwod_glowy', e.target.value)} /></Field>
          <Field><label>Obwód klatki piersiowej (cm)</label><input type="number" min="0" value={kw.parametry.obwod_klatki} onChange={(e) => kwUpdate('parametry', 'obwod_klatki', e.target.value)} /></Field>
        </Row2>

        <SectionTitle>Oznaki życia</SectionTitle>
        <Row3>
          <Field><label>Temperatura (°C)</label><input type="number" step="0.1" min="30" max="45" value={kw.oznaki_zycia.temperatura} onChange={(e) => kwUpdate('oznaki_zycia', 'temperatura', e.target.value)} /></Field>
          <Field><label>CTK skurczowe (mmHg)</label><input type="number" min="0" value={kw.oznaki_zycia.ctk_skurczowe} onChange={(e) => kwUpdate('oznaki_zycia', 'ctk_skurczowe', e.target.value)} /></Field>
          <Field><label>CTK rozkurczowe (mmHg)</label><input type="number" min="0" value={kw.oznaki_zycia.ctk_rozkurczowe} onChange={(e) => kwUpdate('oznaki_zycia', 'ctk_rozkurczowe', e.target.value)} /></Field>
        </Row3>
        <Row3>
          <Field><label>Tętno (ud./min)</label><input type="number" min="0" value={kw.oznaki_zycia.tetno} onChange={(e) => kwUpdate('oznaki_zycia', 'tetno', e.target.value)} /></Field>
          <Field><label>Oddech (odd./min)</label><input type="number" min="0" value={kw.oznaki_zycia.oddech} onChange={(e) => kwUpdate('oznaki_zycia', 'oddech', e.target.value)} /></Field>
          <Field><label>Rodzaj oddechu</label><ACInput name="__kw_oddech" value={kw.oznaki_zycia.rodzaj_oddechu} onChange={(e) => kwUpdate('oznaki_zycia', 'rodzaj_oddechu', e.target.value)} options={RODZAJE_ODDECHU} placeholder="Wpisz rodzaj..." /></Field>
        </Row3>

        <SectionTitle>Ocena bólu</SectionTitle>
        <QuestionRow>
          <span>Czy występuje ból?</span>
          <ToggleCheckbox checked={kw.ocena_bolu.wystepuje} onChange={() => kwUpdate('ocena_bolu', 'wystepuje', !kw.ocena_bolu.wystepuje)} label={kw.ocena_bolu.wystepuje ? 'Tak' : 'Nie'} />
        </QuestionRow>
        {kw.ocena_bolu.wystepuje && (
          <>
            <DataTable>
              <thead><tr><th>Kategoria</th><th>Lokalizacja</th><th>Częstotliwość</th><th>Intensywność</th><th></th></tr></thead>
              <tbody>
                {kw.ocena_bolu.wpisy.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <select value={row.kategoria} onChange={(e) => kwUpdateRow('ocena_bolu', 'wpisy', i, 'kategoria', e.target.value)}>
                        <option value="">— wybierz —</option><option>ostry</option><option>przewlekły</option><option>nawracający</option>
                      </select>
                    </td>
                    <td><input value={row.lokalizacja} onChange={(e) => kwUpdateRow('ocena_bolu', 'wpisy', i, 'lokalizacja', e.target.value)} /></td>
                    <td>
                      <select value={row.czestotliwosc} onChange={(e) => kwUpdateRow('ocena_bolu', 'wpisy', i, 'czestotliwosc', e.target.value)}>
                        <option value="">— wybierz —</option><option>ciągły</option><option>okresowy</option><option>sporadyczny</option>
                      </select>
                    </td>
                    <td><input type="number" min="0" max="10" value={row.intensywnosc} onChange={(e) => kwUpdateRow('ocena_bolu', 'wpisy', i, 'intensywnosc', e.target.value)} /></td>
                    <td><RemoveBtn onClick={() => kwRemoveRow('ocena_bolu', 'wpisy', i)}>×</RemoveBtn></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <AddRowBtn onClick={() => kwAddRow('ocena_bolu', 'wpisy', { kategoria: '', lokalizacja: '', czestotliwosc: '', intensywnosc: '' })}>+ Dodaj</AddRowBtn>
          </>
        )}

        <SectionTitle>Krew</SectionTitle>
        <Row3>
          <Field>
            <label>Grupa krwi</label>
            <ACInput name="__kw_grupa_krwi" value={kw.krew.grupa_krwi} onChange={(e) => kwUpdate('krew', 'grupa_krwi', e.target.value)} options={GRUPY_KRWI} placeholder="Wpisz grupę krwi..." />
          </Field>
        </Row3>
        <QuestionRow>
          <span>Czy była kiedyś oznaczana grupa krwi?</span>
          <ToggleCheckbox checked={kw.krew.oznaczana} onChange={() => kwUpdate('krew', 'oznaczana', !kw.krew.oznaczana)} label={kw.krew.oznaczana ? 'Tak' : 'Nie'} />
        </QuestionRow>
        {kw.krew.oznaczana && (
          <Field style={{ marginBottom: 12 }}><label>Data oznaczenia</label><input type="date" value={kw.krew.oznaczana_data} onChange={(e) => kwUpdate('krew', 'oznaczana_data', e.target.value)} /></Field>
        )}
        <QuestionRow>
          <span>HIV</span>
          <div style={{ display: 'flex', gap: 12 }}>
            {['tak', 'nie', 'nie wiem'].map((opt) => (
              <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="radio" name="__kw_hiv" value={opt} checked={kw.krew.hiv === opt} onChange={() => kwUpdate('krew', 'hiv', opt)} style={{ width: 'auto', margin: 0 }} />
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </label>
            ))}
          </div>
        </QuestionRow>
        <QuestionRow>
          <span>Transfuzje krwi</span>
          <ToggleCheckbox checked={kw.krew.transfuzje} onChange={() => kwUpdate('krew', 'transfuzje', !kw.krew.transfuzje)} label={kw.krew.transfuzje ? 'Tak' : 'Nie'} />
        </QuestionRow>
        {kw.krew.transfuzje && (
          <Row2>
            <Field><label>Data transfuzji</label><input type="date" value={kw.krew.transfuzje_data} onChange={(e) => kwUpdate('krew', 'transfuzje_data', e.target.value)} /></Field>
            <Field style={{ display: 'flex', alignItems: 'center', paddingTop: 22 }}>
              <ToggleCheckbox checked={kw.krew.transfuzje_reakcja} onChange={() => kwUpdate('krew', 'transfuzje_reakcja', !kw.krew.transfuzje_reakcja)} label="Była reakcja potransfuzyjna" />
            </Field>
          </Row2>
        )}

        <SectionTitle>Alergie</SectionTitle>
        <QuestionRow>
          <span>Czy występują alergie?</span>
          <ToggleCheckbox checked={kw.alergie.wystepuja} onChange={() => kwUpdate('alergie', 'wystepuja', !kw.alergie.wystepuja)} label={kw.alergie.wystepuja ? 'Tak' : 'Nie'} />
        </QuestionRow>
        {kw.alergie.wystepuja && (
          <>
            <DataTable>
              <thead><tr><th>Alergia</th><th>Opis reakcji</th><th></th></tr></thead>
              <tbody>
                {kw.alergie.wpisy.map((row, i) => (
                  <tr key={i}>
                    <td><input value={row.alergia} onChange={(e) => kwUpdateRow('alergie', 'wpisy', i, 'alergia', e.target.value)} /></td>
                    <td><input value={row.opis} onChange={(e) => kwUpdateRow('alergie', 'wpisy', i, 'opis', e.target.value)} /></td>
                    <td><RemoveBtn onClick={() => kwRemoveRow('alergie', 'wpisy', i)}>×</RemoveBtn></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <AddRowBtn onClick={() => kwAddRow('alergie', 'wpisy', { alergia: '', opis: '' })}>+ Dodaj</AddRowBtn>
          </>
        )}

        <SectionTitle>Styl życia</SectionTitle>
        <QuestionRow>
          <span>Palenie tytoniu</span>
          <ToggleCheckbox checked={kw.styl_zycia.palenie} onChange={() => kwUpdate('styl_zycia', 'palenie', !kw.styl_zycia.palenie)} label={kw.styl_zycia.palenie ? 'Tak' : 'Nie'} />
        </QuestionRow>
        {kw.styl_zycia.palenie && (
          <Field style={{ marginBottom: 12 }}><label>Ile dziennie?</label><input value={kw.styl_zycia.palenie_ile} onChange={(e) => kwUpdate('styl_zycia', 'palenie_ile', e.target.value)} placeholder="np. 10 sztuk" /></Field>
        )}
        <QuestionRow>
          <span>Alkohol</span>
          <ToggleCheckbox checked={kw.styl_zycia.alkohol} onChange={() => kwUpdate('styl_zycia', 'alkohol', !kw.styl_zycia.alkohol)} label={kw.styl_zycia.alkohol ? 'Tak' : 'Nie'} />
        </QuestionRow>
        {kw.styl_zycia.alkohol && (
          <Field style={{ marginBottom: 12 }}><label>Ile / jak często?</label><input value={kw.styl_zycia.alkohol_ile} onChange={(e) => kwUpdate('styl_zycia', 'alkohol_ile', e.target.value)} placeholder="np. okazjonalnie" /></Field>
        )}
        <QuestionRow>
          <span>Narkotyki</span>
          <ToggleCheckbox checked={kw.styl_zycia.narkotyki} onChange={() => kwUpdate('styl_zycia', 'narkotyki', !kw.styl_zycia.narkotyki)} label={kw.styl_zycia.narkotyki ? 'Tak' : 'Nie'} />
        </QuestionRow>
        {kw.styl_zycia.narkotyki && (
          <>
            <DataTable>
              <thead><tr><th>Nazwa substancji</th><th>Częstotliwość</th><th></th></tr></thead>
              <tbody>
                {kw.styl_zycia.narkotyki_wpisy.map((row, i) => (
                  <tr key={i}>
                    <td><input value={row.nazwa} onChange={(e) => kwUpdateRow('styl_zycia', 'narkotyki_wpisy', i, 'nazwa', e.target.value)} /></td>
                    <td><input value={row.czestotliwosc} onChange={(e) => kwUpdateRow('styl_zycia', 'narkotyki_wpisy', i, 'czestotliwosc', e.target.value)} /></td>
                    <td><RemoveBtn onClick={() => kwRemoveRow('styl_zycia', 'narkotyki_wpisy', i)}>×</RemoveBtn></td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
            <AddRowBtn onClick={() => kwAddRow('styl_zycia', 'narkotyki_wpisy', { nazwa: '', czestotliwosc: '' })}>+ Dodaj</AddRowBtn>
          </>
        )}
        <Row2 style={{ marginTop: 16 }}>
          <Field>
            <label>Aktywność fizyczna</label>
            <textarea rows={2} value={kw.styl_zycia.aktywnosc} onChange={(e) => kwUpdate('styl_zycia', 'aktywnosc', e.target.value)} />
          </Field>
          <Field>
            <label>Dieta / odżywianie</label>
            <textarea rows={2} value={kw.styl_zycia.dieta} onChange={(e) => kwUpdate('styl_zycia', 'dieta', e.target.value)} />
          </Field>
        </Row2>

        <SaveBar>
          <SaveBtn onClick={handleSave} disabled={saving}>
            {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
          </SaveBtn>
        </SaveBar>
      </FormArea>
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

const FormArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const SectionTitle = styled.h3`
  font-size: 0.95rem;
  color: #2387B6;
  border-bottom: 2px solid #2387B6;
  padding-bottom: 4px;
  margin: 0.5rem 0 0;
`;

const Row = styled.div`
  display: flex;
  gap: 1rem;
`;

const Row2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const Row3 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  @media (max-width: 600px) { grid-template-columns: 1fr; }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 1.5rem;
  padding-top: 4px;
  label { display: flex; align-items: center; gap: 4px; font-size: 0.9rem; cursor: pointer; }
  input[type="radio"] { width: auto; margin: 0; }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 0.8rem;
    font-weight: 500;
    color: #555;
  }

  input, select, textarea {
    padding: 8px 10px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.9rem;
    font-family: inherit;
    transition: border-color 0.2s;
    resize: vertical;
    &:focus { outline: none; border-color: #2387B6; }
  }
`;

const SmallTitle = styled.h4`
  font-size: 0.8rem;
  font-weight: 500;
  color: #555;
  margin: 10px 0 4px;
`;

const QuestionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 4px 0;
  span { font-size: 0.9rem; font-weight: 500; color: #333; }
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 4px;
  th { text-align: left; font-size: 0.75rem; color: #777; text-transform: uppercase; padding: 5px 4px; border-bottom: 2px solid #e9ecef; }
  td { padding: 3px 4px;
    input, select { width: 100%; padding: 5px 7px; border: 1.5px solid #e0e0e0; border-radius: 6px; font-size: 0.83rem; font-family: inherit; &:focus { outline: none; border-color: #2387B6; } }
  }
`;

const RemoveBtn = styled.button`
  background: none; border: none; color: #ef4444; font-size: 1.2rem; cursor: pointer; padding: 0 5px; line-height: 1;
  &:hover { color: #dc2626; }
`;

const AddRowBtn = styled.button`
  background: none; border: 1px dashed #2387B6; color: #2387B6; border-radius: 6px; padding: 3px 12px; font-size: 0.8rem; cursor: pointer; margin-top: 4px;
  &:hover { background: #f0f7fb; }
`;

const SaveBar = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 2px solid #e0e0e0;
`;

const SaveBtn = styled.button`
  padding: 12px 36px;
  border: none;
  border-radius: 8px;
  background: #2387B6;
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: #1b6d94; }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const ACWrap = styled.div`
  position: relative;
  input { width: 100%; box-sizing: border-box; }
`;

const ACDrop = styled.div`
  position: absolute;
  top: 100%;
  left: 0; right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 0 0 8px 8px;
  max-height: 180px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const ACOpt = styled.div`
  padding: 8px 12px;
  font-size: 0.88rem;
  cursor: pointer;
  &:hover { background: #e8f4f8; color: #2387B6; }
`;

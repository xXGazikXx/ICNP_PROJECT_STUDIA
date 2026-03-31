import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import api from '../api/axios';

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

function AutocompleteInput({ value, onChange, options, placeholder, name }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const filtered = options.filter((o) =>
    o.toLowerCase().includes((value || '').toLowerCase())
  );
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <ACWrapper ref={ref}>
      <input
        name={name}
        value={value}
        onChange={(e) => { onChange(e); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ACDropdown>
          {filtered.slice(0, 8).map((o) => (
            <ACOption
              key={o}
              onMouseDown={() => {
                onChange({ target: { name, value: o } });
                setOpen(false);
              }}
            >
              {o}
            </ACOption>
          ))}
        </ACDropdown>
      )}
    </ACWrapper>
  );
}

export default function AddPatientModal({ onClose, onAdded, editData, jednostka }) {
  const isEdit = !!editData;

  const initForm = () => {
    if (editData) {
      const dp = editData.dane_personalne || {};
      const adr = editData.adres || {};
      const dd = editData.dane_dodatkowe || {};
      const dok = editData.dane_opiekuna || {};
      return {
        imie: editData.imie || '', nazwisko: editData.nazwisko || '',
        pesel: editData.pesel || '', plec: editData.plec || '',
        data_urodzenia: editData.data_urodzenia || '',
        wiek: editData.wiek != null ? String(editData.wiek) : '',
        numer_ksiegi_glownej: editData.numer_ksiegi_glownej || '',
        nazwisko_panienskie: dp.nazwisko_panienskie || '',
        kraj_urodzenia: dp.kraj_urodzenia || '',
        miejsce_urodzenia: dp.miejsce_urodzenia || '',
        kraj_zamieszkania: adr.kraj || '', wojewodztwo: adr.wojewodztwo || '',
        powiat: adr.powiat || '', miejscowosc: adr.miejscowosc || '',
        kod_pocztowy: adr.kod_pocztowy || '', ulica: adr.ulica || '',
        nr_domu: adr.nr_domu || '', nr_mieszkania: adr.nr_mieszkania || '',
        stan_cywilny: dd.stan_cywilny || '', wyksztalcenie: dd.wyksztalcenie || '',
        zawod_wykonywany: dd.zawod_wykonywany || '',
        opiekun_imie: dok.imie || '', opiekun_nazwisko: dok.nazwisko || '',
        opiekun_telefon: dok.telefon || '',
      };
    }
    return {
      imie: '', nazwisko: '', pesel: '', plec: '', data_urodzenia: '', wiek: '',
      numer_ksiegi_glownej: '', nazwisko_panienskie: '', kraj_urodzenia: '',
      miejsce_urodzenia: '', kraj_zamieszkania: '', wojewodztwo: '', powiat: '',
      miejscowosc: '', kod_pocztowy: '', ulica: '', nr_domu: '', nr_mieszkania: '',
      stan_cywilny: '', wyksztalcenie: '', zawod_wykonywany: '',
      opiekun_imie: '', opiekun_nazwisko: '', opiekun_telefon: '',
    };
  };

  const [form, setForm] = useState(initForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'pesel') {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      setForm((prev) => {
        const next = { ...prev, pesel: digits };
        if (digits.length === 11) {
          const year = parseInt(digits.substring(0, 2), 10);
          const month = parseInt(digits.substring(2, 4), 10);
          let fullYear, realMonth;
          if (month > 20) { fullYear = 2000 + year; realMonth = month - 20; }
          else { fullYear = 1900 + year; realMonth = month; }
          const day = digits.substring(4, 6);
          const dateStr = `${fullYear}-${String(realMonth).padStart(2, '0')}-${day}`;
          const age = Math.floor((Date.now() - new Date(dateStr)) / (365.25 * 24 * 60 * 60 * 1000));
          next.data_urodzenia = dateStr;
          next.wiek = age >= 0 ? String(age) : '';
        }
        return next;
      });
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'data_urodzenia' && value) {
      const age = Math.floor((Date.now() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
      setForm((prev) => ({
        ...prev,
        data_urodzenia: value,
        wiek: age >= 0 ? String(age) : '',
      }));
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        imie: form.imie,
        nazwisko: form.nazwisko,
        pesel: form.pesel,
        plec: form.plec || null,
        data_urodzenia: form.data_urodzenia || null,
        wiek: form.wiek ? parseInt(form.wiek, 10) : null,
        numer_ksiegi_glownej: form.numer_ksiegi_glownej || null,
        jednostka: jednostka || null,
        dane_personalne: {
          nazwisko_panienskie: form.nazwisko_panienskie || null,
          kraj_urodzenia: form.kraj_urodzenia || null,
          miejsce_urodzenia: form.miejsce_urodzenia || null,
        },
        adres: {
          kraj: form.kraj_zamieszkania || null,
          wojewodztwo: form.wojewodztwo || null,
          powiat: form.powiat || null,
          miejscowosc: form.miejscowosc || null,
          kod_pocztowy: form.kod_pocztowy || null,
          ulica: form.ulica || null,
          nr_domu: form.nr_domu || null,
          nr_mieszkania: form.nr_mieszkania || null,
        },
        dane_dodatkowe: {
          stan_cywilny: form.stan_cywilny || null,
          wyksztalcenie: form.wyksztalcenie || null,
          zawod_wykonywany: form.zawod_wykonywany || null,
        },
        dane_opiekuna: {
          imie: form.opiekun_imie || null,
          nazwisko: form.opiekun_nazwisko || null,
          telefon: form.opiekun_telefon || null,
        },
      };

      if (isEdit) {
        await api.put(`/patients/${editData.id}`, payload);
      } else {
        await api.post('/patients', payload);
      }
      onAdded();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.msg ||
        err.response?.data?.message ||
        'Błąd dodawania pacjenta';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? 'Edytuj pacjenta' : 'Karta wywiadu — Dodaj pacjenta'}</h2>

        {error && <Error>{error}</Error>}

        <Form onSubmit={handleSubmit}>
          <SectionTitle>Dane personalne</SectionTitle>

          <Row3>
            <Field>
              <label>Imię *</label>
              <input name="imie" value={form.imie} onChange={handleChange} required />
            </Field>
            <Field>
              <label>Nazwisko *</label>
              <input name="nazwisko" value={form.nazwisko} onChange={handleChange} required />
            </Field>
            <Field>
              <label>Nazwisko panieńskie</label>
              <input name="nazwisko_panienskie" value={form.nazwisko_panienskie} onChange={handleChange} />
            </Field>
          </Row3>

          <Row>
            <Field>
              <label>Płeć</label>
              <RadioGroup>
                <label>
                  <input type="radio" name="plec" value="M" checked={form.plec === 'M'} onChange={handleChange} />
                  Mężczyzna
                </label>
                <label>
                  <input type="radio" name="plec" value="K" checked={form.plec === 'K'} onChange={handleChange} />
                  Kobieta
                </label>
              </RadioGroup>
            </Field>
          </Row>

          <Row3>
            <Field>
              <label>PESEL *</label>
              <input name="pesel" value={form.pesel} onChange={handleChange} inputMode="numeric" maxLength={11} placeholder="00000000000" required />
            </Field>
            <Field>
              <label>Data urodzenia</label>
              <input name="data_urodzenia" value={form.data_urodzenia} onChange={handleChange} type="date" />
            </Field>
            <Field>
              <label>Wiek</label>
              <input name="wiek" value={form.wiek} readOnly style={{ background: '#f5f5f5' }} />
            </Field>
          </Row3>

          <Row3>
            <Field>
              <label>Numer księgi głównej</label>
              <input name="numer_ksiegi_glownej" value={form.numer_ksiegi_glownej} onChange={handleChange} />
            </Field>
            <Field>
              <label>Kraj urodzenia</label>
              <AutocompleteInput name="kraj_urodzenia" value={form.kraj_urodzenia} onChange={handleChange} options={KRAJE} placeholder="Wpisz kraj..." />
            </Field>
            <Field>
              <label>Miejsce urodzenia</label>
              <input name="miejsce_urodzenia" value={form.miejsce_urodzenia} onChange={handleChange} />
            </Field>
          </Row3>

          <SectionTitle>Adres zamieszkania</SectionTitle>

          <Row3>
            <Field>
              <label>Kod pocztowy</label>
              <input name="kod_pocztowy" value={form.kod_pocztowy} onChange={handleChange} placeholder="00-000" />
            </Field>
            <Field>
              <label>Miejscowość</label>
              <input name="miejscowosc" value={form.miejscowosc} onChange={handleChange} />
            </Field>
            <Field>
              <label>Województwo</label>
              <AutocompleteInput name="wojewodztwo" value={form.wojewodztwo} onChange={handleChange} options={WOJEWODZTWA} placeholder="Wpisz województwo..." />
            </Field>
          </Row3>

          <Row3>
            <Field>
              <label>Powiat</label>
              <input name="powiat" value={form.powiat} onChange={handleChange} />
            </Field>
            <Field>
              <label>Kraj zamieszkania</label>
              <AutocompleteInput name="kraj_zamieszkania" value={form.kraj_zamieszkania} onChange={handleChange} options={KRAJE} placeholder="Wpisz kraj..." />
            </Field>
            <Field>
              <label>Ulica</label>
              <input name="ulica" value={form.ulica} onChange={handleChange} />
            </Field>
          </Row3>

          <Row2>
            <Field>
              <label>Nr domu</label>
              <input name="nr_domu" value={form.nr_domu} onChange={handleChange} />
            </Field>
            <Field>
              <label>Nr mieszkania</label>
              <input name="nr_mieszkania" value={form.nr_mieszkania} onChange={handleChange} />
            </Field>
          </Row2>

          <SectionTitle>Dane dodatkowe</SectionTitle>

          <Row3>
            <Field>
              <label>Stan cywilny</label>
              <AutocompleteInput name="stan_cywilny" value={form.stan_cywilny} onChange={handleChange} options={STAN_CYWILNY} placeholder="Wpisz stan cywilny..." />
            </Field>
            <Field>
              <label>Wykształcenie</label>
              <AutocompleteInput name="wyksztalcenie" value={form.wyksztalcenie} onChange={handleChange} options={WYKSZTALCENIE} placeholder="Wpisz wykształcenie..." />
            </Field>
            <Field>
              <label>Zawód wykonywany</label>
              <input name="zawod_wykonywany" value={form.zawod_wykonywany} onChange={handleChange} />
            </Field>
          </Row3>

          <SectionTitle>Dane opiekuna</SectionTitle>

          <Row3>
            <Field>
              <label>Imię opiekuna</label>
              <input name="opiekun_imie" value={form.opiekun_imie} onChange={handleChange} />
            </Field>
            <Field>
              <label>Nazwisko opiekuna</label>
              <input name="opiekun_nazwisko" value={form.opiekun_nazwisko} onChange={handleChange} />
            </Field>
            <Field>
              <label>Telefon opiekuna</label>
              <input name="opiekun_telefon" value={form.opiekun_telefon} onChange={handleChange} />
            </Field>
          </Row3>

          <Buttons>
            <BtnCancel type="button" onClick={onClose}>Anuluj</BtnCancel>
            <BtnSubmit type="submit" disabled={loading}>
              {loading ? (isEdit ? 'Zapisywanie...' : 'Dodawanie...') : (isEdit ? 'Zapisz zmiany' : 'Dodaj pacjenta')}
            </BtnSubmit>
          </Buttons>
        </Form>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 900px;
  max-width: 95vw;
  max-height: 90vh;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);

  h2 {
    margin-bottom: 1.5rem;
    color: #1a1a2e;
    font-size: 1.3rem;
  }
`;

const Error = styled.div`
  color: #e74c3c;
  background: #ffeaea;
  padding: 8px 16px;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9em;
`;

const Form = styled.form`
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
`;

const Row3 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const RadioGroup = styled.div`
  display: flex;
  gap: 1.5rem;
  padding-top: 4px;

  label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.9rem;
    cursor: pointer;
  }

  input[type="radio"] {
    width: auto;
    margin: 0;
  }
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

  input, select {
    padding: 8px 10px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #2387B6;
    }
  }
`;

const Buttons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const BtnCancel = styled.button`
  padding: 10px 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
  }
`;

const BtnSubmit = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #2387B6;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1b6d94;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ACWrapper = styled.div`
  position: relative;
  input {
    width: 100%;
    box-sizing: border-box;
  }
`;

const ACDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 0 0 8px 8px;
  max-height: 180px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
`;

const ACOption = styled.div`
  padding: 8px 12px;
  font-size: 0.88rem;
  cursor: pointer;
  &:hover {
    background: #e8f4f8;
    color: #2387B6;
  }
`;

import { useState } from 'react';
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

export default function AddPatientModal({ onClose, onAdded, editData }) {
  const isEdit = !!editData;
  const [form, setForm] = useState({
    imie: '', nazwisko: '', nazwisko_panienskie: '', plec: '',
    pesel: '', wiek: '', data_urodzenia: '',
    kraj_urodzenia: '', wojewodztwo_urodzenia: '', miejsce_urodzenia: '',
    kraj_zamieszkania: '', wojewodztwo_zamieszkania: '', powiat_zamieszkania: '',
    miejsce_zamieszkania: '', kod_pocztowy: '', ulica_zamieszkania: '',
    nr_domu: '', nr_mieszkania: '',
    stan_cywilny: '', wyksztalcenie: '', zawod_wykonywany: '',
    opiekun_imie: '', opiekun_nazwisko: '', opiekun_telefon: '',
    lokalizacja: '',
    ...(editData ? Object.fromEntries(
      Object.entries(editData).filter(([_, v]) => v != null).map(([k, v]) => [k, String(v)])
    ) : {}),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === 'data_urodzenia' && value) {
      const age = Math.floor((Date.now() - new Date(value)) / (365.25 * 24 * 60 * 60 * 1000));
      setForm((prev) => ({
        ...prev,
        data_urodzenia: value,
        wiek: age >= 0 ? String(age) : '',
      }));
    }

    if (name === 'pesel' && value.length === 11) {
      const year = parseInt(value.substring(0, 2), 10);
      const month = parseInt(value.substring(2, 4), 10);
      let fullYear, realMonth;
      if (month > 20) {
        fullYear = 2000 + year;
        realMonth = month - 20;
      } else {
        fullYear = 1900 + year;
        realMonth = month;
      }
      const day = value.substring(4, 6);
      const dateStr = `${fullYear}-${String(realMonth).padStart(2, '0')}-${day}`;
      const age = Math.floor((Date.now() - new Date(dateStr)) / (365.25 * 24 * 60 * 60 * 1000));
      setForm((prev) => ({
        ...prev,
        data_urodzenia: dateStr,
        wiek: age >= 0 ? String(age) : '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { ...form };
      if (payload.wiek) payload.wiek = parseInt(payload.wiek, 10);
      else delete payload.wiek;
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      delete payload.id;
      delete payload.autor;
      delete payload.created_by;
      delete payload.created_at;
      delete payload.updated_at;

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
              <input name="pesel" value={form.pesel} onChange={handleChange} maxLength={11} pattern="[0-9]{11}" title="PESEL musi mieć 11 cyfr" required />
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
              <label>Kraj urodzenia</label>
              <select name="kraj_urodzenia" value={form.kraj_urodzenia} onChange={handleChange}>
                <option value="">-- wybierz --</option>
                {KRAJE.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
            <Field>
              <label>Województwo urodzenia</label>
              <select name="wojewodztwo_urodzenia" value={form.wojewodztwo_urodzenia} onChange={handleChange}>
                <option value="">-- wybierz --</option>
                {WOJEWODZTWA.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
            <Field>
              <label>Miejsce urodzenia</label>
              <input name="miejsce_urodzenia" value={form.miejsce_urodzenia} onChange={handleChange} />
            </Field>
          </Row3>

          <SectionTitle>Adres zamieszkania</SectionTitle>

          <Row3>
            <Field>
              <label>Kraj zamieszkania</label>
              <select name="kraj_zamieszkania" value={form.kraj_zamieszkania} onChange={handleChange}>
                <option value="">-- wybierz --</option>
                {KRAJE.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
            <Field>
              <label>Województwo</label>
              <select name="wojewodztwo_zamieszkania" value={form.wojewodztwo_zamieszkania} onChange={handleChange}>
                <option value="">-- wybierz --</option>
                {WOJEWODZTWA.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
            <Field>
              <label>Powiat</label>
              <input name="powiat_zamieszkania" value={form.powiat_zamieszkania} onChange={handleChange} />
            </Field>
          </Row3>

          <Row3>
            <Field>
              <label>Miejscowość</label>
              <input name="miejsce_zamieszkania" value={form.miejsce_zamieszkania} onChange={handleChange} />
            </Field>
            <Field>
              <label>Kod pocztowy</label>
              <input name="kod_pocztowy" value={form.kod_pocztowy} onChange={handleChange} placeholder="99-999" />
            </Field>
            <Field>
              <label>Ulica</label>
              <input name="ulica_zamieszkania" value={form.ulica_zamieszkania} onChange={handleChange} />
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
              <select name="stan_cywilny" value={form.stan_cywilny} onChange={handleChange}>
                <option value="">-- wybierz --</option>
                {STAN_CYWILNY.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field>
              <label>Wykształcenie</label>
              <select name="wyksztalcenie" value={form.wyksztalcenie} onChange={handleChange}>
                <option value="">-- wybierz --</option>
                {WYKSZTALCENIE.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
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

          <SectionTitle>Lokalizacja</SectionTitle>

          <Field>
            <label>Lokalizacja (oddział / sala)</label>
            <input name="lokalizacja" value={form.lokalizacja} onChange={handleChange} placeholder="np. Oddział Okulistyki, sala: 2" />
          </Field>

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

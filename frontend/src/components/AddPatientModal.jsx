import { useState } from 'react';
import styled from 'styled-components';
import api from '../api/axios';

export default function AddPatientModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    imie: '',
    nazwisko: '',
    pesel: '',
    lokalizacja: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/patients', form);
      onAdded(res.data);
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
        <h2>Dodaj pacjenta</h2>

        {error && <Error>{error}</Error>}

        <Form onSubmit={handleSubmit}>
          <Field>
            <label>Imię *</label>
            <input
              name="imie"
              value={form.imie}
              onChange={handleChange}
              required
            />
          </Field>

          <Field>
            <label>Nazwisko *</label>
            <input
              name="nazwisko"
              value={form.nazwisko}
              onChange={handleChange}
              required
            />
          </Field>

          <Field>
            <label>PESEL *</label>
            <input
              name="pesel"
              value={form.pesel}
              onChange={handleChange}
              maxLength={11}
              pattern="[0-9]{11}"
              title="PESEL musi mieć 11 cyfr"
              required
            />
          </Field>

          <Field>
            <label>Lokalizacja</label>
            <input
              name="lokalizacja"
              value={form.lokalizacja}
              onChange={handleChange}
              placeholder="np. Oddział Okulistyki, sala: 2"
            />
          </Field>

          <Buttons>
            <BtnCancel type="button" onClick={onClose}>
              Anuluj
            </BtnCancel>
            <BtnSubmit type="submit" disabled={loading}>
              {loading ? 'Dodawanie...' : 'Dodaj'}
            </BtnSubmit>
          </Buttons>
        </Form>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
  width: 420px;
  max-width: 95vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);

  h2 {
    margin-bottom: 1.5rem;
    color: #1a1a2e;
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
  gap: 1rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #555;
  }

  input {
    padding: 10px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #0d9488;
    }
  }
`;

const Buttons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
`;

const BtnCancel = styled.button`
  padding: 10px 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  transition: all 0.2s;

  &:hover {
    background: #f5f5f5;
  }
`;

const BtnSubmit = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #0d9488;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: #0b7c72;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

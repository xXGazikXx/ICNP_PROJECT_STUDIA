import { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../api/axios';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [prowadzacyList, setProwadzacyList] = useState([]);
  const [form, setForm] = useState({
    username: '',
    password: '',
    imie: '',
    nazwisko: '',
    email: '',
    role: 'student',
    prowadzacy_id: '',
  });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
      setProwadzacyList(res.data.filter((u) => u.role === 'prowadzacy'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form };
      if (!payload.prowadzacy_id) delete payload.prowadzacy_id;
      if (!payload.email) delete payload.email;
      await api.post('/users', payload);
      setShowForm(false);
      setForm({
        username: '',
        password: '',
        imie: '',
        nazwisko: '',
        email: '',
        role: 'student',
        prowadzacy_id: '',
      });
      fetchUsers();
    } catch (err) {
      setError(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.message ||
          'Błąd tworzenia użytkownika'
      );
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Na pewno usunąć tego użytkownika?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const ROLE_LABELS = {
    admin: 'Administrator',
    prowadzacy: 'Prowadzący',
    student: 'Student',
  };

  return (
    <Container>
      <Header>
        <h1>Zarządzanie użytkownikami</h1>
        <AddBtn onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Anuluj' : '+ Dodaj użytkownika'}
        </AddBtn>
      </Header>

      {showForm && (
        <FormCard onSubmit={handleSubmit}>
          {error && <Error>{error}</Error>}
          <Row>
            <Field>
              <label>Login *</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </Field>
            <Field>
              <label>Hasło *</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </Field>
          </Row>
          <Row>
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
          </Row>
          <Row>
            <Field>
              <label>Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />
            </Field>
            <Field>
              <label>Rola *</label>
              <select name="role" value={form.role} onChange={handleChange}>
                <option value="student">Student</option>
                <option value="prowadzacy">Prowadzący</option>
                <option value="admin">Administrator</option>
              </select>
            </Field>
          </Row>
          {form.role === 'student' && (
            <Field>
              <label>Prowadzący</label>
              <select
                name="prowadzacy_id"
                value={form.prowadzacy_id}
                onChange={handleChange}
              >
                <option value="">— brak —</option>
                {prowadzacyList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.imie} {p.nazwisko}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <SubmitBtn type="submit">Utwórz użytkownika</SubmitBtn>
        </FormCard>
      )}

      <Table>
        <thead>
          <tr>
            <th>Login</th>
            <th>Imię</th>
            <th>Nazwisko</th>
            <th>Rola</th>
            <th>Prowadzący</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.imie}</td>
              <td>{u.nazwisko}</td>
              <td>{ROLE_LABELS[u.role]}</td>
              <td>
                {u.prowadzacy
                  ? `${u.prowadzacy.imie} ${u.prowadzacy.nazwisko}`
                  : '—'}
              </td>
              <td>
                <DeleteBtn onClick={() => handleDelete(u.id)}>Usuń</DeleteBtn>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h1 {
    font-size: 1.8rem;
    color: #1a1a2e;
  }
`;

const AddBtn = styled.button`
  background: #2387B6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: #1b6d94;
  }
`;

const FormCard = styled.form`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Error = styled.div`
  color: #e74c3c;
  background: #ffeaea;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.9em;
`;

const Row = styled.div`
  display: flex;
  gap: 1rem;
`;

const Field = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;

  label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #555;
  }

  input,
  select {
    padding: 10px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #2387B6;
    }
  }
`;

const SubmitBtn = styled.button`
  align-self: flex-end;
  padding: 10px 24px;
  background: #2387B6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: #1b6d94;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  th {
    background: #f8f9fa;
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 0.85rem;
    color: #555;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid #e9ecef;
  }

  td {
    padding: 12px 16px;
    border-bottom: 1px solid #f0f0f0;
    font-size: 0.95rem;
  }

  tbody tr:hover {
    background: #f8fffe;
  }
`;

const DeleteBtn = styled.button`
  padding: 6px 12px;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  background: white;
  color: #e74c3c;
  font-size: 0.82rem;
  transition: all 0.2s;

  &:hover {
    background: #e74c3c;
    color: white;
  }
`;

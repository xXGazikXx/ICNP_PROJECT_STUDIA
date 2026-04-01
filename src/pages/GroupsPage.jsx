import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function GroupsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  // Student creation
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentForm, setStudentForm] = useState({
    username: '',
    password: '',
    imie: '',
    nazwisko: '',
    email: '',
  });
  const [studentError, setStudentError] = useState('');

  // Add member to group
  const [addMemberGroupId, setAddMemberGroupId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get('/users');
      setStudents(res.data.filter((u) => u.role === 'student'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchStudents();
  }, []);

  // --- GROUP CRUD ---
  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingGroup) {
        await api.put(`/groups/${editingGroup.id}`, { nazwa: groupName });
      } else {
        await api.post('/groups', { nazwa: groupName });
      }
      setGroupName('');
      setEditingGroup(null);
      setShowGroupForm(false);
      fetchGroups();
    } catch (err) {
      setError(err.response?.data?.message || 'Błąd zapisu grupy');
    }
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setGroupName(group.nazwa);
    setShowGroupForm(true);
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Na pewno usunąć tę grupę?')) return;
    try {
      await api.delete(`/groups/${id}`);
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  // --- STUDENT CRUD ---
  const handleStudentChange = (e) => {
    setStudentForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const resetStudentForm = () => {
    setStudentForm({ username: '', password: '', imie: '', nazwisko: '', email: '' });
    setEditingStudent(null);
    setShowStudentForm(false);
    setStudentError('');
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student);
    setStudentForm({
      username: student.username,
      password: '',
      imie: student.imie,
      nazwisko: student.nazwisko,
      email: student.email || '',
    });
    setShowStudentForm(true);
    setStudentError('');
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    setStudentError('');
    try {
      if (editingStudent) {
        const payload = {
          username: studentForm.username,
          imie: studentForm.imie,
          nazwisko: studentForm.nazwisko,
          email: studentForm.email || null,
          role: 'student',
        };
        if (studentForm.password) payload.password = studentForm.password;
        await api.put(`/users/${editingStudent.id}`, payload);
      } else {
        await api.post('/users', {
          username: studentForm.username,
          password: studentForm.password,
          imie: studentForm.imie,
          nazwisko: studentForm.nazwisko,
          email: studentForm.email || undefined,
          role: 'student',
        });
      }
      resetStudentForm();
      fetchStudents();
    } catch (err) {
      setStudentError(
        err.response?.data?.errors?.[0]?.msg ||
          err.response?.data?.message ||
          'Błąd zapisu studenta'
      );
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Na pewno usunąć tego studenta?')) return;
    try {
      await api.delete(`/users/${id}`);
      fetchStudents();
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  // --- MEMBERS ---
  const handleAddMember = async (groupId) => {
    if (!selectedStudentId) return;
    try {
      await api.post(`/groups/${groupId}/members`, { user_id: parseInt(selectedStudentId) });
      setAddMemberGroupId(null);
      setSelectedStudentId('');
      fetchGroups();
    } catch (err) {
      alert(err.response?.data?.message || 'Błąd dodawania do grupy');
    }
  };

  const handleRemoveMember = async (groupId, userId) => {
    if (!window.confirm('Usunąć studenta z grupy?')) return;
    try {
      await api.delete(`/groups/${groupId}/members/${userId}`);
      fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const getMembersNotInGroup = (group) => {
    const memberIds = group.members.map((m) => m.id);
    return students.filter((s) => !memberIds.includes(s.id));
  };

  return (
    <Container>
      {/* STUDENTS SECTION */}
      <Section>
        <Header>
          <h1>Studenci</h1>
          <AddBtn onClick={() => { if (showStudentForm) resetStudentForm(); else setShowStudentForm(true); }}>
            {showStudentForm ? 'Anuluj' : '+ Dodaj studenta'}
          </AddBtn>
        </Header>

        {showStudentForm && (
          <FormCard onSubmit={handleStudentSubmit}>
            {studentError && <Error>{studentError}</Error>}
            <Row>
              <Field>
                <label>Login *</label>
                <input name="username" value={studentForm.username} onChange={handleStudentChange} required />
              </Field>
              <Field>
                <label>{editingStudent ? 'Nowe hasło (opcjonalne)' : 'Hasło *'}</label>
                <input
                  name="password"
                  type="password"
                  value={studentForm.password}
                  onChange={handleStudentChange}
                  {...(editingStudent ? {} : { required: true, minLength: 6 })}
                  placeholder={editingStudent ? 'Zostaw puste, aby nie zmieniać' : ''}
                />
              </Field>
            </Row>
            <Row>
              <Field>
                <label>Imię *</label>
                <input name="imie" value={studentForm.imie} onChange={handleStudentChange} required />
              </Field>
              <Field>
                <label>Nazwisko *</label>
                <input name="nazwisko" value={studentForm.nazwisko} onChange={handleStudentChange} required />
              </Field>
            </Row>
            <Row>
              <Field>
                <label>Email</label>
                <input name="email" type="email" value={studentForm.email} onChange={handleStudentChange} />
              </Field>
              <Field />
            </Row>
            <SubmitBtn type="submit">{editingStudent ? 'Zapisz zmiany' : 'Utwórz studenta'}</SubmitBtn>
          </FormCard>
        )}

        <Table>
          <thead>
            <tr>
              <th>Login</th>
              <th>Imię</th>
              <th>Nazwisko</th>
              <th>Email</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.username}</td>
                <td>{s.imie}</td>
                <td>{s.nazwisko}</td>
                <td>{s.email || '—'}</td>
                <td>
                  <ActionRow>
                    <EditBtn onClick={() => handleEditStudent(s)}>Edytuj</EditBtn>
                    <DeleteBtn onClick={() => handleDeleteStudent(s.id)}>Usuń</DeleteBtn>
                  </ActionRow>
                </td>
              </tr>
            ))}
            {students.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Brak studentów</td></tr>
            )}
          </tbody>
        </Table>
      </Section>

      {/* GROUPS SECTION */}
      <Section>
        <Header>
          <h1>Grupy</h1>
          <AddBtn onClick={() => {
            if (showGroupForm) { setShowGroupForm(false); setGroupName(''); setEditingGroup(null); }
            else setShowGroupForm(true);
          }}>
            {showGroupForm ? 'Anuluj' : '+ Utwórz grupę'}
          </AddBtn>
        </Header>

        {showGroupForm && (
          <FormCard onSubmit={handleGroupSubmit}>
            {error && <Error>{error}</Error>}
            <Row>
              <Field>
                <label>Nazwa grupy *</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                  placeholder="np. Grupa A - Chirurgia"
                />
              </Field>
            </Row>
            <SubmitBtn type="submit">{editingGroup ? 'Zapisz zmiany' : 'Utwórz grupę'}</SubmitBtn>
          </FormCard>
        )}

        {groups.length === 0 && !showGroupForm && (
          <EmptyMsg>Nie masz jeszcze żadnych grup. Utwórz pierwszą grupę!</EmptyMsg>
        )}

        {groups.map((group) => (
          <GroupCard key={group.id}>
            <GroupHeader>
              <GroupName>{group.nazwa}</GroupName>
              <GroupActions>
                <ViewBtn onClick={() => navigate(`/groups/${group.id}`)}>Podgląd grupy</ViewBtn>
                <EditBtn onClick={() => handleEditGroup(group)}>Edytuj</EditBtn>
                <DeleteBtn onClick={() => handleDeleteGroup(group.id)}>Usuń</DeleteBtn>
              </GroupActions>
            </GroupHeader>

            <MembersList>
              <MembersTitle>Członkowie ({group.members?.length || 0}):</MembersTitle>
              {group.members?.length > 0 ? (
                group.members.map((m) => (
                  <MemberItem key={m.id}>
                    <span>{m.imie} {m.nazwisko} ({m.username})</span>
                    <RemoveBtn onClick={() => handleRemoveMember(group.id, m.id)}>×</RemoveBtn>
                  </MemberItem>
                ))
              ) : (
                <EmptyMembers>Brak członków w grupie</EmptyMembers>
              )}
            </MembersList>

            {addMemberGroupId === group.id ? (
              <AddMemberRow>
                <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                  <option value="">— Wybierz studenta —</option>
                  {getMembersNotInGroup(group).map((s) => (
                    <option key={s.id} value={s.id}>{s.imie} {s.nazwisko} ({s.username})</option>
                  ))}
                </select>
                <SmallBtn onClick={() => handleAddMember(group.id)}>Dodaj</SmallBtn>
                <SmallBtnCancel onClick={() => { setAddMemberGroupId(null); setSelectedStudentId(''); }}>Anuluj</SmallBtnCancel>
              </AddMemberRow>
            ) : (
              <AddMemberBtn onClick={() => setAddMemberGroupId(group.id)}>+ Dodaj członka</AddMemberBtn>
            )}
          </GroupCard>
        ))}
      </Section>
    </Container>
  );
}

// --- STYLED COMPONENTS ---

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Section = styled.div`
  margin-bottom: 3rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h1 {
    font-size: 1.8rem;
    color: var(--text-primary);
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
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1b6d94;
  }
`;

const FormCard = styled.form`
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow-color);
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
    color: var(--text-secondary);
  }

  input, select {
    padding: 10px 12px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--bg-input);
    color: var(--text-primary);
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
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1b6d94;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-card);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color);

  th {
    background: var(--bg-tabs);
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 2px solid var(--border-light);
  }

  td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-light);
    font-size: 0.95rem;
    color: var(--text-primary);
  }

  tbody tr:hover {
    background: var(--bg-hover);
  }
`;

const ActionRow = styled.div`
  display: flex;
  gap: 8px;
`;

const EditBtn = styled.button`
  padding: 6px 12px;
  border: 1px solid #2387B6;
  border-radius: 6px;
  background: transparent;
  color: #2387B6;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #2387B6;
    color: white;
  }
`;

const DeleteBtn = styled.button`
  padding: 6px 12px;
  border: 1px solid #e74c3c;
  border-radius: 6px;
  background: transparent;
  color: #e74c3c;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #e74c3c;
    color: white;
  }
`;

const ViewBtn = styled.button`
  padding: 6px 12px;
  border: 1px solid #27ae60;
  border-radius: 6px;
  background: transparent;
  color: #27ae60;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #27ae60;
    color: white;
  }
`;

const GroupCard = styled.div`
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px var(--shadow-color);
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const GroupName = styled.h2`
  font-size: 1.2rem;
  color: var(--text-primary);
`;

const GroupActions = styled.div`
  display: flex;
  gap: 8px;
`;

const MembersList = styled.div`
  margin-bottom: 0.8rem;
`;

const MembersTitle = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MemberItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: var(--bg-hover);
  border-radius: 6px;
  margin-bottom: 4px;
  font-size: 0.9rem;
  color: var(--text-primary);
`;

const RemoveBtn = styled.button`
  background: transparent;
  border: none;
  color: #e74c3c;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;

  &:hover {
    color: #c0392b;
  }
`;

const EmptyMembers = styled.div`
  color: var(--text-muted);
  font-size: 0.85rem;
  font-style: italic;
`;

const EmptyMsg = styled.div`
  text-align: center;
  color: var(--text-muted);
  padding: 2rem;
  font-size: 1rem;
`;

const AddMemberBtn = styled.button`
  background: transparent;
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  padding: 8px 16px;
  color: #2387B6;
  font-size: 0.85rem;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;

  &:hover {
    border-color: #2387B6;
    background: var(--bg-hover);
  }
`;

const AddMemberRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  select {
    flex: 1;
    padding: 8px 12px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    font-size: 0.9rem;
    background: var(--bg-input);
    color: var(--text-primary);

    &:focus {
      outline: none;
      border-color: #2387B6;
    }
  }
`;

const SmallBtn = styled.button`
  padding: 8px 16px;
  background: #2387B6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    background: #1b6d94;
  }
`;

const SmallBtnCancel = styled.button`
  padding: 8px 16px;
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;

  &:hover {
    background: var(--bg-hover);
  }
`;

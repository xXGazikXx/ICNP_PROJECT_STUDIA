import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import api from '../api/axios';
import PatientSidebar from '../components/PatientSidebar';
import KartaWywiadu from '../components/KartaWywiadu';
import PlanOpieki from '../components/PlanOpieki';
import Loader from '../components/Loader';

const TABS = [
  { key: 'aktualny', label: 'Pacjenci aktualni' },
  { key: 'wypisany', label: 'Pacjenci wypisani' },
  { key: 'archiwum', label: 'Dydaktyka archiwum' },
];

export default function GroupViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [patients, setPatients] = useState([]);
  const [activeTab, setActiveTab] = useState('aktualny');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeSection, setActiveSection] = useState('lista');
  const [loading, setLoading] = useState(true);
  const [filterMember, setFilterMember] = useState('');

  const fetchGroup = async () => {
    try {
      const res = await api.get('/groups');
      const found = res.data.find((g) => g.id === parseInt(id));
      setGroup(found || null);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get(`/groups/${id}/patients`);
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchPatients();
  }, [id]);

  const filteredPatients = patients.filter((p) => {
    const matchesTab = p.status === activeTab;
    const matchesMember = !filterMember || p.created_by === parseInt(filterMember);
    return matchesTab && matchesMember;
  });

  const handleSelect = (patient) => {
    setSelectedPatient(patient);
    setActiveSection('wywiad');
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'wywiad':
        return <KartaWywiadu patient={selectedPatient} onPatientUpdated={fetchPatients} />;
      case 'diagnozy':
        return <PlanOpieki patient={selectedPatient} />;
      default:
        return null;
    }
  };

  if (!group && !loading) {
    return (
      <Container>
        <BackBtn onClick={() => navigate('/groups')}>← Powrót do grup</BackBtn>
        <EmptyMsg>Grupa nie znaleziona</EmptyMsg>
      </Container>
    );
  }

  return (
    <Layout>
      {selectedPatient && (
        <PatientSidebar
          patient={selectedPatient}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onDeselect={() => { setSelectedPatient(null); setActiveSection('lista'); }}
        />
      )}
      <Container $hasSidebar={!!selectedPatient}>
        <TopBar>
          <BackBtn onClick={() => navigate('/groups')}>← Powrót do grup</BackBtn>
          {group && <GroupTitle>Podgląd grupy: {group.nazwa}</GroupTitle>}
        </TopBar>

        {group && group.members?.length > 0 && (
          <MembersBar>
            <MembersLabel>Członkowie grupy:</MembersLabel>
            <MemberChips>
              <MemberChip
                $active={!filterMember}
                onClick={() => setFilterMember('')}
              >
                Wszyscy ({group.members.length})
              </MemberChip>
              {group.members.map((m) => (
                <MemberChip
                  key={m.id}
                  $active={filterMember === String(m.id)}
                  onClick={() => setFilterMember(filterMember === String(m.id) ? '' : String(m.id))}
                >
                  {m.imie} {m.nazwisko}
                </MemberChip>
              ))}
            </MemberChips>
          </MembersBar>
        )}

        {(!selectedPatient || activeSection === 'lista') ? (
          <>
            <Tabs>
              {TABS.map((tab) => (
                <Tab
                  key={tab.key}
                  $active={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </Tab>
              ))}
            </Tabs>

            {loading ? (
              <Loader />
            ) : filteredPatients.length === 0 ? (
              <EmptyMsg>Brak pacjentów w tej kategorii</EmptyMsg>
            ) : (
              <PatientTable>
                <thead>
                  <tr>
                    <th>Imię</th>
                    <th>Nazwisko</th>
                    <th>PESEL</th>
                    <th>Jednostka</th>
                    <th>Autor</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p) => (
                    <tr key={p.id}>
                      <td>{p.imie}</td>
                      <td>{p.nazwisko}</td>
                      <td>{p.pesel}</td>
                      <td>{p.jednostka || '—'}</td>
                      <td>{p.autor ? `${p.autor.imie} ${p.autor.nazwisko}` : '—'}</td>
                      <td>
                        <ViewBtn onClick={() => handleSelect(p)}>Podgląd</ViewBtn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </PatientTable>
            )}
          </>
        ) : (
          renderSection()
        )}
      </Container>
    </Layout>
  );
}

// --- STYLED COMPONENTS ---

const Layout = styled.div`
  display: flex;
  min-height: calc(100vh - 56px);
`;

const Container = styled.div`
  flex: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  margin-left: ${(p) => (p.$hasSidebar ? '0' : 'auto')};
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const BackBtn = styled.button`
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 16px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }
`;

const GroupTitle = styled.h1`
  font-size: 1.5rem;
  color: var(--text-primary);
`;

const MembersBar = styled.div`
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px var(--shadow-color);
`;

const MembersLabel = styled.div`
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const MemberChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const MemberChip = styled.button`
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid ${(p) => (p.$active ? '#2387B6' : 'var(--border-color)')};
  background: ${(p) => (p.$active ? '#2387B6' : 'transparent')};
  color: ${(p) => (p.$active ? 'white' : 'var(--text-primary)')};
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #2387B6;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 4px;
  background: var(--bg-tabs);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 1.5rem;
`;

const Tab = styled.button`
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  background: ${(p) => (p.$active ? '#2387B6' : 'transparent')};
  color: ${(p) => (p.$active ? 'white' : 'var(--text-secondary)')};
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$active ? '#2387B6' : 'var(--bg-hover)')};
  }
`;

const PatientTable = styled.table`
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

const ViewBtn = styled.button`
  padding: 6px 14px;
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

const EmptyMsg = styled.div`
  text-align: center;
  color: var(--text-muted);
  padding: 3rem;
  font-size: 1rem;
`;

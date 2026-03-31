import { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../api/axios';
import PatientList from '../components/PatientList';
import AddPatientModal from '../components/AddPatientModal';

const TABS = [
  { key: 'aktualny', label: 'Pacjenci aktualni' },
  { key: 'wypisany', label: 'Pacjenci wypisani' },
  { key: 'archiwum', label: 'Dydaktyka archiwum' },
];

export default function DashboardPage() {
  const [patients, setPatients] = useState([]);
  const [activeTab, setActiveTab] = useState('aktualny');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients', {
        params: { status: activeTab },
      });
      setPatients(res.data);
    } catch (err) {
      console.error('Błąd ładowania pacjentów:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPatients();
  }, [activeTab]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.put(`/patients/${id}`, { status: newStatus });
      fetchPatients();
    } catch (err) {
      console.error('Błąd zmiany statusu:', err);
    }
  };

  const handlePatientAdded = () => {
    fetchPatients();
  };

  return (
    <Container>
      <Header>
        <h1>Lista Pacjentów</h1>
        <AddBtn onClick={() => setShowAdd(true)}>+ Dodaj pacjenta</AddBtn>
      </Header>

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
        <Loading>Ładowanie...</Loading>
      ) : (
        <PatientList
          patients={patients}
          onStatusChange={handleStatusChange}
        />
      )}

      {showAdd && (
        <AddPatientModal
          onClose={() => setShowAdd(false)}
          onAdded={handlePatientAdded}
        />
      )}
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
  background: #0d9488;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: #0b7c72;
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 1.5rem;
  background: #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
`;

const Tab = styled.button`
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: ${(p) => (p.$active ? '#0d9488' : 'transparent')};
  color: ${(p) => (p.$active ? 'white' : '#555')};
  font-size: 0.9rem;
  font-weight: ${(p) => (p.$active ? '600' : '400')};
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$active ? '#0d9488' : '#d1d5db')};
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 3rem;
  color: #999;
`;

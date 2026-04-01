import { useState, useEffect } from 'react';
import styled from 'styled-components';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../components/Notification';
import PatientList from '../components/PatientList';
import AddPatientModal from '../components/AddPatientModal';
import PatientSidebar from '../components/PatientSidebar';
import Loader from '../components/Loader';
import KartaWywiadu from '../components/KartaWywiadu';
import PlanOpieki from '../components/PlanOpieki';

const TABS = [
  { key: 'aktualny', label: 'Pacjenci aktualni' },
  { key: 'wypisany', label: 'Pacjenci wypisani' },
  { key: 'archiwum', label: 'Dydaktyka archiwum' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const notify = useNotification();
  const [patients, setPatients] = useState([]);
  const [activeTab, setActiveTab] = useState('aktualny');
  const [showAdd, setShowAdd] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeSection, setActiveSection] = useState('lista');
  const [loading, setLoading] = useState(true);
  const [transferPatient, setTransferPatient] = useState(null);
  const [transferTarget, setTransferTarget] = useState('');

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients', { params: { status: activeTab } });
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
      notify(`Status pacjenta zmieniony na: ${newStatus}`, 'success');
      fetchPatients();
      if (selectedPatient?.id === id) setSelectedPatient(null);
    } catch (err) {
      console.error('Błąd zmiany statusu:', err);
      notify('Błąd zmiany statusu pacjenta', 'error');
    }
  };

  const handlePatientAdded = () => {
    notify('Pacjent został zapisany pomyślnie', 'success');
    fetchPatients();
  };

  const handleSelect = (id) => {
    const patient = patients.find((p) => p.id === id);
    setSelectedPatient(patient || null);
    setActiveSection('wywiad');
  };

  const handleEdit = (patient) => {
    setEditPatient(patient);
  };

  const handleTransfer = async () => {
    if (!transferPatient || !transferTarget) return;
    try {
      await api.put(`/patients/${transferPatient.id}`, { jednostka: transferTarget });
      notify(`Pacjent przeniesiony do: ${transferTarget}`, 'success');
      setTransferPatient(null);
      setTransferTarget('');
      fetchPatients();
    } catch (err) {
      console.error('Błąd przenoszenia:', err);
      notify('Błąd przenoszenia pacjenta', 'error');
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'wywiad':
        return <KartaWywiadu patient={selectedPatient} onPatientUpdated={fetchPatients} />;
      case 'oceny':
        return <SectionPlaceholder>Ocena układów — w budowie</SectionPlaceholder>;
      case 'diagnozy':
        return <PlanOpieki patient={selectedPatient} />;
      case 'zlecenia':
        return <SectionPlaceholder>Zlecenia i interwencje — w budowie</SectionPlaceholder>;
      case 'analiza':
        return <SectionPlaceholder>Analiza danych — w budowie</SectionPlaceholder>;
      case 'raport':
        return <SectionPlaceholder>Raport pielęgniarski — w budowie</SectionPlaceholder>;
      default:
        return null;
    }
  };

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
        {(!selectedPatient || activeSection === 'lista') ? (
          <>
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
              <Loader />
            ) : (
              <PatientList
                patients={patients}
                onStatusChange={handleStatusChange}
                onSelect={handleSelect}
                onEdit={handleEdit}
                selectedId={selectedPatient?.id}
                onTransfer={(p) => setTransferPatient(p)}
              />
            )}
          </>
        ) : (
          renderSection()
        )}

        {showAdd && (
          <AddPatientModal
            onClose={() => setShowAdd(false)}
            onAdded={handlePatientAdded}
          />
        )}

        {editPatient && (
          <AddPatientModal
            onClose={() => setEditPatient(null)}
            onAdded={() => {
              setEditPatient(null);
              fetchPatients();
            }}
            editData={editPatient}
          />
        )}

        {transferPatient && (
          <TransferOverlay onClick={() => setTransferPatient(null)}>
            <TransferModal onClick={(e) => e.stopPropagation()}>
              <h3>Przenieś pacjenta: {transferPatient.imie} {transferPatient.nazwisko}</h3>
              <p>Obecna jednostka: <strong>{transferPatient.jednostka || 'brak'}</strong></p>
              <TransferSelect value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)}>
                <option value="">-- Wybierz docelową jednostkę --</option>
                {['Chirurgia ogólna','Kardiologia','Neurologia','Ortopedia','Ginekologia','Pediatria','Interna','Onkologia','Urologia','Okulistyka','Dermatologia','Psychiatria','Geriatria','Rehabilitacja','Intensywna terapia (OIT)'].map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </TransferSelect>
              <TransferBtns>
                <BtnCancel onClick={() => setTransferPatient(null)}>Anuluj</BtnCancel>
                <BtnTransfer onClick={handleTransfer} disabled={!transferTarget}>Przenieś</BtnTransfer>
              </TransferBtns>
            </TransferModal>
          </TransferOverlay>
        )}
      </Container>
    </Layout>
  );
}

const Layout = styled.div`
  display: flex;
  min-height: calc(100vh - 56px);
`;

const Container = styled.div`
  flex: 1;
  max-width: ${(p) => (p.$hasSidebar ? '100%' : '1200px')};
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
  background: ${(p) => (p.$active ? '#2387B6' : 'transparent')};
  color: ${(p) => (p.$active ? 'white' : '#555')};
  font-size: 0.9rem;
  font-weight: ${(p) => (p.$active ? '600' : '400')};
  transition: all 0.2s;

  &:hover {
    background: ${(p) => (p.$active ? '#2387B6' : '#d1d5db')};
  }
`;

const Loading = styled.div`
  text-align: center;
  padding: 3rem;
  color: #999;
`;

const SectionPlaceholder = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  font-size: 1.2rem;
  color: #999;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const TransferOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const TransferModal = styled.div`
  background: white;
  border-radius: 12px;
  padding: 2rem;
  width: 440px;
  max-width: 95vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);

  h3 { margin-bottom: 0.5rem; color: #1a1a2e; }
  p { color: #666; margin-bottom: 1rem; font-size: 0.9rem; }
`;

const TransferSelect = styled.select`
  width: 100%;
  padding: 10px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  &:focus { outline: none; border-color: #2387B6; }
`;

const TransferBtns = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const BtnCancel = styled.button`
  padding: 10px 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
  &:hover { background: #f5f5f5; }
`;

const BtnTransfer = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #8b5cf6;
  color: white;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  &:hover { background: #7c3aed; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

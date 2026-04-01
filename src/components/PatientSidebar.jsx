import styled from 'styled-components';

const SIDEBAR_ITEMS = [
  { key: 'wywiad', icon: '📝', label: 'Karta wywiadu' },
  { key: 'oceny', icon: '🔍', label: 'Ocena układów' },
  { key: 'diagnozy', icon: '🩺', label: 'Plan Opieki' },
  { key: 'zlecenia', icon: '💊', label: 'Zlecenia i interwencje' },
  { key: 'analiza', icon: '📊', label: 'Analiza danych' },
  { key: 'raport', icon: '📄', label: 'Raport pielęgniarski' },
];

export default function PatientSidebar({ patient, activeSection, onSectionChange, onDeselect }) {
  if (!patient) return null;

  return (
    <Sidebar>
      <PatientCard>
        <Avatar>{patient.imie?.[0]}{patient.nazwisko?.[0]}</Avatar>
        <CardInfo>
          <CardName>{patient.imie} {patient.nazwisko}</CardName>
          <CardPesel>PESEL: {patient.pesel}</CardPesel>
        </CardInfo>
        <ChangeBtn onClick={onDeselect}>Zmień pacjenta</ChangeBtn>
      </PatientCard>

      <NavList>
        {SIDEBAR_ITEMS.map((item) => (
          <NavItem
            key={item.key}
            $active={activeSection === item.key}
            onClick={() => onSectionChange(item.key)}
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </NavItem>
        ))}
      </NavList>
    </Sidebar>
  );
}

const Sidebar = styled.div`
  width: 240px;
  min-width: 240px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  position: sticky;
  top: 56px;
`;

const PatientCard = styled.div`
  padding: 1rem;
  border-bottom: 2px solid #2387B6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const Avatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #2387B6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
`;

const CardInfo = styled.div`
  flex: 1;
  min-width: 0;
  text-align: center;
`;

const CardName = styled.div`
  font-weight: 600;
  font-size: 0.9rem;
  color: #1a1a2e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CardPesel = styled.div`
  font-size: 0.75rem;
  color: #777;
`;

const ChangeBtn = styled.button`
  width: 100%;
  padding: 8px;
  background: #2387B6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 4px;

  &:hover {
    background: #1b6d94;
  }
`;

const NavList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.5rem 0;
  overflow-y: auto;
`;

const NavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: none;
  background: ${(p) => (p.$active ? '#e8f4f8' : 'transparent')};
  color: ${(p) => (p.$active ? '#2387B6' : '#555')};
  font-weight: ${(p) => (p.$active ? '600' : '400')};
  font-size: 0.85rem;
  text-align: left;
  cursor: pointer;
  border-left: 3px solid ${(p) => (p.$active ? '#2387B6' : 'transparent')};
  transition: all 0.15s;

  &:hover {
    background: #f0f7fb;
    color: #2387B6;
  }

  .icon {
    font-size: 1.1rem;
  }
`;

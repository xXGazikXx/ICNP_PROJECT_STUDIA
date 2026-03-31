import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  aktualny: '#2387B6',
  wypisany: '#f59e0b',
  archiwum: '#9ca3af',
};

const STATUS_LABELS = {
  aktualny: 'Aktualny',
  wypisany: 'Wypisany',
  archiwum: 'Archiwum',
};

export default function PatientList({ patients, onStatusChange, onSelect, onEdit, selectedId }) {
  const { user } = useAuth();
  const canRestore = user?.role === 'admin' || user?.role === 'prowadzacy';

  if (patients.length === 0) {
    return <Empty>Brak pacjentów do wyświetlenia</Empty>;
  }

  return (
    <Table>
      <thead>
        <tr>
          <th>L.p.</th>
          <th>Imię</th>
          <th>Nazwisko</th>
          <th>PESEL</th>
          <th>Lokalizacja</th>
          <th>Status</th>
          <th>Autor</th>
          <th>Akcje</th>
        </tr>
      </thead>
      <tbody>
        {patients.map((p, i) => (
          <tr key={p.id} className={selectedId === p.id ? 'selected' : ''}>
            <td>{i + 1}</td>
            <td>{p.imie}</td>
            <td>{p.nazwisko}</td>
            <td>{p.pesel}</td>
            <td>{p.lokalizacja || '—'}</td>
            <td>
              <StatusBadge $color={STATUS_COLORS[p.status]}>
                {STATUS_LABELS[p.status]}
              </StatusBadge>
            </td>
            <td>
              {p.autor ? `${p.autor.imie} ${p.autor.nazwisko}` : '—'}
            </td>
            <td>
              <Actions>
                <ActionBtn $primary onClick={() => onSelect(p.id)}>
                  Wybierz
                </ActionBtn>
                <ActionBtn onClick={() => onEdit(p)}>
                  Edytuj
                </ActionBtn>
                {p.status === 'aktualny' && (
                  <ActionBtn onClick={() => onStatusChange(p.id, 'wypisany')}>
                    Wypisz
                  </ActionBtn>
                )}
                {p.status === 'wypisany' && (
                  <>
                    <ActionBtn onClick={() => onStatusChange(p.id, 'archiwum')}>
                      Archiwizuj
                    </ActionBtn>
                    {canRestore && (
                      <ActionBtn $restore onClick={() => onStatusChange(p.id, 'aktualny')}>
                        Przywróć
                      </ActionBtn>
                    )}
                  </>
                )}
                {p.status === 'archiwum' && canRestore && (
                  <ActionBtn $restore onClick={() => onStatusChange(p.id, 'aktualny')}>
                    Przywróć
                  </ActionBtn>
                )}
              </Actions>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

const Empty = styled.div`
  text-align: center;
  padding: 3rem;
  color: #999;
  font-size: 1.1rem;
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
    background: #f0f7fb;
  }

  tbody tr.selected {
    background: #e0f0f8;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const StatusBadge = styled.span`
  background: ${(p) => p.$color};
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
`;

const ActionBtn = styled.button`
  padding: 5px 10px;
  border: 1px solid ${(p) => (p.$primary ? '#2387B6' : p.$restore ? '#22c55e' : '#ddd')};
  border-radius: 6px;
  background: ${(p) => (p.$primary ? '#2387B6' : p.$restore ? '#22c55e' : 'white')};
  color: ${(p) => (p.$primary || p.$restore ? 'white' : '#333')};
  font-size: 0.78rem;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    opacity: 0.85;
  }
`;

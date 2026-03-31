import { useState } from 'react';
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

export default function PatientList({ patients, onStatusChange, onSelect, onEdit, selectedId, onTransfer }) {
  const { user } = useAuth();
  const canRestore = user?.role === 'admin' || user?.role === 'prowadzacy';
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const filtered = patients.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (p.imie || '').toLowerCase().includes(q) ||
      (p.nazwisko || '').toLowerCase().includes(q) ||
      (p.pesel || '').includes(q) ||
      (p.numer_ksiegi_glownej || '').toLowerCase().includes(q)
    );
  });

  if (patients.length === 0) {
    return <Empty>Brak pacjentów do wyświetlenia</Empty>;
  }

  return (
    <>
      <SearchContainer>
        <SearchBox $open={searchOpen}>
          <SearchIcon onClick={() => setSearchOpen((o) => !o)} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
          </SearchIcon>
          {searchOpen && (
            <SearchInput
              type="text"
              placeholder="Szukaj pacjenta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          )}
        </SearchBox>
      </SearchContainer>
    <Table>
      <thead>
        <tr>
          <th>Nr księgi</th>
          <th>Imię</th>
          <th>Nazwisko</th>
          <th>PESEL</th>
          <th>Jednostka</th>
          <th>Status</th>
          <th>Autor</th>
          <th>Akcje</th>
        </tr>
      </thead>
      <tbody>
        {filtered.map((p) => (
          <tr key={p.id} className={selectedId === p.id ? 'selected' : ''}>
            <td>{p.numer_ksiegi_glownej || '—'}</td>
            <td>{p.imie}</td>
            <td>{p.nazwisko}</td>
            <td>{p.pesel}</td>
            <td>{p.jednostka || '—'}</td>
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
                  <>
                    <ActionBtn onClick={() => onStatusChange(p.id, 'wypisany')}>
                      Wypisz
                    </ActionBtn>
                    <ActionBtn $transfer onClick={() => onTransfer(p)}>
                      Przenieś
                    </ActionBtn>
                  </>
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
    </>
  );
}

const Empty = styled.div`
  text-align: center;
  padding: 3rem;
  color: #999;
  font-size: 1.1rem;
`;

const SearchContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  background: #1a1a2e;
  border-radius: 160px;
  height: 42px;
  width: ${(p) => (p.$open ? '260px' : '42px')};
  padding: 0 12px;
  transition: width 0.3s ease;
  gap: 8px;
`;

const SearchIcon = styled.svg`
  width: 18px;
  height: 18px;
  fill: white;
  flex-shrink: 0;
  cursor: pointer;
`;

const SearchInput = styled.input`
  background: transparent;
  border: none;
  outline: none;
  color: white;
  font-size: 0.9rem;
  width: 100%;
  &::placeholder { color: rgba(255,255,255,0.6); }
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
    text-align: center;
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
    text-align: center;
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
  justify-content: center;
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
  border: 1px solid ${(p) => (p.$primary ? '#2387B6' : p.$restore ? '#22c55e' : p.$transfer ? '#8b5cf6' : '#ddd')};
  border-radius: 6px;
  background: ${(p) => (p.$primary ? '#2387B6' : p.$restore ? '#22c55e' : p.$transfer ? '#8b5cf6' : 'white')};
  color: ${(p) => (p.$primary || p.$restore || p.$transfer ? 'white' : '#333')};
  font-size: 0.78rem;
  white-space: nowrap;
  transition: all 0.2s;

  &:hover {
    opacity: 0.85;
  }
`;

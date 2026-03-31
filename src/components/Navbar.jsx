import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  admin: 'Administrator',
  prowadzacy: 'Prowadzący',
  student: 'Student',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <Nav>
      <NavLeft>
        <Logo to="/">ICNP System</Logo>
        <NavLink to="/" $active={isActive('/')}>
          Lista pacjentów
        </NavLink>
        {user?.role === 'admin' && (
          <NavLink to="/users" $active={isActive('/users')}>
            Użytkownicy
          </NavLink>
        )}
      </NavLeft>
      <NavRight>
        <UserInfo>
          {user?.imie} {user?.nazwisko}
          <RoleBadge>{ROLE_LABELS[user?.role]}</RoleBadge>
        </UserInfo>
        <LogoutBtn onClick={handleLogout}>Wyloguj</LogoutBtn>
      </NavRight>
    </Nav>
  );
}

const Nav = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #2387B6;
  padding: 0 1.5rem;
  height: 56px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const Logo = styled(Link)`
  font-weight: 700;
  font-size: 1.2rem;
  color: white;
  letter-spacing: 1px;
`;

const NavLink = styled(Link)`
  color: ${(p) => (p.$active ? '#fff' : 'rgba(255,255,255,0.75)')};
  font-weight: ${(p) => (p.$active ? '600' : '400')};
  font-size: 0.9rem;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  background: ${(p) => (p.$active ? 'rgba(255,255,255,0.15)' : 'transparent')};
  transition: all 0.2s;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserInfo = styled.div`
  color: white;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const RoleBadge = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
`;

const LogoutBtn = styled.button`
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 0.85rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`;

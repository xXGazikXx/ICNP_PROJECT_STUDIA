import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import DarkModeToggle from './components/DarkModeToggle';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import GroupsPage from './pages/GroupsPage';
import GroupViewPage from './pages/GroupViewPage';

export default function App() {
  const { user } = useAuth();

  return (
    <>
      {user && <Navbar />}
      <DarkModeToggle />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <ProtectedRoute roles={['prowadzacy']}>
              <GroupsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/groups/:id"
          element={
            <ProtectedRoute roles={['prowadzacy']}>
              <GroupViewPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

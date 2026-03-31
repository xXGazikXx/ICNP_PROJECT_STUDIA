import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import styled, { keyframes } from 'styled-components';

const NotificationContext = createContext(null);

export function useNotification() {
  return useContext(NotificationContext);
}

const TYPES = {
  success: { bg: '#dcfce7', border: '#22c55e', color: '#166534' },
  info: { bg: '#dbeafe', border: '#3b82f6', color: '#1e3a8a' },
  warning: { bg: '#fef9c3', border: '#eab308', color: '#854d0e' },
  error: { bg: '#fee2e2', border: '#ef4444', color: '#991b1b' },
};

let idCounter = 0;

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const notify = useCallback((message, type = 'info') => {
    const id = ++idCounter;
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const remove = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={notify}>
      {children}
      <Container>
        {notifications.map((n) => (
          <Toast key={n.id} $type={n.type} onClick={() => remove(n.id)}>
            <ToastIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" $type={n.type}>
              <path d="M13 16h-1v-4h1m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            </ToastIcon>
            <span>{n.message}</span>
          </Toast>
        ))}
      </Container>
    </NotificationContext.Provider>
  );
}

const slideIn = keyframes`
  from { transform: translateX(110%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const Container = styled.div`
  position: fixed;
  top: 70px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 380px;
`;

const Toast = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-radius: 8px;
  border-left: 4px solid ${(p) => TYPES[p.$type]?.border || TYPES.info.border};
  background: ${(p) => TYPES[p.$type]?.bg || TYPES.info.bg};
  color: ${(p) => TYPES[p.$type]?.color || TYPES.info.color};
  font-size: 0.88rem;
  font-weight: 500;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  animation: ${slideIn} 0.3s ease;
  transition: transform 0.2s, opacity 0.2s;

  &:hover {
    transform: scale(1.02);
  }
`;

const ToastIcon = styled.svg`
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  fill: none;
  stroke: ${(p) => TYPES[p.$type]?.border || TYPES.info.border};
`;

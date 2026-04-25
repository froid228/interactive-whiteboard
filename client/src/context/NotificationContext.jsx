import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import ToastContainer from '../components/ToastContainer/ToastContainer';

const NotificationContext = createContext({
  notify: () => {},
});

export function NotificationProvider({ children }) {
  const [items, setItems] = useState([]);

  const notify = useCallback((message, tone = 'info') => {
    const id = Date.now() + Math.random();
    setItems((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <ToastContainer items={items} />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'; // ← Импорт Provider
import App from './App';
import store from './redux/store'; // ← Импорт store
import { NotificationProvider } from './context/NotificationContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* Оборачиваем приложение в Provider и передаём store */}
    <Provider store={store}>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </Provider>
  </React.StrictMode>
);

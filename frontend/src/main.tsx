import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { PlanProvider } from './context/PlanContext';
import { NotificationProvider } from './context/NotificationContext';
import { TransactionStoreProvider } from './store/transactionStore';
import { SettingsProvider } from './context/SettingsContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <PlanProvider>
          <SettingsProvider>
            <NotificationProvider>
              <TransactionStoreProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </TransactionStoreProvider>
            </NotificationProvider>
          </SettingsProvider>
        </PlanProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);

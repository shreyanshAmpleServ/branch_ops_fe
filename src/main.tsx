import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './i18n/i18n';
import { enforceSessionPolicy } from './store/useAuthStore';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import './styles/index.css';

// Enforce session-only policy before rendering.
// If the user logged in without "Remember Me", their session is cleared
// on the next fresh browser load (sessionStorage wiped on tab/window close).
enforceSessionPolicy();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

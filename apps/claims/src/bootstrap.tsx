import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ClaimsApp from './ClaimsApp';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClaimsApp basename="/" showDevtools />
  </React.StrictMode>,
);

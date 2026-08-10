import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import WorklistWidget from './WorklistWidget';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="mx-auto max-w-4xl p-8">
      <WorklistWidget />
    </div>
  </React.StrictMode>,
);

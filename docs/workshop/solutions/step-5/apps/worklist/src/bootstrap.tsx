import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import WorklistWidget from './WorklistWidget';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <div className="mx-auto max-w-4xl p-8">
        <WorklistWidget />
      </div>
    </QueryClientProvider>
  </React.StrictMode>,
);

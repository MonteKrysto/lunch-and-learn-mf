// Exposed modules own their styles: this app's CSS travels with the module
// through federation instead of relying on the host to build the same classes.
import './index.css';
import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClaimsList } from './pages/claims-list';
import { ClaimDetail } from './pages/claim-detail';

export interface ClaimsAppProps {
  /** Mount path prefix. '/' standalone; '/claims' when embedded in a host. */
  basename?: string;
}

export default function ClaimsApp({ basename = '/' }: ClaimsAppProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [router] = useState(() =>
    createBrowserRouter(
      [
        { path: '/', element: <ClaimsList /> },
        { path: '/:claimId', element: <ClaimDetail /> },
      ],
      { basename },
    ),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mx-auto max-w-5xl p-6">
        <RouterProvider router={router} />
      </div>
    </QueryClientProvider>
  );
}

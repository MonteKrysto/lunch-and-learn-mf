import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router';
import { Layout } from './layout';
import { Dashboard } from './pages/dashboard';

// The entire claims application — routing, data layer and all — loaded at runtime
// from the claims team's deployment on :3102.
const ClaimsApp = lazy(() => import('claims/ClaimsApp'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      {
        path: 'claims/*',
        element: (
          <Suspense fallback={<p className="p-6 text-muted-foreground">Loading claims app…</p>}>
            <ClaimsApp basename="/claims" />
          </Suspense>
        ),
      },
    ],
  },
]);

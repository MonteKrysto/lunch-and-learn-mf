import { createBrowserRouter } from 'react-router';
import { Layout } from './layout';
import { Dashboard } from './pages/dashboard';
import { ClaimsPlaceholder } from './pages/claims-placeholder';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'claims/*', element: <ClaimsPlaceholder /> },
    ],
  },
]);

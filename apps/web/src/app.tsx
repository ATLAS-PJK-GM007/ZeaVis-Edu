import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthGuard } from '@/components/auth-guard';
import { DashboardPage } from '@/pages/dashboard-page';
import { LandingPage } from '@/pages/landing-page';
import { CatalogPage } from '@/pages/catalog-page';
import { DiseaseDetailPage } from '@/pages/disease-detail-page';
import { DiagnosisDetailPage } from '@/pages/diagnosis-detail-page';
import { ExpertReviewsPage } from '@/pages/expert-reviews-page';
import { LoginPage } from '@/pages/login-page';
import { RegisterPage } from '@/pages/register-page';

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    path: '/dashboard',
    element: (
      <AuthGuard>
        <DashboardPage />
      </AuthGuard>
    ),
  },
  {
    path: '/diagnoses/:id',
    element: (
      <AuthGuard>
        <DiagnosisDetailPage />
      </AuthGuard>
    ),
  },
  {
    path: '/expert/reviews',
    element: (
      <AuthGuard requireExpert>
        <ExpertReviewsPage />
      </AuthGuard>
    ),
  },
  { path: '/catalog', element: <CatalogPage /> },
  { path: '/catalog/:slug', element: <DiseaseDetailPage /> },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

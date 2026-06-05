import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { AuthInitializer } from "@/components/auth-initializer";
import { AuthGuard } from "@/components/auth-guard";
import { DashboardPage } from "@/pages/dashboard-page";
import { ScanPage } from "@/pages/scan-page";
import { LibraryPage } from "@/pages/library-page";
import { CatalogPage } from "@/pages/catalog-page";
import { DiseaseDetailPage } from "@/pages/disease-detail-page";
import { DiagnosisDetailPage } from "@/pages/diagnosis-detail-page";
import { ExpertReviewsPage } from "@/pages/expert-reviews-page";
import { DiagnosesPage } from "@/pages/diagnoses-page";
import { LoginPage } from "@/pages/login-page";
import { RegisterPage } from "@/pages/register-page";
import { MainLayout } from "@/components/layout/main-layout";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/dashboard",
    element: (
      <MainLayout>
        <DashboardPage />
      </MainLayout>
    ),
  },
  {
    path: "/scan",
    element: (
      <MainLayout>
        <ScanPage />
      </MainLayout>
    ),
  },
  {
    path: "/library",
    element: (
      <MainLayout>
        <LibraryPage />
      </MainLayout>
    ),
  },
  {
    path: "/diagnoses",
    element: (
      <MainLayout>
        <DiagnosesPage />
      </MainLayout>
    ),
  },
  {
    path: "/diagnoses/:id",
    element: (
      <MainLayout>
        <DiagnosisDetailPage />
      </MainLayout>
    ),
  },
  {
    path: "/expert/reviews",
    element: (
      <AuthGuard requireExpert>
        <MainLayout>
          <ExpertReviewsPage />
        </MainLayout>
      </AuthGuard>
    ),
  },
  {
    path: "/catalog",
    element: (
      <MainLayout>
        <CatalogPage />
      </MainLayout>
    ),
  },
  {
    path: "/catalog/:slug",
    element: (
      <MainLayout>
        <DiseaseDetailPage />
      </MainLayout>
    ),
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

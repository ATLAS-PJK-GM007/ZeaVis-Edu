import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { DashboardPage } from "@/pages/dashboard-page";
import { ScanPage } from "@/pages/scan-page";
import { LibraryPage } from "@/pages/library-page";
import { CatalogPage } from "@/pages/catalog-page";
import { DiseaseDetailPage } from "@/pages/disease-detail-page";
import { DiagnosisDetailPage } from "@/pages/diagnosis-detail-page";
import { ExpertReviewsPage } from "@/pages/expert-reviews-page";
import { DiagnosesPage } from "@/pages/diagnoses-page";
import { MainLayout } from "@/components/layout/main-layout";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
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
    path: "/dashboard",
    element: (
      <MainLayout>
        <DashboardPage />
      </MainLayout>
    ),
  },
  {
    path: "/diagnoses/:id",
    element: <DiagnosisDetailPage />,
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
    path: "/expert/reviews",
    element: <ExpertReviewsPage />,
  },
  { path: "/catalog", element: <CatalogPage /> },
  { path: "/catalog/:slug", element: <DiseaseDetailPage /> },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { AuthInitializer } from "@/components/auth-initializer";
import { DashboardPage } from "@/pages/dashboard-page";
import { ScanPage } from "@/pages/scan-page";
import { LibraryPage } from "@/pages/library-page";
import { CatalogPage } from "@/pages/catalog-page";
import { DiseaseDetailPage } from "@/pages/disease-detail-page";
import { DiagnosisDetailPage } from "@/pages/diagnosis-detail-page";
import { ExpertReviewsPage } from "@/pages/expert-reviews-page";
import { DiagnosesPage } from "@/pages/diagnoses-page";
import { TelemetryPage } from "@/pages/telemetry-page";
import { MainLayout } from "@/components/layout/main-layout";
import { trackPageView } from "./lib/telemetry";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },
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
      <MainLayout>
        <ExpertReviewsPage />
      </MainLayout>
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
  {
    path: "/telemetry",
    element: (
      <MainLayout>
        <TelemetryPage />
      </MainLayout>
    ),
  },
]);

function PageViewTracker() {
  const location = window.location;
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      <PageViewTracker />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

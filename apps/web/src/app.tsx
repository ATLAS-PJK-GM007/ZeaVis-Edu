import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
  useNavigate,
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
import { TelemetryPage } from "@/pages/telemetry-page";
import { LoginPage } from "@/pages/login-page";
import { RegisterPage } from "@/pages/register-page";
import { MainLayout } from "@/components/layout/main-layout";
import { useEffect, useRef } from "react";
import { useAuthStore } from "@/store/auth-store";
import { apiClient } from "@/lib/api-client";
import { setupDeepLinkHandler, consumeDeepLinkTarget } from "@/lib/tauri";

function LogoutProses() {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    apiClient.logout().then(() => {
      setUser(null);

    }).catch((error) => {
      console.error("Oops, gagal logout dari server:", error);
      setUser(null);
    });
  }, [setUser]);

  return <Navigate to="/login" replace />;
}
import { trackPageView, trackError } from "./lib/telemetry";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    element: <DeepLinkRouterHandler />,
    children: [
      { path: "/", element: <Navigate to="/login" replace /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      {
        path: "/dashboard",
        element: (
          <AuthGuard>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </AuthGuard>
        ),
      },
      {
        path: "/scan",
        element: (
          <AuthGuard>
            <MainLayout>
              <ScanPage />
            </MainLayout>
          </AuthGuard>
        ),
      },
      {
        path: "/library",
        element: (
          <AuthGuard>
            <MainLayout>
              <LibraryPage />
            </MainLayout>
          </AuthGuard>
        ),
      },
      {
        path: "/diagnoses",
        element: (
          <AuthGuard>
            <MainLayout>
              <DiagnosesPage />
            </MainLayout>
          </AuthGuard>
        ),
      },
      {
        path: "/diagnoses/:id",
        element: (
          <AuthGuard>
            <MainLayout>
              <DiagnosisDetailPage />
            </MainLayout>
          </AuthGuard>
        ),
      },
      {
        path: "/expert/reviews",
        element: (
          <AuthGuard requireExpert={true}>
            <MainLayout>
              <ExpertReviewsPage />
            </MainLayout>
          </AuthGuard>
        ),
      },
      {
        path: "/catalog",
        element: (
          <AuthGuard>
            <MainLayout>
              <CatalogPage />
            </MainLayout>
          </AuthGuard>
        ),
      },
      {
        path: "/catalog/:slug",
        element: (
          <AuthGuard>
            <MainLayout>
              <DiseaseDetailPage />
            </MainLayout>
          </AuthGuard>
        ),
      },
      {
        path: "/logout",
        element: <LogoutProses />,
      },
      {
        path: "/telemetry",
        element: (
          <MainLayout>
            <TelemetryPage />
          </MainLayout>
        ),
      },
    ],
  },
]);

/**
 * Listens for deep-link custom events and routes via React Router's navigate(),
 * avoiding full page reloads that break the Tauri IPC bridge.
 */
function DeepLinkRouterHandler() {
  const navigate = useNavigate();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    // Check for cold-start pending deep link
    const pending = consumeDeepLinkTarget();
    if (pending && !handled.current.has(pending)) {
      handled.current.add(pending);
      navigate(pending, { replace: true });
    }

    // Listen for warm-start deep links
    const handler = (e: CustomEvent<string>) => {
      const target = e.detail;
      if (handled.current.has(target)) return;
      handled.current.add(target);
      navigate(target, { replace: true });
    };
    window.addEventListener('zeavis:deeplink', handler as EventListener);
    return () => window.removeEventListener('zeavis:deeplink', handler as EventListener);
  }, [navigate]);

  return <Outlet />;
}

function PageViewTracker() {
  const location = window.location;
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);
  return null;
}

function GlobalErrorTracker() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      trackError(event.filename || "global");
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);
  return null;
}

export function App() {
  // Register deep link handler for Android OAuth return
  useEffect(() => {
    setupDeepLinkHandler();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer />
      <PageViewTracker />
      <GlobalErrorTracker />
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

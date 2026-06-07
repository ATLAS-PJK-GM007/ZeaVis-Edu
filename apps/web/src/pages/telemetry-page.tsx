import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, ExternalLink } from "lucide-react";

const TELEMETRY_BASE = "/telemetry";

const EMBED_PAGES = [
  { id: "dashboard", label: "Dashboard", path: "" },
  { id: "explorer", label: "Explorer", path: "/explorer" },
  { id: "targets", label: "Targets", path: "/targets" },
  { id: "tenants", label: "Tenants", path: "/tenants" },
];

export function TelemetryPage() {
  const [currentPage, setCurrentPage] = useState(EMBED_PAGES[0]);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const embedUrl = useMemo(() => {
    const base = `${TELEMETRY_BASE}${currentPage.path}`;
    return base;
  }, [currentPage]);

  const handleIframeLoad = () => {
    setIframeLoaded(true);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeLoaded(false);
    setIframeError(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-[28px] font-extrabold text-[#214B11] flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-[#48A111]" />
            Telemetry Dashboard
          </h1>
          <p className="text-[15px] text-muted-foreground mt-1">
            System metrics, service health, and performance monitoring from the
            telemetry pipeline (Prometheus → ClickHouse).
          </p>
        </div>
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#48A111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#306D29] transition-colors"
        >
          <ExternalLink className="h-4 w-4" />
          Open in New Tab
        </a>
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2">
        {EMBED_PAGES.map((page) => (
          <button
            key={page.id}
            onClick={() => {
              setCurrentPage(page);
              setIframeLoaded(false);
              setIframeError(false);
            }}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              currentPage.id === page.id
                ? "bg-[#48A111] text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>

      {/* Iframe container */}
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-0 relative">
          {/* Loading indicator */}
          {!iframeLoaded && !iframeError && (
            <div className="flex items-center justify-center h-[600px] bg-slate-50">
              <div className="text-center space-y-3">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#48A111] border-r-transparent" />
                <p className="text-sm text-muted-foreground">
                  Loading telemetry dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Error state */}
          {iframeError && (
            <div className="flex items-center justify-center h-[600px] bg-slate-50">
              <div className="text-center space-y-3 max-w-md px-4">
                <div className="text-4xl">⚠️</div>
                <p className="text-sm font-semibold text-red-600">
                  Failed to load telemetry dashboard
                </p>
                <p className="text-sm text-muted-foreground">
                  The telemetry backend on orange VPS may be unreachable.
                  Ensure Tailscale is connected and the telemetry stack is
                  running.
                </p>
              </div>
            </div>
          )}

          {/* Iframe */}
          <iframe
            src={embedUrl}
            title="Telemetry Dashboard"
            className={`w-full border-0 ${iframeLoaded ? "block" : "hidden"}`}
            style={{ height: "calc(100vh - 280px)", minHeight: "600px" }}
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            allow="same-origin"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </CardContent>
      </Card>
    </div>
  );
}

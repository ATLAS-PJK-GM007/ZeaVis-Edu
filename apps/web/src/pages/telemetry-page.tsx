import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Activity,
  Cpu,
  HardDrive,
  Database,
  Layers,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Types ──────────────────────────────────────────────────────────
const API_BASE = "https://telemetry.imrnes.team/proxy/dashboard";

interface DashboardStats {
  cpu_usage: number;
  disk_usage: number;
  total_metrics: number;
  active_services: number;
  uptime_seconds: number;
  health: { disk_readonly: boolean; errors: number };
}

interface DiscoveredMetric {
  metric_name: string;
  service: string;
  sample_count: number;
  latest_value: number;
}

interface ChartPoint {
  time: string;
  value: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(1);
}

function fmtDuration(s: number): string {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtPct(v: number): string {
  return (v * 100).toFixed(1) + "%";
}

// ─── API Client ──────────────────────────────────────────────────────
class TelemetryAPI {
  private base: string;
  constructor(base: string) {
    this.base = base;
  }

  async stats(): Promise<DashboardStats> {
    const res = await fetch(`${this.base}/stats`);
    if (!res.ok) throw new Error(`Stats API: ${res.status}`);
    return res.json();
  }

  async discover(): Promise<DiscoveredMetric[]> {
    const res = await fetch(`${this.base}/discover`);
    if (!res.ok) throw new Error(`Discover API: ${res.status}`);
    const data = await res.json();
    return data.metrics ?? [];
  }

  async charts(
    panels: { key: string; metric: string; aggregation?: string }[],
  ): Promise<Map<string, ChartPoint[]>> {
    const now = Math.floor(Date.now() / 1000);
    const oneHourAgo = now - 3600;
    const res = await fetch(`${this.base}/charts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        panels: panels.map((p) => ({
          key: p.key,
          metric: p.metric,
          start: oneHourAgo,
          end: now,
          aggregation: p.aggregation ?? "avg",
        })),
      }),
    });
    if (!res.ok) throw new Error(`Charts API: ${res.status}`);
    const data = await res.json();
    const map = new Map<string, ChartPoint[]>();
    for (const r of data.results ?? []) {
      map.set(r.key, r.data ?? []);
    }
    return map;
  }
}

const api = new TelemetryAPI(API_BASE);

// ─── Stat Card ───────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium text-slate-500">
          {label}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────
function MetricChart({
  title,
  data,
  loading,
  color,
}: {
  title: string;
  data: ChartPoint[];
  loading: boolean;
  color: string;
}) {
  if (loading) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
              }}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              labelFormatter={(v) => new Date(v).toLocaleTimeString()}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(val: any) => [typeof val === "number" ? val.toFixed(2) : String(val ?? ""), title]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={`url(#grad-${title})`}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export function TelemetryPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [metrics, setMetrics] = useState<DiscoveredMetric[]>([]);
  const [chartMap, setChartMap] = useState<Map<string, ChartPoint[]>>(new Map());
  const [memChartData, setMemChartData] = useState<ChartPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<number | undefined>(undefined);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [statsData, discoverData] = await Promise.all([
        api.stats(),
        api.discover(),
      ]);

      setStats(statsData);
      setMetrics(discoverData);

      // Fetch charts for top metrics (excluding prometheus noise)
      const topMetrics = discoverData
        .filter((m) => !m.metric_name.startsWith("prometheus_") && m.service !== "prometheus")
        .slice(0, 4);

      const chartPanels = topMetrics.map((m) => ({
        key: m.metric_name,
        metric: m.metric_name,
      }));

      // Built-in computations + app metrics
      chartPanels.unshift({ key: "_cpu_usage_pct", metric: "_cpu_usage_pct" });
      chartPanels.unshift({ key: "_disk_usage_pct", metric: "_disk_usage_pct" });

      // Memory charts (raw values, % computed client-side)
      chartPanels.push({ key: "node_memory_MemTotal_bytes", metric: "node_memory_MemTotal_bytes" });
      chartPanels.push({ key: "node_memory_MemAvailable_bytes", metric: "node_memory_MemAvailable_bytes" });

      // App-specific metrics
      for (const appMetric of ["zeavis_api_http_requests_total", "zeavis_api_http_requests_active"]) {
        if (discoverData.find((m) => m.metric_name === appMetric)) {
          chartPanels.push({ key: appMetric, metric: appMetric });
        }
      }

      const charts = await api.charts(chartPanels);
      setChartMap(charts);

      // Compute memory usage % = (total - available) / total
      const memTotalData = charts.get("node_memory_MemTotal_bytes");
      const memAvailData = charts.get("node_memory_MemAvailable_bytes");
      if (memTotalData && memAvailData && memTotalData.length > 0 && memAvailData.length > 0) {
        const merged: ChartPoint[] = [];
        for (let i = 0; i < Math.min(memTotalData.length, memAvailData.length); i++) {
          const total = memTotalData[i].value;
          const avail = memAvailData[i].value;
          if (total > 0) {
            merged.push({ time: memTotalData[i].time, value: 1 - avail / total });
          }
        }
        setMemChartData(merged);
      } else {
        setMemChartData([]);
      }
      setChartMap(charts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    intervalRef.current = window.setInterval(() => fetchData(true), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  const serviceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of metrics) {
      counts.set(m.service, (counts.get(m.service) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [metrics]);

  const topMetrics = useMemo(() => {
    return metrics.slice(0, 10);
  }, [metrics]);

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#48A111] border-r-transparent" />
            <p className="text-sm text-muted-foreground">
              Loading telemetry data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3 max-w-md">
            <AlertTriangle className="h-10 w-10 text-red-500 mx-auto" />
            <p className="text-sm font-semibold text-red-600">
              Failed to load telemetry data
            </p>
            <p className="text-xs text-slate-500">{error}</p>
            <button
              onClick={() => fetchData()}
              className="inline-flex items-center gap-1 rounded-full bg-[#48A111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#306D29]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-[28px] font-extrabold text-[#214B11] flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-[#48A111]" />
            Telemetry Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            System metrics from Prometheus pipeline via ClickHouse.
            {error && (
              <span className="text-amber-600 ml-2">
                (partial data — {error})
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={Cpu}
            label="CPU Usage"
            value={fmtPct(stats.cpu_usage)}
            color="text-blue-600"
          />
          <StatCard
            icon={HardDrive}
            label="Disk Usage"
            value={fmtPct(stats.disk_usage)}
            color="text-amber-600"
          />
          <StatCard
            icon={Database}
            label="Total Metrics"
            value={fmt(stats.total_metrics)}
            sub={`${stats.active_services} active services`}
            color="text-green-600"
          />
          <StatCard
            icon={Activity}
            label="Uptime"
            value={fmtDuration(stats.uptime_seconds)}
            sub={
              stats.health.errors > 0
                ? `${stats.health.errors} errors`
                : "All healthy"
            }
            color={stats.health.errors > 0 ? "text-red-600" : "text-green-600"}
          />
        </div>
      )}

      {/* CPU, Memory, Disk charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricChart
          title="CPU Usage (last hour)"
          data={chartMap.get("_cpu_usage_pct") ?? []}
          loading={loading}
          color="#2563eb"
        />
        <MetricChart
          title="Memory Usage (last hour)"
          data={memChartData ?? []}
          loading={loading}
          color="#8b5cf6"
        />
        <MetricChart
          title="Disk Usage (last hour)"
          data={chartMap.get("_disk_usage_pct") ?? []}
          loading={loading}
          color="#f59e0b"
        />
      </div>

      {/* Application Metrics */}
      {(chartMap.has("zeavis_api_http_requests_total") || chartMap.has("zeavis_api_http_requests_active")) && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-[#214B11]">Application Metrics</h3>
          <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
            {chartMap.has("zeavis_api_http_requests_total") && (
              <MetricChart
                title="HTTP Requests Total (API)"
                data={chartMap.get("zeavis_api_http_requests_total") ?? []}
                loading={loading}
                color="#ec4899"
              />
            )}
            {chartMap.has("zeavis_api_http_requests_active") && (
              <MetricChart
                title="Active HTTP Requests (API)"
                data={chartMap.get("zeavis_api_http_requests_active") ?? []}
                loading={loading}
                color="#14b8a6"
              />
            )}
          </div>
        </section>
      )}

      {/* Top Metrics */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-lg font-semibold text-[#214B11] flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#48A111]" />
            Top Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {topMetrics.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No metrics discovered yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-2 font-medium text-slate-500">
                      Metric
                    </th>
                    <th className="text-left py-2 px-2 font-medium text-slate-500">
                      Service
                    </th>
                    <th className="text-right py-2 px-2 font-medium text-slate-500">
                      Samples
                    </th>
                    <th className="text-right py-2 px-2 font-medium text-slate-500">
                      Latest Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topMetrics.map((m) => (
                    <tr key={m.metric_name} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-2 font-mono text-xs text-slate-700 max-w-[300px] truncate">
                        {m.metric_name}
                      </td>
                      <td className="py-2 px-2">
                        <span className="inline-flex items-center rounded-full bg-[#EFF6E8] px-2 py-0.5 text-xs font-medium text-[#48A111]">
                          {m.service}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600">
                        {fmt(m.sample_count)}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-xs text-slate-600">
                        {typeof m.latest_value === "number"
                          ? m.latest_value.toFixed(4)
                          : String(m.latest_value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Distribution */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-lg font-semibold text-[#214B11] flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#48A111]" />
            Services
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {serviceCounts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No services discovered
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={serviceCounts.map(([name, count]) => ({ name, count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#48A111" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

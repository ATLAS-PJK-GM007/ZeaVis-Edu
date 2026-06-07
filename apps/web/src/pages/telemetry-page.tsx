import { useCallback, useEffect, useRef, useState } from "react";
import {
  BarChart3, Activity, Cpu, HardDrive, Database,
  RefreshCw, Server,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── Prometheus API ─────────────────────────────────────────────────
const PROM = "https://telemetry.imrnes.team/prometheus/api/v1";
const INSTANCE = '100.96.248.86:9100';

interface PromValue {
  time: number;
  value: number;
}

async function queryRange(query: string, steps = 60): Promise<PromValue[]> {
  const now = Math.floor(Date.now() / 1000);
  const start = now - 3600;
  const q = `query=${encodeURIComponent(query)}&start=${start}&end=${now}&step=${steps}`;
  const res = await fetch(`${PROM}/query_range?${q}`);
  if (!res.ok) throw new Error(`Prometheus: ${res.status}`);
  const data = await res.json();
  const results = data?.data?.result ?? [];
  if (results.length === 0) return [];
  return results[0].values.map((v: [number, string]) => ({
    time: new Date(v[0] * 1000).toISOString(),
    value: parseFloat(v[1]),
  }));
}

async function queryInstant(query: string): Promise<number | null> {
  const res = await fetch(`${PROM}/query?query=${encodeURIComponent(query)}`);
  if (!res.ok) return null;
  const data = await res.json();
  const results = data?.data?.result ?? [];
  if (results.length === 0) return null;
  return parseFloat(results[0].value[1]);
}

// ─── Helpers ─────────────────────────────────────────────────────────
function fmtPct(v: number): string {
  return v.toFixed(1) + "%";
}

function shortMetric(name: string): string {
  return name.replace(/^zeavis_api_/, "").replace(/^zeavis_ml_/, "");
}

// ─── StatCard ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof BarChart3; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Chart ──────────────────────────────────────────────────────────
function ChartCard({ title, data, color }: {
  title: string; data: PromValue[]; color: string;
}) {
  if (!data || data.length === 0) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center justify-center h-36 text-slate-400 text-sm">No data</div>
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
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`g-${title.replace(/\s/g, "")}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="time" tick={{ fontSize: 10 }}
              tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
            <Tooltip
              labelFormatter={(v) => new Date(v).toLocaleTimeString()}
              formatter={(val: unknown) => [
                typeof val === "number" ? val.toFixed(1) + "%" : String(val ?? ""), title
              ]}
            />
            <Area type="monotone" dataKey="value" stroke={color}
              fill={`url(#g-${title.replace(/\s/g, "")})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────
export function TelemetryPage() {
  const [cpuData, setCpuData] = useState<PromValue[]>([]);
  const [memData, setMemData] = useState<PromValue[]>([]);
  const [diskData, setDiskData] = useState<PromValue[]>([]);
  const [cpuNow, setCpuNow] = useState<number | null>(null);
  const [memNow, setMemNow] = useState<number | null>(null);
  const [diskNow, setDiskNow] = useState<number | null>(null);
  const [zeavisMetrics, setZeavisMetrics] = useState<{ name: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intRef = useRef<number>(0);

  const fetchAll = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);
      setError(null);

      // Run all queries in parallel
      const [cpu, mem, disk, cpuNowVal, memNowVal, diskNowVal, upData] = await Promise.all([
        queryRange(`100 - (avg(rate(node_cpu_seconds_total{mode="idle",instance="${INSTANCE}"}[5m])) * 100)`, 60),
        queryRange(`(1 - node_memory_MemAvailable_bytes{instance="${INSTANCE}"} / node_memory_MemTotal_bytes{instance="${INSTANCE}"}) * 100`, 60),
        queryRange(`(1 - node_filesystem_avail_bytes{instance="${INSTANCE}",mountpoint="/"} / node_filesystem_size_bytes{instance="${INSTANCE}",mountpoint="/"}) * 100`, 60),
        queryInstant(`100 - (avg(rate(node_cpu_seconds_total{mode="idle",instance="${INSTANCE}"}[5m])) * 100)`),
        queryInstant(`(1 - node_memory_MemAvailable_bytes{instance="${INSTANCE}"} / node_memory_MemTotal_bytes{instance="${INSTANCE}"}) * 100`),
        queryInstant(`(1 - node_filesystem_avail_bytes{instance="${INSTANCE}",mountpoint="/"} / node_filesystem_size_bytes{instance="${INSTANCE}",mountpoint="/"}) * 100`),
        // ZeaVis app metrics
        (async () => {
          const names = [
            "zeavis_api_http_requests_total",
            "zeavis_api_http_requests_active",
            "zeavis_ml_zeavis_ml_model_load_status",
          ];
          const results: { name: string; value: string }[] = [];
          for (const n of names) {
            const val = await queryInstant(n);
            if (val !== null) results.push({ name: n, value: val.toFixed(2) });
          }
          return results;
        })(),
      ]);

      setCpuData(cpu);
      setMemData(mem);
      setDiskData(disk);
      setCpuNow(cpuNowVal);
      setMemNow(memNowVal);
      setDiskNow(diskNowVal);
      setZeavisMetrics(upData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    intRef.current = window.setInterval(() => fetchAll(true), 30_000);
    return () => clearInterval(intRef.current);
  }, [fetchAll]);

  if (loading && cpuData.length === 0 && memData.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#48A111] border-r-transparent" />
            <p className="text-sm text-muted-foreground">Loading telemetry data...</p>
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
            Metrics from Prometheus — orange VPS ({INSTANCE})
            {error && <span className="text-amber-600 ml-2">({error})</span>}
          </p>
        </div>
        <button onClick={() => fetchAll(true)} disabled={refreshing}
          className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Cpu} label="CPU Usage" value={cpuNow !== null ? fmtPct(cpuNow) : "N/A"} color="text-blue-600" />
        <StatCard icon={Database} label="Memory Usage" value={memNow !== null ? fmtPct(memNow) : "N/A"} color="text-violet-600" />
        <StatCard icon={HardDrive} label="Disk Usage" value={diskNow !== null ? fmtPct(diskNow) : "N/A"} color="text-amber-600" />
        <StatCard icon={Activity} label="Status" value={error ? "Degraded" : "Healthy"} sub="via Prometheus API" color={error ? "text-red-600" : "text-green-600"} />
      </div>

      {/* System Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ChartCard title="CPU Usage (last hour)" data={cpuData} color="#2563eb" />
        <ChartCard title="Memory Usage (last hour)" data={memData} color="#8b5cf6" />
        <ChartCard title="Disk Usage (last hour)" data={diskData} color="#f59e0b" />
      </div>

      {/* ZeaVis Application Metrics */}
      {zeavisMetrics.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-[#214B11] flex items-center gap-2">
            <Server className="h-5 w-5 text-[#48A111]" /> ZeaVis Application Metrics
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {zeavisMetrics.map((m) => (
              <Card key={m.name} className="border-slate-200 shadow-sm">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {shortMetric(m.name)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="text-2xl font-bold text-[#306D29]">{m.value}</div>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{m.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Raw metric names in Prometheus */}
      {zeavisMetrics.length === 0 && (
        <Card className="border-slate-200 shadow-sm bg-slate-50">
          <CardContent className="px-4 py-6 text-center text-sm text-slate-400">
            No application metrics available. Prometheus results shown above.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

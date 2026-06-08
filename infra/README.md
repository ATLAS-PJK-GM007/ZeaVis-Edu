# Infra — ZeaVis Edu Multi-VPS Deployment

## Arsitektur

```
┌─────────────────────────────────────────────┐     ┌──────────────────────────────────────────────┐
│              App VPS (imrnes)               │     │         Telemetry VPS (orange)                │
│             100.108.1.124                   │     │         100.96.248.86                        │
│             Arch Linux                      │     │         Ubuntu                               │
│                                             │     │                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │     │  ┌──────────┐  ┌──────────────┐             │
│  │  Web     │  │  API     │  │  ML      │  │     │  │Prometheus│  │Metric        │             │
│  │:80       │  │:3000     │  │:8000     │  │     │  │:9090     │  │Ingester      │             │
│  │/metrics  │  │/metrics  │  │/metrics  │  │     │  │          │  │:9091         │             │
│  └──────────┘  └──────────┘  └──────────┘  │     │  └────┬─────┘  └──────┬───────┘             │
│  ┌──────────────────────────────────────┐  │     │       │               │                     │
│  │        Node Exporter                 │  │     │       │  remote_write │                     │
│  │        :9100                         │  │     │       ▼               ▼                     │
│  └──────────────────────────────────────┘  │     │  ┌──────────────────────────────────────┐   │
│                                             │     │  │          Vector                      │   │
│     ┌──────────────┐                        │     │  │          :9001                       │   │
│     │   Traefik    │                        │     │  └────────────────┬─────────────────────┘   │
│     │ (Coolify)    │                        │     │                   │                         │
│     └──────────────┘                        │     │                   ▼                         │
│                                             │     │  ┌──────────────────────────────────────┐   │
│  ZeaVis Edu Apps via                        │     │  │           ClickHouse                  │   │
│  zeavisedu.asepharyana.my.id                │     │  │           :8123                       │   │
│                                             │     │  └───────────────┬──────────────────────┘   │
│                                             │     │                   │                         │
│                                             │     │                   ▼                         │
│  ==== Tailscale (WireGuard) ====            │     │  ┌──────────────────────────────────────┐   │
│                                             │     │  │         Query Proxy                 │   │
│                                             │     │  │         :9092                       │   │
│                                             │     │  └───────────────┬──────────────────────┘   │
│                                             │     │                   │                         │
│                                             │     │                   ▼                         │
│                                             │     │  ┌──────────────────────────────────────┐   │
│                                             │     │  │      Telemetry UI (nginx)            │   │
│                                             │     │  │      :8181                          │   │
│                                             │     │  └──────────────────────────────────────┘   │
│                                             │     │                                              │
│                                             │     │  Coolify + Traefik handles:                 │
│                                             │     │  telemetry.zeavisedu.asepharyana.my.id       │
└─────────────────────────────────────────────┘     └──────────────────────────────────────────────┘
```

## Prerequisites

### GitHub Secrets (untuk CI/CD)

**App VPS deploy (`.github/workflows/deploy.yml`):**
| Secret | Value |
|--------|-------|
| `VPS_HOST` | `100.108.1.124` (imrnes) |
| `VPS_USER` | `mytheclipse` |
| `VPS_SSH_KEY` | Private SSH key for imrnes |
| `VPS_PORT` | `22` |
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Random session secret |

**Telemetry VPS deploy (`.github/workflows/telemetry-ci-cd.yml`):**
| Secret | Value |
|--------|-------|
| `TELEMETRY_VPS_HOST` | `100.96.248.86` (orange) |
| `TELEMETRY_VPS_USER` | SSH username for orange |
| `TELEMETRY_VPS_SSH_KEY` | Private SSH key for orange |
| `TELEMETRY_VPS_PORT` | `22` |
| `GHCR_PAT` | GitHub PAT with `write:packages` + `read:packages` |

### VPS Setup

#### 1. App VPS (imrnes — 100.108.1.124)

```bash
# Create Docker network
docker network create app-shared-net
docker network create telemetry-net

# ZeaVis Edu apps deploy automatically via GitHub Actions
```

#### 2. Telemetry VPS (orange — 100.96.248.86)

Deploy via GitHub Actions workflow `.github/workflows/telemetry-ci-cd.yml`.

Atau manual:
```bash
ssh mytheclipse@100.96.248.86
mkdir -p /opt/telemetry
# ... sync files from telemetry/ directory ...
cd /opt/telemetry
docker compose up -d
bash clickhouse/init.sh
```

## Port yang dibuka

### App VPS (imrnes)
| Port | Service | Akses |
|------|---------|-------|
| 80/443 | Web (via Traefik/Coolify) | Public |
| 3000 | API metrics | Tailscale-only |
| 8000 | ML service metrics | Tailscale-only |
| 9100 | Node Exporter | Tailscale-only |

### Telemetry VPS (orange)
| Port | Service | Akses |
|------|---------|-------|
| 80/443 | Telemetry UI (via Coolify Traefik) | Public |
| 8181 | Telemetry UI (direct) | Tailscale-only |
| 9090 | Prometheus | Tailscale-only |
| 9091 | Metric Ingester | Tailscale-only |
| 9001 | Vector HTTP source | Tailscale-only |
| 8123 | ClickHouse HTTP | Tailscale-only |
| 9000 | ClickHouse Native | Tailscale-only |

## Metrics Flow

1. **App services** expose `/metrics` pada port masing-masing
2. **Prometheus** di orange VPS scrape via Tailscale IP (`100.108.1.124:PORT`)
3. **Prometheus** forward ke **Metric Ingester** via `remote_write`
4. **Metric Ingester** enrich → filter → forward ke **Vector**
5. **Vector** buffer → write ke **ClickHouse**
6. **Telemetry UI** query via **Query Proxy** → **ClickHouse**

## Useful Commands

```bash
# Telemetry stack status
make telemetry-status

# View telemetry logs
make telemetry-logs s=prometheus

# Send test metric
make telemetry-test-metric

# Restart a service
make telemetry-restart s=vector
```

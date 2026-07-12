# Akjo analytics collector

This service accepts small, anonymous analytics events from `akjo.tech`. It is intentionally source-modular, but the initial deployment accepts **only** `instagram` events.

## Data policy enforced in code

- No social handles, avatar lookups, IP addresses, referrer URLs, device fingerprints, user-agent strings, or precise location are persisted.
- Only `source`, event name, ephemeral session ID, timestamps, page path, and optional UTM campaign labels are stored.
- Browser origins are allowlisted and requests are rate-limited in memory without persisting IP addresses.
- Events are written as daily JSONL files and removed after the configured retention period.

## Local verification

```sh
cd analytics-server
npm test
HOST=127.0.0.1 PORT=8787 DATA_DIR=./data npm start
curl http://127.0.0.1:8787/healthz
```

## Oracle deployment

The service binds only to `127.0.0.1:8787`. Caddy exposes it at `https://monitor.akjo.tech/analytics/v1/events`; the website reaches that through Netlify's same-origin `/analytics/*` proxy.

```sh
cd analytics-server
cp .env.example .env
./deploy/deploy-oracle.sh
```

Install the route in `deploy/Caddyfile.snippet` into `/etc/caddy/Caddyfile`, then validate and reload Caddy:

```sh
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

## Dashboard

Set a strong `DASHBOARD_PASSWORD` in the Oracle VM's `.env`, redeploy, then open `https://akjo.tech/analytics/admin`. The browser uses HTTP Basic authentication with the configured `DASHBOARD_USERNAME` (default `admin`). The dashboard exposes only the same anonymous fields stored by the collector.

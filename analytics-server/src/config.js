const DEFAULT_ORIGINS = ['https://akjo.tech', 'https://www.akjo.tech'];

function readPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(env = process.env) {
  const origins = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    host: env.HOST || '127.0.0.1',
    port: readPositiveInt(env.PORT, 8787),
    dataDir: env.DATA_DIR || '/app/data',
    allowedOrigins: new Set(origins),
    retentionDays: readPositiveInt(env.RETENTION_DAYS, 30),
    rateLimitMax: readPositiveInt(env.RATE_LIMIT_MAX, 120),
    rateLimitWindowMs: readPositiveInt(env.RATE_LIMIT_WINDOW_MS, 60_000),
    maxRequestBytes: readPositiveInt(env.MAX_REQUEST_BYTES, 8_192),
    dashboardUsername: env.DASHBOARD_USERNAME || 'admin',
    dashboardPassword: env.DASHBOARD_PASSWORD || ''
  };
}

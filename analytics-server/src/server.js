import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import http from 'node:http';
import { loadConfig } from './config.js';
import { renderDashboardHtml } from './dashboard.js';
import { instagramModule } from './modules/instagram.js';
import { JsonlEventStore } from './storage.js';

class MemoryRateLimiter {
  constructor({ maxRequests, windowMs }) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.salt = randomBytes(32).toString('hex');
    this.buckets = new Map();
  }

  keyFor(address) {
    // The address is used only in memory for abuse protection and is never persisted or logged.
    return createHash('sha256').update(`${this.salt}:${address || 'unknown'}`).digest('hex');
  }

  allow(address, now = Date.now()) {
    const key = this.keyFor(address);
    const bucket = this.buckets.get(key);
    if (!bucket || now - bucket.startedAt >= this.windowMs) {
      this.buckets.set(key, { startedAt: now, count: 1 });
      return true;
    }
    if (bucket.count >= this.maxRequests) return false;
    bucket.count += 1;
    return true;
  }
}

function sendJson(response, statusCode, body, origin, config) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  };
  if (origin && config.allowedOrigins.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers.Vary = 'Origin';
  }
  response.writeHead(statusCode, headers);
  response.end(JSON.stringify(body));
}

function isAllowedOrigin(origin, config) {
  return !origin || config.allowedOrigins.has(origin);
}

function matchesSecret(left, right) {
  const leftBuffer = Buffer.from(left || '', 'utf8');
  const rightBuffer = Buffer.from(right || '', 'utf8');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function hasDashboardAccess(request, config) {
  if (!config.dashboardPassword) return false;
  const authorization = request.headers.authorization || '';
  if (!authorization.startsWith('Basic ')) return false;
  try {
    const [username, password] = Buffer.from(authorization.slice(6), 'base64').toString('utf8').split(':');
    return matchesSecret(username, config.dashboardUsername) && matchesSecret(password, config.dashboardPassword);
  } catch {
    return false;
  }
}

function requestDashboardAccess(response) {
  response.writeHead(401, {
    'WWW-Authenticate': 'Basic realm="akjo analytics", charset="UTF-8"',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  response.end('Authentication required');
}

function dashboardSummary(events) {
  const pages = new Map();
  const sessions = new Set();
  for (const event of events) {
    sessions.add(event.sessionId);
    pages.set(event.page.path, (pages.get(event.page.path) || 0) + 1);
  }
  const topPage = [...pages.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || null;
  return { events: events.length, sessions: sessions.size, topPage };
}

function readJsonBody(request, maxBytes) {
  return new Promise((resolve, reject) => {
    const contentLength = Number.parseInt(request.headers['content-length'] || '0', 10);
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      reject(new Error('payload_too_large'));
      request.resume();
      return;
    }

    let bytes = 0;
    const chunks = [];
    request.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        reject(new Error('payload_too_large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new Error('invalid_json'));
      }
    });
    request.on('error', reject);
  });
}

export function createServer({ config = loadConfig(), store = new JsonlEventStore(config.dataDir, config.retentionDays), logger = console } = {}) {
  const modules = new Map([[instagramModule.source, instagramModule]]);
  const limiter = new MemoryRateLimiter({
    maxRequests: config.rateLimitMax,
    windowMs: config.rateLimitWindowMs
  });

  const server = http.createServer(async (request, response) => {
    const origin = request.headers.origin;
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const route = url.pathname;

    if (!isAllowedOrigin(origin, config)) {
      sendJson(response, 403, { error: 'origin_not_allowed' }, origin, config);
      return;
    }

    if (request.method === 'OPTIONS') {
      const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin'
      };
      if (origin && config.allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
      response.writeHead(204, headers);
      response.end();
      return;
    }

    if (request.method === 'GET' && route === '/healthz') {
      sendJson(response, 200, { status: 'ok', service: 'akjo-analytics', sources: [...modules.keys()] }, origin, config);
      return;
    }

    if (request.method === 'GET' && route === '/v1/capabilities') {
      sendJson(response, 200, { schemaVersion: 1, sources: [...modules.keys()] }, origin, config);
      return;
    }

    if (request.method === 'GET' && route === '/admin') {
      if (!hasDashboardAccess(request, config)) {
        requestDashboardAccess(response);
        return;
      }
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff'
      });
      response.end(renderDashboardHtml());
      return;
    }

    if (request.method === 'GET' && route === '/admin/api/events') {
      if (!hasDashboardAccess(request, config)) {
        requestDashboardAccess(response);
        return;
      }
      const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '250', 10);
      const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 500) : 250;
      const events = await store.recent('instagram', limit);
      sendJson(response, 200, { generatedAt: new Date().toISOString(), summary: dashboardSummary(events), events }, origin, config);
      return;
    }

    if (request.method !== 'POST' || route !== '/v1/events') {
      sendJson(response, 404, { error: 'not_found' }, origin, config);
      return;
    }

    if (!limiter.allow(request.socket.remoteAddress)) {
      sendJson(response, 429, { error: 'rate_limited' }, origin, config);
      return;
    }

    try {
      const payload = await readJsonBody(request, config.maxRequestBytes);
      const module = modules.get(payload?.source);
      if (!module) {
        sendJson(response, 422, { error: 'unsupported_source' }, origin, config);
        return;
      }

      const validation = module.validate(payload, new Date().toISOString());
      if (!validation.ok) {
        sendJson(response, 422, { error: validation.error }, origin, config);
        return;
      }

      await store.append(validation.event);
      logger.info?.(`analytics event accepted source=${validation.event.source} event=${validation.event.event}`);
      sendJson(response, 202, { accepted: true }, origin, config);
    } catch (error) {
      if (error.message === 'payload_too_large' || error.message === 'invalid_json') {
        sendJson(response, 400, { error: error.message }, origin, config);
        return;
      }
      logger.error?.('analytics event storage failed', error);
      sendJson(response, 503, { error: 'temporarily_unavailable' }, origin, config);
    }
  });

  return { server, store };
}

async function main() {
  const config = loadConfig();
  const store = new JsonlEventStore(config.dataDir, config.retentionDays);
  await store.init();
  const { server } = createServer({ config, store });
  server.listen(config.port, config.host, () => {
    console.info(`akjo analytics listening on ${config.host}:${config.port}`);
  });

  const cleanupTimer = setInterval(() => store.cleanup().catch((error) => console.error('analytics cleanup failed', error)), 24 * 60 * 60 * 1000);
  cleanupTimer.unref();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('analytics startup failed', error);
    process.exitCode = 1;
  });
}

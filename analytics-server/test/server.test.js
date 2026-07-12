import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createServer } from '../src/server.js';
import { JsonlEventStore } from '../src/storage.js';

async function startTestServer() {
  const dataDir = await mkdtemp(path.join(os.tmpdir(), 'akjo-analytics-'));
  const config = {
    host: '127.0.0.1',
    port: 0,
    dataDir,
    allowedOrigins: new Set(['https://akjo.tech']),
    retentionDays: 30,
    rateLimitMax: 10,
    rateLimitWindowMs: 60_000,
    maxRequestBytes: 8_192,
    dashboardUsername: 'admin',
    dashboardPassword: 'test-password'
  };
  const store = new JsonlEventStore(dataDir, 30);
  await store.init();
  const { server } = createServer({ config, store, logger: { info() {}, error() {} } });
  await new Promise((resolve) => server.listen(0, config.host, resolve));
  const { port } = server.address();
  return { server, dataDir, url: `http://127.0.0.1:${port}` };
}

test('accepts an anonymous Instagram page view and stores only the allowlisted schema', async (t) => {
  const instance = await startTestServer();
  t.after(() => instance.server.close());

  const response = await fetch(`${instance.url}/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://akjo.tech' },
    body: JSON.stringify({
      schemaVersion: 1,
      source: 'instagram',
      event: 'page_view',
      sessionId: '34cd5d39-8c4e-492b-911b-762ef6ad7a9d',
      occurredAt: '2026-07-12T10:00:00.000Z',
      page: { path: '/projects/' },
      campaign: { source: 'instagram', campaign: 'summer' },
      socialHandle: 'must-not-be-stored',
      device: { model: 'must-not-be-stored' }
    })
  });

  assert.equal(response.status, 202);
  const eventFile = path.join(instance.dataDir, 'instagram', `${new Date().toISOString().slice(0, 10)}.ndjson`);
  const saved = JSON.parse((await readFile(eventFile, 'utf8')).trim());
  assert.deepEqual(Object.keys(saved).sort(), ['campaign', 'event', 'occurredAt', 'page', 'receivedAt', 'schemaVersion', 'sessionId', 'source']);
  assert.equal(saved.socialHandle, undefined);
  assert.equal(saved.device, undefined);
});

test('rejects non-Instagram sources and browser origins outside the allowlist', async (t) => {
  const instance = await startTestServer();
  t.after(() => instance.server.close());
  const event = {
    schemaVersion: 1,
    source: 'facebook',
    event: 'page_view',
    sessionId: '34cd5d39-8c4e-492b-911b-762ef6ad7a9d',
    occurredAt: '2026-07-12T10:00:00.000Z',
    page: { path: '/' }
  };

  const unsupported = await fetch(`${instance.url}/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://akjo.tech' },
    body: JSON.stringify(event)
  });
  assert.equal(unsupported.status, 422);

  const blockedOrigin = await fetch(`${instance.url}/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://example.com' },
    body: JSON.stringify({ ...event, source: 'instagram' })
  });
  assert.equal(blockedOrigin.status, 403);
});

test('protects the dashboard and exposes only sanitized anonymous events after authentication', async (t) => {
  const instance = await startTestServer();
  t.after(() => instance.server.close());
  const auth = `Basic ${Buffer.from('admin:test-password').toString('base64')}`;

  const denied = await fetch(`${instance.url}/admin`);
  assert.equal(denied.status, 401);
  assert.match(denied.headers.get('www-authenticate'), /Basic/);

  const event = {
    schemaVersion: 1,
    source: 'instagram',
    event: 'page_view',
    sessionId: '34cd5d39-8c4e-492b-911b-762ef6ad7a9d',
    occurredAt: '2026-07-12T10:00:00.000Z',
    page: { path: '/about/' },
    socialHandle: 'must-not-be-stored'
  };
  await fetch(`${instance.url}/v1/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://akjo.tech' },
    body: JSON.stringify(event)
  });

  const dashboard = await fetch(`${instance.url}/admin`, { headers: { Authorization: auth } });
  assert.equal(dashboard.status, 200);
  assert.match(await dashboard.text(), /Instagram usernames are intentionally not collected/);

  const events = await fetch(`${instance.url}/admin/api/events`, { headers: { Authorization: auth } });
  const body = await events.json();
  assert.equal(events.status, 200);
  assert.equal(body.summary.events, 1);
  assert.equal(body.events[0].socialHandle, undefined);
});

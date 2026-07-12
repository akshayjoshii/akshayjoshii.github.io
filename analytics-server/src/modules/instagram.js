const EVENT_NAME = /^[a-z][a-z0-9_]{0,63}$/;
const SESSION_ID = /^[a-f0-9-]{16,64}$/i;
const UTM_FIELDS = ['source', 'medium', 'campaign', 'content'];

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().slice(0, maxLength);
  return cleaned || null;
}

function cleanPagePath(value) {
  const path = cleanText(value, 180);
  if (!path || !path.startsWith('/') || path.includes('?') || path.includes('#')) return null;
  return path;
}

function cleanCampaign(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const campaign = {};
  for (const field of UTM_FIELDS) {
    const cleaned = cleanText(value[field], 80);
    if (cleaned) campaign[field] = cleaned;
  }
  return Object.keys(campaign).length ? campaign : undefined;
}

export function validateInstagramEvent(input, receivedAt) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'invalid_payload' };
  }
  if (input.schemaVersion !== 1 || input.source !== 'instagram') {
    return { ok: false, error: 'unsupported_source' };
  }
  if (!EVENT_NAME.test(input.event || '')) {
    return { ok: false, error: 'invalid_event_name' };
  }
  if (!SESSION_ID.test(input.sessionId || '')) {
    return { ok: false, error: 'invalid_session_id' };
  }

  const occurredAt = new Date(input.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) {
    return { ok: false, error: 'invalid_occurred_at' };
  }

  const pagePath = cleanPagePath(input.page?.path);
  if (!pagePath) {
    return { ok: false, error: 'invalid_page_path' };
  }

  const campaign = cleanCampaign(input.campaign);

  // The stored event intentionally excludes handles, IPs, referrers, UA strings,
  // screen/device data, geo data, and arbitrary client-provided properties.
  return {
    ok: true,
    event: {
      schemaVersion: 1,
      source: 'instagram',
      event: input.event,
      sessionId: input.sessionId,
      occurredAt: occurredAt.toISOString(),
      receivedAt,
      page: { path: pagePath },
      ...(campaign ? { campaign } : {})
    }
  };
}

export const instagramModule = {
  source: 'instagram',
  validate: validateInstagramEvent
};

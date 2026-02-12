exports.handler = async (event, context) => {
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  try {
    // ── Parse client payload ────────────────────────────────
    let clientData = {};
    if (event.body) {
      try {
        clientData = JSON.parse(event.body);
      } catch (e) {
        // Beacon sends may arrive as text
        try { clientData = JSON.parse(event.body.toString()); } catch (e2) { /* ignore */ }
      }
    }

    // ── IP extraction (keep existing priority order) ────────
    let visitorIP = 'unknown';
    let ipSource = 'unknown';

    if (event.headers['cf-connecting-ip']) {
      visitorIP = event.headers['cf-connecting-ip'];
      ipSource = 'cf-connecting-ip';
    } else if (event.headers['x-nf-client-connection-ip']) {
      visitorIP = event.headers['x-nf-client-connection-ip'];
      ipSource = 'x-nf-client-connection-ip';
    } else if (event.headers['x-forwarded-for']) {
      visitorIP = event.headers['x-forwarded-for'].split(',')[0].trim();
      ipSource = 'x-forwarded-for';
    } else if (event.headers['x-real-ip']) {
      visitorIP = event.headers['x-real-ip'];
      ipSource = 'x-real-ip';
    }

    // ── Netlify geo headers ─────────────────────────────────
    let netlifyGeo = {};
    if (event.headers['x-nf-geo']) {
      try {
        netlifyGeo = JSON.parse(decodeURIComponent(event.headers['x-nf-geo']));
      } catch (e) { /* ignore */ }
    }

    const serverEnriched = {
      ip: visitorIP,
      ipSource: ipSource,
      country: netlifyGeo.country || event.headers['cf-ipcountry'] || event.headers['x-country'] || 'unknown',
      region: netlifyGeo.subdivision || event.headers['x-country-region'] || 'unknown',
      city: netlifyGeo.city || event.headers['x-city'] || 'unknown',
      latitude: netlifyGeo.latitude || null,
      longitude: netlifyGeo.longitude || null,
      serverTimezone: netlifyGeo.timezone || event.headers['x-timezone'] || 'unknown',
      acceptLanguage: event.headers['accept-language'] || 'unknown',
      serverReferer: event.headers['referer'] || event.headers['referrer'] || 'direct',
      host: event.headers['host'] || 'unknown',
      protocol: event.headers['x-forwarded-proto'] || 'unknown',
      serverTimestamp: new Date().toISOString()
    };

    // ── Merge client + server data ──────────────────────────
    const fullPayload = {
      ...clientData,
      serverEnriched: serverEnriched
    };

    // ── Forward to backend ──────────────────────────────────
    await fetch('https://inference.blinkin.io/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload)
    });

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        dataPoints: Object.keys(fullPayload).length
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};

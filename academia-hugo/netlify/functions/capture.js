exports.handler = async (event, context) => {
  const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: CORS_HEADERS, body: '' };
  }

  // ── Avatar proxy: GET ?avatar=username&platform=instagram ──
  if (event.httpMethod === 'GET' && event.queryStringParameters && event.queryStringParameters.avatar) {
    return handleAvatarProxy(event.queryStringParameters, CORS_HEADERS);
  }

  try {
    // ── Parse client payload (handle base64 + plain JSON) ───
    let clientData = {};
    if (event.body) {
      let rawBody = event.body;
      // Netlify base64-encodes bodies for non-text content types
      if (event.isBase64Encoded) {
        rawBody = Buffer.from(event.body, 'base64').toString('utf-8');
      }
      try {
        clientData = JSON.parse(rawBody);
      } catch (e) { /* ignore unparseable bodies */ }
    }

    // ── IP extraction ───────────────────────────────────────
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

    // ── Netlify geo: use context.geo first, then x-nf-geo header ─
    let geo = {};

    // Primary: Netlify function context.geo (most reliable)
    if (context && context.geo) {
      geo = {
        city: context.geo.city || null,
        country: context.geo.country && context.geo.country.code ? context.geo.country.code : context.geo.country || null,
        region: context.geo.subdivision && context.geo.subdivision.code ? context.geo.subdivision.code : context.geo.subdivision || null,
        latitude: context.geo.latitude || null,
        longitude: context.geo.longitude || null,
        timezone: context.geo.timezone || null
      };
    }

    // Fallback: x-nf-geo header
    if (!geo.city && event.headers['x-nf-geo']) {
      try {
        const nfGeo = JSON.parse(decodeURIComponent(event.headers['x-nf-geo']));
        geo = {
          city: nfGeo.city || null,
          country: nfGeo.country && nfGeo.country.code ? nfGeo.country.code : nfGeo.country || null,
          region: nfGeo.subdivision && nfGeo.subdivision.code ? nfGeo.subdivision.code : nfGeo.subdivision || null,
          latitude: nfGeo.latitude || null,
          longitude: nfGeo.longitude || null,
          timezone: nfGeo.timezone || null
        };
      } catch (e) { /* ignore */ }
    }

    // Final fallback: individual headers
    const serverEnriched = {
      ip: visitorIP,
      ipSource: ipSource,
      country: geo.country || event.headers['cf-ipcountry'] || event.headers['x-country'] || 'unknown',
      region: geo.region || event.headers['x-country-region'] || 'unknown',
      city: geo.city || event.headers['x-city'] || 'unknown',
      latitude: geo.latitude || null,
      longitude: geo.longitude || null,
      serverTimezone: geo.timezone || event.headers['x-timezone'] || 'unknown',
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

// ── Avatar proxy: fetch profile pic from social platform server-side ──
async function handleAvatarProxy(params, CORS_HEADERS) {
  const username = (params.avatar || '').replace(/[^a-zA-Z0-9._-]/g, '');
  const platform = params.platform || 'instagram';

  if (!username || username.length > 30) {
    return { statusCode: 400, headers: CORS_HEADERS, body: '{"error":"invalid username"}' };
  }

  const PROFILE_URLS = {
    instagram: `https://www.instagram.com/${username}/`,
    twitter: `https://x.com/${username}`,
    tiktok: `https://www.tiktok.com/@${username}`
  };

  const profileUrl = PROFILE_URLS[platform];
  if (!profileUrl) {
    return { statusCode: 404, headers: CORS_HEADERS, body: '{"error":"unsupported platform"}' };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const resp = await fetch(profileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeout);

    if (!resp.ok) {
      return { statusCode: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: '{"error":"profile not found"}' };
    }

    const html = await resp.text();

    // Extract og:image from HTML (handles both attribute orderings)
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

    if (!ogMatch || !ogMatch[1]) {
      return { statusCode: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, body: '{"error":"no image found"}' };
    }

    return {
      statusCode: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
      body: JSON.stringify({ avatarUrl: ogMatch[1] })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.name === 'AbortError' ? 'timeout' : err.message })
    };
  }
}

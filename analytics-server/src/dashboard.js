export function renderDashboardHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,nofollow,noarchive">
  <title>Instagram Visits | akjo.tech</title>
  <style>
    :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #111418; color: #f3f6f8; }
    body { max-width: 1120px; margin: 0 auto; padding: 2rem 1rem 3rem; }
    h1 { margin: 0; font-size: clamp(1.75rem, 5vw, 2.5rem); letter-spacing: -0.04em; }
    .lede { color: #aeb8c2; max-width: 58ch; line-height: 1.55; }
    .notice { padding: 0.85rem 1rem; border: 1px solid #2f3a45; border-radius: 12px; background: #18212a; color: #c3d5e8; }
    .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; margin: 1.25rem 0; }
    .card { padding: 1rem; border-radius: 14px; background: #171d24; border: 1px solid #27323c; }
    .card span { display: block; color: #9ba9b5; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; }
    .card strong { display: block; margin-top: 0.25rem; font-size: 1.8rem; }
    .table-wrap { overflow-x: auto; border: 1px solid #27323c; border-radius: 14px; }
    table { width: 100%; border-collapse: collapse; min-width: 680px; }
    th, td { padding: 0.8rem 1rem; text-align: left; border-bottom: 1px solid #27323c; }
    th { color: #9ba9b5; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; }
    tr:last-child td { border-bottom: 0; }
    code { color: #a8d7ff; }
    #state { color: #9ba9b5; }
    @media (max-width: 640px) { body { padding-top: 1.25rem; } .cards { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <h1>Instagram visits</h1>
  <p class="lede">A compact view of the anonymous Instagram events collected from akjo.tech.</p>
  <p class="notice">Instagram usernames are intentionally not collected by this service. Each row represents an anonymous browser session.</p>
  <section class="cards" aria-label="Summary">
    <div class="card"><span>Events</span><strong id="events-count">-</strong></div>
    <div class="card"><span>Sessions</span><strong id="sessions-count">-</strong></div>
    <div class="card"><span>Top page</span><strong id="top-page">-</strong></div>
  </section>
  <p id="state">Loading recent events…</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Received</th><th>Event</th><th>Page</th><th>Campaign</th><th>Anonymous session</th></tr></thead>
      <tbody id="events"></tbody>
    </table>
  </div>
  <script>
    const apiUrl = window.location.pathname.replace(/\/$/, '') + '/api/events?limit=250';
    const safe = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
    const displayTime = (value) => value ? new Date(value).toLocaleString() : '—';
    fetch(apiUrl, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load events')))
      .then((data) => {
        document.querySelector('#events-count').textContent = data.summary.events;
        document.querySelector('#sessions-count').textContent = data.summary.sessions;
        document.querySelector('#top-page').textContent = data.summary.topPage || '—';
        document.querySelector('#state').textContent = data.events.length ? 'Latest events first.' : 'No Instagram events have been received yet.';
        document.querySelector('#events').innerHTML = data.events.map((event) => '<tr><td>' + safe(displayTime(event.receivedAt)) + '</td><td>' + safe(event.event) + '</td><td><code>' + safe(event.page.path) + '</code></td><td>' + safe(event.campaign?.campaign || event.campaign?.source || '—') + '</td><td><code>' + safe(event.sessionId.slice(0, 8)) + '…</code></td></tr>').join('');
      })
      .catch((error) => { document.querySelector('#state').textContent = error.message; });
  </script>
</body>
</html>`;
}
